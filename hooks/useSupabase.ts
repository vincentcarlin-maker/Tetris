
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
            if (stored) {
                const parsed = JSON.parse(stored);
                // On force hors-ligne au chargement, le temps réel fera le reste
                return parsed.map((u: any) => ({ ...u, status: 'offline', gameActivity: undefined }));
            }
            return [];
        } catch (e) {
            return [];
        }
    });
    
    const [globalLeaderboard, setGlobalLeaderboard] = useState<OnlineUser[]>([]);
    const [isConnectedToSupabase, setIsConnectedToSupabase] = useState(false);
    const channelRef = useRef<any>(null);

    // Récupération de l'ID persistant pour la présence
    const getPersistentId = () => {
        let id = localStorage.getItem('neon_social_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', id);
        }
        return id;
    };

    const socialId = myPeerId || getPersistentId();

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase || !myName || myName === "Joueur Néon") return;

        const channel = supabase.channel('global_presence', {
            config: { presence: { key: socialId } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const currentOnlineMap = new Map<string, OnlineUser>();
                
                for (const key in newState) {
                    if (key === socialId) continue;

                    const presence = newState[key][0] as any;
                    if (presence && presence.name) {
                        currentOnlineMap.set(key, {
                            id: key,
                            name: presence.name,
                            avatarId: presence.avatarId || 'av_bot',
                            frameId: presence.frameId,
                            status: 'online',
                            lastSeen: Date.now(),
                            online_at: presence.online_at || new Date().toISOString(),
                            stats: presence.stats || {},
                            gameActivity: presence.gameActivity
                        });
                    }
                }

                setOnlineUsers(prev => {
                    const mergedMap = new Map<string, OnlineUser>();
                    // 1. On garde l'historique mais en mode offline
                    prev.forEach(u => {
                        mergedMap.set(u.id, { ...u, status: 'offline' });
                    });
                    // 2. On écrase avec les vrais gens connectés
                    currentOnlineMap.forEach((u, key) => {
                        mergedMap.set(key, u);
                    });

                    const newList = Array.from(mergedMap.values());
                    const sorted = newList.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 100);
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(sorted));
                    return sorted;
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
                }
            });

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [socialId, myName]);

    // Update auto lors des changements d'activité ou de profil
    useEffect(() => {
        if (channelRef.current && isConnectedToSupabase) {
            channelRef.current.track({
                name: myName,
                avatarId: myAvatar,
                frameId: myFrame,
                stats: myStats,
                gameActivity: currentGame,
                online_at: new Date().toISOString(),
            }).catch(() => {});
        }
    }, [myName, myAvatar, myFrame, myStats, currentGame, isConnectedToSupabase]);

    const loginAndFetchProfile = useCallback(async (username: string) => {
        if (!isSupabaseConfigured) return null;
        return await DB.getUserProfile(username);
    }, []);

    const syncProfileToCloud = useCallback(async (username: string, fullData: any) => {
        if (!isSupabaseConfigured) return;
        await DB.saveUserProfile(username, fullData);
        fetchLeaderboard(); 
    }, []);

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
