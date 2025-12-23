import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Home, Trophy, Crosshair, ChevronLeft, ChevronRight, User, Globe, Coins, RefreshCw, ArrowRight, Shield, Zap, Skull, Activity, Wifi, Play, Search, Loader2, Palette, LogOut, ArrowLeft, Target } from 'lucide-react';
import { MAPS, ARENA_DIFFICULTY_SETTINGS, Difficulty } from '../constants';
import { Avatar, useCurrency } from '../../../hooks/useCurrency';
import { QuickLocker } from '../../common/QuickLocker';
import { useGlobal } from '../../../context/GlobalContext';

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
    const { 
        currentTankId, selectTank, ownedTanks, tanksCatalog,
        currentTankAccessoryId, selectTankAccessory, ownedTankAccessories, tankAccessoriesCatalog
    } = useCurrency();
    const { setCurrentView } = useGlobal();
    
    const [lockerTab, setLockerTab] = useState<'NONE' | 'TANKS' | 'FLAGS'>('NONE');
    
    const leftZoneRef = useRef<HTMLDivElement>(null);
    const rightZoneRef = useRef<HTMLDivElement>(null);
    const leftKnobRef = useRef<HTMLDivElement>(null);
    const rightKnobRef = useRef<HTMLDivElement>(null);
    const activeTouches = useRef<{ move: number | null, aim: number | null }>({ move: null, aim: null });

    const myRank = useMemo(() => {
        const index = leaderboard.findIndex(p => p.isMe);
        return index !== -1 ? index + 1 : null;
    }, [leaderboard]);

    const updateStick = (type: 'move' | 'aim', clientX: number, clientY: number, zone: HTMLDivElement) => {
        if (gameState === 'GAMEOVER') return; 
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
            if (gameState === 'GAMEOVER') return;
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
    }, [gameState]);

    const MiniLeaderboard = () => (
        <div className="flex flex-col w-44 bg-gray-950/80 backdrop-blur-md p-3 rounded-2xl border-2 border-white/10 pointer-events-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                <Trophy size={14} className="text-yellow-400"/>
                <span className="text-[11px] font-black text-white italic uppercase tracking-tighter">Leaderboard</span>
            </div>
            <div className="space-y-1.5">
                {leaderboard.length > 0 ? leaderboard.slice(0, 3).map((p, i) => (
                    <div key={i} className={`flex justify-between items-center px-2 py-1 rounded-lg ${p.isMe ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'}`}>
                        <div className="flex items-center gap-1.5 truncate max-w-[90px]">
                            <span className={`text-[10px] font-black ${p.isMe ? 'text-white' : 'text-gray-500'}`}>{i+1}</span>
                            <span className={`text-[11px] truncate ${p.isMe ? 'text-cyan-400 font-black' : 'text-gray-300 font-bold'}`}>{p.name.toUpperCase()}</span>
                        </div>
                        <span className={`font-mono text-[11px] ${p.isMe ? 'text-cyan-400 font-black' : 'text-white/60'}`}>{p.score}</span>
                    </div>
                )) : <div className="text-[10px] text-gray-600 italic py-2">SCANNING...</div>}
            </div>
        </div>
    );

    if (gameState === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto p-6 pointer-events-auto">
                <div className="fixed inset-0 opacity-25 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/60 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-8 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Target size={56} className="text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-6xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)] tracking-tighter w-full uppercase">
                                ARENA<br className="md:hidden"/> CLASH
                            </h1>
                            <Target size={56} className="text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                        </div>
                        <div className="inline-block px-8 py-2 rounded-full border border-red-500/30 bg-red-900/20 backdrop-blur-sm">
                            <p className="text-red-200 font-bold tracking-[0.4em] text-xs md:text-sm uppercase">Détruire • Dominer • Survivre</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-10 bg-gray-950 p-3 rounded-3xl border-2 border-white/10 backdrop-blur-xl w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,1)] animate-in fade-in duration-700 delay-200">
                        <button onClick={() => onChangeMap(-1)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 transition-all active:scale-90"><ChevronLeft size={24}/></button>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-gray-500 font-black tracking-[0.3em] mb-1 uppercase">Secteur Tactique</p>
                            <p className="text-white font-black italic text-xl truncate uppercase tracking-tighter" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                        </div>
                        <button onClick={() => onChangeMap(1)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 transition-all active:scale-90"><ChevronRight size={24}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-md md:max-w-4xl flex-shrink-0">
                        <button onClick={() => { onSetGameMode('SOLO'); onSetGameState('DIFFICULTY'); }} className="group relative h-60 md:h-80 rounded-[40px] border-2 border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.03] hover:border-red-500/60 hover:shadow-[0_0_60px_rgba(239,68,68,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-red-500/20 flex items-center justify-center border-2 border-red-500/40 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"><User size={40} className="text-red-400" /></div>
                                <h2 className="text-4xl font-black text-white italic mb-2 group-hover:text-red-300 transition-colors uppercase tracking-tighter">Deathmatch Solo</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%] uppercase tracking-widest">Éliminez les drones de sécurité du District.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-3 text-red-500 font-black text-xs md:text-sm tracking-[0.2em] group-hover:text-white transition-colors uppercase">Engager Combat <ArrowRight size={20}/></div>
                        </button>

                        <button onClick={() => { onSetGameMode('ONLINE'); onSetGameState('LOBBY'); }} className="group relative h-60 md:h-80 rounded-[40px] border-2 border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.03] hover:border-orange-500/60 hover:shadow-[0_0_60px_rgba(249,115,22,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/40 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(249,115,22,0.4)]"><Globe size={40} className="text-orange-400" /></div>
                                <div className="flex items-center gap-4 mb-2">
                                    <h2 className="text-4xl font-black text-white italic group-hover:text-orange-300 transition-colors uppercase tracking-tighter">Bataille Live</h2>
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-[11px] font-black animate-pulse shadow-[0_0_10px_#22c55e]">ONLINE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%] uppercase tracking-widest">Confrontation globale en temps réel.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-3 text-orange-500 font-black text-xs md:text-sm tracking-[0.2em] group-hover:text-white transition-colors uppercase">Rejoindre Grille <ArrowRight size={20}/></div>
                        </button>
                    </div>

                    <div className="mt-12 flex gap-6 w-full max-w-md md:max-w-4xl">
                        <button onClick={() => setLockerTab('TANKS')} className="flex-1 py-5 bg-gray-900/90 border-2 border-white/10 rounded-[32px] flex items-center justify-center gap-4 font-black text-xs tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all uppercase shadow-2xl active:scale-95">
                            <Palette size={20} className="text-red-500"/> Vestiaire
                        </button>
                        <button onClick={() => setLockerTab('FLAGS')} className="flex-1 py-5 bg-gray-900/90 border-2 border-white/10 rounded-[32px] flex items-center justify-center gap-4 font-black text-xs tracking-[0.3em] hover:bg-white hover:text-black hover:border-white transition-all uppercase shadow-2xl active:scale-95">
                            <Globe size={20} className="text-cyan-400"/> Drapeaux
                        </button>
                    </div>

                    <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.5em] transition-all flex items-center gap-3 py-3 px-6 hover:bg-white/5 rounded-2xl uppercase"><ArrowLeft size={16} /> Retour Arcade</button>
                </div>

                {lockerTab === 'TANKS' && (
                    <QuickLocker 
                        title="Blindages Arena"
                        items={tanksCatalog}
                        ownedIds={ownedTanks}
                        currentId={currentTankId}
                        onSelect={selectTank}
                        onClose={() => setLockerTab('NONE')}
                        onGoToShop={() => setCurrentView('shop')}
                        renderPreview={(tank) => (
                            <div className="w-12 h-12 bg-gray-800 border-2 rounded-lg relative flex items-center justify-center" style={{ borderColor: tank.primaryColor, boxShadow: `0 0 15px ${tank.glowColor}50` }}>
                                <div className="w-8 h-3 bg-gray-700 border border-current absolute -right-2" style={{ color: tank.primaryColor }}></div>
                                <div className="w-4 h-4 rounded-full bg-current" style={{ color: tank.primaryColor }}></div>
                            </div>
                        )}
                    />
                )}

                {lockerTab === 'FLAGS' && (
                    <QuickLocker 
                        title="Drapeaux Nationaux"
                        items={tankAccessoriesCatalog}
                        ownedIds={ownedTankAccessories}
                        currentId={currentTankAccessoryId}
                        onSelect={selectTankAccessory}
                        onClose={() => setLockerTab('NONE')}
                        onGoToShop={() => setCurrentView('shop')}
                        renderPreview={(acc) => (
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex border border-white/20 w-12 h-8 rounded-sm overflow-hidden shadow-lg">
                                    {acc.colors?.map((c: string, idx: number) => (
                                        <div key={idx} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    />
                )}
            </div>
        );
    }

    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center overflow-hidden pointer-events-none">
            
            {/* Overlay Scanlines constant pour le look phare */}
            <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    {/* TOP HUD */}
                    <div className="absolute top-0 left-0 w-full flex justify-between items-start p-4 md:p-8 z-20 pointer-events-none">
                        <div className="flex items-center gap-4 pointer-events-auto animate-in slide-in-from-left-4 duration-500">
                            <button onClick={onBack} className="p-4 bg-gray-950/90 rounded-2xl text-gray-400 hover:text-white border-2 border-white/10 active:scale-90 shadow-2xl transition-all"><Home size={28} /></button>
                            <div className="bg-gray-950/90 p-3 px-5 rounded-2xl border-2 border-cyan-500/30 flex flex-col backdrop-blur-md">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Score Total</span>
                                <span className="text-3xl font-mono font-black text-white leading-none">{score}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center animate-in slide-in-from-top-4 duration-500">
                            <div className={`text-3xl md:text-5xl font-black font-mono drop-shadow-[0_0_20px_rgba(0,0,0,1)] px-8 py-3 bg-gray-950/80 rounded-3xl border-2 border-white/20 backdrop-blur-xl ${timeLeft < 15 ? 'text-red-500 animate-pulse border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}
                            </div>
                            {timeLeft < 15 && <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] mt-2 animate-bounce">Temps Limite !</span>}
                        </div>

                        <div className="pointer-events-auto animate-in slide-in-from-right-4 duration-500"><MiniLeaderboard /></div>
                    </div>

                    {/* KILL FEED DYNAMIQUE */}
                    <div className="absolute left-6 bottom-64 md:top-32 md:left-8 flex flex-col gap-2 z-10 max-w-[240px]">
                        {killFeed.map(k => (
                            <div key={k.id} className="text-[10px] md:text-[11px] font-black bg-gray-950/90 px-4 py-2 rounded-xl text-white animate-in slide-in-from-left-6 border-l-4 border-red-500 backdrop-blur-md shadow-xl flex items-center gap-2">
                                <Target size={12} className="text-red-500" />
                                <span className="text-cyan-400">{k.killer.toUpperCase()}</span>
                                <span className="text-gray-600 italic">ELIM</span>
                                <span className="text-red-500">{k.victim.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>

                    {/* JOYSTICKS HUD */}
                    <div className="absolute bottom-0 w-full h-64 grid grid-cols-2 gap-8 shrink-0 z-40 p-8 pointer-events-auto">
                        <div ref={leftZoneRef} className="relative bg-white/5 rounded-[50px] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-inner group/stick">
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/stick:opacity-100 transition-opacity"></div>
                            <div ref={leftKnobRef} className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-[0_0_30px_#00f3ff] flex items-center justify-center transition-transform duration-75 border-2 border-white/20">
                                <Activity size={32} className="text-white opacity-40"/>
                            </div>
                            <span className="absolute bottom-4 text-[10px] text-cyan-400 font-black tracking-[0.4em] uppercase">PILOTAGE</span>
                        </div>
                        <div ref={rightZoneRef} className="relative bg-white/5 rounded-[50px] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-inner group/stick">
                            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover/stick:opacity-100 transition-opacity"></div>
                            <div ref={rightKnobRef} className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-800 rounded-full shadow-[0_0_30px_#ef4444] flex items-center justify-center transition-transform duration-75 border-2 border-white/20">
                                <Crosshair size={32} className="text-white opacity-40"/>
                            </div>
                            <span className="absolute bottom-4 text-[10px] text-red-500 font-black tracking-[0.4em] uppercase">FEU À VOLONTÉ</span>
                        </div>
                    </div>
                </>
            )}

            {/* GAMEOVER TACTIQUE */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl p-8 pointer-events-auto animate-in zoom-in fade-in duration-500">
                    <Trophy size={100} className="text-yellow-400 mb-8 drop-shadow-[0_0_40px_rgba(234,179,8,0.7)] animate-bounce" />
                    
                    <h2 className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 mb-4 tracking-tighter uppercase leading-none">
                        MISSION TERMINÉE
                    </h2>
                    
                    <div className="bg-gray-900/60 p-8 rounded-[40px] border-2 border-white/10 mb-10 w-full max-w-md text-center backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,1)]">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-center">
                                <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-2">Score Final</p>
                                <p className="text-6xl font-mono font-black text-white tracking-tighter">{score}</p>
                            </div>
                            <div className="text-center border-l-2 border-white/10">
                                <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-2">Classement</p>
                                <p className="text-6xl font-mono font-black text-cyan-400 tracking-tighter">#{myRank || '?'}</p>
                            </div>
                        </div>
                    </div>

                    {earnedCoins > 0 && (
                        <div className="mb-10 flex items-center gap-4 bg-yellow-500/20 px-8 py-4 rounded-full border-2 border-yellow-500 animate-pulse shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                            <Coins className="text-yellow-400" size={32} />
                            <span className="text-yellow-100 font-black text-3xl">+{earnedCoins} <span className="text-sm">NEON COINS</span></span>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 w-full max-w-[320px]">
                        <button onClick={onRematch} className="w-full py-5 bg-white text-black font-black tracking-[0.2em] rounded-3xl hover:bg-cyan-400 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 text-lg uppercase">
                            <RefreshCw size={24} /> Rengager
                        </button>
                        <button onClick={onBack} className="w-full py-5 bg-gray-900 border-2 border-white/10 text-white font-black tracking-[0.2em] rounded-3xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 active:scale-95 text-lg uppercase">
                            <Home size={24} /> Base Militaire
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
