import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RefreshCw, Trophy, Ghost } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { Direction, Position, Pacman, Ghost as GhostType, Grid, TileType, GhostMode } from './types';
import { LEVEL_MAP, PACMAN_START, COLS, ROWS } from './level';

interface PacmanGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

const GAME_SPEED_BASE = 0.15; // Vitesse de déplacement

const INITIAL_GHOSTS: GhostType[] = [
    // Fantômes positionnés hors de la maison pour garantir qu'ils puissent bouger
    { id: 0, pos: { x: 9, y: 8 }, dir: 'LEFT', color: 'red', mode: 'CHASE', startPos: { x: 9, y: 8 }, speed: GAME_SPEED_BASE * 0.7 },
    { id: 1, pos: { x: 8, y: 8 }, dir: 'UP', color: 'pink', mode: 'CHASE', startPos: { x: 8, y: 8 }, speed: GAME_SPEED_BASE * 0.65 },
    { id: 2, pos: { x: 10, y: 8 }, dir: 'UP', color: 'cyan', mode: 'CHASE', startPos: { x: 10, y: 8 }, speed: GAME_SPEED_BASE * 0.6 },
    { id: 3, pos: { x: 9, y: 7 }, dir: 'UP', color: 'orange', mode: 'CHASE', startPos: { x: 9, y: 7 }, speed: GAME_SPEED_BASE * 0.55 }
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

    // Game Logic Refs (Mutable state for game loop)
    const pacmanRef = useRef<Pacman>({
        pos: { ...PACMAN_START },
        dir: 'LEFT',
        nextDir: 'LEFT',
        speed: GAME_SPEED_BASE,
        isPowered: false
    });

    const ghostsRef = useRef<GhostType[]>(JSON.parse(JSON.stringify(INITIAL_GHOSTS)));

    const gridRef = useRef<Grid>(JSON.parse(JSON.stringify(LEVEL_MAP)));
    const dotsCountRef = useRef(0);
    const powerTimerRef = useRef<any>(null);
    const animationFrameRef = useRef<number>(0);
    const wakaTimerRef = useRef<any>(null);
    
    // Joystick state
    const [joystick, setJoystick] = useState({ x: 0, y: 0 });
    const joystickActive = useRef(false);
    const joystickBaseRef = useRef<HTMLDivElement>(null);


    // Force re-render for UI updates
    const [, setTick] = useState(0);

    // Initial Setup
    useEffect(() => {
        resetGame();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const resetGame = () => {
        gridRef.current = JSON.parse(JSON.stringify(LEVEL_MAP));
        
        // Count dots
        let dots = 0;
        gridRef.current.forEach(row => row.forEach(cell => {
            if (cell === 2 || cell === 3) dots++;
        }));
        dotsCountRef.current = dots;

        resetActors();
        setScore(0);
        setLives(3);
        setGameOver(false);
        setGameWon(false);
        setIsPlaying(false);
        setEarnedCoins(0);
    };

    const resetActors = () => {
        pacmanRef.current = {
            pos: { ...PACMAN_START },
            dir: 'LEFT',
            nextDir: 'LEFT',
            speed: GAME_SPEED_BASE,
            isPowered: false
        };
        ghostsRef.current = JSON.parse(JSON.stringify(INITIAL_GHOSTS));
    };

    const handleJoystickMove = (e: React.PointerEvent) => {
        if (!joystickActive.current || !joystickBaseRef.current) return;

        const rect = joystickBaseRef.current.getBoundingClientRect();
        const baseX = rect.left + rect.width / 2;
        const baseY = rect.top + rect.height / 2;

        let dx = e.clientX - baseX;
        let dy = e.clientY - baseY;
        const maxDist = rect.width / 4; // Max distance for the handle from center

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        setJoystick({ x: dx, y: dy });

        // Determine direction
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle > -45 && angle <= 45) {
            pacmanRef.current.nextDir = 'RIGHT';
        } else if (angle > 45 && angle <= 135) {
            pacmanRef.current.nextDir = 'DOWN';
        } else if (angle > 135 || angle <= -135) {
            pacmanRef.current.nextDir = 'LEFT';
        } else if (angle > -135 && angle <= -45) {
            pacmanRef.current.nextDir = 'UP';
        }
    };

    const handleJoystickDown = (e: React.PointerEvent) => {
        resumeAudio();
        if (!isPlaying && !gameOver && !gameWon) setIsPlaying(true);
        joystickActive.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleJoystickMove(e);
    };

    const handleJoystickUp = (e: React.PointerEvent) => {
        joystickActive.current = false;
        setJoystick({ x: 0, y: 0 });
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };


    // --- HELPERS ---

    const isWall = (x: number, y: number): boolean => {
        // Tunnel logic: Outside grid bounds is NOT a wall (it's the tunnel)
        if (x < 0 || x >= COLS) return false;
        if (y < 0 || y >= ROWS) return false;
        
        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1 || cell === 4; // 1=Wall, 4=Gate
    };

    const isGhostWall = (x: number, y: number): boolean => {
        // Tunnel logic: Outside grid bounds is NOT a wall (it's the tunnel)
        if (x < 0 || x >= COLS) return false;
        if (y < 0 || y >= ROWS) return false;
        
        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1; // Ghosts can pass gates (4), but not walls (1)
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
        ghostsRef.current.forEach(g => {
            if (g.mode !== 'EATEN') g.mode = 'FRIGHTENED';
        });

        if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
        powerTimerRef.current = setTimeout(() => {
            pacmanRef.current.isPowered = false;
            ghostsRef.current.forEach(g => {
                if (g.mode === 'FRIGHTENED') g.mode = 'CHASE';
            });
        }, 8000);
    };

    const movePacman = useCallback(() => {
        const p = pacmanRef.current;
        const speed = p.speed;

        // 1. Turning Logic: At intersections, check if we can switch to the queued direction.
        const onGridCenter = Math.abs(p.pos.x - Math.round(p.pos.x)) < speed * 0.5 &&
                             Math.abs(p.pos.y - Math.round(p.pos.y)) < speed * 0.5;

        if (onGridCenter) {
            const snappedX = Math.round(p.pos.x);
            const snappedY = Math.round(p.pos.y);
            
            // Check if the next queued direction is a valid move
            let canTurn = false;
            if (p.nextDir === 'UP' && !isWall(snappedX, snappedY - 1)) canTurn = true;
            if (p.nextDir === 'DOWN' && !isWall(snappedX, snappedY + 1)) canTurn = true;
            if (p.nextDir === 'LEFT' && !isWall(snappedX - 1, snappedY)) canTurn = true;
            if (p.nextDir === 'RIGHT' && !isWall(snappedX + 1, snappedY)) canTurn = true;
            
            if (canTurn) {
                p.pos.x = snappedX; // Snap to grid for perfect alignment
                p.pos.y = snappedY;
                p.dir = p.nextDir;
            }
        }

        // 2. Movement Logic: Move in the current direction if not blocked.
        let dx = 0, dy = 0;
        if (p.dir === 'UP') dy = -1;
        if (p.dir === 'DOWN') dy = 1;
        if (p.dir === 'LEFT') dx = -1;
        if (p.dir === 'RIGHT') dx = 1;

        // Check for a wall in front before moving
        const currentGridX = Math.round(p.pos.x);
        const currentGridY = Math.round(p.pos.y);

        let isBlocked = false;
        if (onGridCenter && isWall(currentGridX + dx, currentGridY + dy)) {
            isBlocked = true;
        }
        
        if (!isBlocked) {
            p.pos.x += dx * speed;
            p.pos.y += dy * speed;
            const now = Date.now();
            if (!wakaTimerRef.current || now - wakaTimerRef.current > 250) {
                playPacmanWaka();
                wakaTimerRef.current = now;
            }
        }

        // 3. Tunneling Logic
        if (p.pos.x < -1) p.pos.x = COLS;
        else if (p.pos.x > COLS) p.pos.x = -1;

        // 4. Eating Logic
        const gridX = Math.round(p.pos.x);
        const gridY = Math.round(p.pos.y);

        if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
            const tile = gridRef.current[gridY][gridX];
            if (tile === 2) { // Dot
                gridRef.current[gridY][gridX] = 0;
                setScore(s => s + 10);
                dotsCountRef.current--;
                checkWin();
            } else if (tile === 3) { // Power Pellet
                gridRef.current[gridY][gridX] = 0;
                setScore(s => s + 50);
                dotsCountRef.current--;
                enablePowerMode();
                checkWin();
            }
        }
    }, [playPacmanWaka]);


    const moveGhosts = () => {
        ghostsRef.current.forEach(g => {
            if (g.mode === 'EATEN') {
                // Return to house logic (Simplified: Teleport for now or fast travel)
                // For this arcade version, we just respawn them after a delay
                return; 
            }

            const isFrightened = g.mode === 'FRIGHTENED';
            const speed = isFrightened ? g.speed * 0.6 : g.speed;
            
            // Only make decisions at intersections (centers of tiles)
            const xInt = Math.round(g.pos.x);
            const yInt = Math.round(g.pos.y);
            
            if (Math.abs(g.pos.x - xInt) < 0.1 && Math.abs(g.pos.y - yInt) < 0.1) {
                // Snap to grid
                g.pos.x = xInt;
                g.pos.y = yInt;

                // Decide direction
                const options: Direction[] = [];
                if (!isGhostWall(xInt, yInt - 1) && g.dir !== 'DOWN') options.push('UP');
                if (!isGhostWall(xInt, yInt + 1) && g.dir !== 'UP') options.push('DOWN');
                if (!isGhostWall(xInt - 1, yInt) && g.dir !== 'RIGHT') options.push('LEFT');
                if (!isGhostWall(xInt + 1, yInt) && g.dir !== 'LEFT') options.push('RIGHT');

                if (options.length === 0) {
                    // Dead end, reverse
                    if (g.dir === 'UP') g.dir = 'DOWN';
                    else if (g.dir === 'DOWN') g.dir = 'UP';
                    else if (g.dir === 'LEFT') g.dir = 'RIGHT';
                    else g.dir = 'LEFT';
                } else {
                    if (isFrightened) {
                        // Random
                        g.dir = options[Math.floor(Math.random() * options.length)];
                    } else {
                        // Basic Chase Logic (Target Pacman)
                        let bestDir = options[0];
                        let minDist = Infinity;
                        
                        options.forEach(opt => {
                            let tx = xInt;
                            let ty = yInt;
                            if (opt === 'UP') ty--;
                            if (opt === 'DOWN') ty++;
                            if (opt === 'LEFT') tx--;
                            if (opt === 'RIGHT') tx++;
                            
                            // Euclidean distance to pacman
                            const dist = Math.sqrt(Math.pow(tx - pacmanRef.current.pos.x, 2) + Math.pow(ty - pacmanRef.current.pos.y, 2));
                            if (dist < minDist) {
                                minDist = dist;
                                bestDir = opt;
                            }
                        });
                        g.dir = bestDir;
                    }
                }
            }

            // Apply movement
            if (g.dir === 'UP') g.pos.y -= speed;
            if (g.dir === 'DOWN') g.pos.y += speed;
            if (g.dir === 'LEFT') g.pos.x -= speed;
            if (g.dir === 'RIGHT') g.pos.x += speed;

             // Tunnel Wrap for Ghosts
             if (g.pos.x < -0.5) g.pos.x = COLS - 0.5;
             if (g.pos.x > COLS - 0.5) g.pos.x = -0.5;
        });
    };

    const handleDeath = () => {
        setIsPlaying(false);
        if (lives > 1) {
            setLives(l => l - 1);
            playGameOver(); // Death sound
            setTimeout(() => {
                resetActors();
                setIsPlaying(false); // Wait for user to start again
            }, 1500);
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

    const checkCollisions = () => {
        const p = pacmanRef.current;
        const P_RADIUS = 0.5; 

        ghostsRef.current.forEach(g => {
            const dx = p.pos.x - g.pos.x;
            const dy = p.pos.y - g.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 0.8) { // Collision
                if (g.mode === 'FRIGHTENED') {
                    // Eat Ghost
                    g.mode = 'EATEN';
                    // Reset ghost pos immediately for arcade pace
                    g.pos = { ...g.startPos };
                    g.mode = 'CHASE'; // Respawn immediately in this version
                    setScore(s => s + 200);
                    playPacmanEatGhost();
                } else if (g.mode === 'CHASE' || g.mode === 'SCATTER') {
                    // Die
                    handleDeath();
                }
            }
        });
    };

    // --- CORE GAME LOOP ---
    useEffect(() => {
        const update = () => {
            if (isPlaying && !gameOver && !gameWon) {
                movePacman();
                moveGhosts();
                checkCollisions();
                setTick(t => t + 1); // Trigger render
            }
            animationFrameRef.current = requestAnimationFrame(update);
        };
        animationFrameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, gameOver, gameWon, movePacman]);


    // --- RENDER HELPERS ---
    
    // Style for entities
    const getStyle = (x: number, y: number, color?: string) => ({
        left: `${(x / COLS) * 100}%`,
        top: `${(y / ROWS) * 100}%`,
        width: `${(1 / COLS) * 100}%`,
        height: `${(1 / ROWS) * 100}%`,
    });

    return (
        <div className="h-full w-full flex flex-col items-center bg-[#0a0a12] relative overflow-hidden text-white font-sans touch-none select-none">
             {/* Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none"></div>

            {/* HEADER */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                    NEON PAC
                </h1>
                <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* STATS */}
            <div className="w-full max-w-lg flex justify-between items-center px-6 mb-2 z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span>
                    <span className="text-xl font-mono font-bold text-white">{score}</span>
                </div>
                <div className="flex flex-col items-end">
                     <span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span>
                     <span className="text-xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span>
                </div>
            </div>

            {/* LIVES */}
            <div className="w-full max-w-lg flex gap-2 px-6 mb-4 z-10">
                 {Array.from({ length: 3 }).map((_, i) => (
                     <div key={i} className={`w-4 h-4 rounded-full bg-yellow-400 ${i < lives ? 'opacity-100' : 'opacity-20'}`} />
                 ))}
            </div>

            {/* GAME AREA WRAPPER */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative z-10 min-h-0 pb-6">
                {/* GAME BOARD CONTAINER */}
                <div 
                    className="relative w-full h-auto aspect-[19/21] bg-black border-2 border-blue-900/50 rounded-lg shadow-[0_0_20px_rgba(30,58,138,0.3)] overflow-hidden"
                >
                    
                    {/* 1. GRID (Walls & Dots) */}
                    {gridRef.current.map((row, r) => (
                        row.map((cell, c) => {
                            if (cell === 0) return null;
                            
                            const style = getStyle(c, r);
                            
                            // Wall
                            if (cell === 1) return (
                                <div key={`${r}-${c}`} className="absolute bg-blue-900/30 border border-blue-500/30 rounded-sm" style={style} />
                            );
                            
                            // Dot
                            if (cell === 2) return (
                                <div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}>
                                    <div className="w-[15%] h-[15%] bg-yellow-200/50 rounded-full" />
                                </div>
                            );

                            // Power Pellet
                            if (cell === 3) return (
                                <div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}>
                                    <div className="w-[40%] h-[40%] bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]" />
                                </div>
                            );
                            
                            // Gate
                            if (cell === 4) return (
                                <div key={`${r}-${c}`} className="absolute flex items-center justify-center" style={style}>
                                    <div className="w-full h-[10%] bg-pink-500/50" />
                                </div>
                            );
                            return null;
                        })
                    ))}

                    {/* 2. GHOSTS */}
                    {ghostsRef.current.map(g => {
                        const style = getStyle(g.pos.x, g.pos.y);
                        const isFrightened = g.mode === 'FRIGHTENED';
                        const colorClass = isFrightened ? 'text-blue-300' : 
                                        g.color === 'red' ? 'text-red-500' :
                                        g.color === 'pink' ? 'text-pink-400' :
                                        g.color === 'cyan' ? 'text-cyan-400' : 'text-orange-400';
                        
                        return (
                            <div key={g.id} className={`absolute flex items-center justify-center transition-transform duration-75`} style={{...style, transform: 'scale(1.2)'}}>
                                <Ghost size={24} className={`${colorClass} ${isFrightened ? 'animate-pulse' : ''} drop-shadow-[0_0_5px_currentColor]`} fill="currentColor" />
                            </div>
                        );
                    })}

                    {/* 3. PACMAN */}
                    <div 
                        className="absolute flex items-center justify-center transition-transform duration-75"
                        style={{
                            ...getStyle(pacmanRef.current.pos.x, pacmanRef.current.pos.y),
                            transform: `scale(1.1) rotate(${pacmanRef.current.dir === 'RIGHT' ? 0 : pacmanRef.current.dir === 'DOWN' ? 90 : pacmanRef.current.dir === 'LEFT' ? 180 : -90}deg)`
                        }}
                    >
                        <div className="w-[80%] h-[80%] bg-yellow-400 rounded-full relative overflow-hidden shadow-[0_0_10px_#facc15]">
                            {/* Mouth Animation */}
                            <div className="absolute top-0 right-0 w-full h-1/2 bg-black origin-bottom-right animate-[chomp_0.2s_infinite_alternate]" 
                                style={{ transformOrigin: '50% 50%', clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }} />
                            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-black origin-top-right animate-[chomp_0.2s_infinite_alternate]"
                                style={{ transformOrigin: '50% 50%', clipPath: 'polygon(50% 50%, 100% 100%, 100% 50%)' }} />
                        </div>
                    </div>

                    {/* OVERLAYS */}
                    {!isPlaying && !gameOver && !gameWon && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm pointer-events-none">
                            <p className="text-white font-bold animate-pulse tracking-widest">UTILISEZ LE JOYSTICK</p>
                        </div>
                    )}
                    
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in">
                            <h2 className="text-4xl font-black text-red-500 italic mb-2">GAME OVER</h2>
                            {earnedCoins > 0 && (
                                <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500">
                                    <Trophy className="text-yellow-400" size={20} />
                                    <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}
                            <button onClick={resetGame} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-500">REJOUER</button>
                        </div>
                    )}

                    {gameWon && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 animate-in fade-in">
                            <h2 className="text-4xl font-black text-green-400 italic mb-2">VICTOIRE !</h2>
                            {earnedCoins > 0 && (
                                <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500">
                                    <Trophy className="text-yellow-400" size={20} />
                                    <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}
                            <button onClick={resetGame} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500">REJOUER</button>
                        </div>
                    )}
                </div>
                
                {/* JOYSTICK CONTROLS */}
                <div className="mt-6 flex justify-center items-center h-40 shrink-0">
                    <div
                        ref={joystickBaseRef}
                        className="w-32 h-32 rounded-full bg-gray-800/50 border-2 border-white/10 flex items-center justify-center shadow-lg cursor-pointer"
                        onPointerDown={handleJoystickDown}
                        onPointerMove={handleJoystickMove}
                        onPointerUp={handleJoystickUp}
                        onPointerLeave={handleJoystickUp}
                    >
                        <div
                            className="w-16 h-16 rounded-full bg-neon-blue/80 shadow-[0_0_15px_#00f3ff] pointer-events-none transition-transform duration-75"
                            style={{ transform: `translate(${joystick.x}px, ${joystick.y}px)` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};