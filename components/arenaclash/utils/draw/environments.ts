import { MapConfig } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export const drawMapDecor = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    const time = Date.now();
    if (map.id === 'forest') { 
        drawForestGround(ctx); 
        drawFireflies(ctx, time); 
    } else if (map.id === 'solar_dust') { 
        drawSolarAtmosphere(ctx, time); 
        drawDunes(ctx, time); 
    } else if (map.id === 'mountain') {
        drawMountainAtmosphere(ctx, time);
        drawSnowyGround(ctx, time);
    } else { 
        drawUrbanAmbience(ctx, time); 
    }
    drawSpecialZones(ctx, map, time); 
};

const drawSpecialZones = (ctx: CanvasRenderingContext2D, map: MapConfig, time: number) => {
    map.zones.forEach(zone => {
        ctx.save();
        const pulse = Math.sin(time / 400) * 10;
        let color = zone.type === 'HEAL' ? '#22c55e' : (zone.type === 'DANGER' ? '#ef4444' : '#facc15');
        ctx.translate(zone.x, zone.y);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, zone.radius + pulse);
        grad.addColorStop(0, color + '33'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, zone.radius + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color + '66'; ctx.setLineDash([10, 5]); ctx.lineWidth = 2; ctx.rotate(time / 2000);
        ctx.beginPath(); ctx.arc(0, 0, zone.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 11px Rajdhani'; ctx.textAlign = 'center'; ctx.fillText(zone.label, 0, -zone.radius - 12);
        ctx.restore();
    });
};

const drawUrbanAmbience = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const scanY = (time / 10) % CANVAS_HEIGHT;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.02)'; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(CANVAS_WIDTH, scanY); ctx.stroke();
    ctx.restore();
};

const drawForestGround = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)'; ctx.lineWidth = 2;
    for(let i=0; i<30; i++) {
        const x1 = (i * 1337) % CANVAS_WIDTH, y1 = (i * 7331) % CANVAS_HEIGHT;
        const x2 = ((i+1) * 1337) % CANVAS_WIDTH, y2 = ((i+1) * 7331) % CANVAS_HEIGHT;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
};

const drawFireflies = (ctx: CanvasRenderingContext2D, time: number) => {
    for(let i=0; i<60; i++) {
        const x = (i * 333 + Math.sin(time/1000 + i)*50) % CANVAS_WIDTH, y = (i * 666 + Math.cos(time/1200 + i)*50) % CANVAS_HEIGHT;
        const pulse = 0.5 + Math.sin(time / 500 + i) * 0.5;
        ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
};

const drawMountainAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#050a15');
    grad.addColorStop(1, '#1a1f2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.globalAlpha = 0.05 + Math.sin(time / 1500) * 0.03;
    ctx.fillStyle = '#cffafe'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
};

const drawSnowyGround = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for(let i=0; i<15; i++) {
        const x = (i * 800 + time / 50) % CANVAS_WIDTH, y = (i * 600) % CANVAS_HEIGHT;
        ctx.beginPath(); ctx.ellipse(x, y, 300, 150, Math.PI/12, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
};

const drawSolarAtmosphere = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.globalAlpha = 0.05 + Math.sin(time / 1000) * 0.02;
    ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
};

const drawDunes = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, 600);
    for(let x=0; x <= CANVAS_WIDTH; x += 300) {
        const y = 600 + Math.sin(x / 600 + time / 5000) * 30;
        ctx.quadraticCurveTo(x - 150, 570, x, y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.lineTo(0, CANVAS_HEIGHT); ctx.closePath();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.03)'; ctx.fill();
    ctx.restore();
};