import React from 'react';
import { Card as CardType, Color, Value } from '../types';
import { RotateCcw, Ban, Palette } from 'lucide-react';

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600' },
};

interface CardProps {
    card: CardType;
    onClick?: (e: React.MouseEvent) => void;
    faceUp?: boolean;
    small?: boolean;
    style?: React.CSSProperties;
    isPlayable?: boolean;
}

const CardComponent: React.FC<CardProps> = ({ card, onClick, faceUp = true, small = false, style, isPlayable = true }) => {
    if (!faceUp) {
        return (
            <div style={style} className={`
                ${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} 
                bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center
                shadow-lg relative overflow-hidden group
            `}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/50 rounded-full border border-gray-600 flex flex-col items-center justify-center relative z-10 rotate-12">
                    <span className="font-script text-neon-pink text-[10px] sm:text-xs leading-none drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">Neon</span>
                    <span className="font-black italic text-cyan-400 text-sm sm:text-lg leading-none drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">UNO</span>
                </div>
            </div>
        );
    }

    const config = COLOR_CONFIG[card.color];
    let displayValue: string = card.value;
    let Icon = null;

    if (card.value === 'skip') Icon = Ban;
    else if (card.value === 'reverse') Icon = RotateCcw;
    else if (card.value === 'draw2') displayValue = '+2';
    else if (card.value === 'wild') Icon = Palette;
    else if (card.value === 'wild4') displayValue = '+4';

    const isPlayerHand = onClick !== undefined;
    const liftClass = isPlayerHand ? (isPlayable ? '-translate-y-6 sm:-translate-y-8 shadow-[0_0_25px_rgba(255,255,255,0.4)] z-30 brightness-110 ring-2 ring-white/70' : 'brightness-50 z-0 translate-y-2') : '';
    const isWild = card.color === 'black';

    return (
        <div onClick={onClick} style={style} className={`${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} relative rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 select-none shadow-xl border-2 ${config.border} ${liftClass} bg-gray-900`}>
            
            {isWild ? (
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#ef4444,#eab308,#22c55e,#3b82f6,#ef4444)] animate-[spin_4s_linear_infinite] opacity-100 z-0"></div>
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80 z-0`}></div>
            )}

            <div className={`absolute inset-2 sm:inset-3 rounded-[50%_/_40%] border ${isWild ? 'border-white/40 bg-black/80' : 'border-white/20 bg-black/40'} backdrop-blur-sm flex items-center justify-center z-10 shadow-inner`}>
                <div className={`font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isWild ? (Icon ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400') : 'text-white'} text-3xl sm:text-5xl flex items-center justify-center`}>
                    {Icon ? <Icon size={small ? 20 : 40} strokeWidth={2.5} className={isWild ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : ""} /> : displayValue}
                </div>
            </div>

            <div className="absolute top-1 left-1.5 text-[10px] sm:text-sm font-bold leading-none text-white drop-shadow-md z-20">
                {Icon ? <Icon size={12}/> : displayValue}
            </div>
            <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-sm font-bold leading-none transform rotate-180 text-white drop-shadow-md z-20">
                {Icon ? <Icon size={12}/> : displayValue}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20"></div>
        </div>
    );
};

export const Card = React.memo(CardComponent);
