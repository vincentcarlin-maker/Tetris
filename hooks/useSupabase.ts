
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, DB } from '../lib/supabaseClient';

export interface OnlineUser {
    id: string; // Peer ID or Username
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    online_at: string;
    stats?: any; // High Scores object
    gameActivity?: string; // Current game playing
}

const HISTORY_KEY = 'neon_global_history';

export const useSupabase = (myPeerId: string | null, myName: string, myAvatar: string, myFrame: string, myStats: any, currentGame: string) => {
    // --- PRESENCE STATE (Live Users) ---
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });
    
    // --- GLOBAL LEADERBOARD STATE (All-Time History from DB) ---
    const [globalLeaderboard, setGlobalLeaderboard] = useState<OnlineUser[]>([]);

    const [isConnectedToSupabase, setIsConnectedToSupabase] = useState(false);
    const channelRef = useRef<any>(null);

    // Initialisation et abonnement à la présence
    // ADDED myName to dependency to re-init on login
    useEffect(() => {
        if (!isSupabaseConfigured || !supabase || !myPeerId) return;

        // Création du canal de présence global
        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: myPeerId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const currentOnlineMap = new Map<string, OnlineUser>();
                
                // 1. Extract currently online users
                for (const key in newState) {
                    if (key === myPeerId) continue;

                    const presence = newState[key][0] as any;
                    if (presence) {
                        currentOnlineMap.set(key, {
                            id: key,
                            name: presence.name || 'Inconnu',
                            avatarId: presence.avatarId || 'av_bot',
                            frameId: presence.frameId,
                            status: 'online',
                            lastSeen: Date.now(),
                            online_at: presence.online_at,
                            stats: presence.stats || {},
                            gameActivity: presence.gameActivity
                        });
                    }
                }

                // 2. Merge with history
                setOnlineUsers(prev => {
                    const mergedMap = new Map<string, OnlineUser>();

                    prev.forEach(u => {
                        mergedMap.set(u.id, { ...u, status: 'offline', gameActivity: undefined });
                    });

                    currentOnlineMap.forEach((u, key) => {
                        mergedMap.set(key, u);
                    });

                    const newList = Array.from(mergedMap.values());
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(newList));
                    return newList;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnectedToSupabase(true);
                    await channel.track({
                        name: myName,
                        avatarId: myAvatar,
                        frameId: myFrame,
                        stats: myStats,
                        gameActivity: currentGame,
                        online_at: new Date().toISOString(),
                    });
                } else {
                    setIsConnectedToSupabase(false);
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [myPeerId, myName]); 

    // Mettre à jour ma présence si mes infos ou mes scores changent
    useEffect(() => {
        if (channelRef.current && isConnectedToSupabase && myPeerId) {
            channelRef.current.track({
                name: myName,
                avatarId: myAvatar,
                frameId: myFrame,
                stats: myStats, // Broadcast updated scores
                gameActivity: currentGame, // Broadcast current game
                online_at: new Date().toISOString(),
            }).catch(console.error);
        }
    }, [myName, myAvatar, myFrame, myStats, currentGame, isConnectedToSupabase, myPeerId]);

    // --- FEATURE 1: CLOUD SAVE & LOGIN ---
    const loginAndFetchProfile = useCallback(async (username: string) => {
        if (!isSupabaseConfigured) return null;
        return await DB.getUserProfile(username);
    }, []);

    const syncProfileToCloud = useCallback(async (username: string, fullData: any) => {
        if (!isSupabaseConfigured) return;
        await DB.saveUserProfile(username, fullData);
        fetchLeaderboard(); 
    }, []);

    // --- FEATURE 2: HISTORICAL LEADERBOARD ---
    const fetchLeaderboard = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        const board = await DB.getGlobalLeaderboard();
        setGlobalLeaderboard(board);
    }, []);

    useEffect(() => {
        if (isSupabaseConfigured) fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        onlineUsers, 
        globalLeaderboard,
        isConnectedToSupabase,
        isSupabaseConfigured,
        loginAndFetchProfile,
        syncProfileToCloud,
        refreshLeaderboard: fetchLeaderboard
    };
};
