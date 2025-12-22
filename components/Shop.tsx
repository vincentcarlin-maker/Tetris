
import React, { useState } from 'react';
import { ArrowLeft, Check, Coins, User, Image, Disc, LayoutGrid, Palette, Sparkles, UserCircle, Search, ChevronRight, Glasses, Pipette, X, Star, Flower } from 'lucide-react';
import { useCurrency, Badge, Avatar, Frame as FrameType, Wallpaper, Title, Mallet, SlitherSkin, SlitherAccessory } from '../hooks/useCurrency';
import { useGlobal } from '../context/GlobalContext';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

type ShopGroup = 'PLAYER' | 'SLITHER' | 'AMBIANCE' | 'GEAR' | null;

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { recordTransaction } = useGlobal();
    const { 
        coins, inventory, buyBadge, 
        currentAvatarId, selectAvatar, buyAvatar, ownedAvatars, avatarsCatalog,
        currentFrameId, selectFrame, buyFrame, ownedFrames, framesCatalog,
        currentWallpaperId, selectWallpaper, buyWallpaper, ownedWallpapers, wallpapersCatalog,
        currentTitleId, selectTitle, buyTitle, ownedTitles, titlesCatalog,
        currentMalletId, selectMallet, buyMallet, ownedMallets, malletsCatalog,
        currentSlitherSkinId, selectSlitherSkin, buySlitherSkin, ownedSlitherSkins, slitherSkinsCatalog,
        currentSlitherAccessoryId, selectSlitherAccessory, buySlitherAccessory, ownedSlitherAccessories, slitherAccessoriesCatalog,
    } = currency;

    const [activeGroup, setActiveGroup] = useState<ShopGroup>(null);
    const [slitherFilter, setSlitherFilter] = useState<'ALL' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'>('ALL');
    const [slitherSearch, setSlitherSearch] = useState('');

    const logPurchase = (item: any, category: string) => {
        recordTransaction('PURCHASE', -item.price, `Achat ${category}: ${item.name}`);
    };

    const handleBuyBadge = (badge: Badge) => {
        if (coins >= badge.price && !inventory.includes(badge.id)) { buyBadge(badge.id, badge.price); logPurchase(badge, 'Badge'); }
    };
    const handleBuyAvatar = (avatar: Avatar) => {
        if (coins >= avatar.price && !ownedAvatars.includes(avatar.id)) { buyAvatar(avatar.id, avatar.price); logPurchase(avatar, 'Avatar'); }
    };
    const handleBuyFrame = (frame: FrameType) => {
        if (coins >= frame.price && !ownedFrames.includes(frame.id)) { buyFrame(frame.id, frame.price); logPurchase(frame, 'Cadre'); }
    };
    const handleBuySlitherSkin = (skin: SlitherSkin) => {
        if (coins >= skin.price && !ownedSlitherSkins.includes(skin.id)) { buySlitherSkin(skin.id, skin.price); logPurchase(skin, 'Skin Slither'); }
    };
    const handleBuySlitherAccessory = (acc: SlitherAccessory) => {
        if (coins >= acc.price && !ownedSlitherAccessories.includes(acc.id)) { buySlitherAccessory(acc.id, acc.price); logPurchase(acc, 'Accessoire Slither'); }
    };
    const handleBuyWallpaper = (wp: Wallpaper) => {
        if (coins >= wp.price && !ownedWallpapers.includes(wp.id)) { buyWallpaper(wp.id, wp.price); logPurchase(wp, 'Papier Peint'); }
    };
    const handleBuyTitle = (title: Title) => {
        if (coins >= title.price && !ownedTitles.includes(title.id)) { buyTitle(title.id, title.price); logPurchase(title, 'Titre'); }
    };
    const handleBuyMallet = (mallet: Mallet) => {
        if (coins >= mallet.price && !ownedMallets.includes(mallet.id)) { buyMallet(mallet.id, mallet.price); logPurchase(mallet, 'Maillet'); }
    };

    const renderMalletPreview = (mallet: Mallet) => {
        const bgStyle: React.CSSProperties = {};
        if (mallet.type === 'basic') { bgStyle.backgroundColor = mallet.colors[0]; bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`; } 
        else if (mallet.type === 'gradient' || mallet.type === 'complex') { bgStyle.background = `linear-gradient(135deg, ${mallet.colors.join(', ')})`; bgStyle.boxShadow = `0 0 10px ${mallet.colors[0]}`; }
        return <div className="w-16 h-16 rounded-full border-2 border-white/50 relative shadow-lg overflow-hidden" style={bgStyle}><div className="absolute inset-0 rounded-full border-4 border-black/20"></div></div>;
    };

    const renderSlitherPreview = (skin: SlitherSkin) => {
        return <div className="relative w-24 h-24 flex items-center justify-center"><div className="w-16 h-16 rounded-full border-2 relative overflow-hidden shadow-2xl transition-transform group-hover:scale-110" style={{ background: `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`, borderColor: 'rgba(255,255,255,0.4)', boxShadow: `0 0 25px ${skin.glowColor}80` }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_30%,rgba(0,0,0,0.5)_100%)]"></div><div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-[1px]"></div></div></div>;
    };

    const SectionHeader = ({ title, icon: Icon, color }: any) => (
        <div className="flex items-center gap-3 mb-4 mt-8 first:mt-2"><div className={`p-2 rounded-lg bg-gray-900 border border-white/10 ${color}`}><Icon size={18} /></div><h3 className="font-black italic text-lg uppercase tracking-widest text-white">{title}</h3><div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div></div>
    );

    return (
        <div className="flex flex-col h-full w-full bg-[#05050a] relative overflow-hidden font-sans text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 z-20 shrink-0">
                <div className="flex items-center gap-3"><button onClick={activeGroup ? () => setActiveGroup(null) : onBack} className="p-2.5 bg-gray-800/80 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><ArrowLeft size={20} /></button><div><h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] leading-none">BOUTIQUE</h1><p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] mt-1">{activeGroup ? "EXPLORER" : "CATÉGORIES"}</p></div></div>
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-md"><div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_10px_#eab308]"><Coins size={12} className="text-black" fill="black" /></div><span className="font-mono font-black text-yellow-100 text-lg">{coins.toLocaleString()}</span></div>
            </div>
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {!activeGroup ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={() => setActiveGroup('PLAYER')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-cyan-500/50 hover:scale-[1.02] shadow-2xl"><div className="absolute inset-0 bg-gradient-to-br from-cyan-600/40 via-blue-900/40 to-black"></div><div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left"><User size={32} className="text-cyan-400 mb-3" /><h2 className="text-2xl font-black italic tracking-tight uppercase">Profil</h2><p className="text-xs text-gray-400 font-bold tracking-widest mt-1">AVATARS • CADRES</p></div></button>
                        <button onClick={() => setActiveGroup('SLITHER')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-indigo-500/50 hover:scale-[1.02] shadow-2xl"><div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-900/40 to-black"></div><div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left"><Sparkles size={32} className="text-indigo-400 mb-3" /><h2 className="text-2xl font-black italic tracking-tight uppercase">Cyber Serpent</h2><p className="text-xs text-gray-400 font-bold tracking-widest mt-1">SKINS • ACCESSOIRES</p></div></button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                        {activeGroup === 'SLITHER' && (
                            <>
                                <SectionHeader title="Skins Cyber Serpent" icon={Pipette} color="text-indigo-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {slitherSkinsCatalog.map(skin => {
                                        const isOwned = ownedSlitherSkins.includes(skin.id);
                                        const isSelected = currentSlitherSkinId === skin.id;
                                        const canAfford = coins >= skin.price;
                                        return (
                                            <div key={skin.id} className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group relative overflow-hidden ${isSelected ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'}`}>
                                                <div className="mb-2">{renderSlitherPreview(skin)}</div>
                                                <h3 className="font-black text-xs text-white mb-1 truncate w-full">{skin.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectSlitherSkin(skin.id)} disabled={isSelected} className={`w-full py-2.5 rounded-2xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-indigo-600 text-white shadow-lg'}`}>{isSelected ? 'ACTIF' : 'CHOISIR'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuySlitherSkin(skin)} disabled={!canAfford} className={`w-full py-2.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${canAfford ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{skin.price.toLocaleString()} <Coins size={12} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {activeGroup === 'PLAYER' && (
                            <>
                                <SectionHeader title="Avatars Néon" icon={User} color="text-cyan-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {avatarsCatalog.map(avatar => {
                                        const isOwned = ownedAvatars.includes(avatar.id);
                                        const isSelected = currentAvatarId === avatar.id;
                                        const canAfford = coins >= avatar.price;
                                        return (
                                            <div key={avatar.id} className={`p-3 rounded-2xl border ${isSelected ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center transition-all group`}>
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center mb-3 shadow-lg relative`}>
                                                    {React.createElement(avatar.icon, { size: 32, className: avatar.color })}
                                                    {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                                </div>
                                                <h3 className="font-bold text-xs text-white mb-3 text-center">{avatar.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectAvatar(avatar.id)} disabled={isSelected} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-blue-600 text-white'}`}>{isSelected ? 'ACTIF' : 'CHOISIR'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuyAvatar(avatar)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{avatar.price} <Coins size={10} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {activeGroup === 'GEAR' && (
                            <>
                                <SectionHeader title="Skins Maillets" icon={Disc} color="text-pink-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {malletsCatalog.map(mallet => {
                                        const isOwned = ownedMallets.includes(mallet.id);
                                        const isSelected = currentMalletId === mallet.id;
                                        const canAfford = coins >= mallet.price;
                                        return (
                                            <div key={mallet.id} className={`p-4 rounded-2xl border ${isSelected ? 'bg-pink-900/20 border-pink-500' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all group`}>
                                                <div className="mb-4">{renderMalletPreview(mallet)}</div>
                                                <h3 className="font-bold text-xs text-white mb-1">{mallet.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectMallet(mallet.id)} disabled={isSelected} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400' : 'bg-pink-600 text-white'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuyMallet(mallet)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>{mallet.price} <Coins size={10} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            {activeGroup && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 duration-300"><button onClick={() => setActiveGroup(null)} className="px-6 py-3 bg-gray-900 border border-white/20 rounded-full text-xs font-black tracking-widest text-white shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2 backdrop-blur-md"><LayoutGrid size={14} /> TOUTES LES CATÉGORIES</button></div>}
        </div>
    );
};
