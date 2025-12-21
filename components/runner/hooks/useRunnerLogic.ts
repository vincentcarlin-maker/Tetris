
import { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Player, Obstacle, CoinEntity, TreasureEntity, PowerUpEntity, Particle, 
    WeatherParticle, SpeedLine, Mission, EventType, PowerUpType 
} from '../types';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, GRAVITY, JUMP_FORCE, 
    BASE_SPEED, MAX_SPEED, BOOST_SPEED_MULTIPLIER, BIOME_SWITCH_DISTANCE, 
    BIOMES, SKINS 
} from '../constants';

export const useRunnerLogic = (
    audio: any,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    // --- STATE ---
    const [distance, setDistance] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [currentBiome, setCurrentBiome] = useState(BIOMES[0]);
    const [activeEvent, setActiveEvent] = useState<{ type: EventType, label: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [currentMission, setCurrentMission] = useState<Mission | null>(null);
    const [missionProgress, setMissionProgress] = useState(0);
    
    // Skin State
    const [currentSkinId, setCurrentSkinId] = useState<string>(() => localStorage.getItem('runner_skin_id') || 'default');
    
    // PowerUps UI State
    const [activePowerUps, setActivePowerUps] = useState<{ [key in PowerUpType]?: number }>({});
    const [shake, setShake] = useState(0);

    // --- REFS (GAME OBJECTS) ---
    const playerRef = useRef<Player>({ x: 100, y: GROUND_HEIGHT - 40, width: 30, height: 30, dy: 0, grounded: true, color: '#00f3ff', rotation: 0 });
    const obstaclesRef = useRef<Obstacle[]>([]);
    const coinsRef = useRef<CoinEntity[]>([]);
    const treasuresRef = useRef<TreasureEntity[]>([]);
    const powerUpsRef = useRef<PowerUpEntity[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const weatherRef = useRef<WeatherParticle[]>([]);
    const speedLinesRef = useRef<SpeedLine[]>([]);

    // --- REFS (LOGIC) ---
    const speedRef = useRef(BASE_SPEED);
    const frameRef = useRef(0);
    const distanceRef = useRef(0);
    const shakeRef = useRef(0);
    const biomeRef = useRef(BIOMES[0]);
    const eventRef = useRef<EventType>('NONE');
    const nextBiomeThresholdRef = useRef(BIOME_SWITCH_DISTANCE);
    const missionRef = useRef<Mission | null>(null);
    const missionLevelRef = useRef(1);
    
    const activeEffectsRef = useRef<{ 
        magnet: boolean; shield: boolean; boost: boolean; 
        boostEndTime: number; magnetEndTime: number; 
    }>({ magnet: false, shield: false, boost: false, boostEndTime: 0, magnetEndTime: 0 });

    const addCoinsRef = useRef(addCoins);
    const onReportProgressRef = useRef(onReportProgress);

    useEffect(() => { addCoinsRef.current = addCoins; }, [addCoins]);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    useEffect(() => {
        const skin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
        playerRef.current.color = skin.color;
        localStorage.setItem('runner_skin_id', currentSkinId);
    }, [currentSkinId]);

    const generateMission = (level: number, currentDist: number, currentCoins: number): Mission => {
        const type = Math.random() > 0.5 ? 'DISTANCE' : 'COINS';
        const multiplier = 1 + (level * 0.2);
        const target = type === 'DISTANCE' ? Math.floor(500 * multiplier) : Math.floor(20 * multiplier);
        
        return {
            id: Date.now(),
            type,
            target,
            current: type === 'DISTANCE' ? currentDist : currentCoins, 
            reward: Math.floor(50 * multiplier),
            description: type === 'DISTANCE' ? `COURIR ${target}m` : `COLLECTER ${target} PIÈCES`
        };
    };

    const spawnParticles = (x: number, y: number, color: string, count: number, type: 'normal' | 'spark' = 'normal') => {
        for (let i = 0; i < count; i++) {
            const speed = type === 'spark' ? 15 : 8;
            const life = type === 'spark' ? 15 : 30;
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                life: life + Math.random() * 10,
                color: type === 'spark' ? (Math.random() > 0.5 ? '#ffffff' : '#ffff00') : color,
                size: Math.random() * (type === 'spark' ? 3 : 4) + 1,
                type
            });
        }
    };

    const activatePowerUp = (type: PowerUpType) => {
        const duration = 10000;
        const now = Date.now();
        const endTime = now + duration;

        if (type === 'shield') {
            activeEffectsRef.current.shield = true;
            setActivePowerUps(prev => ({ ...prev, shield: 1 }));
        } else if (type === 'magnet') {
            activeEffectsRef.current.magnet = true;
            activeEffectsRef.current.magnetEndTime = endTime;
            setActivePowerUps(prev => ({ ...prev, magnet: endTime }));
        } else if (type === 'boost') {
            activeEffectsRef.current.boost = true;
            activeEffectsRef.current.boostEndTime = endTime;
            setActivePowerUps(prev => ({ ...prev, boost: endTime }));
            shakeRef.current = 5; 
        }
        if (audio.playPowerUpCollect) audio.playPowerUpCollect(type === 'boost' ? 'BALL_FAST' : type === 'shield' ? 'EXTRA_LIFE' : 'MULTI_BALL');
    };

    const switchBiome = () => {
        const currentIdx = BIOMES.findIndex(b => b.id === biomeRef.current.id);
        const nextIdx = (currentIdx + 1) % BIOMES.length;
        biomeRef.current = BIOMES[nextIdx];
        setCurrentBiome(BIOMES[nextIdx]);
        
        const rand = Math.random();
        if (rand < 0.2) {
            const events: EventType[] = ['GOLD_RUSH', 'NIGHT_TERROR', 'HYPER_SPEED'];
            const chosenEvent = events[Math.floor(Math.random() * events.length)];
            eventRef.current = chosenEvent;
            
            let label = "";
            if (chosenEvent === 'GOLD_RUSH') label = "RUÉE VERS L'OR";
            if (chosenEvent === 'NIGHT_TERROR') label = "NUIT NOIRE";
            if (chosenEvent === 'HYPER_SPEED') label = "VITESSE LUMIÈRE";
            
            setActiveEvent({ type: chosenEvent, label });
            setNotification(`ÉVÉNEMENT : ${label}`);
            setTimeout(() => setNotification(null), 3000);
        } else {
            eventRef.current = 'NONE';
            setActiveEvent(null);
            setNotification(`ZONE : ${BIOMES[nextIdx].name}`);
            setTimeout(() => setNotification(null), 2000);
        }
    };

    const handleJump = useCallback(() => {
        if (gameOver || !isPlaying) return;
        const p = playerRef.current;
        if (p.grounded || activeEffectsRef.current.boost) {
            if (p.grounded) {
                p.dy = JUMP_FORCE;
                p.grounded = false;
                audio.playMove(); 
                spawnParticles(p.x + p.width/2, p.y + p.height, '#fff', 5);
            }
        }
    }, [gameOver, isPlaying, audio]);

    const updatePhysics = useCallback(() => {
        if (!isPlaying || gameOver) return;

        frameRef.current++;
        const p = playerRef.current;
        const now = Date.now();

        // Shake Update
        if (shakeRef.current > 0) {
            setShake(shakeRef.current); // Sync to React State for UI if needed, mainly ref used for renderer
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) shakeRef.current = 0;
        }

        // Biome Logic
        if (distanceRef.current > nextBiomeThresholdRef.current) {
            switchBiome();
            nextBiomeThresholdRef.current += BIOME_SWITCH_DISTANCE;
        }

        // PowerUp Expiration
        if (activeEffectsRef.current.boost && now > activeEffectsRef.current.boostEndTime) {
            activeEffectsRef.current.boost = false;
            setActivePowerUps(prev => { const n = {...prev}; delete n.boost; return n; });
        }
        if (activeEffectsRef.current.magnet && now > activeEffectsRef.current.magnetEndTime) {
            activeEffectsRef.current.magnet = false;
            setActivePowerUps(prev => { const n = {...prev}; delete n.magnet; return n; });
        }

        // Player Physics
        p.dy += GRAVITY;
        p.y += p.dy;

        if (p.y + p.height > GROUND_HEIGHT) {
            p.y = GROUND_HEIGHT - p.height;
            p.dy = 0;
            p.grounded = true;
            p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
        } else {
            p.rotation += activeEffectsRef.current.boost ? 0.3 : 0.1;
        }

        let currentSpeed = speedRef.current;
        if (eventRef.current === 'HYPER_SPEED') currentSpeed *= 1.3;
        
        if (activeEffectsRef.current.boost) {
            currentSpeed = Math.min(MAX_SPEED * 1.5, currentSpeed * BOOST_SPEED_MULTIPLIER);
        } else if (frameRef.current % 300 === 0) {
            speedRef.current = Math.min(MAX_SPEED, speedRef.current + 0.2);
        }

        distanceRef.current += currentSpeed / 20;
        setDistance(Math.floor(distanceRef.current));

        // Speed Lines
        if (currentSpeed > 8 || activeEffectsRef.current.boost) {
            if (Math.random() < 0.3) {
                speedLinesRef.current.push({
                    x: CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                    width: Math.random() * 50 + 20,
                    speed: currentSpeed * 1.5
                });
            }
        }
        for (let i = speedLinesRef.current.length - 1; i >= 0; i--) {
            const line = speedLinesRef.current[i];
            line.x -= line.speed;
            if (line.x + line.width < 0) speedLinesRef.current.splice(i, 1);
        }

        // Spawning Logic
        const minGap = (currentSpeed * 40); 
        const lastObstacleX = obstaclesRef.current.length > 0 ? obstaclesRef.current[obstaclesRef.current.length - 1].x : 0;
        const distToLast = CANVAS_WIDTH - lastObstacleX;

        if (obstaclesRef.current.length === 0 || distToLast > minGap + Math.random() * 200) {
            const rand = Math.random();
            if (Math.random() < 0.01) {
                const isDrone = Math.random() > 0.5;
                treasuresRef.current.push({
                    x: CANVAS_WIDTH,
                    y: isDrone ? GROUND_HEIGHT - 120 : GROUND_HEIGHT - 35,
                    width: 30,
                    height: 30,
                    type: isDrone ? 'GOLD_DRONE' : 'CHEST',
                    collected: false,
                    val: isDrone ? 20 : 50
                });
            }
            else if (rand < 0.05) {
                const puTypeRand = Math.random();
                let type: PowerUpType = 'magnet';
                if (puTypeRand > 0.66) type = 'boost';
                else if (puTypeRand > 0.33) type = 'shield';

                powerUpsRef.current.push({
                    x: CANVAS_WIDTH,
                    y: GROUND_HEIGHT - 80 - Math.random() * 100,
                    width: 30,
                    height: 30,
                    type,
                    collected: false,
                    offsetY: Math.random() * Math.PI
                });
                if (audio.playPowerUpSpawn) audio.playPowerUpSpawn();
            } 
            else if (rand < 0.55) {
                const typeRand = Math.random();
                let type: 'block' | 'spike' | 'drone' = 'block';
                let w = 40, h = 40, y = GROUND_HEIGHT - 40;
                if (typeRand > 0.7) {
                    type = 'drone'; w = 30; h = 20; y = GROUND_HEIGHT - 50 - Math.random() * 60; 
                } else if (typeRand > 0.4) {
                    type = 'spike'; w = 30; h = 30; y = GROUND_HEIGHT - 30;
                }
                obstaclesRef.current.push({ x: CANVAS_WIDTH, y, width: w, height: h, type, passed: false });
            }
        }

        const coinChance = eventRef.current === 'GOLD_RUSH' ? 0.08 : 0.03;
        if (Math.random() < coinChance) {
            const lastCoin = coinsRef.current[coinsRef.current.length - 1];
            if (!lastCoin || CANVAS_WIDTH - lastCoin.x > 30) {
                const isGround = Math.random() > 0.6;
                const y = isGround ? GROUND_HEIGHT - 40 : GROUND_HEIGHT - 120;
                const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
                let safe = true;
                if (lastObs && CANVAS_WIDTH - lastObs.x < 60 && Math.abs(y - lastObs.y) < 50) safe = false;
                if (safe) {
                    coinsRef.current.push({ x: CANVAS_WIDTH, y, width: 24, height: 24, collected: false, offsetY: Math.random() * Math.PI });
                }
            }
        }

        // Mission Progress
        if (missionRef.current && !missionRef.current.completed) {
            let progress = 0;
            if (missionRef.current.type === 'DISTANCE') {
                progress = Math.floor(distanceRef.current) - missionRef.current.current;
            } else {
                progress = earnedCoins - (missionRef.current.current || 0); 
            }
            
            const pct = Math.min(100, Math.max(0, (progress / missionRef.current.target) * 100));
            setMissionProgress(pct);

            if (progress >= missionRef.current.target) {
                if (audio.playVictory) audio.playVictory();
                addCoinsRef.current(missionRef.current.reward);
                setEarnedCoins(prev => prev + missionRef.current!.reward);
                setNotification(`MISSION RÉUSSIE ! +${missionRef.current.reward} PIÈCES`);
                setTimeout(() => setNotification(null), 3000);
                missionLevelRef.current++;
                const newMission = generateMission(missionLevelRef.current, Math.floor(distanceRef.current), earnedCoins + missionRef.current.reward);
                missionRef.current = newMission;
                setCurrentMission(newMission);
                setMissionProgress(0);
            }
        }

        // Collision Logic: Obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obs = obstaclesRef.current[i];
            obs.x -= currentSpeed;
            if (obs.x + obs.width < 0) { obstaclesRef.current.splice(i, 1); continue; }
            
            const padding = 6;
            if (
                p.x + padding < obs.x + obs.width - padding &&
                p.x + p.width - padding > obs.x + padding &&
                p.y + padding < obs.y + obs.height - padding &&
                p.y + p.height - padding > obs.y + padding
            ) {
                if (activeEffectsRef.current.boost) {
                    obstaclesRef.current.splice(i, 1);
                    audio.playExplosion();
                    shakeRef.current = 15; 
                    spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#fff', 15, 'spark');
                    distanceRef.current += 10;
                } else if (activeEffectsRef.current.shield) {
                    obstaclesRef.current.splice(i, 1);
                    audio.playExplosion();
                    shakeRef.current = 15;
                    spawnParticles(p.x + p.width/2, p.y + p.height/2, '#00ff00', 20, 'spark');
                    activeEffectsRef.current.shield = false;
                    setActivePowerUps(prev => { const n = {...prev}; delete n.shield; return n; });
                } else {
                    setGameOver(true);
                    setIsPlaying(false);
                    audio.playExplosion();
                    audio.playGameOver();
                    shakeRef.current = 30; 
                    spawnParticles(p.x + p.width/2, p.y + p.height/2, p.color, 40, 'spark');
                    
                    if (onReportProgressRef.current) onReportProgressRef.current('score', Math.floor(distanceRef.current));
                }
            }
        }

        // Collision Logic: Treasures
        for (let i = treasuresRef.current.length - 1; i >= 0; i--) {
            const t = treasuresRef.current[i];
            t.x -= currentSpeed;
            if (t.type === 'GOLD_DRONE') t.y += Math.sin(frameRef.current * 0.1) * 2;
            if (t.x + t.width < 0) { treasuresRef.current.splice(i, 1); continue; }
            if (!t.collected && p.x < t.x + t.width && p.x + p.width > t.x && p.y < t.y + t.height && p.y + p.height > t.y) {
                t.collected = true;
                audio.playVictory(); 
                addCoinsRef.current(t.val);
                setEarnedCoins(prev => prev + t.val);
                setNotification(t.type === 'CHEST' ? "COFFRE TROUVÉ !" : "DRONE DORÉ !");
                setTimeout(() => setNotification(null), 2000);
                spawnParticles(t.x + t.width/2, t.y + t.height/2, '#ffd700', 20, 'spark');
                treasuresRef.current.splice(i, 1);
            }
        }

        // Collision Logic: PowerUps
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            const pu = powerUpsRef.current[i];
            pu.x -= currentSpeed;
            if (pu.x + pu.width < 0) { powerUpsRef.current.splice(i, 1); continue; }
            if (!pu.collected && p.x < pu.x + pu.width && p.x + p.width > pu.x && p.y < pu.y + pu.height && p.y + p.height > pu.y) {
                pu.collected = true;
                activatePowerUp(pu.type);
                powerUpsRef.current.splice(i, 1);
                spawnParticles(pu.x + pu.width/2, pu.y + pu.height/2, '#fff', 10, 'spark');
            }
        }

        // Collision Logic: Coins
        for (let i = coinsRef.current.length - 1; i >= 0; i--) {
            const coin = coinsRef.current[i];
            if (activeEffectsRef.current.magnet && !coin.collected) {
                const dx = (p.x + p.width/2) - (coin.x + coin.width/2);
                const dy = (p.y + p.height/2) - (coin.y + coin.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 300) { 
                    coin.x += (dx / dist) * 15;
                    coin.y += (dy / dist) * 15;
                } else {
                    coin.x -= currentSpeed;
                }
            } else {
                coin.x -= currentSpeed;
            }
            if (coin.x + coin.width < 0) { coinsRef.current.splice(i, 1); continue; }
            if (!coin.collected) {
                if (p.x < coin.x + coin.width && p.x + p.width > coin.x && p.y < coin.y + coin.height && p.y + p.height > coin.y) {
                    coin.collected = true;
                    audio.playCoin();
                    spawnParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#facc15', 8);
                    const coinValue = eventRef.current === 'GOLD_RUSH' ? 2 : 1;
                    setEarnedCoins(prev => prev + coinValue);
                    addCoinsRef.current(coinValue);
                }
            }
            if (coin.collected) coinsRef.current.splice(i, 1);
        }

        // Particles Update
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const part = particlesRef.current[i];
            part.x += part.vx;
            part.y += part.vy;
            part.life--;
            if (part.life <= 0) particlesRef.current.splice(i, 1);
        }

        // Weather Update
        weatherRef.current.forEach(w => {
            w.y += w.speed;
            w.x -= currentSpeed * 0.5; 
            if (w.y > CANVAS_HEIGHT) {
                w.y = -10;
                w.x = Math.random() * CANVAS_WIDTH + (currentSpeed * 50); 
            }
        });

    }, [isPlaying, gameOver, audio]);

    const resetGame = useCallback(() => {
        const skin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
        playerRef.current = { x: 100, y: GROUND_HEIGHT - 40, width: 30, height: 30, dy: 0, grounded: true, color: skin.color, rotation: 0 };
        obstaclesRef.current = [];
        coinsRef.current = [];
        treasuresRef.current = [];
        powerUpsRef.current = [];
        particlesRef.current = [];
        weatherRef.current = [];
        speedLinesRef.current = [];
        speedRef.current = BASE_SPEED;
        distanceRef.current = 0;
        frameRef.current = 0;
        shakeRef.current = 0;
        
        biomeRef.current = BIOMES[0];
        setCurrentBiome(BIOMES[0]);
        eventRef.current = 'NONE';
        setActiveEvent(null);
        nextBiomeThresholdRef.current = BIOME_SWITCH_DISTANCE;
        
        activeEffectsRef.current = { magnet: false, shield: false, boost: false, boostEndTime: 0, magnetEndTime: 0 };
        setActivePowerUps({});

        setDistance(0);
        setGameOver(false);
        setIsPlaying(false);
        setEarnedCoins(0);
        setNotification(null);
        
        missionLevelRef.current = 1;
        const newMission = generateMission(1, 0, 0);
        missionRef.current = newMission;
        setCurrentMission(newMission);
        setMissionProgress(0);
        
        for(let i=0; i<50; i++) {
            weatherRef.current.push({ x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, speed: Math.random() * 2 + 2, size: Math.random() * 2 });
        }

        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
    }, [currentSkinId]);

    return {
        // State
        distance,
        gameOver,
        isPlaying,
        earnedCoins,
        currentBiome,
        activeEvent,
        notification,
        currentMission,
        missionProgress,
        currentSkinId,
        setCurrentSkinId,
        activePowerUps,
        shakeRef, // for renderer to use shake amount

        // Refs (for renderer)
        playerRef,
        obstaclesRef,
        coinsRef,
        treasuresRef,
        powerUpsRef,
        particlesRef,
        weatherRef,
        speedLinesRef,
        frameRef,
        speedRef,
        activeEffectsRef,
        
        // Actions
        resetGame,
        setIsPlaying,
        handleJump,
        updatePhysics
    };
};
