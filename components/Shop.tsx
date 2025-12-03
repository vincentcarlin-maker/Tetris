
import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Coins, Shield, User, Circle, Lightbulb, Glasses } from 'lucide-react';
import { useCurrency, Badge, Avatar, SOLUTION_COST, ACCESSORIES_CATALOG, AccessoryType } from '../hooks/useCurrency';
import { TOTAL_LEVELS } from './rush/levels';
import { AvatarDisplay } from './AvatarDisplay';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { 
        coins, inventory, buyBadge, catalog, 
        avatarsCatalog, ownedAvatars, buyAvatar, selectAvatar, currentAvatarId, 
        unlockedSolutions, buySolution,
        accessoriesCatalog, ownedAccessories, equippedAccessories, buyAccessory, equipAccessory
    } = currency;
    
    const [activeTab, setActiveTab] = useState<'avatars' | 'accessories' | 'badges' | 'helps'>('avatars');
    const [accessoryFilter, setAccessoryFilter] = useState<AccessoryType | 'ALL'>('ALL');

    // Récupérer le niveau max débloqué pour savoir quelles solutions afficher
    const maxUnlockedLevel = parseInt(localStorage.getItem('rush-unlocked-level') || '1', 10);

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

    const handleBuySolution = (levelId: number) => {
        if (!unlockedSolutions.includes(levelId) && coins >= SOLUTION_COST) {
            buySolution(levelId);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen w-full bg-black/20 text-white overflow-y-auto pb-10">
            {/* Ambient Light Reflection */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />

            {/* Header Sticky */}
            <div className="sticky top-0 w-full max-w-2xl bg-black/95 backdrop-blur-md z-30 border-b border-white/10 shadow-lg">
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
                <div className="flex px-4 pb-2 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('avatars')}
                        className={`flex-1 py-3 px-2 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'avatars' ? 'border-neon-blue text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <User size={16} /> Skins
                    </button>
                    <button 
                        onClick={() => setActiveTab('accessories')}
                        className={`flex-1 py-3 px-2 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'accessories' ? 'border-green-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Glasses size={16} /> Items
                    </button>
                    <button 
                        onClick={() => setActiveTab('badges')}
                        className={`flex-1 py-3 px-2 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'badges' ? 'border-neon-pink text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Shield size={16} /> Badges
                    </button>
                    <button 
                        onClick={() => setActiveTab('helps')}
                        className={`flex-1 py-3 px-2 text-sm font-bold tracking-widest uppercase border-b-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'helps' ? 'border-purple-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <Lightbulb size={16} /> Aides
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="w-full max-w-2xl mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* PREVIEW CARD FOR CUSTOMIZATION */}
                {(activeTab === 'avatars' || activeTab === 'accessories') && (
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-900/80 p-6 rounded-2xl border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
                            <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-4 z-10">VOTRE STYLE ACTUEL</h3>
                            <AvatarDisplay 
                                avatarId={currentAvatarId} 
                                accessories={equippedAccessories}
                                size="xl"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'avatars' && (
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {avatarsCatalog.map((avatar) => {
                            const isOwned = ownedAvatars.includes(avatar.id);
                            const isEquipped = currentAvatarId === avatar.id;
                            const canBuy = coins >= avatar.price;
                            
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
                                    {/* Using AvatarDisplay for preview consistency */}
                                    <div className="mb-3 pointer-events-none">
                                        <AvatarDisplay avatarId={avatar.id} size="md" showBackground={true} />
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

                {activeTab === 'accessories' && (
                    <div className="flex flex-col gap-4 p-4">
                        {/* Filters */}
                        <div className="flex gap-2 justify-center mb-2">
                            {(['ALL', 'HEAD', 'EYES', 'EFFECT'] as const).map(filter => (
                                <button 
                                    key={filter}
                                    onClick={() => setAccessoryFilter(filter)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${accessoryFilter === filter ? 'bg-white text-black border-white' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                >
                                    {filter === 'ALL' ? 'TOUT' : filter === 'HEAD' ? 'TÊTE' : filter === 'EYES' ? 'YEUX' : 'AURA'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {accessoriesCatalog.filter(a => accessoryFilter === 'ALL' || a.type === accessoryFilter).map((acc) => {
                                const isOwned = ownedAccessories.includes(acc.id);
                                const isEquipped = 
                                    (acc.type === 'HEAD' && equippedAccessories.head === acc.id) ||
                                    (acc.type === 'EYES' && equippedAccessories.eyes === acc.id) ||
                                    (acc.type === 'EFFECT' && equippedAccessories.effect === acc.id);
                                const canBuy = coins >= acc.price;
                                const Icon = acc.icon;

                                return (
                                    <button
                                        key={acc.id}
                                        disabled={!isOwned && !canBuy}
                                        onClick={() => isOwned ? equipAccessory(acc.type, isEquipped ? null : acc.id) : buyAccessory(acc.id, acc.price)}
                                        className={`
                                            relative group flex flex-col items-center p-3 rounded-xl border transition-all duration-300
                                            ${isEquipped
                                                ? 'bg-gray-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                                : isOwned
                                                    ? 'bg-gray-900/60 border-gray-700 hover:border-gray-500'
                                                    : canBuy
                                                        ? 'bg-gray-900/40 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10'
                                                        : 'bg-black/40 border-gray-800 opacity-60 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isOwned ? 'bg-gray-800' : 'bg-black/50'}`}>
                                            <Icon size={24} className={acc.color} />
                                        </div>

                                        <div className="text-center w-full">
                                            <h3 className={`font-bold text-xs mb-2 ${isOwned ? 'text-white' : 'text-gray-400'}`}>{acc.name}</h3>
                                            
                                            {isEquipped ? (
                                                <div className="text-black bg-green-500 text-[10px] font-bold tracking-widest uppercase py-1 px-2 rounded-full shadow-lg">
                                                    PORTÉ
                                                </div>
                                            ) : isOwned ? (
                                                <div className="text-white border border-white/20 hover:bg-white/10 text-[10px] font-bold tracking-widest uppercase py-1 px-2 rounded-full">
                                                    PORTER
                                                </div>
                                            ) : (
                                                <div className={`
                                                    flex items-center justify-center gap-1 text-[10px] font-mono font-bold px-2 py-1 rounded-full w-full
                                                    ${canBuy ? 'bg-yellow-500 text-black shadow-lg' : 'bg-gray-800 text-gray-500'}
                                                `}>
                                                    {canBuy ? <Coins size={10} fill="black" /> : <Lock size={10} />}
                                                    {acc.price}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
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

                {activeTab === 'helps' && (
                     <div className="grid grid-cols-1 gap-4 p-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-900/40 rounded-full">
                                <Lightbulb className="text-purple-400" size={24} />
                            </div>
                            <div className="text-sm text-gray-300">
                                Achète la solution d'un niveau pour le passer instantanément si tu es bloqué.
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             {Array.from({ length: TOTAL_LEVELS }).map((_, idx) => {
                                 const levelId = idx + 1;
                                 const isUnlocked = levelId <= maxUnlockedLevel;
                                 const isBought = unlockedSolutions.includes(levelId);
                                 const canBuy = coins >= SOLUTION_COST && isUnlocked && !isBought;

                                 return (
                                     <button
                                         key={levelId}
                                         disabled={!isUnlocked || isBought || !canBuy}
                                         onClick={() => handleBuySolution(levelId)}
                                         className={`
                                             relative flex flex-col items-center justify-between p-3 rounded-lg border transition-all
                                             ${isBought 
                                                 ? 'bg-gray-900/80 border-purple-500/50' 
                                                 : canBuy 
                                                     ? 'bg-gray-800 border-white/10 hover:border-yellow-400 hover:bg-gray-700'
                                                     : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'
                                             }
                                         `}
                                     >
                                         <div className="flex items-center justify-between w-full mb-2">
                                             <span className="font-bold text-gray-300">NIVEAU {levelId}</span>
                                             {!isUnlocked && <Lock size={14} className="text-gray-600"/>}
                                         </div>

                                         {isBought ? (
                                             <div className="w-full text-center bg-purple-500/20 text-purple-300 text-xs font-bold py-1 rounded border border-purple-500/30">
                                                 ACQUIS
                                             </div>
                                         ) : (
                                              <div className={`
                                                 flex items-center justify-center gap-1 text-xs font-mono font-bold px-2 py-1.5 rounded w-full
                                                 ${canBuy ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-500'}
                                             `}>
                                                 <Coins size={12} fill={canBuy ? 'black' : 'currentColor'} />
                                                 {SOLUTION_COST}
                                             </div>
                                         )}
                                     </button>
                                 );
                             })}
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};
