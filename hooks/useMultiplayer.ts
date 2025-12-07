
import { useState, useRef, useCallback, useEffect } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    extraInfo?: string; // Info additionnelle (ex: Difficulté du jeu, Stats, Social ID, Game ID when hosting)
    status: 'idle' | 'hosting' | 'in_game';
}

export interface MultiplayerState {
    peerId: string | null;
    isConnected: boolean; // Connected to lobby host or network
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    mode: 'disconnected' | 'connecting' | 'lobby' | 'in_game';
    players: PlayerInfo[];
    gameOpponent: PlayerInfo | null;
    isMyTurn: boolean;
    amIP1: boolean; // Am I Player 1 (Game Creator/Host)?
}

type DataCallback = (data: any, conn: DataConnection) => void;

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
        mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
    });
    
    // Create a Ref to hold the latest state to avoid stale closures in event listeners
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const peerRef = useRef<Peer | null>(null);
    
    // Unified connection management
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
    
    // Subscribers for data events
    const subscribersRef = useRef<Set<DataCallback>>(new Set());

    const myInfoRef = useRef<{name: string, avatarId: string, extraInfo?: string}>({name: 'Joueur', avatarId: 'av_bot'});
    const isHostRef = useRef(false);
    
    // Track host status explicitly since it's not stored in a connection object
    const hostStatusRef = useRef<'idle' | 'hosting'>('idle');

    useEffect(() => {
        isHostRef.current = state.isHost;
    }, [state.isHost]);

    // --- HEARTBEAT & CLEANUP SYSTEM ---
    useEffect(() => {
        let interval: any;

        if (state.peerId) {
            interval = setInterval(() => {
                // If hosting, broadcast list to everyone
                if (state.isHost) {
                    broadcastPlayerList();
                }
                
                // Cleanup closed connections
                connectionsRef.current.forEach((conn, key) => {
                    if (!conn.open) {
                        connectionsRef.current.delete(key);
                    }
                });
            }, 3000); // Check every 3 seconds
        }

        return () => clearInterval(interval);
    }, [state.isHost, state.peerId]);

    // Handle Tab Close
    useEffect(() => {
        const handleBeforeUnload = () => {
            connectionsRef.current.forEach(conn => {
                if (conn.open) conn.send({ type: 'DISCONNECTING' });
                conn.close();
            });
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const subscribe = useCallback((callback: DataCallback) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    const notifySubscribers = useCallback((data: any, conn: DataConnection) => {
        subscribersRef.current.forEach(cb => cb(data, conn));
    }, []);

    const disconnect = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        connectionsRef.current.clear();
        hostStatusRef.current = 'idle';
        setState({
            peerId: null, isConnected: false, isHost: false, error: null, isLoading: false,
            mode: 'disconnected', players: [], gameOpponent: null, isMyTurn: false, amIP1: false
        });
    }, []);

    const sendData = useCallback((data: any) => {
        // Broadcast to all connected peers (simple mesh for now, mostly star topology when hosting)
        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }, []);

    const sendTo = useCallback((peerId: string, data: any) => {
        const conn = connectionsRef.current.get(peerId);
        if (conn && conn.open) {
            conn.send(data);
        }
    }, []);

    const broadcastPlayerList = useCallback((hostStatusOverride?: string) => {
        if (!isHostRef.current || !peerRef.current) return;

        const connectedPlayers = Array.from(connectionsRef.current.values())
            .map(c => (c as any).playerInfo)
            .filter(Boolean);

        const currentState = stateRef.current;
        const hostInGame = currentState.mode === 'in_game';
        const currentHostStatus = hostStatusOverride || (hostInGame ? 'in_game' : hostStatusRef.current);
        const hostSelfInfo: PlayerInfo = { id: peerRef.current.id, ...myInfoRef.current, status: currentHostStatus as any };

        const fullList = [hostSelfInfo, ...connectedPlayers];
        
        // Send to everyone
        connectionsRef.current.forEach(conn => {
            if(conn.open) conn.send({ type: 'PLAYER_LIST', players: fullList });
        });
        
        setState(prev => ({ ...prev, players: fullList }));
    }, []);
    
    // Core data handling logic
    const handleDataReceived = useCallback((data: any, conn: DataConnection) => {
        if (data.type === 'HEARTBEAT') return; 

        // Pass to generic subscribers (Games, Chat, Social)
        notifySubscribers(data, conn);

        // --- INTERNAL LOGIC ---
        const senderId = conn.peer;
        const senderInfo = (conn as any).playerInfo;
        const currentState = stateRef.current;

        if (data.type === 'HELLO' || data.type === 'HELLO_FRIEND') {
             // Register player info
             (conn as any).playerInfo = { id: senderId, name: data.name, avatarId: data.avatarId, status: 'idle', extraInfo: data.extraInfo };
             // If we are hosting, update everyone
             if (isHostRef.current) broadcastPlayerList();
        }
        else if (data.type === 'UPDATE_INFO') {
            if (senderInfo) {
                senderInfo.name = data.name;
                senderInfo.avatarId = data.avatarId;
                senderInfo.extraInfo = data.extraInfo;
            }
            if (isHostRef.current) broadcastPlayerList();
        }
        else if (data.type === 'DISCONNECTING') {
            connectionsRef.current.delete(conn.peer);
            if (isHostRef.current) broadcastPlayerList();
        }
        
        // --- HOST LOGIC SPECIFIC ---
        if (isHostRef.current) {
            switch (data.type) {
                case 'JOIN_ROOM': {
                    // Logic to join the game hosted by ME
                    if (hostStatusRef.current === 'hosting') {
                         const joinerInfo = (conn as any).playerInfo;
                         hostStatusRef.current = 'idle'; 
                         
                         setState(prev => ({
                            ...prev,
                            mode: 'in_game',
                            gameOpponent: joinerInfo,
                            isMyTurn: true,
                            amIP1: true 
                         }));

                         const hostInfo = { id: peerRef.current?.id || '', ...myInfoRef.current, status: 'in_game' };
                         if (joinerInfo) joinerInfo.status = 'in_game';
                         
                         conn.send({ type: 'GAME_START', opponent: hostInfo, starts: false });
                         broadcastPlayerList('in_game');
                    }
                    break;
                }
                case 'LEAVE_GAME':
                     if (senderInfo) senderInfo.status = 'idle';
                     if (currentState.mode === 'in_game' && currentState.gameOpponent?.id === senderId) {
                         setState(prev => ({...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false, amIP1: false}));
                         hostStatusRef.current = 'idle';
                     }
                     broadcastPlayerList();
                     break;
                 case 'REMATCH_REQUEST':
                     if (senderInfo) senderInfo.status = 'in_game';
                     if (currentState.mode === 'in_game' && currentState.gameOpponent?.id === senderId) {
                         notifySubscribers({ type: 'REMATCH_START' }, conn);
                         conn.send({ type: 'REMATCH_START', opponent: { id: peerRef.current?.id, ...myInfoRef.current, status: 'in_game' }, starts: false });
                     }
                     broadcastPlayerList();
                     break;
            }
        } 
        // --- GUEST LOGIC SPECIFIC ---
        else {
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
                        amIP1: false // Guest is ALWAYS Player 2 (or not P1)
                    }));
                    notifySubscribers(data, conn);
                    break;
            }
        }
    }, [broadcastPlayerList, notifySubscribers]);

    const handleConnectionOpen = useCallback((conn: DataConnection) => {
        connectionsRef.current.set(conn.peer, conn);
        
        conn.on('data', (data) => handleDataReceived(data, conn));
        conn.on('close', () => {
            connectionsRef.current.delete(conn.peer);
            if (isHostRef.current) broadcastPlayerList();
        });
        
        // Handshake
        conn.send({ 
            type: 'HELLO', 
            name: myInfoRef.current.name, 
            avatarId: myInfoRef.current.avatarId,
            extraInfo: myInfoRef.current.extraInfo 
        });
    }, [handleDataReceived, broadcastPlayerList]);

    const connect = useCallback(() => {
        if (peerRef.current && !peerRef.current.destroyed) return;

        setState(prev => ({ ...prev, isLoading: true, mode: 'connecting', error: null }));
        
        let id = localStorage.getItem('neon_social_id');
        if (!id) {
            id = 'neon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', id);
        }

        const peer = new Peer(id);

        peer.on('open', (id) => {
            setState(prev => ({ ...prev, peerId: id, isConnected: true, isLoading: false, mode: 'lobby', error: null }));
            peerRef.current = peer;
            
            peer.on('connection', (conn) => {
                conn.on('open', () => handleConnectionOpen(conn));
            });
        });

        // Auto-reconnect on disconnect
        peer.on('disconnected', () => {
            console.log('Peer disconnected from server. Attempting reconnect...');
            setState(prev => ({ ...prev, isConnected: false }));
            setTimeout(() => {
                if (peer && !peer.destroyed) {
                    peer.reconnect();
                }
            }, 1000);
        });

        peer.on('close', () => {
            console.log('Peer connection closed.');
            setState(prev => ({ ...prev, isConnected: false, mode: 'disconnected', peerId: null }));
            peerRef.current = null;
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            // Silent fail for peer-unavailable (offline friends)
            if (err.type === 'peer-unavailable') return;
            // Ignore disconnected errors as they are handled by the disconnected event
            if (err.type === 'disconnected') return;
            
            setState(prev => ({ ...prev, error: 'Connexion instable', isLoading: false }));
        });
    }, [handleConnectionOpen]);

    const connectTo = useCallback((peerId: string) => {
        if (!peerRef.current || connectionsRef.current.has(peerId)) return;
        const conn = peerRef.current.connect(peerId);
        conn.on('open', () => handleConnectionOpen(conn));
        // Error handling for this specific connection is managed by the global peer 'error' event
    }, [handleConnectionOpen]);

    const updateSelfInfo = useCallback((name: string, avatarId: string, extraInfo?: string) => {
        myInfoRef.current = { name, avatarId, extraInfo };
        const updateMsg = { type: 'UPDATE_INFO', name, avatarId, extraInfo };
        sendData(updateMsg);
        
        if (isHostRef.current) {
            broadcastPlayerList();
        }
    }, [sendData, broadcastPlayerList]);

    const createRoom = useCallback((gameId: string = 'unknown') => {
        hostStatusRef.current = 'hosting';
        // CRITICAL FIX: Manually update ref so subsequent calls see we are hosting immediately
        isHostRef.current = true;
        
        setState(prev => ({ ...prev, isHost: true }));
        // Update extraInfo with gameId to broadcast which game we are hosting
        updateSelfInfo(myInfoRef.current.name, myInfoRef.current.avatarId, gameId);
        
        // Force broadcast immediately
        broadcastPlayerList();
    }, [updateSelfInfo, broadcastPlayerList]);

    const joinRoom = useCallback((targetPeerId: string) => {
        if (!peerRef.current) return;
        
        // Reuse existing connection if present
        let conn = connectionsRef.current.get(targetPeerId);
        
        if (!conn || !conn.open) {
            conn = peerRef.current.connect(targetPeerId);
            conn.on('open', () => {
                handleConnectionOpen(conn!);
                conn!.send({ type: 'JOIN_ROOM', targetId: targetPeerId });
            });
        } else {
            conn.send({ type: 'JOIN_ROOM', targetId: targetPeerId });
        }
        
        setState(prev => ({ ...prev, isHost: false }));
    }, [handleConnectionOpen]);

    const sendGameMove = useCallback((moveData: any) => {
        const currentState = stateRef.current;
        if (currentState.mode !== 'in_game' || !currentState.gameOpponent) return;
    
        const payload = {
            type: 'GAME_MOVE',
            ...((typeof moveData === 'object') ? moveData : { col: moveData })
        };
        
        // Both host and guest just send the move to their opponent.
        sendTo(currentState.gameOpponent.id, payload);
    
    }, [sendTo]);

    const cancelHosting = useCallback(() => {
        hostStatusRef.current = 'idle';
        setState(prev => ({ ...prev, isHost: false, mode: 'lobby' }));
        // Clear gameId
        updateSelfInfo(myInfoRef.current.name, myInfoRef.current.avatarId, undefined);
        sendData({ type: 'CANCEL_HOSTING' });
    }, [sendData, updateSelfInfo]);

    const leaveGame = useCallback(() => {
        const currentState = stateRef.current;
        sendData({ type: 'LEAVE_GAME', opponentId: currentState.gameOpponent?.id });
        hostStatusRef.current = 'idle';
        // Clear gameId if I was hosting
        if (isHostRef.current) {
             updateSelfInfo(myInfoRef.current.name, myInfoRef.current.avatarId, undefined);
        }
        setState(prev => ({ ...prev, mode: 'lobby', gameOpponent: null, isMyTurn: false }));
    }, [sendData, updateSelfInfo]);

    const requestRematch = useCallback(() => {
        const currentState = stateRef.current;
        
        // CORRECTION : Si je suis l'hôte, je force le redémarrage immédiatement
        if (isHostRef.current) {
             // 1. Reset local (Pour moi)
             notifySubscribers({ type: 'REMATCH_START' }, null as any);
             
             // 2. Reset distant (Pour l'adversaire)
             sendData({ type: 'REMATCH_START' });
        } else {
             // Si je suis invité, je demande poliment
             sendData({ type: 'REMATCH_REQUEST', opponentId: currentState.gameOpponent?.id });
        }
    }, [sendData, notifySubscribers]);

    return {
        ...state,
        connect,
        disconnect,
        createRoom,
        joinRoom,
        updateSelfInfo,
        sendData,
        sendTo,
        connectTo,
        sendGameMove,
        subscribe,
        cancelHosting,
        leaveGame,
        requestRematch
    };
};
