import { Character, MapConfig, Obstacle, Particle, Bullet, PowerUp, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

/**
 * Dessine un tank avec le style "Boutique" (Cyber-Boxy)
 * Un design massif, rectangulaire avec des bordures néon intenses.
 */
export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name } = char;
    
    // On récupère les couleurs du skin ou les couleurs par défaut
    const primary = skin?.primaryColor || char.color;
    const glow = skin?.glowColor || primary;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // --- 1. LE CHÂSSIS (Corps rectangulaire du tank) ---
    const bodyW = radius * 1.9;
    const bodyH = radius * 1.6;
    
    // Effet de Glow Néon sur le châssis
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    
    // Fond du corps (Sombre métallique)
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.beginPath();
    ctx.roundRect(-bodyW/2, -bodyH/2, bodyW, bodyH, 5);
    ctx.fill();
    
    // Bordure néon principale
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Détails intérieurs (lignes techniques)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bodyW/2 + 5, -bodyH/2 + 5, bodyW - 10, bodyH - 10);

    // --- 2. LE CANON (Rectangulaire avec recul) ---
    const barrelW = radius * 1.4;
    const barrelH = radius * 0.45;
    
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    
    // Application du recul sur l'axe X local
    ctx.beginPath();
    ctx.roundRect(bodyW/4 - recoil, -barrelH/2, barrelW, barrelH, 2);
    ctx.fill();
    ctx.stroke();

    // --- 3. LA TOURELLE (Cercle central du shop) ---
    const turretRadius = radius * 0.55;
    
    // Glow de la tourelle
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    
    // Base de la tourelle
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Centre coloré (Noyau d'énergie)
    ctx.shadowBlur = 5;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Reflet vitré sur la tourelle
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(-turretRadius*0.2, -turretRadius*0.2, turretRadius*0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- 4. INTERFACE (Nom et Barre de Vie) ---
    ctx.save();
    ctx.translate(x, y - radius - 25);
    
    // Nom du joueur
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(name.toUpperCase(), 0, -8);
    
    // Barre de vie (Background)
    const barW = 50;
    const barH = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, barW, barH, 2);
    ctx.fill();
    
    // Barre de vie (Progress)
    const hpPercent = Math.max(0, hp / maxHp);
    const hpWidth = hpPercent * barW;
    
    // Couleur dynamique (Vert -> Rouge)
    ctx.fillStyle = hpPercent > 0.4 ? primary : '#ef4444';
    ctx.shadowBlur = 8;
    ctx.shadowColor = ctx.fillStyle;
    
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, hpWidth, barH, 2);
    ctx.fill();
    
    ctx.restore();
};

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    
    // Trace de la balle
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, b.radius * 2);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.4, b.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    
    ctx.beginPath(); 
    ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.restore();
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, pw: PowerUp, time: number) => {
    const bob = Math.sin(time / 250) * 6;
    ctx.save();
    ctx.translate(pw.x, pw.y + bob);
    
    // Glow rotatif
    ctx.rotate(time / 1000);
    
    ctx.fillStyle = pw.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = pw.color;
    
    // Forme hexagonale pour le powerup
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * pw.radius;
        const y = Math.sin(angle) * pw.radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Icône / Lettre
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-(time / 1000)); // Reset rotation pour le texte
    ctx.fillText(pw.type[0], 0, 0);
    
    ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, map: MapConfig) => {
    ctx.save();
    if (obs.type === 'building') {
        // Corps du bâtiment
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
        ctx.fill();
        
        // Bordure néon
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Fenêtres cyber
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for(let i = 10; i < obs.w; i += 20) {
            ctx.beginPath(); ctx.moveTo(obs.x + i, obs.y); ctx.lineTo(obs.x + i, obs.y + obs.h); ctx.stroke();
        }
    } else if (obs.type === 'tree') {
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = map.colors.wallBorder;
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.stroke();
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
    ctx.save();
    ctx.strokeStyle = map.colors.grid;
    ctx.lineWidth = 1;
    
    // Grille de fond
    for (let x = 0; x <= CANVAS_WIDTH; x += 150) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 150) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
    
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10 * alpha;
    ctx.shadowColor = p.color;
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();
};