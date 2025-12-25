
import { useState, useRef, useCallback, useEffect } from 'react';
import { Direction, Position, FoodItem, Particle } from '../types';
import { GRID_SIZE, INITIAL_SPEED, MIN_SPEED, FOOD_TYPES } from '../constants';
import { useGameLoop } from '../../../hooks/useGameLoop';

export const useSnakeLogic = (audio: any, addCoins: (amount: number) => void, onReportProgress?: (metric: string, value: number) => void) => {
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    const [food, setFood] = useState<FoodItem>({ x: 15, y: 10, type: 'NORMAL' });
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    const directionRef = useRef<Direction>('UP');
    const nextDirectionRef = useRef<Direction>('UP');
    const particlesRef = useRef<Particle[]>([]);

    const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 12) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x: x * 20 + 10, 
                y: y * 20 + 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                color,
                size: Math.random() * 3 + 2
            });
        }
    }, []);

    const getRandomEmptyPos = useCallback((currentSnake: Position[]): Position => {
        let pos: Position;
        let attempts = 0;
        while (attempts < 100) {
            pos = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            const onSnake = currentSnake.some(s => s.x === pos.x && s.y === pos.y);
            if (!onSnake) return pos;
            attempts++;
        }
        return { x: 5, y: 5 }; // Fallback
    }, []);

    const spawnFood = useCallback((currentSnake: Position[]) => {
        const pos = getRandomEmptyPos(currentSnake);
        const rand = Math.random();
        let type: keyof typeof FOOD_TYPES = 'NORMAL';
        
        if (rand > 0.9) type = 'CHERRY';
        else if (rand > 0.8) type = 'STRAWBERRY';
        else if (rand > 0.7) type = 'BANANA';

        setFood({ ...pos, type });
    }, [getRandomEmptyPos]);

    const resetGame = useCallback(() => {
        const initialSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        setSnake(initialSnake);
        directionRef.current = 'UP';
        nextDirectionRef.current = 'UP';
        setScore(0);
        setSpeed(INITIAL_SPEED);
        setGameOver(false);
        setEarnedCoins(0);
        
        spawnFood(initialSnake);
        setIsPlaying(false);
        if (onReportProgress) onReportProgress('play', 1);
    }, [spawnFood, onReportProgress]);

    const moveSnake = useCallback(() => {
        if (!isPlaying || gameOver) return;

        directionRef.current = nextDirectionRef.current;
        const head = snake[0];
        let newHead = { ...head };

        if (directionRef.current === 'UP') newHead.y -= 1;
        else if (directionRef.current === 'DOWN') newHead.y += 1;
        else if (directionRef.current === 'LEFT') newHead.x -= 1;
        else if (directionRef.current === 'RIGHT') newHead.x += 1;

        // Collision Check
        const hitWall = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
        const hitSelf = snake.some(s => s.x === newHead.x && s.y === newHead.y);

        if (hitWall || hitSelf) {
            setGameOver(true);
            setIsPlaying(false);
            audio?.playGameOver?.();
            
            const particleX = Math.max(0, Math.min(GRID_SIZE - 1, newHead.x));
            const particleY = Math.max(0, Math.min(GRID_SIZE - 1, newHead.y));
            spawnParticles(particleX, particleY, '#ffffff', 30);
            
            if (onReportProgress) onReportProgress('score', score);
            const coins = Math.floor(score / 50);
            if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            return;
        }

        const newSnake = [newHead, ...snake];

        // Check Food
        if (newHead.x === food.x && newHead.y === food.y) {
            const foodType = FOOD_TYPES[food.type];
            setScore(s => s + foodType.points);
            audio?.playCoin?.();
            spawnParticles(food.x, food.y, foodType.color);
            
            if (food.type === 'STRAWBERRY') setSpeed(prev => Math.max(MIN_SPEED, prev - 20));
            if (food.type === 'BANANA') setSpeed(prev => prev + 30);
            
            spawnFood(newSnake);
            if (onReportProgress) onReportProgress('action', 1);
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [isPlaying, gameOver, snake, food, score, audio, spawnFood, spawnParticles, addCoins, onReportProgress]);

    useGameLoop(moveSnake, isPlaying && !gameOver ? speed : null);

    const setNextDirection = useCallback((dir: Direction) => {
        if (dir === 'UP' && directionRef.current === 'DOWN') return;
        if (dir === 'DOWN' && directionRef.current === 'UP') return;
        if (dir === 'LEFT' && directionRef.current === 'RIGHT') return;
        if (dir === 'RIGHT' && directionRef.current === 'LEFT') return;
        nextDirectionRef.current = dir;
        audio?.resumeAudio?.();
    }, [audio]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver) return;
            const key = e.key.toLowerCase();
            if (key === 'arrowup' || key === 'w' || key === 'z') setNextDirection('UP');
            else if (key === 'arrowdown' || key === 's') setNextDirection('DOWN');
            else if (key === 'arrowleft' || key === 'a' || key === 'q') setNextDirection('LEFT');
            else if (key === 'arrowright' || key === 'd') setNextDirection('RIGHT');
            
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 's', 'a', 'd', 'z', 'q'].includes(key)) {
                if (!isPlaying && !gameOver) setIsPlaying(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setNextDirection, isPlaying, gameOver]);

    return {
        snake, food, score, gameOver, isPlaying, 
        earnedCoins, particlesRef, setNextDirection, setIsPlaying, resetGame
    };
};
