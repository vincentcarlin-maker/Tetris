
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { TutorialOverlay } from '../Tutorials';
import { useConnect4Logic } from './hooks/useConnect4Logic';
import { Connect4Menu } from './views/Connect4Menu';
import { Connect4Lobby } from './views/Connect4Lobby';
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
    
    const logic = useConnect4Logic(audio, addCoins, mp, onReportProgress);

    // --- RENDER ---
    
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

    // Gestion de l'état En Ligne (Connexion & Lobby)
    if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
        if (logic.onlineStep === 'connecting') {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                    <Loader2 size={48} className="text-pink-400 animate-spin mb-4" />
                    <p className="text-pink-300 font-bold tracking-widest animate-pulse">CONNEXION...</p>
                </div>
            );
        }
        return <Connect4Lobby mp={mp} onBack={() => { mp.disconnect(); logic.setPhase('MENU'); }} />;
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
