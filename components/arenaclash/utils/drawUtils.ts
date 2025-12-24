import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

/**
 * Dessine un tank avec le style "Boutique" (Cyber-Boxy)
 */
export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name } = char;
    
    const primary = skin?.primaryColor || char.color;
    const secondary = skin?.secondaryColor || '#1a1a2e';
    const glow = skin?.glowColor || primary;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 1. CHÂSSIS (Le corps rectangulaire du shop)
    const bodyW = radius * 1.8;
    const bodyH = radius * 1.8;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    
    // Fond du corps
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.beginPath();
    ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 4);
    ctx.fill();
    
    // Bordure néon
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. CANON (Le canon rectangulaire du shop)
    const barrelW = radius * 1.4;
    const barrelH = radius * 0.5;
    
    ctx.fillStyle = '#374151'; // gray-700
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    
    // On applique le recul sur le canon
    ctx.beginPath();
    ctx.roundRect(bodyW/2 - recoil, -barrelH/2, barrelW, barrelH, 2);
    ctx.fill();
    ctx.stroke();

    // 3. TOURELLE (Le cercle central du shop)
    const turretRadius = radius * 0.4;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflet sur la tourelle
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-turretRadius*0.3, -turretRadius*0.3, turretRadius*0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 4. INTERFACE (Nom et HP)
    ctx.save();
    ctx.translate(x, y - radius - 25);
    
    // Nom
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 0, -8);
    
    // Barre de vie
    const barW = 50;
    const barH = 5;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, barW, barH, 2);
    ctx.fill();
    
    const hpWidth = Math.max(0, (hp / maxHp) * barW);
    ctx.fillStyle = hp > 30 ? primary : '#ff0000';
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, hpWidth, barH, 2);
    ctx.fill();
    
    ctx.restore();
};

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, pw: PowerUp, time: number) => {
    const bob = Math.sin(time / 300) * 5;
    ctx.save();
    ctx.translate(pw.x, pw.y + bob);
    ctx.fillStyle = pw.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = pw.color;
    ctx.beginPath(); ctx.arc(0, 0, pw.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pw.type[0], 0, 0);
    ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    if (obs.type === 'building') {
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 4;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeRect(obs.x + 8, obs.y + 8, obs.w - 16, obs.h - 16);
    } else if (obs.type === 'tree') {
        ctx.fillStyle = '#051405';
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
        ctx.fillStyle = map.colors.wall;
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 2;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }
    ctx.restore();
};

export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const now = Date.now();
    ctx.save();
    ctx.strokeStyle = map.colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 200) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 200) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};