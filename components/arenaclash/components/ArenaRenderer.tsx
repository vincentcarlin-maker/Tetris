
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
        const radius = char.radius;
        const poleX = -radius * 0.8;
        const poleY = -radius * 0.8;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(poleX, poleY);
        ctx.lineTo(poleX, poleY - 25);
        ctx.stroke();

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
        
        if (shield > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        drawFlag(ctx, char);

        ctx.rotate(angle);
        
        const primary = skin?.primaryColor || color;
        const secondary = skin?.secondaryColor || '#1a1a2e';
        const glow = skin?.glowColor || color;
        const isAnimated = skin?.isAnimated;

        ctx.fillStyle = secondary;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 3;
        
        const glowPulse = isAnimated ? Math.sin(Date.now() / 200) * 10 + 15 : 10;
        ctx.shadowBlur = glowPulse;
        ctx.shadowColor = glow;

        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 6);
        ctx.fill();
        ctx.stroke();
        
        if (isAnimated) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(Math.sin(Date.now() / 500) * radius, 0, radius / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.shadowBlur = 0;

        ctx.save();
        ctx.translate(-recoil, 0);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, radius * 1.6, 10);
        ctx.strokeStyle = primary;
        ctx.strokeRect(0, -5, radius * 1.6, 10);
        ctx.restore();

        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, obs: any, map: any) => {
        const time = Date.now() / 1000;
        
        if (map.id === 'forest' && obs.type === 'tree') {
            const cx = obs.x + obs.w / 2;
            const cy = obs.y + obs.h / 2;
            const baseRad = obs.w / 2;

            for (let i = 0; i < 3; i++) {
                const rad = baseRad * (1 - i * 0.25);
                const pulse = Math.sin(time + i) * 5;
                ctx.save();
                ctx.shadowColor = map.colors.wallBorder;
                ctx.shadowBlur = 10;
                ctx.fillStyle = i === 0 ? map.colors.wall : `rgba(34, 197, 94, ${0.1 + i * 0.15})`;
                ctx.strokeStyle = map.colors.wallBorder;
                ctx.lineWidth = 2;
                drawHexagon(ctx, cx, cy, rad + pulse);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

        } else if (map.id === 'forest' && obs.type === 'pond') {
            ctx.save();
            const cx = obs.x + obs.w / 2;
            const cy = obs.y + obs.h / 2;
            
            ctx.fillStyle = 'rgba(0, 136, 255, 0.15)';
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 20);
            ctx.fill();

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(obs.w, obs.h) / 1.5);
            grad.addColorStop(0, 'rgba(0, 243, 255, 0.2)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            [0, 1.5, 3].forEach((offset) => {
                const progress = ((time + offset) % 4) / 4;
                const rw = obs.w * progress;
                const rh = obs.h * progress;
                ctx.beginPath();
                ctx.roundRect(cx - rw/2, cy - rh/2, rw, rh, 20 * progress);
                ctx.globalAlpha = 1 - progress;
                ctx.stroke();
            });
            ctx.restore();

        } else if (map.id === 'forest' && obs.type === 'bridge') {
            ctx.save();
            const brown = '#5d4037';
            const lightBrown = '#8d6e63';
            
            ctx.fillStyle = brown;
            ctx.strokeStyle = lightBrown;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            if (obs.w > obs.h) {
                for(let i = 10; i < obs.w; i += 20) {
                    ctx.moveTo(obs.x + i, obs.y + 2);
                    ctx.lineTo(obs.x + i, obs.y + obs.h - 2);
                }
            } else {
                for(let i = 10; i < obs.h; i += 20) {
                    ctx.moveTo(obs.x + 2, obs.y + i);
                    ctx.lineTo(obs.x + obs.w - 2, obs.y + i);
                }
            }
            ctx.stroke();

            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 1;
            ctx.shadowColor = '#ffb300';
            ctx.shadowBlur = 8;
            ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
            ctx.restore();

        } else {
            ctx.save();
            ctx.fillStyle = map.colors.wall;
            ctx.strokeStyle = map.colors.wallBorder;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.shadowBlur = 0;

            if (map.id === 'city') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeRect(obs.x + 8, obs.y + 8, obs.w - 16, obs.h - 16);
                
                if (obs.w > 180 && obs.h > 180) {
                    const cx = obs.x + obs.w / 2;
                    const cy = obs.y + obs.h / 2;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.stroke();
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.font = 'black 48px Rajdhani';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('H', cx, cy + 4);
                }

                const seed = (obs.x * obs.y) % 1000;
                ctx.fillStyle = '#1a1a2a';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                const drawHVAC = (hx: number, hy: number) => {
                    ctx.fillRect(hx, hy, 25, 25);
                    ctx.strokeRect(hx, hy, 25, 25);
                    ctx.beginPath();
                    ctx.moveTo(hx + 5, hy + 5); ctx.lineTo(hx + 20, hy + 20);
                    ctx.moveTo(hx + 20, hy + 5); ctx.lineTo(hx + 5, hy + 20);
                    ctx.stroke();
                };
                if (seed > 200) drawHVAC(obs.x + 20, obs.y + 20);
                if (seed > 500) drawHVAC(obs.x + obs.w - 45, obs.y + obs.h - 45);

                ctx.strokeStyle = map.colors.wallBorder;
                ctx.lineWidth = 3;
                ctx.shadowColor = map.colors.wallBorder;
                ctx.shadowBlur = 12;
                ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
            } else if (map.id === 'desert') {
                 // Effet roche sablonneuse
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                 for(let i=0; i<3; i++) {
                     ctx.strokeRect(obs.x + i*4, obs.y + i*4, obs.w - i*8, obs.h - i*8);
                 }
                 ctx.strokeStyle = map.colors.wallBorder;
                 ctx.lineWidth = 3;
                 ctx.shadowColor = map.colors.wallBorder;
                 ctx.shadowBlur = 15;
                 ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            } else {
                ctx.shadowColor = map.colors.wallBorder;
                ctx.shadowBlur = 15;
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            }
            ctx.restore();
        }
    };

    const drawMapDecor = (ctx: CanvasRenderingContext2D, map: any) => {
        const time = Date.now() / 1000;
        
        if (map.id === 'forest') {
            ctx.strokeStyle = 'rgba(0, 255, 157, 0.08)';
            ctx.lineWidth = 1.5;
            const trees = map.obstacles.filter((o: any) => o.type === 'tree');
            for(let i = 0; i < trees.length; i++) {
                for(let j = i + 1; j < trees.length; j++) {
                    const dist = Math.hypot(trees[i].x - trees[j].x, trees[i].y - trees[j].y);
                    if (dist < 400) {
                        ctx.beginPath();
                        ctx.moveTo(trees[i].x + trees[i].w/2, trees[i].y + trees[i].h/2);
                        ctx.lineTo(trees[j].x + trees[j].w/2, trees[j].y + trees[j].h/2);
                        ctx.stroke();
                    }
                }
            }
            if (Date.now() % 100 < 15) {
                 const x = Math.random() * CANVAS_WIDTH;
                 const y = Math.random() * CANVAS_HEIGHT;
                 particlesRef.current.push({
                     x, y, vx: (Math.random() - 0.5) * 0.8, vy: 0.3 + Math.random() * 0.5,
                     life: 120, maxLife: 120, color: 'rgba(0, 255, 157, 0.25)', size: 2.5
                 });
            }
        } else if (map.id === 'city') {
            const roadWidth = 140;
            const hAvenues = [100, 450, 750, 1350, 1700, 2300];
            const vAvenues = [100, 550, 900, 1450, 1800, 2300];
            ctx.fillStyle = '#05050f';
            hAvenues.forEach(y => ctx.fillRect(0, y - roadWidth/2, CANVAS_WIDTH, roadWidth));
            vAvenues.forEach(x => ctx.fillRect(x - roadWidth/2, 0, roadWidth, CANVAS_HEIGHT));
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 8;
            ctx.setLineDash([30, 40]);
            hAvenues.forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); });
            vAvenues.forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); });
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
        } else if (map.id === 'desert') {
            // --- TEMPÊTE DE SABLE ---
            const cam = cameraRef.current;
            
            // 1. Spawner de particules de sable (Similaire à Neon Run)
            // On spawne des particules sur les bords du viewport pour optimiser
            if (Date.now() % 10 < 4) {
                 for(let i=0; i<3; i++) {
                    const side = Math.random() > 0.5 ? 'right' : 'top';
                    let x, y;
                    if (side === 'right') {
                        x = cam.x + VIEWPORT_WIDTH + 100;
                        y = cam.y + Math.random() * VIEWPORT_HEIGHT;
                    } else {
                        x = cam.x + Math.random() * VIEWPORT_WIDTH + 200;
                        y = cam.y - 100;
                    }

                    particlesRef.current.push({
                        x, y, 
                        vx: -15 - Math.random() * 10, // Vent violent vers la gauche
                        vy: 5 + Math.random() * 5,    // Légère descente
                        life: 80, maxLife: 80, 
                        color: Math.random() > 0.5 ? '#facc15' : '#f97316', 
                        size: Math.random() * 3 + 1
                    });
                 }
            }

            // 2. Voile atmosphérique (Haze)
            ctx.save();
            const hazeIntensity = 0.1 + Math.sin(time) * 0.05;
            ctx.fillStyle = `rgba(250, 204, 21, ${hazeIntensity})`;
            ctx.fillRect(cam.x, cam.y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
            
            // Nuages de poussière occasionnels
            ctx.globalAlpha = 0.15;
            for(let i=0; i<3; i++) {
                const cloudTime = (time + i*2) % 10;
                const cx = (CANVAS_WIDTH - (cloudTime * 300)) % CANVAS_WIDTH;
                const cy = (i * 800) % CANVAS_HEIGHT;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
                grad.addColorStop(0, '#f97316');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cx, cy, 400, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        const now = Date.now();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        ctx.save(); 
        ctx.translate(-cam.x, -cam.y);

        ctx.fillStyle = map.colors.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = map.colors.grid; ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += 100) { 
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); 
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 100) { 
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); 
        }

        drawMapDecor(ctx, map);

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

        map.obstacles.forEach(obs => { 
            drawObstacle(ctx, obs, map);
        });

        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        });

        const player = playerRef.current;
        if (player && !player.isDead) drawTank(ctx, player, recoilRef.current[player.id] || 0);
        botsRef.current.forEach(bot => {
            if (!bot.isDead) drawTank(ctx, bot, recoilRef.current[bot.id] || 0);
        });

        [player, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;
            const hpPct = char.hp / char.maxHp;
            const shieldPct = char.shield / 50;
            const barW = 50;
            const hudBaseY = char.y - 65; 

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW, 6);
            ctx.fillStyle = hpPct > 0.4 ? '#0f0' : '#f00';
            ctx.fillRect(char.x - barW/2, hudBaseY, barW * hpPct, 6);
            
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

        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            // Dessiner les particules de sable comme des petits traits si map desert
            if (map.id === 'desert' && p.vx < -5) {
                ctx.lineWidth = 1; ctx.strokeStyle = p.color;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx*0.5, p.y - p.vy*0.5); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            }
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
