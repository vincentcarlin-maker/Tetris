
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Board } from './Board';
import { GameInfo } from './GameInfo';
import { usePlayer } from '../hooks/usePlayer';
import { useBoard } from '../hooks/useBoard';
import { useHighScores } from '../hooks/useHighScores';
import { createBoard, checkCollision } from '../gameHelpers';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameAudio } from '../hooks/useGameAudio';
import { NextPiece } from './NextPiece';
import { HoldPiece } from './HoldPiece';
import { ArrowDown, ArrowLeft, ArrowRight, RotateCw, Play, RefreshCw, ChevronDown, Pause, RotateCcw, Volume2, VolumeX, Home, Coins, HelpCircle, Layers, Zap } from 'lucide-react';
import type { Player } from '../types';
import { TutorialOverlay } from './Tutorials';

interface TetrisGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const linePoints = [40, 100, 300, 1200];

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // New Menu State
    const [inMenu, setInMenu] = useState(true);

    const { player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino, heldTetromino, playerHold } = usePlayer();
    const [ghostPlayer, setGhostPlayer] = useState<Player | null>(null);
    
    const { playMove, playRotate, playLand, playClear, playBlockDestroy, playGameOver, isMuted, toggleMute } = audio;

    const { board, setBoard, rowsCleared } = useBoard(player, resetPlayer, ghostPlayer, playBlockDestroy);
    
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.tetris || 0;

    const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const lastXMoveRef = useRef<number>(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_tetris_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_tetris_tutorial_seen', 'true');
        }
    }, []);
    
    useEffect(() => {
        if (rowsCleared > 0) {
            playClear();
            const newPoints = linePoints[rowsCleared - 1] * (level + 1);
            setScore(prev => {
                const ns = prev + newPoints;
                if (onReportProgress) onReportProgress('score', ns);
                return ns;
            });
            setRows(prev => prev + rowsCleared);
            if (onReportProgress) onReportProgress('action', rowsCleared);
        }
    }, [rowsCleared, level, playClear, onReportProgress]);

    useEffect(() => {
        const coins = Math.floor(score / 50);
        setEarnedCoins(coins);
    }, [score]);

    const togglePause = useCallback(() => {
        if (!gameOver && !showTutorial && !inMenu) {
            setIsPaused(prev => !prev);
        }
    }, [gameOver, showTutorial, inMenu]);

    const movePlayer = (dir: -1 | 1) => {
        if (showTutorial || inMenu) return;
        if (!checkCollision(player, board, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
            playMove();
        }
    };

    const startGame = useCallback((startLevel: number = 0) => {
        if (showTutorial) return;
        setInMenu(false);
        setBoard(createBoard());
        const initialSpeed = Math.max(100, 1000 / (startLevel + 1) + 200);
        
        setDropTime(initialSpeed);
        resetPlayer();
        setGameOver(false);
        setIsPaused(false);
        setScore(0);
        setRows(0);
        setLevel(startLevel);
        setEarnedCoins(0);
        playClear(); 
        
        if (onReportProgress) onReportProgress('play', 1);
    }, [setBoard, resetPlayer, playClear, onReportProgress, showTutorial]);

    const drop = useCallback(() => {
        if (showTutorial || inMenu) return;
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, board, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                playGameOver();
                updateHighScore('tetris', score);
                if (earnedCoins > 0) addCoins(earnedCoins);
            } else {
                playLand();
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [board, level, player, updatePlayerPos, rows, playGameOver, playLand, score, addCoins, updateHighScore, earnedCoins, showTutorial, inMenu]);
    
    useGameLoop(drop, isPaused || gameOver || showTutorial || inMenu ? null : dropTime);

    const dropPlayer = () => {
        if (showTutorial || inMenu) return;
        setDropTime(null);
        drop();
    };
    
    const hardDrop = () => {
        if (showTutorial || inMenu) return;
        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) {
            newY++;
        }
        updatePlayerPos({ x: 0, y: newY - player.pos.y, collided: true });
        playLand();
    }

    const move = (e: KeyboardEvent | React.KeyboardEvent): void => {
        if (gameOver || showTutorial || inMenu) return;
        if (e.keyCode === 80) { togglePause(); return; }
        if (isPaused) return;
        if (e.keyCode === 37) { e.preventDefault(); movePlayer(-1); }
        else if (e.keyCode === 39) { e.preventDefault(); movePlayer(1); }
        else if (e.keyCode === 40) { e.preventDefault(); dropPlayer(); }
        else if (e.keyCode === 38) { e.preventDefault(); playerRotate(board, 1); playRotate(); }
        else if (e.keyCode === 32) { e.preventDefault(); hardDrop(); }
        else if (e.keyCode === 67) { playerHold(); }
    };

    const handleGestureStart = (clientX: number, clientY: number) => {
        if (gameOver || isPaused || showTutorial || inMenu) return;
        touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
        lastXMoveRef.current = clientX;
    };

    const handleGestureMove = (clientX: number, clientY: number) => {
        if (!touchStartRef.current || gameOver || isPaused || showTutorial || inMenu) return;
        const deltaX = clientX - lastXMoveRef.current;
        const threshold = 30; 
        if (Math.abs(deltaX) > threshold) {
            movePlayer(deltaX > 0 ? 1 : -1);
            lastXMoveRef.current = clientX;
        }
    };

    const handleGestureEnd = (clientX: number, clientY: number) => {
        if (!touchStartRef.current) return;
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

    useEffect(() => {
        if (gameOver || isPaused || showTutorial || inMenu || !player.tetromino || player.tetromino.length <= 1) {
            setGhostPlayer(null);
            return;
        }
        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) newY++;
        setGhostPlayer(prev => {
            if (prev && prev.pos.x === player.pos.x && prev.pos.y === newY && prev.tetromino === player.tetromino) return prev;
            return { ...player, pos: { x: player.pos.x, y: newY } };
        });
    }, [player, board, gameOver, isPaused, showTutorial, inMenu]);

    const moveRef = useRef(move);
    useEffect(() => { moveRef.current = move; }, [move]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => moveRef.current && moveRef.current(e);
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const DirectionBtn = ({ onClick, icon, className, active = true }: { onClick: () => void, icon: React.ReactNode, className?: string, active?: boolean }) => (
        <button 
            className={`flex items-center justify-center rounded-lg transition-all duration-75 touch-manipulation
                ${active 
                    ? 'bg-gray-800/80 border border-white/10 active:bg-neon-blue/50 active:shadow-[0_0_15px_#00f3ff] active:border-neon-blue active:scale-95' 
                    : 'bg-transparent border-none cursor-default'
                }
                ${className}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isPaused && !gameOver && active && !showTutorial) onClick(); }}
        >
            {icon}
        </button>
    );

    const MetaBtn = ({ onClick, icon, label, active = true }: { onClick: () => void, icon: React.ReactNode, label?: string, active?: boolean }) => (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg bg-gray-900 border border-white/10 hover:bg-gray-800 active:scale-95 transition-all w-14 h-12 ${active ? 'opacity-100' : 'opacity-50'}`}
        >
            {icon}
            {label && <span className="text-[8px] text-gray-400 font-bold mt-1">{label}</span>}
        </button>
    );

    // --- MENU RENDER ---
    if (inMenu) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Layers size={56} className="text-cyan-400 drop-shadow-[0_0_25px_rgba(0,243,255,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 drop-shadow-[0_0_30px_rgba(0,243,255,0.6)] tracking-tighter w-full">
                                NEON<br className="md:hidden"/> TETRIS
                            </h1>
                            <Layers size={56} className="text-cyan-400 drop-shadow-[0_0_25px_rgba(0,243,255,0.8)] animate-pulse hidden md:block" />
                        </div>
                        <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm">
                            <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase">Empilez • Alignez • Disparaissez</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl flex-shrink-0">
                        <button onClick={() => startGame(0)} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-green-500/50 hover:shadow-[0_0_50px_rgba(34,197,94,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-green-300 transition-colors">FACILE</h2>
                                <p className="text-gray-400 text-xs font-medium">Vitesse lente, idéal pour débuter.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-green-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                NIVEAU 1 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        <button onClick={() => startGame(5)} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-yellow-300 transition-colors">MOYEN</h2>
                                <p className="text-gray-400 text-xs font-medium">Vitesse standard, le défi classique.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-yellow-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                NIVEAU 5 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        <button onClick={() => startGame(10)} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-red-300 transition-colors">EXTRÊME</h2>
                                <p className="text-gray-400 text-xs font-medium">Vitesse folle, pour les experts.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-red-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                NIVEAU 10 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans relative touch-none overflow-hidden" role="button" tabIndex={0}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            {!gameOver && (
                <div className="w-full max-w-lg px-4 pt-4 pb-1 flex justify-between items-center z-30 shrink-0">
                    <MetaBtn onClick={() => setInMenu(true)} icon={<Home size={18} className="text-gray-300"/>} label="MENU"/>
                    <MetaBtn onClick={toggleMute} icon={isMuted ? <VolumeX size={18} className="text-gray-400"/> : <Volume2 size={18} className="text-gray-300"/>} label={isMuted ? "MUET" : "SON"}/>
                    <MetaBtn onClick={() => startGame(level)} icon={<RotateCcw size={18} className="text-gray-300"/>} label="RESET"/>
                    <MetaBtn onClick={() => setShowTutorial(true)} icon={<HelpCircle size={18} className="text-cyan-400"/>} label="AIDE"/>
                    <MetaBtn onClick={togglePause} icon={isPaused ? <Play size={18} className="text-green-400 fill-green-400"/> : <Pause size={18} className="text-yellow-400 fill-yellow-400"/>} label={isPaused ? "GO" : "PAUSE"} active/>
                </div>
            )}
            <div className="w-full max-w-lg px-3 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shrink-0">
                    <span className="text-[8px] text-gray-400 absolute top-1 left-1">RÉSERVE</span>
                    <div className="scale-75 mt-1"><HoldPiece tetromino={heldTetromino} /></div>
                </div>
                <div className="flex gap-1 flex-1 justify-center"><GameInfo text="NIVEAU" value={level} /><GameInfo text="SCORE" value={score} /><GameInfo text="RECORD" value={highScore} /></div>
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shrink-0">
                    <span className="text-[8px] text-gray-400 absolute top-1 right-1">SUIVANT</span>
                    <div className="scale-75 mt-1"><NextPiece tetromino={nextTetromino} /></div>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center w-full max-w-lg relative z-10 min-h-0 px-4 pb-2 overflow-hidden">
                <div 
                    ref={gameAreaRef}
                    className="h-full max-h-full aspect-[10/20] relative shadow-2xl touch-none select-none"
                    onMouseDown={(e) => handleGestureStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleGestureMove(e.clientX, e.clientY)}
                    onMouseUp={(e) => handleGestureEnd(e.clientX, e.clientY)}
                    onMouseLeave={(e) => handleGestureEnd(e.clientX, e.clientY)}
                    onTouchStart={(e) => handleGestureStart(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => handleGestureMove(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={(e) => handleGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
                >
                     <Board board={board} />
                     {!gameOver && isPaused && !showTutorial && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-lg border border-white/10 animate-in fade-in duration-200 gap-4">
                            <h2 className="text-4xl font-bold text-white mb-6 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">PAUSE</h2>
                            <button onClick={(e) => { e.preventDefault(); togglePause(); }} className="w-56 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-bold rounded hover:bg-neon-blue hover:text-black transition-all touch-manipulation flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,243,255,0.2)]"><Play size={20} fill="currentColor" /> REPRENDRE</button>
                             <button onClick={(e) => { e.preventDefault(); setScore(0); setGameOver(true); setIsPaused(false); }} className="w-56 py-3 bg-gray-800 border border-white/20 text-white font-bold rounded hover:bg-white hover:text-black transition-all touch-manipulation flex items-center justify-center gap-2"><RotateCcw size={20} /> NOUVEAU JEU</button>
                            <button onClick={(e) => { e.preventDefault(); setInMenu(true); }} className="w-56 py-3 bg-gray-900 border border-red-500/50 text-red-400 font-bold rounded hover:bg-red-500 hover:text-white transition-all touch-manipulation flex items-center justify-center gap-2"><Home size={20} /> QUITTER</button>
                        </div>
                     )}
                     {showTutorial && <TutorialOverlay gameId="tetris" onClose={() => setShowTutorial(false)} />}
                    {gameOver && score > 0 && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg animate-in fade-in duration-300 border border-white/10">
                            <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon-blue to-purple-600 mb-4 italic tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] leading-tight text-center">FIN DE<br/>PARTIE</h2>
                            <div className="grid grid-cols-2 gap-8 mb-4"><div className="text-center"><p className="text-gray-400 text-sm tracking-[0.2em] mb-1">SCORE</p><p className="text-3xl font-mono text-white">{score}</p></div><div className="text-center"><p className="text-neon-pink text-sm tracking-[0.2em] mb-1">RECORD</p><p className="text-3xl font-mono text-neon-pink glow">{highScore}</p></div></div>
                            {earnedCoins > 0 && (<div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}
                            <button onClick={(e) => { e.preventDefault(); startGame(level); }} className="relative px-8 py-3 overflow-hidden group bg-neon-blue text-black font-black tracking-widest text-xl skew-x-[-10deg] hover:bg-white transition-colors touch-manipulation mb-4"><span className="block skew-x-[10deg]">REJOUER</span></button>
                            <button onClick={(e) => { e.preventDefault(); setInMenu(true); }} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">RETOUR AU MENU</button>
                        </div>
                    )}
                    {gameOver && score === 0 && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md rounded-lg">
                            <h2 className="text-3xl font-bold text-white mb-4">PRÊT ?</h2>
                            <button onClick={(e) => { e.preventDefault(); startGame(level); }} className="px-6 py-3 bg-neon-blue text-black font-bold rounded hover:bg-white transition-all">COMMENCER</button>
                            <button onClick={(e) => { e.preventDefault(); setInMenu(true); }} className="mt-4 text-gray-400 text-sm underline">RETOUR</button>
                        </div>
                    )}
                </div>
            </div>
            {!gameOver && (
                <div className="w-full max-w-md px-4 pb-6 pt-2 flex flex-col justify-end gap-3 z-30 shrink-0 select-none">
                    <div className="flex justify-between items-end w-full">
                        <div className="grid grid-cols-3 gap-2 w-36 h-36"><div className="w-full h-full"/><DirectionBtn onClick={hardDrop} icon={<div className="flex flex-col -space-y-1"><ChevronDown size={24} /><ChevronDown size={24} /></div>} className="w-full h-full"/><div className="w-full h-full"/><DirectionBtn onClick={() => movePlayer(-1)} icon={<ArrowLeft size={28} />} className="w-full h-full"/><div className="w-full h-full bg-gray-800/50 rounded-full border border-white/5 flex items-center justify-center shadow-inner"><div className="w-2 h-2 rounded-full bg-neon-blue/50 blur-[1px]"></div></div><DirectionBtn onClick={() => movePlayer(1)} icon={<ArrowRight size={28} />} className="w-full h-full"/><div className="w-full h-full"/><DirectionBtn onClick={() => drop()} icon={<ArrowDown size={28} />} className="w-full h-full"/><div className="w-full h-full"/></div>
                        <div className="flex flex-col gap-3 pb-2 items-center"><button onClick={(e) => { e.preventDefault(); playerHold(); }} className="w-16 h-12 rounded-xl bg-gray-800 border border-white/10 flex flex-col items-center justify-center active:scale-95 transition-all text-gray-300 active:text-white"><RefreshCw size={20} /><span className="text-[9px] font-bold mt-0.5">RÉSERVE</span></button><button onClick={(e) => { e.preventDefault(); playerRotate(board, 1); playRotate(); }} className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-pink to-purple-700 border-2 border-neon-pink/50 shadow-[0_0_20px_rgba(188,19,254,0.4)] flex flex-col items-center justify-center active:scale-95 active:shadow-[0_0_10px_rgba(188,19,254,0.6)] transition-all"><RotateCw size={40} className="text-white drop-shadow-md" /><span className="text-[10px] font-black text-white mt-1 tracking-widest">PIVOTER</span></button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
