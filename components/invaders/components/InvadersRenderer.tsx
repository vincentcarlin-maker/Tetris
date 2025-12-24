
import React, { useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SPRITES } from '../constants';
import { Entity, Player, Enemy, Bullet, Particle } from '../types';

interface InvadersRendererProps {
    playerRef: React.MutableRefObject<Player>;
    bulletsRef: React.MutableRefObject<Bullet[]>;
    enemiesRef: React.MutableRefObject<Enemy[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    touchXRef: React.MutableRefObject<number | null>;
    onUpdate: () => void;
    gameState: string;
}

export const InvadersRenderer: React.FC<InvadersRendererProps> = ({ 
    playerRef, bulletsRef, enemiesRef, particlesRef, touchXRef, onUpdate, gameState 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
                    ctx.fillRect(entity.x - entity.width / 2 + c * pixelW, entity.y - entity.height / 2 + r * pixelH, pixelW + 0.5, pixelH + 0.5);
                }
            }
        }
        ctx.shadowBlur = 0;
    };

    useEffect(() => {
        const render = () => {
            onUpdate();
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            if (gameState !== 'GAMEOVER') drawSprite(ctx, playerRef.current, SPRITES.PLAYER, playerRef.current.color);

            enemiesRef.current.forEach(e => {
                let sprite = SPRITES.ENEMY_BASIC;
                if (e.type === 'shooter') sprite = SPRITES.ENEMY_SHOOTER;
                else if (e.type === 'heavy') sprite = SPRITES.ENEMY_HEAVY;
                else if (e.type === 'kamikaze') sprite = SPRITES.ENEMY_KAMIKAZE;
                drawSprite(ctx, e, sprite, e.color);
            });

            bulletsRef.current.forEach(b => {
                ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 10;
                ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
            });

            particlesRef.current.forEach(p => {
                ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
            });

            requestAnimationFrame(render);
        };
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [gameState]);

    const handleInput = (clientX: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) touchXRef.current = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    };

    return (
        <canvas 
            ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
            className="w-full h-full cursor-crosshair"
            onMouseMove={(e) => handleInput(e.clientX)}
            onTouchMove={(e) => handleInput(e.touches[0].clientX)}
            onTouchEnd={() => { touchXRef.current = null; }}
        />
    );
};
