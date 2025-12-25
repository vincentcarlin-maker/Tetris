
import React, { useRef, useEffect } from 'react';
import { Position, FoodItem, Particle } from '../types';
import { GRID_SIZE, FOOD_TYPES } from '../constants';

interface SnakeRendererProps {
    snake: Position[];
    food: FoodItem;
    particlesRef: React.MutableRefObject<Particle[]>;
}

export const SnakeRenderer: React.FC<SnakeRendererProps> = ({ 
    snake, food, particlesRef 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cellSize = width / GRID_SIZE;

            ctx.clearRect(0, 0, width, height);
            
            // Draw Grid Background
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
            ctx.lineWidth = 1;
            for(let i=0; i<=GRID_SIZE; i++) {
                ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(width, i * cellSize); ctx.stroke();
            }

            // Draw Food
            const foodType = FOOD_TYPES[food.type];
            ctx.save();
            
            // Draw Leaf (The green leaf on top)
            if (food.type === 'NORMAL' || food.type === 'CHERRY' || food.type === 'STRAWBERRY') {
                ctx.fillStyle = '#16a34a'; 
                ctx.beginPath();
                ctx.ellipse(
                    food.x * cellSize + cellSize/2 + 3, 
                    food.y * cellSize + cellSize/2 - 8, 
                    cellSize/10, 
                    cellSize/18, 
                    -Math.PI/4, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                
                ctx.strokeStyle = '#3f6212';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2 - 4);
                ctx.lineTo(food.x * cellSize + cellSize/2 + 1, food.y * cellSize + cellSize/2 - 8);
                ctx.stroke();
            }

            ctx.shadowBlur = 20;
            ctx.shadowColor = foodType.glow;
            ctx.fillStyle = foodType.color;
            ctx.beginPath();
            ctx.arc(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2, cellSize/2.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(food.x * cellSize + cellSize/2 - 2, food.y * cellSize + cellSize/2 - 2, cellSize/8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw Snake
            snake.forEach((s, i) => {
                const isHead = i === 0;
                ctx.save();
                ctx.shadowBlur = isHead ? 20 : 10;
                ctx.shadowColor = '#00f3ff';
                ctx.fillStyle = isHead ? '#fff' : '#00f3ff';
                
                const padding = 1;
                ctx.beginPath();
                ctx.roundRect(s.x * cellSize + padding, s.y * cellSize + padding, cellSize - padding*2, cellSize - padding*2, isHead ? 6 : 4);
                ctx.fill();
                
                if (isHead) {
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(s.x * cellSize + cellSize/3, s.y * cellSize + cellSize/3, 2, 0, Math.PI * 2);
                    ctx.arc(s.x * cellSize + 2*cellSize/3, s.y * cellSize + cellSize/3, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            // Draw Particles
            particlesRef.current.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.03;
                if (p.life > 0) {
                    ctx.save();
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
            particlesRef.current = particlesRef.current.filter(p => p.life > 0);

            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [snake, food, particlesRef]);

    return (
        <div className="relative p-2 bg-gray-900 rounded-2xl border-4 border-gray-800 shadow-2xl">
            <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-full max-w-[400px] aspect-square rounded-lg"
            />
        </div>
    );
};
