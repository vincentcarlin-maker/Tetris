
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, Layers, Star, Trash2 } from 'lucide-react';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

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

// Définitions de formes néon variées
const PIECES_TEMPLATES: Omit<Piece, 'id'>[] = [
    { shape: [[1]], color: 'bg-cyan-500 shadow-[0_0_10px_#00f3ff]' },
    { shape: [[1, 1]], color: 'bg-blue-600 shadow-[0_0_10px_#2563eb]' },
    { shape: [[1], [1]], color: 'bg-blue-600 shadow-[0_0_10px_#2563eb]' },
    { shape: [[1, 1, 1]], color: 'bg-purple-600 shadow-[0_0_10px_#9333ea]' },
    { shape: [[1], [1], [1]], color: 'bg-purple-600 shadow-[0_0_10px_#9333ea]' },
    { shape: [[1, 1, 1, 1]], color: 'bg-pink-600 shadow-[0_0_10px_#db2777]' },
    { shape: [[1], [1], [1], [1]], color: 'bg-pink-600 shadow-[0_0_10px_#db2777]' },
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500 shadow-[0_0_10px_#eab308]' },
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'bg-red-600 shadow-[0_0_10px_#dc2626]' },
    { shape: [[1, 1], [1, 0]], color: 'bg-green-600 shadow-[0_0_10px_#16a34a]' },
    { shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'bg-orange-600 shadow-[0_0_10px_#ea580c]' },
    { shape: [[1, 1], [0, 1], [0, 1]], color: 'bg-indigo-600 shadow-[0_0_10px_#4f46e5]' },
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
    const [showTutorial, setShowTutorial] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);
    const { playMove, playLand, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    const generateRandomPiece = (): Piece => {
        const template = PIECES_TEMPLATES[Math.floor(Math.random() * PIECES_TEMPLATES.length)];
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
        const hasSeen = localStorage.getItem('neon_blocks_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_blocks_tutorial_seen', 'true');
        }
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
        if (pieces.length === 0) return false;
        for (const piece of pieces) {
            for (let r = 0; r <= GRID_SIZE - piece.shape.length; r++) {
                for (let c = 0; c <= GRID_SIZE - piece.shape[0].length; c++) {
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

            // Détection de lignes/colonnes complètes
            const rowsToClear = [];
            const colsToClear = [];

            for (let i = 0; i < GRID_SIZE; i++) {
                if (newGrid[i].every(cell => cell !== null)) rowsToClear.push(i);
                let colFull = true;
                for (let j = 0; j < GRID_SIZE; j++) if (newGrid[j][i] === null) { colFull = false; break; }
                if (colFull) colsToClear.push(i);
            }

            rowsToClear.forEach(ri => { for(let i=0; i<GRID_SIZE; i++) newGrid[ri][i] = null; });
            colsToClear.forEach(ci => { for(let i=0; i<GRID_SIZE; i++) newGrid[i][ci] = null; });

            const cellsCount = piece.shape.flat().filter(v => v === 1).length;
            const linesCleared = rowsToClear.length + colsToClear.length;
            const points = (cellsCount * 10) + (linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1));
            
            setScore(s => {
                const ns = s + points;
                if (onReportProgress) onReportProgress('score', ns);
                return ns;
            });
            
            setGrid(newGrid);
            if (linesCleared > 0) playVictory(); else playLand();

            const newPieces = [...availablePieces];
            newPieces.splice(index, 1);
            
            const nextAvailable = newPieces.length === 0 ? [generateRandomPiece(), generateRandomPiece(), generateRandomPiece()] : newPieces;
            setAvailablePieces(nextAvailable);
            
            if (checkGameOver(nextAvailable, newGrid)) {
                setIsGameOver(true);
                playGameOver();
                updateHighScore('neonblocks', score + points);
                const coins = Math.floor((score + points) / 50);
                if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            }
        } else {
            audio.playWallHit?.();
        }
        
        setDraggedPiece(null);
        setHoverCoords(null);
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
            // On ajuste les coordonnées pour que le curseur soit au milieu de la pièce
            const r = Math.floor((touch.clientY - rect.top - (draggedPiece.piece.shape.length * cellH / 2)) / cellH);
            const c = Math.floor((touch.clientX - rect.left - (draggedPiece.piece.shape[0].length * cellW / 2)) / cellW);
            if (r >= 0 && r <= GRID_SIZE - draggedPiece.piece.shape.length && c >= 0 && c <= GRID_SIZE - draggedPiece.piece.shape[0].length) {
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

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none">
            {showTutorial && <TutorialOverlay gameId="rush" onClose={() => setShowTutorial(false)} />}
            
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,243,255,0.4)]">NEON BLOCKS</h1>
                </div>
                <button onClick={initGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            <div className="w-full max-w-md flex justify-between items-center px-4 mb-4 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Score</span><span className="text-2xl font-mono font-bold">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Record</span><span className="text-2xl font-mono font-bold text-cyan-400">{highScores.neonblocks || 0}</span></div>
            </div>

            {/* Grille de Jeu */}
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

            {/* Zone des pièces disponibles */}
            <div className="flex justify-around items-center w-full max-w-md mt-8 h-32 bg-black/40 rounded-2xl border border-white/10 p-2 z-10">
                {availablePieces.map((piece, idx) => (
                    <div 
                        key={piece.id}
                        onTouchStart={(e) => handleTouchStart(piece, idx, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleActionEnd(hoverCoords?.r || -1, hoverCoords?.c || -1)}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${draggedPiece?.piece.id === piece.id ? 'opacity-20' : 'opacity-100'}`}
                    >
                        <div className="flex flex-col gap-0.5 scale-75 sm:scale-100">
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

            {/* Curseur de drag visuel */}
            {draggedPiece && (
                <div 
                    className="fixed pointer-events-none z-[100] scale-150 opacity-80"
                    style={{ left: dragPos.x - (draggedPiece.piece.shape[0].length * 16), top: dragPos.y - (draggedPiece.piece.shape.length * 16) }}
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
                <div className="absolute inset-0 z-[150] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in text-center p-6">
                    <Trash2 size={80} className="text-red-500 mb-6 drop-shadow-[0_0_20px_red] animate-pulse" />
                    <h2 className="text-5xl font-black italic text-white mb-2 uppercase">Plus d'espace</h2>
                    <div className="flex flex-col mb-8"><span className="text-gray-400 text-xs font-bold tracking-widest mb-1">SCORE FINAL</span><span className="text-4xl font-mono font-black text-cyan-400">{score}</span></div>
                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border-2 border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-4 w-full max-w-[280px]">
                        <button onClick={initGame} className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-cyan-400 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={20} /> REJOUER</button>
                        <button onClick={onBack} className="w-full py-4 bg-gray-800 border border-white/10 text-white font-black tracking-widest rounded-2xl active:scale-95 transition-all">RETOUR ARCADE</button>
                    </div>
                </div>
            )}
        </div>
    );
};
