
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Home, Trophy, Crosshair, ChevronLeft, ChevronRight, User, Globe, Coins, RefreshCw, ArrowRight, Shield, Zap, Skull, Activity, Wifi, Play, Search, Loader2, Palette, LogOut, ArrowLeft, Skull as SkullIcon } from 'lucide-react';
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

    const resetStick = (type: 'move' | 'aim') => {
        const knob = type === 'move' ? leftKnobRef.current : rightKnobRef.current;
        if (knob) knob.style.transform = `translate(0px, 0px)`;
        if (type === 'move') {
            controlsRef.current.move = { x: 0, y: 0, active: false };
        } else {
            controlsRef.current.aim = { x: 0, y: 0, active: false };
        }
    };

    const updateStick = (type: 'move' | 'aim', clientX: number, clientY: number, zone: HTMLDivElement) => {
        if (gameState === 'GAMEOVER' || gameState === 'RESPAWNING') return; 
        
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

    useEffect(() => {
        if (gameState === 'RESPAWNING' || gameState === 'GAMEOVER') {
            activeTouches.current.move = null;
            activeTouches.current.aim = null;
            resetStick('move');
            resetStick('aim');
        }
    }, [gameState]);

    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                
                if (e.type === 'touchstart') {
                    if (gameState === 'GAMEOVER' || gameState === 'RESPAWNING') continue;

                    if (leftZoneRef.current && activeTouches.current.move === null) {
                        const rect = leftZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.move = t.identifier; 
                            updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                        }
                    }
                    if (rightZoneRef.current && activeTouches.current.aim === null) {
                        const rect = rightZoneRef.current.getBoundingClientRect();
                        if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                            activeTouches.current.aim = t.identifier; 
                            updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
                        }
                    }
                }
                
                if (e.type === 'touchmove') {
                    if (gameState === 'GAMEOVER' || gameState === 'RESPAWNING') continue;

                    if (t.identifier === activeTouches.current.move && leftZoneRef.current) {
                        updateStick('move', t.clientX, t.clientY, leftZoneRef.current);
                    }
                    if (t.identifier === activeTouches.current.aim && rightZoneRef.current) {
                        updateStick('aim', t.clientX, t.clientY, rightZoneRef.current);
                    }
                }
                
                if (e.type === 'touchend' || e.type === 'touchcancel') {
                    if (t.identifier === activeTouches.current.move) { 
                        activeTouches.current.move = null; 
                        resetStick('move'); 
                    }
                    if (t.identifier === activeTouches.current.aim) { 
                        activeTouches.current.aim = null; 
                        resetStick('aim'); 
                    }
                }
            }
        };

        document.addEventListener('touchstart', handleTouch, { passive: false });
        document.addEventListener('touchmove', handleTouch, { passive: false });
        document.addEventListener('touchend', handleTouch);
        document.addEventListener('touchcancel', handleTouch);

        return () => { 
            document.removeEventListener('touchstart', handleTouch); 
            document.removeEventListener('touchmove', handleTouch); 
            document.removeEventListener('touchend', handleTouch); 
            document.removeEventListener('touchcancel', handleTouch);
        };
    }, [gameState]);

    const MiniLeaderboard = () => (
        <div className="flex flex-col w-40 bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-white/10 pointer-events-none">
            <div className="flex items-center gap-1.5 mb-2 border-b border-white/10 pb-1">
                <Trophy size={12} className="text-yellow-400/80"/>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Top 3</span>
            </div>
            <div className="space-y-1">
                {leaderboard.length > 0 ? leaderboard.slice(0, 3).map((p, i) => (
                    <div key={i} className={`flex justify-between items-center px-1.5 py-0.5 rounded ${p.isMe ? 'bg-cyan-500/20' : ''}`}>
                        <div className="flex items-center gap-1 truncate max-w-[80px]">
                            <span className={`text-[9px] font-mono ${p.isMe ? 'text-white' : 'text-gray-500'}`}>{i+1}.</span>
                            <span className={`text-[10px] truncate ${p.isMe ? 'text-cyan-400 font-black' : 'text-gray-300 font-bold'}`}>{p.name.toUpperCase()}</span>
                        </div>
                        <span className={`font-mono text-[10px] ${p.isMe ? 'text-cyan-400' : 'text-white/60'}`}>{p.score}</span>
                    </div>
                )) : <div className="text-[9px] text-gray-600 italic">Sync...</div>}
            </div>
        </div>
    );

    if (gameState === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto p-6 pointer-events-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-8 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Crosshair size={56} className="text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tracking-tighter w-full uppercase">
                                ARENA<br className="md:hidden"/> CLASH
                            </h1>
                            <Crosshair size={56} className="text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-8 bg-gray-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md w-full max-w-xs shadow-2xl animate-in fade-in duration-700 delay-200">
                        <button onClick={() => onChangeMap(-1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"><ChevronLeft/></button>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1 uppercase">Secteur</p>
                            <p className="text-white font-black italic text-lg truncate uppercase" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                        </div>
                        <button onClick={() => onChangeMap(1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 transition-colors"><ChevronRight/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={() => { onSetGameMode('SOLO'); onSetGameState('DIFFICULTY'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]"><User size={32} className="text-red-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-red-300 transition-colors uppercase">Solo</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Défiez les sentinelles de la grille.</p>
                            </div>
                        </button>

                        <button onClick={() => { onSetGameMode('ONLINE'); onSetGameState('LOBBY'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)]"><Globe size={32} className="text-orange-400" /></div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-orange-300 transition-colors uppercase">En Ligne</h2>
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Confrontation directe mondiale.</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 flex gap-4 w-full max-w-sm md:max-w-3xl">
                        <button onClick={() => setLockerTab('TANKS')} className="flex-1 py-4 bg-gray-900/80 border border-white/10 rounded-[32px] flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all uppercase">
                            <Palette size={18}/> BLINDAGES
                        </button>
                        <button onClick={() => setLockerTab('FLAGS')} className="flex-1 py-4 bg-gray-900/80 border border-white/10 rounded-[32px] flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all uppercase">
                            <Globe size={18}/> DRAPEAUX
                        </button>
                    </div>

                    <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest"><Home size={14} /> Retour arcade</button>
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
                            <div className="w-12 h-12 bg-gray-800 border-2 rounded-lg relative flex items-center justify-center" style={{ borderColor: tank.primaryColor, boxShadow: `0 0 10px ${tank.glowColor}50` }}>
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
                                {acc.layout === 'japan' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative flex items-center justify-center overflow-hidden">
                                        <div className="w-4 h-4 rounded-full bg-[#BC002D]"></div>
                                    </div>
                                ) : acc.layout === 'brazil' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-[#009739] relative flex items-center justify-center overflow-hidden">
                                        <div className="w-8 h-6 bg-[#FEDD00] rotate-45 transform scale-[0.8] absolute"></div>
                                        <div className="w-3 h-3 bg-[#012169] rounded-full absolute z-10"></div>
                                    </div>
                                ) : acc.layout === 'usa' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative overflow-hidden flex flex-col">
                                        {Array.from({length: 7}).map((_, i) => (
                                            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-[#B22234]' : 'bg-white'}`}></div>
                                        ))}
                                        <div className="absolute top-0 left-0 w-[45%] h-[55%] bg-[#3C3B6E]"></div>
                                    </div>
                                ) : acc.layout === 'pirate' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-black relative flex items-center justify-center overflow-hidden">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                ) : (
                                    <div className={`flex border border-white/20 w-12 h-8 rounded-sm overflow-hidden shadow-lg ${acc.layout === 'vertical' ? 'flex-row' : 'flex-col'}`}>
                                        {acc.colors.map((c: string, idx: number) => (
                                            <div key={idx} className="flex-1 h-full w-full" style={{ backgroundColor: c }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    />
                )}
            </div>
        );
    }

    if (gameState === 'LOBBY') {
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto p-6 pointer-events-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/40 via-[#050510] to-black"></div>
                <div className="relative z-10 w-full max-w-4xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <button onClick={onReturnToMenu} className="p-3 bg-gray-900/80 rounded-xl text-gray-400 hover:text-white border border-white/10 transition-transform active:scale-95 cursor-pointer"><ChevronLeft size={20} /></button>
                        <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-tighter">Salles de Combat</h1>
                        <div className="w-12"></div>
                    </div>

                    {onlineStep === 'connecting' ? (
                        <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-orange-400 animate-spin mb-4" /><p className="text-orange-300 font-black tracking-widest uppercase">Liaison satellite...</p></div>
                    ) : (
                        <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
                            <div className="md:w-1/3 flex flex-col gap-6">
                                <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest"><Wifi size={18} className="text-orange-400"/> Émission</h3>
                                    <button onClick={mp.createRoom} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black tracking-[0.2em] rounded-2xl text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest cursor-pointer">
                                        <Play size={20} fill="currentColor"/> Créer Salon
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setLockerTab('TANKS')} className="py-4 bg-gray-900/80 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all uppercase">
                                        <Palette size={18}/> BLINDAGES
                                    </button>
                                    <button onClick={() => setLockerTab('FLAGS')} className="py-4 bg-gray-900/80 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all uppercase">
                                        <Globe size={18}/> DRAPEAUX
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-black/40 backdrop-blur-md rounded-[40px] border border-white/10 p-8 flex flex-col min-h-0 shadow-2xl">
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Canaux Détectés</span>
                                    <span className="text-[10px] font-mono text-orange-400 bg-orange-950/30 px-3 py-1 rounded-full border border-orange-500/30">{hostingPlayers.length} LIVE</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {hostingPlayers.length > 0 ? (
                                        hostingPlayers.map((player: any) => {
                                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                            return (
                                                <div key={player.id} className="flex items-center justify-between p-4 bg-gray-800/60 hover:bg-gray-800 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group animate-in slide-in-from-right-4 shadow-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-xl`}>
                                                            {React.createElement(avatar.icon, { size: 28, className: avatar.color })}
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse shadow-lg"></div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-lg text-white group-hover:text-orange-300 transition-colors italic uppercase">{player.name}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono tracking-widest">EN ATTENTE...</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => mp.joinRoom(player.id)} className="px-6 py-3 bg-white text-black font-black text-xs rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest cursor-pointer">
                                                        Rejoindre
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-6 opacity-30">
                                            <div className="relative bg-gray-800 p-6 rounded-full border border-gray-700"><Search size={40} /></div>
                                            <p className="text-xs font-black tracking-[0.3em] text-center leading-loose">SCAN DES FRÉQUENCES...<br/>AUCUN COMBAT DÉTECTÉ</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
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
                            <div className="w-12 h-12 bg-gray-800 border-2 rounded-lg relative flex items-center justify-center" style={{ borderColor: tank.primaryColor, boxShadow: `0 0 10px ${tank.glowColor}50` }}>
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
                                {acc.layout === 'japan' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative flex items-center justify-center overflow-hidden">
                                        <div className="w-4 h-4 rounded-full bg-[#BC002D]"></div>
                                    </div>
                                ) : acc.layout === 'brazil' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-[#009739] relative flex items-center justify-center overflow-hidden">
                                        <div className="w-8 h-6 bg-[#FEDD00] rotate-45 transform scale-[0.8] absolute"></div>
                                        <div className="w-3 h-3 bg-[#012169] rounded-full absolute z-10"></div>
                                    </div>
                                ) : acc.layout === 'usa' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative overflow-hidden flex flex-col">
                                        {Array.from({length: 7}).map((_, i) => (
                                            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-[#B22234]' : 'bg-white'}`}></div>
                                        ))}
                                        <div className="absolute top-0 left-0 w-[45%] h-[55%] bg-[#3C3B6E]"></div>
                                    </div>
                                ) : acc.layout === 'pirate' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-black relative flex items-center justify-center overflow-hidden">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                ) : (
                                    <div className={`flex border border-white/20 w-12 h-8 rounded-sm overflow-hidden shadow-lg ${acc.layout === 'vertical' ? 'flex-row' : 'flex-col'}`}>
                                        {acc.colors.map((c: string, idx: number) => (
                                            <div key={idx} className="flex-1 h-full w-full" style={{ backgroundColor: c }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    />
                )}
            </div>
        );
    }

    if (gameState === 'DIFFICULTY') {
        return (
            <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 pointer-events-auto animate-in fade-in">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-10 italic uppercase tracking-[0.2em]">Niveau de menace</h2>
                <div className="flex flex-col gap-4 w-full max-w-[340px]">
                    {(Object.keys(ARENA_DIFFICULTY_SETTINGS) as Difficulty[]).map(d => {
                        const s = ARENA_DIFFICULTY_SETTINGS[d];
                        return (
                            <button key={d} onClick={() => onStartGame('SOLO', d)} className={`group cursor-pointer flex items-center justify-between px-8 py-6 border-2 rounded-3xl transition-all ${s.color} hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-xl`}>
                                <div className="flex items-center gap-4">{d==='EASY' && <Shield size={32}/>}{d==='MEDIUM' && <Zap size={32}/>}{d==='HARD' && <Skull size={32}/>}<span className="font-black text-xl uppercase tracking-wider">{d==='EASY'?'Novice':d==='MEDIUM'?'Vétéran':'Elite'}</span></div>
                                <div className="text-[10px] font-black font-mono text-right opacity-60 group-hover:opacity-100">X{s.coinMult}</div>
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-8 flex gap-3 w-full max-w-sm">
                    <button onClick={() => setLockerTab('TANKS')} className="flex-1 py-4 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all uppercase">
                        <Palette size={18}/> BLINDAGES
                    </button>
                    <button onClick={() => setLockerTab('FLAGS')} className="flex-1 py-4 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all uppercase">
                        <Globe size={18}/> DRAPEAUX
                    </button>
                </div>

                <button onClick={onReturnToMenu} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.4em] uppercase cursor-pointer">Annuler</button>
                
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
                            <div className="w-12 h-12 bg-gray-800 border-2 rounded-lg relative flex items-center justify-center" style={{ borderColor: tank.primaryColor, boxShadow: `0 0 10px ${tank.glowColor}50` }}>
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
                                {acc.layout === 'japan' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative flex items-center justify-center overflow-hidden">
                                        <div className="w-4 h-4 rounded-full bg-[#BC002D]"></div>
                                    </div>
                                ) : acc.layout === 'brazil' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-[#009739] relative flex items-center justify-center overflow-hidden">
                                        <div className="w-8 h-6 bg-[#FEDD00] rotate-45 transform scale-[0.8] absolute"></div>
                                        <div className="w-3 h-3 bg-[#012169] rounded-full absolute z-10"></div>
                                    </div>
                                ) : acc.layout === 'usa' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-white relative overflow-hidden flex flex-col">
                                        {Array.from({length: 7}).map((_, i) => (
                                            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-[#B22234]' : 'bg-white'}`}></div>
                                        ))}
                                        <div className="absolute top-0 left-0 w-[45%] h-[55%] bg-[#3C3B6E]"></div>
                                    </div>
                                ) : acc.layout === 'pirate' ? (
                                    <div className="w-12 h-8 border border-white/20 rounded-sm bg-black relative flex items-center justify-center overflow-hidden">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                ) : (
                                    <div className={`flex border border-white/20 w-12 h-8 rounded-sm overflow-hidden shadow-lg ${acc.layout === 'vertical' ? 'flex-row' : 'flex-col'}`}>
                                        {acc.colors.map((c: string, idx: number) => (
                                            <div key={idx} className="flex-1 h-full w-full" style={{ backgroundColor: c }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    />
                )}
            </div>
        );
    }

    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center overflow-hidden pointer-events-none">
            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    <div className="absolute top-0 left-0 w-full flex justify-between items-start p-4 md:p-6 z-20 pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <button onClick={onBack} className="p-3 bg-gray-900/90 rounded-2xl text-gray-400 hover:text-white border border-white/10 active:scale-90 shadow-2xl transition-all cursor-pointer"><Home size={24} /></button>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className={`text-2xl md:text-4xl font-black font-mono drop-shadow-[0_0_15px_rgba(0,0,0,1)] px-4 md:px-6 py-1.5 md:py-2 bg-black/40 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-md ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-500' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}
                            </div>
                        </div>
                        <div className="pointer-events-none"><MiniLeaderboard /></div>
                    </div>

                    {gameState === 'RESPAWNING' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                             <div className="p-8 rounded-[40px] border-2 border-red-500/50 bg-gray-900/80 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                                <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center border-2 border-red-500 animate-pulse">
                                    <SkullIcon size={40} className="text-red-500" />
                                </div>
                                <h3 className="text-3xl font-black italic text-white uppercase tracking-tight">DÉTRUIT</h3>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Réapparition dans</span>
                                    <span className="text-5xl font-mono font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        {Math.ceil(respawnTimer / 1000)}s
                                    </span>
                                </div>
                             </div>
                        </div>
                    )}

                    <div className="absolute left-4 bottom-60 md:top-24 md:left-6 flex flex-col gap-1.5 z-10 max-w-[200px]">
                        {killFeed.map(k => (
                            <div key={k.id} className="text-[9px] md:text-[10px] font-black bg-black/70 px-3 py-1.5 rounded-lg text-white animate-in slide-in-from-left-4 border-l-2 border-red-500 backdrop-blur-sm">
                                <span className="text-cyan-400">{k.killer.toUpperCase()}</span>
                                <span className="text-gray-500 mx-1.5 md:mx-2">ELIM</span>
                                <span className="text-red-500">{k.victim.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-0 w-full h-56 grid grid-cols-2 gap-4 md:gap-8 shrink-0 z-40 p-4 md:p-8 pointer-events-auto">
                        <div ref={leftZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden shadow-inner"><div ref={leftKnobRef} className="w-16 h-16 bg-cyan-500/90 rounded-full shadow-[0_0_25px_#00f3ff] flex items-center justify-center transition-transform duration-75"><Activity size={24} className="text-white opacity-50"/></div><span className="absolute bottom-3 text-[8px] md:text-[9px] text-cyan-500 font-black tracking-[0.3em] uppercase">Mouvement</span></div>
                        <div ref={rightZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden shadow-inner"><div ref={rightKnobRef} className="w-16 h-16 bg-red-600/90 rounded-full shadow-[0_0_25px_#ef4444] flex items-center justify-center transition-transform duration-75"><Crosshair size={24} className="text-white opacity-50"/></div><span className="absolute bottom-3 text-[8px] md:text-[9px] text-red-500 font-black tracking-[0.3em] uppercase">Viseur</span></div>
                    </div>
                </>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-8 pointer-events-auto animate-in zoom-in fade-in duration-300">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-bounce" />
                    
                    <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 mb-2 tracking-tighter uppercase">
                        Partie Finie
                    </h2>
                    
                    <div className="bg-gray-800/50 p-6 rounded-3xl border border-white/10 mb-8 w-full max-w-sm text-center backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Votre Score</p>
                                <p className="text-4xl font-mono font-black text-white">{score}</p>
                            </div>
                            <div className="text-center border-l border-white/10">
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Rang</p>
                                <p className="text-4xl font-mono font-black text-cyan-400">#{myRank || '?'}</p>
                            </div>
                        </div>
                    </div>

                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border-2 border-yellow-500 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-black text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 w-full max-w-[280px]">
                        <button 
                            onClick={onRematch}
                            className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-cyan-400 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 text-sm uppercase"
                        >
                            <RefreshCw size={20} /> Recommencer
                        </button>
                        
                        <button 
                            onClick={onBack}
                            className="w-full py-4 bg-gray-800 border border-white/10 text-white font-black tracking-widest rounded-2xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm uppercase"
                        >
                            <Home size={20} /> Retour Menu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
