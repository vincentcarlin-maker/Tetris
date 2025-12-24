
import React from 'react';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Character, Bullet, PowerUp, Particle } from '../constants';
import { useArenaRenderLoop } from '../hooks/useArenaRenderLoop';

interface ArenaRendererProps {
    playerRef: React.MutableRefObject<Character | null>;
    botsRef: React.MutableRefObject<Character[]>;
    bulletsRef: React.MutableRefObject<Bullet[]>;
    powerUpsRef: React.MutableRefObject<PowerUp[]>;
    particlesRef: React.MutableRefObject<Particle[]>;
    cameraRef: React.MutableRefObject<{x: number, y: number}>;
    selectedMapIndex: number;
    mouseRef: React.MutableRefObject<{x: number, y: number, down: boolean}>;
    recoilRef: React.MutableRefObject<{ [key: string]: number }>;
    onUpdate: (dt: number) => void;
    gameState: string;
    showTutorial: boolean;
}

/**
 * ArenaRenderer : Orchestre le rendu graphique du jeu Arena Clash.
 * Utilise Canvas API pour des performances optimales.
 */
export const ArenaRenderer: React.FC<ArenaRendererProps> = (props) => {
    const { canvasRef } = useArenaRenderLoop(props);
    const { gameState, showTutorial, mouseRef } = props;

    return (
        <canvas 
            ref={canvasRef} 
            width={VIEWPORT_WIDTH} 
            height={VIEWPORT_HEIGHT}
            className="bg-black border-2 border-purple-500/30 rounded-xl w-full h-full object-contain cursor-crosshair shadow-[0_0_20px_rgba(168,85,247,0.2)]"
            onMouseDown={() => { 
                if(!showTutorial && gameState === 'PLAYING') mouseRef.current.down = true; 
            }}
            onMouseUp={() => mouseRef.current.down = false}
            onMouseLeave={() => mouseRef.current.down = false}
        />
    );
};
