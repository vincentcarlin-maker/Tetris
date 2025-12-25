
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { Pacman, Ghost as GhostType, Grid, Direction, Position, GhostMode } from '../types';
import { LEVELS, PACMAN_START, COLS, ROWS, GHOST_HOUSE_EXIT } from '../level';

// --- CONSTANTS ---
const GAME_SPEED_BASE = 0.11;
export const TRAIL_LIFETIME = 15;

export const GHOST_COLORS: Record<string, string> = {
    red: '#ef4444',
    pink: '#f472b6',
    cyan: '#22d3ee',
    orange: '#fb923c',
    frightened: '#93c5fd',
    eaten: 'rgba(255, 255, 255, 0.3)'
};

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const DIFFICULTY_SETTINGS: Record<Difficulty, { 
    name: string, 
    lives: number, 
    speedMult: number, 
    powerDuration: number, 
    scoreMult: number, 
    color: string 
}> = {
    EASY: { name: 'FACILE', lives: 5, speedMult: 0.85, powerDuration: 8000, scoreMult: 1, color: 'text-green-400 border-green-500' },
    MEDIUM: { name: 'NORMAL', lives: 3, speedMult: 1.0, powerDuration: 6000, scoreMult: 1.5, color: 'text-yellow-400 border-yellow-500' },
    HARD: { name: 'DIFFICILE', lives: 2, speedMult: 1.15, powerDuration: 4000, scoreMult: 2, color: 'text-red-500 border-red-500' }
};

const SCATTER_TARGETS = [
    { x: COLS - 2, y: 1 }, 
    { x: 1, y: 1 },        
    { x: COLS - 2, y: ROWS - 2 }, 
    { x: 1, y: ROWS - 2 }, 
];

const GHOST_EATEN_SPEED_MULTIPLIER = 2.5;

const MODE_SWITCH_TIMES = [
    7 * 60, 20 * 60, 7 * 60, 20 * 60, 5 * 60, 20 * 60, 5 * 60, Infinity
];

const GHOST_RELEASE_TIMES = [0, 4 * 60, 8 * 60, 12 * 60];

export interface TrailParticle {
    x: number; y: number; color: string; life: number; maxLife: number; size: number;
}

const createGhosts = (levelSpeedMult: number, difficultySpeedMult: number): GhostType[] => {
    const baseSpeed = GAME_SPEED_BASE * levelSpeedMult * difficultySpeedMult;
    return [
        { id: 0, pos: { ...GHOST_HOUSE_EXIT }, dir: 'LEFT', color: 'red', mode: 'SCATTER', startPos: { x: 9, y: 10 }, speed: baseSpeed * 0.45 },
        { id: 1, pos: { x: 9, y: 10 }, dir: 'UP', color: 'pink', mode: 'AT_HOME', startPos: { x: 9, y: 10 }, speed: baseSpeed * 0.42 },
        { id: 2, pos: { x: 8, y: 10 }, dir: 'UP', color: 'cyan', mode: 'AT_HOME', startPos: { x: 8, y: 10 }, speed: baseSpeed * 0.40 },
        { id: 3, pos: { x: 10, y: 10 }, dir: 'UP', color: 'orange', mode: 'AT_HOME', startPos: { x: 10, y: 10 }, speed: baseSpeed * 0.38 }
    ];
};

