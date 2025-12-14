
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PlayerInfo {
    id: string;
    name: string;
    avatarId: string;
    extraInfo?: string;
    status: 'idle' | 'hosting' | 'in_game';
    malletId?: string;
}

export interface MultiplayerState {
    peerId: string | null;
    isConnected: boolean;
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    mode: 'disconnected' | 'connecting' | 'lobby' | 'in_game';
    players: PlayerInfo[];
    gameOpponent: PlayerInfo | null;
    isMyTurn: boolean;
    amIP1: boolean;
}

type DataCallback = (data: any, conn: any) => void;

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
    });

    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // Supabase Channels
    const lobbyChannelRef = useRef<RealtimeChannel | null>(null);
    const gameChannelRef = useRef<RealtimeChannel | null>(null);
    const subscribersRef = useRef<Set<DataCallback>>(new Set());
    
    // User Info
    const myInfoRef = useRef<{name: string, avatarId: string, extraInfo?: string, malletId?: string}>({name: 'Joueur', avatarId: 'av_bot', malletId: 'm_classic'});

    const myIdRef = useRef<string | null>(null);

    // --- UTILS ---
    const notifySubscribers = useCallback((data: any, senderId: string) => {
        // Mock connection object for compatibility with existing game code
        const mockConn = { peer: senderId };
        subscribersRef.current.forEach(cb => cb(data, mockConn));
    }, []);

    // --- CONNECTION ---
    const connect = useCallback(() => {
        if (!isSupabaseConfigured || !supabase) {
            setState(prev => ({ ...prev, error: "Serveur non configuré" }));
            return;
        }
        if (lobbyChannelRef.current) return;

        setState(prev => ({ ...prev, isLoading: true, mode: 'connecting', error: null }));

        // Get or Create Persistent ID
        let id = localStorage.getItem('neon_social_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', id);
        }
        myIdRef.current = id;

        // Join Global Lobby
        const channel = supabase.channel('neon_lobby', {
            config: { presence: { key: id } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const playerList: PlayerInfo[] = [];
                
                Object.keys(newState).forEach(key => {
                    const presence = newState[key][0] as any;
                    if (presence) {
                        playerList.push({
                            id: key,
                            name: presence.name || 'Inconnu',
                            avatarId: presence.avatarId || 'av_bot',
                            status: presence.status || 'idle',
                            extraInfo: presence.extraInfo,
                            malletId: presence.malletId
                        });
                    }
                });
                setState(prev => ({ ...prev, players: playerList }));
            })
            .on('broadcast', { event: 'dm' }, ({ payload }) => {
                // Handle Direct Messages (Signaling) targeted at me
                if (payload.to === myIdRef.current) {
                    handleSignalingMessage(payload.from, payload.data);
                }
            })
            .on('broadcast', { event: 'admin_broadcast' }, ({ payload }) => {
                // Global Admin Events
                window.dispatchEvent(new CustomEvent('neon_admin_event', { detail: payload }));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        name: myInfoRef.current.name,
                        avatarId: myInfoRef.current.avatarId,
                        extraInfo: myInfoRef.current.extraInfo,
                        malletId: myInfoRef.current.malletId,
                        status: 'idle'
                    });
                    setState(prev => ({ 
                        ...prev, 
                        isConnected: true, 
                        peerId: id, 
                        mode: 'lobby', 
                        isLoading: false 
                    }));
                }
            });

        lobbyChannelRef.current = channel;
    }, []);

    const disconnect = useCallback(() => {
        if (gameChannelRef.current) supabase?.removeChannel(gameChannelRef.current);
        if (lobbyChannelRef.current) supabase?.removeChannel(lobbyChannelRef.current);
        gameChannelRef.current = null;
        lobbyChannelRef.current = null;
        setState(prev => ({ ...prev, isConnected: false, mode: 'disconnected' }));
    }, []);

    const updateSelfInfo = useCallback((name: string, avatarId: string, malletId?: string, extraInfo?: string) => {
        myInfoRef.current = { name, avatarId, extraInfo, malletId: malletId || 'm_classic' };
        if (lobbyChannelRef.current) {
            const currentStatus = stateRef.current.isHost ? 'hosting' : (stateRef.current.mode === 'in_game' ? 'in_game' : 'idle');
            lobbyChannelRef.current.track({
                name,
                avatarId,
                extraInfo,
                malletId: malletId || 'm_classic',
                status: currentStatus
            });
        }
    }, []);

    // --- GAME ROOM LOGIC ---

    // Handle Incoming Signals (Lobby Level)
    const handleSignalingMessage = (senderId: string, data: any) => {
        // Pass generic messages (Friend requests, Chat) to subscribers
        if (data.type !== 'JOIN_REQUEST' && data.type !== 'GAME_START_ACK') {
            notifySubscribers(data, senderId);
        }

        // Host Logic: Handle Join Request
        if (data.type === 'JOIN_REQUEST') {
            if (stateRef.current.isHost) {
                // Accept joiner - Attempt to find via presence first
                const presenceInfo = stateRef.current.players.find(p => p.id === senderId);
                
                // Fallback / Merge with payload data (malletId is critical here)
                const opponentInfo: PlayerInfo = {
                    id: senderId,
                    name: presenceInfo?.name || 'Opposant',
                    avatarId: presenceInfo?.avatarId || 'av_bot',
                    status: 'in_game',
                    malletId: data.malletId || presenceInfo?.malletId || 'm_classic'
                };
                
                setState(prev => ({
                    ...prev,
                    mode: 'in_game',
                    gameOpponent: opponentInfo,
                    isMyTurn: true,
                    amIP1: true
                }));

                // Update Lobby Presence
                lobbyChannelRef.current?.track({
                    ...myInfoRef.current,
                    status: 'in_game'
                });

                // Send ACK to Joiner so they switch to Game Mode
                sendTo(senderId, { 
                    type: 'GAME_START_ACK', 
                    opponent: { id: myIdRef.current, ...myInfoRef.current, status: 'in_game' },
                    starts: false 
                });
            }
        }
        
        // Guest Logic: Handle Game Start Ack
        if (data.type === 'GAME_START_ACK') {
            setState(prev => ({
                ...prev,
                mode: 'in_game',
                gameOpponent: data.opponent,
                isMyTurn: data.starts,
                amIP1: false,
                isHost: false
            }));
            
            // Update Lobby Presence
            lobbyChannelRef.current?.track({
                ...myInfoRef.current,
                status: 'in_game'
            });
            
            // Trigger subscribers (Games need to know game started)
            notifySubscribers({ type: 'GAME_START', opponent: data.opponent, starts: data.starts }, senderId);
        }
    };

    // Handle Game Channel Events (Gameplay)
    const handleGameEvent = (payload: any) => {
        // Filter out my own messages (Supabase broadcasts echo back)
        if (payload.from === myIdRef.current) return;
        notifySubscribers(payload.data, payload.from);
        
        // Internal Logic for Leaving
        if (payload.data.type === 'LEAVE_GAME') {
            leaveGameInternal();
        }
    };

    const subscribeToGameChannel = (roomId: string) => {
        if (gameChannelRef.current) supabase?.removeChannel(gameChannelRef.current);
        
        const channel = supabase!.channel(`room_${roomId}`, {
            config: { broadcast: { self: false } } 
        });

        channel
            .on('broadcast', { event: 'game_data' }, ({ payload }) => handleGameEvent(payload))
            .subscribe();

        gameChannelRef.current = channel;
    };

    const createRoom = useCallback(() => {
        if (!myIdRef.current) return;
        
        setState(prev => ({ ...prev, isHost: true }));
        
        // Update Status in Lobby
        lobbyChannelRef.current?.track({
            ...myInfoRef.current,
            status: 'hosting'
        });

        // Subscribe to my own room channel
        subscribeToGameChannel(myIdRef.current);

    }, []);

    const joinRoom = useCallback((hostId: string) => {
        // 1. Subscribe to Host's room channel
        subscribeToGameChannel(hostId);
        
        // 2. Signal Host via Lobby DM to initiate handshake
        // Explicitly send malletId here to ensure host sees it immediately
        sendTo(hostId, { 
            type: 'JOIN_REQUEST', 
            malletId: myInfoRef.current.malletId 
        });
        
    }, []);

    const sendData = useCallback((data: any) => {
        // Send to Game Channel if in game
        if (stateRef.current.mode === 'in_game' && gameChannelRef.current) {
            gameChannelRef.current.send({
                type: 'broadcast',
                event: 'game_data',
                payload: { from: myIdRef.current, data }
            });
        }
    }, []);

    const sendTo = useCallback((targetId: string, data: any) => {
        // Send Direct Message via Lobby Broadcast
        if (lobbyChannelRef.current) {
            lobbyChannelRef.current.send({
                type: 'broadcast',
                event: 'dm',
                payload: { from: myIdRef.current, to: targetId, data }
            });
        }
    }, []);

    const sendAdminBroadcast = useCallback((message: string, type: 'info' | 'warning' | 'reload' | 'game_config' = 'info', data?: any) => {
        if (lobbyChannelRef.current) {
            lobbyChannelRef.current.send({
                type: 'broadcast',
                event: 'admin_broadcast',
                payload: { message, type, data, timestamp: Date.now() }
            });
        }
    }, []);

    const leaveGameInternal = () => {
        if (gameChannelRef.current) {
            supabase?.removeChannel(gameChannelRef.current);
            gameChannelRef.current = null;
        }
        
        lobbyChannelRef.current?.track({
            ...myInfoRef.current,
            status: 'idle'
        });

        setState(prev => ({ 
            ...prev, 
            mode: 'lobby', 
            gameOpponent: null, 
            isMyTurn: false, 
            isHost: false 
        }));
    };

    const leaveGame = useCallback(() => {
        sendData({ type: 'LEAVE_GAME' });
        leaveGameInternal();
    }, [sendData]);

    const cancelHosting = useCallback(() => {
        if (gameChannelRef.current) {
            supabase?.removeChannel(gameChannelRef.current);
            gameChannelRef.current = null;
        }
        lobbyChannelRef.current?.track({
            ...myInfoRef.current,
            status: 'idle'
        });
        setState(prev => ({ ...prev, isHost: false, mode: 'lobby' }));
    }, []);

    const sendGameMove = useCallback((moveData: any) => {
        const payload = {
            type: 'GAME_MOVE',
            ...((typeof moveData === 'object') ? moveData : { col: moveData })
        };
        sendData(payload);
    }, [sendData]);

    const requestRematch = useCallback(() => {
        sendData({ type: 'REMATCH_START' });
        // Local trigger
        notifySubscribers({ type: 'REMATCH_START' }, stateRef.current.gameOpponent?.id || '');
    }, [sendData]);

    // Helpers for compatibility
    const connectTo = useCallback((id: string) => {}, []);

    const subscribe = useCallback((callback: DataCallback) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    return {
        ...state,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        updateSelfInfo,
        sendData,
        sendTo,
        sendGameMove,
        subscribe,
        cancelHosting,
        leaveGame,
        requestRematch,
        connectTo,
        sendAdminBroadcast
    };
};
