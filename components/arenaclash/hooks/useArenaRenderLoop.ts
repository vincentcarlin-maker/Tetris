
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

    const render = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Mise à jour physique
        onUpdate(dt);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const map = MAPS[selectedMapIndex];
        const cam = cameraRef.current;
        const now = Date.now();

        // 1. Nettoyage Viewport
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        // 2. Transformations Caméra
        ctx.save();
        ctx.translate(-cam.x, -cam.y);

        // 3. Dessin du fond et décor
        ctx.fillStyle = map.colors.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawMapDecor(ctx, map);

        // 4. Entités
        powerUpsRef.current.forEach((pw: any) => drawPowerUp(ctx, pw, now));
        map.obstacles.forEach((obs: any) => drawObstacle(ctx, obs, map));
        bulletsRef.current.forEach((b: any) => drawBullet(ctx, b));

        // Tanks
        const player = playerRef.current;
        if (player && !player.isDead) drawTank(ctx, player, recoilRef.current[player.id] || 0);
        botsRef.current.forEach((bot: any) => {
            if (!bot.isDead) drawTank(ctx, bot, recoilRef.current[bot.id] || 0);
        });

        // Particules
        particlesRef.current.forEach((p: any) => drawParticle(ctx, p));

        ctx.restore();
        requestAnimationFrame(render);
    };

    useEffect(() => {
        const id = requestAnimationFrame(render);
        return () => cancelAnimationFrame(id);
    }, [selectedMapIndex]);

    return { canvasRef };
};
