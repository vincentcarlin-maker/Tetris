
import React, { useRef, useEffect } from 'react';
import { Home, HelpCircle, Trophy, Crosshair, Map, ChevronLeft, ChevronRight, User, Globe, Loader2, Coins, RefreshCw, Wifi, Play, Search, ArrowRight, Shield, Zap, Skull, MessageSquare, Send } from 'lucide-react';
import { MAPS } from '../constants';
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
    onStartGame: (mode?: 'SOLO' | 'ONLINE') => void;
    onChangeMap: (delta: number) => void;
    onCancelHosting: () => void;
    onLeaveGame: () => void;
    onRematch: () => void;
    onReturnToMenu: () => void;
    controlsRef: React.MutableRefObject<any>;
    mp: any;
    avatarsCatalog: Avatar[];
}

export const ArenaUI: React.FC<ArenaUIProps> = ({
    gameState, gameMode, score, timeLeft, respawnTimer, killFeed, leaderboard, earnedCoins,
    selectedMapIndex, onlineStep, isHost, hasOpponent,
    onBack, onToggleTutorial, onSetGameMode, onStartGame, onChangeMap,
    onCancelHosting, onLeaveGame, onRematch, onReturnToMenu, controlsRef,
    mp, avatarsCatalog
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

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId && p.extraInfo === 'Arena Clash'); 
        
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4 pt-4 pointer-events-auto bg-black/80 backdrop-blur-md">
                 {/* Header */}
                 <div className="flex items-center gap-4 w-full">
                    <button onClick={() => { onSetGameMode('SOLO'); onReturnToMenu(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95"><ChevronLeft size={24}/></button>
                    <h2 className="text-xl font-black text-white italic">ARENA LOBBY</h2>
                 </div>

                 {onlineStep === 'connecting' ? (
                     <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={48} className="text-red-500 animate-spin"/>
                        <p className="text-white font-bold animate-pulse">CONNEXION AU SERVEUR...</p>
                     </div>
                 ) : (
                    <>
                     {/* Create Section */}
                     <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden group shrink-0">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                         <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-red-500"/> HÉBERGER UNE PARTIE</h3>
                         <button onClick={mp.createRoom} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-red-500/40 active:scale-95">
                            <Play size={20} fill="currentColor"/> CRÉER UN SALON
                         </button>
                    </div>

                    {/* List Section */}
                    <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Combattants en attente</span>
                            <span className="text-xs font-mono text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30">{hostingPlayers.length} ONLINE</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {hostingPlayers.length > 0 ? (
                                hostingPlayers.map((player: any) => {
                                    const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                    const AvatarIcon = avatar.icon;
                                    return (
                                         <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group animate-in slide-in-from-right-4">
                                             <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                     <AvatarIcon size={24} className={avatar.color}/>
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-red-300 transition-colors">{player.name}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                                </div>
                                             </div>
                                             <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-red-400 hover:text-white transition-all shadow-lg active:scale-95">
                                                REJOINDRE
                                             </button>
                                         </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                                        <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                            <Search size={32} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE ARENE DÉTECTÉE</p>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                 )}
             </div>
        );
    };

    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center pointer-events-none">
            
            {/* LOBBY VIEW */}
            {gameMode === 'ONLINE' && onlineStep !== 'game' && (
                renderLobby()
            )}

            {/* MENU HEADER - Only visible in MENU */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto pointer-events-auto">
                    <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050510] to-black pointer-events-none"></div>
                    <div className="fixed inset-0 bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                    <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                        <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                            <div className="flex items-center justify-center gap-6 mb-4">
                                <Crosshair size={56} className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                                <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tracking-tighter w-full">
                                    ARENA<br className="md:hidden"/> CLASH
                                </h1>
                                <Crosshair size={56} className="text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse hidden md:block" />
                            </div>
                        </div>

                        {/* Map Selector inside Menu */}
                        <div className="flex items-center justify-center gap-4 mb-8 bg-gray-900/80 p-2 rounded-xl border border-white/10 backdrop-blur-md w-full max-w-xs">
                            <button onClick={() => onChangeMap(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-400"/></button>
                            <div className="text-center w-40">
                                <p className="text-[10px] text-gray-500 font-bold mb-1 flex items-center justify-center gap-1"><Map size={10}/> CARTE</p>
                                <p className="text-white font-black italic text-lg truncate" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                            </div>
                            <button onClick={() => onChangeMap(1)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24} className="text-gray-400"/></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                            <button onClick={() => { onSetGameMode('SOLO'); onStartGame('SOLO'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]"><User size={32} className="text-red-400" /></div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-red-300 transition-colors">SOLO</h2>
                                    <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Entraînement contre des bots.</p>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 text-red-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                    COMBATTRE L'IA <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </div>
                            </button>

                            <button onClick={() => onSetGameMode('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)]"><Globe size={32} className="text-orange-400" /></div>
                                    <div className="flex items-center gap-3 mb-2"><h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-orange-300 transition-colors">EN LIGNE</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                                    <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Duel intense contre un joueur réel.</p>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 text-orange-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                    REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                            <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                        </div>
                    </div>
                </div>
            )}

            {/* In-Game HUD */}
            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    <div className="absolute top-0 left-0 w-full flex justify-between items-start p-4 z-20 pointer-events-none">
                        
                        {/* Left Column: Home Btn + Killfeed */}
                        <div className="flex flex-col gap-2 items-start">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onBack(); }} 
                                className="p-2 bg-gray-900/80 rounded-lg text-gray-400 hover:text-white border border-white/10 pointer-events-auto active:scale-95 transition-all"
                            >
                                <Home size={20} />
                            </button>

                            <div className="flex flex-col gap-1 mt-2">
                                {killFeed.map(k => (
                                    <div key={k.id} className="text-xs bg-black/60 px-2 py-1 rounded text-white animate-in fade-in border-l-2 border-pink-500">
                                        <span className="text-cyan-400 font-bold">{k.killer}</span>
                                        <span className="text-gray-400 mx-1 text-[10px]">killed</span>
                                        <span className="text-pink-400">{k.victim}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center Column: Timer & Voice Chat */}
                        <div className="flex flex-col items-center">
                            <div className={`text-3xl font-black font-mono drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}
                            </div>
                            
                            {gameState === 'RESPAWNING' && (
                                <div className="mt-2 bg-red-900/90 px-4 py-1 rounded-full text-red-100 font-bold animate-pulse border border-red-500 text-xs shadow-lg backdrop-blur-sm">
                                    RESPAWN {Math.ceil(respawnTimer / 1000)}s
                                </div>
                            )}
                        </div>

                        {/* Right Column: Leaderboard */}
                        <div className="w-32 bg-gray-900/80 p-2 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
                                <Trophy size={14} className="text-yellow-400"/>
                                <span className="text-xs font-bold text-white">TOP</span>
                            </div>
                            {leaderboard.slice(0, 5).map((p, i) => (
                                <div key={i} className={`flex justify-between text-[10px] mb-1 ${p.isMe ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                                    <span className="truncate w-20">{i+1}. {p.name}</span>
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
