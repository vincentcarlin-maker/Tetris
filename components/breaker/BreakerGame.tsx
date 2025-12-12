
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Heart, Trophy, Play, Coins, ArrowLeft, Lock, RefreshCw, HelpCircle, MoveHorizontal, MousePointerClick, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { GameState, Block, Ball, Paddle, PowerUp, PowerUpType, Laser } from './types';
import { getLevelLayout, TOTAL_BREAKER_LEVELS } from './levels';
import { drawBall, drawBlocks, drawPaddle, drawParticles, createParticles, BLOCK_COLORS, INDESTRUCTIBLE_COLOR, drawPowerUp, drawLasers } from './helpers';
import { TutorialOverlay } from '../Tutorials';

interface BreakerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PADDLE_DEFAULT_WIDTH = 100;

export const BreakerGame: React.FC<BreakerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number>(0);
    
    // View State
    const [view, setView] = useState<'LEVEL_SELECT' | 'GAME'>('LEVEL_SELECT');
    
    // Progression State
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
        return parseInt(localStorage.getItem('breaker-max-level') || '1', 10);
    });

    const [gameState, setGameState] = useState<GameState>('waitingToServe');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.breaker || 0;
    
    const { playPaddleHit, playBlockHit, playWallHit, playLoseLife, playVictory, playGameOver, playPowerUpSpawn, playPowerUpCollect, playLaserShoot, playMove, playLand, resumeAudio } = audio;
    
    // Game objects refs
    const paddleRef = useRef<Paddle>({ x: (GAME_WIDTH / 2) - PADDLE_DEFAULT_WIDTH / 2, width: PADDLE_DEFAULT_WIDTH, height: 15, hasLasers: false });
    const ballsRef = useRef<Ball[]>([]);
    const blocksRef = useRef<Block[]>([]);
    const particlesRef = useRef<any[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const lasersRef = useRef<Laser[]>([]);

    // Refs for power-up timers
    const paddleEffectTimeoutRef = useRef<any>(null);
    const ballSpeedEffectTimeoutRef = useRef<any>(null);
    const laserEffectTimeoutRef = useRef<any>(null);
    
    const lastLaserShotTime = useRef<number>(0);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_breaker_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_breaker_tutorial_seen', 'true');
        }
    }, []);

    const resetBallAndPaddle = useCallback(() => {
        // Clear any active power-up timers
        if (paddleEffectTimeoutRef.current) clearTimeout(paddleEffectTimeoutRef.current);
        if (ballSpeedEffectTimeoutRef.current) clearTimeout(ballSpeedEffectTimeoutRef.current);
        if (laserEffectTimeoutRef.current) clearTimeout(laserEffectTimeoutRef.current);

        paddleRef.current.width = PADDLE_DEFAULT_WIDTH;
        paddleRef.current.x = (GAME_WIDTH - PADDLE_DEFAULT_WIDTH) / 2;
        paddleRef.current.hasLasers = false;
        
        ballsRef.current = [{
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 60,
            dx: 3,
            dy: -3,
            radius: 8,
            status: 'normal',
        }];
        lasersRef.current = [];
    }, []);

    const loadLevel = useCallback((level: number) => {
        const layout = getLevelLayout(level);
        const newBlocks: Block[] = [];
        const blockRowCount = layout.length;
        const blockColCount = layout[0].length;
        const blockWidth = GAME_WIDTH / blockColCount;
        const blockHeight = 25;
        const blockPadding = 4;

        layout.forEach((row, r) => {
            row.forEach((type, c) => {
                if (type !== 0) {
                    newBlocks.push({
                        x: c * blockWidth + blockPadding / 2,
                        y: r * blockHeight + 50 + blockPadding / 2,
                        width: blockWidth - blockPadding,
                        height: blockHeight - blockPadding,
                        health: type === 'I' ? Infinity : Number(type),
                        color: type === 'I' ? INDESTRUCTIBLE_COLOR : BLOCK_COLORS[String(type)],
                        points: Number(type) * 10,
                        isIndestructible: type === 'I',
                    });
                }
            });
        });
        blocksRef.current = newBlocks;
    }, []);

    const startLevel = (lvl: number) => {
        if (showTutorial) return;
        setCurrentLevel(lvl);
        setScore(0);
        setLives(3);
        loadLevel(lvl);
        resetBallAndPaddle();
        setEarnedCoins(0);
        powerUpsRef.current = [];
        setGameState('waitingToServe');
        setView('GAME');
        resumeAudio();
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const handleLevelSelect = (lvl: number) => {
        if (lvl > maxUnlockedLevel) return;
        playLand();
        startLevel(lvl);
    };

    const handleRestart = () => {
        startLevel(currentLevel);
    };

    const handleLocalBack = () => {
        if (view === 'GAME') {
            setView('LEVEL_SELECT');
        } else {
            onBack();
        }
    };

    const serveBall = () => {
        if (gameState === 'waitingToServe' && !showTutorial) {
            setGameState('playing');
        }
    };

    const spawnPowerUp = (x: number, y: number) => {
        const types: PowerUpType[] = ['PADDLE_GROW', 'PADDLE_SHRINK', 'MULTI_BALL', 'BALL_FAST', 'BALL_SLOW', 'EXTRA_LIFE', 'LASER_PADDLE'];
        const weights = [3, 2, 2, 2, 3, 1, 2]; // Grow/Slow are more common, Life/Laser rare
        const weightedTypes: PowerUpType[] = [];
        types.forEach((type, i) => {
            for(let j=0; j<weights[i]; j++) weightedTypes.push(type);
        });

        const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
        powerUpsRef.current.push({ x, y, width: 30, height: 15, type, dy: 2 });
        playPowerUpSpawn(); // Play spawn sound
    };
    
    const activatePowerUp = (type: PowerUpType) => {
        playPowerUpCollect(type); // Play collect sound

        if (type === 'PADDLE_GROW' || type === 'PADDLE_SHRINK') {
            clearTimeout(paddleEffectTimeoutRef.current);
            paddleRef.current.width = type === 'PADDLE_GROW' ? 150 : 50;
            paddleEffectTimeoutRef.current = setTimeout(() => { paddleRef.current.width = PADDLE_DEFAULT_WIDTH; }, 10000);
        } else if (type === 'BALL_FAST' || type === 'BALL_SLOW') {
            clearTimeout(ballSpeedEffectTimeoutRef.current);
            const speedFactor = type === 'BALL_FAST' ? 1.3 : 0.7;
            ballsRef.current.forEach(b => { 
                if (b.status === 'normal') { // Prevents stacking effects
                    b.dx *= speedFactor; b.dy *= speedFactor;
                }
                b.status = type === 'BALL_FAST' ? 'fast' : 'slow';
            });
            ballSpeedEffectTimeoutRef.current = setTimeout(() => {
                 ballsRef.current.forEach(b => {
                     if (b.status !== 'normal') {
                        b.dx /= speedFactor; b.dy /= speedFactor;
                        b.status = 'normal';
                     }
                 });
            }, 8000);
        } else if (type === 'MULTI_BALL') {
            const sourceBall = ballsRef.current[0] || { x: paddleRef.current.x + paddleRef.current.width / 2, y: GAME_HEIGHT - 60, radius: 8, status: 'normal' };
            ballsRef.current.push({ ...sourceBall, dx: 2, dy: -3 });
            ballsRef.current.push({ ...sourceBall, dx: -2, dy: -3 });
        } else if (type === 'EXTRA_LIFE') {
            setLives(l => l + 1);
        } else if (type === 'LASER_PADDLE') {
            clearTimeout(laserEffectTimeoutRef.current);
            paddleRef.current.hasLasers = true;
            laserEffectTimeoutRef.current = setTimeout(() => { paddleRef.current.hasLasers = false; }, 10000);
        }
    };


    const gameTick = useCallback(() => {
        if (gameState !== 'playing' || showTutorial) return;

        const paddle = paddleRef.current;
        const blocks = blocksRef.current;
        const balls = ballsRef.current;
        const powerUps = powerUpsRef.current;
        const lasers = lasersRef.current;

        // Laser Logic
        if (paddle.hasLasers) {
            const now = Date.now();
            if (now - lastLaserShotTime.current > 500) { // Shoot every 500ms
                lasers.push({ x: paddle.x + 5, y: GAME_HEIGHT - 50, width: 4, height: 10, dy: -6, active: true });
                lasers.push({ x: paddle.x + paddle.width - 5, y: GAME_HEIGHT - 50, width: 4, height: 10, dy: -6, active: true });
                playLaserShoot();
                lastLaserShotTime.current = now;
            }
        }
        
        // Move Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.y += l.dy;
            if (l.y < 0) {
                lasers.splice(i, 1);
                continue;
            }
            // Check Collision with blocks
            for (let j = blocks.length - 1; j >= 0; j--) {
                const b = blocks[j];
                if (l.x > b.x && l.x < b.x + b.width && l.y > b.y && l.y < b.y + b.height) {
                    lasers.splice(i, 1); // Remove laser
                    playBlockHit();
                    if (!b.isIndestructible) {
                        b.health--;
                        setScore(s => s + b.points);
                        createParticles(particlesRef.current, l.x, l.y, b.color);
                         if (b.health <= 0) {
                             if (Math.random() < 0.25) spawnPowerUp(b.x + b.width / 2, b.y + b.height / 2);
                             blocks.splice(j, 1);
                         } else {
                             b.color = BLOCK_COLORS[String(b.health)];
                         }
                    }
                    break;
                }
            }
        }

        // Move and check collisions for power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            powerUp.y += powerUp.dy;

            const paddleY = GAME_HEIGHT - 40;
            if (powerUp.y + powerUp.height / 2 > paddleY &&
                powerUp.y - powerUp.height / 2 < paddleY + paddle.height &&
                powerUp.x > paddle.x &&
                powerUp.x < paddle.x + paddle.width) {
                activatePowerUp(powerUp.type);
                powerUps.splice(i, 1);
            } else if (powerUp.y - powerUp.height / 2 > GAME_HEIGHT) {
                powerUps.splice(i, 1);
            }
        }
        
        const ballsToRemove: number[] = [];
        balls.forEach((ball, ballIndex) => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collision
            if (ball.x + ball.radius >= GAME_WIDTH) { 
                ball.x = GAME_WIDTH - ball.radius; // Push out
                ball.dx = -Math.abs(ball.dx); // Force Left
                playWallHit(); 
            } else if (ball.x - ball.radius <= 0) { 
                ball.x = ball.radius; // Push out
                ball.dx = Math.abs(ball.dx); // Force Right
                playWallHit(); 
            }

            if (ball.y - ball.radius <= 0) { 
                ball.y = ball.radius; // Push out
                ball.dy = Math.abs(ball.dy); // Force Down
                playWallHit(); 
            }

            // Paddle collision
            const paddleY = GAME_HEIGHT - 40;
            if (ball.dy > 0 && // Only check if ball is moving down
                ball.y + ball.radius >= paddleY && 
                ball.y - ball.radius < paddleY + paddle.height &&
                ball.x >= paddle.x && 
                ball.x <= paddle.x + paddle.width) {
                
                // Push out of paddle
                ball.y = paddleY - ball.radius;
                ball.dy = -Math.abs(ball.dy); // Force Up

                let collidePoint = ball.x - (paddle.x + paddle.width / 2);
                ball.dx = collidePoint * 0.1;
                playPaddleHit();
            }

            // Block collision (Improved Logic)
            for (let i = blocks.length - 1; i >= 0; i--) {
                const block = blocks[i];
                
                // Find closes point on the block to the ball center
                const closestX = Math.max(block.x, Math.min(ball.x, block.x + block.width));
                const closestY = Math.max(block.y, Math.min(ball.y, block.y + block.height));
                
                const distX = ball.x - closestX;
                const distY = ball.y - closestY;
                const distanceSquared = (distX * distX) + (distY * distY);
                
                if (distanceSquared < (ball.radius * ball.radius)) {
                    // Collision Detected
                    playBlockHit();
                    
                    // Resolve Collision (Push out + Reflect)
                    // Determine overlap on axes
                    const overlapX = (ball.radius + block.width / 2) - Math.abs(ball.x - (block.x + block.width / 2));
                    const overlapY = (ball.radius + block.height / 2) - Math.abs(ball.y - (block.y + block.height / 2));
                    
                    if (overlapX < overlapY) {
                         // Hit vertical side
                         if (ball.x < block.x + block.width / 2) {
                             ball.x = block.x - ball.radius; // Hit Left
                         } else {
                             ball.x = block.x + block.width + ball.radius; // Hit Right
                         }
                         ball.dx = -ball.dx;
                    } else {
                        // Hit horizontal side
                        if (ball.y < block.y + block.height / 2) {
                            ball.y = block.y - ball.radius; // Hit Top
                        } else {
                            ball.y = block.y + block.height + ball.radius; // Hit Bottom
                        }
                        ball.dy = -ball.dy;
                    }

                    if (!block.isIndestructible) {
                        block.health--;
                        setScore(s => s + block.points);
                        createParticles(particlesRef.current, ball.x, ball.y, block.color);
                        if (block.health <= 0) {
                            if (Math.random() < 0.25) { // 25% chance
                                spawnPowerUp(block.x + block.width / 2, block.y + block.height / 2);
                            }
                            blocks.splice(i, 1);
                        } else {
                            block.color = BLOCK_COLORS[String(block.health)];
                        }
                    }
                    break; // Handle only one block collision per frame per ball
                }
            }
            
            // Bottom wall (lose ball)
            if (ball.y + ball.radius > GAME_HEIGHT) {
                ballsToRemove.push(ballIndex);
            }
        });
        
        // Remove lost balls
        for (let i = ballsToRemove.length - 1; i >= 0; i--) {
            balls.splice(ballsToRemove[i], 1);
        }

        // Check for life loss if all balls are gone
        if (balls.length === 0) {
            playLoseLife();
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState('gameOver');
                    playGameOver();
                    updateHighScore('breaker', score);
                    if (onReportProgress) onReportProgress('score', score);
                    const coins = Math.floor(score / 100);
                    if (coins > 0) {
                        addCoins(coins);
                        setEarnedCoins(coins);
                    }
                } else {
                    setGameState('waitingToServe');
                    resetBallAndPaddle();
                }
                return newLives;
            });
        }
        
        // Level complete
        if (blocks.filter(b => !b.isIndestructible).length === 0) {
            playVictory();
            addCoins(50);
            setEarnedCoins(50);
            if (onReportProgress) onReportProgress('action', currentLevel);
            
            setGameState('levelComplete');
            setTimeout(() => {
                const nextLevel = currentLevel + 1;
                
                // Unlock logic
                if (nextLevel > maxUnlockedLevel) {
                    setMaxUnlockedLevel(nextLevel);
                    localStorage.setItem('breaker-max-level', nextLevel.toString());
                }

                setCurrentLevel(nextLevel);
                loadLevel(nextLevel);
                resetBallAndPaddle();
                setEarnedCoins(0);
                setGameState('waitingToServe');
            }, 3000); 
        }

    }, [gameState, playWallHit, playPaddleHit, playBlockHit, playLoseLife, playGameOver, playVictory, score, addCoins, updateHighScore, resetBallAndPaddle, loadLevel, currentLevel, playPowerUpSpawn, playPowerUpCollect, playLaserShoot, onReportProgress, maxUnlockedLevel, showTutorial]);

    // Game Loop
    useEffect(() => {
        if (view !== 'GAME') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const render = () => {
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.07)';
            for(let i=0; i<GAME_WIDTH; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke(); }
            for(let i=0; i<GAME_HEIGHT; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke(); }

            drawBlocks(ctx, blocksRef.current);
            drawLasers(ctx, lasersRef.current);
            drawPaddle(ctx, paddleRef.current, GAME_HEIGHT);
            ballsRef.current.forEach(ball => drawBall(ctx, ball));
            powerUpsRef.current.forEach(powerUp => drawPowerUp(ctx, powerUp));
            drawParticles(ctx, particlesRef.current);
        };

        const loop = () => {
            gameTick();
            render();
            gameLoopRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameTick, view]);

    // Controls
    useEffect(() => {
        if (view !== 'GAME') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (showTutorial) return;
            const rect = canvas.getBoundingClientRect();
            let relativeX = e.clientX - rect.left;
            relativeX *= (GAME_WIDTH / rect.width);
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (showTutorial) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            let relativeX = e.touches[0].clientX - rect.left;
            relativeX *= (GAME_WIDTH / rect.width);
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        };
        const handleClick = () => {
            if (!showTutorial) serveBall();
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('click', handleClick);
        };
    }, [serveBall, view, showTutorial]);


    const renderOverlay = () => {
        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-600 mb-4 italic">FIN DE PARTIE</h2>
                    <div className="text-center mb-4">
                        <p className="text-gray-400 text-sm tracking-widest">SCORE</p>
                        <p className="text-3xl font-mono">{score}</p>
                    </div>
                    {earnedCoins > 0 && (
                        <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500">
                            <Coins className="text-yellow-400" size={20} />
                            <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}
                    <button onClick={handleRestart} className="px-8 py-3 bg-neon-pink text-black font-black tracking-widest text-xl skew-x-[-10deg] hover:bg-white transition-colors">
                        <span className="block skew-x-[10deg]">REJOUER</span>
                    </button>
                    <button
                        onClick={handleLocalBack}
                        className="mt-4 text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all"
                    >
                        CHOIX NIVEAU
                    </button>
                </div>
            );
        }
        if (gameState === 'levelComplete') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 animate-in fade-in">
                    <h2 className="text-4xl font-bold text-green-400 mb-4">NIVEAU {currentLevel} TERMINÉ !</h2>
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                        <Coins className="text-yellow-400" size={24} />
                        <span className="text-yellow-100 font-bold text-xl">+50 PIÈCES</span>
                    </div>
                </div>
            );
        }
        if (gameState === 'waitingToServe' && !showTutorial) {
             return (
                <div className="absolute bottom-20 left-0 right-0 z-50 flex flex-col items-center justify-center text-white text-lg font-bold animate-pulse pointer-events-none">
                   <p>TOUCHEZ POUR SERVIR</p>
                </div>
            );
        }
        return null;
    };

    // --- LEVEL SELECT VIEW ---
    if (view === 'LEVEL_SELECT') {
        const gridItems = Array.from({ length: Math.max(maxUnlockedLevel + 4, 20) });
        
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-black to-transparent pointer-events-none"></div>

                {/* Header */}
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] pr-2 pb-1">CHOIX NIVEAU</h1>
                    <div className="w-10"></div>
                </div>

                {/* Grid */}
                <div className="flex-1 w-full max-w-lg overflow-y-auto custom-scrollbar z-10 pb-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-2">
                        {gridItems.map((_, i) => {
                            const lvl = i + 1;
                            const isUnlocked = lvl <= maxUnlockedLevel;
                            const isNext = lvl === maxUnlockedLevel + 1;
                            
                            if (isUnlocked) {
                                return (
                                    <button 
                                        key={lvl} 
                                        onClick={() => handleLevelSelect(lvl)}
                                        className={`
                                            aspect-square rounded-xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95
                                            bg-pink-900/40 border-pink-500/50 text-neon-pink hover:bg-pink-800/60
                                        `}
                                    >
                                        {lvl}
                                        <div className="mt-1 w-1.5 h-1.5 bg-neon-pink rounded-full shadow-[0_0_5px_#ff00ff]"></div>
                                    </button>
                                );
                            } else {
                                return (
                                    <div key={lvl} className={`aspect-square rounded-xl border-2 flex items-center justify-center text-gray-600 ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}>
                                        <Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
                
                <div className="mt-4 z-10 w-full max-w-lg">
                    <button onClick={() => handleLevelSelect(maxUnlockedLevel)} className="w-full py-4 bg-neon-pink text-black font-black tracking-widest text-lg rounded-xl shadow-[0_0_20px_#ec4899] flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Play size={24} fill="black"/> CONTINUER (NIV {maxUnlockedLevel})
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
             {/* Ambient Light Reflection (MIX-BLEND-HARD-LIGHT pour révéler les briques) */}
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />

            {/* TUTORIAL OVERLAY */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full max-w-xs text-center">
                        <h2 className="text-2xl font-black text-white italic mb-6 flex items-center justify-center gap-2"><HelpCircle className="text-fuchsia-500"/> COMMENT JOUER ?</h2>
                        
                        <div className="space-y-3 text-left">
                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <MoveHorizontal className="text-fuchsia-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">DÉPLACER</p>
                                    <p className="text-xs text-gray-400">Glissez le doigt pour bouger la raquette.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <MousePointerClick className="text-cyan-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">LANCER</p>
                                    <p className="text-xs text-gray-400">Touchez l'écran pour lancer la balle au début.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                                <Zap className="text-yellow-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">BONUS</p>
                                    <p className="text-xs text-gray-400">Attrapez les objets qui tombent pour des pouvoirs spéciaux.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowTutorial(false)}
                            className="mt-6 w-full py-3 bg-fuchsia-500 text-black font-black tracking-widest rounded-xl hover:bg-white transition-colors shadow-lg active:scale-95"
                        >
                            J'AI COMPRIS !
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 relative">
                {/* Left: Back Btn + Score */}
                <div className="flex items-center gap-3">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                        <Home size={20} />
                    </button>
                    <div className="flex flex-col">
                         <div className="flex items-center gap-1 text-white text-sm font-bold"><Trophy size={14} className="text-yellow-400" /> {score}</div>
                         <div className="text-gray-500 text-[10px]">RECORD: {highScore}</div>
                    </div>
                </div>

                {/* Center: Level */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <div className="text-lg font-bold text-neon-pink drop-shadow-[0_0_8px_#ff00ff]">NIVEAU {currentLevel}</div>
                </div>

                {/* Right: Lives & Restart */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-red-400 font-bold mr-2">
                        {Array.from({ length: lives }).map((_, i) => <Heart key={i} size={16} fill="currentColor"/>)}
                    </div>
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-fuchsia-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={handleRestart} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Game Area */}
            <div className="relative w-full max-w-lg aspect-[2/3] shadow-2xl bg-black/80 border-2 border-white/10 rounded-lg overflow-hidden">
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full" />
                {renderOverlay()}
            </div>
        </div>
    );
};
