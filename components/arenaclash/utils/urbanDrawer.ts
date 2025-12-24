
import { CANVAS_WIDTH, CANVAS_HEIGHT, MapConfig } from '../constants';

/**
 * Dessine un réseau routier complexe
 */
export const drawUrbanInfrastructure = (ctx: CanvasRenderingContext2D, map: MapConfig) => {
    ctx.save();
    
    // 1. Routes (Asphalte sombre)
    ctx.fillStyle = '#0a0a14';
    const mainRoadWidth = 100;
    const secondaryRoadWidth = 60;
    const step = 600;

    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        // Verticales
        ctx.fillRect(i - mainRoadWidth/2, 0, mainRoadWidth, CANVAS_HEIGHT);
        // Horizontales
        ctx.fillRect(0, i - mainRoadWidth/2, CANVAS_WIDTH, mainRoadWidth);
        
        // Routes secondaires
        ctx.fillRect(i + step/2 - secondaryRoadWidth/2, 0, secondaryRoadWidth, CANVAS_HEIGHT);
    }

    // 2. Marquages au sol (Néon)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 30]);
    
    for (let i = 0; i <= CANVAS_WIDTH; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Ronds-points
    drawRoundabout(ctx, 1200, 1200, 140, map.colors.wallBorder);
    drawRoundabout(ctx, 600, 600, 100, map.colors.wallBorder);
    drawRoundabout(ctx, 1800, 1800, 100, map.colors.wallBorder);

    ctx.restore();
};

const drawRoundabout = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
    ctx.save();
    // Bitume
    ctx.fillStyle = '#0f0f1a';
    ctx.beginPath(); ctx.arc(x, y, radius + 20, 0, Math.PI * 2); ctx.fill();
    
    // Bordure lumineuse
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.beginPath(); ctx.arc(x, y, radius + 20, 0, Math.PI * 2); ctx.stroke();

    // Centre herbeux
    ctx.fillStyle = '#051a05';
    ctx.beginPath(); ctx.arc(x, y, radius - 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, radius - 15, 0, Math.PI * 2); ctx.stroke();
    
    ctx.restore();
};

export const drawStreetLights = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    const step = 300;
    const color = '#facc15';
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    for (let x = 100; x < CANVAS_WIDTH; x += step) {
        for (let y = 100; y < CANVAS_HEIGHT; y += step) {
            // Uniquement sur les bords de route
            if ((x % 600 < 150) || (y % 600 < 150)) {
                const flicker = Math.random() > 0.98 ? 0.2 : 1;
                ctx.globalAlpha = (0.4 + Math.sin(time / 500 + x) * 0.2) * flicker;
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    ctx.restore();
};
