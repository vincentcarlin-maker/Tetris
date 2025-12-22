
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';

export const useVoiceChat = (myId: string | null, opponentId: string | null, isGameActive: boolean, isEnabled: boolean) => {
    const [isMuted, setIsMuted] = useState(true);
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

    // Lancer l'appel vers l'adversaire
    const startCall = useCallback(async () => {
        if (!peerRef.current || !opponentId || currentCallRef.current || !localStreamRef.current) return;

        try {
            const call = peerRef.current.call(`${opponentId}_voice`, localStreamRef.current);
            handleCall(call);
        } catch (err) {
            console.error('Failed to initiate call', err);
        }
    }, [opponentId, handleCall]);

    // Initialisation si activé
    useEffect(() => {
        if (!myId || !isGameActive || !isEnabled) {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
            stopLocalStream();
            setIsConnected(false);
            return;
        }

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                // On commence muté mais prêt
                stream.getAudioTracks().forEach(t => t.enabled = false);
                setIsMuted(true);

                const peer = new Peer(`${myId}_voice`, { debug: 1 });
                peer.on('open', () => {
                    setIsConnected(true);
                    console.log('Voice Peer connected');
                });
                peer.on('call', (call) => {
                    call.answer(localStreamRef.current || undefined);
                    handleCall(call);
                });
                peer.on('error', (err) => {
                    console.error('Voice Peer Error:', err);
                    setError(err.type);
                });
                peerRef.current = peer;
            } catch (err) {
                console.error('Mic permission denied or error', err);
                setError('permission-denied');
            }
        };

        init();

        return () => {
            if (peerRef.current) peerRef.current.destroy();
            peerRef.current = null;
            setIsConnected(false);
            stopLocalStream();
        };
    }, [myId, isGameActive, isEnabled, handleCall, stopLocalStream]);

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
        if (opponentId && isConnected && isEnabled && localStreamRef.current && !currentCallRef.current) {
            startCall();
        }
    }, [opponentId, isConnected, isEnabled, startCall]);

    return {
        isMuted,
        toggleMute,
        isConnected,
        error
    };
};
