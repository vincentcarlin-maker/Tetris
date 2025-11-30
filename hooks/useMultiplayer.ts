
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
    amIP1: boolean; // Am I Player 1 (Game Creator/Host)?
}

const LOBBY_ID = 'NEON-ARCADE-C4-LOBBY';

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
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
            mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
        });
    }, []);

    const sendData = useCallback((data: any) => {
        if (isHostRef.current) {
            guestConnectionsRef.current.forEach(conn => conn.send(data));
        } else if (hostConnectionRef.current) {
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
                    amIP1: data.starts // If I start, I am P1. If I don't, I am P2.
                }));
                break;
            case 'GAME_MOVE_RELAY':
                if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                break;
            case 'REMATCH_START':
                if(onDataCallbackRef.current) onDataCallbackRef.current(data);
                break;
            case 'LEAVE_GAME':
                setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false, amIP1: false}));
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
        // IMPORTANT: Attach 'data' listener immediately. 
        // Do not wait for 'open' event, as data might arrive immediately after connection is established but before 'open' fires on this side.
        conn.on('data', (data) => {
            handleDataRef.current?.(data, conn);
        });

        conn.on('open', () => {
            guestConnectionsRef.current.push(conn);
            // Broadcast here to ensure that if HELLO arrived before open, we now include this player in the list
            broadcastPlayerList();
        });

        conn.on('close', () => {
            guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
            broadcastPlayerList();
        });

        conn.on('error', (err) => {
             console.error("Connection error:", err);
             guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
             broadcastPlayerList();
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
                players: [selfInfo],
                amIP1: false
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
                        setState(prev => ({ ...prev, peerId: guestId, isHost: false, isConnected: true, isLoading: false, mode: 'lobby', amIP1: false }));
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
    
    const joinRoom = (targetId: string) => {
        if (isHostRef.current) {
            // I am the Lobby Host joining a Guest's room
            if (peerRef.current && targetId === peerRef.current.id) return;

            const targetConn = guestConnectionsRef.current.find(c => c.peer === targetId);
            if (targetConn && (targetConn as any).playerInfo?.status === 'hosting') {
                const targetInfo = (targetConn as any).playerInfo;
                targetInfo.status = 'in_game';
                
                const myInfo = { id: peerRef.current!.id, ...myInfoRef.current, status: 'in_game' };
                // Guest (Hoster) starts first usually
                targetConn.send({ type: 'GAME_START', opponent: myInfo, starts: true });
                
                hostStatusRef.current = 'idle';
                setState(prev => ({
                    ...prev,
                    mode: 'in_game',
                    gameOpponent: targetInfo,
                    isMyTurn: false,
                    amIP1: false // I joined, so I am P2
                }));
                
                broadcastPlayerList('in_game');
            }
        } else {
            // Guest sends request to Lobby Host
            sendData({ type: 'JOIN_ROOM', targetId });
        }
    };
    
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
             // Logic adjusted: Player number depends on who started
             const player = state.amIP1 ? 1 : 2;
             const nextPlayer = state.amIP1 ? 2 : 1;
             
             const moveData = {
                 type: 'GAME_MOVE',
                 col: colIndex,
                 player,
                 nextPlayer,
                 targetId: state.gameOpponent.id
             };

             // If I am host and playing against guest, handle locally for me + send to guest
             if (state.isHost) {
                 // Update me (Host)
                 if(onDataCallbackRef.current) onDataCallbackRef.current({ ...moveData, type: 'GAME_MOVE_RELAY' });
                 
                 // Update Guest
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
             setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false, amIP1: false}));
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
