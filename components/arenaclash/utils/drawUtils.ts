
import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT, SpecialZone } from '../constants';
import { drawUrbanInfrastructure, drawStreetLights } from './urbanDrawer';

/**
 * Dessine les éléments atmosphériques selon la map
 */
export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig, aiBgImage?: HTMLImageElement | null) => {
    const time = Date.now();
    
    // 1. Fond Image IA (Gemini) si disponible
    if (aiBgImage) {
        ctx.drawImage(aiBgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Si on a l'image IA, on réduit l'opacité du décor procédural pour harmoniser
        ctx.globalAlpha = 0.4;
    }

    // 2. Décoration procédurale selon la thématique
    if (map.id === 'city') {
        drawUrbanInfrastructure(ctx, map);
        drawStreetLights(ctx, time);
        drawSpecialZones(ctx, map, time);
    } else if (map.id === 'forest') {
        drawForestGround(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawFireflies(ctx, time);
    } else if (map.id === 'solar_dust') {
        drawDesertAtmosphere(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawDunes(ctx, time);
    }
    
    ctx.globalAlpha = 1.0;
};

/**
 * Dessine les zones spéciales
 */
const drawSpecialZones = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    map.zones.forEach(zone => {
        ctx.save();
        const pulse = Math.sin(time / 400) * 10;
        let color = '#fff';
        if (zone.type === 'HEAL') color = '#22c55e';
        else if (zone.type === 'DANGER') color = '#ef4444';
        else if (zone.type === 'SLOW') color = '#78350f';
        else color = '#facc15';
        
        ctx.translate(zone.x, zone.y);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, zone.radius + pulse);
        grad.addColorStop(0, color + '33');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, zone.radius + pulse, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = color + '66';
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 2;
        ctx.rotate(time / 2000);
        ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI * 2); ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.restore();
    });
};

/**
 * Dessine un bâtiment ou obstacle
 */
export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    const time = Date.now();
    
    if (obs.type === 'building') {
        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(obs.x + 10, obs.y + 10, obs.w, obs.h);
        
        // Structure
        ctx.fillStyle = '#080812';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        // Bordure néon
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = map.colors.wallBorder;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        // Fenêtres (Détail urbain)
        const winW = 8, winH = 8, gap = 12;
        ctx.fillStyle = map.colors.wallBorder + '22';
        for (let wx = obs.x + gap; wx < obs.x + obs.w - gap; wx += winW + gap) {
            for (let wy = obs.y + gap; wy < obs.y + obs.h - gap; wy += winH + gap) {
                if ((wx + wy + Math.floor(time/2000)) % 5 === 0) {
                    ctx.fillStyle = map.colors.wallBorder + '88';
                    ctx.fillRect(wx, wy, winW, winH);
                }
            }
        }
    } else if (obs.type === 'tree') {
        const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2, radius = obs.w/2;
        ctx.fillStyle = 'rgba(2, 44, 34, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#22c55e';
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
    
    ctx.restore();
};

/**
 * Dessine un tank
 */
export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name, shield } = char;
    const primary = skin?.primaryColor || char.color;
    const glow = skin?.glowColor || primary;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const bodyW = radius * 1.9;
    const bodyH = radius * 1.7;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#0f172a'; 
    ctx.beginPath(); ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 4); ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    const barrelW = radius * 1.6;
    const barrelH = radius * 0.45;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bodyW/4 - recoil, -barrelH/2, barrelW, barrelH, 2); ctx.fill(); ctx.stroke();

    const turretRadius = radius * 0.65;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(0, 0, turretRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (shield > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // HP Bar
    ctx.save();
    ctx.translate(x, y - radius - 35);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 0, -8);
    const barW = 50, barH = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.roundRect(-barW/2, 0, barW, barH, 2); ctx.fill();
    const hpPercent = Math.max(0, hp / maxHp);
    ctx.fillStyle = hpPercent > 0.4 ? primary : '#ef4444';
    ctx.beginPath(); ctx.roundRect(-barW/2, 0, hpPercent * barW, barH, 2); ctx.fill();
    ctx.restore();
};

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    const grad = ctx.createRadialGradient(0,0,0,0,0,b.radius * 2);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, b.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, pw: PowerUp, time: number) => {
    const bob = Math.sin(time / 250) * 8;
    ctx.save();
    ctx.translate(pw.x, pw.y + bob);
    ctx.rotate(time / 800);
    ctx.fillStyle = pw.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = pw.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.lineTo(Math.cos(a) * pw.radius, Math.sin(a) * pw.radius);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

const drawUrbanAmbience = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    const scanY = (time / 10) % CANVAS_HEIGHT;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)';
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_WIDTH, scanY); ctx.stroke();
    ctx.restore();
};

const drawForestGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
    for(let i=0; i<200; i++) {
        const x = (i * 791) % CANVAS_WIDTH;
        const y = (i * 443) % CANVAS_HEIGHT;
        const size = 100 + Math.sin(time / 2000 + i) * 20;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

const drawFireflies = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    for(let i=0; i<60; i++) {
        const x = (i * 333 + Math.sin(time/1000 + i)*50) % CANVAS_WIDTH;
        const y = (i * 666 + Math.cos(time/1200 + i)*50) % CANVAS_HEIGHT;
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#facc15';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

const drawDesertAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(251, 146, 60, 0.05)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
};

const drawDunes = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.1)';
    ctx.lineWidth = 2;
    for(let i=0; i<20; i++) {
        const y = (i * 150 + time / 100) % CANVAS_HEIGHT;
        ctx.beginPath(); ctx.moveTo(0, y);
        for(let x=0; x<CANVAS_WIDTH; x+=100) {
            ctx.lineTo(x, y + Math.sin(x/200 + time/1000) * 20);
        }
        ctx.stroke();
    }
    ctx.restore();
};
