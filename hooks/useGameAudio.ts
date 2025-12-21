import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

// --- TYPES DE DÉFINITION SONORE ---
type AudioParams = {
    freq?: number;
    type?: OscillatorType;
    duration?: number;
    gainVal?: number;
    startTime?: number;
    pitchEnd?: number;
    useLinearRamp?: boolean;
    filter?: { type: BiquadFilterType; freq: number; q?: number; freqEnd?: number };
    lfo?: { type: OscillatorType; freq: number; gain: number };
};

type SoundEffect = {
  haptic?: number | number[];
  play: (ctx: AudioContext, params?: any) => void;
};

// --- FONCTIONS DE GÉNÉRATION DE SONS ---

/**
 * Joue un son de base avec des paramètres simples.
 */
const _playTone = (ctx: AudioContext, { freq = 440, type = 'sine', duration = 0.1, gainVal = 0.1, startTime = ctx.currentTime, pitchEnd, useLinearRamp = false, filter, lfo }: AudioParams = {}) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    let lastNode: AudioNode = osc;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (pitchEnd) {
        if(useLinearRamp) osc.frequency.linearRampToValueAtTime(pitchEnd, startTime + duration);
        else osc.frequency.exponentialRampToValueAtTime(pitchEnd, startTime + duration);
    }

    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    if (filter) {
        const filterNode = ctx.createBiquadFilter();
        filterNode.type = filter.type;
        filterNode.frequency.setValueAtTime(filter.freq, startTime);
        if(filter.q) filterNode.Q.setValueAtTime(filter.q, startTime);
        if(filter.freqEnd) filterNode.frequency.linearRampToValueAtTime(filter.freqEnd, startTime + duration);
        lastNode.connect(filterNode);
        lastNode = filterNode;
    }
    
    if (lfo) {
        const lfoNode = ctx.createOscillator();
        lfoNode.type = lfo.type;
        lfoNode.frequency.value = lfo.freq;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = lfo.gain;
        lfoNode.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfoNode.start(startTime);
        lfoNode.stop(startTime + duration);
    }

    lastNode.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
};

// --- BIBLIOTHÈQUE DE SONS CENTRALISÉE ---
// Chaque son est défini ici pour une maintenance facile.

