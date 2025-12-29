
import { Character, Bullet, PowerUp, Particle } from '../../types';

/**
 * Dessine l'accessoire (drapeau) sur le char.
 */
const drawTankAccessory = (ctx: CanvasRenderingContext2D, acc: any, scale: number) => {
    const flagW = 22;
    const flagH = 14;
    
    // Positionnement adapté au nouveau design (arrière gauche du châssis)
    const posX = -60;
    const posY = 50;

    ctx.save();
    ctx.translate(posX, posY);
    
    const invScale = 1 / scale;
    ctx.scale(invScale * 0.8, invScale * 0.8); 

    // Mât du drapeau (Effet métal poli)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -25);
    ctx.stroke();

    ctx.translate(0, -25);
    
    // Animation d'ondulation pour un effet "vent"
    const wave = Math.sin(Date.now() / 200) * 2;
    
    // Structure de base du drapeau
    const dW = flagW * 1.5;
    const dH = flagH * 1.5;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, dW, dH);

    const layout = acc.layout || 'vertical';
    const colors = acc.colors || [];

    if (acc.id === 'ta_flag_neon') {
        const grad = ctx.createLinearGradient(0, 0, dW, 0);
        colors.forEach((c: string, i: number) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0 + wave/2, dW, dH);
    } else if (layout === 'japan') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0 + wave/2, dW, dH);
        ctx.fillStyle = '#BC002D';
        ctx.beginPath();
        ctx.arc(dW / 2, dH / 2 + wave/2, dH / 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (layout === 'usa') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0 + wave/2, dW, dH);
        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#fff';
            ctx.fillRect(0, (i * dH / 7) + wave/2, dW, dH / 7);
        }
        ctx.fillStyle = '#3C3B6E';
        ctx.fillRect(0, 0 + wave/2, dW * 0.45, dH * 0.55);
    } else if (layout === 'brazil') {
        ctx.fillStyle = '#009739';
        ctx.fillRect(0, 0 + wave/2, dW, dH);
        ctx.fillStyle = '#FEDD00';
        ctx.beginPath();
        ctx.moveTo(2, dH / 2 + wave/2);
        ctx.lineTo(dW / 2, dH - 2 + wave/2);
        ctx.lineTo(dW - 2, dH / 2 + wave/2);
        ctx.lineTo(dW / 2, 2 + wave/2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#012169';
        ctx.beginPath();
        ctx.arc(dW / 2, dH / 2 + wave/2, dH / 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (layout === 'pirate') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0 + wave/2, dW, dH);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(dW / 2, dH / 2 + wave/2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(dW / 2 - 4, dH / 2 + 4 + wave/2, 8, 3);
    } else {
        const isVert = layout === 'vertical';
        colors.forEach((c: string, i: number) => {
            ctx.fillStyle = c;
            if (isVert) {
                ctx.fillRect((i * dW) / colors.length, 0 + wave/2, dW / colors.length, dH);
            } else {
                ctx.fillRect(0, (i * dH) / colors.length + wave/2, dW, dH / colors.length);
            }
        });
    }
    
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0 + wave/2, dW, dH);

    ctx.restore();
};

