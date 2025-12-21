
import React from 'react';
import { Home, Trophy, Heart, HelpCircle, RefreshCw, Lock, Play, Coins, ArrowLeft } from 'lucide-react';
import { GameState } from '../types';

interface BreakerUIProps {
    gameState: GameState;
    score: number;
    lives: number;
    currentLevel: number;
    earnedCoins: number;
    maxUnlockedLevel: number;
    highScore: number;
    onBack: () => void;
    onRestart: () => void;
    onShowTutorial: () => void;
    onSelectLevel: (lvl: number) => void;
    onLevelContinue: () => void;
    showTutorial: boolean;
}

export const BreakerUI: React.FC<BreakerUIProps> = ({
    gameState, score, lives, currentLevel, earnedCoins, maxUnlockedLevel, highScore,
    onBack, onRestart, onShowTutorial, onSelectLevel, onLevelContinue, showTutorial
}) => {

    // --- HUD (Heads-Up Display) ---
    const renderHUD = () => (
        <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 relative gap-2">
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col"><div className="flex items-center gap-1 text-white text-sm font-bold"><Trophy size={14} className="text-yellow-400" /> {score}</div><div className="text-gray-500 text-[10px]">RECORD: {highScore}</div></div>
            </div>
            <div className="text-lg font-bold text-neon-pink drop-shadow-[0_0_8px_#ff00ff] whitespace-nowrap">NIVEAU {currentLevel}</div>
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5 text-red-400 font-bold">{Array.from({ length: lives }).map((_, i) => <Heart key={i} size={16} fill="currentColor"/>)}</div>
                <button onClick={onShowTutorial} className="p-2 bg-gray-800 rounded-lg text-fuchsia-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                <button onClick={onRestart} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>
        </div>
    );

    // --- LEVEL SELECT ---
    const renderLevelSelect = () => (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-black to-transparent pointer-events-none"></div>
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] pr-2 pb-1">CHOIX NIVEAU</h1>
                <div className="w-10"></div>
            </div>
            <div className="flex-1 w-full max-w-lg overflow-y-auto custom-scrollbar z-10 pb-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-2">
                    {Array.from({ length: Math.max(maxUnlockedLevel + 4, 20) }).map((_, i) => {
                        const lvl = i + 1;
                        const isUnlocked = lvl <= maxUnlockedLevel;
                        const isNext = lvl === maxUnlockedLevel + 1;
                        if (isUnlocked) {
                            return (<button key={lvl} onClick={() => onSelectLevel(lvl)} className="aspect-square rounded-xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95 bg-pink-900/40 border-pink-500/50 text-neon-pink hover:bg-pink-800/60">{lvl}<div className="mt-1 w-1.5 h-1.5 bg-neon-pink rounded-full shadow-[0_0_5px_#ff00ff]"></div></button>);
                        } else {
                            return (<div key={lvl} className={`aspect-square rounded-xl border-2 flex items-center justify-center text-gray-600 ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}><Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} /></div>);
                        }
                    })}
                </div>
            </div>
            <div className="mt-4 z-10 w-full max-w-lg"><button onClick={onLevelContinue} className="w-full py-4 bg-neon-pink text-black font-black tracking-widest text-lg rounded-xl shadow-[0_0_20px_#ec4899] flex items-center justify-center gap-2 hover:scale-105 transition-transform"><Play size={24} fill="black"/> CONTINUER (NIV {maxUnlockedLevel})</button></div>
        </div>
    );

    // --- OVERLAYS ---
    const renderOverlay = () => {
        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in rounded-lg">
                    <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-pink-600 mb-4 italic">FIN DE PARTIE</h2>
                    <div className="text-center mb-4"><p className="text-gray-400 text-sm tracking-widest">SCORE</p><p className="text-3xl font-mono text-white">{score}</p></div>
                    {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                    <button onClick={onRestart} className="px-8 py-3 bg-neon-pink text-black font-black tracking-widest text-xl skew-x-[-10deg] hover:bg-white transition-colors"><span className="block skew-x-[10deg]">REJOUER</span></button>
                    <button onClick={onBack} className="mt-4 text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">CHOIX NIVEAU</button>
                </div>
            );
        }
        if (gameState === 'levelComplete') {
            return (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 animate-in fade-in rounded-lg">
                    <h2 className="text-4xl font-bold text-green-400 mb-4">NIVEAU {currentLevel} TERMINÉ !</h2>
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                        <Coins className="text-yellow-400" size={24} />
                        <span className="text-yellow-100 font-bold text-xl">+50 PIÈCES</span>
                    </div>
                </div>
            );
        }
        if (gameState === 'waitingToServe' && !showTutorial) {
             return (<div className="absolute bottom-20 left-0 right-0 z-50 flex flex-col items-center justify-center text-white text-lg font-bold animate-pulse pointer-events-none"><p>TOUCHEZ POUR SERVIR</p></div>);
        }
        return null;
    };

    return { renderHUD, renderLevelSelect, renderOverlay };
};
