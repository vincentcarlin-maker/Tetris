
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface OnlineUser {
    id: string; // Peer ID
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
    // Initialize from local storage to show offline players immediately
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });
    
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
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                console.log('User left:', key);
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

    return {
        onlineUsers,
        isConnectedToSupabase,
        isSupabaseConfigured
    };
};
