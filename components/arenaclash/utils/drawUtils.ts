import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT, SpecialZone } from '../constants';

/**
 * Dessine les marquages au sol des routes (Lignes, Passages, Flèches)
 */
const drawRoads = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    ctx.save();
    ctx.strokeStyle = map.colors.wallBorder + '22';
    ctx.lineWidth = 2;

    // 1. LIGNES DE BORD DE ROUTE & VOIES
    const step = 400;
    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        // Verticales
        ctx.setLineDash([20, 20]);
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        // Horizontales
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. PASSAGES PIÉTONS AUX INTERSECTIONS
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = step; x < CANVAS_WIDTH; x += step) {
        for (let y = step; y < CANVAS_HEIGHT; y += step) {
            // Dessin de 4 bandes par passage
            for(let b=0; b<4; b++) {
                ctx.fillRect(x - 60, y - 30 + (b*15), 120, 8); // Horizontal
                ctx.fillRect(x - 30 + (b*15), y - 60, 8, 120); // Vertical
            }
            
            // 3. RONDS LUMINEUX DE CARREFOUR
            const pulse = Math.sin(time / 500) * 5;
            ctx.strokeStyle = map.colors.wallBorder + '44';
            ctx.beginPath(); ctx.arc(x, y, 40 + pulse, 0, Math.PI * 2); ctx.stroke();
        }
    }

    // 4. FLÈCHES DIRECTIONNELLES
    ctx.fillStyle = map.colors.wallBorder + '11';
    for (let i = 200; i < CANVAS_WIDTH; i += step) {
        ctx.save();
        ctx.translate(i, 200);
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(15, 0); ctx.lineTo(5, 0); ctx.lineTo(5, 20);
        ctx.lineTo(-5, 20); ctx.lineTo(-5, 0); ctx.lineTo(-15, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    ctx.restore();
};

/**
 * Dessine les zones spéciales (Heal, Danger, etc.)
 */
const drawSpecialZones = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    map.zones.forEach(zone => {
        ctx.save();
        const pulse = Math.sin(time / 400) * 10;
        const color = zone.type === 'HEAL' ? '#22c55e' : zone.type === 'DANGER' ? '#ef4444' : '#facc15';
        
        ctx.translate(zone.x, zone.y);
        
        // Halo de base
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, zone.radius + pulse);
        grad.addColorStop(0, color + '33');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, zone.radius + pulse, 0, Math.PI * 2); ctx.fill();

        // Bordure technique
        ctx.strokeStyle = color + '66';
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 2;
        ctx.rotate(time / 2000);
        ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI * 2); ctx.stroke();
        
        // Label holographique
        ctx.setLineDash([]);
        ctx.rotate(-time / 2000);
        ctx.fillStyle = color;
        ctx.font = 'bold 10px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(zone.label, 0, -zone.radius - 10);
        
        ctx.restore();
    });
};

/**
 * Dessine un bâtiment ou mobilier avec détails riches
 */
export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    const time = Date.now();
    
    if (obs.type === 'building') {
        // Ombre portée (pseudo-3D)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(obs.x + 10, obs.y + 10, obs.w, obs.h);

        // Façade toit
        ctx.fillStyle = '#080812';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        
        // Fenêtres & Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for(let gx = obs.x + 10; gx < obs.x + obs.w; gx += 20) {
            ctx.beginPath(); ctx.moveTo(gx, obs.y); ctx.lineTo(gx, obs.y + obs.h); ctx.stroke();
        }

        // --- GREEBLES DE TOIT ---
        // Panneaux Solaires
        if (obs.w > 100) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(obs.x + 20, obs.y + 20, 40, 30);
            ctx.strokeStyle = '#3b82f644';
            ctx.strokeRect(obs.x + 20, obs.y + 20, 40, 30);
        }

        // Ventilateur animé
        if (obs.h > 100) {
            const vx = obs.x + obs.w - 30, vy = obs.y + obs.h - 30;
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(vx, vy, 15, 0, Math.PI*2); ctx.fill();
            ctx.save();
            ctx.translate(vx, vy);
            ctx.rotate(time / 100);
            ctx.strokeStyle = '#444';
            for(let i=0; i<4; i++) {
                ctx.rotate(Math.PI/2);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,12); ctx.stroke();
            }
            ctx.restore();
        }

        // ID de Bloc / Lettre de Zone
        if (obs.subType) {
            ctx.fillStyle = map.colors.wallBorder + '44';
            ctx.font = 'bold 40px Rajdhani';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obs.subType, obs.x + obs.w/2, obs.y + obs.h/2);
        }

        // Bordure Néon
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = map.colors.wallBorder;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        
    } else if (obs.type === 'crate') {
        // Caisses de couverture
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#facc1566';
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        ctx.beginPath(); ctx.moveTo(obs.x, obs.y); ctx.lineTo(obs.x+obs.w, obs.y+obs.h); ctx.stroke();
    } else if (obs.type === 'pylon') {
        // Potelets de sécurité
        ctx.fillStyle = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, 8, 0, Math.PI*2); ctx.fill();
    }
    
    ctx.restore();
};

/**
 * Dessine les éléments d'ambiance globaux
 */
export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const time = Date.now();
    
    // 1. Voirie et marquages
    drawRoads(ctx, map, time);
    
    // 2. Zones de Gameplay
    drawSpecialZones(ctx, map, time);

    // 3. EFFET DE SCAN (Ligne horizontale qui descend)
    ctx.save();
    const scanY = (time / 10) % CANVAS_HEIGHT;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)';
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_WIDTH, scanY); ctx.stroke();
    ctx.restore();

    // 4. PARTICULES URBAINES (Points lumineux fixes mais pulsants)
    for(let i=0; i<100; i++) {
        const px = (i * 137) % CANVAS_WIDTH;
        const py = (i * 543) % CANVAS_HEIGHT;
        const pSize = (Math.sin(time / 1000 + i) + 1.5);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI*2); ctx.fill();
    }
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

    // CHÂSSIS
    const bodyW = radius * 1.9;
    const bodyH = radius * 1.7;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#0f172a'; 
    ctx.beginPath(); ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 4); ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // CANON
    const barrelW = radius * 1.6;
    const barrelH = radius * 0.45;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bodyW/4 - recoil, -barrelH/2, barrelW, barrelH, 2); ctx.fill(); ctx.stroke();

    // TOURELLE
    const turretRadius = radius * 0.65;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(0, 0, turretRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = primary; ctx.lineWidth = 2; ctx.stroke();
    
    // Noyau d'énergie
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

    // INTERFACE
    ctx.save();
    ctx.translate(x, y - radius - 35);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(name.toUpperCase(), 0, -8);
    
    const barW = 50;
    const barH = 5;
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