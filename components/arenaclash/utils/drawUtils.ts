import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT, SpecialZone } from '../constants';

/**
 * Dessine les éléments atmosphériques selon la map
 */
export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const time = Date.now();
    if (map.id === 'forest') { 
        drawForestGround(ctx, time); 
        drawSpecialZones(ctx, map, time); 
        drawFireflies(ctx, time); 
    } else if (map.id === 'solar_dust') { 
        drawSolarAtmosphere(ctx, time); 
        drawSpecialZones(ctx, map, time); 
        drawDunes(ctx, time); 
    } else if (map.id === 'mountain') {
        drawMountainAtmosphere(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawSnowyGround(ctx, time);
    } else { 
        drawRoads(ctx, map, time); 
        drawSpecialZones(ctx, map, time); 
        drawUrbanAmbience(ctx, map, time); 
    }
};

const drawRoads = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    const border = map.colors.wallBorder;
    ctx.strokeStyle = border + '22';
    ctx.lineWidth = 2;
    const step = 400;

    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        ctx.setLineDash([20, 20]);
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
        for (let j = 0; j <= CANVAS_HEIGHT; j += step) {
            drawCrosswalk(ctx, i, j, border);
        }
    }
    ctx.setLineDash([]);
    ctx.fillStyle = border + '33';
    for (let i = 200; i < CANVAS_WIDTH; i += 400) {
        for (let j = 200; j < CANVAS_HEIGHT; j += 400) {
            if ((i + j) % 3 === 0) drawArrow(ctx, i, j, Math.PI/2);
            else drawArrow(ctx, i, j, 0);
        }
    }
    ctx.restore();
};

const drawCrosswalk = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.save();
    const alpha = '11';
    ctx.fillStyle = color + alpha;
    const size = 60;
    for (let i = -size; i < size; i += 15) {
        ctx.fillRect(x + i, y - 45, 8, 90);
        ctx.fillRect(x - 45, y + i, 90, 8);
    }
    ctx.restore();
};

const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-10, 20); ctx.lineTo(0, 0); ctx.lineTo(10, 20);
    ctx.moveTo(0, 0); ctx.lineTo(0, 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    const time = Date.now();
    ctx.save();
    
    if (obs.type === 'building') {
        if (obs.subType === 'PYRAMID' || obs.subType === 'ZIGGURAT') {
            drawPyramid(ctx, obs, time, map.colors.wallBorder);
        } else {
            ctx.fillStyle = '#080812';
            ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeStyle = map.colors.wallBorder;
            ctx.lineWidth = 3;
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
    } else if (obs.type === 'crystal') {
        drawCrystalCluster(ctx, obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, time);
    } else if (obs.type === 'bone') {
        drawHoloBone(ctx, obs, time);
    } else if (obs.type === 'tree') {
        drawBioTree(ctx, obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, time);
    } else if (obs.type === 'palm') {
        drawPalm(ctx, obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, time);
    } else if (obs.type === 'pond' && obs.subType === 'OASIS') {
        drawOasis(ctx, obs, time);
    } else if (obs.type === 'obelisk') {
        drawObelisk(ctx, obs, time, map.colors.wallBorder);
    } else if (obs.type === 'rock' || obs.type === 'peak') {
        drawMountainRock(ctx, obs, map.colors.wallBorder, time);
    } else if (obs.type === 'ice_pillar') {
        drawIcePillar(ctx, obs, time);
    } else if (obs.type === 'pylon') {
        const glow = Math.sin(time / 500) * 5 + 25;
        ctx.fillStyle = '#222'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        const grad = ctx.createRadialGradient(obs.x+obs.w/2, obs.y+obs.h/2, 0, obs.x+obs.w/2, obs.y+obs.h/2, glow);
        grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, map.colors.wallBorder + '88'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(obs.x+obs.w/2, obs.y+obs.h/2, glow, 0, Math.PI*2); ctx.fill();
    } else { 
        ctx.fillStyle = '#1e293b'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h); 
    }
    ctx.restore();
};

