
import React from 'react';
import { Home, RefreshCw, HelpCircle, ArrowLeft, Loader2, Play } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
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

    const logic = useSkyjoLogic(audio, addCoins, mp, onReportProgress);

    // React to Tutorial request
    React.useEffect(() => {
        const hasSeen = localStorage.getItem('neon_skyjo_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_skyjo_tutorial_seen', 'true');
        }
    }, []);

    // --- RENDER DISPATCH ---

    // 1. MENU PHASE
    if (logic.phase === 'MENU') {
        return <SkyjoMenu onStart={logic.startGame} onBack={onBack} />;
    }

    // 2. ONLINE LOBBY
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
                ) : (
                    // LOBBY COMPONENT DUPLICATED HERE FOR SIMPLICITY OR EXTRACTED TO SkyjoMenu if preferred
                    // For now reusing the one from original code structure context
                    <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                         <div className="flex flex-col gap-3 mb-4">
                             <h3 className="text-xl font-black text-center text-purple-300 tracking-wider drop-shadow-md">LOBBY SKYJO</h3>
                             <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                                <Play size={18} fill="black"/> CRÉER UNE PARTIE
                             </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId).map((player: any) => (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                    <span className="font-bold">{player.name}</span>
                                    <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </div>
        );
    }

    // 3. MAIN GAME
    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="skyjo" onClose={() => setShowTutorial(false)} />}

            {logic.gameMode === 'ONLINE' && logic.isWaitingForHost && (
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
            <SkyjoBoard 
                {...logic}
                mp={mp}
                onDeckClick={logic.handleDeckClick}
                onDiscardClick={logic.handleDiscardPileClick}
                onGridCardClick={logic.handleGridCardClick}
                onSetupReveal={logic.handleSetupReveal}
            />

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
