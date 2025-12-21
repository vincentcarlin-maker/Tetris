
import React from 'react';
import { Trophy, Coins, ArrowRight } from 'lucide-react';

interface WaterSortGameOverProps {
    level: number;
    earnedCoins: number;
    onNextLevel: () => void;
}

export const WaterSortGameOver: React.FC<WaterSortGameOverProps> = ({ level, earnedCoins, onNextLevel }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in">
            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
            <h2 className="text-5xl font-black italic text-white mb-2">BRAVO !</h2>
            <p className="text-cyan-400 font-bold mb-6 tracking-widest">NIVEAU {level} TERMINÉ</p>
            
            {earnedCoins > 0 && (
                <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse">
                    <Coins className="text-yellow-400" size={24} />
                    <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                </div>
            )}

            <button 
                onClick={onNextLevel}
                className="px-10 py-4 bg-cyan-500 text-black font-black tracking-widest text-lg rounded-full hover:bg-white transition-colors shadow-[0_0_20px_#22d3ee] flex items-center gap-2"
            >
                NIVEAU SUIVANT <ArrowRight size={24} />
            </button>
        </div>
    );
};
