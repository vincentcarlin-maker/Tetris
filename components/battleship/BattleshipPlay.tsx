
import React from 'react';
import { Target, ShieldAlert } from 'lucide-react';
import { Grid, Ship } from './types';
import { BattleshipGrid } from './BattleshipGrid';

interface BattleshipPlayProps {
    playerGrid: Grid;
    cpuGrid: Grid;
    playerShips: Ship[];
    cpuShips: Ship[];
    turn: 'PLAYER' | 'CPU';
    onAttack: (r: number, c: number) => void;
}

export const BattleshipPlay: React.FC<BattleshipPlayProps> = ({
    playerGrid, cpuGrid, playerShips, cpuShips, turn, onAttack
}) => {
    
    const enemySunkCount = cpuShips.filter(s => s.sunk).length;
    const playerSunkCount = playerShips.filter(s => s.sunk).length;

    return (
        <div className="flex-1 w-full max-w-md flex flex-col items-center z-10 animate-in fade-in">
            {/* Status Bar */}
            <div className="flex gap-4 mb-4 text-[10px] font-bold text-gray-400 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                <span className="text-red-400 flex items-center gap-1"><Target size={12}/> {5 - enemySunkCount} ENNEMIS</span>
                <div className="w-px h-3 bg-white/20"></div>
                <span className="text-cyan-400 flex items-center gap-1"><ShieldAlert size={12}/> {5 - playerSunkCount} ALLIÉS</span>
            </div>

            <div className={`mb-4 px-6 py-2 rounded-full border text-sm font-bold shadow-lg transition-colors ${turn === 'PLAYER' ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                {turn === 'PLAYER' ? "À VOUS DE TIRER" : "L'ENNEMI VISE..."}
            </div>

            {/* ENEMY GRID (Target) */}
            <BattleshipGrid
                grid={cpuGrid}
                ships={cpuShips.filter(s => s.sunk)} // Only show sunk ships
                showShips={true}
                onCellClick={onAttack}
                className="w-full max-w-[350px] mb-6"
                label="ZONE ENNEMIE"
                labelColor="text-red-400"
            />

            {/* PLAYER GRID (Mini) */}
            <div className="relative opacity-90 transition-opacity hover:opacity-100">
                <BattleshipGrid
                    grid={playerGrid}
                    ships={playerShips}
                    showShips={true}
                    className="w-[180px]"
                    label="MA FLOTTE"
                />
            </div>
        </div>
    );
};
