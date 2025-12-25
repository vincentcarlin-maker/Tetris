import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Board } from '../Board';
import { GameInfo } from '../GameInfo';
import { NextPiece } from '../NextPiece';
import { HoldPiece } from '../HoldPiece';
import { TutorialOverlay } from '../Tutorials';
import { useTetrisLogic } from './hooks/useTetrisLogic';
import { 
    ArrowDown, ArrowLeft, ArrowRight, RotateCw, Play, 
    RefreshCw, ChevronDown, Pause, RotateCcw, Volume2, 
    VolumeX, Home, Coins, HelpCircle, Layers, Zap
} from 'lucide-react';

interface TetrisGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// Nouveau composant de logo Tetris pour la page d'accueil
const TetrisBrandingLogo = () => (
    <div className="flex flex-col gap-1 drop-shadow-[0_0_15px_rgba(var(--neon-accent-rgb),0.5)]">
        <div className="flex gap-1">
            <div className="w-5 h-5 bg-cyan-500 rounded-sm border border-white/20 shadow-[0_0_8px_#00f3ff]"></div>
            <div className="w-5 h-5 bg-purple-600 rounded-sm border border-white/20 shadow-[0_0_8px_#a855f7]"></div>
            <div className="w-5 h-5 bg-pink-500 rounded-sm border border-white/20 shadow-[0_0_8px_#ff00ff]"></div>
        </div>
        <div className="flex gap-1 justify-center">
            <div className="w-5 h-5 bg-yellow-400 rounded-sm border border-white/20 shadow-[0_0_8px_#facc15]"></div>
        </div>
    </div>
);

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const logic = useTetrisLogic(audio, addCoins, onReportProgress);
    const { 
        board, nextTetromino, heldTetromino,
        score, level, gameOver, isPaused, setIsPaused, inMenu, setInMenu, 
        earnedCoins, highScore, startGame, hardDrop, movePlayer, 
        playerRotate, playerHold, drop 
    } = logic;

    const [showTutorial, setShowTutorial] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const lastXMoveRef = useRef<number>(0);

    const { playRotate, isMuted, toggleMute } = audio;

    useEffect(() => {
        if (!inMenu && !gameOver && !isPaused && !showTutorial) {
            containerRef.current?.focus();
        }
    }, [inMenu, gameOver, isPaused, showTutorial]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver || inMenu || showTutorial) return;
        
        if (e.key.toLowerCase() === 'p') {
            setIsPaused(!isPaused);
            return;
        }

        if (isPaused) return;

        switch (e.key) {
            case 'ArrowLeft': e.preventDefault(); movePlayer(-1); break;
            case 'ArrowRight': e.preventDefault(); movePlayer(1); break;
            case 'ArrowDown': e.preventDefault(); drop(); break;
            case 'ArrowUp': e.preventDefault(); playerRotate(board, 1); playRotate(); break;
            case ' ': e.preventDefault(); hardDrop(); break;
            case 'c': case 'C': e.preventDefault(); playerHold(); break;
        }
    }, [gameOver, inMenu, showTutorial, isPaused, setIsPaused, movePlayer, drop, playerRotate, board, playRotate, hardDrop, playerHold]);

    const handlerRef = useRef(handleKeyDown);
    useEffect(() => { handlerRef.current = handleKeyDown; }, [handleKeyDown]);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => handlerRef.current(e);
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, []);

    const handleGestureStart = (e: any) => {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
        lastXMoveRef.current = clientX;
    };

    const handleGestureMove = (e: any) => {
        if (!touchStartRef.current || gameOver || isPaused || inMenu) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = clientX - lastXMoveRef.current;
        if (Math.abs(deltaX) > 30) {
            movePlayer(deltaX > 0 ? 1 : -1);
            lastXMoveRef.current = clientX;
        }
    };

    const handleGestureEnd = (e: any) => {
        if (!touchStartRef.current) return;
        const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0);
        const clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0);
        const duration = Date.now() - touchStartRef.current.time;
        const deltaX = clientX - touchStartRef.current.x;
        const deltaY = clientY - touchStartRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (duration < 250 && distance < 15) {
            playerRotate(board, 1);
            playRotate();
        } else if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
            hardDrop();
        }
        touchStartRef.current = null;
    };

    const MetaBtn = ({ onClick, icon, label, active = true, color = "text-gray-300" }: any) => (
        <button
            onPointerDown={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-xl bg-gray-900/80 border border-white/10 hover:bg-gray-800 active:scale-95 transition-all w-14 h-12 ${active ? 'opacity-100' : 'opacity-50'}`}
        >
            <div className={color}>{icon}</div>
            {label && <span className="text-[8px] text-gray-500 font-black mt-1 uppercase tracking-tighter">{label}</span>}
        </button>
    );

    if (inMenu) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black" />
                <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center pt-20 pb-12">
                    <div className="mb-12 w-full text-center">
                        <div className="flex flex-col items-center gap-6 mb-6">
                            <TetrisBrandingLogo />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 drop-shadow-[0_0_30px_rgba(0,243,255,0.6)] tracking-tighter px-4 pr-8">NEON TETRIS</h1>
                        </div>
                        <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm">
                            <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs uppercase italic">Empilez • Alignez • Brillez</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button onPointerDown={() => startGame(0)} className="group p-6 rounded-[32px] bg-gray-900/40 border border-green-500/30 hover:border-green-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all text-left backdrop-blur-md">
                            <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-green-400 transition-colors uppercase">Facile</h2>
                            <p className="text-gray-400 text-xs">Vitesse lente, idéal pour débuter.</p>
                        </button>
                        <button onPointerDown={() => startGame(5)} className="group p-6 rounded-[32px] bg-gray-900/40 border border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all text-left backdrop-blur-md">
                            <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-yellow-400 transition-colors uppercase">Moyen</h2>
                            <p className="text-gray-400 text-xs">Le défi standard de l'arcade.</p>
                        </button>
                        <button onPointerDown={() => startGame(10)} className="group p-6 rounded-[32px] bg-gray-900/40 border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all text-left backdrop-blur-md">
                            <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-red-400 transition-colors uppercase">Extrême</h2>
                            <p className="text-gray-400 text-xs">Vitesse foudroyante pour les experts.</p>
                        </button>
                    </div>

                    <button onPointerDown={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg transition-all uppercase tracking-widest">
                        <Home size={14} /> Retour Arcade
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            tabIndex={0}
            className="h-full w-full flex flex-col items-center bg-transparent font-sans relative touch-none overflow-hidden outline-none"
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-lg px-4 pt-4 pb-2 flex justify-between items-center z-30 shrink-0">
                <MetaBtn onClick={() => setInMenu(true)} icon={<Home size={18}/>} label="Menu"/>
                <MetaBtn onClick={toggleMute} icon={isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>} label={isMuted ? "Muet" : "Son"}/>
                <MetaBtn onClick={() => startGame(level)} icon={<RotateCcw size={18}/>} label="Reset"/>
                <MetaBtn onClick={() => setShowTutorial(true)} icon={<HelpCircle size={18}/>} label="Aide" color="text-cyan-400"/>
                <MetaBtn onClick={() => setIsPaused(!isPaused)} icon={isPaused ? <Play size={18}/> : <Pause size={18}/>} label={isPaused ? "Go" : "Pause"} color={isPaused ? "text-green-400" : "text-yellow-400"} active/>
            </div>

            <div className="w-full max-w-lg px-3 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
                <div className="flex flex-col items-center bg-black/40 border border-white/10 rounded-xl p-1 w-16 h-16 relative shadow-xl backdrop-blur-md">
                    <span className="text-[7px] text-gray-500 absolute top-1 left-2 font-black tracking-widest uppercase">Hold</span>
                    <div className="scale-75 mt-1.5"><HoldPiece tetromino={heldTetromino} /></div>
                </div>
                <div className="flex gap-1.5 flex-1 justify-center">
                    <GameInfo text="Niveau" value={level} />
                    <GameInfo text="Score" value={score} />
                    <GameInfo text="Record" value={highScore} />
                </div>
                <div className="flex flex-col items-center bg-black/40 border border-white/10 rounded-xl p-1 w-16 h-16 relative shadow-xl backdrop-blur-md">
                    <span className="text-[7px] text-gray-500 absolute top-1 right-2 font-black tracking-widest uppercase text-right">Next</span>
                    <div className="scale-75 mt-1.5"><NextPiece tetromino={nextTetromino} /></div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-lg relative z-10 min-h-0 px-4 pb-4">
                <div 
                    className="h-full max-h-full aspect-[10/20] relative shadow-2xl touch-none select-none"
                    onMouseDown={handleGestureStart}
                    onMouseMove={handleGestureMove}
                    onMouseUp={handleGestureEnd}
                    onMouseLeave={handleGestureEnd}
                    onTouchStart={handleGestureStart}
                    onTouchMove={handleGestureMove}
                    onTouchEnd={handleGestureEnd}
                >
                    <Board board={board} />
                    
                    {isPaused && !gameOver && !showTutorial && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl border border-white/10">
                            <h2 className="text-4xl font-black text-white mb-8 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] uppercase italic">Pause</h2>
                            <button onPointerDown={() => setIsPaused(false)} className="w-56 py-4 bg-neon-blue text-black font-black tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] uppercase">Reprendre</button>
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-xl animate-in zoom-in border border-white/10">
                            <Skull className="text-red-500 mb-4 animate-pulse" size={64} />
                            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-600 mb-6 italic text-center uppercase tracking-tighter">Partie Finie</h2>
                            <div className="grid grid-cols-2 gap-8 mb-8 text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase font-black mb-1">Score</p>
                                    <p className="text-3xl font-mono font-black text-white">{score}</p>
                                </div>
                                <div className="border-l border-white/10">
                                    <p className="text-neon-pink text-[10px] tracking-[0.2em] uppercase font-black mb-1">Record</p>
                                    <p className="text-3xl font-mono font-black text-neon-pink drop-shadow-[0_0_8px_#ff00ff]">{highScore}</p>
                                </div>
                            </div>
                            {earnedCoins > 0 && (
                                <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-5 py-2 rounded-full border border-yellow-500/50 animate-bounce">
                                    <Coins className="text-yellow-400" size={20} />
                                    <span className="text-yellow-100 font-black text-xl">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}
                            <button onPointerDown={() => startGame(0)} className="px-10 py-4 bg-neon-blue text-black font-black tracking-widest text-xl rounded-2xl hover:bg-white transition-all shadow-[0_0_25px_rgba(0,243,255,0.5)] uppercase active:scale-95">Rejouer</button>
                        </div>
                    )}
                </div>
            </div>

            {showTutorial && <TutorialOverlay gameId="tetris" onClose={() => setShowTutorial(false)} />}

            {!gameOver && (
                <div className="w-full max-w-md px-4 pb-8 pt-2 flex flex-col justify-end gap-4 z-30 shrink-0 select-none pointer-events-auto">
                    <div className="flex justify-between items-end w-full">
                        <div className="grid grid-cols-3 gap-2 w-44 h-44">
                            <div/><button onPointerDown={hardDrop} className="bg-gray-800/80 rounded-2xl flex items-center justify-center border border-white/10 active:bg-cyan-500 shadow-xl active:scale-95 transition-all"><ChevronDown size={32} className="animate-bounce"/><ChevronDown size={32} className="absolute translate-y-4"/></button><div/>
                            <button onPointerDown={() => movePlayer(-1)} className="bg-gray-800/80 rounded-2xl flex items-center justify-center border border-white/10 active:bg-cyan-500 shadow-xl active:scale-95 transition-all"><ArrowLeft size={40}/></button>
                            <div className="bg-gray-800/10 rounded-full border border-white/5 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-cyan-500/30 blur-[2px]"></div></div>
                            <button onPointerDown={() => movePlayer(1)} className="bg-gray-800/80 rounded-2xl flex items-center justify-center border border-white/10 active:bg-cyan-500 shadow-xl active:scale-95 transition-all"><ArrowRight size={40}/></button>
                            <div/><button onPointerDown={() => drop()} className="bg-gray-800/80 rounded-2xl flex items-center justify-center border border-white/10 active:bg-cyan-500 shadow-xl active:scale-95 transition-all"><ArrowDown size={40}/></button><div/>
                        </div>
                        <div className="flex flex-col gap-4 items-center">
                            <button onPointerDown={() => playerHold()} className="w-16 h-14 rounded-2xl bg-gray-800 border border-white/10 flex flex-col items-center justify-center active:scale-95 transition-all text-gray-400 hover:text-white shadow-lg">
                                <RefreshCw size={28} />
                                <span className="text-[8px] font-black mt-1 uppercase tracking-widest">Hold</span>
                            </button>
                            <button onPointerDown={() => { playerRotate(board, 1); playRotate(); }} className="w-32 h-32 rounded-full bg-gradient-to-br from-neon-pink via-purple-700 to-purple-900 border-4 border-white/20 shadow-[0_0_30px_rgba(255,0,255,0.4)] flex flex-col items-center justify-center active:scale-90 active:shadow-[0_0_15px_rgba(255,0,255,0.6)] transition-all group">
                                <RotateCw size={56} className="text-white drop-shadow-xl group-hover:rotate-45 transition-transform" />
                                <span className="text-[10px] font-black text-white mt-1 tracking-widest uppercase italic">Pivoter</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Skull = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 10L9.01 10" /><path d="M15 10L15.01 10" /><path d="M10 18L10 20" /><path d="M14 18L14 20" /><path d="M18 11a6 6 0 0 0-12 0c0 7 3 11 3 11h6s3-4 3-11Z" /><path d="M10 14h4" />
    </svg>
);
