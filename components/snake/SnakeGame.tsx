
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, XCircle, HelpCircle, Zap, Shield, Clock, Hexagon, Apple, Banana, Cherry, Tornado, Bomb, Move } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface SnakeGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameMode = 'CLASSIC' | 'NEON';
type FoodType = 'NORMAL' | 'STRAWBERRY' | 'BANANA' | 'CHERRY';

interface FoodItem {
    x: number;
    y: number;
    type: FoodType;
}

interface Teleporter {
    id: number;
    x: number;
    y: number;
    targetId: number;
    color: string;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

const GRID_SIZE = 20;
const INITIAL_SPEED_CLASSIC = 150;
const INITIAL_SPEED_NEON = 180; // Ralenti pour un démarrage plus facile (était 130)
const MIN_SPEED = 50;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    // --- STATE ---
    const [view, setView] = useState<'MENU' | 'GAME'>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
    
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<FoodItem>({ x: 5, y: 5, type: 'NORMAL' });
    
    // Level Objects
    const [obstacles, setObstacles] = useState<Position[]>([]);
    const [teleporters, setTeleporters] = useState<Teleporter[]>([]);
    const [bombs, setBombs] = useState<Position[]>([]);
    
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED_CLASSIC);
    const [showTutorial, setShowTutorial] = useState(false);
    const [mapMessage, setMapMessage] = useState<string | null>(null);
    
    // Neon Mode Effects
    const [activeEffect, setActiveEffect] = useState<'NONE' | 'SLOW' | 'INVINCIBLE'>('NONE');
    const [effectTimer, setEffectTimer] = useState(0);

    // Visuals
    const [crashPos, setCrashPos] = useState<Position | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const particlesRef = useRef<Particle[]>([]);

    const gameLoopRef = useRef<any>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // For particles overlay

    const { playCoin, playGameOver, playVictory, playWallHit, playPowerUpCollect, playExplosion, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.snake || 0;

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_snake_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_snake_tutorial_seen', 'true');
        }
    }, []);

    // --- LOGIC ---

    const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x: x * 100/GRID_SIZE + (50/GRID_SIZE), // Center of cell in %
                y: y * 100/GRID_SIZE + (50/GRID_SIZE),
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                life: 1.0,
                color,
                size: Math.random() * 2 + 2
            });
        }
    };

    const isPositionSafe = (x: number, y: number, currentSnake: Position[], currentObstacles: Position[], currentTeleporters: Teleporter[], currentBombs: Position[]) => {
        // Safe from Snake
        if (currentSnake.some(s => s.x === x && s.y === y)) return false;
        // Safe from Snake Head Vicinity (Spawn protection)
        if (Math.abs(x - currentSnake[0].x) < 3 && Math.abs(y - currentSnake[0].y) < 3) return false;
        // Safe from Obstacles
        if (currentObstacles.some(o => o.x === x && o.y === y)) return false;
        // Safe from Teleporters
        if (currentTeleporters.some(t => t.x === x && t.y === y)) return false;
        // Safe from Bombs
        if (currentBombs.some(b => b.x === x && b.y === y)) return false;
        
        return true;
    };

    const getRandomPos = () => ({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });

    const generateLevel = useCallback((currentScore: number, snakeBody: Position[]) => {
        const newObstacles: Position[] = [];
        const newTeleporters: Teleporter[] = [];
        const newBombs: Position[] = [];

        // 1. Obstacles (Base + Scaling)
        const obsCount = 6 + Math.floor(currentScore / 40);
        let safetyBreak = 0;
        while (newObstacles.length < obsCount && safetyBreak < 100) {
            const pos = getRandomPos();
            if (isPositionSafe(pos.x, pos.y, snakeBody, newObstacles, [], [])) {
                newObstacles.push(pos);
            }
            safetyBreak++;
        }

        // 2. Teleporters (1 Pair)
        // Add if score > 10 or randomly
        if (currentScore >= 0) { // Always on in Neon for fun
            let t1, t2;
            safetyBreak = 0;
            while (!t1 && safetyBreak < 50) {
                const p = getRandomPos();
                if (isPositionSafe(p.x, p.y, snakeBody, newObstacles, newTeleporters, [])) t1 = { id: 1, ...p, targetId: 2, color: '#00f3ff' };
                safetyBreak++;
            }
            safetyBreak = 0;
            while (!t2 && safetyBreak < 50) {
                const p = getRandomPos();
                if (isPositionSafe(p.x, p.y, snakeBody, newObstacles, newTeleporters, []) && (Math.abs(p.x - t1!.x) > 5 || Math.abs(p.y - t1!.y) > 5)) {
                    t2 = { id: 2, ...p, targetId: 1, color: '#ff00ff' };
                }
                safetyBreak++;
            }
            if (t1 && t2) newTeleporters.push(t1, t2);
        }

        // 3. Bombs (Scaling)
        const bombCount = 2 + Math.floor(currentScore / 50);
        safetyBreak = 0;
        while (newBombs.length < bombCount && safetyBreak < 100) {
            const pos = getRandomPos();
            if (isPositionSafe(pos.x, pos.y, snakeBody, newObstacles, newTeleporters, newBombs)) {
                newBombs.push(pos);
            }
            safetyBreak++;
        }

        setObstacles(newObstacles);
        setTeleporters(newTeleporters);
        setBombs(newBombs);
        
        // Indicate map change
        if (currentScore > 0) {
            setMapMessage("CHANGEMENT CARTE !");
            setTimeout(() => setMapMessage(null), 2000);
            playPowerUpCollect('MULTI_BALL'); // Sound effect for map change
        }

    }, [playPowerUpCollect]);

    const generateFood = useCallback((currentSnake: Position[], currentObstacles: Position[], currentTeleporters: Teleporter[], currentBombs: Position[]): FoodItem => {
        let newFood: Position;
        let isColliding;
        do {
            newFood = getRandomPos();
            isColliding = !isPositionSafe(newFood.x, newFood.y, currentSnake, currentObstacles, currentTeleporters, currentBombs);
        } while (isColliding);

        let type: FoodType = 'NORMAL';
        if (gameMode === 'NEON') {
            const rand = Math.random();
            if (rand > 0.90) type = 'CHERRY'; // Invincible (Rare)
            else if (rand > 0.80) type = 'BANANA'; // Slow
            else if (rand > 0.65) type = 'STRAWBERRY'; // Bonus points
        }

        return { ...newFood, type };
    }, [gameMode]);

    const initGame = (mode: GameMode) => {
        setGameMode(mode);
        const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        setSnake(initialSnake);
        
        if (mode === 'NEON') {
            generateLevel(0, initialSnake);
        } else {
            setObstacles([]);
            setTeleporters([]);
            setBombs([]);
        }
        
        // Delay food gen slightly to ensure obstacles state is set? 
        // Better: pass empty arrays for Classic or pre-calc for Neon.
        // We'll trust the state updates or just generate a simple safe food first.
        setFood({ x: 15, y: 10, type: 'NORMAL' }); 

        setDirection('RIGHT');
        setNextDirection('RIGHT');
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setIsPaused(false);
        setEarnedCoins(0);
        setSpeed(mode === 'NEON' ? INITIAL_SPEED_NEON : INITIAL_SPEED_CLASSIC);
        setCrashPos(null);
        setIsShaking(false);
        setActiveEffect('NONE');
        setEffectTimer(0);
        setMapMessage(null);
        particlesRef.current = [];
        setView('GAME');
        resumeAudio();
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    // Dynamic Map Update
    useEffect(() => {
        if (gameMode === 'NEON' && isPlaying && score > 0 && score % 50 === 0) {
            // Trigger map regeneration
            generateLevel(score, snake);
        }
    }, [score, gameMode, isPlaying, generateLevel]); // snake dependency might trigger often, but logic gates it to score%50

    const stopLoop = () => {
        if (gameLoopRef.current) {
            clearTimeout(gameLoopRef.current);
            gameLoopRef.current = null;
        }
    };

    const togglePause = () => {
        if (gameOver || showTutorial) return;
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
        if (gameOver || !isPlaying || isPaused || showTutorial) return;

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

            // --- TELEPORTER CHECK (Pre-Collision) ---
            const portal = teleporters.find(t => t.x === newHead.x && t.y === newHead.y);
            if (portal) {
                const target = teleporters.find(t => t.id === portal.targetId);
                if (target) {
                    newHead.x = target.x;
                    newHead.y = target.y;
                    spawnParticles(portal.x, portal.y, portal.color, 5);
                    spawnParticles(target.x, target.y, target.color, 5);
                    playPowerUpCollect('BALL_FAST'); // Teleport sound
                }
            }

            // --- COLLISION CHECKS ---
            let collided = false;
            let exploded = false;
            
            // 1. Walls
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                if (activeEffect === 'INVINCIBLE') {
                    // Wrap around
                    if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
                    if (newHead.x >= GRID_SIZE) newHead.x = 0;
                    if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
                    if (newHead.y >= GRID_SIZE) newHead.y = 0;
                } else {
                    collided = true;
                }
            }

            // 2. Self Collision
            if (!collided && prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                if (activeEffect !== 'INVINCIBLE') collided = true;
            }

            // 3. Obstacles (Neon Mode)
            if (!collided && gameMode === 'NEON' && obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
                if (activeEffect !== 'INVINCIBLE') collided = true;
            }

            // 4. Bombs (Neon Mode)
            const hitBombIndex = bombs.findIndex(b => b.x === newHead.x && b.y === newHead.y);
            if (!collided && hitBombIndex !== -1) {
                if (activeEffect === 'INVINCIBLE') {
                    // Destroy Bomb
                    const bomb = bombs[hitBombIndex];
                    spawnParticles(bomb.x, bomb.y, '#ef4444', 20);
                    playExplosion();
                    setBombs(prev => prev.filter((_, i) => i !== hitBombIndex));
                    setScore(s => s + 50); // Bonus for destroying bomb
                } else {
                    collided = true;
                    exploded = true;
                }
            }

            if (collided) {
                setCrashPos(head);
                setIsShaking(true);
                if (exploded) playExplosion(); else playWallHit();
                handleGameOver();
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Eat Food
            if (newHead.x === food.x && newHead.y === food.y) {
                const type = food.type;
                let points = 10;
                
                // Effect Logic
                if (type === 'STRAWBERRY') {
                    points = 15;
                    spawnParticles(food.x, food.y, '#f43f5e'); // Pink
                    playCoin();
                } else if (type === 'BANANA') {
                    points = 10;
                    setActiveEffect('SLOW');
                    setEffectTimer(Date.now() + 3000);
                    spawnParticles(food.x, food.y, '#facc15'); // Yellow
                    playPowerUpCollect('BALL_SLOW');
                } else if (type === 'CHERRY') {
                    points = 20;
                    setActiveEffect('INVINCIBLE');
                    setEffectTimer(Date.now() + 5000);
                    spawnParticles(food.x, food.y, '#ef4444'); // Red
                    playPowerUpCollect('EXTRA_LIFE');
                } else {
                    spawnParticles(food.x, food.y, '#4ade80'); // Green
                    playCoin();
                }

                setScore(s => s + points);
                // Regenerate food ensuring it doesn't spawn on new hazards
                setFood(generateFood(newSnake, obstacles, teleporters, bombs));
                
                // Speed Logic
                if (gameMode === 'NEON' && activeEffect !== 'SLOW') {
                    setSpeed(s => Math.max(MIN_SPEED, s * 0.98));
                } else if (gameMode === 'CLASSIC') {
                    setSpeed(s => Math.max(MIN_SPEED, s * 0.99));
                }
                
                if (onReportProgress) onReportProgress('action', 1);
            } else {
                newSnake.pop();
            }

            return newSnake;
        });

        // Loop Speed Management
        let currentLoopSpeed = speed;
        if (activeEffect === 'SLOW') currentLoopSpeed = speed * 1.5;
        
        gameLoopRef.current = setTimeout(moveSnake, currentLoopSpeed);

    }, [gameOver, isPlaying, isPaused, showTutorial, nextDirection, direction, food, speed, activeEffect, obstacles, teleporters, bombs, gameMode, playCoin, playGameOver, playWallHit, playPowerUpCollect, playExplosion, generateFood, onReportProgress]);

    // Effects Timer & Particles Loop
    useEffect(() => {
        let frameId: number;
        const renderLoop = () => {
            if (activeEffect !== 'NONE') {
                if (Date.now() > effectTimer) setActiveEffect('NONE');
            }

            // Render Particles
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                        const p = particlesRef.current[i];
                        p.x += p.vx;
                        p.y += p.vy;
                        p.life -= 0.05;
                        
                        if (p.life <= 0) {
                            particlesRef.current.splice(i, 1);
                        } else {
                            ctx.fillStyle = p.color;
                            ctx.globalAlpha = p.life;
                            ctx.beginPath();
                            ctx.arc(p.x * canvas.width / 100, p.y * canvas.height / 100, p.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    ctx.globalAlpha = 1;
                }
            }
            frameId = requestAnimationFrame(renderLoop);
        };
        frameId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(frameId);
    }, [activeEffect, effectTimer]);

    useEffect(() => {
        if (isPlaying && !gameOver && !isPaused && !showTutorial) {
            if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
            gameLoopRef.current = setTimeout(moveSnake, speed);
        } else {
            stopLoop();
        }
        return () => stopLoop();
    }, [isPlaying, gameOver, isPaused, showTutorial, moveSnake]);

    const handleDirectionChange = useCallback((newDir: Direction) => {
        if (gameOver || isPaused || showTutorial) return;
        if (!isPlaying) { setIsPlaying(true); resumeAudio(); }
        setNextDirection(prevNext => {
            const isOpposite = (newDir === 'UP' && prevNext === 'DOWN') || (newDir === 'DOWN' && prevNext === 'UP') || (newDir === 'LEFT' && prevNext === 'RIGHT') || (newDir === 'RIGHT' && prevNext === 'LEFT');
            const isOppositeCurrent = (newDir === 'UP' && direction === 'DOWN') || (newDir === 'DOWN' && direction === 'UP') || (newDir === 'LEFT' && direction === 'RIGHT') || (newDir === 'RIGHT' && direction === 'LEFT');
            if (isOpposite || isOppositeCurrent) return prevNext;
            return newDir;
        });
    }, [gameOver, isPaused, isPlaying, showTutorial, resumeAudio, direction]);

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
        if (!touchStartRef.current || isPaused || showTutorial) return;
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
    
    const DPadBtn = ({ dir, icon: Icon }: { dir: Direction, icon: any }) => (
        <button onMouseDown={(e) => { e.preventDefault(); handleDirectionChange(dir); }} onTouchStart={(e) => { e.preventDefault(); handleDirectionChange(dir); }} className="w-14 h-14 bg-gray-800/80 rounded-xl flex items-center justify-center border border-white/10 shadow-lg active:bg-green-500 active:text-black active:scale-95 transition-all text-green-400 group"><Icon size={28} className="drop-shadow-[0_0_5px_currentColor] group-active:drop-shadow-none" /></button>
    );

    // --- MENU VIEW ---
    if (view === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#4ade80]">NEON SNAKE</h1>
                <div className="flex flex-col gap-4 w-full max-w-[280px] mt-8">
                    <button onClick={() => initGame('CLASSIC')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">
                        <Play size={24} className="text-green-500 group-hover:text-white"/> CLASSIQUE
                    </button>
                    <button onClick={() => initGame('NEON')} className="px-6 py-4 bg-gray-800 border-2 border-purple-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-purple-500/10 animate-pulse"></div>
                        <Zap size={24} className="text-purple-500 group-hover:text-white z-10"/> <span className="z-10">REVISITÉ (NÉON)</span>
                    </button>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-gray-400 max-w-xs">
                    <div className="flex items-center gap-2"><Apple size={14} className="text-green-400"/> Classique</div>
                    <div className="flex items-center gap-2"><Hexagon size={14} className="text-purple-400"/> Obstacles</div>
                    <div className="flex items-center gap-2"><Banana size={14} className="text-yellow-400"/> Ralenti</div>
                    <div className="flex items-center gap-2"><Cherry size={14} className="text-red-400"/> Invincible</div>
                    <div className="flex items-center gap-2"><Tornado size={14} className="text-cyan-400"/> Portail</div>
                    <div className="flex items-center gap-2"><Bomb size={14} className="text-red-500"/> Bombe</div>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light transition-colors duration-500 ${gameMode === 'NEON' ? 'bg-purple-500/30' : 'bg-green-500/30'}`} />
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(${gameMode === 'NEON' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 197, 94, 0.3)'} 1px, transparent 1px), linear-gradient(90deg, ${gameMode === 'NEON' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 197, 94, 0.3)'} 1px, transparent 1px)`, backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%` }}></div>
            
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="snake" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={() => setView('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] pr-2 pb-1">
                        {gameMode === 'NEON' ? 'NEON SNAKE' : 'SNAKE CLASSIQUE'}
                    </h1>
                    {activeEffect !== 'NONE' && (
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 animate-pulse ${activeEffect === 'SLOW' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-400' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
                            {activeEffect === 'SLOW' ? <Clock size={10}/> : <Shield size={10}/>} {activeEffect === 'SLOW' ? 'RALENTI' : 'INVINCIBLE'}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-green-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={togglePause} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">{isPaused ? <Play size={20} /> : <Pause size={20} />}</button>
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-4 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-2xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span></div>
            </div>

            {/* Map Update Notification */}
            {mapMessage && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in zoom-in fade-out duration-1000">
                    <div className="bg-purple-600/90 text-white px-6 py-3 rounded-xl border-2 border-white/50 shadow-[0_0_30px_#a855f7] font-black italic text-xl whitespace-nowrap flex items-center gap-2">
                        <Move size={24} className="animate-spin"/> {mapMessage}
                    </div>
                </div>
            )}

            {/* GAME BOARD */}
            <div className={`relative w-full max-w-md aspect-square bg-black/80 border-2 ${gameMode === 'NEON' ? 'border-purple-500/30' : 'border-green-500/30'} rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-md z-10 ${isShaking ? 'animate-shake-board' : ''}`}>
                
                {/* Particles Canvas */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" width={400} height={400} />

                {/* Snake */}
                {snake.map((segment, i) => {
                    const isHead = i === 0;
                    const isGlowing = gameMode === 'NEON' || isHead;
                    let colorClass = gameMode === 'NEON' ? 'bg-cyan-400' : 'bg-green-600';
                    if (isHead) colorClass = gameMode === 'NEON' ? 'bg-white' : 'bg-green-400';
                    if (activeEffect === 'INVINCIBLE') colorClass = 'bg-red-500 animate-pulse';

                    return (
                        <div key={i} className={`absolute transition-all duration-75 ${isHead ? 'z-20' : 'z-10'}`} style={{ left: `${(segment.x / GRID_SIZE) * 100}%`, top: `${(segment.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                            <div className={`w-full h-full ${colorClass} rounded-sm ${isGlowing ? 'shadow-[0_0_10px_currentColor]' : ''} border border-black/20 transform scale-95`}>
                                {isHead && (<><div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full opacity-50"></div><div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full opacity-50"></div></>)}
                            </div>
                        </div>
                    );
                })}

                {/* Food */}
                <div className="absolute z-20" style={{ left: `${(food.x / GRID_SIZE) * 100}%`, top: `${(food.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                    <div className={`w-full h-full flex items-center justify-center transform scale-90 ${gameMode === 'NEON' ? 'animate-bounce' : ''}`}>
                        {food.type === 'NORMAL' && <div className="w-full h-full bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] border-2 border-white/20"></div>}
                        {food.type === 'STRAWBERRY' && <div className="text-lg drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]">🍓</div>}
                        {food.type === 'BANANA' && <div className="text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">🍌</div>}
                        {food.type === 'CHERRY' && <div className="text-lg drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">🍒</div>}
                    </div>
                </div>

                {/* Obstacles */}
                {obstacles.map((obs, i) => (
                    <div key={`obs-${i}`} className="absolute z-10" style={{ left: `${(obs.x / GRID_SIZE) * 100}%`, top: `${(obs.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                        <div className="w-full h-full bg-gray-800 border border-purple-500/50 rounded flex items-center justify-center shadow-[inset_0_0_10px_rgba(168,85,247,0.2)]">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                ))}

                {/* Teleporters */}
                {teleporters.map((tp) => (
                    <div key={`tp-${tp.id}`} className="absolute z-10" style={{ left: `${(tp.x / GRID_SIZE) * 100}%`, top: `${(tp.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                        <div className="w-full h-full flex items-center justify-center animate-[spin_3s_linear_infinite]">
                            <Tornado size={20} color={tp.color} className="drop-shadow-[0_0_5px_currentColor]"/>
                        </div>
                    </div>
                ))}

                {/* Bombs */}
                {bombs.map((bomb, i) => (
                    <div key={`bomb-${i}`} className="absolute z-10" style={{ left: `${(bomb.x / GRID_SIZE) * 100}%`, top: `${(bomb.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}>
                        <div className="w-full h-full flex items-center justify-center animate-pulse">
                            <Bomb size={18} className="text-red-500 drop-shadow-[0_0_8px_red]" />
                        </div>
                    </div>
                ))}

                {/* Crash Marker */}
                {crashPos && (<div className="absolute z-30 animate-ping" style={{ left: `${(crashPos.x / GRID_SIZE) * 100}%`, top: `${(crashPos.y / GRID_SIZE) * 100}%`, width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}><div className="w-full h-full flex items-center justify-center"><XCircle className="text-red-500 drop-shadow-[0_0_10px_red]" size={24} strokeWidth={3} /></div></div>)}
                
                {/* Start Overlay */}
                {!isPlaying && !gameOver && !isPaused && !showTutorial && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30"><p className="text-green-400 font-bold tracking-widest animate-pulse mb-4">APPUYEZ POUR JOUER</p><button onClick={() => {setIsPlaying(true); resumeAudio();}} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_#22c55e] hover:scale-110 transition-transform"><Play size={32} className="text-black ml-1" /></button></div>)}
                
                {/* Pause Overlay */}
                {isPaused && !gameOver && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 animate-in fade-in"><h2 className="text-4xl font-black text-white mb-6 tracking-widest">PAUSE</h2><div className="flex flex-col gap-3"><button onClick={togglePause} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"><Play size={20} /> REPRENDRE</button><button onClick={() => setView('MENU')} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"><Home size={20} /> QUITTER</button></div></div>)}
                
                {/* Game Over Overlay */}
                {gameOver && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-40 animate-in zoom-in fade-in"><h2 className="text-5xl font-black text-red-500 italic mb-2 drop-shadow-[0_0_10px_red]">PERDU !</h2><div className="text-center mb-6"><p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p><p className="text-4xl font-mono text-white">{score}</p></div>{earnedCoins > 0 && (<div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<button onClick={() => initGame(gameMode)} className="px-8 py-3 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button></div>)}
            </div>

            {/* Controls */}
            <div className="w-full max-w-xs mt-6 grid grid-cols-3 gap-3 z-20"><div></div><div className="flex justify-center"><DPadBtn dir="UP" icon={ArrowUp}/></div><div></div><div className="flex justify-center"><DPadBtn dir="LEFT" icon={ArrowLeft}/></div><div className="flex justify-center"><div className="w-14 h-14 bg-gray-800/50 rounded-full flex items-center justify-center border border-white/5"><div className="w-4 h-4 bg-white/20 rounded-full"></div></div></div><div className="flex justify-center"><DPadBtn dir="RIGHT" icon={ArrowRight}/></div><div></div><div className="flex justify-center"><DPadBtn dir="DOWN" icon={ArrowDown}/></div><div></div></div>
        </div>
    );
};
