
import React, { useState } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, Rocket, Play, ArrowRight } from 'lucide-react';
import { useInvadersLogic } from './hooks/useInvadersLogic';
import { InvadersRenderer } from './components/InvadersRenderer';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface InvadersGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const InvadersGame: React.FC<InvadersGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const { highScores, updateHighScore } = useHighScores();
    const logic = useInvadersLogic(audio, addCoins, updateHighScore, onReportProgress);

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="w-full max-w-lg flex items-center justify-between mb-4 z-10">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] pr-2 pb-1 uppercase">Neon Invaders</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-rose-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center mb-2 z-10 px-2">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-xl font-mono font-bold text-white">{logic.score}</span></div>
                <div className="text-rose-400 font-bold tracking-widest text-sm uppercase">Vague {logic.wave}</div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Record</span><span className="text-xl font-mono font-bold text-yellow-400">{Math.max(logic.score, highScores.invaders || 0)}</span></div>
            </div>

            <div className="relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-rose-500/30 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] overflow-hidden backdrop-blur-md z-10">
                <InvadersRenderer {...logic} onUpdate={logic.updatePhysics} />

                {logic.gameState === 'MENU' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                        <button onClick={logic.resetGame} className="group relative h-40 w-64 rounded-[32px] border border-rose-500/50 bg-gray-900/60 p-6 flex flex-col justify-center items-center gap-4 transition-all hover:scale-105 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                            <Rocket size={40} className="text-rose-400 animate-pulse" />
                            <span className="text-xl font-black italic tracking-widest">START GAME</span>
                        </button>
                    </div>
                )}

                {logic.gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-40 animate-in zoom-in duration-300">
                        <h2 className="text-5xl font-black text-red-500 italic mb-4 drop-shadow-[0_0_15px_red]">PERDU</h2>
                        {logic.earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{logic.earnedCoins} PIÈCES</span></div>
                        )}
                        <button onClick={logic.resetGame} className="px-8 py-3 bg-rose-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-4 z-10">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-8 h-2 rounded-full transition-colors ${i < logic.lives ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-gray-800'}`} />
                ))}
            </div>

            {showTutorial && <TutorialOverlay gameId="invaders" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};
