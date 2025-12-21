
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';

export const useVoiceChat = (myId: string | null, opponentId: string | null, isGameActive: boolean) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<HTMLAudioElement | null>(null);
    const currentCallRef = useRef<MediaConnection | null>(null);

    const stopLocalStream = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    }, []);

    const handleCall = useCallback((call: MediaConnection) => {
        currentCallRef.current = call;
        call.on('stream', (remoteStream) => {
            if (!remoteStreamRef.current) {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play().catch(console.error);
                remoteStreamRef.current = audio;
            }
        });
        call.on('close', () => {
            remoteStreamRef.current = null;
            currentCallRef.current = null;
        });
    }, []);

    // Initialisation de PeerJS uniquement après que l'utilisateur a rejoint
    useEffect(() => {
        if (!myId || !isJoined || !isGameActive) return;

        // On utilise un suffixe pour ne pas entrer en conflit avec le canal de données du jeu
        const peer = new Peer(`${myId}_voice`, {
            debug: 1
        });

        peer.on('open', () => {
            setIsConnected(true);
            console.log('Voice Peer connected');
        });

        peer.on('call', (call) => {
            // Répondre avec notre flux local (qui peut être muté ou null)
            call.answer(localStreamRef.current || undefined);
            handleCall(call);
        });

        peer.on('error', (err) => {
            console.error('Voice Peer Error:', err);
            setError(err.type);
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
            setIsConnected(false);
            stopLocalStream();
        };
    }, [myId, isJoined, isGameActive, handleCall, stopLocalStream]);

    // Lancer l'appel vers l'adversaire
    const startCall = useCallback(async () => {
        if (!peerRef.current || !opponentId || currentCallRef.current) return;

        try {
            const call = peerRef.current.call(`${opponentId}_voice`, localStreamRef.current!);
            handleCall(call);
        } catch (err) {
            console.error('Failed to initiate call', err);
        }
    }, [opponentId, handleCall]);

    // Action principale : Rejoindre le chat et demander le micro
    const joinVoiceChat = useCallback(async () => {
        if (isJoined) return;
        
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            // Commencer muté par défaut mais avec le flux prêt
            stream.getAudioTracks().forEach(t => t.enabled = false);
            setIsMuted(true);
            setIsJoined(true);
        } catch (err) {
            console.error('Mic permission denied', err);
            setError('permission-denied');
        }
    }, [isJoined]);

    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !newMuteState;
        });
    }, [isMuted]);

    // Tenter d'appeler l'adversaire quand tout est prêt
    useEffect(() => {
        if (opponentId && isConnected && isJoined && localStreamRef.current && !currentCallRef.current) {
            startCall();
        }
    }, [opponentId, isConnected, isJoined, startCall]);

    return {
        isMuted,
        isJoined,
        joinVoiceChat,
        toggleMute,
        isConnected,
        error
    };
};
