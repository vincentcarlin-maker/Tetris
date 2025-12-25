
import React from 'react';
import { Home, RefreshCw, HelpCircle, ArrowLeft, Loader2, Play, Wifi, Search, X } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { useSkyjoLogic } from './hooks/useSkyjoLogic';
import { SkyjoMenu } from './views/SkyjoMenu';
import { SkyjoBoard } from './views/SkyjoBoard';
import { SkyjoGameOver } from './views/SkyjoGameOver';
import { calculateScore } from './logic';

interface SkyjoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const SkyjoGame: React.FC<SkyjoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = React.useState(false);
    const { avatarsCatalog } = useCurrency();

    const logic = useSkyjoLogic(audio, addCoins, mp, onReportProgress);

    // React to Tutorial request
    React.useEffect(() => {
        const hasSeen = localStorage.getItem('neon_skyjo_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_skyjo_tutorial_seen', 'true');
        }
    }, []);

    const renderLobby = () => {
         const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
         
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 {/* Create Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-purple-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/40 active:scale-95">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Joueurs disponibles</span>
                        <span className="text-xs font-mono text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-purple-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-purple-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE PARTIE DÉTECTÉE</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

    // --- RENDER DISPATCH ---

    // 1. MENU PHASE
    if (logic.phase === 'MENU') {
        return <SkyjoMenu onStart={logic.startGame} onBack={onBack} />;
    }

    // ÉCRAN D'ATTENTE HÔTE (Simplifié pour inclure la phase LOBBY)
    if (logic.gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && logic.onlineStep === 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans p-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={() => { mp.disconnect(); logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">CYBER SKY</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center z-20 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <Loader2 size={80} className="text-purple-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black italic mb-2 tracking-widest uppercase">Espace Aérien Réservé</h2>
                    <p className="text-gray-400 font-bold animate-pulse uppercase text-sm tracking-[0.2em] mb-12">Attente d'une signature alliée ou ennemie...</p>
                    <button onClick={mp.cancelHosting} className="px-10 py-4 bg-gray-800 border-2 border-red-500/50 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-3">
                        <X size={20} /> QUITTER LE RADAR
                    </button>
                </div>
            </div>
        );
    }

    // 2. ONLINE LOBBY (Liste des serveurs)
    if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={() => logic.setPhase('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">CYBER SKY</h1>
                    <div className="w-10"></div>
                </div>
                {logic.onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-purple-400 animate-spin mb-4" /><p className="text-purple-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    // 3. MAIN GAME
    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="skyjo" onClose={() => setShowTutorial(false)} />}

            {logic.gameMode === 'ONLINE' && logic.isWaitingForDeck && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-purple-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE DE L'HÔTE...</p>
                    <button onClick={mp.leaveGame} className="px-6 py-2 bg-gray-700 text-white rounded-full text-sm font-bold mt-4 hover:bg-gray-600">QUITTER</button>
                </div>
            )}

            {/* HEADER */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={() => { if(logic.gameMode === 'ONLINE') mp.leaveGame(); else logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">CYBER SKY</h1>
                    <span className="text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10 animate-pulse">{logic.message}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => logic.startGame(logic.gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* BOARD */}
            {logic.playerGrid.length > 0 && (
                <SkyjoBoard 
                    {...logic}
                    mp={mp}
                    onDeckClick={logic.handleDeckClick}
                    onDiscardClick={logic.handleDiscardPileClick}
                    onGridCardClick={logic.handleGridCardClick}
                    onSetupReveal={logic.handleSetupReveal}
                />
            )}

            {/* GAME OVER */}
            {logic.phase === 'ENDED' && (
                <SkyjoGameOver 
                    winner={logic.winner}
                    doubledScore={logic.doubledScore}
                    pScore={calculateScore(logic.playerGrid)}
                    cScore={calculateScore(logic.cpuGrid)}
                    earnedCoins={logic.earnedCoins}
                    onRestart={() => logic.startGame(logic.gameMode)}
                />
            )}
        </div>
    );
};
