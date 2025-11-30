
import { useState, useRef, useCallback, useEffect } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
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
}

const LOBBY_ID = 'NEON-ARCADE-C4-LOBBY';

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false,
    });
    
    const peerRef = useRef<Peer | null>(null);
    const hostConnectionRef = useRef<DataConnection | null>(null); // For guests
    const guestConnectionsRef = useRef<DataConnection[]>([]); // For host
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);
    const myInfoRef = useRef<{name: string, avatarId: string}>({name: 'Joueur', avatarId: 'av_bot'});
    const isHostRef = useRef(false);
    
    // Track host status explicitly since it's not stored in a connection object
    const hostStatusRef = useRef<'idle' | 'hosting'>('idle');

    useEffect(() => {
        isHostRef.current = state.isHost;
    }, [state.isHost]);

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
            mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false,
        });
    }, []);

    const sendData = useCallback((data: any) => {
        if (isHostRef.current) {
            guestConnectionsRef.current.forEach(conn => conn.send(data));
        } else if (hostConnectionRef.current) {
            hostConnectionRef.current.send(data);
        }
    }, []);

    const broadcastPlayerList = useCallback(() => {
        if (!isHostRef.current || !peerRef.current) return;

        const guestPlayerList = guestConnectionsRef.current
            .map(c => (c as any).playerInfo)
            .filter(Boolean);

        const hostInGame = state.mode === 'in_game';
        // If in game, status is in_game. If not, check our explicit host waiting status.
        const hostStatus = hostInGame ? 'in_game' : hostStatusRef.current;
        const hostSelfInfo: PlayerInfo = { id: peerRef.current.id, ...myInfoRef.current, status: hostStatus };

        const fullList = [hostSelfInfo, ...guestPlayerList];
        
        guestConnectionsRef.current.forEach(conn => conn.send({ type: 'PLAYER_LIST', players: fullList }));
        setState(prev => ({ ...prev, players: fullList }));

    }, [state.mode]);
    
    // Core data handling logic
    const handleDataReceived = useCallback((data: any, conn: DataConnection) => {
        // --- HOST LOGIC ---
        if (isHostRef.current) {
            const senderId = conn.peer;
            const senderInfo = (conn as any).playerInfo;
            switch (data.type) {
                case 'HELLO':
                    (conn as any).playerInfo = { id: senderId, name: data.name, avatarId: data.avatarId, status: 'idle' };
                    broadcastPlayerList();
                    break;
                case 'CREATE_ROOM':
                    if (senderInfo) senderInfo.status = 'hosting';
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
                                isMyTurn: true
                             }));

                             // Update Joiner State via message
                             const hostInfoForGuest = { id: peerRef.current.id, ...myInfoRef.current, status: 'in_game' };
                             joinerInfo.status = 'in_game';
                             
                             joinerConn.send({ type: 'GAME_START', opponent: hostInfoForGuest, starts: false });
                             broadcastPlayerList();
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
                         // Using 'conn' directly ensures we reply to the exact person who sent it
                         conn.send(relayData);
                    } else {
                         // Relay to another guest
                         const targetConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                         targetConn?.send({ ...data, type: 'GAME_MOVE_RELAY' });
                    }
                    break;
                }
                case 'LEAVE_GAME':
                     senderInfo.status = 'idle';
                     // If opponent was me (Host)
                     if (state.mode === 'in_game' && state.gameOpponent?.id === senderId) {
                         setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false}));
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
                     senderInfo.status = 'in_game';
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
                 // Forward other data types (Reaction, Chat)
                 case 'REACTION':
                 case 'CHAT':
                     if (state.gameOpponent?.id === senderId) {
                         // For Host
                         if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                     } else {
                         // Relay to guest opponent
                         if (data.targetId) {
                              const tConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                              tConn?.send(data);
                         }
                     }
                     break;
                 default:
                     if(onDataCallbackRef.current) onDataCallbackRef.current(data);
            }
            return;
        }

        // --- GUEST LOGIC ---
        switch (data.type) {
            case 'PLAYER_LIST':
                setState(prev => ({...prev, players: data.players}));
                break;
            case 'GAME_START':
                setState(prev => ({
                    ...prev,
                    mode: 'in_game',
                    gameOpponent: data.opponent,
                    isMyTurn: data.starts,
                }));
                break;
            case 'GAME_MOVE_RELAY':
                if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                break;
            case 'REMATCH_START':
                if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                break;
            case 'LEAVE_GAME':
                setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false}));
                break;
            default:
                 if(onDataCallbackRef.current) onDataCallbackRef.current(data);
        }

    }, [broadcastPlayerList, state.mode, state.gameOpponent, state.players]);

    // Use a Ref to ensure the event listener always uses the latest version of handleDataReceived
    const handleDataRef = useRef(handleDataReceived);
    useEffect(() => {
        handleDataRef.current = handleDataReceived;
    }, [handleDataReceived]);
    
    const handleHostConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            guestConnectionsRef.current.push(conn);
            conn.on('data', (data) => {
                handleDataRef.current?.(data, conn);
            });
            conn.on('close', () => {
                guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
                broadcastPlayerList();
            });
        });
    }, [broadcastPlayerList]); 

    const connect = useCallback(() => {
        disconnect();
        setState(prev => ({...prev, isLoading: true, error: null, mode: 'connecting'}));

        const peer = new Peer(LOBBY_ID);
        peerRef.current = peer;

        peer.on('open', id => {
            const selfInfo: PlayerInfo = { id, ...myInfoRef.current, status: 'idle' };
            hostStatusRef.current = 'idle';
            setState(prev => ({
                ...prev,
                peerId: id,
                isHost: true,
                isConnected: true,
                isLoading: false,
                mode: 'lobby',
                players: [selfInfo]
            }));
            peer.on('connection', handleHostConnection);
        });

        peer.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
                peer.destroy();
                const guestPeer = new Peer();
                peerRef.current = guestPeer;
                guestPeer.on('open', guestId => {
                    const conn = guestPeer.connect(LOBBY_ID);
                    hostConnectionRef.current = conn;
                    
                    conn.on('open', () => {
                        setState(prev => ({ ...prev, peerId: guestId, isHost: false, isConnected: true, isLoading: false, mode: 'lobby' }));
                        conn.send({ type: 'HELLO', ...myInfoRef.current });
                    });
                    conn.on('data', (data) => {
                        handleDataRef.current?.(data, conn);
                    });
                    conn.on('close', () => {
                        setState(prev => ({ ...prev, error: "Déconnecté du lobby." }));
                        disconnect();
                    });
                    conn.on('error', (connErr) => {
                         setState(prev => ({ ...prev, error: `Erreur de connexion au lobby: ${connErr.type}` }));
                         disconnect();
                    });
                });
                guestPeer.on('error', (guestErr) => {
                    setState(prev => ({ ...prev, error: `Impossible de créer un peer invité: ${guestErr.type}` }));
                    disconnect();
                });
            } else {
                setState(prev => ({ ...prev, error: `Erreur PeerJS: ${err.type}`, isLoading: false, mode: 'disconnected' }));
                disconnect();
            }
        });
    }, [disconnect, handleHostConnection]); 

    const createRoom = () => {
        if (isHostRef.current) {
            hostStatusRef.current = 'hosting';
            // Force state update to ensure UI sees the change
            setState(prev => ({ ...prev, mode: 'lobby' })); 
            broadcastPlayerList();
        } else {
            sendData({ type: 'CREATE_ROOM' });
        }
    };
    
    const joinRoom = (targetId: string) => sendData({ type: 'JOIN_ROOM', targetId });
    
    const cancelHosting = () => {
        if (isHostRef.current) {
            hostStatusRef.current = 'idle';
            setState(prev => ({ ...prev, mode: 'lobby' })); 
            broadcastPlayerList();
        } else {
            sendData({ type: 'CANCEL_HOSTING' });
        }
    };

    const sendGameMove = (colIndex: number) => {
        if (state.mode === 'in_game' && state.gameOpponent) {
             const player = state.isHost ? 1 : 2;
             const nextPlayer = state.isHost ? 2 : 1;
             
             const moveData = {
                 type: 'GAME_MOVE',
                 col: colIndex,
                 player,
                 nextPlayer,
                 targetId: state.gameOpponent.id
             };

             // If I am host and playing against guest, handle locally for me + send to guest
             if (state.isHost) {
                 if(onDataCallbackRef.current) onDataCallbackRef.current({ ...moveData, type: 'GAME_MOVE_RELAY' });
                 // Find guest conn
                 const guestConn = guestConnectionsRef.current.find(c => c.peer === state.gameOpponent!.id);
                 guestConn?.send({ ...moveData, type: 'GAME_MOVE_RELAY' });
             } else {
                 // Guest sending to host (who relays)
                 sendData(moveData);
             }
        }
    };

    const requestRematch = () => {
        if (state.mode === 'in_game' && state.gameOpponent) {
            if (state.isHost) {
                // Host initiates rematch
                // 1. Notify Guest
                const guestConn = guestConnectionsRef.current.find(c => c.peer === state.gameOpponent!.id);
                guestConn?.send({ type: 'REMATCH_START', opponent: { id: peerRef.current?.id, ...myInfoRef.current, status: 'in_game' }, starts: false });
                
                // 2. Notify Self (Host)
                if(onDataCallbackRef.current) onDataCallbackRef.current({ type: 'REMATCH_START' });
            } else {
                // Guest requests rematch from Host
                sendData({ type: 'REMATCH_REQUEST', opponentId: state.gameOpponent.id });
            }
        }
    };

    const leaveGame = () => {
        if (state.mode === 'in_game' && state.gameOpponent) {
             sendData({ type: 'LEAVE_GAME', opponentId: state.gameOpponent.id });
             setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false}));
             if (state.isHost) {
                 hostStatusRef.current = 'idle';
                 broadcastPlayerList();
             }
        }
    };

    const updateSelfInfo = useCallback((name: string, avatarId: string) => {
        myInfoRef.current = { name, avatarId };
    }, []);

    const setOnDataReceived = useCallback((callback: ((data: any) => void) | null) => {
        onDataCallbackRef.current = callback;
    }, []);

    return {
        ...state,
        connect,
        disconnect,
        sendData,
        updateSelfInfo,
        setOnDataReceived,
        createRoom,
        joinRoom,
        cancelHosting,
        sendGameMove,
        requestRematch,
        leaveGame
    };
};
