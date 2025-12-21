
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, Loader2, Home } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
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
    
    const logic = useMemoryLogic(audio, addCoins, mp, onReportProgress);

    // Tutorial Check
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_memory_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_memory_tutorial_seen', 'true');
        }
    }, []);

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

    if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                    <button onClick={() => { mp.leaveGame(); logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">MEMORY</h1>
                    <div className="w-10"/>
                </div>
                {/* Reusing existing lobby rendering logic or component if available, assuming simplified here as placeholder for logic consistency */}
                <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                     <p className="text-center text-gray-400 my-auto">Lobby Memory (Refactored)</p>
                     {/* In a real scenario, import the Lobby component from social or duplicate simple list */}
                     <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId).map((player: any) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                <span className="font-bold">{player.name}</span>
                                <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                            </div>
                        ))}
                         {mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId).length === 0 && (
                             <div className="text-center w-full py-10 text-gray-500">Aucune partie. Créez-en une !</div>
                         )}
                    </div>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">CRÉER UNE PARTIE</button>
                </div>
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
                        isProcessing={logic.isProcessing} // Passed but used internally mostly
                        opponentLeft={logic.opponentLeft}
                        chatHistory={logic.chatHistory}
                        activeReaction={logic.activeReaction}
                        sendChat={logic.sendChat}
                        sendReaction={logic.sendReaction}
                    />

                    {(logic.isGameOver || logic.opponentLeft) && (
                        <MemoryGameOver 
                            winner={logic.isGameOver && logic.gameMode === 'SOLO' ? true : (logic.scores.p1 > logic.scores.p2)} // Simplified logic for display
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
