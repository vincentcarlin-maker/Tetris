
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
        console.log("Supabase Client Initialized");
    } catch (e) {
        console.error("Supabase init failed:", e);
    }
} else {
    console.warn("Supabase non configuré ou configuration incomplète. Mode hors-ligne actif.");
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;

export const saveSupabaseConfig = (url: string, key: string) => {
    if (url) localStorage.setItem('neon_supabase_url', url.trim());
    if (key) localStorage.setItem('neon_supabase_key', key.trim());
    window.location.reload();
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('neon_supabase_url');
    localStorage.removeItem('neon_supabase_key');
    window.location.reload();
};

export const getStoredConfig = () => ({
    url: localStorage.getItem('neon_supabase_url') || '',
    key: localStorage.getItem('neon_supabase_key') || ''
});

// --- CLOUD SAVE, LEADERBOARD & MESSAGING HELPERS ---

export const DB = {
    getUserProfile: async (username: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error) {
                if (error.code !== 'PGRST116') {
                    console.warn("Error fetching profile:", error.message);
                }
                return null;
            }
            return data; 
        } catch (e) {
            return null;
        }
    },

    getUserByEmail: async (email: string) => {
        if (!supabase) return null;
        try {
            // Recherche dans le champ JSONB 'data'
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('data->>email', email.trim().toLowerCase())
                .neq('username', 'SYSTEM_CONFIG') // Sécurité
                .single();
            
            if (error) return null;
            return data;
        } catch (e) {
            return null;
        }
    },

    saveUserProfile: async (username: string, profileData: any) => {
        if (!supabase) return { success: false, error: "No Supabase client" };
        if (username === 'SYSTEM_CONFIG') return { success: false, error: "Reserved name" };

        try {
            console.log(`☁️ Saving profile for [${username}]...`);
            const { data: existing } = await supabase
                .from('profiles')
                .select('data')
                .eq('username', username)
                .single();
            
            const mergedData = { ...(existing?.data || {}), ...profileData };

            const { error: saveError } = await supabase
                .from('profiles')
                .upsert({ 
                    username: username,
                    data: mergedData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username' });
            
            if (saveError) {
                console.error("❌ SAVE FAILED:", saveError.message);
                return { success: false, error: saveError };
            }
            
            return { success: true, error: null };
        } catch (e) {
            return { success: false, error: e };
        }
    },

    getSystemConfig: async () => {
        if (!supabase) return null;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('data')
                .eq('username', 'SYSTEM_CONFIG')
                .single();
            return data?.data || null;
        } catch (e) {
            return null;
        }
    },

    saveSystemConfig: async (config: any) => {
        if (!supabase) return;
        try {
            const { data: existing } = await supabase
                .from('profiles')
                .select('data')
                .eq('username', 'SYSTEM_CONFIG')
                .single();
                
            const merged = { ...(existing?.data || {}), ...config };
            
            await supabase.from('profiles').upsert({
                username: 'SYSTEM_CONFIG',
                data: merged,
                updated_at: new Date().toISOString()
            }, { onConflict: 'username' });
        } catch (e) {
            console.error("System config save failed", e);
        }
    },

    deleteUser: async (username: string) => {
        if (!supabase || username === 'SYSTEM_CONFIG') return { success: false };
        try {
            const { error } = await supabase.from('profiles').delete().eq('username', username);
            if (error) throw error;
            return { success: true };
        } catch (e) {
            return { success: false, error: e };
        }
    },

    updateUserData: async (username: string, newData: any) => {
        if (!supabase) return { success: false, error: "Offline mode" };
        try {
            const { data: existing } = await supabase.from('profiles').select('data').eq('username', username).single();
            const merged = { ...(existing?.data || {}), ...newData };
            const { error } = await supabase.from('profiles').update({ data: merged, updated_at: new Date().toISOString() }).eq('username', username);
            if (error) throw error;
            return { success: true };
        } catch (e) {
            return { success: false, error: e };
        }
    },

    getGlobalLeaderboard: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase.from('profiles').select('username, data, updated_at').neq('username', 'SYSTEM_CONFIG').limit(100);
            if (error || !data) return [];
            return data.map((row: any) => ({
                id: row.username,
                name: row.username,
                avatarId: row.data?.avatarId || 'av_bot',
                frameId: row.data?.frameId,
                status: 'offline', 
                lastSeen: new Date(row.updated_at).getTime(),
                online_at: row.updated_at,
                stats: row.data?.highScores || {}
            }));
        } catch (e) { return []; }
    },

    getFullAdminExport: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase.from('profiles').select('*').neq('username', 'SYSTEM_CONFIG').order('updated_at', { ascending: false });
            if (error || !data) return [];
            return data;
        } catch (e) { return []; }
    },

    searchUsers: async (query: string) => {
        if (!supabase || query.length < 2) return [];
        try {
            const { data, error } = await supabase.from('profiles').select('username, data, updated_at').ilike('username', `%${query}%`).neq('username', 'SYSTEM_CONFIG').limit(10);
            if (error || !data) return [];
            return data.map((row: any) => ({
                id: row.username,
                name: row.username,
                avatarId: row.data?.avatarId || 'av_bot',
                frameId: row.data?.frameId,
                status: 'offline',
                lastSeen: new Date(row.updated_at).getTime(),
                stats: row.data?.highScores || {}
            }));
        } catch (e) { return []; }
    },

    getMessages: async (user1: string, user2: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`).order('created_at', { ascending: true }).limit(50);
            if (error) throw error;
            return (data || []).filter((m: any) => !m.text.startsWith('CMD:'));
        } catch (e) { return []; }
    },

    getPendingRequests: async (username: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase.from('messages').select('*').eq('receiver_id', username).like('text', 'CMD:FRIEND_REQUEST%').eq('read', false);
            if (error) return [];
            const requests = await Promise.all(data.map(async (msg: any) => {
                const profile = await DB.getUserProfile(msg.sender_id);
                return { id: msg.sender_id, name: msg.sender_id, avatarId: profile?.data?.avatarId || 'av_bot', frameId: profile?.data?.frameId, timestamp: new Date(msg.created_at).getTime() };
            }));
            return requests;
        } catch (e) { return []; }
    },

    sendMessage: async (senderId: string, receiverId: string, text: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from('messages').insert([{ sender_id: senderId, receiver_id: receiverId, text: text, read: false }]).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return null; }
    },

    deleteMessage: async (id: number) => {
        if (!supabase) return { success: false };
        try {
            const { error } = await supabase.from('messages').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (e) {
            return { success: false, error: e };
        }
    },

    sendFriendRequestDB: async (senderId: string, receiverId: string) => {
        if (!supabase) return null;
        return await DB.sendMessage(senderId, receiverId, 'CMD:FRIEND_REQUEST');
    },

    markMessagesAsRead: async (senderId: string, receiverId: string) => {
        if (!supabase) return;
        try { await supabase.from('messages').update({ read: true }).match({ sender_id: senderId, receiver_id: receiverId, read: false }); } catch (e) {}
    },

    acceptFriendRequestDB: async (accepterId: string, requesterId: string) => {
        if (!supabase) return;
        try { await supabase.from('messages').update({ read: true }).eq('sender_id', requesterId).eq('receiver_id', accepterId).like('text', 'CMD:FRIEND_REQUEST%'); } catch (e) {}
    },

    getUnreadCount: async (userId: string) => {
        if (!supabase) return 0;
        try {
            const { count, error } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('read', false).not('text', 'like', 'CMD:%');
            if (error) return 0;
            return count || 0;
        } catch (e) { return 0; }
    },

    markAllAsRead: async (receiverId: string) => {
        if (!supabase) return;
        try { await supabase.from('messages').update({ read: true }).eq('receiver_id', receiverId).eq('read', false); } catch (e) {}
    },

    // --- SUPPORT FUNCTIONS ---
    getSupportMessages: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', 'SYSTEM_SUPPORT')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    }
};
