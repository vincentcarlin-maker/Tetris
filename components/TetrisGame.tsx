
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Board } from './Board';
import { GameInfo } from './GameInfo';
import { usePlayer } from '../hooks/usePlayer';
import { useBoard } from '../hooks/useBoard';
import { useGameStatus } from '../hooks/useGameStatus';
import { createBoard, checkCollision } from '../gameHelpers';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameAudio } from '../hooks/useGameAudio';
import { NextPiece } from './NextPiece';
import { HoldPiece } from './HoldPiece';
import { ArrowDown, ArrowLeft, ArrowRight, RotateCw, Play, RefreshCw, ChevronDown, Pause, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';
import type { Player } from '../types';

interface TetrisGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack, audio }) => {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const { player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino, heldTetromino, playerHold } = usePlayer();
    const [ghostPlayer, setGhostPlayer] = useState<Player | null>(null);
    const { board, setBoard, rowsCleared } = useBoard(player, resetPlayer, ghostPlayer);
    const { score, setScore, rows, setRows, level, setLevel, highScore } = useGameStatus(rowsCleared);
    const { playMove, playRotate, playLand, playClear, playGameOver, isMuted, toggleMute } = audio;
    
    useEffect(() => {
        if (rowsCleared > 0) {
            playClear();
        }
    }, [rowsCleared, playClear]);

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

    const startGame = useCallback(() => {
        setBoard(createBoard());
        setDropTime(1000);
        resetPlayer();
        setGameOver(false);
        setIsPaused(false);
        setScore(0);
        setRows(0);
        setLevel(0);
        playClear(); // Play a start sound
    }, [setBoard, resetPlayer, setGameOver, setScore, setRows, setLevel, playClear]);

