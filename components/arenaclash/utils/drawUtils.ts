
import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT, SpecialZone } from '../constants';

/**
 * Dessine les éléments atmosphériques selon la map
 */
export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const time = Date.now();
    if (map.id === 'forest') { drawForestGround(ctx, time); drawSpecialZones(ctx, map, time); drawFireflies(ctx, time); } 
    else if (map.id === 'solar_dust') { drawDesertAtmosphere(ctx, time); drawSpecialZones(ctx, map, time); drawDunes(ctx, time); } 
    else { drawRoads(ctx, map, time); drawSpecialZones(ctx, map, time); drawUrbanAmbience(ctx, map, time); }
};

const drawDunes = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let i=0; i<300; i++) { const x = (i * 1337) % CANVAS_WIDTH; const y = (i * 7331) % CANVAS_HEIGHT; ctx.fillRect(x, y, 2, 2); }
    const drawDuneWave = (yOff: number, h: number, c1: string, c2: string) => {
        ctx.beginPath(); ctx.moveTo(0, yOff);
        for(let x=0; x <= CANVAS_WIDTH; x += 200) { const y = yOff + Math.sin(x / 400 + yOff) * h; ctx.quadraticCurveTo(x - 100, yOff - h, x, y); }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.lineTo(0, CANVAS_HEIGHT); ctx.closePath();
        const grad = ctx.createLinearGradient(0, yOff - h, 0, yOff + h); grad.addColorStop(0, c1); grad.addColorStop(1, c2);
        ctx.fillStyle = grad; ctx.fill();
    };
    drawDuneWave(200, 40, 'rgba(139, 69, 19, 0.1)', 'transparent');
    drawDuneWave(800, 60, 'rgba(160, 82, 45, 0.1)', 'transparent');
    ctx.restore();
};

const drawDesertAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.globalAlpha = 0.1 + Math.sin(time / 200) * 0.02;
    ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
};

const drawSpecialZones = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    map.zones.forEach(zone => {
        ctx.save();
        const pulse = Math.sin(time / 400) * 10;
        let color = zone.type === 'HEAL' ? '#22c55e' : (zone.type === 'DANGER' ? '#ef4444' : '#facc15');
        ctx.translate(zone.x, zone.y);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, zone.radius + pulse);
        grad.addColorStop(0, color + '33'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, zone.radius + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color + '66'; ctx.setLineDash([10, 5]); ctx.lineWidth = 2; ctx.rotate(time / 2000);
        ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 11px Rajdhani'; ctx.textAlign = 'center'; ctx.fillText(zone.label, 0, -zone.radius - 12);
        ctx.restore();
    });
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    if (obs.type === 'building') {
        ctx.fillStyle = '#080812'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = map.colors.wallBorder; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = map.colors.wallBorder;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    } else if (obs.type === 'tree') {
        ctx.fillStyle = 'rgba(2, 44, 34, 0.8)'; ctx.shadowBlur = 20; ctx.shadowColor = '#22c55e';
        ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2); ctx.fill();
    } else { ctx.fillStyle = '#1e293b'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h); }
    ctx.restore();
};

export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name, shield } = char;
    const primary = skin?.primaryColor || char.color;
    const glow = skin?.glowColor || primary;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const bodyW = radius * 1.9, bodyH = radius * 1.7;
    ctx.shadowBlur = 15; ctx.shadowColor = glow; ctx.fillStyle = '#0f172a'; 
    ctx.beginPath(); ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 4); ctx.fill();
    ctx.strokeStyle = primary; ctx.lineWidth = 3; ctx.stroke();
    const barrelW = radius * 1.6, barrelH = radius * 0.45;
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = primary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bodyW/4 - recoil, -barrelH/2, barrelW, barrelH, 2); ctx.fill(); ctx.stroke();
    const turretRadius = radius * 0.65;
    ctx.shadowBlur = 10; ctx.shadowColor = glow; ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(0, 0, turretRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = primary; ctx.lineWidth = 2; ctx.stroke();
    if (shield > 0) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.shadowBlur = 20; ctx.shadowColor = '#3b82f6'; ctx.beginPath(); ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(x, y - radius - 35);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Rajdhani'; ctx.textAlign = 'center'; ctx.fillText(name.toUpperCase(), 0, -8);
    const barW = 50, barH = 5; ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.roundRect(-barW/2, 0, barW, barH, 2); ctx.fill();
    const hpPercent = Math.max(0, hp / maxHp), hpColor = hpPercent > 0.4 ? primary : '#ef4444';
    ctx.fillStyle = hpColor; ctx.shadowBlur = 10; ctx.shadowColor = hpColor;
    ctx.beginPath(); ctx.roundRect(-barW/2, 0, hpPercent * barW, barH, 2); ctx.fill(); ctx.restore();
};

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save(); ctx.translate(b.x, b.y);
    const grad = ctx.createRadialGradient(0,0,0,0,0,b.radius * 2);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, b.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.shadowBlur = 10; ctx.shadowColor = b.color;
    ctx.beginPath(); ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, pw: PowerUp, time: number) => {
    const bob = Math.sin(time / 250) * 8;
    let color = '#fff', icon = '?';
    switch(pw.type) {
        case 'HEALTH': color = '#22c55e'; icon = 'H'; break;
        case 'SHIELD': color = '#3b82f6'; icon = 'S'; break;
        case 'RAPID': color = '#ef4444'; icon = 'R'; break;
        case 'BOOST': color = '#facc15'; icon = 'V'; break;
        case 'TRIPLE': color = '#f472b6'; icon = '3'; break;
        case 'EMP': color = '#22d3ee'; icon = 'E'; break;
        case 'BOMB': color = '#ef4444'; icon = 'B'; break;
    }
    ctx.save(); ctx.translate(pw.x, pw.y + bob); ctx.rotate(time / 800);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowBlur = 20; ctx.shadowColor = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * pw.radius, Math.sin(a) * pw.radius); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-(time / 800)); ctx.fillStyle = color; ctx.font = 'bold 16px Rajdhani'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, 0, 0);
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = p.life / p.maxLife;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.2, p.color); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.shadowBlur = 15 * alpha; ctx.shadowColor = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

const drawUrbanAmbience = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    const scanY = (time / 10) % CANVAS_HEIGHT;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)'; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_WIDTH, scanY); ctx.stroke();
    ctx.restore();
};

const drawForestGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save(); ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
    for(let i=0; i<200; i++) {
        const x = (i * 791) % CANVAS_WIDTH, y = (i * 443) % CANVAS_HEIGHT, size = 100 + Math.sin(time / 2000 + i) * 20;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

const drawFireflies = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    for(let i=0; i<60; i++) {
        const x = (i * 333 + Math.sin(time/1000 + i)*50) % CANVAS_WIDTH, y = (i * 666 + Math.cos(time/1200 + i)*50) % CANVAS_HEIGHT;
        ctx.fillStyle = '#facc15'; ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
};

const drawRoads = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save(); ctx.strokeStyle = map.colors.wallBorder + '22'; ctx.lineWidth = 2;
    const step = 400;
    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        ctx.setLineDash([20, 20]);
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }
    ctx.restore();
};
