
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, MAPS, COLORS, BOT_NAMES, 
    MATCH_DURATION, BULLET_SPEED, RESPAWN_TIME,
    Character, Bullet, PowerUp, Particle, KillEvent, PowerUpType 
} from '../constants';

export const useArenaLogic = (
    mp: any, 
    audio: any,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { username } = useCurrency();
    const { updateHighScore } = useHighScores();
    const { playLaserShoot, playExplosion, playPowerUpCollect, playVictory, playGameOver, playCoin } = audio;

    // --- STATE ---
    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
    const [gameState, setGameState] = useState<'MENU' | 'LOBBY' | 'PLAYING' | 'RESPAWNING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    // --- REFS (GAME ENTITIES) ---
    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef({ x: 0, y: 0 });
    const shakeRef = useRef(0);

    // --- REFS (LOGIC UTILS) ---
    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const lastUiTimeRef = useRef(MATCH_DURATION);
    const selectedMapIndexRef = useRef(0);
    const lastNetworkUpdateRef = useRef(0);
    const lastTimeRef = useRef(0);
    
    // Inputs Refs
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const controlsRef = useRef({
        move: { x: 0, y: 0, active: false },
        aim: { x: 0, y: 0, active: false }
    });
    const mouseRef = useRef({ x: 0, y: 0, down: false });

    // Sync refs
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { selectedMapIndexRef.current = selectedMapIndex; }, [selectedMapIndex]);

    // --- CONNECTION MANAGEMENT ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (gameState === 'MENU') setGameState('LOBBY');
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (gameState === 'LOBBY') setGameState('MENU');
            if (mp.mode !== 'disconnected') mp.disconnect();
        }
    }, [gameMode]);

    // --- MULTIPLAYER SYNC ---
    useEffect(() => {
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby'); // Force le lobby ici
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (gameState === 'LOBBY') {
                startGame('ONLINE');
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    // --- HELPERS ---
    const spawnCharacter = useCallback((id: string, name: string, isPlayer: boolean, isRemote: boolean = false): Character => {
        let x, y, safe;
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        do {
            x = 50 + Math.random() * (CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 30 && x < obs.x + obs.w + 30 && y > obs.y - 30 && y < obs.y + obs.h + 30) safe = false;
            }
        } while (!safe);

        return {
            id, name, x, y, radius: 20,
            color: isPlayer ? COLORS.player : COLORS.enemy,
            hp: 100, maxHp: 100,
            angle: 0, vx: 0, vy: 0, speed: isPlayer || isRemote ? 5 : 3.5,
            weaponDelay: 150, lastShot: 0,
            isDead: false, respawnTimer: 0,
            score: 0, shield: 0, powerups: [],
            targetId: null
        };
    }, []);

    const spawnParticles = (x: number, y: number, color: string, count: number, explosion = false) => {
        for (let i = 0; i < count; i++) {
            const speed = explosion ? Math.random() * 5 : Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            particlesRef.current.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20, maxLife: 50, color, size: Math.random() * 3 + 1
            });
        }
    };

    const spawnPowerUp = useCallback(() => {
        if (powerUpsRef.current.length > 5) return;
        let x, y, safe;
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        do {
            x = 50 + Math.random() * (CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 20 && x < obs.x + obs.w + 20 && y > obs.y - 20 && y < obs.y + obs.h + 20) safe = false;
            }
        } while (!safe);

        const types: PowerUpType[] = ['HEALTH', 'SHIELD', 'SPEED', 'DAMAGE'];
        const newPowerUp: PowerUp = {
            id: `pu_${Date.now()}_${Math.random()}`,
            x, y, radius: 12, color: '#fff', type: types[Math.floor(Math.random() * types.length)]
        };
        powerUpsRef.current.push(newPowerUp);
        
        if (gameMode === 'ONLINE' && mp.isHost) {
            mp.sendData({ type: 'ARENA_POWERUP_SPAWN', powerup: newPowerUp });
        }
    }, [gameMode, mp.isHost]);

    const fireBullet = (char: Character, boosted: boolean) => {
        const damage = boosted ? 25 : 10;
        const speed = BULLET_SPEED;
        const color = boosted ? '#ff00ff' : char.id === (mp.peerId || 'player') ? COLORS.player : COLORS.bullet;
        const barrelLen = 30; 
        
        bulletsRef.current.push({
            id: `b_${Date.now()}_${Math.random()}`,
            x: char.x + Math.cos(char.angle) * barrelLen, y: char.y + Math.sin(char.angle) * barrelLen,
            vx: Math.cos(char.angle) * speed, vy: Math.sin(char.angle) * speed,
            radius: 4, color, ownerId: char.id, damage, life: 2000
        });
        char.lastShot = Date.now();
        playLaserShoot();
        if (char.id === (mp.peerId || 'player')) shakeRef.current = 3;
    };

    const takeDamage = (char: Character, dmg: number, attackerId: string) => {
        if (char.shield > 0) { char.shield -= dmg; if (char.shield < 0) char.shield = 0; return; }
        char.hp -= dmg;
        if (char.hp <= 0 && !char.isDead) {
            char.isDead = true; char.respawnTimer = RESPAWN_TIME; char.hp = 0;
            playExplosion(); spawnParticles(char.x, char.y, char.color, 30, true);
            
            const attacker = (attackerId === playerRef.current?.id) ? playerRef.current : botsRef.current.find(b => b.id === attackerId);
            if (attacker) {
                attacker.score += 1;
                const killEvent = { id: Date.now(), killer: attacker.name, victim: char.name, time: Date.now() };
                setKillFeed(prev => [killEvent, ...prev].slice(0, 5));
                
                if (gameMode === 'ONLINE') {
                    mp.sendData({ type: 'ARENA_KILL_FEED', killer: attacker.name, victim: char.name });
                    if (char.id === playerRef.current?.id) mp.sendData({ type: 'ARENA_PLAYER_KILLED', killerId: attackerId });
                }
                if (attacker.id === (mp.peerId || 'player')) { playCoin(); shakeRef.current = 10; }
            }
            if (char.id === playerRef.current?.id) { 
                setGameState('RESPAWNING'); gameStateRef.current = 'RESPAWNING'; playGameOver(); 
            }
        }
    };

    const applyPowerUp = (char: Character, type: PowerUpType) => {
        const now = Date.now();
        if (type === 'HEALTH') char.hp = Math.min(char.maxHp, char.hp + 50);
        else if (type === 'SHIELD') char.shield = 50;
        else char.powerups.push({ type, expiry: now + 10000 });
    };

    const endGame = useCallback(() => {
        setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; playVictory();
        const player = playerRef.current;
        if (player) {
            const finalScore = player.score;
            updateHighScore('arenaclash', finalScore);
            if (onReportProgress) onReportProgress('score', finalScore);
            const coins = finalScore * 10 + 50;
            addCoins(coins);
            setEarnedCoins(coins);
        }
    }, [addCoins, updateHighScore, playVictory, onReportProgress]);

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE') => {
        const currentMode = modeOverride || gameMode;
        
        if (currentMode === 'ONLINE' && mp.isHost) {
            mp.sendData({ type: 'ARENA_INIT_MAP', mapIndex: selectedMapIndex });
        }

        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        
        if (currentMode === 'SOLO') {
            botsRef.current = Array.from({ length: 5 }, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else {
            botsRef.current = [];
            if (mp.gameOpponent) {
                const opp = spawnCharacter(mp.gameOpponent.id, mp.gameOpponent.name, false, true);
                botsRef.current.push(opp);
            }
        }
        
        bulletsRef.current = [];
        powerUpsRef.current = [];
        particlesRef.current = [];
        setTimeLeft(MATCH_DURATION);
        timeLeftRef.current = MATCH_DURATION;
        lastUiTimeRef.current = MATCH_DURATION;
        
        setKillFeed([]);
        setGameState('PLAYING');
        gameStateRef.current = 'PLAYING';
        setEarnedCoins(0);
        audio.resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
        lastTimeRef.current = Date.now();
    }, [spawnCharacter, gameMode, username, mp.peerId, mp.gameOpponent, selectedMapIndex, mp.isHost, onReportProgress, audio]);

    // --- PHYSICS UPDATE ---
    const update = useCallback((dt: number) => {
        const now = Date.now();
        const player = playerRef.current;
        const currentObstacles = MAPS[selectedMapIndexRef.current].obstacles;
        
        if (!player) return;
        const limitedDt = Math.min(dt, 100);

        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'RESPAWNING') {
            timeLeftRef.current = Math.max(0, timeLeftRef.current - limitedDt / 1000);
            if (Math.floor(timeLeftRef.current) !== Math.floor(lastUiTimeRef.current)) {
                setTimeLeft(timeLeftRef.current);
                lastUiTimeRef.current = timeLeftRef.current;
                if (gameMode === 'SOLO' || (gameMode === 'ONLINE' && mp.isHost)) {
                    if (Math.random() < 0.3) spawnPowerUp();
                }
            }
            if (timeLeftRef.current <= 0) { endGame(); return; }
        }

        if (gameMode === 'ONLINE' && gameStateRef.current !== 'GAMEOVER') {
            if (now - lastNetworkUpdateRef.current > 40) {
                mp.sendData({ 
                    type: 'ARENA_UPDATE', 
                    timeLeft: mp.isHost ? timeLeftRef.current : undefined,
                    player: {
                        id: player.id, name: player.name, x: player.x, y: player.y, angle: player.angle,
                        hp: player.hp, shield: player.shield, isDead: player.isDead, score: player.score
                    }
                });
                lastNetworkUpdateRef.current = now;
            }
        }

        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (char.isDead) {
                if (char.respawnTimer > 0) {
                    char.respawnTimer -= limitedDt;
                    if (char.respawnTimer <= 0) {
                        if (char.id === player.id || gameMode === 'SOLO') {
                            const spawn = spawnCharacter(char.id, char.name, char.id === player.id);
                            Object.assign(char, spawn);
                            if (char.id === player.id) {
                                setGameState('PLAYING');
                                gameStateRef.current = 'PLAYING';
                            }
                        }
                    }
                }
                return;
            }

            char.powerups = char.powerups.filter(p => p.expiry > now);
            const hasSpeed = char.powerups.some(p => p.type === 'SPEED');
            const hasDamage = char.powerups.some(p => p.type === 'DAMAGE');
            const currentSpeed = hasSpeed ? char.speed * 1.5 : char.speed;

            const isLocal = char.id === player.id;
            const isBot = gameMode === 'SOLO' && char.id !== player.id;

            if (isLocal) {
                let dx = 0, dy = 0;
                if (keysRef.current['w'] || keysRef.current['ArrowUp']) dy -= 1;
                if (keysRef.current['s'] || keysRef.current['ArrowDown']) dy += 1;
                if (keysRef.current['a'] || keysRef.current['ArrowLeft']) dx -= 1;
                if (keysRef.current['d'] || keysRef.current['ArrowRight']) dx += 1;
                if (controlsRef.current.move.active) { dx = controlsRef.current.move.x; dy = controlsRef.current.move.y; }
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len > 1) { dx /= len; dy /= len; }

                char.x += dx * currentSpeed;
                char.y += dy * currentSpeed;

                if (controlsRef.current.aim.active) {
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    if (now - char.lastShot > char.weaponDelay) {
                        fireBullet(char, hasDamage);
                        if (gameMode === 'ONLINE') mp.sendData({ type: 'ARENA_SHOOT', id: char.id, boosted: hasDamage });
                    }
                } else if (!controlsRef.current.move.active) {
                    const worldMouseX = mouseRef.current.x + cameraRef.current.x;
                    const worldMouseY = mouseRef.current.y + cameraRef.current.y;
                    char.angle = Math.atan2(worldMouseY - char.y, worldMouseX - char.x);
                    if (mouseRef.current.down && now - char.lastShot > char.weaponDelay) {
                        fireBullet(char, hasDamage);
                        if (gameMode === 'ONLINE') mp.sendData({ type: 'ARENA_SHOOT', id: char.id, boosted: hasDamage });
                    }
                }
            } else if (isBot) {
                let target: {x: number, y: number} | null = null;
                let minDist = 600;
                powerUpsRef.current.forEach(pu => {
                    const dist = Math.hypot(pu.x - char.x, pu.y - char.y);
                    if (dist < minDist) { minDist = dist; target = pu; }
                });
                allChars.forEach(other => {
                    if (other.id !== char.id && !other.isDead) {
                        const dist = Math.hypot(other.x - char.x, other.y - char.y);
                        if (dist < minDist) { minDist = dist; target = other; char.targetId = other.id; }
                    }
                });

                if (target) {
                    const angle = Math.atan2(target.y - char.y, target.x - char.x);
                    char.angle = angle;
                    const stopDist = (target as any).hp ? 200 : 0;
                    if (minDist > stopDist) { char.x += Math.cos(angle) * currentSpeed * 0.8; char.y += Math.sin(angle) * currentSpeed * 0.8; }
                    else if (minDist < stopDist - 50) { char.x -= Math.cos(angle) * currentSpeed * 0.5; char.y -= Math.sin(angle) * currentSpeed * 0.5; }
                    if ((target as any).hp && now - char.lastShot > char.weaponDelay * 1.5) fireBullet(char, hasDamage);
                } else {
                    const angle = Math.atan2(CANVAS_HEIGHT/2 - char.y, CANVAS_WIDTH/2 - char.x);
                    char.x += Math.cos(angle) * currentSpeed * 0.5; char.y += Math.sin(angle) * currentSpeed * 0.5;
                }
            }

            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH - char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT - char.radius, char.y));
            
            currentObstacles.forEach(obs => {
                const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dx = char.x - closestX;
                const dy = char.y - closestY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < char.radius) {
                    const overlap = char.radius - dist;
                    const nx = dx / (dist || 0.001); const ny = dy / (dist || 0.001);
                    char.x += nx * overlap; char.y += ny * overlap;
                }
            });

            if (isLocal || isBot) {
                for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                    const pu = powerUpsRef.current[i];
                    if (Math.hypot(char.x - pu.x, char.y - pu.y) < char.radius + pu.radius) {
                        playPowerUpCollect(pu.type === 'HEALTH' ? 'EXTRA_LIFE' : 'PADDLE_GROW');
                        applyPowerUp(char, pu.type);
                        if (gameMode === 'ONLINE') mp.sendData({ type: 'ARENA_POWERUP_COLLECT', powerupId: pu.id });
                        powerUpsRef.current.splice(i, 1);
                    }
                }
            }
        });

        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx; b.y += b.vy; b.life -= limitedDt;
            let hit = false;
            if (b.x < 0 || b.x > CANVAS_WIDTH || b.y < 0 || b.y > CANVAS_HEIGHT) hit = true;
            if (!hit) {
                for (const obs of currentObstacles) {
                    if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                        hit = true; spawnParticles(b.x, b.y, b.color, 3); break;
                    }
                }
            }
            if (!hit) {
                for (const char of allChars) {
                    if (char.id !== b.ownerId && !char.isDead) {
                        if (Math.hypot(b.x - char.x, b.y - char.y) < char.radius + b.radius) {
                            hit = true; 
                            spawnParticles(b.x, b.y, char.color, 5); 
                            if (char.id === player.id || gameMode === 'SOLO') takeDamage(char, b.damage, b.ownerId);
                            break;
                        }
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

        if (player && !player.isDead) {
            cameraRef.current.x += (player.x - 400 - cameraRef.current.x) * 0.1;
            cameraRef.current.y += (player.y - 300 - cameraRef.current.y) * 0.1;
            if (shakeRef.current > 0) {
                cameraRef.current.x += (Math.random() - 0.5) * shakeRef.current;
                cameraRef.current.y += (Math.random() - 0.5) * shakeRef.current;
                shakeRef.current *= 0.9;
                if (shakeRef.current < 0.5) shakeRef.current = 0;
            }
            cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - 800, cameraRef.current.x));
            cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - 600, cameraRef.current.y));
        }

        const sorted = [...allChars].sort((a, b) => b.score - a.score);
        setLeaderboard(sorted.map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id })));
    }, [endGame, gameMode, mp, spawnPowerUp, spawnCharacter, playExplosion, playGameOver, playCoin, playPowerUpCollect, playLaserShoot, selectedMapIndexRef]);

    return {
        gameState, setGameState,
        gameMode, setGameMode,
        score: playerRef.current?.score || 0,
        timeLeft,
        killFeed,
        leaderboard,
        earnedCoins,
        playerRef,
        botsRef,
        bulletsRef,
        powerUpsRef,
        particlesRef,
        cameraRef,
        startGame,
        update,
        keysRef,
        mouseRef,
        controlsRef,
        selectedMapIndex, setSelectedMapIndex,
        onlineStep, setOnlineStep,
        opponentLeft, setOpponentLeft,
        isHost: mp.isHost
    };
};
