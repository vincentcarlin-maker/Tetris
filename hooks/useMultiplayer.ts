
import { useState, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    isHost: boolean;
    status?: 'AVAILABLE' | 'PLAYING';
}

export interface RoomStatusData {
    status: 'EMPTY' | 'OCCUPIED' | 'CHECKING';
    playerCount?: number;
}

export interface MultiplayerState {
    peerId: string | null;     // The full ID (e.g., na-1234)
    shortId: string | null;    // The display ID (e.g., 1234)
    isConnected: boolean;
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    players: PlayerInfo[];     // List of all players in the room
    connectionErrorType: 'PEER_UNAVAILABLE' | 'NETWORK' | 'ID_TAKEN' | 'RACE_CONDITION_RESOLVED' | null;
    roomStatuses: Record<string, RoomStatusData>;
    GLOBAL_ROOM_ID: string;
}

const ID_PREFIX = 'na-'; // Neon Arcade Prefix
const STORAGE_KEY_CODE = 'neon-friend-code';
const MAX_PLAYERS = 20;
const GLOBAL_ROOM_ID_SHORT = 'neon-global-salon';

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null,
        shortId: null,
        isConnected: false,
        isHost: false,
        error: null,
        isLoading: false,
        players: [],
        connectionErrorType: null,
        roomStatuses: {},
        GLOBAL_ROOM_ID: GLOBAL_ROOM_ID_SHORT,
    });
    
    const peerRef = useRef<Peer | null>(null);
    // For Host: list of connections to guests. For Guest: single connection to host (as array for unified handling).
    const connectionsRef = useRef<DataConnection[]>([]); 
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);

    // Helper to generate a random 4-digit code
    const generateShortCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    // Initialisation du Peer
    const initializePeer = useCallback((customShortId?: string, retryCount = 0) => {
        if (peerRef.current && !peerRef.current.destroyed) peerRef.current.destroy();

        setState(prev => ({ 
            ...prev, 
            isLoading: true, 
            error: null, 
            players: [],
            isConnected: false,
            connectionErrorType: null,
            roomStatuses: {}
        }));

        let shortCode = customShortId;
        
        // If no custom ID (Guest mode), try to get from storage or generate
        if (!shortCode) {
            const storedCode = localStorage.getItem(STORAGE_KEY_CODE);
            if (storedCode) {
                shortCode = storedCode;
            } else {
                shortCode = generateShortCode();
                localStorage.setItem(STORAGE_KEY_CODE, shortCode);
            }
        }

        const fullId = `${ID_PREFIX}${shortCode}`;

        try {
            const peer = new Peer(fullId, {
                debug: 1,
                pingInterval: 5000,
            });
            
            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                const displayId = id.replace(ID_PREFIX, '');
                setState(prev => ({ 
                    ...prev, 
                    peerId: id, 
                    shortId: displayId,
                    error: null,
                    isLoading: false,
                    // Host adds themselves to player list initially (Guest will be overwritten on sync)
                    players: customShortId ? [{ id: id, name: 'Hôte', avatarId: 'av_bot', isHost: true, status: 'AVAILABLE' }] : [] 
                }));
            });

            peer.on('connection', (conn) => {
                // Handle Probes (Lobby checks)
                if (conn.metadata && conn.metadata.type === 'PROBE') {
                    conn.on('open', () => {
                        const count = connectionsRef.current.length + 1; // +1 for host
                        conn.send({ type: 'PONG_INFO', players: count });
                    });
                    return;
                }

                console.log('Incoming connection from', conn.peer);
                handleConnection(conn);
            });

            peer.on('error', (err: any) => {
                console.error('PeerJS error:', err);

                if (err.type === 'unavailable-id') {
                    // --- RACE CONDITION HANDLING (HOSTING GLOBAL ROOM) ---
                    if (customShortId === GLOBAL_ROOM_ID_SHORT) {
                        console.log(`Failed to host ${customShortId}, another host likely exists. Resolving race condition.`);
                        if (peerRef.current && !peerRef.current.destroyed) {
                            peerRef.current.destroy();
                            peerRef.current = null;
                        }
                        setState(prev => ({
                            ...prev,
                            error: null,
                            connectionErrorType: 'RACE_CONDITION_RESOLVED',
                            isLoading: false,
                            isHost: false,
                        }));
                        return;
                    }

                    // --- ZOMBIE ID (HOSTING PRIVATE ROOM) ---
                    if (customShortId) {
                        if (retryCount < 3) {
                            console.log(`ID ${customShortId} taken. Retrying hosting in 1.5s... (Attempt ${retryCount + 1}/3)`);
                            setTimeout(() => {
                                initializePeer(customShortId, retryCount + 1);
                            }, 1500); // Long delay for server to clear
                            return; 
                        } else {
                            setState(prev => ({ 
                                ...prev, 
                                error: 'Salon occupé ou inaccessible (Zombie ID).',
                                connectionErrorType: 'ID_TAKEN',
                                isLoading: false 
                            }));
                            return;
                        }
                    } 
                    
                    // --- GUEST ID COLLISION / ZOMBIE ID ---
                    else { 
                        if (retryCount < 5) { // Try up to 5 times for a random ID
                            console.log(`Guest ID taken. Generating new ID... (Attempt ${retryCount + 1}/5)`);
                            const newCode = generateShortCode();
                            localStorage.setItem(STORAGE_KEY_CODE, newCode);
                            // Use an increasing delay to give the server time to release the old ID
                            setTimeout(() => {
                                initializePeer(undefined, retryCount + 1);
                            }, 250 * (retryCount + 1));
                            return;
                        } else {
                            setState(prev => ({ 
                                ...prev, 
                                error: 'Impossible de trouver un ID disponible pour se connecter.',
                                connectionErrorType: 'ID_TAKEN',
                                isLoading: false 
                            }));
                            return;
                        }
                    }
                }

                let errorMsg = 'Erreur de connexion.';
                let errorType: MultiplayerState['connectionErrorType'] = null;

                if (err.type === 'peer-unavailable') {
                     errorMsg = 'Salon vide ou introuvable.';
                     errorType = 'PEER_UNAVAILABLE';
                } else if (err.type === 'network' || err.type === 'disconnected') {
                     errorMsg = 'Problème de connexion réseau.';
                     errorType = 'NETWORK';
                } else if (err.type === 'unavailable-id') {
                    errorMsg = 'Identifiant indisponible.';
                    errorType = 'ID_TAKEN';
                }
                
                setState(prev => ({ 
                    ...prev, 
                    error: errorMsg,
                    connectionErrorType: errorType,
                    isLoading: false 
                }));
            });
            
            peer.on('disconnected', () => {
                if (!peer.destroyed) {
                    peer.reconnect();
                }
            });

            peerRef.current = peer;
        } catch (err) {
            console.error('Failed to create Peer', err);
            setState(prev => ({ ...prev, error: 'Impossible de créer la connexion P2P', isLoading: false }));
        }
    }, []);

    const broadcast = useCallback((data: any, excludeConnId?: string) => {
        connectionsRef.current.forEach(conn => {
            if (conn.open && conn.connectionId !== excludeConnId) {
                conn.send(data);
            }
        });
    }, []);

    // NEW: Send to a specific player ID (Private or Relayed)
    const sendTo = useCallback((targetId: string, data: any) => {
        // If I am Host, I can send directly
        if (state.isHost) {
            const conn = connectionsRef.current.find(c => c.peer === targetId);
            if (conn && conn.open) {
                // Wrap in RELAYED_DATA so recipient knows it's a direct message
                conn.send({ 
                    type: 'RELAYED_DATA', 
                    from: state.peerId, 
                    payload: data 
                });
            } else if (targetId === state.peerId) {
                // Sending to self? Handle locally by enriching and passing to callback
                const enrichedPayload = { ...data, sender: state.peerId };
                if (onDataCallbackRef.current) {
                   onDataCallbackRef.current(enrichedPayload);
                }
            }
        } else {
            // If I am Guest, I send a RELAY request to Host
            // Host will forward it to Target
            const hostConn = connectionsRef.current[0];
            if (hostConn && hostConn.open) {
                hostConn.send({
                    type: 'RELAY_REQUEST',
                    target: targetId,
                    payload: data
                });
            }
        }
    }, [state.isHost, state.peerId]);


    const handleConnection = (conn: DataConnection) => {
        if (connectionsRef.current.length >= MAX_PLAYERS - 1) { 
            conn.on('open', () => {
                conn.send({ type: 'ERROR', code: 'ROOM_FULL' });
                setTimeout(() => conn.close(), 500);
            });
            return;
        }

        connectionsRef.current.push(conn);
        
        setState(prev => {
            return { ...prev, isHost: true, isConnected: true };
        });

        conn.on('open', () => {
            console.log('Connection open with', conn.peer);
            conn.send({ type: 'REQUEST_INFO' });
        });

        conn.on('data', (data: any) => {
            handleDataReceived(data, conn);
        });

        conn.on('close', () => {
            console.log('Connection closed with', conn.peer);
            connectionsRef.current = connectionsRef.current.filter(c => c.connectionId !== conn.connectionId);
            
            setState(prev => {
                const newPlayers = prev.players.filter(p => p.id !== conn.peer);
                broadcast({ type: 'PLAYERS_UPDATE', players: newPlayers }, conn.connectionId);
                return { ...prev, players: newPlayers };
            });
        });
    };

    const handleDataReceived = (data: any, senderConn: DataConnection) => {
        // --- RELAY SYSTEM LOGIC ---
        // 1. Host receives RELAY_REQUEST from Guest A -> Forwards to Guest B (or processes if target is Host)
        if (data.type === 'RELAY_REQUEST' && state.isHost) {
            const targetId = data.target;
            const payload = data.payload;
            const senderId = senderConn.peer;

            // If target is ME (Host)
            if (targetId === state.peerId) {
                 const enrichedPayload = { ...payload, sender: senderId };
                 if (onDataCallbackRef.current) {
                    onDataCallbackRef.current(enrichedPayload);
                 }
                 return;
            }

            // Find target connection
            const targetConn = connectionsRef.current.find(c => c.peer === targetId);
            if (targetConn && targetConn.open) {
                targetConn.send({
                    type: 'RELAYED_DATA',
                    from: senderId,
                    payload: payload
                });
            }
            return;
        }

        // 2. Guest (or Host) receives RELAYED_DATA
        if (data.type === 'RELAYED_DATA') {
            const realSender = data.from;
            const actualPayload = data.payload;
            
            const enrichedPayload = { ...actualPayload, sender: realSender };
            
            if (onDataCallbackRef.current) {
                onDataCallbackRef.current(enrichedPayload);
            }
            return;
        }


        // --- STANDARD BROADCAST LOGIC ---

        if (data.type === 'JOIN_INFO') {
            const newPlayer: PlayerInfo = {
                id: senderConn.peer,
                name: data.name,
                avatarId: data.avatarId,
                isHost: false,
                status: 'AVAILABLE'
            };
            
            setState(prev => {
                const filtered = prev.players.filter(p => p.id !== newPlayer.id);
                const updatedPlayers = [...filtered, newPlayer];
                broadcast({ type: 'PLAYERS_UPDATE', players: updatedPlayers });
                return { ...prev, players: updatedPlayers };
            });
        }
        else if (data.type === 'PLAYERS_UPDATE') {
            setState(prev => ({ ...prev, players: data.players }));
        }
        else if (data.type === 'STATUS_UPDATE') {
            // Update specific player status
            setState(prev => {
                const updatedPlayers = prev.players.map(p => 
                    p.id === data.id ? { ...p, status: data.status } : p
                );
                // If I am host, I must broadcast this to others
                if (prev.isHost) {
                    broadcast({ type: 'PLAYERS_UPDATE', players: updatedPlayers }, senderConn.connectionId);
                }
                return { ...prev, players: updatedPlayers };
            });
        }
        // Broadcast types (Chat global, etc - though we might move chat to private)
        else if (data.type === 'GLOBAL_CHAT') {
            broadcast(data, senderConn.connectionId);
            if (onDataCallbackRef.current) onDataCallbackRef.current(data);
        }
        
        // Pass everything else to app
        if (onDataCallbackRef.current) {
            const enrichedData = { ...data, from: senderConn.peer };
            onDataCallbackRef.current(enrichedData);
        }
    };

    const connectToPeer = useCallback((targetShortId: string) => {
        if (!peerRef.current || peerRef.current.destroyed) {
            initializePeer(); // Ensure we have a guest peer identity first
        }
        
        // Give Peer time to initialize if it wasn't already
        setTimeout(() => {
            if (!peerRef.current) {
                setState(prev => ({...prev, error: "Initialisation Peer a échoué.", isLoading: false}));
                return;
            }
            const fullTargetId = `${ID_PREFIX}${targetShortId}`;
            
            console.log(`Connecting to ${fullTargetId}...`);
            setState(prev => ({ ...prev, isLoading: true, error: null, connectionErrorType: null }));
            
            connectionsRef.current.forEach(c => c.close());
            connectionsRef.current = [];

            try {
                const conn = peerRef.current.connect(fullTargetId, { reliable: true });
                connectionsRef.current.push(conn);
                setState(prev => ({ ...prev, isHost: false }));

                conn.on('open', () => {
                    console.log('Connected to host!');
                    setState(prev => ({ ...prev, isConnected: true, isLoading: false, error: null }));
                });

                conn.on('data', (data) => handleDataReceived(data, conn));
                
                conn.on('close', () => {
                    console.log('Disconnected from host');
                    setState(prev => ({ ...prev, isConnected: false, players: [] }));
                    connectionsRef.current = [];
                });

                setTimeout(() => {
                    if (!conn.open && !state.isConnected) {
                         setState(prev => ({
                             ...prev,
                             isLoading: false,
                             error: 'La connexion au salon a expiré.',
                             connectionErrorType: 'PEER_UNAVAILABLE'
                         }));
                    }
                }, 3000);

            } catch (e) {
                console.error("Connect failed", e);
                setState(prev => ({ ...prev, error: "Echec de connexion", isLoading: false }));
            }
        }, 100);
    }, [initializePeer, state.isConnected]);

    const checkRooms = useCallback((shortIds: string[]) => {
        if (!peerRef.current || peerRef.current.disconnected || !peerRef.current.id) return;

        shortIds.forEach(id => {
             setState(prev => ({
                 ...prev,
                 roomStatuses: { ...prev.roomStatuses, [id]: { status: 'CHECKING' } }
             }));

             const fullId = `${ID_PREFIX}${id}`;
             try {
                const conn = peerRef.current!.connect(fullId, { 
                    metadata: { type: 'PROBE' },
                    reliable: true 
                });

                let responseReceived = false;
                const timeout = setTimeout(() => {
                    if (!responseReceived) {
                        if (conn.open) conn.close();
                        setState(prev => ({
                            ...prev,
                            roomStatuses: { ...prev.roomStatuses, [id]: { status: 'EMPTY' } }
                        }));
                    }
                }, 2000);

                conn.on('open', () => { conn.send({ type: 'PING_INFO' }); });
                conn.on('data', (data: any) => {
                    if (data.type === 'PONG_INFO') {
                        responseReceived = true;
                        clearTimeout(timeout);
                        setState(prev => ({
                            ...prev,
                            roomStatuses: { ...prev.roomStatuses, [id]: { status: 'OCCUPIED', playerCount: data.players } }
                        }));
                        conn.close();
                    }
                });
                conn.on('error', () => {
                    if (!responseReceived) {
                        clearTimeout(timeout);
                        setState(prev => ({
                            ...prev,
                            roomStatuses: { ...prev.roomStatuses, [id]: { status: 'EMPTY' } }
                        }));
                    }
                });
             } catch (e) {
                 setState(prev => ({ ...prev, roomStatuses: { ...prev.roomStatuses, [id]: { status: 'EMPTY' } } }));
             }
        });
    }, []);

    const hostRoom = useCallback((roomId: string) => {
        if (peerRef.current && !peerRef.current.destroyed) { 
            peerRef.current.destroy(); 
            peerRef.current = null; 
        }
        setTimeout(() => {
            initializePeer(roomId);
            setState(prev => ({ ...prev, isHost: true }));
        }, 100);
    }, [initializePeer]);

    const sendData = useCallback((data: any) => {
        // Broadcast to all active connections (Legacy support)
        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }, []);
    
    // Broadcast status change (AVAILABLE / PLAYING)
    const updateStatus = useCallback((status: 'AVAILABLE' | 'PLAYING') => {
        const msg = { type: 'STATUS_UPDATE', id: state.peerId, status };
        // If Host: Broadcast to everyone
        // If Guest: Send to Host, who will broadcast
        if (state.isHost) {
            setState(prev => {
               const updatedPlayers = prev.players.map(p => 
                    p.id === prev.peerId ? { ...p, status } : p
                );
                // self update
               return { ...prev, players: updatedPlayers };
            });
            broadcast(msg); // Send to all guests
        } else {
            const host = connectionsRef.current[0];
            if (host && host.open) host.send(msg);
        }
    }, [state.peerId, state.isHost, broadcast]);


    const setOnDataReceived = useCallback((callback: (data: any) => void) => {
        onDataCallbackRef.current = callback;
    }, []);

    const disconnect = useCallback(() => {
        connectionsRef.current.forEach(c => c.close());
        connectionsRef.current = [];
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setState(prev => ({
            ...prev,
            peerId: null,
            shortId: null,
            isConnected: false,
            isHost: false,
            error: null,
            isLoading: false,
            players: [],
            connectionErrorType: null,
            roomStatuses: {}
        }));
    }, []);

    const updateSelfInfo = useCallback((name: string, avatarId: string) => {
        setState(prev => {
            const myId = prev.peerId;
            if (!myId) return prev;
            
            const existingMe = prev.players.find(p => p.id === myId);
            if (existingMe && existingMe.name === name && existingMe.avatarId === avatarId) return prev;

            const newPlayers = prev.players.map(p => 
                p.id === myId ? { ...p, name, avatarId } : p
            );
            
            if (!prev.players.find(p => p.id === myId)) {
                newPlayers.push({ id: myId, name, avatarId, isHost: prev.isHost, status: 'AVAILABLE' });
            }

            return { ...prev, players: newPlayers };
        });
    }, []);

    return {
        ...state,
        initializePeer,
        connectToPeer,
        hostRoom,
        sendData,
        sendTo,
        updateStatus,
        setOnDataReceived,
        disconnect,
        checkRooms,
        updateSelfInfo
    };
};
