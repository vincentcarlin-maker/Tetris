
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Undo2, Plus, ArrowRight, ChevronLeft, ChevronRight, Lock, Play, HelpCircle, MousePointer2, ArrowDown, Check } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

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
        if