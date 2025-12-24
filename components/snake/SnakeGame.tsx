
import React, { useState } from 'react';
import { Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RefreshCw, HelpCircle } from 'lucide-react';
import { useSnakeLogic } from './hooks/useSnakeLogic';
import { SnakeRenderer } from './components/SnakeRenderer';
import { TutorialOverlay } from '../Tutorials';
import { Direction } from './types';

interface SnakeGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const logic = useSnakeLogic(audio, addCoins, onReportProgress);

    const DPadBtn = ({ dir, icon: Icon }: { dir: Direction, icon: any }) => (
        <button 
            onMouseDown={() => logic.setNextDirection(dir)} 
            className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center border border-white/10 active:bg-green-500 active:text-black transition-all text-green-400"
        >
            <Icon size={28} />
        </button>
    );

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none">
            <div className="w-full max-w-lg flex items-center justify-between mb-4">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] pr-2 pb-1">NEON SNAKE</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-green-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center mb-4">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">SCORE</span><span className="text-2xl font-mono font-bold text-white">{logic.score}</span></div>
            </div>

            <div className="relative">
                <SnakeRenderer 
                    snake={logic.snake} food={logic.food} obstacles={logic.obstacles} 
                    teleporters={logic.teleporters} bombs={logic.bombs} particlesRef={logic.particlesRef} 
                />
                {!logic.isPlaying && !logic.gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                        <button onClick={() => logic.setIsPlaying(true)} className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_#22c55e] hover:scale-110 transition-transform"><Play size={32} className="text-black ml-1" /></button>
                    </div>
                )}
            </div>

            <div className="w-full max-w-xs mt-8 grid grid-cols-3 gap-3">
                <div />
                <div className="flex justify-center"><DPadBtn dir="UP" icon={ArrowUp}/></div>
                <div />
                <div className="flex justify-center"><DPadBtn dir="LEFT" icon={ArrowLeft}/></div>
                <div className="flex justify-center"><div className="w-14 h-14 bg-gray-800/30 rounded-full flex items-center justify-center border border-white/5"></div></div>
                <div className="flex justify-center"><DPadBtn dir="RIGHT" icon={ArrowRight}/></div>
                <div />
                <div className="flex justify-center"><DPadBtn dir="DOWN" icon={ArrowDown}/></div>
                <div />
            </div>

            {showTutorial && <TutorialOverlay gameId="snake" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};
