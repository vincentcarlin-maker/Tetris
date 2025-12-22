
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
        
        // Shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;

        // Tracks
        ctx.fillStyle = '#111';
        ctx.rotate(angle); // Rotate whole tank for simplicity or just base? Let's do whole for style
        ctx.fillRect(-radius - 3, -radius, 6, radius * 2); 
        ctx.fillRect(radius - 3, -radius, 6, radius * 2);  
        
        // Main Chassis
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-radius + 2, -radius + 2, radius * 2 - 4, radius * 2 - 4, 4);
        ctx.fill();
        ctx.stroke();

        // Neon Glow on Chassis
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pattern on chassis
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(-radius + 6, -radius + 6, radius - 4, radius * 1.5);

        // Turret Base
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cannon with Recoil
        ctx.save();
        ctx.translate(-recoil, 0); // Recoil moves it back
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -4, radius * 1.5, 8); 
        ctx.strokeStyle = '#555';
        ctx.strokeRect(0, -4, radius * 1.5, 8);
        ctx.fillStyle = color;
        ctx.fillRect(radius * 1.5, -5, 5, 10); // Muzzle
        ctx.restore();

        // Cockpit Glow
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        
        ctx.fillStyle = map.colors.bg; 
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        ctx.save(); 
        ctx.translate(-cam.x, -cam.y);

        // Scanlines/Digital floor effect
        ctx.strokeStyle = map.colors.grid; ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += 50) { 
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); 
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 50) { 
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); 
        }

        // Obstacles with improved lighting
        map.obstacles.forEach(obs => { 
            // 3D side effect
            ctx.fillStyle = '#000';
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.w, obs.h);
            
            ctx.fillStyle = map.colors.wall;
            ctx.strokeStyle = map.colors.wallBorder;
            ctx.lineWidth = 2;
            ctx.shadowColor = map.colors.wallBorder;
            ctx.shadowBlur = 15;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            ctx.shadowBlur = 0;

            // Internal detail
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(obs.x + 10, obs.y + 10, obs.w - 20, obs.h - 20);
        });

        // PowerUps
        powerUpsRef.current.forEach(pu => {
            let color = COLORS.powerup.health;
            if (pu.type === 'SHIELD') color = COLORS.powerup.shield;
            if (pu.type === 'SPEED') color = COLORS.powerup.speed;
            if (pu.type === 'DAMAGE') color = COLORS.powerup.damage;
            
            const bounce = Math.sin(Date.now() / 200) * 3;
            ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(pu.x, pu.y + bounce, pu.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
            ctx.font = 'bold 14px sans-serif'; ctx.fillText(pu.type[0], pu.x, pu.y + bounce);
            ctx.shadowBlur = 0;
        });

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Bullets with trails
        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fillStyle = b.color;
            
            // Trail
            const trailLen = 20;
            const grad = ctx.createLinearGradient(b.x, b.y, b.x - b.vx * 2, b.y - b.vy * 2);
            grad.addColorStop(0, b.color);
            grad.addColorStop(1, 'transparent');
            ctx.strokeStyle = grad;
            ctx.lineWidth = b.radius * 1.5;
            ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2); ctx.stroke();

            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        });

        const player = playerRef.current;
        const allChars = player ? [player, ...botsRef.current] : [];

        allChars.forEach(char => {
            if (!char || char.isDead) return;
            
            if (char.shield > 0) {
                ctx.strokeStyle = COLORS.powerup.shield; ctx.lineWidth = 3;
                ctx.shadowBlur = 10; ctx.shadowColor = COLORS.powerup.shield;
                ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.arc(char.x, char.y, char.radius + 12, Date.now()/100, Date.now()/100 + Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.shadowBlur = 0;
            }

            drawTank(ctx, char, recoilRef.current[char.id] || 0);
            
            // Health Bar
            const hpPct = char.hp / char.maxHp;
            const barW = 40;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(char.x - barW/2, char.y - 35, barW, 5);
            const barGrad = ctx.createLinearGradient(char.x - barW/2, 0, char.x + barW/2, 0);
            barGrad.addColorStop(0, '#f00'); barGrad.addColorStop(1, hpPct > 0.5 ? '#0f0' : '#ff0');
            ctx.fillStyle = barGrad; ctx.fillRect(char.x - barW/2, char.y - 35, barW * hpPct, 5);
            
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Rajdhani'; ctx.textAlign = 'center'; 
            ctx.fillText(char.name.toUpperCase(), char.x, char.y - 42);
        });
        ctx.restore();
    }, [selectedMapIndex]);

    const loop = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        onUpdate(dt);
        if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) draw(ctx); }
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
        mouseRef.current.x = (clientX - rect.left) * scaleX;
        mouseRef.current.y = (clientY - rect.top) * scaleY;
    };

    return (
        <canvas 
            ref={canvasRef}
            width={VIEWPORT_WIDTH}
            height={VIEWPORT_HEIGHT}
            className="bg-black/80 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-xl w-full h-full object-contain cursor-crosshair"
            onMouseDown={(e) => { if(!showTutorial && gameState === 'PLAYING') { mouseRef.current.down = true; handleInputPos(e.clientX, e.clientY); } }}
            onMouseUp={() => mouseRef.current.down = false}
            onMouseMove={(e) => handleInputPos(e.clientX, e.clientY)}
        />
    );
};
