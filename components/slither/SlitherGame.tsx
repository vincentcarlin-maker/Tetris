
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Zap, HelpCircle, User, Globe, Play, ArrowLeft, Loader2, LogOut, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, Shield, Skull } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency, SlitherSkin, SlitherAccessory } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';

// --- TYPES ---
interface Point { x: number; y: number; }
interface Worm {
    id: string;
    name: string;
    segments: Point[];
    angle: number;
    color: string;
    skin?: SlitherSkin; 
    accessory?: SlitherAccessory;
    score: number;
    isBoost: boolean;
    isDead: boolean;
    radius: number;
    aiTargetAngle?: number;
    aiDecisionTimer?: number;
}
interface Food { id: string; x: number; y: number; val: number; color: string; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; }

// --- CONSTANTS ---
const WORLD_SIZE = 2000;
const INITIAL_LENGTH = 15;
const SEGMENT_DISTANCE = 5; 
const BASE_SPEED = 4.2; 
const BOOST_SPEED = 8.5; 
const TURN_SPEED = 0.18; 
const RADAR_SIZE = 120;
const DOUBLE_TAP_DELAY = 300; 
const JOYSTICK_DEADZONE = 3; 

const COLORS = ['#00f3ff', '#ff00ff', '#9d00ff', '#ffe600', '#00ff9d', '#ff4d4d', '#ff9f43'];

