
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface RoomInfo {
    name: string;
    avatarId?: string;
    status: 'WAITING' | 'PLAYING';
    players: number;
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
    opponentName: string | null;
    opponentAvatarId: string | null;
    roomInfo: RoomInfo | null; // Info received from host when joining
    connectionErrorType: 'PEER_UNAVAILABLE' | 'NETWORK' | null; // To distinguish empty rooms
    roomStatuses: Record<string, RoomStatusData>;
}

const ID_PREFIX = 'na-'; // Neon Arcade Prefix
const STORAGE_KEY_CODE = 'neon-friend-code';

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null,
        shortId: null,
        isConnected: false,
        isHost: false,
        error: null,
        isLoading: false,
        opponentName: null,
        opponentAvatarId: null,
        roomInfo: null,
        connectionErrorType: null,
        roomStatuses: {}
    });
    
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);

    // Helper to generate a random 4-digit code
    const generateShortCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    // Initialisation du Peer avec un Code Court
    const initializePeer = useCallback((customShortId?: string) => {
        if (peerRef.current) peerRef.current.destroy();

        setState(prev => ({ 
            ...prev, 
            isLoading: true, 
            error: null, 
            opponentName: null, 
            opponentAvatarId: null,
            roomInfo: null,
            isConnected: false,
            connectionErrorType: null,
            roomStatuses: {}
        }));

        let shortCode = customShortId;

        // Si aucun code personnalisé n'est fourni, on utilise le code persistant ou on en génère un nouveau
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
                    isLoading: false
                }));
            });

            peer.on('connection', (conn) => {
                // Handle Probes (Lobby checks)
                if (conn.metadata && conn.metadata.type === 'PROBE') {
                    conn.on('open', () => {
                        // Return player count (1 if waiting, 2 if playing/connected)
                        const count = connRef.current ? 2 : 1;
                        conn.send({ type: 'PONG_INFO', players: count });
                    });
                    return;
                }

                console.log('Incoming connection...');
                // We handle multiple connections logic in component (reject or accept)
                handleConnection(conn);
                setState(prev => ({ ...prev, isHost: true }));
            });

            peer.on('error', (err: any) => {
                console.error('PeerJS error:', err);
                
                // Handle Probe Errors (Quietly update status)
                if (err.type === 'peer-unavailable') {
                    const message = err.message || '';
                    const match = message.match(new RegExp(`${ID_PREFIX}(\\S+)`));
                    if (match && match[1]) {
                        // It's a specific peer we tried to connect to
                        setState(prev => ({
                            ...prev,
                            roomStatuses: {
                                ...prev.roomStatuses,
                                [match[1]]: { status: 'EMPTY' }
                            }
                        }));
                        return; // Don't set global error for probes
                    }
                }

                let errorMsg = 'Erreur de connexion.';
                let errorType: MultiplayerState['connectionErrorType'] = null;

                if (err.type === 'unavailable-id') {
                    errorMsg = 'Ce salon est déjà occupé par un hôte.';
                } else if (err.type === 'peer-unavailable') {
                     errorMsg = 'Salon vide ou introuvable.';
                     errorType = 'PEER_UNAVAILABLE';
                } else if (err.type === 'network' || err.type === 'disconnected') {
                     errorMsg = 'Problème de connexion réseau.';
                     errorType = 'NETWORK';
                }
                
                setState(prev => ({ 
                    ...prev, 
                    error: errorMsg,
                    connectionErrorType: errorType,
                    isLoading: false 
                }));
            });
            
            peer.on('disconnected', () => {
                console.log('Peer disconnected from server');
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

    const handleConnection = (conn: DataConnection) => {
        connRef.current = conn;

        conn.on('open', () => {
            console.log('Connected to peer!');
            setState(prev => ({ ...prev, isConnected: true, error: null }));
        });

        conn.on('data', (data: any) => {
            if (data.type === 'JOIN_INFO') {
                setState(prev => ({ 
                    ...prev, 
                    opponentName: data.name,
                    opponentAvatarId: data.avatarId 
                }));
            }
            if (data.type === 'ROOM_INFO') {
                setState(prev => ({ 
                    ...prev, 
                    roomInfo: {
                        name: data.name,
                        avatarId: data.avatarId,
                        status: data.status,
                        players: data.players
                    },
                    opponentName: data.name,
                    opponentAvatarId: data.avatarId
                }));
            }
            if (onDataCallbackRef.current) {
                onDataCallbackRef.current(data);
            }
        });

        conn.on('close', () => {
            console.log('Connection closed');
            setState(prev => ({ ...prev, isConnected: false, isHost: false, opponentName: null, opponentAvatarId: null, roomInfo: null }));
            connRef.current = null;
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setState(prev => ({ ...prev, error: 'Connexion interrompue' }));
        });
    };

    const connectToPeer = useCallback((targetShortId: string) => {
        // Always ensure we have a peer instance
        if (!peerRef.current) {
            initializePeer(); 
        }
        
        // Wait a tiny bit if peer is initializing
        setTimeout(() => {
            if (!peerRef.current) return;

            const cleanId = targetShortId.trim();
            if (!cleanId) return;

            const fullTargetId = `${ID_PREFIX}${cleanId}`;
            
            console.log(`Connecting to ${fullTargetId}...`);
            setState(prev => ({ ...prev, isLoading: true, error: null, connectionErrorType: null }));
            
            if (connRef.current) {
                connRef.current.close();
            }

            try {
                const conn = peerRef.current.connect(fullTargetId, {
                    reliable: true
                });
                handleConnection(conn);
                setState(prev => ({ ...prev, isHost: false }));
            } catch (e) {
                console.error("Connect failed", e);
                setState(prev => ({ ...prev, error: "Echec de la demande de connexion", isLoading: false }));
            }
        }, 100);
    }, [initializePeer]);

    const checkRooms = useCallback((shortIds: string[]) => {
        // Retry if peer not ready
        const attemptProbe = () => {
             if (!peerRef.current || peerRef.current.disconnected) {
                 // Try again shortly
                 setTimeout(attemptProbe, 200);
                 return;
             }
 
             shortIds.forEach(id => {
                 // Update status to checking
                 setState(prev => ({
                     ...prev,
                     roomStatuses: { ...prev.roomStatuses, [id]: { status: 'CHECKING' } }
                 }));
 
                 const fullId = `${ID_PREFIX}${id}`;
                 const conn = peerRef.current!.connect(fullId, { 
                     metadata: { type: 'PROBE' },
                     reliable: true 
                 });
 
                 let responseReceived = false;
 
                 const timeout = setTimeout(() => {
                     if (!responseReceived) {
                         conn.close();
                         // If no response, assume empty (or dead host)
                         setState(prev => ({
                             ...prev,
                             roomStatuses: { ...prev.roomStatuses, [id]: { status: 'EMPTY' } }
                         }));
                     }
                 }, 1500);
 
                 conn.on('open', () => {
                     // Connected to *something*, so it's occupied. Ask for details.
                     conn.send({ type: 'PING_INFO' });
                 });
 
                 conn.on('data', (data: any) => {
                     if (data.type === 'PONG_INFO') {
                         responseReceived = true;
                         clearTimeout(timeout);
                         setState(prev => ({
                             ...prev,
                             roomStatuses: { 
                                 ...prev.roomStatuses, 
                                 [id]: { status: 'OCCUPIED', playerCount: data.players } 
                             }
                         }));
                         conn.close();
                     }
                 });

                 // Note: 'error' on connection is unreliable in PeerJS v1, handled via global peer error
             });
        };

        if (!peerRef.current) initializePeer();
        attemptProbe();
    }, [initializePeer]);

    const hostRoom = useCallback((roomId: string) => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        initializePeer(roomId);
        setState(prev => ({ ...prev, isHost: true }));
    }, [initializePeer]);

    const sendData = useCallback((data: any) => {
        if (connRef.current && connRef.current.open) {
            connRef.current.send(data);
        }
    }, []);

    const setOnDataReceived = useCallback((callback: (data: any) => void) => {
        onDataCallbackRef.current = callback;
    }, []);

    const disconnect = useCallback(() => {
        if (connRef.current) {
            connRef.current.close();
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setState({
            peerId: null,
            shortId: null,
            isConnected: false,
            isHost: false,
            error: null,
            isLoading: false,
            opponentName: null,
            opponentAvatarId: null,
            roomInfo: null,
            connectionErrorType: null,
            roomStatuses: {}
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
        checkRooms
    };
};
