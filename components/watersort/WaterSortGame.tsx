
import React, { useState, useEffect } from 'react';
import { Home, RefreshCw, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { useWaterSortLogic } from './hooks/useWaterSortLogic';
import { WaterSortMenu } from './views/WaterSortMenu';
import { WaterSortBoard } from './views/WaterSortBoard';
import { WaterSortControls } from './views/WaterSortControls';
import { WaterSortGameOver } from './views/WaterSortGameOver';

interface WaterSortGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const WaterSortGame: React.FC<WaterSortGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { playLand, playPaddleHit, resumeAudio, playVictory } = audio;
    const { coins, addCoins: currencyAddCoins } = useCurrency();
    
    // View State
    const [view, setView] = useState<'LEVEL_SELECT' | 'GAME'>('LEVEL_SELECT');
    const [showTutorial, setShowTutorial] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Logic Hook
    const logic = useWaterSortLogic(addCoins, onReportProgress);

    // Initial Load & Tutorial Check
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_watersort_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_watersort_tutorial_seen', 'true');
        }
    }, []);

    const handleLevelSelect = (lvl: number) => {
        if (lvl > logic.maxUnlockedLevel) return;
        logic.setLevel(lvl);
        setView('GAME');
        resumeAudio();
        playLand();
    };

    const handleLocalBack = () => {
        if (view === 'GAME') {
            setView('LEVEL_SELECT');
        } else {
            onBack();
        }
    };

    const handleUndo = () => {
        if (logic.undoMove()) playPaddleHit();
    };

    const handleAddTube = () => {
        if (coins >= 500) {
            currencyAddCoins(-500);
            logic.addExtraTube();
            playVictory();
        } else {
            playPaddleHit();
        }
    };

    const handleChangeLevel = (delta: number) => {
        if (isAnimating) return;
        const newLvl = logic.currentLevel + delta;
        if (newLvl > 0 && newLvl <= logic.maxUnlockedLevel) {
            logic.setLevel(newLvl);
            playPaddleHit();
        }
    };

    // --- RENDER ---
    if (view === 'LEVEL_SELECT') {
        return (
            <WaterSortMenu 
                maxUnlockedLevel={logic.maxUnlockedLevel} 
                onSelectLevel={handleLevelSelect} 
                onBack={onBack} 
            />
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4 pt-14">
            {/* Ambient FX */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="watersort" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-30 mb-6 shrink-0 relative">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><Home size={20} /></button>
                <div className="flex flex-col items-center pointer-events-none">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">NEON MIX</h1>
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <button onClick={() => handleChangeLevel(-1)} disabled={logic.currentLevel <= 1 || isAnimating} className="p-1 rounded-full text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"><ChevronLeft size={16} /></button>
                        <span className="text-xs font-bold text-cyan-300 tracking-widest min-w-[70px] text-center">NIVEAU {logic.currentLevel}</span>
                        <button onClick={() => handleChangeLevel(1)} disabled={logic.currentLevel >= logic.maxUnlockedLevel || isAnimating} className="p-1 rounded-full text-cyan-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><HelpCircle size={20} /></button>
                    <button onClick={logic.restartLevel} disabled={isAnimating} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform shadow-lg"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Game Board */}
            <WaterSortBoard 
                tubes={logic.tubes}
                onMove={logic.executeMove}
                isAnimating={isAnimating}
                setAnimating={setIsAnimating}
                showTutorial={showTutorial}
            />

            {/* Controls */}
            <WaterSortControls 
                onUndo={handleUndo}
                onAddTube={handleAddTube}
                canUndo={logic.history.length > 0}
                canAddTube={!logic.extraTubeUsed}
                isDisabled={isAnimating || logic.levelComplete}
            />

            {/* Level Complete */}
            {logic.levelComplete && (
                <WaterSortGameOver 
                    level={logic.currentLevel}
                    earnedCoins={logic.earnedCoins}
                    onNextLevel={logic.nextLevel}
                />
            )}
        </div>
    );
};
