
import { useState, useRef, useCallback, useEffect } from 'react';
import { Direction, Position, GameMode, FoodItem, Teleporter, Particle } from '../types';

const GRID_SIZE = 20;
const INITIAL_SPEED_CLASSIC = 150;
const INITIAL_SPEED_NEON = 180;
const MIN_SPEED = 50;

export const useSnakeLogic = (audio: any, addCoins: any, onReportProgress?: any) => {
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<FoodItem>({ x: 15, y: 10, type: 'NORMAL' });
    const [obstacles, setObstacles] = useState<Position[]>([]);
    const [teleporters, setTeleporters] = useState<Teleporter[]>([]);
    const [bombs, setBombs] = useState<Position[]>([]);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED_CLASSIC);
    const [activeEffect, setActiveEffect] = useState<'NONE' | 'SLOW' | 'INVINCIBLE'>('NONE');
    const [effectTimer, setEffectTimer] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const directionRef = useRef<Direction>('RIGHT');
    const nextDirectionRef = useRef<Direction>('RIGHT');
    const particlesRef = useRef<Particle[]>([]);
    const gameLoopRef = useRef<any>(null);

    const spawnParticles = (x: number, y: number, color: string, count: number = 12) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x: x * 100/GRID_SIZE + (50/GRID_SIZE), 
                y: y * 100/GRID_SIZE + (50/GRID_SIZE),
                vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
                life: 1.0, color, size: Math.random() * 2 + 2
            });
        }
    };

    const isPositionSafe = (x: number, y: number, s: Position[], obs: Position[], tp: Teleporter[], b: Position[]) => {
        if (s.some(seg => seg.x === x && seg.y === y)) return false;
        if (obs.some(o => o.x === x && o.y === y)) return false;
        if (tp.some(t => t.x === x && t.y === y)) return false;
        if (b.some(bomb => bomb.x === x && bomb.y === y)) return false;
        return true;
    };

    const generateLevel = useCallback((s: Position[]) => {
        const newObs: Position[] = [];
        const newTp: Teleporter[] = [];
        const newBombs: Position[] = [];
        for (let i = 0; i < 8; i++) {
            const p = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
            if (isPositionSafe(p.x, p.y, s, newObs, [], [])) newObs.push(p);
        }
        setObstacles(newObs);
        setTeleporters([
            { x: 2, y: 2, id: 1, targetId: 2, color: '#00f3ff' },
            { x: 17, y: 17, id: 2, targetId: 1, color: '#ff00ff' }
        ]);
        setBombs([{ x: 10, y: 5 }, { x: 5, y: 15 }]);
    }, []);

    const moveSnake = useCallback(() => {
        if (gameOver || !isPlaying || isPaused) return;

        setSnake(prev => {
            directionRef.current = nextDirectionRef.current;
            const head = prev[0];
            const newHead = { ...head };

            if (directionRef.current === 'UP') newHead.y -= 1;
            if (directionRef.current === 'DOWN') newHead.y += 1;
            if (directionRef.current === 'LEFT') newHead.x -= 1;
            if (directionRef.current === 'RIGHT') newHead.x += 1;

            // Teleport logic
            const portal = teleporters.find(t => t.x === newHead.x && t.y === newHead.y);
            if (portal) {
                const target = teleporters.find(t => t.id === portal.targetId);
                if (target) { newHead.x = target.x; newHead.y = target.y; spawnParticles(portal.x, portal.y, portal.color); }
            }

            // Wall/Self Collision
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE || 
                prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
                if (activeEffect !== 'INVINCIBLE') { setGameOver(true); audio.playGameOver(); return prev; }
            }

            const newSnake = [newHead, ...prev];
            if (newHead.x === food.x && newHead.y === food.y) {
                audio.playCoin();
                setScore(s => s + 10);
                // logic to spawn new food...
                newSnake.pop(); // simplified for now
            } else {
                newSnake.pop();
            }
            return newSnake;
        });

        gameLoopRef.current = setTimeout(moveSnake, activeEffect === 'SLOW' ? speed * 1.5 : speed);
    }, [isPlaying, isPaused, gameOver, speed, activeEffect, teleporters, food, audio]);

    return {
        snake, food, obstacles, teleporters, bombs, score, gameOver, isPlaying, isPaused,
        activeEffect, particlesRef, setNextDirection: (d: Direction) => { nextDirectionRef.current = d; },
        setIsPlaying, setGameState: setGameOver, reset: () => setSnake([{x:10, y:10}])
    };
};
