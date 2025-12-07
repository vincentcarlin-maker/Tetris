
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface OnlineUser {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online';
    lastSeen: number;
    online_at: string;
}

export const useSupabase = (myPeerId: string | null, myName: string, myAvatar: string, myFrame: string) => {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
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
                const users: OnlineUser[] = [];
                
                for (const key in newState) {
                    // On ignore soi-même dans la liste des "autres"
                    if (key === myPeerId) continue;

                    const presence = newState[key][0] as any;
                    if (presence) {
                        users.push({
                            id: key, // Peer ID is the key
                            name: presence.name || 'Inconnu',
                            avatarId: presence.avatarId || 'av_bot',
                            frameId: presence.frameId,
                            status: 'online',
                            lastSeen: Date.now(),
                            online_at: presence.online_at
                        });
                    }
                }
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                console.log('User left:', key);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnectedToSupabase(true);
                    // Envoyer mon état initial
                    await channel.track({
                        name: myName,
                        avatarId: myAvatar,
                        frameId: myFrame,
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

    // Mettre à jour ma présence si mes infos changent
    useEffect(() => {
        if (channelRef.current && isConnectedToSupabase && myPeerId) {
            channelRef.current.track({
                name: myName,
                avatarId: myAvatar,
                frameId: myFrame,
                online_at: new Date().toISOString(),
            }).catch(console.error);
        }
    }, [myName, myAvatar, myFrame, isConnectedToSupabase, myPeerId]);

    return {
        onlineUsers,
        isConnectedToSupabase,
        isSupabaseConfigured
    };
};
