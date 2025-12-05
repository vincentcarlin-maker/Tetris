
import { useState, useRef, useCallback, useEffect } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    extraInfo?: string; // Info additionnelle (ex: Difficulté du jeu, Stats, Social ID)
    status: 'idle' | 'hosting' | 'in_game';
}

export interface MultiplayerState {
    peerId: string | null;
    isConnected: boolean; // Connected to lobby host
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    mode: 'disconnected' | 'connecting' | 'lobby' | 'in_game';
    players: PlayerInfo[];
    gameOpponent: PlayerInfo | null;
    isMyTurn: boolean;
    amIP1: boolean; // Am I Player 1 (Game Creator/Host)?
}

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
    });
    
    const peerRef = useRef<Peer | null>(null);
    const hostConnectionRef = useRef<DataConnection | null>(null); // For guests
    const guestConnectionsRef = useRef<DataConnection[]>([]); // For host
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);
    const myInfoRef = useRef<{name: string, avatarId: string, extraInfo?: string}>({name: 'Joueur', avatarId: 'av_bot'});
    const isHostRef = useRef(false);
    
    // Track host status explicitly since it's not stored in a connection object
    const hostStatusRef = useRef<'idle' | 'hosting'>('idle');

    useEffect(() => {
        isHostRef.current = state.isHost;
    }, [state.isHost]);

    // --- HEARTBEAT & CLEANUP SYSTEM (Fixes Ghost Users) ---
    useEffect(() => {
        let interval: any;

        if (state.isHost && state.peerId) {
            interval = setInterval(() => {
                let listChanged = false;
                
                // Filter out closed or dead connections
                const activeConnections = guestConnectionsRef.current.filter(conn => {
                    if (!conn.open) {
                        listChanged = true;
                        return false; 
                    }
                    return true;
                });

                if (listChanged || activeConnections.length !== guestConnectionsRef.current.length) {
                    guestConnectionsRef.current = activeConnections;
                    broadcastPlayerList();
                } else {
                    // Optional: Send a PING to ensure connection is really alive
                    try {
                        activeConnections.forEach(conn => conn.send({ type: 'HEARTBEAT' }));
                    } catch (e) {
                        // Ignore send errors, clean up next tick
                    }
                }
            }, 3000); // Check every 3 seconds
        }

        return () => clearInterval(interval);
    }, [state.isHost, state.peerId]);

    // Handle Tab Close
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (hostConnectionRef.current) {
                hostConnectionRef.current.send({ type: 'DISCONNECTING' });
                hostConnectionRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);


    const disconnect = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        hostConnectionRef.current = null;
        guestConnectionsRef.current = [];
        hostStatusRef.current = 'idle';
        setState({
            peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
            mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
        });
    }, []);

    const sendData = useCallback((data: any) => {
        if (isHostRef.current) {
            guestConnectionsRef.current.forEach(conn => {
                if (conn.open) conn.send(data);
            });
        } else if (hostConnectionRef.current && hostConnectionRef.current.open) {
            hostConnectionRef.current.send(data);
        }
    }, []);

    const broadcastPlayerList = useCallback((hostStatusOverride?: string) => {
        if (!isHostRef.current || !peerRef.current) return;

        const guestPlayerList = guestConnectionsRef.current
            .map(c => (c as any).playerInfo)
            .filter(Boolean);

        const hostInGame = state.mode === 'in_game';
        // If override provided, use it. Otherwise fall back to state/ref logic.
        const currentHostStatus = hostStatusOverride || (hostInGame ? 'in_game' : hostStatusRef.current);
        const hostSelfInfo: PlayerInfo = { id: peerRef.current.id, ...myInfoRef.current, status: currentHostStatus as any };

        const fullList = [hostSelfInfo, ...guestPlayerList];
        
        guestConnectionsRef.current.forEach(conn => {
            if(conn.open) conn.send({ type: 'PLAYER_LIST', players: fullList });
        });
        setState(prev => ({ ...prev, players: fullList }));

    }, [state.mode]);
    
    // Core data handling logic
    const handleDataReceived = useCallback((data: any, conn: DataConnection) => {
        if (data.type === 'HEARTBEAT') return; // Ignore pings

        // --- HOST LOGIC ---
        if (isHostRef.current) {
            const senderId = conn.peer;
            const senderInfo = (conn as any).playerInfo;
            switch (data.type) {
                case 'HELLO':
                    (conn as any).playerInfo = { id: senderId, name: data.name, avatarId: data.avatarId, status: 'idle' };
                    broadcastPlayerList();
                    break;
                case 'DISCONNECTING':
                    // Explicit disconnect from guest
                    guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
                    broadcastPlayerList();
                    break;
                case 'UPDATE_INFO':
                    if (senderInfo) {
                        senderInfo.name = data.name;
                        senderInfo.avatarId = data.avatarId;
                        senderInfo.extraInfo = data.extraInfo;
                    }
                    broadcastPlayerList();
                    break;
                case 'CREATE_ROOM':
                    if (senderInfo) {
                        senderInfo.status = 'hosting';
                        senderInfo.extraInfo = data.extraInfo; // Store difficulty if passed
                    }
                    broadcastPlayerList();
                    break;
                case 'CANCEL_HOSTING':
                     if (senderInfo) senderInfo.status = 'idle';
                     broadcastPlayerList();
                     break;
                case 'JOIN_ROOM': {
                    const { targetId } = data;
                    
                    // Case 1: Guest wants to join Host (Me)
                    if (peerRef.current && targetId === peerRef.current.id) {
                         if (hostStatusRef.current === 'hosting') {
                             const joinerConn = conn;
                             const joinerInfo = (joinerConn as any).playerInfo;
                             
                             // Host enters game
                             hostStatusRef.current = 'idle'; 
                             
                             // Update Host State
                             setState(prev => ({
                                ...prev,
                                mode: 'in_game',
                                gameOpponent: joinerInfo,
                                isMyTurn: true,
                                amIP1: true // I am hosting the game, I am P1
                             }));

                             // Update Joiner State via message
                             const hostInfoForGuest = { id: peerRef.current.id, ...myInfoRef.current, status: 'in_game' };
                             joinerInfo.status = 'in_game';
                             
                             joinerConn.send({ type: 'GAME_START', opponent: hostInfoForGuest, starts: false });
                             broadcastPlayerList('in_game');
                         }
                         break;
                    }

                    // Case 2: Guest wants to join another Guest
                    const hosterConn = guestConnectionsRef.current.find(c => c.peer === targetId);
                    const joinerConn = conn;
                    
                    if (hosterConn && (hosterConn as any).playerInfo.status === 'hosting') {
                        const hosterInfo = (hosterConn as any).playerInfo;
                        const joinerInfo = (joinerConn as any).playerInfo;

                        hosterInfo.status = 'in_game';
                        joinerInfo.status = 'in_game';

                        hosterConn.send({ type: 'GAME_START', opponent: joinerInfo, starts: true });
                        joinerConn.send({ type: 'GAME_START', opponent: hosterInfo, starts: false });
                        broadcastPlayerList();
                    }
                    break;
                }
                case 'GAME_MOVE': {
                    // Relay move
                    if (state.gameOpponent && data.targetId === peerRef.current?.id) {
                         // Move directed at host
                         const relayData = { ...data, type: 'GAME_MOVE_RELAY' };
                         
                         // 1. Update Host Self
                         if(onDataCallbackRef.current) onDataCallbackRef.current(relayData);
                         
                         // 2. IMPORTANT: Send Relay back to Guest so they see the move confirmed
                         conn.send(relayData);
                    } else {
                         // Relay to another guest
                         const targetConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                         targetConn?.send({ ...data, type: 'GAME_MOVE_RELAY' });
                    }
                    break;
                }
                case 'LEAVE_GAME':
                     if (senderInfo) senderInfo.status = 'idle';
                     // If opponent was me (Host)
                     if (state.mode === 'in_game' && state.gameOpponent?.id === senderId) {
                         setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false, amIP1: false}));
                         hostStatusRef.current = 'idle';
                     } else {
                         // If opponent was another guest
                         const opponentConn = guestConnectionsRef.current.find(c => c.peer === data.opponentId);
                         if (opponentConn) {
                             (opponentConn as any).playerInfo.status = 'idle';
                             // Forward the leave message so they reset too
                             opponentConn.send({ type: 'LEAVE_GAME', opponentId: senderId }); 
                         }
                     }
                     broadcastPlayerList();
                     break;
                 case 'REMATCH_REQUEST':
                     // A guest wants a rematch
                     if (senderInfo) senderInfo.status = 'in_game';
                     // If opponent is me (Host)
                     if (state.mode === 'in_game' && state.gameOpponent?.id === senderId) {
                         // Host handles rematch locally
                         if(onDataCallbackRef.current) onDataCallbackRef.current({ type: 'REMATCH_START' });
                         conn.send({ type: 'REMATCH_START', opponent: { id: peerRef.current?.id, ...myInfoRef.current, status: 'in_game' }, starts: false });
                     } else {
                         // Opponent is guest
                         const opponentConnRematch = guestConnectionsRef.current.find(c => c.peer === data.opponentId);
                         if (opponentConnRematch) {
                             (opponentConnRematch as any).playerInfo.status = 'in_game';
                             conn.send({ type: 'REMATCH_START', opponent: (opponentConnRematch as any).playerInfo, starts: true });
                             opponentConnRematch.send({ type: 'REMATCH_START', opponent: senderInfo, starts: false });
                         }
                     }
                     broadcastPlayerList();
                     break;
                 // Forward other data types
                 case 'REACTION':
                 case 'CHAT':
                 case 'MEMORY_INIT':
                 case 'MEMORY_FLIP':
                 case 'BATTLESHIP_READY':
                 case 'BATTLESHIP_SHOT':
                 case 'BATTLESHIP_RESULT':
                     if (state.gameOpponent?.id === senderId) {
                         if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                     } else {
                         if (data.targetId) {
                              const tConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                              tConn?.send(data);
                         }
                     }
                     break;
                 default:
                     if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                     break;
            }
        } else {
            // --- GUEST LOGIC ---
            switch (data.type) {
                case 'PLAYER_LIST':
                    setState(prev => ({ ...prev, players: data.players }));
                    break;
                case 'GAME_START':
                    setState(prev => ({
                        ...prev,
                        mode: 'in_game',
                        gameOpponent: data.opponent,
                        isMyTurn: data.starts,
                        amIP1: !data.starts
                    }));
                    if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                    break;
                case 'GAME_MOVE_RELAY':
                case 'REACTION':
                case 'CHAT':
                case 'MEMORY_INIT':
                case 'MEMORY_FLIP':
                case 'BATTLESHIP_READY':
                case 'BATTLESHIP_SHOT':
                case 'BATTLESHIP_RESULT':
                case 'REMATCH_START':
                case 'LEAVE_GAME':
                    if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                    break;
            }
        }
    }, [state.mode, state.gameOpponent, broadcastPlayerList]);

    const connect = useCallback(() => {
        if (peerRef.current) return;

        setState(prev => ({ ...prev, isLoading: true, mode: 'connecting', error: null }));
        const id = 'neon_' + Math.random().toString(36).substr(2, 9);
        const peer = new Peer(id);

        peer.on('open', (id) => {
            setState(prev => ({ ...prev, peerId: id, isConnected: true, isLoading: false, mode: 'lobby' }));
            peerRef.current = peer;
            
            peer.on('connection', (conn) => {
                conn.on('open', () => {
                    // Accept as guest connection (we act as host for them)
                    guestConnectionsRef.current.push(conn);
                    conn.on('data', (data) => handleDataReceived(data, conn));
                    conn.on('close', () => {
                        guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c !== conn);
                        broadcastPlayerList();
                    });
                });
            });
        });

        peer.on('error', (err) => {
            console.error(err);
            setState(prev => ({ ...prev, error: 'Connection error', isLoading: false }));
        });
    }, [handleDataReceived, broadcastPlayerList]);

    const updateSelfInfo = useCallback((name: string, avatarId: string, extraInfo?: string) => {
        myInfoRef.current = { name, avatarId, extraInfo };
        if (hostConnectionRef.current && hostConnectionRef.current.open) {
            hostConnectionRef.current.send({ type: 'UPDATE_INFO', name, avatarId, extraInfo });
        }
        if (isHostRef.current) {
            broadcastPlayerList();
        }
    }, [broadcastPlayerList]);

    const createRoom = useCallback(() => {
        hostStatusRef.current = 'hosting';
        setState(prev => ({ ...prev, isHost: true }));
        updateSelfInfo(myInfoRef.current.name, myInfoRef.current.avatarId, myInfoRef.current.extraInfo);
    }, [updateSelfInfo]);

    const joinRoom = useCallback((targetPeerId: string) => {
        if (!peerRef.current) return;

        // CRITICAL FIX: Ensure clean connection state
        if (hostConnectionRef.current) {
            hostConnectionRef.current.close();
            hostConnectionRef.current = null;
        }

        const conn = peerRef.current.connect(targetPeerId);
        
        conn.on('open', () => {
            hostConnectionRef.current = conn;
            setState(prev => ({ ...prev, isHost: false }));
            conn.send({ type: 'HELLO', name: myInfoRef.current.name, avatarId: myInfoRef.current.avatarId });
            conn.send({ type: 'JOIN_ROOM', targetId: targetPeerId });
            
            conn.on('data', (data) => handleDataReceived(data, conn));
            conn.on('close', () => setState(prev => ({ ...prev, mode: 'disconnected', error: 'Host disconnected' })));
        });

        conn.on('error', (err) => {
            console.error("Connection failed", err);
            setState(prev => ({ ...prev, error: 'Failed to join room' }));
        });

    }, [handleDataReceived]);

    const sendGameMove = useCallback((moveData: any) => {
        if (state.mode !== 'in_game') return;
        const payload = { 
            type: 'GAME_MOVE', 
            targetId: state.gameOpponent?.id, 
            ...((typeof moveData === 'object') ? moveData : { col: moveData })
        };
        
        if (isHostRef.current) {
             const relayData = { ...payload, type: 'GAME_MOVE_RELAY', player: 1, nextPlayer: 2 };
             sendData(relayData);
             if(onDataCallbackRef.current) onDataCallbackRef.current(relayData);
        } else {
             sendData({ ...payload, player: 2 });
        }
    }, [state.mode, state.gameOpponent, sendData]);

    const setOnDataReceived = useCallback((cb: (data: any) => void) => {
        onDataCallbackRef.current = cb;
    }, []);

    const cancelHosting = useCallback(() => {
        hostStatusRef.current = 'idle';
        setState(prev => ({ ...prev, isHost: false, mode: 'lobby' }));
        sendData({ type: 'CANCEL_HOSTING' });
    }, [sendData]);

    const leaveGame = useCallback(() => {
        sendData({ type: 'LEAVE_GAME', opponentId: state.gameOpponent?.id });
        hostStatusRef.current = 'idle';
        setState(prev => ({ ...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false }));
    }, [sendData, state.gameOpponent]);

    const requestRematch = useCallback(() => {
        sendData({ type: 'REMATCH_REQUEST', opponentId: state.gameOpponent?.id });
    }, [sendData, state.gameOpponent]);

    return {
        ...state,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        updateSelfInfo,
        sendData,
        sendGameMove,
        setOnDataReceived,
        cancelHosting,
        leaveGame,
        requestRematch
    };
};
