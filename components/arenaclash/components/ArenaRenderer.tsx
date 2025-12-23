
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

    const drawFlag = (ctx: CanvasRenderingContext2D, char: Character) => {
        const acc = char.accessory;
        if (!acc || acc.id === 'ta_none' || !acc.colors || acc.colors.length === 0) return;

        ctx.save();
        // Positionnement à l'arrière du tank
        const radius = char.radius;
        const poleX = -radius * 0.8;
        const poleY = -radius * 0.8;
        
        // Dessin du mât
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(poleX, poleY);
        ctx.lineTo(poleX, poleY - 25);
        ctx.stroke();

        // Animation du flottement
        const time = Date.now() / 200;
        const flagWidth = 18;
        const flagHeight = 12;
        const segments = 6;
        const segW = flagWidth / segments;

        ctx.translate(poleX, poleY - 25);

        acc.colors.forEach((color, cIdx) => {
            ctx.fillStyle = color;
            const hPart = flagHeight / acc.colors.length;
            const yOff = cIdx * hPart;

            ctx.beginPath();
            ctx.moveTo(0, yOff);

            for (let i = 0; i <= segments; i++) {
                const x = i * segW;
                const wave = Math.sin(time + i * 0.8) * 3;
                ctx.lineTo(x, yOff + wave);
            }
            for (let i = segments; i >= 0; i--) {
                const x = i * segW;
                const wave = Math.sin(time + i * 0.8) * 3;
                ctx.lineTo(x, yOff + hPart + wave);
            }
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    };

    const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
        const { x, y, angle, color, radius, shield, skin } = char;
        ctx.save();
        ctx.translate(x, y);
        
        // Shield Bubble
        if (shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Dessin du drapeau (au dessus du châssis mais suit la position)
        drawFlag(ctx, char);

        ctx.rotate(angle);
        
        // Body Style
        const primary = skin?.primaryColor || color;
        const secondary = skin?.secondaryColor || '#1a1a2e';
        const glow = skin?.glowColor || color;
        const isAnimated = skin?.isAnimated;

        ctx.fillStyle = secondary;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        
        // Animated Glow
        const glowPulse = isAnimated ? Math.sin(Date.now() / 200) * 10 + 15 : 10;
        ctx.shadowBlur = glowPulse;
        ctx.shadowColor = glow;

        // Draw Body
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 6);
        ctx.fill();
        ctx.stroke();
        
        // Pattern or reflection
        if (isAnimated) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(Math.sin(Date.now() / 500) * radius, 0, radius / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.shadowBlur = 0;

        // Turret
        ctx.save();
        ctx.translate(-recoil, 0);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, radius * 1.6, 10);
        ctx.strokeStyle = primary;
        ctx.strokeRect(0, -5, radius * 1.6, 10);
        ctx.restore();

        // Cockpit
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        const now = Date.now();
        
        // Viewport BG
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        ctx.save(); 
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

        // PowerUps
        powerUpsRef.current.forEach(pw => {
            const floatY = Math.sin(now / 200) * 5;
            ctx.save();
            ctx.translate(pw.x, pw.y + floatY);
            ctx.beginPath();
            ctx.arc(0, 0, pw.radius, 0, Math.PI * 2);
            ctx.fillStyle = pw.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = pw.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Icon label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Rajdhani';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let label = "?";
            if (pw.type === 'HEALTH') label = "H";
            if (pw.type === 'SHIELD') label = "S";
            if (pw.type === 'TRIPLE') label = "W";
            if (pw.type === 'BOOST') label = "X";
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });

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

        // HUD Elements (Health Bars) - Offset increased to reveal flag
        [player, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;
            const hpPct = char.hp / char.maxHp;
            const shieldPct = char.shield / 50;
            const barW = 50;
            
            // On remonte tout le bloc HUD (barres + nom) d'environ 20-25 pixels
            const hudBaseY = char.y - 65; 

            // HP Bar
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW, 6);
            ctx.fillStyle = hpPct > 0.4 ? '#0f0' : '#f00';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW * hpPct, 6);
            
            // Shield Bar
            if (char.shield > 0) {
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(char.x - barW/2, hudBaseY - 5, barW * shieldPct, 3);
            }

            ctx.fillStyle = '#fff'; 
            ctx.font = 'bold 12px Rajdhani'; 
            ctx.textAlign = 'center';
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'black';
            ctx.fillText(char.name, char.x, hudBaseY - 10);
            ctx.shadowBlur = 0;
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
