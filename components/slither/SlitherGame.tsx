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
    color: string; // Background color fallback
    skin?: SlitherSkin; 
    accessory?: SlitherAccessory; // New: equipped accessory
    score: number;
    isBoost: boolean;
    isDead: boolean;
    radius: number;
}
interface Food { id: string; x: number; y: number; val: number; color: string; }

// --- CONSTANTS ---
const WORLD_SIZE = 2000;
const INITIAL_LENGTH = 15;
const SEGMENT_DISTANCE = 6; // Distance fixe entre les segments
const BASE_SPEED = 4.2; // Augmenté de 3.5 pour plus de dynamisme
const BOOST_SPEED = 8.5; // Augmenté de 7
const TURN_SPEED = 0.22; // Augmenté de 0.12 pour une rotation beaucoup plus sensible
const RADAR_SIZE = 120;
const DOUBLE_TAP_DELAY = 300; // ms
const JOYSTICK_DEADZONE = 3; // Réduit de 5 pour capter les micro-mouvements

const COLORS = ['#00f3ff', '#ff00ff', '#9d00ff', '#ffe600', '#00ff9d', '#ff4d4d', '#ff9f43'];

export const SlitherGame: React.FC<{ onBack: () => void, audio: any, addCoins: any, mp: any, onReportProgress?: any }> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { username, currentAvatarId, currentSlitherSkinId, slitherSkinsCatalog, currentSlitherAccessoryId, slitherAccessoriesCatalog } = useCurrency();

    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
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
    const cameraRef = useRef<Point>({ x: 0, y: 0 });
    const mouseRef = useRef<Point & { down: boolean }>({ x: 0, y: 0, down: false });
    
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
    const bestScore = highScores.slither || 0;

    // --- INITIALIZATION ---
    const spawnWorm = (id: string, name: string, color: string, skin?: SlitherSkin, accessory?: SlitherAccessory): Worm => {
        const x = Math.random() * (WORLD_SIZE - 400) + 200;
        const y = Math.random() * (WORLD_SIZE - 400) + 200;
        const segments: Point[] = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
            segments.push({ x: x - i * SEGMENT_DISTANCE, y });
        }
        return { id, name, segments, angle: Math.random() * Math.PI * 2, color, skin, accessory, score: 0, isBoost: false, isDead: false, radius: 10 };
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
        
        // Find player's skin and accessory
        const playerSkin = slitherSkinsCatalog.find(s => s.id === currentSlitherSkinId) || slitherSkinsCatalog[0];
        const playerAcc = slitherAccessoriesCatalog.find(a => a.id === currentSlitherAccessoryId);
        
        playerWormRef.current = spawnWorm(mp.peerId || 'player', username, playerSkin.primaryColor, playerSkin, playerAcc);
        foodRef.current = [];
        spawnFood(300);
        othersRef.current = mode === 'SOLO' ? Array.from({length: 12}, (_, i) => spawnWorm(`bot_${i}`, `Bot ${i}`, COLORS[Math.floor(Math.random() * COLORS.length)])) : [];
        setGameState('PLAYING');
        setScore(0);
        setRank({ current: 0, total: 0 });
        setEarnedCoins(0);
        setIsBoosting(false);
        resumeAudio();
        lastTimeRef.current = Date.now();
        if (onReportProgress) onReportProgress('play', 1);
    };

    // --- HELPER: MOVE WORM LOGIC ---
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
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            newSegments.push({
                x: prev.x + Math.cos(angle) * SEGMENT_DISTANCE,
                y: prev.y + Math.sin(angle) * SEGMENT_DISTANCE
            });
            prev = newSegments[i];
        }
        worm.segments = newSegments;
    };

    // --- MULTIPLAYER SYNC ---
    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'SLITHER_UPDATE') {
                const remote = data.worm;
                if (remote.id === mp.peerId) return;
                const idx = othersRef.current.findIndex(w => w.id === remote.id);
                if (idx === -1) othersRef.current.push(remote);
                else othersRef.current[idx] = remote;
            }
            if (data.type === 'SLITHER_FOOD_EATEN') {
                foodRef.current = foodRef.current.filter(f => f.id !== data.foodId);
            }
            if (data.type === 'SLITHER_KILLED') {
                const idx = othersRef.current.findIndex(w => w.id === data.id);
                if (idx !== -1) othersRef.current.splice(idx, 1);
            }
        });
        return () => unsubscribe();
    }, [gameMode, mp]);

    // --- UPDATE LOOP ---
    const update = (dt: number) => {
        if (gameState !== 'PLAYING') return;
        const player = playerWormRef.current;
        if (!player || player.isDead) return;

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
            if (Math.hypot(head.x - f.x, head.y - f.y) < 25) {
                player.score += f.val * 5;
                setScore(player.score);
                playCoin();
                for (let j = 0; j < f.val; j++) {
                    const tail = player.segments[player.segments.length - 1];
                    player.segments.push({ ...tail });
                }
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId: f.id });
                if (foodRef.current.length < 200) spawnFood(50);
            }
        }

        othersRef.current.forEach(other => {
            if (other.isDead) return;
            other.segments.forEach((seg, sIdx) => {
                if (sIdx > 3) {
                    if (Math.hypot(head.x - seg.x, head.y - seg.y) < 18) {
                        handleDeath();
                    }
                }
            });
        });

        cameraRef.current.x = head.x;
        cameraRef.current.y = head.y;

        if (gameMode === 'SOLO') {
            othersRef.current.forEach(bot => {
                if (bot.isDead) return;
                const bHead = bot.segments[0];
                let botTargetAngle = bot.angle;
                const margin = 150;
                if (bHead.x < margin) botTargetAngle = 0;
                else if (bHead.x > WORLD_SIZE - margin) botTargetAngle = Math.PI;
                else if (bHead.y < margin) botTargetAngle = Math.PI / 2;
                else if (bHead.y > WORLD_SIZE - margin) botTargetAngle = -Math.PI / 2;
                else {
                    let closestF = null, minDist = 400;
                    foodRef.current.forEach(f => {
                        const d = Math.hypot(bHead.x - f.x, bHead.y - f.y);
                        if (d < minDist) { minDist = d; closestF = f; }
                    });
                    if (closestF) botTargetAngle = Math.atan2(closestF.y - bHead.y, closestF.x - bHead.x);
                    else if (Math.random() > 0.95) botTargetAngle += (Math.random() - 0.5) * 1.5;
                }
                updateWormMovement(bot, botTargetAngle, BASE_SPEED);
                if (Math.hypot(bHead.x - head.x, bHead.y - head.y) < 30) handleDeath();
                else {
                    player.segments.forEach((pSeg, pIdx) => {
                        if (pIdx > 2 && Math.hypot(bHead.x - pSeg.x, bHead.y - pSeg.y) < 18) {
                            bot.isDead = true;
                            bot.segments.forEach((s, idx) => { if(idx % 3 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 3, color: bot.skin?.primaryColor || bot.color }); });
                        }
                    });
                }
            });
            othersRef.current = othersRef.current.filter(b => !b.isDead);
            if (othersRef.current.length < 12) othersRef.current.push(spawnWorm(`bot_${Date.now()}`, "CyberBot", COLORS[Math.floor(Math.random()*COLORS.length)]));
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
        if (!player || player.isDead) return;
        player.isDead = true;
        setGameState('GAMEOVER');
        setIsBoosting(false);
        joystickActiveRef.current = false;
        joystickOriginRef.current = null;
        playExplosion();
        playGameOver();
        updateHighScore('slither', player.score);
        const coins = Math.floor(player.score / 50);
        if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
        if (onReportProgress) onReportProgress('score', player.score);
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const player = playerWormRef.current;
        if (!player) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const cam = cameraRef.current;
        const offsetX = -cam.x + ctx.canvas.width / 2;
        const offsetY = -cam.y + ctx.canvas.height / 2;
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
            ctx.fillStyle = f.color;
            ctx.shadowBlur = 15; ctx.shadowColor = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.val, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });
        othersRef.current.forEach(worm => drawWorm(ctx, worm));
        drawWorm(ctx, player);
        drawDirectionArrow(ctx, player);
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

    const drawAccessory = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, accessory: SlitherAccessory, radius: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = accessory.color;
        
        const type = accessory.type;
        const color = accessory.color;

        if (type === 'CROWN') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-radius, -radius * 0.5);
            ctx.lineTo(-radius, -radius * 1.5);
            ctx.lineTo(-radius * 0.6, -radius * 1.0);
            ctx.lineTo(0, -radius * 1.8);
            ctx.lineTo(radius * 0.6, -radius * 1.0);
            ctx.lineTo(radius, -radius * 1.5);
            ctx.lineTo(radius, -radius * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (type === 'TIARA') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, -radius * 0.8, radius * 0.8, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
            // Gem central
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -radius * 1.6, 4, 4);
        } else if (type === 'HAT') {
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.ellipse(0, -radius * 0.4, radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillRect(-radius * 0.7, -radius * 1.8, radius * 1.4, radius * 1.4);
            ctx.strokeRect(-radius * 0.7, -radius * 1.8, radius * 1.4, radius * 1.4);
        } else if (type === 'BERET') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(0, -radius * 0.8, radius * 1.1, radius * 0.5, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (type === 'FEZ') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-radius * 0.6, -radius * 0.3);
            ctx.lineTo(-radius * 0.4, -radius * 1.4);
            ctx.lineTo(radius * 0.4, -radius * 1.4);
            ctx.lineTo(radius * 0.6, -radius * 0.3);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        } else if (type === 'CAP') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, -radius * 0.6, radius * 0.8, Math.PI, 0); ctx.fill(); ctx.stroke();
            ctx.fillRect(0, -radius * 0.7, radius * 1.2, radius * 0.2); // Visière
        } else if (type === 'COWBOY') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(0, -radius * 0.5, radius * 1.5, radius * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-radius * 0.7, -radius * 0.5);
            ctx.quadraticCurveTo(0, -radius * 2.2, radius * 0.7, -radius * 0.5);
            ctx.fill(); ctx.stroke();
        } else if (type === 'WITCH') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(0, -radius * 0.3, radius * 1.4, radius * 0.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-radius * 0.8, -radius * 0.3);
            ctx.lineTo(0, -radius * 2.5);
            ctx.lineTo(radius * 0.8, -radius * 0.3);
            ctx.fill(); ctx.stroke();
        } else if (type === 'SOMBRERO') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(0, -radius * 0.3, radius * 2, radius * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -radius * 0.5, radius * 0.8, Math.PI, 0); ctx.fill(); ctx.stroke();
        } else if (type === 'GLASSES' || type === 'MONOCLE' || type === 'EYEPATCH') {
            ctx.fillStyle = color;
            if (type === 'MONOCLE') {
                ctx.beginPath(); ctx.arc(radius * 0.5, 0, radius * 0.5, 0, Math.PI * 2); ctx.stroke();
            } else if (type === 'EYEPATCH') {
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(radius * 0.5, 0, radius * 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-radius, -radius * 0.5); ctx.lineTo(radius, 0); ctx.stroke();
            } else {
                ctx.globalAlpha = 0.6;
                ctx.fillRect(0, -radius * 0.4, radius * 1.5, radius * 0.8);
                ctx.globalAlpha = 1;
                ctx.strokeRect(0, -radius * 0.4, radius * 1.5, radius * 0.8);
            }
        } else if (type === 'NINJA') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(-radius * 1.1, -radius * 0.3, radius * 2.2, radius * 0.6, 2); ctx.fill(); ctx.stroke();
        } else if (type === 'VIKING') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, -radius * 0.3, radius * 0.9, Math.PI, 0); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(-radius * 0.8, -radius * 0.5); ctx.lineTo(-radius * 1.5, -radius * 1.5); ctx.lineTo(-radius * 0.5, -radius * 0.5); ctx.fill();
            ctx.beginPath(); ctx.moveTo(radius * 0.8, -radius * 0.5); ctx.lineTo(radius * 1.5, -radius * 1.5); ctx.lineTo(radius * 0.5, -radius * 0.5); ctx.fill();
        } else if (type === 'HALO') {
            ctx.strokeStyle = color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.ellipse(0, -radius * 1.5, radius, radius * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (type === 'HORNS' || type === 'DEVIL') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.moveTo(-radius * 0.5, -radius * 0.8); ctx.quadraticCurveTo(-radius * 1.2, -radius * 2, -radius * 0.2, -radius * 2.2); ctx.lineTo(-radius * 0.2, -radius * 0.8); ctx.fill();
            ctx.beginPath(); ctx.moveTo(radius * 0.5, -radius * 0.8); ctx.quadraticCurveTo(radius * 1.2, -radius * 2, radius * 0.2, -radius * 2.2); ctx.lineTo(radius * 0.2, -radius * 0.8); ctx.fill();
        } else if (type === 'CAT_EARS') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.moveTo(-radius * 0.8, -radius * 0.5); ctx.lineTo(-radius * 1.2, -radius * 1.5); ctx.lineTo(-radius * 0.2, -radius * 0.8); ctx.fill();
            ctx.beginPath(); ctx.moveTo(radius * 0.8, -radius * 0.5); ctx.lineTo(radius * 1.2, -radius * 1.5); ctx.lineTo(radius * 0.2, -radius * 0.8); ctx.fill();
        } else if (type === 'MOUSTACHE') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(-radius * 0.4, radius * 0.6, radius * 0.6, radius * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(radius * 0.4, radius * 0.6, radius * 0.6, radius * 0.2, -0.2, 0, Math.PI * 2); ctx.fill();
        } else if (type === 'FLOWER') {
            ctx.fillStyle = color;
            for(let i=0; i<5; i++) {
                ctx.beginPath(); ctx.arc(Math.cos(i*1.2)*8, -radius-8 + Math.sin(i*1.2)*8, 6, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(0, -radius-8, 4, 0, Math.PI*2); ctx.fill();
        } else if (type === 'STAR') {
            ctx.fillStyle = color;
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*15, -radius-15 + Math.sin((18+i*72)/180*Math.PI)*15);
                ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*7, -radius-15 + Math.sin((54+i*72)/180*Math.PI)*7);
            }
            ctx.fill();
        } else if (type === 'ROBOT') {
            ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(0, -radius*2); ctx.stroke();
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -radius*2, 4, 0, Math.PI*2); ctx.fill();
        } else if (type === 'HERO' || type === 'MASK') {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(-radius, -radius*0.2, radius*2, radius*0.8, 5); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-radius*0.4, 0, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(radius*0.4, 0, 3, 0, Math.PI*2); ctx.fill();
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
        const radius = worm.radius || 10;

        ctx.save();
        
        // Rendu segment par segment pour les motifs (de la queue à la tête)
        for (let i = segs.length - 1; i >= 0; i--) {
            const seg = segs[i];
            const isHead = i === 0;
            
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
            
            // Logique de motif
            if (pattern === 'solid') {
                ctx.fillStyle = primary;
            } else if (pattern === 'stripes') {
                ctx.fillStyle = Math.floor(i / 3) % 2 === 0 ? primary : secondary;
            } else if (pattern === 'dots') {
                ctx.fillStyle = primary;
            } else if (pattern === 'checker') {
                ctx.fillStyle = i % 2 === 0 ? primary : secondary;
            } else if (pattern === 'rainbow') {
                const hue = (i * 10 + Date.now() / 20) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
            } else if (pattern === 'grid') {
                ctx.fillStyle = secondary;
            } else {
                ctx.fillStyle = primary;
            }
            
            // Effet de boost
            if (worm.isBoost) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#fff';
            } else {
                ctx.shadowBlur = isHead ? 15 : 5;
                ctx.shadowColor = glow;
            }
            
            ctx.fill();
            
            // Sous-motif (ex: pois ou grille)
            if (pattern === 'dots' && i % 4 === 0) {
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, radius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = secondary;
                ctx.fill();
            } else if (pattern === 'grid' && i % 2 === 0) {
                ctx.strokeStyle = primary;
                ctx.lineWidth = 1;
                ctx.strokeRect(seg.x - radius*0.5, seg.y - radius*0.5, radius, radius);
            }

            // Bordure fine
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Yeux et nom (sur la tête)
        const head = segs[0];
        const eyeOffset = 8;
        const pupilOffset = 2.5; 
        const eyeAngle = worm.angle;
        const eye1X = head.x + Math.cos(eyeAngle + 0.6) * eyeOffset;
        const eye1Y = head.y + Math.sin(eyeAngle + 0.6) * eyeOffset;
        const eye2X = head.x + Math.cos(eyeAngle - 0.6) * eyeOffset;
        const eye2Y = head.y + Math.sin(eyeAngle - 0.6) * eyeOffset;
        
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 5; ctx.shadowColor = 'white';
        ctx.beginPath(); ctx.arc(eye1X, eye1Y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2X, eye2Y, 6, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(eye1X + Math.cos(eyeAngle) * pupilOffset, eye1Y + Math.sin(eyeAngle) * pupilOffset, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2X + Math.cos(eyeAngle) * pupilOffset, eye2Y + Math.sin(eyeAngle) * pupilOffset, 3, 0, Math.PI * 2); ctx.fill();
        
        // Affichage de l'accessoire
        if (worm.accessory && worm.accessory.id !== 'sa_none') {
            drawAccessory(ctx, head.x, head.y, worm.angle, worm.accessory, radius);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(worm.name, head.x, head.y - 35);
        
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
    }, [gameState, gameMode, isBoosting]);

    const handleInputStart = (x: number, y: number) => {
        if (gameState !== 'PLAYING') return;
        
        const now = Date.now();
        const diff = now - lastTapTimeRef.current;
        
        if (diff < DOUBLE_TAP_DELAY) {
            setIsBoosting(prev => !prev);
            playMove();
        }
        
        lastTapTimeRef.current = now;
        
        joystickOriginRef.current = { x, y };
        joystickActiveRef.current = true;
        joystickVectorRef.current = { x: 0, y: 0 };
        resumeAudio();
    };

    const handleInputMove = (x: number, y: number) => {
        if (!joystickActiveRef.current || !joystickOriginRef.current) return;
        
        joystickVectorRef.current = {
            x: x - joystickOriginRef.current.x,
            y: y - joystickOriginRef.current.y
        };
    };

    const handleInputEnd = () => {
        joystickActiveRef.current = false;
        joystickOriginRef.current = null;
    };

    const handleLocalBack = () => {
        if (gameState === 'PLAYING') {
            if (window.confirm("Quitter la partie en cours ?")) onBack();
        } else onBack();
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

            {isBoosting && (
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