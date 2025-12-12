
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Undo2, Plus, ArrowRight, ChevronLeft, ChevronRight, Lock, Play, HelpCircle, MousePointer2, ArrowDown, Check } from 'lucide-react';
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
    
    // View State
    const [view, setView] = useState<'LEVEL_SELECT' | 'GAME'>('LEVEL_SELECT');
    const [showTutorial, setShowTutorial] = useState(false);

    // Initialize maxUnlockedLevel synchronously from localStorage to ensure navigation works immediately
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
        try {
            const stored = localStorage.getItem('neon-highscores');
            if (stored) {
                const parsed = JSON.parse(stored);
                const saved = parseInt(parsed.watersort, 10);
                return (!isNaN(saved) && saved > 0) ? saved : 1;
            }
        } catch (e) {
            console.warn("Error loading max level:", e);
        }
        return 1;
    });

    // Sync with hook updates
    useEffect(() => {
        if (highScores.watersort > maxUnlockedLevel) {
            setMaxUnlockedLevel(highScores.watersort);
        }
    }, [highScores.watersort, maxUnlockedLevel]);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_watersort_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_watersort_tutorial_seen', 'true');
        }
    }, []);

    // Current level being played
    const [currentLevel, setCurrentLevel] = useState<number>(maxUnlockedLevel);

    // State
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

    const generateLevel = (lvl: number) => {
        setHistory([]);
        setSelectedTube(null);
        setLevelComplete(false);
        setEarnedCoins(0);
        setExtraTubeUsed(false);
        setIsAnimating(false);
        setPourData(null);

        // Difficulty scaling
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

    const handleLevelSelect = (lvl: number) => {
        if (lvl > maxUnlockedLevel) return;
        setCurrentLevel(lvl);
        generateLevel(lvl);
        setView('GAME');
        resumeAudio();
        playLand();
    };

    const handleLocalBack = () => {
        if (view === 'GAME') {
            setView('LEVEL_SELECT');
        } else {
            onBack();
        }
    };

    const handleTubeClick = (index: number) => {
        if (isAnimating || levelComplete || showTutorial) return;
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
                
                // --- ANIMATION LOGIC ---
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
                    
                    const rad = (Math.abs(rotationAngle) * Math.PI) / 180;
                    const h = sRect.height;
                    const w = sRect.width;

                    const insetX = 12; 
                    const insetY = 20; 
                    
                    const ox = isRight ? (w/2 - insetX) : (-w/2 + insetX);
                    const oy = -h/2 + insetY;

                    const angleRad = isRight ? rad : -rad;
                    const cos = Math.cos(angleRad);
                    const sin = Math.sin(angleRad);

                    const rx = ox * cos - oy * sin;
                    const ry = ox * sin + oy * cos;

                    const desiredSpoutX = dstCenterX; 
                    const desiredSpoutY = dstTopY - 35; 

                    const targetCenterX = desiredSpoutX - rx;
                    const targetCenterY = desiredSpoutY - ry;

                    const deltaX = targetCenterX - srcCenterX;
                    const deltaY = targetCenterY - srcCenterY;

                    setPourData({ 
                        src: srcIdx, 
                        dst: dstIdx, 
                        color: colorToMove, 
                        streamStart: { x: desiredSpoutX, y: desiredSpoutY },
                        streamEnd: { x: dstCenterX, y: dstTopY + 45 },
                        isPouring: false,
                        tiltDirection,
                        transformStyle: {
                            transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotationAngle}deg)`,
                            zIndex: 100,
                            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                        }
                    });

                    setTimeout(() => {
                        setPourData(prev => prev ? { ...prev, isPouring: true } : null);
                        playMove(); 

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

                            setTimeout(() => {
                                setPourData(null); 
                                setTimeout(() => {
                                    setIsAnimating(false);
                                    playLand();
                                    if (isLevelSolved(newTubes)) {
                                        handleLevelComplete();
                                    }
                                }, 400); 
                            }, 100); 
                        }, 300); 
                    }, 500); 
                    
                    return;
                }
            }
        }

        playPaddleHit(); 
        setSelectedTube(null);
    };

    const handleLevelComplete = () => {
        setLevelComplete(true);
        playVictory();
        
        const coins = 20 + Math.floor(currentLevel / 2);
        addCoins(coins);
        setEarnedCoins(coins);
        
        if (currentLevel === maxUnlockedLevel) {
            const nextMax = maxUnlockedLevel + 1;
            setMaxUnlockedLevel(nextMax);
            updateHighScore('watersort', nextMax);
        }
        
        if (onReportProgress) onReportProgress('win', 1);
        if (onReportProgress) onReportProgress('action', 1);
    };

    const handleNextLevel = () => {
        const nextLevel = currentLevel + 1;
        setCurrentLevel(nextLevel);
        generateLevel(nextLevel);
    };

    const handleChangeLevel = (delta: number) => {
        if (isAnimating) return;
        const newLevel = currentLevel + delta;
        if (newLevel < 1 || newLevel > maxUnlockedLevel) return;
        
        setCurrentLevel(newLevel);
        generateLevel(newLevel);
        playPaddleHit();
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
        setTubes(prev => [...prev, []]); 
        setExtraTubeUsed(true);
        playVictory(); 
    };

    const handleRestart = () => {
        if (isAnimating) return;
        generateLevel(currentLevel);
    };

    // --- LEVEL SELECT VIEW ---
    if (view === 'LEVEL_SELECT') {
        const gridItems = Array.from({ length: Math.max(maxUnlockedLevel + 4, 20) });
        
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

                {/* Header */}
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">CHOIX NIVEAU</h1>
                    <div className="w-10"></div>
                </div>

                {/* Grid */}
                <div className="flex-1 w-full max-w-lg overflow-y-auto custom-scrollbar z-10 pb-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-2">
                        {gridItems.map((_, i) => {
                            const lvl = i + 1;
                            const isUnlocked = lvl <= maxUnlockedLevel;
                            const isNext = lvl === maxUnlockedLevel + 1;
                            
                            if (isUnlocked) {
                                return (
                                    <button 
                                        key={lvl} 
                                        onClick={() => handleLevelSelect(lvl)}
                                        className={`
                                            aspect-square rounded-xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95
                                            bg-cyan-900/40 border-cyan-500/50 text-cyan-400 hover:bg-cyan-800/60
                                        `}
                                    >
                                        {lvl}
                                        <div className="mt-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                    </button>
                                );
                            } else {
                                return (
                                    <div key={lvl} className={`aspect-square rounded-xl border-2 flex items-center justify-center text-gray-600 ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}>
                                        <Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
                
                <div className="mt-4 z-10 w-full max-w-lg">
                    <button onClick={() => handleLevelSelect(maxUnlockedLevel)} className="w-full py-4 bg-cyan-500 text-black font-black tracking-widest text-lg rounded-xl shadow-[0_0_20px_#22d3ee] flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Play size={24} fill="black"/> CONTINUER (NIV {maxUnlockedLevel})
                    </button>
                </div>
            </div>
        );
    }

    // --- GAME VIEW ---
    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            {/* Ambient FX */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* TUTORIAL OVERLAY */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-xs text-center">
                        <h2 className="text-2xl font-black text-white italic mb-6 flex items-center justify-center gap-2"><HelpCircle className="text-cyan-400"/> COMMENT JOUER ?</h2>
                        
                        <div className="space-y-3 text-left">
                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <MousePointer2 className="text-cyan-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">SÉLECTIONNER</p>
                                    <p className="text-xs text-gray-400">Touchez un tube pour prendre le liquide supérieur.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <ArrowDown className="text-yellow-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">VERSER</p>
                                    <p className="text-xs text-gray-400">Touchez un autre tube pour verser. La couleur doit correspondre ou le tube doit être vide.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <Check className="text-green-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">TRIER</p>
                                    <p className="text-xs text-gray-400">Remplissez chaque tube avec une seule couleur pour gagner.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowTutorial(false)}
                            className="mt-6 w-full py-3 bg-cyan-500 text-black font-black tracking-widest rounded-xl hover:bg-white transition-colors shadow-lg active:scale-95"
                        >
                            J'AI COMPRIS !
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON MIX</h1>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleChangeLevel(-1)} 
                            disabled={currentLevel <= 1 || isAnimating}
                            className="p-1 rounded-full text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-cyan-300 tracking-widest min-w-[70px] text-center">NIVEAU {currentLevel}</span>
                        <button 
                            onClick={() => handleChangeLevel(1)} 
                            disabled={currentLevel >= maxUnlockedLevel || isAnimating}
                            className="p-1 rounded-full text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={handleRestart} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
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
                    disabled={extraTubeUsed || levelComplete || isAnimating}
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
                    <p className="text-cyan-400 font-bold mb-6 tracking-widest">NIVEAU {currentLevel} TERMINÉ</p>
                    
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
