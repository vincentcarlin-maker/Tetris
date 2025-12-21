
import { useState, useRef, useCallback, useEffect } from 'react';
import { GameState, Block, Ball, Paddle, PowerUp, PowerUpType, Laser } from '../types';
import { getLevelLayout } from '../levels';
import { BLOCK_COLORS, INDESTRUCTIBLE_COLOR, createParticles } from '../helpers';
import { GAME_WIDTH, GAME_HEIGHT, PADDLE_DEFAULT_WIDTH, PADDLE_HEIGHT, BALL_RADIUS, POWERUP_SIZE_W, POWERUP_SIZE_H, INITIAL_LIVES } from '../constants';
import { useGameAudio } from '../../hooks/useGameAudio';

export const useBreakerLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void,
    maxUnlockedLevel: number = 1,
    setMaxUnlockedLevel?: (lvl: number) => void
) => {
    // --- STATE ---
    const [gameState, setGameState] = useState<GameState>('waitingToServe');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // --- REFS (Mutable game objects) ---
    const paddleRef = useRef<Paddle>({ x: (GAME_WIDTH - PADDLE_DEFAULT_WIDTH) / 2, width: PADDLE_DEFAULT_WIDTH, height: PADDLE_HEIGHT, hasLasers: false });
    const ballsRef = useRef<Ball[]>([]);
    const blocksRef = useRef<Block[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const lasersRef = useRef<Laser[]>([]);
    const particlesRef = useRef<any[]>([]);

    // --- TIMERS & UTILS REFS ---
    const lastLaserShotTime = useRef<number>(0);
    const paddleEffectTimeoutRef = useRef<any>(null);
    const ballSpeedEffectTimeoutRef = useRef<any>(null);
    const laserEffectTimeoutRef = useRef<any>(null);
    const levelCompleteTimeoutRef = useRef<any>(null);
    const onReportProgressRef = useRef(onReportProgress);
    
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    // --- INITIALIZATION ---
    const resetBallAndPaddle = useCallback(() => {
        // Clear effects
        if (paddleEffectTimeoutRef.current) clearTimeout(paddleEffectTimeoutRef.current);
        if (ballSpeedEffectTimeoutRef.current) clearTimeout(ballSpeedEffectTimeoutRef.current);
        if (laserEffectTimeoutRef.current) clearTimeout(laserEffectTimeoutRef.current);

        paddleRef.current = { 
            x: (GAME_WIDTH - PADDLE_DEFAULT_WIDTH) / 2, 
            width: PADDLE_DEFAULT_WIDTH, 
            height: PADDLE_HEIGHT, 
            hasLasers: false 
        };
        
        ballsRef.current = [{
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 60,
            dx: 3,
            dy: -3,
            radius: BALL_RADIUS,
            status: 'normal',
        }];
        lasersRef.current = [];
    }, []);

    const loadLevel = useCallback((level: number) => {
        const layout = getLevelLayout(level);
        const newBlocks: Block[] = [];
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

    const startGame = useCallback((lvl: number) => {
        if (levelCompleteTimeoutRef.current) clearTimeout(levelCompleteTimeoutRef.current);
        setCurrentLevel(lvl);
        setScore(0);
        setLives(INITIAL_LIVES);
        loadLevel(lvl);
        resetBallAndPaddle();
        setEarnedCoins(0);
        powerUpsRef.current = [];
        particlesRef.current = [];
        setGameState('waitingToServe');
        audio.resumeAudio();
        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
    }, [loadLevel, resetBallAndPaddle, audio]);

    // --- GAMEPLAY MECHANICS ---
    const spawnPowerUp = (x: number, y: number) => {
        const types: PowerUpType[] = ['PADDLE_GROW', 'PADDLE_SHRINK', 'MULTI_BALL', 'BALL_FAST', 'BALL_SLOW', 'EXTRA_LIFE', 'LASER_PADDLE'];
        const weights = [3, 2, 2, 2, 3, 1, 2];
        const weightedTypes: PowerUpType[] = [];
        types.forEach((type, i) => { for(let j=0; j<weights[i]; j++) weightedTypes.push(type); });
        const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
        powerUpsRef.current.push({ x, y, width: POWERUP_SIZE_W, height: POWERUP_SIZE_H, type, dy: 2 });
        audio.playPowerUpSpawn();
    };

    const activatePowerUp = (type: PowerUpType) => {
        audio.playPowerUpCollect(type);
        const paddle = paddleRef.current;
        const balls = ballsRef.current;

        switch (type) {
            case 'PADDLE_GROW':
                clearTimeout(paddleEffectTimeoutRef.current);
                paddle.width = 150;
                paddleEffectTimeoutRef.current = setTimeout(() => { paddle.width = PADDLE_DEFAULT_WIDTH; }, 10000);
                break;
            case 'PADDLE_SHRINK':
                clearTimeout(paddleEffectTimeoutRef.current);
                paddle.width = 50;
                paddleEffectTimeoutRef.current = setTimeout(() => { paddle.width = PADDLE_DEFAULT_WIDTH; }, 10000);
                break;
            case 'BALL_FAST':
            case 'BALL_SLOW':
                clearTimeout(ballSpeedEffectTimeoutRef.current);
                const factor = type === 'BALL_FAST' ? 1.3 : 0.7;
                balls.forEach(b => { 
                    if (b.status === 'normal') { b.dx *= factor; b.dy *= factor; }
                    b.status = type === 'BALL_FAST' ? 'fast' : 'slow';
                });
                ballSpeedEffectTimeoutRef.current = setTimeout(() => {
                     balls.forEach(b => {
                         if (b.status !== 'normal') {
                            b.dx /= factor; b.dy /= factor;
                            b.status = 'normal';
                         }
                     });
                }, 8000);
                break;
            case 'MULTI_BALL':
                const src = balls[0] || { x: paddle.x + paddle.width/2, y: GAME_HEIGHT - 60, dx: 0, dy: -3 };
                balls.push({ ...src, dx: 2, dy: -3, radius: BALL_RADIUS, status: 'normal' });
                balls.push({ ...src, dx: -2, dy: -3, radius: BALL_RADIUS, status: 'normal' });
                break;
            case 'EXTRA_LIFE':
                setLives(l => l + 1);
                break;
            case 'LASER_PADDLE':
                clearTimeout(laserEffectTimeoutRef.current);
                paddle.hasLasers = true;
                laserEffectTimeoutRef.current = setTimeout(() => { paddle.hasLasers = false; }, 10000);
                break;
        }
    };

    // --- MAIN PHYSICS LOOP ---
    const runPhysicsTick = () => {
        if (gameState !== 'playing') return;

        const paddle = paddleRef.current;
        const blocks = blocksRef.current;
        const balls = ballsRef.current;
        const powerUps = powerUpsRef.current;
        const lasers = lasersRef.current;

        // Lasers
        if (paddle.hasLasers) {
            const now = Date.now();
            if (now - lastLaserShotTime.current > 500) {
                lasers.push({ x: paddle.x + 5, y: GAME_HEIGHT - 50, width: 4, height: 10, dy: -6, active: true });
                lasers.push({ x: paddle.x + paddle.width - 5, y: GAME_HEIGHT - 50, width: 4, height: 10, dy: -6, active: true });
                audio.playLaserShoot();
                lastLaserShotTime.current = now;
            }
        }
        
        // Laser collision
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.y += l.dy;
            if (l.y < 0) { lasers.splice(i, 1); continue; }
            for (let j = blocks.length - 1; j >= 0; j--) {
                const b = blocks[j];
                if (l.x > b.x && l.x < b.x + b.width && l.y > b.y && l.y < b.y + b.height) {
                    lasers.splice(i, 1);
                    audio.playBlockHit();
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

        // PowerUps
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const p = powerUps[i];
            p.y += p.dy;
            const paddleY = GAME_HEIGHT - 40;
            if (p.y > GAME_HEIGHT) { powerUps.splice(i, 1); continue; }
            if (p.y + p.height/2 > paddleY && p.y - p.height/2 < paddleY + paddle.height && p.x > paddle.x && p.x < paddle.x + paddle.width) {
                activatePowerUp(p.type);
                powerUps.splice(i, 1);
            }
        }

        // Balls
        const ballsToRemove: number[] = [];
        balls.forEach((ball, idx) => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collisions
            if (ball.x + ball.radius >= GAME_WIDTH) { ball.x = GAME_WIDTH - ball.radius; ball.dx = -Math.abs(ball.dx); audio.playWallHit(); }
            else if (ball.x - ball.radius <= 0) { ball.x = ball.radius; ball.dx = Math.abs(ball.dx); audio.playWallHit(); }
            if (ball.y - ball.radius <= 0) { ball.y = ball.radius; ball.dy = Math.abs(ball.dy); audio.playWallHit(); }

            // Paddle collision
            const paddleY = GAME_HEIGHT - 40;
            if (ball.dy > 0 && ball.y + ball.radius >= paddleY && ball.y - ball.radius < paddleY + paddle.height && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
                ball.y = paddleY - ball.radius;
                ball.dy = -Math.abs(ball.dy);
                // Angled reflection
                let collidePoint = ball.x - (paddle.x + paddle.width / 2);
                ball.dx = collidePoint * 0.15; 
                audio.playPaddleHit();
            }

            // Block collision
            for (let i = blocks.length - 1; i >= 0; i--) {
                const b = blocks[i];
                const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
                const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));
                const distX = ball.x - closestX;
                const distY = ball.y - closestY;
                
                if ((distX * distX) + (distY * distY) < (ball.radius * ball.radius)) {
                    audio.playBlockHit();
                    // Determine bounce direction
                    const overlapX = (ball.radius + b.width / 2) - Math.abs(ball.x - (b.x + b.width / 2));
                    const overlapY = (ball.radius + b.height / 2) - Math.abs(ball.y - (b.y + b.height / 2));
                    
                    if (overlapX < overlapY) {
                         ball.x = ball.x < b.x + b.width/2 ? b.x - ball.radius : b.x + b.width + ball.radius;
                         ball.dx = -ball.dx;
                    } else {
                        ball.y = ball.y < b.y + b.height/2 ? b.y - ball.radius : b.y + b.height + ball.radius;
                        ball.dy = -ball.dy;
                    }

                    if (!b.isIndestructible) {
                        b.health--;
                        setScore(s => {
                            const ns = s + b.points;
                            if (onReportProgressRef.current) onReportProgressRef.current('score', ns);
                            return ns;
                        });
                        createParticles(particlesRef.current, ball.x, ball.y, b.color);
                        if (b.health <= 0) {
                            if (Math.random() < 0.2) spawnPowerUp(b.x + b.width/2, b.y + b.height/2);
                            blocks.splice(i, 1);
                        } else {
                            b.color = BLOCK_COLORS[String(b.health)];
                        }
                    }
                    break;
                }
            }

            if (ball.y - ball.radius > GAME_HEIGHT) ballsToRemove.push(idx);
        });

        // Remove dead balls
        for (let i = ballsToRemove.length - 1; i >= 0; i--) balls.splice(ballsToRemove[i], 1);

        // Check Lives
        if (balls.length === 0) {
            audio.playLoseLife();
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState('gameOver');
                    audio.playGameOver();
                    const coins = Math.floor(score / 100);
                    if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
                } else {
                    setGameState('waitingToServe');
                    resetBallAndPaddle();
                }
                return newLives;
            });
        }

        // Check Victory
        if (blocks.filter(b => !b.isIndestructible).length === 0) {
            audio.playVictory();
            addCoins(50);
            setEarnedCoins(50);
            setGameState('levelComplete');
            levelCompleteTimeoutRef.current = setTimeout(() => {
                const nextLevel = currentLevel + 1;
                if (setMaxUnlockedLevel && nextLevel > maxUnlockedLevel) {
                    setMaxUnlockedLevel(nextLevel);
                    localStorage.setItem('breaker-max-level', nextLevel.toString());
                }
                if (onReportProgressRef.current) onReportProgressRef.current('action', nextLevel);
                setCurrentLevel(nextLevel);
                loadLevel(nextLevel);
                resetBallAndPaddle();
                setEarnedCoins(0);
                setGameState('waitingToServe');
            }, 3000);
        }
    };

    return {
        gameState,
        setGameState,
        score,
        lives,
        currentLevel,
        earnedCoins,
        paddleRef,
        ballsRef,
        blocksRef,
        powerUpsRef,
        lasersRef,
        particlesRef,
        startGame,
        resetBallAndPaddle,
        runPhysicsTick
    };
};
