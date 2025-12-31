
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
            const { error } = await supabase.from('transactions').insert([{ 
                username, type, amount, description, game_id: gameId, timestamp 
            }]);
            
            const { data: sys } = await supabase.from('profiles').select('data').eq('username', 'SYSTEM_CONFIG').single();
            const logs = sys?.data?.transaction_logs || [];
            const newLog = { username, type, amount, description, gameId, timestamp };
            
            await supabase.from('profiles').update({ 
                data: { ...sys?.data, transaction_logs: [newLog, ...logs].slice(0, 300) } 
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
                .eq('sender_id', sender_id)
                .eq('receiver_id', receiver_id)
                .eq('text', 'CMD:FRIEND_REQUEST');
            return !error;
        } catch (e) { return false; }
    },

    acceptFriendRequestDB: async (username: string, requesterName: string) => {
        if (!supabase) return false;
        try {
            // 1. Mettre à jour le profil de l'utilisateur actuel
            const { data: p1 } = await supabase.from('profiles').select('data').eq('username', username).single();
            const p1Data = p1?.data || {};
            const p1Friends = p1Data.friends || [];
            
            // On récupère les infos du demandeur pour l'ajouter proprement
            const { data: p2 } = await supabase.from('profiles').select('username, data').eq('username', requesterName).single();
            if (p2) {
                const newFriendForP1 = {
                    id: p2.username,
                    name: p2.username,
                    avatarId: p2.data?.avatarId || 'av_bot',
                    frameId: p2.data?.frameId,
                    status: 'offline',
                    lastSeen: Date.now()
                };

                if (!p1Friends.some((f: any) => f.name === requesterName)) {
                    await supabase.from('profiles').update({
                        data: { ...p1Data, friends: [...p1Friends, newFriendForP1] }
                    }).eq('username', username);
                }

                // 2. Mettre à jour le profil du demandeur
                const p2Data = p2.data || {};
                const p2Friends = p2Data.friends || [];
                const newFriendForP2 = {
                    id: username,
                    name: username,
                    avatarId: p1Data.avatarId || 'av_bot',
                    frameId: p1Data.frameId,
                    status: 'offline',
                    lastSeen: Date.now()
                };

                if (!p2Friends.some((f: any) => f.name === username)) {
                    await supabase.from('profiles').update({
                        data: { ...p2Data, friends: [...p2Friends, newFriendForP2] }
                    }).eq('username', requesterName);
                }
            }

            // 3. Supprimer la notification (toujours le faire même si p2 est absent pour nettoyer)
            await supabase
                .from('messages')
                .delete()
                .match({ 
                    sender_id: requesterName, 
                    receiver_id: username, 
                    text: 'CMD:FRIEND_REQUEST' 
                });
                
            return true;
        } catch (e) {
            console.error("Accept friend error:", e);
            return false;
        }
    },

    searchUsers: async (query: string) => {
        let results: any[] = [];
        const queryLower = query.toLowerCase();

        const localUsersStr = localStorage.getItem('neon_users_db');
        if (localUsersStr) {
            try {
                const localUsers = JSON.parse(localUsersStr);
                Object.keys(localUsers).forEach(username => {
                    if (username.toLowerCase().includes(queryLower)) {
                        const userDataStr = localStorage.getItem('neon_data_' + username);
                        const userData = userDataStr ? JSON.parse(userDataStr) : {};
                        results.push({
                            id: username,
                            name: username,
                            avatarId: userData.avatarId || 'av_bot',
                            frameId: userData.frameId
                        });
                    }
                });
            } catch (e) {}
        }

        if (supabase) {
            try {
                const { data, error } = await supabase.rpc('search_users_by_name', {
                    p_username: query
                });

                if (error) {
                    const { data: selData } = await supabase
                        .from('profiles')
                        .select('username, data')
                        .ilike('username', `%${query}%`)
                        .limit(20);
                    
                    if (selData) {
                        selData.forEach((u: any) => {
                            if (!results.find(r => r.name === u.username)) {
                                results.push({
                                    id: u.username,
                                    name: u.username,
                                    avatarId: u.data?.avatarId || 'av_bot',
                                    frameId: u.data?.frameId
                                });
                            }
                        });
                    }
                } else if (data) {
                    data.forEach((u: any) => {
                        if (!results.find(r => r.name === u.username)) {
                            results.push({
                                id: u.username,
                                name: u.username,
                                avatarId: u.data?.avatarId || 'av_bot',
                                frameId: u.data?.frameId
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Exception lors de la recherche cloud:', e);
            }
        }

        return results;
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
