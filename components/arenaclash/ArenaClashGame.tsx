
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Crosshair, Play, HelpCircle, Skull, Zap, Clock, Shield, Activity, Target } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface ArenaClashGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONFIGURATION ---
const CANVAS_WIDTH = 1200; // Virtual width
const CANVAS_HEIGHT = 1200; // Virtual height
const VIEWPORT_WIDTH = 800; // Render width
const VIEWPORT_HEIGHT = 600; // Render height

const BULLET_SPEED = 12;
const MATCH_DURATION = 120; // Seconds
const RESPAWN_TIME = 3000; // ms

// --- STYLES ---
const COLORS = {
    player: '#00d9ff',   // Cyan
    enemy: '#ff2df5',    // Pink
    bullet: '#ffff00',   // Yellow
    wall: '#b000ff',     // Purple
    grid: 'rgba(0, 217, 255, 0.1)',
    powerup: {
        health: '#ef4444',
        shield: '#3b82f6',
        speed: '#eab308',
        damage: '#d946ef'
    }
};

const BOT_NAMES = ["Neo", "Glitch", "Viper", "Ghost", "Cyborg", "Pixel", "Byte", "Kilo", "Mega", "Tera"];

// --- TYPES ---
interface Entity {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
}

interface Character extends Entity {
    name: string;
    hp: number;
    maxHp: number;
    angle: number;
    vx: number;
    vy: number;
    speed: number;
    weaponDelay: number;
    lastShot: number;
    isDead: boolean;
    respawnTimer: number;
    score: number;
    shield: number;
    powerups: { type: PowerUpType, expiry: number }[];
    targetId?: string | null;
}

interface Bullet extends Entity {
    ownerId: string;
    vx: number;
    vy: number;
    damage: number;
    life: number;
}

type PowerUpType = 'HEALTH' | 'SHIELD' | 'SPEED' | 'DAMAGE';

interface PowerUp extends Entity {
    type: PowerUpType;
}

interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface KillEvent {
    id: number;
    killer: string;
    victim: string;
    time: number;
}

// --- MAP GENERATION ---
const OBSTACLES: Obstacle[] = [
    { x: 200, y: 200, w: 100, h: 100 },
    { x: 900, y: 200, w: 100, h: 100 },
    { x: 200, y: 900, w: 100, h: 100 },
    { x: 900, y: 900, w: 100, h: 100 },
    { x: 550, y: 550, w: 100, h: 100 },
    { x: 500, y: 100, w: 200, h: 50 },
    { x: 500, y: 1050, w: 200, h: 50 },
    { x: 100, y: 500, w: 50, h: 200 },
    { x: 1050, y: 500, w: 50, h: 200 },
];

