
import React, { useState, useEffect } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Users, Globe, Pause, Loader2, Wifi, Search, Palette } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { TutorialOverlay } from '../Tutorials';
import { useAirHockeyLogic } from './hooks/useAirHockeyLogic';
import { AirHockeyRenderer } from './components/AirHockeyRenderer';
import { GameMode, Difficulty } from './types';
import { MAX_SCORE } from './constants';
import { useCurrency } from '../../hooks/useCurrency';
import { QuickLocker } from '../common/QuickLocker';
import { useGlobal } from '../../context/GlobalContext';

interface AirHockeyGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showLocker, setShowLocker] = useState(false);
    const { avatarsCatalog, ownedMallets, currentMalletId, selectMallet, malletsCatalog } = useCurrency();
    const { setCurrentView } = useGlobal();

    const logic = useAirHockeyLogic(audio, addCoins, mp, onReportProgress);
    const { 
        gameState, setGameState, gameMode, setGameMode, score, difficulty, 
        winner, earnedCoins, onlineStep, setOnlineStep, opponentLeft,
        puckRef, playerMalletRef, opponentMalletRef, p1TargetRef, p2TargetRef,
        update, startGame, resetRound, setDifficulty
    } = logic;

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_airhockey_tutorial_seen');
        if (!hasSeen) { setShowTutorial(true); localStorage.setItem('neon_airhockey_tutorial_seen', 'true'); }
    }, []);

    useEffect(() => {
        if (gameMode === 'ONLINE') { setOnlineStep('connecting'); mp.connect(); } 
        else { mp.disconnect(); }
        return () => mp.disconnect();
    }, [gameMode]);

    useEffect(() => {
        if (mp.mode === 'lobby') {
            if (mp.isHost) { if (onlineStep !== 'game') { setOnlineStep('game'); resetRound(true, 'ONLINE'); } } 
            else { if (onlineStep !== 'lobby') setOnlineStep('lobby'); if (gameState === 'playing' || gameState === 'gameOver') setGameState('menu'); }
        } else if (mp.mode === 'in_game') {
            if (onlineStep !== 'game') setOnlineStep('game');
            if (gameState === 'menu' || gameState === 'difficulty_select') startGame('MEDIUM', 'ONLINE'); 
        }
    }, [mp.mode, mp.isHost, onlineStep, gameState, resetRound, startGame]);

    const handleLocalBack = () => {
        if (gameMode === 'ONLINE') {
            if (onlineStep === 'game') { mp.leaveGame(); setOnlineStep('lobby'); } 
            else { mp.disconnect(); setGameState('menu'); setGameMode('SINGLE'); }
            return;
        }
        if (gameState !== 'menu') setGameState('menu');
        else onBack();
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Wifi size={16} className="text-cyan-400"/> Liaison</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 uppercase cursor-pointer"><Play size={20} fill="black"/> Créer Salon</button>
                </div>
                <button onClick={() => setShowLocker(true)} className="py-4 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                    <Palette size={18}/> VESTIAIRE MAILLETS
                </button>
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adversaires</span><span className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/30">{hostingPlayers.length} ONLINE</span></div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group shadow-lg">
                                         <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>{React.createElement(avatar.icon, { size: 24, className: avatar.color })}<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div></div><div className="flex flex-col"><span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{player.name}</span><span className="text-[10px] text-gray-500 font-mono">En attente...</span></div></div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-cyan-400 hover:text-black transition-all active:scale-95">REJOINDRE</button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50"><div className="relative bg-gray-800 p-4 rounded-full border border-gray-700"><Search size={32} /></div><p className="text-xs font-bold tracking-widest text-center uppercase">Scan des signaux...</p></div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <div className="flex flex-col items-center"><h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">AIR HOCKEY</h1><span className="text-[10px] font-bold text-cyan-400/80 tracking-[0.3em] uppercase">Salon Multijoueur</span></div>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}

                {showLocker && (
                    <QuickLocker 
                        title="Mes Maillets" items={malletsCatalog} ownedIds={ownedMallets} currentId={currentMalletId} onSelect={selectMallet} onClose={() => setShowLocker(false)} onGoToShop={() => setCurrentView('shop')}
                        renderPreview={(mallet) => (
                            <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: mallet.colors[0], boxShadow: `0 0 15px ${mallet.colors[0]}` }}></div>
                        )}
                    />
                )}
            </div>
        );
    }

    if (gameState === 'menu' && !showTutorial) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4"><h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter uppercase">Neon Hockey</h1></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={() => { setGameMode('SINGLE'); setGameState('difficulty_select'); }} className="group cursor-pointer relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"><Users size={32} className="text-cyan-400" /></div><h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors uppercase">Solo / VS</h2><p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Duel contre l'IA ou ami local.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase">Configurer</div>
                        </button>
                        <button onClick={() => setGameMode('ONLINE')} className="group cursor-pointer relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="relative z-10"><div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Globe size={32} className="text-blue-400" /></div><h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-blue-300 transition-colors uppercase">En Ligne</h2><p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Affrontez le monde entier.</p></div>
                            <div className="relative z-10 flex items-center gap-2 text-blue-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase">Rejoindre</div>
                        </button>
                    </div>
                    <button onClick={() => setShowLocker(true)} className="mt-8 w-full max-w-sm md:max-w-3xl py-4 bg-gray-900/80 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                        <Palette size={18}/> PERSONNALISER MAILLLET
                    </button>
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe"><button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button></div>
                </div>

                {showLocker && (
                    <QuickLocker 
                        title="Mes Maillets" items={malletsCatalog} ownedIds={ownedMallets} currentId={currentMalletId} onSelect={selectMallet} onClose={() => setShowLocker(false)} onGoToShop={() => setCurrentView('shop')}
                        renderPreview={(mallet) => (
                            <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: mallet.colors[0], boxShadow: `0 0 15px ${mallet.colors[0]}` }}></div>
                        )}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            {showTutorial && <TutorialOverlay gameId="airhockey" onClose={() => setShowTutorial(false)} />}
            <div className="w-full max-w-md flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex items-center gap-4 font-black text-2xl"><span className="text-neon-blue">{(gameMode === 'ONLINE' && !mp.isHost) ? score.p2 : score.p1}</span><span className="text-white text-lg">VS</span><span className="text-pink-500">{(gameMode === 'ONLINE' && !mp.isHost) ? score.p1 : score.p2}</span></div>
                <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    {gameMode !== 'ONLINE' && gameState === 'playing' && (<button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">{isPaused ? <Play size={20} /> : <Pause size={20} />}</button>)}
                    <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else setGameState('menu'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            <AirHockeyRenderer 
                puckRef={puckRef} playerMalletRef={playerMalletRef} opponentMalletRef={opponentMalletRef} p1TargetRef={p1TargetRef} p2TargetRef={p2TargetRef} gameState={gameState} gameMode={gameMode} isPaused={isPaused} showTutorial={showTutorial} onUpdate={() => update()} currentMalletId={currentMalletId} opponentMalletId={mp.gameOpponent?.malletId}
            />

            {gameState === 'difficulty_select' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
                    <h2 className="text-3xl font-black text-white mb-8 italic uppercase">Mode de jeu</h2>
                    <div className="flex flex-col gap-4 w-56">
                        <button onClick={() => startGame('MEDIUM', 'LOCAL_VS')} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2 mb-4 shadow-lg active:scale-95 uppercase"><Users size={20} className="text-pink-500"/> 2 JOUEURS (VS)</button>
                        <div className="h-px bg-white/10 w-full mb-2"></div>
                        <p className="text-center text-xs text-gray-400 font-bold mb-2 uppercase tracking-widest">Difficulté IA</p>
                        <button onClick={() => startGame('EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded-xl hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                        <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded-xl hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                        <button onClick={() => startGame('HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
                    </div>
                    
                    <button onClick={() => setShowLocker(true)} className="mt-8 px-6 py-3 bg-gray-800 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-yellow-400 font-bold text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                        <Palette size={16}/> Changer Maillet
                    </button>

                    <button onClick={() => setGameState('menu')} className="mt-8 text-gray-500 text-sm hover:text-white underline">RETOUR</button>
                </div>
            )}

            {showLocker && (
                <QuickLocker 
                    title="Mes Maillets" items={malletsCatalog} ownedIds={ownedMallets} currentId={currentMalletId} onSelect={selectMallet} onClose={() => setShowLocker(false)} onGoToShop={() => setCurrentView('shop')}
                    renderPreview={(mallet) => (
                        <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: mallet.colors[0], boxShadow: `0 0 15px ${mallet.colors[0]}` }}></div>
                    )}
                />
            )}

            {isPaused && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in"><h2 className="text-4xl font-black text-white mb-6 tracking-widest">PAUSE</h2><div className="flex flex-col gap-3 w-48"><button onClick={() => setIsPaused(false)} className="w-full py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg"><Play size={20} /> REPRENDRE</button><button onClick={handleLocalBack} className="w-full py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 border border-white/10"><Home size={20} /> QUITTER</button></div></div>
            )}

            {gameState === 'gameOver' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in fade-in"><h2 className="text-5xl font-black italic mb-2 drop-shadow-[0_0_10px_currentColor]" style={{ color: winner === 'Player' || winner === 'P1' || winner === 'J1' ? '#00f3ff' : '#ff0055' }}>{winner === 'Player' ? 'VICTOIRE !' : winner === 'CPU' ? 'DÉFAITE...' : `${winner} GAGNE !`}</h2><div className="text-center mb-6"><p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p><div className="flex gap-4 justify-center items-center mt-2"><span className="text-4xl font-mono text-neon-blue">{score.p1}</span><span className="text-gray-500">-</span><span className="text-4xl font-mono text-pink-500">{score.p2}</span></div></div>{earnedCoins > 0 && (<div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>)}<div className="flex gap-4"><button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else startGame(difficulty, gameMode); }} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"><RefreshCw size={20} /> {gameMode==='ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>{gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}</div><button onClick={handleLocalBack} className="mt-4 text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">RETOUR AU MENU</button></div>
            )}
        </div>
    );
};
