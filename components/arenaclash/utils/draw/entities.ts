import { Character, Bullet, PowerUp, Particle } from '../../types';

/**
 * Dessine l'accessoire (drapeau) sur le char.
 */
const drawTankAccessory = (ctx: CanvasRenderingContext2D, acc: any, bodySize: number) => {
    const flagW = 22;
    const flagH = 14;
    // Positionnement à l'arrière gauche du châssis pour un look équilibré
    const posX = -bodySize / 2 + 4;
    const posY = -bodySize / 2 + 4;

    ctx.save();
    ctx.translate(posX, posY);

    // Mât du drapeau (Effet métal poli)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -8);
    ctx.stroke();

    ctx.translate(0, -8);
    
    // Animation d'ondulation pour un effet "vent"
    const wave = Math.sin(Date.now() / 200) * 2;
    
    // Structure de base du drapeau
    ctx.fillStyle = '#000';
    ctx.fillRect(0, -flagH + wave/2, flagW, flagH);

    const layout = acc.layout || 'vertical';
    const colors = acc.colors || [];

    // Logique de rendu selon la configuration du catalogue
    if (acc.id === 'ta_flag_neon') {
        const grad = ctx.createLinearGradient(0, 0, flagW, 0);
        colors.forEach((c: string, i: number) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, -flagH + wave/2, flagW, flagH);
    } else if (layout === 'japan') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -flagH + wave/2, flagW, flagH);
        ctx.fillStyle = '#BC002D';
        ctx.beginPath();
        ctx.arc(flagW / 2, -flagH / 2 + wave/2, flagH / 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (layout === 'usa') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -flagH + wave/2, flagW, flagH);
        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#fff';
            ctx.fillRect(0, -flagH + (i * flagH / 7) + wave/2, flagW, flagH / 7);
        }
        ctx.fillStyle = '#3C3B6E';
        ctx.fillRect(0, -flagH + wave/2, flagW * 0.45, flagH * 0.55);
    } else if (layout === 'brazil') {
        ctx.fillStyle = '#009739';
        ctx.fillRect(0, -flagH + wave/2, flagW, flagH);
        ctx.fillStyle = '#FEDD00';
        ctx.beginPath();
        ctx.moveTo(2, -flagH / 2 + wave/2);
        ctx.lineTo(flagW / 2, -flagH + 2 + wave/2);
        ctx.lineTo(flagW - 2, -flagH / 2 + wave/2);
        ctx.lineTo(flagW / 2, -2 + wave/2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#012169';
        ctx.beginPath();
        ctx.arc(flagW / 2, -flagH / 2 + wave/2, flagH / 5, 0, Math.PI * 2);
        ctx.fill();
    } else if (layout === 'pirate') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, -flagH + wave/2, flagW, flagH);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(flagW / 2, -flagH / 2 + wave/2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(flagW / 2 - 3, -flagH / 2 + 2 + wave/2, 6, 2); // Simple base de crâne
    } else {
        const isVert = layout === 'vertical';
        colors.forEach((c: string, i: number) => {
            ctx.fillStyle = c;
            if (isVert) {
                ctx.fillRect((i * flagW) / colors.length, -flagH + wave/2, flagW / colors.length, flagH);
            } else {
                ctx.fillRect(0, -flagH + (i * flagH) / colors.length + wave/2, flagW, flagH / colors.length);
            }
        });
    }
    
    // Bordure de finition pour détacher le drapeau du fond
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -flagH + wave/2, flagW, flagH);

    ctx.restore();
};

export const drawTank = (ctx: CanvasRenderingContext2D, char: Character, recoil: number) => {
    if (!char) return;
    const { x, y, angle, radius, skin, hp, maxHp, name, shield, accessory } = char;
    const primary = skin?.primaryColor || char.color;
    const glow = skin?.glowColor || primary;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Corps (Plus carré et massif style Arcade)
    const bodySize = radius * 1.8;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#0f172a'; 
    ctx.beginPath();
    ctx.roundRect(-bodySize/2, -bodySize/2, bodySize, bodySize, 6);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rendu de l'accessoire (Drapeau) - Dessiné après le corps pour être au-dessus
    if (accessory && accessory.id !== 'ta_none') {
        drawTankAccessory(ctx, accessory, bodySize);
    }

    // Canon
    const barrelW = bodySize * 0.8, barrelH = bodySize * 0.28;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bodySize/4 - recoil, -barrelH/2, barrelW, barrelH, 2);
    ctx.fill();
    ctx.stroke();

    // Tourelle
    const turretRadius = bodySize * 0.35;
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bouclier Énergétique
    if (shield > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // Infos flottantes (Nom & Barre de HP)
    ctx.save();
    ctx.translate(x, y - radius - 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
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