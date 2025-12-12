
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
const CANVAS_HEIGHT = 1200; // Virtual height (camera follows player)
const VIEWPORT_WIDTH = 800; // Render width
const VIEWPORT_HEIGHT = 600; // Render height

const BULLET_SPEED = 12;
const MATCH_DURATION = 120; // Seconds
const RESPAWN_TIME = 3000; // ms

// --- STYLES ---
const COLORS = {
    player: '#00d9ff',   // Cyan
    enemy: '#ff2df5',    // Pink
    ally: '#00ff9d',     // Green
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
    score: number; // Kills
    shield: number;
    powerups: { type: PowerUpType, expiry: number }[];
    targetId?: string | null; // AI Target
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
    { x: 550, y: 550, w: 100, h: 100 }, // Center
    { x: 500, y: 100, w: 200, h: 50 },  // Top Wall
    { x: 500, y: 1050, w: 200, h: 50 }, // Bottom Wall
    { x: 100, y: 500, w: 50, h: 200 },  // Left Wall
    { x: 1050, y: 500, w: 50, h: 200 }, // Right Wall
];

export const ArenaClashGame: React.FC<ArenaClashGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputLayerRef = useRef<HTMLDivElement>(null);
    
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
    
    // State Refs (For Loop Closure)
    const gameStateRef = useRef(gameState);
    const timeLeftRef = useRef(timeLeft);
    const onReportProgressRef = useRef(onReportProgress);
    const showTutorialRef = useRef(showTutorial);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);
    useEffect(() => { showTutorialRef.current = showTutorial; }, [showTutorial]);

    // Input Refs
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const mouseRef = useRef({ x: 0, y: 0, down: false });
    // Improved Joystick Ref with Identifier
    const joystickRef = useRef<{ 
        active: boolean, 
        identifier: number | null, 
        x: number, y: number, 
        originX: number, originY: number 
    } | null>(null);
    
    const cameraRef = useRef({ x: 0, y: 0 });
    
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const shakeRef = useRef(0);

    const { playLaserShoot, playExplosion, playPowerUpCollect, playVictory, playGameOver, resumeAudio, playCoin } = audio;
    const { updateHighScore, highScores } = useHighScores();

    // --- INITIALIZATION ---
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_arena_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_arena_tutorial_seen', 'true');
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    // --- NATIVE EVENT LISTENERS FOR TOUCH (FULL SCREEN) ---
    useEffect(() => {
        const inputLayer = inputLayerRef.current;
        const canvas = canvasRef.current;
        if (!inputLayer || !canvas) return;

        const getGameCoords = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect();
            // Scaling logic: Map viewport touch to game resolution (800x600)
            // Note: rect might be smaller/larger than VIEWPORT_* due to CSS object-contain
            const scaleX = VIEWPORT_WIDTH / rect.width;
            const scaleY = VIEWPORT_HEIGHT / rect.height;
            
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault(); 
            if (showTutorialRef.current) return;
            
            // To detect left/right side of screen, we use window width
            const windowWidth = window.innerWidth;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const { x: gameX, y: gameY } = getGameCoords(t.clientX, t.clientY);

                // Split screen logic based on Screen Coordinates, not Game Coordinates
                if (t.clientX < windowWidth / 2) {
                    // Joystick (Left)
                    if (!joystickRef.current || !joystickRef.current.active) {
                        joystickRef.current = { 
                            active: true, 
                            identifier: t.identifier, 
                            originX: gameX, 
                            originY: gameY, 
                            x: gameX, 
                            y: gameY 
                        };
                    }
                } else {
                    // Shoot (Right)
                    mouseRef.current.down = true;
                    mouseRef.current.x = gameX;
                    mouseRef.current.y = gameY;
                }
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (showTutorialRef.current) return;
            
            const windowWidth = window.innerWidth;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const { x: gameX, y: gameY } = getGameCoords(t.clientX, t.clientY);

                // Is this the joystick finger?
                if (joystickRef.current && joystickRef.current.active && t.identifier === joystickRef.current.identifier) {
                    joystickRef.current.x = gameX;
                    joystickRef.current.y = gameY;
                } 
                // Else is it aiming?
                else {
                    if (t.clientX >= windowWidth / 2) {
                        mouseRef.current.x = gameX;
                        mouseRef.current.y = gameY;
                    }
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (joystickRef.current && joystickRef.current.identifier === t.identifier) {
                    joystickRef.current.active = false;
                    joystickRef.current.identifier = null;
                } else {
                    mouseRef.current.down = false;
                }
            }
        };

        inputLayer.addEventListener('touchstart', handleTouchStart, { passive: false });
        inputLayer.addEventListener('touchmove', handleTouchMove, { passive: false });
        inputLayer.addEventListener('touchend', handleTouchEnd, { passive: false });
        inputLayer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        return () => {
            inputLayer.removeEventListener('touchstart', handleTouchStart);
            inputLayer.removeEventListener('touchmove', handleTouchMove);
            inputLayer.removeEventListener('touchend', handleTouchEnd);
            inputLayer.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, []);

    const spawnCharacter = (id: string, name: string, isPlayer: boolean): Character => {
        // Find safe spawn
        let x, y, safe;
        do {
            x = 50 + Math.random() * (CANVAS_WIDTH - 100);
            y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
            safe = true;
            // Check obstacle collision
            for (const obs of OBSTACLES) {
                if (x > obs.x - 30 && x < obs.x + obs.w + 30 && y > obs.y - 30 && y < obs.y + obs.h + 30) safe = false;
            }
        } while (!safe);

        return {
            id, name, x, y, radius: 18,
            color: isPlayer ? COLORS.player : COLORS.enemy,
            hp: 100, maxHp: 100,
            angle: 0, vx: 0, vy: 0, speed: isPlayer ? 5 : 3.5, // Player faster than bots
            weaponDelay: 150, lastShot: 0,
            isDead: false, respawnTimer: 0,
            score: 0, shield: 0, powerups: [],
            targetId: null
        };
    };

    const startGame = () => {
        if (showTutorial) return;
        
        playerRef.current = spawnCharacter('player', 'VOUS', true);
        botsRef.current = [];
        // Spawn 5 bots
        for(let i=0; i<5; i++) {
            botsRef.current.push(spawnCharacter(`bot_${i}`, BOT_NAMES[i % BOT_NAMES.length], false));
        }
        
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
        const type = types[Math.floor(Math.random() * types.length)];
        
        powerUpsRef.current.push({
            id: `pu_${Date.now()}_${Math.random()}`,
            x, y, radius: 12, color: '#fff', type
        });
    };

    // --- UPDATE LOGIC ---
    const update = (dt: number) => {
        const now = Date.now();
        const player = playerRef.current;
        if (!player) return;

        const currentGameState = gameStateRef.current;

        // Match Timer
        if (currentGameState === 'PLAYING' || currentGameState === 'RESPAWNING') {
            const currentTimeLeft = timeLeftRef.current;
            const newTime = Math.max(0, currentTimeLeft - dt / 1000);
            timeLeftRef.current = newTime;

            // Only update UI state every second to avoid re-renders
            if (Math.floor(newTime) !== Math.floor(currentTimeLeft)) {
                setTimeLeft(newTime);
                // Spawn Powerup occasionally
                if (Math.random() < 0.3) spawnPowerUp();
            }
            if (newTime <= 0) {
                endGame();
                return;
            }
        }

        // --- CHARACTERS (Player + Bots) ---
        const allChars = [player, ...botsRef.current];

        allChars.forEach(char => {
            if (char.isDead) {
                if (char.respawnTimer > 0) {
                    char.respawnTimer -= dt;
                    if (char.respawnTimer <= 0) {
                        // Respawn
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

            // Powerup Expiry
            char.powerups = char.powerups.filter(p => p.expiry > now);
            const hasSpeed = char.powerups.some(p => p.type === 'SPEED');
            const hasDamage = char.powerups.some(p => p.type === 'DAMAGE');
            
            const currentSpeed = hasSpeed ? char.speed * 1.5 : char.speed;

            // --- MOVEMENT ---
            if (char.id === 'player') {
                let dx = 0, dy = 0;
                // Case insensitive check
                if (keysRef.current['w'] || keysRef.current['ArrowUp']) dy -= 1;
                if (keysRef.current['s'] || keysRef.current['ArrowDown']) dy += 1;
                if (keysRef.current['a'] || keysRef.current['ArrowLeft']) dx -= 1;
                if (keysRef.current['d'] || keysRef.current['ArrowRight']) dx += 1;

                // Joystick override
                if (joystickRef.current && joystickRef.current.active) {
                    const jx = joystickRef.current.x - joystickRef.current.originX;
                    const jy = joystickRef.current.y - joystickRef.current.originY;
                    const dist = Math.sqrt(jx*jx + jy*jy);
                    if (dist > 10) { // Deadzone
                        dx = jx / dist;
                        dy = jy / dist;
                    }
                }

                // Normalize
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len > 0) { dx /= len; dy /= len; }

                char.x += dx * currentSpeed;
                char.y += dy * currentSpeed;

                // Mouse Aim
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect && !joystickRef.current?.active) {
                    // Only use mouse aim if joystick is NOT active to prevent conflict on touch? 
                    // No, allow right stick/mouse aim.
                    // WorldMouse = ScreenMouse + Camera
                    const worldMouseX = mouseRef.current.x + cameraRef.current.x;
                    const worldMouseY = mouseRef.current.y + cameraRef.current.y;
                    char.angle = Math.atan2(worldMouseY - char.y, worldMouseX - char.x);
                }

                // Shooting
                if (mouseRef.current.down && now - char.lastShot > char.weaponDelay) {
                    fireBullet(char, hasDamage);
                }

            } else {
                // --- BOT AI ---
                // 1. Find Target (Closest Enemy or Powerup)
                let target: {x: number, y: number} | null = null;
                let minDist = 600; // Vision range

                // Check for powerups
                powerUpsRef.current.forEach(pu => {
                    const dist = Math.hypot(pu.x - char.x, pu.y - char.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = pu;
                    }
                });

                // Check for enemies (Player or other Bots)
                allChars.forEach(other => {
                    if (other.id !== char.id && !other.isDead) {
                        const dist = Math.hypot(other.x - char.x, other.y - char.y);
                        if (dist < minDist) {
                            minDist = dist;
                            target = other;
                            char.targetId = other.id;
                        }
                    }
                });

                if (target) {
                    // Move towards target
                    const angle = Math.atan2(target.y - char.y, target.x - char.x);
                    char.angle = angle; // Aim at target
                    
                    // Maintain distance if shooting enemy
                    const stopDist = (target as any).hp ? 200 : 0; // Don't get too close to enemies
                    if (minDist > stopDist) {
                        char.x += Math.cos(angle) * currentSpeed * 0.8;
                        char.y += Math.sin(angle) * currentSpeed * 0.8;
                    } else if (minDist < stopDist - 50) {
                        // Back up
                        char.x -= Math.cos(angle) * currentSpeed * 0.5;
                        char.y -= Math.sin(angle) * currentSpeed * 0.5;
                    }

                    // Shoot if target is enemy
                    if ((target as any).hp && now - char.lastShot > char.weaponDelay * 1.5) {
                        // Raycast check for walls could go here for smarter AI
                        fireBullet(char, hasDamage);
                    }
                } else {
                    // Wander center
                    const angle = Math.atan2(CANVAS_HEIGHT/2 - char.y, CANVAS_WIDTH/2 - char.x);
                    char.x += Math.cos(angle) * currentSpeed * 0.5;
                    char.y += Math.sin(angle) * currentSpeed * 0.5;
                }
            }

            // Wall Collision
            char.x = Math.max(char.radius, Math.min(CANVAS_WIDTH - char.radius, char.x));
            char.y = Math.max(char.radius, Math.min(CANVAS_HEIGHT - char.radius, char.y));

            // Obstacle Collision
            OBSTACLES.forEach(obs => {
                // AABB vs Circle
                const closestX = Math.max(obs.x, Math.min(char.x, obs.x + obs.w));
                const closestY = Math.max(obs.y, Math.min(char.y, obs.y + obs.h));
                const dx = char.x - closestX;
                const dy = char.y - closestY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < char.radius) {
                    const overlap = char.radius - dist;
                    const nx = dx / dist; // Normal
                    const ny = dy / dist;
                    char.x += nx * overlap;
                    char.y += ny * overlap;
                }
            });

            // Powerup Collision
            for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
                const pu = powerUpsRef.current[i];
                if (Math.hypot(char.x - pu.x, char.y - pu.y) < char.radius + pu.radius) {
                    // Collect
                    playPowerUpCollect(pu.type === 'HEALTH' ? 'EXTRA_LIFE' : 'PADDLE_GROW');
                    applyPowerUp(char, pu.type);
                    powerUpsRef.current.splice(i, 1);
                }
            }
        });

        // --- BULLETS ---
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
            const b = bulletsRef.current[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life -= dt;

            let hit = false;

            // Map Bounds
            if (b.x < 0 || b.x > CANVAS_WIDTH || b.y < 0 || b.y > CANVAS_HEIGHT) hit = true;

            // Obstacles
            if (!hit) {
                for (const obs of OBSTACLES) {
                    if (b.x > obs.x && b.x < obs.x + obs.w && b.y > obs.y && b.y < obs.y + obs.h) {
                        hit = true; 
                        spawnParticles(b.x, b.y, b.color, 3);
                        break;
                    }
                }
            }

            // Characters
            if (!hit) {
                for (const char of allChars) {
                    if (char.id !== b.ownerId && !char.isDead) {
                        if (Math.hypot(b.x - char.x, b.y - char.y) < char.radius + b.radius) {
                            hit = true;
                            spawnParticles(b.x, b.y, char.color, 5);
                            takeDamage(char, b.damage, b.ownerId);
                            break;
                        }
                    }
                }
            }

            if (hit || b.life <= 0) bulletsRef.current.splice(i, 1);
        }

        // --- PARTICLES ---
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

        // --- CAMERA ---
        if (player && !player.isDead) {
            // Smooth follow
            const targetX = player.x - VIEWPORT_WIDTH / 2;
            const targetY = player.y - VIEWPORT_HEIGHT / 2;
            
            cameraRef.current.x += (targetX - cameraRef.current.x) * 0.1;
            cameraRef.current.y += (targetY - cameraRef.current.y) * 0.1;
            
            // Shake
            if (shakeRef.current > 0) {
                cameraRef.current.x += (Math.random() - 0.5) * shakeRef.current;
                cameraRef.current.y += (Math.random() - 0.5) * shakeRef.current;
                shakeRef.current *= 0.9;
                if (shakeRef.current < 0.5) shakeRef.current = 0;
            }

            // Clamp Camera
            cameraRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, cameraRef.current.x));
            cameraRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, cameraRef.current.y));
        }

        // --- LEADERBOARD UPDATE ---
        // Sort by score
        const sorted = [...allChars].sort((a, b) => b.score - a.score);
        setLeaderboard(sorted.map(c => ({ name: c.name, score: c.score, isMe: c.id === 'player' })));
    };

    const fireBullet = (char: Character, boosted: boolean) => {
        const damage = boosted ? 25 : 10;
        const speed = BULLET_SPEED;
        const color = boosted ? '#ff00ff' : char.id === 'player' ? COLORS.player : COLORS.bullet;
        
        bulletsRef.current.push({
            id: `b_${Date.now()}_${Math.random()}`,
            x: char.x + Math.cos(char.angle) * 20,
            y: char.y + Math.sin(char.angle) * 20,
            vx: Math.cos(char.angle) * speed,
            vy: Math.sin(char.angle) * speed,
            radius: 4,
            color,
            ownerId: char.id,
            damage,
            life: 2000
        });
        
        char.lastShot = Date.now();
        playLaserShoot();
        if (char.id === 'player') shakeRef.current = 2;
    };

    const takeDamage = (char: Character, dmg: number, attackerId: string) => {
        if (char.shield > 0) {
            char.shield -= dmg;
            if (char.shield < 0) char.shield = 0;
            return; // Shield absorbed
        }

        char.hp -= dmg;
        if (char.hp <= 0 && !char.isDead) {
            // DEATH
            char.isDead = true;
            char.respawnTimer = RESPAWN_TIME;
            char.hp = 0;
            playExplosion();
            spawnParticles(char.x, char.y, char.color, 30, true);

            // Credit Attacker
            const attacker = attackerId === 'player' ? playerRef.current : botsRef.current.find(b => b.id === attackerId);
            if (attacker) {
                attacker.score += 1;
                
                // Add to killfeed
                setKillFeed(prev => [{
                    id: Date.now(),
                    killer: attacker.name,
                    victim: char.name,
                    time: Date.now()
                }, ...prev].slice(0, 5));

                if (attacker.id === 'player') {
                    playCoin();
                    shakeRef.current = 10;
                }
            }

            if (char.id === 'player') {
                setGameState('RESPAWNING');
                gameStateRef.current = 'RESPAWNING';
                playGameOver();
            }
        }
    };

    const applyPowerUp = (char: Character, type: PowerUpType) => {
        const now = Date.now();
        if (type === 'HEALTH') {
            char.hp = Math.min(char.maxHp, char.hp + 50);
        } else if (type === 'SHIELD') {
            char.shield = 50;
        } else {
            // Speed or Damage
            char.powerups.push({ type, expiry: now + 10000 });
        }
    };

    const spawnParticles = (x: number, y: number, color: string, count: number, explosion = false) => {
        for (let i = 0; i < count; i++) {
            const speed = explosion ? Math.random() * 5 : Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            particlesRef.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                maxLife: 50,
                color,
                size: Math.random() * 3 + 1
            });
        }
    };

    const endGame = () => {
        setGameState('GAMEOVER');
        gameStateRef.current = 'GAMEOVER';
        playVictory();
        
        const player = playerRef.current;
        if (player) {
            const finalScore = player.score;
            updateHighScore('arenaclash', finalScore);
            if (onReportProgressRef.current) onReportProgressRef.current('score', finalScore);
            
            const coins = finalScore * 10 + 50; // Bonus for playing
            addCoins(coins);
            setEarnedCoins(coins);
        }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        // Clear background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        const cam = cameraRef.current;

        ctx.save();
        ctx.translate(-cam.x, -cam.y);

        // Draw Grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 2;
        for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
        }

        // Draw Obstacles
        ctx.shadowColor = COLORS.wall;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = COLORS.wall;
        ctx.fillStyle = 'rgba(176, 0, 255, 0.1)';
        OBSTACLES.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        });
        ctx.shadowBlur = 0;

        // Draw Powerups
        powerUpsRef.current.forEach(pu => {
            let color = '#fff';
            if (pu.type === 'HEALTH') color = COLORS.powerup.health;
            if (pu.type === 'SHIELD') color = COLORS.powerup.shield;
            if (pu.type === 'SPEED') color = COLORS.powerup.speed;
            if (pu.type === 'DAMAGE') color = COLORS.powerup.damage;

            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI*2);
            ctx.fill();
            
            // Icon logic simplified
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(pu.type[0], pu.x, pu.y);
        });

        // Draw Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw Bullets
        bulletsRef.current.forEach(b => {
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw Characters
        [playerRef.current, ...botsRef.current].forEach(char => {
            if (!char || char.isDead) return;

            // Shield visual
            if (char.shield > 0) {
                ctx.strokeStyle = COLORS.powerup.shield;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(char.x, char.y, char.radius + 5, 0, Math.PI*2);
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(char.x, char.y);
            ctx.rotate(char.angle);

            // Body
            ctx.fillStyle = char.color;
            ctx.shadowColor = char.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, char.radius, 0, Math.PI*2);
            ctx.fill();

            // Gun
            ctx.fillStyle = '#fff';
            ctx.fillRect(char.radius - 5, -3, 10, 6);

            ctx.restore();

            // HP Bar
            const hpPct = char.hp / char.maxHp;
            ctx.fillStyle = '#000';
            ctx.fillRect(char.x - 15, char.y - 30, 30, 4);
            ctx.fillStyle = hpPct > 0.5 ? '#0f0' : '#f00';
            ctx.fillRect(char.x - 15, char.y - 30, 30 * hpPct, 4);

            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '10px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText(char.name, char.x, char.y - 35);
        });

        ctx.restore();

        // DRAW JOYSTICK HUD (Visual Feedback)
        if (joystickRef.current && joystickRef.current.active) {
            const { originX, originY, x, y } = joystickRef.current;
            
            // Outer Ring (Glow)
            ctx.save();
            ctx.beginPath();
            ctx.arc(originX, originY, 50, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 20;
            ctx.stroke();
            
            // Inner Base
            ctx.beginPath();
            ctx.arc(originX, originY, 15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
            ctx.fill();

            // Stick Line
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Stick Knob
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.8)';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    };

    const loop = () => {
        const now = Date.now();
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;

        update(dt);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    // --- CONTROLS ---
    useEffect(() => {
        const kd = (e: KeyboardEvent) => { 
            keysRef.current[e.key.toLowerCase()] = true; 
            keysRef.current[e.code] = true;
        };
        const ku = (e: KeyboardEvent) => { 
            keysRef.current[e.key.toLowerCase()] = false; 
            keysRef.current[e.code] = false;
        };
        window.addEventListener('keydown', kd);
        window.addEventListener('keyup', ku);
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
        <div ref={inputLayerRef} className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4 select-none pointer-events-auto">
            {/* Background */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="arenaclash" onClose={() => setShowTutorial(false)} />}

            {/* HEADER */}
            <div className="w-full max-w-2xl flex items-center justify-between z-20 mb-2 shrink-0 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-3 bg-gray-900/80 rounded-xl text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 pointer-events-auto active:scale-95 transition-all shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,217,255,0.5)] tracking-widest">NEON ARENA</h1>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={toggleTutorial} className="p-3 bg-gray-900/80 rounded-xl text-yellow-400 border border-yellow-500/30 hover:bg-yellow-900/50 active:scale-95 transition-all"><HelpCircle size={20} /></button>
                </div>
            </div>

            {/* HUD */}
            <div className="w-full max-w-4xl flex gap-4 z-20 h-full relative pointer-events-none">
                
                {/* Left: Killfeed */}
                <div className="absolute top-0 left-0 w-48 flex flex-col gap-1 pointer-events-none">
                    {killFeed.map(k => (
                        <div key={k.id} className="text-xs bg-black/60 px-2 py-1 rounded text-white animate-in fade-in slide-in-from-left-4">
                            <span className={k.killer === 'VOUS' ? 'text-cyan-400 font-bold' : 'text-pink-400'}>{k.killer}</span>
                            <span className="text-gray-400 mx-1">killed</span>
                            <span className={k.victim === 'VOUS' ? 'text-cyan-400 font-bold' : 'text-pink-400'}>{k.victim}</span>
                        </div>
                    ))}
                </div>

                {/* Center: Timer & Respawner */}
                <div className="flex-1 flex flex-col items-center pointer-events-none">
                    <div className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
                    </div>
                    {gameState === 'RESPAWNING' && (
                        <div className="mt-4 bg-red-900/80 px-4 py-2 rounded text-red-200 font-bold animate-pulse border border-red-500">
                            RESPAWN DANS {Math.ceil(playerRef.current?.respawnTimer! / 1000)}s
                        </div>
                    )}
                </div>

                {/* Right: Leaderboard */}
                <div className="absolute top-0 right-0 w-48 bg-gray-900/80 p-2 rounded-lg border border-white/10 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
                        <Trophy size={14} className="text-yellow-400"/>
                        <span className="text-xs font-bold text-white">CLASSEMENT</span>
                    </div>
                    {leaderboard.map((p, i) => (
                        <div key={i} className={`flex justify-between text-xs mb-1 ${p.isMe ? 'text-cyan-400 font-bold bg-cyan-900/30 rounded px-1' : 'text-gray-300'}`}>
                            <span>{i+1}. {p.name}</span>
                            <span>{p.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CANVAS */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <canvas 
                    ref={canvasRef}
                    width={VIEWPORT_WIDTH}
                    height={VIEWPORT_HEIGHT}
                    className="bg-black/80 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] rounded-xl pointer-events-auto cursor-crosshair max-w-full max-h-full object-contain"
                    onMouseDown={(e) => { 
                        if(!showTutorial) { 
                            mouseRef.current.down = true; 
                            const { x: scaleX, y: scaleY, rect } = { 
                                x: VIEWPORT_WIDTH / e.currentTarget.getBoundingClientRect().width, 
                                y: VIEWPORT_HEIGHT / e.currentTarget.getBoundingClientRect().height, 
                                rect: e.currentTarget.getBoundingClientRect() 
                            };
                            if(rect) {
                                mouseRef.current.x = (e.clientX - rect.left) * scaleX;
                                mouseRef.current.y = (e.clientY - rect.top) * scaleY;
                            }
                        } 
                    }}
                    onMouseUp={() => mouseRef.current.down = false}
                    onMouseMove={handleMouseMove}
                />
            </div>

            {/* OVERLAYS */}
            {gameState === 'MENU' && !showTutorial && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30 pointer-events-auto">
                    <Crosshair size={64} className="text-cyan-400 animate-spin-slow mb-4 drop-shadow-[0_0_15px_#00f3ff]"/>
                    <h2 className="text-5xl font-black italic text-white tracking-widest drop-shadow-lg mb-2">NEON ARENA</h2>
                    <p className="text-purple-300 font-bold tracking-widest mb-8">ONLINE DEATHMATCH</p>
                    <button onClick={startGame} className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,217,255,0.6)] border border-white/20 flex items-center gap-2">
                        <Play fill="white"/> RECHERCHER UNE PARTIE
                    </button>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 animate-in zoom-in fade-in pointer-events-auto">
                    <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_20px_gold]"/>
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 italic mb-4">MATCH TERMINÉ</h2>
                    
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-white/10 w-full max-w-sm mb-6">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                            <span className="text-gray-400 text-sm font-bold">RANG</span>
                            <span className="text-gray-400 text-sm font-bold">JOUEUR</span>
                            <span className="text-gray-400 text-sm font-bold">KILLS</span>
                        </div>
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <div key={i} className={`flex justify-between items-center mb-2 ${p.isMe ? 'text-cyan-400 font-bold text-lg' : 'text-white'}`}>
                                <span>#{i+1}</span>
                                <span>{p.name}</span>
                                <span>{p.score}</span>
                            </div>
                        ))}
                    </div>

                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}
                    
                    <button onClick={startGame} className="px-10 py-4 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                        <RefreshCw size={24} /> REJOUER
                    </button>
                </div>
            )}
            
            {/* Mobile Controls Hint */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none sm:hidden">
                <div className="flex gap-8 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><div className="w-8 h-8 rounded-full border border-cyan-500/50"></div> BOUGER (GAUCHE)</span>
                    <span className="flex items-center gap-1"><div className="w-8 h-8 rounded-full bg-red-500/30"></div> VISER (DROITE)</span>
                </div>
            </div>
        </div>
    );
};
