
import React from 'react';
import { Trophy, Coins, RefreshCw, Home, LogOut, ArrowLeft, Users } from 'lucide-react';
import { GameMode } from '../types';

interface MemoryGameOverProps {
    winner: boolean; // True if player won or solo completed
    isCodemaker?: boolean; // N/A
    message?: string; // N/A
    earnedCoins: number;
    // secretCode // N/A
    onRestart: () => void;
    onQuit: () => void;
    // showCode // N/A
    
    // Custom props for Memory
    gameMode: GameMode;
    scores?: { p1: number, p2: number };
    moves?: number;
    opponentLeft?: boolean;
    handleOpponentLeftAction?: (action: 'lobby' | 'wait') => void;
}

export const MemoryGameOver: React.FC<MemoryGameOverProps> = ({ 
    winner, earnedCoins, onRestart, onQuit, gameMode, scores, moves, opponentLeft, handleOpponentLeftAction 
}) => {
    
    if (opponentLeft && handleOpponentLeftAction) {
        return (
             <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
                 <LogOut size={64} className="text-red-500 mb-4" />
                <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
                    <button onClick={() => handleOpponentLeftAction('wait')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"><Users size={18} /> ATTENDRE UN JOUEUR</button>
                    <button onClick={() => handleOpponentLeftAction('lobby')} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={18} /> RETOUR AU LOBBY</button>
                </div>
             </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
            <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
            <h2 className="text-4xl font-black italic text-white mb-2 text-center">PARTIE TERMINÉE</h2>
            
            {gameMode === 'SOLO' && moves !== undefined ? (
                <div className="text-center mb-6">
                    <p className="text-gray-400 text-sm tracking-widest mb-1">COUPS TOTAL</p>
                    <p className="text-3xl font-mono text-white mb-4">{moves}</p>
                </div>
            ) : scores ? (
                <div className="text-center mb-6">
                    <p className="text-xl font-bold mb-2 text-white">{scores.p1 > scores.p2 ? "P1 GAGNE !" : scores.p2 > scores.p1 ? "P2 GAGNE !" : "MATCH NUL !"}</p>
                    <div className="flex gap-8 text-2xl font-mono justify-center"><div className="text-neon-pink">P1: {scores.p1}</div><div className="text-neon-blue">P2: {scores.p2}</div></div>
                </div>
            ) : null}

            {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
            
            <div className="flex gap-4">
                <button onClick={onRestart} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                <button onClick={onQuit} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">{gameMode === 'ONLINE' ? 'QUITTER' : 'MENU'}</button>
            </div>
        </div>
    );
};
