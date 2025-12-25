
import React, { useEffect, useState } from 'react';
import { useArenaLogic } from './hooks/useArenaLogic';
import { ArenaRenderer } from './components/ArenaRenderer';
import { ArenaUI } from './components/ArenaUI';
import { useCurrency } from '../../hooks/useCurrency';
import { MAPS } from './maps';
import { TutorialOverlay } from '../Tutorials';
import { Home, Loader2, X } from 'lucide-react';

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
    const [showTutorial, setShowTutorial] = useState(false);

    // Initialisation & Sync Social
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId, undefined, 'Arena Clash');
    }, [username, currentAvatarId, mp]);

    // Tutoriel automatique au premier lancement
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_arenaclash_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_arenaclash_tutorial_seen', 'true');
        }
    }, []);

    // Gérer la connexion MP si on passe en mode ONLINE
    useEffect(() => {
        if (logic.gameMode === 'ONLINE') {
            mp.connect();
        } else {
            mp.disconnect();
        }
    }, [logic.gameMode, mp]);

    // Écran d'attente spécifique pour l'hôte dans Arena Clash
    if (logic.gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && logic.onlineStep === 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-[#020205] text-white p-6 justify-center text-center">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#050510] to-black pointer-events-none"></div>
                
                <div className="absolute top-6 left-6">
                    <button onClick={() => { mp.disconnect(); logic.setGameState('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                </div>

                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <Loader2 size={100} className="text-red-500 animate-spin" />
                </div>
                
                <h2 className="text-4xl font-black italic mb-4 tracking-tighter uppercase">Signal Radar Actif</h2>
                <p className="text-gray-400 font-bold animate-pulse uppercase text-sm tracking-[0.3em] mb-16">Scan des pilotes hostiles en cours...</p>
                
                <button onClick={mp.cancelHosting} className="px-12 py-5 bg-gray-900 border-2 border-red-600 text-red-500 font-black rounded-3xl hover:bg-red-600 hover:text-white transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 flex items-center gap-4 text-lg">
                    <X size={24} /> COUPER LA TRANSMISSION
                </button>
            </div>
        );
    }

    return (
        <div id="arena-container" className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden select-none relative" style={{ touchAction: 'none' }}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            {showTutorial && <TutorialOverlay gameId="arenaclash" onClose={() => setShowTutorial(false)} />}

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
                        showTutorial={showTutorial}
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
                onToggleTutorial={() => setShowTutorial(prev => !prev)} 
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
