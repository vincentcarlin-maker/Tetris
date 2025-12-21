
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, HelpCircle, X, MousePointer2, Scissors, Zap, ArrowRight, Play } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface StackGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONSTANTS ---
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const BLOCK_HEIGHT = 30;
const INITIAL_SIZE = 180;
const MOVE_SPEED = 3.5;
const COLORS_START = 180;
const MOVEMENT_RANGE = 280; 
const SPAWN_POS = -280;

// --- TYPES ---
interface Block {
    x: number;
    z: number;
    width: number;
    depth: number;
    y: number;
    color: string;
}

interface Debris {
    x: number;
    z: number;
    y: number;
    width: number;
    depth: number;
    color: string;
    vx: number;
    vy: number;
    vz: number;
    scale: number;
}

type GamePhase = 'MENU' | 'IDLE' | 'PLAYING' | 'GAMEOVER';

export const StackGame: React.FC<StackGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>('MENU');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [perfectCount, setPerfectCount] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    const { playMove, playLand, playGameOver, playVictory, playBlockHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.stack || 0;

    const onReportProgressRef = useRef(onReportProgress);
    useEffect(() => { onReportProgressRef.current = onReportProgress; }, [onReportProgress]);

    // --- GAME STATE REFS ---
    const stackRef = useRef<Block[]>([]);
    const debrisRef = useRef<Debris[]>([]);
    const currentBlockRef = useRef<{ x: number, z: number, dir: 1 | -1, axis: 'x' | 'z' }>({ x: 0, z: 0, dir: 1, axis: 'x' });
    const cameraYRef = useRef(0);
    const animationFrameRef = useRef<number>(0);
    
    // Cooldown refs to prevent ghost clicks (double firing on mobile)
    const lastActionTimeRef = useRef(0); 
    
    const limitRef = useRef({ width: INITIAL_SIZE, depth: INITIAL_SIZE });

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_stack_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_stack_tutorial_seen', 'true');
        }
    }, []);

    // --- HELPERS ---
    const getHSL = (index: number) => {
        const hue = (COLORS_START + index * 5) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    };

    const getDarkerHSL = (color: string) => color.replace('60%', '40%');
    const getTopColor = (color: string) => color.replace('60%', '70%');

    const isoX = (x: number, z: number) => (x - z) * Math.cos(Math.PI / 6);
    const isoY = (x: number, z: number, y: number) => (x + z) * Math.sin(Math.PI / 6) - y;

    // --- DRAW FUNCTIONS ---
    const drawBlock = (ctx: CanvasRenderingContext2D, b: {x: number, z: number, y: number, width: number, depth: number, color: string}) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2 + 200;
        const relY = b.y * BLOCK_HEIGHT - cameraYRef.current;
        
        const w = b.width;
        const d = b.depth;
        
        // Top Face Points
        const p1 = { x: centerX + isoX(b.x - w/2, b.z - d/2), y: centerY + isoY(b.x - w/2, b.z - d/2, relY + BLOCK_HEIGHT) };
        const p2 = { x: centerX + isoX(b.x + w/2, b.z - d/2), y: centerY + isoY(b.x + w/2, b.z - d/2, relY + BLOCK_HEIGHT) };
        const p3 = { x: centerX + isoX(b.x + w/2, b.z + d/2), y: centerY + isoY(b.x + w/2, b.z + d/2, relY + BLOCK_HEIGHT) };
        const p4 = { x: centerX + isoX(b.x - w/2, b.z + d/2), y: centerY + isoY(b.x - w/2, b.z + d/2, relY + BLOCK_HEIGHT) };
        
        // Bottom points (visible ones)
        const p2b = { x: p2.x, y: p2.y + BLOCK_HEIGHT };
        const p3b = { x: p3.x, y: p3.y + BLOCK_HEIGHT };
        const p4b = { x: p4.x, y: p4.y + BLOCK_HEIGHT };

        // Left Face
        ctx.fillStyle = getDarkerHSL(b.color);
        ctx.beginPath();
        ctx.moveTo(p4.x, p4.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p3b.x, p3b.y);
        ctx.lineTo(p4b.x, p4b.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Face
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2b.x, p2b.y);
        ctx.lineTo(p3b.x, p3b.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Top Face
        ctx.fillStyle = getTopColor(b.color);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#101020');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Debris
        debrisRef.current.forEach(d => {
            drawBlock(ctx, { ...d, width: d.width * d.scale, depth: d.depth * d.scale });
        });

        // Stack
        stackRef.current.forEach(b => {
            drawBlock(ctx, b);
        });

        // Moving Block
        const curr = currentBlockRef.current;
        const topBlock = stackRef.current[stackRef.current.length - 1];
        
        if (topBlock) {
             drawBlock(ctx, {
                x: curr.x,
                z: curr.z,
                y: topBlock.y + 1,
                width: limitRef.current.width,
                depth: limitRef.current.depth,
                color: getHSL(stackRef.current.length)
            });
        }
    }, []);

    const update = () => {
        const curr = currentBlockRef.current;
        const speed = Math.min(8, MOVE_SPEED + (score * 0.05));

        if (curr.axis === 'x') {
            curr.x += speed * curr.dir;
            if (curr.x > MOVEMENT_RANGE || curr.x < -MOVEMENT_RANGE) curr.dir *= -1;
        } else {
            curr.z += speed * curr.dir;
            if (curr.z > MOVEMENT_RANGE || curr.z < -MOVEMENT_RANGE) curr.dir *= -1;
        }

        const targetY = (stackRef.current.length - 5) * BLOCK_HEIGHT;
        cameraYRef.current += (Math.max(0, targetY) - cameraYRef.current) * 0.1;

        for (let i = debrisRef.current.length - 1; i >= 0; i--) {
            const d = debrisRef.current[i];
            d.y -= d.vy;
            d.vy -= 1;
            d.x += d.vx;
            d.z += d.vz;
            d.scale -= 0.02;
            if (d.y < cameraYRef.current - 400 || d.scale <= 0) {
                debrisRef.current.splice(i, 1);
            }
        }
    };

    const resetGame = useCallback(() => {
        stackRef.current = [];
        debrisRef.current = [];
        
        // Initial Block
        stackRef.current.push({
            x: 0,
            z: 0,
            width: INITIAL_SIZE,
            depth: INITIAL_SIZE,
            y: 0,
            color: getHSL(0)
        });

        currentBlockRef.current = { x: SPAWN_POS, z: 0, dir: 1, axis: 'x' };
        limitRef.current = { width: INITIAL_SIZE, depth: INITIAL_SIZE };
        cameraYRef.current = 0;
        
        setScore(0);
        setPerfectCount(0);
        setGamePhase('IDLE');
        setEarnedCoins(0);
        
        if (onReportProgressRef.current) onReportProgressRef.current('play', 1);
        
        // Initial Render Tick
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }, []);

    // --- EFFECT: MOUNT ---
    useEffect(() => {
        if (gamePhase !== 'MENU') {
            resetGame();
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [resetGame, gamePhase]);

    const spawnNextBlock = () => {
        const topBlock = stackRef.current[stackRef.current.length - 1];
        if (!topBlock) return; 

        const nextY = topBlock.y + 1;
        const axis = nextY % 2 === 0 ? 'x' : 'z';
        
        currentBlockRef.current = {
            x: axis === 'x' ? SPAWN_POS : topBlock.x,
            z: axis === 'z' ? SPAWN_POS : topBlock.z,
            dir: 1,
            axis
        };
    };

    const handleGameOver = () => {
        setGamePhase('GAMEOVER');
        playGameOver();
        updateHighScore('stack', score);
        if (onReportProgressRef.current) onReportProgressRef.current('score', score);
        
        const coins = Math.floor(score / 5);
        if (coins > 0) {
            addCoins(coins);
            setEarnedCoins(coins);
        }
        
        const curr = currentBlockRef.current;
        debrisRef.current.push({
            x: curr.x,
            z: curr.z,
            y: (stackRef.current.length) * BLOCK_HEIGHT,
            width: limitRef.current.width,
            depth: limitRef.current.depth,
            color: getHSL(stackRef.current.length),
            vx: 0,
            vz: 0,
            vy: 0,
            scale: 1
        });
    };

    const placeBlock = () => {
        const current = currentBlockRef.current;
        const topBlock = stackRef.current[stackRef.current.length - 1];
        
        if (!topBlock) return;

        const { axis } = current;
        
        // Calculate difference between centers
        const delta = axis === 'x' ? current.x - topBlock.x : current.z - topBlock.z;
        const absDelta = Math.abs(delta);
        
        const size = axis === 'x' ? limitRef.current.width : limitRef.current.depth;
        
        // PERFECT HIT CHECK
        if (absDelta < 5) {
            // Snap to grid
            if (axis === 'x') current.x = topBlock.x;
            else current.z = topBlock.z;
            
            setPerfectCount(p => p + 1);
            playVictory();
            
            // Expand slightly on consecutive perfects (up to initial size)
            if (perfectCount > 2) {
                if (axis === 'x') limitRef.current.width = Math.min(INITIAL_SIZE, limitRef.current.width + 5);
                else limitRef.current.depth = Math.min(INITIAL_SIZE, limitRef.current.depth + 5);
            }
            
            const newBlock: Block = {
                x: current.x,
                z: current.z,
                width: limitRef.current.width,
                depth: limitRef.current.depth,
                y: topBlock.y + 1,
                color: getHSL(stackRef.current.length)
            };
            stackRef.current.push(newBlock);
            setScore(s => s + 1);
            spawnNextBlock();
            return;
        }

        // RESET PERFECT COUNT
        setPerfectCount(0);
        playBlockHit();

        // CHECK IF MISSED COMPLETELY
        if (absDelta >= size) {
            handleGameOver();
            return;
        }

        // CALCULATE CUT
        const newSize = size - absDelta;
        const correction = delta / 2;
        
        // New block logic
        const newX = axis === 'x' ? current.x - correction : current.x;
        const newZ = axis === 'z' ? current.z - correction : current.z;
        
        // Debris Logic
        let debrisX = current.x;
        let debrisZ = current.z;
        
        if (axis === 'x') {
            if (delta > 0) {
                // Moved Right -> Debris on Right
                debrisX = topBlock.x + (size / 2) + (absDelta / 2);
            } else {
                // Moved Left -> Debris on Left
                debrisX = topBlock.x - (size / 2) - (absDelta / 2);
            }
        } else {
            if (delta > 0) {
                debrisZ = topBlock.z + (size / 2) + (absDelta / 2);
            } else {
                debrisZ = topBlock.z - (size / 2) - (absDelta / 2);
            }
        }

        debrisRef.current.push({
            x: debrisX,
            z: debrisZ,
            y: (topBlock.y + 1) * BLOCK_HEIGHT,
            width: axis === 'x' ? absDelta : limitRef.current.width,
            depth: axis === 'z' ? absDelta : limitRef.current.depth,
            color: getHSL(stackRef.current.length),
            vx: axis === 'x' ? (delta > 0 ? 3 : -3) : 0,
            vz: axis === 'z' ? (delta > 0 ? 3 : -3) : 0,
            vy: 5,
            scale: 1
        });

        // Update Limits
        if (axis === 'x') limitRef.current.width = newSize;
        else limitRef.current.depth = newSize;

        // Add Block
        const newBlock: Block = {
            x: newX,
            z: newZ,
            width: limitRef.current.width,
            depth: limitRef.current.depth,
            y: topBlock.y + 1,
            color: getHSL(stackRef.current.length)
        };

        stackRef.current.push(newBlock);
        setScore(s => s + 1);
        spawnNextBlock();
    };

    // --- GAME LOOP EFFECT ---
    useEffect(() => {
        let animationId: number;
        
        const run = () => {
            if (gamePhase === 'PLAYING' && !showTutorial) {
                update();
            }
            if (gamePhase !== 'MENU' && canvasRef.current) {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) draw(ctx);
            }
            animationId = requestAnimationFrame(run);
        };
        run();
        
        return () => cancelAnimationFrame(animationId);
    }, [gamePhase, draw, showTutorial]);

    // --- INPUT HANDLERS ---
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();
        
        if (showTutorial) return;

        if (gamePhase === 'IDLE') {
            setGamePhase('PLAYING');
            lastActionTimeRef.current = Date.now(); // Sync timer
            spawnNextBlock();
            resumeAudio();
        }
    };

    const handleAction = (e: React.MouseEvent | React.TouchEvent) => {
        // Ignore clicks on UI buttons
        if ((e.target as HTMLElement).closest('button')) return;

        // Ensure touches are handled immediately
        if (e.cancelable && e.type === 'touchstart') e.preventDefault();

        if (showTutorial) return;

        const now = Date.now();
        // Cooldown to prevent ghost clicks (double triggering)
        if (now - lastActionTimeRef.current < 200) return;

        if (gamePhase === 'GAMEOVER') {
            // Wait user click button
            return;
        }
        if (gamePhase === 'PLAYING') {
            placeBlock();
            lastActionTimeRef.current = now;
        }
    };

    const toggleTutorial = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTutorial(prev => !prev);
    };

    if (gamePhase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Layers size={56} className="text-indigo-400 drop-shadow-[0_0_25px_rgba(99,102,241,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] tracking-tighter w-full">
                                NEON<br className="md:hidden"/> STACK
                            </h1>
                            <Layers size={56} className="text-indigo-400 drop-shadow-[0_0_25px_rgba(99,102,241,0.8)] animate-pulse hidden md:block" />
                        </div>
                    </div>

                    <div className="w-full max-w-sm md:max-w-xl flex-shrink-0">
                         <button onClick={() => setGamePhase('IDLE')} className="group relative w-full h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-indigo-500/50 hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]"><Play size={32} className="text-indigo-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-indigo-300 transition-colors">JOUER</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Empilez les blocs le plus haut possible.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-indigo-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">COMMENCER <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4" 
            onMouseDown={handleAction} 
            onTouchStart={handleAction}
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 shrink-0 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); setGamePhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 pointer-events-auto active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON STACK</h1>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={toggleTutorial} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-20 pointer-events-none">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{score}</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">BEST</span><span className="text-2xl font-mono font-bold text-yellow-400">{Math.max(score, bestScore)}</span></div>
            </div>

            {/* Canvas */}
            <div className="relative w-full max-w-lg h-full max-h-[600px] bg-black/80 border-2 border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden backdrop-blur-md z-10 cursor-pointer">
                <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain" />
                
                {gamePhase === 'IDLE' && !showTutorial && (
                    <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30 cursor-pointer hover:bg-black/50 transition-colors"
                        onMouseDown={handleStart} 
                        onTouchStart={handleStart}
                    >
                        <Layers size={48} className="text-cyan-400 animate-pulse mb-2"/>
                        <p className="text-cyan-400 font-bold tracking-widest animate-pulse">APPUYEZ POUR JOUER</p>
                    </div>
                )}

                {/* TUTORIAL OVERLAY */}
                {showTutorial && <TutorialOverlay gameId="stack" onClose={() => setShowTutorial(false)} />}

                {gamePhase === 'GAMEOVER' && !showTutorial && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30 animate-in zoom-in fade-in pointer-events-auto">
                        <h2 className="text-5xl font-black text-red-500 italic mb-2 drop-shadow-[0_0_10px_red]">PERDU</h2>
                        <div className="text-center mb-6">
                            <p className="text-gray-400 text-xs tracking-widest">HAUTEUR FINALE</p>
                            <p className="text-4xl font-mono text-white">{score}</p>
                        </div>
                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); resetGame(); setGamePhase('IDLE'); }} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2 pointer-events-auto">
                            <RefreshCw size={20} /> REJOUER
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
