
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency, Mallet } from '../../hooks/useCurrency';

interface AirHockeyGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

// --- TYPES ---
interface Entity {
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    color: string;
}
type GameState = 'start' | 'playing' | 'scored' | 'gameOver';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// --- CONSTANTS ---
const TABLE_WIDTH = 400;
const TABLE_HEIGHT = 600;
const PUCK_RADIUS = 15;
const MALLET_RADIUS = 25;
const GOAL_WIDTH = 120;
const MAX_SCORE = 7;
const PUCK_FRICTION = 0.995;
const PUCK_MAX_SPEED = 15;

const DIFFICULTY_SETTINGS = {
    EASY: { speed: 3, accuracy: 0.6, prediction: 0 },
    MEDIUM: { speed: 5, accuracy: 0.85, prediction: 0.5 },
    HARD: { speed: 7, accuracy: 0.98, prediction: 1.0 },
};

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({ onBack, audio, addCoins }) => {
    const { currentMalletId, malletsCatalog } = useCurrency();
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState({ player: 0, cpu: 0 });
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [winner, setWinner] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { playPaddleHit, playWallHit, playGoalScore, playVictory, playGameOver, resumeAudio } = audio;

    // --- GAME OBJECT REFS ---
    const puckRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' });
    const playerMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#00f3ff' });
    const cpuMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#ffe600' });
    const animationFrameRef = useRef<number>(0);
    const mousePosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const lastPlayerPosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    
    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        setScore({ player: 0, cpu: 0 });
        setWinner(null);
        setEarnedCoins(0);
        resetRound(true);
        setGameState('playing');
        resumeAudio();
    };

    const resetRound = (isFirstPlayerServe: boolean) => {
        puckRef.current = {
            x: TABLE_WIDTH / 2,
            y: isFirstPlayerServe ? TABLE_HEIGHT / 2 + 100 : TABLE_HEIGHT / 2 - 100,
            vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
        };
        playerMalletRef.current.x = TABLE_WIDTH / 2;
        playerMalletRef.current.y = TABLE_HEIGHT - 100;
        cpuMalletRef.current.x = TABLE_WIDTH / 2;
        cpuMalletRef.current.y = 100;
        setGameState('playing');
    };

    const handleGoal = (isPlayerGoal: boolean) => {
        setGameState('scored');
        
        setScore(prevScore => {
            const newScore = { ...prevScore };
            if (isPlayerGoal) {
                newScore.player += 1;
                playGoalScore();
            } else {
                newScore.cpu += 1;
                playGameOver();
            }

            if (newScore.player >= MAX_SCORE || newScore.cpu >= MAX_SCORE) {
                setWinner(newScore.player >= MAX_SCORE ? 'Player' : 'CPU');
                setGameState('gameOver');
                
                if (newScore.player >= MAX_SCORE) {
                    playVictory();
                    const reward = 50 + (difficulty === 'MEDIUM' ? 25 : difficulty === 'HARD' ? 50 : 0);
                    addCoins(reward);
                    setEarnedCoins(reward);
                }
            } else {
                setTimeout(() => resetRound(!isPlayerGoal), 2000);
            }

            return newScore;
        });
    };

    const updateAI = () => {
        const cpu = cpuMalletRef.current;
        const puck = puckRef.current;
        const { speed, accuracy, prediction } = DIFFICULTY_SETTINGS[difficulty];

        let targetX = TABLE_WIDTH / 2;
        let targetY = 100; 

        if (puck.y < TABLE_HEIGHT / 2 && (Math.abs(puck.vy) < 2 || puck.vy > 0)) {
             targetX = puck.x;
             targetY = puck.y;
        } 
        else if (puck.vy < 0) { 
            const timeToReach = (puck.y - targetY) / Math.abs(puck.vy);
            let predictedX = puck.x + (puck.vx * timeToReach);

            if (predictedX < 0) predictedX = -predictedX;
            if (predictedX > TABLE_WIDTH) predictedX = 2 * TABLE_WIDTH - predictedX;
            
            if (predictedX < 0) predictedX = 0;
            if (predictedX > TABLE_WIDTH) predictedX = TABLE_WIDTH;

            targetX = (predictedX * prediction) + (puck.x * (1 - prediction));
        } else {
            if (puck.y > TABLE_HEIGHT / 2) {
                targetX = (TABLE_WIDTH / 2 + puck.x) / 2;
            }
        }

        const errorMag = (1 - accuracy) * 80;
        const timeFactor = Date.now() / 400; 
        const currentError = Math.sin(timeFactor) * errorMag;
        
        targetX += currentError;

        const dx = targetX - cpu.x;
        const dy = targetY - cpu.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            const angle = Math.atan2(dy, dx);
            cpu.vx = Math.cos(angle) * speed;
            cpu.vy = Math.sin(angle) * speed;
        } else {
            cpu.vx = 0;
            cpu.vy = 0;
        }

        cpu.x += cpu.vx;
        cpu.y += cpu.vy;

        const maxY = (TABLE_HEIGHT / 2) - cpu.radius; 
        cpu.y = Math.max(cpu.radius, Math.min(maxY, cpu.y));
        cpu.x = Math.max(cpu.radius, Math.min(TABLE_WIDTH - cpu.radius, cpu.x));
    };

    const drawMallet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, malletStyle?: Mallet, isCpu: boolean = false) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (isCpu) {
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            return;
        }

        if (!malletStyle || malletStyle.type === 'basic') {
            ctx.fillStyle = malletStyle?.colors[0] || '#00f3ff';
            ctx.shadowColor = malletStyle?.colors[0] || '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if (malletStyle.type === 'gradient') {
            const grad = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            grad.addColorStop(0, malletStyle.colors[0]);
            grad.addColorStop(1, malletStyle.colors[1] || malletStyle.colors[0]);
            ctx.fillStyle = grad;
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (malletStyle.type === 'ring' || malletStyle.type === 'target') {
            ctx.fillStyle = malletStyle.colors[1] || '#000';
            ctx.fill();
            
            // Draw rings
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = malletStyle.colors[0];
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI);
            ctx.strokeStyle = malletStyle.colors[0];
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.2, 0, 2 * Math.PI);
            ctx.fillStyle = malletStyle.colors[0];
            ctx.fill();
            
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 15;
        } else if (malletStyle.type === 'flower') {
            ctx.fillStyle = malletStyle.colors[1]; // center color
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 10;
            
            // Draw petals
            const petalCount = 6;
            for(let i=0; i<petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const px = x + Math.cos(angle) * (radius * 0.6);
                const py = y + Math.sin(angle) * (radius * 0.6);
                ctx.beginPath();
                ctx.arc(px, py, radius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = malletStyle.colors[0];
                ctx.fill();
            }
            
            // Center
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = malletStyle.colors[1];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (malletStyle.type === 'complex') {
            const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
            const colors = malletStyle.colors;
            colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
            
            ctx.fillStyle = grad;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    };

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const puck = puckRef.current;
        const player = playerMalletRef.current;
        const cpu = cpuMalletRef.current;

        player.vx = player.x - lastPlayerPosRef.current.x;
        player.vy = player.y - lastPlayerPosRef.current.y;
        lastPlayerPosRef.current = { x: player.x, y: player.y };

        player.x += (mousePosRef.current.x - player.x) * 0.4;
        player.y += (mousePosRef.current.y - player.y) * 0.4;

        updateAI();

        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= PUCK_FRICTION;
        puck.vy *= PUCK_FRICTION;

        if (puck.x < puck.radius || puck.x > TABLE_WIDTH - puck.radius) {
            puck.vx *= -1;
            puck.x = puck.x < puck.radius ? puck.radius : TABLE_WIDTH - puck.radius;
            playWallHit();
        }

        const goalYTop = 0;
        const goalYBottom = TABLE_HEIGHT;
        const goalMinX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
        const goalMaxX = (TABLE_WIDTH + GOAL_WIDTH) / 2;

        if (puck.x > goalMinX && puck.x < goalMaxX) {
            if (puck.y < goalYTop) handleGoal(true);
            if (puck.y > goalYBottom) handleGoal(false);
        } else {
            if (puck.y < puck.radius) {
                puck.vy *= -1;
                puck.y = puck.radius;
                playWallHit();
            }
            if (puck.y > TABLE_HEIGHT - puck.radius) {
                puck.vy *= -1;
                puck.y = TABLE_HEIGHT - puck.radius;
                playWallHit();
            }
        }

        [player, cpu].forEach(mallet => {
            const dx = puck.x - mallet.x;
            const dy = puck.y - mallet.y;
            let distance = Math.hypot(dx, dy);
            if (distance === 0) distance = 0.01;

            const min_dist = puck.radius + mallet.radius;
            
            if (distance < min_dist) {
                playPaddleHit();
                const nx = dx / distance;
                const ny = dy / distance;
                const overlap = min_dist - distance;
                puck.x += nx * overlap;
                puck.y += ny * overlap;

                const vRelX = puck.vx - mallet.vx;
                const vRelY = puck.vy - mallet.vy;
                const velAlongNormal = vRelX * nx + vRelY * ny;

                if (velAlongNormal < 0) {
                    const restitution = 1.0; 
                    const impulse = -(1 + restitution) * velAlongNormal;
                    puck.vx += impulse * nx;
                    puck.vy += impulse * ny;
                }
                
                const speed = Math.hypot(puck.vx, puck.vy);
                if (speed > PUCK_MAX_SPEED) {
                    const ratio = PUCK_MAX_SPEED / speed;
                    puck.vx *= ratio;
                    puck.vy *= ratio;
                }
            }
        });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(0, TABLE_HEIGHT / 2);
        ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 50, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.moveTo(goalMinX, 0); ctx.lineTo(goalMaxX, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(goalMinX, TABLE_HEIGHT); ctx.lineTo(goalMaxX, TABLE_HEIGHT); ctx.stroke();

        ctx.shadowBlur = 0; 

        // Draw Puck
        ctx.beginPath();
        ctx.arc(puck.x, puck.y, puck.radius, 0, 2 * Math.PI);
        ctx.fillStyle = puck.color;
        ctx.shadowColor = puck.color;
        ctx.shadowBlur = 20;
        ctx.fill();

        // Draw Player Mallet (Custom Style)
        const playerMalletStyle = malletsCatalog.find(m => m.id === currentMalletId);
        drawMallet(ctx, player.x, player.y, player.radius, playerMalletStyle, false);

        // Draw CPU Mallet (Default)
        drawMallet(ctx, cpu.x, cpu.y, cpu.radius, undefined, true);
        
        ctx.shadowBlur = 0;

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, difficulty, currentMalletId, malletsCatalog]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameLoop]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mousePosRef.current = {
            x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
            y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
        };
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        mousePosRef.current = {
            x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
            y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
        };
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        resumeAudio();
        handleTouchMove(e);
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            <div className="w-full max-w-md flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex items-center gap-4 font-black text-2xl">
                    <span className="text-neon-blue">{score.player}</span>
                    <span className="text-white text-lg">VS</span>
                    <span className="text-neon-yellow">{score.cpu}</span>
                </div>
                <button onClick={() => { setGameState('start'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            <div 
                className="relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden cursor-none"
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT} className="w-full h-full" />
                
                {gameState === 'start' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                        <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#00f3ff]">AIR HOCKEY</h1>
                        <p className="text-gray-400 mb-8 text-xs tracking-widest">PREMIER À 7 POINTS</p>
                        
                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                            <button onClick={() => startGame('EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                            <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                            <button onClick={() => startGame('HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
                        </div>
                    </div>
                )}
                
                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in">
                        {winner === 'Player' ? (
                            <>
                                <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                                <h2 className="text-4xl font-black text-white mb-2">VICTOIRE !</h2>
                                {earnedCoins > 0 && <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                            </>
                        ) : (
                            <h2 className="text-4xl font-black text-red-500 mb-6">DÉFAITE</h2>
                        )}
                        <button onClick={() => startGame(difficulty)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg mb-4">REJOUER</button>
                        <button onClick={onBack} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">QUITTER</button>
                    </div>
                )}
            </div>
        </div>
    );
};
