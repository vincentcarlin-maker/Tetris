
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Undo2, Plus, ArrowRight } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface WaterSortGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// 0: Empty
// 1-12: Colors
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
    9: 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]',
    10: 'bg-indigo-500 shadow-[0_0_10px_#6366f1]',
    11: 'bg-lime-400 shadow-[0_0_10px_#a3e635]',
    12: 'bg-white shadow-[0_0_10px_#ffffff]',
};

// Hex codes for SVG rendering
const NEON_HEX: Record<number, string> = {
    1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 4: '#facc15',
    5: '#a855f7', 6: '#22d3ee', 7: '#f97316', 8: '#ec4899',
    9: '#2dd4bf', 10: '#6366f1', 11: '#a3e635', 12: '#ffffff',
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
    
    // Direct read for init to avoid hook delay causing reset to level 1
    const getSavedLevel = () => {
        try {
            const stored = localStorage.getItem('neon-highscores');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.watersort || 1;
            }
        } catch {}
        return 1;
    };

    // State
    const [level, setLevel] = useState(getSavedLevel);
    const [tubes, setTubes] = useState<Tube[]>([]);
    const [selectedTube, setSelectedTube] = useState<number | null>(null);
    const [history, setHistory] = useState<Tube[][]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [levelComplete, setLevelComplete] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [extraTubeUsed, setExtraTubeUsed] = useState(false);

    // Animation State
    const [pourData, setPourData] = useState<{
        src: number, 
        dst: number, 
        color: number, 
        streamStart: {x: number, y: number}, 
        streamEnd: {x: number, y: number},
        isPouring: boolean,
        tiltDirection: 'left' | 'right',
        transformStyle: React.CSSProperties
    } | null>(null);
    
    const tubeRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

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
        setPourData(null);

        // Difficulty scaling (More progressive)
        let colorCount = Math.min(3 + Math.floor((lvl - 1) / 2), 12); 
        let emptyTubes = 2;

        // 1. Create a pool of all liquid segments needed
        let segments: number[] = [];
        for (let c = 1; c <= colorCount; c++) {
            for (let i = 0; i < TUBE_CAPACITY; i++) {
                segments.push(c);
            }
        }

        // 2. Fisher-Yates Shuffle
        for (let i = segments.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [segments[i], segments[j]] = [segments[j], segments[i]];
        }

        // 3. Fill the tubes
        const newTubes: Tube[] = [];
        let segmentIdx = 0;
        
        for (let i = 0; i < colorCount; i++) {
            const tube: number[] = [];
            for (let j = 0; j < TUBE_CAPACITY; j++) {
                if (segmentIdx < segments.length) {
                    tube.push(segments[segmentIdx++]);
                }
            }
            newTubes.push(tube);
        }
        
        for (let i = 0; i < emptyTubes; i++) {
            newTubes.push([]);
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
        if (dstTube.length < TUBE_CAPACITY) {
            if (dstTube.length === 0 || dstTube[dstTube.length - 1] === colorToMove) {
                
                // --- REALISTIC ANIMATION LOGIC (V6 - Deep Inset) ---
                const srcEl = tubeRefs.current[srcIdx];
                const dstEl = tubeRefs.current[dstIdx];
                const containerEl = containerRef.current;

                if (srcEl && dstEl && containerEl) {
                    const cRect = containerEl.getBoundingClientRect();
                    const sRect = srcEl.getBoundingClientRect();
                    const dRect = dstEl.getBoundingClientRect();
                    
                    setIsAnimating(true);
                    setSelectedTube(null);

                    // Center coordinates relative to container
                    const srcCenterX = sRect.left - cRect.left + sRect.width / 2;
                    const srcCenterY = sRect.top - cRect.top + sRect.height / 2;
                    
                    const dstCenterX = dRect.left - cRect.left + dRect.width / 2;
                    const dstTopY = dRect.top - cRect.top;

                    // Determine direction
                    const isRight = dstCenterX > srcCenterX;
                    const tiltDirection = isRight ? 'right' : 'left';
                    const rotationAngle = isRight ? 50 : -50;
                    
                    // --- CALCUL DU POINT DE VERSEMENT EXACT (V6) ---
                    const rad = (Math.abs(rotationAngle) * Math.PI) / 180;
                    const h = sRect.height;
                    const w = sRect.width;

                    const insetX = 12; 
                    const insetY = 20; 
                    
                    const ox = isRight ? (w/2 - insetX) : (-w/2 + insetX);
                    const oy = -h/2 + insetY;

                    // Rotation de ce point "bec"
                    const angleRad = isRight ? rad : -rad;
                    const cos = Math.cos(angleRad);
                    const sin = Math.sin(angleRad);

                    // Coordonnées du bec par rapport au centre du tube une fois tourné
                    const rx = ox * cos - oy * sin;
                    const ry = ox * sin + oy * cos;

                    // Position cible du bec verseur
                    const desiredSpoutX = dstCenterX; 
                    const desiredSpoutY = dstTopY - 35; 

                    // On calcule où doit se trouver le CENTRE du tube source pour que son bec soit à la bonne place
                    const targetCenterX = desiredSpoutX - rx;
                    const targetCenterY = desiredSpoutY - ry;

                    // Translation CSS nécessaire
                    const deltaX = targetCenterX - srcCenterX;
                    const deltaY = targetCenterY - srcCenterY;

                    // Le flux commence EXACTEMENT à la position du bec calculée (cachée derrière le tube)
                    const streamStartX = desiredSpoutX;
                    const streamStartY = desiredSpoutY; 

                    // Le flux finit dans le tube cible
                    const streamEndX = dstCenterX;
                    const streamEndY = dstTopY + 45; 

                    // Step 1: Initialize Move
                    setPourData({ 
                        src: srcIdx, 
                        dst: dstIdx, 
                        color: colorToMove, 
                        streamStart: { x: streamStartX, y: streamStartY },
                        streamEnd: { x: streamEndX, y: streamEndY },
                        isPouring: false,
                        tiltDirection,
                        transformStyle: {
                            transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotationAngle}deg)`,
                            zIndex: 100, // IMPORTANT: Tube au-dessus du flux (z-50)
                            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                        }
                    });

                    // Step 2: Wait for Move, then Start Stream
                    setTimeout(() => {
                        setPourData(prev => prev ? { ...prev, isPouring: true } : null);
                        playMove(); // Pouring sound

                        // Step 3: Wait for Pour, then Logic Update + Stop Stream
                        setTimeout(() => {
                            setHistory(prev => [...prev, tubes]);
                            while (
                                srcTube.length > 0 && 
                                srcTube[srcTube.length - 1] === colorToMove && 
                                dstTube.length < TUBE_CAPACITY
                            ) {
                                dstTube.push(srcTube.pop()!);
                            }
                            setTubes(newTubes);
                            
                            setPourData(prev => prev ? { ...prev, isPouring: false } : null);

                            // Step 4: Wait for Stream Fade, then Return Tube
                            setTimeout(() => {
                                setPourData(null); // Removes transform, CSS transition handles return
                                
                                // Step 5: Finish Animation
                                setTimeout(() => {
                                    setIsAnimating(false);
                                    playLand();
                                    if (isLevelSolved(newTubes)) {
                                        handleLevelComplete();
                                    }
                                }, 400); // Return transition time
                            }, 100); // Stream fade buffer
                        }, 300); // Reduced pouring duration (was 600) for snappier feel without visual stream
                    }, 500); // Move duration
                    
                    return;
                }
            }
        }

        // Invalid move
        playPaddleHit(); 
        setSelectedTube(null);
    };

    const handleLevelComplete = () => {
        setLevelComplete(true);
        playVictory();
        
        const coins = 20 + Math.floor(level / 2);
        addCoins(coins);
        setEarnedCoins(coins);
        
        // Use functional state to ensure we have the latest level
        // We read the current level from state directly here
        const nextLevel = level + 1;
        updateHighScore('watersort', nextLevel);
        
        if (onReportProgress) onReportProgress('win', 1);
        if (onReportProgress) onReportProgress('action', 1);
    };

    const handleNextLevel = () => {
        setLevel(l => l + 1);
        generateLevel(level + 1);
    };

    const handleUndo = () => {
        if (history.length === 0 || levelComplete || isAnimating) return;
        const previousState = history[history.length - 1];
        setTubes(previousState);
        setHistory(prev => prev.slice(0, -1));
        setSelectedTube(null);
        playPaddleHit();
    };

    const handleAddTube = () => {
        if (extraTubeUsed || levelComplete || isAnimating) return;
        setTubes(prev => [...prev, []]); // Add empty tube
        setExtraTubeUsed(true);
        playVictory(); 
    };

    const handleRestart = () => {
        if (isAnimating) return;
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
            <div ref={containerRef} className="flex-1 w-full max-w-lg flex items-center justify-center relative z-10 min-h-0 overflow-visible">
                
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-16 sm:gap-x-12 sm:gap-y-20 w-full px-2 pt-12">
                    {tubes.map((tube, i) => {
                        const isSelected = selectedTube === i;
                        const isPourSource = pourData?.src === i;
                        
                        // Default Style
                        let style: React.CSSProperties = {
                            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy select
                            transformOrigin: 'center'
                        };

                        // Animation Override
                        if (isPourSource && pourData) {
                            style = pourData.transformStyle;
                        } else if (isSelected) {
                            style = {
                                transform: 'translate(0, -25px)',
                                zIndex: 20
                            };
                        }

                        return (
                            <div 
                                key={i}
                                ref={el => { tubeRefs.current[i] = el; }}
                                onClick={() => handleTubeClick(i)}
                                style={style}
                                className={`
                                    relative w-12 sm:w-14 h-44 sm:h-52 border-2 rounded-b-full rounded-t-lg cursor-pointer
                                    ${isSelected ? 'border-yellow-400 shadow-[0_0_20px_#facc15]' : 'border-white/30 hover:border-white/60'}
                                    bg-white/5 backdrop-blur-sm flex flex-col-reverse overflow-hidden
                                `}
                            >
                                {/* Tube Highlights */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-30 rounded-b-full"></div>
                                <div className="absolute top-1 left-1.5 w-1 h-[90%] bg-white/20 blur-[1px] z-30 rounded-full opacity-50 pointer-events-none"></div>
                                
                                {/* Rim Highlight */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 z-30"></div>

                                {/* Liquid Segments */}
                                <div className="w-full h-full rounded-b-full flex flex-col-reverse relative z-10 transition-all">
                                    {tube.map((color, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-full h-[23%] ${NEON_COLORS[color]} transition-all duration-300 relative mb-[1px]`}
                                        >
                                            {/* Surface Meniscus */}
                                            <div className="absolute top-0 left-0 w-full h-[6px] bg-white/30 rounded-[50%] -translate-y-1/2 scale-x-90 blur-[1px]"></div>
                                            {/* Bubbles */}
                                            {idx === tube.length - 1 && Math.random() > 0.5 && (
                                                <div className="absolute top-2 left-1/2 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-lg flex justify-center gap-6 mt-4 z-10 pb-4 shrink-0">
                <button 
                    onClick={handleUndo} 
                    disabled={history.length === 0 || isAnimating}
                    className="flex flex-col items-center gap-1 text-gray-400 disabled:opacity-30 hover:text-white transition-colors group"
                >
                    <div className="p-4 bg-gray-800 rounded-full border border-white/10 group-hover:border-white/50 shadow-lg active:scale-95 transition-all">
                        <Undo2 size={24} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest">ANNULER</span>
                </button>

                <button 
                    onClick={handleAddTube} 
                    disabled={extraTubeUsed || isAnimating}
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
