
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
        const timestamp = new Date().toISOString();
        if (!supabase) {
            const localLogs = JSON.parse(localStorage.getItem('neon_local_transactions') || '[]');
            localLogs.unshift({ id: Date.now(), username, type, amount, description, gameId, timestamp });
            localStorage.setItem('neon_local_transactions', JSON.stringify(localLogs.slice(0, 100)));
            return;
        }
        try {
            // Toujours logger dans SQL si possible
            const { error } = await supabase.from('transactions').insert([{ 
                username, type, amount, description, game_id: gameId, timestamp 
            }]);
            
            // Doubler la sauvegarde dans SYSTEM_CONFIG par sécurité (mode secours)
            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            const logs = sys?.data?.transaction_logs || [];
            const newLog = { username, type, amount, description, gameId, timestamp };
            
            // On garde les 200 dernières
            const updatedLogs = [newLog, ...logs].slice(0, 200);
            
            await supabase.from('profiles').update({ 
                data: { ...sys?.data, transaction_logs: updatedLogs } 
            }).eq('username', 'SYSTEM_CONFIG');

        } catch (e) {
            console.error("Transaction logging failed:", e);
        }
    },

    getTransactions: async () => {
        if (!supabase) {
            return JSON.parse(localStorage.getItem('neon_local_transactions') || '[]');
        }
        
        let allLogs: any[] = [];
        
        try {
            // 1. Tenter SQL
            const { data: sqlData } = await supabase
                .from('transactions')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(300);
            
            if (sqlData && sqlData.length > 0) {
                allLogs = [...sqlData];
            }

            // 2. Tenter JSON (Backup)
            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            const jsonLogs = sys?.data?.transaction_logs || [];
            
            // 3. Fusion intelligente : On garde tout ce qui a un timestamp unique
            const existingTimestamps = new Set(allLogs.map(l => l.timestamp));
            
            jsonLogs.forEach((jLog: any) => {
                if (!existingTimestamps.has(jLog.timestamp)) {
                    allLogs.push(jLog);
                }
            });

            // 4. Tri final par date
            return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        } catch (e) { 
            console.error("Critical error in getTransactions:", e);
            // Ultime secours : retour des logs JSON uniquement
            try {
                const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
                return sys?.data?.transaction_logs || [];
            } catch {
                return [];
            }
        }
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

    sendFriendRequestDB: async (sender_id: string, receiver_id: string) => {
        return await DB.sendMessage(sender_id, receiver_id, 'CMD:FRIEND_REQUEST');
    },

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

    deleteUser: async (username: string) => {
        if (!supabase) return;
        try {
            await supabase.from('profiles').delete().eq('username', username);
            await supabase.from('messages').delete().or(`sender_id.eq.${username},receiver_id.eq.${username}`);
            await supabase.from('transactions').delete().eq('username', username);
        } catch (e) {}
    },

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
