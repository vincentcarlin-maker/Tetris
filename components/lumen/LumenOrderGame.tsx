
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Eye, Brain, MousePointerClick, Zap, ArrowRight, Sparkles } from 'lucide-react';
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
const FOCAL_LENGTH = 400; 
const MAX_Z = 2000;       
const MIN_Z = 0;          

type ShapeType = 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'DIAMOND' | 'HEXAGON';
type GamePhase = 'MENU' | 'DEMO' | 'INPUT' | 'SUCCESS' | 'GAMEOVER';

interface ShapeDef { id: number; type: ShapeType; color: string; sides: number; }

const SHAPES: ShapeDef[] = [
    { id: 0, type: 'CIRCLE', color: '#00f3ff', sides: 0 },   
    { id: 1, type: 'SQUARE', color: '#ff00ff', sides: 4 },   
    { id: 2, type: 'TRIANGLE', color: '#facc15', sides: 3 }, 
    { id: 3, type: 'DIAMOND', color: '#9d00ff', sides: 4 },  
    { id: 4, type: 'HEXAGON', color: '#ef4444', sides: 6 },  
];

interface FlyingShape { id: number; shapeIndex: number; z: number; x: number; y: number; rotation: number; scale: number; alpha: number; }

// Logo de marque spécifique pour Lumen Order
const LumenBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full overflow-visible">
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Effet de lueur pulsante en fond */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse"></div>
            
            {/* Carré Néon (Extérieur) */}
            <div className="absolute w-24 h-24 border-2 border-purple-500 rounded-lg rotate-12 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-[spin_10s_linear_infinite] opacity-60"></div>
            
            {/* Triangle Néon (Milieu) */}
            <div className="absolute w-16 h-16 border-b-2 border-l-2 border-yellow-400 -rotate-12 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-[spin_7s_linear_infinite_reverse] opacity-80" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>

            {/* Cercle Central (Noyau) */}
            <div className="relative z-10 w-12 h-12 bg-gray-950 border-2 border-cyan-400 rounded-full shadow-[0_0_20px_#00f3ff] flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>
                <Sparkles size={20} className="text-white animate-ping" />
                
                {/* Effet de scanline interne */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/40 blur-[1px] animate-[scan_1.5s_linear_infinite]"></div>
            </div>

            {/* Particules orbitales */}
            <div className="absolute w-2 h-2 bg-pink-500 rounded-full blur-[1px] animate-[orbit_4s_linear_infinite] left-0 top-0"></div>
            <div className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full blur-[1px] animate-[orbit_3s_linear_infinite_reverse] right-0 bottom-0"></div>
        </div>

        <style>{`
            @keyframes scan {
                0% { transform: translateY(-10px); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(50px); opacity: 0; }
            }
            @keyframes orbit {
                from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
                to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
            }
        `}</style>
    </div>
);

