
import { createClient } from '@supabase/supabase-js';

// Only public configuration belongs in this bundle. Secrets stay in Edge Functions.
const url = process.env.SUPABASE_URL || '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;
export const isSupabaseConfigured = !!supabase;

const checked = async <T,>(request: PromiseLike<{ data: T; error: any }>): Promise<T> => {
    const { data, error } = await request;
    if (error) throw error;
    return data;
};

export const publicProfileData = (data: Record<string, any>) => {
    const { password, reset_code, reset_expiry, email, role, banned, ...safe } = data;
    return safe;
};

export const DB = {
    getUserProfile: async (username: string) => {
        if (!supabase) return null;
        const own = await checked(supabase.from('profiles').select('*').eq('username', username).maybeSingle());
        if (own) return own;
        return await checked(supabase.from('public_profiles').select('*').eq('username', username).maybeSingle());
    },

    saveUserProfile: async (username: string, profileData: any) => {
        if (!supabase) throw new Error("Le serveur n'est pas configuré.");
        // An atomic JSON merge in Postgres avoids losing concurrent profile updates.
        await checked(supabase.rpc('save_my_profile', { p_username: username, p_patch: publicProfileData(profileData) }));
        return { success: true };
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
            await checked(supabase.from('transactions').insert([{
                username, type, amount, description, game_id: gameId, timestamp
            }]));

        } catch (e) {
            throw e;
        }
    },

    getTransactions: async () => {
        if (!supabase) {
            return JSON.parse(localStorage.getItem('neon_local_transactions') || '[]');
        }
        
        let allLogs: any[] = [];
        
        try {
            const { data: sqlData } = await supabase
                .from('transactions')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(300);
            
            if (sqlData && sqlData.length > 0) {
                allLogs = [...sqlData];
            }

            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            const jsonLogs = sys?.data?.transaction_logs || [];
            
            const signatures = new Set(allLogs.map(l => `${new Date(l.timestamp).getTime()}_${l.username}_${l.amount}`));
            
            jsonLogs.forEach((jLog: any) => {
                const sig = `${new Date(jLog.timestamp).getTime()}_${jLog.username}_${jLog.amount}`;
                if (!signatures.has(sig)) {
                    allLogs.push(jLog);
                    signatures.add(sig);
                }
            });

            return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        } catch (e) { 
            console.error("Error in getTransactions:", e);
            return [];
        }
    },

    getSystemConfig: async () => {
        if (!supabase) return null;
        const { data } = await supabase.from('app_config').select('data').eq('id', 1).maybeSingle();
        return data?.data || null;
    },

    saveSystemConfig: async (config: any) => {
        if (!supabase) throw new Error("Le serveur n'est pas configuré.");
        await checked(supabase.rpc('save_my_profile', { p_username: 'SYSTEM_CONFIG', p_patch: config }));
    },

    updateUserData: async (username: string, newData: any) => {
        if (!supabase) throw new Error("Le serveur n'est pas configuré.");
        await checked(supabase.rpc('save_my_profile', { p_username: username, p_patch: newData }));
    },

    getGlobalLeaderboard: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('public_profiles').select('username, data, updated_at').limit(100);
        return (data || []).map((row: any) => ({
            id: row.username, name: row.username, avatarId: row.data?.avatarId || 'av_bot', frameId: row.data?.frameId,
            status: 'offline' as const, online_at: row.updated_at, lastSeen: new Date(row.updated_at).getTime(), stats: row.data?.highScores || {}
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
                .eq('text', 'CMD:FRIEND_REQUEST')
                .order('created_at', { ascending: false });
                
            if (error || !data) return [];
            
            const requests = await Promise.all(data.map(async (m) => {
                const profile = await DB.getUserProfile(m.sender_id);
                return {
                    id: m.sender_id,
                    name: m.sender_id,
                    avatarId: profile?.data?.avatarId || 'av_bot',
                    frameId: profile?.data?.frameId,
                    timestamp: new Date(m.created_at).getTime()
                };
            }));
            return requests;
        } catch (e) { return []; }
    },

    getSentRequests: async (username: string) => {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', username)
                .eq('text', 'CMD:FRIEND_REQUEST');
                
            if (error || !data) return [];
            
            const requests = await Promise.all(data.map(async (m) => {
                const profile = await DB.getUserProfile(m.receiver_id);
                return {
                    id: m.receiver_id,
                    name: m.receiver_id,
                    avatarId: profile?.data?.avatarId || 'av_bot',
                    frameId: profile?.data?.frameId,
                    timestamp: new Date(m.created_at).getTime()
                };
            }));
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
        if (supabase) {
            await supabase.from('messages')
                .delete()
                .eq('sender_id', sender_id)
                .eq('receiver_id', receiver_id)
                .eq('text', 'CMD:FRIEND_REQUEST');
        }
        return await DB.sendMessage(sender_id, receiver_id, 'CMD:FRIEND_REQUEST');
    },

    cancelFriendRequestDB: async (sender_id: string, receiver_id: string) => {
        if (!supabase) return false;
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .match({ 
                    sender_id: sender_id, 
                    receiver_id: receiver_id, 
                    text: 'CMD:FRIEND_REQUEST' 
                });
            return !error;
        } catch (e) { return false; }
    },

    acceptFriendRequestDB: async (username: string, requesterName: string) => {
        if (!supabase) throw new Error("Le serveur n'est pas configuré.");
        await checked(supabase.rpc('accept_friend_request', { p_requester: requesterName }));
        return true;
    },

    searchUsers: async (query: string) => {
        if (!supabase || !query.trim()) return [];
        const data = await checked(supabase.from('public_profiles').select('username, data').ilike('username', `%${query}%`).limit(20));
        return (data || []).map((user: any) => ({ id: user.username, name: user.username, avatarId: user.data?.avatarId || 'av_bot', frameId: user.data?.frameId }));
    },

    deleteUser: async (username: string) => {
        if (!supabase) throw new Error("Le serveur n'est pas configuré.");
        await checked(supabase.rpc('delete_my_account', { p_username: username }));
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
