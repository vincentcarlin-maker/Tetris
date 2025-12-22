
import React, { useRef, useEffect } from 'react';
import { Home, Trophy, Crosshair, Map, ChevronLeft, ChevronRight, User, Globe, Loader2, Coins, RefreshCw, Wifi, Play, Search, ArrowRight, Shield, Zap, Skull, Activity } from 'lucide-react';
import { MAPS, ARENA_DIFFICULTY_SETTINGS, Difficulty } from '../constants';
import { Avatar } from '../../../hooks/useCurrency';

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
    onStartGame: (mode?: 'SOLO' | 'ONLINE', diff?: Difficulty) => void;
    onChangeMap: (delta: number) => void;
    onCancelHosting: () => void;
    onLeaveGame: () => void;
    onRematch: () => void;
    onReturnToMenu: () => void;
    onSetGameState: (state: any) => void;
    controlsRef: React.MutableRefObject<any>;
    mp: any;
    avatarsCatalog: Avatar[];
}

export const ArenaUI: React.FC<ArenaUIProps> = ({
    gameState, gameMode, score, timeLeft, respawnTimer, killFeed, leaderboard, earnedCoins,
    selectedMapIndex, onlineStep, isHost, hasOpponent,
    onBack, onToggleTutorial, onSetGameMode, onStartGame, onChangeMap,
    onCancelHosting, onLeaveGame, onRematch, onReturnToMenu, onSetGameState, controlsRef,
    mp, avatarsCatalog
}) => {
    const leftZoneRef = useRef<HTMLDivElement>(null);
    const rightZoneRef = useRef<HTMLDivElement>(null);
    const leftKnobRef = useRef<HTMLDivElement>(null);
    const rightKnobRef = useRef<HTMLDivElement>(null);
    const activeTouches = useRef<{ move: number | null, aim: number | null }>({ move: null, aim: null });

    const updateStick = (type: 'move' | 'aim', clientX: number, clientY: number, zone: HTMLDivElement) => {
        const rect = zone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = rect.width / 2 - 20; 
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
        if (dist > 0 && knob) {
            const ratio = Math.min(dist, maxDist) / dist;
            knob.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;
            const magnitude = Math.min(dist / maxDist, 1.0);
            if (type === 'move') controlsRef.current.move = { x: (dx/dist)*magnitude, y: (dy/dist)*magnitude, active: true };
            else controlsRef.current.aim = { x: (dx/dist)*magnitude, y: (dy/dist)*magnitude, active: true };
        }
    };

    const resetStick = (type: 'move' | 'aim') => {
        const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
        if (knob) knob.style.transform = `translate(0px, 0px)`;
        if (type === 'move') controlsRef.current.move = { x: 0, y: 0, active: false };
        else controlsRef.current.aim = { x: 0, y: 0, active: false };
    };

    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (e.type === 'touchstart') {
                    if (leftZoneRef.current && activeTouches.current.move === null) {
                        const rect = leftZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.move = t.identifier; updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                        }
                    }
                    if (rightZoneRef.current && activeTouches.current.aim === null) {
                        const rect = rightZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.aim = t.identifier; updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
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
        document.addEventListener('touchstart', handleTouch, { passive: false });
        document.addEventListener('touchmove', handleTouch, { passive: false });
        document.addEventListener('touchend', handleTouch);
        return () => { document.removeEventListener('touchstart', handleTouch); document.removeEventListener('touchmove', handleTouch); document.removeEventListener('touchend', handleTouch); };
    }, []);

    if (gameState === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto p-6 pointer-events-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050510] to-black"></div>
                <div className="relative z-10 w-full max-w-5xl flex flex-col items-center min-h-full justify-center">
                    <div className="mb-12 text-center animate-in slide-in-from-top-10 duration-700">
                         <h1 className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tracking-tighter">ARENA CLASH</h1>
                         <p className="text-red-400 font-black tracking-[0.5em] text-sm mt-4 uppercase">Duel Néon Infini</p>
                    </div>
                    <div className="flex items-center gap-4 mb-10 bg-gray-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md w-full max-w-xs shadow-2xl">
                        <button onClick={() => onChangeMap(-1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400"><ChevronLeft/></button>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1 uppercase">Secteur</p>
                            <p className="text-white font-black italic text-lg truncate" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                        </div>
                        <button onClick={() => onChangeMap(1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400"><ChevronRight/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                        <button onClick={() => { onSetGameMode('SOLO'); onSetGameState('DIFFICULTY'); }} className="group relative h-64 md:h-80 rounded-[40px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-6 shadow-xl"><User size={40} className="text-red-400" /></div><h2 className="text-4xl font-black text-white italic mb-2 group-hover:text-red-300">PROTOCOLE SOLO</h2><p className="text-gray-400 text-sm font-medium leading-relaxed">Défiez les sentinelles de la grille.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-red-400 font-black text-xs tracking-[0.2em] group-hover:text-white uppercase">Initialiser <ArrowRight size={20} /></div>
                        </button>
                        <button onClick={() => { onSetGameMode('ONLINE'); onSetGameState('LOBBY'); }} className="group relative h-64 md:h-80 rounded-[40px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mb-6 shadow-xl"><Globe size={40} className="text-orange-400" /></div><div className="flex items-center gap-3 mb-2"><h2 className="text-4xl font-black text-white italic group-hover:text-orange-300">RESEAU LIVE</h2><span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">EN LIGNE</span></div><p className="text-gray-400 text-sm font-medium leading-relaxed">Confrontation directe mondiale.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-orange-400 font-black text-xs tracking-[0.2em] group-hover:text-white uppercase">Rechercher canal <ArrowRight size={20} /></div>
                        </button>
                    </div>
                    <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.3em] flex items-center gap-2 py-3 px-6 hover:bg-white/5 rounded-2xl transition-all"><Home size={16}/> RETOUR ARCADE</button>
                </div>
            </div>
        );
    }

    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center pointer-events-none">
            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    <div className="absolute top-0 left-0 w-full flex justify-between items-start p-6 z-20 pointer-events-none">
                        <div className="flex flex-col gap-4 items-start">
                            <button onClick={onBack} className="p-3 bg-gray-900/80 rounded-2xl text-gray-400 hover:text-white border border-white/10 pointer-events-auto active:scale-90 shadow-2xl transition-all"><Home size={24} /></button>
                            <div className="flex flex-col gap-1.5">{killFeed.map(k => (<div key={k.id} className="text-[10px] font-black bg-black/70 px-3 py-1.5 rounded-lg text-white animate-in slide-in-from-left-4 border-l-2 border-red-500 backdrop-blur-sm"><span className="text-cyan-400">{k.killer.toUpperCase()}</span><span className="text-gray-500 mx-2">SHUTDOWN</span><span className="text-red-500">{k.victim.toUpperCase()}</span></div>))}</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className={`text-4xl font-black font-mono drop-shadow-[0_0_15px_rgba(0,0,0,1)] px-6 py-2 bg-black/40 rounded-3xl border border-white/10 backdrop-blur-md ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-500' : 'text-white'}`}>{Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}</div>
                            {gameState === 'RESPAWNING' && (<div className="mt-4 bg-red-950/90 px-6 py-2 rounded-2xl text-red-100 font-black animate-pulse border border-red-500 text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md uppercase tracking-[0.2em]">Initialisation Système {Math.ceil(respawnTimer / 1000)}s</div>)}
                        </div>
                        <div className="w-44 bg-gray-900/90 p-4 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy size={16} className="text-yellow-400"/><span className="text-[10px] font-black text-white uppercase tracking-widest">CLASSEMENT</span></div>
                            <div className="space-y-2 max-h-40 overflow-hidden">
                                {leaderboard.length > 0 ? leaderboard.slice(0, 6).map((p, i) => (
                                    <div key={i} className={`flex justify-between items-center text-[10px] ${p.isMe ? 'text-cyan-400 font-black' : 'text-gray-400 font-bold'}`}>
                                        <span className="truncate w-24">{i+1}. {p.name.toUpperCase()}</span>
                                        <span className="font-mono text-white">{p.score}</span>
                                    </div>
                                )) : <div className="text-[9px] text-gray-600 animate-pulse">Calcul des données...</div>}
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 w-full h-56 grid grid-cols-2 gap-8 shrink-0 z-40 p-8 pointer-events-auto">
                        <div ref={leftZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 shadow-inner group">
                            <div ref={leftKnobRef} className="w-16 h-16 bg-cyan-500/90 rounded-full shadow-[0_0_25px_#00f3ff] flex items-center justify-center transition-transform duration-75"><Activity size={24} className="text-white opacity-50"/></div>
                            <span className="absolute bottom-3 text-[9px] text-cyan-500 font-black tracking-[0.3em] uppercase">Mouvement</span>
                        </div>
                        <div ref={rightZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 shadow-inner group">
                            <div ref={rightKnobRef} className="w-16 h-16 bg-red-600/90 rounded-full shadow-[0_0_25px_#ef4444] flex items-center justify-center transition-transform duration-75"><Crosshair size={24} className="text-white opacity-50"/></div>
                            <span className="absolute bottom-3 text-[9px] text-red-500 font-black tracking-[0.3em] uppercase">Viseur</span>
                        </div>
                    </div>
                </>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in zoom-in p-8 text-center pointer-events-auto">
                    <Trophy size={100} className="text-yellow-400 mb-8 drop-shadow-[0_0_40px_gold] animate-bounce"/>
                    <h2 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 mb-6 uppercase tracking-tighter">DONNÉES DE COMBAT</h2>
                    <div className="bg-gray-800/40 p-8 rounded-[40px] border border-white/10 mb-10 backdrop-blur-md shadow-2xl flex flex-col items-center">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Shutdowns confirmés</span>
                        <span className="text-7xl font-black text-white font-mono drop-shadow-[0_0_20px_white]">{score}</span>
                    </div>
                    {earnedCoins > 0 && <div className="mb-12 flex items-center gap-4 bg-yellow-500/20 px-8 py-4 rounded-3xl border-2 border-yellow-500/50 shadow-lg animate-pulse"><Coins className="text-yellow-400" size={32} /><span className="text-yellow-100 font-black text-3xl">+{earnedCoins}</span></div>}
                    <div className="flex gap-6 w-full max-w-md">
                        <button onClick={() => { if(gameMode === 'ONLINE') onRematch(); else onStartGame(); }} className="flex-1 py-5 bg-red-600 text-white font-black tracking-[0.2em] rounded-3xl hover:bg-red-500 shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"><RefreshCw size={24} /> REPLAY</button>
                        <button onClick={onReturnToMenu} className="flex-1 py-5 bg-gray-800 text-gray-300 font-black tracking-[0.2em] rounded-3xl hover:bg-gray-700 text-sm">MENU</button>
                    </div>
                </div>
            )}
            
            {gameState === 'DIFFICULTY' && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 pointer-events-auto animate-in fade-in">
                    <h2 className="text-4xl font-black text-white mb-10 italic uppercase tracking-[0.2em]">NIVEAU DE MENACE</h2>
                    <div className="flex flex-col gap-4 w-full max-w-[340px]">
                        {(Object.keys(ARENA_DIFFICULTY_SETTINGS) as Difficulty[]).map(d => {
                            const s = ARENA_DIFFICULTY_SETTINGS[d];
                            return (
                                <button key={d} onClick={() => onStartGame('SOLO', d)} className={`group flex items-center justify-between px-8 py-6 border-2 rounded-3xl transition-all ${s.color} hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-xl`}>
                                    <div className="flex items-center gap-4">{d==='EASY' && <Shield size={32}/>}{d==='MEDIUM' && <Zap size={32}/>}{d==='HARD' && <Skull size={32}/>}<span className="font-black text-xl uppercase tracking-wider">{d==='EASY'?'Novice':d==='MEDIUM'?'Challenger':'Elite'}</span></div>
                                    <div className="text-[10px] font-black font-mono text-right opacity-60 group-hover:opacity-100">X{s.coinMult}</div>
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={onReturnToMenu} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.4em] uppercase">Annuler</button>
                </div>
            )}
        </div>
    );
};
