
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, XCircle } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface SnakeGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Position>({ x: 5, y: 5 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    
    // Crash effects
    const [crashPos, setCrashPos] = useState<Position | null>(null);
    const [isShaking, setIsShaking] = useState(false);

    const gameLoopRef = useRef<any>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    const { playCoin, playGameOver, playVictory, playWallHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.snake || 0;

    const generateFood = useCallback((currentSnake: Position[]) => {
        let newFood: Position;
        let isColliding;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            isColliding = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        } while (isColliding);
        return newFood;
    }, []);

    const resetGame = () => {
        stopLoop();
        setSnake([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]);
        setFood(generateFood([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]));
        setDirection('RIGHT');
        setNextDirection('RIGHT');
        setScore(0);
        setGameOver(false);
        setIsPlaying(false);
        setIsPaused(false);
        setEarnedCoins(0);
        setSpeed(INITIAL_SPEED);
        setCrashPos(null);
        setIsShaking(false);
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    useEffect(() => {
        resetGame();
        return () => stopLoop();
    }, []);

    const stopLoop = () => {
        if (gameLoopRef.current) {
            clearTimeout(gameLoopRef.current);
            gameLoopRef.current = null;
        }
    };

    const togglePause = () => {
        if (gameOver) return;
        
        if (isPlaying) {
            setIsPlaying(false);
            setIsPaused(true);
            stopLoop();
        } else if (isPaused) {
            setIsPlaying(true);
            setIsPaused(false);
            resumeAudio();
        }
    };

    const handleGameOver = () => {
        setGameOver(true);
        setIsPlaying(false);
        playGameOver();
        stopLoop();
        updateHighScore('snake', score);
        if (onReportProgress) onReportProgress('score', score);
        const coins = Math.floor(score / 10);
        if (coins > 0) {
            addCoins(coins);
            setEarnedCoins(coins);
        }
    };

    const moveSnake = useCallback(() => {
        if (gameOver || !isPlaying || isPaused) return;

        setSnake(prevSnake => {
            const head = prevSnake[0];
            const newHead = { ...head };

            let effectiveDir = nextDirection;
            const isOpposite = (nextDirection === 'UP' && direction === 'DOWN') ||
                               (nextDirection === 'DOWN' && direction === 'UP') ||
                               (nextDirection === 'LEFT' && direction === 'RIGHT') ||
                               (nextDirection === 'RIGHT' && direction === 'LEFT');
            
            if (isOpposite) effectiveDir = direction;
            else setDirection(nextDirection);

            if (effectiveDir === 'UP') newHead.y -= 1;
            if (effectiveDir === 'DOWN') newHead.y += 1;
            if (effectiveDir === 'LEFT') newHead.x -= 1;
            if (effectiveDir === 'RIGHT') newHead.x += 1;

            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                setCrashPos(head);
                setIsShaking(true);
                playWallHit();
                handleGameOver();
                return prevSnake;
            }

            if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                setCrashPos(newHead);
                setIsShaking(true);
                playWallHit();
                handleGameOver();
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            if (newHead.x === food.x && newHead.y === food.y) {
                setScore(s => s + 10);
                playCoin();
                setFood(generateFood(newSnake));
                setSpeed(s => Math.max(MIN_SPEED, s * 0.98));
                if (onReportProgress) onReportProgress('action', 1); // Action = ate food
            } else {
                newSnake.pop();
            }

            return newSnake;
        });

        gameLoopRef.current = setTimeout(moveSnake, speed);

    }, [gameOver, isPlaying, isPaused, nextDirection, direction, food, speed, playCoin, playGameOver, playWallHit, generateFood, onReportProgress]);

    useEffect(() => {
        if (isPlaying && !gameOver && !isPaused) {
            if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
            gameLoopRef.current = setTimeout(moveSnake, speed);
        } else {
            stopLoop();
        }
        return () => stopLoop();
    }, [isPlaying, gameOver, isPaused, moveSnake]);

    const handleDirectionChange = useCallback((newDir: Direction) => {
        if (gameOver || isPaused) return;
        if (!isPlaying) { setIsPlaying(true); resumeAudio(); }
        setNextDirection(prevNext => {
            const isOpposite = (newDir === 'UP' && prevNext === 'DOWN') || (newDir === 'DOWN' && prevNext === 'UP') || (newDir === 'LEFT' && prevNext === 'RIGHT') || (newDir === 'RIGHT' && prevNext === 'LEFT');
            const isOppositeCurrent = (newDir === 'UP' && direction === 'DOWN') || (newDir === 'DOWN' && direction === 'UP') || (newDir === 'LEFT' && direction === 'RIGHT') || (newDir === 'RIGHT' && direction === 'LEFT');
            if (isOpposite || isOppositeCurrent) return prevNext;
            return newDir;
        });
    }, [gameOver, isPaused, isPlaying, resumeAudio, direction]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            if (key === 'ArrowUp') handleDirectionChange('UP');
            if (key === 'ArrowDown') handleDirectionChange('DOWN');
            if (key === 'ArrowLeft') handleDirectionChange('LEFT');
            if (key === 'ArrowRight') handleDirectionChange('RIGHT');
        }
        if (key === 'p' || key === 'P') togglePause();
    }, [handleDirectionChange, togglePause]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current || isPaused) return;
        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartRef.current.x;
        const diffY = touch.clientY - touchStartRef.current.y;
        const threshold = 10; 
        if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
            if (Math.abs(diffX) > Math.abs(diffY)) { handleDirectionChange(diffX > 0 ? 'RIGHT' : 'LEFT'); } else { handleDirectionChange(diffY > 0 ? 'DOWN' : 'UP'); }
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
    };
    const handleTouchEnd = () => { touchStartRef.current = null; };
    const startGame = () => { setIsPlaying(true); setIsPaused(false); resumeAudio(); };
    const DPadBtn = ({ dir, icon: Icon }: { dir: Direction, icon: any }) => (
        <button onMouseDown={(e) => { e.preventDefault(); handleDirectionChange(dir); }} onTouchStart={(e) => { e.preventDefault(); handleDirectionChange(dir); }} className="w-14 h-14 bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 shadow-lg active:bg-green-500 active:text-black active:scale-95 transition-all text-green-400 group"><Icon size={28} className="drop-shadow-[0_0_5px_currentColor] group-active:drop-shadow-none" /></button>
    );

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/10 via-black to-transparent pointer-events-none"></div>
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] pr-2 pb-1">NEON SNAKE</h1>
                <div className="flex gap-2"><button onClick={togglePause} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">{isPaused ? <Play size={20} /> : <Pause size={20} />}</button><button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button></div>
            </div>
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-4 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-2xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span></div>
            </div>
            <div className={`relative w-full max-w-md aspect-square bg-black/80 border-2 border-green-500/30 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] overflow-hidden backdrop-blur-md z-10 ${isShaking ? 'animate-shake-board' : ''}`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`, backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%` }}></div>
                {snake.map((segment, i) => {
                    const isHead = i === 0;
                    return (<div key={i} className={`absolute transition-all duration-75 ${isHead ? 'z-20' : 'z-10'}`} style={{ left: `${(segment.x / GRID_SIZE) * 100}%`, top: `${(segment.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}><div className={`w-full h-full ${isHead ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-green-600/80'} rounded-sm border border-black/20 transform scale-95`}>{isHead && (<><div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full opacity-50"></div><div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full opacity-50"></div></>)}</div></div>);
                })}
                <div className="absolute z-20 animate-pulse" style={{ left: `${(food.x / GRID_SIZE) * 100}%`, top: `${(food.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}><div className="w-full h-full bg-red-500 rounded-full shadow-[0_0_15px_#ef4444] transform scale-75 border-2 border-white/20"></div></div>
                {crashPos && (<div className="absolute z-30 animate-ping" style={{ left: `${(crashPos.x / GRID_SIZE) * 100}%`, top: `${(crashPos.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}><div className="w-full h-full flex items-center justify-center"><XCircle className="text-red-500 drop-shadow-[0_0_10px_red]" size={24} strokeWidth={3} /></div></div>)}
                {!isPlaying && !gameOver && !isPaused && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30"><p className="text-green-400 font-bold tracking-widest animate-pulse mb-4">APPUYEZ POUR JOUER</p><button onClick={startGame} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_#22c55e] hover:scale-110 transition-transform"><Play size={32} className="text-black ml-1" /></button></div>)}
                {isPaused && !gameOver && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 animate-in fade-in"><h2 className="text-4xl font-black text-white mb-6 tracking-widest">PAUSE</h2><div className="flex flex-col gap-3"><button onClick={togglePause} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"><Play size={20} /> REPRENDRE</button><button onClick={onBack} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"><Home size={20} /> QUITTER</button></div></div>)}
                {gameOver && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-40 animate-in zoom-in fade-in"><h2 className="text-5xl font-black text-red-500 italic mb-2 drop-shadow-[0_0_10px_red]">PERDU !</h2><div className="text-center mb-6"><p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p><p className="text-4xl font-mono text-white">{score}</p></div>{earnedCoins > 0 && (<div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<button onClick={resetGame} className="px-8 py-3 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button></div>)}
            </div>
            <div className="w-full max-w-xs mt-6 grid grid-cols-3 gap-3 z-20"><div></div><div className="flex justify-center"><DPadBtn dir="UP" icon={ArrowUp}/></div><div></div><div className="flex justify-center"><DPadBtn dir="LEFT" icon={ArrowLeft}/></div><div className="flex justify-center"><div className="w-14 h-14 bg-gray-800/50 rounded-full flex items-center justify-center border border-white/5"><div className="w-4 h-4 bg-white/20 rounded-full"></div></div></div><div className="flex justify-center"><DPadBtn dir="RIGHT" icon={ArrowRight}/></div><div></div><div className="flex justify-center"><DPadBtn dir="DOWN" icon={ArrowDown}/></div><div></div></div>
        </div>
    );
};
