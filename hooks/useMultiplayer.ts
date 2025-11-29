
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
            const peer = new Peer();
            
            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setState(prev => ({ ...prev, peerId: id, error: null }));
            });

            peer.on('connection', (conn) => {
                console.log('Incoming connection...');
                handleConnection(conn);
                setState(prev => ({ ...prev, isHost: true }));
            });

            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                setState(prev => ({ ...prev, error: 'Erreur de connexion' }));
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
        const conn = peerRef.current.connect(remotePeerId);
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
