
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Heart, Trophy, Play, Coins, ArrowLeft } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { GameState, Block, Ball, Paddle } from './types';
import { getLevelLayout, TOTAL_BREAKER_LEVELS } from './levels';
import { drawBall, drawBlocks, drawPaddle, drawParticles, createParticles, BLOCK_COLORS, INDESTRUCTIBLE_COLOR } from './helpers';

interface BreakerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

export const BreakerGame: React.FC<BreakerGameProps> = ({ onBack, audio, addCoins }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number>();
    
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.breaker || 0;
    
    const { playPaddleHit, playBlockHit, playWallHit, playLoseLife, playVictory, playGameOver } = audio;
    
    // Game objects refs
    const paddleRef = useRef<Paddle>({ x: (GAME_WIDTH / 2) - 50, width: 100, height: 15 });
    const ballRef = useRef<Ball>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: 3, dy: -3, radius: 8 });
    const blocksRef = useRef<Block[]>([]);
    const particlesRef = useRef<any[]>([]);

    const resetBallAndPaddle = useCallback(() => {
        paddleRef.current.x = (GAME_WIDTH - paddleRef.current.width) / 2;
        ballRef.current = {
            ...ballRef.current,
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 60,
            dx: 3,
            dy: -3,
        };
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

    const startGame = () => {
        setScore(0);
        setLives(3);
        setCurrentLevel(1);
        loadLevel(1);
        resetBallAndPaddle();
        setEarnedCoins(0);
        setGameState('waitingToServe');
    };

    const serveBall = () => {
        if (gameState === 'waitingToServe') {
            setGameState('playing');
        }
    };

    const gameTick = useCallback(() => {
        if (gameState !== 'playing') return;

        const ball = ballRef.current;
        const paddle = paddleRef.current;
        const blocks = blocksRef.current;

        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision
        if (ball.x + ball.radius > GAME_WIDTH || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
            playWallHit();
        }
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
            playWallHit();
        }

        // Paddle collision
        const paddleY = GAME_HEIGHT - 40;
        if (ball.y + ball.radius > paddleY && ball.y - ball.radius < paddleY + paddle.height &&
            ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            
            ball.dy = -ball.dy;
            // Change angle based on where it hits the paddle
            let collidePoint = ball.x - (paddle.x + paddle.width / 2);
            ball.dx = collidePoint * 0.1;
            playPaddleHit();
        }

        // Block collision
        blocks.forEach((block, index) => {
            if (ball.x > block.x && ball.x < block.x + block.width &&
                ball.y > block.y && ball.y < block.y + block.height) {
                
                ball.dy = -ball.dy;
                playBlockHit();
                
                if (!block.isIndestructible) {
                    block.health--;
                    setScore(s => s + block.points);
                    createParticles(particlesRef.current, ball.x, ball.y, block.color);
                    if (block.health <= 0) {
                        blocks.splice(index, 1);
                    } else {
                        block.color = BLOCK_COLORS[String(block.health)];
                    }
                }
            }
        });

        // Bottom wall (lose life)
        if (ball.y + ball.radius > GAME_HEIGHT) {
            playLoseLife();
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                    setGameState('gameOver');
                    playGameOver();
                    updateHighScore('breaker', score);
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
            if (currentLevel + 1 > TOTAL_BREAKER_LEVELS) {
                setGameState('gameOver'); // Game complete
            } else {
                setGameState('levelComplete');
                setTimeout(() => {
                    setCurrentLevel(l => l + 1);
                    loadLevel(currentLevel + 1);
                    resetBallAndPaddle();
                    setGameState('waitingToServe');
                }, 2000);
            }
        }

    }, [gameState, playWallHit, playPaddleHit, playBlockHit, playLoseLife, playGameOver, playVictory, score, addCoins, updateHighScore, resetBallAndPaddle, loadLevel, currentLevel]);

    // Game Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const render = () => {
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            
            // Draw a subtle grid background
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
            for(let i=0; i<GAME_WIDTH; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke(); }
            for(let i=0; i<GAME_HEIGHT; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke(); }

            drawBlocks(ctx, blocksRef.current);
            drawPaddle(ctx, paddleRef.current, GAME_HEIGHT);
            drawBall(ctx, ballRef.current);
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
    }, [gameTick]);

    // Controls
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            let relativeX = e.clientX - rect.left;
            // Scale mouse position to canvas resolution
            relativeX *= (GAME_WIDTH / rect.width);
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        };
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            let relativeX = e.touches[0].clientX - rect.left;
            relativeX *= (GAME_WIDTH / rect.width);
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        };
        const handleClick = () => serveBall();

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('click', handleClick);
        };
    }, [serveBall]);


    const renderOverlay = () => {
        if (gameState === 'start') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="absolute top-4 left-4">
                        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
                            <ArrowLeft size={14} /> MENU
                        </button>
                    </div>
                    <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#ff00ff]">
                        NEON<br/><span className="text-neon-pink">BREAKER</span>
                    </h1>
                    <p className="text-gray-400 mb-8 text-xs tracking-widest">RECORD : {highScore}</p>
                    <button
                        onClick={startGame}
                        className="animate-pulse px-8 py-4 bg-transparent border-2 border-neon-pink text-neon-pink font-bold rounded-full shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:bg-neon-pink hover:text-white transition-all touch-manipulation"
                    >
                        JOUER
                    </button>
                </div>
            );
        }
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
                    <button onClick={startGame} className="px-8 py-3 bg-neon-pink text-black font-black tracking-widest text-xl skew-x-[-10deg] hover:bg-white transition-colors">
                        <span className="block skew-x-[10deg]">REJOUER</span>
                    </button>
                </div>
            );
        }
        if (gameState === 'levelComplete') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 animate-in fade-in">
                    <h2 className="text-4xl font-bold text-green-400">NIVEAU {currentLevel} TERMINÉ !</h2>
                </div>
            );
        }
        if (gameState === 'waitingToServe') {
             return (
                <div className="absolute bottom-20 left-0 right-0 z-50 flex flex-col items-center justify-center text-white text-lg font-bold animate-pulse">
                   <p>TOUCHEZ POUR SERVIR</p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-white"><Trophy size={16} className="text-yellow-400" /> {score}</div>
                    <div className="text-gray-500">|</div>
                    <div className="text-gray-400">MEILLEUR: {highScore}</div>
                </div>
                <div className="flex items-center gap-2 text-red-400 font-bold">
                    {Array.from({ length: lives }).map((_, i) => <Heart key={i} size={18} fill="currentColor"/>)}
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