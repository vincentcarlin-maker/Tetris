
import React, { useState } from 'react';
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

    if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
        return <Connect4Lobby mp={mp} onBack={() => { mp.leaveGame(); logic.setPhase('MENU'); }} />;
    }

    return (
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
    );
};
