
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface RunnerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 350;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const BASE_SPEED = 5;
const MAX_SPEED = 12;

interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    grounded: boolean;
    color: string;
    rotation: number;
}

interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'block' | 'spike' | 'drone';
    passed: boolean;
}

interface CoinEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    collected: boolean;
    offsetY: number; // For floating animation
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

export const RunnerGame: React.FC<RunnerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { playMove, playGameOver, playCoin, playExplosion, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.runner || 0;

    // Game State Refs
    const playerRef = useRef<Player>({ x: 100, y: GROUND_HEIGHT - 40, width: 30, height: 30, dy: 0, grounded: true, color: '#00f3ff', rotation: 0 });
    const obstaclesRef = useRef<Obstacle[]>([]);
    const coinsRef = useRef<CoinEntity[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const speedRef = useRef(BASE_SPEED);
    const frameRef = useRef(0);
    const scoreRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    
    // Refs for props to avoid stale closures in game loop
    const addCoinsRef = useRef(addCoins);
    const onReportProgressRef = useRef(onReportProgress);
    
    useEffect(() => { addCoinsRef.current = addCoins; }, [addCoins]);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    const resetGame = useCallback(() => {
        playerRef.current = { x: 100, y: GROUND_HEIGHT - 40, width: 30, height: 30, dy: 0, grounded: true, color: '#00f3ff', rotation: 0 };
        obstaclesRef.current = [];
        coinsRef.current = [];
        particlesRef.current = [];
        speedRef.current = BASE_SPEED;
        scoreRef.current = 0;
        frameRef.current = 0;
        setScore(0);
        setGameOver(false);
        setIsPlaying(false);
        setEarnedCoins(0);
        
        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
    }, []);

    useEffect(() => {
        resetGame();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [resetGame]);

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30 + Math.random() * 20,
                color,
                size: Math.random() * 4 + 1
            });
        }
    };

    const handleJump = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
        if (e && e.type !== 'keydown') {
            e.stopPropagation();
        }

        if (gameOver) return;
        
        if (!isPlaying) {
            setIsPlaying(true);
            resumeAudio();
            return;
        }

        const p = playerRef.current;
        if (p.grounded) {
            p.dy = JUMP_FORCE;
            p.grounded = false;
            playMove(); 
            spawnParticles(p.x + p.width/2, p.y + p.height, '#fff', 5);
        }
    }, [gameOver, isPlaying, playMove, resumeAudio]);

    const update = () => {
        if (!isPlaying || gameOver) return;

        frameRef.current++;
        const p = playerRef.current;

        // --- PLAYER PHYSICS ---
        p.dy += GRAVITY;
        p.y += p.dy;

        // Ground Collision
        if (p.y + p.height > GROUND_HEIGHT) {
            p.y = GROUND_HEIGHT - p.height;
            p.dy = 0;
            p.grounded = true;
            p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            p.rotation += 0.1;
        }

        // --- SPEED PROGRESSION ---
        if (frameRef.current % 300 === 0) {
            speedRef.current = Math.min(MAX_SPEED, speedRef.current + 0.2);
        }

        // --- SPAWN LOGIC ---
        const minGap = (speedRef.current * 40); 
        
        // Obstacles
        if (obstaclesRef.current.length === 0 || (CANVAS_WIDTH - obstaclesRef.current[obstaclesRef.current.length - 1].x > minGap + Math.random() * 200)) {
            if (Math.random() < 0.05) {
                const typeRand = Math.random();
                let type: 'block' | 'spike' | 'drone' = 'block';
                let w = 40, h = 40, y = GROUND_HEIGHT - 40;

                if (typeRand > 0.7) {
                    type = 'drone'; 
                    w = 30; h = 20; 
                    y = GROUND_HEIGHT - 50 - Math.random() * 60; 
                } else if (typeRand > 0.4) {
                    type = 'spike';
                    w = 30; h = 30;
                    y = GROUND_HEIGHT - 30;
                }

                obstaclesRef.current.push({ x: CANVAS_WIDTH, y, width: w, height: h, type, passed: false });
            }
        }

        // Coins
        if (Math.random() < 0.03) {
            const lastCoin = coinsRef.current[coinsRef.current.length - 1];
            // Ensure spacing
            if (!lastCoin || CANVAS_WIDTH - lastCoin.x > 30) {
                const isGround = Math.random() > 0.6;
                const y = isGround ? GROUND_HEIGHT - 40 : GROUND_HEIGHT - 120;
                
                // Avoid spawning inside latest obstacle
                const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
                let safe = true;
                if (lastObs && CANVAS_WIDTH - lastObs.x < 60 && Math.abs(y - lastObs.y) < 50) safe = false;

                if (safe) {
                    coinsRef.current.push({ 
                        x: CANVAS_WIDTH, 
                        y, 
                        width: 24, 
                        height: 24, 
                        collected: false,
                        offsetY: Math.random() * Math.PI 
                    });
                }
            }
        }

        // --- UPDATE & COLLISION ---
        
        // Obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obs = obstaclesRef.current[i];
            obs.x -= speedRef.current;

            if (obs.x + obs.width < 0) {
                obstaclesRef.current.splice(i, 1);
                continue;
            }

            if (!obs.passed && obs.x + obs.width < p.x) {
                obs.passed = true;
                scoreRef.current += 10;
                setScore(scoreRef.current);
            }

            const padding = 6;
            if (
                p.x + padding < obs.x + obs.width - padding &&
                p.x + p.width - padding > obs.x + padding &&
                p.y + padding < obs.y + obs.height - padding &&
                p.y + p.height - padding > obs.y + padding
            ) {
                setGameOver(true);
                playExplosion();
                playGameOver();
                spawnParticles(p.x + p.width/2, p.y + p.height/2, p.color, 30);
                
                updateHighScore('runner', scoreRef.current);
                // Bonus coins based on score
                const bonusCoins = Math.floor(scoreRef.current / 50);
                // We display total collected + bonus
                // Current collected coins are already in earnedCoins state via setEarnedCoins
                // We just add bonus to wallet here (collected ones added instantly)
                if (bonusCoins > 0) {
                    addCoinsRef.current(bonusCoins);
                    // Update display to show Total (Collected + Bonus)
                    setEarnedCoins(prev => prev + bonusCoins);
                }
                
                if (onReportProgressRef.current) onReportProgressRef.current('score', scoreRef.current);
            }
        }

        // Coins
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
            const coin = coinsRef.current[i];
            coin.x -= speedRef.current;

            if (coin.x + coin.width < 0) {
                coinsRef.current.splice(i, 1);
                continue;
            }

            if (!coin.collected) {
                if (
                    p.x < coin.x + coin.width &&
                    p.x + p.width > coin.x &&
                    p.y < coin.y + coin.height &&
                    p.y + p.height > coin.y
                ) {
                    coin.collected = true;
                    playCoin();
                    spawnParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#facc15', 8);
                    setEarnedCoins(prev => prev + 1);
                    addCoinsRef.current(1);
                }
            }
            
            if (coin.collected) {
                coinsRef.current.splice(i, 1);
            }
        }

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const part = particlesRef.current[i];
            part.x += part.vx;
            part.y += part.vy;
            part.life--;
            if (part.life <= 0) particlesRef.current.splice(i, 1);
        }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.15)';
        ctx.lineWidth = 2;
        const gridOffset = (frameRef.current * speedRef.current * 0.5) % 100;
        
        ctx.beginPath();
        for(let i=0; i<CANVAS_HEIGHT; i+=50) { ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); }
        for(let i= -gridOffset; i<CANVAS_WIDTH; i+=100) { ctx.moveTo(i, GROUND_HEIGHT); ctx.lineTo((i - CANVAS_WIDTH/2)*4 + CANVAS_WIDTH/2, CANVAS_HEIGHT); }
        ctx.stroke();

        // Ground
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_HEIGHT);
        ctx.lineTo(CANVAS_WIDTH, GROUND_HEIGHT);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            if (obs.type === 'spike') {
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + obs.height);
                ctx.lineTo(obs.x + obs.width/2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.fill();
            } else if (obs.type === 'drone') {
                ctx.fillStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillStyle = '#000';
                ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
            } else {
                ctx.fillStyle = '#a855f7';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;
        });

        // Coins
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const floatY = Math.sin(frameRef.current * 0.1 + coin.offsetY) * 5;
            const cx = coin.x + coin.width/2;
            const cy = coin.y + coin.height/2 + floatY;
            
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', cx, cy + 1);
        });

        // Player
        if (!gameOver) {
            const p = playerRef.current;
            ctx.save();
            ctx.translate(p.x + p.width/2, p.y + p.height/2);
            ctx.rotate(p.rotation);
            
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-p.width/4, -p.height/4, p.width/2, p.height/2);
            ctx.restore();
        }

        // Particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    };

    const loop = useCallback(() => {
        update();
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    }, [isPlaying, gameOver]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loop]);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault(); // Prevent scrolling
                handleJump(e);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleJump]);

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4"
            onMouseDown={handleJump}
            onTouchStart={handleJump}
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)] pr-2 pb-1">NEON RUN</h1>
                </div>
                <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{Math.floor(score)}</span></div>
                {/* Coin Counter */}
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                    <Coins className="text-yellow-400" size={16} />
                    <span className="text-yellow-100 font-bold font-mono">{earnedCoins}</span>
                </div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-2xl font-mono font-bold text-yellow-400">{Math.max(Math.floor(score), highScore)}</span></div>
            </div>

            {/* Game Container */}
            <div className="relative w-full max-w-2xl aspect-[2/1] bg-black/80 border-2 border-orange-500/30 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.2)] overflow-hidden backdrop-blur-md z-10 cursor-pointer">
                <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full object-contain"
                />

                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
                        <Zap size={48} className="text-orange-400 animate-pulse mb-2"/>
                        <p className="text-orange-400 font-bold tracking-widest animate-pulse">APPUYEZ POUR SAUTER</p>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md z-30 animate-in zoom-in fade-in p-6">
                        <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-orange-600 mb-6 italic drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]">CRASH !</h2>
                        
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/10 mb-6 w-full max-w-[200px] text-center backdrop-blur-sm">
                            <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">SCORE FINAL</p>
                            <p className="text-4xl font-mono text-white drop-shadow-md">{Math.floor(score)}</p>
                        </div>

                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); resetGame(); }} 
                            className="px-8 py-3 bg-orange-500 text-black font-black tracking-widest text-lg rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2 pointer-events-auto"
                        >
                            <RefreshCw size={20} /> REJOUER
                        </button>
                    </div>
                )}
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">Évitez les obstacles. Collectez des pièces. Survivez.</p>
        </div>
    );
};
