
import { useCallback, useEffect, useRef, useState } from 'react';

export const useGameAudio = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx.current = new AudioContextClass();
        }
        return () => {
            audioCtx.current?.close();
        };
    }, []);

    const resume = useCallback(() => {
        if (audioCtx.current?.state === 'suspended') {
            audioCtx.current.resume().catch(console.error);
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, gainVal: number) => {
        if (isMuted || !audioCtx.current) return;
        resume();

        try {
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);

            gain.gain.setValueAtTime(gainVal, audioCtx.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.current.destination);

            osc.start();
            osc.stop(audioCtx.current.currentTime + duration);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }, [isMuted, resume]);

    const playMove = useCallback(() => playTone(300, 'square', 0.05, 0.03), [playTone]);
    
    const playRotate = useCallback(() => playTone(450, 'triangle', 0.05, 0.03), [playTone]);
    
    const playLand = useCallback(() => playTone(100, 'sawtooth', 0.1, 0.05), [playTone]);
    
    const playClear = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C Major Arpeggio
            const osc = audioCtx.current!.createOscillator();
            const gain = audioCtx.current!.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0.05, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(audioCtx.current!.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }, [isMuted, resume]);

    const playVictory = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        
        // Fanfare "Ta-da-da-daaa!" (Triade majeure)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
        const times = [0, 0.15, 0.3, 0.6];
        const durations = [0.15, 0.15, 0.3, 0.8];

        notes.forEach((freq, i) => {
            const osc = audioCtx.current!.createOscillator();
            const gain = audioCtx.current!.createGain();
            
            osc.type = 'triangle'; // Son plus brillant
            osc.frequency.setValueAtTime(freq, now + times[i]);
            
            gain.gain.setValueAtTime(0.1, now + times[i]);
            gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + durations[i]);
            
            osc.connect(gain);
            gain.connect(audioCtx.current!.destination);
            
            osc.start(now + times[i]);
            osc.stop(now + times[i] + durations[i]);
        });
    }, [isMuted, resume]);

    const playGameOver = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        
        osc.start();
        osc.stop(now + 1.5);
    }, [isMuted, resume]);

    const playCarMove = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        // Bruit de friction/moteur court
        // MODIF IPHONE: Fréquence BEAUCOUP plus haute (400-600Hz) pour être audible sur petits haut-parleurs
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(500, now + 0.15);

        // Volume boosté pour mobile
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }, [isMuted, resume]);

    const playCarExit = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        // Création de l'effet moteur (Sawtooth wave pour le côté mécanique)
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        
        // Simulation d'accélération (pitch qui monte)
        // MODIF IPHONE: Départ à 600Hz, monte à 1200Hz. Très audible.
        osc.frequency.setValueAtTime(600, now); 
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8); 

        // Filtre très ouvert
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.linearRampToValueAtTime(4000, now + 0.8);

        // Volume boosté
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.8);
    }, [isMuted, resume]);

    return { 
        playMove, 
        playRotate, 
        playLand, 
        playClear, 
        playVictory,
        playGameOver, 
        playCarMove, 
        playCarExit, 
        isMuted, 
        toggleMute,
        resumeAudio: resume
    };
};
