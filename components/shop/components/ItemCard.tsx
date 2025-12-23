import React from 'react';
import { X, User, Coins } from 'lucide-react';
import { ShopItem } from '../types';

interface ItemCardProps {
    item: ShopItem;
    isOwned: boolean;
    isSelected: boolean;
    coins: number;
    onBuy: () => void;
    onSelect: () => void;
    colorClass: string;
    category: string;
}

const renderPreview = (item: ShopItem, category: string) => {
    if (category === 'TITLES') return <span className={`text-sm font-black uppercase tracking-tighter ${item.color} ${item.shadow || ''}`}>{item.name}</span>;
    if (category === 'WALLPAPERS') return <div className="w-20 h-12 rounded-lg border border-white/20 overflow-hidden" style={{ background: item.cssValue, backgroundSize: item.bgSize }}></div>;
    if (category === 'AVATARS') return <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.bgGradient} flex items-center justify-center shadow-lg`}><item.icon size={28} className={item.color} /></div>;
    if (category === 'FRAMES') return <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center bg-gray-800 ${item.cssClass}`}><User size={20} className="text-gray-500" /></div>;
    if (category === 'MALLETS') {
        const bgStyle: React.CSSProperties = { backgroundColor: item.colors[0], boxShadow: `0 0 15px ${item.colors[0]}` };
        if (item.type === 'gradient' || item.type === 'complex') bgStyle.background = `linear-gradient(135deg, ${item.colors.join(', ')})`;
        return <div className="w-14 h-14 rounded-full border-2 border-white/40 relative shadow-2xl overflow-hidden" style={bgStyle}><div className="absolute inset-0 rounded-full border-4 border-black/20"></div></div>;
    }
    if (category === 'SLITHER_ACCESSORIES') {
        const AccessoryIcon = item.icon;
        return (
            <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-white/10 flex items-center justify-center relative shadow-lg group-hover:border-white/30 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
                <AccessoryIcon size={32} style={{ color: item.color, filter: `drop-shadow(0 0 8px ${item.color})` }} className="relative z-10 transform group-hover:scale-110 transition-transform" />
            </div>
        );
    }
    if (category === 'TANKS') {
        return (
            <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-800 border-2 rounded-lg relative flex items-center justify-center" style={{ borderColor: item.primaryColor, boxShadow: `0 0 10px ${item.glowColor}50` }}>
                     <div className="w-8 h-3 bg-gray-700 border border-current absolute -right-2" style={{ color: item.primaryColor }}></div>
                     <div className="w-4 h-4 rounded-full bg-current" style={{ color: item.primaryColor }}></div>
                </div>
            </div>
        );
    }
    if (category === 'TANK_ACCESSORIES') {
        if (item.id === 'ta_none') return <X className="text-gray-500 opacity-30" size={32} />;
        return (
            <div className="flex border border-white/20 w-14 h-9 rounded-sm overflow-hidden shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
                {item.colors.map((c: string, idx: number) => <div key={idx} className="flex-1 h-full" style={{ backgroundColor: c }}></div>)}
            </div>
        );
    }
     if (category === 'SLITHER_SKINS') {
         return (
             <div className="relative w-14 h-14 flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full border-2 relative overflow-hidden shadow-2xl transition-transform group-hover:scale-110" style={{ background: `linear-gradient(to right, ${item.primaryColor}, ${item.secondaryColor})`, borderColor: 'rgba(255,255,255,0.4)', boxShadow: `0 0 25px ${item.glowColor}80` }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_30%,rgba(0,0,0,0.5)_100%)]"></div></div>
             </div>
         );
    }
    return null;
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, isOwned, isSelected, coins, onBuy, onSelect, colorClass, category }) => {
    const canAfford = coins >= item.price;
    
    return (
        <div className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group relative overflow-hidden ${isSelected ? `bg-${colorClass}-900/30 border-${colorClass}-500 shadow-[0_0_30px_rgba(var(--neon-accent-rgb),0.3)]` : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'}`}>
            <div className="mb-3 h-16 flex items-center justify-center">{renderPreview(item, category)}</div>
            <div className="flex flex-col gap-1 mb-3 w-full">
                <h3 className="font-black text-[10px] text-white truncate uppercase tracking-widest">{item.name}</h3>
                {item.rarity && <span className={`text-[7px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded border self-center ${item.rarity === 'LEGENDARY' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' : item.rarity === 'EPIC' ? 'text-purple-400 border-purple-500/50 bg-purple-500/10' : 'text-gray-500 border-white/10 bg-white/5'}`}>{item.rarity}</span>}
            </div>
            {isOwned ? (
                <button onClick={onSelect} disabled={isSelected} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-blue-600 text-white shadow-lg'}`}>{isSelected ? 'ÉQUIPÉ' : 'CHOISIR'}</button>
            ) : (
                <button onClick={onBuy} disabled={!canAfford} className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${canAfford ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{item.price.toLocaleString()} <Coins size={10} /></button>
            )}
        </div>
    );
};
