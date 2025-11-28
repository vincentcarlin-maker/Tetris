
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
    
    // Son général d'effacement de ligne (Arpège montant)
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

    // Son spécifique pour chaque type de bloc détruit
    const playBlockDestroy = useCallback((blockType: string) => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        // Paramètres par défaut
        let freq = 400;
        let type: OscillatorType = 'triangle';
        let duration = 0.1;
        let vol = 0.05;

        // Signature sonore par pièce
        switch (blockType) {
            case 'I': // Cyan: Cristallin, aigu
                freq = 1200;
                type = 'sine';
                break;
            case 'J': // Bleu: Profond
                freq = 200;
                type = 'square';
                break;
            case 'L': // Orange: Bois/Medium
                freq = 400;
                type = 'sawtooth';
                break;
            case 'O': // Jaune: Lourd, basse
                freq = 100;
                type = 'square';
                vol = 0.08;
                break;
            case 'S': // Vert: Electrique, Zappy
                freq = 800;
                type = 'sawtooth';
                break;
            case 'T': // Violet: Magique
                freq = 600;
                type = 'sine';
                break;
            case 'Z': // Rouge: Agressif, crunch
                freq = 250;
                type = 'sawtooth';
                break;
            default:
                freq = 300;
        }

        osc.type = type;
        
        // Petit effet de "pitch drop" pour l'effet destruction
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, now + duration);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + duration);

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

    // Breaker sounds
    const playPaddleHit = useCallback(() => playTone(120, 'square', 0.05, 0.1), [playTone]);
    const playBlockHit = useCallback(() => playTone(440, 'triangle', 0.05, 0.05), [playTone]);
    const playWallHit = useCallback(() => playTone(200, 'sine', 0.05, 0.04), [playTone]);
    const playLoseLife = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start();
        osc.stop(now + 0.5);
    }, [isMuted, resume]);

    // Power Up Spawn (Petit son aigu "magique")
    const playPowerUpSpawn = useCallback(() => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start();
        osc.stop(now + 0.1);
    }, [isMuted, resume]);

    // Power Up Collect (Distinct selon le type)
    const playPowerUpCollect = useCallback((type: string) => {
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        
        if (type === 'PADDLE_GROW') {
            // Son montant (positif)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        } else if (type === 'PADDLE_SHRINK') {
            // Son descendant (négatif)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.3);
        } else if (type === 'EXTRA_LIFE') {
            // Son "1-Up" très aigu et joyeux
            osc.type = 'square';
            osc.frequency.setValueAtTime(1046.5, now); // C6
            osc.frequency.setValueAtTime(1318.5, now + 0.1); // E6
            gain.gain.setValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            // On triche un peu pour le 1-up, on fait juste un saut ici
        } else if (type === 'MULTI_BALL') {
            // Son rapide vibrant
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            // Modulation simple par arpege rapide
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.05);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
        } else {
            // Default (Speed change) - Sci-fi sweep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
        }

        osc.start();
        osc.stop(now + 0.4);

    }, [isMuted, resume]);


    return { 
        playMove, 
        playRotate, 
        playLand, 
        playClear,
        playBlockDestroy, // NEW
        playVictory,
        playGameOver, 
        playCarMove, 
        playCarExit, 
        playPaddleHit,
        playBlockHit, 
        playWallHit, 
        playLoseLife,
        playPowerUpSpawn,
        playPowerUpCollect,
        isMuted, 
        toggleMute,
        resumeAudio: resume
    };
};
