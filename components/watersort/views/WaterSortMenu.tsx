
import React from 'react';
import { Home, Play, Lock } from 'lucide-react';

interface WaterSortMenuProps {
    maxUnlockedLevel: number;
    onSelectLevel: (lvl: number) => void;
    onBack: () => void;
}

export const WaterSortMenu: React.FC<WaterSortMenuProps> = ({ maxUnlockedLevel, onSelectLevel, onBack }) => {
    const gridItems = Array.from({ length: Math.max(maxUnlockedLevel + 4, 20) });

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4 pt-14">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-6 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] pr-2 pb-1">CHOIX NIVEAU</h1>
                <div className="w-10"></div>
            </div>

            {/* Grid */}
            <div className="flex-1 w-full max-w-lg overflow-y-auto custom-scrollbar z-10 pb-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-2">
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
                                        aspect-square rounded-xl border-2 flex flex-col items-center justify-center font-black text-lg transition-all shadow-lg active:scale-95
                                        bg-cyan-900/40 border-cyan-500/50 text-cyan-400 hover:bg-cyan-800/60
                                    `}
                                >
                                    {lvl}
                                    <div className="mt-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>
                                </button>
                            );
                        } else {
                            return (
                                <div key={lvl} className={`aspect-square rounded-xl border-2 flex items-center justify-center text-gray-600 ${isNext ? 'bg-gray-800 border-gray-600 border-dashed animate-pulse' : 'bg-gray-900/30 border-gray-800'}`}>
                                    <Lock size={isNext ? 20 : 16} className={isNext ? "text-gray-400" : "text-gray-700"} />
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
            
            <div className="mt-4 z-10 w-full max-w-lg">
                <button onClick={() => onSelectLevel(maxUnlockedLevel)} className="w-full py-4 bg-cyan-500 text-black font-black tracking-widest text-lg rounded-xl shadow-[0_0_20px_#22d3ee] flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                    <Play size={24} fill="black"/> CONTINUER (NIV {maxUnlockedLevel})
                </button>
            </div>
        </div>
    );
};
