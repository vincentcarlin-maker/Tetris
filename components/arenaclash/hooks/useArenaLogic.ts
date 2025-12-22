
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, MAPS, COLORS, BOT_NAMES, 
    MATCH_DURATION, BULLET_SPEED, RESPAWN_TIME, ARENA_DIFFICULTY_SETTINGS,
    Character, Bullet, PowerUp, Particle, KillEvent, PowerUpType, Difficulty 
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

    // --- REFS (GAME ENTITIES) ---
    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef({ x: 0, y: 0 });
    const shakeRef = useRef(0);
    const recoilRef = useRef<{ [key: string]: number }>({});
    const frameRef = useRef(0);

    // --- REFS (LOGIC UTILS) ---
    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const difficultyRef = useRef<Difficulty>(difficulty);
    const selectedMapIndexRef = useRef(0);
    const lastNetworkUpdateRef = useRef(0);
    const lastTimeRef = useRef(0);
    
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
    useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

    const spawnCharacter = useCallback((id: string, name: string, isPlayer: boolean, isRemote: boolean = false): Character => {
        let x, y, safe;
        const currentDifficulty = difficultyRef.current;
        const diffSettings = ARENA_DIFFICULTY_SETTINGS[currentDifficulty];
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        
        do {
            x = 100 + Math.random() * (CANVAS_WIDTH - 200);
            y = 100 + Math.random() * (CANVAS_HEIGHT - 200);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 60 && x < obs.x + obs.w + 60 && y > obs.y - 60 && y < obs.y + obs.h + 60) safe = false;
            }
        } while (!safe);

        return {
            id, name, x, y, radius: 20,
            color: isPlayer ? COLORS.player : COLORS.enemy,
            hp: isPlayer || isRemote ? 100 : diffSettings.botHp, 
            maxHp: isPlayer || isRemote ? 100 : diffSettings.botHp,
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
    }, []);

    const spawnParticles = (x: number, y: number, color: string, count: number, type: 'spark' | 'smoke' | 'explosion' = 'spark') => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = type === 'explosion' ? Math.random() * 8 + 2 : Math.random() * 3 + 1;
            particlesRef.current.push({
                x, y, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed,
                life: type === 'smoke' ? 40 : 20 + Math.random() * 20, 
                maxLife: 50, 
                color, 
                size: type === 'smoke' ? Math.random() * 6 + 2 : Math.random() * 3 + 1
            });
        }
    };

    const applyPowerUp = (char: Character, type: PowerUpType) => {
        const now = Date.now();
        if (type === 'HEALTH') char.hp = Math.min(char.maxHp, char.hp + 50);
        else if (type === 'SHIELD') char.shield = 50;
        else char.powerups.push({ type, expiry: now + 10000 });
        playPowerUpCollect(type);
    };

    const spawnPowerUp = useCallback(() => {
        if (powerUpsRef.current.length > 8) return;
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

        const types: PowerUpType[] = ['HEALTH', 'SHIELD', 'SPEED', 'DAMAGE'];
        const newPowerUp: PowerUp = {
            id: `pu_${Date.now()}_${Math.random()}`,
            x, y, radius: 15, color: '#fff', type: types[Math.floor(Math.random() * types.length)]
        };
        powerUpsRef.current.push(newPowerUp);
        if (gameMode === 'ONLINE' && mp.isHost) mp.sendData({ type: 'ARENA_POWERUP_SPAWN', powerup: newPowerUp });
    }, [gameMode, mp.isHost]);

    const fireBullet = (char: Character, boosted: boolean) => {
        const damage = boosted ? 25 : 10;
        const speed = BULLET_SPEED;
        const color = boosted ? '#ff00ff' : char.id === (mp.peerId || 'player') ? COLORS.player : COLORS.bullet;
        const barrelLen = 35; 
        
        bulletsRef.current.push({
            id: `b_${Date.now()}_${Math.random()}`,
            x: char.x + Math.cos(char.angle) * barrelLen, y: char.y + Math.sin(char.angle) * barrelLen,
            vx: Math.cos(char.angle) * speed, vy: Math.sin(char.angle) * speed,
            radius: 4, color, ownerId: char.id, damage, life: 2000
        });
        
        char.lastShot = Date.now();
        recoilRef.current[char.id] = 10;
        playLaserShoot();
    };

    const endGame = useCallback(() => {
        setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; playVictory();
        const player = playerRef.current;
        if (player) {
            updateHighScore('arenaclash', player.score);
            if (onReportProgress) onReportProgress('score', player.score);
            const coinMult = gameMode === 'SOLO' ? ARENA_DIFFICULTY_SETTINGS[difficultyRef.current].coinMult : 2.5;
            const coins = Math.floor(player.score * 12 * coinMult) + 100;
            addCoins(coins);
            setEarnedCoins(coins);
        }
    }, [addCoins, updateHighScore, playVictory, onReportProgress, gameMode]);

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE', diffOverride?: Difficulty) => {
        const currentMode = modeOverride || gameMode;
        if (diffOverride) setDifficulty(diffOverride);

        if (currentMode === 'ONLINE' && mp.isHost) mp.sendData({ type: 'ARENA_INIT_MAP', mapIndex: selectedMapIndex });

        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        setScore(0);
        
        if (currentMode === 'SOLO') {
            botsRef.current = Array.from({ length: 6 }, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else {
            botsRef.current = mp.gameOpponent ? [spawnCharacter(mp.gameOpponent.id, mp.gameOpponent.name, false, true)] : [];
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
        audio.resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
        lastTimeRef.current = Date.now();
    }, [spawnCharacter, gameMode, username, mp.peerId, mp.gameOpponent, selectedMapIndex, mp.isHost, onReportProgress, audio]);

    const update = useCallback((dt: number) => {
        const now = Date.now();
        frameRef.current++;
        const player = playerRef.current;
        const currentObstacles = MAPS[selectedMapIndexRef.current].obstacles;
        
        if (!player) return;
        const speedFactor = Math.min(dt, 100) / 16.67;

        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'RESPAWNING') {
            timeLeftRef.current = Math.max(0, timeLeftRef.current - dt / 1000);
            if (Math.floor(timeLeftRef.current) % 10 === 0 && Math.floor(timeLeftRef.current) !== Math.floor(lastTimeRef.current / 1000)) {
                if (gameMode === 'SOLO' || (gameMode === 'ONLINE' && mp.isHost)) spawnPowerUp();
                lastTimeRef.current = timeLeftRef.current * 1000;
            }
            if (timeLeftRef.current <= 0 && gameStateRef.current !== 'GAMEOVER') { endGame(); return; }
        }

        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (recoilRef.current[char.id] > 0) recoilRef.current[char.id] *= Math.pow(0.85, speedFactor);
            
            if (char.isDead) {
                if (char.respawnTimer > 0) {
                    char.respawnTimer -= dt;
                    if (char.respawnTimer <= 0) {
                        const s = char.score;
                        const spawn = spawnCharacter(char.id, char.name, char.id === player.id);
                        Object.assign(char, spawn);
                        char.score = s;
                        if (char.id === player.id) { setGameState('PLAYING'); gameStateRef.current = 'PLAYING'; setScore(s); }
                    }
                }
                return;
            }

            // Power-up pick-up detection
            for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                const pu = powerUpsRef.current[i];
                const dist = Math.hypot(char.x - pu.x, char.y - pu.y);
                if (dist < char.radius + pu.radius) {
                    applyPowerUp(char, pu.type);
                    powerUpsRef.current.splice(i, 1);
                    if (gameMode === 'ONLINE' && mp.isHost) mp.sendData({ type: 'ARENA_POWERUP_COLLECT', id: pu.id });
                }
            }

            char.powerups = char.powerups.filter(p => p.expiry > now);
            const hasSpeed = char.powerups.some(p => p.type === 'SPEED');
            const hasDamage = char.powerups.some(p => p.type === 'DAMAGE');
            const currentSpeed = hasSpeed ? char.speed * 1.5 : char.speed;

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
                    if (frameRef.current % 5 === 0) spawnParticles(char.x - (dx/len)*15, char.y - (dy/len)*15, char.color, 1, 'smoke');
                }
                if (controlsRef.current.aim.active) {
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    if (now - char.lastShot > char.weaponDelay) fireBullet(char, hasDamage);
                } else if (mouseRef.current.down && now - char.lastShot > char.weaponDelay) {
                    fireBullet(char, hasDamage);
                }
            } else if (gameMode === 'SOLO') {
                // Improved Bot AI Movement
                let target = null, minDist = 1500;
                powerUpsRef.current.forEach(pu => { const d = Math.hypot(pu.x-char.x, pu.y-char.y); if(d < minDist) { minDist=d; target=pu; } });
                allChars.forEach(other => { if(other.id !== char.id && !other.isDead) { const d = Math.hypot(other.x-char.x, other.y-char.y); if(d < minDist) { minDist=d; target=other; } } });

                if (target) {
                    const botAngle = Math.atan2(target.y - char.y, target.x - char.x);
                    char.angle = botAngle;
                    // Bots now move if they are further than 40px (just outside their radius)
                    if (minDist > 40) { 
                        char.x += Math.cos(botAngle) * currentSpeed * 0.8 * speedFactor; 
                        char.y += Math.sin(botAngle) * currentSpeed * 0.8 * speedFactor; 
                    }
                    if ((target as any).hp && now - char.lastShot > char.weaponDelay && minDist < 600) fireBullet(char, hasDamage);
                }
            }

            // Wall Collisions
            currentObstacles.forEach(obs => {
                const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dist = Math.hypot(char.x - closestX, char.y - closestY);
                if (dist < char.radius) {
                    const overlap = char.radius - dist;
                    const nx = (char.x - closestX) / (dist || 1);
                    const ny = (char.y - closestY) / (dist || 1);
                    char.x += nx * overlap; char.y += ny * overlap;
                }
            });
            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH-char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT-char.radius, char.y));
        });

        // Bullets & Particles Update
        bulletsRef.current.forEach((b, i) => {
            b.x += b.vx * speedFactor; b.y += b.vy * speedFactor; b.life -= dt;
            if (b.life <= 0) bulletsRef.current.splice(i, 1);
        });
        particlesRef.current.forEach(p => { p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.life -= speedFactor; });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Update Leaderboard
        if (frameRef.current % 30 === 0) {
            const sorted = allChars
                .map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id }))
                .sort((a, b) => b.score - a.score);
            setLeaderboard(sorted);
        }

        setTimeLeft(timeLeftRef.current);
    }, [endGame, gameMode, mp, spawnPowerUp, spawnCharacter, playExplosion, playGameOver, playCoin, playPowerUpCollect, playLaserShoot]);

    return {
        gameState, setGameState, gameMode, setGameMode, difficulty, setDifficulty,
        score, timeLeft, killFeed, leaderboard, earnedCoins, playerRef, botsRef, bulletsRef,
        powerUpsRef, particlesRef, cameraRef, shakeRef, recoilRef,
        startGame, update, keysRef, mouseRef, controlsRef, selectedMapIndex, setSelectedMapIndex,
        onlineStep, setOnlineStep, opponentLeft, setOpponentLeft, isHost: mp.isHost
    };
};
