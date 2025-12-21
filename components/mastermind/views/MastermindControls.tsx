
import React from 'react';
import { Delete, Check } from 'lucide-react';
import { COLORS, CODE_LENGTH } from '../constants';

interface MastermindControlsProps {
    onColorClick: (idx: number) => void;
    onDelete: () => void;
    onSubmit: () => void;
    currentGuessLength: number;
    enabled: boolean;
}

export const MastermindControls: React.FC<MastermindControlsProps> = ({ 
    onColorClick, onDelete, onSubmit, currentGuessLength, enabled 
}) => {
    if (!enabled) return null;

    return (
        <div className="w-full max-w-md z-20 flex flex-col gap-3">
            <div className="flex justify-between items-center bg-gray-900/90 p-2 rounded-xl border border-white/10">
                {COLORS.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => onColorClick(idx)}
                        disabled={currentGuessLength >= CODE_LENGTH}
                        className={`w-10 h-10 rounded-full ${color} border-2 border-white/20 active:scale-90 transition-transform shadow-lg hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                ))}
            </div>
            
            <div className="flex gap-2 h-12">
                <button 
                    onClick={onDelete}
                    disabled={currentGuessLength === 0}
                    className="flex-[1] bg-gray-800 text-red-400 rounded-xl flex items-center justify-center border border-white/10 active:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    <Delete size={24} />
                </button>
                <button 
                    onClick={onSubmit}
                    disabled={currentGuessLength !== CODE_LENGTH}
                    className="flex-[3] bg-green-600 text-white font-black tracking-widest text-lg rounded-xl flex items-center justify-center border-b-4 border-green-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                    VALIDER <Check size={20} className="ml-2" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};
