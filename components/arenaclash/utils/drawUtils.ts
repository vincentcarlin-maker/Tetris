import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT, SpecialZone } from '../constants';

/**
 * Dessine les éléments atmosphériques selon la map (City vs Forest vs Solar Dust)
 */
export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const time = Date.now();
    
    if (map.id === 'forest') {
        drawForestGround(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawFireflies(ctx, time);
    } else if (map.id === 'solar_dust') {
        drawDesertGround(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawDesertAtmosphere(ctx, time);
    } else {
        drawRoads(ctx, map, time);
        drawSpecialZones(ctx, map, time);
        drawUrbanAmbience(ctx, map, time);
    }
};

/**
 * Rendu du sol du désert (Sable, Craquelures, Dunes)
 */
const drawDesertGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    
    // 1. Sol Craquelé (Pattern hexagonal irrégulier)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.05)';
    ctx.lineWidth = 1;
    const step = 200;
    for(let x=0; x < CANVAS_WIDTH; x += step) {
        for(let y=0; y < CANVAS_HEIGHT; y += step) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 50, y + 30);
            ctx.lineTo(x + 20, y + 80);
            ctx.stroke();
        }
    }

    // 2. Vagues de sable / Dunes (Arcs subtils)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.08)';
    ctx.lineWidth = 2;
    for(let i=0; i<30; i++) {
        const dx = (i * 123) % CANVAS_WIDTH;
        const dy = (i * 456) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.arc(dx, dy, 300, 0, Math.PI * 0.2);
        ctx.stroke();
    }

    ctx.restore();
};

/**
 * Effets atmosphériques du désert (Chaleur, Vent)
 */
const drawDesertAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    
    // Tourbillons de sable (Particules jaunes circulaires)
    for(let i=0; i<40; i++) {
        const speed = 1 + (i % 3);
        const x = (i * 400 + time / (10/speed)) % CANVAS_WIDTH;
        const y = (i * 700 + Math.sin(time/500 + i)*50) % CANVAS_HEIGHT;
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Lignes de vent horizontales
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for(let i=0; i<10; i++) {
        const vy = (i * 240 + time / 20) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(0, vy);
        ctx.lineTo(CANVAS_WIDTH, vy);
        ctx.stroke();
    }

    ctx.restore();
};

/**
 * Rendu du sol de la forêt
 */
const drawForestGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
    for(let i=0; i<200; i++) {
        const x = (i * 791) % CANVAS_WIDTH;
        const y = (i * 443) % CANVAS_HEIGHT;
        const size = 100 + Math.sin(time / 2000 + i) * 20;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

/**
 * Lucioles animées
 */
const drawFireflies = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    for(let i=0; i<60; i++) {
        const x = (i * 333 + Math.sin(time/1000 + i)*50) % CANVAS_WIDTH;
        const y = (i * 666 + Math.cos(time/1200 + i)*50) % CANVAS_HEIGHT;
        const glow = 2 + Math.sin(time/400 + i);
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#facc15';
        ctx.beginPath();
        ctx.arc(x, y, glow, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

/**
 * Dessine les marquages au sol urbains
 */
const drawRoads = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    ctx.strokeStyle = map.colors.wallBorder + '22';
    ctx.lineWidth = 2;
    const step = 400;
    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        ctx.setLineDash([20, 20]);
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }
    ctx.restore();
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
        ctx.rotate(-time / 2000);
        ctx.fillStyle = color;
        ctx.font = 'bold 11px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(zone.label, 0, -zone.radius - 12);
        ctx.restore();
    });
};

/**
 * Dessine un bâtiment, un arbre, un cactus ou un obélisque
 */
export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    const time = Date.now();
    
    if (obs.type === 'cactus') {
        // --- RENDU CACTUS NÉON ---
        const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
        ctx.fillStyle = '#166534';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ade80';
        ctx.beginPath(); ctx.arc(cx, cy, obs.w/2, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Spikes
        ctx.fillStyle = '#fff';
        for(let i=0; i<6; i++) {
            const a = (i * Math.PI * 2) / 6;
            ctx.beginPath(); ctx.arc(cx + Math.cos(a)*15, cy + Math.sin(a)*15, 2, 0, Math.PI*2); ctx.fill();
        }
        
    } else if (obs.type === 'obelisk') {
        // --- RENDU OBÉLISQUE ---
        ctx.fillStyle = '#2a1500';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        // Hiéroglyphes néon
        ctx.fillStyle = '#fb923c';
        ctx.globalAlpha = 0.5 + Math.sin(time/200)*0.3;
        for(let i=1; i<4; i++) {
            ctx.fillRect(obs.x + 10, obs.y + i*60, obs.w - 20, 10);
        }
        ctx.globalAlpha = 1;

    } else if (obs.type === 'bone') {
        // --- RENDU OSSEMENTS ---
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 10, 0, Math.PI);
        ctx.stroke();

    } else if (obs.type === 'tree') {
        const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2, radius = obs.w/2;
        ctx.fillStyle = 'rgba(2, 44, 34, 0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#22c55e';
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.lineWidth = 2;
        for(let r = radius; r > 5; r -= 15) {
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        }
        
    } else if (obs.type === 'ruin') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        if (map.id === 'forest') {
            ctx.fillStyle = '#22c55e';
            ctx.globalAlpha = 0.4;
            for(let i=0; i<5; i++) { ctx.beginPath(); ctx.arc(obs.x + (i*30)%obs.w, obs.y + (i*17)%obs.h, 10, 0, Math.PI*2); ctx.fill(); }
            ctx.globalAlpha = 1;
        }

    } else if (obs.type === 'pond') {
        ctx.fillStyle = map.id === 'solar_dust' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(12, 74, 110, 0.4)';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

    } else if (obs.type === 'building') {
        ctx.fillStyle = '#080812';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = map.colors.wallBorder;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
    
    ctx.restore();
};

/**
 * Décor urbain
 */
const drawUrbanAmbience = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    const scanY = (time / 10) % CANVAS_HEIGHT;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)';
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_WIDTH, scanY); ctx.stroke();
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
    ctx.lineWidth = 2; ctx.stroke();
    
    ctx.fillStyle = primary;
    ctx.beginPath(); ctx.arc(0, 0, turretRadius * 0.35, 0, Math.PI * 2); ctx.fill();

    if (shield > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
        ctx.beginPath(); ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // HP Bar
    ctx.save();
    ctx.translate(x, y - radius - 35);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(name.toUpperCase(), 0, -8);
    const barW = 50, barH = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.roundRect(-barW/2, 0, barW, barH, 2); ctx.fill();
    const hpPercent = Math.max(0, hp / maxHp);
    const hpColor = hpPercent > 0.4 ? primary : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = hpColor;
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
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
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
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-(time / 800));
    ctx.fillText(pw.type[0], 0, 0);
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10 * alpha;
    ctx.shadowColor = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};