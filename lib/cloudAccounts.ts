export const CLOUD_API = 'https://neon-arcade-api.vincentcarlin-neon.workers.dev';
export type OnlineSession = {
    user: { id: string; username: string; email: string };
    profile: { data: Record<string, any>; version: number; updatedAt: number };
};
export class CloudError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
const TOKEN_KEY = 'neon_cloud_session';
const RECOVERY_KEY = 'neon_pending_recovery';
const PENDING_KEY = 'neon_pending_cloud_save';
const pendingSave = () => { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch { return null; } };
const listeners = new Set<(session: OnlineSession | null) => void>();
let version = 0;
let generation = 0;
let conflict = false;
let saveQueue: Promise<unknown> = Promise.resolve();
let current: OnlineSession | null = null;
const getToken = () => typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
async function request<T>(path: string, method = 'GET', data?: unknown, sessionToken = getToken()): Promise<T> {
    const response = await fetch(CLOUD_API + path, {
        method, credentials: 'omit', cache: 'no-store',
        headers: { ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}) },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok) throw new CloudError(result.error || 'La demande a échoué.', response.status);
    return result as T;
}
function install(result: OnlineSession & { token: string }) {
    generation++;
    sessionStorage.setItem(TOKEN_KEY, result.token);
    version = result.profile.version;
    current = { user: result.user, profile: result.profile };
    conflict = false;
    const pending=pendingSave();
    if (pending?.userId===result.user.id) { conflict=pending.version!==version;current.profile.data=pending.data; }
}
function emit(session: OnlineSession | null) { for (const listener of listeners) listener(session); }
export const cloudAccounts = {
    subscribe(listener: (session: OnlineSession | null) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    pendingRecovery: () => typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem(RECOVERY_KEY) || '',
    hasConflict: () => conflict,
    hasPending: () => !!pendingSave(),
    stage(data: Record<string, any>) { if (current && getToken()) { const old=pendingSave();const baseVersion=conflict&&old?.userId===current.user.id?old.version:version;sessionStorage.setItem(PENDING_KEY,JSON.stringify({userId:current.user.id,version:baseVersion,data})); } },
    async register(email: string, username: string, password: string, data: unknown) {
        const result = await request<OnlineSession & { token: string; recoveryCode: string }>('/auth/register', 'POST', { email, username, password, data, accepted: true }, null);
        install(result);
        sessionStorage.setItem(RECOVERY_KEY, result.recoveryCode);
        return result.recoveryCode;
    },
    finishRegistration() { sessionStorage.removeItem(RECOVERY_KEY); if (current) emit(current); },
    async login(email: string, password: string) {
        const result = await request<OnlineSession & { token: string }>('/auth/login', 'POST', { email, password }, null);
        install(result); sessionStorage.removeItem(RECOVERY_KEY); emit(current);
    },
    async load() {
        const raw = getToken();
        if (!raw) return null;
        const start = generation;
        try {
            const result = await request<OnlineSession>('/me', 'GET', undefined, raw);
            if (start !== generation || getToken() !== raw) return null;
            version = result.profile.version; conflict = false;
            const pending = pendingSave();
            if (pending && pending.userId === result.user.id) {
                conflict = pending.version !== version;
                result.profile.data = pending.data;
            }
            current = result;
            return result;
        } catch (error) {
            if (start === generation && error instanceof CloudError && error.status === 401) {
                sessionStorage.removeItem(TOKEN_KEY); current = null; version = 0; return null;
            }
            throw error;
        }
    },
    async reload() { const old=sessionStorage.getItem(PENDING_KEY);sessionStorage.removeItem(PENDING_KEY);try{const session = await this.load(); emit(session);}catch(error){if(old)sessionStorage.setItem(PENDING_KEY,old);throw error;} },
    save(data: Record<string, any>) {
        const raw = getToken(), start = generation;
        const snapshot = JSON.parse(JSON.stringify(data));
        const job = saveQueue.catch(() => {}).then(async () => {
            if (!raw || start !== generation || raw !== getToken()) throw new CloudError('Session modifiée. Reconnectez-vous.', 401);
            if (conflict) throw new CloudError('La sauvegarde a changé sur un autre appareil. Rechargez-la avant de continuer.', 409);
            const staged=JSON.stringify({userId:current?.user.id,version,data:snapshot});
            sessionStorage.setItem(PENDING_KEY,staged);
            try {
                const result = await request<{ version: number; updated_at: number }>('/profile', 'PUT', { data: snapshot, version }, raw);
                if (start !== generation) return;
                version = result.version;
                if(sessionStorage.getItem(PENDING_KEY)===staged)sessionStorage.removeItem(PENDING_KEY);
                if (current) current = { ...current, profile: { data: snapshot, version, updatedAt: result.updated_at } };
            } catch (error) {
                if (error instanceof CloudError && error.status === 409 && start === generation) conflict = true;
                throw error;
            }
        });
        saveQueue = job; return job;
    },
    async logout() {
        const raw = getToken();
        generation++;
        try { if (raw) await request('/auth/logout', 'POST', {}, raw); }
        finally { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(RECOVERY_KEY); current = null; version = 0; conflict = false; emit(null); }
    },
    async recover(email: string, password: string, code: string) {
        const result = await request<{ recoveryCode: string }>('/auth/recover', 'POST', { email, password, code }, null);
        return result.recoveryCode;
    },
    async changePassword(password: string, newPassword: string) {
        await request('/account/password', 'POST', { password, newPassword });
        await this.clearLocalSession();
    },
    async rotateRecovery(password: string) { return (await request<{ recoveryCode: string }>('/account/recovery-code', 'POST', { password })).recoveryCode; },
    async deleteAccount(password: string) { await request('/account/delete', 'POST', { password }); await this.clearLocalSession(); },
    async clearLocalSession() {
        generation++; sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(RECOVERY_KEY); sessionStorage.removeItem(PENDING_KEY); current = null; version = 0; conflict = false; emit(null);
    },
};
