
import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAPS, COLORS, BOT_NAMES, 
    MATCH_DURATION, BULLET_SPEED, RESPAWN_TIME, ARENA_DIFFICULTY_SETTINGS,
    Character, Bullet, PowerUp, Particle, KillEvent, Difficulty 
} from '../constants';

export const useArenaLogic = (
    mp: any, 
    audio: any,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { username, currentTankId, tanksCatalog, currentTankAccessoryId, tankAccessoriesCatalog } = useCurrency();
    const { updateHighScore } = useHighScores();
    const { playLaserShoot, playExplosion, playVictory, playCoin } = audio;

    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
    const [gameState, setGameState] = useState<'MENU' | 'LOBBY' | 'DIFFICULTY' | 'PLAYING' | 'RESPAWNING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');

    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef({ x: 0, y: 0 });
    const recoilRef = useRef<{ [key: string]: number }>({});
    const frameRef = useRef(0);
    const shakeRef = useRef(0);
    const lastPowerUpSpawnRef = useRef(0);
    const empActiveUntilRef = useRef(0);

    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const difficultyRef = useRef<Difficulty>(difficulty);
    const selectedMapIndexRef = useRef(0);
    
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

    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, gameMode]);

    const spawnCharacter = useCallback((id: string, name: string, isPlayer: boolean): Character => {
        const obstacles = MAPS[selectedMapIndexRef.current].obstacles;
        let x, y, safe;
        do {
            x = 250 + Math.random() * (CANVAS_WIDTH - 500);
            y = 250 + Math.random() * (CANVAS_HEIGHT - 500);
            safe = true;
            for (const obs of obstacles) {
                if (x > obs.x - 60 && x < obs.x + obs.w + 60 && y > obs.y - 60 && y < obs.y + obs.h + 60) safe = false;
            }
        } while (!safe);

        const skin = tanksCatalog.find(t => t.id === currentTankId) || tanksCatalog[0];
        const acc = tankAccessoriesCatalog.find(a => a.id === currentTankAccessoryId) || tankAccessoriesCatalog[0];
        const diffS = ARENA_DIFFICULTY_SETTINGS[difficultyRef.current];

        return {
            id, name, x, y, radius: 22,
            color: isPlayer ? skin.primaryColor : COLORS.enemy,
            skin: isPlayer ? skin : undefined,
            accessory: isPlayer ? acc : undefined,
            hp: isPlayer ? 100 : diffS.botHp, maxHp: isPlayer ? 100 : diffS.botHp,
            angle: 0, vx: 0, vy: 0, 
            speed: isPlayer ? 6.0 : diffS.botSpeed,
            weaponDelay: isPlayer ? 200 : diffS.botWeaponDelay, 
            lastShot: 0,
            isDead: false, respawnTimer: 0,
            score: 0, 
            shield: isPlayer ? 0 : diffS.botShield,
            powerups: [],
            targetId: null
        };
    }, [currentTankId, tanksCatalog, currentTankAccessoryId, tankAccessoriesCatalog]);

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            particlesRef.current.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 500 + Math.random() * 500, maxLife: 1000, color, size: Math.random() * 3 + 1
            });
        }
    };

    const spawnExplosion = (x: number, y: number, color: string) => {
        const count = 45;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 2;
            const pColor = i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? '#ffaa00' : color);
            particlesRef.current.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 800 + Math.random() * 700, maxLife: 1500, color: pColor, size: Math.random() * 6 + 2
            });
        }
    };

    const spawnPowerUp = useCallback(() => {
        const types: PowerUp['type'][] = ['HEALTH', 'SHIELD', 'RAPID', 'BOOST', 'TRIPLE', 'EMP', 'BOMB'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 200 + Math.random() * (CANVAS_WIDTH - 400);
        const y = 200 + Math.random() * (CANVAS_HEIGHT - 400);
        powerUpsRef.current.push({ id: `pw_${Date.now()}_${Math.random()}`, x, y, radius: 18, type, color: '#fff' });
    }, []);

    const handleShoot = (char: Character) => {
        const now = Date.now();
        let delay = char.weaponDelay;
        if (char.powerups.some(p => p.type === 'RAPID' && p.expiry > now)) delay /= 3;
        if (now - char.lastShot < delay) return;

        const isTriple = char.powerups.some(p => p.type === 'TRIPLE' && p.expiry > now);
        const angles = isTriple ? [char.angle - 0.25, char.angle, char.angle + 0.25] : [char.angle];

        angles.forEach(angle => {
            bulletsRef.current.push({
                id: `b_${char.id}_${now}_${Math.random()}`,
                x: char.x + Math.cos(angle) * 38, y: char.y + Math.sin(angle) * 38,
                vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED,
                radius: 5, color: char.color, ownerId: char.id, damage: 20, life: 1500
            });
        });
        
        char.lastShot = now;
        recoilRef.current[char.id] = 12;
        if (char.id === (mp.peerId || 'player')) playLaserShoot();
    };

    const useBomb = (player: Character) => {
        playExplosion();
        shakeRef.current = 40;
        spawnExplosion(player.x, player.y, '#ff4400');
        // Nettoyage des balles adverses
        bulletsRef.current = bulletsRef.current.filter(b => b.ownerId === player.id);
        // Dégâts aux bots proches
        botsRef.current.forEach(bot => {
            if (bot.isDead) return;
            const d = Math.hypot(bot.x - player.x, bot.y - player.y);
            if (d < 500) {
                bot.hp -= 100;
                if (bot.hp <= 0) {
                    bot.isDead = true; bot.respawnTimer = RESPAWN_TIME;
                    player.score++; setScore(player.score);
                    spawnExplosion(bot.x, bot.y, bot.color);
                    const killEvent: KillEvent = { id: Date.now() + Math.random(), killer: player.name, victim: bot.name, time: Date.now() };
                    setKillFeed(prev => [killEvent, ...prev].slice(0, 5));
                }
            }
        });
    };

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE', diffOverride?: Difficulty) => {
        if (diffOverride) { setDifficulty(diffOverride); difficultyRef.current = diffOverride; }
        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        setScore(0);
        if ((modeOverride || gameMode) === 'SOLO') {
            botsRef.current = Array.from({length: 12}, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else { botsRef.current = []; }
        bulletsRef.current = []; powerUpsRef.current = []; particlesRef.current = []; recoilRef.current = {};
        setTimeLeft(MATCH_DURATION); timeLeftRef.current = MATCH_DURATION;
        empActiveUntilRef.current = 0;
        setGameState('PLAYING'); gameStateRef.current = 'PLAYING';
        audio.resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [spawnCharacter, gameMode, username, mp, audio, onReportProgress]);

    const update = useCallback((dt: number) => {
        const currentGS = gameStateRef.current;
        if (currentGS === 'MENU' || currentGS === 'GAMEOVER') return;
        const player = playerRef.current;
        if (!player) return;
        const speedFactor = Math.max(0.1, Math.min(dt / 16.67, 2.5));
        const map = MAPS[selectedMapIndexRef.current];
        const now = Date.now();

        if (currentGS === 'PLAYING') {
            timeLeftRef.current -= dt / 1000;
            if (timeLeftRef.current <= 0) {
                 setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; 
                 playVictory(); updateHighScore('arenaclash', player.score);
                 const coins = Math.floor(player.score * 10); addCoins(coins); setEarnedCoins(coins);
                 return;
            }
            // Spawn PowerUps plus fréquent (toutes les 7 secondes)
            if (now - lastPowerUpSpawnRef.current > 7000) { spawnPowerUp(); lastPowerUpSpawnRef.current = now; }
        }

        if (shakeRef.current > 0) { shakeRef.current *= Math.pow(0.9, speedFactor); if (shakeRef.current < 0.5) shakeRef.current = 0; }
        cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
        cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, player.y - VIEWPORT_HEIGHT / 2));

        const isEmpActive = now < empActiveUntilRef.current;
        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (char.isDead) {
                char.respawnTimer -= dt;
                if (char.respawnTimer <= 0) {
                    const oldS = char.score;
                    const newC = spawnCharacter(char.id, char.name, char.id === player.id);
                    Object.assign(char, newC); char.score = oldS;
                    if (char.id === player.id) { setGameState('PLAYING'); gameStateRef.current = 'PLAYING'; }
                }
                return;
            }

            if (recoilRef.current[char.id] > 0) recoilRef.current[char.id] *= 0.85;

            if (char.id === player.id) {
                let currentSpeed = char.speed;
                if (char.powerups.some(p => p.type === 'BOOST' && p.expiry > now)) currentSpeed *= 1.5;
                let dx = 0, dy = 0;
                if (controlsRef.current.move.active) { dx = controlsRef.current.move.x; dy = controlsRef.current.move.y; }
                else {
                    if (keysRef.current['w'] || keysRef.current['arrowup'] || keysRef.current['z']) dy -= 1;
                    if (keysRef.current['s'] || keysRef.current['arrowdown']) dy += 1;
                    if (keysRef.current['a'] || keysRef.current['arrowleft'] || keysRef.current['q']) dx -= 1;
                    if (keysRef.current['d'] || keysRef.current['arrowright']) dx += 1;
                }
                if (dx !== 0 || dy !== 0) {
                    const mag = Math.sqrt(dx*dx + dy*dy);
                    char.vx = (dx / mag) * currentSpeed; char.vy = (dy / mag) * currentSpeed;
                    if (!controlsRef.current.aim.active) char.angle = Math.atan2(dy, dx);
                    char.x += char.vx * speedFactor; char.y += char.vy * speedFactor;
                }
                if (controlsRef.current.aim.active) { char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x); handleShoot(char); }
                else if (mouseRef.current.down) handleShoot(char);
            } else if (!isEmpActive) {
                // LOGIQUE FFA : Cibler l'entité la plus proche (joueur ou autre bot)
                let closestDist = Infinity;
                let target = null;

                allChars.forEach(potentialTarget => {
                    if (potentialTarget.id === char.id || potentialTarget.isDead) return;
                    const d = Math.hypot(potentialTarget.x - char.x, potentialTarget.y - char.y);
                    if (d < closestDist) {
                        closestDist = d;
                        target = potentialTarget;
                    }
                });

                if (target && closestDist < 1000) {
                    char.angle = Math.atan2(target.y - char.y, target.x - char.x);
                    // S'approcher si trop loin, s'éloigner si trop près
                    if (closestDist > 300) {
                        char.x += Math.cos(char.angle) * char.speed * 0.7 * speedFactor;
                        char.y += Math.sin(char.angle) * char.speed * 0.7 * speedFactor;
                    } else if (closestDist < 150) {
                        char.x -= Math.cos(char.angle) * char.speed * 0.5 * speedFactor;
                        char.y -= Math.sin(char.angle) * char.speed * 0.5 * speedFactor;
                    }
                    handleShoot(char);
                } else {
                    // Patrouille aléatoire si pas de cible
                    char.angle += (Math.random() - 0.5) * 0.1;
                    char.x += Math.cos(char.angle) * char.speed * 0.4 * speedFactor;
                    char.y += Math.sin(char.angle) * char.speed * 0.4 * speedFactor;
                }
            }

            // Collisions obstacles
            map.obstacles.forEach(obs => {
                if (obs.type === 'pond') return;
                const cX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w)), cY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dX = char.x - cX, dY = char.y - cY, dist = Math.sqrt(dX*dX + dY*dY);
                if (dist < char.radius && dist > 0) {
                    const over = char.radius - dist; char.x += (dX/dist)*over; char.y += (dY/dist)*over;
                }
            });
            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH - char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT - char.radius, char.y));
        });

        // PowerUps Collection (Tous les tanks peuvent ramasser !)
        for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            const pw = powerUpsRef.current[i];
            allChars.forEach(char => {
                if (!char.isDead && Math.hypot(char.x - pw.x, char.y - pw.y) < char.radius + pw.radius) {
                    if (pw.type === 'HEALTH') char.hp = Math.min(char.maxHp, char.hp + 40);
                    else if (pw.type === 'SHIELD') char.shield = Math.min(100, char.shield + 50);
                    else if (pw.type === 'EMP' && char.id === player.id) empActiveUntilRef.current = now + 5000;
                    else if (pw.type === 'BOMB' && char.id === player.id) useBomb(player);
                    else char.powerups.push({ type: pw.type, expiry: now + 10000 });
                    
                    if (char.id === player.id) playCoin?.(); 
                    spawnParticles(pw.x, pw.y, '#fff', 10); 
                    powerUpsRef.current.splice(i, 1);
                }
            });
        }

        // Bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i]; b.x += b.vx * speedFactor; b.y += b.vy * speedFactor; b.life -= dt;
            let hit = false;
            for (const obs of map.obstacles) { if (obs.type !== 'pond' && b.x > obs.x && b.x < obs.x+obs.w && b.y > obs.y && b.y < obs.y+obs.h) { hit=true; break; } }
            if (!hit) {
                for (const target of allChars) {
                    if (target.id !== b.ownerId && !target.isDead && Math.hypot(b.x - target.x, b.y - target.y) < target.radius + b.radius) {
                        hit = true; 
                        if (target.shield > 0) { target.shield -= b.damage; if (target.shield < 0) { target.hp += target.shield; target.shield = 0; } } 
                        else target.hp -= b.damage;

                        if (target.hp <= 0) {
                            target.isDead = true; 
                            target.respawnTimer = RESPAWN_TIME; 
                            playExplosion(); 
                            spawnExplosion(target.x, target.y, target.color);
                            
                            const killer = allChars.find(c => c.id === b.ownerId); 
                            if (killer) { 
                                killer.score++; 
                                if (killer.id === player.id) setScore(killer.score); 
                                const killEvent: KillEvent = { id: Date.now() + Math.random(), killer: killer.name, victim: target.name, time: Date.now() };
                                setKillFeed(prev => [killEvent, ...prev].slice(0, 5));
                            }
                            if (target.id === player.id) { setGameState('RESPAWNING'); gameStateRef.current = 'RESPAWNING'; shakeRef.current = 20; }
                        }
                        break;
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i]; p.x += p.vx * speedFactor; p.y += p.vy * speedFactor; p.vx *= Math.pow(0.98, speedFactor); p.vy *= Math.pow(0.98, speedFactor); p.life -= dt;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

        if (frameRef.current++ % 60 === 0) setLeaderboard(allChars.map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id })).sort((a,b) => b.score - a.score));
        setTimeLeft(timeLeftRef.current);
    }, [addCoins, mp, updateHighScore, spawnCharacter, playVictory, playExplosion, spawnPowerUp, onReportProgress]);

    return {
        gameState, setGameState, gameMode, setGameMode, difficulty, setDifficulty,
        score, timeLeft, leaderboard, earnedCoins, playerRef, botsRef, bulletsRef,
        powerUpsRef, particlesRef, cameraRef, recoilRef, shakeRef,
        startGame, update, keysRef, mouseRef, controlsRef, selectedMapIndex, setSelectedMapIndex,
        isHost: mp.isHost, killFeed, onlineStep, setOnlineStep
    };
};
