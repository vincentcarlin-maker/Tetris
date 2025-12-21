
import React from 'react';
import { Eye } from 'lucide-react';
import { COLORS, CODE_LENGTH, MAX_ATTEMPTS } from '../constants';
import { Feedback } from '../types';

interface MastermindBoardProps {
    guesses: number[][];
    feedback: Feedback[];
    activeRow: number;
    currentGuess: number[];
    isCodemaker: boolean;
    secretCode: number[];
}

export const MastermindBoard: React.FC<MastermindBoardProps> = ({ 
    guesses, feedback, activeRow, currentGuess, isCodemaker, secretCode 
}) => {
    return (
        <div className="flex-1 w-full max-w-md bg-gray-900/80 border-2 border-cyan-500/30 rounded-xl shadow-2xl relative overflow-y-auto custom-scrollbar p-2 mb-2 backdrop-blur-md z-10">
             
             {/* Codemaker View (Secret shown) */}
            {isCodemaker && secretCode.length > 0 && (
                <div className="sticky top-0 z-20 mb-2 bg-purple-900/90 border border-purple-500/50 rounded-lg p-2 flex flex-col items-center shadow-lg backdrop-blur">
                    <span className="text-[10px] text-purple-300 font-bold tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> CODE SECRET (SPECTATEUR)</span>
                    <div className="flex gap-2">
                        {secretCode.map((c, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full ${COLORS[c]} border border-white/30`} />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1.5 min-h-full justify-end">
                {[...Array(MAX_ATTEMPTS)].map((_, i) => {
                    const rowIndex = MAX_ATTEMPTS - 1 - i; 
                    const isCurrent = rowIndex === activeRow;
                    const rowData = guesses[rowIndex];
                    const fb = feedback[rowIndex];
                    const isPlayed = !!rowData;

                    return (
                        <div key={rowIndex} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCurrent ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]' : 'bg-black/40 border-white/5'}`}>
                            <span className={`text-xs font-mono font-bold w-6 text-center ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{rowIndex + 1}</span>
                            <div className="flex-1 flex justify-center gap-2 sm:gap-4">
                                {[...Array(CODE_LENGTH)].map((_, slotIdx) => {
                                    let colorClass = 'bg-black/50 border border-white/10';
                                    if (isCurrent && !isCodemaker) {
                                        if (slotIdx < currentGuess.length) colorClass = COLORS[currentGuess[slotIdx]];
                                        else if (slotIdx === currentGuess.length) colorClass += ' ring-1 ring-white/50 animate-pulse';
                                    } else if (isPlayed) {
                                        colorClass = COLORS[rowData[slotIdx]];
                                    }
                                    return <div key={slotIdx} className={`w-8 h-8 rounded-full shadow-inner ${colorClass} transition-all duration-200`}></div>;
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-1 w-8">
                                {isPlayed ? (
                                    <>
                                        {[...Array(fb.exact)].map((_, fi) => <div key={`e${fi}`} className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>)}
                                        {[...Array(fb.partial)].map((_, fi) => <div key={`p${fi}`} className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]"></div>)}
                                        {[...Array(Math.max(0, 4 - fb.exact - fb.partial))].map((_, fi) => <div key={`n${fi}`} className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>)}
                                    </>
                                ) : (
                                    [...Array(4)].map((_, fi) => <div key={fi} className="w-2.5 h-2.5 rounded-full bg-gray-800/50"></div>)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
