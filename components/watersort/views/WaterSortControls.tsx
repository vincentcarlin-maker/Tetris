
import React from 'react';
import { Undo2, Plus, Coins } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';

interface WaterSortControlsProps {
    onUndo: () => void;
    onAddTube: () => void;
    canUndo: boolean;
    canAddTube: boolean;
    isDisabled: boolean;
}

export const WaterSortControls: React.FC<WaterSortControlsProps> = ({ 
    onUndo, onAddTube, canUndo, canAddTube, isDisabled 
}) => {
    const { coins } = useCurrency();
    const canAfford = coins >= 500;

    return (
        <div className="w-full max-w-lg flex justify-center gap-6 mt-4 z-30 pb-4 shrink-0 relative">
            <button 
                onClick={onUndo} 
                disabled={!canUndo || isDisabled}
                className="flex flex-col items-center gap-1 text-gray-400 disabled:opacity-30 hover:text-white transition-colors group"
            >
                <div className="p-4 bg-gray-800 rounded-full border border-white/10 group-hover:border-white/50 shadow-lg active:scale-95 transition-all">
                    <Undo2 size={24} />
                </div>
                <span className="text-[10px] font-bold tracking-widest">ANNULER</span>
            </button>

            <button 
                onClick={onAddTube} 
                disabled={!canAddTube || isDisabled || !canAfford}
                className="flex flex-col items-center gap-1 text-gray-400 disabled:opacity-30 hover:text-cyan-400 transition-colors group"
            >
                <div className={`p-4 bg-gray-800 rounded-full border ${canAddTube && canAfford ? 'border-yellow-500/30' : 'border-white/10'} group-hover:border-cyan-500 shadow-lg active:scale-95 transition-all relative`}>
                    <Plus size={24} className={canAddTube && canAfford ? 'text-yellow-400' : ''} />
                </div>
                <span className="text-[10px] font-bold tracking-widest flex items-center gap-1">
                    TUBE <span className="text-yellow-500 flex items-center"><Coins size={8} className="mr-0.5"/>500</span>
                </span>
            </button>
        </div>
    );
};
