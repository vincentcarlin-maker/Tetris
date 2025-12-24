import React, { useState, useEffect, useRef } from 'react';
import { Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RefreshCw, HelpCircle, Trophy, Coins } from 'lucide-react';
import { useSnakeLogic } from './hooks/useSnakeLogic';
import { SnakeRenderer } from './components/SnakeRenderer';
import { TutorialOverlay } from '../Tutorials';
import { Direction } from './types';
import { useHighScores } from '../../hooks/useHighScores';

interface SnakeGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: string, value: number) => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const logic = useSnakeLogic(audio, addCoins, onReportProgress);
    const { highScores } = useHighScores();
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Refs pour le contrôle par glissement (swipe)
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    // Auto-focus pour le clavier
    useEffect(() => {
        if (logic.isPlaying) {
            containerRef.current?.focus();
        }
    }, [logic.isPlaying]);

    // Handlers pour le swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || logic.gameOver) return;

        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        const threshold = 30; // Sensibilité du swipe en pixels

        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            // Déterminer la direction dominante
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal
                logic.setNextDirection(dx > 0 ? 'RIGHT' : 'LEFT');
            } else {
                // Vertical
                logic.setNextDirection(dy > 0 ? 'DOWN' : 'UP');
            }

            // Lancer le jeu si ce n'est pas déjà fait
            if (!logic.isPlaying) {
                audio?.resumeAudio?.();
                logic.setIsPlaying(true);
            }

            // Réinitialiser le point de départ pour permettre des virages successifs fluides
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };

    const DPadBtn = ({ dir, icon: Icon }: { dir: Direction, icon: any }) => (
        <button 
            onPointerDown={(e) => { e.preventDefault(); logic.setNextDirection(dir); if(!logic.isPlaying) logic.setIsPlaying(true); }} 
            className="w-16 h-16 bg-gray-800/80 rounded-2xl flex items-center justify-center border border-white/10 active:bg-green-500 active:text-black transition-all text-green-400 shadow-lg active:scale-95"
        >
            <Icon size={32} />
        </button>
    );

    return (
        <div 
            ref={containerRef}
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none overflow-y-auto outline-none"
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-900/20 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-lg flex items-center justify-between mb-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] pr-2 pb-1">NEON SNAKE</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-green-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={logic.resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center mb-4 px-4">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Score</span><span className="text-2xl font-mono font-bold text-white">{logic.score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Record</span><span className="text-2xl font-mono font-bold text-green-400">{Math.max(logic.score, highScores.snake || 0)}</span></div>
            </div>

            <div className="relative shrink-0">
                <SnakeRenderer 
                    snake={logic.snake} food={logic.food} obstacles={logic.obstacles} 
                    teleporters={logic.teleporters} bombs={logic.bombs} particlesRef={logic.particlesRef} 
                />
                
                {!logic.isPlaying && !logic.gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-20">
                        <button onClick={() => { audio?.resumeAudio?.(); logic.setIsPlaying(true); }} className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_25px_#22c55e] hover:scale-110 active:scale-95 transition-transform group">
                            <Play size={40} className="text-black ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                        </button>
                        <p className="text-white font-black tracking-[0.2em] mt-4 animate-pulse uppercase">Glissez pour jouer</p>
                    </div>
                )}

                {logic.gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-xl z-30 animate-in zoom-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                        <h2 className="text-5xl font-black italic text-white mb-2 uppercase">Game Over</h2>
                        <div className="mb-6 flex flex-col items-center">
                            <span className="text-gray-400 text-xs font-bold tracking-widest mb-1 uppercase">Score Final</span>
                            <span className="text-4xl font-mono font-black">{logic.score}</span>
                        </div>
                        {logic.earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-5 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-black text-xl">+{logic.earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        <button onClick={logic.resetGame} className="px-10 py-4 bg-green-500 text-black font-black tracking-widest text-lg rounded-2xl hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-2">
                            <RefreshCw size={24} /> REJOUER
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full max-w-xs mt-8 grid grid-cols-3 gap-3 shrink-0">
                <div />
                <div className="flex justify-center"><DPadBtn dir="UP" icon={ArrowUp}/></div>
                <div />
                <div className="flex justify-center"><DPadBtn dir="LEFT" icon={ArrowLeft}/></div>
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gray-800/20 rounded-full border border-white/5 flex items-center justify-center shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-green-500/30 blur-[1px]"></div>
                    </div>
                </div>
                <div className="flex justify-center"><DPadBtn dir="RIGHT" icon={ArrowRight}/></div>
                <div />
                <div className="flex justify-center"><DPadBtn dir="DOWN" icon={ArrowDown}/></div>
                <div />
            </div>

            {showTutorial && <TutorialOverlay gameId="snake" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};