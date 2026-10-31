
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
    const [activeGroup, setActiveGroup] = useState<ShopGroup>('PLAYER');
    const { currency } = useGlobal();

    return (
        <div className="flex flex-col h-full w-full bg-[#05050a] relative overflow-hidden font-sans text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-4xl mx-auto z-20 shrink-0">
                <ShopHeader 
                    onBack={activeGroup ? () => setActiveGroup(null) : onBack}
                    coins={currency.coins}
                    activeGroupLabel={getGroupLabel(activeGroup)}
                />
                {activeGroup && <button onClick={() => setActiveGroup(null)} className="mx-4 mb-3 text-xs text-cyan-300 flex items-center gap-2"><LayoutGrid size={14}/>Toutes les catégories</button>}
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {activeGroup === null ? (
                    <CategoryGrid onSelectCategory={setActiveGroup} />
                ) : (
                    <ItemGroups group={activeGroup} />
                )}
            </div>
            

        </div>
    );
};