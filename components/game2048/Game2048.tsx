
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface Game2048Props {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

type Tile = {
    id: number;
    val: number;
    x: number;
    y: number;
    isNew?: boolean;
    isMerged?: boolean;
    isDeleted?: boolean;
    mergedVal?: number; // Stores future value during animation
};

const GRID_SIZE = 4;

export const Game2048: React.FC<Game2048Props> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Refs for logic stability (avoids closure staleness in event listeners)
    const tilesRef = useRef<Tile[]>([]);
    const movingRef = useRef(false);
    const tileIdCounter = useRef(0);
    const touchStartRef = useRef<{x: number, y: number} | null>(null);

    const { playMove, playCoin, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.game2048 || 0;

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_2048_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_2048_tutorial_seen', 'true');
        }
    }, []);

    // Sync ref with state
    useEffect(() => {
        tilesRef.current = tiles;
    }, [tiles]);

    const getEmptyCells = (currentTiles: Tile[]) => {
        const cells = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!currentTiles.find(t => t.x === x && t.y === y && !t.isDeleted)) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    };

    const addRandomTile = (currentTiles: Tile[]) => {
        const empty = getEmptyCells(currentTiles);
        if (empty.length === 0) return currentTiles;
        const { x, y } = empty[Math.floor(Math.random() * empty.length)];
        const newVal = Math.random() < 0.9 ? 2 : 4;
        const newTile: Tile = {
            id: tileIdCounter.current++,
            val: newVal,
            x,
            y,
            isNew: true
        };
        return [...currentTiles, newTile];
    };

    const initGame = useCallback(() => {
        if (showTutorial) return;
        setScore(0);
        setGameOver(false);
        setWon(false);
        setEarnedCoins(0);
        tileIdCounter.current = 0;
        let newTiles: Tile[] = [];
        newTiles = addRandomTile(newTiles);
        newTiles = addRandomTile(newTiles);
        setTiles(newTiles);
        movingRef.current = false;
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress, showTutorial]);

    // Initial load
    useEffect(() => {
        initGame();
    }, []); // Only on mount

    const checkGameOver = (currentTiles: Tile[]) => {
        const activeTiles = currentTiles.filter(t => !t.isDeleted);
        if (getEmptyCells(activeTiles).length > 0) return false;
        
        for (let t of activeTiles) {
            // Check right
            const right = activeTiles.find(o => o.x === t.x + 1 && o.y === t.y);
            if (right && right.val === t.val) return false;
            // Check down
            const down = activeTiles.find(o => o.x === t.x && o.y === t.y + 1);
            if (down && down.val === t.val) return false;
        }
        return true;
    };

    const move = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (movingRef.current || gameOver || showTutorial) return;
        
        const currentTiles = tilesRef.current;
        const mergedIds = new Set<number>();
        
        // Prepare working copy
        let nextTiles = currentTiles.map(t => ({ ...t, isMerged: false, isNew: false }));
        let hasChanged = false;
        let totalMergedScore = 0;

        // Helper to find tile in the working set
        const getTileAt = (x: number, y: number) => nextTiles.find(t => t.x === x && t.y === y && !t.isDeleted);

        // Sorting functions to process tiles in the correct order
        const sortOrder = (a: Tile, b: Tile) => {
            if (dir === 'LEFT') return a.x - b.x;
            if (dir === 'RIGHT') return b.x - a.x;
            if (dir === 'UP') return a.y - b.y;
            if (dir === 'DOWN') return b.y - a.y;
            return 0;
        };

        // We process line by line
        const lines = [0, 1, 2, 3];
        
        lines.forEach(lineIndex => {
            // Get tiles for this row/col
            let lineTiles = nextTiles.filter(t => 
                !t.isDeleted && (dir === 'LEFT' || dir === 'RIGHT' ? t.y === lineIndex : t.x === lineIndex)
            ).sort(sortOrder);

            // Target position pointer
            let target = (dir === 'LEFT' || dir === 'UP') ? 0 : 3;
            const inc = (dir === 'LEFT' || dir === 'UP') ? 1 : -1;

            for (let i = 0; i < lineTiles.length; i++) {
                const tile = lineTiles[i];
                let placed = false;

                // Check merge with previous tile in target direction
                if ((dir === 'LEFT' || dir === 'UP') ? target > 0 : target < 3) {
                    const checkX = (dir === 'LEFT' || dir === 'RIGHT') ? target - inc : lineIndex;
                    const checkY = (dir === 'LEFT' || dir === 'RIGHT') ? lineIndex : target - inc;
                    
                    const prevTile = getTileAt(checkX, checkY);
                    
                    if (prevTile && prevTile.val === tile.val && !mergedIds.has(prevTile.id)) {
                        // MERGE
                        prevTile.mergedVal = prevTile.val * 2;
                        prevTile.isMerged = true;
                        mergedIds.add(prevTile.id);
                        
                        // Slide current into prev
                        tile.x = prevTile.x;
                        tile.y = prevTile.y;
                        tile.isDeleted = true;
                        
                        totalMergedScore += prevTile.mergedVal;
                        hasChanged = true;
                        placed = true;
                    }
                }

                if (!placed) {
                    const targetX = (dir === 'LEFT' || dir === 'RIGHT') ? target : lineIndex;
                    const targetY = (dir === 'LEFT' || dir === 'RIGHT') ? lineIndex : target;

                    if (tile.x !== targetX || tile.y !== targetY) {
                        tile.x = targetX;
                        tile.y = targetY;
                        hasChanged = true;
                    }
                    target += inc;
                }
            }
        });

        if (hasChanged) {
            movingRef.current = true;
            resumeAudio();
            playMove();
            
            // Phase 1: Animate slide
            setTiles(nextTiles);
            
            if (totalMergedScore > 0) {
                setScore(s => s + totalMergedScore);
                if (totalMergedScore >= 128) playCoin(); 
            }

            // Phase 2: Finalize (after transition)
            setTimeout(() => {
                const finalTiles = nextTiles.map(t => {
                    if (t.mergedVal) {
                        return { ...t, val: t.mergedVal, isMerged: true, mergedVal: undefined };
                    }
                    return t;
                }).filter(t => !t.isDeleted);
                
                const withNew = addRandomTile(finalTiles);
                setTiles(withNew);
                
                // Win Check
                if (totalMergedScore > 0 && withNew.some(t => t.val === 2048) && !won) {
                    setWon(true);
                    playVictory();
                    addCoins(200);
                    setEarnedCoins(prev => prev + 200);
                    if (onReportProgress) onReportProgress('win', 1);
                }

                // Loss Check
                if (checkGameOver(withNew)) {
                    setGameOver(true);
                    playGameOver();
                    const finalScore = score + totalMergedScore; // Approximate
                    updateHighScore('game2048', finalScore); 
                    const coins = Math.floor(finalScore / 500) * 10;
                    if (coins > 0) {
                        addCoins(coins);
                        setEarnedCoins(prev => prev + coins);
                    }
                    if (onReportProgress) onReportProgress('score', finalScore);
                }
                
                movingRef.current = false;
            }, 100); // 100ms matches CSS transition duration
        }
    }, [gameOver, won, score, audio, addCoins, updateHighScore, onReportProgress, showTutorial]);

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver || movingRef.current || showTutorial) return;
            switch(e.key) {
                case 'ArrowUp': e.preventDefault(); move('UP'); break;
                case 'ArrowDown': e.preventDefault(); move('DOWN'); break;
                case 'ArrowLeft': e.preventDefault(); move('LEFT'); break;
                case 'ArrowRight': e.preventDefault(); move('RIGHT'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move, gameOver, showTutorial]);

    // Touch Controls
    const handleTouchStart = (e: React.TouchEvent) => {
        if (gameOver || movingRef.current || showTutorial) return;
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || movingRef.current || showTutorial) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            if (Math.abs(dy) > 30) move(dy > 0 ? 'DOWN' : 'UP');
        }
        touchStartRef.current = null;
    };

    const getTileClass = (val: number) => {
        const base = "flex items-center justify-center font-black rounded-lg border-2 shadow-[0_0_10px_currentColor] transition-all duration-100 absolute w-20 h-20 sm:w-24 sm:h-24 bg-gray-900";
        switch (val) {
            case 2: return `${base} border-cyan-500 text-cyan-500`;
            case 4: return `${base} border-blue-500 text-blue-500`;
            case 8: return `${base} border-purple-500 text-purple-500`;
            case 16: return `${base} border-pink-500 text-pink-500`;
            case 32: return `${base} border-red-500 text-red-500`;
            case 64: return `${base} border-orange-500 text-orange-500`;
            case 128: return `${base} border-yellow-500 text-yellow-500`;
            case 256: return `${base} border-green-500 text-green-500`;
            case 512: return `${base} border-teal-400 text-teal-400`;
            case 1024: return `${base} border-indigo-400 text-indigo-400`;
            case 2048: return `${base} border-white text-white shadow-[0_0_20px_white] animate-pulse`;
            default: return `${base} border-white text-white`;
        }
    };

    const toggleTutorial = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTutorial(prev => !prev);
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4"
             onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="game2048" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON 2048</h1>
                <div className="flex gap-2">
                    <button onClick={toggleTutorial} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={initGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-md flex justify-between items-center px-4 mb-6 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">BEST</span><span className="text-2xl font-mono font-bold text-yellow-400">{Math.max(score, bestScore)}</span></div>
            </div>

            {/* Game Board */}
            <div className="relative p-2 bg-gray-900/80 border-4 border-gray-700 rounded-xl shadow-2xl backdrop-blur-md z-10">
                <div className="grid grid-cols-4 gap-2 sm:gap-3 w-fit h-fit bg-black/40 rounded-lg p-2 relative">
                    {/* Background Grid */}
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800/50 rounded-lg border border-white/5"></div>
                    ))}
                    
                    {/* Tiles */}
                    {tiles.map(tile => (
                        <div 
                            key={tile.id}
                            className={`${getTileClass(tile.val)} ${tile.isNew ? 'animate-pop' : ''} ${tile.isMerged ? 'z-20 animate-pop' : (tile.mergedVal ? 'z-20' : (tile.isDeleted ? 'z-0' : 'z-10'))}`}
                            style={{ 
                                transform: `translate(${tile.x * (window.innerWidth < 640 ? 88 : 108)}px, ${tile.y * (window.innerWidth < 640 ? 88 : 108)}px)`,
                                fontSize: tile.val > 1000 ? '24px' : tile.val > 100 ? '32px' : '40px'
                            }}
                        >
                            {tile.val}
                        </div>
                    ))}
                </div>

                {gameOver && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-lg animate-in fade-in">
                        <h2 className="text-4xl font-black text-white italic mb-4">GAME OVER</h2>
                        {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                        <button onClick={initGame} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
                    </div>
                )}
                
                {won && !gameOver && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 rounded-lg animate-in fade-in">
                        <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_20px_gold]" />
                        <h2 className="text-4xl font-black text-white italic mb-2">2048 !</h2>
                        <p className="text-cyan-400 font-bold mb-6">TU AS GAGNÉ !</p>
                        <button onClick={() => setWon(false)} className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-black transition-colors">CONTINUER</button>
                    </div>
                )}
            </div>
            
            <p className="text-gray-500 text-xs mt-8 animate-pulse font-bold tracking-widest">GLISSEZ OU UTILISEZ LES FLÈCHES</p>
        </div>
    );
};
