
import React, { useState, useEffect } from 'react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useBreakerLogic } from './hooks/useBreakerLogic';
import { BreakerRenderer } from './components/BreakerRenderer';
import { BreakerUI } from './components/BreakerUI';
import { TutorialOverlay } from '../Tutorials';

interface BreakerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const BreakerGame: React.FC<BreakerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [view, setView] = useState<'LEVEL_SELECT' | 'GAME'>('LEVEL_SELECT');
    const [showTutorial, setShowTutorial] = useState(false);
    
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
        return parseInt(localStorage.getItem('breaker-max-level') || '1', 10);
    });

    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.breaker || 0;

    const gameLogic = useBreakerLogic(
        audio, 
        addCoins, 
        onReportProgress, 
        maxUnlockedLevel,
        (lvl) => {
            setMaxUnlockedLevel(lvl);
            localStorage.setItem('breaker-max-level', lvl.toString());
        }
    );

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_breaker_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_breaker_tutorial_seen', 'true');
        }
    }, []);

    // Game Over HighScore Sync
    useEffect(() => {
        if (gameLogic.gameState === 'gameOver' && gameLogic.score > highScore) {
            updateHighScore('breaker', gameLogic.score);
        }
    }, [gameLogic.gameState, gameLogic.score, highScore, updateHighScore]);

    const handleLevelSelect = (lvl: number) => {
        if (lvl > maxUnlockedLevel) return;
        audio.playLand();
        gameLogic.startGame(lvl);
        setView('GAME');
    };

    const handleBack = () => {
        if (view === 'GAME') {
             // Basic pause logic simply by unmounting the game view or switching view
            setView('LEVEL_SELECT');
        } else {
            onBack();
        }
    };

    const ui = BreakerUI({
        gameState: gameLogic.gameState,
        score: gameLogic.score,
        lives: gameLogic.lives,
        currentLevel: gameLogic.currentLevel,
        earnedCoins: gameLogic.earnedCoins,
        maxUnlockedLevel: maxUnlockedLevel,
        highScore: highScore,
        onBack: handleBack,
        onRestart: () => gameLogic.startGame(gameLogic.currentLevel),
        onShowTutorial: () => setShowTutorial(true),
        onSelectLevel: handleLevelSelect,
        onLevelContinue: () => handleLevelSelect(maxUnlockedLevel),
        showTutorial: showTutorial
    });

    if (view === 'LEVEL_SELECT') {
        return ui.renderLevelSelect();
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="breaker" onClose={() => setShowTutorial(false)} />}
            
            {ui.renderHUD()}
            
            <div className="relative w-full max-w-lg aspect-[2/3]">
                <BreakerRenderer 
                    paddleRef={gameLogic.paddleRef}
                    ballsRef={gameLogic.ballsRef}
                    blocksRef={gameLogic.blocksRef}
                    powerUpsRef={gameLogic.powerUpsRef}
                    lasersRef={gameLogic.lasersRef}
                    particlesRef={gameLogic.particlesRef}
                    gameState={gameLogic.gameState}
                    onTick={gameLogic.runPhysicsTick}
                    onServe={() => gameLogic.setGameState('playing')}
                    showTutorial={showTutorial}
                />
                {ui.renderOverlay()}
            </div>
        </div>
    );
};
