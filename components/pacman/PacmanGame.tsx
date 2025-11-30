
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Ghost } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { Direction, Position, Pacman, Ghost as GhostType, Grid, TileType, GhostMode } from './types';
import { LEVEL_MAP, PACMAN_START, COLS, ROWS, GHOST_HOUSE_EXIT, GHOST_HOUSE_CENTER } from './level';

interface PacmanGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

const GAME_SPEED_BASE = 0.11; // Vitesse réduite pour meilleur contrôle

// --- GHOST AI CONSTANTS ---
const SCATTER_TARGETS = [
    { x: COLS - 2, y: 1 }, // Blinky (red) -> top-right
    { x: 1, y: 1 },        // Pinky (pink) -> top-left
    { x: COLS - 2, y: ROWS - 2 }, // Inky (cyan) -> bottom-right
    { x: 1, y: ROWS - 2 }, // Clyde (orange) -> bottom-left
];
const GHOST_FRIGHTENED_TIME = 8000; // 8 seconds
const GHOST_EATEN_SPEED_MULTIPLIER = 2.5;

// Mode timings in frames (assuming 60fps)
const MODE_SWITCH_TIMES = [
    7 * 60,   // Scatter for 7s
    20 * 60,  // Chase for 20s
    7 * 60,   // Scatter for 7s
    20 * 60,  // Chase for 20s
    5 * 60,   // Scatter for 5s
    20 * 60,  // Chase for 20s
    5 * 60,   // Scatter for 5s
    Infinity  // Final chase
];
// Ghost release timers in frames
const GHOST_RELEASE_TIMES = [0, 4 * 60, 8 * 60, 12 * 60];

const INITIAL_GHOSTS: GhostType[] = [
    { id: 0, pos: { ...GHOST_HOUSE_EXIT }, dir: 'LEFT', color: 'red', mode: 'SCATTER', startPos: { x: 9, y: 10 }, speed: GAME_SPEED_BASE * 0.45 },
    { id: 1, pos: { x: 9, y: 10 }, dir: 'UP', color: 'pink', mode: 'AT_HOME', startPos: { x: 9, y: 10 }, speed: GAME_SPEED_BASE * 0.42 },
    { id: 2, pos: { x: 8, y: 10 }, dir: 'UP', color: 'cyan', mode: 'AT_HOME', startPos: { x: 8, y: 10 }, speed: GAME_SPEED_BASE * 0.40 },
    { id: 3, pos: { x: 10, y: 10 }, dir: 'UP', color: 'orange', mode: 'AT_HOME', startPos: { x: 10, y: 10 }, speed: GAME_SPEED_BASE * 0.38 }
];


