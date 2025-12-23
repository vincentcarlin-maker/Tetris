
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

    // --- MULTIPLAYER REFS ---
    const lastNetworkUpdateRef = useRef<number>(0);
    const lastWorldSyncRef = useRef<number>(0);
    const boostCounterRef = useRef<number>(0);
    const isMasterRef = useRef(false);

    // --- HELPERS ---
    const getMyUniqueId = () => {
        return localStorage.getItem('neon_social_id') || mp.peerId || `anon_${Math.random().toString(36).substr(2, 5)}`;
    };

    const spawnWorm = (id: string, name: string, color: string, skin?: any, accessory?: any): Worm => {
        const margin = 800;
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

    const generateFood = (count: number = 1): Food[] => {
        const batch: Food[] = [];
        for (let i = 0; i < count; i++) {
            batch.push({
                id: `f_${Math.random().toString(36).substr(2, 9)}`,
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                val: Math.floor(Math.random() * 3) + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
        return batch;
    };

    // --- NETWORK HANDLER ---
    const handleDataRef = useRef<(data: any, from: string) => void>(null);

    useEffect(() => {
        handleDataRef.current = (data: any, from: string) => {
            if (gameState === 'MENU' || gameState === 'SERVER_SELECT') return;

            if (data.type === 'SLITHER_JOIN') {
                if (isMasterRef.current) {
                    mp.sendData({ 
                        type: 'SLITHER_WORLD_SYNC', 
                        food: foodRef.current, 
                        bots: othersRef.current.filter(w => w.id.startsWith('bot_'))
                    });
                }
                if (playerWormRef.current) {
                    mp.sendData({ type: 'SLITHER_UPDATE', worm: playerWormRef.current });
                }
            }

            if (data.type === 'SLITHER_UPDATE') {
                const remoteWorm = data.worm;
                if (!remoteWorm || remoteWorm.id === getMyUniqueId()) return;
                
                const existingIdx = othersRef.current.findIndex(w => w.id === remoteWorm.id);
                if (existingIdx !== -1) {
                    const w = othersRef.current[existingIdx];
                    w.angle = remoteWorm.angle;
                    w.score = remoteWorm.score;
                    w.radius = remoteWorm.radius;
                    w.isBoost = remoteWorm.isBoost;
                    w.segments = remoteWorm.segments; 
                    w.skin = remoteWorm.skin;
                    w.accessory = remoteWorm.accessory;
                } else {
                    othersRef.current.push({ ...remoteWorm, isDead: false });
                }
            }

            if (data.type === 'SLITHER_WORLD_SYNC' && !isMasterRef.current) {
                foodRef.current = data.food;
                const remoteBots = data.bots || [];
                othersRef.current = othersRef.current.filter(w => !w.id.startsWith('bot_'));
                othersRef.current.push(...remoteBots);
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
                    othersRef.current.splice(idx, 1);
                }
            }
        };
    }, [gameState, mp, gameMode]);

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any, conn: any) => { 
            if (handleDataRef.current) handleDataRef.current(data, conn?.peer); 
        });
        return () => unsubscribe();
    }, [mp.subscribe]);

    // --- GAME ACTIONS ---
    const startGame = (mode: GameMode, serverId?: string) => {
        setGameMode(mode);
        setEarnedCoins(0);
        setIsBoosting(false);
        isBoostingRef.current = false;
        
        const playerSkin = slitherSkinsCatalog.find(s => s.id === currentSlitherSkinId) || slitherSkinsCatalog[0];
        const playerAcc = slitherAccessoriesCatalog.find(a => a.id === currentSlitherAccessoryId);

        if (mode === 'ONLINE' && serverId) {
            setCurrentServer(serverId);
            mp.joinPublicRoom(serverId);
            othersRef.current = [];
            foodRef.current = [];
            const sortedPlayers = [...mp.players].sort((a, b) => (a.online_at || "").localeCompare(b.online_at || ""));
            if (sortedPlayers.length <= 1) {
                isMasterRef.current = true;
                foodRef.current = generateFood(INITIAL_FOOD_COUNT);
            }
        } else {
            isMasterRef.current = true;
            othersRef.current = Array.from({length: BOT_COUNT}, (_, i) => spawnWorm(`bot_${i}`, `Bot ${i+1}`, COLORS[Math.floor(Math.random() * COLORS.length)]));
            foodRef.current = generateFood(INITIAL_FOOD_COUNT);
        }

        playerWormRef.current = spawnWorm(getMyUniqueId(), username, playerSkin.primaryColor, playerSkin, playerAcc);
        
        setGameState('PLAYING');
        setScore(0);
        audio.resumeAudio();
        
        if (mode === 'ONLINE') {
            setTimeout(() => mp.sendData({ type: 'SLITHER_JOIN' }), 200);
        }
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const handleDeath = useCallback(() => {
        const player = playerWormRef.current;
        if (!player || player.isDead || gameState !== 'PLAYING') return;
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

        if (gameMode === 'ONLINE') {
            const sortedPlayers = [...mp.players].filter(p => p.extraInfo === 'Slither').sort((a, b) => (a.online_at || "").localeCompare(b.online_at || ""));
            const master = sortedPlayers[0];
            isMasterRef.current = master?.id === mp.peerId;
        }

        particlesRef.current.forEach(p => { p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.life -= 0.02 * speedFactor; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        if (shakeRef.current > 0) { shakeRef.current *= Math.pow(0.9, speedFactor); if (shakeRef.current < 0.5) shakeRef.current = 0; }

        const player = playerWormRef.current;
        if (!player) return;

        if (gameState === 'DYING') {
            cameraRef.current.x = player.segments[0].x;
            cameraRef.current.y = player.segments[0].y;
            return;
        }

        if (gameMode === 'ONLINE' && isMasterRef.current && now - lastWorldSyncRef.current > 1000) {
            let changed = false;
            if (foodRef.current.length < MIN_FOOD_REGEN) {
                foodRef.current.push(...generateFood(150));
                changed = true;
            }
            if (othersRef.current.filter(w => w.id.startsWith('bot_')).length < 15) {
                othersRef.current.push(spawnWorm(`bot_${Date.now()}_${Math.random()}`, "Dronoid", COLORS[Math.floor(Math.random()*COLORS.length)]));
                changed = true;
            }
            
            if (changed || now - lastWorldSyncRef.current > 3000) {
                mp.sendData({ 
                    type: 'SLITHER_WORLD_SYNC', 
                    food: foodRef.current, 
                    bots: othersRef.current.filter(w => w.id.startsWith('bot_'))
                });
                lastWorldSyncRef.current = now;
            }
        }

        if (gameMode === 'ONLINE' && now - lastNetworkUpdateRef.current > 45) {
            mp.sendData({ type: 'SLITHER_UPDATE', worm: player });
            lastNetworkUpdateRef.current = now;
        }

        let playerTargetAngle = player.angle;
        if (joystickActiveRef.current) {
            const vx = joystickVectorRef.current.x;
            const vy = joystickVectorRef.current.y;
            if (Math.sqrt(vx * vx + vy * vy) > 3) playerTargetAngle = Math.atan2(vy, vx);
        }

        player.isBoost = isBoostingRef.current && player.segments.length > INITIAL_LENGTH;
        const currentSpeed = player.isBoost ? BOOST_SPEED : BASE_SPEED;
        
        if (player.isBoost) {
            boostCounterRef.current += speedFactor;
            // Création d'une traînée de boost (bulles de score perdues)
            if (frameRef.current % 5 === 0) {
                 foodRef.current.push({
                    id: `boost_f_${now}_${Math.random()}`,
                    x: player.segments[player.segments.length-1].x + (Math.random()-0.5)*20,
                    y: player.segments[player.segments.length-1].y + (Math.random()-0.5)*20,
                    val: 1,
                    color: '#fff'
                 });
            }
            
            if (boostCounterRef.current >= 10) { 
                boostCounterRef.current = 0;
                player.segments.pop();
                player.score = Math.max(0, player.score - 1);
                setScore(player.score);
                player.radius = calculateWormRadius(player.score);
            }
        }

        updateWormMovement(player, playerTargetAngle, currentSpeed, speedFactor);

        const head = player.segments[0];
        if (head.x < 0 || head.x > WORLD_SIZE || head.y < 0 || head.y > WORLD_SIZE) handleDeath();

        for (let i = foodRef.current.length - 1; i >= 0; i--) {
            const f = foodRef.current[i];
            const distSq = (head.x - f.x)**2 + (head.y - f.y)**2;
            if (distSq < (player.radius + 15)**2) {
                player.score += f.val * 5;
                player.radius = calculateWormRadius(player.score);
                setScore(player.score);
                audio.playCoin();
                for (let j = 0; j < f.val; j++) player.segments.push({ ...player.segments[player.segments.length - 1] });
                
                const foodId = f.id;
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId });
            }
        }

        othersRef.current.forEach(other => {
            if (other.isDead) return;
            if (Math.abs(other.segments[0].x - head.x) > 1000 || Math.abs(other.segments[0].y - head.y) > 1000) return;
            
            for (let sIdx = 0; sIdx < other.segments.length; sIdx += 3) {
                if ((head.x - other.segments[sIdx].x)**2 + (head.y - other.segments[sIdx].y)**2 < (other.radius + player.radius * 0.4)**2) { 
                    handleDeath(); 
                    return; 
                }
            }
        });

        if (isMasterRef.current) {
            othersRef.current.forEach(bot => {
                if (!bot.id.startsWith('bot_')) return;
                updateBotAI(bot, [player, ...othersRef.current], speedFactor);
            });
            othersRef.current = othersRef.current.filter(b => !b.isDead);
        }

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

    const updateBotAI = (bot: Worm, allWorms: Worm[], speedFactor: number) => {
        if (bot.isDead) return;
        const bHead = bot.segments[0];

        if (bHead.x < 100 || bHead.x > WORLD_SIZE - 100 || bHead.y < 100 || bHead.y > WORLD_SIZE - 100) {
            bot.aiTargetAngle = Math.atan2(WORLD_SIZE/2 - bHead.y, WORLD_SIZE/2 - bHead.x);
        }

        bot.aiDecisionTimer = (bot.aiDecisionTimer || 0) - speedFactor;
        if (bot.aiDecisionTimer <= 0) {
            let closestF = null, minDistSq = 600**2;
            for (let f of foodRef.current) {
                const dSq = (bHead.x - f.x)**2 + (bHead.y - f.y)**2;
                if (dSq < minDistSq) { minDistSq = dSq; closestF = f; }
            }
            bot.aiTargetAngle = closestF ? Math.atan2(closestF.y - bHead.y, closestF.x - bHead.x) : bot.angle + (Math.random() - 0.5) * 0.4;
            bot.aiDecisionTimer = 20 + Math.random() * 30;
        }

        updateWormMovement(bot, bot.aiTargetAngle || bot.angle, BASE_SPEED, speedFactor);

        allWorms.forEach(w => {
            if (w.id === bot.id || w.isDead) return;
            for (let sIdx = 0; sIdx < w.segments.length; sIdx += 4) {
                 if ((bHead.x - w.segments[sIdx].x)**2 + (bHead.y - w.segments[sIdx].y)**2 < (w.radius + bot.radius * 0.4)**2) {
                     bot.isDead = true;
                     spawnParticles(bHead.x, bHead.y, bot.color, 15);
                     bot.segments.forEach((s, idx) => { if(idx % 4 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 2, color: bot.color }); });
                     break;
                 }
            }
        });
    };

    const frameRef = useRef(0);
    useEffect(() => {
        const loop = () => {
            frameRef.current++;
            requestAnimationFrame(loop);
        };
        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, []);

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
