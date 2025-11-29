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
        const hostStatus = hostInGame ? 'in_game' : 'idle';
        const hostSelfInfo: PlayerInfo = { id: peerRef.current.id, ...myInfoRef.current, status: hostStatus };

        const fullList = [hostSelfInfo, ...guestPlayerList];
        
        guestConnectionsRef.current.forEach(conn => conn.send({ type: 'PLAYER_LIST', players: fullList }));
        setState(prev => ({ ...prev, players: fullList }));

    }, [state.mode]);
    
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
                    const targetConn = guestConnectionsRef.current.find(c => c.peer === data.targetId);
                    targetConn?.send({ ...data, type: 'GAME_MOVE_RELAY' });
                    break;
                }
                case 'LEAVE_GAME':
                     senderInfo.status = 'idle';
                     const opponentConn = guestConnectionsRef.current.find(c => c.peer === data.opponentId);
                     if (opponentConn) {
                         (opponentConn as any).playerInfo.status = 'idle';
                     }
                     broadcastPlayerList();
                     break;
                 case 'REMATCH':
                     senderInfo.status = 'in_game';
                     const opponentConnRematch = guestConnectionsRef.current.find(c => c.peer === data.opponentId);
                     if (opponentConnRematch) {
                         (opponentConnRematch as any).playerInfo.status = 'in_game';
                         conn.send({ type: 'REMATCH_START', opponent: (opponentConnRematch as any).playerInfo, starts: true });
                         opponentConnRematch.send({ type: 'REMATCH_START', opponent: senderInfo, starts: false });
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
            case 'GAME_START':
                setState(prev => ({
                    ...prev,
                    mode: 'in_game',
                    gameOpponent: data.opponent,
                    isMyTurn: data.starts,
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

        const peer = new Peer(LOBBY_ID);
        peerRef.current = peer;

        peer.on('open', id => {
            const selfInfo: PlayerInfo = { id, ...myInfoRef.current, status: 'idle' };
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
                setState(prev => ({ ...prev, error: `Erreur PeerJS: ${err.type}`, isLoading: false, mode: 'disconnected' }));
                disconnect();
            }
        });
    }, [disconnect, handleHostConnection, handleDataReceived]);

    const createRoom = () => sendData({ type: 'CREATE_ROOM' });
    const joinRoom = (targetId: string) => sendData({ type: 'JOIN_ROOM', targetId });
    const cancelHosting = () => sendData({ type: 'CANCEL_HOSTING' });

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
        leaveGame
    };
};