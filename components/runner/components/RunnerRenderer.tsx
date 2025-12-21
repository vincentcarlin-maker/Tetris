
import React, { useRef, useEffect } from 'react';
import { 
    Player, Obstacle, CoinEntity, TreasureEntity, PowerUpEntity, Particle, 
    WeatherParticle, SpeedLine, Biome, EventType 
} from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, MAX_SPEED } from '../constants';

interface RunnerRendererProps {
    // Refs
    playerRef: React.MutableRefObject<Player>;
    obstaclesRef: React.MutableRefObject<Obstacle[]>;
    coinsRef: React.MutableRefObject<CoinEntity[]>;
    treasuresRef: React.MutableRefObject<TreasureEntity[]>;
    powerUpsRef: React.MutableRefObject<PowerUpEntity[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    weatherRef: React.MutableRefObject<WeatherParticle[]>;
    speedLinesRef: React.MutableRefObject<SpeedLine[]>;
    frameRef: React.MutableRefObject<number>;
    speedRef: React.MutableRefObject<number>;
    activeEffectsRef: React.MutableRefObject<any>;
    shakeRef: React.MutableRefObject<number>;

    // State props passed down
    currentBiome: Biome;
    activeEvent: { type: EventType } | null;
    isPlaying: boolean;
    gameOver: boolean;
    showSkinShop: boolean;
    showTutorial: boolean;
    
    // Function
    onUpdatePhysics: () => void;
}

export const RunnerRenderer: React.FC<RunnerRendererProps> = ({
    playerRef, obstaclesRef, coinsRef, treasuresRef, powerUpsRef, particlesRef, 
    weatherRef, speedLinesRef, frameRef, speedRef, activeEffectsRef, shakeRef,
    currentBiome, activeEvent, isPlaying, gameOver, showSkinShop, showTutorial,
    onUpdatePhysics
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>(0);

    const draw = (ctx: CanvasRenderingContext2D) => {
        const biome = currentBiome;
        const isNight = activeEvent?.type === 'NIGHT_TERROR';
        
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // --- BACKGROUND ---
        const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        if (isNight) {
            bgGradient.addColorStop(0, '#000000');
            bgGradient.addColorStop(1, '#1a0000');
        } else {
            bgGradient.addColorStop(0, biome.bg);
            bgGradient.addColorStop(1, '#000000');
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Grid
        ctx.strokeStyle = isNight ? 'rgba(255, 0, 0, 0.1)' : biome.sky;
        ctx.lineWidth = 2;
        const gridOffset = (frameRef.current * (activeEffectsRef.current.boost ? MAX_SPEED * 1.5 : speedRef.current) * 0.5) % 100;
        ctx.beginPath();
        for(let i=0; i<CANVAS_HEIGHT; i+=50) { ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); }
        for(let i= -gridOffset; i<CANVAS_WIDTH; i+=100) { ctx.moveTo(i, GROUND_HEIGHT); ctx.lineTo((i - CANVAS_WIDTH/2)*4 + CANVAS_WIDTH/2, CANVAS_HEIGHT); }
        ctx.stroke();

        // Speed Lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        speedLinesRef.current.forEach(line => { ctx.fillRect(line.x, line.y, line.width, 2); });

        // Weather
        ctx.fillStyle = biome.particle;
        weatherRef.current.forEach(w => {
            ctx.beginPath();
            if (biome.id === 'snow') ctx.arc(w.x, w.y, w.size, 0, Math.PI*2);
            else if (biome.id === 'city') ctx.fillRect(w.x, w.y, 1, w.size * 3);
            else if (biome.id === 'forest') ctx.arc(w.x, w.y, w.size, 0, Math.PI*2);
            else ctx.fillRect(w.x, w.y, w.size, w.size);
            ctx.fill();
        });

        // Ground Line
        ctx.strokeStyle = activeEffectsRef.current.boost ? '#ff4500' : biome.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = activeEffectsRef.current.boost ? '#ff4500' : biome.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(0, GROUND_HEIGHT); ctx.lineTo(CANVAS_WIDTH, GROUND_HEIGHT); ctx.stroke();
        ctx.shadowBlur = 0;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            if (obs.type === 'spike') {
                ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width/2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.fill();
            } else if (obs.type === 'drone') {
                ctx.fillStyle = '#facc15'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillStyle = '#000'; ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
            } else {
                ctx.fillStyle = biome.id === 'snow' ? '#a5f3fc' : '#a855f7';
                ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;
        });

        // Treasures
        treasuresRef.current.forEach(t => {
            if (t.collected) return;
            const cx = t.x + t.width/2; const cy = t.y + t.height/2;
            if (t.type === 'CHEST') {
                ctx.fillStyle = '#d97706'; ctx.fillRect(t.x, t.y, t.width, t.height);
                ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 2; ctx.strokeRect(t.x, t.y, t.width, t.height);
                ctx.beginPath(); ctx.moveTo(t.x, t.y + 10); ctx.lineTo(t.x + t.width, t.y + 10); ctx.stroke();
            } else {
                ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillRect(t.x - 5, t.y + 10, 40, 4);
            }
        });

        // PowerUps
        powerUpsRef.current.forEach(pu => {
            if (pu.collected) return;
            const floatY = Math.sin(frameRef.current * 0.1 + pu.offsetY) * 5;
            const cx = pu.x + pu.width/2; const cy = pu.y + pu.height/2 + floatY;
            let color = '#fff'; let label = '?';
            if (pu.type === 'magnet') { color = '#3b82f6'; label = 'M'; }
            if (pu.type === 'shield') { color = '#22c55e'; label = 'S'; }
            if (pu.type === 'boost') { color = '#f97316'; label = 'B'; }
            ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, cy);
        });

        // Coins
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const floatY = Math.sin(frameRef.current * 0.1 + coin.offsetY) * 5;
            const cx = coin.x + coin.width/2; const cy = coin.y + coin.height/2 + floatY;
            ctx.fillStyle = '#facc15'; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#facc15'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', cx, cy + 1);
        });

        // Player
        if (!gameOver) {
            const p = playerRef.current;
            ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.rotation);
            if (activeEffectsRef.current.boost) { ctx.fillStyle = 'rgba(255, 69, 0, 0.5)'; ctx.fillRect(-p.width, -p.height/2, p.width*2, p.height); }
            ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15; ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
            ctx.fillStyle = '#fff'; ctx.fillRect(-p.width/4, -p.height/4, p.width/2, p.height/2);
            if (activeEffectsRef.current.shield) { ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke(); }
            if (activeEffectsRef.current.magnet) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(frameRef.current * 0.2) * 5, 0, Math.PI * 2); ctx.stroke(); }
            ctx.restore();
        }

        // Particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life / (p.type === 'spark' ? 15 : 30);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Apply Shake to Container (Visual only, CSS)
        if (containerRef.current && shakeRef.current > 0.5) {
            const dx = (Math.random() - 0.5) * shakeRef.current;
            const dy = (Math.random() - 0.5) * shakeRef.current;
            containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (containerRef.current) {
            containerRef.current.style.transform = 'none';
        }
    };

    const loop = () => {
        if (!showSkinShop && !showTutorial) {
            if (isPlaying && !gameOver) {
                onUpdatePhysics();
            }
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) draw(ctx);
            }
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loop]);

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl aspect-[2/1] bg-black/80 border-2 border-orange-500/30 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.2)] overflow-hidden backdrop-blur-md z-10 cursor-pointer">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain" />
        </div>
    );
};
