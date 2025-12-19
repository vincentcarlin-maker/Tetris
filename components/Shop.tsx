
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Check, Coins, User, Image, Type, Disc, Pipette, Glasses, X, ChevronRight, LayoutGrid, Star, Palette, Sparkles, UserCircle, Frame, Zap, Flower, Filter, Search } from 'lucide-react';
import { useCurrency, Badge, Avatar, Frame as FrameType, Wallpaper, Title, Mallet, SlitherSkin, SlitherAccessory } from '../hooks/useCurrency';
import { draw3DAccessory } from './slither/SlitherGame';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

const AccessoryCanvasPreview: React.FC<{ accessory: SlitherAccessory }> = ({ accessory }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner une tête de ver factice pour porter l'accessoire
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 10;
        const radius = 25;
        
        const headGrad = ctx.createRadialGradient(centerX - 8, centerY - 8, 2, centerX, centerY, radius);
        headGrad.addColorStop(0, '#fff');
        headGrad.addColorStop(0.3, '#312e81');
        headGrad.addColorStop(1, '#000');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill();
        
        // Dessiner l'accessoire 3D par-dessus
        draw3DAccessory(ctx, centerX, centerY, 0, radius, accessory);
        
    }, [accessory]);

    return (
        <div className="w-24 h-24 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
            <canvas ref={canvasRef} width={100} height={100} className="w-full h-full" />
        </div>
    );
};

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

    const handleBuySlitherSkin = (skin: SlitherSkin) => {
        if (coins >= skin.price && !ownedSlitherSkins.includes(skin.id)) buySlitherSkin(skin.id, skin.price);
    };
    const handleBuySlitherAccessory = (acc: SlitherAccessory) => {
        if (coins >= acc.price && !ownedSlitherAccessories.includes(acc.id)) buySlitherAccessory(acc.id, acc.price);
    };

    const renderSlitherPreview = (skin: SlitherSkin) => {
        const pattern = skin.pattern || 'solid';
        let backgroundStyle = `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`;
        if (pattern === 'rainbow') backgroundStyle = `linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)`;

        return (
            <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 relative overflow-hidden shadow-2xl transition-transform group-hover:scale-110" 
                     style={{ 
                         background: backgroundStyle, 
                         borderColor: 'rgba(255,255,255,0.4)', 
                         boxShadow: `0 0 25px ${skin.glowColor}80` 
                     }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_30%,rgba(0,0,0,0.5)_100%)]"></div>
                    <div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-[1px]"></div>
                </div>
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
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-md">
                    <Coins size={16} className="text-yellow-400" />
                    <span className="font-mono font-black text-yellow-100 text-lg">{coins.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {!activeGroup ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <button onClick={() => setActiveGroup('SLITHER')} className="group relative h-48 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-indigo-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-900/40 to-black"></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-left">
                                <Zap size={32} className="text-indigo-400 mb-3" />
                                <h2 className="text-2xl font-black italic uppercase">Neon Slither</h2>
                                <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">SKINS 3D & ACCESSOIRES PRÉCISION</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                        {activeGroup === 'SLITHER' && (
                            <>
                                <SectionHeader title="Skins Volumétriques" icon={Pipette} color="text-indigo-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {slitherSkinsCatalog.map(skin => {
                                        const isOwned = ownedSlitherSkins.includes(skin.id);
                                        const isSelected = currentSlitherSkinId === skin.id;
                                        return (
                                            <div key={skin.id} className={`p-4 rounded-3xl border flex flex-col items-center transition-all ${isSelected ? 'bg-indigo-900/30 border-indigo-500' : 'bg-gray-800/60 border-white/10'}`}>
                                                <div className="mb-2">{renderSlitherPreview(skin)}</div>
                                                <h3 className="font-black text-xs text-white mb-4 truncate w-full text-center">{skin.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectSlitherSkin(skin.id)} disabled={isSelected} className={`w-full py-2 rounded-2xl text-[10px] font-black ${isSelected ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-indigo-600 text-white'}`}>{isSelected ? 'ACTIF' : 'CHOISIR'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuySlitherSkin(skin)} disabled={coins < skin.price} className={`w-full py-2 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1 ${coins >= skin.price ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-500'}`}>{skin.price} <Coins size={12} /></button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <SectionHeader title="Accessoires 3D Procéduraux" icon={Glasses} color="text-purple-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-24">
                                    {slitherAccessoriesCatalog.map(acc => {
                                        const isOwned = ownedSlitherAccessories.includes(acc.id);
                                        const isSelected = currentSlitherAccessoryId === acc.id;
                                        return (
                                            <div key={acc.id} className={`p-4 rounded-3xl border flex flex-col items-center transition-all ${isSelected ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-800/60 border-white/10'}`}>
                                                <div className="mb-4 group"><AccessoryCanvasPreview accessory={acc} /></div>
                                                <h3 className="font-black text-[11px] text-white mb-4 text-center h-8 flex items-center">{acc.name}</h3>
                                                {isOwned ? (
                                                    <button onClick={() => selectSlitherAccessory(acc.id)} disabled={isSelected} className={`w-full py-2 rounded-2xl text-[10px] font-black ${isSelected ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-purple-600 text-white'}`}>{isSelected ? 'ÉQUIPÉ' : 'ÉQUIPER'}</button>
                                                ) : (
                                                    <button onClick={() => handleBuySlitherAccessory(acc)} disabled={coins < acc.price} className={`w-full py-2 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1 ${coins >= acc.price ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-500'}`}>{acc.price} <Coins size={12} /></button>
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
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
                    <button onClick={() => setActiveGroup(null)} className="px-6 py-3 bg-gray-900 border border-white/20 rounded-full text-xs font-black tracking-widest text-white shadow-2xl backdrop-blur-md">
                        RETOUR AUX CATÉGORIES
                    </button>
                </div>
            )}
        </div>
    );
};
