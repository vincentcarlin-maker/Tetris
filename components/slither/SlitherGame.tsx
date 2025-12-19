
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Zap, HelpCircle, User, Globe, Play, ArrowLeft, Loader2, LogOut, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, Shield, Skull } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';

// --- TYPES ---
interface Point { x: number; y: number; }
interface Worm {
    id: string;
    name: string;
    segments: Point[];
    angle: number;
    color: string;
    score: number;
    isBoost: boolean;
    isDead: boolean;
    radius: number;
}
interface Food { id: string; x: number; y: number; val: number; color: string; }

// --- CONSTANTS ---
const WORLD_SIZE = 2000;
const INITIAL_LENGTH = 10;
const SEGMENT_DISTANCE = 8;
const BASE_SPEED = 3;
const BOOST_SPEED = 6;
const TURN_SPEED = 0.12;
const RADAR_SIZE = 120; // Taille du radar en pixels

const COLORS = ['#00f3ff', '#ff00ff', '#9d00ff', '#ffe600', '#00ff9d', '#ff4d4d', '#ff9f43'];

export const SlitherGame: React.FC<{ onBack: () => void, audio: any, addCoins: any, mp: any, onReportProgress?: any }> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { username, currentAvatarId } = useCurrency();
    const { highScores, updateHighScore } = useHighScores();

    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [score, setScore] = useState(0);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{name: string, score: number, isMe: boolean}[]>([]);

    // Logic Refs
    const playerWormRef = useRef<Worm | null>(null);
    const othersRef = useRef<Worm[]>([]);
    const foodRef = useRef<Food[]>([]);
    const cameraRef = useRef<Point>({ x: 0, y: 0 });
    const mouseRef = useRef<Point & { down: boolean }>({ x: 0, y: 0, down: false });
    const animationFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const lastNetworkUpdateRef = useRef<number>(0);

    const { playCoin, playMove, playExplosion, playVictory, playGameOver, resumeAudio } = audio;

    // --- INITIALIZATION ---
    const spawnWorm = (id: string, name: string, color: string): Worm => {
        const x = Math.random() * (WORLD_SIZE - 200) + 100;
        const y = Math.random() * (WORLD_SIZE - 200) + 100;
        const segments: Point[] = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) segments.push({ x, y });
        return { id, name, segments, angle: Math.random() * Math.PI * 2, color, score: 0, isBoost: false, isDead: false, radius: 10 };
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
        playerWormRef.current = spawnWorm(mp.peerId || 'player', username, COLORS[0]);
        foodRef.current = [];
        spawnFood(200);
        othersRef.current = mode === 'SOLO' ? Array.from({length: 15}, (_, i) => spawnWorm(`bot_${i}`, `Bot ${i}`, COLORS[Math.floor(Math.random() * COLORS.length)])) : [];
        setGameState('PLAYING');
        setScore(0);
        setEarnedCoins(0);
        resumeAudio();
        lastTimeRef.current = Date.now();
        if (onReportProgress) onReportProgress('play', 1);
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

        // 1. Player Direction & Movement
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const targetX = mouseRef.current.x - rect.width / 2;
            const targetY = mouseRef.current.y - rect.height / 2;
            const targetAngle = Math.atan2(targetY, targetX);
            
            let angleDiff = targetAngle - player.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            player.angle += angleDiff * TURN_SPEED;
        }

        player.isBoost = mouseRef.current.down && player.segments.length > 5;
        const currentSpeed = player.isBoost ? BOOST_SPEED : BASE_SPEED;
        
        const head = player.segments[0];
        const nextX = head.x + Math.cos(player.angle) * currentSpeed;
        const nextY = head.y + Math.sin(player.angle) * currentSpeed;
        
        // Boost length penalty
        if (player.isBoost && Math.random() > 0.8) {
            player.segments.pop();
            player.score = Math.max(0, player.score - 1);
        }

        const newHead = { x: nextX, y: nextY };
        const dx = newHead.x - head.x;
        const dy = newHead.y - head.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 1) {
            player.segments.unshift(newHead);
            player.segments.pop();
            
            // Adjust segments to maintain distance
            for (let i = 1; i < player.segments.length; i++) {
                const s1 = player.segments[i - 1];
                const s2 = player.segments[i];
                const d = Math.hypot(s1.x - s2.x, s1.y - s2.y);
                if (d > SEGMENT_DISTANCE) {
                    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
                    s2.x = s1.x + Math.cos(angle) * SEGMENT_DISTANCE;
                    s2.y = s1.y + Math.sin(angle) * SEGMENT_DISTANCE;
                }
            }
        }

        // Bords du monde
        if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
            handleDeath();
        }

        // 2. Food Collision
        for (let i = foodRef.current.length - 1; i >= 0; i--) {
            const f = foodRef.current[i];
            if (Math.hypot(newHead.x - f.x, newHead.y - f.y) < player.radius + 15) {
                player.score += f.val;
                setScore(player.score);
                playCoin();
                for (let j = 0; j < f.val; j++) player.segments.push({ ...player.segments[player.segments.length - 1] });
                foodRef.current.splice(i, 1);
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SLITHER_FOOD_EATEN', foodId: f.id });
                if (foodRef.current.length < 150) spawnFood(50);
            }
        }

        // 3. Collision with others
        const allOthers = othersRef.current;
        allOthers.forEach(other => {
            if (other.isDead) return;
            other.segments.forEach((seg, sIdx) => {
                if (sIdx > 2) { // Cannot collide with very front segments
                    if (Math.hypot(newHead.x - seg.x, newHead.y - seg.y) < 25) {
                        handleDeath();
                    }
                }
            });
        });

        // 4. Update Camera
        cameraRef.current.x = newHead.x;
        cameraRef.current.y = newHead.y;

        // 5. Bot AI (Solo)
        if (gameMode === 'SOLO') {
            othersRef.current.forEach(bot => {
                if (bot.isDead) return;
                
                // Simple AI: Move towards closest food
                let closestF = null, minDist = 300;
                foodRef.current.forEach(f => {
                    const d = Math.hypot(bot.segments[0].x - f.x, bot.segments[0].y - f.y);
                    if (d < minDist) { minDist = d; closestF = f; }
                });

                if (closestF) {
                    const targetAngle = Math.atan2((closestF as any).y - bot.segments[0].y, (closestF as any).x - bot.segments[0].x);
                    let diff = targetAngle - bot.angle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    bot.angle += diff * 0.05;
                } else if (Math.random() > 0.95) {
                    bot.angle += (Math.random() - 0.5) * 1;
                }

                const bHead = bot.segments[0];
                const bNextX = bHead.x + Math.cos(bot.angle) * BASE_SPEED;
                const bNextY = bHead.y + Math.sin(bot.angle) * BASE_SPEED;
                
                bot.segments.unshift({ x: bNextX, y: bNextY });
                bot.segments.pop();

                // Bot segments spacing
                for (let i = 1; i < bot.segments.length; i++) {
                    const s1 = bot.segments[i - 1];
                    const s2 = bot.segments[i];
                    const d = Math.hypot(s1.x - s2.x, s1.y - s2.y);
                    if (d > SEGMENT_DISTANCE) {
                        const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
                        s2.x = s1.x + Math.cos(angle) * SEGMENT_DISTANCE;
                        s2.y = s1.y + Math.sin(angle) * SEGMENT_DISTANCE;
                    }
                }

                // Bot collision with player
                if (Math.hypot(bNextX - player.segments[0].x, bNextY - player.segments[0].y) < 30) {
                     // Bot hits player head
                     handleDeath();
                } else {
                    player.segments.forEach(pSeg => {
                        if (Math.hypot(bNextX - pSeg.x, bNextY - pSeg.y) < 25) {
                            // Bot hits player body
                            bot.isDead = true;
                            // Convert bot to food
                            bot.segments.forEach((s, idx) => { if(idx % 2 === 0) foodRef.current.push({ id: `f_bot_${bot.id}_${idx}`, x: s.x, y: s.y, val: 2, color: bot.color }); });
                        }
                    });
                }
            });
            othersRef.current = othersRef.current.filter(b => !b.isDead);
            if (othersRef.current.length < 10) othersRef.current.push(spawnWorm(`bot_${Date.now()}`, "New Bot", COLORS[Math.floor(Math.random()*COLORS.length)]));
        }

        // Online sync
        if (gameMode === 'ONLINE' && Date.now() - lastNetworkUpdateRef.current > 50) {
            mp.sendData({ type: 'SLITHER_UPDATE', worm: player });
            lastNetworkUpdateRef.current = Date.now();
        }

        // Leaderboard
        const lb = [player, ...othersRef.current].map(w => ({ name: w.name, score: w.score, isMe: w.id === player.id })).sort((a,b) => b.score - a.score).slice(0, 10);
        setLeaderboard(lb);
    };

    const handleDeath = () => {
        const player = playerWormRef.current;
        if (!player || player.isDead) return;
        player.isDead = true;
        setGameState('GAMEOVER');
        playExplosion();
        playGameOver();
        updateHighScore('slither', player.score);
        const coins = Math.floor(player.score / 20);
        if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
        if (onReportProgress) onReportProgress('score', player.score);
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        const player = playerWormRef.current;
        if (!player) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Background Grid
        const cam = cameraRef.current;
        const offsetX = -cam.x + ctx.canvas.width / 2;
        const offsetY = -cam.y + ctx.canvas.height / 2;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);

        // Grid
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= WORLD_SIZE; i += 100) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i); ctx.stroke();
        }
        
        // World Border
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Food
        foodRef.current.forEach(f => {
            ctx.fillStyle = f.color;
            ctx.shadowBlur = 10; ctx.shadowColor = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.val, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Other Worms
        othersRef.current.forEach(worm => {
            drawWorm(ctx, worm);
        });

        // Player Worm
        drawWorm(ctx, player);

        ctx.restore();
    };

    const drawWorm = (ctx: CanvasRenderingContext2D, worm: Worm) => {
        const segs = worm.segments;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = worm.color;
        
        // Body with glow
        ctx.shadowBlur = worm.isBoost ? 20 : 10;
        ctx.shadowColor = worm.color;
        
        ctx.beginPath();
        ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) {
            ctx.lineTo(segs[i].x, segs[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Head/Eyes
        const head = segs[0];
        ctx.fillStyle = 'white';
        const eyeOffset = 8;
        const eyeAngle = worm.angle;
        
        // Eye 1
        ctx.beginPath();
        ctx.arc(head.x + Math.cos(eyeAngle + 0.5) * eyeOffset, head.y + Math.sin(eyeAngle + 0.5) * eyeOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        // Eye 2
        ctx.beginPath();
        ctx.arc(head.x + Math.cos(eyeAngle - 0.5) * eyeOffset, head.y + Math.sin(eyeAngle - 0.5) * eyeOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Name tag
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(worm.name, head.x, head.y - 25);
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

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black relative overflow-hidden font-sans select-none touch-none">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight} 
                className="w-full h-full"
                onMouseMove={(e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; }}
                onMouseDown={() => { mouseRef.current.down = true; }}
                onMouseUp={() => { mouseRef.current.down = false; }}
                onTouchMove={(e) => { mouseRef.current.x = e.touches[0].clientX; mouseRef.current.y = e.touches[0].clientY; }}
                onTouchStart={(e) => { mouseRef.current.down = true; resumeAudio(); }}
                onTouchEnd={() => { mouseRef.current.down = false; }}
            />

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-20 flex gap-4 items-center pointer-events-none">
                <button onClick={onBack} className="p-2 bg-gray-900/80 rounded-xl text-white pointer-events-auto border border-white/10 hover:bg-white/20"><Home/></button>
                <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-400 font-bold tracking-widest">LONGUEUR</span>
                    <span className="text-2xl font-black italic">{score}</span>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20 bg-black/60 border border-white/10 p-3 rounded-2xl w-40 backdrop-blur-md">
                <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Leaderboard</h4>
                {leaderboard.map((u, i) => (
                    <div key={i} className={`flex justify-between text-[10px] mb-1 ${u.isMe ? 'text-cyan-400 font-bold animate-pulse' : 'text-gray-400'}`}>
                        <span className="truncate w-24">{i+1}. {u.name}</span>
                        <span>{u.score}</span>
                    </div>
                ))}
            </div>

            {/* RADAR (Minimap) */}
            {gameState === 'PLAYING' && (
                <div 
                    className="absolute bottom-6 right-6 z-30 rounded-full bg-black/60 border-2 border-white/20 shadow-2xl backdrop-blur-md overflow-hidden pointer-events-none"
                    style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
                >
                    {/* Radar Grid */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '25% 25%' }}></div>
                    
                    {/* Other Worms on Radar */}
                    {othersRef.current.map(worm => (
                        <div 
                            key={worm.id}
                            className="absolute rounded-full bg-pink-500 shadow-[0_0_4px_pink]"
                            style={{ 
                                width: 3, 
                                height: 3, 
                                left: (worm.segments[0].x / WORLD_SIZE) * RADAR_SIZE - 1.5,
                                top: (worm.segments[0].y / WORLD_SIZE) * RADAR_SIZE - 1.5
                            }}
                        />
                    ))}

                    {/* Player on Radar */}
                    {playerWormRef.current && (
                        <div 
                            className="absolute rounded-full bg-white shadow-[0_0_8px_white] animate-pulse"
                            style={{ 
                                width: 5, 
                                height: 5, 
                                left: (playerWormRef.current.segments[0].x / WORLD_SIZE) * RADAR_SIZE - 2.5,
                                top: (playerWormRef.current.segments[0].y / WORLD_SIZE) * RADAR_SIZE - 2.5
                            }}
                        />
                    )}

                    {/* Radar Scanline effect */}
                    <div className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-[spin_4s_linear_infinite]"></div>
                </div>
            )}

            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6">
                    <div className="w-24 h-24 rounded-full border-4 border-indigo-400 flex items-center justify-center mb-6 shadow-[0_0_30px_#818cf8] animate-pulse">
                        <Zap size={48} className="text-indigo-400" />
                    </div>
                    <h1 className="text-5xl font-black text-white italic mb-2 tracking-tighter drop-shadow-[0_0_15px_#818cf8]">NEON SLITHER</h1>
                    <p className="text-gray-400 text-sm mb-8 max-w-xs text-center">Glissez pour diriger votre ver néon. Mangez les lumières pour grandir. Évitez les autres !</p>
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button onClick={() => startGame('SOLO')} className="px-8 py-4 bg-indigo-600 border-2 border-indigo-400 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">
                            <User size={24} /> SOLO (BOTS)
                        </button>
                        <button onClick={() => startGame('ONLINE')} className="px-8 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group">
                            <Globe size={24} className="text-green-500"/> MULTIJOUEUR
                        </button>
                    </div>
                    <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in p-6 text-center">
                    <Skull size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                    <h2 className="text-5xl font-black italic text-white mb-2">CRASH !</h2>
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 mb-8 w-full max-w-[240px]">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">LONGUEUR FINALE</p>
                        <p className="text-4xl font-mono text-white font-bold">{score}</p>
                    </div>
                    {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                    <div className="flex gap-4">
                        <button onClick={() => startGame(gameMode)} className="px-8 py-4 bg-indigo-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
                        <button onClick={() => setGameState('MENU')} className="px-8 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700">MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
};
