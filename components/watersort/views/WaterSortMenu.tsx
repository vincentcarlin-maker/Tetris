import React from 'react';
import { Home, Play, Lock, Droplets, ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';

interface WaterSortMenuProps {
    maxUnlockedLevel: number;
    onSelectLevel: (lvl: number) => void;
    onBack: () => void;
}

// Logo de marque spécifique pour Neon Mix
const WaterSortBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-28 w-full">
        <div className="flex items-end gap-3 relative">
            {/* Tube gauche (Rose) */}
            <div className="w-8 h-20 border-2 border-pink-500/50 rounded-b-full rounded-t-sm bg-gray-900/80 overflow-hidden relative shadow-[0_0_15px_rgba(236,72,153,0.3)] transform -rotate-12 origin-bottom transition-transform group-hover:-rotate-[15deg]">
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-pink-600 shadow-[0_0_10px_#db2777] animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Tube central (Cyan - Principal) */}
            <div className="w-10 h-24 border-2 border-cyan-400 rounded-b-full rounded-t-sm bg-gray-900/80 overflow-hidden relative shadow-[0_0_20px_rgba(34,211,238,0.4)] z-10 transform transition-transform hover:scale-105">
                <div className="absolute bottom-0 left-0 w-full h-3/4 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse delay-75"></div>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                <Sparkles size={12} className="absolute top-2 right-2 text-white/40 animate-pulse" />
            </div>
            
            {/* Tube droit (Jaune) */}
            <div className="w-8 h-20 border-2 border-yellow-500/50 rounded-b-full rounded-t-sm bg-gray-900/80 overflow-hidden relative shadow-[0_0_15px_rgba(234,179,8,0.3)] transform rotate-12 origin-bottom transition-transform group-hover:rotate-[15deg]">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse delay-150"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
            </div>
        </div>
        
        {/* Éclats de liquide en fond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none -z-10"></div>
    </div>
);

export const WaterSortMenu: React.FC<WaterSortMenuProps> = ({ maxUnlockedLevel, onSelectLevel, onBack }) => {
    const gridItems = Array.from({ length: Math.max(maxUnlockedLevel + 9, 20) });

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            {/* Background Effects */}
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                
                {/* Hero Title Section */}
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4 group">
                    <WaterSortBrandingLogo />
                    <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter w-full uppercase mb-4">
                        NEON<br className="md:hidden"/> MIX
                    </h1>
                    <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm">
                        <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase">Trier • Verser • Équilibrer</p>
                    </div>
                </div>

                {/* Main Action Card (Continue) */}
                <div className="w-full max-w-lg mb-8 animate-in slide-in-from-bottom-6 duration-700 delay-100">
                     <button 
                        onClick={() => onSelectLevel(maxUnlockedLevel)} 
                        className="group relative w-full h-40 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 flex flex-col justify-between"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Play size={20} className="text-cyan-400 fill-cyan-400" />
                                <h2 className="text-2xl font-black text-white italic group-hover:text-cyan-300 transition-colors uppercase">Continuer</h2>
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed">Reprendre la simulation au niveau {maxUnlockedLevel}.</p>
                        </div>
                        <div className="relative z-10 flex items-center justify-between text-cyan-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                            <span>LABORATOIRE {maxUnlockedLevel}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                </div>

                {/* Level Selection Grid */}
                <div className="w-full max-w-lg bg-gray-900/40 border border-white/10 rounded-[32px] p-6 backdrop-blur-md animate-in slide-in-from-bottom-8 duration-700 delay-200 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Séquences Disponibles</h3>
                        <div className="h-px flex-1 mx-4 bg-white/5"></div>
                        <span className="text-[10px] font-mono text-cyan-500 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">{maxUnlockedLevel} DÉBLOQUÉS</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                        {gridItems.map((_, i) => {
                            const lvl = i + 1;
                            const isUnlocked = lvl <= maxUnlockedLevel;
                            const isNext = lvl === maxUnlockedLevel + 1;
                            
                            if (isUnlocked) {
                                return (
                                    <button 
                                        key={lvl} 
                                        onClick={() => onSelectLevel(lvl)}
                                        className={`
                                            aspect-square rounded-2xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95
                                            bg-cyan-900/40 border-cyan-500/50 text-cyan-400 hover:bg-cyan-800/60 hover:scale-105
                                        `}
                                    >
                                        {lvl}
                                        <div className="mt-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                                    </button>
                                );
                            } else {
                                return (
                                    <div 
                                        key={lvl} 
                                        className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-gray-600 transition-all ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}
                                    >
                                        <Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-10 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300 flex-shrink-0 pb-safe">
                    <button 
                        onClick={onBack} 
                        className="text-gray-500 hover:text-white text-xs font-bold transition-all flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 active:scale-95"
                    >
                        <Home size={14} /> RETOUR AU MENU PRINCIPAL
                    </button>
                </div>
            </div>
        </div>
    );
};