    const drop = useCallback(() => {
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
            } else {
                playLand();
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [board, level, player, resetPlayer, rows, setLevel, updatePlayerPos, playGameOver, playLand]);
    
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

    const DirectionBtn = ({ onClick, icon, className }: { onClick: () => void, icon: React.ReactNode, className?: string }) => (
        <button 
            className={`flex items-center justify-center bg-gray-800/80 active:bg-neon-blue/50 active:shadow-[0_0_15px_#00f3ff] backdrop-blur-md border border-white/10 transition-all duration-75 touch-manipulation ${className}`}
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                if (!isPaused && !gameOver) onClick(); 
            }}
        >
            {icon}
        </button>
    );

    const ActionBtn = ({ onClick, icon, label, colorClass, sizeClass }: { onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, sizeClass: string }) => (
        <button 
            className={`relative rounded-full flex flex-col items-center justify-center border-2 backdrop-blur-xl shadow-lg active:scale-95 transition-all duration-100 touch-manipulation ${colorClass} ${sizeClass}`}
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                // Actions allowed even if paused/game over
                const alwaysAllowed = ['PAUSE', 'REPRENDRE', 'RÉINIT.', 'MUET', 'SON', 'MENU'];
                if (alwaysAllowed.includes(label) || (!isPaused && !gameOver)) {
                    onClick();
                }
            }}
        >
            {icon}
            {label && <span className="absolute -bottom-6 text-[10px] font-bold tracking-wider text-white/60">{label}</span>}
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
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 animate-in fade-in duration-200">
                            <h2 className="text-4xl font-bold text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                PAUSE
                            </h2>
                            <button
                                onClick={(e) => { e.preventDefault(); togglePause(); }}
                                className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-bold rounded hover:bg-neon-blue hover:text-black transition-all touch-manipulation"
                            >
                                REPRENDRE
                            </button>
                        </div>
                     )}

                     {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg animate-in fade-in duration-300 border border-white/10">
                            <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neon-blue to-purple-600 mb-4 italic tracking-tighter drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] leading-tight text-center">
                                FIN DE<br/>PARTIE
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="text-center">
                                    <p className="text-gray-400 text-[10px] tracking-[0.2em] mb-1">SCORE</p>
                                    <p className="text-2xl font-mono text-white">{score}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-neon-pink text-[10px] tracking-[0.2em] mb-1">RECORD</p>
                                    <p className="text-2xl font-mono text-neon-pink glow">{highScore}</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.preventDefault(); startGame(); }}
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
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-lg">
                            <div className="absolute top-4 left-4">
                                <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
                                    <ArrowLeft size={14} /> MENU
                                </button>
                            </div>
                            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#bc13fe]">
                                TETRIS<br/><span className="text-neon-blue">NÉON</span>
                            </h1>
                            <p className="text-gray-400 mb-8 text-xs tracking-widest">RECORD : {highScore}</p>
                            <button
                                onClick={(e) => { e.preventDefault(); startGame(); }}
                                className="animate-pulse px-8 py-4 bg-transparent border-2 border-neon-pink text-neon-pink font-bold rounded-full shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:bg-neon-pink hover:text-white transition-all touch-manipulation"
                            >
                                TOUCHER POUR JOUER
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTROLS (Mobile) --- */}
            {!gameOver && (
                <div className="w-full max-w-md px-6 pb-6 pt-2 flex justify-between items-end gap-4 z-30 shrink-0">
                    
                    {/* D-PAD (Left Side) */}
                    <div className="relative w-40 h-40">
                        {/* Cross Background */}
                        <div className="absolute inset-0 bg-gray-900/50 rounded-full blur-xl"></div>
                        
                        {/* Up (Hard Drop) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                            <DirectionBtn 
                                onClick={hardDrop} 
                                icon={<div className="flex flex-col -space-y-1"><ChevronDown size={20} /><ChevronDown size={20} /></div>}
                                className="w-12 h-12 rounded-lg bg-gray-800 border-b-0 rounded-b-none" 
                            />
                        </div>
                        
                        {/* Left */}
                        <div className="absolute top-12 left-0">
                            <DirectionBtn 
                                onClick={() => movePlayer(-1)} 
                                icon={<ArrowLeft size={24} />}
                                className="w-12 h-12 rounded-lg rounded-r-none border-r-0" 
                            />
                        </div>

                        {/* Center (Decor) */}
                        <div className="absolute top-12 left-12 w-16 h-12 bg-gray-800 flex items-center justify-center border border-white/5">
                             <div className="w-4 h-4 rounded-full bg-black/50 shadow-inner"></div>
                        </div>

                        {/* Right */}
                        <div className="absolute top-12 right-0">
                            <DirectionBtn 
                                onClick={() => movePlayer(1)} 
                                icon={<ArrowRight size={24} />}
                                className="w-12 h-12 rounded-lg rounded-l-none border-l-0" 
                            />
                        </div>

                        {/* Down (Soft Drop) */}
                        <div className="absolute top-24 left-1/2 -translate-x-1/2">
                             <DirectionBtn 
                                onClick={() => drop()} 
                                icon={<ArrowDown size={24} />}
                                className="w-12 h-12 rounded-lg rounded-t-none border-t-0" 
                            />
                        </div>
                    </div>

                    {/* ACTIONS (Right Side) */}
                    <div className="flex flex-col items-end gap-3 mb-2">
                        
                        {/* Meta Controls Row */}
                        <div className="flex items-center gap-3">
                             {/* Menu Button */}
                             <ActionBtn 
                                onClick={onBack}
                                icon={<Home size={16} className="text-gray-400" />}
                                label="MENU"
                                colorClass="bg-gray-800 border-gray-600 active:bg-gray-700"
                                sizeClass="w-10 h-10"
                            />

                            {/* Mute Button */}
                            <ActionBtn 
                                onClick={toggleMute}
                                icon={isMuted ? <VolumeX size={16} className="text-gray-400" /> : <Volume2 size={16} className="text-white" />}
                                label={isMuted ? "SON" : "MUET"}
                                colorClass="bg-gray-800 border-gray-600 active:bg-gray-700"
                                sizeClass="w-10 h-10"
                            />

                            {/* Restart Button */}
                            <ActionBtn 
                                onClick={startGame}
                                icon={<RotateCcw size={16} className="text-white" />}
                                label="RÉINIT."
                                colorClass="bg-gray-800 border-gray-600 active:bg-gray-700"
                                sizeClass="w-10 h-10"
                            />

                            {/* Pause Button */}
                            <ActionBtn 
                                onClick={togglePause}
                                icon={isPaused ? <Play size={16} className="text-white fill-white" /> : <Pause size={16} className="text-white fill-white" />}
                                label={isPaused ? "REPR." : "PAUSE"}
                                colorClass="bg-gray-800 border-gray-600 active:bg-gray-700"
                                sizeClass="w-10 h-10"
                            />
                        </div>

                        {/* Hold Button */}
                        <ActionBtn 
                            onClick={playerHold}
                            icon={<RefreshCw size={20} className="text-white" />}
                            label="RÉSERVE"
                            colorClass="bg-gray-800 border-gray-600 active:bg-gray-700"
                            sizeClass="w-14 h-14"
                        />

                        {/* Rotate Button (Main Action) */}
                        <ActionBtn 
                            onClick={() => {
                                playerRotate(board, 1);
                                playRotate();
                            }}
                            icon={<RotateCw size={32} className="text-white drop-shadow-md" />}
                            label="PIVOTER"
                            colorClass="bg-gradient-to-br from-neon-pink to-purple-600 border-neon-pink shadow-[0_0_20px_rgba(188,19,254,0.4)]"
                            sizeClass="w-20 h-20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}