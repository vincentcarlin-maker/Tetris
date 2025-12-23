import React, { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { ShopGroup, ShopCategory } from './types';
import { ShopHeader } from './components/ShopHeader';
import { CategoryGrid } from './components/CategoryGrid';
import { ItemGroups } from './components/ItemGroups';

interface ShopContainerProps {
    onBack: () => void;
}

const getGroupLabel = (group: ShopGroup) => {
    switch(group) {
        case 'PLAYER': return 'Identité';
        case 'SLITHER': return 'Cyber Serpent';
        case 'ARENA': return 'Arena Clash';
        case 'AMBIANCE': return 'Atmosphère';
        case 'GEAR': return 'Air Hockey';
        default: return 'CATÉGORIES';
    }
};

export const Shop: React.FC<ShopContainerProps> = ({ onBack }) => {
    const [activeGroup, setActiveGroup] = useState<ShopGroup>(null);
    const { currency } = useGlobal();

    return (
        <div className="flex flex-col h-full w-full bg-[#05050a] relative overflow-hidden font-sans text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <ShopHeader 
                onBack={activeGroup ? () => setActiveGroup(null) : onBack}
                coins={currency.coins}
                activeGroupLabel={getGroupLabel(activeGroup)}
            />

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {activeGroup === null ? (
                    <CategoryGrid onSelectCategory={setActiveGroup} />
                ) : (
                    <ItemGroups group={activeGroup} />
                )}
            </div>
            
            {activeGroup && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 duration-300">
                    <button onClick={() => setActiveGroup(null)} className="px-6 py-3 bg-gray-900 border border-white/20 rounded-full text-[10px] font-black tracking-widest text-white shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2 backdrop-blur-md">
                        <LayoutGrid size={14} /> TOUTES LES CATÉGORIES
                    </button>
                </div>
            )}
        </div>
    );
};