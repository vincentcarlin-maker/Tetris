
import React, { useEffect, useCallback, useState } from 'react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';
import { useRunnerLogic } from './hooks/useRunnerLogic';
import { RunnerRenderer } from './components/RunnerRenderer';
import { RunnerUI } from './components/RunnerUI';
import { SKINS, BIOMES } from './constants';
import { useCurrency } from '../../hooks/useCurrency';
import { Activity, Play, ShoppingBag, Home, HelpCircle } from 'lucide-react';

interface RunnerGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const RunnerGame: React.FC<RunnerGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { coins } = useCurrency();
    
    const [showSkinShop, setShowSkinShop] = React.useState(false);
    const [showTutorial, setShowTutorial] = React.useState(false);
    const [inMenu, setInMenu] = React.useState(true);
    
    const [localBalance, setLocalBalance] = React.useState(coins);
    const [ownedSkins, setOwnedSkins] = React.useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('runner_owned_skins') || '["default"]'); } catch { return ['default']; }
    });

    const logic = useRunnerLogic(audio, addCoins, onReportProgress);
    const { highScores } = useHighScores();

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_runner_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_runner_tutorial_seen', 'true');
        }
    }, []);

    useEffect(() => { setLocalBalance(coins); }, [coins]);

    const handleJumpInput = useCallback((e: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
        if (showSkinShop || showTutorial || inMenu) return;
        logic.handleJump();
        if (!logic.isPlaying && !logic.gameOver) {
            logic.setIsPlaying(true);
            audio.resumeAudio();
        }
    }, [logic, showSkinShop, showTutorial, audio, inMenu]);

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
            addCoins(-skin.cost);
            setLocalBalance(prev => prev - skin.cost);
            const newOwned = [...ownedSkins, skin.id];
            setOwnedSkins(newOwned);
            localStorage.setItem('runner_owned_skins', JSON.stringify(newOwned));
            logic.setCurrentSkinId(skin.id);
            audio.playCoin();
        }
    };

    const startGame = () => {
        setInMenu(false);
        logic.resetGame();
    };

    if (inMenu) {
         return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(251,146,60,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Activity size={56} className="text-orange-400 drop-shadow-[0_0_25px_rgba(251,146,60,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-red-300 drop-shadow-[0_0_30px_rgba(251,146,60,0.6)] tracking-tighter w-full">
                                NEON<br className="md:hidden"/> RUN
                            </h1>
                            <Activity size={56} className="text-orange-400 drop-shadow-[0_0_25px_rgba(251,146,60,0.8)] animate-pulse hidden md:block" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={startGame} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_50px_rgba(251,146,60,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(251,146,60,0.3)]"><Play size={32} className="text-orange-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-orange-300 transition-colors">COURIR</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Courez sans fin, évitez les obstacles, battez votre record.</p>
                            </div>
                        </button>

                        <button onClick={() => setShowSkinShop(true)} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]"><ShoppingBag size={32} className="text-yellow-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-yellow-300 transition-colors">BOUTIQUE</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Personnalisez votre coureur avec des skins uniques.</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                    </div>
                </div>
                
                 {showSkinShop && (
                    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                        <RunnerUI 
                            distance={0} earnedCoins={0} currentBiome={BIOMES[0]} activeEvent={null} notification={null} currentMission={null} missionProgress={0} activePowerUps={{}} gameOver={false} isPlaying={false} showSkinShop={true} showTutorial={false} localBalance={localBalance} currentSkinId={logic.currentSkinId} ownedSkins={ownedSkins}
                            onBack={() => {}} onReset={() => {}} onToggleTutorial={() => {}} onToggleSkinShop={() => setShowSkinShop(false)} onBuySkin={handleBuySkin} onEquipSkin={logic.setCurrentSkinId}
                        />
                    </div>
                )}
            </div>
         );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4" onMouseDown={handleJumpInput} onTouchStart={handleJumpInput}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-black to-transparent pointer-events-none"></div>
            {showTutorial && <TutorialOverlay gameId="runner" onClose={() => setShowTutorial(false)} />}
            
            <div className="absolute top-4 left-4 z-20"><button onClick={() => setInMenu(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button></div>

            <RunnerUI 
                distance={logic.distance} earnedCoins={logic.earnedCoins} currentBiome={logic.currentBiome} activeEvent={logic.activeEvent} notification={logic.notification} currentMission={logic.currentMission} missionProgress={logic.missionProgress} activePowerUps={logic.activePowerUps} gameOver={logic.gameOver} isPlaying={logic.isPlaying} showSkinShop={showSkinShop} showTutorial={showTutorial} localBalance={localBalance} currentSkinId={logic.currentSkinId} ownedSkins={ownedSkins}
                onBack={onBack} onReset={logic.resetGame} onToggleTutorial={() => setShowTutorial(prev => !prev)} onToggleSkinShop={() => setShowSkinShop(prev => !prev)} onBuySkin={handleBuySkin} onEquipSkin={logic.setCurrentSkinId}
            />
            <div className="w-full h-full flex items-center justify-center">
                 <RunnerRenderer 
                    playerRef={logic.playerRef} obstaclesRef={logic.obstaclesRef} coinsRef={logic.coinsRef} treasuresRef={logic.treasuresRef} powerUpsRef={logic.powerUpsRef} particlesRef={logic.particlesRef} weatherRef={logic.weatherRef} speedLinesRef={logic.speedLinesRef} frameRef={logic.frameRef} speedRef={logic.speedRef} activeEffectsRef={logic.activeEffectsRef} shakeRef={logic.shakeRef} currentBiome={logic.currentBiome} activeEvent={logic.activeEvent} isPlaying={logic.isPlaying} gameOver={logic.gameOver} showSkinShop={showSkinShop} showTutorial={showTutorial} onUpdatePhysics={() => logic.updatePhysics()}
                />
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Évitez les obstacles. Courez le plus loin possible.</p>
        </div>
    );
};
