
import React from 'react';
import { Check, Timer, Search, Coins } from 'lucide-react';
import { HiddenObject } from '../types';

interface SeekHUDProps {
    objects: HiddenObject[];
    timeLeft: number;
    score: number;
}

export const SeekHUD: React.FC<SeekHUDProps> = ({ objects, timeLeft, score }) => {
    return (
        <div className="w-full max-w-lg flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEMPS RESTANT</span>
                    <div className={`flex items-center gap-2 text-2xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        <Timer size={20} />
                        {timeLeft}s
                    </div>
                </div>
                
                <div className="h-10 w-px bg-white/10 mx-4"></div>

                <div className="flex-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">OBJECTIFS</span>
                    <div className="flex gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                        {objects.map(obj => (
                            <div 
                                key={obj.id} 
                                className={`w-3 h-3 rounded-full border transition-all duration-500 ${obj.found ? 'bg-green-500 border-green-400 shadow-[0_0_8px_#22c55e]' : 'bg-gray-800 border-white/10'}`}
                                title={obj.name}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {objects.map(obj => (
                    <div 
                        key={obj.id} 
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all ${obj.found ? 'bg-green-900/20 border-green-500/50 opacity-50' : 'bg-gray-900/60 border-white/5'}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${obj.found ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter truncate ${obj.found ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                            {obj.name}
                        </span>
                        {obj.found && <Check size={12} className="text-green-500 ml-auto" />}
                    </div>
                ))}
            </div>
        </div>
    );
};
