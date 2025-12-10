
import { useCallback, useEffect, useRef, useState } from 'react';

export const useGameAudio = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx.current = new AudioContextClass();
        }
        
        // Load saved preferences
        const savedVib = localStorage.getItem('neon-vibration');
        if (savedVib !== null) setIsVibrationEnabled(savedVib === 'true');

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

    const toggleVibration = useCallback(() => {
        setIsVibrationEnabled(prev => {
            const newState = !prev;
            localStorage.setItem('neon-vibration', String(newState));
            if (newState && navigator.vibrate) navigator.vibrate(50); // Feedback immediate
            return newState;
        });
    }, []);

    // --- AUDIO HAPTIC SIMULATION FOR IOS ---
    const triggerAudioHaptic = useCallback((duration: number) => {
        // Ne joue pas si muet, car cela passe par les haut-parleurs
        if (isMuted || !audioCtx.current) return;
        resume();

        try {
            const now = audioCtx.current.currentTime;
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();

            // Onde sinusoïdale basse fréquence (50Hz) pour imiter un moteur haptique
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, now); 

            // Conversion ms en secondes et limitation pour éviter les sons trop longs
            const durSec = Math.max(0.05, Math.min(duration / 1000, 0.2));

            // Enveloppe percussive courte
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

            osc.connect(gain);
            gain.connect(audioCtx.current.destination);

            osc.start(now);
            osc.stop(now + durSec);
        } catch (e) {
            // Ignore errors
        }
    }, [isMuted, resume]);

    // Haptic Helper with Fallback
    const vibrate = useCallback((pattern: number | number[]) => {
        if (!isVibrationEnabled) return;

        // Détection iOS simplifiée (UserAgent + Platform)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Si l'appareil supporte vibrate nativement (Android) et n'est pas iOS
        if (navigator.vibrate && !isIOS) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore errors on devices that don't support it well
            }
        } else {
            // Fallback pour iOS : Utiliser le son pour simuler l'impact
            const duration = Array.isArray(pattern) ? pattern[0] : pattern;
            // On ne déclenche que pour les vibrations courtes (impacts), pas les longues (game over)
            if (typeof duration === 'number' && duration < 200) {
                triggerAudioHaptic(duration);
            }
        }
    }, [isVibrationEnabled, triggerAudioHaptic]);

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

    const playMove = useCallback(() => {
        playTone(300, 'square', 0.05, 0.03);
        vibrate(10); // Micro tick
    }, [playTone, vibrate]);
    
    const playRotate = useCallback(() => {
        playTone(450, 'triangle', 0.05, 0.03);
        vibrate(15); // Small tick
    }, [playTone, vibrate]);
    
    const playLand = useCallback(() => {
        playTone(100, 'sawtooth', 0.1, 0.05);
        vibrate(25); // Soft thud
    }, [playTone, vibrate]);
    
    // Son général d'effacement de ligne (Arpège montant)
    const playClear = useCallback(() => {
        vibrate([30, 50, 30]); // Pattern for clear
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
    }, [isMuted, resume, vibrate]);

    // Son spécifique pour chaque type de bloc détruit
    const playBlockDestroy = useCallback((blockType: string) => {
        vibrate(20); // Hit feeling
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

    }, [isMuted, resume, vibrate]);

    const playVictory = useCallback(() => {
        vibrate([50, 50, 50, 50, 100]); // Celebration pattern
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
    }, [isMuted, resume, vibrate]);

    const playGameOver = useCallback(() => {
        vibrate(400); // Long fail rumble
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
    }, [isMuted, resume, vibrate]);

    const playCarMove = useCallback(() => {
        vibrate(10); // Engine tick
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(500, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }, [isMuted, resume, vibrate]);

    const playCarExit = useCallback(() => {
        vibrate([50, 100]); // Vroom vroom
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now); 
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8); 

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.linearRampToValueAtTime(4000, now + 0.8);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.8);
    }, [isMuted, resume, vibrate]);

    // Breaker sounds
    const playPaddleHit = useCallback(() => {
        playTone(120, 'square', 0.05, 0.1);
        vibrate(20);
    }, [playTone, vibrate]);
    
    const playBlockHit = useCallback(() => {
        playTone(440, 'triangle', 0.05, 0.05);
        vibrate(15);
    }, [playTone, vibrate]);
    
    const playWallHit = useCallback(() => {
        playTone(200, 'sine', 0.05, 0.04);
        vibrate(10);
    }, [playTone, vibrate]);
    
    const playLoseLife = useCallback(() => {
        vibrate(200);
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
    }, [isMuted, resume, vibrate]);

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

    const playPowerUpCollect = useCallback((type: string) => {
        vibrate([20, 20]);
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
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        } else if (type === 'PADDLE_SHRINK') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.3);
        } else if (type === 'EXTRA_LIFE') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1046.5, now); // C6
            osc.frequency.setValueAtTime(1318.5, now + 0.1); // E6
            gain.gain.setValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        } else if (type === 'MULTI_BALL') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.05);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
        } else if (type === 'LASER_PADDLE') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.4);
            // Modulation
            const lfo = audioCtx.current.createOscillator();
            lfo.type = 'square';
            lfo.frequency.value = 20;
            const lfoGain = audioCtx.current.createGain();
            lfoGain.gain.value = 500;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(now);
            lfo.stop(now + 0.4);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
        }

        osc.start();
        osc.stop(now + 0.4);

    }, [isMuted, resume, vibrate]);
    
    const playLaserShoot = useCallback(() => {
        vibrate(5);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start();
        osc.stop(now + 0.15);
    }, [isMuted, resume, vibrate]);

    // PACMAN SOUNDS
    const playPacmanWaka = useCallback(() => {
        // No vibrate for waka to avoid spam
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        osc.frequency.linearRampToValueAtTime(200, now + 0.2);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }, [isMuted, resume]);

    const playPacmanEatGhost = useCallback(() => {
        vibrate([50, 50]);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }, [isMuted, resume, vibrate]);
    
    const playPacmanPower = useCallback(() => {
        vibrate(30);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.4);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }, [isMuted, resume, vibrate]);

    const playCoin = useCallback(() => {
        vibrate([10, 10]);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        // Base frequency
        const freq = 1200;

        // Oscillator 1 (Main tone)
        const osc1 = audioCtx.current.createOscillator();
        const gain1 = audioCtx.current.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1); // Slight pitch up
        
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain1);
        gain1.connect(audioCtx.current.destination);
        osc1.start(now);
        osc1.stop(now + 0.6);

        // Oscillator 2 (Upper harmonic/Ring)
        const osc2 = audioCtx.current.createOscillator();
        const gain2 = audioCtx.current.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.5, now); // Higher start
        osc2.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.1);

        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc2.connect(gain2);
        gain2.connect(audioCtx.current.destination);
        osc2.start(now);
        osc2.stop(now + 0.4);
    }, [isMuted, resume, vibrate]);

    // BATTLESHIP: Sinking Ship Sound
    const playShipSink = useCallback(() => {
        vibrate([100, 50, 200]);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        // 1. Low rumble (Explosion/Sinking)
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 1.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(50, now + 1.5);

        gain.gain.setValueAtTime(0.5, now); 
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 1.5);

        // 2. Metallic/Creaking noise
        const osc2 = audioCtx.current.createOscillator();
        const gain2 = audioCtx.current.createGain();
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(80, now);
        osc2.frequency.exponentialRampToValueAtTime(20, now + 1.0);
        
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.current.destination);
        osc2.start(now);
        osc2.stop(now + 1.0);

    }, [isMuted, resume, vibrate]);

    // BATTLESHIP: Water Splash Sound (Plouf)
    const playSplash = useCallback(() => {
        vibrate(30);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        
        // Sine wave dropping in pitch = liquid sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }, [isMuted, resume, vibrate]);

    const playExplosion = useCallback(() => {
        vibrate([80, 40, 80]);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;

        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const filter = audioCtx.current.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.current.destination);

        osc.start(now);
        osc.stop(now + 0.5);
        
        // Add some noise texture (simulated with random freq mod)
        const osc2 = audioCtx.current.createOscillator();
        const gain2 = audioCtx.current.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(100, now);
        osc2.frequency.linearRampToValueAtTime(50, now + 0.3);
        
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.current.destination);
        osc2.start(now);
        osc2.stop(now + 0.3);

    }, [isMuted, resume, vibrate]);

    const playGoalScore = useCallback(() => {
        vibrate([30, 30]);
        if (isMuted || !audioCtx.current) return;
        resume();
        const now = audioCtx.current.currentTime;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.start();
        osc.stop(now + 0.5);
    }, [isMuted, resume, vibrate]);

    return { 
        playMove, 
        playRotate, 
        playLand, 
        playClear,
        playBlockDestroy,
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
        playLaserShoot,
        playPacmanWaka,
        playPacmanEatGhost,
        playPacmanPower,
        playCoin,
        playShipSink,
        playSplash,
        playExplosion,
        playGoalScore,
        isMuted, 
        toggleMute,
        resumeAudio: resume,
        isVibrationEnabled,
        toggleVibration
    };
};
