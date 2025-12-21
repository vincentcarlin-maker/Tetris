
import React from 'react';
import { Trophy, Coins, AlertTriangle, RefreshCw } from 'lucide-react';
import { Turn } from '../types';

interface SkyjoGameOverProps {
    winner: Turn | null;
    doubledScore: Turn | null;
    pScore: number;
    cScore: number;
    earnedCoins: number;
    onRestart: () => void;
}

export const SkyjoGameOver: React.FC<SkyjoGameOverProps> = ({ winner, doubledScore, pScore, cScore, earnedCoins, onRestart }) => {
    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
            <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
            <h2 className="text-4xl font-black italic text-white mb-2">{winner === 'PLAYER' ? "VICTOIRE !" : "DÉFAITE..."}</h2>
            
            <div className="flex gap-8 mb-6 bg-gray-800/50 p-4 rounded-xl border border-white/10">
                <div className="text-center relative">
                    <p className="text-xs text-gray-400 font-bold mb-1">VOUS</p>
                    <p className="text-3xl font-mono text-cyan-400">{pScore}</p>
                    {doubledScore === 'PLAYER' && <div className="absolute -top-3 -right-6 text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded rotate-12 shadow-md">DOUBLÉ</div>}
                </div>
                <div className="text-center relative">
                    <p className="text-xs text-gray-400 font-bold mb-1">ADV</p>
                    <p className="text-3xl font-mono text-purple-400">{cScore}</p>
                    {doubledScore === 'CPU' && <div className="absolute -top-3 -right-6 text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded rotate-12 shadow-md">DOUBLÉ</div>}
                </div>
            </div>

            {doubledScore && (
                <div className="mb-4 text-[10px] text-gray-400 max-w-[200px] border border-red-500/30 bg-red-900/10 p-2 rounded">
                    <AlertTriangle size={12} className="inline mr-1 text-red-500"/>
                    <strong>RÈGLE SKYJO :</strong> Le joueur ayant fini premier n'avait pas le plus petit score. Ses points ont été doublés.
                </div>
            )}

            {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
            <button onClick={onRestart} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg active:scale-95 flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
        </div>
    );
};
