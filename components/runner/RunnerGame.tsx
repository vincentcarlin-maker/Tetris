
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, Zap, Magnet, Shield, FastForward, Palette, Lock, Check, CloudRain, Snowflake, Sun, TreeDeciduous, Moon, AlertTriangle, Gift, Target } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface RunnerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 350;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const BASE_SPEED = 5;
const MAX_SPEED = 14;
const BOOST_SPEED_MULTIPLIER = 1.8;
const BIOME_SWITCH_DISTANCE = 250; // Meters

// --- BIOMES CONFIG ---
const BIOMES = [
    { id: 'city', name: 'NÉON CITY', color: '#00f3ff', bg: '#000000', sky: 'rgba(0, 243, 255, 0.1)', particle: '#ffffff' },
    { id: 'forest', name: 'CYBER FOREST', color: '#22c55e', bg: '#051a05', sky: 'rgba(34, 197, 94, 0.1)', particle: '#4ade80' },
    { id: 'desert', name: 'SOLAR DUNES', color: '#f97316', bg: '#1a0c00', sky: 'rgba(249, 115, 22, 0.1)', particle: '#fdba74' },
    { id: 'snow', name: 'ICE SECTOR', color: '#22d3ee', bg: '#081c24', sky: 'rgba(34, 211, 238, 0.1)', particle: '#cffafe' },
];

const SKINS = [
    { id: 'default', name: 'Néon Cyan', color: '#00f3ff', cost: 0 },
    { id: 'lime', name: 'Toxic Lime', color: '#ccff00', cost: 250 },
    { id: 'pink', name: 'Hot Pink', color: '#ff00ff', cost: 500 },
    { id: 'orange', name: 'Sunset', color: '#ff4500', cost: 1000 },
    { id: 'white', name: 'Fantôme', color: '#ffffff', cost: 2500 },
    { id: 'gold', name: 'Or Légendaire', color: '#ffd700', cost: 5000 },
];

// --- INTERFACES ---
interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    grounded: boolean;
    color: string;
    rotation: number;
}

interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'block' | 'spike' | 'drone';
    passed: boolean;
}

interface CoinEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    collected: boolean;
    offsetY: number;
}

interface TreasureEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'CHEST' | 'GOLD_DRONE';
    collected: boolean;
    val: number;
}

type PowerUpType = 'magnet' | 'shield' | 'boost';

interface PowerUpEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    type: PowerUpType;
    collected: boolean;
    offsetY: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'spark' | 'normal';
}

interface WeatherParticle {
    x: number;
    y: number;
    speed: number;
    size: number;
}

interface SpeedLine {
    x: number;
    y: number;
    width: number;
    speed: number;
}

interface Mission {
    id: number;
    type: 'DISTANCE' | 'COINS';
    target: number;
    current: number; // Snapshot at start of mission
    reward: number;
    description: string;
}

type EventType = 'NONE' | 'GOLD_RUSH' | 'NIGHT_TERROR' | 'HYPER_SPEED';

