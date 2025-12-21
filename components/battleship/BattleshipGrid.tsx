
import React, { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import { Grid, Ship, ShipType } from './types';

// --- VISUAL COMPONENTS ---

export const ShipVisual: React.FC<{ type: ShipType, size: number, orientation: 'horizontal' | 'vertical', isSunk: boolean, isGhost?: boolean, isValid?: boolean }> = ({ size, orientation, isSunk, isGhost, isValid }) => {
    const isVertical = orientation === 'vertical';
    
    let containerClass = "relative rounded-md border backdrop-blur-sm flex items-center justify-center transition-all duration-300";
    let colorClass = isSunk ? 'bg-red-900/80 border-red-500' : 'bg-cyan-900/60 border-cyan-400';
    
    if (isGhost) {
        colorClass = isValid ? 'bg-green-500/40 border-green-400' : 'bg-red-500/40 border-red-500';
    }

    return (
        <div className={`w-full h-full p-[2px] pointer-events-none ${isGhost ? 'opacity-70 z-20' : 'z-10'}`}>
            <div className={`${containerClass} w-full h-full ${colorClass} ${isSunk ? '' : 'shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%,rgba(255,255,255,0.1)_100%)] bg-[length:4px_4px] opacity-30"></div>
                <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-evenly w-full h-full p-[10%]`}>
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className={`bg-black/40 border border-white/20 rounded-sm ${isVertical ? 'w-2/3 h-full mx-auto my-[1px]' : 'h-2/3 w-full my-auto mx-[1px]'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Marker: React.FC<{ status: 2 | 3 }> = ({ status }) => {
    const [showWave, setShowWave] = useState(true);

    useEffect(() => {
        if (status === 2) {
            const timer = setTimeout(() => setShowWave(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (status === 2) { // MISS
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {showWave && (
                    <>
                        <div className="absolute w-full h-full border-2 border-cyan-400 rounded-full animate-[ping_1s_ease-out_infinite] opacity-60"></div>
                        <div className="absolute w-2/3 h-2/3 border border-cyan-500/50 rounded-full animate-[ping_1.5s_ease-out_infinite] opacity-40"></div>
                    </>
                )}
                <div className="w-1.5 h-1.5 bg-cyan-200/50 rounded-full shadow-[0_0_8px_cyan]"></div>
            </div>
        );
    }
    // HIT
    return (
        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-pulse z-10"></div>
            <div className="absolute inset-0 border border-red-500/50 rounded-full animate-ping"></div>
            <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 w-4 h-4" strokeWidth={3} />
        </div>
    );
};

interface BattleshipGridProps {
    grid: Grid;
    ships?: Ship[];
    showShips?: boolean;
    onCellClick?: (r: number, c: number) => void;
    className?: string;
    label?: string;
    labelColor?: string;
}

export const BattleshipGrid: React.FC<BattleshipGridProps> = ({ 
    grid, ships = [], showShips = false, onCellClick, className, label, labelColor = 'text-cyan-400' 
}) => {
    return (
        <div className={`relative ${className}`}>
            {label && <div className={`absolute -top-6 left-0 text-[10px] font-bold ${labelColor} tracking-widest`}>{label}</div>}
            
            <div className="grid grid-cols-10 grid-rows-10 w-full aspect-square border-2 border-white/20 bg-black/60 rounded-lg overflow-hidden relative shadow-inner">
                {/* Layer Navires */}
                {showShips && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {ships.map(ship => (
                            <div key={ship.id} style={{ 
                                position: 'absolute', 
                                left: `${ship.col * 10}%`, 
                                top: `${ship.row * 10}%`, 
                                width: ship.orientation === 'horizontal' ? `${ship.size * 10}%` : '10%', 
                                height: ship.orientation === 'vertical' ? `${ship.size * 10}%` : '10%' 
                            }}>
                                <ShipVisual type={ship.type} size={ship.size} orientation={ship.orientation} isSunk={ship.sunk} isGhost={false} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Layer Cellules & Tirs */}
                {Array.from({ length: 100 }).map((_, i) => {
                    const r = Math.floor(i / 10);
                    const c = i % 10;
                    const val = grid[r][c]; // 0, 1, 2, 3
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => onCellClick && onCellClick(r, c)}
                            className={`border border-white/5 w-full h-full relative flex items-center justify-center ${onCellClick ? 'cursor-pointer hover:bg-white/10' : ''}`}
                        >
                            {(val === 2 || val === 3) && <Marker status={val as 2|3} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
