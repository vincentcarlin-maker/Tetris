
import { useEffect, useRef } from 'react';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, MAPS } from '../constants';
import { drawTank, drawBullet, drawPowerUp, drawParticle, drawObstacle, drawMapDecor } from '../utils/drawUtils';

export const useArenaRenderLoop = (props: any) => {
    const { 
        playerRef, botsRef, bulletsRef, powerUpsRef, particlesRef, cameraRef, 
        selectedMapIndex, recoilRef, onUpdate, gameState, aiBgUrl
    } = props;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);
    const aiImageRef = useRef<HTMLImageElement | null>(null);
    
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    // Chargement de l'image IA quand elle change
    useEffect(() => {
        if (aiBgUrl) {
            const img = new Image();
            img.src = aiBgUrl;
            img.onload = () => { aiImageRef.current = img; };
        } else {
            aiImageRef.current = null;
        }
    }, [aiBgUrl]);

    useEffect(() => {
        lastTimeRef.current = 0;

        const render = (time: number) => {
            if (!lastTimeRef.current) {
                lastTimeRef.current = time;
                requestRef.current = requestAnimationFrame(render);
                return;
            }
            
            const dt = Math.min(time - lastTimeRef.current, 100);
            lastTimeRef.current = time;

            if (onUpdateRef.current) {
                onUpdateRef.current(dt);
            }

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d', { alpha: false });
            if (!ctx) {
                requestRef.current = requestAnimationFrame(render);
                return;
            }

            const map = MAPS[selectedMapIndex] || MAPS[0];
            const cam = cameraRef.current;
            const now = Date.now();

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

            ctx.save();
            ctx.translate(-cam.x, -cam.y);

            // Fond
            ctx.fillStyle = map.colors.bg;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            drawMapDecor(ctx, map, aiImageRef.current);

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
