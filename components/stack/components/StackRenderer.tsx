
import React, { useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_HEIGHT, ISO_COEFF_X, ISO_COEFF_Y } from '../constants';
import { Block, Debris, CurrentBlockState, Dimensions } from '../types';

interface StackRendererProps {
    stackRef: React.MutableRefObject<Block[]>;
    debrisRef: React.MutableRefObject<Debris[]>;
    currentBlockRef: React.MutableRefObject<CurrentBlockState>;
    limitRef: React.MutableRefObject<Dimensions>;
    cameraYRef: React.MutableRefObject<number>;
    phase: string;
    onUpdate: () => void;
    getHSL: (idx: number) => string;
}

export const StackRenderer: React.FC<StackRendererProps> = ({ 
    stackRef, debrisRef, currentBlockRef, limitRef, cameraYRef, phase, onUpdate, getHSL 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawBlock = (ctx: CanvasRenderingContext2D, b: Block, camY: number) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2 + 200;
        const relY = b.y * BLOCK_HEIGHT - camY;

        const p1 = { x: centerX + (b.x - b.z) * ISO_COEFF_X, y: centerY + (b.x + b.z) * ISO_COEFF_Y - (relY + BLOCK_HEIGHT) };
        const p2 = { x: centerX + (b.x + b.width - b.z) * ISO_COEFF_X, y: centerY + (b.x + b.width + b.z) * ISO_COEFF_Y - (relY + BLOCK_HEIGHT) };
        const p3 = { x: centerX + (b.x + b.width - (b.z + b.depth)) * ISO_COEFF_X, y: centerY + (b.x + b.width + b.z + b.depth) * ISO_COEFF_Y - (relY + BLOCK_HEIGHT) };
        const p4 = { x: centerX + (b.x - (b.z + b.depth)) * ISO_COEFF_X, y: centerY + (b.x + b.z + b.depth) * ISO_COEFF_Y - (relY + BLOCK_HEIGHT) };

        // Draw Faces
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;

        // Left
        ctx.fillStyle = b.color.replace('60%', '40%');
        ctx.beginPath(); ctx.moveTo(p4.x, p4.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p3.x, p3.y + BLOCK_HEIGHT); ctx.lineTo(p4.x, p4.y + BLOCK_HEIGHT); ctx.fill(); ctx.stroke();
        // Right
        ctx.fillStyle = b.color.replace('60%', '50%');
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p2.x, p2.y + BLOCK_HEIGHT); ctx.lineTo(p3.x, p3.y + BLOCK_HEIGHT); ctx.fill(); ctx.stroke();
        // Top
        ctx.fillStyle = b.color.replace('60%', '70%');
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.fill(); ctx.stroke();
    };

    useEffect(() => {
        const render = () => {
            onUpdate();
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const camY = cameraYRef.current;

            debrisRef.current.forEach(d => drawBlock(ctx, d, camY));
            stackRef.current.forEach(b => drawBlock(ctx, b, camY));

            if (phase === 'PLAYING') {
                const curr = currentBlockRef.current;
                drawBlock(ctx, {
                    x: curr.x, z: curr.z, width: limitRef.current.width, depth: limitRef.current.depth,
                    y: stackRef.current[stackRef.current.length - 1].y + 1,
                    color: getHSL(stackRef.current.length)
                }, camY);
            }
            requestAnimationFrame(render);
        };
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [phase]);

    return (
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain" />
    );
};
