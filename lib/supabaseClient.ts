
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION SUPABASE ---
const DEFAULT_SUPABASE_URL = 'https://taallvoewrojegodndtb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_rCAQ6RFblfxvPsxnhTB1Mg_qPjwysb_';

const storedUrl = localStorage.getItem('neon_supabase_url');
const storedKey = localStorage.getItem('neon_supabase_key');

const SUPABASE_URL = storedUrl || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = storedKey || DEFAULT_SUPABASE_ANON_KEY;

let supabaseInstance = null;

const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('VOTRE_URL');
const isValidKey = (key: string) => key && key.length > 10 && !key.includes('VOTRE_CLE');

if (isValidUrl(SUPABASE_URL) && isValidKey(SUPABASE_ANON_KEY)) {
    try {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
            },
        });
    } catch (e) {
        console.error("Supabase init failed:", e);
    }
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;

export const DB = {
    getUserProfile: async (username: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
            if (error) return null;
            return data; 
        } catch (e) { return null; }
    },

    saveUserProfile: async (username: string, profileData: any) => {
        if (!supabase) return { success: false };
        try {
            const { data: existing } = await supabase.from('profiles').select('data').eq('username', username).single();
            const mergedData = { ...(existing?.data || {}), ...profileData };
            await supabase.from('profiles').upsert({ username, data: mergedData, updated_at: new Date().toISOString() }, { onConflict: 'username' });
            return { success: true };
        } catch (e) { return { success: false }; }
    },

    // --- ECONOMY TRANSACTIONS ---
    logTransaction: async (username: string, type: 'EARN' | 'PURCHASE' | 'ADMIN_ADJUST', amount: number, description: string, gameId?: string) => {
        if (!supabase) {
            // Local fallback for dev/offline
            const localLogs = JSON.parse(localStorage.getItem('neon_local_transactions') || '[]');
            localLogs.unshift({ id: Date.now(), username, type, amount, description, gameId, timestamp: new Date().toISOString() });
            localStorage.setItem('neon_local_transactions', JSON.stringify(localLogs.slice(0, 100)));
            return;
        }
        try {
            // On utilise une table 'transactions' si elle existe, sinon on stocke dans une clé globale de log
            await supabase.from('transactions').insert([{ 
                username, type, amount, description, game_id: gameId, timestamp: new Date().toISOString() 
            }]);
        } catch (e) {
            // Si la table n'existe pas encore, on log dans SYSTEM_CONFIG pour ne pas perdre les données
            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            const logs = sys?.data?.transaction_logs || [];
            logs.unshift({ username, type, amount, description, gameId, timestamp: new Date().toISOString() });
            await supabase.from('profiles').update({ data: { ...sys?.data, transaction_logs: logs.slice(0, 200) } }).eq('username', 'SYSTEM_CONFIG');
        }
    },

    getTransactions: async () => {
        if (!supabase) {
            return JSON.parse(localStorage.getItem('neon_local_transactions') || '[]');
        }
        try {
            const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false }).limit(200);
            if (!error && data) return data;
            
            // Fallback SYSTEM_CONFIG
            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            return sys?.data?.transaction_logs || [];
        } catch (e) { return []; }
    },

    getSystemConfig: async () => {
        if (!supabase) return null;
        const { data } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
        return data?.data || null;
    },

    saveSystemConfig: async (config: any) => {
        if (!supabase) return;
        const { data: existing } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
        await supabase.from('profiles').upsert({ username: 'SYSTEM_CONFIG', data: { ...(existing?.data || {}), ...config }, updated_at: new Date().toISOString() }, { onConflict: 'username' });
    },

    updateUserData: async (username: string, newData: any) => {
        if (!supabase) return;
        const { data: existing } = await supabase.from('profiles').select('data').eq('username', username).single();
        await supabase.from('profiles').update({ data: { ...(existing?.data || {}), ...newData }, updated_at: new Date().toISOString() }).eq('username', username);
    },

    getGlobalLeaderboard: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('profiles').select('username, data, updated_at').neq('username', 'SYSTEM_CONFIG').limit(100);
        return (data || []).map((row: any) => ({
            id: row.username, name: row.username, avatarId: row.data?.avatarId || 'av_bot', frameId: row.data?.frameId,
            status: 'offline', lastSeen: new Date(row.updated_at).getTime(), stats: row.data?.highScores || {}
        }));
    },

    getFullAdminExport: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('profiles').select('*').neq('username', 'SYSTEM_CONFIG').order('updated_at', { ascending: false });
        return data || [];
    },

    // --- MESSAGING & SOCIAL ---
    // Fix: Added missing methods for social and messaging features to address reported type errors

    /**
     * Retourne le nombre de messages non lus pour un utilisateur donné.
     */
    getUnreadCount: async (username: string) => {
        if (!supabase) return 0;
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', username)
                .eq('read', false)
                .neq('text', 'CMD:FRIEND_REQUEST');
            return count || 0;
        } catch (e) { return 0; }
    },

    /**
     * Récupère les demandes d'amis en attente pour un utilisateur.
     */
    getPendingRequests: async (username: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', username)
                .eq('text', 'CMD:FRIEND_REQUEST');
            if (error || !data) return [];
            
            const requests = [];
            for (const m of data) {
                const profile = await DB.getUserProfile(m.sender_id);
                requests.push({
                    id: m.sender_id,
                    name: m.sender_id,
                    avatarId: profile?.data?.avatarId || 'av_bot',
                    frameId: profile?.data?.frameId,
                    timestamp: new Date(m.created_at).getTime()
                });
            }
            return requests;
        } catch (e) { return []; }
    },

    /**
     * Récupère l'historique des messages entre deux utilisateurs.
     */
    getMessages: async (user1: string, user2: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
                .neq('text', 'CMD:FRIEND_REQUEST')
                .order('created_at', { ascending: true });
            return data || [];
        } catch (e) { return []; }
    },

    /**
     * Marque les messages d'un expéditeur vers un destinataire comme lus.
     */
    markMessagesAsRead: async (sender_id: string, receiver_id: string) => {
        if (!supabase) return;
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', sender_id)
                .eq('receiver_id', receiver_id)
                .eq('read', false);
        } catch (e) {}
    },

    /**
     * Envoie un message privé ou un signal système.
     */
    sendMessage: async (sender_id: string, receiver_id: string, text: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{ sender_id, receiver_id, text, read: false }])
                .select()
                .single();
            return data;
        } catch (e) { return null; }
    },

    /**
     * Envoie une demande d'ami via un signal spécial dans la table messages.
     */
    sendFriendRequestDB: async (sender_id: string, receiver_id: string) => {
        return await DB.sendMessage(sender_id, receiver_id, 'CMD:FRIEND_REQUEST');
    },

    /**
     * Accepte une demande d'ami en supprimant le signal correspondant.
     */
    acceptFriendRequestDB: async (username: string, requesterId: string) => {
        if (!supabase) return;
        try {
            await supabase
                .from('messages')
                .delete()
                .eq('sender_id', requesterId)
                .eq('receiver_id', username)
                .eq('text', 'CMD:FRIEND_REQUEST');
        } catch (e) {}
    },

    /**
     * Recherche des utilisateurs par pseudo pour le hub social.
     */
    searchUsers: async (query: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, data')
                .ilike('username', `%${query}%`)
                .neq('username', 'SYSTEM_CONFIG')
                .limit(20);
            return (data || []).map(u => ({
                id: u.username,
                name: u.username,
                avatarId: u.data?.avatarId || 'av_bot',
                frameId: u.data?.frameId
            }));
        } catch (e) { return []; }
    },

    /**
     * Récupère un utilisateur via son e-mail (champ de secours stocké dans data).
     */
    getUserByEmail: async (email: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('data->>email', email)
                .maybeSingle();
            if (error) return null;
            return data;
        } catch (e) { return null; }
    },

    /**
     * Supprime un utilisateur et ses données associées (messages, transactions).
     */
    deleteUser: async (username: string) => {
        if (!supabase) return;
        try {
            await supabase.from('profiles').delete().eq('username', username);
            await supabase.from('messages').delete().or(`sender_id.eq.${username},receiver_id.eq.${username}`);
            await supabase.from('transactions').delete().eq('username', username);
        } catch (e) {}
    },

    /**
     * Récupère les messages de support (commençant par le tag [SUPPORT]).
     */
    getSupportMessages: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .like('text', '[SUPPORT]%')
                .order('created_at', { ascending: false });
            return data || [];
        } catch (e) { return []; }
    }
};
