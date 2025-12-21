
import React, { useState } from 'react';
import { Loader2, Home, Play, Wifi, Search } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { useConnect4Logic } from './hooks/useConnect4Logic';
import { Connect4Menu } from './views/Connect4Menu';
import { Connect4Board } from './views/Connect4Board';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>;
  onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const { avatarsCatalog } = useCurrency();
    
    const logic = useConnect4Logic(audio, addCoins, mp, onReportProgress);

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 {/* Create Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(236,72,153,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-pink-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-pink-500/40 active:scale-95">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Joueurs disponibles</span>
                        <span className="text-xs font-mono text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-pink-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-pink-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping"></div>
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

    const handleLocalBack = () => {
        if (logic.gameMode === 'ONLINE') {
            if (logic.onlineStep !== 'game') {
                mp.disconnect();
                logic.setPhase('MENU');
            } else {
                mp.leaveGame();
            }
        } else {
            logic.setPhase('MENU');
        }
    };

    // --- RENDER ---
    
    // Priorité au lobby si le mode est ONLINE et qu'on n'est pas en jeu
    if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] pr-2 pb-1">PUISSANCE 4</h1>
                    <div className="w-10"></div>
                </div>
                {logic.onlineStep === 'connecting' ? (
                     <div className="flex-1 flex flex-col items-center justify-center z-20"><Loader2 size={48} className="text-pink-400 animate-spin mb-4" /><p className="text-pink-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }
    
    if (logic.phase === 'MENU' || logic.phase === 'DIFFICULTY') {
        return (
            <Connect4Menu 
                phase={logic.phase} 
                setPhase={logic.setPhase}
                onStart={logic.startGame}
                onBack={onBack}
            />
        );
    }

    return (
        <>
            {showTutorial && <TutorialOverlay gameId="connect4" onClose={() => setShowTutorial(false)} />}
            <Connect4Board 
                {...logic}
                mp={mp}
                onBack={() => { if(logic.gameMode === 'ONLINE') mp.leaveGame(); logic.setPhase('MENU'); }}
                onRestart={() => logic.gameMode === 'ONLINE' ? mp.requestRematch() : logic.resetGame()}
                onShowTutorial={() => setShowTutorial(true)}
                handleOpponentLeftAction={(action) => {
                    if (action === 'lobby') { mp.leaveGame(); logic.setOnlineStep('lobby'); logic.setPhase('LOBBY'); }
                    else { mp.leaveGame(); mp.createRoom(); }
                }}
                onColumnClick={logic.handleColumnClick}
            />
        </>
    );
};
