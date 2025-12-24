
import React, { useRef, useEffect } from 'react';
import { Position, FoodItem, Teleporter, Particle } from '../types';

interface SnakeRendererProps {
    snake: Position[];
    food: FoodItem;
    obstacles: Position[];
    teleporters: Teleporter[];
    bombs: Position[];
    particlesRef: React.MutableRefObject<Particle[]>;
}

export const SnakeRenderer: React.FC<SnakeRendererProps> = ({ 
    snake, food, obstacles, teleporters, bombs, particlesRef 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const render = () => {
            ctx.clearRect(0, 0, 400, 400);
            
            // Draw Snake
            snake.forEach((s, i) => {
                ctx.fillStyle = i === 0 ? '#fff' : '#00f3ff';
                ctx.fillRect(s.x * 20, s.y * 20, 18, 18);
            });

            // Draw Food
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 8, 0, Math.PI * 2);
            ctx.fill();

            requestAnimationFrame(render);
        };
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [snake, food]);

    return (
        <canvas ref={canvasRef} width={400} height={400} className="bg-black/80 border-2 border-green-500/30 rounded-xl" />
    );
};
