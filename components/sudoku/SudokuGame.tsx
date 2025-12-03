import React, { useState, useEffect, useCallback } from 'react';
import { Home, RefreshCw, Eraser, Trophy, AlertCircle, Coins } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { generateSudoku } from './logic';
import { Difficulty, Grid } from './types';
import { useHighScores } from '../../hooks/useHighScores';

interface SudokuGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onBack, audio, addCoins }) => {
    const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
    const [initialGrid, setInitialGrid] = useState<Grid>([]);
    const [playerGrid, setPlayerGrid] = useState<Grid>([]);
    const [solution, setSolution] = useState<Grid>([]);
    const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { playMove, playClear, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    const startNewGame = useCallback(() => {
        try {
            const { initial, solution: sol } = generateSudoku(difficulty);
            setInitialGrid(initial);
            // Deep copy for player grid
            setPlayerGrid(initial.map(row => [...row]));
            setSolution(sol);
            setIsWon(false);
            setMistakes(0);
            setSelectedCell(null);
            setEarnedCoins(0);
        } catch (error) {
            console.error("Sudoku generation failed:", error);
            // Fallback to prevent crash loop
            setInitialGrid([]);
            setPlayerGrid([]);
        }
    }, [difficulty]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const handleCellClick = (r: number, c: number) => {
        resumeAudio();
        setSelectedCell({ r, c });
    };

    const handleInput = (num: number) => {
        if (!selectedCell || isWon) return;
        const { r, c } = selectedCell;

        // Cannot edit initial cells
        if (initialGrid[r][c] !== null) return;

        resumeAudio();

        if (num === solution[r][c]) {
            // Correct move
            const newGrid = [...playerGrid];
            newGrid[r] = [...newGrid[r]];
            newGrid[r][c] = num;
            setPlayerGrid(newGrid);
            playMove();

            // Check Win
            let filled = true;
            for(let i=0; i<9; i++) {
                for(let j=0; j<9; j++) {
                    if (newGrid[i][j] === null) {
                        filled = false;
                        break;
                    }
                }
            }
            if (filled) {
                setIsWon(true);
                playClear();
                
                // Rewards logic
                let reward = 10;
                if (difficulty === 'MEDIUM') reward = 25;
                if (difficulty === 'HARD') reward = 50;
                
                addCoins(reward);
                setEarnedCoins(reward);
                updateHighScore('sudoku', mistakes, difficulty);
            }

        } else {
            // Wrong move
            setMistakes(prev => prev + 1);
            playGameOver(); // Error sound
        }
    };

    const handleErase = () => {
        if (!selectedCell || isWon) return;
        const { r, c } = selectedCell;
        if (initialGrid[r][c] !== null) return;

        const newGrid = [...playerGrid];
        newGrid[r] = [...newGrid[r]];
        newGrid[r][c] = null;
        setPlayerGrid(newGrid);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isWon) return;
            
            // Numbers 1-9
            if (e.key >= '1' && e.key <= '9') {
                handleInput(parseInt(e.key));
            }
            // Delete/Backspace
            if (e.key === 'Backspace' || e.key === 'Delete') {
                handleErase();
            }
            // Arrows
            if (selectedCell) {
                if (e.key === 'ArrowUp') setSelectedCell(prev => ({ r: Math.max(0, prev!.r - 1), c: prev!.c }));
                if (e.key === 'ArrowDown') setSelectedCell(prev => ({ r: Math.min(8, prev!.r + 1), c: prev!.c }));
                if (e.key === 'ArrowLeft') setSelectedCell(prev => ({ r: prev!.r, c: Math.max(0, prev!.c - 1) }));
                if (e.key === 'ArrowRight') setSelectedCell(prev => ({ r: prev!.r, c: Math.min(8, prev!.c + 1) }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, isWon, initialGrid, playerGrid, solution]); // deps needed for handleInput context

    const bestScore = highScores.sudoku?.[difficulty.toLowerCase()];

    if (playerGrid.length === 0) return <div className="text-white text-center mt-20">Chargement...</div>;

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            {/* Ambient Light Reflection (MIX-BLEND-HARD-LIGHT pour révéler les briques) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />

             {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <Home size={20} />
                </button>
                <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] pr-2 pb-1">
                    NEON SUDOKU
                </h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Stats / Controls */}
            <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10 px-2">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
                        <Coins size={16} /> GAINS: {earnedCoins}
                    </div>
                    <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
                        <AlertCircle size={16} /> ERREURS: {mistakes}
                    </div>
                    {bestScore !== undefined && (
                        <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                            <Trophy size={16} /> RECORD: {bestScore}
                        </div>
                    )}
                </div>
                 
                 <div className="flex bg-gray-900 rounded-full border border-white/10 overflow-hidden">
                    {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${
                                difficulty === d 
                                ? 'bg-cyan-500 text-black' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {d === 'EASY' ? 'FACILE' : d === 'MEDIUM' ? 'MOYEN' : 'DIFF.'}
                        </button>
                    ))}
                 </div>
            </div>

            {/* GRID */}
            <div className="w-full max-w-md aspect-square bg-gray-900/90 border-2 border-cyan-500/30 rounded-lg p-1 shadow-[0_0_20px_rgba(6,182,212,0.1)] z-10 relative backdrop-blur-md">
                
                {/* Victory Overlay */}
                {isWon && (
                    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                        <h2 className="text-4xl font-black italic text-white mb-2">VICTOIRE !</h2>
                        
                        <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={20} />
                            <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                        </div>

                        <button 
                            onClick={startNewGame}
                            className="px-8 py-3 bg-cyan-500 text-black font-bold rounded-full hover:bg-white transition-colors shadow-lg active:scale-95"
                        >
                            NOUVELLE PARTIE
                        </button>
                    </div>
                )}

                <div className="w-full h-full grid grid-cols-9 grid-rows-9 border border-gray-700">
                    {playerGrid.map((row, r) => (
                        row.map((val, c) => {
                            const isInitial = initialGrid[r][c] !== null;
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                            const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c || (Math.floor(selectedCell.r/3) === Math.floor(r/3) && Math.floor(selectedCell.c/3) === Math.floor(c/3)));
                            
                            // Borders for 3x3 boxes
                            const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-cyan-500/50' : 'border-r border-r-gray-800';
                            const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-cyan-500/50' : 'border-b border-b-gray-800';
                            
                            return (
                                <div 
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`
                                        flex items-center justify-center text-lg sm:text-2xl cursor-pointer transition-colors
                                        ${borderRight} ${borderBottom}
                                        ${isSelected ? 'bg-cyan-500/40' : isRelated ? 'bg-white/5' : 'bg-transparent'}
                                        ${isInitial ? 'font-bold text-gray-300' : 'font-light text-cyan-400'}
                                    `}
                                >
                                    {val}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* NUMPAD */}
            <div className="w-full max-w-md mt-6 z-10 grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleInput(num)}
                        disabled={isWon}
                        className="aspect-square rounded-lg bg-gray-800 border border-white/10 text-xl font-bold text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    >
                        {num}
                    </button>
                ))}
                 <button
                    onClick={handleErase}
                    disabled={isWon}
                    className="aspect-square rounded-lg bg-gray-800 border border-white/10 text-xl font-bold text-red-400 hover:bg-red-500 hover:text-white active:scale-95 transition-all shadow-lg flex items-center justify-center"
                >
                    <Eraser size={24} />
                </button>
            </div>
            
            {/* New Game Button Footer */}
             <div className="mt-4 z-10">
                 <button 
                    onClick={startNewGame}
                    className="flex items-center gap-2 text-gray-500 hover:text-white text-xs tracking-widest transition-colors"
                 >
                    <RefreshCw size={14} /> RÉINITIALISER LA PARTIE
                 </button>
             </div>
        </div>
    );
};