const drawMountainRock = (ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, time: number) => {
    ctx.save();
    ctx.fillStyle = '#1a1f2e';
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.5)';
    
    // Forme angulaire
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y + obs.h);
    ctx.lineTo(obs.x + obs.w * 0.2, obs.y + obs.h * 0.1);
    ctx.lineTo(obs.x + obs.w * 0.5, obs.y);
    ctx.lineTo(obs.x + obs.w * 0.8, obs.y + obs.h * 0.2);
    ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.closePath();
    ctx.fill();
    
    // Arêtes lumineuses
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(time / 1000) * 0.2;
    ctx.stroke();
    
    // Neige sur le dessus
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.w * 0.2, obs.y + obs.h * 0.1);
    ctx.lineTo(obs.x + obs.w * 0.5, obs.y);
    ctx.lineTo(obs.x + obs.w * 0.8, obs.y + obs.h * 0.2);
    ctx.lineTo(obs.x + obs.w * 0.5, obs.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
};

const drawIcePillar = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) => {
    ctx.save();
    const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
    const pulse = 0.8 + Math.sin(time / 600) * 0.2;
    
    // Cœur d'énergie
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, obs.w/2);
    innerGrad.addColorStop(0, '#fff');
    innerGrad.addColorStop(0.5, '#00f3ff88');
    innerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGrad;
    ctx.beginPath(); ctx.arc(cx, cy, (obs.w/3) * pulse, 0, Math.PI*2); ctx.fill();
    
    // Coque de glace
    ctx.strokeStyle = '#cffafe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const a = (i * Math.PI * 2) / 6 + time / 2000;
        const r = obs.w/2;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(207, 250, 254, 0.1)';
    ctx.fill();
    ctx.restore();
};

const drawPyramid = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number, color: string) => {
    ctx.save();
    const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y + obs.h); ctx.lineTo(cx, obs.y); ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.closePath();
    ctx.stroke();
    const grad = ctx.createLinearGradient(cx, obs.y, cx, obs.y + obs.h);
    grad.addColorStop(0, color + '66'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fill();
    if (Math.sin(time / 1000) > 0.8) {
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx, obs.y); ctx.lineTo(cx, obs.y - 100); ctx.stroke();
    }
    ctx.restore();
};

const drawCrystalCluster = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) => {
    ctx.save();
    ctx.translate(x, y);
    const color = '#facc15';
    for(let i=0; i<3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3 + time / 2000);
        const h = radius * (1 + Math.sin(time / 500 + i) * 0.2);
        const w = radius * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-w, -h*0.7); ctx.lineTo(0, -h); ctx.lineTo(w, -h*0.7);
        ctx.closePath();
        ctx.fillStyle = color + '44'; ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = color;
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

const drawHoloBone = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) => {
    ctx.save();
    ctx.translate(obs.x + obs.w/2, obs.y + obs.h/2);
    ctx.rotate(Math.PI / 4);
    const flicker = Math.random() > 0.95 ? 0.2 : 1;
    ctx.globalAlpha = (0.3 + Math.sin(time / 400) * 0.1) * flicker;
    ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-obs.w/3, 0, 15, 0, Math.PI*2); ctx.arc(obs.w/3, 0, 15, 0, Math.PI*2);
    ctx.moveTo(-obs.w/3, 0); ctx.lineTo(obs.w/3, 0);
    ctx.stroke();
    ctx.restore();
};

const drawOasis = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) => {
    ctx.save();
    const shimmer = Math.sin(time / 300) * 5;
    const grad = ctx.createRadialGradient(obs.x+obs.w/2, obs.y+obs.h/2, 0, obs.x+obs.w/2, obs.y+obs.h/2, obs.w/2 + shimmer);
    grad.addColorStop(0, '#00f3ff44'); grad.addColorStop(0.7, '#0088ff22'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(obs.x+obs.w/2, obs.y+obs.h/2, obs.w/2 + shimmer, 0, Math.PI*2); ctx.fill();
    ctx.restore();
};

const drawPalm = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) => {
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(time / 1200) * 5;
    ctx.rotate(sway * Math.PI / 180);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -radius); ctx.stroke();
    ctx.fillStyle = '#22c55e99';
    for(let i=0; i<5; i++) {
        ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
        ctx.beginPath(); ctx.ellipse(0, -radius, radius*0.8, radius*0.2, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
};

const drawObelisk = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number, color: string) => {
    ctx.save();
    ctx.fillStyle = '#111'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    const glow = Math.abs(Math.sin(time / 800));
    ctx.shadowBlur = 15 * glow; ctx.shadowColor = color;
    ctx.fillStyle = color;
    for(let i=0; i<3; i++) { ctx.fillRect(obs.x + 5, obs.y + 20 + i*30, obs.w - 10, 5); }
    ctx.restore();
};

const drawSolarAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.globalAlpha = 0.05 + Math.sin(time / 1000) * 0.02;
    ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for(let i=0; i<40; i++) {
        const x = (i * 137 + time / 5) % CANVAS_WIDTH;
        const y = (i * 253 + Math.sin(time/500 + i)*20) % CANVAS_HEIGHT;
        ctx.fillStyle = '#facc15'; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
};

const drawMountainAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    // Brume d'altitude
    ctx.globalAlpha = 0.05 + Math.sin(time / 1500) * 0.03;
    ctx.fillStyle = '#cffafe'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Flocons de neige néon
    for(let i=0; i<80; i++) {
        const x = (i * 199 + time / 10) % CANVAS_WIDTH;
        const y = (i * 350 + time / 5) % CANVAS_HEIGHT;
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
};

const drawSnowyGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let i=0; i<15; i++) {
        const x = (i * 800 + time / 50) % CANVAS_WIDTH;
        const y = (i * 600) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.ellipse(x, y, 300, 150, Math.PI/12, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
};

const drawDunes = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const drawDuneWave = (yOff: number, h: number, c1: string) => {
        ctx.beginPath(); ctx.moveTo(0, yOff);
        for(let x=0; x <= CANVAS_WIDTH; x += 300) {
            const y = yOff + Math.sin(x / 600 + time / 5000 + yOff) * h;
            ctx.quadraticCurveTo(x - 150, yOff - h, x, y);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.lineTo(0, CANVAS_HEIGHT); ctx.closePath();
        ctx.fillStyle = c1; ctx.fill();
    };
    drawDuneWave(600, 30, 'rgba(250, 204, 21, 0.03)');
    drawDuneWave(1500, 50, 'rgba(249, 115, 22, 0.03)');
    ctx.restore();
};

const drawBioTree = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) => {
    ctx.save();
    const sway = Math.sin(time / 1000 + x) * 5;
    ctx.translate(x + sway, y);
    ctx.fillStyle = '#052e16';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) {
        const r = radius * (1 - i * 0.2);
        const alpha = 0.6 - i * 0.15;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = 15; ctx.shadowColor = '#22c55e';
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.8) {
            const rx = Math.cos(a) * r, ry = Math.sin(a) * r;
            ctx.lineTo(rx, ry);
        }
        ctx.closePath(); ctx.fill();
    }
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
    const bob = Math.sin(time / 200) * 12;
    const pulse = Math.sin(time / 300) * 5 + 20;
    let color = '#fff', icon = '?';
    switch(pw.type) {
        case 'HEALTH': color = '#22c55e'; icon = 'H'; break;
        case 'SHIELD': color = '#3b82f6'; icon = 'S'; break;
        case 'RAPID': color = '#ef4444'; icon = 'R'; break;
        case 'BOOST': color = '#facc15'; icon = 'V'; break;
        case 'TRIPLE': color = '#f472b6'; icon = '3'; break;
        case 'EMP': color = '#22d3ee'; icon = 'E'; break;
        case 'BOMB': color = '#ef4444'; icon = 'B'; break;
        case 'COIN': color = '#fbbf24'; icon = '$'; break;
    }
    ctx.save();
    const haloGrad = ctx.createRadialGradient(pw.x, pw.y, 0, pw.x, pw.y, pulse);
    haloGrad.addColorStop(0, color + '66'); haloGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = haloGrad; ctx.beginPath(); ctx.arc(pw.x, pw.y, pulse, 0, Math.PI * 2); ctx.fill();
    ctx.translate(pw.x, pw.y + bob); ctx.rotate(time / 600);
    ctx.fillStyle = 'rgba(10,10,20,0.9)'; ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; ctx.lineTo(Math.cos(a) * pw.radius, Math.sin(a) * pw.radius); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-(time / 600)); ctx.fillStyle = color; ctx.font = 'black 18px Rajdhani'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, 0, 0);
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = p.life / p.maxLife;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color; ctx.shadowBlur = 10 * alpha; ctx.shadowColor = p.color;
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
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.lineWidth = 2;
    for(let i=0; i<30; i++) {
        const x1 = (i * 1337) % CANVAS_WIDTH, y1 = (i * 7331) % CANVAS_HEIGHT;
        const x2 = ((i+1) * 1337) % CANVAS_WIDTH, y2 = ((i+1) * 7331) % CANVAS_HEIGHT;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
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
        const pulse = 0.5 + Math.sin(time / 500 + i) * 0.5;
        ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`; ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
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