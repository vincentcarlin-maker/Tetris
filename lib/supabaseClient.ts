
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
                // Ignore "row not found" errors, they are normal for new users
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

    saveUserProfile: async (username: string, profileData: any) => {
        if (!supabase) return { success: false, error: "No Supabase client" };
        try {
            console.log(`☁️ Saving profile for [${username}]...`);
            
            // 1. Fetch existing data first to prevent overwrite
            const { data: existing, error: fetchError } = await supabase
                .from('profiles')
                .select('data')
                .eq('username', username)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.warn("⚠️ Fetch error before save:", fetchError.message);
            }
            
            // 2. Merge existing data with new data (new data takes precedence)
            const mergedData = { ...(existing?.data || {}), ...profileData };

            // 3. Save merged data
            const { error: saveError } = await supabase
                .from('profiles')
                .upsert({ 
                    username: username,
                    data: mergedData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username' });
            
            if (saveError) {
                console.error("❌ SAVE FAILED:", saveError.message, saveError.details);
                return { success: false, error: saveError };
            }
            
            console.log("✅ Profile saved successfully!");
            return { success: true, error: null };
        } catch (e) {
            console.error("❌ Exception during save:", e);
            return { success: false, error: e };
        }
    },

    getGlobalLeaderboard: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, data, updated_at')
                .limit(100);

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
        } catch (e) {
            return [];
        }
    },

    // NEW: Fetch ALL raw data for Admin Dashboard
    getFullAdminExport: async () => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error || !data) return [];
            return data;
        } catch (e) {
            return [];
        }
    },

    getMessages: async (user1: string, user2: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    },

    sendMessage: async (senderId: string, receiverId: string, text: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{ sender_id: senderId, receiver_id: receiverId, text: text, read: false }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            return null;
        }
    },

    markMessagesAsRead: async (senderId: string, receiverId: string) => {
        if (!supabase) return;
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .match({ sender_id: senderId, receiver_id: receiverId, read: false });
        } catch (e) {
            console.error("Erreur update read:", e);
        }
    },

    getUnreadCount: async (userId: string) => {
        if (!supabase) return 0;
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('read', false);
            
            if (error) return 0;
            return count || 0;
        } catch (e) {
            return 0;
        }
    }
};
