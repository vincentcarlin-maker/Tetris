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
        if (state.isHost) {
            guestConnectionsRef.current.forEach(conn => conn.send(data));
        } else if (hostConnectionRef.current) {
            hostConnectionRef.current.send(data);
        }
    }, [state.isHost]);

    // Host-specific logic
    const broadcastPlayerList = useCallback(() => {
        const playerList = guestConnectionsRef.current
            .map(c => (c as any).playerInfo)
            .filter(Boolean);
        
        const hostInfo: PlayerInfo = { id: peerRef.current!.id, ...myInfoRef.current, inGame: (guestConnectionsRef.current[0] as any)?.playerInfo?.inGame ?? false };
        const fullList = [hostInfo, ...playerList];
        
        guestConnectionsRef.current.forEach(conn => conn.send({ type: 'PLAYER_LIST', players: fullList }));
        setState(prev => ({ ...prev, players: fullList }));
    }, []);
    
    const handleHostConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            guestConnectionsRef.current.push(conn);
            conn.on('data', (data) => handleDataReceived(data, conn));
            conn.on('close', () => {
                guestConnectionsRef.current = guestConnectionsRef.current.filter(c => c.peer !== conn.peer);
                broadcastPlayerList();
            });
        });
    }, [broadcastPlayerList]);


    // Data handler for both host and guest
    const handleDataReceived = useCallback((data: any, conn: DataConnection) => {
        // --- HOST LOGIC ---
        if (state.isHost) {
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

    }, [state.isHost, broadcastPlayerList]);

    const connectAsGuest = useCallback(() => {
        const peer = new Peer();
        peerRef.current = peer;
        peer.on('open', id => {
            const conn = peer.connect(LOBBY_ID);
            hostConnectionRef.current = conn;
            conn.on('open', () => {
                setState(prev => ({...prev, peerId: id, isConnected: true, isLoading: false, mode: 'lobby'}));
                conn.send({ type: 'HELLO', ...myInfoRef.current });
            });
            conn.on('data', (data) => handleDataReceived(data, conn));
            conn.on('close', () => {
                setState(prev => ({...prev, error: "Déconnecté du lobby."}));
                disconnect();
            });
            conn.on('error', () => {
                 setState(prev => ({...prev, error: "Erreur de connexion au lobby."}));
                 disconnect();
            });
        });
        peer.on('error', () => {
            setState(prev => ({...prev, error: "Impossible d'établir une connexion P2P."}));
            disconnect();
        });
    }, [disconnect, handleDataReceived]);

    const connectAsHost = useCallback(() => {
        const peer = new Peer(LOBBY_ID);
        peerRef.current = peer;
        peer.on('open', id => {
            const selfInfo: PlayerInfo = {id, ...myInfoRef.current, inGame: false};
            setState(prev => ({...prev, peerId: id, isHost: true, isConnected: true, isLoading: false, mode: 'lobby', players: [selfInfo]}));
        });
        peer.on('connection', handleHostConnection);
        peer.on('error', () => {
             setState(prev => ({...prev, error: "Le lobby est déjà pris ou une erreur est survenue."}));
             disconnect();
        });
    }, [disconnect, handleHostConnection]);

    const connect = useCallback(() => {
        disconnect();
        setState(prev => ({...prev, isLoading: true, error: null, mode: 'connecting'}));
        const tempPeer = new Peer();
        tempPeer.on('open', () => {
            const conn = tempPeer.connect(LOBBY_ID);
            const timeout = setTimeout(() => {
                conn.close();
                tempPeer.destroy();
                connectAsHost();
            }, 3000);
            conn.on('open', () => {
                clearTimeout(timeout);
                conn.close();
                tempPeer.destroy();
                connectAsGuest();
            });
             conn.on('error', () => {
                 clearTimeout(timeout);
                 tempPeer.destroy();
                 connectAsHost();
            });
        });
    }, [disconnect, connectAsHost, connectAsGuest]);

    const sendInvite = (targetId: string) => {
        const targetPlayer = state.players.find(p => p.id === targetId);
        if (targetPlayer) {
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