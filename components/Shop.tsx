
import React from 'react';
import { ArrowLeft, Lock, Check, Coins } from 'lucide-react';
import { useCurrency, Badge } from '../hooks/useCurrency';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { coins, inventory, buyBadge, catalog } = currency;

    const handleBuy = (badge: Badge) => {
        if (!inventory.includes(badge.id) && coins >= badge.price) {
            buyBadge(badge.id, badge.price);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen w-full bg-[#0a0a12] text-white overflow-y-auto pb-10">
            {/* Header Sticky */}
            <div className="sticky top-0 w-full max-w-2xl bg-[#0a0a12]/95 backdrop-blur-md z-30 border-b border-white/10 shadow-lg">
                <div className="flex items-center justify-between p-4">
                    <button 
                        onClick={onBack} 
                        className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        BOUTIQUE
                    </h1>

                    <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="font-mono font-bold text-yellow-100">{coins.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Grid des Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 w-full max-w-2xl mt-2 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {catalog.map((badge) => {
                    const isOwned = inventory.includes(badge.id);
                    const canBuy = coins >= badge.price;
                    const Icon = badge.icon;

                    return (
                        <button
                            key={badge.id}
                            disabled={isOwned || !canBuy}
                            onClick={() => handleBuy(badge)}
                            className={`
                                relative group flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300
                                ${isOwned 
                                    ? 'bg-gray-900/40 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                                    : canBuy 
                                        ? 'bg-gray-800/40 border-gray-700 hover:border-yellow-500 hover:bg-gray-800 hover:scale-[1.02] cursor-pointer' 
                                        : 'bg-black/40 border-gray-800 opacity-60 cursor-not-allowed grayscale-[0.5]'
                                }
                            `}
                        >
                            {/* Icon Container */}
                            <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center mb-3 relative
                                ${isOwned ? 'bg-gradient-to-br from-gray-800 to-black ring-2 ring-green-500/50' : 'bg-gray-900 ring-1 ring-white/10'}
                            `}>
                                <Icon size={32} className={`${badge.color} ${isOwned ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`} />
                                
                                {isOwned && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 text-black rounded-full p-1 shadow-lg">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                            </div>

                            <div className="text-center w-full">
                                <h3 className={`font-bold text-sm mb-1 ${isOwned ? 'text-white' : 'text-gray-400'}`}>{badge.name}</h3>
                                <p className="text-[10px] text-gray-500 leading-tight mb-3 line-clamp-2 h-6">{badge.description}</p>
                                
                                {isOwned ? (
                                    <div className="text-green-400 text-xs font-bold tracking-widest uppercase py-1 px-3 bg-green-900/20 rounded-full border border-green-500/20">
                                        ACQUIS
                                    </div>
                                ) : (
                                    <div className={`
                                        flex items-center justify-center gap-1 text-sm font-mono font-bold px-3 py-1 rounded-full w-full
                                        ${canBuy ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-500'}
                                    `}>
                                        {canBuy ? <Coins size={14} fill="black" /> : <Lock size={12} />}
                                        {badge.price}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
