
import React, { useRef, useEffect } from 'react';
import { Worm, Food, Particle, Point } from '../types';
import { WORLD_SIZE } from '../constants';

interface SlitherRendererProps {
    playerWormRef: React.MutableRefObject<Worm | null>;
    othersRef: React.MutableRefObject<Worm[]>;
    foodRef: React.MutableRefObject<Food[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    cameraRef: React.MutableRefObject<Point>;
    shakeRef: React.MutableRefObject<number>;
    gameState: string;
    onUpdate: (dt: number) => void;
    onInputStart: (x: number, y: number) => void;
    onInputMove: (x: number, y: number) => void;
    onInputEnd: () => void;
}

export const SlitherRenderer: React.FC<SlitherRendererProps> = ({
    playerWormRef, othersRef, foodRef, particlesRef, cameraRef, shakeRef,
    gameState, onUpdate, onInputStart, onInputMove, onInputEnd
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const onUpdateRef = useRef(onUpdate);
    const gameStateRef = useRef(gameState);

    useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const drawAccessory = (ctx: CanvasRenderingContext2D, worm: Worm, head: Point, radius: number) => {
        const acc = worm.accessory;
        if (!acc || acc.id === 'sa_none') return;

        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(worm.angle);
        
        ctx.strokeStyle = acc.color;
        ctx.fillStyle = acc.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = acc.color;

        const id = acc.id;

        if (id === 'sa_cyber_visor') {
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.roundRect(radius * 0.2, -radius * 0.7, radius * 0.4, radius * 1.4, 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
            ctx.fillRect(radius * 0.4, -radius * 0.6, 2, radius * 1.2);
        }
        else if (id === 'sa_royal_crown') {
            ctx.beginPath();
            ctx.moveTo(-radius * 0.5, -radius * 0.8);
            ctx.lineTo(-radius * 0.8, -radius * 1.5);
            ctx.lineTo(-radius * 0.4, -radius * 1.1);
            ctx.lineTo(0, -radius * 1.6);
            ctx.lineTo(radius * 0.4, -radius * 1.1);
            ctx.lineTo(radius * 0.8, -radius * 1.5);
            ctx.lineTo(radius * 0.5, -radius * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        else if (id === 'sa_dj_phones') {
            ctx.beginPath();
            ctx.arc(0, -radius * 0.8, radius * 0.4, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(-radius * 0.3, -radius * 1.1, radius * 0.6, radius * 0.3, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -radius * 0.7, radius * 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
        else if (id === 'sa_oni_mask') {
            ctx.beginPath();
            ctx.moveTo(-radius * 0.3, -radius * 0.5);
            ctx.quadraticCurveTo(-radius * 0.8, -radius * 1.5, -radius * 1.2, -radius * 1.2);
            ctx.stroke();
            ctx.moveTo(radius * 0.3, -radius * 0.5);
            ctx.quadraticCurveTo(radius * 0.8, -radius * 1.5, radius * 1.2, -radius * 1.2);
            ctx.stroke();
        }
        else if (id === 'sa_energy_halo') {
            ctx.beginPath();
            ctx.ellipse(0, -radius * 0.5, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        else if (id === 'sa_samurai_blades') {
            ctx.rotate(-Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(-radius, -radius);
            ctx.lineTo(-radius * 2, -radius * 0.5);
            ctx.stroke();
            ctx.moveTo(-radius, radius);
            ctx.lineTo(-radius * 2, radius * 0.5);
            ctx.stroke();
        }
        else if (id === 'sa_void_eye') {
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
        }

        ctx.restore();
    };

    const drawWorm = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        const segs = worm.segments; 
        if (segs.length < 2) return;
        const skin = worm.skin; 
        const pattern = skin?.pattern || 'solid';
        const primary = skin?.primaryColor || worm.color; 
        const secondary = skin?.secondaryColor || primary;
        const glow = skin?.glowColor || primary; 
        const radius = worm.radius;

        ctx.save();
        for (let i = segs.length - 1; i >= 0; i--) {
            const seg = segs[i]; 
            const isHead = i === 0;
            
            let segmentColor = primary;
            let currentRadius = radius;
            let currentGlow = glow;

            // Logique de pattern améliorée pour les drapeaux
            if (pattern === 'rainbow') {
                segmentColor = `hsl(${(i * 10 + Date.now() / 20) % 360}, 100%, 60%)`;
                currentGlow = segmentColor;
            } else if (pattern === 'stripes') {
                segmentColor = (Math.floor(i / 3) % 2 === 0) ? primary : secondary;
                currentGlow = segmentColor;
            } else if (pattern === 'flag' && skin?.flagColors) {
                // Bandes plus larges (3 segments par couleur) pour une meilleure visibilité
                const colorIdx = Math.floor(i / 3) % skin.flagColors.length;
                segmentColor = skin.flagColors[colorIdx];
                // Lueur assortie à la couleur du drapeau
                currentGlow = segmentColor;
            } else if (pattern === 'pulse') {
                const pulseFactor = 0.5 + Math.sin(Date.now() / 200 - i * 0.2) * 0.5;
                ctx.globalAlpha = 0.7 + pulseFactor * 0.3;
            }

            // Effet visuel plus intense sur la tête ou en boost
            ctx.shadowBlur = isHead ? (worm.isBoost ? 35 : 25) : (pattern === 'flag' ? 12 : 5); 
            ctx.shadowColor = worm.isBoost ? '#ffffff' : currentGlow;
            
            const bodyGrad = ctx.createRadialGradient(
                seg.x - currentRadius * 0.2, 
                seg.y - currentRadius * 0.2, 
                currentRadius * 0.05, 
                seg.x, 
                seg.y, 
                currentRadius
            );
            
            // Pour les drapeaux, on réduit le reflet blanc pour garder la couleur pure
            const highlightAlpha = pattern === 'flag' ? '44' : '88';
            bodyGrad.addColorStop(0, pattern === 'metallic' ? '#ffffff' : `#ffffff${highlightAlpha}`); 
            bodyGrad.addColorStop(0.3, segmentColor); 
            bodyGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
            
            ctx.fillStyle = bodyGrad; 
            ctx.beginPath(); 
            ctx.arc(seg.x, seg.y, currentRadius, 0, Math.PI * 2); 
            ctx.fill();

            // Détails du motif Grid
            if (pattern === 'grid') {
                ctx.strokeStyle = secondary;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(seg.x - currentRadius, seg.y);
                ctx.lineTo(seg.x + currentRadius, seg.y);
                ctx.moveTo(seg.x, seg.y - currentRadius);
                ctx.lineTo(seg.x, seg.y + currentRadius);
                ctx.stroke();
            }
        }

        // Yeux
        const head = segs[0]; 
        const eyeOffset = radius * 0.6;
        [{ x: head.x + Math.cos(worm.angle + 0.6) * eyeOffset, y: head.y + Math.sin(worm.angle + 0.6) * eyeOffset }, 
         { x: head.x + Math.cos(worm.angle - 0.6) * eyeOffset, y: head.y + Math.sin(worm.angle - 0.6) * eyeOffset }].forEach(pos => {
            const eyeSize = radius * 0.45; 
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, eyeSize, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(pos.x + Math.cos(worm.angle) * (eyeSize*0.3), pos.y + Math.sin(worm.angle) * (eyeSize*0.3), eyeSize*0.5, 0, Math.PI * 2); ctx.fill();
        });

        drawAccessory(ctx, worm, head, radius);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
        ctx.font = `bold ${Math.max(14, radius * 1.0)}px Rajdhani`; 
        ctx.textAlign = 'center';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'black';
        ctx.fillText(worm.name, head.x, head.y - (radius + 30));
        ctx.restore();
    };

    const drawDirectionArrow = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        if (worm.isDead) return;
        const head = worm.segments[0];
        const arrowDist = 60 + worm.radius;
        const arrowSize = 16;
        ctx.save();
        ctx.translate(head.x + Math.cos(worm.angle) * arrowDist, head.y + Math.sin(worm.angle) * arrowDist);
        ctx.rotate(worm.angle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; 
        ctx.lineWidth = 4; 
        ctx.beginPath(); 
        ctx.moveTo(-arrowSize, -arrowSize); 
        ctx.lineTo(0, 0); 
        ctx.lineTo(-arrowSize, arrowSize); 
        ctx.stroke();
        ctx.restore();
    };

    const drawMinimap = (ctx: CanvasRenderingContext2D, player: Worm, others: Worm[]) => {
        const mapSize = 130; 
        const margin = 20;
        const cx = ctx.canvas.width - mapSize/2 - margin;
        const cy = ctx.canvas.height - mapSize/2 - margin;
        const r = mapSize / 2;
        const scale = mapSize / WORLD_SIZE;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();

        others.forEach(w => {
            if (w.isDead) return;
            const h = w.segments[0];
            const mx = cx + (h.x * scale - r);
            const my = cy + (h.y * scale - r);
            ctx.fillStyle = w.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        const ph = player.segments[0];
        const px = cx + (ph.x * scale - r);
        const py = cy + (ph.y * scale - r);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const player = playerWormRef.current;
        if (!player) return;
        
        const currentGameState = gameStateRef.current;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        const cam = cameraRef.current;
        let offsetX = -cam.x + ctx.canvas.width / 2;
        let offsetY = -cam.y + ctx.canvas.height / 2;
        
        if (shakeRef.current > 0) { 
            offsetX += (Math.random() - 0.5) * shakeRef.current; 
            offsetY += (Math.random() - 0.5) * shakeRef.current; 
        }

        const zoom = Math.max(0.4, 1.0 - (player.radius - 12) * 0.015);
        const minX = cam.x - (ctx.canvas.width / zoom + 400) / 2;
        const maxX = cam.x + (ctx.canvas.width / zoom + 400) / 2;
        const minY = cam.y - (ctx.canvas.height / zoom + 400) / 2;
        const maxY = cam.y + (ctx.canvas.height / zoom + 400) / 2;

        ctx.save();
        ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-ctx.canvas.width/2, -ctx.canvas.height/2);
        ctx.translate(offsetX, offsetY);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
        ctx.lineWidth = 4;
        for (let i = Math.max(0, Math.floor(minX / 400) * 400); i <= Math.min(WORLD_SIZE, Math.ceil(maxX / 400) * 400); i += 400) { 
            ctx.beginPath(); ctx.moveTo(i, Math.max(0, minY)); ctx.lineTo(i, Math.min(WORLD_SIZE, maxY)); ctx.stroke(); 
        }
        for (let i = Math.max(0, Math.floor(minY / 400) * 400); i <= Math.min(WORLD_SIZE, Math.ceil(maxY / 400) * 400); i += 400) { 
            ctx.beginPath(); ctx.moveTo(Math.max(0, minX), i); ctx.lineTo(Math.min(WORLD_SIZE, maxX), i); ctx.stroke(); 
        }
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.35)'; 
        ctx.lineWidth = 40; 
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        foodRef.current.forEach(f => {
            if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) return;
            const grad = ctx.createRadialGradient(f.x - 2, f.y - 2, 0, f.x, f.y, 4 + f.val);
            grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, f.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.val, 0, Math.PI * 2); ctx.fill();
        });

        particlesRef.current.forEach(p => { 
            ctx.fillStyle = p.color; 
            ctx.globalAlpha = p.life; 
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); 
            ctx.globalAlpha = 1.0; 
        });

        othersRef.current.forEach(worm => { 
            if (worm.segments[0].x > minX - 1000 && worm.segments[0].x < maxX + 1000 && worm.segments[0].y > minY - 1000 && worm.segments[0].y < maxY + 1000) {
                drawWorm(ctx, worm); 
            }
        });
        
        if (currentGameState !== 'DYING') drawWorm(ctx, player);
        if (currentGameState === 'PLAYING') drawDirectionArrow(ctx, player);
        
        ctx.restore();

        if (currentGameState === 'PLAYING') {
            drawMinimap(ctx, player, othersRef.current);
        }
    };

    const loop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        
        onUpdateRef.current(dt);
        
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => onInputStart(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e: React.TouchEvent) => onInputMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleMouseDown = (e: React.MouseEvent) => onInputStart(e.clientX, e.clientY);
    const handleMouseMove = (e: React.MouseEvent) => onInputMove(e.clientX, e.clientY);

    return (
        <canvas 
            ref={canvasRef} 
            width={window.innerWidth} 
            height={window.innerHeight} 
            className="w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={onInputEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={onInputEnd}
        />
    );
};