export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name, shield, accessory, vx, vy } = char;
    
    const primary = skin?.primaryColor || char.color;     
    const secondary = skin?.secondaryColor || '#ff00ff';  
    const glow = skin?.glowColor || primary;
    
    // Calcul des angles indépendants
    // 1. Angle du corps (Châssis) : Suit le vecteur de mouvement (vx, vy)
    // Si le char est immobile, on garde l'orientation de la tourelle pour pas qu'il "snap" à 0
    const speed = Math.hypot(vx, vy);
    const bodyAngle = speed > 0.1 ? Math.atan2(vy, vx) : angle;

    // 2. Angle de la tourelle : Suit le joystick de visée (char.angle)
    const turretAngle = angle;

    // Échelle visuelle
    const scale = (radius * 2.4) / 200;

    ctx.save();
    ctx.translate(x, y);

    // --- COUCHE 1 : CHÂSSIS & CHENILLES (Rotation selon le Mouvement) ---
    ctx.save();
    ctx.rotate(bodyAngle);
    // On tourne de 90 degrés car le design SVG "regarde" vers le haut (-Y),
    // mais atan2(vy, vx) donne 0 vers la droite (+X).
    ctx.rotate(Math.PI / 2); 
    ctx.scale(scale, scale);

    // Fonction de dessin des chenilles (incluse ici pour accès au context)
    const drawTrack = (tx: number) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = glow;
        
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; 

        ctx.beginPath();
        ctx.roundRect(tx, -80, 30, 160, 5);
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        // Animation des chenilles si le char bouge
        const trackOffset = speed > 0.1 ? (Date.now() / 50) % 20 : 0;
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(tx, -80, 30, 160, 5);
        ctx.clip(); // Pour ne pas dessiner les traits hors de la chenille

        for (let i = -1; i < 9; i++) {
            const ly = -80 + i * 20 + trackOffset;
            ctx.beginPath();
            ctx.moveTo(tx, ly);
            ctx.lineTo(tx + 30, ly);
            ctx.stroke();
        }
        ctx.restore();
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    };

    drawTrack(-80); // Gauche
    drawTrack(50);  // Droite

    // Châssis central
    ctx.fillStyle = '#050510';
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    
    ctx.beginPath();
    ctx.roundRect(-50, -70, 100, 140, 10);
    ctx.fill();
    ctx.stroke();

    // Détail arrière moteur
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-40, 60);
    ctx.lineTo(40, 60);
    ctx.lineTo(30, 70);
    ctx.lineTo(-30, 70);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Accessoire (Drapeau) - Attaché au châssis
    if (accessory && accessory.id !== 'ta_none') {
        drawTankAccessory(ctx, accessory, scale);
    }
    
    ctx.restore(); // Fin rotation châssis


    // --- COUCHE 2 : TOURELLE (Rotation selon la Visée) ---
    ctx.save();
    ctx.rotate(turretAngle);
    // Ajustement de 90 degrés car le SVG pointe vers le haut (-Y)
    // mais l'angle de visée 0 est à droite (+X)
    ctx.rotate(Math.PI / 2);
    ctx.scale(scale, scale);

    // Canon
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = secondary;

    const cannonY = -100 + (recoil * 2); 

    // Canon Body
    ctx.beginPath();
    ctx.rect(-10, cannonY, 20, 90);
    ctx.fill();
    ctx.stroke();

    // Muzzle (Bout)
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, cannonY - 5, 24, 10);

    // Corps Tourelle (Cercle r=35)
    ctx.fillStyle = '#050505';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Déco centrale tourelle
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -35);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    ctx.restore(); // Fin rotation tourelle


    // --- COUCHE 3 : EFFETS (Bouclier) ---
    // Le bouclier est une sphère, pas besoin de rotation spécifique, ou rotation lente
    if (shield > 0) {
        ctx.save();
        ctx.rotate(Date.now() / 1000); // Rotation lente indépendante
        ctx.scale(scale, scale);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#3b82f6';
        ctx.globalAlpha = 0.1;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore(); // Fin translation globale (x, y)

    // Infos flottantes (Nom & Barre de HP) - Doit rester hors du scale/rotate du tank
    ctx.save();
    ctx.translate(x, y - radius - 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    ctx.fillText(name.toUpperCase(), 0, -8);
    
    const barW = 60, barH = 6;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, barW, barH, 2);
    ctx.fill();
    
    const hpPercent = Math.max(0, hp / maxHp);
    const hpColor = hpPercent > 0.4 ? primary : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = hpColor;
    ctx.beginPath();
    ctx.roundRect(-barW/2, 0, hpPercent * barW, barH, 2);
    ctx.fill();
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
    ctx.beginPath();
    ctx.arc(0, 0, b.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
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
    haloGrad.addColorStop(0, color + '66');
    haloGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(pw.x, pw.y, pulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.translate(pw.x, pw.y + bob);
    ctx.rotate(time / 600);
    ctx.fillStyle = 'rgba(10,10,20,0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.lineTo(Math.cos(a) * pw.radius, Math.sin(a) * pw.radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.rotate(-(time / 600));
    ctx.fillStyle = color;
    ctx.font = 'black 18px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 0);
    ctx.restore();
};

export const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = p.life / p.maxLife;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10 * alpha;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};