export const RunnerGame: React.FC<RunnerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [distance, setDistance] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [currentBiome, setCurrentBiome] = useState(BIOMES[0]);
    const [activeEvent, setActiveEvent] = useState<{ type: EventType, label: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    
    // Mission State
    const [currentMission, setCurrentMission] = useState<Mission | null>(null);
    const [missionProgress, setMissionProgress] = useState(0);

    // Skins State
    const [showSkinShop, setShowSkinShop] = useState(false);
    const [currentSkinId, setCurrentSkinId] = useState<string>(() => localStorage.getItem('runner_skin_id') || 'default');
    const [ownedSkins, setOwnedSkins] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('runner_owned_skins') || '["default"]'); } catch { return ['default']; }
    });
    const [localBalance, setLocalBalance] = useState(() => parseInt(localStorage.getItem('neon-coins') || '0', 10));

    // UI State for Active PowerUps
    const [activePowerUps, setActivePowerUps] = useState<{ [key in PowerUpType]?: number }>({}); 

    const { playMove, playGameOver, playCoin, playExplosion, playPowerUpCollect, playPowerUpSpawn, playVictory, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.runner || 0;

    // Game State Refs
    const playerRef = useRef<Player>({ x: 100, y: GROUND_HEIGHT - 40, width: 30, height: 30, dy: 0, grounded: true, color: '#00f3ff', rotation: 0 });
    const obstaclesRef = useRef<Obstacle[]>([]);
    const coinsRef = useRef<CoinEntity[]>([]);
    const treasuresRef = useRef<TreasureEntity[]>([]);
    const powerUpsRef = useRef<PowerUpEntity[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const weatherRef = useRef<WeatherParticle[]>([]);
    const speedLinesRef = useRef<SpeedLine[]>([]);
    
    const speedRef = useRef(BASE_SPEED);
    const frameRef = useRef(0);
    const distanceRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    const shakeRef = useRef(0);
    
    // Logic Refs
    const biomeRef = useRef(BIOMES[0]);
    const eventRef = useRef<EventType>('NONE');
    const nextBiomeThresholdRef = useRef(BIOME_SWITCH_DISTANCE);
    const missionRef = useRef<Mission | null>(null);
    const missionLevelRef = useRef(1);

    const activeEffectsRef = useRef<{ 
        magnet: boolean; 
        shield: boolean; 
        boost: boolean;
        boostEndTime: number;
        magnetEndTime: number;
    }>({ 
        magnet: false, 
        shield: false, 
        boost: false,
        boostEndTime: 0,
        magnetEndTime: 0
    });

    const addCoinsRef = useRef(addCoins);
    const onReportProgressRef = useRef(onReportProgress);
    
    useEffect(() => { addCoinsRef.current = addCoins; }, [addCoins]);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    // Update player color when skin changes
    useEffect(() => {
        const skin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];
        playerRef.current.color = skin.color;
        localStorage.setItem('runner_skin_id', currentSkinId);
    }, [currentSkinId]);

    const generateMission = (level: number, currentDist: number, currentCoins: number): Mission => {
        const type = Math.random() > 0.5 ? 'DISTANCE' : 'COINS';
        const multiplier = 1 + (level * 0.2);
        
        if (type === 'DISTANCE') {
            const target = Math.floor(500 * multiplier);
            return {
                id: Date.now(),
                type,
                target: target,
                current: currentDist, // Store start point
                reward: Math.floor(50 * multiplier),
                description: `COURIR ${target}m`
            };
        } else {
            const target = Math.floor(20 * multiplier);
            return {
                id: Date.now(),
                type,
                target: target,
                current: currentCoins, // Store start point
                reward: Math.floor(50 * multiplier),
                description: `COLLECTER ${target} PIÈCES`
            };
        }
    };

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
        
        // Reset Biome & Event
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
        setLocalBalance(parseInt(localStorage.getItem('neon-coins') || '0', 10));
        setNotification(null);
        
        // Init Mission
        missionLevelRef.current = 1;
        const newMission = generateMission(1, 0, 0);
        missionRef.current = newMission;
        setCurrentMission(newMission);
        setMissionProgress(0);
        
        if (containerRef.current) containerRef.current.style.transform = 'none';

        // Init Weather
        for(let i=0; i<50; i++) {
            weatherRef.current.push({ x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, speed: Math.random() * 2 + 2, size: Math.random() * 2 });
        }

        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
    }, [currentSkinId]);

    useEffect(() => {
        resetGame();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [resetGame]);

    const handleBuySkin = (skin: typeof SKINS[0]) => {
        if (localBalance >= skin.cost) {
            addCoinsRef.current(-skin.cost); 
            const newBalance = localBalance - skin.cost;
            setLocalBalance(newBalance);
            
            const newOwned = [...ownedSkins, skin.id];
            setOwnedSkins(newOwned);
            localStorage.setItem('runner_owned_skins', JSON.stringify(newOwned));
            setCurrentSkinId(skin.id);
            playCoin();
        }
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
            shakeRef.current = 5; // Small shake on boost activation
        }
        
        if (playPowerUpCollect) playPowerUpCollect(type === 'boost' ? 'BALL_FAST' : type === 'shield' ? 'EXTRA_LIFE' : 'MULTI_BALL');
    };

    const switchBiome = () => {
        const currentIdx = BIOMES.findIndex(b => b.id === biomeRef.current.id);
        const nextIdx = (currentIdx + 1) % BIOMES.length;
        biomeRef.current = BIOMES[nextIdx];
        setCurrentBiome(BIOMES[nextIdx]);
        
        // Random Event Chance (20%)
        const rand = Math.random();
        if (rand < 0.2) {
            const events: EventType[] = ['GOLD_RUSH', 'NIGHT_TERROR', 'HYPER_SPEED'];
            const chosenEvent = events[Math.floor(Math.random() * events.length)];
            eventRef.current = chosenEvent;
            
            let label = "";
            if (chosenEvent === 'GOLD_RUSH') label = "RUÉE VERS L'OR (PIÈCES x2)";
            if (chosenEvent === 'NIGHT_TERROR') label = "NUIT NOIRE (SCORE x2)";
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

    const handleJump = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
        if (e && e.type !== 'keydown') {
            // e.stopPropagation(); 
        }

        if (showSkinShop) return; 
        if (gameOver) return;
        
        if (!isPlaying) {
            setIsPlaying(true);
            resumeAudio();
            return;
        }

        const p = playerRef.current;
        if (p.grounded || activeEffectsRef.current.boost) {
            if (p.grounded) {
                p.dy = JUMP_FORCE;
                p.grounded = false;
                playMove(); 
                spawnParticles(p.x + p.width/2, p.y + p.height, '#fff', 5);
            }
        }
    }, [gameOver, isPlaying, playMove, resumeAudio, showSkinShop]);

    const update = () => {
        if (!isPlaying || gameOver || showSkinShop) return;

        frameRef.current++;
        const p = playerRef.current;
        const now = Date.now();

        // --- SHAKE DECAY ---
        if (shakeRef.current > 0) {
            const dx = (Math.random() - 0.5) * shakeRef.current;
            const dy = (Math.random() - 0.5) * shakeRef.current;
            if (containerRef.current) {
                containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
            shakeRef.current *= 0.9;
            if (shakeRef.current < 0.5) {
                shakeRef.current = 0;
                if (containerRef.current) containerRef.current.style.transform = 'none';
            }
        }

        // --- CHECK BIOME CHANGE ---
        if (distanceRef.current > nextBiomeThresholdRef.current) {
            switchBiome();
            nextBiomeThresholdRef.current += BIOME_SWITCH_DISTANCE;
        }

        // --- CHECK POWERUP EXPIRATION ---
        if (activeEffectsRef.current.boost && now > activeEffectsRef.current.boostEndTime) {
            activeEffectsRef.current.boost = false;
            setActivePowerUps(prev => { const n = {...prev}; delete n.boost; return n; });
        }
        if (activeEffectsRef.current.magnet && now > activeEffectsRef.current.magnetEndTime) {
            activeEffectsRef.current.magnet = false;
            setActivePowerUps(prev => { const n = {...prev}; delete n.magnet; return n; });
        }

        // --- PLAYER PHYSICS ---
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
        
        // Event Speed Modifier
        if (eventRef.current === 'HYPER_SPEED') currentSpeed *= 1.3;
        
        if (activeEffectsRef.current.boost) {
            currentSpeed = Math.min(MAX_SPEED * 1.5, currentSpeed * BOOST_SPEED_MULTIPLIER);
        } else if (frameRef.current % 300 === 0) {
            speedRef.current = Math.min(MAX_SPEED, speedRef.current + 0.2);
        }

        distanceRef.current += currentSpeed / 20;
        setDistance(Math.floor(distanceRef.current));

        // --- SPEED LINES (High Speed FX) ---
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

        // --- SPAWN LOGIC ---
        const minGap = (currentSpeed * 40); 
        const lastObstacleX = obstaclesRef.current.length > 0 ? obstaclesRef.current[obstaclesRef.current.length - 1].x : 0;
        const distToLast = CANVAS_WIDTH - lastObstacleX;

        if (obstaclesRef.current.length === 0 || distToLast > minGap + Math.random() * 200) {
            const rand = Math.random();
            
            // 1. Treasure Chance (Very Rare: 1%)
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
            // 2. PowerUp Chance
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
                if (playPowerUpSpawn) playPowerUpSpawn();
            } 
            // 3. Obstacle Chance
            else if (rand < 0.55) {
                const typeRand = Math.random();
                let type: 'block' | 'spike' | 'drone' = 'block';
                let w = 40, h = 40, y = GROUND_HEIGHT - 40;

                // Adjust frequency based on biome? (Optional)
                if (typeRand > 0.7) {
                    type = 'drone'; w = 30; h = 20; y = GROUND_HEIGHT - 50 - Math.random() * 60; 
                } else if (typeRand > 0.4) {
                    type = 'spike'; w = 30; h = 30; y = GROUND_HEIGHT - 30;
                }
                obstaclesRef.current.push({ x: CANVAS_WIDTH, y, width: w, height: h, type, passed: false });
            }
        }

        // Coin Spawn Rate (Doubled during GOLD_RUSH)
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

        // --- MISSION CHECK ---
        if (missionRef.current && !missionRef.current.completed) {
            let progress = 0;
            if (missionRef.current.type === 'DISTANCE') {
                progress = Math.floor(distanceRef.current) - missionRef.current.current;
            } else {
                // For coin missions, we track earnedCoins in this run
                progress = earnedCoins - missionRef.current.current; 
            }
            
            const pct = Math.min(100, (progress / missionRef.current.target) * 100);
            setMissionProgress(pct);

            if (progress >= missionRef.current.target) {
                // Mission Complete!
                if (playVictory) playVictory();
                addCoinsRef.current(missionRef.current.reward);
                setEarnedCoins(prev => prev + missionRef.current!.reward);
                setNotification(`MISSION RÉUSSIE ! +${missionRef.current.reward} PIÈCES`);
                
                setTimeout(() => setNotification(null), 3000);
                
                // Next Mission
                missionLevelRef.current++;
                // Note: For coin missions, we reset current reference to 0 relative to new start, but here simplified:
                // We just pass current earnedCoins as baseline for next one if type is coins
                const newMission = generateMission(
                    missionLevelRef.current, 
                    Math.floor(distanceRef.current),
                    earnedCoins + missionRef.current.reward // Include reward in total for stability
                );
                missionRef.current = newMission;
                setCurrentMission(newMission);
                setMissionProgress(0);
            }
        }

        // --- UPDATE & COLLISION ---
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obs = obstaclesRef.current[i];
            obs.x -= currentSpeed;

            if (obs.x + obs.width < 0) {
                obstaclesRef.current.splice(i, 1);
                continue;
            }

            const padding = 6;
            if (
                p.x + padding < obs.x + obs.width - padding &&
                p.x + p.width - padding > obs.x + padding &&
                p.y + padding < obs.y + obs.height - padding &&
                p.y + p.height - padding > obs.y + padding
            ) {
                if (activeEffectsRef.current.boost) {
                    obstaclesRef.current.splice(i, 1);
                    playExplosion();
                    shakeRef.current = 15; // Moderate shake
                    spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#fff', 15, 'spark');
                    distanceRef.current += 10;
                    setDistance(Math.floor(distanceRef.current));
                } else if (activeEffectsRef.current.shield) {
                    obstaclesRef.current.splice(i, 1);
                    playExplosion();
                    shakeRef.current = 15;
                    spawnParticles(p.x + p.width/2, p.y + p.height/2, '#00ff00', 20, 'spark');
                    activeEffectsRef.current.shield = false;
                    setActivePowerUps(prev => { const n = {...prev}; delete n.shield; return n; });
                } else {
                    setGameOver(true);
                    playExplosion();
                    playGameOver();
                    shakeRef.current = 30; // Heavy shake
                    spawnParticles(p.x + p.width/2, p.y + p.height/2, p.color, 40, 'spark');
                    
                    // Score calculation
                    let finalDistance = Math.floor(distanceRef.current);
                    updateHighScore('runner', finalDistance);
                    const bonusCoins = Math.floor(finalDistance / 100);
                    if (bonusCoins > 0) {
                        addCoinsRef.current(bonusCoins);
                        setEarnedCoins(prev => prev + bonusCoins);
                    }
                    if (onReportProgressRef.current) onReportProgressRef.current('score', finalDistance);
                }
            }
        }

        // Treasures
        for (let i = treasuresRef.current.length - 1; i >= 0; i--) {
            const t = treasuresRef.current[i];
            t.x -= currentSpeed;
            
            // Movement for Drone
            if (t.type === 'GOLD_DRONE') {
                t.y += Math.sin(frameRef.current * 0.1) * 2;
            }

            if (t.x + t.width < 0) {
                treasuresRef.current.splice(i, 1);
                continue;
            }

            if (!t.collected && p.x < t.x + t.width && p.x + p.width > t.x && p.y < t.y + t.height && p.y + p.height > t.y) {
                t.collected = true;
                playVictory(); // Jackpot sound
                addCoinsRef.current(t.val);
                setEarnedCoins(prev => prev + t.val);
                setNotification(t.type === 'CHEST' ? "COFFRE TROUVÉ !" : "DRONE DORÉ !");
                setTimeout(() => setNotification(null), 2000);
                spawnParticles(t.x + t.width/2, t.y + t.height/2, '#ffd700', 20, 'spark');
                treasuresRef.current.splice(i, 1);
            }
        }

        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            const pu = powerUpsRef.current[i];
            pu.x -= currentSpeed;
            if (pu.x + pu.width < 0) {
                powerUpsRef.current.splice(i, 1);
                continue;
            }
            if (!pu.collected && p.x < pu.x + pu.width && p.x + p.width > pu.x && p.y < pu.y + pu.height && p.y + p.height > pu.y) {
                pu.collected = true;
                activatePowerUp(pu.type);
                powerUpsRef.current.splice(i, 1);
                spawnParticles(pu.x + pu.width/2, pu.y + pu.height/2, '#fff', 10, 'spark');
            }
        }

        // Coin Logic
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

            if (coin.x + coin.width < 0) {
                coinsRef.current.splice(i, 1);
                continue;
            }

            if (!coin.collected) {
                if (p.x < coin.x + coin.width && p.x + p.width > coin.x && p.y < coin.y + coin.height && p.y + p.height > coin.y) {
                    coin.collected = true;
                    playCoin();
                    spawnParticles(coin.x + coin.width/2, coin.y + coin.height/2, '#facc15', 8);
                    
                    const coinValue = eventRef.current === 'GOLD_RUSH' ? 2 : 1;
                    setEarnedCoins(prev => prev + coinValue);
                    addCoinsRef.current(coinValue);
                }
            }
            if (coin.collected) coinsRef.current.splice(i, 1);
        }

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
            w.x -= currentSpeed * 0.5; // Wind effect
            if (w.y > CANVAS_HEIGHT) {
                w.y = -10;
                w.x = Math.random() * CANVAS_WIDTH + (currentSpeed * 50); // Respawn ahead
            }
        });
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const biome = biomeRef.current;
        const isNight = eventRef.current === 'NIGHT_TERROR';
        
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Dynamic Background
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

        // Grid Lines
        ctx.strokeStyle = isNight ? 'rgba(255, 0, 0, 0.1)' : biome.sky;
        ctx.lineWidth = 2;
        const gridOffset = (frameRef.current * (activeEffectsRef.current.boost ? MAX_SPEED * 1.5 : speedRef.current) * 0.5) % 100;
        
        ctx.beginPath();
        for(let i=0; i<CANVAS_HEIGHT; i+=50) { ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); }
        for(let i= -gridOffset; i<CANVAS_WIDTH; i+=100) { ctx.moveTo(i, GROUND_HEIGHT); ctx.lineTo((i - CANVAS_WIDTH/2)*4 + CANVAS_WIDTH/2, CANVAS_HEIGHT); }
        ctx.stroke();

        // Speed Lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        speedLinesRef.current.forEach(line => {
            ctx.fillRect(line.x, line.y, line.width, 2);
        });

        // Weather
        ctx.fillStyle = biome.particle;
        weatherRef.current.forEach(w => {
            ctx.beginPath();
            if (biome.id === 'snow') {
                ctx.arc(w.x, w.y, w.size, 0, Math.PI*2); // Snow
            } else if (biome.id === 'city') {
                ctx.fillRect(w.x, w.y, 1, w.size * 3); // Digital Rain
            } else if (biome.id === 'forest') {
                ctx.arc(w.x, w.y, w.size, 0, Math.PI*2); // Spores
            } else {
                ctx.fillRect(w.x, w.y, w.size, w.size); // Dust
            }
            ctx.fill();
        });

        // Ground
        ctx.strokeStyle = activeEffectsRef.current.boost ? '#ff4500' : biome.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = activeEffectsRef.current.boost ? '#ff4500' : biome.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_HEIGHT);
        ctx.lineTo(CANVAS_WIDTH, GROUND_HEIGHT);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            if (obs.type === 'spike') {
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y + obs.height);
                ctx.lineTo(obs.x + obs.width/2, obs.y);
                ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                ctx.fill();
            } else if (obs.type === 'drone') {
                ctx.fillStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillStyle = '#000';
                ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
            } else {
                ctx.fillStyle = biome.id === 'snow' ? '#a5f3fc' : '#a855f7';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 10;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;
        });

        // TREASURES
        treasuresRef.current.forEach(t => {
            if (t.collected) return;
            const cx = t.x + t.width/2;
            const cy = t.y + t.height/2;
            
            if (t.type === 'CHEST') {
                ctx.fillStyle = '#d97706'; // amber-600
                ctx.fillRect(t.x, t.y, t.width, t.height);
                ctx.strokeStyle = '#fcd34d'; // amber-300
                ctx.lineWidth = 2;
                ctx.strokeRect(t.x, t.y, t.width, t.height);
                // Lid line
                ctx.beginPath(); ctx.moveTo(t.x, t.y + 10); ctx.lineTo(t.x + t.width, t.y + 10); ctx.stroke();
            } else {
                // Gold Drone
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(cx, cy, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Wings
                ctx.fillStyle = '#fff';
                ctx.fillRect(t.x - 5, t.y + 10, 40, 4);
            }
        });

        // PowerUps & Coins (Same as before)
        powerUpsRef.current.forEach(pu => {
            if (pu.collected) return;
            const floatY = Math.sin(frameRef.current * 0.1 + pu.offsetY) * 5;
            const cx = pu.x + pu.width/2;
            const cy = pu.y + pu.height/2 + floatY;
            
            let color = '#fff';
            let label = '?';
            if (pu.type === 'magnet') { color = '#3b82f6'; label = 'M'; }
            if (pu.type === 'shield') { color = '#22c55e'; label = 'S'; }
            if (pu.type === 'boost') { color = '#f97316'; label = 'B'; }

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, cx, cy);
        });

        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const floatY = Math.sin(frameRef.current * 0.1 + coin.offsetY) * 5;
            const cx = coin.x + coin.width/2;
            const cy = coin.y + coin.height/2 + floatY;
            
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', cx, cy + 1);
        });

        // Player
        if (!gameOver) {
            const p = playerRef.current;
            ctx.save();
            ctx.translate(p.x + p.width/2, p.y + p.height/2);
            ctx.rotate(p.rotation);
            
            if (activeEffectsRef.current.boost) {
                ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
                ctx.fillRect(-p.width, -p.height/2, p.width*2, p.height);
            }
            
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-p.width/4, -p.height/4, p.width/2, p.height/2);
            
            if (activeEffectsRef.current.shield) {
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 25, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            if (activeEffectsRef.current.magnet) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 30 + Math.sin(frameRef.current * 0.2) * 5, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / (p.type === 'spark' ? 15 : 30);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    };

    const loop = useCallback(() => {
        update();
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    }, [isPlaying, gameOver, showSkinShop]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault(); 
                handleJump(e);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleJump]);

    const BiomeIcon = currentBiome.id === 'city' ? Zap : currentBiome.id === 'forest' ? TreeDeciduous : currentBiome.id === 'desert' ? Sun : Snowflake;

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4"
            onMouseDown={handleJump}
            onTouchStart={handleJump}
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-black to-transparent pointer-events-none"></div>

            {/* MISSION HUD */}
            {currentMission && !gameOver && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs flex flex-col items-center animate-in slide-in-from-top-4 duration-500 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 mb-1 shadow-lg">
                        <Target size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-white tracking-widest">{currentMission.description}</span>
                    </div>
                    <div className="w-40 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                        <div 
                            className="h-full bg-yellow-400 transition-all duration-300"
                            style={{ width: `${missionProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* NOTIFICATION OVERLAY */}
            {notification && (
                <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in fade-in duration-300">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <span className="text-xl font-black italic text-white tracking-widest whitespace-nowrap">{notification}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)] pr-2 pb-1">NEON RUN</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setShowSkinShop(true); }} className="p-2 bg-gray-800 rounded-lg text-yellow-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Palette size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">DISTANCE</span><span className="text-2xl font-mono font-bold text-white">{Math.floor(distance)} m</span></div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><BiomeIcon size={12} color={currentBiome.color}/> {currentBiome.name}</div>
                    {activeEvent && (
                        <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/50 animate-pulse">
                            <AlertTriangle size={10} className="text-red-400"/>
                            <span className="text-[9px] text-red-100 font-bold">{activeEvent.label}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                        <Coins className="text-yellow-400" size={16} />
                        <span className="text-yellow-100 font-bold font-mono">{earnedCoins}</span>
                    </div>
                </div>
            </div>

            {/* Active PowerUps UI */}
            <div className="w-full max-w-lg flex gap-2 justify-center mb-2 z-10 h-8">
                {activePowerUps.magnet && (
                    <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded border border-blue-500 text-blue-400 text-xs font-bold animate-pulse">
                        <Magnet size={14} /> MAGNET
                    </div>
                )}
                {activePowerUps.shield && (
                    <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded border border-green-500 text-green-400 text-xs font-bold animate-pulse">
                        <Shield size={14} /> BOUCLIER
                    </div>
                )}
                {activePowerUps.boost && (
                    <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded border border-orange-500 text-orange-400 text-xs font-bold animate-pulse">
                        <FastForward size={14} /> BOOST
                    </div>
                )}
            </div>

            {/* Game Container */}
            <div 
                ref={containerRef}
                className="relative w-full max-w-2xl aspect-[2/1] bg-black/80 border-2 border-orange-500/30 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.2)] overflow-hidden backdrop-blur-md z-10 cursor-pointer"
            >
                <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full object-contain"
                />

                {!isPlaying && !gameOver && !showSkinShop && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
                        <Zap size={48} className="text-orange-400 animate-pulse mb-2"/>
                        <p className="text-orange-400 font-bold tracking-widest animate-pulse">APPUYEZ POUR SAUTER</p>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md z-30 animate-in zoom-in fade-in p-6">
                        <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-orange-600 mb-6 italic drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]">CRASH !</h2>
                        
                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/10 mb-6 w-full max-w-[200px] text-center backdrop-blur-sm">
                            <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">DISTANCE FINALE</p>
                            <p className="text-4xl font-mono text-white drop-shadow-md">{Math.floor(distance)} m</p>
                        </div>

                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); resetGame(); }} 
                            className="px-8 py-3 bg-orange-500 text-black font-black tracking-widest text-lg rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2 pointer-events-auto"
                        >
                            <RefreshCw size={20} /> REJOUER
                        </button>
                    </div>
                )}
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">Évitez les obstacles. Courez le plus loin possible.</p>

            {/* SKIN SHOP OVERLAY */}
            {showSkinShop && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border-2 border-yellow-500/50 shadow-2xl p-6 relative flex flex-col" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowSkinShop(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><RefreshCw className="rotate-45" size={24} /></button>
                        
                        <h2 className="text-2xl font-black text-white italic mb-1 flex items-center gap-2"><Palette className="text-yellow-400"/> SKINS</h2>
                        <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm mb-6 bg-black/40 w-fit px-3 py-1 rounded-full border border-yellow-500/20">
                            <Coins size={14} /> Solde: {localBalance}
                        </div>

                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                            {SKINS.map(skin => {
                                const isOwned = ownedSkins.includes(skin.id);
                                const isEquipped = currentSkinId === skin.id;
                                const canAfford = localBalance >= skin.cost;

                                return (
                                    <div key={skin.id} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${isEquipped ? 'border-green-500 bg-green-900/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/10 bg-gray-800/50'}`}>
                                        <div className="w-12 h-12 rounded-lg shadow-lg mb-1" style={{ backgroundColor: skin.color, boxShadow: `0 0 15px ${skin.color}` }}></div>
                                        <div className="text-center w-full">
                                            <p className="font-bold text-xs text-white truncate">{skin.name}</p>
                                            {!isOwned && <p className="text-[10px] text-yellow-400 font-mono flex items-center justify-center gap-1"><Coins size={10}/> {skin.cost}</p>}
                                        </div>
                                        
                                        {isOwned ? (
                                            <button 
                                                onClick={() => setCurrentSkinId(skin.id)}
                                                disabled={isEquipped}
                                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${isEquipped ? 'bg-green-600 text-white cursor-default' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                            >
                                                {isEquipped ? <><Check size={12}/> ÉQUIPÉ</> : 'CHOISIR'}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleBuySkin(skin)}
                                                disabled={!canAfford}
                                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${canAfford ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                            >
                                                {canAfford ? 'ACHETER' : <><Lock size={10}/> BLOQUÉ</>}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <button onClick={() => setShowSkinShop(false)} className="mt-6 w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700">RETOUR AU JEU</button>
                    </div>
                </div>
            )}
        </div>
    );
};
