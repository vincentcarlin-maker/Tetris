
import React, { useRef, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAPS, COLORS, Character, Bullet, PowerUp, Particle } from '../constants';

interface ArenaRendererProps {
    playerRef: React.MutableRefObject<Character | null>;
    botsRef: React.MutableRefObject<Character[]>;
    bulletsRef: React.MutableRefObject<Bullet[]>;
    powerUpsRef: React.MutableRefObject<PowerUp[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    cameraRef: React.MutableRefObject<{x: number, y: number}>;
    selectedMapIndex: number;
    mouseRef: React.MutableRefObject<{x: number, y: number, down: boolean}>;
    onUpdate: (dt: number) => void;
    gameState: string;
    showTutorial: boolean;
}

export const ArenaRenderer: React.FC<ArenaRendererProps> = ({
    playerRef, botsRef, bulletsRef, powerUpsRef, particlesRef, cameraRef,
    selectedMapIndex, mouseRef, onUpdate, gameState, showTutorial
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const drawTank = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, radius: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = '#111';
        ctx.fillRect(-radius - 2, -radius, 6, radius * 2); 
        ctx.fillRect(radius - 4, -radius, 6, radius * 2);  
        
        ctx.fillStyle = '#333';
        for(let i=0; i<4; i++) {
            ctx.fillRect(-radius - 1, -radius + 2 + (i*8), 4, 4);
            ctx.fillRect(radius - 3, -radius + 2 + (i*8), 4, 4);
        }

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(-radius + 2, -radius + 2, radius * 2 - 4, radius * 2 - 4);
        ctx.shadowBlur = 0; 

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-radius + 6, -radius + 6, radius - 4, radius * 1.5);

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.fillRect(0, -4, radius * 1.6, 8); 
        ctx.strokeStyle = '#555';
        ctx.strokeRect(0, -4, radius * 1.6, 8);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(radius * 1.6, -5, 4, 10);

        ctx.restore();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        
        ctx.fillStyle = map.colors.bg; 
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        const cam = cameraRef.current;
        ctx.save(); ctx.translate(-cam.x, -cam.y);

        ctx.strokeStyle = map.colors.grid; ctx.lineWidth = 2;
        for (let x = 0; x <= CANVAS_WIDTH; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

        ctx.shadowColor = map.colors.wallBorder; ctx.shadowBlur = 15; 
        ctx.strokeStyle = map.colors.wallBorder; ctx.lineWidth = 2;
        ctx.fillStyle = map.colors.wall;
        map.obstacles.forEach(obs => { 
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h); 
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h); 
        });
        ctx.shadowBlur = 0;

        powerUpsRef.current.forEach(pu => {
            let color = '#fff';
            if (pu.type === 'HEALTH') color = COLORS.powerup.health;
            if (pu.type === 'SHIELD') color = COLORS.powerup.shield;
            if (pu.type === 'SPEED') color = COLORS.powerup.speed;
            if (pu.type === 'DAMAGE') color = COLORS.powerup.damage;
            ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(pu.type[0], pu.x, pu.y);
        });

        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
        });

        const player = playerRef.current;
        const allChars = player ? [player, ...botsRef.current] : [];

        allChars.forEach(char => {
            if (!char || char.isDead) return;
            
            if (char.shield > 0) {
                ctx.strokeStyle = COLORS.powerup.shield; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(char.x, char.y, char.radius + 8, 0, Math.PI*2); ctx.stroke();
            }

            drawTank(ctx, char.x, char.y, char.angle, char.color, char.radius);
            
            const hpPct = char.hp / char.maxHp;
            ctx.fillStyle = '#000'; ctx.fillRect(char.x - 15, char.y - 35, 30, 4);
            ctx.fillStyle = hpPct > 0.5 ? '#0f0' : '#f00'; ctx.fillRect(char.x - 15, char.y - 35, 30 * hpPct, 4);
            ctx.fillStyle = '#fff'; ctx.font = '10px Rajdhani'; ctx.textAlign = 'center'; ctx.fillText(char.name, char.x, char.y - 40);
        });
        ctx.restore();
    }, [selectedMapIndex]);

    const loop = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        
        onUpdate(dt);
        
        if (canvasRef.current) { 
            const ctx = canvasRef.current.getContext('2d'); 
            if (ctx) draw(ctx); 
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    }, [onUpdate, draw]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loop]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        const scaleX = VIEWPORT_WIDTH / rect.width;
        const scaleY = VIEWPORT_HEIGHT / rect.height;
        mouseRef.current.x = (e.clientX - rect.left) * scaleX;
        mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };

    return (
        <canvas 
            ref={canvasRef}
            width={VIEWPORT_WIDTH}
            height={VIEWPORT_HEIGHT}
            className="bg-black/80 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-xl w-full h-full object-contain cursor-crosshair"
            onMouseDown={(e) => { 
                if(!showTutorial && gameState === 'PLAYING') { 
                    mouseRef.current.down = true; 
                    handleMouseMove(e);
                } 
            }}
            onMouseUp={() => mouseRef.current.down = false}
            onMouseMove={handleMouseMove}
        />
    );
};
