
import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Coins, User, Image, Type, Disc, Pipette, Glasses, X, ChevronRight, LayoutGrid, Star, Palette, Sparkles, UserCircle, Frame, Zap, Flower, Filter, Search } from 'lucide-react';
import { useCurrency, Badge, Avatar, Frame as FrameType, Wallpaper, Title, Mallet, SlitherSkin, SlitherAccessory } from '../hooks/useCurrency';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

type ShopGroup = 'PLAYER' | 'SLITHER' | 'AMBIANCE' | 'GEAR' | null;

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

    const [activeGroup, setActiveGroup] = useState<ShopGroup>(null);
    const [slitherFilter, setSlitherFilter] = useState<'ALL' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'>('ALL');
    const [slitherSearch, setSlitherSearch] = useState('');

    // --- ACTIONS D'ACHAT ---
    const handleBuyBadge = (badge: Badge) => {
        if (coins >= badge.price && !inventory.includes(badge.id)) buyBadge(badge.id, badge.price);
    };
    const handleBuyAvatar = (avatar: Avatar) => {
        if (coins >= avatar.price && !ownedAvatars.includes(avatar.id)) buyAvatar(avatar.id, avatar.price);
    };
    const handleBuyFrame = (frame: FrameType) => {
        if (coins >= frame.price && !ownedFrames.includes(frame.id)) buyFrame(frame.id, frame.price);
    };
    const handleBuySlitherSkin = (skin: SlitherSkin) => {
        if (coins >= skin.price && !ownedSlitherSkins.includes(skin.id)) buySlitherSkin(skin.id, skin.price);
    };
    const handleBuySlitherAccessory = (acc: SlitherAccessory) => {
        if (coins >= acc.price && !ownedSlitherAccessories.includes(acc.id)) buySlitherAccessory(acc.id, acc.price);
    };
    const handleBuyWallpaper = (wp: Wallpaper) => {
        if (coins >= wp.price && !ownedWallpapers.includes(wp.id)) buyWallpaper(wp.id, wp.price);
    };
    const handleBuyTitle = (title: Title) => {
        if (coins >= title.price && !ownedTitles.includes(title.id)) buyTitle(title.id, title.price);
    };
    const handleBuyMallet = (mallet: Mallet) => {
        if (coins >= mallet.price && !ownedMallets.includes(mallet.id)) buyMallet(mallet.id, mallet.price);
    };

    // --- RENDUS DE PRÉVISUALISATION ---
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
            <div className="w-16 h-16 rounded-full border-2 border-white/50 relative shadow-lg overflow-hidden" style={bgStyle}>
                <div className="absolute inset-0 rounded-full border-4 border-black/20"></div>
            </div>
        );
    };

    const renderSlitherPreview = (skin: SlitherSkin) => {
        const pattern = skin.pattern || 'solid';
        let backgroundStyle = `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`;
        
        if (pattern === 'stripes') backgroundStyle = `repeating-linear-gradient(90deg, ${skin.primaryColor}, ${skin.primaryColor} 10px, ${skin.secondaryColor} 10px, ${skin.secondaryColor} 20px)`;
        else if (pattern === 'dots') backgroundStyle = `radial-gradient(${skin.secondaryColor} 20%, transparent 20%), radial-gradient(${skin.secondaryColor} 20%, ${skin.primaryColor} 20%)`;
        else if (pattern === 'checker') backgroundStyle = `conic-gradient(${skin.primaryColor} 90deg, ${skin.secondaryColor} 90deg 180deg, ${skin.primaryColor} 180deg 270deg, ${skin.secondaryColor} 270deg)`;
        else if (pattern === 'rainbow') backgroundStyle = `linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)`;
        else if (pattern === 'grid') backgroundStyle = `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), ${skin.secondaryColor}`;

        return (
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* 3D Orb Effect Layers */}
                <div className="w-16 h-16 rounded-full border-2 relative overflow-hidden shadow-2xl transition-transform group-hover:scale-110" 
                     style={{ 
                         background: backgroundStyle, 
                         backgroundSize: pattern === 'dots' ? '10px 10px' : (pattern === 'checker' ? '12px 12px' : (pattern === 'grid' ? '8px 8px' : 'auto')), 
                         borderColor: 'rgba(255,255,255,0.4)', 
                         boxShadow: `0 0 25px ${skin.glowColor}80` 
                     }}>
                    {/* Shadow Layer for depth */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_30%,rgba(0,0,0,0.5)_100%)]"></div>
                    {/* Inner highlight (3D shine) */}
                    <div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-[1px]"></div>
                </div>
            </div>
        );
    };

    const renderAccessoryPreview = (acc: SlitherAccessory) => {
        const type = acc.type;
        const color = acc.color;

        return (
            <div className="w-16 h-16 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                {type === 'CROWN' && <div className="w-10 h-8 rounded-sm relative shadow-lg" style={{backgroundColor: color, boxShadow: `0 0 10px ${color}`}}><div className="absolute -top-2 left-0 w-3 h-3" style={{backgroundColor: color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div><div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3" style={{backgroundColor: color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div><div className="absolute -top-2 right-0 w-3 h-3" style={{backgroundColor: color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div></div>}
                {type === 'TIARA' && <div className="w-10 h-6 border-2 rounded-t-full relative" style={{borderColor: color, boxShadow: `0 0 10px ${color}`}}><div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div></div>}
                {type === 'HAT' && <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-t-sm shadow-md" style={{backgroundColor: color}}></div><div className="w-12 h-1.5 bg-gray-700 rounded-full"></div></div>}
                {type === 'CAP' && <div className="flex flex-col items-center"><div className="w-8 h-6 rounded-t-full" style={{backgroundColor: color}}></div><div className="w-10 h-1 bg-white/20 rounded-full"></div></div>}
                {type === 'GLASSES' && <div className="flex gap-1 items-center"><div className="w-6 h-4 rounded-sm shadow-md" style={{backgroundColor: color, opacity: 0.7}}></div><div className="w-2 h-0.5 bg-white"></div><div className="w-6 h-4 rounded-sm shadow-md" style={{backgroundColor: color, opacity: 0.7}}></div></div>}
                {type === 'NINJA' && <div className="w-12 h-3 rounded-full flex items-center justify-center shadow-md" style={{backgroundColor: color}}><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                {type === 'VIKING' && <div className="relative"><div className="w-10 h-6 bg-slate-400 rounded-t-full shadow-md"></div><div className="absolute -top-3 -left-2 w-4 h-6 bg-white rounded-tr-full transform -rotate-45"></div><div className="absolute -top-3 -right-2 w-4 h-6 bg-white rounded-tl-full transform rotate(45deg)"></div></div>}
                {type === 'HALO' && <div className="w-10 h-3 border-2 rounded-full animate-pulse" style={{borderColor: color, boxShadow: `0 0 10px ${color}`}}></div>}
                {type === 'HORNS' && <div className="flex gap-4"><div className="w-2 h-6 rounded-t-full transform -rotate-12" style={{backgroundColor: color}}></div><div className="w-2 h-6 rounded-t-full transform rotate(12)" style={{backgroundColor: color}}></div></div>}
                {type === 'CAT_EARS' && <div className="flex gap-4"><div className="w-4 h-4" style={{backgroundColor: color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div><div className="w-4 h-4" style={{backgroundColor: color, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div></div>}
                {type === 'MOUSTACHE' && <div className="flex gap-1"><div className="w-5 h-2 rounded-full" style={{backgroundColor: color}}></div><div className="w-5 h-2 rounded-full" style={{backgroundColor: color}}></div></div>}
                {type === 'STAR' && <Star size={32} style={{color: color, filter: `drop-shadow(0 0 8px ${color})`}} fill="currentColor" />}
                {type === 'FLOWER' && <Flower size={32} style={{color: color}} fill="currentColor" />}
                {type === 'ROBOT' && <div className="flex flex-col items-center"><div className="w-1 h-6 bg-gray-400"></div><div className="w-3 h-3 rounded-full" style={{backgroundColor: color, boxShadow: `0 0 10px ${color}`}}></div ></div>}
                {type === 'HERO' && <div className="w-12 h-4 rounded-md border" style={{backgroundColor: color, borderColor: 'white'}}></div>}
                {acc.id === 'sa_none' && <X className="text-gray-600" size={32} />}
            </div>
        );
    };

    const SectionHeader = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
        <div className={`flex items-center gap-3 mb-4 mt-8 first:mt-2`}>
            <div className={`p-2 rounded-lg bg-gray-900 border border-white/10 ${color}`}>
                <Icon size={18} />
            </div>
            <h3 className="font-black italic text-lg uppercase tracking-widest text-white">{title}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
    );

    const filteredSlitherSkins = slitherSkinsCatalog.filter(skin => {
        if (slitherFilter !== 'ALL' && skin.rarity !== slitherFilter) return false;
        if (slitherSearch && !skin.name.toLowerCase().includes(slitherSearch.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex flex-col h-full w-full bg-[#05050a] relative overflow-hidden font-sans text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={activeGroup ? () => setActiveGroup(null) : onBack} className="p-2.5 bg-gray-800/80 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] leading-none">BOUTIQUE</h1>
                        <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] mt-1">{activeGroup ? "EXPLORER LA COLLECTION" : "CATÉGORIES PREMIUM"}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-md">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_10px_#eab308]">
                        <Coins size={12} className="text-black" fill="black" />
                    </div>
                    <span className="font-mono font-black text-yellow-100 text-lg">{coins.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {!activeGroup ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={() => setActiveGroup('PLAYER')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-cyan-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/40 via-blue-900/40 to-black"></div>
                            <div className="absolute top-0 right-0 p-8 text-white/5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><UserCircle size={140} /></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                                <User size={32} className="text-cyan-400 mb-3 drop-shadow-[0_0_10px_#22d3ee]" />
                                <h2 className="text-2xl font-black italic tracking-tight">PROFIL</h2>
                                <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">AVATARS • CADRES • TITRES</p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"><ChevronRight size={24} className="text-cyan-400" /></div>
                        </button>

                        <button onClick={() => setActiveGroup('SLITHER')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-indigo-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-900/40 to-black"></div>
                            <div className="absolute top-0 right-0 p-8 text-white/5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><Zap size={140} /></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                                <Sparkles size={32} className="text-indigo-400 mb-3 drop-shadow-[0_0_10px_#818cf8]" />
                                <h2 className="text-2xl font-black italic tracking-tight uppercase">CYBER SERPENT</h2>
                                <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">50+ SKINS 3D • ACCESSOIRES</p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"><ChevronRight size={24} className="text-indigo-400" /></div>
                        </button>

                        <button onClick={() => setActiveGroup('AMBIANCE')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-emerald-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/40 via-green-900/40 to-black"></div>
                            <div className="absolute top-0 right-0 p-8 text-white/5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><Image size={140} /></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                                <Palette size={32} className="text-emerald-400 mb-3 drop-shadow-[0_0_10px_#10b981]" />
                                <h2 className="text-2xl font-black italic tracking-tight uppercase">Ambiance</h2>
                                <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">FONDS D'ÉCRAN DYNAMIQUES</p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"><ChevronRight size={24} className="text-emerald-400" /></div>
                        </button>

                        <button onClick={() => setActiveGroup('GEAR')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-pink-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-rose-900/40 to-black"></div>
                            <div className="absolute top-0 right-0 p-8 text-white/5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><Disc size={140} /></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                                <LayoutGrid size={32} className="text-pink-400 mb-3 drop-shadow-[0_0_10px_#f43f5e]" />
                                <h2 className="text-2xl font-black italic tracking-tight uppercase">Équipement</h2>
                                <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">MAILLETS • OUTILS DE JEU</p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all"><ChevronRight size={24} className="text-pink-400" /></div>
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                        {activeGroup === 'SLITHER' && (
                            <>
                                <SectionHeader title="Skins 3D Volumétriques" icon={Pipette} color="text-indigo-400" />
                                
                                {/* Filters for Slither */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-gray-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <div className="relative flex-1">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher un skin..." 
                                            value={slitherSearch}
                                            onChange={e => setSlitherSearch(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                        {(['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const).map(f => (
                                            <button 
                                                key={f} 
                                                onClick={() => setSlitherFilter(f)}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${slitherFilter === f ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-black/40 text-gray-500 border-white/5 hover:text-white'}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {filteredSlitherSkins.map(skin => {
                                        const isOwned = ownedSlitherSkins.includes(skin.id);
                                        const isSelected = currentSlitherSkinId === skin.id;
                                        const canAfford = coins >= skin.price;
                                        
                                        const rarityColor = 
                                            skin.rarity === 'LEGENDARY' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20' :
                                            skin.rarity === 'EPIC' ? 'text-purple-400 border-purple-500/50 bg-purple-900/20' :
                                            skin.rarity === 'RARE' ? 'text-blue-400 border-blue-500/50 bg-blue-900/20' :
                                            'text-gray-400 border-white/10 bg-gray-900/40';

                                        return (
                                            <div key={skin.id} className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group relative overflow-hidden ${isSelected ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : isOwned ? 'bg-gray-800/60 border-white/10 hover:bg-gray-700/60' : 'bg-gray-900/60 border-white/5'}`}>
                                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full border text-[8px] font-black ${rarityColor}`}>{skin.rarity}</div>
                                                <div className="mb-2">{renderSlitherPreview(skin)}</div>
                                                <h3 className="font-black text-xs text-white mb-1 truncate w-full">{skin.name}</h3>
                                                <p className="text-[9px] text-gray-500 mb-4 h-6 line-clamp-2 leading-tight px-1">{skin.description}</p>
                                                
                                                {isOwned ? (
                                                    <button onClick={() => selectSlitherSkin(skin.id)} disabled={isSelected} className={`w-full py-2.5 rounded-2xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'}`}>{isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuySlitherSkin(skin)} disabled={!canAfford} className={`w-full py-2.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{skin.price.toLocaleString()} <Coins size={12} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {filteredSlitherSkins.length === 0 && (
                                    <div className="p-12 text-center text-gray-600 italic border-2 border-dashed border-white/5 rounded-3xl">Aucun skin trouvé dans cette catégorie.</div>
                                )}

                                <SectionHeader title="Accessoires de Tête" icon={Glasses} color="text-purple-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-24">
                                    {slitherAccessoriesCatalog.map(acc => {
                                        const isOwned = ownedSlitherAccessories.includes(acc.id);
                                        const isSelected = currentSlitherAccessoryId === acc.id;
                                        const canAfford = coins >= acc.price;
                                        return (
                                            <div key={acc.id} className={`p-4 rounded-3xl border ${isSelected ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all group`}>
                                                <div className="mb-4 transition-transform group-hover:scale-110">{renderAccessoryPreview(acc)}</div>
                                                <h3 className="font-black text-[11px] text-white mb-3 h-8 line-clamp-2 leading-tight">{acc.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectSlitherAccessory(acc.id)} disabled={isSelected} className={`w-full py-2.5 rounded-2xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-default' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuySlitherAccessory(acc)} disabled={!canAfford} className={`w-full py-2.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{acc.price.toLocaleString()} <Coins size={12} /></button>
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
                                        const AvIcon = avatar.icon;
                                        return (
                                            <div key={avatar.id} className={`p-3 rounded-2xl border ${isSelected ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center transition-all group`}>
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center mb-3 shadow-lg relative transition-transform group-hover:scale-105`}>
                                                    <AvIcon size={32} className={avatar.color} />
                                                    {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black"><Check size={14} strokeWidth={4} /></div>}
                                                </div>
                                                <h3 className="font-bold text-xs text-white mb-3 text-center">{avatar.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectAvatar(avatar.id)} disabled={isSelected} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>{isSelected ? 'SÉLECTIONNÉ' : 'CHOISIR'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuyAvatar(avatar)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{avatar.price} <Coins size={10} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {activeGroup === 'AMBIANCE' && (
                            <>
                                <SectionHeader title="Fonds d'Écran" icon={Image} color="text-emerald-400" />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {wallpapersCatalog.map(wp => {
                                        const isOwned = ownedWallpapers.includes(wp.id);
                                        const isSelected = currentWallpaperId === wp.id;
                                        const canAfford = coins >= wp.price;
                                        return (
                                            <div key={wp.id} className={`p-4 rounded-3xl border ${isSelected ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all group`}>
                                                <div className="w-full h-32 rounded-2xl mb-4 border border-white/10 relative overflow-hidden transition-transform group-hover:scale-[1.03]">
                                                    <div className="absolute inset-0" style={{ background: wp.cssValue, backgroundSize: wp.bgSize || 'cover', backgroundPosition: 'center' }}></div>
                                                    {isSelected && <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black shadow-lg"><Check size={16} strokeWidth={4} /></div>}
                                                </div>
                                                <h3 className="font-bold text-sm text-white mb-1">{wp.name}</h3>
                                                <p className="text-[10px] text-gray-500 mb-4 h-8 px-2 line-clamp-2">{wp.description}</p>
                                                {isOwned ? (
                                                    <button onClick={() => selectWallpaper(wp.id)} disabled={isSelected} className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'}`}>{isSelected ? 'ACTIF' : 'ACTIVER'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuyWallpaper(wp)} disabled={!canAfford} className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{wp.price} <Coins size={14} /></button>
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
                                            <div key={mallet.id} className={`p-4 rounded-2xl border ${isSelected ? 'bg-pink-900/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'} flex flex-col items-center text-center transition-all group`}>
                                                <div className="mb-4 transition-transform group-hover:rotate-12 group-hover:scale-110">{renderMalletPreview(mallet)}</div>
                                                <h3 className="font-bold text-xs text-white mb-1">{mallet.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectMallet(mallet.id)} disabled={isSelected} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${isSelected ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-pink-600 text-white hover:bg-pink-500'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuyMallet(mallet)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${canAfford ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{mallet.price} <Coins size={10} /></button>
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

            {activeGroup && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 duration-300">
                    <button onClick={() => setActiveGroup(null)} className="px-6 py-3 bg-gray-900 border border-white/20 rounded-full text-xs font-black tracking-widest text-white shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2 backdrop-blur-md">
                        <LayoutGrid size={14} /> VOIR TOUTES LES CATÉGORIES
                    </button>
                </div>
            )}
        </div>
    );
};
