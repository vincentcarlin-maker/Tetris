import React from 'react';
import { Home, Trophy, Heart, HelpCircle, RefreshCw, Lock, Play, Coins, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
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

// Logo de marque spécifique pour Neon Breaker
const BreakerBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full">
        <div className="relative w-48 h-24 flex items-center justify-center">
            {/* Blocs en arrière-plan (Effet décoratif) */}
            <div className="absolute top-2 left-4 w-8 h-4 bg-fuchsia-600/30 border border-fuchsia-500/50 rounded-sm shadow-[0_0_10px_rgba(217,70,239,0.3)] rotate-12"></div>
            <div className="absolute top-0 right-6 w-8 h-4 bg-pink-600/30 border border-pink-500/50 rounded-sm shadow-[0_0_10px_rgba(236,72,153,0.3)] -rotate-6"></div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-rose-600/30 border border-rose-500/50 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>

            {/* La Balle (Néon Jaune) */}
            <div className="w-5 h-5 bg-yellow-400 rounded-full absolute z-20 shadow-[0_0_20px_#facc15] animate-bounce">
                <div className="absolute inset-0 bg-white/40 rounded-full blur-[1px]"></div>
            </div>

            {/* La Raquette (Néon Fuchsia) */}
            <div className="w-32 h-4 bg-gray-900 border-2 border-fuchsia-500 rounded-full absolute bottom-0 shadow-[0_0_25px_rgba(232,121,249,0.6)] flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 via-white/20 to-fuchsia-600/20"></div>
                <div className="w-1/2 h-full bg-fuchsia-500/10 blur-md"></div>
                <Sparkles size={10} className="text-white opacity-60 animate-pulse" />
            </div>

            {/* Lueur diffuse */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-40 h-10 bg-fuchsia-500/10 blur-2xl rounded-full -z-10"></div>
        </div>
    </div>
);

export const BreakerUI: React.FC<BreakerUIProps> = ({
    gameState, score, lives, currentLevel, earnedCoins, maxUnlockedLevel, highScore,
    onBack, onRestart, onShowTutorial, onSelectLevel, onLevelContinue, showTutorial
}) => {

    // --- HUD (Heads-Up Display) ---
    const renderHUD = () => (
        <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 relative gap-2">
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
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

    // --- LEVEL SELECT (MENU STYLE) ---
    const renderLevelSelect = () => (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(232,121,249,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(232,121,249,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <BreakerBrandingLogo />
                        <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-300 to-rose-300 drop-shadow-[0_0_30px_rgba(232,121,249,0.6)] tracking-tighter w-full uppercase">
                            NEON<br className="md:hidden"/> BREAKER
                        </h1>
                    </div>
                    <div className="inline-block px-6 py-2 mt-4 rounded-full border border-fuchsia-500/30 bg-fuchsia-900/20 backdrop-blur-sm">
                        <p className="text-fuchsia-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Cassez les briques • Dominez la physique</p>
                    </div>
                </div>

                <div className="w-full max-w-lg mb-8">
                     <button onClick={onLevelContinue} className="group relative w-full h-40 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-fuchsia-500/50 hover:shadow-[0_0_50px_rgba(232,121,249,0.2)] text-left p-6 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white italic mb-2 group-hover:text-fuchsia-300 transition-colors uppercase">CONTINUER</h2>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed">Reprendre au niveau {maxUnlockedLevel}.</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-fuchsia-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors uppercase italic">LANCER LA PARTIE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                    </button>
                </div>

                <div className="w-full max-w-lg bg-gray-900/40 border border-white/10 rounded-[32px] p-6 backdrop-blur-md shadow-2xl">
                    <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Sélectionner un niveau</h3>
                    <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {Array.from({ length: Math.max(maxUnlockedLevel + 4, 20) }).map((_, i) => {
                            const lvl = i + 1;
                            const isUnlocked = lvl <= maxUnlockedLevel;
                            const isNext = lvl === maxUnlockedLevel + 1;
                            if (isUnlocked) {
                                return (<button key={lvl} onClick={() => onSelectLevel(lvl)} className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95 bg-fuchsia-900/40 border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-800/60">{lvl}<div className="mt-1 w-1.5 h-1.5 bg-fuchsia-400 rounded-full shadow-[0_0_5px_#e879f9]"></div></button>);
                            } else {
                                return (<div key={lvl} className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-gray-600 ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}><Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} /></div>);
                            }
                        })}
                    </div>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest italic"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                </div>
            </div>
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
