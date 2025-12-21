
import React from 'react';
import { Trophy, Coins, RefreshCw, Unlock, BrainCircuit } from 'lucide-react';
import { COLORS } from '../constants';

interface MastermindGameOverProps {
    winner: boolean;
    isCodemaker: boolean;
    message: string | null;
    earnedCoins: number;
    secretCode: number[];
    onRestart: () => void;
    onQuit: () => void;
    showCode: boolean;
}

export const MastermindGameOver: React.FC<MastermindGameOverProps> = ({ 
    winner, isCodemaker, message, earnedCoins, secretCode, onRestart, onQuit, showCode 
}) => {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in text-center p-4">
            {winner ? (
                <>
                    <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                    <h2 className="text-4xl font-black italic text-white mb-2">{message || "VICTOIRE !"}</h2>
                    {earnedCoins > 0 && (
                        <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse mb-6">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold text-xl">+{earnedCoins}</span>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {isCodemaker ? (
                        <Unlock size={64} className="text-green-500 mb-4 drop-shadow-[0_0_15px_lime]" />
                    ) : (
                        <BrainCircuit size={64} className="text-red-500 mb-4 drop-shadow-[0_0_15px_red]" />
                    )}
                    <h2 className="text-3xl font-black italic text-white mb-2">{message || "PARTIE TERMINÉE"}</h2>
                    
                    {showCode && secretCode.length > 0 && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <span className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-2">Le Code Secret</span>
                            <div className="flex gap-3">
                                {secretCode.map((c, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-10 h-10 rounded-full ${COLORS[c]} border-2 border-white/30 shadow-lg`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            <div className="flex gap-4">
                <button onClick={onRestart} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                    <RefreshCw size={20} /> REJOUER
                </button>
                <button onClick={onQuit} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>
            </div>
        </div>
    );
};
