
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Eraser, Trophy, AlertCircle, Coins, HelpCircle, MousePointer2, Hash, Brain, Play, ArrowRight } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { generateSudoku } from './logic';
import { Difficulty, Grid } from './types';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface SudokuGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
    const [initialGrid, setInitialGrid] = useState<Grid>([]);
    const [playerGrid, setPlayerGrid] = useState<Grid>([]);
    const [solution, setSolution] = useState<Grid>([]);
    const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // New Menu State
    const [inMenu, setInMenu] = useState(true);

    const { playMove, playClear, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    const onReportProgressRef = useRef(onReportProgress);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_sudoku_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_sudoku_tutorial_seen', 'true');
        }
    }, []);

    const startNewGame = useCallback((diff: Difficulty) => {
        setDifficulty(diff);
        setInMenu(false);
        try {
            const { initial, solution: sol } = generateSudoku(diff);
            setInitialGrid(initial);
            setPlayerGrid(initial.map(row => [...row]));
            setSolution(sol);
            setIsWon(false);
            setMistakes(0);
            setSelectedCell(null);
            setEarnedCoins(0);
            
            if (onReportProgressRef.current) {
                onReportProgressRef.current('play', 1);
            }
        } catch (error) {
            console.error("Sudoku generation failed:", error);
            setInitialGrid([]);
            setPlayerGrid([]);
        }
    }, []);

    const handleCellClick = (r: number, c: number) => {
        if (showTutorial) return;
        resumeAudio();
        setSelectedCell({ r, c });
    };

    const handleInput = (num: number) => {
        if (!selectedCell || isWon || showTutorial) return;
        const { r, c } = selectedCell;

        if (initialGrid[r][c] !== null) return;

        resumeAudio();

        if (num === solution[r][c]) {
            const newGrid = [...playerGrid];
            newGrid[r] = [...newGrid[r]];
            newGrid[r][c] = num;
            setPlayerGrid(newGrid);
            playMove();

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
                
                let reward = 10;
                if (difficulty === 'MEDIUM') reward = 25;
                if (difficulty === 'HARD') reward = 50;
                
                addCoins(reward);
                setEarnedCoins(reward);
                updateHighScore('sudoku', mistakes, difficulty);
                if (onReportProgressRef.current) onReportProgressRef.current('win', 1);
            }

        } else {
            setMistakes(prev => prev + 1);
            playGameOver();
        }
    };

    const handleErase = () => {
        if (!selectedCell || isWon || showTutorial) return;
        const { r, c } = selectedCell;
        if (initialGrid[r][c] !== null) return;

        const newGrid = [...playerGrid];
        newGrid[r] = [...newGrid[r]];
        newGrid[r][c] = null;
        setPlayerGrid(newGrid);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isWon || showTutorial || inMenu) return;
            if (e.key >= '1' && e.key <= '9') {
                handleInput(parseInt(e.key));
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                handleErase();
            }
            if (selectedCell) {
                if (e.key === 'ArrowUp') setSelectedCell(prev => ({ r: Math.max(0, prev!.r - 1), c: prev!.c }));
                if (e.key === 'ArrowDown') setSelectedCell(prev => ({ r: Math.min(8, prev!.r + 1), c: prev!.c }));
                if (e.key === 'ArrowLeft') setSelectedCell(prev => ({ r: prev!.r, c: Math.max(0, prev!.c - 1) }));
                if (e.key === 'ArrowRight') setSelectedCell(prev => ({ r: prev!.r, c: Math.min(8, prev!.c + 1) }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, isWon, initialGrid, playerGrid, solution, showTutorial, inMenu]);

    const bestScore = highScores.sudoku?.[difficulty.toLowerCase()];

    if (inMenu) {
         return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Brain size={56} className="text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(56,189,248,0.6)] tracking-tighter w-full">
                                NEON<br className="md:hidden"/> SUDOKU
                            </h1>
                            <Brain size={56} className="text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.8)] animate-pulse hidden md:block" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl flex-shrink-0">
                        <button onClick={() => startNewGame('EASY')} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-green-500/50 hover:shadow-[0_0_50px_rgba(34,197,94,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-green-300 transition-colors">FACILE</h2>
                                <p className="text-gray-400 text-xs font-medium">Pour s'échauffer les neurones.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-green-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                LANCER <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        <button onClick={() => startNewGame('MEDIUM')} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-yellow-300 transition-colors">MOYEN</h2>
                                <p className="text-gray-400 text-xs font-medium">Un défi équilibré.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-yellow-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                LANCER <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        <button onClick={() => startNewGame('HARD')} className="group relative h-40 md:h-60 rounded-[24px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] text-left p-6 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-white italic mb-1 group-hover:text-red-300 transition-colors">DIFFICILE</h2>
                                <p className="text-gray-400 text-xs font-medium">Pour les maîtres de la logique.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-red-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                LANCER <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg">
                            <Home size={14} /> RETOUR AU MENU PRINCIPAL
                        </button>
                    </div>
                </div>
            </div>
         );
    }

    if (playerGrid.length === 0) return <div className="text-white text-center mt-20">Chargement...</div>;

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            {showTutorial && <TutorialOverlay gameId="sudoku" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={() => setInMenu(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] pr-2 pb-1">NEON SUDOKU</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10 px-2">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm"><Coins size={16} /> {earnedCoins}</div>
                    <div className="flex items-center gap-2 text-red-400 font-mono text-sm"><AlertCircle size={16} /> {mistakes}</div>
                    {bestScore !== undefined && (<div className="flex items-center gap-2 text-green-400 font-mono text-sm"><Trophy size={16} /> {bestScore}</div>)}
                </div>
                <div className="px-3 py-1 bg-gray-900 rounded-full border border-white/10 text-xs font-bold text-cyan-400">{difficulty === 'EASY' ? 'FACILE' : difficulty === 'MEDIUM' ? 'MOYEN' : 'DIFFICILE'}</div>
            </div>

            {/* GRID */}
            <div className="w-full max-w-md aspect-square bg-gray-900/90 border-2 border-cyan-500/30 rounded-lg p-1 shadow-[0_0_20px_rgba(6,182,212,0.1)] z-10 relative backdrop-blur-md">
                {isWon && (
                    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                        <h2 className="text-4xl font-black italic text-white mb-2">VICTOIRE !</h2>
                        <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>
                        <button onClick={() => startNewGame(difficulty)} className="px-8 py-3 bg-cyan-500 text-black font-bold rounded-full hover:bg-white transition-colors shadow-lg active:scale-95">NOUVELLE PARTIE</button>
                    </div>
                )}
                <div className="w-full h-full grid grid-cols-9 grid-rows-9 border border-gray-700">
                    {playerGrid.map((row, r) => (row.map((val, c) => {
                            const isInitial = initialGrid[r][c] !== null;
                            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                            const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c || (Math.floor(selectedCell.r/3) === Math.floor(r/3) && Math.floor(selectedCell.c/3) === Math.floor(c/3)));
                            const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-cyan-500/50' : 'border-r border-r-gray-800';
                            const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-cyan-500/50' : 'border-b border-b-gray-800';
                            return (<div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`flex items-center justify-center text-lg sm:text-2xl cursor-pointer transition-colors ${borderRight} ${borderBottom} ${isSelected ? 'bg-cyan-500/40' : isRelated ? 'bg-white/5' : 'bg-transparent'} ${isInitial ? 'font-bold text-gray-300' : 'font-light text-cyan-400'}`}>{val}</div>);
                    })))}
                </div>
            </div>

            {/* NUMPAD */}
            <div className="w-full max-w-md mt-6 z-10 grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<button key={num} onClick={() => handleInput(num)} disabled={isWon || showTutorial} className="aspect-square rounded-lg bg-gray-800 border border-white/10 text-xl font-bold text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-50">{num}</button>))}
                 <button onClick={handleErase} disabled={isWon || showTutorial} className="aspect-square rounded-lg bg-gray-800 border border-white/10 text-xl font-bold text-red-400 hover:bg-red-500 hover:text-white active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-50"><Eraser size={24} /></button>
            </div>
            
            <div className="mt-4 z-10">
                 <button onClick={() => startNewGame(difficulty)} disabled={showTutorial} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs tracking-widest transition-colors disabled:opacity-50"><RefreshCw size={14} /> RÉINITIALISER LA PARTIE</button>
             </div>
        </div>
    );
};