export const ArenaClashGame: React.FC<ArenaClashGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Joystick Refs (DOM Elements)
    const leftZoneRef = useRef<HTMLDivElement>(null);
    const rightZoneRef = useRef<HTMLDivElement>(null);
    const leftKnobRef = useRef<HTMLDivElement>(null);
    const rightKnobRef = useRef<HTMLDivElement>(null);

    // Input State
    const controlsRef = useRef({
        move: { x: 0, y: 0, active: false },
        aim: { x: 0, y: 0, active: false }
    });
    const activeTouches = useRef<{ move: number | null, aim: number | null }>({ move: null, aim: null });
    
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const mouseRef = useRef({ x: 0, y: 0, down: false });

    // UI State
    const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'RESPAWNING' | 'GAMEOVER'>('MENU');
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [showTutorial, setShowTutorial] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    // Game Loop Refs
    const playerRef = useRef<Character | null>(null);
    const botsRef = useRef<Character[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    
    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const onReportProgressRef = useRef(onReportProgress);
    const cameraRef = useRef({ x: 0, y: 0 });
    
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const shakeRef = useRef(0);

    const { playLaserShoot, playExplosion, playPowerUpCollect, playVictory, playGameOver, resumeAudio, playCoin } = audio;
    const { updateHighScore } = useHighScores();

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    // --- INITIALIZATION ---
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_arena_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_arena_tutorial_seen', 'true');
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    // --- JOYSTICK LOGIC ---
    const updateStick = (type: 'move' | 'aim', clientX: number, clientY: number, zone: HTMLDivElement) => {
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = rect.width / 2 - 25; // Padding

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Normalize vector
        let normX = 0;
        let normY = 0;

        if (dist > 0) {
            const limitedDist = Math.min(dist, maxDist);
            const ratio = limitedDist / dist;
            
            // Move visual knob
            const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
            if (knob) {
                knob.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;
            }

            // Input value (0 to 1 magnitude)
            const magnitude = Math.min(dist / maxDist, 1.0);
            normX = (dx / dist) * magnitude;
            normY = (dy / dist) * magnitude;
        }

        if (type === 'move') {
            controlsRef.current.move = { x: normX, y: normY, active: true };
        } else {
            controlsRef.current.aim = { x: normX, y: normY, active: true };
        }
    };

    const resetStick = (type: 'move' | 'aim') => {
        const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
        if (knob) knob.style.transform = `translate(0px, 0px)`;
        
        if (type === 'move') controlsRef.current.move = { x: 0, y: 0, active: false };
        else controlsRef.current.aim = { x: 0, y: 0, active: false };
    };

    // --- TOUCH HANDLERS ---
    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            // Prevent default behavior to stop scrolling
            if (e.target !== leftZoneRef.current && e.target !== rightZoneRef.current && !(e.target as HTMLElement).closest('button')) {
               e.preventDefault(); 
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                
                // START
                if (e.type === 'touchstart') {
                    if (leftZoneRef.current && activeTouches.current.move === null) {
                        const rect = leftZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.move = t.identifier;
                            updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                            continue;
                        }
                    }
                    if (rightZoneRef.current && activeTouches.current.aim === null) {
                        const rect = rightZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.aim = t.identifier;
                            updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
                            continue;
                        }
                    }
                }

                // MOVE
                if (e.type === 'touchmove') {
                    if (t.identifier === activeTouches.current.move && leftZoneRef.current) {
                        updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                    }
                    if (t.identifier === activeTouches.current.aim && rightZoneRef.current) {
                        updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
                    }
                }

                // END
                if (e.type === 'touchend' || e.type === 'touchcancel') {
                    if (t.identifier === activeTouches.current.move) {
                        activeTouches.current.move = null;
                        resetStick('move');
                    }
                    if (t.identifier === activeTouches.current.aim) {
                        activeTouches.current.aim = null;
                        resetStick('aim');
                    }
                }
            }
        };

        const container = document.getElementById('arena-container');
        if (container) {
            container.addEventListener('touchstart', handleTouch, { passive: false });
            container.addEventListener('touchmove', handleTouch, { passive: false });
            container.addEventListener('touchend', handleTouch, { passive: false });
            container.addEventListener('touchcancel', handleTouch, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouch);
                container.removeEventListener('touchmove', handleTouch);
                container.removeEventListener('touchend', handleTouch);
                container.removeEventListener('touchcancel', handleTouch);
            }
        };
    }, []);

    const spawnCharacter = (id: string, name: string, isPlayer: boolean): Character => {
        let x, y, safe;
        do {
            x = 50 + Math.random() * (CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
            safe = true;
            for (const obs of OBSTACLES) {
                if (x > obs.x - 30 && x < obs.x + obs.w + 30 && y > obs.y - 30 && y < obs.y + obs.h + 30) safe = false;
            }
        } while (!safe);

        return {
            id, name, x, y, radius: 18,
            color: isPlayer ? COLORS.player : COLORS.enemy,
            hp: 100, maxHp: 100,
            angle: 0, vx: 0, vy: 0, speed: isPlayer ? 5 : 3.5,
            weaponDelay: 150, lastShot: 0,
            isDead: false, respawnTimer: 0,
            score: 0, shield: 0, powerups: [],
            targetId: null
        };
    };

    const startGame = () => {
        if (showTutorial) return;
        playerRef.current = spawnCharacter('player', 'VOUS', true);
        botsRef.current = Array.from({ length: 5 }, (_, i) => spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        bulletsRef.current = [];
        powerUpsRef.current = [];
        particlesRef.current = [];
        setTimeLeft(MATCH_DURATION);
        timeLeftRef.current = MATCH_DURATION;
        setKillFeed([]);
        setGameState('PLAYING');
        gameStateRef.current = 'PLAYING';
        setEarnedCoins(0);
        resumeAudio();
        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
        lastTimeRef.current = Date.now();
        loop();
    };

    const spawnPowerUp = () => {
        if (powerUpsRef.current.length > 5) return;
        let x, y, safe;
        do {
            x = 50 + Math.random() * (CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
            safe = true;
            for (const obs of OBSTACLES) {
                if (x > obs.x - 20 && x < obs.x + obs.w + 20 && y > obs.y - 20 && y < obs.y + obs.h + 20) safe = false;
            }
        } while (!safe);

        const types: PowerUpType[] = ['HEALTH', 'SHIELD', 'SPEED', 'DAMAGE'];
        powerUpsRef.current.push({
            id: `pu_${Date.now()}_${Math.random()}`,
            x, y, radius: 12, color: '#fff', type: types[Math.floor(Math.random() * types.length)]
        });
    };

    // --- UPDATE ---
    const update = (dt: number) => {
        const now = Date.now();
        const player = playerRef.current;
        if (!player) return;

        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'RESPAWNING') {
            timeLeftRef.current = Math.max(0, timeLeftRef.current - dt / 1000);
            if (Math.floor(timeLeftRef.current) !== Math.floor(timeLeft)) {
                setTimeLeft(timeLeftRef.current);
                if (Math.random() < 0.3) spawnPowerUp();
            }
            if (timeLeftRef.current <= 0) {
                endGame();
                return;
            }
        }

        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (char.isDead) {
                if (char.respawnTimer > 0) {
                    char.respawnTimer -= dt;
                    if (char.respawnTimer <= 0) {
                        const spawn = spawnCharacter(char.id, char.name, char.id === 'player');
                        Object.assign(char, spawn);
                        if (char.id === 'player') {
                            setGameState('PLAYING');
                            gameStateRef.current = 'PLAYING';
                        }
                    }
                }
                return;
            }

            char.powerups = char.powerups.filter(p => p.expiry > now);
            const hasSpeed = char.powerups.some(p => p.type === 'SPEED');
            const hasDamage = char.powerups.some(p => p.type === 'DAMAGE');
            const currentSpeed = hasSpeed ? char.speed * 1.5 : char.speed;

            // MOVEMENT
            if (char.id === 'player') {
                let dx = 0, dy = 0;
                
                // Keyboard
                if (keysRef.current['w'] || keysRef.current['ArrowUp']) dy -= 1;
                if (keysRef.current['s'] || keysRef.current['ArrowDown']) dy += 1;
                if (keysRef.current['a'] || keysRef.current['ArrowLeft']) dx -= 1;
                if (keysRef.current['d'] || keysRef.current['ArrowRight']) dx += 1;

                // Virtual Joystick
                if (controlsRef.current.move.active) {
                    dx = controlsRef.current.move.x;
                    dy = controlsRef.current.move.y;
                }

                // Normalize if mixed input
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len > 1) { dx /= len; dy /= len; }

                char.x += dx * currentSpeed;
                char.y += dy * currentSpeed;

                // AIMING
                if (controlsRef.current.aim.active) {
                    // Twin stick aim
                    char.angle = Math.atan2(controlsRef.current.aim.y, controlsRef.current.aim.x);
                    
                    // Shoot if holding stick
                    if (now - char.lastShot > char.weaponDelay) {
                        fireBullet(char, hasDamage);
                    }
                } else if (!controlsRef.current.move.active) { 
                    // Mouse aim (only if no touch input to avoid conflict)
                    const worldMouseX = mouseRef.current.x + cameraRef.current.x;
                    const worldMouseY = mouseRef.current.y + cameraRef.current.y;
                    char.angle = Math.atan2(worldMouseY - char.y, worldMouseX - char.x);
                    
                    if (mouseRef.current.down && now - char.lastShot > char.weaponDelay) {
                        fireBullet(char, hasDamage);
                    }
                }

            } else {
                // ... BOT AI CODE (Same as before) ...
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

            // COLLISION
            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH - char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT - char.radius, char.y));
            OBSTACLES.forEach(obs => {
                const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dx = char.x - closestX;
                const dy = char.y - closestY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < char.radius) {
                    const overlap = char.radius - dist;
                    const nx = dx / dist; const ny = dy / dist;
                    char.x += nx * overlap; char.y += ny * overlap;
                }
            });

            for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                const pu = powerUpsRef.current[i];
                if (Math.hypot(char.x - pu.x, char.y - pu.y) < char.radius + pu.radius) {
                    playPowerUpCollect(pu.type === 'HEALTH' ? 'EXTRA_LIFE' : 'PADDLE_GROW');
                    applyPowerUp(char, pu.type);
                    powerUpsRef.current.splice(i, 1);
                }
            }
        });

        // BULLETS
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx; b.y += b.vy; b.life -= dt;
            let hit = false;
            if (b.x < 0 || b.x > CANVAS_WIDTH || b.y < 0 || b.y > CANVAS_HEIGHT) hit = true;
            if (!hit) {
                for (const obs of OBSTACLES) {
                    if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                        hit = true; spawnParticles(b.x, b.y, b.color, 3); break;
                    }
                }
            }
            if (!hit) {
                for (const char of allChars) {
                    if (char.id !== b.ownerId && !char.isDead) {
                        if (Math.hypot(b.x - char.x, b.y - char.y) < char.radius + b.radius) {
                            hit = true; spawnParticles(b.x, b.y, char.color, 5); takeDamage(char, b.damage, b.ownerId); break;
                        }
                    }
                }
            }
            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        // PARTICLES
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

        // CAMERA
        if (player && !player.isDead) {
            const targetX = player.x - VIEWPORT_WIDTH / 2;
            const targetY = player.y - VIEWPORT_HEIGHT / 2;
            cameraRef.current.x += (targetX - cameraRef.current.x) * 0.1;
            cameraRef.current.y += (targetY - cameraRef.current.y) * 0.1;
            if (shakeRef.current > 0) {
                cameraRef.current.x += (Math.random() - 0.5) * shakeRef.current;
                cameraRef.current.y += (Math.random() - 0.5) * shakeRef.current;
                shakeRef.current *= 0.9;
                if (shakeRef.current < 0.5) shakeRef.current = 0;
            }
            cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, cameraRef.current.x));
            cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, cameraRef.current.y));
        }

        const sorted = [...allChars].sort((a, b) => b.score - a.score);
        setLeaderboard(sorted.map(c => ({ name: c.name, score: c.score, isMe: c.id === 'player' })));
    };

    const fireBullet = (char: Character, boosted: boolean) => {
        const damage = boosted ? 25 : 10;
        const speed = BULLET_SPEED;
        const color = boosted ? '#ff00ff' : char.id === 'player' ? COLORS.player : COLORS.bullet;
        bulletsRef.current.push({
            id: `b_${Date.now()}_${Math.random()}`,
            x: char.x + Math.cos(char.angle) * 20, y: char.y + Math.sin(char.angle) * 20,
            vx: Math.cos(char.angle) * speed, vy: Math.sin(char.angle) * speed,
            radius: 4, color, ownerId: char.id, damage, life: 2000
        });
        char.lastShot = Date.now();
        playLaserShoot();
        if (char.id === 'player') shakeRef.current = 2;
    };

    const takeDamage = (char: Character, dmg: number, attackerId: string) => {
        if (char.shield > 0) { char.shield -= dmg; if (char.shield < 0) char.shield = 0; return; }
        char.hp -= dmg;
        if (char.hp <= 0 && !char.isDead) {
            char.isDead = true; char.respawnTimer = RESPAWN_TIME; char.hp = 0;
            playExplosion(); spawnParticles(char.x, char.y, char.color, 30, true);
            const attacker = attackerId === 'player' ? playerRef.current : botsRef.current.find(b => b.id === attackerId);
            if (attacker) {
                attacker.score += 1;
                setKillFeed(prev => [{ id: Date.now(), killer: attacker.name, victim: char.name, time: Date.now() }, ...prev].slice(0, 5));
                if (attacker.id === 'player') { playCoin(); shakeRef.current = 10; }
            }
            if (char.id === 'player') { setGameState('RESPAWNING'); gameStateRef.current = 'RESPAWNING'; playGameOver(); }
        }
    };

    const applyPowerUp = (char: Character, type: PowerUpType) => {
        const now = Date.now();
        if (type === 'HEALTH') char.hp = Math.min(char.maxHp, char.hp + 50);
        else if (type === 'SHIELD') char.shield = 50;
        else char.powerups.push({ type, expiry: now + 10000 });
    };

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

    const endGame = () => {
        setGameState('GAMEOVER'); gameStateRef.current = 'GAMEOVER'; playVictory();
        const player = playerRef.current;
        if (player) {
            const finalScore = player.score;
            updateHighScore('arenaclash', finalScore);
            if (onReportProgressRef.current) onReportProgressRef.current('score', finalScore);
            const coins = finalScore * 10 + 50;
            addCoins(coins);
            setEarnedCoins(coins);
        }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        const cam = cameraRef.current;
        ctx.save(); ctx.translate(-cam.x, -cam.y);

        ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 2;
        for (let x = 0; x <= CANVAS_WIDTH; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

        ctx.shadowColor = COLORS.wall; ctx.shadowBlur = 15; ctx.strokeStyle = COLORS.wall; ctx.fillStyle = 'rgba(176, 0, 255, 0.1)';
        OBSTACLES.forEach(obs => { ctx.fillRect(obs.x, obs.y, obs.w, obs.h); ctx.strokeRect(obs.x, obs.y, obs.w, obs.h); });
        ctx.shadowBlur = 0;

        powerUpsRef.current.forEach(pu => {
            let color = '#fff';
            if (pu.type === 'HEALTH') color = COLORS.powerup.health;
            if (pu.type === 'SHIELD') color = COLORS.powerup.shield;
            if (pu.type === 'SPEED') color = COLORS.powerup.speed;
            if (pu.type === 'DAMAGE') color = COLORS.powerup.damage;
            ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(pu.type[0], pu.x, pu.y);
        });

        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2); ctx.fill();
        });

        [playerRef.current, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;
            if (char.shield > 0) {
                ctx.strokeStyle = COLORS.powerup.shield; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(char.x, char.y, char.radius + 5, 0, Math.PI*2); ctx.stroke();
            }
            ctx.save(); ctx.translate(char.x, char.y); ctx.rotate(char.angle);
            ctx.fillStyle = char.color; ctx.shadowColor = char.color; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(0, 0, char.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(char.radius - 5, -3, 10, 6);
            ctx.restore();
            const hpPct = char.hp / char.maxHp;
            ctx.fillStyle = '#000'; ctx.fillRect(char.x - 15, char.y - 30, 30, 4);
            ctx.fillStyle = hpPct > 0.5 ? '#0f0' : '#f00'; ctx.fillRect(char.x - 15, char.y - 30, 30 * hpPct, 4);
            ctx.fillStyle = '#fff'; ctx.font = '10px Rajdhani'; ctx.textAlign = 'center'; ctx.fillText(char.name, char.x, char.y - 35);
        });
        ctx.restore();
    };

    const loop = () => {
        const now = Date.now();
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;
        update(dt);
        if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) draw(ctx); }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    // --- CONTROLS ---
    useEffect(() => {
        const kd = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; keysRef.current[e.code] = true; };
        const ku = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; keysRef.current[e.code] = false; };
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        const scaleX = VIEWPORT_WIDTH / rect.width;
        const scaleY = VIEWPORT_HEIGHT / rect.height;
        mouseRef.current.x = (e.clientX - rect.left) * scaleX;
        mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };

    const toggleTutorial = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTutorial(prev => !prev);
    };

    return (
        <div id="arena-container" className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden select-none">
            {/* Background */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            {showTutorial && <TutorialOverlay gameId="arenaclash" onClose={() => setShowTutorial(false)} />}

            {/* HEADER */}
            <div className="w-full max-w-2xl flex items-center justify-between z-20 mb-2 p-4 shrink-0 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-3 bg-gray-900/80 rounded-xl text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 pointer-events-auto active:scale-95 transition-all">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,217,255,0.5)] tracking-widest">NEON ARENA</h1>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={toggleTutorial} className="p-3 bg-gray-900/80 rounded-xl text-yellow-400 border border-yellow-500/30 hover:bg-yellow-900/50 active:scale-95 transition-all"><HelpCircle size={20} /></button>
                </div>
            </div>

            {/* GAME AREA */}
            <div className="flex-1 w-full max-w-4xl relative min-h-0 flex flex-col">
                
                {/* HUD */}
                <div className="absolute top-0 left-0 w-full flex justify-between p-4 z-20 pointer-events-none">
                    <div className="flex flex-col gap-1">
                        {killFeed.map(k => (
                            <div key={k.id} className="text-xs bg-black/60 px-2 py-1 rounded text-white animate-in fade-in">
                                <span className={k.killer === 'VOUS' ? 'text-cyan-400 font-bold' : 'text-pink-400'}>{k.killer}</span>
                                <span className="text-gray-400 mx-1">killed</span>
                                <span className={k.victim === 'VOUS' ? 'text-cyan-400 font-bold' : 'text-pink-400'}>{k.victim}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-center">
                        <div className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
                        </div>
                        {gameState === 'RESPAWNING' && (
                            <div className="mt-2 bg-red-900/80 px-4 py-1 rounded text-red-200 font-bold animate-pulse border border-red-500 text-xs">
                                RESPAWN DANS {Math.ceil(playerRef.current?.respawnTimer! / 1000)}s
                            </div>
                        )}
                    </div>
                    <div className="w-32 bg-gray-900/80 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
                            <Trophy size={14} className="text-yellow-400"/>
                            <span className="text-xs font-bold text-white">TOP</span>
                        </div>
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <div key={i} className={`flex justify-between text-[10px] mb-1 ${p.isMe ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                                <span>{i+1}. {p.name}</span>
                                <span>{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CANVAS WRAPPER */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    <canvas 
                        ref={canvasRef}
                        width={VIEWPORT_WIDTH}
                        height={VIEWPORT_HEIGHT}
                        className="bg-black/80 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-xl w-full h-full object-contain cursor-crosshair"
                        onMouseDown={(e) => { 
                            if(!showTutorial) { 
                                mouseRef.current.down = true; 
                                const rect = e.currentTarget.getBoundingClientRect();
                                const scaleX = VIEWPORT_WIDTH / rect.width;
                                const scaleY = VIEWPORT_HEIGHT / rect.height;
                                mouseRef.current.x = (e.clientX - rect.left) * scaleX;
                                mouseRef.current.y = (e.clientY - rect.top) * scaleY;
                            } 
                        }}
                        onMouseUp={() => mouseRef.current.down = false}
                        onMouseMove={handleMouseMove}
                    />

                    {/* MENUS */}
                    {gameState === 'MENU' && !showTutorial && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 pointer-events-auto">
                            <Crosshair size={64} className="text-cyan-400 animate-spin-slow mb-4 drop-shadow-[0_0_15px_#00f3ff]"/>
                            <h2 className="text-5xl font-black italic text-white tracking-widest drop-shadow-lg mb-2">NEON ARENA</h2>
                            <button onClick={startGame} className="mt-8 px-10 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,217,255,0.6)] border border-white/20 flex items-center gap-2">
                                <Play fill="white"/> JOUER
                            </button>
                        </div>
                    )}

                    {gameState === 'GAMEOVER' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 animate-in zoom-in fade-in pointer-events-auto">
                            <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 italic mb-4">MATCH TERMINÉ</h2>
                            {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                            <button onClick={startGame} className="px-10 py-4 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={24} /> REJOUER</button>
                        </div>
                    )}
                </div>

                {/* MOBILE CONTROLS (BOTTOM) */}
                <div className="h-48 w-full grid grid-cols-2 gap-4 shrink-0 sm:hidden z-40 p-4 pointer-events-auto">
                    {/* LEFT STICK - MOVE */}
                    <div ref={leftZoneRef} className="relative bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <div className="w-20 h-20 rounded-full border-2 border-cyan-500"></div>
                        </div>
                        <div ref={leftKnobRef} className="w-12 h-12 bg-cyan-500/80 rounded-full shadow-[0_0_15px_#00f3ff] relative pointer-events-none">
                            <div className="absolute inset-0 rounded-full border-2 border-white opacity-50"></div>
                        </div>
                        <span className="absolute bottom-2 text-[10px] text-cyan-500 font-bold tracking-widest pointer-events-none">BOUGER</span>
                    </div>

                    {/* RIGHT STICK - AIM/SHOOT */}
                    <div ref={rightZoneRef} className="relative bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <div className="w-20 h-20 rounded-full border-2 border-red-500"></div>
                        </div>
                        <div ref={rightKnobRef} className="w-12 h-12 bg-red-500/80 rounded-full shadow-[0_0_15px_#ef4444] relative pointer-events-none">
                            <div className="absolute inset-0 rounded-full border-2 border-white opacity-50"></div>
                        </div>
                        <span className="absolute bottom-2 text-[10px] text-red-500 font-bold tracking-widest pointer-events-none">VISER & TIRER</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