const SOUND_DEFINITIONS: Record<string, SoundEffect> = {
  move: { haptic: 10, play: (ctx) => _playTone(ctx, { freq: 300, type: 'square', duration: 0.05, gainVal: 0.03 }) },
  rotate: { haptic: 15, play: (ctx) => _playTone(ctx, { freq: 450, type: 'triangle', duration: 0.05, gainVal: 0.03 }) },
  land: { haptic: 25, play: (ctx) => _playTone(ctx, { freq: 100, type: 'sawtooth', duration: 0.1, gainVal: 0.05 }) },
  paddleHit: { haptic: 20, play: (ctx) => _playTone(ctx, { freq: 120, type: 'square', duration: 0.05, gainVal: 0.1 }) },
  blockHit: { haptic: 15, play: (ctx) => _playTone(ctx, { freq: 440, type: 'triangle', duration: 0.05, gainVal: 0.05 }) },
  wallHit: { haptic: 10, play: (ctx) => _playTone(ctx, { freq: 200, type: 'sine', duration: 0.05, gainVal: 0.04 }) },
  pacmanWaka: { play: (ctx) => _playTone(ctx, { freq: 200, duration: 0.2, type: 'triangle', gainVal: 0.1, pitchEnd: 400 }) },
  
  clear: {
    haptic: [30, 50, 30],
    play: (ctx) => {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        _playTone(ctx, { freq, duration: 0.3, gainVal: 0.05, startTime: ctx.currentTime + i * 0.08 });
      });
    },
  },
  victory: {
    haptic: [50, 50, 50, 50, 100],
    play: (ctx) => {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const times = [0, 0.15, 0.3, 0.6];
      const durations = [0.15, 0.15, 0.3, 0.8];
      notes.forEach((freq, i) => _playTone(ctx, { freq, type: 'triangle', duration: durations[i], startTime: ctx.currentTime + times[i], gainVal: 0.1 }));
    },
  },
  coin: {
      haptic: [10, 10],
      play: (ctx) => {
          _playTone(ctx, { freq: 1200, duration: 0.6, gainVal: 0.1, pitchEnd: 1800 });
          _playTone(ctx, { freq: 1800, duration: 0.4, gainVal: 0.05, pitchEnd: 3000 });
      }
  },
  gameOver: { haptic: 400, play: (ctx) => _playTone(ctx, { freq: 300, duration: 1.5, gainVal: 0.1, type: 'sawtooth', pitchEnd: 50, useLinearRamp: true }) },
  loseLife: { haptic: 200, play: (ctx) => _playTone(ctx, { freq: 200, duration: 0.5, gainVal: 0.1, type: 'sawtooth', pitchEnd: 80, useLinearRamp: true }) },
  splash: { haptic: 30, play: (ctx) => _playTone(ctx, { freq: 400, duration: 0.2, gainVal: 0.2, pitchEnd: 100 }) },
  goalScore: { haptic: [30, 30], play: (ctx) => _playTone(ctx, { freq: 440, duration: 0.5, gainVal: 0.2, pitchEnd: 880 }) },
  powerUpSpawn: { play: (ctx) => _playTone(ctx, { freq: 1200, duration: 0.1, gainVal: 0.1, pitchEnd: 1800 }) },
  laserShoot: { haptic: 5, play: (ctx) => _playTone(ctx, { freq: 1200, duration: 0.15, gainVal: 0.05, type: 'sawtooth', pitchEnd: 300 }) },
  pacmanPower: { haptic: 30, play: (ctx) => _playTone(ctx, { freq: 600, duration: 0.4, gainVal: 0.1, pitchEnd: 1200, useLinearRamp: true }) },
  pacmanEatGhost: { haptic: [50, 50], play: (ctx) => _playTone(ctx, { freq: 800, duration: 0.3, gainVal: 0.2, type: 'sawtooth', pitchEnd: 1600 }) },
  
  // Sons complexes avec filtres ou LFO
  carMove: { haptic: 10, play: (ctx) => _playTone(ctx, { freq: 400, duration: 0.15, gainVal: 0.25, type: 'sawtooth', pitchEnd: 600, useLinearRamp: true, filter: { type: 'lowpass', freq: 1000, freqEnd: 500 }}) },
  carExit: { haptic: [50, 100], play: (ctx) => _playTone(ctx, { freq: 600, duration: 0.8, gainVal: 0.5, type: 'sawtooth', pitchEnd: 1200, filter: { type: 'lowpass', freq: 2000, freqEnd: 4000 }}) },
  explosion: { haptic: [80, 40, 80], play: (ctx) => {
      _playTone(ctx, { freq: 200, duration: 0.5, gainVal: 0.3, type: 'sawtooth', pitchEnd: 20, filter: { type: 'lowpass', freq: 800, freqEnd: 100 } });
      _playTone(ctx, { freq: 100, duration: 0.3, gainVal: 0.2, type: 'square', pitchEnd: 50, useLinearRamp: true });
  }},
  shipSink: { haptic: [100, 50, 200], play: (ctx) => {
      _playTone(ctx, { freq: 100, duration: 1.5, gainVal: 0.5, type: 'sawtooth', pitchEnd: 10, filter: { type: 'lowpass', freq: 200, freqEnd: 50 } });
      _playTone(ctx, { freq: 80, duration: 1.0, gainVal: 0.1, type: 'square', pitchEnd: 20 });
  }},
  
  // Sons paramétrés
  blockDestroy: {
    haptic: 20,
    play: (ctx, params) => {
      const blockType = params?.blockType;
      let p: AudioParams = { freq: 300, type: 'triangle', gainVal: 0.05 };
      switch (blockType) {
        case 'I': p = { freq: 1200, type: 'sine' }; break;
        case 'J': p = { freq: 200, type: 'square' }; break;
        case 'L': p = { freq: 400, type: 'sawtooth' }; break;
        case 'O': p = { freq: 100, type: 'square', gainVal: 0.08 }; break;
        case 'S': p = { freq: 800, type: 'sawtooth' }; break;
        case 'T': p = { freq: 600, type: 'sine' }; break;
        case 'Z': p = { freq: 250, type: 'sawtooth' }; break;
      }
      _playTone(ctx, { ...p, duration: 0.1, pitchEnd: (p.freq || 400) / 2 });
    },
  },
  powerUpCollect: {
      haptic: [20, 20],
      play: (ctx, params) => {
          const type = params?.type;
          let p: AudioParams = { duration: 0.3, gainVal: 0.1 };
          if (type === 'PADDLE_GROW') p = { ...p, freq: 400, type: 'triangle', pitchEnd: 800, useLinearRamp: true };
          else if (type === 'PADDLE_SHRINK') p = { ...p, freq: 800, type: 'sawtooth', pitchEnd: 300, useLinearRamp: true };
          else if (type === 'LASER_PADDLE') p = { ...p, freq: 150, type: 'sawtooth', pitchEnd: 800, useLinearRamp: true, lfo: { type: 'square', freq: 20, gain: 500 }};
          else p = { ...p, freq: 800, type: 'sine', pitchEnd: 1500 };
          _playTone(ctx, p);
      }
  },
};

