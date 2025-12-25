
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, Loader2, Home, Play, Wifi, Search, X } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { useMemoryLogic } from './hooks/useMemoryLogic';
import { MemoryMenu } from './views/MemoryMenu';
import { MemoryBoard } from './views/MemoryBoard';
import { MemoryGameOver } from './views/MemoryGameOver';

interface MemoryGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>; 
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const { avatarsCatalog } = useCurrency();

    const logic = useMemoryLogic(audio, addCoins, mp, onReportProgress);

    // Tutorial Check
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_memory_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_memory_tutorial_seen', 'true');
        }
    }, []);

    const renderLobby = () => {
         const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
         
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 {/* Create Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-violet-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-violet-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-violet-500/40 active:scale-95">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Joueurs disponibles</span>
                        <span className="text-xs font-mono text-violet-400 bg-violet-900/20 px-2 py-0.5 rounded border border-violet-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-violet-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-violet-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
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
            if (logic.onlineStep === 'game') {
                mp.leaveGame();
                logic.setPhase('LOBBY');
                logic.setOnlineStep('lobby');
            } else {
                mp.disconnect();
                logic.setPhase('MENU');
            }
            return;
        }
        logic.setPhase('MENU');
    };

    // --- RENDER ---

    if (logic.phase === 'MENU' || logic.phase === 'DIFFICULTY') {
        return (
            <MemoryMenu 
                phase={logic.phase}
                setPhase={logic.setPhase}
                onStartSolo={logic.startSoloGame}
                onStartOnline={logic.startOnlineGame}
                onBack={onBack}
            />
        );
    }

    // Écran d'attente pour l'hôte
    if (logic.gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && logic.onlineStep === 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans p-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">MEMORY</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center z-20 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <Loader2 size={80} className="text-purple-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black italic mb-2 tracking-widest uppercase">Fréquence de Salon</h2>
                    <p className="text-gray-400 font-bold animate-pulse uppercase text-sm tracking-[0.2em] mb-12">En attente d'un cerveau compatible...</p>
                    <button onClick={mp.cancelHosting} className="px-10 py-4 bg-gray-800 border-2 border-red-500/50 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-3">
                        <X size={20} /> ANNULER LA DIFFUSION
                    </button>
                </div>
            </div>
        );
    }

    if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                    <button onClick={() => { mp.leaveGame(); logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">MEMORY</h1>
                    <div className="w-10"/>
                </div>
                {renderLobby()}
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <style>{`.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="memory" onClose={() => setShowTutorial(false)} />}

            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={() => { if(logic.gameMode === 'ONLINE') mp.leaveGame(); else logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">NEON MEMORY</h1>
                {logic.gameMode === 'SOLO' ? 
                    <div className="flex gap-2">
                        <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-purple-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                        <button onClick={() => logic.startSoloGame(logic.difficulty)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                    </div>
                : <div className="w-10"/>}
            </div>

            {logic.gameMode === 'ONLINE' && logic.onlineStep === 'connecting' ? (
                 <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-purple-400 animate-spin mb-4" /><p className="text-purple-300 font-bold">CONNEXION...</p></div>
            ) : (
                <>
                    <MemoryBoard 
                        cards={logic.cards}
                        flippedIndices={logic.flippedIndices}
                        handleCardClick={logic.handleCardClick}
                        gameMode={logic.gameMode}
                        difficulty={logic.difficulty}
                        moves={logic.moves}
                        scores={logic.scores}
                        currentPlayer={logic.currentPlayer}
                        highScore={logic.highScore}
                        mp={mp}
                        isWaitingForDeck={logic.isWaitingForDeck}
                        isProcessing={logic.isProcessing} 
                        opponentLeft={logic.opponentLeft}
                        chatHistory={logic.chatHistory}
                        activeReaction={logic.activeReaction}
                        sendChat={logic.sendChat}
                        sendReaction={logic.sendReaction}
                    />

                    {(logic.isGameOver || logic.opponentLeft) && (
                        <MemoryGameOver 
                            winner={logic.isGameOver && logic.gameMode === 'SOLO' ? true : (logic.scores.p1 > logic.scores.p2)}
                            earnedCoins={logic.earnedCoins}
                            onRestart={() => logic.gameMode === 'ONLINE' ? mp.requestRematch() : logic.startSoloGame(logic.difficulty)}
                            onQuit={() => { if(logic.gameMode === 'ONLINE') { mp.leaveGame(); logic.setPhase('MENU'); } else logic.setPhase('MENU'); }}
                            gameMode={logic.gameMode}
                            scores={logic.scores}
                            moves={logic.moves}
                            opponentLeft={logic.opponentLeft}
                            handleOpponentLeftAction={(action) => {
                                if (action === 'lobby') { mp.leaveGame(); logic.setPhase('MENU'); }
                                else { mp.leaveGame(); mp.createRoom(); }
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};
