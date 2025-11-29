
import { useState, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface PlayerInfo {
    id: string; // Peer ID
    name: string;
    avatarId: string;
    isHost: boolean;
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
    connectionErrorType: 'PEER_UNAVAILABLE' | 'NETWORK' | 'ID_TAKEN' | null;
    roomStatuses: Record<string, RoomStatusData>;
}

const ID_PREFIX = 'na-'; // Neon Arcade Prefix
const STORAGE_KEY_CODE = 'neon-friend-code';
const MAX_PLAYERS = 15;

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
        roomStatuses: {}
    });
    
    const peerRef = useRef<Peer | null>(null);
    // For Host: list of connections to guests. For Guest: single connection to host (as array for unified handling).
    const connectionsRef = useRef<DataConnection[]>([]); 
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);

    // Helper to generate a random 4-digit code
    const generateShortCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    // Initialisation du Peer
    // Added retryCount to handle zombie IDs
    const initializePeer = useCallback((customShortId?: string, retryCount = 0) => {
        if (peerRef.current) peerRef.current.destroy();

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
                    players: customShortId ? [{ id: id, name: 'Hôte', avatarId: 'av_bot', isHost: true }] : [] 
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
                
                // --- ID TAKEN / ZOMBIE SESSION HANDLING ---
                if (err.type === 'unavailable-id') {
                    if (customShortId) {
                        // CASE 1: Hosting a specific room (Global Salon)
                        // If the ID is taken, it might be a zombie session from a recent refresh/close.
                        // We wait and retry a few times.
                        if (retryCount < 3) {
                            console.log(`ID ${customShortId} taken. Retrying hosting in 1.5s... (Attempt ${retryCount + 1}/3)`);
                            setTimeout(() => {
                                initializePeer(customShortId, retryCount + 1);
                            }, 1500);
                            return; // Exit here, don't set error state yet
                        } else {
                            // If retries failed, mapped error
                            setState(prev => ({ 
                                ...prev, 
                                error: 'Salon occupé ou inaccessible (Zombie ID).',
                                connectionErrorType: 'ID_TAKEN',
                                isLoading: false 
                            }));
                            return;
                        }
                    } else {
                        // CASE 2: Guest with a random ID
                        // If my random ID is taken, just generate a NEW one and try again immediately.
                        console.log('Guest ID collision. Generating new ID...');
                        const newCode = generateShortCode();
                        localStorage.setItem(STORAGE_KEY_CODE, newCode);
                        initializePeer(undefined, 0); // Restart with new ID
                        return;
                    }
                }

                // Probe error handling
                if (err.type === 'peer-unavailable') {
                    const message = err.message || '';
                    const match = message.match(new RegExp(`${ID_PREFIX}(\\S+)`));
                    if (match && match[1]) {
                        setState(prev => ({
                            ...prev,
                            roomStatuses: {
                                ...prev.roomStatuses,
                                [match[1]]: { status: 'EMPTY' }
                            }
                        }));
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

    const handleConnection = (conn: DataConnection) => {
        // LIMIT CHECK
        if (connectionsRef.current.length >= MAX_PLAYERS - 1) { // -1 because Host is a player
            console.warn("Rejected incoming connection: Room Full");
            conn.on('open', () => {
                conn.send({ type: 'ERROR', code: 'ROOM_FULL' });
                setTimeout(() => conn.close(), 500);
            });
            return;
        }

        // Add to connections list
        connectionsRef.current.push(conn);
        
        // Use functional state update to ensure we are using the latest state for 'isHost'
        setState(prev => {
            return { ...prev, isHost: true, isConnected: true };
        });

        conn.on('open', () => {
            console.log('Connection open with', conn.peer);
            // Request info from the new guest
            conn.send({ type: 'REQUEST_INFO' });
        });

        conn.on('data', (data: any) => {
            handleDataReceived(data, conn);
        });

        conn.on('close', () => {
            console.log('Connection closed with', conn.peer);
            connectionsRef.current = connectionsRef.current.filter(c => c.connectionId !== conn.connectionId);
            
            // Remove player from list and broadcast update
            setState(prev => {
                const newPlayers = prev.players.filter(p => p.id !== conn.peer);
                // Broadcast new list to remaining guests
                broadcast({ type: 'PLAYERS_UPDATE', players: newPlayers }, conn.connectionId);
                return { ...prev, players: newPlayers };
            });
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
    };

    const handleDataReceived = (data: any, senderConn: DataConnection) => {
        // 1. HOST LOGIC: Process and Broadcast
        if (data.type === 'JOIN_INFO') {
            // New player joined
            const newPlayer: PlayerInfo = {
                id: senderConn.peer,
                name: data.name,
                avatarId: data.avatarId,
                isHost: false
            };
            
            setState(prev => {
                // Avoid duplicates
                const filtered = prev.players.filter(p => p.id !== newPlayer.id);
                const updatedPlayers = [...filtered, newPlayer];
                
                // Broadcast updated full list to ALL guests (including the new one)
                broadcast({ type: 'PLAYERS_UPDATE', players: updatedPlayers });
                
                return { ...prev, players: updatedPlayers };
            });
        }
        else if (data.type === 'CHAT' || data.type === 'MOVE' || data.type === 'REACTION' || data.type === 'RESET') {
            // Relay to other guests (Broadcasting)
            broadcast(data, senderConn.connectionId);
        }

        // 2. GUEST LOGIC: Receive Updates
        if (data.type === 'PLAYERS_UPDATE') {
            setState(prev => ({ ...prev, players: data.players }));
        }
        if (data.type === 'REQUEST_INFO') {
            // Host is asking for my info. This is handled in the component usually,
            // or we can trigger a callback.
        }
        if (data.type === 'ERROR' && data.code === 'ROOM_FULL') {
            setState(prev => ({ ...prev, error: 'Salon complet (15 joueurs max).', isConnected: false }));
            senderConn.close();
        }

        // 3. APP CALLBACK (Pass data up to React Component)
        if (onDataCallbackRef.current) {
            onDataCallbackRef.current(data);
        }
    };

    const connectToPeer = useCallback((targetShortId: string) => {
        if (!peerRef.current) initializePeer();
        
        setTimeout(() => {
            if (!peerRef.current) return;
            const fullTargetId = `${ID_PREFIX}${targetShortId}`;
            
            console.log(`Connecting to ${fullTargetId}...`);
            setState(prev => ({ ...prev, isLoading: true, error: null, connectionErrorType: null }));
            
            // Close existing connections
            connectionsRef.current.forEach(c => c.close());
            connectionsRef.current = [];

            try {
                const conn = peerRef.current.connect(fullTargetId, { reliable: true });
                
                // Add to ref immediately
                connectionsRef.current.push(conn);
                setState(prev => ({ ...prev, isHost: false }));

                conn.on('open', () => {
                    console.log('Connected to host!');
                    setState(prev => ({ ...prev, isConnected: true, error: null }));
                });

                conn.on('data', (data) => handleDataReceived(data, conn));
                
                conn.on('close', () => {
                    console.log('Disconnected from host');
                    setState(prev => ({ ...prev, isConnected: false, players: [] }));
                    connectionsRef.current = [];
                });

                // Timeout for connection
                setTimeout(() => {
                    if (!conn.open) {
                        setState(prev => {
                            if (prev.isLoading && !prev.isConnected) {
                                return {
                                    ...prev,
                                    isLoading: false,
                                    error: 'Salon vide ou introuvable.',
                                    connectionErrorType: 'PEER_UNAVAILABLE'
                                };
                            }
                            return prev;
                        });
                    }
                }, 3000);

            } catch (e) {
                console.error("Connect failed", e);
                setState(prev => ({ ...prev, error: "Echec de connexion", isLoading: false }));
            }
        }, 100);
    }, [initializePeer]);

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
        // Force complete destroy of old peer before creating new one
        if (peerRef.current) { 
            peerRef.current.destroy(); 
            peerRef.current = null; 
        }
        
        // Small delay to ensure cleanup allows ID reuse
        setTimeout(() => {
            initializePeer(roomId);
            setState(prev => ({ ...prev, isHost: true }));
        }, 100);
    }, [initializePeer]);

    const sendData = useCallback((data: any) => {
        // Send to all active connections
        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }, []);

    const setOnDataReceived = useCallback((callback: (data: any) => void) => {
        onDataCallbackRef.current = callback;
    }, []);

    const disconnect = useCallback(() => {
        // Close all data connections
        connectionsRef.current.forEach(c => c.close());
        connectionsRef.current = [];
        
        // Destroy peer
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        
        // Reset state
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
                newPlayers.push({ id: myId, name, avatarId, isHost: prev.isHost });
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
        setOnDataReceived,
        disconnect,
        checkRooms,
        updateSelfInfo
    };
};
