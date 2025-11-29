
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface MultiplayerState {
    peerId: string | null;     // The full ID (e.g., na-1234)
    shortId: string | null;    // The display ID (e.g., 1234)
    isConnected: boolean;
    isHost: boolean;
    error: string | null;
    isLoading: boolean;
    opponentName: string | null;
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
        isLoading: true,
        opponentName: null
    });
    
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);

    // Helper to generate a random 4-digit code
    const generateShortCode = () => Math.floor(1000 + Math.random() * 9000).toString();

    // Initialisation du Peer avec un Code Court
    const initializePeer = useCallback((customShortId?: string) => {
        if (peerRef.current) return;

        setState(prev => ({ ...prev, isLoading: true, error: null, opponentName: null }));

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
            // Configuration optimisée pour mobile/tablette
            const peer = new Peer(fullId, {
                debug: 2,
                pingInterval: 5000, // Keep-alive frequent pour Android
            });
            
            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                // Extract 4 digits
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
                console.log('Incoming connection...');
                // Si on est déjà connecté, on refuse poliment (1v1 seulement)
                if (connRef.current && connRef.current.open) {
                    conn.close();
                    return;
                }
                handleConnection(conn);
                setState(prev => ({ ...prev, isHost: true }));
            });

            peer.on('error', (err: any) => {
                console.error('PeerJS error:', err);
                
                // Si l'ID est déjà pris (collision rare ou Room occupée), on réessaie avec un autre
                if (err.type === 'unavailable-id') {
                    if (customShortId) {
                        // Si c'était une room spécifique, c'est une erreur pour l'utilisateur
                        setState(prev => ({ 
                            ...prev, 
                            isLoading: false, 
                            error: 'Ce code est déjà utilisé par un autre joueur.' 
                        }));
                    } else {
                        // Si c'était notre code fixe/aléatoire, on doit le régénérer car il est pris
                        console.log('Code fixe indisponible, génération d\'un nouveau...');
                        const newCode = generateShortCode();
                        localStorage.setItem(STORAGE_KEY_CODE, newCode);
                        
                        peer.destroy();
                        peerRef.current = null;
                        setTimeout(() => initializePeer(), 500); 
                    }
                } else if (err.type === 'peer-unavailable') {
                     setState(prev => ({ ...prev, error: 'Joueur introuvable. Vérifiez le code.' }));
                } else if (err.type === 'network' || err.type === 'disconnected') {
                     setState(prev => ({ ...prev, error: 'Problème de connexion réseau.' }));
                } else {
                    setState(prev => ({ ...prev, error: 'Erreur de connexion serveur.' }));
                }
                
                // Stop loading state on fatal errors
                if (['browser-incompatible', 'invalid-id', 'ssl-unavailable'].includes(err.type)) {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            });
            
            peer.on('disconnected', () => {
                console.log('Peer disconnected from server');
                // Auto-reconnect logic for Android tablets dropping connection
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
            conn.send({ type: 'HANDSHAKE' });
        });

        conn.on('data', (data: any) => {
            if (data.type === 'NAME') {
                setState(prev => ({ ...prev, opponentName: data.name }));
            }
            if (onDataCallbackRef.current) {
                onDataCallbackRef.current(data);
            }
        });

        conn.on('close', () => {
            console.log('Connection closed');
            setState(prev => ({ ...prev, isConnected: false, isHost: false, opponentName: null }));
            connRef.current = null;
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setState(prev => ({ ...prev, error: 'Connexion interrompue' }));
        });
    };

    const connectToPeer = useCallback((targetShortId: string) => {
        if (!peerRef.current) return;
        
        // Clean ID input
        const cleanId = targetShortId.trim();
        if (!cleanId) return;

        const fullTargetId = `${ID_PREFIX}${cleanId}`;
        
        console.log(`Connecting to ${fullTargetId}...`);
        
        // Close existing connection if any
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
            setState(prev => ({ ...prev, error: "Echec de la demande de connexion" }));
        }
    }, []);

    // Host a specific room (e.g. "1111")
    const hostRoom = useCallback((roomId: string) => {
        // Destroy current random peer
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        // Create new peer with specific ID
        initializePeer(roomId);
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
            opponentName: null
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        ...state,
        initializePeer,
        connectToPeer,
        hostRoom,
        sendData,
        setOnDataReceived,
        disconnect
    };
};
