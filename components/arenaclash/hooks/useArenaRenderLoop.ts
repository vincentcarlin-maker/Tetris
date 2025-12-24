
import { useEffect, useRef } from 'react';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, MAPS } from '../constants';
import { drawTank, drawBullet, drawPowerUp, drawParticle, drawObstacle, drawMapDecor } from '../utils/drawUtils';

export const useArenaRenderLoop = (props: any) => {
    const { 
        playerRef, botsRef, bulletsRef, powerUpsRef, particlesRef, cameraRef, 
        selectedMapIndex, recoilRef, onUpdate, gameState 
    } = props;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        // Reset lastTime au montage du hook
        lastTimeRef.current = 0;

        const render = (time: number) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = time;
                requestRef.current = requestAnimationFrame(render);
                return;
            }
            
            const dt = Math.min(time - lastTimeRef.current, 100); // Cap à 100ms
            lastTimeRef.current = time;

            // Toujours appeler onUpdate, la fonction gère elle-même ses états internes
            if (onUpdateRef.current) {
                onUpdateRef.current(dt);
            }

            // Rendu
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: false });
            if (!ctx) {
                requestRef.current = requestAnimationFrame(render);
                return;
            }

            const map = MAPS[selectedMapIndex] || MAPS[0];
            const cam = cameraRef.current;
            const now = Date.now();

            // Nettoyage Viewport
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

            ctx.save();
            ctx.translate(-cam.x, -cam.y);

            // Fond World
            ctx.fillStyle = map.colors.bg;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            drawMapDecor(ctx, map);

            // Objets
            powerUpsRef.current.forEach((pw: any) => drawPowerUp(ctx, pw, now));
            map.obstacles.forEach((obs: any) => drawObstacle(ctx, obs, map));
            bulletsRef.current.forEach((b: any) => drawBullet(ctx, b));

            // Entités
            const player = playerRef.current;
            if (player && !player.isDead) {
                drawTank(ctx, player, recoilRef.current[player.id] || 0);
            }
            
            botsRef.current.forEach((bot: any) => {
                if (bot && !bot.isDead) drawTank(ctx, bot, recoilRef.current[bot.id] || 0);
            });

            // FX
            particlesRef.current.forEach((p: any) => drawParticle(ctx, p));

            ctx.restore();
            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [selectedMapIndex]); 

    return { canvasRef };
};
