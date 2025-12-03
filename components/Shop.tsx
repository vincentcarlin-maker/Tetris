
import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Coins, Shield, User, Circle, Lightbulb, ShoppingBag, Frame } from 'lucide-react';
import { useCurrency, Badge, Avatar, Frame as FrameType, SOLUTION_COST } from '../hooks/useCurrency';
import { TOTAL_LEVELS } from './rush/levels';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { 
        coins, inventory, buyBadge, catalog, 
        currentAvatarId, selectAvatar, buyAvatar, ownedAvatars, avatarsCatalog,
        currentFrameId, selectFrame, buyFrame, ownedFrames, framesCatalog,
        unlockedSolutions, buySolution
    } = currency;

    const [activeTab, setActiveTab] = useState<'BADGES' | 'AVATARS' | 'FRAMES' | 'SOLUTIONS'>('BADGES');

    const handleBuyBadge = (badge: Badge) => {
        if (coins >= badge.price && !inventory.includes(badge.id)) {
            buyBadge(badge.id, badge.price);
        }
    };

    const handleBuyAvatar = (avatar: Avatar) => {
        if (coins >= avatar.price && !ownedAvatars.includes(avatar.id)) {
            buyAvatar(avatar.id, avatar.price);
        }
    };

    const handleBuyFrame = (frame: FrameType) => {
        if (coins >= frame.price && !ownedFrames.includes(frame.id)) {
            buyFrame(frame.id, frame.price);
        }
    };

    const handleBuySolution = (levelId: number) => {
        if (coins >= SOLUTION_COST && !unlockedSolutions.includes(levelId)) {
            buySolution(levelId);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-black/20 relative overflow-hidden font-sans text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between p-4 z-10 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">BOUTIQUE</h1>
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <Coins size={16} className="text-yellow-400" />
                    <span className="font-mono font-bold text-yellow-100">{coins}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="w-full max-w-2xl mx-auto px-4 z-10 shrink-0 mb-4">
                <div className="flex bg-gray-900/80 rounded-xl border border-white/10 p-1 backdrop-blur-md overflow-x-auto no-scrollbar gap-1">
                    <button onClick={() => setActiveTab('BADGES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'BADGES' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>BADGES</button>
                    <button onClick={() => setActiveTab('AVATARS')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'AVATARS' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>AVATARS</button>
                    <button onClick={() => setActiveTab('FRAMES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'FRAMES' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>CADRES</button>
                    <button onClick={() => setActiveTab('SOLUTIONS')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'SOLUTIONS' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>SOLUTIONS</button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-6 overflow-y-auto custom-scrollbar z-10">
                
                {/* BADGES TAB */}
                {activeTab === 'BADGES' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {catalog.map(badge => {
                            const isOwned = inventory.includes(badge.id);
                            const canAfford = coins >= badge.price;
                            const Icon = badge.icon;

                            return (
                                <div key={badge.id} className={`p-3 rounded-xl border ${isOwned ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-gray-800/60 border-white/5'} flex flex-col items-center text-center transition-all relative overflow-hidden group`}>
                                    <div className={`p-3 rounded-full mb-2 ${isOwned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700/50 text-gray-500 group-hover:text-gray-300'}`}>
                                        <Icon size={24} className={isOwned ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : ''} />
                                    </div>
                                    <h3 className={`font-bold text-sm mb-1 ${isOwned ? 'text-yellow-200' : 'text-gray-300'}`}>{badge.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{badge.description}</p>
                                    
                                    {isOwned ? (
                                        <div className="mt-auto px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                                            <Check size={12} /> POSSÉDÉ
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleBuyBadge(badge)}
                                            disabled={!canAfford}
                                            className={`mt-auto w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                                canAfford 
                                                ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {canAfford ? 'ACHETER' : 'PAS ASSEZ'}
                                            <span className="bg-black/20 px-1.5 rounded ml-1">{badge.price}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* AVATARS TAB */}
                {activeTab === 'AVATARS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {avatarsCatalog.map(avatar => {
                            const isOwned = ownedAvatars.includes(avatar.id);
                            const isSelected = currentAvatarId === avatar.id;
                            const canAfford = coins >= avatar.price;
                            const AvIcon = avatar.icon;

                            return (
                                <div key={avatar.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center transition-all`}>
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center mb-3 shadow-lg relative`}>
                                        <AvIcon size={32} className={avatar.color} />
                                        {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-3">{avatar.name}</h3>
                                    
                                    {isOwned ? (
                                        <button 
                                            onClick={() => selectAvatar(avatar.id)}
                                            disabled={isSelected}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                isSelected 
                                                ? 'bg-green-600/20 text-green-400 cursor-default' 
                                                : 'bg-blue-600 text-white hover:bg-blue-500'
                                            }`}
                                        >
                                            {isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleBuyAvatar(avatar)}
                                            disabled={!canAfford}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                                canAfford 
                                                ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{avatar.price}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* FRAMES TAB */}
                {activeTab === 'FRAMES' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {framesCatalog.map(frame => {
                            const isOwned = ownedFrames.includes(frame.id);
                            const isSelected = currentFrameId === frame.id;
                            const canAfford = coins >= frame.price;
                            
                            // Mock Avatar for preview
                            const PreviewAvatar = avatarsCatalog[0].icon;

                            return (
                                <div key={frame.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-pink-900/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="relative mb-3 pt-1">
                                        <div className={`w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center border-4 ${frame.cssClass}`}>
                                            <PreviewAvatar size={32} className="text-gray-500" />
                                        </div>
                                        {isSelected && <div className="absolute -top-1 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                    </div>
                                    
                                    <h3 className="font-bold text-sm text-white mb-1">{frame.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{frame.description}</p>
                                    
                                    {isOwned ? (
                                        <button 
                                            onClick={() => selectFrame(frame.id)}
                                            disabled={isSelected}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                isSelected 
                                                ? 'bg-green-600/20 text-green-400 cursor-default' 
                                                : 'bg-pink-600 text-white hover:bg-pink-500'
                                            }`}
                                        >
                                            {isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleBuyFrame(frame)}
                                            disabled={!canAfford}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                                canAfford 
                                                ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{frame.price}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* SOLUTIONS TAB */}
                {activeTab === 'SOLUTIONS' && (
                    <div className="space-y-4">
                        <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
                            <Lightbulb className="text-purple-400 shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="font-bold text-purple-300 text-sm mb-1">SOLUTIONS NEON RUSH</h3>
                                <p className="text-xs text-gray-400">Débloquez la solution automatique pour les niveaux difficiles. Une fois achetée, la solution est disponible à vie pour ce niveau.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
                                const levelId = i + 1;
                                const isUnlocked = unlockedSolutions.includes(levelId);
                                const canAfford = coins >= SOLUTION_COST;

                                return (
                                    <div key={levelId} className={`p-3 rounded-xl border flex flex-col items-center justify-between ${isUnlocked ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-800/40 border-white/5'}`}>
                                        <span className="text-xs font-bold text-gray-300 mb-2">NIVEAU {levelId}</span>
                                        {isUnlocked ? (
                                            <div className="text-green-400 text-[10px] font-bold flex items-center gap-1"><Check size={12}/> DÉBLOQUÉ</div>
                                        ) : (
                                            <button 
                                                onClick={() => handleBuySolution(levelId)}
                                                disabled={!canAfford}
                                                className={`w-full py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                                                    canAfford 
                                                    ? 'bg-purple-600 text-white hover:bg-purple-500' 
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {canAfford ? <><Coins size={10}/> {SOLUTION_COST}</> : <Lock size={10}/>}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