export const LumenOrderGame: React.FC<LumenOrderGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [score, setScore] = useState(0);
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerInput, setPlayerInput] = useState<number[]>([]);
    const [level, setLevel] = useState(1);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    const animationFrameRef = useRef<number>(0);
    const flyingShapesRef = useRef<FlyingShape[]>([]);
    const demoIndexRef = useRef(0);
    const demoTimerRef = useRef(0);
    const successTimerRef = useRef(0);
    const sequenceRef = useRef<number[]>([]);
    useEffect(() => { sequenceRef.current = sequence; }, [sequence]);

    const activeShapeIndexRef = useRef<number | null>(null); 
    const flashColorRef = useRef<string | null>(null); 

    const { playMove, playVictory, playGameOver, playBlockHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.lumen || 0;

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_lumen_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_lumen_tutorial_seen', 'true');
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const generateNextSequence = useCallback((currentLevel: number) => {
        const baseLength = 3;
        const length = baseLength + Math.floor((currentLevel - 1) / 2);
        const availableShapes = Math.min(SHAPES.length, 3 + Math.floor(currentLevel / 3));
        const newSeq: number[] = [];
        for(let i=0; i<length; i++) { newSeq.push(Math.floor(Math.random() * availableShapes)); }
        setSequence(newSeq);
        setPlayerInput([]);
        demoIndexRef.current = 0;
        flyingShapesRef.current = [];
        setPhase('DEMO');
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
        generateNextSequence(1);
        resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [showTutorial, onReportProgress, resumeAudio, generateNextSequence]);

    const handleInput = (shapeIndex: number) => {
        if (phase !== 'INPUT') return;
        playMove();
        activeShapeIndexRef.current = shapeIndex;
        setTimeout(() => { activeShapeIndexRef.current = null; }, 200);

        const expected = sequence[playerInput.length];
        if (shapeIndex === expected) {
            const newInput = [...playerInput, shapeIndex];
            setPlayerInput(newInput);
            if (newInput.length === sequence.length) {
                setPhase('SUCCESS');
                playVictory();
                successTimerRef.current = Date.now() + 1500;
                const roundPoints = sequence.length * 10;
                setScore(s => s + roundPoints);
                const currentTotal = score + roundPoints;
                if (currentTotal > bestScore) updateHighScore('lumen', currentTotal);
            }
        } else {
            setPhase('GAMEOVER');
            flashColorRef.current = '#ff0000'; 
            setTimeout(() => { flashColorRef.current = null; }, 300);
            playGameOver();
            const coins = Math.floor(score / 50);
            if (coins > 0) { addCoins(coins); setEarnedCoins(coins); }
            if (onReportProgress) onReportProgress('score', score);
        }
    };

    const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shapeDef: ShapeDef, alpha: number = 1, glow: boolean = true) => {
        if (!shapeDef) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = shapeDef.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        if (glow) { ctx.shadowBlur = 20; ctx.shadowColor = shapeDef.color; }
        ctx.beginPath();
        if (shapeDef.type === 'CIRCLE') { ctx.arc(0, 0, size, 0, Math.PI * 2); } 
        else if (shapeDef.type === 'SQUARE') { ctx.rect(-size, -size, size * 2, size * 2); } 
        else {
            const sides = shapeDef.sides;
            const angleStep = (Math.PI * 2) / sides;
            const offset = shapeDef.type === 'TRIANGLE' ? -Math.PI/2 : 0;
            ctx.moveTo(size * Math.cos(offset), size * Math.sin(offset));
            for (let i = 1; i <= sides; i++) { ctx.lineTo(size * Math.cos(offset + i * angleStep), size * Math.sin(offset + i * angleStep)); }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = shapeDef.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.fill();
        ctx.restore();
    };

    const update = useCallback(() => {
        const now = Date.now();
        const currentSeq = sequenceRef.current; 

        if (phase === 'DEMO') {
            const speedFactor = Math.max(500, 1000 - (level * 50)); 
            if (now > demoTimerRef.current && demoIndexRef.current < currentSeq.length) {
                const shapeIdx = currentSeq[demoIndexRef.current];
                flyingShapesRef.current.push({ id: Date.now(), shapeIndex: shapeIdx, z: MAX_Z, x: 0, y: 0, rotation: 0, scale: 0, alpha: 0 });
                playBlockHit();
                demoIndexRef.current++;
                demoTimerRef.current = now + speedFactor;
            } else if (demoIndexRef.current >= currentSeq.length && flyingShapesRef.current.length === 0 && currentSeq.length > 0) {
                setPhase('INPUT');
            }
        }
        if (phase === 'SUCCESS') {
            if (now > successTimerRef.current) {
                setLevel(l => l + 1);
                generateNextSequence(level + 1);
            }
        }

        for (let i = flyingShapesRef.current.length - 1; i >= 0; i--) {
            const s = flyingShapesRef.current[i];
            const speed = 15 + (level * 2);
            s.z -= speed * (1 + (MAX_Z - s.z) / 1000); 
            s.rotation += 0.02;
            const scale = FOCAL_LENGTH / (FOCAL_LENGTH + s.z);
            s.scale = scale;
            s.alpha = Math.min(1, (MAX_Z - s.z) / 500); 
            if (s.z <= MIN_Z) { flyingShapesRef.current.splice(i, 1); }
        }
    }, [phase, level, playBlockHit, generateNextSequence]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (flashColorRef.current) { ctx.fillStyle = flashColorRef.current; ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); ctx.globalAlpha = 1; }
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX + Math.cos(angle) * CANVAS_WIDTH, centerY + Math.sin(angle) * CANVAS_HEIGHT); ctx.stroke();
        }
        const time = Date.now() / 1000;
        for (let i = 0; i < 5; i++) {
            const offset = (time + i) % 5;
            const z = MAX_Z - (offset / 5) * MAX_Z;
            const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
            const r = 400 * scale;
            ctx.beginPath(); ctx.arc(centerX, centerY, r, 0, Math.PI * 2); ctx.globalAlpha = scale * 0.3; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        flyingShapesRef.current.forEach(s => {
            const shapeDef = SHAPES[s.shapeIndex];
            if (!shapeDef) return;
            const size = 100 * s.scale;
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

    const renderButtons = () => {
        const availableShapesCount = Math.min(SHAPES.length, 3 + Math.floor(level / 3));
        const activeShapes = SHAPES.slice(0, availableShapesCount);
        return (
            <div className="flex gap-4 sm:gap-8 justify-center items-end pb-8 w-full z-20">
                {activeShapes.map((shape, i) => {
                    const isActive = activeShapeIndexRef.current === i;
                    const isDisabled = phase !== 'INPUT';
                    return (
                        <button key={shape.id} onClick={() => handleInput(i)} disabled={isDisabled}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-100 ${isActive ? 'scale-110 bg-white/20' : 'bg-black/40 hover:bg-white/10'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                            style={{ borderColor: shape.color, boxShadow: isActive ? `0 0 30px ${shape.color}` : `0 0 10px ${shape.color}40` }}
                        >
                            <svg width="40" height="40" viewBox="0 0 100 100" className="drop-shadow-md">
                                <path d={shape.type === 'CIRCLE' ? "M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" : shape.type === 'SQUARE' ? "M 10,10 L 90,10 L 90,90 L 10,90 Z" : shape.type === 'TRIANGLE' ? "M 50,10 L 90,90 L 10,90 Z" : shape.type === 'DIAMOND' ? "M 50,10 L 90,50 L 50,90 L 10,50 Z" : "M 25,10 L 75,10 L 95,50 L 75,90 L 25,90 L 5,50 Z"} fill="none" stroke={shape.color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    );
                })}
            </div>
        );
    };

    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <LumenBrandingLogo />
                        <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter w-full uppercase mb-4">
                            LUMEN<br className="md:hidden"/> ORDER
                        </h1>
                        <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm">
                            <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase">Mémoire • Vitesse • Lumière</p>
                        </div>
                    </div>

                    <div className="w-full max-w-sm md:max-w-xl flex-shrink-0">
                         <button onClick={startGame} className="group relative w-full h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"><Play size={32} className="text-cyan-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors uppercase">Jouer</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Mémorisez la séquence et répétez-la sans erreur.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">Commencer la mission <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest italic"><Home size={14} /> Retour arcade</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black relative overflow-hidden text-white font-sans touch-none select-none">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            {showTutorial && <TutorialOverlay gameId="lumen" onClose={() => setShowTutorial(false)} />}
            <div className="absolute top-0 w-full max-w-2xl flex items-center justify-between z-20 p-4">
                <button onClick={() => setPhase('MENU')} className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">LUMEN</h1>
                    <div className="flex gap-4 text-xs font-mono font-bold text-gray-400"><span>NIV {level}</span><span>SCORE {score}</span></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-900/80 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><HelpCircle size={20} /></button>
                    <button onClick={startGame} className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><RefreshCw size={20} /></button>
                </div>
            </div>
            <div className="absolute top-24 pointer-events-none z-10">
                {phase === 'DEMO' && <div className="text-cyan-400 font-black tracking-[0.5em] text-sm animate-pulse uppercase">Observez la séquence</div>}
                {phase === 'INPUT' && <div className="text-yellow-400 font-black tracking-[0.5em] text-sm animate-bounce uppercase">À vous de jouer</div>}
                {phase === 'SUCCESS' && <div className="text-green-400 font-black tracking-[0.5em] text-lg scale-125 transition-transform uppercase italic">Parfait !</div>}
            </div>
            <div className="mt-auto w-full max-w-2xl px-4 z-20">{renderButtons()}</div>
            {phase === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in fade-in">
                    <Zap size={64} className="text-red-500 mb-4 drop-shadow-[0_0_20px_red]" />
                    <h2 className="text-5xl font-black text-red-500 italic mb-2 uppercase">Échec</h2>
                    <div className="text-center mb-6"><p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Score Final</p><p className="text-4xl font-mono text-white">{score}</p></div>
                    {earnedCoins > 0 && (<div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}
                    <button onClick={startGame} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95 flex items-center gap-2 uppercase italic"><RefreshCw size={20} /> Recharger</button>
                    <button onClick={() => setPhase('MENU')} className="mt-4 text-gray-500 hover:text-white underline text-xs font-bold uppercase tracking-widest">Retour</button>
                </div>
            )}
        </div>
    );
};
