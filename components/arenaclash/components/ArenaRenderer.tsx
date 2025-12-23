import React, { useRef, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAPS, COLORS, Character, Bullet, PowerUp, Particle, Obstacle } from '../constants';

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

    const onUpdateRef = useRef(onUpdate);
    const gameStateRef = useRef(gameState);

    useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const drawBuilding = (ctx: CanvasRenderingContext2D, obs: Obstacle, borderColor: string) => {
        const { x, y, w, h, type, label } = obs;
        
        // 1. Fond du bâtiment (Plus sombre que le sol)
        ctx.fillStyle = '#050515';
        ctx.fillRect(x, y, w, h);

        // 2. Fenêtres (Grille de points lumineux)
        if (type === 'building' || type === 'kiosk') {
            const winSize = 4;
            const gap = 12;
            ctx.fillStyle = '#ffffff22';
            for (let wx = x + gap; wx < x + w - gap; wx += gap) {
                for (let wy = y + gap; wy < y + h - gap; wy += gap) {
                    // Animation aléatoire des fenêtres
                    if (Math.sin((wx + wy) * 0.1 + Date.now() / 1000) > 0.8) {
                        ctx.fillStyle = `${borderColor}66`;
                    } else {
                        ctx.fillStyle = '#ffffff11';
                    }
                    ctx.fillRect(wx, wy, winSize, winSize);
                }
            }
        }

        // 3. Bordures et Glow
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 15;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        // 4. Enseignes Néon (Label)
        if (label) {
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate(-0.05); // Légère inclinaison stylisée
            ctx.fillStyle = '#fff';
            ctx.font = '900 14px Rajdhani';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10;
            ctx.shadowColor = borderColor;
            ctx.fillText(label, 0, 0);
            ctx.restore();
        }
        
        // 5. Reflet sur le toit
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 5, y + 5, w - 10, 5);
    };

    const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
        const { x, y, angle, color, radius, shield, skin } = char;
        ctx.save();
        ctx.translate(x, y);
        
        if (shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 80) * 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        const acc = char.accessory;
        if (acc && acc.id !== 'ta_none') {
            ctx.save();
            const poleX = -radius * 0.8;
            const poleY = -radius * 0.8;
            ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(poleX, poleY); ctx.lineTo(poleX, poleY - 25); ctx.stroke();
            const time = Date.now() / 150;
            const flagWidth = 20; const flagHeight = 12;
            const segments = 5; const segW = flagWidth / segments;
            ctx.translate(poleX, poleY - 25);
            acc.colors?.forEach((c, idx) => {
                ctx.fillStyle = c;
                const hPart = flagHeight / acc.colors.length;
                const yOff = idx * hPart;
                ctx.beginPath(); ctx.moveTo(0, yOff);
                for (let i = 0; i <= segments; i++) { ctx.lineTo(i * segW, yOff + Math.sin(time + i * 0.7) * 4); }
                for (let i = segments; i >= 0; i--) { ctx.lineTo(i * segW, yOff + hPart + Math.sin(time + i * 0.7) * 4); }
                ctx.closePath(); ctx.fill();
            });
            ctx.restore();
        }

        ctx.rotate(angle);
        const primary = skin?.primaryColor || color;
        const secondary = skin?.secondaryColor || '#1a1a2e';
        const glow = skin?.glowColor || color;
        ctx.fillStyle = secondary;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        ctx.shadowBlur = skin?.isAnimated ? (Math.sin(Date.now() / 200) * 10 + 15) : 10;
        ctx.shadowColor = glow;
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 6);
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.save();
        ctx.translate(-recoil, 0);
        ctx.fillStyle = '#222';
        ctx.fillRect(0, -6, radius * 1.8, 12);
        ctx.strokeStyle = primary;
        ctx.strokeRect(0, -6, radius * 1.8, 12);
        ctx.restore();
        ctx.fillStyle = primary;
        ctx.beginPath(); ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        const now = Date.now();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        ctx.save(); 
        ctx.translate(-cam.x, -cam.y);

        // 1. Sol (Bitume Cyber)
        ctx.fillStyle = map.colors.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Grille urbaine
        ctx.strokeStyle = map.colors.grid; ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += 100) { 
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); 
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 100) { 
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); 
        }

        // 3. Détails de route (Marquages au sol) pour la map City
        if (map.id === 'city') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.setLineDash([20, 20]);
            for (let x = 300; x <= 1100; x += 300) {
                 ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
            }
            for (let y = 300; y <= 1100; y += 300) {
                 ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        // 4. PowerUps avec Aura
        powerUpsRef.current.forEach(pw => {
            const floatY = Math.sin(now / 150) * 8;
            ctx.save();
            ctx.translate(pw.x, pw.y + floatY);
            ctx.shadowBlur = 25; ctx.shadowColor = pw.color;
            ctx.beginPath(); ctx.arc(0, 0, pw.radius, 0, Math.PI * 2); ctx.fillStyle = pw.color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Rajdhani'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            let label = pw.type.charAt(0);
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });

        // 5. Bâtiments (Obstacles)
        map.obstacles.forEach(obs => { 
            drawBuilding(ctx, obs, map.colors.wallBorder);
        });

        // 6. Projectiles
        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 12; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            // Trace de traînée
            ctx.strokeStyle = b.color; ctx.globalAlpha = 0.3; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2); ctx.stroke();
            ctx.globalAlpha = 1.0;
        });

        // 7. Tanks
        const player = playerRef.current;
        if (player && !player.isDead) drawTank(ctx, player, recoilRef.current[player.id] || 0);
        botsRef.current.forEach(bot => {
            if (!bot.isDead) drawTank(ctx, bot, recoilRef.current[bot.id] || 0);
        });

        // 8. HUD in-world (Health / Shield / Name)
        [player, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;
            const hpPct = char.hp / char.maxHp;
            const shieldPct = char.shield / 50;
            const barW = 60;
            const hudBaseY = char.y - 70; 

            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW, 6);
            ctx.fillStyle = hpPct > 0.4 ? '#00ff9d' : '#ff2d55';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW * hpPct, 6);
            
            if (char.shield > 0) {
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(char.x - barW/2, hudBaseY - 6, barW * shieldPct, 3);
            }

            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Rajdhani'; ctx.textAlign = 'center';
            ctx.shadowBlur = 4; ctx.shadowColor = 'black';
            ctx.fillText(char.name.toUpperCase(), char.x, hudBaseY - 12);
            ctx.shadowBlur = 0;
        });

        // 9. Particules
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore();

        // 10. Effet de HUD global (Scanlines)
        ctx.fillStyle = 'rgba(18, 16, 16, 0.1)';
        for (let i = 0; i < VIEWPORT_HEIGHT; i += 4) {
            ctx.fillRect(0, i, VIEWPORT_WIDTH, 1);
        }
    }, [selectedMapIndex]);

    const loop = useCallback((time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        onUpdateRef.current(dt);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    }, [draw]);

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
            className="bg-black border-2 border-white/10 rounded-xl w-full h-full object-contain cursor-crosshair shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            onMouseDown={(e) => { if(!showTutorial && gameStateRef.current === 'PLAYING') mouseRef.current.down = true; }}
            onMouseUp={() => mouseRef.current.down = false}
            onMouseMove={(e) => handleInputPos(e.clientX, e.clientY)}
        />
    );
};
