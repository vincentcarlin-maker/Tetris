import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Zap, User, Globe, Skull } from 'lucide-react';
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
const WORLD_SIZE = 20000; 
const INITIAL_LENGTH = 15;
const SEGMENT_DISTANCE = 5; 
const BASE_SPEED = 6.5; 
const BOOST_SPEED = 14.5; 
const TURN_SPEED = 0.22; 
const RADAR_SIZE = 120;
const JOYSTICK_DEADZONE = 3; 

const BOT_COUNT = 1000; 
const INITIAL_FOOD_COUNT = 15000; 
const MIN_FOOD_REGEN = 12000;

const COLORS = ['#00f3ff', '#ff00ff', '#9d00ff', '#ffe600', '#00ff9d', '#ff4d4d', '#ff9f43'];

const calculateWormRadius = (score: number) => {
    return 12 + Math.min(48, Math.sqrt(score) * 0.4);
};

export const SlitherGame: React.FC<{ onBack: () => void, audio: any, addCoins: any, mp: any, onReportProgress?: any }> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { username, currentAvatarId, currentSlitherSkinId, slitherSkinsCatalog, currentSlitherAccessoryId, slitherAccessoriesCatalog } = useCurrency();

    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'DYING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState({ current: 0, total: 0 });
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);
    const [isBoosting, setIsBoosting] = useState(false);

    // Logic Refs
    const playerWormRef = useRef<Worm | null>(null);
    const othersRef = useRef<Worm[]>([]);
    const foodRef = useRef<Food[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const cameraRef = useRef<Point>({ x: 0, y: 0 });
    const shakeRef = useRef(0);
    const isBoostingRef = useRef(false);
    
    // Joystick Refs
    const joystickOriginRef = useRef<Point | null>(null);
    const joystickActiveRef = useRef(false);
    const joystickVectorRef = useRef<Point>({ x: 0, y: 0 });

    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const lastNetworkUpdateRef = useRef<number>(0);
    const boostCounterRef = useRef<number>(0);

    const { playCoin, playMove, playExplosion, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.slither || 0;

    // --- INITIALIZATION ---
    const spawnWorm = (id: string, name: string, color: string, skin?: SlitherSkin, accessory?: SlitherAccessory): Worm => {
        const x = Math.random() * (WORLD_SIZE - 2000) + 1000;
        const y = Math.random() * (WORLD_SIZE - 2000) + 1000;
        const segments: Point[] = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
            segments.push({ x: x - i * SEGMENT_DISTANCE, y });
        }
        return { 
            id, name, segments, angle: Math.random() * Math.PI * 2, color, skin, accessory, 
            score: 0, isBoost: false, isDead: false, radius: calculateWormRadius(0),
            aiTargetAngle: Math.random() * Math.PI * 2,
            aiDecisionTimer: Math.floor(Math.random() * 50)
        };
    };

    const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particlesRef.current.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1.0, color, size: Math.random() * 4 + 2
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
        spawnFood(INITIAL_FOOD_COUNT);
        othersRef.current = mode === 'SOLO' ? Array.from({length: BOT_COUNT}, (_, i) => spawnWorm(`bot_${i}`, `Bot ${i+1}`, COLORS[Math.floor(Math.random() * COLORS.length)])) : [];
        setGameState('PLAYING');
        setScore(0);
        setRank({ current: 0, total: 0 });
        setEarnedCoins(0);
        setIsBoosting(false);
        isBoostingRef.current = false;
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
            if (Math.abs(worm.segments[0].x - x) > 1000 || Math.abs(worm.segments[0].y - y) > 1000) continue;
            const startIdx = worm.id === excludeId ? 12 : 0;
            for (let i = startIdx; i < worm.segments.length; i += 3) { 
                const seg = worm.segments[i];
                const distSq = (x - seg.x)**2 + (y - seg.y)**2;
                if (distSq < (worm.radius + radius * 0.4)**2) return true;
            }
        }
        return false;
    };

    // --- UPDATE LOOP ---
    const update = (dt: number) => {
        if (gameState === 'MENU' || gameState === 'GAMEOVER') return;
        
        particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
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
        if (!canBoost && isBoostingRef.current) {
            isBoostingRef.current = false;
            setIsBoosting(false);
        }

        player.isBoost = isBoostingRef.current;
        const currentSpeed = player.isBoost ? BOOST_SPEED : BASE_SPEED;
        
        if (player.isBoost) {
            boostCounterRef.current++;
            if (boostCounterRef.current % 8 === 0) { // Un peu plus rapide la conso pour équilibrer la vitesse
                player.segments.pop();
                player.score = Math.max(0, player.score - 2);
                setScore(player.score);
                player.radius = calculateWormRadius(player.score);
                const tail = player.segments[player.segments.length - 1];
                foodRef.current.push({ id: `boost_f_${Date.now()}`, x: tail.x, y: tail.y, val: 1, color: player.skin?.primaryColor || player.color });
            }
        }

        updateWormMovement(player, playerTargetAngle, currentSpeed);

        const head = player.segments[0];
        if (head.x < 0 || head.x > WORLD_SIZE || head.y < 0 || head.y > WORLD_SIZE) handleDeath();

        // Collisions nourriture
        for (let i = foodRef.current.length - 1; i >= 0; i--) {
            const f = foodRef.current[i];
            if (Math.abs(head.x - f.x) > 100 || Math.abs(head.y - f.y) > 100) continue;
            const distSq = (head.x - f.x)**2 + (head.y - f.y)**2;
            if (distSq < (player.radius + 15)**2) {
                player.score += f.val * 5;
                setScore(player.score);
                player.radius = calculateWormRadius(player.score);
                playCoin();
                for (let j = 0; j < f.val; j++) {
                    const tail = player.segments[player.segments.length - 1];
                    player.segments.push({ ...tail });
                }
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId: f.id });
                if (foodRef.current.length < MIN_FOOD_REGEN) spawnFood(200);
            }
        }

        // Collisions vers
        othersRef.current.forEach(other => {
            if (other.isDead) return;
            if (Math.abs(other.segments[0].x - head.x) > 1200 || Math.abs(other.segments[0].y - head.y) > 1200) return;
            for (let sIdx = 0; sIdx < other.segments.length; sIdx += 3) {
                const seg = other.segments[sIdx];
                const dSq = (head.x - seg.x)**2 + (head.y - seg.y)**2;
                if (dSq < (other.radius + 5)**2) { handleDeath(); return; }
            }
        });

        cameraRef.current.x = head.x;
        cameraRef.current.y = head.y;

        if (gameMode === 'SOLO') {
            const allWorms = [player, ...othersRef.current];
            othersRef.current.forEach(bot => {
                if (bot.isDead) return;
                const bHead = bot.segments[0];
                bot.aiDecisionTimer = (bot.aiDecisionTimer || 0) - 1;

                if (bot.aiDecisionTimer <= 0) {
                    const lookAhead = 120 + bot.radius * 2;
                    const rays = [0, -0.5, 0.5, -1.0, 1.0, -1.5, 1.5];
                    let collisionFound = false;
                    let clearAngle = bot.angle;
                    const margin = 200;
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
                        let closestF = null, minDistSq = 700**2;
                        for (let f of foodRef.current) {
                            if (Math.abs(f.x - bHead.x) > 500 || Math.abs(f.y - bHead.y) > 500) continue;
                            const dSq = (bHead.x - f.x)**2 + (bHead.y - f.y)**2;
                            if (dSq < minDistSq) { minDistSq = dSq; closestF = f; }
                        }
                        bot.aiTargetAngle = closestF ? Math.atan2(closestF.y - bHead.y, closestF.x - bHead.x) : bot.angle + (Math.random() - 0.5) * 0.4;
                        bot.aiDecisionTimer = 15 + Math.random() * 20;
                    } else {
                        bot.aiTargetAngle = clearAngle;
                        bot.aiDecisionTimer = 5;
                        bot.isBoost = true;
                    }
                }

                updateWormMovement(bot, bot.aiTargetAngle || bot.angle, bot.isBoost ? BOOST_SPEED : BASE_SPEED);
                if (Math.random() > 0.98) bot.isBoost = false;

                for (let i = foodRef.current.length - 1; i >= 0; i--) {
                    const f = foodRef.current[i];
                    if (Math.abs(bHead.x - f.x) > 80 || Math.abs(bHead.y - f.y) > 80) continue;
                    const distSq = (bHead.x - f.x)**2 + (head.y - f.y)**2;
                    if (distSq < (bot.radius + 15)**2) {
                        bot.score += f.val * 5;
                        bot.radius = calculateWormRadius(bot.score);
                        for (let j = 0; j < f.val; j++) {
                            const tail = bot.segments[bot.segments.length - 1];
                            bot.segments.push({ ...tail });
                        }
                        foodRef.current.splice(i, 1);
                    }
                }

                const distToPlayerHead = (bHead.x - head.x)**2 + (bHead.y - head.y)**2;
                if (distToPlayerHead < (bot.radius + player.radius)**2) handleDeath();
                else if (Math.abs(bHead.x - head.x) < 1200 && Math.abs(bHead.y - head.y) < 1200) {
                    for (let pIdx = 0; pIdx < player.segments.length; pIdx += 4) {
                        if (pIdx > 5) {
                            const pSeg = player.segments[pIdx];
                            const dSq = (bHead.x - pSeg.x)**2 + (bHead.y - pSeg.y)**2;
                            if (dSq < (player.radius + 5)**2) {
                                bot.isDead = true;
                                spawnParticles(bHead.x, bHead.y, bot.color, 15);
                                bot.segments.forEach((s, idx) => { 
                                    if(idx % 4 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 2, color: bot.skin?.primaryColor || bot.color }); 
                                });
                                break;
                            }
                        }
                    }
                }
            });
            othersRef.current = othersRef.current.filter(b => !b.isDead);
            if (othersRef.current.length < BOT_COUNT) othersRef.current.push(spawnWorm(`bot_${Date.now()}_${Math.random()}`, "Bot " + (Math.floor(Math.random()*2000)), COLORS[Math.floor(Math.random()*COLORS.length)]));
        }

        if (gameMode === 'ONLINE' && Date.now() - lastNetworkUpdateRef.current > 50) {
            mp.sendData({ type: 'SLITHER_UPDATE', worm: player });
            lastNetworkUpdateRef.current = Date.now();
        }

        const allWorms = [player, ...othersRef.current];
        const sortedWorms = [...allWorms].sort((a,b) => b.score - a.score);
        setRank({ current: sortedWorms.findIndex(w => w.id === player.id) + 1, total: sortedWorms.length });
        setLeaderboard(sortedWorms.slice(0, 10).map(w => ({ name: w.name, score: w.score, isMe: w.id === player.id })));
    };

    const handleDeath = () => {
        const player = playerWormRef.current;
        if (!player || player.isDead || gameState === 'DYING') return;
        player.isDead = true;
        setGameState('DYING');
        setIsBoosting(false);
        isBoostingRef.current = false;
        joystickActiveRef.current = false;
        joystickOriginRef.current = null;
        spawnParticles(player.segments[0].x, player.segments[0].y, player.skin?.primaryColor || player.color, 60);
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
        if (shakeRef.current > 0) { offsetX += (Math.random() - 0.5) * shakeRef.current; offsetY += (Math.random() - 0.5) * shakeRef.current; }
        const zoom = Math.max(0.4, 1.0 - (player.radius - 12) * 0.015);
        const minX = cam.x - (ctx.canvas.width / zoom + 400) / 2;
        const maxX = cam.x + (ctx.canvas.width / zoom + 400) / 2;
        const minY = cam.y - (ctx.canvas.height / zoom + 400) / 2;
        const maxY = cam.y + (ctx.canvas.height / zoom + 400) / 2;

        ctx.save();
        ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-ctx.canvas.width/2, -ctx.canvas.height/2);
        ctx.translate(offsetX, offsetY);
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        ctx.lineWidth = 4;
        for (let i = Math.max(0, Math.floor(minX / 400) * 400); i <= Math.min(WORLD_SIZE, Math.ceil(maxX / 400) * 400); i += 400) { ctx.beginPath(); ctx.moveTo(i, Math.max(0, minY)); ctx.lineTo(i, Math.min(WORLD_SIZE, maxY)); ctx.stroke(); }
        for (let i = Math.max(0, Math.floor(minY / 400) * 400); i <= Math.min(WORLD_SIZE, Math.ceil(maxY / 400) * 400); i += 400) { ctx.beginPath(); ctx.moveTo(Math.max(0, minX), i); ctx.lineTo(Math.min(WORLD_SIZE, maxX), i); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)'; ctx.lineWidth = 40; ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        foodRef.current.forEach(f => {
            if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) return;
            const grad = ctx.createRadialGradient(f.x - 2, f.y - 2, 0, f.x, f.y, 4 + f.val);
            grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, f.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.val, 0, Math.PI * 2); ctx.fill();
        });

        particlesRef.current.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0; });

        othersRef.current.forEach(worm => { if (worm.segments[0].x > minX - 1000 && worm.segments[0].x < maxX + 1000 && worm.segments[0].y > minY - 1000 && worm.segments[0].y < maxY + 1000) drawWorm(ctx, worm); });
        if (gameState !== 'DYING') drawWorm(ctx, player);
        if (gameState === 'PLAYING') drawDirectionArrow(ctx, player);
        ctx.restore();
    };

    const drawDirectionArrow = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        if (worm.isDead) return;
        const head = worm.segments[0];
        const arrowDist = 50 + worm.radius;
        const arrowSize = 14;
        ctx.save();
        ctx.translate(head.x + Math.cos(worm.angle) * arrowDist, head.y + Math.sin(worm.angle) * arrowDist);
        ctx.rotate(worm.angle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = 'white';
        ctx.beginPath(); ctx.moveTo(-arrowSize, -arrowSize); ctx.lineTo(0, 0); ctx.lineTo(-arrowSize, arrowSize); ctx.stroke();
        ctx.restore();
    };

    const drawWorm = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        const segs = worm.segments; if (segs.length < 2) return;
        const skin = worm.skin; const pattern = skin?.pattern || 'solid';
        const primary = skin?.primaryColor || worm.color; const secondary = skin?.secondaryColor || primary;
        const glow = skin?.glowColor || primary; const radius = worm.radius;

        ctx.save();
        for (let i = segs.length - 1; i >= 0; i--) {
            const seg = segs[i]; const isHead = i === 0;
            const segmentColor = pattern === 'rainbow' ? `hsl(${(i * 10 + Date.now() / 20) % 360}, 100%, 60%)` : pattern === 'stripes' ? (Math.floor(i / 3) % 2 === 0 ? primary : secondary) : primary;
            ctx.shadowBlur = isHead ? 25 : 8; ctx.shadowColor = worm.isBoost ? '#fff' : glow;
            const bodyGrad = ctx.createRadialGradient(seg.x - radius * 0.3, seg.y - radius * 0.3, radius * 0.1, seg.x, seg.y, radius);
            bodyGrad.addColorStop(0, '#fff'); bodyGrad.addColorStop(0.2, segmentColor); bodyGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2); ctx.fill();
        }

        const head = segs[0]; const eyeOffset = radius * 0.6;
        [{ x: head.x + Math.cos(worm.angle + 0.6) * eyeOffset, y: head.y + Math.sin(worm.angle + 0.6) * eyeOffset }, { x: head.x + Math.cos(worm.angle - 0.6) * eyeOffset, y: head.y + Math.sin(worm.angle - 0.6) * eyeOffset }].forEach(pos => {
            const eyeSize = radius * 0.45; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, eyeSize, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(pos.x + Math.cos(worm.angle) * (eyeSize*0.3), pos.y + Math.sin(worm.angle) * (eyeSize*0.3), eyeSize*0.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.font = `bold ${Math.max(12, radius * 0.9)}px Rajdhani`; ctx.textAlign = 'center';
        ctx.fillText(worm.name, head.x, head.y - (radius + 25));
        ctx.restore();
    };

    const loop = (time: number) => { update(time - lastTimeRef.current); lastTimeRef.current = time; if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) draw(ctx); } animationFrameRef.current = requestAnimationFrame(loop); };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        const kd = (e: KeyboardEvent) => { if (e.code === 'Space') { isBoostingRef.current = true; setIsBoosting(true); } };
        const ku = (e: KeyboardEvent) => { if (e.code === 'Space') { isBoostingRef.current = false; setIsBoosting(false); } };
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { cancelAnimationFrame(animationFrameRef.current); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, [gameState]);

    const handleInputStart = (x: number, y: number) => {
        if (gameState !== 'PLAYING') return;
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

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#020205] relative overflow-hidden font-sans select-none touch-none">
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="w-full h-full"
                onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
                onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
                onMouseUp={handleInputEnd}
                onMouseLeave={handleInputEnd}
                onTouchMove={(e) => handleInputMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchStart={(e) => handleInputStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handleInputEnd}
            />

            <div className="absolute top-6 left-6 z-20 flex gap-6 items-center pointer-events-none">
                <button onClick={() => { if (gameState === 'PLAYING') { if (window.confirm("Quitter ?")) onBack(); } else onBack(); }} className="p-3 bg-gray-900/90 rounded-2xl text-white pointer-events-auto border border-white/10 active:scale-95 transition-all shadow-xl"><Home size={24}/></button>
                <div className="flex flex-col">
                    <span className="text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">{score}</span>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase">Rang: {rank.current} / {rank.total}</span>
                </div>
            </div>

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
                <>
                    <div className="absolute bottom-8 right-8 z-30 rounded-full bg-black/70 border-2 border-white/20 shadow-2xl backdrop-blur-md overflow-hidden pointer-events-none w-[120px] h-[120px]">
                        {othersRef.current.map(worm => <div key={worm.id} className="absolute rounded-full bg-pink-500 shadow-[0_0_4px_pink] w-0.5 h-0.5" style={{ left: (worm.segments[0].x / WORLD_SIZE) * 120, top: (worm.segments[0].y / WORLD_SIZE) * 120 }} />)}
                        {playerWormRef.current && <div className="absolute rounded-full bg-white shadow-[0_0_8px_white] w-1 h-1 animate-pulse" style={{ left: (playerWormRef.current.segments[0].x / WORLD_SIZE) * 120, top: (playerWormRef.current.segments[0].y / WORLD_SIZE) * 120 }} />}
                    </div>

                    <button 
                        onMouseDown={() => { isBoostingRef.current = true; setIsBoosting(true); }}
                        onMouseUp={() => { isBoostingRef.current = false; setIsBoosting(false); }}
                        onTouchStart={() => { isBoostingRef.current = true; setIsBoosting(true); }}
                        onTouchEnd={() => { isBoostingRef.current = false; setIsBoosting(false); }}
                        className={`absolute bottom-10 left-10 z-40 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-110 ${isBoosting ? 'bg-yellow-400 border-white text-black shadow-[0_0_30px_#facc15]' : 'bg-gray-900/80 border-yellow-500/50 text-yellow-500'}`}
                    >
                        <Zap size={32} fill={isBoosting ? "black" : "none"} />
                        <span className="text-[10px] font-black tracking-tighter">TURBO</span>
                    </button>
                </>
            )}

            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020205]/95 backdrop-blur-xl p-8">
                    <Zap size={64} className="text-indigo-400 mb-8 animate-glow" />
                    <h1 className="text-6xl font-black text-white italic mb-4 tracking-tighter drop-shadow-[0_0_20px_#818cf8]">NEON SLITHER</h1>
                    <div className="flex flex-col gap-5 w-full max-w-xs">
                        <button onClick={() => startGame('SOLO')} className="px-8 py-5 bg-indigo-600 border-2 border-indigo-400 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">SOLO (1000 BOTS)</button>
                        <button onClick={() => startGame('ONLINE')} className="px-8 py-5 bg-gray-900 border-2 border-green-500 text-green-400 font-black tracking-widest rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">MULTIJOUEUR</button>
                    </div>
                    <p className="mt-8 text-gray-500 text-xs text-center">PC: Espace pour Turbo • Mobile: Bouton Turbo</p>
                    <button onClick={onBack} className="mt-4 text-gray-600 text-sm font-bold hover:text-white uppercase">Menu</button>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in p-8 text-center">
                    <Skull size={100} className="text-red-500 mb-8 drop-shadow-[0_0_30px_#ef4444]" />
                    <h2 className="text-6xl font-black italic text-white mb-4">ÉCHOUÉ !</h2>
                    <p className="text-5xl font-black text-white font-mono mb-10">{score}</p>
                    {earnedCoins > 0 && <div className="mb-10 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/50"><Coins className="text-yellow-400" size={28} /><span className="text-yellow-100 font-black text-2xl">+{earnedCoins}</span></div>}
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => startGame(gameMode)} className="flex-1 py-4 bg-indigo-600 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={24} /> REJOUER</button>
                        <button onClick={() => setGameState('MENU')} className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700">MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
};