
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, BrainCircuit, Delete, Check, X } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface MastermindGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

// --- CONSTANTS ---
const COLORS = [
    'bg-red-500 shadow-[0_0_10px_#ef4444]',      // 0
    'bg-green-500 shadow-[0_0_10px_#22c55e]',    // 1
    'bg-blue-500 shadow-[0_0_10px_#3b82f6]',     // 2
    'bg-yellow-400 shadow-[0_0_10px_#facc15]',   // 3
    'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',     // 4
    'bg-purple-500 shadow-[0_0_10px_#a855f7]',   // 5
];

const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;

export const MastermindGame: React.FC<MastermindGameProps> = ({ onBack, audio, addCoins }) => {
    // Game State
    const [secretCode, setSecretCode] = useState<number[]>([]);
    const [guesses, setGuesses] = useState<number[][]>([]);
    const [feedback, setFeedback] = useState<{ exact: number; partial: number }[]>([]);
    const [currentGuess, setCurrentGuess] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [activeRow, setActiveRow] = useState(0);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    
    // Le score pour le mastermind est le nombre de tours (plus bas est mieux), 0 = pas joué
    const bestScore = highScores.mastermind || 0; 

    // Initialize Game
    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        // Generate Secret Code
        const newCode = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
        setSecretCode(newCode);
        
        // Reset State
        setGuesses(Array(MAX_ATTEMPTS).fill(null)); // Fill with null to render empty rows
        setFeedback(Array(MAX_ATTEMPTS).fill(null));
        setCurrentGuess([]);
        setActiveRow(0);
        setGameState('playing');
        setEarnedCoins(0);
        playLand(); // Start sound
        resumeAudio();
    };

    const handleColorClick = (colorIndex: number) => {
        if (gameState !== 'playing' || currentGuess.length >= CODE_LENGTH) return;
        
        playMove();
        setCurrentGuess(prev => [...prev, colorIndex]);
    };

    const handleDelete = () => {
        if (gameState !== 'playing' || currentGuess.length === 0) return;
        playPaddleHit(); // Delete sound
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    const calculateFeedback = (guess: number[], secret: number[]) => {
        let exact = 0;
        let partial = 0;
        
        const secretCopy = [...secret];
        const guessCopy = [...guess];

        // 1. Check Exact Matches
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guess[i] === secret[i]) {
                exact++;
                secretCopy[i] = -1; // Mark as handled
                guessCopy[i] = -2;  // Mark as handled
            }
        }

        // 2. Check Partial Matches
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guessCopy[i] !== -2) {
                const foundIndex = secretCopy.indexOf(guessCopy[i]);
                if (foundIndex !== -1) {
                    partial++;
                    secretCopy[foundIndex] = -1; // Mark as handled
                }
            }
        }

        return { exact, partial };
    };

    const handleSubmit = () => {
        if (gameState !== 'playing' || currentGuess.length !== CODE_LENGTH) return;

        const currentFeedback = calculateFeedback(currentGuess, secretCode);
        
        // Update History
        const newGuesses = [...guesses];
        newGuesses[activeRow] = currentGuess;
        setGuesses(newGuesses);

        const newFeedback = [...feedback];
        newFeedback[activeRow] = currentFeedback;
        setFeedback(newFeedback);

        // Check Win/Loss
        if (currentFeedback.exact === CODE_LENGTH) {
            handleWin(activeRow + 1);
        } else if (activeRow >= MAX_ATTEMPTS - 1) {
            handleLoss();
        } else {
            // Next Turn
            playLand(); // Row complete sound
            setActiveRow(prev => prev + 1);
            setCurrentGuess([]);
        }
    };

    const handleWin = (attempts: number) => {
        setGameState('won');
        playVictory();
        
        // Calculate Score & Coins
        // Max attempts = 10. Win at 1 = 100pts. Win at 10 = 10pts.
        const scoreBase = (MAX_ATTEMPTS - attempts + 1) * 10;
        // Coin reward
        const coins = Math.floor(scoreBase / 2) + 10; 
        
        addCoins(coins);
        setEarnedCoins(coins);

        // Update High Score (Lower attempts is better for leaderboard usually, but here we might track points or min moves)
        // Let's stick to the app convention: Some games are high score, logic games often min moves.
        // For Mastermind, standard is "Fewest Moves".
        if (bestScore === 0 || attempts < bestScore) {
            updateHighScore('mastermind', attempts);
        }
    };

    const handleLoss = () => {
        setGameState('lost');
        playGameOver();
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            {/* Ambient Light */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] pr-2 pb-1">
                    NEON MIND
                </h1>
                <button onClick={startNewGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">ESSAIS</span><span className="text-xl font-mono font-bold text-white">{activeRow + 1}/{MAX_ATTEMPTS}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{bestScore > 0 ? `${bestScore} cps` : '-'}</span></div>
            </div>

            {/* Game Board */}
            <div className="flex-1 w-full max-w-md bg-gray-900/80 border-2 border-cyan-500/30 rounded-xl shadow-2xl relative overflow-y-auto custom-scrollbar p-2 mb-4 backdrop-blur-md z-10">
                
                {/* Result Overlay */}
                {(gameState !== 'playing') && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                        {gameState === 'won' ? (
                            <>
                                <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                                <h2 className="text-4xl font-black italic text-white mb-2">CODE DÉCRYPTÉ !</h2>
                                <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse mb-6">
                                    <Coins className="text-yellow-400" size={24} />
                                    <span className="text-yellow-100 font-bold text-xl">+{earnedCoins}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <BrainCircuit size={64} className="text-red-500 mb-4 drop-shadow-[0_0_15px_red]" />
                                <h2 className="text-4xl font-black italic text-red-500 mb-2">ÉCHEC...</h2>
                                <p className="text-gray-400 mb-4">Le code était :</p>
                                <div className="flex gap-2 mb-6">
                                    {secretCode.map((c, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full ${COLORS[c]} border-2 border-white/20`} />
                                    ))}
                                </div>
                            </>
                        )}
                        <button onClick={startNewGame} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                            <RefreshCw size={20} /> REJOUER
                        </button>
                    </div>
                )}

                {/* Rows */}
                <div className="flex flex-col gap-1.5 h-full justify-end">
                    {/* Reverse map to show current attempt at bottom like arcade machines */}
                    {[...Array(MAX_ATTEMPTS)].map((_, index) => {
                        // The actual index in the state arrays
                        const rowIndex = index; 
                        const isCurrent = rowIndex === activeRow;
                        const rowData = guesses[rowIndex];
                        const fb = feedback[rowIndex];
                        const isPlayed = !!rowData;

                        return (
                            <div key={rowIndex} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCurrent ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]' : 'bg-black/40 border-white/5'}`}>
                                <span className="text-[10px] font-mono text-gray-600 w-4">{rowIndex + 1}</span>
                                
                                {/* Pegs */}
                                <div className="flex-1 flex justify-center gap-2 sm:gap-4">
                                    {[...Array(CODE_LENGTH)].map((_, i) => {
                                        let colorClass = 'bg-black/50 border border-white/10';
                                        
                                        if (isCurrent) {
                                            if (i < currentGuess.length) colorClass = COLORS[currentGuess[i]];
                                            else if (i === currentGuess.length) colorClass += ' ring-1 ring-white/50 animate-pulse'; // Cursor
                                        } else if (isPlayed) {
                                            colorClass = COLORS[rowData[i]];
                                        }

                                        return (
                                            <div key={i} className={`w-8 h-8 rounded-full shadow-inner ${colorClass} transition-all duration-200`}></div>
                                        );
                                    })}
                                </div>

                                {/* Feedback */}
                                <div className="grid grid-cols-2 gap-1 w-8">
                                    {isPlayed ? (
                                        <>
                                            {[...Array(fb.exact)].map((_, i) => <div key={`e${i}`} className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>)}
                                            {[...Array(fb.partial)].map((_, i) => <div key={`p${i}`} className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]"></div>)}
                                            {[...Array(Math.max(0, 4 - fb.exact - fb.partial))].map((_, i) => <div key={`n${i}`} className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>)}
                                        </>
                                    ) : (
                                        [...Array(4)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-800/50"></div>)
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md z-20 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-gray-900/90 p-2 rounded-xl border border-white/10">
                    {COLORS.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleColorClick(idx)}
                            disabled={gameState !== 'playing' || currentGuess.length >= CODE_LENGTH}
                            className={`w-10 h-10 rounded-full ${color} border-2 border-white/20 active:scale-90 transition-transform shadow-lg ${gameState !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                        />
                    ))}
                </div>
                
                <div className="flex gap-2 h-14">
                    <button 
                        onClick={handleDelete}
                        disabled={currentGuess.length === 0 || gameState !== 'playing'}
                        className="flex-[1] bg-gray-800 text-red-400 rounded-xl flex items-center justify-center border border-white/10 active:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        <Delete size={24} />
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={currentGuess.length !== CODE_LENGTH || gameState !== 'playing'}
                        className="flex-[3] bg-green-600 text-white font-black tracking-widest text-lg rounded-xl flex items-center justify-center border-b-4 border-green-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    >
                        VALIDER <Check size={20} className="ml-2" strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};
