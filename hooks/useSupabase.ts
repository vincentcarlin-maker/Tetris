
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
}

const HISTORY_KEY = 'neon_global_history';

export const useSupabase = (myPeerId: string | null, myName: string, myAvatar: string, myFrame: string, myStats: any) => {
    // --- PRESENCE STATE (Live Users) ---
    // Initialize from local storage to show offline players immediately
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });
    
    // --- GLOBAL LEADERBOARD STATE (All-Time History from DB) ---
    // This is merged into onlineUsers for the UI but fetched separately
    const [globalLeaderboard, setGlobalLeaderboard] = useState<OnlineUser[]>([]);

    const [isConnectedToSupabase, setIsConnectedToSupabase] = useState(false);
    const channelRef = useRef<any>(null);

    // Initialisation et abonnement à la présence
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
                            stats: presence.stats || {}
                        });
                    }
                }

                // 2. Merge with history
                setOnlineUsers(prev => {
                    const mergedMap = new Map<string, OnlineUser>();

                    // Add previous users, marking them as offline by default
                    prev.forEach(u => {
                        mergedMap.set(u.id, { ...u, status: 'offline' });
                    });

                    // Overwrite/Add current online users
                    currentOnlineMap.forEach((u, key) => {
                        mergedMap.set(key, u);
                    });

                    const newList = Array.from(mergedMap.values());
                    
                    // Persist to local storage
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(newList));
                    
                    return newList;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnectedToSupabase(true);
                    // Envoyer mon état initial avec les scores
                    await channel.track({
                        name: myName,
                        avatarId: myAvatar,
                        frameId: myFrame,
                        stats: myStats,
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
    }, [myPeerId]); // Re-run only if peerID changes (on init)

    // Mettre à jour ma présence si mes infos ou mes scores changent
    useEffect(() => {
        if (channelRef.current && isConnectedToSupabase && myPeerId) {
            channelRef.current.track({
                name: myName,
                avatarId: myAvatar,
                frameId: myFrame,
                stats: myStats, // Broadcast updated scores
                online_at: new Date().toISOString(),
            }).catch(console.error);
        }
    }, [myName, myAvatar, myFrame, myStats, isConnectedToSupabase, myPeerId]);

    // --- FEATURE 1: CLOUD SAVE & LOGIN ---
    
    // Tente de récupérer un profil existant
    const loginAndFetchProfile = useCallback(async (username: string) => {
        if (!isSupabaseConfigured) return null;
        return await DB.getUserProfile(username);
    }, []);

    // Sauvegarde le profil complet
    const syncProfileToCloud = useCallback(async (username: string, fullData: any) => {
        if (!isSupabaseConfigured) return;
        // Basic debounce logic handled by caller or simple rate limit here could be added
        await DB.saveUserProfile(username, fullData);
        // Also refresh leaderboard locally
        fetchLeaderboard(); 
    }, []);

    // --- FEATURE 2: HISTORICAL LEADERBOARD ---
    
    const fetchLeaderboard = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        const board = await DB.getGlobalLeaderboard();
        setGlobalLeaderboard(board);
    }, []);

    // Initial fetch
    useEffect(() => {
        if (isSupabaseConfigured) fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        onlineUsers, // Live presence + Local history
        globalLeaderboard, // Database history (All time)
        isConnectedToSupabase,
        isSupabaseConfigured,
        loginAndFetchProfile,
        syncProfileToCloud,
        refreshLeaderboard: fetchLeaderboard
    };
};
