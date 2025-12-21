
import React, { useRef, useEffect } from 'react';
import { Home, RefreshCw, Trophy, Ghost, ArrowRight, Star, Zap, Skull, Shield, Play, HelpCircle } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePacmanEngine, DIFFICULTY_SETTINGS, GHOST_COLORS, TRAIL_LIFETIME } from './hooks/usePacmanEngine';
import { TutorialOverlay } from '../Tutorials';
import { COLS, ROWS } from './level';

interface PacmanGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const PacmanGame: React.FC<PacmanGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    
    const engine = usePacmanEngine(audio, addCoins, onReportProgress);
    const { 
        score, lives, level, difficulty, gameStep, setGameStep,
        gameOver, gameWon, levelComplete, isPlaying, setIsPlaying, earnedCoins, highScore,
        pacmanRef, ghostsRef, gridRef, trailsRef, isDyingRef,
        startGame, resetLevel, resumeAudio
    } = engine;

    const [showTutorial, setShowTutorial] = React.useState(false);
    
    // FX Refs
    const fxCanvasRef = useRef<HTMLCanvasElement>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const survivalTimerRef = useRef<any>(null);
    
    const [, setTick] = React.useState(0); // Force re-render for canvas

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_pacman_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_pacman_tutorial_seen', 'true');
        }
    }, []);

    // Survival Quest Timer (UI Side effect)
    useEffect(() => {
        if (isPlaying && !gameOver && !gameWon && !levelComplete && !showTutorial) {
            survivalTimerRef.current = setInterval(() => {
                if (onReportProgress) onReportProgress('action', 1); // 1 second survived
            }, 1000);
        } else {
            if (survivalTimerRef.current) clearInterval(survivalTimerRef.current);
        }
        return () => { if (survivalTimerRef.current) clearInterval(survivalTimerRef.current); };
    }, [isPlaying, gameOver, gameWon, levelComplete, onReportProgress, showTutorial]);

    // --- TRAILS RENDER LOOP ---
    const updateTrails = () => {
        const ctx = fxCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Clear Canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Add new particles
        ghostsRef.current.forEach(g => {
            if (g.mode === 'EATEN' || g.mode === 'AT_HOME') return; 
            
            let color = GHOST_COLORS[g.color];
            if (g.mode === 'FRIGHTENED') color = GHOST_COLORS['frightened'];
            
            trailsRef.current.push({
                x: g.pos.x,
                y: g.pos.y,
                color: color,
                life: TRAIL_LIFETIME,
                maxLife: TRAIL_LIFETIME,
                size: 0.6
            });
        });

        // Update and Draw Particles
        const scaleX = ctx.canvas.width / COLS;
        const scaleY = ctx.canvas.height / ROWS;

        for (let i = trailsRef.current.length - 1; i >= 0; i--) {
            const p = trailsRef.current[i];
            p.life--;
            
            if (p.life <= 0) {
                trailsRef.current.splice(i, 1);
                continue;
            }

            const alpha = p.life / p.maxLife;
            const radius = (p.size / 2) * scaleX * alpha;
            const cx = (p.x + 0.5) * scaleX; 
            const cy = (p.y + 0.5) * scaleY;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.6; 
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    };

    // Render Loop for Trails & Refresh
    useEffect(() => {
        let animId: number;
        const render = () => {
            if (isPlaying && !gameOver && !gameWon && !levelComplete && gameStep === 'PLAYING') {
                updateTrails();
                setTick(t => t + 1); // Trigger React render for DOM elements (Pacman, Ghosts)
            }
            animId = requestAnimationFrame(render);
        };
        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [isPlaying, gameOver, gameWon, levelComplete, gameStep]);


    // --- CONTROLS ---

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver || gameWon || levelComplete || gameStep !== 'PLAYING' || isDyingRef.current || showTutorial) return;
            const key = e.key;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                e.preventDefault();
                resumeAudio();
                if (!isPlaying) setIsPlaying(true);
                
                if (key === 'ArrowUp') pacmanRef.current.nextDir = 'UP';
                if (key === 'ArrowDown') pacmanRef.current.nextDir = 'DOWN';
                if (key === 'ArrowLeft') pacmanRef.current.nextDir = 'LEFT';
                if (key === 'ArrowRight') pacmanRef.current.nextDir = 'RIGHT';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameOver, gameWon, levelComplete, isPlaying, resumeAudio, gameStep, showTutorial]);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || isDyingRef.current || showTutorial) return;
        
        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartRef.current.x;
        const diffY = touch.clientY - touchStartRef.current.y;
        const threshold = 6; 

        if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
            resumeAudio();
            if (!isPlaying && !gameOver && !gameWon && !levelComplete && gameStep === 'PLAYING') setIsPlaying(true);

            if (Math.abs(diffX) > Math.abs(diffY)) {
                pacmanRef.current.nextDir = diffX > 0 ? 'RIGHT' : 'LEFT';
            } else {
                pacmanRef.current.nextDir = diffY > 0 ? 'DOWN' : 'UP';
            }
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchEnd = () => { touchStartRef.current = null; };

    const handleLocalBack = () => {
        if (gameStep === 'DIFFICULTY') setGameStep('MENU');
        else if (gameStep === 'PLAYING') setGameStep('MENU');
        else onBack();
    };

    const getStyle = (x: number, y: number) => ({
        left: `${(x / COLS) * 100}%`,
        top: `${(y / ROWS) * 100}%`,
        width: `${(1 / COLS) * 100}%`,
        height: `${(1 / ROWS) * 100}%`,
    });

    // --- MENU VIEWS ---
    
    if (gameStep === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15]">NEON PAC</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => setGameStep('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-yellow-400 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                        <Play size={24} className="text-yellow-400"/> JOUER
                    </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    if (gameStep === 'DIFFICULTY') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h2 className="text-3xl font-black text-white mb-8">DIFFICULTÉ</h2>
                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    {(Object.keys(DIFFICULTY_SETTINGS) as (keyof typeof DIFFICULTY_SETTINGS)[]).map(d => {
                        const s = DIFFICULTY_SETTINGS[d];
                        return (
                            <button 
                                key={d} 
                                onClick={() => startGame(d)}
                                className={`group flex items-center justify-between px-6 py-4 border-2 rounded-xl transition-all ${s.color} hover:bg-gray-800`}
                            >
                                <div className="flex items-center gap-3">
                                    {d === 'EASY' && <Shield size={24}/>}
                                    {d === 'MEDIUM' && <Zap size={24}/>}
                                    {d === 'HARD' && <Skull size={24}/>}
                                    <span className="font-bold">{s.name}</span>
                                </div>
                                <div className="text-[10px] flex flex-col items-end opacity-70 group-hover:opacity-100">
                                    <span>VIES: {s.lives}</span>
                                    <span>SCORE: x{s.scoreMult}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setGameStep('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
            </div>
        );
    }

    // --- GAME RENDER ---

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <style>{`
                @keyframes chomp-upper { 0% { transform: rotate(-30deg); } 50% { transform: rotate(0deg); } 100% { transform: rotate(-30deg); } }
                @keyframes chomp-lower { 0% { transform: rotate(30deg); } 50% { transform: rotate(0deg); } 100% { transform: rotate(30deg); } }
            `}</style>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            {showTutorial && <TutorialOverlay gameId="pacman" onClose={() => setShowTutorial(false)} />}

            {/* HEADER */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowRight className="rotate-180" size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] pr-2">NEON PAC</h1>
                    <div className="flex gap-2">
                        <span className="text-[10px] text-yellow-300 font-bold tracking-widest bg-yellow-900/30 px-2 rounded border border-yellow-500/30">NIVEAU {level}</span>
                        <span className={`text-[10px] font-bold tracking-widest bg-gray-900/50 px-2 rounded border ${DIFFICULTY_SETTINGS[difficulty].color}`}>{DIFFICULTY_SETTINGS[difficulty].name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-yellow-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => startGame(difficulty)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* STATS */}
            <div className="w-full max-w-lg flex justify-between items-center px-6 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span></div>
            </div>
            <div className="w-full max-w-lg flex gap-2 px-6 mb-4 z-10">
                 {Array.from({ length: DIFFICULTY_SETTINGS[difficulty].lives }).map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full bg-yellow-400 ${i < lives ? 'opacity-100' : 'opacity-20'}`} />))}
            </div>
            
            {/* GAME BOARD */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative z-10 min-h-0 pb-6">
                <div className="relative w-full h-auto aspect-[19/21] bg-black/80 border-2 border-blue-900/50 rounded-lg shadow-[0_0_20px_rgba(30,58,138,0.3)] overflow-hidden backdrop-blur-md">
                    
                    {/* TRAIL FX CANVAS */}
                    <canvas 
                        ref={fxCanvasRef}
                        width={COLS * 20}
                        height={ROWS * 20}
                        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70"
                    />

                    {/* GRID RENDER */}
                    {gridRef.current.map((row, r) => (row.map((cell, c) => {
                        if (cell === 0) return null;
                        const style = getStyle(c, r);
                        if (cell === 1) return (<div key={`${r}-${c}`} className="absolute bg-blue-900/30 border border-blue-500/30 rounded-sm" style={style} />);
                        if (cell === 2) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-[15%] h-[15%] bg-yellow-200/50 rounded-full" /></div>);
                        if (cell === 3) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-[40%] h-[40%] bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]" /></div>);
                        if (cell === 4) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-full h-[10%] bg-pink-500/50" /></div>);
                        return null;
                    })))}

                    {/* GHOSTS RENDER */}
                    {ghostsRef.current.map(g => {
                        const style = getStyle(g.pos.x, g.pos.y);
                        const isFrightened = g.mode === 'FRIGHTENED';
                        const isEaten = g.mode === 'EATEN';
                        const colorClass = isFrightened ? 'text-blue-300' : g.color === 'red' ? 'text-red-500' : g.color === 'pink' ? 'text-pink-400' : g.color === 'cyan' ? 'text-cyan-400' : 'text-orange-400';
                        return (<div key={g.id} className={`absolute flex items-center justify-center z-20`} style={{...style, transform: 'scale(1.2)', transition: 'none'}}>
                            {isEaten ? (<div className="relative w-full h-full flex items-center justify-center"><div className="w-1/3 h-1/3 bg-white rounded-full absolute -translate-x-1/4" /><div className="w-1/3 h-1/3 bg-white rounded-full absolute translate-x-1/4" /></div>)
                            : (<Ghost size={24} className={`${colorClass} ${isFrightened ? 'animate-pulse' : ''} drop-shadow-[0_0_5px_currentColor]`} fill="currentColor" />)}
                        </div>);
                    })}
                    
                    {/* PACMAN RENDER */}
                    <div className="absolute flex items-center justify-center z-20" 
                         style={{
                             ...getStyle(pacmanRef.current.pos.x, pacmanRef.current.pos.y), 
                             transform: `scale(0.9) rotate(${pacmanRef.current.dir === 'RIGHT' ? 0 : pacmanRef.current.dir === 'DOWN' ? 90 : pacmanRef.current.dir === 'LEFT' ? 180 : -90}deg)`, 
                             transition: 'none'
                         }}>
                        <div className="w-full h-full relative">
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-yellow-400 rounded-t-full animate-[chomp-upper_0.2s_infinite_linear] origin-bottom shadow-[0_0_10px_#facc15]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-yellow-400 rounded-b-full animate-[chomp-lower_0.2s_infinite_linear] origin-top shadow-[0_0_10px_#facc15]"></div>
                        </div>
                    </div>

                    {!isPlaying && !gameOver && !gameWon && !levelComplete && !showTutorial && (<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm pointer-events-none"><p className="text-white font-bold animate-pulse tracking-widest">GLISSEZ POUR JOUER</p></div>)}
                    
                    {levelComplete && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in">
                            <h2 className="text-4xl font-black text-green-400 italic mb-2">NIVEAU {level} TERMINÉ !</h2>
                            <div className="flex gap-1 mb-4">{Array.from({length: 3}).map((_,i) => <Star key={i} className="text-yellow-400 animate-bounce" style={{animationDelay: `${i*0.2}s`}} fill="currentColor"/>)}</div>
                            <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Trophy className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+50 PIÈCES</span></div>
                            <p className="text-white animate-pulse text-xs tracking-widest">NIVEAU SUIVANT...</p>
                        </div>
                    )}

                    {gameOver && (<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in"><h2 className="text-4xl font-black text-red-500 italic mb-2">GAME OVER</h2>{earnedCoins > 0 && (<div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Trophy className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<button onClick={() => startGame(difficulty)} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-500">REJOUER</button></div>)}
                    
                    {gameWon && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in">
                            <h2 className="text-4xl font-black text-green-400 italic mb-2">VICTOIRE TOTALE !</h2>
                            <p className="text-gray-300 text-sm mb-4 text-center max-w-[200px]">Tu as terminé tous les niveaux en mode {DIFFICULTY_SETTINGS[difficulty].name} !</p>
                            {earnedCoins > 0 && (<div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Trophy className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}
                            <button onClick={() => setGameStep('MENU')} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500">MENU</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
