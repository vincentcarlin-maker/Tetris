import React, { useEffect } from 'react';
import { useArenaLogic } from './hooks/useArenaLogic';
import { ArenaRenderer } from './components/ArenaRenderer';
import { ArenaUI } from './components/ArenaUI';
import { useCurrency } from '../../hooks/useCurrency';
// Fix: Import MAPS from maps.ts instead of constants.ts
import { MAPS } from './maps';

interface ArenaClashGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    mp: any;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const ArenaClashGame: React.FC<ArenaClashGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();
    const logic = useArenaLogic(mp, audio, addCoins, onReportProgress);

    // Initialisation & Sync Social
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId, undefined, 'Arena Clash');
    }, [username, currentAvatarId, mp]);

    // Gérer la connexion MP si on passe en mode ONLINE
    useEffect(() => {
        if (logic.gameMode === 'ONLINE') {
            mp.connect();
        } else {
            mp.disconnect();
        }
    }, [logic.gameMode, mp]);

    return (
        <div id="arena-container" className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden select-none relative" style={{ touchAction: 'none' }}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            <div className="flex-1 w-full max-w-4xl relative min-h-0 flex flex-col">
                 <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    <ArenaRenderer 
                        playerRef={logic.playerRef}
                        botsRef={logic.botsRef}
                        bulletsRef={logic.bulletsRef}
                        powerUpsRef={logic.powerUpsRef}
                        particlesRef={logic.particlesRef}
                        cameraRef={logic.cameraRef}
                        selectedMapIndex={logic.selectedMapIndex}
                        mouseRef={logic.mouseRef}
                        recoilRef={logic.recoilRef}
                        onUpdate={logic.update}
                        gameState={logic.gameState}
                        showTutorial={false}
                    />
                </div>
            </div>

            <ArenaUI 
                gameState={logic.gameState}
                gameMode={logic.gameMode}
                score={logic.score}
                timeLeft={logic.timeLeft}
                respawnTimer={logic.playerRef.current?.respawnTimer || 0}
                killFeed={logic.killFeed}
                leaderboard={logic.leaderboard}
                earnedCoins={logic.earnedCoins}
                selectedMapIndex={logic.selectedMapIndex}
                onlineStep={logic.onlineStep}
                isHost={logic.isHost}
                hasOpponent={!!mp.gameOpponent}
                onBack={onBack}
                onToggleTutorial={() => {}} 
                onSetGameMode={logic.setGameMode}
                onStartGame={logic.startGame}
                onChangeMap={(delta) => logic.setSelectedMapIndex((prev: number) => (prev + delta + MAPS.length) % MAPS.length)}
                onCancelHosting={mp.cancelHosting}
                onLeaveGame={() => { mp.leaveGame(); onBack(); }} 
                onRematch={() => logic.startGame('ONLINE')}
                onReturnToMenu={() => logic.setGameState('MENU')}
                onSetGameState={logic.setGameState}
                controlsRef={logic.controlsRef}
                mp={mp}
                avatarsCatalog={avatarsCatalog}
            />
        </div>
    );
};