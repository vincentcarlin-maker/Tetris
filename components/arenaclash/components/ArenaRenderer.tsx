
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
        if (!acc || acc.id === 'ta_none') return;

        ctx.save();
        const radius = char.radius;
        const poleX = -radius * 0.8;
        const poleY = -radius * 0.8;
        
        // Mât du drapeau
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(poleX, poleY);
        ctx.lineTo(poleX, poleY - 28);
        ctx.stroke();

        // Paramètres d'animation
        const time = Date.now() / 200;
        const flagW = 20;
        const flagH = 14;
        const segments = 10;
        const segW = flagW / segments;

        ctx.translate(poleX, poleY - 28);

        // On dessine le drapeau segment par segment pour l'effet de vague
        for (let i = 0; i < segments; i++) {
            const x = i * segW;
            const wave = Math.sin(time + i * 0.6) * 2.5;
            const nextWave = Math.sin(time + (i + 1) * 0.6) * 2.5;
            
            ctx.save();
            // Création d'un clip pour ce segment
            ctx.beginPath();
            ctx.moveTo(x, wave);
            ctx.lineTo(x + segW, nextWave);
            ctx.lineTo(x + segW, nextWave + flagH);
            ctx.lineTo(x, wave + flagH);
            ctx.closePath();
            ctx.clip();

            // Dessin selon le layout
            const layout = acc.layout || 'vertical';
            const colors = acc.colors;

            switch(layout) {
                case 'vertical':
                    colors.forEach((color, cIdx) => {
                        ctx.fillStyle = color;
                        const wPart = flagW / colors.length;
                        ctx.fillRect(cIdx * wPart, -10, wPart, 40);
                    });
                    break;
                case 'horizontal':
                    colors.forEach((color, cIdx) => {
                        ctx.fillStyle = color;
                        const hPart = flagH / colors.length;
                        ctx.fillRect(-5, cIdx * hPart + wave, flagW + 10, hPart);
                    });
                    break;
                case 'japan':
                    ctx.fillStyle = colors[0]; // Fond blanc
                    ctx.fillRect(-5, -10, flagW + 10, 40);
                    ctx.fillStyle = colors[1]; // Disque rouge
                    ctx.beginPath();
                    ctx.arc(flagW/2, flagH/2 + wave, flagH/3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'usa':
                    // Bandes rouges et blanches
                    for(let s=0; s<7; s++) {
                        ctx.fillStyle = (s % 2 === 0) ? colors[2] : colors[1];
                        ctx.fillRect(-5, s * (flagH/7) + wave, flagW + 10, flagH/7);
                    }
                    // Canton bleu
                    ctx.fillStyle = colors[0];
                    ctx.fillRect(0, wave, flagW * 0.45, flagH * 0.55);
                    // Points pour étoiles (simplifié)
                    ctx.fillStyle = 'white';
                    for(let row=0; row<3; row++) {
                        for(let col=0; col<3; col++) {
                            ctx.beginPath();
                            ctx.arc(2 + col*4, wave + 2 + row*2.5, 0.5, 0, Math.PI*2);
                            ctx.fill();
                        }
                    }
                    break;
                case 'brazil':
                    ctx.fillStyle = colors[0]; // Fond vert
                    ctx.fillRect(-5, -10, flagW + 10, 40);
                    // Losange jaune
                    ctx.fillStyle = colors[1];
                    ctx.beginPath();
                    ctx.moveTo(2, flagH/2 + wave);
                    ctx.lineTo(flagW/2, 2 + wave);
                    ctx.lineTo(flagW - 2, flagH/2 + wave);
                    ctx.lineTo(flagW/2, flagH - 2 + wave);
                    ctx.closePath();
                    ctx.fill();
                    // Cercle bleu
                    ctx.fillStyle = colors[2];
                    ctx.beginPath();
                    ctx.arc(flagW/2, flagH/2 + wave, flagH/5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'pirate':
                    ctx.fillStyle = 'black';
                    ctx.fillRect(-5, -10, flagW + 10, 40);
                    ctx.fillStyle = 'white';
                    // Crâne simplifié
                    ctx.beginPath();
                    ctx.arc(flagW/2, flagH/2 - 1 + wave, 3, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillRect(flagW/2 - 1.5, flagH/2 + 1 + wave, 3, 2);
                    // Os croisés (X)
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'white';
                    ctx.beginPath();
                    ctx.moveTo(flagW/2 - 5, flagH/2 - 3 + wave); ctx.lineTo(flagW/2 + 5, flagH/2 + 3 + wave);
                    ctx.moveTo(flagW/2 + 5, flagH/2 - 3 + wave); ctx.lineTo(flagW/2 - 5, flagH/2 + 3 + wave);
                    ctx.stroke();
                    break;
            }
            ctx.restore();
        }

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

        } else if (map.id === 'arctic' && obs.type === 'ice') {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
            ctx.strokeStyle = map.colors.wallBorder;
            ctx.lineWidth = 2;
            ctx.shadowColor = map.colors.wallBorder;
            ctx.shadowBlur = 15;
            
            // Crystal shape
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.w / 2, obs.y);
            ctx.lineTo(obs.x + obs.w, obs.y + obs.h / 4);
            ctx.lineTo(obs.x + obs.w, obs.y + (obs.h * 3) / 4);
            ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
            ctx.lineTo(obs.x, obs.y + (obs.h * 3) / 4);
            ctx.lineTo(obs.x, obs.y + obs.h / 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Internal facets
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.w / 2, obs.y);
            ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
            ctx.moveTo(obs.x, obs.y + obs.h / 2);
            ctx.lineTo(obs.x + obs.w, obs.y + obs.h / 2);
            ctx.stroke();
            
            ctx.restore();

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
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.stroke();
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.font = 'black 48px Rajdhani';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('H', cx, cy + 4);
                }

                const seed = (obs.x + obs.y) % 1000;
                ctx.fillStyle = '#1a1a2a';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                if (seed > 300) {
                    ctx.fillRect(obs.x + 20, obs.y + 20, 30, 30);
                    ctx.strokeRect(obs.x + 20, obs.y + 20, 30, 30);
                }
                if (seed > 600) {
                    ctx.fillRect(obs.x + obs.w - 50, obs.y + obs.h - 50, 30, 30);
                    ctx.strokeRect(obs.x + obs.w - 50, obs.y + obs.h - 50, 30, 30);
                }

                ctx.strokeStyle = map.colors.wallBorder;
                ctx.lineWidth = 3;
                ctx.shadowColor = map.colors.wallBorder;
                ctx.shadowBlur = 12;
                ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
            } else if (map.id === 'desert') {
                 ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                 ctx.lineWidth = 1;
                 for(let i=10; i < obs.h; i += 15) {
                     ctx.beginPath();
                     ctx.moveTo(obs.x + 2, obs.y + i);
                     ctx.lineTo(obs.x + obs.w - 2, obs.y + i);
                     ctx.stroke();
                 }

                 ctx.strokeStyle = map.colors.wallBorder;
                 ctx.lineWidth = 3;
                 ctx.shadowColor = map.colors.wallBorder;
                 ctx.shadowBlur = 15;
                 ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
                 
                 ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
                 ctx.fillRect(obs.x - 5, obs.y + obs.h - 10, obs.w + 10, 15);
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
        } else if (map.id === 'arctic') {
            // Falling Snow effect
            if (Date.now() % 10 < 5) {
                 const x = Math.random() * CANVAS_WIDTH;
                 const y = cameraRef.current.y - 100;
                 particlesRef.current.push({
                     x, y, vx: (Math.random() - 0.5) * 2, vy: 4 + Math.random() * 3,
                     life: 150, maxLife: 150, color: '#ffffff', size: Math.random() * 3 + 1
                 });
            }
            // Brume arctique au sol
            ctx.save();
            const fogGrad = ctx.createLinearGradient(0, cameraRef.current.y + VIEWPORT_HEIGHT, 0, cameraRef.current.y);
            fogGrad.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
            fogGrad.addColorStop(0.3, 'transparent');
            ctx.fillStyle = fogGrad;
            ctx.fillRect(cameraRef.current.x, cameraRef.current.y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
            ctx.restore();
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

            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 10;
            
            hAvenues.forEach(y => {
                vAvenues.forEach(x => {
                    const offset = roadWidth / 2 + 15;
                    const drawCrosswalk = (cx: number, cy: number, vert: boolean) => {
                        for(let i = -3; i <= 3; i++) {
                            const stripeX = vert ? cx + i*12 : cx - 15;
                            const stripeY = vert ? cy - 15 : cy + i*12;
                            const w = vert ? 6 : 30;
                            const h = vert ? 30 : 6;
                            ctx.strokeRect(stripeX, stripeY, w, h);
                        }
                    };
                    drawCrosswalk(x, y - offset, true);
                    drawCrosswalk(x, y + offset, true);
                    drawCrosswalk(x - offset, y, false);
                    drawCrosswalk(x + offset, y, false);
                });
            });
            ctx.restore();

            ctx.save();
            const drawLamp = (lx: number, ly: number) => {
                const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 60);
                halo.addColorStop(0, 'rgba(250, 204, 21, 0.2)');
                halo.addColorStop(1, 'transparent');
                ctx.fillStyle = halo;
                ctx.beginPath(); ctx.arc(lx, ly, 60, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#222';
                ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1; ctx.stroke();
                const glowY = ly - 10;
                ctx.fillStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(lx, glowY, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(lx, glowY, 1.5, 0, Math.PI * 2); ctx.fill();
            };

            hAvenues.forEach(y => {
                vAvenues.forEach(x => {
                    const off = roadWidth/2 + 35;
                    drawLamp(x - off, y - off);
                    drawLamp(x + off, y - off);
                    drawLamp(x - off, y + off);
                    drawLamp(x + off, y + off);
                });
            });

            for(let i=300; i<CANVAS_WIDTH; i+=600) {
                hAvenues.forEach(y => {
                    drawLamp(i, y - (roadWidth/2 + 20));
                    drawLamp(i, y + (roadWidth/2 + 20));
                });
            }
            for(let i=300; i<CANVAS_HEIGHT; i+=600) {
                vAvenues.forEach(x => {
                    drawLamp(x - (roadWidth/2 + 20), i);
                    drawLamp(x + (roadWidth/2 + 20), i);
                });
            }
            ctx.restore();

        } else if (map.id === 'desert') {
            const cam = cameraRef.current;
            ctx.save();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.1)';
            ctx.lineWidth = 2;
            for(let i=0; i < CANVAS_HEIGHT; i += 150) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                for(let x=0; x <= CANVAS_WIDTH; x += 40) {
                    const wave = Math.sin(x * 0.01 + i) * 30;
                    ctx.lineTo(x, i + wave);
                }
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            const sunX = CANVAS_WIDTH / 2;
            const sunY = -200;
            const sunGrad = ctx.createRadialGradient(sunX, sunY, 100, sunX, sunY, 1200);
            sunGrad.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
            sunGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.1)');
            sunGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            ctx.fillStyle = '#facc15';
            ctx.shadowBlur = 100;
            ctx.shadowColor = '#facc15';
            ctx.beginPath(); ctx.arc(sunX - 100, 100, 150, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.beginPath(); ctx.arc(sunX + 250, 300, 100, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            if (Date.now() % 10 < 4) {
                 for(let i=0; i<5; i++) {
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
                        vx: -18 - Math.random() * 12,
                        vy: 6 + Math.random() * 8,
                        life: 100, maxLife: 100, 
                        color: Math.random() > 0.5 ? '#facc15' : '#f97316', 
                        size: Math.random() * 4 + 1
                    });
                 }
            }

            ctx.save();
            const drawCactus = (cx: number, cy: number) => {
                ctx.strokeStyle = '#00ff9d';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ff9d';
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 40); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - 25); ctx.quadraticCurveTo(cx - 15, cy - 25, cx - 15, cy - 45); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.quadraticCurveTo(cx + 15, cy - 15, cx + 15, cy - 35); ctx.stroke();
            };

            const cactusPos = [{x: 400, y: 1100}, {x: 2000, y: 300}, {x: 800, y: 2000}, {x: 1500, y: 1400}, {x: 2100, y: 1800}];
            cactusPos.forEach(p => drawCactus(p.x, p.y));
            ctx.restore();

            ctx.save();
            const hazeIntensity = 0.12 + Math.sin(time * 0.5) * 0.04;
            ctx.fillStyle = `rgba(250, 204, 21, ${hazeIntensity})`;
            ctx.fillRect(cam.x, cam.y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
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

    const loop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        
        onUpdate(dt);
        
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

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
