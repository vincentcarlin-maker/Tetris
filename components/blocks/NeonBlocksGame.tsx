
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Layers, Star, Trash2 } from 'lucide-react';
import { useHighScores } from '../../hooks/useHighScores';

interface NeonBlocksGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const GRID_SIZE = 10;

interface Piece {
    id: string;
    shape: number[][];
    color: string;
}

const PIECES: Omit<Piece, 'id'>[] = [
    { shape: [[1]], color: 'bg-cyan-500 shadow-[0_0_10px_#00f3ff]' },
    { shape: [[1, 1]], color: 'bg-blue-600 shadow-[0_0_10px_#2563eb]' },
    { shape: [[1], [1]], color: 'bg-blue-600 shadow-[0_0_10px_#2563eb]' },
    { shape: [[1, 1, 1]], color: 'bg-purple-600 shadow-[0_0_10px_#9333ea]' },
    { shape: [[1], [1], [1]], color: 'bg-purple-600 shadow-[0_0_10px_#9333ea]' },
    { shape: [[1, 1, 1, 1]], color: 'bg-pink-600 shadow-[0_0_10px_#db2777]' },
    { shape: [[1], [1], [1], [1]], color: 'bg-pink-600 shadow-[0_0_10px_#db2777]' },
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500 shadow-[0_0_10px_#eab308]' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'bg-red-600 shadow-[0_0_10px_#dc2626]' },
    { shape: [[1, 0], [1, 1], [0, 1]], color: 'bg-green-600 shadow-[0_0_10px_#16a34a]' },
    { shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'bg-orange-600 shadow-[0_0_10px_#ea580c]' },
];

export const NeonBlocksGame: React.FC<NeonBlocksGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [grid, setGrid] = useState<(string | null)[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    const [score, setScore] = useState(0);
    const [availablePieces, setAvailablePieces] = useState<Piece[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [draggedPiece, setDraggedPiece] = useState<{ piece: Piece, index: number } | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [hoverCoords, setHoverCoords] = useState<{ r: number, c: number } | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const gridRef = useRef<HTMLDivElement>(null);
    const { playMove, playLand, playVictory, playGameOver, playCoin, resumeAudio } = audio;

    const { highScores, updateHighScore } = useHighScores();

    const generateRandomPiece = (): Piece => {
        const template = PIECES[Math.floor(Math.random() * PIECES.length)];
        return { ...template, id: Math.random().toString(36).substr(2, 9) };
    };

    const initGame = useCallback(() => {
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
        setScore(0);
        setAvailablePieces([generateRandomPiece(), generateRandomPiece(), generateRandomPiece()]);
        setIsGameOver(false);
        setEarnedCoins(0);
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const canPlacePiece = (shape: number[][], r: number, c: number, currentGrid: (string | null)[][]) => {
        if (r < 0 || c < 0 || r + shape.length > GRID_SIZE || c + shape[0].length > GRID_SIZE) return false;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] === 1 && currentGrid[r + row][c + col] !== null) return false;
            }
        }
        return true;
    };

    const checkGameOver = (pieces: Piece[], currentGrid: (string | null)[][]) => {
        for (const piece of pieces) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (canPlacePiece(piece.shape, r, c, currentGrid)) return false;
                }
            }
        }
        return true;
    };

    const handleActionEnd = (r: number, c: number) => {
        if (!draggedPiece) return;
        const { piece, index } = draggedPiece;

        if (canPlacePiece(piece.shape, r, c, grid)) {
            const newGrid = grid.map(row => [...row]);
            piece.shape.forEach((row, rowIdx) => {
                row.forEach((cell, colIdx) => {
                    if (cell === 1) newGrid[r + rowIdx][c + colIdx] = piece.color;
                });
            });

            // Check lines
            let linesCleared = 0;
            const rowsToClear = new Set<number>();
            const colsToClear = new Set<number>();

            for (let i = 0; i < GRID_SIZE; i++) {
                if (newGrid[i].every(cell => cell !== null)) rowsToClear.add(i);
                if (newGrid.every(row => row[i] !== null)) colsToClear.add(i);
            }

            rowsToClear.forEach(rowIndex => {
                for (let i = 0; i < GRID_SIZE; i++) newGrid[rowIndex][i] = null;
                linesCleared++;
            });
            colsToClear.forEach(colIndex => {
                for (let i = 0; i < GRID_SIZE; i++) newGrid[i][colIndex] = null;
                linesCleared++;
            });

            const points = (piece.shape.flat().filter(s => s === 1).length * 10) + (linesCleared * 100);
            
            setScore(s => {
                const ns = s + points;
                if (onReportProgress) onReportProgress('score', ns);
                return ns;
            });
            
            setGrid(newGrid);
            playLand();

            const newPieces = [...availablePieces];
            newPieces.splice(index, 1);
            
            if (newPieces.length === 0) {
                const refreshedPieces = [generateRandomPiece(), generateRandomPiece(), generateRandomPiece()];
                setAvailablePieces(refreshedPieces);
                if (checkGameOver(refreshedPieces, newGrid)) endGame();
            } else {
                setAvailablePieces(newPieces);
                if (checkGameOver(newPieces, newGrid)) endGame();
            }
        }
        
        setDraggedPiece(null);
        setHoverCoords(null);
    };

    const endGame = () => {
        setIsGameOver(true);
        playGameOver();
        
        updateHighScore('neonblocks', score);
        if (onReportProgress) onReportProgress('score', score);

        const coins = Math.floor(score / 50);
        if (coins > 0) {
            addCoins(coins);
            setEarnedCoins(coins);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!draggedPiece) return;
        const touch = e.touches[0];
        setDragPos({ x: touch.clientX, y: touch.clientY });

        const gridEl = gridRef.current;
        if (gridEl) {
            const rect = gridEl.getBoundingClientRect();
            const cellW = rect.width / GRID_SIZE;
            const cellH = rect.height / GRID_SIZE;
            const r = Math.floor((touch.clientY - rect.top) / cellH);
            const c = Math.floor((touch.clientX - rect.left) / cellW);
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                setHoverCoords({ r, c });
            } else {
                setHoverCoords(null);
            }
        }
    };

    const handleTouchStart = (piece: Piece, index: number, e: React.TouchEvent) => {
        resumeAudio();
        const touch = e.touches[0];
        setDraggedPiece({ piece, index });
        setDragPos({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
        if (hoverCoords) handleActionEnd(hoverCoords.r, hoverCoords.c);
        else setDraggedPiece(null);
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,243,255,0.4)]">NEON BLOCKS</h1>
                </div>
                <button onClick={initGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            <div className="w-full max-w-md flex justify-between items-center px-4 mb-4 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Score</span><span className="text-2xl font-mono font-bold">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Record</span><span className="text-2xl font-mono font-bold text-cyan-400">{highScores.neonblocks || 0}</span></div>
            </div>

            <div ref={gridRef} className="relative w-full max-w-md aspect-square bg-gray-900/60 border-4 border-gray-800 rounded-xl shadow-2xl p-1 grid grid-cols-10 gap-1 backdrop-blur-md z-10">
                {grid.map((row, r) => row.map((cell, c) => {
                    const isHovered = draggedPiece && hoverCoords && 
                                     r >= hoverCoords.r && r < hoverCoords.r + draggedPiece.piece.shape.length &&
                                     c >= hoverCoords.c && c < hoverCoords.c + draggedPiece.piece.shape[0].length &&
                                     draggedPiece.piece.shape[r - hoverCoords.r][c - hoverCoords.c] === 1;
                    
                    return (
                        <div key={`${r}-${c}`} className={`w-full h-full rounded-sm border border-white/5 transition-colors duration-150 ${cell || (isHovered ? 'bg-white/20' : 'bg-black/40 shadow-inner')}`}></div>
                    );
                }))}
            </div>

            <div className="flex justify-around items-center w-full max-w-md mt-10 h-32 bg-black/40 rounded-2xl border border-white/10 p-2 z-10">
                {availablePieces.map((piece, idx) => (
                    <div 
                        key={piece.id}
                        onTouchStart={(e) => handleTouchStart(piece, idx, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${draggedPiece?.piece.id === piece.id ? 'opacity-20' : 'opacity-100'}`}
                    >
                        <div className="flex flex-col gap-0.5">
                            {piece.shape.map((row, r) => (
                                <div key={r} className="flex gap-0.5">
                                    {row.map((cell, c) => (
                                        <div key={c} className={`w-4 h-4 rounded-sm ${cell === 1 ? piece.color : 'bg-transparent'}`}></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {draggedPiece && (
                <div 
                    className="fixed pointer-events-none z-[100] scale-150 opacity-80"
                    style={{ left: dragPos.x - 40, top: dragPos.y - 40 }}
                >
                    <div className="flex flex-col gap-1">
                        {draggedPiece.piece.shape.map((row, r) => (
                            <div key={r} className="flex gap-1">
                                {row.map((cell, c) => (
                                    <div key={c} className={`w-8 h-8 rounded-md ${cell === 1 ? draggedPiece.piece.color : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isGameOver && (
                <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in">
                    <Trash2 size={80} className="text-red-500 mb-6 drop-shadow-[0_0_20px_red]" />
                    <h2 className="text-5xl font-black italic text-white mb-2">PLUS D'ESPACE</h2>
                    <p className="text-2xl font-mono text-cyan-400 mb-8">{score}</p>
                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}
                    <button onClick={initGame} className="px-10 py-4 bg-cyan-500 text-black font-black tracking-widest text-lg rounded-xl hover:bg-white transition-all shadow-lg active:scale-95">REJOUER</button>
                    <button onClick={onBack} className="mt-4 text-gray-500 hover:text-white transition-colors">Retour Menu</button>
                </div>
            )}
        </div>
    );
};