export const PacmanGame: React.FC<PacmanGameProps> = ({ onBack, audio, addCoins }) => {
    // Game State
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Audio
    const { playPacmanWaka, playPacmanEatGhost, playPacmanPower, playGameOver, playVictory, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.pacman || 0;

    // Game Logic Refs
    const pacmanRef = useRef<Pacman>({ pos: { ...PACMAN_START }, dir: 'LEFT', nextDir: 'LEFT', speed: GAME_SPEED_BASE, isPowered: false });
    const ghostsRef = useRef<GhostType[]>(JSON.parse(JSON.stringify(INITIAL_GHOSTS)));
    const gridRef = useRef<Grid>(JSON.parse(JSON.stringify(LEVEL_MAP)));
    const dotsCountRef = useRef(0);
    const powerTimerRef = useRef<any>(null);
    const animationFrameRef = useRef<number>(0);
    const wakaTimerRef = useRef<any>(null);
    const gameTimerRef = useRef(0);
    const gameModeIndexRef = useRef(0);
    const gameModeRef = useRef<'CHASE' | 'SCATTER'>('SCATTER');
    
    // Swipe Control Refs
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    
    const [, setTick] = useState(0);

    useEffect(() => {
        resetGame();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    // Gestion du clavier pour Desktop / Test
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver || gameWon) return;
            const key = e.key;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                e.preventDefault();
                resumeAudio();
                if (!isPlaying) setIsPlaying(true);
                
                if (key === 'ArrowUp') pacmanRef.current.nextDir = 'UP';
                if (key === 'ArrowDown') pacmanRef.current.nextDir = 'DOWN';
                if (key === 'ArrowLeft') pacmanRef.current.nextDir = 'LEFT';
                if (key === 'ArrowRight') pacmanRef.current.nextDir = 'RIGHT';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameOver, gameWon, isPlaying, resumeAudio]);

    // --- SWIPE CONTROLS LOGIC ---
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        
        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartRef.current.x;
        const diffY = touch.clientY - touchStartRef.current.y;
        
        // Increased sensitivity: threshold lowered from 20 to 6
        const threshold = 6; 

        // Si le mouvement est significatif
        if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
            resumeAudio();
            if (!isPlaying && !gameOver && !gameWon) setIsPlaying(true);

            // Determine dominant direction
            if (Math.abs(diffX) > Math.abs(diffY)) {
                pacmanRef.current.nextDir = diffX > 0 ? 'RIGHT' : 'LEFT';
            } else {
                pacmanRef.current.nextDir = diffY > 0 ? 'DOWN' : 'UP';
            }

            // Reset start point to current to allow continuous steering
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };


    const resetGame = () => {
        gridRef.current = JSON.parse(JSON.stringify(LEVEL_MAP));
        let dots = 0;
        gridRef.current.forEach(row => row.forEach(cell => { if (cell === 2 || cell === 3) dots++; }));
        dotsCountRef.current = dots;

        resetActors(true);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameWon(false);
        setIsPlaying(false);
        setEarnedCoins(0);
    };

    const resetActors = (fullReset = false) => {
        pacmanRef.current = { pos: { ...PACMAN_START }, dir: 'LEFT', nextDir: 'LEFT', speed: GAME_SPEED_BASE, isPowered: false };
        ghostsRef.current = JSON.parse(JSON.stringify(INITIAL_GHOSTS));
        if (fullReset) {
            gameTimerRef.current = 0;
            gameModeIndexRef.current = 0;
            gameModeRef.current = 'SCATTER';
        }
    };

    const isWall = (x: number, y: number): boolean => {
        // Special Tunnel handling: Tunnel row is usually index 10
        if (y === 10 && (x < 0 || x >= COLS)) return false;

        // Out of bounds are walls (except tunnel)
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;

        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1 || cell === 4;
    };

    const isGhostWall = (x: number, y: number): boolean => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1;
    };

    const checkWin = () => {
        if (dotsCountRef.current <= 0) {
            setGameWon(true);
            setIsPlaying(false);
            playVictory();
            addCoins(50);
            setEarnedCoins(e => e + 50);
        }
    };

    const enablePowerMode = () => {
        pacmanRef.current.isPowered = true;
        playPacmanPower();
        ghostsRef.current.forEach(g => { if (g.mode !== 'EATEN') g.mode = 'FRIGHTENED'; });
        if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
        powerTimerRef.current = setTimeout(() => {
            pacmanRef.current.isPowered = false;
            ghostsRef.current.forEach(g => { if (g.mode === 'FRIGHTENED') g.mode = gameModeRef.current; });
        }, GHOST_FRIGHTENED_TIME);
    };

    const movePacman = useCallback(() => {
        const p = pacmanRef.current;
        const speed = p.speed;

        // 1. Gestion du demi-tour immédiat
        if (
            (p.dir === 'LEFT' && p.nextDir === 'RIGHT') ||
            (p.dir === 'RIGHT' && p.nextDir === 'LEFT') ||
            (p.dir === 'UP' && p.nextDir === 'DOWN') ||
            (p.dir === 'DOWN' && p.nextDir === 'UP')
        ) {
            p.dir = p.nextDir;
        }

        // 2. Calculs de position sur la grille
        const center = { x: Math.round(p.pos.x), y: Math.round(p.pos.y) };
        const distToCenter = Math.abs(p.pos.x - center.x) + Math.abs(p.pos.y - center.y);

        // 3. Logique de virage et d'alignement
        if (distToCenter <= speed + 0.02) {
            if (p.nextDir !== p.dir) {
                let canTurn = false;
                if (p.nextDir === 'UP' && !isWall(center.x, center.y - 1)) canTurn = true;
                if (p.nextDir === 'DOWN' && !isWall(center.x, center.y + 1)) canTurn = true;
                if (p.nextDir === 'LEFT' && !isWall(center.x - 1, center.y)) canTurn = true;
                if (p.nextDir === 'RIGHT' && !isWall(center.x + 1, center.y)) canTurn = true;

                if (canTurn) {
                    p.pos.x = center.x;
                    p.pos.y = center.y;
                    p.dir = p.nextDir;
                }
            }

            let blocked = false;
            if (p.dir === 'UP' && isWall(center.x, center.y - 1)) blocked = true;
            if (p.dir === 'DOWN' && isWall(center.x, center.y + 1)) blocked = true;
            if (p.dir === 'LEFT' && isWall(center.x - 1, center.y)) blocked = true;
            if (p.dir === 'RIGHT' && isWall(center.x + 1, center.y)) blocked = true;

            if (blocked) {
                p.pos.x = center.x;
                p.pos.y = center.y;
                return;
            }
        }

        if (p.dir === 'UP') p.pos.y -= speed;
        else if (p.dir === 'DOWN') p.pos.y += speed;
        else if (p.dir === 'LEFT') p.pos.x -= speed;
        else if (p.dir === 'RIGHT') p.pos.x += speed;

        // Wrapping
        if (p.pos.x < -0.5) p.pos.x = COLS - 0.5;
        if (p.pos.x > COLS - 0.5) p.pos.x = -0.5;

        // Manger les points
        const gridX = Math.round(p.pos.x);
        const gridY = Math.round(p.pos.y);
        
        const now = Date.now();
        if (!wakaTimerRef.current || now - wakaTimerRef.current > 250) {
             if (Math.abs(p.pos.x - center.x) > 0.01 || Math.abs(p.pos.y - center.y) > 0.01) {
                playPacmanWaka();
                wakaTimerRef.current = now;
             }
        }

        if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
            const tile = gridRef.current[gridY][gridX];
            if (tile === 2) {
                gridRef.current[gridY][gridX] = 0;
                setScore(s => s + 10);
                dotsCountRef.current--;
                checkWin();
            } else if (tile === 3) {
                gridRef.current[gridY][gridX] = 0;
                setScore(s => s + 50);
                dotsCountRef.current--;
                enablePowerMode();
                checkWin();
            }
        }
    }, [playPacmanWaka]);

    const moveGhosts = useCallback(() => {
        ghostsRef.current.forEach(g => {
            const speed = g.mode === 'FRIGHTENED' ? g.speed * 0.6 : g.mode === 'EATEN' ? g.speed * GHOST_EATEN_SPEED_MULTIPLIER : g.speed;
            const onGridCenter = Math.abs(g.pos.x - Math.round(g.pos.x)) < speed * 0.9 && Math.abs(g.pos.y - Math.round(g.pos.y)) < speed * 0.9;
            
            if (onGridCenter) {
                const xInt = Math.round(g.pos.x);
                const yInt = Math.round(g.pos.y);
                g.pos.x = xInt;
                g.pos.y = yInt;
                
                if (g.mode === 'AT_HOME') {
                    if (g.pos.y <= g.startPos.y - 0.5) g.dir = 'DOWN';
                    if (g.pos.y >= g.startPos.y + 0.5) g.dir = 'UP';
                    if (g.dir === 'UP') g.pos.y -= 0.05; else g.pos.y += 0.05;
                    return;
                }

                if (g.mode === 'EATEN' && xInt === GHOST_HOUSE_EXIT.x && yInt === GHOST_HOUSE_EXIT.y) {
                    g.mode = 'AT_HOME';
                    g.pos = { ...g.startPos };
                    return;
                }

                let target = pacmanRef.current.pos;
                if (g.mode === 'SCATTER') target = SCATTER_TARGETS[g.id];
                else if (g.mode === 'FRIGHTENED') target = { x: Math.random() * COLS, y: Math.random() * ROWS };
                else if (g.mode === 'EATEN') target = GHOST_HOUSE_EXIT;

                const options: { dir: Direction, dist: number }[] = [];
                if (!isGhostWall(xInt, yInt - 1) && g.dir !== 'DOWN') options.push({ dir: 'UP', dist: Math.hypot(xInt - target.x, (yInt - 1) - target.y) });
                if (!isGhostWall(xInt, yInt + 1) && g.dir !== 'UP') options.push({ dir: 'DOWN', dist: Math.hypot(xInt - target.x, (yInt + 1) - target.y) });
                if (!isGhostWall(xInt - 1, yInt) && g.dir !== 'RIGHT') options.push({ dir: 'LEFT', dist: Math.hypot((xInt - 1) - target.x, yInt - target.y) });
                if (!isGhostWall(xInt + 1, yInt) && g.dir !== 'LEFT') options.push({ dir: 'RIGHT', dist: Math.hypot((xInt + 1) - target.x, yInt - target.y) });
                
                if (options.length > 0) {
                    options.sort((a, b) => a.dist - b.dist);
                    g.dir = options[0].dir;
                } else {
                    if (g.dir === 'UP') g.dir = 'DOWN';
                    else if (g.dir === 'DOWN') g.dir = 'UP';
                    else if (g.dir === 'LEFT') g.dir = 'RIGHT';
                    else g.dir = 'LEFT';
                }
            }
            
            if (g.dir === 'UP') g.pos.y -= speed;
            if (g.dir === 'DOWN') g.pos.y += speed;
            if (g.dir === 'LEFT') g.pos.x -= speed;
            if (g.dir === 'RIGHT') g.pos.x += speed;

            if (g.pos.x < -0.5) g.pos.x = COLS - 0.5;
            if (g.pos.x > COLS - 0.5) g.pos.x = -0.5;
        });
    }, []);

    const handleDeath = () => {
        setIsPlaying(false);
        if (lives > 1) {
            setLives(l => l - 1);
            playGameOver();
            setTimeout(() => { resetActors(); setIsPlaying(true); }, 1500);
        } else {
            setLives(0);
            setGameOver(true);
            playGameOver();
            updateHighScore('pacman', score);
            const coins = Math.floor(score / 100);
            if (coins > 0) {
                addCoins(coins);
                setEarnedCoins(coins);
            }
        }
    };

    const checkCollisions = useCallback(() => {
        const p = pacmanRef.current;
        ghostsRef.current.forEach(g => {
            const dist = Math.hypot(p.pos.x - g.pos.x, p.pos.y - g.pos.y);
            if (dist < 0.8) {
                if (g.mode === 'FRIGHTENED') {
                    g.mode = 'EATEN';
                    setScore(s => s + 200);
                    playPacmanEatGhost();
                } else if (g.mode === 'CHASE' || g.mode === 'SCATTER') {
                    handleDeath();
                }
            }
        });
    }, [playPacmanEatGhost]);
    
    const updateGameTimers = useCallback(() => {
        gameTimerRef.current++;
        ghostsRef.current.forEach((g, i) => {
            if (g.mode === 'AT_HOME' && gameTimerRef.current > GHOST_RELEASE_TIMES[i]) {
                g.pos = { ...GHOST_HOUSE_EXIT };
                g.mode = gameModeRef.current;
            }
        });

        if (gameTimerRef.current > MODE_SWITCH_TIMES[gameModeIndexRef.current]) {
            gameTimerRef.current = 0;
            gameModeIndexRef.current++;
            gameModeRef.current = gameModeRef.current === 'SCATTER' ? 'CHASE' : 'SCATTER';
            ghostsRef.current.forEach(g => {
                if (g.mode === 'CHASE' || g.mode === 'SCATTER') {
                    g.mode = gameModeRef.current;
                    if (g.dir === 'UP') g.dir = 'DOWN';
                    else if (g.dir === 'DOWN') g.dir = 'UP';
                    else if (g.dir === 'LEFT') g.dir = 'RIGHT';
                    else if (g.dir === 'RIGHT') g.dir = 'LEFT';
                }
            });
        }
    }, []);

    useEffect(() => {
        const update = () => {
            if (isPlaying && !gameOver && !gameWon) {
                updateGameTimers();
                movePacman();
                moveGhosts();
                checkCollisions();
                setTick(t => t + 1);
            }
            animationFrameRef.current = requestAnimationFrame(update);
        };
        animationFrameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, gameOver, gameWon, movePacman, moveGhosts, checkCollisions, updateGameTimers]);

    const getStyle = (x: number, y: number) => ({
        left: `${(x / COLS) * 100}%`,
        top: `${(y / ROWS) * 100}%`,
        width: `${(1 / COLS) * 100}%`,
        height: `${(1 / ROWS) * 100}%`,
    });

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <style>{`
                @keyframes chomp-upper {
                    0% { transform: rotate(-30deg); }
                    50% { transform: rotate(0deg); }
                    100% { transform: rotate(-30deg); }
                }
                @keyframes chomp-lower {
                    0% { transform: rotate(30deg); }
                    50% { transform: rotate(0deg); }
                    100% { transform: rotate(30deg); }
                }
            `}</style>
            
            {/* Ambient Light Reflection (MIX-BLEND-HARD-LIGHT pour révéler les briques) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">NEON PAC</h1>
                <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>
            <div className="w-full max-w-lg flex justify-between items-center px-6 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span></div>
            </div>
            <div className="w-full max-w-lg flex gap-2 px-6 mb-4 z-10">
                 {Array.from({ length: 3 }).map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full bg-yellow-400 ${i < lives ? 'opacity-100' : 'opacity-20'}`} />))}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative z-10 min-h-0 pb-6">
                <div className="relative w-full h-auto aspect-[19/21] bg-black/80 border-2 border-blue-900/50 rounded-lg shadow-[0_0_20px_rgba(30,58,138,0.3)] overflow-hidden backdrop-blur-md">
                    {gridRef.current.map((row, r) => (row.map((cell, c) => {
                        if (cell === 0) return null;
                        const style = getStyle(c, r);
                        if (cell === 1) return (<div key={`${r}-${c}`} className="absolute bg-blue-900/30 border border-blue-500/30 rounded-sm" style={style} />);
                        if (cell === 2) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-[15%] h-[15%] bg-yellow-200/50 rounded-full" /></div>);
                        if (cell === 3) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-[40%] h-[40%] bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]" /></div>);
                        if (cell === 4) return (<div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}><div className="w-full h-[10%] bg-pink-500/50" /></div>);
                        return null;
                    })))}
                    {ghostsRef.current.map(g => {
                        const style = getStyle(g.pos.x, g.pos.y);
                        const isFrightened = g.mode === 'FRIGHTENED';
                        const isEaten = g.mode === 'EATEN';
                        const colorClass = isFrightened ? 'text-blue-300' : g.color === 'red' ? 'text-red-500' : g.color === 'pink' ? 'text-pink-400' : g.color === 'cyan' ? 'text-cyan-400' : 'text-orange-400';
                        return (<div key={g.id} className={`absolute flex items-center justify-center`} style={{...style, transform: 'scale(1.2)', transition: 'none'}}>
                            {isEaten ? (<div className="relative w-full h-full flex items-center justify-center"><div className="w-1/3 h-1/3 bg-white rounded-full absolute -translate-x-1/4" /><div className="w-1/3 h-1/3 bg-white rounded-full absolute translate-x-1/4" /></div>)
                            : (<Ghost size={24} className={`${colorClass} ${isFrightened ? 'animate-pulse' : ''} drop-shadow-[0_0_5px_currentColor]`} fill="currentColor" />)}
                        </div>);
                    })}
                    
                    {/* CLASSIC PACMAN RENDER */}
                    <div className="absolute flex items-center justify-center" 
                         style={{
                             ...getStyle(pacmanRef.current.pos.x, pacmanRef.current.pos.y), 
                             transform: `scale(1.3) rotate(${pacmanRef.current.dir === 'RIGHT' ? 0 : pacmanRef.current.dir === 'DOWN' ? 90 : pacmanRef.current.dir === 'LEFT' ? 180 : -90}deg)`, 
                             transition: 'none'
                         }}>
                        <div className="w-full h-full relative">
                            {/* Upper Half */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-yellow-400 rounded-t-full animate-[chomp-upper_0.2s_infinite_linear] origin-bottom shadow-[0_0_10px_#facc15]"></div>
                            {/* Lower Half */}
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-yellow-400 rounded-b-full animate-[chomp-lower_0.2s_infinite_linear] origin-top shadow-[0_0_10px_#facc15]"></div>
                        </div>
                    </div>

                    {!isPlaying && !gameOver && !gameWon && (<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm pointer-events-none"><p className="text-white font-bold animate-pulse tracking-widest">GLISSEZ POUR JOUER</p></div>)}
                    {gameOver && (<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in"><h2 className="text-4xl font-black text-red-500 italic mb-2">GAME OVER</h2>{earnedCoins > 0 && (<div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Trophy className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<button onClick={resetGame} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-500">REJOUER</button></div>)}
                    {gameWon && (<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in"><h2 className="text-4xl font-black text-green-400 italic mb-2">VICTOIRE !</h2>{earnedCoins > 0 && (<div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Trophy className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<button onClick={resetGame} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500">REJOUER</button></div>)}
                </div>
            </div>
        </div>
    );
};
