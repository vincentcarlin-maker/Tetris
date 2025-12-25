
import React from 'react';
import { User, Sparkles, Crosshair, Map, Disc } from 'lucide-react';
import { ShopCategory, CategoryConfig } from '../types';

interface CategoryGridProps {
    onSelectCategory: (category: ShopCategory) => void;
}

const CATEGORIES: CategoryConfig[] = [
    { id: 'PLAYER', label: 'Identité', description: 'AVATARS • CADRES • TITRES • BADGES', icon: User, color: 'cyan', bg: 'from-cyan-600/40 via-blue-900/40' },
    { id: 'ARENA', label: 'Arena Clash', description: 'PERSONNALISATION CHARS', icon: Crosshair, color: 'red', bg: 'from-red-600/40 via-orange-900/40' },
    { id: 'SLITHER', label: 'Cyber Serpent', description: 'SKINS • ACCESSOIRES', icon: Sparkles, color: 'indigo', bg: 'from-indigo-600/40 via-purple-900/40' },
    { id: 'AMBIANCE', label: 'Atmosphère', description: 'FONDS D\'ÉCRAN', icon: Map, color: 'pink', bg: 'from-pink-600/40 via-rose-900/40' },
    { id: 'GEAR', label: 'Air Hockey', description: 'MAILLETS HOCKEY', icon: Disc, color: 'yellow', bg: 'from-yellow-600/40 via-orange-900/40' },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CATEGORIES.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)} 
                    className={`group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-${cat.color}-500/50 hover:scale-[1.02] shadow-2xl`}
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} to-black`}></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left">
                        <cat.icon size={32} className={`text-${cat.color}-400 mb-3`} />
                        <h2 className="text-xl font-black italic tracking-tight uppercase">{cat.label}</h2>
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">{cat.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};
