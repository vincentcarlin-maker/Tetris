
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Eye, Brain, MousePointerClick, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface LumenOrderGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FOCAL_LENGTH = 400; // Profondeur pour la perspective 3D
const MAX_Z = 2000;       // Point de départ des formes
const MIN_Z = 0;          // Point d'arrivée (l'écran)

// --- TYPES ---
type ShapeType = 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'DIAMOND' | 'HEXAGON';
type GamePhase = 'MENU' | 'DEMO' | 'INPUT' | 'SUCCESS' | 'GAMEOVER';

interface ShapeDef {
    id: number;
    type: ShapeType;
    color: string;
    sides: number;
}

// Configuration des formes
const SHAPES: ShapeDef[] = [
    { id: 0, type: 'CIRCLE', color: '#00f3ff', sides: 0 },   // Cyan
    { id: 1, type: 'SQUARE', color: '#ff00ff', sides: 4 },   // Magenta
    { id: 2, type: 'TRIANGLE', color: '#facc15', sides: 3 }, // Yellow
    { id: 3, type: 'DIAMOND', color: '#9d00ff', sides: 4 },  // Purple
    { id: 4, type: 'HEXAGON', color: '#ef4444', sides: 6 },  // Red
];

// Objet volant pour l'animation
interface FlyingShape {
    id: number; // Unique ID for keying
    shapeIndex: number;
    z: number;
    x: number; // Offset X from center (optional drift)
    y: number; // Offset Y from center
    rotation: number;
    scale: number;
    alpha: number;
}