export const usePacmanEngine = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    // --- STATE ---
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [gameStep, setGameStep] = useState<'MENU' | 'DIFFICULTY' | 'PLAYING'>('DIFFICULTY'); 
    
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false); 
    const [levelComplete, setLevelComplete] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Audio & Stats
    const { playPacmanWaka, playPacmanEatGhost, playPacmanPower, playGameOver, playVictory, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.pacman || 0;

    // --- REFS (Mutable game objects) ---
    const pacmanRef = useRef<Pacman>({ pos: { ...PACMAN_START }, dir: 'LEFT', nextDir: 'LEFT', speed: GAME_SPEED_BASE, isPowered: false });
    const ghostsRef = useRef<GhostType[]>([]);
    const gridRef = useRef<Grid>([]);
    const trailsRef = useRef<TrailParticle[]>([]);

    // Logic Refs
    const dotsCountRef = useRef(0);
    const powerTimerRef = useRef<any>(null);
    const wakaTimerRef = useRef<any>(null);
    const gameTimerRef = useRef(0);
    const gameModeIndexRef = useRef(0);
    const gameModeRef = useRef<'CHASE' | 'SCATTER'>('SCATTER');
    const animationFrameRef = useRef<number>(0);
    const isDyingRef = useRef(false);

    // State Refs for access in loop
    const scoreRef = useRef(0);
    const livesRef = useRef(3);
    const difficultyRef = useRef<Difficulty>('MEDIUM');

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { livesRef.current = lives; }, [lives]);
    useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

    // Cleanup
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
        };
    }, []);

    // --- HELPERS ---
    const isWall = (x: number, y: number): boolean => {
        if (y === 10 && (x < 0 || x >= COLS)) return false; // Tunnel
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1 || cell === 4;
    };

    const isGhostWall = (x: number, y: number): boolean => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        const cell = gridRef.current[Math.floor(y)][Math.floor(x)];
        return cell === 1;
    };

    // --- GAME ACTIONS ---

    const initLevel = (levelIndex: number, diff: Difficulty) => {
        const mapData = LEVELS[levelIndex - 1] || LEVELS[0];
        gridRef.current = JSON.parse(JSON.stringify(mapData));
        
        let dots = 0;
        gridRef.current.forEach(row => row.forEach(cell => { if (cell === 2 || cell === 3) dots++; }));
        dotsCountRef.current = dots;

        const levelSpeedMult = 1 + (levelIndex - 1) * 0.1;
        const diffSettings = DIFFICULTY_SETTINGS[diff];
        
        pacmanRef.current = { 
            pos: { ...PACMAN_START }, 
            dir: 'LEFT', 
            nextDir: 'LEFT', 
            speed: GAME_SPEED_BASE * levelSpeedMult * diffSettings.speedMult, 
            isPowered: false 
        };
        
        ghostsRef.current = createGhosts(levelSpeedMult, diffSettings.speedMult);
        trailsRef.current = [];
        
        gameTimerRef.current = 0;
        gameModeIndexRef.current = 0;
        gameModeRef.current = 'SCATTER';
    };

    const startGame = (selectedDiff: Difficulty) => {
        setDifficulty(selectedDiff);
        setLevel(1);
        setLives(DIFFICULTY_SETTINGS[selectedDiff].lives);
        initLevel(1, selectedDiff);
        
        setScore(0);
        setGameOver(false);
        setGameWon(false);
        setLevelComplete(false);
        setIsPlaying(false);
        setEarnedCoins(0);
        setGameStep('PLAYING');
        isDyingRef.current = false;
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const resetLevel = () => {
        pacmanRef.current.pos = { ...PACMAN_START };
        pacmanRef.current.dir = 'LEFT';
        pacmanRef.current.nextDir = 'LEFT';
        
        const levelSpeedMult = 1 + (level - 1) * 0.1;
        const diffSettings = DIFFICULTY_SETTINGS[difficultyRef.current];
        ghostsRef.current = createGhosts(levelSpeedMult, diffSettings.speedMult);
        
        trailsRef.current = [];
        gameTimerRef.current = 0;
        gameModeIndexRef.current = 0;
        setIsPlaying(true);
        isDyingRef.current = false; 
    };

    const startNextLevel = () => {
        const nextLevel = level + 1;
        
        if (nextLevel > LEVELS.length) {
            setGameWon(true);
            playVictory();
            addCoins(200);
            setEarnedCoins(prev => prev + 200);
        } else {
            setLevel(nextLevel);
            initLevel(nextLevel, difficulty);
            setLevelComplete(false);
            setIsPlaying(false);
            isDyingRef.current = false;
            
            const currentMax = parseInt(localStorage.getItem('pacman-max-level') || '1', 10);
            if (nextLevel > currentMax) {
                localStorage.setItem('pacman-max-level', nextLevel.toString());
            }
        }
    };

    const checkWin = () => {
        if (dotsCountRef.current <= 0) {
            setIsPlaying(false);
            playVictory();
            addCoins(50);
            setEarnedCoins(e => e + 50);
            setLevelComplete(true);
            
            setTimeout(() => {
                if (level < LEVELS.length) {
                    startNextLevel();
                } else {
                    setGameWon(true);
                }
            }, 3000);
        }
    };

    const enablePowerMode = () => {
        pacmanRef.current.isPowered = true;
        playPacmanPower();
        ghostsRef.current.forEach(g => { if (g.mode !== 'EATEN') g.mode = 'FRIGHTENED'; });
        if (powerTimerRef.current) clearTimeout(powerTimerRef.current);
        
        const duration = DIFFICULTY_SETTINGS[difficultyRef.current].powerDuration;
        
        powerTimerRef.current = setTimeout(() => {
            pacmanRef.current.isPowered = false;
            ghostsRef.current.forEach(g => { if (g.mode === 'FRIGHTENED') g.mode = gameModeRef.current; });
        }, duration);
    };

    const handleDeath = () => {
        if (isDyingRef.current) return;
        isDyingRef.current = true;

        setIsPlaying(false);
        
        const currentLives = livesRef.current;
        if (currentLives > 1) {
            setLives(l => l - 1);
            livesRef.current = currentLives - 1;
            
            playGameOver();
            setTimeout(() => { 
                resetLevel();
            }, 1500);
        } else {
            setLives(0);
            livesRef.current = 0;
            setGameOver(true);
            playGameOver();
            updateHighScore('pacman', scoreRef.current);
            const coins = Math.floor(scoreRef.current / 100);
            if (coins > 0) {
                addCoins(coins);
                setEarnedCoins(coins);
            }
            if (onReportProgress) onReportProgress('score', scoreRef.current);
        }
    };

    // --- GAME LOOP LOGIC ---

    const movePacman = () => {
        const p = pacmanRef.current;
        const speed = p.speed;

        // Demi-tour
        if (
            (p.dir === 'LEFT' && p.nextDir === 'RIGHT') || (p.dir === 'RIGHT' && p.nextDir === 'LEFT') ||
            (p.dir === 'UP' && p.nextDir === 'DOWN') || (p.dir === 'DOWN' && p.nextDir === 'UP')
        ) {
            p.dir = p.nextDir;
        }

        const center = { x: Math.round(p.pos.x), y: Math.round(p.pos.y) };
        const distToCenter = Math.abs(p.pos.x - center.x) + Math.abs(p.pos.y - center.y);

        if (distToCenter <= speed + 0.02) {
            if (p.nextDir !== p.dir) {
                let canTurn = false;
                if (p.nextDir === 'UP' && !isWall(center.x, center.y - 1)) canTurn = true;
                if (p.nextDir === 'DOWN' && !isWall(center.x, center.y + 1)) canTurn = true;
                if (p.nextDir === 'LEFT' && !isWall(center.x - 1, center.y)) canTurn = true;
                if (p.nextDir === 'RIGHT' && !isWall(center.x + 1, center.y)) canTurn = true;

                if (canTurn) {
                    p.pos.x = center.x; p.pos.y = center.y; p.dir = p.nextDir;
                }
            }

            let blocked = false;
            if (p.dir === 'UP' && isWall(center.x, center.y - 1)) blocked = true;
            if (p.dir === 'DOWN' && isWall(center.x, center.y + 1)) blocked = true;
            if (p.dir === 'LEFT' && isWall(center.x - 1, center.y)) blocked = true;
            if (p.dir === 'RIGHT' && isWall(center.x + 1, center.y)) blocked = true;

            if (blocked) {
                p.pos.x = center.x; p.pos.y = center.y; return;
            }
        }

        if (p.dir === 'UP') p.pos.y -= speed;
        else if (p.dir === 'DOWN') p.pos.y += speed;
        else if (p.dir === 'LEFT') p.pos.x -= speed;
        else if (p.dir === 'RIGHT') p.pos.x += speed;

        if (p.pos.x < -0.5) p.pos.x = COLS - 0.5;
        if (p.pos.x > COLS - 0.5) p.pos.x = -0.5;

        // Eat Dots
        const gridX = Math.round(p.pos.x);
        const gridY = Math.round(p.pos.y);
        const scoreMult = DIFFICULTY_SETTINGS[difficultyRef.current].scoreMult;
        
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
                setScore(s => s + Math.ceil(10 * scoreMult));
                dotsCountRef.current--;
                checkWin();
            } else if (tile === 3) {
                gridRef.current[gridY][gridX] = 0;
                setScore(s => s + Math.ceil(50 * scoreMult));
                dotsCountRef.current--;
                enablePowerMode();
                checkWin();
            }
        }
    };

    const moveGhosts = () => {
        ghostsRef.current.forEach(g => {
            const speed = g.mode === 'FRIGHTENED' ? g.speed * 0.6 : g.mode === 'EATEN' ? g.speed * GHOST_EATEN_SPEED_MULTIPLIER : g.speed;
            const onGridCenter = Math.abs(g.pos.x - Math.round(g.pos.x)) < speed * 0.9 && Math.abs(g.pos.y - Math.round(g.pos.y)) < speed * 0.9;
            
            if (onGridCenter) {
                const xInt = Math.round(g.pos.x);
                const yInt = Math.round(g.pos.y);
                g.pos.x = xInt; g.pos.y = yInt;
                
                if (g.mode === 'AT_HOME') {
                    if (g.pos.y <= g.startPos.y - 0.5) g.dir = 'DOWN';
                    if (g.pos.y >= g.startPos.y + 0.5) g.dir = 'UP';
                    if (g.dir === 'UP') g.pos.y -= 0.05; else g.pos.y += 0.05;
                    return;
                }

                if (g.mode === 'EATEN' && xInt === GHOST_HOUSE_EXIT.x && yInt === GHOST_HOUSE_EXIT.y) {
                    g.mode = 'AT_HOME'; g.pos = { ...g.startPos }; return;
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
                    if (g.dir === 'UP') g.dir = 'DOWN'; else if (g.dir === 'DOWN') g.dir = 'UP';
                    else if (g.dir === 'LEFT') g.dir = 'RIGHT'; else if (g.dir === 'RIGHT') g.dir = 'LEFT';
                }
            }
            
            if (g.dir === 'UP') g.pos.y -= speed;
            if (g.dir === 'DOWN') g.pos.y += speed;
            if (g.dir === 'LEFT') g.pos.x -= speed;
            if (g.dir === 'RIGHT') g.pos.x += speed;

            if (g.pos.x < -0.5) g.pos.x = COLS - 0.5;
            if (g.pos.x > COLS - 0.5) g.pos.x = -0.5;
        });
    };

    const updateGameTimers = () => {
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
    };

    const checkCollisions = () => {
        const p = pacmanRef.current;
        ghostsRef.current.forEach(g => {
            const dist = Math.hypot(p.pos.x - g.pos.x, p.pos.y - g.pos.y);
            if (dist < 0.8) {
                if (g.mode === 'FRIGHTENED') {
                    g.mode = 'EATEN';
                    setScore(s => s + Math.ceil(200 * DIFFICULTY_SETTINGS[difficultyRef.current].scoreMult));
                    playPacmanEatGhost();
                } else if (g.mode === 'CHASE' || g.mode === 'SCATTER') {
                    handleDeath();
                }
            }
        });
    };

    // --- MAIN LOOP ---
    useEffect(() => {
        const update = () => {
            if (isPlaying && !gameOver && !gameWon && !levelComplete && gameStep === 'PLAYING') {
                updateGameTimers();
                movePacman();
                moveGhosts();
                checkCollisions();
            }
            animationFrameRef.current = requestAnimationFrame(update);
        };
        animationFrameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, gameOver, gameWon, levelComplete, gameStep]);

    return {
        // State
        score, lives, level, difficulty, setDifficulty, gameStep, setGameStep,
        gameOver, gameWon, levelComplete, isPlaying, setIsPlaying, earnedCoins,
        highScore,

        // Refs
        pacmanRef, ghostsRef, gridRef, trailsRef, isDyingRef,
        
        // Actions
        startGame, resetLevel, handleDeath, resumeAudio
    };
};
