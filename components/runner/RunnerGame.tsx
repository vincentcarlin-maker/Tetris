
import React, { useEffect, useCallback } from 'react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';
import { useRunnerLogic } from './hooks/useRunnerLogic';
import { RunnerRenderer } from './components/RunnerRenderer';
import { RunnerUI } from './components/RunnerUI';
import { SKINS } from './constants';
import { useCurrency } from '../../hooks/useCurrency';

interface RunnerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const RunnerGame: React.FC<RunnerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    // We fetch currency info to manage local buying logic
    // Note: useRunnerLogic manages its own local copy for performance, but we sync back purchases
    const { coins } = useCurrency();
    
    const [showSkinShop, setShowSkinShop] = React.useState(false);
    const [showTutorial, setShowTutorial] = React.useState(false);
    
    // Skin Ownership State - pulled from logic hook for consistency, 
    // but initialized from localStorage in hook
    const [localBalance, setLocalBalance] = React.useState(coins);
    const [ownedSkins, setOwnedSkins] = React.useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('runner_owned_skins') || '["default"]'); } catch { return ['default']; }
    });

    const logic = useRunnerLogic(audio, addCoins, onReportProgress);
    const { highScores } = useHighScores(); // Used if we want to display high score in UI

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_runner_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_runner_tutorial_seen', 'true');
        }
    }, []);

    // Sync external coins to local balance for shop display
    useEffect(() => { setLocalBalance(coins); }, [coins]);

    const handleJumpInput = useCallback((e: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
        if (showSkinShop || showTutorial) return;
        logic.handleJump();
        
        // If not playing, start game on interaction
        if (!logic.isPlaying && !logic.gameOver) {
            logic.setIsPlaying(true);
            audio.resumeAudio();
        }
    }, [logic, showSkinShop, showTutorial, audio]);

    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { 
            if (e.code === 'Space' || e.code === 'ArrowUp') { 
                e.preventDefault(); 
                handleJumpInput(e); 
            } 
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleJumpInput]);

    const handleBuySkin = (skin: typeof SKINS[0]) => {
        if (localBalance >= skin.cost) {
            addCoins(-skin.cost); // Deduct from main app wallet
            setLocalBalance(prev => prev - skin.cost);
            
            const newOwned = [...ownedSkins, skin.id];
            setOwnedSkins(newOwned);
            localStorage.setItem('runner_owned_skins', JSON.stringify(newOwned));
            
            logic.setCurrentSkinId(skin.id);
            audio.playCoin();
        }
    };

    return (
        <div 
            className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4" 
            onMouseDown={handleJumpInput} 
            onTouchStart={handleJumpInput}
        >
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-black to-transparent pointer-events-none"></div>
            
            {showTutorial && <TutorialOverlay gameId="runner" onClose={() => setShowTutorial(false)} />}
            
            <RunnerUI 
                distance={logic.distance}
                earnedCoins={logic.earnedCoins}
                currentBiome={logic.currentBiome}
                activeEvent={logic.activeEvent}
                notification={logic.notification}
                currentMission={logic.currentMission}
                missionProgress={logic.missionProgress}
                activePowerUps={logic.activePowerUps}
                gameOver={logic.gameOver}
                isPlaying={logic.isPlaying}
                showSkinShop={showSkinShop}
                showTutorial={showTutorial}
                localBalance={localBalance}
                currentSkinId={logic.currentSkinId}
                ownedSkins={ownedSkins}
                onBack={onBack}
                onReset={logic.resetGame}
                onToggleTutorial={() => setShowTutorial(prev => !prev)}
                onToggleSkinShop={() => setShowSkinShop(prev => !prev)}
                onBuySkin={handleBuySkin}
                onEquipSkin={logic.setCurrentSkinId}
            />
            
            <div className="w-full h-full flex items-center justify-center">
                 <RunnerRenderer 
                    playerRef={logic.playerRef}
                    obstaclesRef={logic.obstaclesRef}
                    coinsRef={logic.coinsRef}
                    treasuresRef={logic.treasuresRef}
                    powerUpsRef={logic.powerUpsRef}
                    particlesRef={logic.particlesRef}
                    weatherRef={logic.weatherRef}
                    speedLinesRef={logic.speedLinesRef}
                    frameRef={logic.frameRef}
                    speedRef={logic.speedRef}
                    activeEffectsRef={logic.activeEffectsRef}
                    shakeRef={logic.shakeRef}
                    currentBiome={logic.currentBiome}
                    activeEvent={logic.activeEvent}
                    isPlaying={logic.isPlaying}
                    gameOver={logic.gameOver}
                    showSkinShop={showSkinShop}
                    showTutorial={showTutorial}
                    onUpdatePhysics={() => logic.updatePhysics()}
                />
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">Évitez les obstacles. Courez le plus loin possible.</p>
        </div>
    );
};
