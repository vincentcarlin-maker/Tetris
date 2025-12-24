
import React, { useState } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, Layers, Play, ArrowRight } from 'lucide-react';
import { useStackLogic } from './hooks/useStackLogic';
import { StackRenderer } from './components/StackRenderer';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

interface StackGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const StackGame: React.FC<StackGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const { highScores, updateHighScore } = useHighScores();
    const logic = useStackLogic(audio, addCoins, updateHighScore, onReportProgress);

    const handleAction = () => {
        if (showTutorial) return;
        if (logic.phase === 'IDLE') {
            logic.setPhase('PLAYING');
            audio.resumeAudio();
        } else if (logic.phase === 'PLAYING') {
            logic.placeBlock();
        }
    };

    if (logic.phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-black pointer-events-none" />
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-center pt-20 pb-12">
                    <div className="mb-12 text-center animate-in slide-in-from-top-10 duration-700">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Layers size={56} className="text-indigo-400 animate-pulse hidden md:block" />
                            <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]">NEON STACK</h1>
                        </div>
                    </div>
                    <button onClick={logic.resetGame} className="group relative w-full max-w-sm h-60 rounded-[40px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-105 hover:border-indigo-500/50 shadow-2xl p-8 flex flex-col justify-between text-left">
                        <div className="relative z-10">
                            <Play size={40} className="text-indigo-400 mb-4" />
                            <h2 className="text-4xl font-black text-white italic">START</h2>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">Défier la gravité <ArrowRight size={20} /></div>
                    </button>
                    <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg transition-all"><Home size={14}/> Retour arcade</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 select-none touch-none overflow-hidden" onMouseDown={handleAction} onTouchStart={(e) => { e.preventDefault(); handleAction(); }}>
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 shrink-0 pointer-events-none">
                <button onClick={() => logic.setPhase('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 pointer-events-auto active:scale-95 transition-transform shadow-lg"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] uppercase tracking-tighter">Neon Stack</h1>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); setShowTutorial(true); }} className="p-2 bg-gray-800 rounded-lg text-indigo-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); logic.resetGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-20 pointer-events-none">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Hauteur</span><span className="text-3xl font-mono font-bold text-white">{logic.score}</span></div>
                {logic.perfectCount > 0 && <div className="text-indigo-400 font-black italic text-sm animate-bounce">PERFECT x{logic.perfectCount}</div>}
                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Record</span><span className="text-3xl font-mono font-bold text-indigo-400">{Math.max(logic.score, highScores.stack || 0)}</span></div>
            </div>

            <div className="relative w-full max-w-lg h-full max-h-[600px] rounded-3xl overflow-hidden z-10 shadow-2xl border border-white/5 backdrop-blur-md">
                <StackRenderer {...logic} onUpdate={logic.updatePhysics} />
                
                {logic.phase === 'IDLE' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30 pointer-events-none">
                        <p className="text-indigo-400 font-black tracking-[0.5em] animate-pulse text-lg uppercase">Prêt ? Tap pour poser</p>
                    </div>
                )}

                {logic.phase === 'GAMEOVER' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in duration-300">
                        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_20px_gold]" />
                        <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 uppercase tracking-tighter">Échoué</h2>
                        {logic.earnedCoins > 0 && (
                            <div className="my-6 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={24} />
                                <span className="text-yellow-100 font-bold text-xl">+{logic.earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); logic.resetGame(); }} className="px-10 py-4 bg-indigo-600 text-white font-black tracking-[0.2em] rounded-2xl hover:bg-white hover:text-indigo-600 transition-all shadow-xl active:scale-95 uppercase text-sm">Réessayer</button>
                    </div>
                )}
            </div>

            {showTutorial && <TutorialOverlay gameId="stack" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};
