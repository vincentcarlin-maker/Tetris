import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Coins, Shield, User, Circle, ShoppingBag, Frame, Image, Type, Disc, Pipette, Glasses, X } from 'lucide-react';
import { useCurrency, Badge, Avatar, Frame as FrameType, Wallpaper, Title, Mallet, SlitherSkin, SlitherAccessory } from '../hooks/useCurrency';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { 
        coins, inventory, buyBadge, catalog, 
        currentAvatarId, selectAvatar, buyAvatar, ownedAvatars, avatarsCatalog,
        currentFrameId, selectFrame, buyFrame, ownedFrames, framesCatalog,
        currentWallpaperId, selectWallpaper, buyWallpaper, ownedWallpapers, wallpapersCatalog,
        currentTitleId, selectTitle, buyTitle, ownedTitles, titlesCatalog,
        currentMalletId, selectMallet, buyMallet, ownedMallets, malletsCatalog,
        currentSlitherSkinId, selectSlitherSkin, buySlitherSkin, ownedSlitherSkins, slitherSkinsCatalog,
        currentSlitherAccessoryId, selectSlitherAccessory, buySlitherAccessory, ownedSlitherAccessories, slitherAccessoriesCatalog,
    } = currency;

    const [activeTab, setActiveTab] = useState<'BADGES' | 'AVATARS' | 'FRAMES' | 'SLITHER' | 'ACCESSORIES' | 'WALLPAPERS' | 'TITLES' | 'MALLETS'>('BADGES');

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

    const handleBuySlitherSkin = (skin: SlitherSkin) => {
        if (coins >= skin.price && !ownedSlitherSkins.includes(skin.id)) {
            buySlitherSkin(skin.id, skin.price);
        }
    };

    const handleBuySlitherAccessory = (acc: SlitherAccessory) => {
        if (coins >= acc.price && !ownedSlitherAccessories.includes(acc.id)) {
            buySlitherAccessory(acc.id, acc.price);
        }
    };

    const handleBuyWallpaper = (wp: Wallpaper) => {
        if (coins >= wp.price && !ownedWallpapers.includes(wp.id)) {
            buyWallpaper(wp.id, wp.price);
        }
    };

    const handleBuyTitle = (title: Title) => {
        if (coins >= title.price && !ownedTitles.includes(title.id)) {
            buyTitle(title.id, title.price);
        }
    };

    const handleBuyMallet = (mallet: Mallet) => {
        if (coins >= mallet.price && !ownedMallets.includes(mallet.id)) {
            buyMallet(mallet.id, mallet.price);
        }
    };

    const renderMalletPreview = (mallet: Mallet) => {
        const bgStyle: React.CSSProperties = {};
        if (mallet.type === 'basic') {
            bgStyle.backgroundColor = mallet.colors[0];
            bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`;
        } else if (mallet.type === 'gradient' || mallet.type === 'complex') {
            bgStyle.background = `linear-gradient(135deg, ${mallet.colors.join(', ')})`;
            bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`;
        } else if (mallet.type === 'target') {
            bgStyle.background = `repeating-radial-gradient(${mallet.colors[0]}, ${mallet.colors[0]} 5px, ${mallet.colors[1]} 5px, ${mallet.colors[1]} 10px)`;
            bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`;
        } else if (mallet.type === 'flower') {
            bgStyle.background = `radial-gradient(circle, ${mallet.colors[1]} 20%, ${mallet.colors[0]} 20%, ${mallet.colors[0]} 100%)`;
            bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`;
        }
        return (
            <div className="w-16 h-16 rounded-full border-2 border-white/50 relative shadow-lg" style={bgStyle}>
                <div className="absolute inset-0 rounded-full border-4 border-black/20"></div>
            </div>
        );
    };

    const renderSlitherPreview = (skin: SlitherSkin) => {
        const pattern = skin.pattern || 'solid';
        let backgroundStyle = `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`;
        
        if (pattern === 'stripes') {
            backgroundStyle = `repeating-linear-gradient(90deg, ${skin.primaryColor}, ${skin.primaryColor} 10px, ${skin.secondaryColor} 10px, ${skin.secondaryColor} 20px)`;
        } else if (pattern === 'dots') {
            backgroundStyle = `radial-gradient(${skin.secondaryColor} 20%, transparent 20%), radial-gradient(${skin.secondaryColor} 20%, ${skin.primaryColor} 20%)`;
        } else if (pattern === 'checker') {
            backgroundStyle = `conic-gradient(${skin.primaryColor} 90deg, ${skin.secondaryColor} 90deg 180deg, ${skin.primaryColor} 180deg 270deg, ${skin.secondaryColor} 270deg)`;
        } else if (pattern === 'rainbow') {
            backgroundStyle = `linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)`;
        } else if (pattern === 'grid') {
            backgroundStyle = `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), ${skin.secondaryColor}`;
        }

        return (
            <div className="relative w-24 h-12 flex items-center justify-center">
                <div 
                    className="w-20 h-6 rounded-full border-2 shadow-lg overflow-hidden"
                    style={{ 
                        background: backgroundStyle,
                        backgroundSize: pattern === 'dots' ? '10px 10px' : (pattern === 'checker' ? '12px 12px' : (pattern === 'grid' ? '8px 8px' : 'auto')),
                        borderColor: 'rgba(255,255,255,0.3)',
                        boxShadow: `0 0 15px ${skin.glowColor}`
                    }}
                >
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-60"></div>
                </div>
            </div>
        );
    };

    const renderAccessoryPreview = (acc: SlitherAccessory) => {
        return (
            <div className="w-16 h-16 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                {acc.type === 'CROWN' && <div className="w-10 h-8 bg-yellow-400 rounded-sm relative shadow-[0_0_10px_#facc15]">
                    <div className="absolute -top-2 left-0 w-3 h-3 bg-yellow-400" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                    <div className="absolute -top-2 right-0 w-3 h-3 bg-yellow-400" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                </div>}
                {acc.type === 'HAT' && acc.id !== 'sa_none' && <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-white rounded-t-sm shadow-[0_0_10px_white]"></div>
                    <div className="w-12 h-1.5 bg-white rounded-full"></div>
                </div>}
                {acc.type === 'GLASSES' && <div className="flex gap-1 items-center">
                    <div className="w-6 h-4 bg-cyan-400 rounded-sm shadow-[0_0_8px_#22d3ee] border border-white/40"></div>
                    <div className="w-2 h-0.5 bg-white"></div>
                    <div className="w-6 h-4 bg-cyan-400 rounded-sm shadow-[0_0_8px_#22d3ee] border border-white/40"></div>
                </div>}
                {acc.type === 'NINJA' && <div className="w-12 h-3 bg-red-600 rounded-full shadow-[0_0_10px_#ef4444] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>}
                {acc.type === 'VIKING' && <div className="relative">
                    <div className="w-10 h-6 bg-slate-400 rounded-t-full shadow-[0_0_10px_#94a3b8]"></div>
                    <div className="absolute -top-3 -left-2 w-4 h-6 bg-white rounded-tr-full transform -rotate-45"></div>
                    <div className="absolute -top-3 -right-2 w-4 h-6 bg-white rounded-tl-full transform rotate(45deg)"></div>
                </div>}
                {acc.id === 'sa_none' && <X className="text-gray-600" size={32} />}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-black/20 relative overflow-hidden font-sans text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between p-4 z-10 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)] pr-2 py-1">BOUTIQUE</h1>
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    <Coins size={16} className="text-yellow-400" />
                    <span className="font-mono font-bold text-yellow-100">{coins}</span>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-auto px-4 z-10 shrink-0 mb-4">
                <div className="flex bg-gray-900/80 rounded-xl border border-white/10 p-1 backdrop-blur-md overflow-x-auto no-scrollbar gap-1">
                    <button onClick={() => setActiveTab('BADGES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'BADGES' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>BADGES</button>
                    <button onClick={() => setActiveTab('AVATARS')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'AVATARS' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>AVATARS</button>
                    <button onClick={() => setActiveTab('FRAMES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'FRAMES' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>CADRES</button>
                    <button onClick={() => setActiveTab('SLITHER')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'SLITHER' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>COULEURS</button>
                    <button onClick={() => setActiveTab('ACCESSORIES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'ACCESSORIES' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>ACCESSOIRES</button>
                    <button onClick={() => setActiveTab('WALLPAPERS')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'WALLPAPERS' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>FONDS</button>
                    <button onClick={() => setActiveTab('TITLES')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'TITLES' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>TITRES</button>
                    <button onClick={() => setActiveTab('MALLETS')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'MALLETS' ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>MAILLETS</button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-2xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
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
                                        <div className="mt-auto px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-bold flex items-center gap-1"><Check size={12} /> POSSÉDÉ</div>
                                    ) : (
                                        <button onClick={() => handleBuyBadge(badge)} disabled={!canAfford} className={`mt-auto w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                                            {canAfford ? 'ACHETER' : 'PAS ASSEZ'}
                                            <span className="bg-black/20 px-1.5 rounded ml-1">{badge.price}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
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
                                        <button onClick={() => selectAvatar(avatar.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>{isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}</button>
                                    ) : (
                                        <button onClick={() => handleBuyAvatar(avatar)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{avatar.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'FRAMES' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {framesCatalog.map(frame => {
                            const isOwned = ownedFrames.includes(frame.id);
                            const isSelected = currentFrameId === frame.id;
                            const canAfford = coins >= frame.price;
                            const PreviewAvatar = avatarsCatalog[0].icon;
                            return (
                                <div key={frame.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-pink-900/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="relative mb-3 pt-1">
                                        <div className={`w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center border-4 ${frame.cssClass}`}><PreviewAvatar size={32} className="text-gray-500" /></div>
                                        {isSelected && <div className="absolute -top-1 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-1">{frame.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{frame.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectFrame(frame.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-pink-600 text-white hover:bg-pink-500'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                    ) : (
                                        <button onClick={() => handleBuyFrame(frame)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{frame.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'SLITHER' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {slitherSkinsCatalog.map(skin => {
                            const isOwned = ownedSlitherSkins.includes(skin.id);
                            const isSelected = currentSlitherSkinId === skin.id;
                            const canAfford = coins >= skin.price;
                            return (
                                <div key={skin.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="mb-3">
                                        {renderSlitherPreview(skin)}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-1">{skin.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{skin.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectSlitherSkin(skin.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                    ) : (
                                        <button onClick={() => handleBuySlitherSkin(skin)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{skin.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'ACCESSORIES' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {slitherAccessoriesCatalog.map(acc => {
                            const isOwned = ownedSlitherAccessories.includes(acc.id);
                            const isSelected = currentSlitherAccessoryId === acc.id;
                            const canAfford = coins >= acc.price;
                            return (
                                <div key={acc.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="mb-3">
                                        {renderAccessoryPreview(acc)}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-1">{acc.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{acc.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectSlitherAccessory(acc.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-orange-600 text-white hover:bg-orange-500'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                    ) : (
                                        <button onClick={() => handleBuySlitherAccessory(acc)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{acc.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'WALLPAPERS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {wallpapersCatalog.map(wp => {
                            const isOwned = ownedWallpapers.includes(wp.id);
                            const isSelected = currentWallpaperId === wp.id;
                            const canAfford = coins >= wp.price;
                            return (
                                <div key={wp.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="w-full h-20 rounded-lg mb-3 border border-white/20 relative overflow-hidden">
                                        <div className="absolute inset-0" style={{ background: wp.cssValue, backgroundSize: wp.bgSize || 'cover', backgroundPosition: 'center' }}></div>
                                        {isSelected && <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full border border-black flex items-center justify-center text-black"><Check size={12} strokeWidth={4} /></div>}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-1">{wp.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{wp.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectWallpaper(wp.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-green-600 text-white hover:bg-green-500'}`}>{isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}</button>
                                    ) : (
                                        <button onClick={() => handleBuyWallpaper(wp)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{wp.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'TITLES' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {titlesCatalog.map(title => {
                            const isOwned = ownedTitles.includes(title.id);
                            const isSelected = currentTitleId === title.id;
                            const canAfford = coins >= title.price;
                            return (
                                <div key={title.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-orange-900/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="h-12 w-full flex items-center justify-center mb-2 bg-black/40 rounded-lg border border-white/5"><span className={`font-black text-sm uppercase tracking-widest ${title.color}`}>{title.name || '(Aucun)'}</span></div>
                                    <h3 className="font-bold text-sm text-white mb-1">Titre : {title.name || 'Vide'}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{title.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectTitle(title.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-orange-500 text-white hover:bg-orange-400'}`}>{isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}</button>
                                    ) : (
                                        <button onClick={() => handleBuyTitle(title)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{title.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'MALLETS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {malletsCatalog.map(mallet => {
                            const isOwned = ownedMallets.includes(mallet.id);
                            const isSelected = currentMalletId === mallet.id;
                            const canAfford = coins >= mallet.price;
                            return (
                                <div key={mallet.id} className={`p-3 rounded-xl border ${isSelected ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all`}>
                                    <div className="mb-3 relative">
                                        {renderMalletPreview(mallet)}
                                        {isSelected && <div className="absolute -top-1 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                    </div>
                                    <h3 className="font-bold text-sm text-white mb-1">{mallet.name}</h3>
                                    <p className="text-[10px] text-gray-500 mb-3 leading-tight px-2 h-8">{mallet.description}</p>
                                    {isOwned ? (
                                        <button onClick={() => selectMallet(mallet.id)} disabled={isSelected} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                    ) : (
                                        <button onClick={() => handleBuyMallet(mallet)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>ACHETER <span className="bg-black/20 px-1.5 rounded ml-1">{mallet.price}</span></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};