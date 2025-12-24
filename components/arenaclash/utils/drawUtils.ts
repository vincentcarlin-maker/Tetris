
import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    const { x, y, angle, radius, skin, hp, maxHp, shield, name } = char;
    ctx.save();
    ctx.translate(x, y);
    
    // Ombre portée
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetY = 5;

    ctx.rotate(angle);
    
    const primary = skin?.primaryColor || char.color;
    const secondary = skin?.secondaryColor || '#1a1a2e';

    // Corps du char
    ctx.fillStyle = secondary;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 6);
    ctx.fill();
    ctx.stroke();

    // Canon avec recul
    ctx.fillStyle = primary;
    ctx.fillRect(radius - recoil, -6, 25, 12);
    ctx.strokeRect(radius - recoil, -6, 25, 12);

    // Chenilles
    ctx.fillStyle = '#111';
    ctx.fillRect(-radius - 4, -radius, 8, radius * 2);
    ctx.fillRect(radius - 4, -radius, 8, radius * 2);

    ctx.restore();

    // Interface au-dessus du char (HP/Shield/Nom)
    ctx.save();
    ctx.translate(x, y - radius - 20);
    
    // Barre de vie
    const barW = 50;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-barW/2, 0, barW, 6);
    ctx.fillStyle = hp > 30 ? '#22c55e' : '#ef4444';
    ctx.fillRect(-barW/2, 0, (hp / maxHp) * barW, 6);
    
    // Barre de bouclier
    if (shield > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-barW/2, -4, (shield / 50) * barW, 3);
    }

    // Nom
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 0, -8);
    ctx.restore();
};

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, pw: PowerUp, time: number) => {
    ctx.save();
    const bobbing = Math.sin(time / 200) * 5;
    ctx.translate(pw.x, pw.y + bobbing);
    ctx.beginPath();
    ctx.arc(0, 0, pw.radius, 0, Math.PI * 2);
    ctx.fillStyle = pw.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = pw.color;
    ctx.fill();
    
    // Icône centrale simplifiée
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    ctx.fillStyle = map.colors.wall;
    ctx.strokeStyle = map.colors.wallBorder;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = map.colors.wallBorder;
    
    if (obs.type === 'building') {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);
        // Détails fenêtres
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for(let i=10; i < obs.w; i+=40) {
            for(let j=10; j < obs.h; j+=40) {
                ctx.fillRect(obs.x + i, obs.y + j, 20, 20);
            }
        }
    } else {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }
    ctx.restore();
};

export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    // Grille de fond
    ctx.save();
    ctx.strokeStyle = map.colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
    ctx.restore();
};