// --- LE HOOK ---
export const useGameAudio = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);

    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && !audioCtx.current) {
            audioCtx.current = new AudioContextClass();
        }
        const savedVib = localStorage.getItem('neon-vibration');
        if (savedVib !== null) setIsVibrationEnabled(savedVib === 'true');

        return () => {
            if (audioCtx.current && audioCtx.current.state !== 'closed') {
                audioCtx.current.close().catch(console.error);
                audioCtx.current = null;
            }
        };
    }, []);

    const resume = useCallback(() => {
        if (audioCtx.current?.state === 'suspended') {
            audioCtx.current.resume().catch(console.error);
        }
    }, []);
    
    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    
    const toggleVibration = useCallback(() => {
        setIsVibrationEnabled(prev => {
            const newState = !prev;
            localStorage.setItem('neon-vibration', String(newState));
            if (newState && navigator.vibrate) navigator.vibrate(50);
            return newState;
        });
    }, []);

    const triggerAudioHaptic = useCallback((duration: number) => {
        if (isMuted || !audioCtx.current) return;
        resume();
        _playTone(audioCtx.current, { freq: 50, duration: Math.max(0.05, Math.min(duration / 1000, 0.2)), gainVal: 0.3 });
    }, [isMuted, resume]);

    const vibrate = useCallback((pattern: number | number[]) => {
        if (!isVibrationEnabled) return;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (navigator.vibrate && !isIOS) {
            try { navigator.vibrate(pattern); } catch (e) {}
        } else {
            const duration = Array.isArray(pattern) ? pattern[0] : pattern;
            if (typeof duration === 'number' && duration < 200) {
                triggerAudioHaptic(duration);
            }
        }
    }, [isVibrationEnabled, triggerAudioHaptic]);

    const playSound = useCallback((soundName: keyof typeof SOUND_DEFINITIONS, params?: any) => {
        if (isMuted || !audioCtx.current) return;
        resume();

        const sound = SOUND_DEFINITIONS[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found.`);
            return;
        }

        if (sound.haptic) vibrate(sound.haptic);
        try {
            sound.play(audioCtx.current, params);
        } catch (e) {
            console.error(`Failed to play sound "${soundName}":`, e);
        }
    }, [isMuted, resume, vibrate]);
    
    // API exportée, memoizée pour garantir des références stables
    const audioApi = useMemo(() => ({
        isMuted,
        toggleMute,
        isVibrationEnabled,
        toggleVibration,
        resumeAudio: resume,
        playMove: () => playSound('move'),
        playRotate: () => playSound('rotate'),
        playLand: () => playSound('land'),
        playClear: () => playSound('clear'),
        playVictory: () => playSound('victory'),
        playGameOver: () => playSound('gameOver'),
        playCoin: () => playSound('coin'),
        playCarMove: () => playSound('carMove'),
        playCarExit: () => playSound('carExit'),
        playPaddleHit: () => playSound('paddleHit'),
        playBlockHit: () => playSound('blockHit'),
        playWallHit: () => playSound('wallHit'),
        playLoseLife: () => playSound('loseLife'),
        playPowerUpSpawn: () => playSound('powerUpSpawn'),
        playLaserShoot: () => playSound('laserShoot'),
        playPacmanWaka: () => playSound('pacmanWaka'),
        playPacmanEatGhost: () => playSound('pacmanEatGhost'),
        playPacmanPower: () => playSound('pacmanPower'),
        playShipSink: () => playSound('shipSink'),
        playSplash: () => playSound('splash'),
        playExplosion: () => playSound('explosion'),
        playGoalScore: () => playSound('goalScore'),
        playBlockDestroy: (blockType: string) => playSound('blockDestroy', { blockType }),
        playPowerUpCollect: (type: string) => playSound('powerUpCollect', { type }),
    }), [isMuted, isVibrationEnabled, toggleMute, toggleVibration, resume, playSound]);

    return audioApi;
};
