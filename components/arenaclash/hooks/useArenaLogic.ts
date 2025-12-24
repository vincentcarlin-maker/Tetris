import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useHighScores } from '../../../hooks/useHighScores';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
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
    const { playLaserShoot, playExplosion, playVictory } = audio;

    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
    const [gameState, setGameState] = useState<'MENU' | 'LOBBY' | 'DIFFICULTY' | 'PLAYING' | 'RESPAWNING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [selectedMapIndex, setSelectedMapIndex] = useState(0);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [score, setScore] = useState(0);

    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef({ x: 0, y: 0 });
    const recoilRef = useRef<{ [key: string]: number }>({});
    const frameRef = useRef(0);

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
            hp: 100, maxHp: 100,
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

    const handleShoot = (char: Character) => {
        const now = Date.now();
        if (now - char.lastShot < char.weaponDelay) return;

        const angle = char.angle;
        bulletsRef.current.push({
            id: `b_${char.id}_${now}_${Math.random()}`,
            x: char.x + Math.cos(angle) * 38, y: char.y + Math.sin(angle) * 38,
            vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED,
            radius: 5, color: char.color, ownerId: char.id, damage: 20, life: 1500
        });
        
        char.lastShot = now;
        recoilRef.current[char.id] = 12;
        if (char.id === (mp.peerId || 'player')) playLaserShoot();
    };

    const startGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE', diffOverride?: Difficulty) => {
        if (diffOverride) { setDifficulty(diffOverride); difficultyRef.current = diffOverride; }
        playerRef.current = spawnCharacter(mp.peerId || 'player', username, true);
        setScore(0);
        if ((modeOverride || gameMode) === 'SOLO') {
            botsRef.current = Array.from({length: 12}, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        } else {
            botsRef.current = [];
        }
        bulletsRef.current = []; powerUpsRef.current = []; particlesRef.current = []; recoilRef.current = {};
        setTimeLeft(MATCH_DURATION); timeLeftRef.current = MATCH_DURATION;
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

        if (currentGS === 'PLAYING') {
            timeLeftRef.current -= dt / 1000;
            if (timeLeftRef.current <= 0) {
                 setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; 
                 playVictory(); updateHighScore('arenaclash', player.score);
                 const coins = Math.floor(player.score * 10); addCoins(coins); setEarnedCoins(coins);
                 return;
            }
        }

        cameraRef.current.x = player.x - VIEWPORT_WIDTH / 2;
        cameraRef.current.y = player.y - VIEWPORT_HEIGHT / 2;
        cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, cameraRef.current.x));
        cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, cameraRef.current.y));

        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (char.isDead) {
                char.respawnTimer -= dt;
                if (char.respawnTimer <= 0) {
                    const oldScore = char.score;
                    const isMain = char.id === player.id;
                    const newC = spawnCharacter(char.id, char.name, isMain);
                    Object.assign(char, newC); char.score = oldScore;
                    if (isMain) { setGameState('PLAYING'); gameStateRef.current = 'PLAYING'; }
                }
                return;
            }

            // Gestion des zones spéciales
            map.zones.forEach(zone => {
                const dist = Math.hypot(char.x - zone.x, char.y - zone.y);
                if (dist < zone.radius) {
                    if (zone.type === 'HEAL' && char.hp < char.maxHp) char.hp = Math.min(char.maxHp, char.hp + 0.1 * speedFactor);
                    if (zone.type === 'DANGER') char.hp -= 0.1 * speedFactor;
                }
            });

            if (recoilRef.current[char.id] > 0) recoilRef.current[char.id] *= 0.85;

            if (char.id === player.id) {
                // LOGIQUE JOUEUR
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
                    char.vx = (dx / mag) * char.speed; char.vy = (dy / mag) * char.speed;
                    if (!controlsRef.current.aim.active) char.angle = Math.atan2(dy, dx);
                    char.x += char.vx * speedFactor; char.y += char.vy * speedFactor;
                }

                if (controlsRef.current.aim.active) {
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    handleShoot(char);
                } else if (mouseRef.current.down) { handleShoot(char); }
            } else {
                // LOGIQUE IA AVANCÉE (Les bots s'attaquent entre eux)
                let closestDist = Infinity;
                let targetEntity = null;

                // Trouver la cible la plus proche qui n'est pas soi-même et qui n'est pas morte
                allChars.forEach(potentialTarget => {
                    if (potentialTarget.id === char.id || potentialTarget.isDead) return;
                    const dist = Math.hypot(potentialTarget.x - char.x, potentialTarget.y - char.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        targetEntity = potentialTarget;
                    }
                });

                if (targetEntity && closestDist < 900) {
                    char.angle = Math.atan2(targetEntity.y - char.y, targetEntity.x - char.x);
                    
                    // Se déplacer vers la cible si elle est assez loin
                    if (closestDist > 240) {
                        char.x += Math.cos(char.angle) * char.speed * 0.7 * speedFactor;
                        char.y += Math.sin(char.angle) * char.speed * 0.7 * speedFactor;
                    }
                    
                    // Tirer si la cible est à portée
                    handleShoot(char);
                } else {
                    // Si pas de cible, patrouiller ou bouger lentement vers le centre
                    const angleToCenter = Math.atan2(CANVAS_HEIGHT/2 - char.y, CANVAS_WIDTH/2 - char.x);
                    char.angle = angleToCenter;
                    char.x += Math.cos(char.angle) * char.speed * 0.3 * speedFactor;
                    char.y += Math.sin(char.angle) * char.speed * 0.3 * speedFactor;
                }
            }

            // Collisions Obstacles
            map.obstacles.forEach(obs => {
                if (obs.type === 'pond') return;
                const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dx = char.x - closestX; const dy = char.y - closestY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < char.radius && distance > 0) {
                    const overlap = char.radius - distance;
                    char.x += (dx / distance) * overlap; char.y += (dy / distance) * overlap;
                }
            });

            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH - char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT - char.radius, char.y));
        });

        // Mise à jour des balles
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx * speedFactor; b.y += b.vy * speedFactor; b.life -= dt;
            let hit = false;
            
            // Collision murs
            for (const obs of map.obstacles) {
                if (obs.type === 'pond') continue;
                if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) { 
                    hit = true; 
                    break; 
                }
            }

            // Collision personnages
            if (!hit) {
                for (const target of allChars) {
                    if (target.id !== b.ownerId && !target.isDead && Math.hypot(b.x - target.x, b.y - target.y) < target.radius + b.radius) {
                        hit = true; 
                        target.hp -= b.damage;
                        
                        if (target.hp <= 0) {
                            target.isDead = true; 
                            target.respawnTimer = RESPAWN_TIME; 
                            playExplosion();
                            
                            const killer = allChars.find(c => c.id === b.ownerId);
                            if (killer) { 
                                killer.score++; 
                                if (killer.id === player.id) { 
                                    setScore(killer.score); 
                                    if (onReportProgress) onReportProgress('score', killer.score); 
                                }
                            }
                            if (target.id === player.id) { 
                                setGameState('RESPAWNING'); 
                                gameStateRef.current = 'RESPAWNING'; 
                            }
                        }
                        break;
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        if (frameRef.current++ % 60 === 0) {
            setLeaderboard(allChars.map(c => ({ name: c.name, score: c.score, isMe: c.id === player.id })).sort((a,b) => b.score - a.score));
        }
        setTimeLeft(timeLeftRef.current);
    }, [addCoins, mp, updateHighScore, spawnCharacter, playVictory, playExplosion, onReportProgress]);

    return {
        gameState, setGameState, gameMode, setGameMode, difficulty, setDifficulty,
        score, timeLeft, killFeed, leaderboard, earnedCoins, playerRef, botsRef, bulletsRef,
        powerUpsRef, particlesRef, cameraRef, recoilRef,
        startGame, update, keysRef, mouseRef, controlsRef, selectedMapIndex, setSelectedMapIndex,
        onlineStep, setOnlineStep, isHost: mp.isHost
    };
};