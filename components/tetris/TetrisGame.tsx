
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
    VolumeX, Home, Coins, HelpCircle, Layers 
} from 'lucide-react';

interface TetrisGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

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

    // Gestion du focus automatique pour le clavier
    useEffect(() => {
        if (!inMenu && !gameOver && !isPaused && !showTutorial) {
            containerRef.current?.focus();
        }
    }, [inMenu, gameOver, isPaused, showTutorial]);

    // Pattern stable pour le clavier
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver || inMenu || showTutorial) return;
        
        if (e.key.toLowerCase() === 'p') {
            setIsPaused(!isPaused);
            return;
        }

        if (isPaused) return;

        switch (e.key) {
            case 'ArrowLeft': 
                e.preventDefault();
                movePlayer(-1); 
                break;
            case 'ArrowRight': 
                e.preventDefault();
                movePlayer(1); 
                break;
            case 'ArrowDown': 
                e.preventDefault();
                drop(); 
                break;
            case 'ArrowUp': 
                e.preventDefault();
                playerRotate(board, 1); 
                playRotate(); 
                break;
            case ' ': 
                e.preventDefault(); 
                hardDrop(); 
                break;
            case 'c': 
            case 'C': 
                e.preventDefault();
                playerHold(); 
                break;
        }
    }, [gameOver, inMenu, showTutorial, isPaused, setIsPaused, movePlayer, drop, playerRotate, board, playRotate, hardDrop, playerHold]);

    const handlerRef = useRef(handleKeyDown);
    useEffect(() => {
        handlerRef.current = handleKeyDown;
    }, [handleKeyDown]);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => handlerRef.current(e);
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, []);

    // Gestures pour la zone de jeu
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
        const threshold = 30; 
        if (Math.abs(deltaX) > threshold) {
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

    const MetaBtn = ({ onClick, icon, label, active = true }: any) => (
        <button
            onPointerDown={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg bg-gray-900/80 border border-white/10 hover:bg-gray-800 active:scale-95 transition-all w-14 h-12 ${active ? 'opacity-100' : 'opacity-50'}`}
        >
            {icon}
            {label && <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase">{label}</span>}
        </button>
    );

    if (inMenu) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050510] to-black" />
                <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center pt-20 pb-12">
                    <div className="mb-12 w-full text-center">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <Layers size={48} className="text-cyan-400 drop-shadow-[0_0_20px_#00f3ff] animate-pulse" />
                            <h1 className="text-5xl font-black italic text-white drop-shadow-[0_0_15px_#bc13fe]">NEON TETRIS</h1>
                        </div>
                        <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs uppercase">Empilez • Alignez • Brillez</p>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button onPointerDown={() => startGame(0)} className="group p-6 rounded-2xl bg-gray-900/60 border border-green-500/30 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all text-left">
                            <h2 className="text-xl font-black text-white italic mb-1 group-hover:text-green-400 transition-colors uppercase">Facile</h2>
                            <p className="text-gray-400 text-xs">Vitesse lente, idéal pour s'échauffer.</p>
                        </button>
                        <button onPointerDown={() => startGame(5)} className="group p-6 rounded-2xl bg-gray-900/60 border border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all text-left">
                            <h2 className="text-xl font-black text-white italic mb-1 group-hover:text-yellow-400 transition-colors uppercase">Moyen</h2>
                            <p className="text-gray-400 text-xs">Le défi classique de l'arcade.</p>
                        </button>
                        <button onPointerDown={() => startGame(10)} className="group p-6 rounded-2xl bg-gray-900/60 border border-red-500/30 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all text-left">
                            <h2 className="text-xl font-black text-white italic mb-1 group-hover:text-red-400 transition-colors uppercase">Extrême</h2>
                            <p className="text-gray-400 text-xs">Pour les vrais maîtres de la grille.</p>
                        </button>
                    </div>

                    <button onPointerDown={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg transition-all uppercase">
                        <Home size={14} /> Retour arcade
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
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-lg px-4 pt-4 pb-2 flex justify-between items-center z-30 shrink-0">
                <MetaBtn onClick={() => setInMenu(true)} icon={<Home size={18} className="text-gray-300"/>} label="Menu"/>
                <MetaBtn onClick={toggleMute} icon={isMuted ? <VolumeX size={18} className="text-gray-400"/> : <Volume2 size={18} className="text-gray-300"/>} label={isMuted ? "Muet" : "Son"}/>
                <MetaBtn onClick={() => startGame(level)} icon={<RotateCcw size={18} className="text-gray-300"/>} label="Reset"/>
                <MetaBtn onClick={() => setShowTutorial(true)} icon={<HelpCircle size={18} className="text-cyan-400"/>} label="Aide"/>
                <MetaBtn onClick={() => setIsPaused(!isPaused)} icon={isPaused ? <Play size={18} className="text-green-400 fill-green-400"/> : <Pause size={18} className="text-yellow-400 fill-yellow-400"/>} label={isPaused ? "Go" : "Pause"} active/>
            </div>

            <div className="w-full max-w-lg px-3 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shadow-lg">
                    <span className="text-[8px] text-gray-500 absolute top-1 left-1 font-bold">RÉSERVE</span>
                    <div className="scale-75 mt-1"><HoldPiece tetromino={heldTetromino} /></div>
                </div>
                <div className="flex gap-1 flex-1 justify-center">
                    <GameInfo text="NIVEAU" value={level} />
                    <GameInfo text="SCORE" value={score} />
                    <GameInfo text="RECORD" value={highScore} />
                </div>
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shadow-lg">
                    <span className="text-[8px] text-gray-500 absolute top-1 right-1 font-bold">SUIVANT</span>
                    <div className="scale-75 mt-1"><NextPiece tetromino={nextTetromino} /></div>
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
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-lg border border-white/10">
                            <h2 className="text-4xl font-black text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase">Pause</h2>
                            <button onPointerDown={() => setIsPaused(false)} className="w-56 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-bold rounded-xl hover:bg-neon-blue hover:text-black transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] uppercase">Reprendre</button>
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg animate-in zoom-in">
                            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-600 mb-6 italic text-center uppercase tracking-tighter">Partie Finie</h2>
                            <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                                <div>
                                    <p className="text-gray-400 text-xs tracking-widest uppercase font-bold">Score</p>
                                    <p className="text-3xl font-mono text-white">{score}</p>
                                </div>
                                <div>
                                    <p className="text-neon-pink text-xs tracking-widest uppercase font-bold">Record</p>
                                    <p className="text-3xl font-mono text-neon-pink drop-shadow-[0_0_8px_#ff00ff]">{highScore}</p>
                                </div>
                            </div>
                            {earnedCoins > 0 && (
                                <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/50 animate-pulse">
                                    <Coins className="text-yellow-400" size={20} />
                                    <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}
                            <button onPointerDown={() => startGame(0)} className="px-10 py-4 bg-neon-blue text-black font-black tracking-widest text-xl rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,243,255,0.5)] uppercase">Rejouer</button>
                        </div>
                    )}
                </div>
            </div>

            {showTutorial && <TutorialOverlay gameId="tetris" onClose={() => setShowTutorial(false)} />}

            {!gameOver && (
                <div className="w-full max-w-md px-4 pb-8 pt-2 flex flex-col justify-end gap-4 z-30 shrink-0 select-none pointer-events-auto">
                    <div className="flex justify-between items-end w-full">
                        <div className="grid grid-cols-3 gap-2 w-40 h-40">
                            <div/><button onPointerDown={hardDrop} className="bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 active:bg-cyan-500/50 transition-all shadow-lg active:scale-95"><ChevronDown size={28} className="animate-bounce"/><ChevronDown size={28} className="absolute translate-y-3"/></button><div/>
                            <button onPointerDown={() => movePlayer(-1)} className="bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 active:bg-cyan-500/50 transition-all shadow-lg active:scale-95"><ArrowLeft size={32}/></button>
                            <div className="bg-gray-800/20 rounded-full border border-white/5 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-cyan-500/30 blur-[1px]"></div></div>
                            <button onPointerDown={() => movePlayer(1)} className="bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 active:bg-cyan-500/50 transition-all shadow-lg active:scale-95"><ArrowRight size={32}/></button>
                            <div/><button onPointerDown={() => drop()} className="bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 active:bg-cyan-500/50 transition-all shadow-lg active:scale-95"><ArrowDown size={32}/></button><div/>
                        </div>
                        <div className="flex flex-col gap-4 items-center">
                            <button onPointerDown={() => playerHold()} className="w-16 h-14 rounded-xl bg-gray-800 border border-white/10 flex flex-col items-center justify-center active:scale-95 transition-all text-gray-400 hover:text-white">
                                <RefreshCw size={24} />
                                <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Réserve</span>
                            </button>
                            <button onPointerDown={() => { playerRotate(board, 1); playRotate(); }} className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-pink to-purple-800 border-2 border-neon-pink/50 shadow-[0_0_25px_rgba(255,0,255,0.4)] flex flex-col items-center justify-center active:scale-95 active:shadow-[0_0_10px_rgba(255,0,255,0.6)] transition-all">
                                <RotateCw size={48} className="text-white drop-shadow-lg" />
                                <span className="text-[10px] font-black text-white mt-1 tracking-widest uppercase">Pivoter</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
