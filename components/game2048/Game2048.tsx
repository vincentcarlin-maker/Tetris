
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, Hash } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

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
    
    const tileIdCounter = useRef(0);
    const touchStartRef = useRef<{x: number, y: number} | null>(null);
    const movingRef = useRef(false);

    const { playMove, playCoin, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.game2048 || 0;

    const getEmptyCells = (currentTiles: Tile[]) => {
        const cells = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!currentTiles.find(t => t.x === x && t.y === y)) {
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

    const initGame = () => {
        setScore(0);
        setGameOver(false);
        setWon(false);
        setEarnedCoins(0);
        tileIdCounter.current = 0;
        let newTiles: Tile[] = [];
        newTiles = addRandomTile(newTiles);
        newTiles = addRandomTile(newTiles);
        setTiles(newTiles);
        if (onReportProgress) onReportProgress('play', 1);
    };

    useEffect(() => {
        initGame();
    }, []);

    const checkGameOver = (currentTiles: Tile[]) => {
        if (getEmptyCells(currentTiles).length > 0) return false;
        
        // Check merge possibilities
        for (let t of currentTiles) {
            const right = currentTiles.find(o => o.x === t.x + 1 && o.y === t.y);
            const down = currentTiles.find(o => o.x === t.x && o.y === t.y + 1);
            if (right && right.val === t.val) return false;
            if (down && down.val === t.val) return false;
        }
        return true;
    };

    const move = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (movingRef.current || gameOver) return;
        movingRef.current = true;
        resumeAudio();

        let moved = false;
        let mergedScore = 0;
        let newTiles: Tile[] = tiles.map(t => ({ ...t, isMerged: false, isNew: false, mergedVal: undefined })); // Reset flags

        // Sort tiles based on direction to process correctly
        if (direction === 'UP') newTiles.sort((a, b) => a.y - b.y);
        if (direction === 'DOWN') newTiles.sort((a, b) => b.y - a.y);
        if (direction === 'LEFT') newTiles.sort((a, b) => a.x - b.x);
        if (direction === 'RIGHT') newTiles.sort((a, b) => b.x - a.x);

        const vector = { x: 0, y: 0 };
        if (direction === 'UP') vector.y = -1;
        if (direction === 'DOWN') vector.y = 1;
        if (direction === 'LEFT') vector.x = -1;
        if (direction === 'RIGHT') vector.x = 1;

        const mergedIds = new Set<number>();

        for (let i = 0; i < newTiles.length; i++) {
            let tile = newTiles[i];
            let { x, y } = tile;
            let nextX = x + vector.x;
            let nextY = y + vector.y;

            while (nextX >= 0 && nextX < GRID_SIZE && nextY >= 0 && nextY < GRID_SIZE) {
                // Find obstacle, ignoring deleted ones
                const obstacle = newTiles.find(t => t.x === nextX && t.y === nextY && !t.isDeleted);
                
                if (obstacle) {
                    if (obstacle.val === tile.val && !mergedIds.has(obstacle.id) && !mergedIds.has(tile.id)) {
                        // Merge logic
                        tile.x = nextX;
                        tile.y = nextY;
                        
                        // DEFER UPDATE: Store future value but don't apply yet
                        tile.mergedVal = tile.val * 2;
                        mergedScore += tile.mergedVal;
                        
                        mergedIds.add(tile.id);
                        
                        // Mark obstacle for removal later (keep it visible for smooth overlap)
                        obstacle.isDeleted = true;
                        
                        // Note: We don't set isMerged=true here to delay the pop animation
                        moved = true;
                    }
                    break; // Hit something (merge or not), stop moving
                }
                
                x = nextX;
                y = nextY;
                tile.x = x;
                tile.y = y;
                moved = true;
                
                nextX += vector.x;
                nextY += vector.y;
            }
        }

        if (moved) {
            playMove();
            if (mergedScore > 0) {
                if (mergedScore >= 512) playCoin(); 
                setScore(s => s + mergedScore);
            }
            
            // Phase 1: Trigger Slide Animation (Old values slide)
            setTiles(newTiles);
            
            // Phase 2: Finalize State (Update values, remove deleted, spawn new)
            setTimeout(() => {
                // Apply deferred values and trigger pop animation
                const processedTiles = newTiles.map(t => {
                    if (t.mergedVal) {
                        return { 
                            ...t, 
                            val: t.mergedVal, 
                            isMerged: true, // Trigger pop now
                            mergedVal: undefined 
                        };
                    }
                    return t;
                });

                const cleanTiles = processedTiles.filter(t => !t.isDeleted);
                const afterSpawn = addRandomTile(cleanTiles);
                setTiles(afterSpawn);
                
                if (mergedScore > 0) {
                    if (afterSpawn.some(t => t.val === 2048) && !won) {
                        setWon(true);
                        playVictory();
                        addCoins(200);
                        setEarnedCoins(prev => prev + 200);
                        if (onReportProgress) onReportProgress('win', 1);
                    }
                }

                if (checkGameOver(afterSpawn)) {
                    setGameOver(true);
                    playGameOver();
                    updateHighScore('game2048', score + mergedScore); 
                    const coins = Math.floor((score + mergedScore) / 500) * 10;
                    if (coins > 0) {
                        addCoins(coins);
                        setEarnedCoins(prev => prev + coins);
                    }
                    if (onReportProgress) onReportProgress('score', score + mergedScore);
                }
                
                movingRef.current = false;
            }, 150); // Match this delay with CSS transition duration
        } else {
            movingRef.current = false;
        }
    };

    // Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver) return;
            switch(e.key) {
                case 'ArrowUp': e.preventDefault(); move('UP'); break;
                case 'ArrowDown': e.preventDefault(); move('DOWN'); break;
                case 'ArrowLeft': e.preventDefault(); move('LEFT'); break;
                case 'ArrowRight': e.preventDefault(); move('RIGHT'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tiles, gameOver]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
            if (Math.abs(dy) > 30) move(dy > 0 ? 'DOWN' : 'UP');
        }
        touchStartRef.current = null;
    };

    // Visuals
    const getTileClass = (val: number) => {
        // Updated to use opaque bg-gray-900 to prevent overlapping artifacts
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

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4"
             onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON 2048</h1>
                <button onClick={initGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
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
