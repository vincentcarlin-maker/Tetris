
import React, { forwardRef } from 'react';
import { Tube } from '../types';
import { NEON_COLORS } from '../constants';

interface WaterSortTubeProps {
    tube: Tube;
    index: number;
    isSelected: boolean;
    isPourSource: boolean;
    style?: React.CSSProperties;
    onClick: () => void;
}

export const WaterSortTube = forwardRef<HTMLDivElement, WaterSortTubeProps>(({ 
    tube, index, isSelected, isPourSource, style, onClick 
}, ref) => {
    
    // Visual adjustment for selection
    const transformStyle = style || (isSelected ? { transform: 'translate(0, -15px)', zIndex: 20 } : {});

    return (
        <div 
            ref={ref}
            onClick={onClick}
            style={{ 
                ...transformStyle,
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transformOrigin: 'center'
            }}
            className={`
                relative w-10 sm:w-12 h-32 sm:h-40 border-2 rounded-b-full rounded-t-lg cursor-pointer
                ${isSelected ? 'border-yellow-400 shadow-[0_0_20px_#facc15]' : 'border-white/30 hover:border-white/60'}
                bg-white/5 backdrop-blur-sm flex flex-col-reverse overflow-hidden
            `}
        >
            {/* Tube Highlights */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-30 rounded-b-full"></div>
            <div className="absolute top-1 left-1.5 w-1 h-[90%] bg-white/20 blur-[1px] z-30 rounded-full opacity-50 pointer-events-none"></div>
            
            {/* Rim Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 z-30"></div>

            {/* Liquid Segments */}
            <div className="w-full h-full rounded-b-full flex flex-col-reverse relative z-10 transition-all">
                {tube.map((color, idx) => (
                    <div 
                        key={idx} 
                        className={`w-full h-[23%] ${NEON_COLORS[color]} transition-all duration-300 relative mb-[1px]`}
                    >
                        {/* Surface Meniscus */}
                        <div className="absolute top-0 left-0 w-full h-[6px] bg-white/30 rounded-[50%] -translate-y-1/2 scale-x-90 blur-[1px]"></div>
                        {/* Bubbles */}
                        {idx === tube.length - 1 && Math.random() > 0.5 && (
                            <div className="absolute top-2 left-1/2 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

WaterSortTube.displayName = 'WaterSortTube';
