
import React, { useState, useCallback, useEffect } from 'react';
import { Board } from './components/Board';
import { GameInfo } from './components/GameInfo';
import { usePlayer } from './hooks/usePlayer';
import { useBoard } from './hooks/useBoard';
import { useGameStatus } from './hooks/useGameStatus';
import { createBoard, checkCollision } from './gameHelpers';
import { TetrominoShape } from './types';
import { useGameLoop } from './hooks/useGameLoop';
import { NextPiece } from './components/NextPiece';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCw, Play } from 'lucide-react';

const App: React.FC = () => {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(true);

    const { player, updatePlayerPos, resetPlayer, playerRotate } = usePlayer();
    const { board, setBoard, rowsCleared } = useBoard(player, resetPlayer);
    const { score, setScore, rows, setRows, level, setLevel } = useGameStatus(rowsCleared);
    const { nextTetromino, getNextTetromino } = usePlayer();
    
    const movePlayer = (dir: -1 | 1) => {
        if (!checkCollision(player, board, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
        }
    };

    const startGame = useCallback(() => {
        setBoard(createBoard());
        setDropTime(1000);
        resetPlayer(getNextTetromino());
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);
    }, [setBoard, resetPlayer, setGameOver, setScore, setRows, setLevel, getNextTetromino]);

    const drop = useCallback(() => {
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, board, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            if (player.pos.y < 1) {
                console.log("GAME OVER");
                setGameOver(true);
                setDropTime(null);
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [board, level, player, resetPlayer, rows, setLevel, updatePlayerPos]);
    
    useGameLoop(drop, dropTime);

    const keyUp = ({ keyCode }: { keyCode: number }): void => {
        if (!gameOver) {
            if (keyCode === 40) { // down arrow
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
    }

    const move = ({ keyCode }: { keyCode: number }): void => {
        if (!gameOver) {
            if (keyCode === 37) { // left arrow
                movePlayer(-1);
            } else if (keyCode === 39) { // right arrow
                movePlayer(1);
            } else if (keyCode === 40) { // down arrow
                dropPlayer();
            } else if (keyCode === 38) { // up arrow
                playerRotate(board, 1);
            } else if (keyCode === 32) { // space bar
                hardDrop();
            }
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', move);
        window.addEventListener('keyup', keyUp);
        return () => {
            window.removeEventListener('keydown', move);
            window.removeEventListener('keyup', keyUp);
        };
    }, [move, keyUp]);

    const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string }> = ({ onClick, children, className = '' }) => (
        <button
            onClick={onClick}
            className={`bg-gray-700/80 backdrop-blur-sm text-white p-3 rounded-full shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-200 ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-mono" role="button" tabIndex={0} onKeyDown={e => move(e)} onKeyUp={keyUp}>
            <div className="w-full max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-cyan-400 tracking-widest">REACT TETRIS</h1>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <div className="relative">
                        <Board board={board} />
                        {gameOver && (
                            <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-10">
                                <h2 className="text-3xl text-white font-bold mb-4">Game Over</h2>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                                >
                                    <Play size={24} />
                                    Start Game
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="w-full md:w-48 flex flex-row md:flex-col gap-4">
                        <div className="flex-1 p-4 bg-gray-800 rounded-lg shadow-inner">
                            <h2 className="text-lg font-bold mb-2 text-gray-400">Next</h2>
                            <NextPiece tetromino={nextTetromino} />
                        </div>
                        <div className="flex-1 p-4 bg-gray-800 rounded-lg shadow-inner flex flex-col justify-between">
                            <GameInfo text="Score" value={score} />
                            <GameInfo text="Rows" value={rows} />
                            <GameInfo text="Level" value={level} />
                        </div>
                         {gameOver && (
                             <div className="w-full md:hidden flex justify-center mt-4">
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
                                >
                                    <Play size={24} />
                                    Start Game
                                </button>
                            </div>
                         )}
                    </aside>
                </div>

                {/* On-screen controls for mobile */}
                {!gameOver && (
                    <div className="md:hidden mt-8 w-full max-w-sm mx-auto">
                        <div className="flex justify-center mb-4">
                             <ControlButton onClick={() => playerRotate(board, 1)} className="w-20 h-20"><RotateCw size={32} /></ControlButton>
                        </div>
                        <div className="flex justify-between items-center">
                            <ControlButton onClick={() => movePlayer(-1)} className="w-20 h-20"><ArrowLeft size={32} /></ControlButton>
                            <ControlButton onClick={() => dropPlayer()} className="w-20 h-20"><ArrowDown size={32} /></ControlButton>
                            <ControlButton onClick={() => movePlayer(1)} className="w-20 h-20"><ArrowRight size={32} /></ControlButton>
                        </div>
                         <div className="flex justify-center mt-4">
                             <ControlButton onClick={hardDrop} className="px-12 py-4"><span className="font-bold">DROP</span></ControlButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
