
import React, { useRef, useEffect } from 'react';
import { Home, HelpCircle, Trophy, Crosshair, Map, ChevronLeft, ChevronRight, User, Globe, Loader2, Coins, RefreshCw } from 'lucide-react';
import { MAPS } from '../constants';

interface ArenaUIProps {
    gameState: string;
    gameMode: string;
    score: number;
    timeLeft: number;
    respawnTimer: number;
    killFeed: any[];
    leaderboard: any[];
    earnedCoins: number;
    selectedMapIndex: number;
    onlineStep: string;
    isHost: boolean;
    hasOpponent: boolean;
    onBack: () => void;
    onToggleTutorial: () => void;
    onSetGameMode: (mode: 'SOLO' | 'ONLINE') => void;
    onStartGame: (mode?: 'SOLO' | 'ONLINE') => void;
    onChangeMap: (delta: number) => void;
    onCancelHosting: () => void;
    onLeaveGame: () => void;
    onRematch: () => void;
    onReturnToMenu: () => void;
    controlsRef: React.MutableRefObject<any>;
}

export const ArenaUI: React.FC<ArenaUIProps> = ({
    gameState, gameMode, score, timeLeft, respawnTimer, killFeed, leaderboard, earnedCoins,
    selectedMapIndex, onlineStep, isHost, hasOpponent,
    onBack, onToggleTutorial, onSetGameMode, onStartGame, onChangeMap,
    onCancelHosting, onLeaveGame, onRematch, onReturnToMenu, controlsRef
}) => {
    // Joystick Refs
    const leftZoneRef = useRef<HTMLDivElement>(null);
    const rightZoneRef = useRef<HTMLDivElement>(null);
    const leftKnobRef = useRef<HTMLDivElement>(null);
    const rightKnobRef = useRef<HTMLDivElement>(null);
    const activeTouches = useRef<{ move: number | null, aim: number | null }>({ move: null, aim: null });

    // Joystick Logic
    const updateStick = (type: 'move' | 'aim', clientX: number, clientY: number, zone: HTMLDivElement) => {
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = rect.width / 2 - 25; 

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let normX = 0;
        let normY = 0;

        if (dist > 0) {
            const limitedDist = Math.min(dist, maxDist);
            const ratio = limitedDist / dist;
            
            const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
            if (knob) knob.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;

            const magnitude = Math.min(dist / maxDist, 1.0);
            normX = (dx / dist) * magnitude;
            normY = (dy / dist) * magnitude;
        }

        if (type === 'move') controlsRef.current.move = { x: normX, y: normY, active: true };
        else controlsRef.current.aim = { x: normX, y: normY, active: true };
    };

    const resetStick = (type: 'move' | 'aim') => {
        const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
        if (knob) knob.style.transform = `translate(0px, 0px)`;
        
        if (type === 'move') controlsRef.current.move = { x: 0, y: 0, active: false };
        else controlsRef.current.aim = { x: 0, y: 0, active: false };
    };

    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            if (e.target !== leftZoneRef.current && e.target !== rightZoneRef.current && !(e.target as HTMLElement).closest('button')) {
               e.preventDefault(); 
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                
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

                if (e.type === 'touchmove') {
                    if (t.identifier === activeTouches.current.move && leftZoneRef.current) updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                    if (t.identifier === activeTouches.current.aim && rightZoneRef.current) updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
                }

                if (e.type === 'touchend' || e.type === 'touchcancel') {
                    if (t.identifier === activeTouches.current.move) { activeTouches.current.move = null; resetStick('move'); }
                    if (t.identifier === activeTouches.current.aim) { activeTouches.current.aim = null; resetStick('aim'); }
                }
            }
        };

        const container = document.getElementById('arena-ui-container');
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

    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center pointer-events-none">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between z-20 mb-2 p-4 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-3 bg-gray-900/80 rounded-xl text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 pointer-events-auto active:scale-95 transition-all">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,217,255,0.5)] tracking-widest">NEON ARENA</h1>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); onToggleTutorial(); }} className="p-3 bg-gray-900/80 rounded-xl text-yellow-400 border border-yellow-500/30 hover:bg-yellow-900/50 active:scale-95 transition-all"><HelpCircle size={20} /></button>
                </div>
            </div>

            {/* In-Game HUD */}
            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    <div className="absolute top-0 left-0 w-full flex justify-between p-4 z-20">
                        <div className="flex flex-col gap-1">
                            {killFeed.map(k => (
                                <div key={k.id} className="text-xs bg-black/60 px-2 py-1 rounded text-white animate-in fade-in">
                                    <span className="text-cyan-400 font-bold">{k.killer}</span>
                                    <span className="text-gray-400 mx-1">killed</span>
                                    <span className="text-pink-400">{k.victim}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center">
                            <div className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}
                            </div>
                            {gameState === 'RESPAWNING' && (
                                <div className="mt-2 bg-red-900/80 px-4 py-1 rounded text-red-200 font-bold animate-pulse border border-red-500 text-xs">
                                    RESPAWN DANS {Math.ceil(respawnTimer / 1000)}s
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
                    {/* Joysticks Zone - Below Canvas */}
                    <div className="absolute bottom-0 w-full h-48 grid grid-cols-2 gap-4 shrink-0 z-40 p-4 pointer-events-auto">
                        <div ref={leftZoneRef} className="relative bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 transition-colors">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none"><div className="w-20 h-20 rounded-full border-2 border-cyan-500"></div></div>
                            <div ref={leftKnobRef} className="w-12 h-12 bg-cyan-500/80 rounded-full shadow-[0_0_15px_#00f3ff] relative pointer-events-none"><div className="absolute inset-0 rounded-full border-2 border-white opacity-50"></div></div>
                            <span className="absolute bottom-2 text-[10px] text-cyan-500 font-bold tracking-widest pointer-events-none">BOUGER</span>
                        </div>
                        <div ref={rightZoneRef} className="relative bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 transition-colors">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none"><div className="w-20 h-20 rounded-full border-2 border-red-500"></div></div>
                            <div ref={rightKnobRef} className="w-12 h-12 bg-red-500/80 rounded-full shadow-[0_0_15px_#ef4444] relative pointer-events-none"><div className="absolute inset-0 rounded-full border-2 border-white opacity-50"></div></div>
                            <span className="absolute bottom-2 text-[10px] text-red-500 font-bold tracking-widest pointer-events-none">VISER & TIRER</span>
                        </div>
                    </div>
                </>
            )}

            {/* Menu */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 pointer-events-auto">
                    <Crosshair size={64} className="text-cyan-400 animate-spin-slow mb-4 drop-shadow-[0_0_15px_#00f3ff]"/>
                    <h1 className="text-5xl font-black italic text-white tracking-widest drop-shadow-lg mb-8">NEON ARENA</h1>
                    
                    <div className="flex items-center justify-center gap-4 mb-8 bg-gray-900/50 p-2 rounded-xl border border-white/10">
                        <button onClick={() => onChangeMap(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-400"/></button>
                        <div className="text-center w-40">
                            <p className="text-[10px] text-gray-500 font-bold mb-1 flex items-center justify-center gap-1"><Map size={10}/> CARTE</p>
                            <p className="text-white font-black italic text-lg" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                        </div>
                        <button onClick={() => onChangeMap(1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24} className="text-gray-400"/></button>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-[260px]">
                        <button onClick={() => { onSetGameMode('SOLO'); onStartGame('SOLO'); }} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                            <User size={24} className="text-neon-blue"/> SOLO (BOTS)
                        </button>
                        <button onClick={() => onSetGameMode('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-purple-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                            <Globe size={24} className="text-purple-500"/> EN LIGNE
                        </button>
                    </div>
                </div>
            )}

            {/* Waiting Online */}
            {gameMode === 'ONLINE' && isHost && onlineStep === 'game' && !hasOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 pointer-events-auto">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={onCancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold">ANNULER</button>
                </div>
            )}

            {/* Game Over */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in p-8 text-center pointer-events-auto">
                    <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce"/>
                    <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 mb-4">MATCH TERMINÉ</h2>
                    {earnedCoins > 0 && <div className="mb-10 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/50"><Coins className="text-yellow-400" size={28} /><span className="text-yellow-100 font-black text-2xl">+{earnedCoins}</span></div>}
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => { if(gameMode === 'ONLINE') onRematch(); else onStartGame(); }} className="flex-1 py-4 bg-indigo-600 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={24} /> REJOUER</button>
                        {gameMode === 'ONLINE' && <button onClick={onLeaveGame} className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700">QUITTER</button>}
                    </div>
                    {gameMode !== 'ONLINE' && <button onClick={onReturnToMenu} className="mt-8 text-gray-500 hover:text-white underline text-sm py-4">Retour au Menu</button>}
                </div>
            )}
        </div>
    );
};
