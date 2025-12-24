import { Obstacle, MapConfig } from '../../types';

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
    } else if (obs.type === 'rock' || obs.type === 'peak') {
        drawMountainRock(ctx, obs, map.colors.wallBorder, time);
    } else if (obs.type === 'ice_pillar') {
        drawIcePillar(ctx, obs, time);
    } else if (obs.type === 'pylon') {
        drawPylon(ctx, obs, map.colors.wallBorder, time);
    } else { 
        ctx.fillStyle = '#1e293b'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h); 
    }
    ctx.restore();
};

const drawPylon = (ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, time: number) => {
    const glow = Math.sin(time / 500) * 5 + 25;
    ctx.fillStyle = '#222'; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    const grad = ctx.createRadialGradient(obs.x+obs.w/2, obs.y+obs.h/2, 0, obs.x+obs.w/2, obs.y+obs.h/2, glow);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, color + '88'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(obs.x+obs.w/2, obs.y+obs.h/2, glow, 0, Math.PI*2); ctx.fill();
};

const drawPyramid = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number, color: string) => {
    const cx = obs.x + obs.w/2;
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
};

const drawBioTree = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) => {
    const sway = Math.sin(time / 1000 + x) * 5;
    ctx.save();
    ctx.translate(x + sway, y);
    ctx.fillStyle = '#052e16';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) {
        const r = radius * (1 - i * 0.2);
        ctx.fillStyle = `rgba(34, 197, 94, ${0.6 - i * 0.15})`;
        ctx.shadowBlur = 15; ctx.shadowColor = '#22c55e';
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.8) {
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();
};

const drawMountainRock = (ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, time: number) => {
    ctx.save();
    ctx.fillStyle = '#1a1f2e';
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y + obs.h);
    ctx.lineTo(obs.x + obs.w * 0.2, obs.y + obs.h * 0.1);
    ctx.lineTo(obs.x + obs.w * 0.5, obs.y);
    ctx.lineTo(obs.x + obs.w * 0.8, obs.y + obs.h * 0.2);
    ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.6 + Math.sin(time / 1000) * 0.2; ctx.stroke();
    ctx.restore();
};

const drawIcePillar = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) => {
    const cx = obs.x + obs.w/2, cy = obs.y + obs.h/2;
    const pulse = 0.8 + Math.sin(time / 600) * 0.2;
    ctx.save();
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, obs.w/2);
    innerGrad.addColorStop(0, '#fff'); innerGrad.addColorStop(0.5, '#00f3ff88'); innerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGrad;
    ctx.beginPath(); ctx.arc(cx, cy, (obs.w/3) * pulse, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#cffafe'; ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
        const a = (i * Math.PI * 2) / 6 + time / 2000;
        ctx.lineTo(cx + Math.cos(a) * obs.w/2, cy + Math.sin(a) * obs.w/2);
    }
    ctx.closePath(); ctx.stroke();
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
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-radius*0.4, -h*0.7); ctx.lineTo(0, -h); ctx.lineTo(radius*0.4, -h*0.7);
        ctx.closePath();
        ctx.fillStyle = color + '44'; ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
};

const drawHoloBone = (ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) => {
    ctx.save();
    ctx.translate(obs.x + obs.w/2, obs.y + obs.h/2);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = (0.3 + Math.sin(time / 400) * 0.1) * (Math.random() > 0.95 ? 0.2 : 1);
    ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-obs.w/3, 0, 15, 0, Math.PI*2); ctx.arc(obs.w/3, 0, 15, 0, Math.PI*2);
    ctx.moveTo(-obs.w/3, 0); ctx.lineTo(obs.w/3, 0);
    ctx.stroke();
    ctx.restore();
};

const drawPalm = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.sin(time / 1200) * 5) * Math.PI / 180);
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