export const LumenOrderGame: React.FC<LumenOrderGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Game State
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerInput, setPlayerInput] = useState<number[]>([]);
    const [level, setLevel] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Animation Refs
    const animationFrameRef = useRef<number>(0);
    const flyingShapesRef = useRef<FlyingShape[]>([]);
    const demoIndexRef = useRef(0);
    const demoTimerRef = useRef(0);
    const successTimerRef = useRef(0);
    
    // To access state inside loop without closure staleness
    const sequenceRef = useRef<number[]>([]);
    useEffect(() => { sequenceRef.current = sequence; }, [sequence]);

    // Visual Feedback Refs
    const activeShapeIndexRef = useRef<number | null>(null); // Which button is currently lit up
    const flashColorRef = useRef<string | null>(null); // Screen flash color

    const { playMove, playVictory, playGameOver, playBlockHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.lumen || 0;

    // --- INITIALIZATION ---
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_lumen_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_lumen_tutorial_seen', 'true');
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    // --- GAME LOGIC ---

    const generateNextSequence = useCallback((currentLevel: number) => {
        const baseLength = 3;
        const length = baseLength + Math.floor((currentLevel - 1) / 2);
        const availableShapes = Math.min(SHAPES.length, 3 + Math.floor(currentLevel / 3));
        
        const newSeq: number[] = [];
        for(let i=0; i<length; i++) {
            newSeq.push(Math.floor(Math.random() * availableShapes));
        }
        
        setSequence(newSeq);
        setPlayerInput([]);
        demoIndexRef.current = 0;
        flyingShapesRef.current = [];
        setPhase('DEMO');
        
        // Initial delay before first shape flies
        demoTimerRef.current = Date.now() + 1000;
    }, []);

    const startGame = useCallback(() => {
        if (showTutorial) return;
        setScore(0);
        setLevel(1);
        setEarnedCoins(0);
        setSequence([]);
        setPlayerInput([]);
        setPhase('DEMO');
        flyingShapesRef.current = [];
        demoIndexRef.current = 0;
        
        // Start first round
        generateNextSequence(1);
        resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [showTutorial, onReportProgress, resumeAudio, generateNextSequence]);

    const handleInput = (shapeIndex: number) => {
        if (phase !== 'INPUT') return;

        playMove();
        
        // Visual Flash on button
        activeShapeIndexRef.current = shapeIndex;
        setTimeout(() => { activeShapeIndexRef.current = null; }, 200);

        const expected = sequence[playerInput.length];
        
        if (shapeIndex === expected) {
            const newInput = [...playerInput, shapeIndex];
            setPlayerInput(newInput);
            
            if (newInput.length === sequence.length) {
                // Round Complete
                setPhase('SUCCESS');
                playVictory();
                successTimerRef.current = Date.now() + 1500;
                
                // Score Calculation
                const roundPoints = sequence.length * 10;
                setScore(s => s + roundPoints);
                
                // Update High Score immediately for safety
                const currentTotal = score + roundPoints;
                if (currentTotal > bestScore) updateHighScore('lumen', currentTotal);
            }
        } else {
            // Game Over
            setPhase('GAMEOVER');
            flashColorRef.current = '#ff0000'; // Red screen flash
            setTimeout(() => { flashColorRef.current = null; }, 300);
            playGameOver();
            
            const coins = Math.floor(score / 50);
            if (coins > 0) {
                addCoins(coins);
                setEarnedCoins(coins);
            }
            if (onReportProgress) onReportProgress('score', score);
        }
    };

    // --- RENDERING HELPERS ---

    const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shapeDef: ShapeDef, alpha: number = 1, glow: boolean = true) => {
        if (!shapeDef) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = shapeDef.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        
        if (glow) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = shapeDef.color;
        }

        ctx.beginPath();
        if (shapeDef.type === 'CIRCLE') {
            ctx.arc(0, 0, size, 0, Math.PI * 2);
        } else if (shapeDef.type === 'SQUARE') {
            ctx.rect(-size, -size, size * 2, size * 2);
        } else {
            const sides = shapeDef.sides;
            const angleStep = (Math.PI * 2) / sides;
            // Rotate triangle/diamond to point up
            const offset = shapeDef.type === 'TRIANGLE' ? -Math.PI/2 : 0;
            
            ctx.moveTo(size * Math.cos(offset), size * Math.sin(offset));
            for (let i = 1; i <= sides; i++) {
                ctx.lineTo(size * Math.cos(offset + i * angleStep), size * Math.sin(offset + i * angleStep));
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Fill lightly
        ctx.fillStyle = shapeDef.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.fill();

        ctx.restore();
    };

    // --- GAME LOOP ---

    const update = useCallback(() => {
        const now = Date.now();
        const currentSeq = sequenceRef.current; // Use ref for stable access

        // Spawn shapes during DEMO phase
        if (phase === 'DEMO') {
            const speedFactor = Math.max(500, 1000 - (level * 50)); // Gets faster
            
            if (now > demoTimerRef.current && demoIndexRef.current < currentSeq.length) {
                const shapeIdx = currentSeq[demoIndexRef.current];
                // Create a new flying shape starting far away
                flyingShapesRef.current.push({
                    id: Date.now(),
                    shapeIndex: shapeIdx,
                    z: MAX_Z,
                    x: 0, 
                    y: 0,
                    rotation: 0,
                    scale: 0,
                    alpha: 0
                });
                
                playBlockHit(); // Spawn sound
                demoIndexRef.current++;
                demoTimerRef.current = now + speedFactor;
            } else if (demoIndexRef.current >= currentSeq.length && flyingShapesRef.current.length === 0 && currentSeq.length > 0) {
                // All shapes shown and animation finished
                setPhase('INPUT');
            }
        }

        // Handle Success Transition
        if (phase === 'SUCCESS') {
            if (now > successTimerRef.current) {
                setLevel(l => l + 1);
                generateNextSequence(level + 1);
            }
        }

        // Update Flying Shapes
        // Speed increases as it gets closer (perspective illusion)
        for (let i = flyingShapesRef.current.length - 1; i >= 0; i--) {
            const s = flyingShapesRef.current[i];
            const speed = 15 + (level * 2); // Base speed
            
            s.z -= speed * (1 + (MAX_Z - s.z) / 1000); // Accelerate
            s.rotation += 0.02;
            
            // Calculate scale based on Z
            const scale = FOCAL_LENGTH / (FOCAL_LENGTH + s.z);
            s.scale = scale;
            s.alpha = Math.min(1, (MAX_Z - s.z) / 500); // Fade in

            if (s.z <= MIN_Z) {
                flyingShapesRef.current.splice(i, 1);
            }
        }
    }, [phase, level, playBlockHit, generateNextSequence]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Flash Effect
        if (flashColorRef.current) {
            ctx.fillStyle = flashColorRef.current;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalAlpha = 1;
        }

        // Draw Tunnel Grid (Pseudo-3D)
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Radiating lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * CANVAS_WIDTH, centerY + Math.sin(angle) * CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Concentric circles moving towards viewer
        const time = Date.now() / 1000;
        for (let i = 0; i < 5; i++) {
            const offset = (time + i) % 5;
            const z = MAX_Z - (offset / 5) * MAX_Z;
            const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
            const r = 400 * scale;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.globalAlpha = scale * 0.3;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Draw Flying Shapes
        flyingShapesRef.current.forEach(s => {
            const shapeDef = SHAPES[s.shapeIndex];
            if (!shapeDef) return;
            const size = 100 * s.scale;
            
            // Position is center since x,y are 0
            drawShape(ctx, centerX + s.x, centerY + s.y, size, shapeDef, s.alpha, true);
        });
    }, []);

    const loop = useCallback(() => {
        update();
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        animationFrameRef.current = requestAnimationFrame(loop);
    }, [update, draw]);

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loop]);

    // --- UI RENDER ---

    const renderButtons = () => {
        const availableShapesCount = Math.min(SHAPES.length, 3 + Math.floor(level / 3));
        const activeShapes = SHAPES.slice(0, availableShapesCount);
        
        // Arrangement: Arc or Grid
        return (
            <div className="flex gap-4 sm:gap-8 justify-center items-end pb-8 w-full z-20">
                {activeShapes.map((shape, i) => {
                    const isActive = activeShapeIndexRef.current === i;
                    const isDisabled = phase !== 'INPUT';
                    
                    return (
                        <button
                            key={shape.id}
                            onClick={() => handleInput(i)}
                            disabled={isDisabled}
                            className={`
                                relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-100
                                ${isActive ? 'scale-110 bg-white/20' : 'bg-black/40 hover:bg-white/10'}
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                            `}
                            style={{ 
                                borderColor: shape.color,
                                boxShadow: isActive ? `0 0 30px ${shape.color}` : `0 0 10px ${shape.color}40`
                            }}
                        >
                            {/* SVG Icon representing shape */}
                            <svg width="40" height="40" viewBox="0 0 100 100" className="drop-shadow-md">
                                <path 
                                    d={
                                        shape.type === 'CIRCLE' ? "M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" :
                                        shape.type === 'SQUARE' ? "M 10,10 L 90,10 L 90,90 L 10,90 Z" :
                                        shape.type === 'TRIANGLE' ? "M 50,10 L 90,90 L 10,90 Z" :
                                        shape.type === 'DIAMOND' ? "M 50,10 L 90,50 L 50,90 L 10,50 Z" :
                                        "M 25,10 L 75,10 L 95,50 L 75,90 L 25,90 L 5,50 Z" // Hexagon
                                    } 
                                    fill="none" 
                                    stroke={shape.color} 
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    );
                })}
            </div>
        );
    };

    // --- MENU VIEW ---
    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <div className="w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_30px_#00f3ff] animate-pulse">
                    <Eye size={48} className="text-cyan-400" />
                </div>
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22d3ee]">LUMEN ORDER</h1>
                <p className="text-gray-400 text-sm mb-8 max-w-xs text-center">Mémorisez la séquence lumineuse qui émerge du néant.</p>
                
                <button onClick={startGame} className="px-8 py-4 bg-cyan-600 border-2 border-cyan-400 text-white font-bold rounded-xl hover:bg-cyan-500 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95 group">
                    <Play size={24} className="fill-white"/> LANCER
                </button>
                
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black relative overflow-hidden text-white font-sans touch-none select-none">
            {/* Background Canvas */}
            <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT} 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {showTutorial && <TutorialOverlay gameId="lumen" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="absolute top-0 w-full max-w-2xl flex items-center justify-between z-20 p-4">
                <button onClick={onBack} className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">LUMEN</h1>
                    <div className="flex gap-4 text-xs font-mono font-bold text-gray-400">
                        <span>NIV {level}</span>
                        <span>SCORE {score}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-900/80 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={startGame} className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Phase Indicator */}
            <div className="absolute top-24 pointer-events-none z-10">
                {phase === 'DEMO' && <div className="text-cyan-400 font-black tracking-[0.5em] text-sm animate-pulse">OBSERVEZ</div>}
                {phase === 'INPUT' && <div className="text-yellow-400 font-black tracking-[0.5em] text-sm animate-bounce">RÉPÉTEZ</div>}
                {phase === 'SUCCESS' && <div className="text-green-400 font-black tracking-[0.5em] text-lg scale-125 transition-transform">SUCCÈS</div>}
            </div>

            {/* Controls (Bottom) */}
            <div className="mt-auto w-full max-w-2xl px-4 z-20">
                {renderButtons()}
            </div>

            {/* Game Over Overlay */}
            {phase === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in fade-in">
                    <Zap size={64} className="text-red-500 mb-4 drop-shadow-[0_0_20px_red]" />
                    <h2 className="text-5xl font-black text-red-500 italic mb-2">ÉCHEC</h2>
                    <div className="text-center mb-6">
                        <p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p>
                        <p className="text-4xl font-mono text-white">{score}</p>
                    </div>
                    {earnedCoins > 0 && (
                        <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                            <Coins className="text-yellow-400" size={20} />
                            <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}
                    <button onClick={startGame} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                        <RefreshCw size={20} /> REJOUER
                    </button>
                </div>
            )}
        </div>
    );
};
