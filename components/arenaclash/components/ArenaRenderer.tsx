
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
    recoilRef: React.MutableRefObject<{ [key: string]: number }>;
    onUpdate: (dt: number) => void;
    gameState: string;
    showTutorial: boolean;
}

export const ArenaRenderer: React.FC<ArenaRendererProps> = ({
    playerRef, botsRef, bulletsRef, powerUpsRef, particlesRef, cameraRef,
    selectedMapIndex, mouseRef, recoilRef, onUpdate, gameState, showTutorial
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
        const { x, y, angle, color, radius } = char;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Body
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Turret
        ctx.save();
        ctx.translate(-recoil, 0);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, radius * 1.6, 10);
        ctx.strokeStyle = color;
        ctx.strokeRect(0, -5, radius * 1.6, 10);
        ctx.restore();

        // Cockpit
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        
        // Viewport BG
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        ctx.save(); 
        // Important: Translate with Camera
        ctx.translate(-cam.x, -cam.y);

        // Map BG
        ctx.fillStyle = map.colors.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid
        ctx.strokeStyle = map.colors.grid; ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += 100) { 
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); 
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 100) { 
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); 
        }

        // Obstacles
        map.obstacles.forEach(obs => { 
            ctx.fillStyle = map.colors.wall;
            ctx.strokeStyle = map.colors.wallBorder;
            ctx.lineWidth = 2;
            ctx.shadowColor = map.colors.wallBorder;
            ctx.shadowBlur = 15;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            ctx.shadowBlur = 0;
        });

        // Bullets
        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Tanks
        const player = playerRef.current;
        if (player && !player.isDead) drawTank(ctx, player, recoilRef.current[player.id] || 0);
        botsRef.current.forEach(bot => {
            if (!bot.isDead) drawTank(ctx, bot, recoilRef.current[bot.id] || 0);
        });

        // Health Bars & Names
        [player, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;
            const hpPct = char.hp / char.maxHp;
            const barW = 50;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(char.x - barW/2, char.y - 45, barW, 6);
            ctx.fillStyle = hpPct > 0.4 ? '#0f0' : '#f00';
            ctx.fillRect(char.x - barW/2, char.y - 45, barW * hpPct, 6);
            ctx.fillStyle = '#fff'; ctx.font = '12px Rajdhani'; ctx.textAlign = 'center';
            ctx.fillText(char.name, char.x, char.y - 55);
        });

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

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

    const handleInputPos = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        const scaleX = VIEWPORT_WIDTH / rect.width;
        const scaleY = VIEWPORT_HEIGHT / rect.height;
        // On stocke les coordonnées relatives au canvas
        mouseRef.current.x = (clientX - rect.left) * scaleX;
        mouseRef.current.y = (clientY - rect.top) * scaleY;
    };

    return (
        <canvas 
            ref={canvasRef}
            width={VIEWPORT_WIDTH}
            height={VIEWPORT_HEIGHT}
            className="bg-black border-2 border-purple-500/30 rounded-xl w-full h-full object-contain cursor-crosshair"
            onMouseDown={(e) => { if(!showTutorial && gameState === 'PLAYING') mouseRef.current.down = true; }}
            onMouseUp={() => mouseRef.current.down = false}
            onMouseMove={(e) => handleInputPos(e.clientX, e.clientY)}
        />
    );
};
