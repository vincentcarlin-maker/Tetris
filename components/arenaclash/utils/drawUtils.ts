import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

/**
 * Utilitaires de dessin de formes complexes
 */
const drawACUnit = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x, y, size, size);
    // Ventilateur
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
    ctx.strokeStyle = '#444';
    ctx.stroke();
    // Pales
    const angle = (Date.now() / 100) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(x + size/2 + Math.cos(angle) * size/3, y + size/2 + Math.sin(angle) * size/3);
    ctx.lineTo(x + size/2 - Math.cos(angle) * size/3, y + size/2 - Math.sin(angle) * size/3);
    ctx.stroke();
};

const drawHelipad = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `bold ${size/2}px Rajdhani`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', x, y);
};

export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name, vx, vy } = char;
    const now = Date.now();
    
    ctx.save();
    ctx.translate(x, y);
    
    const primary = skin?.primaryColor || char.color;
    const secondary = skin?.secondaryColor || '#1a1a2e';
    const glow = skin?.glowColor || primary;

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

    ctx.save();
    ctx.rotate(angle);
    const treadWidth = 10;
    const treadLength = radius * 2.2;
    const isMoving = Math.abs(vx) + Math.abs(vy) > 0.1;
    const treadOffset = isMoving ? (now / 50) % 15 : 0;

    const drawTreadSide = (sideY: number) => {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(-treadLength/2, sideY, treadLength, treadWidth);
        ctx.strokeStyle = primary;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        for (let i = -treadLength/2 + treadOffset; i < treadLength/2; i += 10) {
            ctx.beginPath(); ctx.moveTo(i, sideY); ctx.lineTo(i, sideY + treadWidth); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    };
    drawTreadSide(-radius - 2);
    drawTreadSide(radius - treadWidth + 2);
    ctx.restore();

    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = secondary;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius, -radius * 0.7);
    ctx.lineTo(radius * 0.5, -radius * 0.7);
    ctx.lineTo(radius, 0);
    ctx.lineTo(radius * 0.5, radius * 0.7);
    ctx.lineTo(-radius, radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(angle);
    ctx.translate(-recoil, 0);
    ctx.fillStyle = primary;
    ctx.shadowBlur = 20;
    ctx.shadowColor = glow;
    ctx.fillRect(0, -4, radius * 1.8, 8);
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.save();
    ctx.translate(x, y - radius - 25);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 0, -8);
    const barW = 50;
    const barH = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW/2, 0, barW, barH);
    const hpWidth = Math.max(0, (hp / maxHp) * barW);
    ctx.fillStyle = hp > 30 ? primary : '#ff0000';
    ctx.fillRect(-barW/2, 0, hpWidth, barH);
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
        // --- TOIT DU BÂTIMENT ---
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        // Bordure haute du toit
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 4;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        
        // Rebord intérieur (parapet)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeRect(obs.x + 8, obs.y + 8, obs.w - 16, obs.h - 16);

        // --- DÉTAILS TECHNIQUES SUR LE TOIT ---
        // 1. Unités de clim
        drawACUnit(ctx, obs.x + 20, obs.y + 20, 25);
        if (obs.w > 100) drawACUnit(ctx, obs.x + 50, obs.y + 20, 25);

        // 2. Héliport pour les grands bâtiments
        if (obs.w > 200 && obs.h > 200) {
            drawHelipad(ctx, obs.x + obs.w/2, obs.y + obs.h/2, 80);
        }

        // 3. Conduits techniques
        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w - 40, obs.y + 40);
        ctx.lineTo(obs.x + obs.w - 40, obs.y + obs.h - 40);
        ctx.stroke();

        // 4. Antennes satellites
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(obs.x + obs.w - 30, obs.y + 30, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

    } else if (obs.type === 'tree') {
        ctx.fillStyle = '#051405';
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (obs.type === 'pond') {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
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
    
    // Grille de base
    ctx.strokeStyle = map.colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 200) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 200) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // --- DÉCORATIONS VILLE (AU SOL) ---
    if (map.id === 'city') {
        // 1. Signalisation Routière
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 400; x < CANVAS_WIDTH; x += 400) {
            for (let y = 400; y < CANVAS_HEIGHT; y += 400) {
                // Passages piétons
                for (let i = 0; i < 5; i++) {
                    ctx.fillRect(x - 40, y - 60 + i*25, 80, 12);
                }
                // Flèches au sol
                ctx.save();
                ctx.translate(x + 100, y + 100);
                ctx.beginPath();
                ctx.moveTo(0, -20); ctx.lineTo(10, 0); ctx.lineTo(-10, 0); ctx.closePath();
                ctx.fill();
                ctx.fillRect(-3, 0, 6, 20);
                ctx.restore();
            }
        }

        // 2. Lampadaires Urbains (Éclairage JAUNE demandé)
        const lampColor = '#facc15'; 
        ctx.shadowBlur = 30;
        ctx.shadowColor = lampColor;
        for (let x = 0; x <= CANVAS_WIDTH; x += 400) {
            for (let y = 0; y <= CANVAS_HEIGHT; y += 400) {
                // Point lumineux du lampadaire
                ctx.fillStyle = lampColor;
                ctx.globalAlpha = 0.6 + Math.sin(now / 500) * 0.2;
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Halo au sol
                ctx.globalAlpha = 0.1;
                ctx.beginPath();
                ctx.arc(x, y, 60, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    // Particules décoratives
    ctx.fillStyle = map.colors.wallBorder;
    for (let i = 0; i < 25; i++) {
        const px = (i * 347 + now / 12) % CANVAS_WIDTH;
        const py = (i * 211 + now / 18) % CANVAS_HEIGHT;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
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
