
import React, { useRef, useEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { drawBall, drawBlocks, drawPaddle, drawParticles, drawPowerUp, drawLasers } from '../helpers';
import { Paddle, Ball, Block, PowerUp, Laser } from '../types';

interface BreakerRendererProps {
    paddleRef: React.MutableRefObject<Paddle>;
    ballsRef: React.MutableRefObject<Ball[]>;
    blocksRef: React.MutableRefObject<Block[]>;
    powerUpsRef: React.MutableRefObject<PowerUp[]>;
    lasersRef: React.MutableRefObject<Laser[]>;
    particlesRef: React.MutableRefObject<any[]>;
    gameState: string;
    onTick: () => void;
    onServe: () => void;
    showTutorial: boolean;
}

export const BreakerRenderer: React.FC<BreakerRendererProps> = ({
    paddleRef, ballsRef, blocksRef, powerUpsRef, lasersRef, particlesRef,
    gameState, onTick, onServe, showTutorial
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);

    // Main Render Loop
    useEffect(() => {
        const render = () => {
            onTick(); // Physics Tick

            const canvas = canvasRef.current;
            if (!canvas) {
                animationFrameRef.current = requestAnimationFrame(render);
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw Background
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.07)';
            // Simple grid
            for(let i=0; i<GAME_WIDTH; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke(); }
            for(let i=0; i<GAME_HEIGHT; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke(); }

            // Draw Elements
            drawBlocks(ctx, blocksRef.current);
            drawLasers(ctx, lasersRef.current);
            drawPaddle(ctx, paddleRef.current, GAME_HEIGHT);
            ballsRef.current.forEach(ball => drawBall(ctx, ball));
            powerUpsRef.current.forEach(powerUp => drawPowerUp(ctx, powerUp));
            drawParticles(ctx, particlesRef.current);

            animationFrameRef.current = requestAnimationFrame(render);
        };
        
        render();

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [onTick, paddleRef, ballsRef, blocksRef, powerUpsRef, lasersRef, particlesRef]);

    // Input Handling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updatePaddle = (clientX: number) => {
            if (showTutorial) return;
            const rect = canvas.getBoundingClientRect();
            let relativeX = clientX - rect.left;
            // Scale if canvas is resized by CSS
            relativeX *= (GAME_WIDTH / rect.width);
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        };

        const handleMouseMove = (e: MouseEvent) => updatePaddle(e.clientX);
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            updatePaddle(e.touches[0].clientX);
        };
        const handleClick = () => { if (!showTutorial && gameState === 'waitingToServe') onServe(); };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('click', handleClick);
        
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('click', handleClick);
        };
    }, [showTutorial, gameState, onServe]);

    return (
        <div className="relative w-full max-w-lg aspect-[2/3] shadow-2xl bg-black/80 border-2 border-white/10 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-full" />
        </div>
    );
};
