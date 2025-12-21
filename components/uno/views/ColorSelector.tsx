import React from 'react';
import { Color } from '../types';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600' },
};

interface ColorSelectorProps {
    onColorSelect: (color: Color) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ onColorSelect }) => {
    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in">
            <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">CHOISIR UNE COULEUR</h2>
            <div className="grid grid-cols-2 gap-4">
                {COLORS.map(c => (
                    <button key={c} onClick={() => onColorSelect(c)} className={`w-32 h-32 rounded-2xl border-4 ${COLOR_CONFIG[c].border} bg-gray-900 hover:scale-105 transition-transform flex items-center justify-center group`}>
                        <div className={`w-16 h-16 rounded-full ${COLOR_CONFIG[c].text.replace('text', 'bg')} shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform`}></div>
                    </button>
                ))}
            </div>
        </div>
    );
};
