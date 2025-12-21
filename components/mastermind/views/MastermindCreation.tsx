
import React from 'react';
import { Delete, Send } from 'lucide-react';
import { COLORS, CODE_LENGTH } from '../constants';

interface MastermindCreationProps {
    buffer: number[];
    onColorSelect: (idx: number) => void;
    onDelete: () => void;
    onSubmit: () => void;
}

export const MastermindCreation: React.FC<MastermindCreationProps> = ({ buffer, onColorSelect, onDelete, onSubmit }) => {
    return (
        <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center z-20">
            <h2 className="text-2xl font-black text-white mb-8 animate-pulse text-center">CRÉEZ LE CODE SECRET</h2>
            <div className="flex gap-4 mb-10">
                {[...Array(CODE_LENGTH)].map((_, i) => (
                    <div key={i} className={`w-14 h-14 rounded-full border-2 ${i < buffer.length ? COLORS[buffer[i]] + ' border-white' : 'bg-gray-800 border-white/20'} transition-all shadow-xl`}></div>
                ))}
            </div>
            
            <div className="flex gap-4 mb-8">
                {COLORS.map((color, idx) => (
                    <button
                        key={idx}
                        onClick={() => onColorSelect(idx)}
                        className={`w-12 h-12 rounded-full ${color} border-2 border-white/20 active:scale-90 transition-transform shadow-lg hover:scale-110`}
                    />
                ))}
            </div>

            <div className="flex gap-4 w-full px-8">
                <button onClick={onDelete} className="flex-1 py-3 bg-gray-800 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-900/20 active:scale-95 transition-all"><Delete size={20} className="mx-auto"/></button>
                <button 
                    onClick={onSubmit} 
                    disabled={buffer.length !== CODE_LENGTH}
                    className={`flex-[3] py-3 rounded-xl font-black tracking-widest text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${buffer.length === CODE_LENGTH ? 'bg-green-500 text-black hover:bg-white hover:scale-105 shadow-[0_0_15px_#22c55e]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                    ENVOYER <Send size={20}/>
                </button>
            </div>
        </div>
    );
};
