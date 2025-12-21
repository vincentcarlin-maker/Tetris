
import { useState, useRef, useEffect, useCallback } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { Worm, Food, Particle, Point, GameState, GameMode } from '../types';
import { WORLD_SIZE, INITIAL_LENGTH, SEGMENT_DISTANCE, BASE_SPEED, BOOST_SPEED, TURN_SPEED, BOT_COUNT, INITIAL_FOOD_COUNT, MIN_FOOD_REGEN, COLORS, calculateWormRadius } from '../constants';

export const useSlitherLogic = (audio: any, addCoins: any, mp: any, onReportProgress?: any) => {
    const { username, currentSlitherSkinId, slitherSkinsCatalog, currentSlitherAccessoryId, slitherAccessoriesCatalog } = useCurrency();
    const { updateHighScore } = useHighScores();

    // --- STATE ---
    const [gameState, setGameState] = useState<GameState>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState({ current: 0, total: 0 });
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [isBoosting, setIsBoosting] = useState(false);
    const [currentServer, setCurrentServer] = useState<string | null>(null);

    // --- REFS (PHYSICS) ---
    const playerWormRef = useRef<Worm | null>(null);
    const othersRef = useRef<Worm[]>([]);
    const foodRef = useRef<Food[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef<Point>({ x: 0, y: 0 });
    const shakeRef = useRef(0);
    const isBoostingRef = useRef(false);
    
    // --- INPUT REFS ---
    const joystickActiveRef = useRef(false);
    const joystickVectorRef = useRef<Point>({ x: 0, y: 0 });

    // --- TIMERS ---
    const lastNetworkUpdateRef = useRef<number>(0);
    const boostCounterRef = useRef<number>(0);

    // --- HELPERS ---
    const spawnWorm = (id: string, name: string, color: string, skin?: any, accessory?: any): Worm => {
        const margin = 500;
        const x = Math.random() * (WORLD_SIZE - margin*2) + margin;
        const y = Math.random() * (WORLD_SIZE - margin*2) + margin;
        const segments: Point[] = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
            segments.push({ x: x - i * SEGMENT_DISTANCE, y });
        }
        return { 
            id, name, segments, angle: Math.random() * Math.PI * 2, color, skin, accessory, 
            score: 0, isBoost: false, isDead: false, radius: calculateWormRadius(0),
            aiTargetAngle: Math.random() * Math.PI * 2,
            aiDecisionTimer: Math.floor(Math.random() * 50)
        };
    };

    const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particlesRef.current.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1.0, color, size: Math.random() * 4 + 2
            });
        }
    };

    const spawnFood = (count: number = 1) => {
        for (let i = 0; i < count; i++) {
            foodRef.current.push({
                id: `f_${Date.now()}_${Math.random()}`,
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                val: Math.floor(Math.random() * 3) + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    };

    // --- NETWORK ---
    const handleDataRef = useRef<(data: any) => void>(null);

    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (gameMode !== 'ONLINE') return;
            
            if (data.type === 'SLITHER_UPDATE') {
                const remoteWorm = data.worm;
                const existingIdx = othersRef.current.findIndex(w => w.id === remoteWorm.id);
                if (existingIdx !== -1) {
                    othersRef.current[existingIdx] = { ...othersRef.current[existingIdx], ...remoteWorm };
                } else {
                    othersRef.current.push({ ...remoteWorm, segments: remoteWorm.segments.map((p: any) => ({...p})) });
                }
            }
            if (data.type === 'SLITHER_FOOD_EATEN') {
                const idx = foodRef.current.findIndex(f => f.id === data.foodId);
                if (idx !== -1) foodRef.current.splice(idx, 1);
            }
            if (data.type === 'SLITHER_PLAYER_DIED') {
                const deadId = data.wormId;
                const idx = othersRef.current.findIndex(w => w.id === deadId);
                if (idx !== -1) {
                    const deadWorm = othersRef.current[idx];
                    spawnParticles(deadWorm.segments[0].x, deadWorm.segments[0].y, deadWorm.color, 40);
                    deadWorm.segments.forEach((s, i) => { if(i % 3 === 0) foodRef.current.push({ id: `f_dead_${deadId}_${i}`, x: s.x, y: s.y, val: 2, color: deadWorm.color }); });
                    othersRef.current.splice(idx, 1);
                }
            }
        };
    }, [gameMode]);

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => { if (handleDataRef.current) handleDataRef.current(data); });
        return () => unsubscribe();
    }, [mp.subscribe]);

    // --- GAME ACTIONS ---
    const startGame = (mode: GameMode, serverId?: string) => {
        setGameMode(mode);
        if (mode === 'ONLINE' && serverId) {
            setCurrentServer(serverId);
            mp.joinPublicRoom(serverId);
            mp.updateSelfInfo(username, undefined, undefined, serverId);
            othersRef.current = [];
        } else {
            othersRef.current = Array.from({length: BOT_COUNT}, (_, i) => spawnWorm(`bot_${i}`, `Bot ${i+1}`, COLORS[Math.floor(Math.random() * COLORS.length)]));
        }

        const playerSkin = slitherSkinsCatalog.find(s => s.id === currentSlitherSkinId) || slitherSkinsCatalog[0];
        const playerAcc = slitherAccessoriesCatalog.find(a => a.id === currentSlitherAccessoryId);
        
        playerWormRef.current = spawnWorm(mp.peerId || 'player', username, playerSkin.primaryColor, playerSkin, playerAcc);
        foodRef.current = [];
        particlesRef.current = [];
        spawnFood(INITIAL_FOOD_COUNT);
        
        setGameState('PLAYING');
        setScore(0);
        setRank({ current: 0, total: 0 });
        setEarnedCoins(0);
        setIsBoosting(false);
        isBoostingRef.current = false;
        audio.resumeAudio();
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const handleDeath = useCallback(() => {
        const player = playerWormRef.current;
        if (!player || player.isDead || gameState === 'DYING') return;
        player.isDead = true;
        setGameState('DYING');
        
        if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_PLAYER_DIED', wormId: player.id });
        
        setIsBoosting(false);
        isBoostingRef.current = false;
        joystickActiveRef.current = false;
        
        spawnParticles(player.segments[0].x, player.segments[0].y, player.skin?.primaryColor || player.color, 60);
        shakeRef.current = 15;
        audio.playExplosion();
        
        setTimeout(() => {
            setGameState('GAMEOVER');
            audio.playGameOver();
            updateHighScore('slither', player.score);
            const coins = Math.floor(player.score / 50);
            if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            if (onReportProgress) onReportProgress('score', player.score);
        }, 1500);
    }, [gameState, gameMode, mp, audio, addCoins, onReportProgress, updateHighScore]);

    // --- PHYSICS ENGINE ---
    const updatePhysics = (dt: number) => {
        if (gameState === 'MENU' || gameState === 'SERVER_SELECT' || gameState === 'GAMEOVER') return;
        const speedFactor = dt / 16.67;
        const now = Date.now();

        // Particles
        particlesRef.current.forEach(p => { p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.life -= 0.02 * speedFactor; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Shake
        if (shakeRef.current > 0) { shakeRef.current *= Math.pow(0.9, speedFactor); if (shakeRef.current < 0.5) shakeRef.current = 0; }

        const player = playerWormRef.current;
        if (!player) return;

        // Camera follow death
        if (gameState === 'DYING') {
            cameraRef.current.x = player.segments[0].x;
            cameraRef.current.y = player.segments[0].y;
            return;
        }

        // Online Sync
        if (gameMode === 'ONLINE' && now - lastNetworkUpdateRef.current > 40) {
            mp.sendData({ type: 'SLITHER_UPDATE', worm: { id: player.id, name: player.name, segments: player.segments, color: player.color, skin: player.skin, score: player.score, radius: player.radius, angle: player.angle, isBoost: player.isBoost } });
            lastNetworkUpdateRef.current = now;
        }

        // Input
        let playerTargetAngle = player.angle;
        if (joystickActiveRef.current) {
            const vx = joystickVectorRef.current.x;
            const vy = joystickVectorRef.current.y;
            if (Math.sqrt(vx * vx + vy * vy) > 3) playerTargetAngle = Math.atan2(vy, vx);
        }

        // Boost Logic
        const canBoost = player.segments.length > INITIAL_LENGTH;
        if (!canBoost && isBoostingRef.current) { isBoostingRef.current = false; setIsBoosting(false); }
        player.isBoost = isBoostingRef.current;
        const currentSpeed = player.isBoost ? BOOST_SPEED : BASE_SPEED;
        
        if (player.isBoost) {
            boostCounterRef.current += speedFactor;
            if (boostCounterRef.current >= 8) { 
                boostCounterRef.current = 0;
                player.segments.pop();
                player.score = Math.max(0, player.score - 2);
                setScore(player.score);
                player.radius = calculateWormRadius(player.score);
                const tail = player.segments[player.segments.length - 1];
                foodRef.current.push({ id: `boost_f_${Date.now()}`, x: tail.x, y: tail.y, val: 1, color: player.skin?.primaryColor || player.color });
            }
        }

        // Move Player
        updateWormMovement(player, playerTargetAngle, currentSpeed, speedFactor);

        // World Bounds
        const head = player.segments[0];
        if (head.x < 0 || head.x > WORLD_SIZE || head.y < 0 || head.y > WORLD_SIZE) handleDeath();

        // Food Collision
        for (let i = foodRef.current.length - 1; i >= 0; i--) {
            const f = foodRef.current[i];
            if (Math.abs(head.x - f.x) > 100 || Math.abs(head.y - f.y) > 100) continue;
            if ((head.x - f.x)**2 + (head.y - f.y)**2 < (player.radius + 15)**2) {
                player.score += f.val * 5;
                setScore(player.score);
                player.radius = calculateWormRadius(player.score);
                audio.playCoin();
                for (let j = 0; j < f.val; j++) player.segments.push({ ...player.segments[player.segments.length - 1] });
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId: f.id });
                if (foodRef.current.length < MIN_FOOD_REGEN) spawnFood(200);
            }
        }

        // Worm Collision
        othersRef.current.forEach(other => {
            if (other.isDead) return;
            if (Math.abs(other.segments[0].x - head.x) > 1000 || Math.abs(other.segments[0].y - head.y) > 1000) return;
            for (let sIdx = 0; sIdx < other.segments.length; sIdx += 3) {
                if ((head.x - other.segments[sIdx].x)**2 + (head.y - other.segments[sIdx].y)**2 < (other.radius + 5)**2) { handleDeath(); return; }
            }
        });

        // Bots AI (Solo only)
        if (gameMode === 'SOLO') {
            const allWorms = [player, ...othersRef.current];
            othersRef.current.forEach(bot => updateBotAI(bot, allWorms, speedFactor, player));
            othersRef.current = othersRef.current.filter(b => !b.isDead);
            if (othersRef.current.length < BOT_COUNT) othersRef.current.push(spawnWorm(`bot_${Date.now()}_${Math.random()}`, "Bot " + (Math.floor(Math.random()*2000)), COLORS[Math.floor(Math.random()*COLORS.length)]));
        }

        // Camera & Leaderboard
        cameraRef.current.x = head.x;
        cameraRef.current.y = head.y;
        const sortedWorms = [player, ...othersRef.current].sort((a,b) => b.score - a.score);
        setRank({ current: sortedWorms.findIndex(w => w.id === player.id) + 1, total: sortedWorms.length });
        setLeaderboard(sortedWorms.slice(0, 10).map(w => ({ name: w.name, score: w.score, isMe: w.id === player.id })));
    };

    const updateWormMovement = (worm: Worm, targetAngle: number, speed: number, speedFactor: number) => {
        let angleDiff = targetAngle - worm.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        worm.angle += angleDiff * TURN_SPEED * speedFactor;

        const head = worm.segments[0];
        const nextX = head.x + Math.cos(worm.angle) * speed * speedFactor;
        const nextY = head.y + Math.sin(worm.angle) * speed * speedFactor;
        
        const newSegments = [{ x: nextX, y: nextY }];
        let prev = newSegments[0];
        for (let i = 1; i < worm.segments.length; i++) {
            const curr = worm.segments[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const angle = Math.atan2(dy, dx);
            newSegments.push({ x: prev.x + Math.cos(angle) * SEGMENT_DISTANCE, y: prev.y + Math.sin(angle) * SEGMENT_DISTANCE });
            prev = newSegments[i];
        }
        worm.segments = newSegments;
    };

    const updateBotAI = (bot: Worm, allWorms: Worm[], speedFactor: number, player: Worm) => {
        if (bot.isDead) return;
        const bHead = bot.segments[0];
        bot.aiDecisionTimer = (bot.aiDecisionTimer || 0) - speedFactor;

        if (bot.aiDecisionTimer <= 0) {
            // Simple Raycast avoidance
            const lookAhead = 120 + bot.radius * 2;
            const rays = [0, -0.5, 0.5, -1.0, 1.0];
            let collisionFound = false;
            let clearAngle = bot.angle;
            
            // Bounds check
            if (bHead.x < 200) { clearAngle = 0; collisionFound = true; }
            else if (bHead.x > WORLD_SIZE - 200) { clearAngle = Math.PI; collisionFound = true; }
            else if (bHead.y < 200) { clearAngle = Math.PI / 2; collisionFound = true; }
            else if (bHead.y > WORLD_SIZE - 200) { clearAngle = -Math.PI / 2; collisionFound = true; }
            
            if (!collisionFound) {
                for (let angleOff of rays) {
                    const testAngle = bot.angle + angleOff;
                    const tx = bHead.x + Math.cos(testAngle) * lookAhead;
                    const ty = bHead.y + Math.sin(testAngle) * lookAhead;
                    if (allWorms.some(w => !w.isDead && w.id !== bot.id && w.segments.some((s, idx) => idx % 4 === 0 && (tx-s.x)**2 + (ty-s.y)**2 < (w.radius+bot.radius)**2))) {
                        if (angleOff === 0) collisionFound = true;
                    } else if (collisionFound) { clearAngle = testAngle; break; }
                }
            }

            if (!collisionFound) {
                let closestF = null, minDistSq = 700**2;
                for (let f of foodRef.current) {
                    if (Math.abs(f.x - bHead.x) > 400 || Math.abs(f.y - bHead.y) > 400) continue;
                    const dSq = (bHead.x - f.x)**2 + (bHead.y - f.y)**2;
                    if (dSq < minDistSq) { minDistSq = dSq; closestF = f; }
                }
                bot.aiTargetAngle = closestF ? Math.atan2(closestF.y - bHead.y, closestF.x - bHead.x) : bot.angle + (Math.random() - 0.5) * 0.4;
                bot.aiDecisionTimer = 15 + Math.random() * 20;
            } else {
                bot.aiTargetAngle = clearAngle;
                bot.aiDecisionTimer = 5;
                bot.isBoost = true;
            }
        }
        updateWormMovement(bot, bot.aiTargetAngle || bot.angle, bot.isBoost ? BOOST_SPEED : BASE_SPEED, speedFactor);
        if (Math.random() > 0.98) bot.isBoost = false;

        // Player Collision Check for Bot
        if ((bHead.x - player.segments[0].x)**2 + (bHead.y - player.segments[0].y)**2 < (bot.radius + player.radius)**2) handleDeath();
        // Check if Bot hits Player Body
        for (let pIdx = 6; pIdx < player.segments.length; pIdx += 4) {
             if ((bHead.x - player.segments[pIdx].x)**2 + (bHead.y - player.segments[pIdx].y)**2 < (player.radius + 5)**2) {
                 bot.isDead = true;
                 spawnParticles(bHead.x, bHead.y, bot.color, 15);
                 bot.segments.forEach((s, idx) => { if(idx % 4 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 2, color: bot.skin?.primaryColor || bot.color }); });
                 break;
             }
        }
    };

    return {
        gameState, setGameState,
        gameMode, setGameMode,
        score,
        rank,
        leaderboard,
        earnedCoins,
        isBoosting, setIsBoosting, isBoostingRef,
        playerWormRef, othersRef, foodRef, particlesRef, cameraRef, shakeRef,
        joystickActiveRef, joystickVectorRef,
        startGame,
        updatePhysics
    };
};
