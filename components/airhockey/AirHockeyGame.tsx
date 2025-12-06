
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Users, User } from 'lucide-react';
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
type GameState = 'menu' | 'difficulty_select' | 'playing' | 'scored' | 'gameOver';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type GameMode = 'SINGLE' | 'LOCAL_VS';

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
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
    const [score, setScore] = useState({ player: 0, opponent: 0 });
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [winner, setWinner] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { playPaddleHit, playWallHit, playGoalScore, playVictory, playGameOver, resumeAudio } = audio;

    // --- GAME OBJECT REFS ---
    const puckRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' });
    const playerMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#00f3ff' });
    const opponentMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#ffe600' });
    
    const animationFrameRef = useRef<number>(0);
    
    // Input Refs (Targets for smoothing)
    const p1TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const p2TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Physics State Refs (Previous positions for velocity calc)
    const lastP1PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const lastP2PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    const selectMode = (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'SINGLE') {
            setGameState('difficulty_select');
        } else {
            startGame('MEDIUM', 'LOCAL_VS'); // Difficulty doesn't matter for VS
        }
    };

    const startGame = (diff: Difficulty, mode: GameMode = 'SINGLE') => {
        setDifficulty(diff);
        setGameMode(mode);
        setScore({ player: 0, opponent: 0 });
        setWinner(null);
        setEarnedCoins(0);
        resetRound(true);
        setGameState('playing');
        resumeAudio();
    };

    const resetRound = (isBottomServe: boolean) => {
        puckRef.current = {
            x: TABLE_WIDTH / 2,
            y: isBottomServe ? TABLE_HEIGHT / 2 + 50 : TABLE_HEIGHT / 2 - 50,
            vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
        };
        // Reset positions
        playerMalletRef.current.x = TABLE_WIDTH / 2;
        playerMalletRef.current.y = TABLE_HEIGHT - 100;
        opponentMalletRef.current.x = TABLE_WIDTH / 2;
        opponentMalletRef.current.y = 100;
        
        // Reset targets
        p1TargetRef.current = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 };
        p2TargetRef.current = { x: TABLE_WIDTH / 2, y: 100 };
        
        setGameState('playing');
    };

    const handleGoal = (isBottomGoal: boolean) => {
        // isBottomGoal means the ball went into the bottom goal -> Top Player (Opponent) scores
        setGameState('scored');
        
        setScore(prevScore => {
            const newScore = { ...prevScore };
            if (isBottomGoal) {
                newScore.opponent += 1;
                // Sound: Negative for P1 in Single, Neutral/Positive in VS
                if (gameMode === 'SINGLE') playGameOver(); else playGoalScore(); 
            } else {
                newScore.player += 1;
                playGoalScore();
            }

            if (newScore.player >= MAX_SCORE || newScore.opponent >= MAX_SCORE) {
                const p1Wins = newScore.player >= MAX_SCORE;
                
                if (gameMode === 'SINGLE') {
                    setWinner(p1Wins ? 'Player' : 'CPU');
                } else {
                    setWinner(p1Wins ? 'J1' : 'J2');
                }
                
                setGameState('gameOver');
                
                if (p1Wins) {
                    playVictory();
                    // Coins only in single player to prevent farming
                    if (gameMode === 'SINGLE') {
                        const reward = 50 + (difficulty === 'MEDIUM' ? 25 : difficulty === 'HARD' ? 50 : 0);
                        addCoins(reward);
                        setEarnedCoins(reward);
                    }
                } else {
                    if (gameMode === 'SINGLE') playGameOver(); else playVictory();
                }
            } else {
                // Determine who serves next: The one who got scored ON serves.
                // If Bottom Goal (Top Scored), Bottom Serves (true)
                // If Top Goal (Bottom Scored), Top Serves (false)
                setTimeout(() => resetRound(isBottomGoal), 1500);
            }

            return newScore;
        });
    };

    const updateAI = () => {
        const cpu = opponentMalletRef.current;
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

            // Simple bounce prediction
            if (predictedX < 0) predictedX = -predictedX;
            if (predictedX > TABLE_WIDTH) predictedX = 2 * TABLE_WIDTH - predictedX;
            
            // Clamp
            if (predictedX < 0) predictedX = 0;
            if (predictedX > TABLE_WIDTH) predictedX = TABLE_WIDTH;

            targetX = (predictedX * prediction) + (puck.x * (1 - prediction));
        } else {
            // Retreat to center
            if (puck.y > TABLE_HEIGHT / 2) {
                targetX = (TABLE_WIDTH / 2 + puck.x) / 2;
            }
        }

        // Add human error
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

        // Constraints for AI
        const maxY = (TABLE_HEIGHT / 2) - cpu.radius; 
        cpu.y = Math.max(cpu.radius, Math.min(maxY, cpu.y));
        cpu.x = Math.max(cpu.radius, Math.min(TABLE_WIDTH - cpu.radius, cpu.x));
    };

    const drawMallet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, malletStyle?: Mallet, isOpponent: boolean = false) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (isOpponent) {
            // CPU = Yellow, Player 2 = Red
            const color = gameMode === 'LOCAL_VS' ? '#ff0055' : '#ffe600';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // P2 Indicator
            if (gameMode === 'LOCAL_VS') {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(x, y, radius * 0.5, 0, 2*Math.PI);
                ctx.fill();
            }
            return;
        }

        // --- PLAYER 1 DRAWING (Customizable) ---
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
            ctx.fillStyle = malletStyle.colors[1];
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 10;
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
        const opponent = opponentMalletRef.current;

        // --- UPDATE PADDLES FROM INPUTS (Smoothing) ---
        // Player 1 (Bottom)
        player.vx = player.x - lastP1PosRef.current.x;
        player.vy = player.y - lastP1PosRef.current.y;
        lastP1PosRef.current = { x: player.x, y: player.y };

        player.x += (p1TargetRef.current.x - player.x) * 0.4;
        player.y += (p1TargetRef.current.y - player.y) * 0.4;

        // Player 2 / CPU (Top)
        if (gameMode === 'SINGLE') {
            updateAI();
        } else {
            // Local VS: Update P2 from touch input
            opponent.vx = opponent.x - lastP2PosRef.current.x;
            opponent.vy = opponent.y - lastP2PosRef.current.y;
            lastP2PosRef.current = { x: opponent.x, y: opponent.y };

            opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
            opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;
        }

        // --- PHYSICS ---
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= PUCK_FRICTION;
        puck.vy *= PUCK_FRICTION;

        // Wall Collisions
        if (puck.x < puck.radius || puck.x > TABLE_WIDTH - puck.radius) {
            puck.vx *= -1;
            puck.x = puck.x < puck.radius ? puck.radius : TABLE_WIDTH - puck.radius;
            playWallHit();
        }

        const goalYTop = 0;
        const goalYBottom = TABLE_HEIGHT;
        const goalMinX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
        const goalMaxX = (TABLE_WIDTH + GOAL_WIDTH) / 2;

        // Goal Detection
        if (puck.x > goalMinX && puck.x < goalMaxX) {
            if (puck.y < goalYTop) handleGoal(false); // Top Goal -> Player scored
            if (puck.y > goalYBottom) handleGoal(true); // Bottom Goal -> Opponent scored
        } else {
            // Top/Bottom Wall Bounce
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

        // Mallet Collisions
        [player, opponent].forEach(mallet => {
            const dx = puck.x - mallet.x;
            const dy = puck.y - mallet.y;
            let distance = Math.hypot(dx, dy);
            if (distance === 0) distance = 0.01;

            const min_dist = puck.radius + mallet.radius;
            
            // Collision Handling
            if (distance < min_dist) {
                // Resolve Overlap
                const nx = dx / distance;
                const ny = dy / distance;
                const overlap = min_dist - distance;
                
                // Move puck out instantly (Physics Fix)
                puck.x += nx * overlap;
                puck.y += ny * overlap;

                // Bounce Logic
                const vRelX = puck.vx - mallet.vx;
                const vRelY = puck.vy - mallet.vy;
                const velAlongNormal = vRelX * nx + vRelY * ny;

                if (velAlongNormal < 0) {
                    playPaddleHit();
                    const restitution = 1.0; 
                    const impulse = -(1 + restitution) * velAlongNormal;
                    puck.vx += impulse * nx;
                    puck.vy += impulse * ny;
                }
                
                // Cap Max Speed
                const speed = Math.hypot(puck.vx, puck.vy);
                if (speed > PUCK_MAX_SPEED) {
                    const ratio = PUCK_MAX_SPEED / speed;
                    puck.vx *= ratio;
                    puck.vy *= ratio;
                }
            }
        });

        // --- RENDER ---
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        // Board
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

        // Center Lines
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

        // Goals
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

        // Draw Opponent Mallet (Default or P2 Style)
        drawMallet(ctx, opponent.x, opponent.y, opponent.radius, undefined, true);
        
        ctx.shadowBlur = 0;

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, difficulty, currentMalletId, malletsCatalog, gameMode]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameLoop]);

    // --- INPUT HANDLING ---

    const updateTargets = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // Player 1 (Bottom Half)
        if (y > TABLE_HEIGHT / 2) {
            p1TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
            };
        }
        // Player 2 (Top Half - VS Mode Only)
        else if (gameMode === 'LOCAL_VS') {
            p2TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(MALLET_RADIUS, Math.min(TABLE_HEIGHT / 2 - MALLET_RADIUS, y)),
            };
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // Allow mouse debugging for P2 if on top half in VS mode
        updateTargets(e.clientX, e.clientY);
    }, [gameMode]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!canvasRef.current) return;
        e.preventDefault(); // Prevent scrolling
        
        // Handle Multi-touch
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            updateTargets(touch.clientX, touch.clientY);
        }
    }, [gameMode]);

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
                    <span className={gameMode === 'SINGLE' ? "text-neon-yellow" : "text-pink-500"}>{score.opponent}</span>
                </div>
                <button onClick={() => { setGameState('menu'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            <div 
                className={`relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden cursor-none ${gameMode === 'LOCAL_VS' ? 'border-pink-500/30' : ''}`}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT} className="w-full h-full" />
                
                {/* MENU PRINCIPAL */}
                {gameState === 'menu' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                        <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#00f3ff]">AIR HOCKEY</h1>
                        
                        <div className="flex flex-col gap-4 w-full max-w-[240px] mt-8">
                            <button onClick={() => selectMode('SINGLE')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                <User size={20} className="text-neon-blue"/> 1 JOUEUR
                            </button>
                            <button onClick={() => selectMode('LOCAL_VS')} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                <Users size={20} className="text-pink-500"/> 2 JOUEURS (VS)
                            </button>
                        </div>
                    </div>
                )}

                {/* SELECTEUR DIFFICULTÉ (SOLO UNIQUEMENT) */}
                {gameState === 'difficulty_select' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                        <h2 className="text-3xl font-black text-white mb-6">DIFFICULTÉ</h2>
                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                            <button onClick={() => startGame('EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                            <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                            <button onClick={() => startGame('HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
                        </div>
                        <button onClick={() => setGameState('menu')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
                    </div>
                )}
                
                {/* GAME OVER */}
                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in">
                        {gameMode === 'SINGLE' ? (
                            winner === 'Player' ? (
                                <>
                                    <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                                    <h2 className="text-4xl font-black text-white mb-2">VICTOIRE !</h2>
                                    {earnedCoins > 0 && <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                                </>
                            ) : (
                                <h2 className="text-4xl font-black text-red-500 mb-6">DÉFAITE</h2>
                            )
                        ) : (
                            <>
                                <Trophy size={64} className={winner === 'J1' ? "text-neon-blue" : "text-pink-500"} />
                                <h2 className="text-4xl font-black text-white mb-2 mt-4">{winner === 'J1' ? 'JOUEUR 1' : 'JOUEUR 2'} GAGNE !</h2>
                            </>
                        )}
                        
                        <div className="flex flex-col gap-3 mt-4">
                            <button onClick={() => startGame(difficulty, gameMode)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg">REJOUER</button>
                            <button onClick={onBack} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">QUITTER</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
