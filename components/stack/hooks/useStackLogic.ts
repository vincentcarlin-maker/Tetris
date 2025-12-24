
import { useState, useRef, useCallback } from 'react';
import { Block, Debris, GamePhase, CurrentBlockState, Dimensions } from '../types';
import { INITIAL_SIZE, MOVE_SPEED, MAX_SPEED, SPAWN_POS, MOVEMENT_RANGE, COLORS_START, BLOCK_HEIGHT } from '../constants';

export const useStackLogic = (audio: any, addCoins: any, updateHighScore: any, onReportProgress?: any) => {
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [perfectCount, setPerfectCount] = useState(0);

    const stackRef = useRef<Block[]>([]);
    const debrisRef = useRef<Debris[]>([]);
    const currentBlockRef = useRef<CurrentBlockState>({ x: 0, z: 0, dir: 1, axis: 'x' });
    const limitRef = useRef<Dimensions>({ width: INITIAL_SIZE, depth: INITIAL_SIZE });
    const cameraYRef = useRef(0);

    const getHSL = (index: number) => `hsl(${(COLORS_START + index * 5) % 360}, 70%, 60%)`;

    const resetGame = useCallback(() => {
        stackRef.current = [{ x: 0, z: 0, width: INITIAL_SIZE, depth: INITIAL_SIZE, y: 0, color: getHSL(0) }];
        debrisRef.current = [];
        currentBlockRef.current = { x: SPAWN_POS, z: 0, dir: 1, axis: 'x' };
        limitRef.current = { width: INITIAL_SIZE, depth: INITIAL_SIZE };
        cameraYRef.current = 0;
        setScore(0);
        setPerfectCount(0);
        setEarnedCoins(0);
        setPhase('IDLE');
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    const spawnNextBlock = () => {
        const top = stackRef.current[stackRef.current.length - 1];
        const axis = (top.y + 1) % 2 === 0 ? 'x' : 'z';
        currentBlockRef.current = {
            x: axis === 'x' ? SPAWN_POS : top.x,
            z: axis === 'z' ? SPAWN_POS : top.z,
            dir: 1, axis
        };
    };

    const placeBlock = () => {
        const current = currentBlockRef.current;
        const top = stackRef.current[stackRef.current.length - 1];
        const delta = current.axis === 'x' ? current.x - top.x : current.z - top.z;
        const absDelta = Math.abs(delta);
        const size = current.axis === 'x' ? limitRef.current.width : limitRef.current.depth;

        // Perfect Hit
        if (absDelta < 6) {
            current.x = top.x; current.z = top.z;
            setPerfectCount(p => p + 1);
            audio.playVictory();
            if (perfectCount > 2) {
                if (current.axis === 'x') limitRef.current.width = Math.min(INITIAL_SIZE, limitRef.current.width + 5);
                else limitRef.current.depth = Math.min(INITIAL_SIZE, limitRef.current.depth + 5);
            }
        } else {
            setPerfectCount(0);
            audio.playBlockHit();
            if (absDelta >= size) {
                setPhase('GAMEOVER'); audio.playGameOver();
                updateHighScore('stack', score);
                const coins = Math.floor(score / 5);
                if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
                return;
            }
            const newSize = size - absDelta;
            if (current.axis === 'x') limitRef.current.width = newSize;
            else limitRef.current.depth = newSize;
            
            // Add debris
            debrisRef.current.push({
                x: current.x, z: current.z, y: (top.y + 1) * BLOCK_HEIGHT,
                width: current.axis === 'x' ? absDelta : limitRef.current.width,
                depth: current.axis === 'z' ? absDelta : limitRef.current.depth,
                color: getHSL(stackRef.current.length),
                vx: current.axis === 'x' ? (delta > 0 ? 3 : -3) : 0,
                vz: current.axis === 'z' ? (delta > 0 ? 3 : -3) : 0,
                vy: 5, scale: 1
            });
            
            current.x -= (current.axis === 'x' ? delta / 2 : 0);
            current.z -= (current.axis === 'z' ? delta / 2 : 0);
        }

        stackRef.current.push({
            x: current.x, z: current.z, width: limitRef.current.width, depth: limitRef.current.depth,
            y: top.y + 1, color: getHSL(stackRef.current.length)
        });
        setScore(s => s + 1);
        spawnNextBlock();
    };

    const updatePhysics = () => {
        if (phase !== 'PLAYING') return;
        const curr = currentBlockRef.current;
        const speed = Math.min(MAX_SPEED, MOVE_SPEED + (score * 0.08));
        if (curr.axis === 'x') { curr.x += speed * curr.dir; if (Math.abs(curr.x) > MOVEMENT_RANGE) curr.dir *= -1; }
        else { curr.z += speed * curr.dir; if (Math.abs(curr.z) > MOVEMENT_RANGE) curr.dir *= -1; }

        const targetCamY = (stackRef.current.length - 5) * BLOCK_HEIGHT;
        cameraYRef.current += (Math.max(0, targetCamY) - cameraYRef.current) * 0.1;

        debrisRef.current.forEach((d, i) => {
            d.y -= d.vy; d.vy -= 0.5; d.x += d.vx; d.z += d.vz; d.scale -= 0.02;
            if (d.y < cameraYRef.current - 400 || d.scale <= 0) debrisRef.current.splice(i, 1);
        });
    };

    return { score, phase, earnedCoins, perfectCount, stackRef, debrisRef, currentBlockRef, limitRef, cameraYRef, setPhase, resetGame, placeBlock, updatePhysics, getHSL };
};
