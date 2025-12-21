
import React from 'react';
import { RotateCw, RefreshCw, Play, Loader2 } from 'lucide-react';
import { Grid, Ship, ShipType } from './types';
import { BattleshipGrid } from './BattleshipGrid';
import { SHIPS_CONFIG } from './logic';

interface BattleshipSetupProps {
    grid: Grid;
    ships: Ship[];
    selectedShipType: ShipType | null;
    orientation: 'horizontal' | 'vertical';
    isReady: boolean;
    gameMode: 'SOLO' | 'ONLINE';
    onCellClick: (r: number, c: number) => void;
    onSelectShip: (type: ShipType) => void;
    onToggleOrientation: () => void;
    onRandomize: () => void;
    onStartBattle: () => void;
}

export const BattleshipSetup: React.FC<BattleshipSetupProps> = ({
    grid, ships, selectedShipType, orientation, isReady, gameMode,
    onCellClick, onSelectShip, onToggleOrientation, onRandomize, onStartBattle
}) => {
    return (
        <div className="flex-1 w-full max-w-md flex flex-col items-center z-10 pb-4 overflow-y-auto">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-white mb-1">DÉPLOIEMENT</h2>
                <p className="text-xs text-gray-400">1. Sélectionnez un navire<br/>2. Touchez la grille pour placer</p>
            </div>

            <BattleshipGrid 
                grid={grid} 
                ships={ships} 
                showShips={true} 
                onCellClick={onCellClick} 
                className="w-full max-w-[350px]"
            />

            {/* Inventaire */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
                {SHIPS_CONFIG.map(config => {
                    const placed = ships.find(s => s.type === config.type);
                    const isSelected = selectedShipType === config.type;
                    return (
                        <button 
                            key={config.type}
                            onClick={() => onSelectShip(config.type)}
                            disabled={!!placed}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                                placed ? 'bg-gray-800 border-gray-700 text-gray-500 opacity-50' :
                                isSelected ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_cyan]' :
                                'bg-gray-900 border-white/20 text-cyan-400 hover:bg-gray-800'
                            }`}
                        >
                            {config.label} ({config.size})
                        </button>
                    );
                })}
            </div>

            {/* Contrôles */}
            <div className="flex gap-4 mt-4 w-full justify-center">
                <button onClick={onToggleOrientation} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95 transition-transform">
                    <RotateCw size={14}/> {orientation === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'}
                </button>
                <button onClick={onRandomize} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95 transition-transform">
                    <RefreshCw size={14}/> ALÉATOIRE
                </button>
            </div>

            <button 
                onClick={onStartBattle} 
                disabled={ships.length < 5 || (gameMode === 'ONLINE' && isReady)}
                className={`mt-6 w-full max-w-[300px] py-3 rounded-xl font-black tracking-widest text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${ships.length === 5 ? (isReady ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black hover:scale-105') : 'bg-gray-800 text-gray-600'}`}
            >
                {isReady ? <><Loader2 className="animate-spin" size={20}/> EN ATTENTE...</> : <><Play size={20} fill="black"/> COMBATTRE</>}
            </button>
        </div>
    );
};
