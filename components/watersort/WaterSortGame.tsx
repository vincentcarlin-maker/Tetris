
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, FlaskConical, Undo2, Plus, Play, ArrowRight } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface WaterSortGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// 0: Empty
// 1-8: Colors
type LiquidColor = number;
type Tube = LiquidColor[];

const TUBE_CAPACITY = 4;

const NEON_COLORS: Record<number, string> = {
    1: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
    2: 'bg-blue-500 shadow-[0_0_10px_#3b82f6]',
    3: 'bg-green-500 shadow-[0_0_10px_#22c55e]',
    4: 'bg-yellow-400 shadow-[0_0_10px_#facc15]',
    5: 'bg-purple-500 shadow-[0_0_10px_#a855f7]',
    6: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
    7: 'bg-orange-500 shadow-[0_0_10px_#f97316]',
    8: 'bg-pink-500 shadow-[0_0_10px_#ec4899]',
};

// Helper to check if level is solved
const isLevelSolved = (tubes: Tube[]) => {
    return tubes.every(tube => {
        if (tube.length === 0) return true; // Empty tube is valid
        if (tube.length !== TUBE_CAPACITY) return false; // Partial tube is not valid
        const color = tube[0];
        return tube.every(c => c === color); // All colors match
    });
};

export const WaterSortGame: React.FC<WaterSortGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { playMove, playLand, playVictory, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    
    // State
    const [level, setLevel] = useState(highScores.watersort || 1);
    const [tubes, setTubes] = useState<Tube[]>([]);
    const [selectedTube, setSelectedTube] = useState<number | null>(null);
    const [history, setHistory] = useState<Tube[][]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [levelComplete, setLevelComplete] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [extraTubeUsed, setExtraTubeUsed] = useState(false);

    // Initial Load
    useEffect(() => {
        generateLevel(level);
    }, []);

    const generateLevel = (lvl: number) => {
        setHistory([]);
        setSelectedTube(null);
        setLevelComplete(false);
        setEarnedCoins(0);
        setExtraTubeUsed(false);
        setIsAnimating(false);

        // Difficulty scaling
        let colorCount = Math.min(3 + Math.floor(lvl / 2), 8); // Max 8 colors
        let emptyTubes = 2;
        if (lvl > 10) emptyTubes = 1; // Harder later

        const totalTubes = colorCount + emptyTubes;
        
        // 1. Create solved state
        let newTubes: Tube[] = [];
        for (let i = 1; i <= colorCount; i++) {
            newTubes.push(Array(TUBE_CAPACITY).fill(i));
        }
        for (let i = 0; i < emptyTubes; i++) {
            newTubes.push([]);
        }

        // 2. Shuffle by simulating moves (guarantees solvability)
        // We simulate backwards: take from top of random tube, put in random valid tube
        // Actually easier: Perform valid moves randomly X times
        const shuffleMoves = 100 + (lvl * 10);
        
        for (let i = 0; i < shuffleMoves; i++) {
            const srcIdx = Math.floor(Math.random() * totalTubes);
            const dstIdx = Math.floor(Math.random() * totalTubes);
            
            if (srcIdx === dstIdx) continue;
            
            const srcTube = newTubes[srcIdx];
            const dstTube = newTubes[dstIdx];

            if (srcTube.length > 0 && dstTube.length < TUBE_CAPACITY) {
                // Ensure we don't just undo the immediate previous move in a dumb way
                // Logic: Just move top.
                const color = srcTube[srcTube.length - 1];
                
                // Allow move to empty or matching color (standard rules applied during shuffle to keep it natural)
                // BUT for shuffling generation, we can actually be more lenient to ensure mix, 
                // as long as we don't exceed capacity.
                // However, to ensure REVERSE is solvable with standard rules, we should adhere to standard rules?
                // No, standard generation usually fills completely random then validates, or mixes.
                // Let's stick to: Move top unit to another tube if space.
                // We actually want to break clusters.
                
                // Better approach: Distribute all units into a flat list, shuffle list, fill tubes?
                // That might create unsolvable states.
                
                // Robust approach: Valid moves simulation.
                // Can move if: dst empty OR dst top == color.
                
                const validMove = dstTube.length === 0 || dstTube[dstTube.length - 1] === color;
                // To force mixing, we sometimes allow "illegal" moves during generation? No, that breaks solvability.
                
                // Let's try: Distribute randomly, then check solvability? Too hard.
                
                // Let's stick to valid random moves from solved state.
                if (validMove) {
                     // Check if we are just moving a color to a tube full of same color (pointless)
                     if (dstTube.length > 0 && dstTube.every(c => c === color) && srcTube.every(c => c === color)) {
                         continue;
                     }
                     
                     dstTube.push(srcTube.pop()!);
                }
            }
        }

        setTubes(newTubes);
        if (onReportProgress) onReportProgress('play', 1);
    };

    const handleTubeClick = (index: number) => {
        if (isAnimating || levelComplete) return;
        resumeAudio();

        if (selectedTube === null) {
            // Select source
            if (tubes[index].length > 0) {
                setSelectedTube(index);
                playPaddleHit(); // Select sound
            }
        } else {
            if (selectedTube === index) {
                // Deselect
                setSelectedTube(null);
            } else {
                // Attempt Pour
                attemptPour(selectedTube, index);
            }
        }
    };

    const attemptPour = (srcIdx: number, dstIdx: number) => {
        const newTubes = tubes.map(t => [...t]);
        const srcTube = newTubes[srcIdx];
        const dstTube = newTubes[dstIdx];

        if (srcTube.length === 0) {
            setSelectedTube(null);
            return;
        }

        const colorToMove = srcTube[srcTube.length - 1];

        // Check Validity
        // 1. Destination has space
        // 2. Destination is empty OR Top color matches
        if (dstTube.length < TUBE_CAPACITY) {
            if (dstTube.length === 0 || dstTube[dstTube.length - 1] === colorToMove) {
                // Valid!
                
                // Save History
                setHistory(prev => [...prev, tubes]); // Save snapshot of current tubes

                // Move as many matching units as possible
                let movedCount = 0;
                while (
                    srcTube.length > 0 && 
                    srcTube[srcTube.length - 1] === colorToMove && 
                    dstTube.length < TUBE_CAPACITY
                ) {
                    dstTube.push(srcTube.pop()!);
                    movedCount++;
                }

                setIsAnimating(true);
                playMove(); // Water sound effect
                setTubes(newTubes);
                setSelectedTube(null);

                setTimeout(() => {
                    setIsAnimating(false);
                    playLand(); // Success thud
                    
                    if (isLevelSolved(newTubes)) {
                        handleLevelComplete();
                    }
                }, 300);
                return;
            }
        }

        // Invalid move
        playPaddleHit(); // Reuse for "cancel/error" feel (short tick)
        setSelectedTube(null);
    };

    const handleLevelComplete = () => {
        setLevelComplete(true);
        playVictory();
        
        const coins = 20 + Math.floor(level / 2);
        addCoins(coins);
        setEarnedCoins(coins);
        
        if (level >= (highScores.watersort || 0)) {
            updateHighScore('watersort', level + 1);
        }
        
        if (onReportProgress) onReportProgress('win', 1);
        if (onReportProgress) onReportProgress('action', 1); // Level clear
    };

    const handleNextLevel = () => {
        setLevel(l => l + 1);
        generateLevel(level + 1);
    };

    const handleUndo = () => {
        if (history.length === 0 || levelComplete) return;
        const previousState = history[history.length - 1];
        setTubes(previousState);
        setHistory(prev => prev.slice(0, -1));
        setSelectedTube(null);
        playPaddleHit();
    };

    const handleAddTube = () => {
        if (extraTubeUsed || levelComplete) return;
        // Cost: 50 coins
        // We need to check coins but we don't have direct read access here easily without currency hook again
        // However, standard is usually free "ad" or cost. Let's make it cost 50 via callback if we had it.
        // Since we can't verify balance easily in this component structure without refactoring `addCoins` to return success,
        // we'll just implement it as a "once per level" free helper for now, or just assume player has coins visually.
        // Better: Make it free once per level.
        
        setTubes(prev => [...prev, []]); // Add empty tube
        setExtraTubeUsed(true);
        playVictory(); // Positive feedback
    };

    const handleRestart = () => {
        generateLevel(level);
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            {/* Ambient FX */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON MIX</h1>
                    <span className="text-xs font-bold text-cyan-300 tracking-widest">NIVEAU {level}</span>
                </div>
                <button onClick={handleRestart} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full max-w-lg flex items-center justify-center relative z-10 min-h-0">
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
                    {tubes.map((tube, i) => {
                        const isSelected = selectedTube === i;
                        return (
                            <div 
                                key={i} 
                                onClick={() => handleTubeClick(i)}
                                className={`
                                    relative w-12 sm:w-14 h-40 sm:h-48 border-2 rounded-b-full rounded-t-lg transition-all duration-300 cursor-pointer
                                    ${isSelected ? 'border-yellow-400 shadow-[0_0_15px_#facc15] -translate-y-4' : 'border-white/30 hover:border-white/60'}
                                    bg-white/5 backdrop-blur-sm flex flex-col-reverse overflow-hidden
                                `}
                            >
                                {/* Tube Highlights */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-20 rounded-b-full"></div>
                                <div className="absolute top-1 left-1 w-1 h-full bg-white/20 blur-[1px] z-20 rounded-full opacity-50"></div>

                                {/* Liquid Segments */}
                                {tube.map((color, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-full h-[25%] ${NEON_COLORS[color]} transition-all duration-300 relative`}
                                    >
                                        {/* Surface tension effect */}
                                        <div className="absolute top-0 left-0 w-full h-[4px] bg-white/30 rounded-[50%] -translate-y-1/2"></div>
                                        {/* Bubbles effect (optional detail) */}
                                        {Math.random() > 0.5 && <div className="absolute bottom-2 left-1/2 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-lg flex justify-center gap-6 mt-6 z-10 pb-4">
                <button 
                    onClick={handleUndo} 
                    disabled={history.length === 0}
                    className="flex flex-col items-center gap-1 text-gray-400 disabled:opacity-30 hover:text-white transition-colors group"
                >
                    <div className="p-4 bg-gray-800 rounded-full border border-white/10 group-hover:border-white/50 shadow-lg active:scale-95 transition-all">
                        <Undo2 size={24} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest">ANNULER</span>
                </button>

                <button 
                    onClick={handleAddTube} 
                    disabled={extraTubeUsed}
                    className="flex flex-col items-center gap-1 text-gray-400 disabled:opacity-30 hover:text-cyan-400 transition-colors group"
                >
                    <div className="p-4 bg-gray-800 rounded-full border border-white/10 group-hover:border-cyan-500 shadow-lg active:scale-95 transition-all">
                        <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest">TUBE (+1)</span>
                </button>
            </div>

            {/* Level Complete Overlay */}
            {levelComplete && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
                    <h2 className="text-5xl font-black italic text-white mb-2">BRAVO !</h2>
                    <p className="text-cyan-400 font-bold mb-6 tracking-widest">NIVEAU {level} TERMINÉ</p>
                    
                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}

                    <button 
                        onClick={handleNextLevel}
                        className="px-10 py-4 bg-cyan-500 text-black font-black tracking-widest text-lg rounded-full hover:bg-white transition-colors shadow-[0_0_20px_#22d3ee] flex items-center gap-2"
                    >
                        NIVEAU SUIVANT <ArrowRight size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};
