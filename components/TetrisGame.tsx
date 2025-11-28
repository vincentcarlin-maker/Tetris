
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
import { ArrowDown, ArrowLeft, ArrowRight, RotateCw, Play, RefreshCw, ChevronDown, Pause, RotateCcw, Volume2, VolumeX, Home, Coins, Zap, Skull } from 'lucide-react';
import type { Player } from '../types';

interface TetrisGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

const linePoints = [40, 100, 300, 1200];

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack, audio, addCoins }) => {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino, heldTetromino, playerHold } = usePlayer();
    const [ghostPlayer, setGhostPlayer] = useState<Player | null>(null);
    
    // Destructuring audio functions
    const { playMove, playRotate, playLand, playClear, playBlockDestroy, playGameOver, isMuted, toggleMute } = audio;

    const { board, setBoard, rowsCleared } = useBoard(player, resetPlayer, ghostPlayer, playBlockDestroy);
    
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.tetris || 0;
    
    useEffect(() => {
        if (rowsCleared > 0) {
            playClear();
            setScore(prev => prev + linePoints[rowsCleared - 1] * (level + 1));
            setRows(prev => prev + rowsCleared);
        }
    }, [rowsCleared, level, playClear]);

    useEffect(() => {
        const coins = Math.floor(score / 50);
        setEarnedCoins(coins);
    }, [score]);

    const togglePause = useCallback(() => {
        if (!gameOver) {
            setIsPaused(prev => !prev);
        }
    }, [gameOver]);

    const movePlayer = (dir: -1 | 1) => {
        if (!checkCollision(player, board, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
            playMove();
        }
    };

    const startGame = useCallback((startLevel: number = 0) => {
        setBoard(createBoard());
        // Calcul de la vitesse initiale basée sur le niveau choisi
        // Formule ajustée pour être jouable mais progressive
        const initialSpeed = Math.max(100, 1000 / (startLevel + 1) + 200);
        
        setDropTime(initialSpeed);
        resetPlayer();
        setGameOver(false);
        setIsPaused(false);
        setScore(0);
        setRows(0);
        setLevel(startLevel);
        setEarnedCoins(0);
        playClear(); // Play a start sound
    }, [setBoard, resetPlayer, playClear]);

    const drop = useCallback(() => {
        // Logique de montée de niveau : Augmente le niveau si on dépasse le seuil de lignes
        // Si on commence au niveau 5 (Moyen), on reste à cette vitesse jusqu'à ce qu'on "rattrape" le nombre de lignes requis pour le niveau 6
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
                
                // Calcul des gains
                if (earnedCoins > 0) {
                    addCoins(earnedCoins);
                }
            } else {
                playLand();
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [board, level, player, updatePlayerPos, rows, playGameOver, playLand, score, addCoins, updateHighScore, earnedCoins]);
    
    // Pause the game loop if isPaused is true
    useGameLoop(drop, isPaused || gameOver ? null : dropTime);

    const keyUp = (e: KeyboardEvent) => {
        if (!gameOver) {
            if (e.keyCode === 40) { // down arrow
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    };

    const dropPlayer = () => {
        setDropTime(null);
        drop();
    };
    
    const hardDrop = () => {
        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) {
            newY++;
        }
        updatePlayerPos({ x: 0, y: newY - player.pos.y, collided: true });
        playLand();
    }

    const move = (e: KeyboardEvent | React.KeyboardEvent): void => {
        if (gameOver) return;

        // Toggle pause with 'P'
        if (e.keyCode === 80) { 
            togglePause();
            return;
        }

        // Block controls if paused
        if (isPaused) return;

        if (e.keyCode === 37) { // left arrow
            e.preventDefault();
            movePlayer(-1);
        } else if (e.keyCode === 39) { // right arrow
            e.preventDefault();
            movePlayer(1);
        } else if (e.keyCode === 40) { // down arrow
            e.preventDefault();
            dropPlayer();
        } else if (e.keyCode === 38) { // up arrow
            e.preventDefault();
            playerRotate(board, 1);
            playRotate();
        } else if (e.keyCode === 32) { // space bar
            e.preventDefault();
            hardDrop();
        } else if (e.keyCode === 67) { // 'c' key
            playerHold();
        }
    };

    useEffect(() => {
        // Fix: Use length check to determine if it's the dummy empty piece.
        // TETROMINOS['0'] has length 1. Real pieces (O) have length 2, others 3 or 4.
        // Previously we checked [0][0] === 0 which failed for I, T, L, J, S pieces which start with empty cell.
        if (gameOver || isPaused || !player.tetromino || player.tetromino.length <= 1) {
            setGhostPlayer(null);
            return;
        }

        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) {
            newY++;
        }
        
        setGhostPlayer(prev => {
            if (prev && prev.pos.x === player.pos.x && prev.pos.y === newY && prev.tetromino === player.tetromino) {
                return prev;
            }
            return {
                ...player,
                pos: { x: player.pos.x, y: newY }
            };
        });

    }, [player, board, gameOver, isPaused]);

    const moveRef = useRef(move);
    const keyUpRef = useRef(keyUp);

    useEffect(() => {
        moveRef.current = move;
        keyUpRef.current = keyUp;
    }, [move, keyUp]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => moveRef.current && moveRef.current(e);
        const handleKeyUp = (e: KeyboardEvent) => keyUpRef.current && keyUpRef.current(e);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const DirectionBtn = ({ onClick, icon, className, active = true }: { onClick: () => void, icon: React.ReactNode, className?: string, active?: boolean }) => (
        <button 
            className={`flex items-center justify-center rounded-lg transition-all duration-75 touch-manipulation
                ${active 
                    ? 'bg-gray-800/80 border border-white/10 active:bg-neon-blue/50 active:shadow-[0_0_15px_#00f3ff] active:border-neon-blue active:scale-95' 
                    : 'bg-transparent border-none cursor-default'
                }
                ${className}`}
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                if (!isPaused && !gameOver && active) onClick(); 
            }}
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

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-transparent font-sans relative touch-none overflow-hidden" 
            role="button" 
            tabIndex={0} 
        >
            {/* --- HEADER (HUD) --- */}
            <div className="w-full max-w-lg px-3 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
                {/* Left: Hold */}
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shrink-0">
                    <span className="text-[8px] text-gray-400 absolute top-1 left-1">RÉSERVE</span>
                    <div className="scale-75 mt-1">
                         <HoldPiece tetromino={heldTetromino} />
                    </div>
                </div>

                {/* Center: Stats */}
                <div className="flex gap-1 flex-1 justify-center">
                    <GameInfo text="NIVEAU" value={level} />
                    <GameInfo text="SCORE" value={score} />
                    <GameInfo text="RECORD" value={highScore} />
                </div>

                {/* Right: Next */}
                <div className="flex flex-col items-center bg-gray-900/50 border border-white/10 rounded-lg p-1 w-14 h-14 relative shrink-0">
                    <span className="text-[8px] text-gray-400 absolute top-1 right-1">SUIVANT</span>
                    <div className="scale-75 mt-1">
                        <NextPiece tetromino={nextTetromino} />
                    </div>
                </div>
            </div>

            {/* --- GAME AREA --- */}
            <div className="flex-1 flex items-center justify-center w-full max-w-lg relative z-10 min-h-0 px-4 pb-2 overflow-hidden">
                <div className="h-full max-h-full aspect-[10/20] relative shadow-2xl">
                     <Board board={board} />

                     {/* Pause Overlay */}
                     {!gameOver && isPaused && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-lg border border-white/10 animate-in fade-in duration-200 gap-4">
                            <h2 className="text-4xl font-bold text-white mb-6 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                PAUSE
                            </h2>
                            <button
                                onClick={(e) => { e.preventDefault(); togglePause(); }}
                                className="w-56 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-bold rounded hover:bg-neon-blue hover:text-black transition-all touch-manipulation flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                            >
                                <Play size={20} fill="currentColor" /> REPRENDRE
                            </button>
                            
                             <button
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    // Retour écran titre Tetris pour choisir difficulté
                                    setScore(0);
                                    setGameOver(true);
                                    setIsPaused(false);
                                }}
                                className="w-56 py-3 bg-gray-800 border border-white/20 text-white font-bold rounded hover:bg-white hover:text-black transition-all touch-manipulation flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} /> NOUVEAU JEU
                            </button>

                            <button
                                onClick={(e) => { e.preventDefault(); onBack(); }}
                                className="w-56 py-3 bg-gray-900 border border-red-500/50 text-red-400 font-bold rounded hover:bg-red-500 hover:text-white transition-all touch-manipulation flex items-center justify-center gap-2"
                            >
                                <Home size={20} /> RETOUR AU MENU
                            </button>
                        </div>
                     )}

                     {/* Game Over Overlay */}
                    {gameOver && score > 0 && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg animate-in fade-in duration-300 border border-white/10">
                            <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon-blue to-purple-600 mb-4 italic tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] leading-tight text-center">
                                FIN DE<br/>PARTIE
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm tracking-[0.2em] mb-1">SCORE</p>
                                    <p className="text-3xl font-mono text-white">{score}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-neon-pink text-sm tracking-[0.2em] mb-1">RECORD</p>
                                    <p className="text-3xl font-mono text-neon-pink glow">{highScore}</p>
                                </div>
                            </div>

                            {/* Reward Display */}
                            {earnedCoins > 0 && (
                                <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                    <Coins className="text-yellow-400" size={20} />
                                    <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}

                            <button
                                onClick={(e) => { e.preventDefault(); startGame(0); }}
                                className="relative px-8 py-3 overflow-hidden group bg-neon-blue text-black font-black tracking-widest text-xl skew-x-[-10deg] hover:bg-white transition-colors touch-manipulation mb-4"
                            >
                                <span className="block skew-x-[10deg]">REJOUER</span>
                            </button>
                            
                            <button
                                onClick={(e) => { e.preventDefault(); onBack(); }}
                                className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all"
                            >
                                RETOUR AU MENU
                            </button>
                        </div>
                    )}

                    {/* Start Overlay (Initial) */}
                    {gameOver && score === 0 && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md rounded-lg">
                            <div className="absolute top-4 left-4">
                                <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
                                    <ArrowLeft size={14} /> MENU
                                </button>
                            </div>
                            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#bc13fe]">
                                TETRIS<br/><span className="text-neon-blue">NÉON</span>
                            </h1>
                            <p className="text-gray-400 mb-8 text-xs tracking-widest">RECORD : {highScore}</p>
                            
                            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                <button
                                    onClick={(e) => { e.preventDefault(); startGame(0); }}
                                    className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all text-sm tracking-widest"
                                >
                                    FACILE (NIV 1)
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); startGame(5); }}
                                    className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all text-sm tracking-widest flex items-center justify-center gap-2"
                                >
                                    MOYEN (NIV 5)
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); startGame(10); }}
                                    className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all text-sm tracking-widest flex items-center justify-center gap-2"
                                >
                                    DIFFICILE (NIV 10)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTROLS (Mobile) --- */}
            {!gameOver && (
                <div className="w-full max-w-md px-4 pb-6 pt-2 flex flex-col justify-end gap-3 z-30 shrink-0 select-none">
                    
                    {/* META CONTROLS ROW (Moved up to prevent overlap) */}
                    <div className="flex justify-between items-center w-full px-2">
                         <MetaBtn 
                            onClick={onBack} 
                            icon={<Home size={18} className="text-gray-300"/>} 
                            label="MENU"
                        />
                         <MetaBtn 
                            onClick={toggleMute} 
                            icon={isMuted ? <VolumeX size={18} className="text-gray-400"/> : <Volume2 size={18} className="text-gray-300"/>} 
                            label={isMuted ? "MUET" : "SON"}
                        />
                        <MetaBtn 
                            onClick={() => startGame(level)} 
                            icon={<RotateCcw size={18} className="text-gray-300"/>} 
                            label="RESET"
                        />
                        <MetaBtn 
                            onClick={togglePause} 
                            icon={isPaused ? <Play size={18} className="text-green-400 fill-green-400"/> : <Pause size={18} className="text-yellow-400 fill-yellow-400"/>} 
                            label={isPaused ? "GO" : "PAUSE"}
                            active
                        />
                    </div>

                    {/* MAIN GAME CONTROLS ROW */}
                    <div className="flex justify-between items-end w-full">
                        
                        {/* D-PAD GRID (Aligned) */}
                        <div className="grid grid-cols-3 gap-2 w-36 h-36">
                             {/* Row 1 */}
                             <div className="w-full h-full"/>
                             <DirectionBtn 
                                onClick={hardDrop} 
                                icon={<div className="flex flex-col -space-y-1"><ChevronDown size={24} /><ChevronDown size={24} /></div>}
                                className="w-full h-full"
                             />
                             <div className="w-full h-full"/>

                             {/* Row 2 */}
                             <DirectionBtn 
                                onClick={() => movePlayer(-1)} 
                                icon={<ArrowLeft size={28} />}
                                className="w-full h-full"
                             />
                             <div className="w-full h-full bg-gray-800/50 rounded-full border border-white/5 flex items-center justify-center shadow-inner">
                                <div className="w-2 h-2 rounded-full bg-neon-blue/50 blur-[1px]"></div>
                             </div>
                             <DirectionBtn 
                                onClick={() => movePlayer(1)} 
                                icon={<ArrowRight size={28} />}
                                className="w-full h-full"
                             />

                             {/* Row 3 */}
                             <div className="w-full h-full"/>
                             <DirectionBtn 
                                onClick={() => drop()} 
                                icon={<ArrowDown size={28} />}
                                className="w-full h-full"
                             />
                             <div className="w-full h-full"/>
                        </div>

                        {/* RIGHT ACTIONS */}
                        <div className="flex flex-col gap-3 pb-2 items-center">
                            {/* Hold Button */}
                            <button 
                                onClick={(e) => { e.preventDefault(); playerHold(); }}
                                className="w-16 h-12 rounded-xl bg-gray-800 border border-white/10 flex flex-col items-center justify-center active:scale-95 transition-all text-gray-300 active:text-white"
                            >
                                <RefreshCw size={20} />
                                <span className="text-[9px] font-bold mt-0.5">RÉSERVE</span>
                            </button>

                            {/* Rotate Button (Big) */}
                            <button 
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    playerRotate(board, 1);
                                    playRotate();
                                }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-pink to-purple-700 border-2 border-neon-pink/50 shadow-[0_0_20px_rgba(188,19,254,0.4)] flex flex-col items-center justify-center active:scale-95 active:shadow-[0_0_10px_rgba(188,19,254,0.6)] transition-all"
                            >
                                <RotateCw size={40} className="text-white drop-shadow-md" />
                                <span className="text-[10px] font-black text-white mt-1 tracking-widest">PIVOTER</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
