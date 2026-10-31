import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
type UserRow = { id: string; email: string; username: string; password_hash: string; recovery_hash: string };
type ProfileRow = { data: string; version: number; updated_at: number };
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('hex');
const recoveryCode = () => randomBytes(24).toString('hex').match(/.{1,8}/g)!.join('-');
const recoveryHash = (code: string) => sha(code.replace(/[-\s]/g, '').toLowerCase());
const now = () => Math.floor(Date.now() / 1000);
// Standard scrypt parameters: N=2^15, r=8, p=3, with a unique 128-bit salt.
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 32, { N:32768, r:8, p:3, maxmem:67108864 }, (error, result) => {
        if (error) reject(error); else resolve(result);
    });
});
async function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    return `scrypt$32768$8$3$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
async function verifyPassword(password: string, stored: string) {
    const [scheme, n, r, p, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || n !== '32768' || r !== '8' || p !== '3' || !salt || !/^[a-f0-9]{64}$/.test(hash || '')) return false;
    return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
}
const dummyHash = `scrypt$32768$8$3$${'0'.repeat(32)}$${'0'.repeat(64)}`;
function password(value: unknown) {
    if (typeof value !== 'string' || value.length < 12 || value.length > 256) throw new ApiError(400, 'Mot de passe : entre 12 et 256 caractères.');
    return value;
}
function email(value: unknown) {
    if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new ApiError(400, 'Adresse e-mail invalide.');
    return value.trim().toLowerCase();
}
async function body(request: Request, max = 262144): Promise<Record<string, unknown>> {
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'JSON requis.');
    if (!request.body) throw new ApiError(400, 'Requête vide.');
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > max) { await reader.cancel(); throw new ApiError(413, 'Sauvegarde trop volumineuse.'); }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    const buffer = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    try {
        const parsed: unknown = JSON.parse(new TextDecoder().decode(buffer));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        return parsed as Record<string, unknown>;
    } catch { throw new ApiError(400, 'JSON invalide.'); }
}
const profileKeys = new Set(['avatarEquipment','coins','inventory','avatarId','ownedAvatars','frameId','ownedFrames','wallpaperId','ownedWallpapers','titleId','ownedTitles','malletId','ownedMallets','tankId','ownedTanks','tankAccessoryId','ownedTankAccessories','slitherSkinId','ownedSlitherSkins','slitherAccessoryId','ownedSlitherAccessories','accentColor','reducedMotion','voiceChatEnabled','language','highScores','daily','gameProgress']);
function profileData(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Profil invalide.');
    const data = value as Record<string, unknown>;
    if (Object.keys(data).some(key => !profileKeys.has(key))) throw new ApiError(400, 'Champ de profil non autorisé.');
    if (data.avatarEquipment !== undefined) {
        const slots: Record<string,string[]> = {head:['aa_cap','aa_headphones','aa_crown'],eyes:['aa_glasses'],neck:['aa_chain','aa_scarf']};
        const equipment=data.avatarEquipment;
        if (!equipment || typeof equipment!=='object' || Array.isArray(equipment) || Object.entries(equipment).some(([slot,id])=>!Object.hasOwn(slots,slot) || (id!==null && (typeof id!=='string' || !slots[slot].includes(id))))) throw new ApiError(400,'Accessoire d’avatar invalide.');
    }
    let nodes = 0;
    const visit = (item: unknown, depth: number) => {
        if (++nodes > 20000 || depth > 12) throw new ApiError(400, 'Profil trop complexe.');
        if (typeof item === 'number' && (!Number.isFinite(item) || Math.abs(item) > 1e15)) throw new ApiError(400, 'Valeur numérique invalide.');
        if (typeof item === 'string' && item.length > 10000) throw new ApiError(400, 'Texte trop long.');
        if (item && typeof item === 'object') for (const [key, child] of Object.entries(item)) {
            if (['__proto__','prototype','constructor','password','role','user_id','email','token'].includes(key)) throw new ApiError(400, 'Champ non autorisé.');
            visit(child, depth + 1);
        }
    };
    visit(data, 0);
    if (data.coins !== undefined && (typeof data.coins !== 'number' || !Number.isSafeInteger(data.coins) || data.coins < 0)) throw new ApiError(400, 'Solde invalide.');
    return JSON.stringify(data);
}
async function rateLimit(env: Env, key: string, limit: number, seconds: number) {
    const bucket = Math.floor(now() / seconds);
    const result = await env.DB.prepare('INSERT INTO rate_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts')
        .bind(sha(`${key}:${bucket}`), (bucket + 1) * seconds).first<{ attempts: number }>();
    if (!result || result.attempts > limit) throw new ApiError(429, 'Trop de tentatives. Réessayez plus tard.');
}
async function authenticated(request: Request, env: Env) {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') || '');
    if (!match) throw new ApiError(401, 'Connectez-vous pour accéder à votre sauvegarde.');
    const hash = sha(match[1]);
    const user = await env.DB.prepare('SELECT u.id,u.email,u.username,u.password_hash,u.recovery_hash FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').bind(hash, now()).first<UserRow>();
    if (!user) throw new ApiError(401, 'Session expirée. Reconnectez-vous.');
    return { user, hash };
}
async function getProfile(env: Env, user: UserRow) {
    const profile = await env.DB.prepare('SELECT data,version,updated_at FROM profiles WHERE user_id=?').bind(user.id).first<ProfileRow>();
    if (!profile) throw new ApiError(404, 'Sauvegarde introuvable.');
    return { user: { id: user.id, email: user.email, username: user.username }, profile: { data: JSON.parse(profile.data), version: profile.version, updatedAt: profile.updated_at } };
}
async function newSession(env: Env, id: string) {
    const raw = token();
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(sha(raw), id, now() + 7 * 86400).run();
    return raw;
}
async function route(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' && path === '/health') return { ok: true, service: 'neon-arcade-accounts' };
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    await rateLimit(env, `request:${ip}`, 120, 60);
    if (request.method === 'POST' && ['/auth/register','/auth/login','/auth/recover'].includes(path)) {
        await rateLimit(env, `auth:${ip}`, 20, 60);
        const input = await body(request, path === '/auth/register' ? 262144 : 8192);
        const address = email(input.email);
        await rateLimit(env, `identity:${address}`, 12, 900);
        const pass = password(input.password);
        if (path === '/auth/register') {
            if (input.accepted !== true) throw new ApiError(400, 'Acceptez les conditions pour créer un compte.');
            const name = typeof input.username === 'string' ? input.username.trim() : '';
            if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(name) || name.toUpperCase() === 'SYSTEM_CONFIG') throw new ApiError(400, 'Pseudo : 3 à 24 lettres, chiffres ou tirets.');
            const existing = await env.DB.prepare('SELECT id FROM users WHERE email=? OR username=?').bind(address,name).first();
            if (existing) throw new ApiError(409, 'Cette adresse ou ce pseudo est déjà utilisé.');
            const id = crypto.randomUUID(), code = recoveryCode(), raw = token();
            const initial = profileData(input.data || {});
            const hashed = await hashPassword(pass);
            try {
                await env.DB.batch([
                    env.DB.prepare('INSERT INTO users(id,email,username,password_hash,recovery_hash,created_at) VALUES(?,?,?,?,?,?)').bind(id,address,name,hashed,recoveryHash(code),now()),
                    env.DB.prepare('INSERT INTO profiles(user_id,data,updated_at) VALUES(?,?,?)').bind(id,initial,now()),
                    env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(sha(raw),id,now()+7*86400),
                ]);
            } catch (error) {
                if (String(error).includes('UNIQUE')) throw new ApiError(409, 'Cette adresse ou ce pseudo est déjà utilisé.');
                throw error;
            }
            return { token: raw, recoveryCode: code, ...await getProfile(env, {id,email:address,username:name,password_hash:hashed,recovery_hash:recoveryHash(code)}) };
        }
        const user = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(address).first<UserRow>();
        if (path === '/auth/login') {
            const valid = await verifyPassword(pass, user?.password_hash || dummyHash);
            if (!valid || !user) throw new ApiError(401, 'Adresse ou mot de passe incorrect.');
            return { token: await newSession(env,user.id), ...await getProfile(env,user) };
        }
        await rateLimit(env, `recover:${address}`, 5, 900);
        const supplied = typeof input.code === 'string' ? recoveryHash(input.code) : sha('invalid');
        const expected = user?.recovery_hash || sha('missing');
        if (!timingSafeEqual(Buffer.from(supplied,'hex'),Buffer.from(expected,'hex')) || !user) throw new ApiError(400, 'Adresse ou code de secours incorrect.');
        const code = recoveryCode(), hashed = await hashPassword(pass);
        const results = await env.DB.batch([
            env.DB.prepare('UPDATE users SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(hashed,recoveryHash(code),user.id,expected),
            env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),
        ]);
        if (!results[0].meta.changes) throw new ApiError(409, 'Ce code a déjà été utilisé.');
        return { recovered: true, recoveryCode: code };
    }
    const { user, hash } = await authenticated(request,env);
    if (request.method === 'GET' && path === '/me') return getProfile(env,user);
    if (request.method === 'POST' && path === '/auth/logout') {
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hash).run();
        return { signedOut: true };
    }
    if (request.method === 'PUT' && path === '/profile') {
        await rateLimit(env, `save:${user.id}`, 30, 60);
        const input = await body(request);
        if (!Number.isSafeInteger(input.version) || Number(input.version) < 1) throw new ApiError(400,'Version de sauvegarde requise.');
        const snapshot=JSON.parse(profileData(input.data)) as Record<string,unknown>;
        // Older open tabs do not know this new field; keep the saved style when omitted.
        if (!Object.hasOwn(snapshot,'avatarEquipment')) {
            const previous=await env.DB.prepare("SELECT json_extract(data,'$.avatarEquipment') AS equipment FROM profiles WHERE user_id=?").bind(user.id).first<{equipment:string|null}>();
            if (previous?.equipment) snapshot.avatarEquipment=JSON.parse(previous.equipment);
        }
        const data = profileData(snapshot);
        const changed = await env.DB.prepare('UPDATE profiles SET data=?,version=version+1,updated_at=? WHERE user_id=? AND version=? RETURNING version,updated_at').bind(data,now(),user.id,input.version as number).first<{version:number;updated_at:number}>();
        if (!changed) throw new ApiError(409,'La sauvegarde a changé sur un autre appareil. Rechargez-la avant de continuer.');
        return changed;
    }
    if (request.method === 'POST' && ['/account/password','/account/recovery-code','/account/delete'].includes(path)) {
        await rateLimit(env, `account:${user.id}`, 5, 900);
        const input = await body(request,8192);
        const valid = typeof input.password === 'string' && input.password.length <= 256 && await verifyPassword(input.password,user.password_hash);
        if (!valid) throw new ApiError(401, 'Mot de passe incorrect.');
        if (path === '/account/delete') {
            await env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id).run();
            return { deleted: true };
        }
        if (path === '/account/recovery-code') {
            const code = recoveryCode();
            await env.DB.prepare('UPDATE users SET recovery_hash=? WHERE id=?').bind(recoveryHash(code),user.id).run();
            return { recoveryCode: code };
        }
        const next = await hashPassword(password(input.newPassword));
        await env.DB.batch([
            env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(next,user.id),
            env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),
        ]);
        return { passwordChanged: true };
    }
    throw new ApiError(404, 'Route introuvable.');
}
export default {
    async fetch(request, env): Promise<Response> {
        const origin = request.headers.get('origin');
        const headers: Record<string,string> = {
            'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
            'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin',
        };
        if (origin && origin === env.APP_ORIGIN) headers['Access-Control-Allow-Origin'] = origin;
        if (origin && origin !== env.APP_ORIGIN) return new Response(JSON.stringify({error:'Origine non autorisée.'}),{status:403,headers});
        if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
        try { return new Response(JSON.stringify(await route(request,env)),{headers}); }
        catch (error) {
            if (error instanceof ApiError) return new Response(JSON.stringify({error:error.message}),{status:error.status,headers});
            console.error(JSON.stringify({event:'api_error',name:error instanceof Error ? error.name : 'UnknownError',reason:error instanceof Error && /iteration|pbkdf|derive|crypto/i.test(error.message) ? 'crypto' : error instanceof Error && /D1|SQLITE|database/i.test(error.message) ? 'database' : 'unknown'}));
            return new Response(JSON.stringify({error:'Service momentanément indisponible.'}),{status:500,headers});
        }
    },
    async scheduled(_event,env) {
        await env.DB.batch([
            env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now()),
            env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<=?').bind(now()),
        ]);
    },
} satisfies ExportedHandler<Env>;
