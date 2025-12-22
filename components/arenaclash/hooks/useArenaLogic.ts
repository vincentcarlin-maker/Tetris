
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
    const { username, currentAvatarId } = useCurrency();
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
            x = 150 + Math.random() * (CANVAS_WIDTH - 300);
            y = 150 + Math.random() * (CANVAS_HEIGHT - 300);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 60 && x < obs.x + obs.w + 60 && y > obs.y - 60 && y < obs.y + obs.h + 60) safe = false;
            }
        } while (!safe);

        return {
            id, name, x, y, radius: 22,
            color: isPlayer ? COLORS.player : COLORS.enemy,
            hp: 100, 
            maxHp: 100,
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

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE', diffOverride?: Difficulty) => {
        const currentMode = modeOverride || gameMode;
        if (diffOverride) setDifficulty(diffOverride);

        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        setScore(0);
        
        if (currentMode === 'SOLO') {
            botsRef.current = Array.from({ length: 6 }, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else if (currentMode === 'ONLINE') {
            // Dans le mode online, on commence sans bots, l'adversaire sera ajouté via les updates ou l'init
            botsRef.current = [];
            if (mp.gameOpponent) {
                botsRef.current = [spawnCharacter(mp.gameOpponent.id, mp.gameOpponent.name, false, true)];
            }
            // Si on est l'hôte, on envoie la config de la map
            if (mp.isHost) {
                mp.sendData({ type: 'ARENA_CONFIG', mapIndex: selectedMapIndexRef.current });
            }
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
    }, [spawnCharacter, gameMode, username, mp, audio, onReportProgress]);

    // MULTIPLAYER SYNC
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'ARENA_CONFIG') {
                setSelectedMapIndex(data.mapIndex);
                selectedMapIndexRef.current = data.mapIndex;
            }
            if (data.type === 'ARENA_UPDATE' && data.player) {
                const remote = data.player;
                if (remote.id === mp.peerId) return;
                
                let existing = botsRef.current.find(b => b.id === remote.id);
                if (!existing) {
                    // Si le bot n'existe pas encore (premier update), on le crée
                    existing = spawnCharacter(remote.id, remote.name || "Adversaire", false, true);
                    botsRef.current.push(existing);
                }
                
                existing.x = remote.x; existing.y = remote.y;
                existing.angle = remote.angle; existing.hp = remote.hp;
                existing.shield = remote.shield; existing.isDead = remote.isDead;
                existing.score = remote.score;
            }
            if (data.type === 'ARENA_SHOOT' && data.id !== mp.peerId) {
                const shooter = botsRef.current.find(b => b.id === data.id);
                if (shooter) {
                    const damage = data.boosted ? 35 : 15;
                    bulletsRef.current.push({
                        id: `b_${data.id}_${Date.now()}`,
                        x: data.x, y: data.y, vx: data.vx, vy: data.vy,
                        radius: 5, color: COLORS.enemy, ownerId: data.id, damage, life: 2500
                    });
                    playLaserShoot();
                }
            }
            if (data.type === 'LEAVE_GAME') setOpponentLeft(true);
        });
        return () => unsubscribe();
    }, [mp, spawnCharacter, playLaserShoot]);

    // Handle network state transitions
    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        
        if (mp.mode === 'lobby') {
            setOnlineStep('lobby');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            if (gameState === 'MENU' || gameState === 'LOBBY') {
                startGame('ONLINE');
            }
        }
    }, [mp.mode, gameMode, gameState, startGame]);

    const update = useCallback((dt: number) => {
        const now = Date.now();
        frameRef.current++;
        const player = playerRef.current;
        if (!player) return;

        const speedFactor = Math.min(dt, 100) / 16.67;
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;

        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'RESPAWNING') {
            timeLeftRef.current = Math.max(0, timeLeftRef.current - dt / 1000);
            if (timeLeftRef.current <= 0) {
                 setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; playVictory();
                 updateHighScore('arenaclash', player.score);
                 const coins = Math.floor(player.score * 15) + 100;
                 addCoins(coins); setEarnedCoins(coins);
                 return;
            }
        }

        // Camera
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
                        const spawn = spawnCharacter(char.id, char.name, char.id === player.id, char.id !== player.id && gameMode === 'ONLINE');
                        Object.assign(char, spawn);
                        char.score = oldScore;
                        if (char.id === player.id) { setGameState('PLAYING'); gameStateRef.current = 'PLAYING'; }
                    }
                }
                return;
            }

            if (char.id === player.id) {
                let dx = 0, dy = 0;
                if (keysRef.current['w'] || keysRef.current['ArrowUp']) dy -= 1;
                if (keysRef.current['s'] || keysRef.current['ArrowDown']) dy += 1;
                if (keysRef.current['a'] || keysRef.current['ArrowLeft']) dx -= 1;
                if (keysRef.current['d'] || keysRef.current['ArrowRight']) dx += 1;
                if (controlsRef.current.move.active) { dx = controlsRef.current.move.x; dy = controlsRef.current.move.y; }
                
                if (dx !== 0 || dy !== 0) {
                    const len = Math.sqrt(dx*dx + dy*dy);
                    char.x += (dx/len) * char.speed * speedFactor;
                    char.y += (dy/len) * char.speed * speedFactor;
                }

                if (controlsRef.current.aim.active) {
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    if (now - char.lastShot > char.weaponDelay) {
                        const barrelLen = 38;
                        const bx = char.x + Math.cos(char.angle) * barrelLen;
                        const by = char.y + Math.sin(char.angle) * barrelLen;
                        const bvx = Math.cos(char.angle) * BULLET_SPEED;
                        const bvy = Math.sin(char.angle) * BULLET_SPEED;
                        
                        bulletsRef.current.push({
                            id: `b_${char.id}_${now}`, x: bx, y: by, vx: bvx, vy: bvy,
                            radius: 5, color: COLORS.player, ownerId: char.id, damage: 15, life: 2500
                        });
                        char.lastShot = now;
                        playLaserShoot();
                        if (gameMode === 'ONLINE') mp.sendData({ type: 'ARENA_SHOOT', id: char.id, x: bx, y: by, vx: bvx, vy: bvy, boosted: false });
                    }
                }
                
                if (gameMode === 'ONLINE' && now - lastNetworkUpdateRef.current > 50) {
                    mp.sendData({ type: 'ARENA_UPDATE', player: { id: char.id, name: char.name, x: char.x, y: char.y, angle: char.angle, hp: char.hp, shield: char.shield, isDead: char.isDead, score: char.score } });
                    lastNetworkUpdateRef.current = now;
                }
            } else if (gameMode === 'SOLO') {
                // IA Battle Royale
                let nearestEnemy = null; let minDist = Infinity;
                allChars.forEach(other => {
                    if (other.id === char.id || other.isDead) return;
                    const d = Math.hypot(other.x - char.x, other.y - char.y);
                    if (d < minDist) { minDist = d; nearestEnemy = other; }
                });
                if (nearestEnemy && minDist < 800) {
                    const angle = Math.atan2(nearestEnemy.y - char.y, nearestEnemy.x - char.x);
                    char.angle = angle;
                    if (minDist > 150) {
                        char.x += Math.cos(angle) * char.speed * 0.7 * speedFactor;
                        char.y += Math.sin(angle) * char.speed * 0.7 * speedFactor;
                    }
                    if (now - char.lastShot > char.weaponDelay) {
                        const barrelLen = 38;
                        bulletsRef.current.push({
                            id: `b_${char.id}_${now}`,
                            x: char.x + Math.cos(char.angle) * barrelLen, y: char.y + Math.sin(char.angle) * barrelLen,
                            vx: Math.cos(char.angle) * BULLET_SPEED, vy: Math.sin(char.angle) * BULLET_SPEED,
                            radius: 5, color: COLORS.enemy, ownerId: char.id, damage: 15, life: 2500
                        });
                        char.lastShot = now;
                        playLaserShoot();
                    }
                }
            }

            // Collisions Obstacles
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

        // Balles
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx * speedFactor; b.y += b.vy * speedFactor; b.life -= dt;
            let hit = false;
            for (const obs of obstacles) { if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) { hit = true; break; } }
            if (!hit) {
                for (const char of allChars) {
                    if (char.id !== b.ownerId && !char.isDead) {
                        if (Math.hypot(b.x - char.x, b.y - char.y) < char.radius + b.radius) {
                            hit = true;
                            // Dégâts
                            char.hp -= b.damage;
                            if (char.hp <= 0) {
                                char.isDead = true; char.respawnTimer = RESPAWN_TIME;
                                const attacker = allChars.find(c => c.id === b.ownerId);
                                if (attacker) attacker.score++;
                                setKillFeed(prev => [{ id: Date.now(), killer: attacker?.name || "??", victim: char.name, time: Date.now() }, ...prev].slice(0, 5));
                                if (char.id === player.id) { setGameState('RESPAWNING'); gameStateRef.current = 'RESPAWNING'; playGameOver(); }
                                else if (attacker?.id === player.id) setScore(attacker.score);
                            }
                            break;
                        }
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        if (frameRef.current % 30 === 0) {
            setLeaderboard(allChars.map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id })).sort((a,b) => b.score - a.score));
        }
        setTimeLeft(timeLeftRef.current);
    }, [addCoins, mp, updateHighScore, spawnCharacter, playVictory, playLaserShoot, playGameOver, gameMode]);

    return {
        gameState, setGameState, gameMode, setGameMode, difficulty, setDifficulty,
        score, timeLeft, killFeed, leaderboard, earnedCoins, playerRef, botsRef, bulletsRef,
        powerUpsRef, particlesRef, cameraRef, shakeRef, recoilRef,
        startGame, update, keysRef, mouseRef, controlsRef, selectedMapIndex, setSelectedMapIndex,
        onlineStep, setOnlineStep, opponentLeft, setOpponentLeft, isHost: mp.isHost
    };
};
