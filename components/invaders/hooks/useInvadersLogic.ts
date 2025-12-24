
import { useState, useRef, useCallback } from 'react';
import { Player, Enemy, Bullet, Particle, GamePhase } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED, ENEMY_BULLET_SPEED, BASE_ENEMY_SPEED } from '../constants';

export const useInvadersLogic = (audio: any, addCoins: any, updateHighScore: any, onReportProgress?: any) => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [gameState, setGameState] = useState<GamePhase>('MENU');
    const [earnedCoins, setEarnedCoins] = useState(0);

    const playerRef = useRef<Player>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: 32, height: 32, active: true, color: '#00f3ff' });
    const bulletsRef = useRef<Bullet[]>([]);
    const enemiesRef = useRef<Enemy[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    
    const lastShotTimeRef = useRef(0);
    const lastEnemyShotTimeRef = useRef(0);
    const touchXRef = useRef<number | null>(null);

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y, dx: (Math.random() - 0.5) * 5, dy: (Math.random() - 0.5) * 5,
                life: 30, maxLife: 30, color, size: Math.random() * 3 + 1
            });
        }
    };

    const startWave = useCallback((waveNum: number) => {
        enemiesRef.current = [];
        const rows = Math.min(3 + Math.floor(waveNum / 2), 6);
        const cols = 6;
        const speed = BASE_ENEMY_SPEED + (waveNum * 0.2);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const typeRand = Math.random();
                let type: Enemy['type'] = 'basic';
                let color = '#ff00ff';
                let health = 1;
                let scoreVal = 10;

                if (typeRand > 0.8 && waveNum > 1) { type = 'shooter'; color = '#facc15'; scoreVal = 30; }
                else if (typeRand > 0.9 && waveNum > 2) { type = 'heavy'; color = '#ef4444'; health = 3; scoreVal = 50; }
                else if (waveNum > 3 && r === 0 && Math.random() > 0.7) { type = 'kamikaze'; color = '#00ff9d'; scoreVal = 40; }

                enemiesRef.current.push({
                    x: 40 + c * 50, y: 40 + r * 45, width: 28, height: 24, active: true,
                    type, color, health, score: scoreVal, dx: speed, dy: 0
                });
            }
        }
    }, []);

    const resetGame = useCallback(() => {
        setScore(0); setLives(3); setWave(1); setEarnedCoins(0);
        playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, width: 32, height: 32, active: true, color: '#00f3ff' };
        bulletsRef.current = []; enemiesRef.current = []; particlesRef.current = [];
        startWave(1);
        setGameState('PLAYING');
        if (onReportProgress) onReportProgress('play', 1);
    }, [startWave, onReportProgress]);

    const handlePlayerDeath = () => {
        audio.playExplosion();
        spawnParticles(playerRef.current.x, playerRef.current.y, '#00f3ff', 50);
        if (lives > 1) {
            setLives(l => l - 1);
            playerRef.current.x = CANVAS_WIDTH / 2;
            bulletsRef.current = [];
        } else {
            setLives(0); setGameState('GAMEOVER');
            audio.playGameOver(); updateHighScore('invaders', score);
            const coins = Math.floor(score / 50);
            if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            if (onReportProgress) onReportProgress('score', score);
        }
    };

    const updatePhysics = () => {
        if (gameState !== 'PLAYING') return;
        const now = Date.now();
        const player = playerRef.current;

        if (touchXRef.current !== null) {
            player.x += (touchXRef.current - player.x) * 0.15;
            if (now - lastShotTimeRef.current > 250) {
                bulletsRef.current.push({ x: player.x, y: player.y - 10, width: 4, height: 12, active: true, dy: -BULLET_SPEED, color: '#00f3ff', isEnemy: false });
                audio.playLaserShoot(); lastShotTimeRef.current = now;
            }
        }
        player.x = Math.max(player.width/2, Math.min(CANVAS_WIDTH - player.width/2, player.x));

        let hitEdge = false;
        enemiesRef.current.forEach(e => {
            if (!e.active) return;
            e.x += e.dx;
            if (e.x <= e.width/2 || e.x >= CANVAS_WIDTH - e.width/2) hitEdge = true;
            if (e.type === 'kamikaze') { e.y += 1; e.x += (player.x > e.x ? 0.5 : -0.5); }
            if ((e.type === 'shooter' || e.type === 'heavy') && Math.random() < 0.005) {
                bulletsRef.current.push({ x: e.x, y: e.y + 15, width: 4, height: 10, active: true, dy: ENEMY_BULLET_SPEED, color: e.color, isEnemy: true });
            }
            if (Math.hypot(e.x - player.x, e.y - player.y) < 25) { e.active = false; handlePlayerDeath(); }
        });

        if (hitEdge) enemiesRef.current.forEach(e => { e.dx *= -1; e.y += 20; });

        bulletsRef.current.forEach(b => {
            b.y += b.dy;
            if (b.y < 0 || b.y > CANVAS_HEIGHT) b.active = false;
            if (b.isEnemy) {
                if (Math.hypot(b.x - player.x, b.y - player.y) < 20) { b.active = false; handlePlayerDeath(); }
            } else {
                enemiesRef.current.forEach(e => {
                    if (e.active && Math.hypot(b.x - e.x, b.y - e.y) < 20) {
                        b.active = false; e.health--; spawnParticles(b.x, b.y, '#fff', 5);
                        if (e.health <= 0) { e.active = false; setScore(s => s + e.score); audio.playExplosion(); spawnParticles(e.x, e.y, e.color, 20); }
                    }
                });
            }
        });

        bulletsRef.current = bulletsRef.current.filter(b => b.active);
        enemiesRef.current = enemiesRef.current.filter(e => e.active);
        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        if (enemiesRef.current.length === 0) {
            audio.playVictory(); setWave(w => { const next = w + 1; startWave(next); return next; });
        }
    };

    return { 
        score, lives, wave, gameState, earnedCoins, 
        playerRef, bulletsRef, enemiesRef, particlesRef, touchXRef,
        resetGame, updatePhysics, setGameState 
    };
};
