import React from 'react';
import { Home, RefreshCw, Trophy, Coins, Ban, LogOut } from 'lucide-react';
import { Turn } from '../types';

interface GameOverProps {
    winner: Turn | null;
    score: number;
    earnedCoins: number;
    gameMode: 'SOLO' | 'ONLINE';
    onRematch: () => void;
    onBackToMenu: () => void;
    opponentLeft: boolean;
}

export const GameOver: React.FC<GameOverProps> = ({ winner, score, earnedCoins, gameMode, onRematch, onBackToMenu, opponentLeft }) => {
    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in zoom-in p-6">
            {opponentLeft ? (
                <>
                    <LogOut size={64} className="text-red-500 mb-4" />
                    <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                    <button onClick={onBackToMenu} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 mt-4"><Home size={18} /> RETOUR AU MENU</button>
                </>
            ) : (
                <>
                    {winner === 'PLAYER' ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                            <h2 className="text-5xl font-black italic text-white mb-2">VICTOIRE !</h2>
                            <div className="flex flex-col items-center gap-2 mb-8"><span className="text-gray-400 font-bold tracking-widest text-sm">SCORE FINAL</span><span className="text-4xl font-mono text-neon-blue">{score}</span></div>
                            {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                        </>
                    ) : (
                        <>
                            <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                            <h2 className="text-5xl font-black italic text-white mb-4">DÉFAITE...</h2>
                        </>
                    )}
                    <div className="flex gap-4">
                        <button onClick={onRematch} className="px-8 py-3 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                        <button onClick={onBackToMenu} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">MENU</button>
                    </div>
                </>
            )}
        </div>
    );
};