export const SlitherGame: React.FC<{ onBack: () => void, audio: any, addCoins: any, mp: any, onReportProgress?: any }> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { username, currentAvatarId, currentSlitherSkinId, slitherSkinsCatalog, currentSlitherAccessoryId, slitherAccessoriesCatalog } = useCurrency();

    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'DYING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState({ current: 0, total: 0 });
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [isBoosting, setIsBoosting] = useState(false);

    // Logic Refs
    const playerWormRef = useRef<Worm | null>(null);
    const othersRef = useRef<Worm[]>([]);
    const foodRef = useRef<Food[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef<Point>({ x: 0, y: 0 });
    const shakeRef = useRef(0);
    
    // Joystick Refs
    const joystickOriginRef = useRef<Point | null>(null);
    const joystickActiveRef = useRef(false);
    const joystickVectorRef = useRef<Point>({ x: 0, y: 0 });

    const lastTapTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const lastNetworkUpdateRef = useRef<number>(0);
    const boostCounterRef = useRef<number>(0);

    const { playCoin, playMove, playExplosion, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    // --- INITIALIZATION ---
    const spawnWorm = (id: string, name: string, color: string, skin?: SlitherSkin, accessory?: SlitherAccessory): Worm => {
        const x = Math.random() * (WORLD_SIZE - 400) + 200;
        const y = Math.random() * (WORLD_SIZE - 400) + 200;
        const segments: Point[] = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
            segments.push({ x: x - i * SEGMENT_DISTANCE, y });
        }
        return { 
            id, name, segments, angle: Math.random() * Math.PI * 2, color, skin, accessory, 
            score: 0, isBoost: false, isDead: false, radius: 12,
            aiTargetAngle: Math.random() * Math.PI * 2,
            aiDecisionTimer: 0
        };
    };

    const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particlesRef.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2
            });
        }
    };

    const spawnFood = (count: number = 1) => {
        for (let i = 0; i < count; i++) {
            foodRef.current.push({
                id: `f_${Date.now()}_${Math.random()}`,
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                val: Math.floor(Math.random() * 3) + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    };

    const startGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        const playerSkin = slitherSkinsCatalog.find(s => s.id === currentSlitherSkinId) || slitherSkinsCatalog[0];
        const playerAcc = slitherAccessoriesCatalog.find(a => a.id === currentSlitherAccessoryId);
        
        playerWormRef.current = spawnWorm(mp.peerId || 'player', username, playerSkin.primaryColor, playerSkin, playerAcc);
        foodRef.current = [];
        particlesRef.current = [];
        spawnFood(300);
        othersRef.current = mode === 'SOLO' ? Array.from({length: 12}, (_, i) => spawnWorm(`bot_${i}`, `CyberBot ${i+1}`, COLORS[Math.floor(Math.random() * COLORS.length)])) : [];
        setGameState('PLAYING');
        setScore(0);
        setRank({ current: 0, total: 0 });
        setEarnedCoins(0);
        setIsBoosting(false);
        resumeAudio();
        lastTimeRef.current = Date.now();
        if (onReportProgress) onReportProgress('play', 1);
    };

    const updateWormMovement = (worm: Worm, targetAngle: number, speed: number) => {
        let angleDiff = targetAngle - worm.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        worm.angle += angleDiff * TURN_SPEED;

        const head = worm.segments[0];
        const nextX = head.x + Math.cos(worm.angle) * speed;
        const nextY = head.y + Math.sin(worm.angle) * speed;
        
        const newSegments = [{ x: nextX, y: nextY }];

        let prev = newSegments[0];
        for (let i = 1; i < worm.segments.length; i++) {
            const curr = worm.segments[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const angle = Math.atan2(dy, dx);

            newSegments.push({
                x: prev.x + Math.cos(angle) * SEGMENT_DISTANCE,
                y: prev.y + Math.sin(angle) * SEGMENT_DISTANCE
            });
            prev = newSegments[i];
        }
        worm.segments = newSegments;
    };

    const isWormCollidingAt = (x: number, y: number, radius: number, excludeId: string, allWorms: Worm[]) => {
        for (const worm of allWorms) {
            if (worm.isDead) continue;
            const startIdx = worm.id === excludeId ? 10 : 0;
            for (let i = startIdx; i < worm.segments.length; i += 2) { 
                const seg = worm.segments[i];
                const distSq = (x - seg.x)**2 + (y - seg.y)**2;
                if (distSq < (radius + 15)**2) return true;
            }
        }
        return false;
    };

    // --- UPDATE LOOP ---
    const update = (dt: number) => {
        if (gameState === 'MENU' || gameState === 'GAMEOVER') return;
        
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        if (shakeRef.current > 0) shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;

        const player = playerWormRef.current;
        if (!player) return;

        if (gameState === 'DYING') {
            cameraRef.current.x = player.segments[0].x;
            cameraRef.current.y = player.segments[0].y;
            return;
        }

        let playerTargetAngle = player.angle;
        if (joystickActiveRef.current) {
            const vx = joystickVectorRef.current.x;
            const vy = joystickVectorRef.current.y;
            const dist = Math.sqrt(vx * vx + vy * vy);
            if (dist > JOYSTICK_DEADZONE) {
                playerTargetAngle = Math.atan2(vy, vx);
            }
        }

        const canBoost = player.segments.length > INITIAL_LENGTH;
        if (!canBoost && isBoosting) setIsBoosting(false);

        player.isBoost = isBoosting;
        const currentSpeed = player.isBoost ? BOOST_SPEED : BASE_SPEED;
        
        if (player.isBoost) {
            boostCounterRef.current++;
            if (boostCounterRef.current % 10 === 0) {
                player.segments.pop();
                player.score = Math.max(0, player.score - 2);
                setScore(player.score);
                const tail = player.segments[player.segments.length - 1];
                foodRef.current.push({ id: `boost_f_${Date.now()}`, x: tail.x, y: tail.y, val: 1, color: player.skin?.primaryColor || player.color });
            }
        }

        updateWormMovement(player, playerTargetAngle, currentSpeed);

        const head = player.segments[0];
        if (head.x < 0 || head.x > WORLD_SIZE || head.y < 0 || head.y > WORLD_SIZE) {
            handleDeath();
        }

        for (let i = foodRef.current.length - 1; i >= 0; i--) {
            const f = foodRef.current[i];
            const distSq = (head.x - f.x)**2 + (head.y - f.y)**2;
            if (distSq < 25**2) {
                player.score += f.val * 5;
                setScore(player.score);
                playCoin();
                for (let j = 0; j < f.val; j++) {
                    const tail = player.segments[player.segments.length - 1];
                    player.segments.push({ ...tail });
                }
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId: f.id });
                if (foodRef.current.length < 250) spawnFood(50);
            }
        }

        othersRef.current.forEach(other => {
            if (other.isDead) return;
            for (let sIdx = 0; sIdx < other.segments.length; sIdx += 2) {
                if (sIdx > 3) {
                    const seg = other.segments[sIdx];
                    const dSq = (head.x - seg.x)**2 + (head.y - seg.y)**2;
                    if (dSq < 18**2) {
                        handleDeath();
                        return;
                    }
                }
            }
        });

        cameraRef.current.x = head.x;
        cameraRef.current.y = head.y;

        if (gameMode === 'SOLO') {
            const allWorms = [player, ...othersRef.current];
            othersRef.current.forEach(bot => {
                if (bot.isDead) return;
                const bHead = bot.segments[0];
                const lookAhead = 150;
                const rays = [0, -0.5, 0.5, -1.0, 1.0];
                let collisionFound = false;
                let clearAngle = bot.angle;

                const margin = 120;
                if (bHead.x < margin) { clearAngle = 0; collisionFound = true; }
                else if (bHead.x > WORLD_SIZE - margin) { clearAngle = Math.PI; collisionFound = true; }
                else if (bHead.y < margin) { clearAngle = Math.PI / 2; collisionFound = true; }
                else if (bHead.y > WORLD_SIZE - margin) { clearAngle = -Math.PI / 2; collisionFound = true; }
                
                if (!collisionFound) {
                    for (let angleOff of rays) {
                        const testAngle = bot.angle + angleOff;
                        const tx = bHead.x + Math.cos(testAngle) * lookAhead;
                        const ty = bHead.y + Math.sin(testAngle) * lookAhead;
                        if (isWormCollidingAt(tx, ty, bot.radius, bot.id, allWorms)) {
                            if (angleOff === 0) collisionFound = true;
                        } else if (collisionFound) {
                            clearAngle = testAngle;
                            break;
                        }
                    }
                }

                if (!collisionFound) {
                    bot.aiDecisionTimer = (bot.aiDecisionTimer || 0) - 1;
                    if (bot.aiDecisionTimer <= 0) {
                        let closestF = null, minDistSq = 600**2;
                        foodRef.current.forEach(f => {
                            const dSq = (bHead.x - f.x)**2 + (bHead.y - f.y)**2;
                            if (dSq < minDistSq) { minDistSq = dSq; closestF = f; }
                        });
                        if (closestF) {
                            bot.aiTargetAngle = Math.atan2(closestF.y - bHead.y, closestF.x - bHead.x);
                            bot.aiDecisionTimer = 40 + Math.random() * 40;
                        } else {
                            bot.aiTargetAngle = bot.angle + (Math.random() - 0.5) * 0.5;
                            bot.aiDecisionTimer = 100;
                        }
                    }
                } else {
                    bot.aiTargetAngle = clearAngle;
                    bot.aiDecisionTimer = 10;
                    bot.isBoost = true;
                }

                updateWormMovement(bot, bot.aiTargetAngle || bot.angle, bot.isBoost ? BOOST_SPEED : BASE_SPEED);
                if (!collisionFound && Math.random() > 0.95) bot.isBoost = false;

                const distToPlayerHead = (bHead.x - head.x)**2 + (bHead.y - head.y)**2;
                if (distToPlayerHead < 25**2) {
                     handleDeath();
                } else {
                    for (let pIdx = 0; pIdx < player.segments.length; pIdx += 2) {
                        if (pIdx > 3) {
                            const pSeg = player.segments[pIdx];
                            const dSq = (bHead.x - pSeg.x)**2 + (bHead.y - pSeg.y)**2;
                            if (dSq < 18**2) {
                                bot.isDead = true;
                                spawnParticles(bHead.x, bHead.y, bot.color, 15);
                                bot.segments.forEach((s, idx) => { 
                                    if(idx % 3 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 2, color: bot.skin?.primaryColor || bot.color }); 
                                });
                                break;
                            }
                        }
                    }
                }
            });
            othersRef.current = othersRef.current.filter(b => !b.isDead);
            if (othersRef.current.length < 12) othersRef.current.push(spawnWorm(`bot_${Date.now()}_${Math.random()}`, "Bot " + (Math.floor(Math.random()*100)), COLORS[Math.floor(Math.random()*COLORS.length)]));
        }

        if (gameMode === 'ONLINE' && Date.now() - lastNetworkUpdateRef.current > 50) {
            mp.sendData({ type: 'SLITHER_UPDATE', worm: player });
            lastNetworkUpdateRef.current = Date.now();
        }

        const allWorms = [player, ...othersRef.current];
        const sortedWorms = [...allWorms].sort((a,b) => b.score - a.score);
        const myRankIndex = sortedWorms.findIndex(w => w.id === player.id);
        setRank({ current: myRankIndex + 1, total: sortedWorms.length });
        const lb = sortedWorms.slice(0, 10).map(w => ({ name: w.name, score: w.score, isMe: w.id === player.id }));
        setLeaderboard(lb);
    };

    const handleDeath = () => {
        const player = playerWormRef.current;
        if (!player || player.isDead || gameState === 'DYING') return;
        
        player.isDead = true;
        setGameState('DYING');
        setIsBoosting(false);
        joystickActiveRef.current = false;
        joystickOriginRef.current = null;
        
        const head = player.segments[0];
        spawnParticles(head.x, head.y, player.skin?.primaryColor || player.color, 60);
        shakeRef.current = 15;
        
        playExplosion();
        
        setTimeout(() => {
            setGameState('GAMEOVER');
            playGameOver();
            updateHighScore('slither', player.score);
            const coins = Math.floor(player.score / 50);
            if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            if (onReportProgress) onReportProgress('score', player.score);
        }, 1500);
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const player = playerWormRef.current;
        if (!player) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        const cam = cameraRef.current;
        let offsetX = -cam.x + ctx.canvas.width / 2;
        let offsetY = -cam.y + ctx.canvas.height / 2;
        
        if (shakeRef.current > 0) {
            offsetX += (Math.random() - 0.5) * shakeRef.current;
            offsetY += (Math.random() - 0.5) * shakeRef.current;
        }

        ctx.save();
        ctx.translate(offsetX, offsetY);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= WORLD_SIZE; i += 100) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        foodRef.current.forEach(f => {
            const grad = ctx.createRadialGradient(f.x - 2, f.y - 2, 0, f.x, f.y, 4 + f.val);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, f.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.val, 0, Math.PI * 2); ctx.fill();
        });

        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
        });

        othersRef.current.forEach(worm => drawWorm(ctx, worm));
        if (gameState !== 'DYING') drawWorm(ctx, player);
        if (gameState === 'PLAYING') drawDirectionArrow(ctx, player);
        ctx.restore();
    };

    const drawDirectionArrow = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        if (worm.isDead) return;
        const head = worm.segments[0];
        const arrowDist = 80;
        const arrowSize = 12;
        const tx = head.x + Math.cos(worm.angle) * arrowDist;
        const ty = head.y + Math.sin(worm.angle) * arrowDist;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(worm.angle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowSize, arrowSize);
        ctx.stroke();
        ctx.restore();
    };

    const drawAccessory = (ctx: CanvasRenderingContext2D, head: Point, angle: number, radius: number, acc: SlitherAccessory) => {
        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(angle);
        
        const type = acc.type;
        const color = acc.color;
        const sec = acc.secondaryColor || '#ffffff';

        ctx.shadowBlur = 15;
        ctx.shadowColor = color;

        if (type === 'CROWN') {
            // Gold Crown with 3D ring
            const w = radius * 2;
            const h = radius * 1.5;
            
            // Back parts of crown points
            ctx.fillStyle = acc.secondaryColor || '#d97706';
            ctx.beginPath();
            ctx.moveTo(-w/2, -radius);
            ctx.lineTo(-w/2, -radius - 15);
            ctx.lineTo(-w/4, -radius - 5);
            ctx.lineTo(0, -radius - 15);
            ctx.lineTo(w/4, -radius - 5);
            ctx.lineTo(w/2, -radius - 15);
            ctx.lineTo(w/2, -radius);
            ctx.fill();

            // Main ring (gradient for 3D)
            const ringGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
            ringGrad.addColorStop(0, '#92400e');
            ringGrad.addColorStop(0.5, color);
            ringGrad.addColorStop(1, '#92400e');
            ctx.fillStyle = ringGrad;
            ctx.beginPath();
            ctx.ellipse(0, -radius, w/2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Central Jewel
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -radius - 10, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ef4444';
            ctx.stroke();
        } 
        else if (type === 'HALO') {
            // Floating 3D ring
            ctx.shadowBlur = 20;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, -radius - 20, radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Glow overlay
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        else if (type === 'HORNS') {
            // 3D Devil Horns
            const drawHorn = (side: number) => {
                ctx.save();
                ctx.scale(side, 1);
                ctx.translate(radius * 0.5, -radius * 0.5);
                
                const grad = ctx.createLinearGradient(0, 0, 10, -20);
                grad.addColorStop(0, sec);
                grad.addColorStop(1, color);
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(15, -5, 10, -25);
                ctx.quadraticCurveTo(0, -15, -5, 5);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.stroke();
                ctx.restore();
            };
            drawHorn(1);
            drawHorn(-1);
        }
        else if (type === 'VISOR') {
            // Cyber Visor wrapping eyes
            ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(radius * 0.6, 0, radius * 0.8, radius * 1.2, 0, -Math.PI/2, Math.PI/2);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
            // Highlight
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(radius * 0.8, -radius * 0.5);
            ctx.lineTo(radius * 0.8, radius * 0.5);
            ctx.stroke();
        }
        else if (type === 'VIKING') {
            // 3D Viking helmet with horns
            const helmetGrad = ctx.createRadialGradient(0, -radius, 0, 0, -radius, radius);
            helmetGrad.addColorStop(0, sec);
            helmetGrad.addColorStop(1, '#475569');
            ctx.fillStyle = helmetGrad;
            ctx.beginPath();
            ctx.arc(0, -radius * 0.5, radius * 0.9, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Horns
            const drawVHorn = (side: number) => {
                ctx.save();
                ctx.scale(side, 1);
                ctx.translate(radius * 0.7, -radius * 0.8);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(10, -5, 15, -20);
                ctx.lineTo(5, -5);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            };
            drawVHorn(1);
            drawVHorn(-1);
        }
        else if (type === 'HAT') {
            // Classic Top Hat 3D
            ctx.fillStyle = color;
            // Brim
            ctx.beginPath();
            ctx.ellipse(0, -radius * 0.6, radius * 1.3, radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Top part
            ctx.fillStyle = sec;
            ctx.fillRect(-radius * 0.7, -radius * 1.8, radius * 1.4, radius * 1.2);
            ctx.strokeRect(-radius * 0.7, -radius * 1.8, radius * 1.4, radius * 1.2);
            // Band
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-radius * 0.7, -radius * 0.8, radius * 1.4, 6);
        }
        else if (type === 'HEADPHONES') {
            // Cool cyber headphones
            const drawEar = (side: number) => {
                ctx.save();
                ctx.translate(0, radius * side * 0.8);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                // Glow inner
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(0,0, radius * 0.2, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            };
            drawEar(1);
            drawEar(-1);
            // Connecting band
            ctx.strokeStyle = sec;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.1, -Math.PI/2, Math.PI/2, true);
            ctx.stroke();
        }
        else if (type === 'CAT_EARS') {
            const drawCatEar = (side: number) => {
                ctx.save();
                ctx.scale(1, side);
                ctx.translate(0, -radius * 0.8);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(0, -15);
                ctx.lineTo(10, 0);
                ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.moveTo(-5, 0);
                ctx.lineTo(0, -8);
                ctx.lineTo(5, 0);
                ctx.fill();
                ctx.restore();
            };
            drawCatEar(1);
            drawCatEar(-1);
        }
        else if (type === 'NINJA') {
            // Ninja bandana with tails
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.rect(-radius, -radius * 0.3, radius * 2, radius * 0.6);
            ctx.fill();
            // Tails at back
            ctx.save();
            ctx.translate(-radius, 0);
            ctx.rotate(Math.sin(Date.now()/200) * 0.2);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(-20, -5);
            ctx.lineTo(-15, 5);
            ctx.fill();
            ctx.restore();
            // Metal plate
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(radius * 0.5, -4, 10, 8);
        }

        ctx.restore();
    };

    const drawWorm = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        const segs = worm.segments;
        if (segs.length < 2) return;
        const skin = worm.skin;
        const pattern = skin?.pattern || 'solid';
        const primary = skin?.primaryColor || worm.color;
        const secondary = skin?.secondaryColor || primary;
        const glow = skin?.glowColor || primary;
        const radius = worm.radius || 12;

        ctx.save();
        // DRAW BODY (Reverse order to have head on top)
        for (let i = segs.length - 1; i >= 0; i--) {
            const seg = segs[i];
            const isHead = i === 0;
            const segmentColor = pattern === 'solid' ? primary : 
                               pattern === 'stripes' ? (Math.floor(i / 3) % 2 === 0 ? primary : secondary) :
                               pattern === 'dots' ? (i % 5 === 0 ? secondary : primary) :
                               pattern === 'checker' ? (i % 2 === 0 ? primary : secondary) :
                               pattern === 'rainbow' ? `hsl(${(i * 10 + Date.now() / 20) % 360}, 100%, 60%)` :
                               primary;

            // 3D EFFECT PER SEGMENT
            ctx.shadowBlur = isHead ? 20 : 5;
            ctx.shadowColor = worm.isBoost ? '#fff' : glow;
            
            // Sphere shading gradient
            const bodyGrad = ctx.createRadialGradient(
                seg.x - radius * 0.3, 
                seg.y - radius * 0.3, 
                radius * 0.1, 
                seg.x, 
                seg.y, 
                radius
            );
            
            if (pattern === 'metallic') {
                bodyGrad.addColorStop(0, '#fff');
                bodyGrad.addColorStop(0.3, primary);
                bodyGrad.addColorStop(0.6, secondary);
                bodyGrad.addColorStop(1, '#000');
            } else {
                bodyGrad.addColorStop(0, '#fff'); // Spéculaire
                bodyGrad.addColorStop(0.2, segmentColor);
                bodyGrad.addColorStop(1, 'rgba(0,0,0,0.6)'); // Ombre propre
            }

            ctx.fillStyle = bodyGrad;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2); ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Specular Highlight (The 3D "white dot")
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); 
            ctx.ellipse(seg.x - radius * 0.35, seg.y - radius * 0.35, radius * 0.3, radius * 0.2, Math.PI / 4, 0, Math.PI * 2); 
            ctx.fill();
        }

        const head = segs[0];

        // DRAW ACCESSORY
        if (worm.accessory && worm.accessory.id !== 'sa_none') {
            drawAccessory(ctx, head, worm.angle, radius, worm.accessory);
        }

        // EYES
        const eyeOffset = 8;
        const eyeAngle = worm.angle;
        const eyePositions = [
            { x: head.x + Math.cos(eyeAngle + 0.6) * eyeOffset, y: head.y + Math.sin(eyeAngle + 0.6) * eyeOffset }, 
            { x: head.x + Math.cos(eyeAngle - 0.6) * eyeOffset, y: head.y + Math.sin(eyeAngle - 0.6) * eyeOffset }
        ];
        eyePositions.forEach(pos => {
            const eyeGrad = ctx.createRadialGradient(pos.x - 2, pos.y - 2, 1, pos.x, pos.y, 6);
            eyeGrad.addColorStop(0, '#fff'); 
            eyeGrad.addColorStop(0.8, '#eee'); 
            eyeGrad.addColorStop(1, '#999');
            ctx.fillStyle = eyeGrad; 
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; 
            ctx.beginPath(); ctx.arc(pos.x + Math.cos(eyeAngle) * 2, pos.y + Math.sin(eyeAngle) * 2, 3, 0, Math.PI * 2); ctx.fill();
        });

        // NAME TAG
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
        ctx.font = 'bold 14px Rajdhani'; 
        ctx.textAlign = 'center';
        ctx.fillText(worm.name, head.x, head.y - (worm.accessory ? 45 : 35));
        ctx.restore();
    };

    const loop = (time: number) => {
        const dt = time - lastTimeRef.current;
        lastTimeRef.current = time;
        update(dt);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameState, gameMode]);

    const handleInputStart = (x: number, y: number) => {
        if (gameState !== 'PLAYING') return;
        const now = Date.now();
        const diff = now - lastTapTimeRef.current;
        if (diff < DOUBLE_TAP_DELAY) { setIsBoosting(prev => !prev); playMove(); }
        lastTapTimeRef.current = now;
        joystickOriginRef.current = { x, y };
        joystickActiveRef.current = true;
        joystickVectorRef.current = { x: 0, y: 0 };
        resumeAudio();
    };

    const handleInputMove = (x: number, y: number) => {
        if (!joystickActiveRef.current || !joystickOriginRef.current) return;
        joystickVectorRef.current = { x: x - joystickOriginRef.current.x, y: y - joystickOriginRef.current.y };
    };

    const handleInputEnd = () => { joystickActiveRef.current = false; joystickOriginRef.current = null; };

    const handleLocalBack = () => {
        if (gameState === 'PLAYING' || gameState === 'DYING') { if (window.confirm("Quitter la partie en cours ?")) onBack(); } else onBack();
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#020205] relative overflow-hidden font-sans select-none touch-none">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight} 
                className="w-full h-full"
                onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                onMouseUp={handleInputEnd}
                onMouseLeave={handleInputEnd}
                onTouchMove={(e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchStart={(e) => handleInputStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handleInputEnd}
            />

            <div className="absolute top-6 left-6 z-20 flex gap-6 items-center pointer-events-none">
                <button onClick={handleLocalBack} className="p-3 bg-gray-900/90 rounded-2xl text-white pointer-events-auto border border-white/10 hover:bg-white/20 active:scale-95 transition-all shadow-xl"><Home size={24}/></button>
                <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-400 font-black tracking-[0.3em] uppercase">Masse Néon</span>
                    <span className="text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">{score}</span>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase mt-1">Rang: {rank.current} / {rank.total}</span>
                </div>
            </div>

            {isBoosting && gameState === 'PLAYING' && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-indigo-600/40 border border-indigo-400 rounded-full flex items-center gap-2 animate-pulse">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-black tracking-widest text-white">TURBO ACTIF</span>
                </div>
            )}

            <div className="absolute top-6 right-6 z-20 bg-black/20 border border-white/5 p-2.5 rounded-2xl w-36 backdrop-blur-md shadow-2xl">
                <h4 className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5 flex items-center gap-2"><Trophy size={10}/> Records</h4>
                {leaderboard.map((u, i) => (
                    <div key={i} className={`flex justify-between text-[9px] mb-1 ${u.isMe ? 'text-cyan-400 font-black animate-pulse' : 'text-gray-400'}`}>
                        <span className="truncate w-20">{i+1}. {u.name}</span>
                        <span className="font-mono">{u.score}</span>
                    </div>
                ))}
            </div>

            {gameState === 'PLAYING' && (
                <div 
                    className="absolute bottom-8 right-8 z-30 rounded-full bg-black/70 border-2 border-white/20 shadow-2xl backdrop-blur-md overflow-hidden pointer-events-none"
                    style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
                >
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '25% 25%' }}></div>
                    {othersRef.current.map(worm => (
                        <div key={worm.id} className="absolute rounded-full bg-pink-500 shadow-[0_0_4px_pink]" style={{ width: 4, height: 4, left: (worm.segments[0].x / WORLD_SIZE) * RADAR_SIZE - 2, top: (worm.segments[0].y / WORLD_SIZE) * RADAR_SIZE - 2 }} />
                    ))}
                    {playerWormRef.current && (
                        <div className="absolute rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" style={{ width: 6, height: 6, left: (playerWormRef.current.segments[0].x / WORLD_SIZE) * RADAR_SIZE - 3, top: (playerWormRef.current.segments[0].y / WORLD_SIZE) * RADAR_SIZE - 3 }} />
                    )}
                    <div className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-[spin_3s_linear_infinite]"></div>
                </div>
            )}

            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020205]/95 backdrop-blur-xl p-8">
                    <div className="w-28 h-28 rounded-3xl border-4 border-indigo-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(129,140,248,0.5)] animate-glow rotate-12">
                        <Zap size={64} className="text-indigo-400" />
                    </div>
                    <h1 className="text-6xl font-black text-white italic mb-4 tracking-tighter drop-shadow-[0_0_20px_#818cf8]">NEON SLITHER</h1>
                    <p className="text-gray-400 text-sm mb-10 max-w-sm text-center leading-relaxed">Dirige ton ver néon dans l'arène. Mange pour grandir, évite les impacts. <br/><span className="text-indigo-300 font-bold uppercase mt-2 block">Turbo : Double-tap sur l'écran</span><br/><span className="text-cyan-400 font-bold uppercase mt-1 block">Direction : Glissez n'importe où</span></p>
                    
                    <div className="flex flex-col gap-5 w-full max-w-xs">
                        <button onClick={() => startGame('SOLO')} className="px-8 py-5 bg-indigo-600 border-2 border-indigo-400 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 group">
                            <User size={24} /> SOLO (BOTS)
                        </button>
                        <button onClick={() => startGame('ONLINE')} className="px-8 py-5 bg-gray-900 border-2 border-green-500 text-green-400 font-black tracking-widest rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">
                            <Globe size={24} className="text-green-500"/> MULTIJOUEUR
                        </button>
                    </div>
                    <button onClick={onBack} className="mt-12 text-gray-500 text-sm font-bold hover:text-white uppercase tracking-[0.2em] transition-colors">Retour au menu</button>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in p-8 text-center">
                    <Skull size={100} className="text-red-500 mb-8 drop-shadow-[0_0_30px_#ef4444] animate-pulse" />
                    <h2 className="text-6xl font-black italic text-white mb-4 tracking-tighter">ÉCHOUÉ !</h2>
                    <div className="bg-gray-800/40 p-6 rounded-3xl border border-white/10 mb-10 w-full max-w-[280px] shadow-inner">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Masse finale</p>
                        <p className="text-5xl font-black text-white font-mono">{score}</p>
                    </div>
                    {earnedCoins > 0 && <div className="mb-10 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/50 animate-bounce shadow-[0_0_15px_rgba(234,179,8,0.3)]"><Coins className="text-yellow-400" size={28} /><span className="text-yellow-100 font-black text-2xl">+{earnedCoins}</span></div>}
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => startGame(gameMode)} className="flex-1 py-4 bg-indigo-600 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={24} /> REJOUER</button>
                        <button onClick={() => setGameState('MENU')} className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700 transition-all border border-white/5">MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
};
