
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Home, Trophy, Crosshair, ChevronLeft, ChevronRight, User, Globe, Coins, RefreshCw, ArrowRight, Shield, Zap, Skull, Activity, X, Wifi, Play, Search, Loader2 } from 'lucide-react';
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
    const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);
    
    const leftZoneRef = useRef<HTMLDivElement>(null);
    const rightZoneRef = useRef<HTMLDivElement>(null);
    const leftKnobRef = useRef<HTMLDivElement>(null);
    const rightKnobRef = useRef<HTMLDivElement>(null);
    const activeTouches = useRef<{ move: number | null, aim: number | null }>({ move: null, aim: null });

    // Calcul du rang actuel pour affichage rapide
    const myRank = useMemo(() => {
        const index = leaderboard.findIndex(p => p.isMe);
        return index !== -1 ? index + 1 : null;
    }, [leaderboard]);

    // Fermer le classement mobile si le jeu s'arrête ou si le joueur réapparaît
    useEffect(() => {
        if (gameState !== 'PLAYING') setShowMobileLeaderboard(false);
    }, [gameState]);

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

    const LeaderboardContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400"/>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Classement</span>
                </div>
                {onClose && (
                    <button 
                        onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            onClose(); 
                        }} 
                        className="p-2 bg-white/10 hover:bg-red-500/40 rounded-lg text-white transition-colors cursor-pointer z-[110]"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
            <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {leaderboard.length > 0 ? leaderboard.map((p, i) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded-lg border transition-all ${p.isMe ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_10px_rgba(0,217,255,0.2)]' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex items-center gap-2 truncate">
                            <span className={`text-[10px] font-mono ${p.isMe ? 'text-white' : 'text-gray-500'}`}>{i+1}.</span>
                            <span className={`text-xs truncate ${p.isMe ? 'text-white font-black' : 'text-gray-300 font-bold'}`}>{p.name.toUpperCase()}</span>
                        </div>
                        <span className={`font-mono text-xs ${p.isMe ? 'text-cyan-400' : 'text-white'}`}>{p.score}</span>
                    </div>
                )) : <div className="text-[10px] text-gray-600 animate-pulse italic text-center py-4">Initialisation...</div>}
            </div>
        </div>
    );

    // --- MENU PRINCIPAL ---
    if (gameState === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto p-6 pointer-events-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050510] to-black"></div>
                <div className="relative z-10 w-full max-w-5xl flex flex-col items-center min-h-full justify-center">
                    <div className="mb-12 text-center animate-in slide-in-from-top-10 duration-700">
                         <h1 className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tracking-tighter uppercase">Arena Clash</h1>
                         <p className="text-red-400 font-black tracking-[0.5em] text-sm mt-4 uppercase">Duel Néon Infini</p>
                    </div>
                    <div className="flex items-center gap-4 mb-10 bg-gray-900/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md w-full max-w-xs shadow-2xl">
                        <button onClick={() => onChangeMap(-1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 cursor-pointer"><ChevronLeft/></button>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-gray-500 font-black tracking-widest mb-1 uppercase">Secteur</p>
                            <p className="text-white font-black italic text-lg truncate" style={{ color: MAPS[selectedMapIndex].colors.wallBorder }}>{MAPS[selectedMapIndex].name}</p>
                        </div>
                        <button onClick={() => onChangeMap(1)} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 cursor-pointer"><ChevronRight/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                        <button onClick={() => { onSetGameMode('SOLO'); onSetGameState('DIFFICULTY'); }} className="group cursor-pointer relative h-64 md:h-80 rounded-[40px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-6 shadow-xl"><User size={40} className="text-red-400" /></div><h2 className="text-4xl font-black text-white italic mb-2 group-hover:text-red-300">PROTOCOLE SOLO</h2><p className="text-gray-400 text-sm font-medium leading-relaxed">Défiez les sentinelles de la grille.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-red-400 font-black text-xs tracking-[0.2em] group-hover:text-white uppercase">Initialiser <ArrowRight size={20} /></div>
                        </button>
                        <button onClick={() => { onSetGameMode('ONLINE'); onSetGameState('LOBBY'); }} className="group cursor-pointer relative h-64 md:h-80 rounded-[40px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(249,115,22,0.3)] text-left p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mb-6 shadow-xl"><Globe size={40} className="text-orange-400" /></div><div className="flex items-center gap-3 mb-2"><h2 className="text-4xl font-black text-white italic group-hover:text-orange-300">RESEAU LIVE</h2><span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">EN LIGNE</span></div><p className="text-gray-400 text-sm font-medium leading-relaxed">Confrontation directe mondiale.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-orange-400 font-black text-xs tracking-[0.2em] group-hover:text-white uppercase">Rechercher canal <ArrowRight size={20} /></div>
                        </button>
                    </div>
                    <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.3em] flex items-center gap-2 py-3 px-6 hover:bg-white/5 rounded-2xl transition-all cursor-pointer"><Home size={16}/> RETOUR ARCADE</button>
                </div>
            </div>
        );
    }

    // --- LOBBY MULTIJOUEUR ---
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
                                    <button onClick={mp.createRoom} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black tracking-[0.2em] rounded-2xl text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase cursor-pointer">
                                        <Play size={20} fill="currentColor"/> Créer Salon
                                    </button>
                                </div>
                                <div className="bg-gray-900/60 border border-white/5 rounded-[32px] p-6 text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Statut Réseau</p>
                                    <span className="text-green-400 text-xs font-black animate-pulse uppercase">Opérationnel</span>
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
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                                                <div className="relative bg-gray-800 p-6 rounded-full border border-gray-700">
                                                    <Search size={40} />
                                                </div>
                                            </div>
                                            <p className="text-xs font-black tracking-[0.3em] text-center leading-loose">SCAN DES FRÉQUENCES...<br/>AUCUN COMBAT DÉTECTÉ</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- HUD EN JEU ---
    return (
        <div id="arena-ui-container" className="absolute inset-0 flex flex-col items-center overflow-hidden pointer-events-none">
            
            {(gameState === 'PLAYING' || gameState === 'RESPAWNING') && (
                <>
                    <div className="absolute top-0 left-0 w-full flex justify-between items-start p-4 md:p-6 z-20 pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <button onClick={onBack} className="p-3 bg-gray-900/90 rounded-2xl text-gray-400 hover:text-white border border-white/10 active:scale-90 shadow-2xl transition-all cursor-pointer"><Home size={24} /></button>
                            <button onClick={() => setShowMobileLeaderboard(true)} className="md:hidden p-3 bg-gray-900/90 rounded-2xl text-yellow-400 border border-white/10 active:scale-90 shadow-2xl transition-all cursor-pointer relative">
                                <Trophy size={24} />
                                {myRank && (
                                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg animate-pop">
                                        #{myRank}
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={`text-2xl md:text-4xl font-black font-mono drop-shadow-[0_0_15px_rgba(0,0,0,1)] px-4 md:px-6 py-1.5 md:py-2 bg-black/40 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-md ${timeLeft < 10 ? 'text-red-500 animate-pulse border-red-500' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{String(Math.ceil(timeLeft % 60)).padStart(2, '0')}
                            </div>
                            {gameState === 'RESPAWNING' && (
                                <div className="mt-4 bg-red-950/90 px-4 md:px-6 py-2 rounded-xl md:rounded-2xl text-red-100 font-black animate-pulse border border-red-500 text-[10px] md:text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md uppercase tracking-[0.2em]">
                                    Initialisation... {Math.ceil(respawnTimer / 1000)}s
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block w-48 bg-gray-900/90 p-5 rounded-[32px] border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto">
                            <LeaderboardContent />
                        </div>
                    </div>

                    <div className="absolute left-4 bottom-60 md:top-24 md:left-6 flex flex-col gap-1.5 z-10 max-w-[200px]">
                        {killFeed.map(k => (
                            <div key={k.id} className="text-[9px] md:text-[10px] font-black bg-black/70 px-3 py-1.5 rounded-lg text-white animate-in slide-in-from-left-4 border-l-2 border-red-500 backdrop-blur-sm">
                                <span className="text-cyan-400">{k.killer.toUpperCase()}</span>
                                <span className="text-gray-500 mx-1.5 md:mx-2">ELIM</span>
                                <span className="text-red-500">{k.victim.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>

                    {showMobileLeaderboard && (
                        <div className="md:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto animate-in fade-in" onClick={() => setShowMobileLeaderboard(false)}>
                            <div className="w-full max-w-xs bg-gray-900 border-2 border-yellow-500/30 rounded-[40px] p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                                <LeaderboardContent onClose={() => setShowMobileLeaderboard(false)} />
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-0 w-full h-56 grid grid-cols-2 gap-4 md:gap-8 shrink-0 z-40 p-4 md:p-8 pointer-events-auto">
                        <div ref={leftZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 shadow-inner group">
                            <div ref={leftKnobRef} className="w-16 h-16 bg-cyan-500/90 rounded-full shadow-[0_0_25px_#00f3ff] flex items-center justify-center transition-transform duration-75"><Activity size={24} className="text-white opacity-50"/></div>
                            <span className="absolute bottom-3 text-[8px] md:text-[9px] text-cyan-500 font-black tracking-[0.3em] uppercase">Mouvement</span>
                        </div>
                        <div ref={rightZoneRef} className="relative bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center overflow-hidden active:bg-white/10 shadow-inner group">
                            <div ref={rightKnobRef} className="w-16 h-16 bg-red-600/90 rounded-full shadow-[0_0_25px_#ef4444] flex items-center justify-center transition-transform duration-75"><Crosshair size={24} className="text-white opacity-50"/></div>
                            <span className="absolute bottom-3 text-[8px] md:text-[9px] text-red-500 font-black tracking-[0.3em] uppercase">Viseur</span>
                        </div>
                    </div>
                </>
            )}

            {/* GAMEOVER - Overlay haute priorité */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in zoom-in p-8 text-center pointer-events-auto">
                    <Trophy size={100} className="text-yellow-400 mb-8 drop-shadow-[0_0_40px_gold] animate-bounce"/>
                    <h2 className="text-4xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 mb-6 uppercase tracking-tighter">Données de combat</h2>
                    <div className="bg-gray-800/40 p-6 md:p-8 rounded-[40px] border border-white/10 mb-10 backdrop-blur-md shadow-2xl flex flex-col items-center">
                        <span className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Eliminations</span>
                        <span className="text-6xl md:text-7xl font-black text-white font-mono drop-shadow-[0_0_20px_white]">{score}</span>
                    </div>
                    {earnedCoins > 0 && <div className="mb-12 flex items-center gap-4 bg-yellow-500/20 px-8 py-4 rounded-3xl border-2 border-yellow-500/50 shadow-lg animate-pulse"><Coins className="text-yellow-400" size={32} /><span className="text-yellow-100 font-black text-2xl md:text-3xl">+{earnedCoins}</span></div>}
                    <div className="flex gap-4 md:gap-6 w-full max-w-md relative z-[210] pointer-events-auto">
                        <button 
                            onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                if(gameMode === 'ONLINE') onRematch(); else onStartGame(); 
                            }} 
                            className="flex-1 py-4 md:py-5 bg-red-600 text-white font-black tracking-[0.2em] rounded-3xl hover:bg-red-500 shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm cursor-pointer"
                        >
                            <RefreshCw size={24} /> REPLAY
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onReturnToMenu();
                            }} 
                            className="flex-1 py-4 md:py-5 bg-gray-800 text-gray-300 font-black tracking-[0.2em] rounded-3xl hover:bg-gray-700 text-sm cursor-pointer"
                        >
                            MENU
                        </button>
                    </div>
                </div>
            )}
            
            {/* DIFFICULTE */}
            {gameState === 'DIFFICULTY' && (
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
                    <button onClick={onReturnToMenu} className="mt-12 text-gray-500 hover:text-white text-xs font-black tracking-[0.4em] uppercase cursor-pointer">Annuler</button>
                </div>
            )}
            
            {gameMode === 'ONLINE' && gameState === 'LOBBY' && isHost && !hasOpponent && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
                    <Loader2 size={64} className="text-orange-400 animate-spin mb-6" />
                    <h2 className="text-2xl font-black text-white italic mb-2 uppercase tracking-widest">En attente d'un adversaire...</h2>
                    <p className="text-gray-400 text-sm mb-8">Votre signal est diffusé sur la grille.</p>
                    <button onClick={onCancelHosting} className="px-8 py-3 bg-red-600/20 text-red-500 border border-red-500/50 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer">Annuler</button>
                </div>
            )}
        </div>
    );
};
