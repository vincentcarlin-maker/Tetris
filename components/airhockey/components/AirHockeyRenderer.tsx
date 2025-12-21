
import React, { useRef, useEffect } from 'react';
import { TABLE_WIDTH, TABLE_HEIGHT, GOAL_WIDTH, MALLET_RADIUS } from '../constants';
import { Entity, GameMode, GameState } from '../types';
import { useCurrency, Mallet } from '../../../hooks/useCurrency';

interface AirHockeyRendererProps {
    puckRef: React.MutableRefObject<Entity>;
    playerMalletRef: React.MutableRefObject<Entity>;
    opponentMalletRef: React.MutableRefObject<Entity>;
    p1TargetRef: React.MutableRefObject<{ x: number, y: number }>;
    p2TargetRef: React.MutableRefObject<{ x: number, y: number }>;
    gameState: GameState;
    gameMode: GameMode;
    isPaused: boolean;
    showTutorial: boolean;
    onUpdate: () => void;
    currentMalletId: string;
    opponentMalletId?: string;
}

export const AirHockeyRenderer: React.FC<AirHockeyRendererProps> = ({
    puckRef, playerMalletRef, opponentMalletRef,
    p1TargetRef, p2TargetRef,
    gameState, gameMode, isPaused, showTutorial,
    onUpdate, currentMalletId, opponentMalletId
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const { malletsCatalog } = useCurrency();

    const drawMallet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, malletStyle?: Mallet, isOpponent: boolean = false) => {
        if (malletStyle) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);

            if (malletStyle.type === 'basic') {
                ctx.fillStyle = malletStyle.colors[0];
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else if (malletStyle.type === 'gradient' || malletStyle.type === 'complex') {
                const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
                if (malletStyle.colors.length > 1) {
                    malletStyle.colors.forEach((c, i) => grad.addColorStop(i / (malletStyle.colors.length - 1), c));
                } else {
                    grad.addColorStop(0, malletStyle.colors[0]); grad.addColorStop(1, malletStyle.colors[0]);
                }
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else if (malletStyle.type === 'target') {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, malletStyle.colors[0]);
                grad.addColorStop(0.3, malletStyle.colors[0]);
                grad.addColorStop(0.3, malletStyle.colors[1] || '#000');
                grad.addColorStop(0.6, malletStyle.colors[1] || '#000');
                grad.addColorStop(0.6, malletStyle.colors[0]);
                grad.addColorStop(1, malletStyle.colors[0]);
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 10;
            } else if (malletStyle.type === 'flower') {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, malletStyle.colors[1] || '#fff');
                grad.addColorStop(0.2, malletStyle.colors[1] || '#fff');
                grad.addColorStop(0.2, malletStyle.colors[0]);
                grad.addColorStop(1, malletStyle.colors[0]);
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = malletStyle.colors[0];
            }
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.stroke();
            ctx.restore();
            return;
        }
        
        const defaultColor = isOpponent ? ((gameMode === 'LOCAL_VS' || gameMode === 'ONLINE') ? '#ff0055' : '#ffe600') : '#00f3ff';
        ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fillStyle = defaultColor; ctx.shadowColor = defaultColor; ctx.shadowBlur = 15; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.stroke();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
        ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)'; ctx.lineWidth = 2; 
        ctx.beginPath(); ctx.moveTo(0, TABLE_HEIGHT/2); ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT/2); ctx.stroke();
        
        ctx.beginPath(); ctx.arc(TABLE_WIDTH/2, TABLE_HEIGHT/2, 50, 0, 2*Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(TABLE_WIDTH/2, TABLE_HEIGHT/2, 4, 0, 2*Math.PI); ctx.fillStyle = '#00f3ff'; ctx.fill();

        const goalX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
        ctx.fillRect(goalX, -20, GOAL_WIDTH, 40); 
        ctx.fillRect(goalX, TABLE_HEIGHT - 20, GOAL_WIDTH, 40); 
        
        ctx.strokeStyle = '#ff00ff';
        ctx.beginPath(); ctx.moveTo(goalX, 0); ctx.lineTo(goalX + GOAL_WIDTH, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(goalX, TABLE_HEIGHT); ctx.lineTo(goalX + GOAL_WIDTH, TABLE_HEIGHT); ctx.stroke();

        const puck = puckRef.current;
        ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.radius, 0, 2*Math.PI); ctx.fillStyle = puck.color; ctx.fill();

        const playerMalletStyle = malletsCatalog.find(m => m.id === currentMalletId);
        const player = playerMalletRef.current;
        drawMallet(ctx, player.x, player.y, player.radius, playerMalletStyle, false);

        const opponentMalletStyle = malletsCatalog.find(m => m.id === opponentMalletId);
        const opponent = opponentMalletRef.current;
        drawMallet(ctx, opponent.x, opponent.y, opponent.radius, opponentMalletStyle, true);
    };

    // Main Loop
    useEffect(() => {
        const loop = () => {
            if (gameState === 'playing' && !isPaused && !showTutorial) {
                onUpdate();
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) draw(ctx);
            }
            animationFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameState, isPaused, showTutorial, currentMalletId, opponentMalletId, onUpdate]);

    // Input Handlers
    const updateTargets = (clientX: number, clientY: number) => {
        if (!canvasRef.current || isPaused || showTutorial) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        if (gameMode !== 'LOCAL_VS' || y > TABLE_HEIGHT / 2) {
             p1TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
            };
        }
        if (gameMode === 'LOCAL_VS' && y <= TABLE_HEIGHT / 2) {
            p2TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(MALLET_RADIUS, Math.min(TABLE_HEIGHT / 2 - MALLET_RADIUS, y)),
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => updateTargets(e.clientX, e.clientY);
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isPaused || showTutorial) return;
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) updateTargets(e.touches[i].clientX, e.touches[i].clientY);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPaused || showTutorial) return;
        handleTouchMove(e);
    };

    return (
        <div 
            className={`relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden cursor-none ${gameMode === 'LOCAL_VS' ? 'border-pink-500/30' : ''}`}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT} className="w-full h-full" />
        </div>
    );
};
