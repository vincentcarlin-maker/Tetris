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
        drawDesertAtmosphere(ctx, time);
        drawSpecialZones(ctx, map, time);
        drawDunes(ctx, time);
    } else {
        drawRoads(ctx, map, time);
        drawSpecialZones(ctx, map, time);
        drawUrbanAmbience(ctx, map, time);
    }
};

/**
 * Rendu complexe des dunes de sable ondulées
 */
const drawDunes = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    
    // 1. Grain de sable (texture de fond)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let i=0; i<300; i++) {
        const x = (i * 1337) % CANVAS_WIDTH;
        const y = (i * 7331) % CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
    }

    // 2. Ondulations des dunes (Arcade semi-réaliste)
    // On dessine plusieurs couches de courbes avec des dégradés
    const drawDuneWave = (yOffset: number, height: number, color1: string, color2: string) => {
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        for(let x=0; x <= CANVAS_WIDTH; x += 200) {
            const y = yOffset + Math.sin(x / 400 + yOffset) * height;
            ctx.quadraticCurveTo(x - 100, yOffset - height, x, y);
        }
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.lineTo(0, CANVAS_HEIGHT);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, yOffset - height, 0, yOffset + height);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fill();
    };

    // Couche de fond (Sable sombre / Ombres)
    drawDuneWave(200, 40, 'rgba(139, 69, 19, 0.1)', 'transparent');
    drawDuneWave(800, 60, 'rgba(160, 82, 45, 0.1)', 'transparent');
    drawDuneWave(1600, 50, 'rgba(139, 69, 19, 0.1)', 'transparent');

    // 3. Traces de vent / chemins sinueux
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.05)';
    ctx.lineWidth = 40;
    ctx.setLineDash([50, 150]);
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        const startY = 400 + i * 500;
        ctx.moveTo(0, startY);
        ctx.bezierCurveTo(CANVAS_WIDTH/3, startY - 100, CANVAS_WIDTH*0.6, startY + 100, CANVAS_WIDTH, startY);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.restore();
};

/**
 * Effets atmosphériques du désert (Chaleur, Mirages)
 */
const drawDesertAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    
    // Scintillement de chaleur (Heat Haze) sur les bords
    const shimmer = Math.sin(time / 200) * 0.02;
    ctx.globalAlpha = 0.1 + shimmer;
    ctx.fillStyle = '#f97316';
    // Subtile teinte chaude globale
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Particules de poussière tourbillonnantes
    for(let i=0; i<60; i++) {
        const speed = 0.5 + (i % 2);
        const x = (i * 380 + time * 0.05 * speed) % CANVAS_WIDTH;
        const y = (i * 610 + Math.sin(time/800 + i)*80) % CANVAS_HEIGHT;
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
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
 * Rendu détaillé d'un palmier (vue top-down)
 */
const drawPalm = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) => {
    ctx.save();
    ctx.translate(x, y);
    const sway = Math.sin(time / 1000) * 0.1;
    ctx.rotate(sway);

    // Ombre portée
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(10, 10, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tronc central (Cercle brun)
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Feuilles (8 branches)
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 8 + sway);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.5, size * 0.2, size, 0);
        ctx.stroke();
        
        // Détails feuilles (nervures)
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

/**
 * Dessine un bâtiment, un arbre, un cactus ou un obélisque
 */
export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    const time = Date.now();
    
    if (obs.type === 'palm') {
        drawPalm(ctx, obs.x + obs.w/2, obs.y + obs.h/2, obs.w, time);
    } else if (obs.type === 'cactus') {
        const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
        // Corps
        ctx.fillStyle = '#2e7d32';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4ade80';
        ctx.beginPath(); ctx.arc(cx, cy, obs.w/2, 0, Math.PI*2); ctx.fill();
        // Épines (petites lignes blanches)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for(let i=0; i<12; i++) {
            const a = (i * Math.PI * 2) / 12;
            const len = 4;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a)*(obs.w/2 - 2), cy + Math.sin(a)*(obs.w/2 - 2));
            ctx.lineTo(cx + Math.cos(a)*(obs.w/2 + len), cy + Math.sin(a)*(obs.w/2 + len));
            ctx.stroke();
        }
    } else if (obs.type === 'obelisk' || obs.type === 'ruin') {
        // Ombre portée
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(obs.x + 8, obs.y + 8, obs.w, obs.h);
        
        // Corps de pierre érodée
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
        grad.addColorStop(0, '#8d6e63');
        grad.addColorStop(1, '#4e342e');
        ctx.fillStyle = grad;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        // Bordure néon orange pour les ruines
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        
        // Gravures lumineuses
        ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
        for(let i=1; i<4; i++) {
            const y = obs.y + (obs.h / 5) * i;
            ctx.fillRect(obs.x + 5, y, obs.w - 10, 2);
        }
    } else if (obs.type === 'pond') {
        // --- RENDU OASIS SCINTILLANTE ---
        const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
        const radius = obs.w/2;
        
        // Bordure herbeuse
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath(); ctx.arc(cx, cy, radius + 15, 0, Math.PI*2); ctx.fill();
        
        // Eau
        const waterGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        waterGrad.addColorStop(0, '#00bcd4');
        waterGrad.addColorStop(1, '#006064');
        ctx.fillStyle = waterGrad;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();
        
        // Scintillements (Flats blancs)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4 + Math.sin(time / 300) * 0.2;
        for(let i=0; i<3; i++) {
            const sx = cx + Math.cos(time/500 + i)*20;
            const sy = cy + Math.sin(time/400 + i)*20;
            ctx.beginPath(); ctx.ellipse(sx, sy, 10, 3, Math.PI/4, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;

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
 * Rendu d'un tank
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
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

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
