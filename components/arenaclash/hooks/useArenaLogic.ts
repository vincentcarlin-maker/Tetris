
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAPS, COLORS, BOT_NAMES, 
    MATCH_DURATION, BULLET_SPEED, RESPAWN_TIME, ARENA_DIFFICULTY_SETTINGS,
    Character, Bullet, PowerUp, Particle, KillEvent, PowerUpType, Difficulty 
} from '../constants';

export const useArenaLogic = (
    mp: any, 
    audio: any,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { username, currentTankId, tanksCatalog, currentTankAccessoryId, tankAccessoriesCatalog } = useCurrency();
    const { updateHighScore } = useHighScores();
    const { playLaserShoot, playExplosion, playPowerUpCollect, playVictory, playGameOver, playCoin } = audio;

    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
    const [gameState, setGameState] = useState<'MENU' | 'LOBBY' | 'DIFFICULTY' | 'PLAYING' | 'RESPAWNING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [score, setScore] = useState(0);

    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef({ x: 0, y: 0 });
    const shakeRef = useRef(0);
    const recoilRef = useRef<{ [key: string]: number }>({});
    const frameRef = useRef(0);
    const lastPowerUpSpawnRef = useRef(0);

    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const difficultyRef = useRef<Difficulty>(difficulty);
    const selectedMapIndexRef = useRef(0);
    const lastNetworkUpdateRef = useRef(0);
    
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const controlsRef = useRef({
        move: { x: 0, y: 0, active: false },
        aim: { x: 0, y: 0, active: false }
    });
    const mouseRef = useRef({ x: 0, y: 0, down: false });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { selectedMapIndexRef.current = selectedMapIndex; }, [selectedMapIndex]);
    useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

    // Live update of character skin/accessory when changed in shop/locker
    useEffect(() => {
        if (playerRef.current) {
            const skin = tanksCatalog.find(t => t.id === currentTankId);
            const acc = tankAccessoriesCatalog.find(a => a.id === currentTankAccessoryId);
            if (skin) playerRef.current.skin = skin;
            if (acc) playerRef.current.accessory = acc;
        }
    }, [currentTankId, currentTankAccessoryId, tanksCatalog, tankAccessoriesCatalog]);

    const spawnCharacter = useCallback((id: string, name: string, isPlayer: boolean, isRemote: boolean = false, remoteSkin?: any, remoteAcc?: any): Character => {
        let x, y, safe;
        const currentDifficulty = difficultyRef.current;
        const diffSettings = ARENA_DIFFICULTY_SETTINGS[currentDifficulty];
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        
        do {
            x = 150 + Math.random() * (CANVAS_WIDTH - 300);
            y = 150 + Math.random() * (CANVAS_HEIGHT - 300);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 60 && x < obs.x + obs.w + 60 && y > obs.y - 60 && y < obs.y + obs.h + 60) safe = false;
            }
        } while (!safe);

        const playerSkin = tanksCatalog.find(t => t.id === currentTankId) || tanksCatalog[0];
        const playerAcc = tankAccessoriesCatalog.find(a => a.id === currentTankAccessoryId) || tankAccessoriesCatalog[0];

        return {
            id, name, x, y, radius: 22,
            color: isPlayer ? playerSkin.primaryColor : COLORS.enemy,
            skin: isPlayer ? playerSkin : (isRemote ? remoteSkin : undefined),
            accessory: isPlayer ? playerAcc : (isRemote ? remoteAcc : undefined),
            hp: 100, maxHp: 100,
            angle: 0, vx: 0, vy: 0, 
            speed: isPlayer || isRemote ? 5 : diffSettings.botSpeed,
            weaponDelay: isPlayer || isRemote ? 180 : diffSettings.botWeaponDelay, 
            lastShot: 0,
            isDead: false, respawnTimer: 0,
            score: 0, 
            shield: isPlayer || isRemote ? 0 : diffSettings.botShield,
            powerups: [],
            targetId: null
        };
    }, [currentTankId, tanksCatalog, currentTankAccessoryId, tankAccessoriesCatalog]);

    const spawnParticles = (x: number, y: number, color: string, count: number, type: 'spark' | 'smoke' | 'explosion' = 'spark') => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = type === 'explosion' ? Math.random() * 8 + 2 : Math.random() * 4 + 1;
            particlesRef.current.push({
                x, y, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed,
                life: type === 'smoke' ? 40 : 25 + Math.random() * 20, 
                maxLife: 50, 
                color, 
                size: type === 'smoke' ? Math.random() * 6 + 2 : Math.random() * 4 + 1
            });
        }
    };

    const fireBullet = (char: Character, angleOffset: number = 0) => {
        const speed = BULLET_SPEED;
        const angle = char.angle + angleOffset;
        const barrelLen = 38; 
        
        bulletsRef.current.push({
            id: `b_${char.id}_${Date.now()}_${Math.random()}`,
            x: char.x + Math.cos(angle) * barrelLen, 
            y: char.y + Math.sin(angle) * barrelLen,
            vx: Math.cos(angle) * speed, 
            vy: Math.sin(angle) * speed,
            radius: 5, 
            color: char.id === (mp.peerId || 'player') ? (char.skin?.glowColor || COLORS.player) : COLORS.enemy, 
            ownerId: char.id, 
            damage: 15, 
            life: 2500
        });
        
        char.lastShot = Date.now();
        recoilRef.current[char.id] = 12;
        playLaserShoot();
    };

    const handleShoot = (char: Character) => {
        const now = Date.now();
        const delay = char.powerups.some(p => p.type === 'BOOST') ? char.weaponDelay / 2 : char.weaponDelay;
        if (now - char.lastShot < delay) return;

        if (char.powerups.some(p => p.type === 'TRIPLE')) {
            fireBullet(char, -0.2);
            fireBullet(char, 0);
            fireBullet(char, 0.2);
        } else {
            fireBullet(char, 0);
        }
        
        if (char.id === mp.peerId && gameMode === 'ONLINE') {
            mp.sendData({ type: 'ARENA_SHOOT', id: char.id, angle: char.angle });
        }
    };

    const spawnPowerUp = useCallback(() => {
        const types: PowerUpType[] = ['HEALTH', 'SHIELD', 'TRIPLE', 'BOOST'];
        const type = types[Math.floor(Math.random() * types.length)];
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        let x, y, safe;
        let attempts = 0;
        do {
            attempts++;
            x = 100 + Math.random() * (CANVAS_WIDTH - 200);
            y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 20 && x < obs.x + obs.w + 20 && y > obs.y - 20 && y < obs.y + obs.h + 20) safe = false;
            }
        } while(!safe && attempts < 50);

        const newPowerUp = {
            id: `pw_${Date.now()}_${Math.random()}`, x, y, radius: 18, type, color: COLORS.powerup[type]
        };
        powerUpsRef.current.push(newPowerUp);
        return newPowerUp;
    }, []);

    // MULTIPLAYER SYNC
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'ARENA_UPDATE' && data.player) {
                const remote = data.player;
                if (remote.id === mp.peerId) return;
                let existing = botsRef.current.find(b => b.id === remote.id);
                if (!existing) {
                    existing = spawnCharacter(remote.id, remote.name || "Adversaire", false, true, remote.skin, remote.accessory);
                    botsRef.current.push(existing);
                }
                existing.x = remote.x; existing.y = remote.y;
                existing.angle = remote.angle; existing.hp = remote.hp;
                existing.shield = remote.shield; existing.isDead = remote.isDead;
                existing.score = remote.score;
                if (remote.skin) existing.skin = remote.skin;
                if (remote.accessory) existing.accessory = remote.accessory;
            }
            if (data.type === 'ARENA_SHOOT' && data.id !== mp.peerId) {
                const shooter = botsRef.current.find(b => b.id === data.id);
                if (shooter) {
                    shooter.angle = data.angle;
                    handleShoot(shooter);
                }
            }
            if (data.type === 'ARENA_POWERUP_SPAWN') {
                powerUpsRef.current.push(data.powerup);
            }
            if (data.type === 'LEAVE_GAME') setOpponentLeft(true);
        });
        return () => unsubscribe();
    }, [mp, spawnCharacter]);

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE', diffOverride?: Difficulty) => {
        const currentMode = modeOverride || gameMode;
        if (diffOverride) {
            setDifficulty(diffOverride);
            difficultyRef.current = diffOverride;
        }

        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        setScore(0);
        
        if (currentMode === 'SOLO') {
            botsRef.current = Array.from({ length: 6 }, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else {
            botsRef.current = [];
        }
        
        bulletsRef.current = [];
        powerUpsRef.current = [];
        particlesRef.current = [];
        recoilRef.current = {};
        setTimeLeft(MATCH_DURATION);
        timeLeftRef.current = MATCH_DURATION;
        setKillFeed([]);
        setGameState('PLAYING');
        gameStateRef.current = 'PLAYING';
        setEarnedCoins(0);
        
        // Spawn immédiat d'un bonus au début
        lastPowerUpSpawnRef.current = Date.now() - 3000; 
        
        audio.resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [spawnCharacter, gameMode, username, mp, audio, onReportProgress]);

    const update = useCallback((dt: number) => {
        if (gameStateRef.current === 'GAMEOVER' || gameStateRef.current === 'MENU') return;

        const now = Date.now();
        frameRef.current++;
        const player = playerRef.current;
        if (!player) return;

        const speedFactor = Math.min(dt, 100) / 16.67;
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;

        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'RESPAWNING') {
            timeLeftRef.current = Math.max(0, timeLeftRef.current - dt / 1000);
            if (timeLeftRef.current <= 0) {
                 setGameState('GAMEOVER'); 
                 gameStateRef.current = 'GAMEOVER'; 
                 playVictory();
                 updateHighScore('arenaclash', player.score);
                 const coins = Math.floor(player.score * 15) + 100;
                 addCoins(coins); setEarnedCoins(coins);
                 return;
            }
            
            // Spawn PowerUps toutes les 7 secondes
            if (now - lastPowerUpSpawnRef.current > 7000 && (gameMode === 'SOLO' || mp.isHost)) {
                const pw = spawnPowerUp();
                lastPowerUpSpawnRef.current = now;
                if (gameMode === 'ONLINE') {
                    mp.sendData({ type: 'ARENA_POWERUP_SPAWN', powerup: pw });
                }
            }
        }

        // Camera follow
        cameraRef.current.x = player.x - VIEWPORT_WIDTH / 2;
        cameraRef.current.y = player.y - VIEWPORT_HEIGHT / 2;
        cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, cameraRef.current.x));
        cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, cameraRef.current.y));

        if (shakeRef.current > 0) {
            cameraRef.current.x += (Math.random() - 0.5) * shakeRef.current;
            cameraRef.current.y += (Math.random() - 0.5) * shakeRef.current;
            shakeRef.current *= 0.9;
        }

        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (recoilRef.current[char.id] > 0) recoilRef.current[char.id] *= Math.pow(0.85, speedFactor);
            if (char.isDead) {
                if (char.respawnTimer > 0) {
                    char.respawnTimer -= dt;
                    if (char.respawnTimer <= 0) {
                        const oldScore = char.score;
                        const spawn = spawnCharacter(char.id, char.name, char.id === player.id);
                        Object.assign(char, spawn);
                        char.score = oldScore;
                        if (char.id === player.id) { 
                            setGameState('PLAYING'); 
                            gameStateRef.current = 'PLAYING'; 
                        }
                    }
                }
                return;
            }

            char.powerups = char.powerups.filter(p => p.expiry > now);
            const currentSpeed = char.powerups.some(p => p.type === 'BOOST') ? char.speed * 1.5 : char.speed;

            if (char.id === player.id) {
                let dx = 0, dy = 0;
                if (keysRef.current['w'] || keysRef.current['ArrowUp']) dy -= 1;
                if (keysRef.current['s'] || keysRef.current['ArrowDown']) dy += 1;
                if (keysRef.current['a'] || keysRef.current['ArrowLeft']) dx -= 1;
                if (keysRef.current['d'] || keysRef.current['ArrowRight']) dx += 1;
                if (controlsRef.current.move.active) { dx = controlsRef.current.move.x; dy = controlsRef.current.move.y; }
                
                if (dx !== 0 || dy !== 0) {
                    const len = Math.sqrt(dx*dx + dy*dy);
                    char.x += (dx/len) * currentSpeed * speedFactor;
                    char.y += (dy/len) * currentSpeed * speedFactor;
                }

                if (controlsRef.current.aim.active) {
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    handleShoot(char);
                } else if (mouseRef.current.down) {
                    handleShoot(char);
                }
                
                if (gameMode === 'ONLINE' && now - lastNetworkUpdateRef.current > 50) {
                    mp.sendData({ type: 'ARENA_UPDATE', player: { id: char.id, x: char.x, y: char.y, angle: char.angle, hp: char.hp, shield: char.shield, isDead: char.isDead, score: char.score, skin: char.skin, accessory: char.accessory } });
                    lastNetworkUpdateRef.current = now;
                }
            } else if (gameMode === 'SOLO') {
                // IA 
                let nearest = null; let minDist = Infinity;
                allChars.forEach(other => {
                    if (other.id === char.id || other.isDead) return;
                    const d = Math.hypot(other.x - char.x, other.y - char.y);
                    if (d < minDist) { minDist = d; nearest = other; }
                });

                if (nearest && minDist < 600) {
                    const angle = Math.atan2(nearest.y - char.y, nearest.x - char.x);
                    char.angle = angle;
                    if (minDist > 180) {
                        char.x += Math.cos(angle) * currentSpeed * 0.7 * speedFactor;
                        char.y += Math.sin(angle) * currentSpeed * 0.7 * speedFactor;
                    }
                    handleShoot(char);
                }
            }

            // PowerUp Collection
            for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                const pw = powerUpsRef.current[i];
                if (Math.hypot(char.x - pw.x, char.y - pw.y) < char.radius + pw.radius) {
                    if (pw.type === 'HEALTH') char.hp = Math.min(char.maxHp, char.hp + 40);
                    else if (pw.type === 'SHIELD') char.shield = 50;
                    else char.powerups.push({ type: pw.type, expiry: now + 10000 });
                    
                    playPowerUpCollect();
                    powerUpsRef.current.splice(i, 1);
                }
            }

            // Wall Collisions
            obstacles.forEach(obs => {
                const cx = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const cy = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const d = Math.hypot(char.x - cx, char.y - cy);
                if (d < char.radius) {
                    const overlap = char.radius - d;
                    const nx = (char.x - cx) / (d || 1);
                    const ny = (char.y - cy) / (d || 1);
                    char.x += nx * overlap; char.y += ny * overlap;
                }
            });
            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH-char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT-char.radius, char.y));
        });

        // project collision
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx * speedFactor; b.y += b.vy * speedFactor; b.life -= dt;
            let hit = false;
            
            for (const obs of obstacles) {
                if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) { hit = true; break; }
            }
            
            if (!hit) {
                for (const char of allChars) {
                    if (char.id !== b.ownerId && !char.isDead) {
                        if (Math.hypot(b.x - char.x, b.y - char.y) < char.radius + b.radius) {
                            hit = true;
                            // Take Damage
                            const dmg = b.damage;
                            if (char.shield > 0) {
                                char.shield -= dmg;
                                if (char.shield < 0) char.shield = 0;
                            } else {
                                char.hp -= dmg;
                            }
                            
                            if (char.hp <= 0) {
                                char.isDead = true; char.respawnTimer = RESPAWN_TIME; char.hp = 0;
                                playExplosion(); spawnParticles(char.x, char.y, char.color, 50, 'explosion');
                                const attacker = allChars.find(c => c.id === b.ownerId);
                                if (attacker) {
                                    attacker.score++;
                                    if (attacker.id === player.id) setScore(attacker.score);
                                    setKillFeed(prev => [{ id: Date.now(), killer: attacker.name, victim: char.name, time: now }, ...prev].slice(0, 5));
                                }
                                if (char.id === player.id) { 
                                    setGameState('RESPAWNING'); 
                                    gameStateRef.current = 'RESPAWNING'; 
                                    playGameOver(); 
                                }
                            }
                            break;
                        }
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        particlesRef.current.forEach(p => { p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.life -= speedFactor; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        
        if (frameRef.current % 30 === 0) {
            setLeaderboard(allChars.map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id })).sort((a,b) => b.score - a.score));
        }

        setTimeLeft(timeLeftRef.current);
    }, [addCoins, mp, updateHighScore, spawnCharacter, playVictory, spawnPowerUp, playExplosion, playGameOver, playPowerUpCollect]);

    // GESTION DU LOBBY ONLINE
    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        
        if (mp.mode === 'lobby') {
            setOnlineStep(isHosting ? 'game' : 'lobby');
            if (gameState !== 'LOBBY' && gameState !== 'MENU') setGameState('LOBBY');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (gameState !== 'PLAYING') startGame('ONLINE');
        }
    }, [mp.mode, mp.isHost, mp.players, gameMode]);

    return {
        gameState, setGameState, gameMode, setGameMode, difficulty, setDifficulty,
        score, timeLeft, killFeed, leaderboard, earnedCoins, playerRef, botsRef, bulletsRef,
        powerUpsRef, particlesRef, cameraRef, shakeRef, recoilRef,
        startGame, update, keysRef, mouseRef, controlsRef, selectedMapIndex, setSelectedMapIndex,
        onlineStep, setOnlineStep, opponentLeft, setOpponentLeft, isHost: mp.isHost
    };
};
