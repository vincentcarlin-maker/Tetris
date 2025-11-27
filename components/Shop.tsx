
import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Coins, Shield, User, Circle } from 'lucide-react';
import { useCurrency, Badge, Avatar } from '../hooks/useCurrency';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { coins, inventory, buyBadge, catalog, avatarsCatalog, ownedAvatars, buyAvatar, selectAvatar, currentAvatarId } = currency;
    const [activeTab, setActiveTab] = useState<'avatars' | 'badges'>('avatars');

    const handleBuyBadge = (badge: Badge) => {
        if (!inventory.includes(badge.id) && coins >= badge.price) {
            buyBadge(badge.id, badge.price);
        }
    };

    const handleAvatarAction = (avatar: Avatar) => {
        const isOwned = ownedAvatars.includes(avatar.id);
        if (isOwned) {
            selectAvatar(avatar.id);
        } else {
            if (coins >= avatar.price) {
                buyAvatar(avatar.id, avatar.price);
            }
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

                {/* Tabs */}
                <div className="flex px-4 pb-2 gap-4">
                    <button 
                        onClick={() => setActiveTab('avatars')}
                        className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'avatars' ? 'border-neon-blue text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <User size={16} /> Avatars
                    </button>
                    <button 
                        onClick={() => setActiveTab('badges')}
                        className={`flex-1 py-3 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'badges' ? 'border-neon-pink text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Shield size={16} /> Badges
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="w-full max-w-2xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {activeTab === 'avatars' && (
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {avatarsCatalog.map((avatar) => {
                            const isOwned = ownedAvatars.includes(avatar.id);
                            const isEquipped = currentAvatarId === avatar.id;
                            const canBuy = coins >= avatar.price;
                            const Icon = avatar.icon;

                            return (
                                <button
                                    key={avatar.id}
                                    disabled={!isOwned && !canBuy}
                                    onClick={() => handleAvatarAction(avatar)}
                                    className={`
                                        relative group flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden
                                        ${isEquipped
                                            ? 'bg-gray-900 border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.2)]'
                                            : isOwned
                                                ? 'bg-gray-900/60 border-gray-700 hover:border-gray-500'
                                                : canBuy
                                                    ? 'bg-gray-900/40 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10'
                                                    : 'bg-black/40 border-gray-800 opacity-60 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {/* Avatar Visual */}
                                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} p-0.5 mb-3 shadow-lg relative`}>
                                        <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                                            <Icon size={48} className={avatar.color} />
                                        </div>
                                        {isEquipped && (
                                            <div className="absolute top-2 right-2 w-3 h-3 bg-neon-blue rounded-full shadow-[0_0_8px_#00f3ff]"></div>
                                        )}
                                    </div>

                                    <div className="text-center w-full relative z-10">
                                        <h3 className={`font-bold text-base mb-2 ${isOwned ? 'text-white' : 'text-gray-400'}`}>{avatar.name}</h3>
                                        
                                        {isEquipped ? (
                                            <div className="text-black bg-neon-blue text-xs font-bold tracking-widest uppercase py-1.5 px-3 rounded-full shadow-lg">
                                                ÉQUIPÉ
                                            </div>
                                        ) : isOwned ? (
                                            <div className="text-white border border-white/20 hover:bg-white/10 text-xs font-bold tracking-widest uppercase py-1.5 px-3 rounded-full">
                                                CHOISIR
                                            </div>
                                        ) : (
                                            <div className={`
                                                flex items-center justify-center gap-1 text-sm font-mono font-bold px-3 py-1.5 rounded-full w-full
                                                ${canBuy ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-500'}
                                            `}>
                                                {canBuy ? <Coins size={14} fill="black" /> : <Lock size={12} />}
                                                {avatar.price === 0 ? 'GRATUIT' : avatar.price}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                        {catalog.map((badge) => {
                            const isOwned = inventory.includes(badge.id);
                            const canBuy = coins >= badge.price;
                            const Icon = badge.icon;

                            return (
                                <button
                                    key={badge.id}
                                    disabled={isOwned || !canBuy}
                                    onClick={() => handleBuyBadge(badge)}
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
                )}
            </div>
        </div>
    );
};
