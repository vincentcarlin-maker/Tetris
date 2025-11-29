import { useState, useRef, useCallback, useEffect } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    inGame: boolean;
}

export interface MultiplayerState {
    peerId: string | null;
    isConnected: boolean; // Connected to lobby host
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    mode: 'disconnected' | 'connecting' | 'lobby' | 'in_game';
    players: PlayerInfo[];
    incomingInvite: PlayerInfo | null;
    outgoingInvite: { toId: string, toName: string } | null;
    gameOpponent: PlayerInfo | null;
    isMyTurn: boolean;
}

const LOBBY_ID = 'NEON-ARCADE-C4-LOBBY';

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], incomingInvite: null, outgoingInvite: null, gameOpponent: null, isMyTurn: false,
    });
    
    const peerRef = useRef<Peer | null>(null);
    const hostConnectionRef = useRef<DataConnection | null>(null); // For guests
    const guestConnectionsRef = useRef<DataConnection[]>([]); // For host
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);
    const myInfoRef = useRef<{name: string, avatarId: string}>({name: 'Joueur', avatarId: 'av_bot'});
    const isHostRef = useRef(false);

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
        setState({
            peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
            mode: 'disconnected', players: [], incomingInvite: null, outgoingInvite: null, gameOpponent: null, isMyTurn: false,
        });
    }, []);

    const sendData = useCallback((data: any) => {
        if (isHostRef.current) {
            // Host logic for sending data is more complex (relaying)
            // This is handled in specific functions like `sendInvite` etc.
            // For now, this is a placeholder if a generic broadcast is needed.
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

        // Host's inGame status is determined by its own state machine
        const hostInGame = state.mode === 'in_game';
        const hostSelfInfo: PlayerInfo = { id: peerRef.current.id, ...myInfoRef.current, inGame: hostInGame };

        const fullList = [hostSelfInfo, ...guestPlayerList];
        
        guestConnectionsRef.current.forEach(conn => conn.send({ type: 'PLAYER_LIST', players: fullList }));
        setState(prev => ({ ...prev, players: fullList }));

    }, [state.mode]);
    
    const handleDataReceived = useCallback((data: any, conn: DataConnection) => {
        // --- HOST LOGIC ---
        if (isHostRef.current) {
            const senderId = conn.peer;
            switch (data.type) {
                case 'HELLO':
                    (conn as any).playerInfo = { id: senderId, name: data.name, avatarId: data.avatarId, inGame: false };
                    broadcastPlayerList();
                    break;
                case 'INVITE': {
                    const targetConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                    const senderInfo = (conn as any).playerInfo;
                    if (targetConn && senderInfo) {
                        targetConn.send({ type: 'INVITE_REQUEST', from: senderInfo });
                    }
                    break;
                }
                case 'INVITE_RESPONSE': {
                    const { accepted, targetId } = data;
                    const guestA_Conn = conn;
                    const guestB_Conn = guestConnectionsRef.current.find(c => c.peer === targetId);

                    const respondToA = (payload: any) => guestA_Conn.send(payload);
                    const respondToB = (payload: any) => guestB_Conn?.send(payload);
                    
                    if (accepted && guestB_Conn) {
                        const playerA_Info = (guestA_Conn as any).playerInfo;
                        const playerB_Info = (guestB_Conn as any).playerInfo;
                        playerA_Info.inGame = true;
                        playerB_Info.inGame = true;
                        
                        respondToA({ type: 'GAME_START', opponent: playerB_Info, starts: false }); // B starts
                        respondToB({ type: 'GAME_START', opponent: playerA_Info, starts: true }); // A invites, so B accepts and starts
                        broadcastPlayerList();
                    } else {
                        guestB_Conn?.send({ type: 'INVITE_DECLINED', fromId: senderId });
                    }
                    break;
                }
                case 'GAME_MOVE': {
                    const targetConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                    targetConn?.send({ ...data, type: 'GAME_MOVE_RELAY' });
                    break;
                }
                case 'LEAVE_GAME':
                case 'REMATCH':
                     (conn as any).playerInfo.inGame = false;
                     const opponentConn = guestConnectionsRef.current.find(c => c.peer === data.opponentId);
                     if (opponentConn) {
                         (opponentConn as any).playerInfo.inGame = false;
                         if (data.type === 'REMATCH') {
                             const playerA_Info = (conn as any).playerInfo;
                             const playerB_Info = (opponentConn as any).playerInfo;
                             conn.send({ type: 'REMATCH_START', opponent: playerB_Info, starts: true });
                             opponentConn.send({ type: 'REMATCH_START', opponent: playerA_Info, starts: false });
                         }
                     }
                     broadcastPlayerList();
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
            case 'INVITE_REQUEST':
                setState(prev => ({...prev, incomingInvite: data.from}));
                break;
            case 'INVITE_DECLINED':
                setState(prev => ({...prev, outgoingInvite: null}));
                break;
            case 'GAME_START':
                setState(prev => ({
                    ...prev,
                    mode: 'in_game',
                    gameOpponent: data.opponent,
                    isMyTurn: data.starts,
                    incomingInvite: null,
                    outgoingInvite: null
                }));
                break;
            default:
                 if(onDataCallbackRef.current) onDataCallbackRef.current(data);
        }

    }, [broadcastPlayerList]);
    
    const handleHostConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            guestConnectionsRef.current.push(conn);
            conn.on('data', (data) => handleDataReceived(data, conn));
            conn.on('close', () => {
                guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
                broadcastPlayerList();
            });
        });
    }, [handleDataReceived, broadcastPlayerList]);

    const connect = useCallback(() => {
        disconnect();
        setState(prev => ({...prev, isLoading: true, error: null, mode: 'connecting'}));

        // --- Step 1: Attempt to become the host ---
        const peer = new Peer(LOBBY_ID);
        peerRef.current = peer;

        peer.on('open', id => {
            // SUCCESS: We are the host.
            const selfInfo: PlayerInfo = { id, ...myInfoRef.current, inGame: false };
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
                // FAILURE: Lobby ID is taken, so a host exists. Connect as a guest.
                peer.destroy(); // Destroy the failed host-attempt peer.
                
                // --- Step 2: Connect as a guest ---
                const guestPeer = new Peer(); // Create a new peer with a random ID.
                peerRef.current = guestPeer;

                guestPeer.on('open', guestId => {
                    const conn = guestPeer.connect(LOBBY_ID);
                    hostConnectionRef.current = conn;
                    
                    conn.on('open', () => {
                        setState(prev => ({ ...prev, peerId: guestId, isHost: false, isConnected: true, isLoading: false, mode: 'lobby' }));
                        conn.send({ type: 'HELLO', ...myInfoRef.current });
                    });
                    conn.on('data', (data) => handleDataReceived(data, conn));
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
                // Some other PeerJS error occurred
                setState(prev => ({ ...prev, error: `Erreur PeerJS: ${err.type}`, isLoading: false, mode: 'disconnected' }));
                disconnect();
            }
        });
    }, [disconnect, handleHostConnection, handleDataReceived]);

    const sendInvite = (targetId: string) => {
        const targetPlayer = state.players.find(p => p.id === targetId);
        if (targetPlayer) {
            // All invites are sent to the host for relaying
            sendData({ type: 'INVITE', targetId });
            setState(prev => ({ ...prev, outgoingInvite: { toId: targetId, toName: targetPlayer.name } }));
        }
    };
    
    const acceptInvite = (fromId: string) => {
        sendData({ type: 'INVITE_RESPONSE', accepted: true, targetId: fromId });
        setState(prev => ({ ...prev, incomingInvite: null }));
    };

    const declineInvite = (fromId: string) => {
        sendData({ type: 'INVITE_RESPONSE', accepted: false, targetId: fromId });
        setState(prev => ({ ...prev, incomingInvite: null }));
    };

    const sendGameMove = (colIndex: number) => {
        if (state.mode === 'in_game' && state.gameOpponent) {
             const player = state.isHost ? 1 : 2;
             const nextPlayer = state.isHost ? 2 : 1;
             sendData({
                 type: 'GAME_MOVE',
                 col: colIndex,
                 player,
                 nextPlayer,
                 targetId: state.gameOpponent.id
             });
        }
    };

    const leaveGame = () => {
        if (state.mode === 'in_game' && state.gameOpponent) {
             sendData({ type: 'LEAVE_GAME', opponentId: state.gameOpponent.id });
             setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false}));
        }
    };
    
    useEffect(() => {
        if (state.mode === 'in_game' && state.gameOpponent) {
             const isMyTurnNow = (state.isHost && state.gameOpponent.inGame) || (!state.isHost && !state.gameOpponent.inGame);
             // This logic seems complex. Let's simplify turn management.
             // The move itself will dictate the next turn.
        }
    }, [state.players, state.mode, state.gameOpponent, state.isHost]);


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
        sendInvite,
        acceptInvite,
        declineInvite,
        sendGameMove,
        leaveGame
    };
};
