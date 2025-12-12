
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, MousePointer2, Zap, Skull } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface InvadersGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// -- CONSTANTS --
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 0.5;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 4;
const BASE_ENEMY_SPEED = 1;

// -- PIXEL ART SPRITES (1 = Pixel allumé, 0 = Vide) --
const SPRITES = {
    PLAYER: [
        [0,0,0,0,1,0,0,0,0],
        [0,0,0,1,1,1,0,0,0],
        [0,0,1,1,0,1,1,0,0],
        [0,1,1,1,1,1,1,1,0],
        [1,1,0,1,1,1,0,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,0,1,0,0,0,1,0,1],
    ],
    ENEMY_BASIC: [
        [0,0,1,0,0,0,0,0,1,0,0],
        [0,0,0,1,0,0,0,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,0,1,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [0,0,0,1,1,0,1,1,0,0,0]
    ],
    ENEMY_SHOOTER: [
        [0,0,0,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,0,1,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [0,1,0,1,0,1,0,1,0,1,0],
        [0,1,0,0,0,0,0,0,0,1,0],
        [0,0,1,0,0,0,0,0,1,0,0]
    ],
    ENEMY_HEAVY: [
        [0,0,0,0,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,0],
        [1,1,0,1,1,1,1,1,0,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [0,0,1,0,0,0,0,0,1,0,0],
        [0,1,1,0,0,0,0,0,1,1,0]
    ],
    ENEMY_KAMIKAZE: [
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0],
        [0,0,1,1,0,1,0,1,1,0,0],
        [0,1,1,0,0,1,0,0,1,1,0],
        [1,1,0,0,0,1,0,0,0,1,1],
    ]
};

// -- TYPES --
interface Entity {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
}

interface Player extends Entity {
    color: string;
}

interface Enemy extends Entity {
    type: 'basic' | 'shooter' | 'heavy' | 'kamikaze';
    color: string;
    health: number;
    score: number;
    dx: number;
    dy: number;
}

interface Bullet extends Entity {
    dy: number;
    color: string;
    isEnemy: boolean;
}

interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export const InvadersGame: React.FC<InvadersGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [wave, setWave] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    const { playLaserShoot, playExplosion, playGameOver, playVictory, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.invaders || 0;

    // Game Refs
    const playerRef = useRef<Player>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: 32, height: 32, active: true, color: '#00f3ff' });
    const bulletsRef = useRef<Bullet[]>([]);
    const enemiesRef = useRef<Enemy[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    
    // Logic Refs
    const animationFrameRef = useRef<number>(0);
    const lastShotTimeRef = useRef(0);
    const lastEnemyShotTimeRef = useRef(0);
    const waveTimerRef = useRef(0);
    const touchXRef = useRef<number | null>(null);
    const isTouchingRef = useRef(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_invaders_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_invaders_tutorial_seen', 'true');
        }
        resetGame();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const resetGame = () => {
        setScore(0);
        setLives(3);
        setWave(1);
        setGameOver(false);
        setIsPlaying(false);
        setEarnedCoins(0);
        
        playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: 32, height: 32, active: true, color: '#00f3ff' };
        bulletsRef.current = [];
        enemiesRef.current = [];
        particlesRef.current = [];
        touchXRef.current = null;
        startWave(1);
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const startWave = (waveNum: number) => {
        enemiesRef.current = [];
        const rows = Math.min(3 + Math.floor(waveNum / 2), 6);
        const cols = 6;
        const speed = BASE_ENEMY_SPEED + (waveNum * 0.2);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const typeRand = Math.random();
                let type: Enemy['type'] = 'basic';
                let color = '#ff00ff';
                let health = 1;
                let scoreVal = 10;
                let width = 28;
                let height = 24;

                if (typeRand > 0.8 && waveNum > 1) {
                    type = 'shooter';
                    color = '#facc15'; // yellow
                    scoreVal = 30;
                    height = 24;
                } else if (typeRand > 0.9 && waveNum > 2) {
                    type = 'heavy';
                    color = '#ef4444'; // red
                    health = 3;
                    scoreVal = 50;
                    width = 32;
                    height = 24;
                } else if (waveNum > 3 && r === 0 && Math.random() > 0.7) {
                    type = 'kamikaze';
                    color = '#00ff9d'; // green
                    scoreVal = 40;
                    width = 24;
                    height = 24;
                }

                enemiesRef.current.push({
                    x: 40 + c * 50,
                    y: 40 + r * 45,
                    width,
                    height,
                    active: true,
                    type,
                    color,
                    health,
                    score: scoreVal,
                    dx: speed,
                    dy: 0
                });
            }
        }
    };

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                dx: (Math.random() - 0.5) * 5,
                dy: (Math.random() - 0.5) * 5,
                life: 30,
                maxLife: 30,
                color,
                size: Math.random() * 3 + 1
            });
        }
    };

    const handlePlayerDeath = () => {
        playExplosion();
        spawnParticles(playerRef.current.x, playerRef.current.y, '#00f3ff', 50);
        
        if (lives > 1) {
            setLives(l => l - 1);
            // Respawn invulnerability/reset position could be added here
            playerRef.current.x = CANVAS_WIDTH / 2;
            bulletsRef.current = []; // Clear bullets for fairness
        } else {
            setLives(0);
            setGameOver(true);
            setIsPlaying(false);
            playGameOver();
            updateHighScore('invaders', score);
            const coins = Math.floor(score / 50);
            if (coins > 0) {
                addCoins(coins);
                setEarnedCoins(coins);
            }
            if (onReportProgress) onReportProgress('score', score);
        }
    };

    const update = () => {
        if (!isPlaying || gameOver || showTutorial) return;

        const now = Date.now();
        const player = playerRef.current;

        // Player Movement (Follow Touch/Mouse X)
        if (touchXRef.current !== null) {
            const dx = touchXRef.current - player.x;
            player.x += dx * 0.15; // Smooth follow
            
            // Auto Fire
            if (now - lastShotTimeRef.current > 250) {
                bulletsRef.current.push({
                    x: player.x,
                    y: player.y - 10,
                    width: 4,
                    height: 12,
                    active: true,
                    dy: -BULLET_SPEED,
                    color: '#00f3ff',
                    isEnemy: false
                });
                playLaserShoot();
                lastShotTimeRef.current = now;
            }
        }

        // Clamp Player
        player.x = Math.max(player.width/2, Math.min(CANVAS_WIDTH - player.width/2, player.x));

        // Enemy Logic
        let hitEdge = false;
        enemiesRef.current.forEach(e => {
            if (!e.active) return;
            e.x += e.dx;
            e.y += e.dy;

            if (e.x <= e.width/2 || e.x >= CANVAS_WIDTH - e.width/2) {
                hitEdge = true;
            }

            // Kamikaze Logic
            if (e.type === 'kamikaze') {
                e.y += 1; // Always move down fast
                // Track player
                if (e.x < player.x) e.x += 0.5;
                else e.x -= 0.5;
            }

            // Shooting Logic
            if (e.type === 'shooter' || e.type === 'heavy') {
                if (Math.random() < 0.005 && now - lastEnemyShotTimeRef.current > 100) { // Random fire
                    bulletsRef.current.push({
                        x: e.x,
                        y: e.y + 15,
                        width: 4,
                        height: 10,
                        active: true,
                        dy: ENEMY_BULLET_SPEED,
                        color: e.color,
                        isEnemy: true
                    });
                    lastEnemyShotTimeRef.current = now; // Shared timer prevents spam but allows barrage
                }
            }

            // Collision with Player
            if (Math.abs(e.x - player.x) < (e.width + player.width)/2 && 
                Math.abs(e.y - player.y) < (e.height + player.height)/2) {
                e.active = false;
                handlePlayerDeath();
            }

            // Bottom out
            if (e.y > CANVAS_HEIGHT) {
                e.active = false; // Enemy escaped, maybe lose points?
            }
        });

        if (hitEdge) {
            enemiesRef.current.forEach(e => {
                e.dx *= -1;
                if (e.type !== 'kamikaze') e.y += 20; // Move down row
            });
        }

        // Bullets Logic
        bulletsRef.current.forEach(b => {
            if (!b.active) return;
            b.y += b.dy;

            // Out of bounds
            if (b.y < 0 || b.y > CANVAS_HEIGHT) {
                b.active = false;
                return;
            }

            if (b.isEnemy) {
                // Check Player Hit
                if (Math.abs(b.x - player.x) < (b.width + player.width)/2 && 
                    Math.abs(b.y - player.y) < (b.height + player.height)/2) {
                    b.active = false;
                    handlePlayerDeath();
                }
            } else {
                // Check Enemy Hit
                enemiesRef.current.forEach(e => {
                    if (!e.active) return;
                    if (Math.abs(b.x - e.x) < (b.width + e.width)/2 && 
                        Math.abs(b.y - e.y) < (b.height + e.height)/2) {
                        b.active = false;
                        e.health--;
                        spawnParticles(b.x, b.y, '#fff', 5);
                        if (e.health <= 0) {
                            e.active = false;
                            setScore(s => s + e.score);
                            playExplosion();
                            spawnParticles(e.x, e.y, e.color, 20);
                        }
                    }
                });
            }
        });

        // Cleanup
        bulletsRef.current = bulletsRef.current.filter(b => b.active);
        enemiesRef.current = enemiesRef.current.filter(e => e.active);

        // Check Wave Clear
        if (enemiesRef.current.length === 0) {
            playVictory();
            setWave(w => w + 1);
            startWave(wave + 1);
            if (onReportProgress) onReportProgress('action', 1); // Action = Wave Cleared
        }

        // Particles
        particlesRef.current.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life--;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    };

    // Helper: Draw Sprite from Matrix
    const drawSprite = (ctx: CanvasRenderingContext2D, entity: Entity, spriteMatrix: number[][], color: string) => {
        const rows = spriteMatrix.length;
        const cols = spriteMatrix[0].length;
        const pixelW = entity.width / cols;
        const pixelH = entity.height / rows;

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (spriteMatrix[r][c] === 1) {
                    ctx.fillRect(
                        Math.floor(entity.x - entity.width / 2 + c * pixelW),
                        Math.floor(entity.y - entity.height / 2 + r * pixelH),
                        Math.ceil(pixelW),
                        Math.ceil(pixelH)
                    );
                }
            }
        }
        ctx.shadowBlur = 0; // Reset
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Player
        drawSprite(ctx, playerRef.current, SPRITES.PLAYER, playerRef.current.color);

        // Enemies
        enemiesRef.current.forEach(e => {
            let sprite = SPRITES.ENEMY_BASIC;
            if (e.type === 'shooter') sprite = SPRITES.ENEMY_SHOOTER;
            else if (e.type === 'heavy') sprite = SPRITES.ENEMY_HEAVY;
            else if (e.type === 'kamikaze') sprite = SPRITES.ENEMY_KAMIKAZE;
            
            drawSprite(ctx, e, sprite, e.color);
        });

        // Bullets (Keep simple for visibility/performance)
        bulletsRef.current.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
            ctx.shadowBlur = 0;
        });

        // Particles
        particlesRef.current.forEach(part => {
            ctx.fillStyle = part.color;
            ctx.globalAlpha = part.life / part.maxLife;
            ctx.beginPath();
            ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    };

    const loop = () => {
        update();
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, gameOver, wave, showTutorial]);

    // Input Handling
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (showTutorial) return;
        resumeAudio();
        if (!isPlaying && !gameOver) setIsPlaying(true);
        isTouchingRef.current = true;
        updateTouchPos(e);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isTouchingRef.current || showTutorial) return;
        updateTouchPos(e);
    };

    const handleTouchEnd = () => {
        isTouchingRef.current = false;
        touchXRef.current = null; // Stop moving
    };

    const updateTouchPos = (e: React.TouchEvent | React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX;
        // @ts-ignore
        if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
        // @ts-ignore
        else clientX = (e as React.MouseEvent).clientX;
        
        const relativeX = clientX - rect.left;
        const scaleX = CANVAS_WIDTH / rect.width;
        touchXRef.current = relativeX * scaleX;
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4">
            {/* Ambient Light */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="invaders" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] pr-2 pb-1">NEON INVADERS</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-rose-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-xl font-mono font-bold text-white">{score}</span></div>
                <div className="text-rose-400 font-bold tracking-widest text-sm">VAGUE {wave}</div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{Math.max(score, highScore)}</span></div>
            </div>
            
            {/* Game Canvas */}
            <div 
                className="relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-rose-500/30 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] overflow-hidden backdrop-blur-md z-10 cursor-crosshair"
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full"
                />

                {!isPlaying && !gameOver && !showTutorial && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
                        <p className="text-rose-400 font-bold tracking-widest animate-pulse mb-2">GLISSEZ POUR TIRER</p>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 animate-in zoom-in fade-in">
                        <h2 className="text-5xl font-black text-red-500 italic mb-2 drop-shadow-[0_0_10px_red]">DÉTRUIT !</h2>
                        <div className="text-center mb-6">
                            <p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p>
                            <p className="text-4xl font-mono text-white">{score}</p>
                        </div>
                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        <button onClick={resetGame} className="px-8 py-3 bg-rose-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2 pointer-events-auto">
                            <RefreshCw size={20} /> REJOUER
                        </button>
                    </div>
                )}
            </div>
            
            {/* Lives Indicator */}
            <div className="flex gap-2 mt-4 z-10">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-8 h-2 rounded-full ${i < lives ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-gray-800'}`} />
                ))}
            </div>
        </div>
    );
};
