
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';

export interface MultiplayerState {
    peerId: string | null;
    isConnected: boolean;
    isHost: boolean;
    error: string | null;
}

export const useMultiplayer = () => {
    const [state, setState] = useState<MultiplayerState>({
        peerId: null,
        isConnected: false,
        isHost: false,
        error: null
    });
    
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const onDataCallbackRef = useRef<((data: any) => void) | null>(null);

    // Initialisation du Peer
    const initializePeer = useCallback(() => {
        if (peerRef.current) return;

        try {
            const peer = new Peer({
                debug: 2, // Print errors to console
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });
            
            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setState(prev => ({ ...prev, peerId: id, error: null }));
            });

            peer.on('connection', (conn) => {
                console.log('Incoming connection...');
                handleConnection(conn);
                setState(prev => ({ ...prev, isHost: true }));
            });

            // Auto-reconnect when signaling server connection is lost (common on mobile)
            peer.on('disconnected', () => {
                console.log('Peer disconnected from server. Attempting reconnect...');
                peer.reconnect();
            });

            peer.on('error', (err: any) => {
                console.error('PeerJS error:', err);
                
                // Handle specific network/server errors by trying to reconnect
                if (err.type === 'peer-unavailable') {
                     setState(prev => ({ ...prev, error: 'Pair introuvable' }));
                } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error' || err.type === 'socket-closed') {
                     if (!peer.disconnected) {
                         peer.reconnect();
                     } else {
                         setState(prev => ({ ...prev, error: 'Problème réseau' }));
                     }
                } else {
                    setState(prev => ({ ...prev, error: 'Erreur de connexion' }));
                }
            });

            peerRef.current = peer;
        } catch (err) {
            console.error('Failed to create Peer', err);
            setState(prev => ({ ...prev, error: 'Impossible de créer la connexion P2P' }));
        }
    }, []);

    const handleConnection = (conn: DataConnection) => {
        connRef.current = conn;

        conn.on('open', () => {
            console.log('Connected to peer!');
            setState(prev => ({ ...prev, isConnected: true, error: null }));
            
            // Send welcome message or handshake if needed
            conn.send({ type: 'HANDSHAKE' });
        });

        conn.on('data', (data) => {
            if (onDataCallbackRef.current) {
                onDataCallbackRef.current(data);
            }
        });

        conn.on('close', () => {
            console.log('Connection closed');
            setState(prev => ({ ...prev, isConnected: false, isHost: false }));
            connRef.current = null;
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setState(prev => ({ ...prev, error: 'Connexion interrompue' }));
        });
    };

    const connectToPeer = useCallback((remotePeerId: string) => {
        if (!peerRef.current) return;
        
        console.log(`Connecting to ${remotePeerId}...`);
        const conn = peerRef.current.connect(remotePeerId, {
            reliable: true
        });
        handleConnection(conn);
        setState(prev => ({ ...prev, isHost: false }));
    }, []);

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
            isConnected: false,
            isHost: false,
            error: null
        });
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, []);

    return {
        ...state,
        initializePeer,
        connectToPeer,
        sendData,
        setOnDataReceived,
        disconnect
    };
};
