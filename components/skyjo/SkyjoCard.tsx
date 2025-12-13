
import React from 'react';
import { SkyjoCard as SkyjoCardType } from './types';

interface SkyjoCardProps {
    card: SkyjoCardType;
    onClick?: () => void;
    interactive?: boolean;
    small?: boolean;
    style?: React.CSSProperties;
    showValueForDebug?: boolean;
    highlight?: boolean;
}

export const SkyjoCard: React.FC<SkyjoCardProps> = ({ card, onClick, interactive, small, style, showValueForDebug, highlight }) => {
    // Détermination des couleurs Néon vives sur fond sombre
    const getNeonStyle = (val: number) => {
        // Structure: [Border Color, Text Color, Glow Color Shadow]
        if (val <= -1) return 'border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6),inset_0_0_10px_rgba(168,85,247,0.2)]';
        if (val === 0) return 'border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6),inset_0_0_10px_rgba(34,211,238,0.2)]';
        if (val >= 1 && val <= 4) return 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6),inset_0_0_10px_rgba(34,197,94,0.2)]';
        if (val >= 5 && val <= 8) return 'border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6),inset_0_0_10px_rgba(250,204,21,0.2)]';
        if (val >= 9) return 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6),inset_0_0_10px_rgba(239,68,68,0.2)]';
        return 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.5)]';
    };

    const neonClass = getNeonStyle(card.value);
    
    // Tailles
    const sizeClasses = small 
        ? 'w-8 h-12 text-xs rounded border' 
        : 'w-16 h-24 sm:w-20 sm:h-28 text-3xl sm:text-4xl rounded-xl border-2';

    // Visibilité
    const opacityClass = card.isCleared ? 'opacity-0 pointer-events-none' : 'opacity-100';
    
    // Highlight (ex: carte piochée)
    const highlightClass = highlight ? 'scale-110 z-20 brightness-125' : '';

    return (
        <div 
            onClick={interactive ? onClick : undefined}
            style={style}
            className={`
                relative preserve-3d transition-all duration-300 cursor-pointer
                ${sizeClasses}
                ${card.isRevealed ? 'rotate-y-0' : 'rotate-y-180'}
                ${interactive ? 'hover:scale-105 hover:-translate-y-1 active:scale-95' : ''}
                ${opacityClass}
                ${highlightClass}
            `}
        >
            <style>{`.preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>

            {/* FACE AVANT (Révélée) - Style Cyberpunk */}
            <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center font-black bg-gray-950 ${neonClass} backdrop-blur-md overflow-hidden rounded-xl`}>
                
                {/* Texture de fond "Tech" légère */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1))', backgroundSize: '4px 4px' }}>
                </div>
                
                {/* Reflet type "Scanline" */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                {/* Valeur Centrale avec Glow */}
                <span className="drop-shadow-[0_0_8px_currentColor] z-10 font-mono tracking-tighter">{card.value}</span>
                
                {!small && (
                    <>
                        {/* Valeurs aux coins */}
                        <span className="absolute top-1 left-2 text-xs opacity-80 font-mono">{card.value}</span>
                        <span className="absolute bottom-1 right-2 text-xs opacity-80 transform rotate-180 font-mono">{card.value}</span>
                        
                        {/* Élément décoratif central (cercle fin) */}
                        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full border border-current opacity-20 pointer-events-none"></div>
                    </>
                )}
            </div>

            {/* FACE ARRIÈRE (Cachée) - Motif Néon Grid */}
            <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-black border-2 border-slate-700 flex flex-col items-center justify-center rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden`}>
                
                {/* Grille Néon violette en fond */}
                <div className="absolute inset-0 opacity-30" 
                     style={{ 
                         backgroundImage: `
                            linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
                         `, 
                         backgroundSize: '10px 10px' 
                     }}>
                </div>

                {/* Logo central stylisé */}
                <div className="relative z-10 transform -rotate-12 border-2 border-neon-blue px-2 py-1 rounded bg-black/80 shadow-[0_0_10px_#00f3ff]">
                    <span className="font-script text-neon-pink text-lg drop-shadow-[0_0_5px_#ff00ff]">Neon</span>
                </div>
                
                {showValueForDebug && <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] text-gray-500 bg-black">{card.value}</span>}
            </div>
        </div>
    );
};
