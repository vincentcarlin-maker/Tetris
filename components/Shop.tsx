import React, { useState } from 'react';
import { ArrowLeft, Check, Coins, User, Disc, LayoutGrid, Palette, Sparkles, UserCircle, Type, Map, Pipette, Glasses, Crosshair, Flag, X } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { useGlobal } from '../context/GlobalContext';

interface ShopProps {
    onBack: () => void;
    currency: ReturnType<typeof useCurrency>;
}

type ShopGroup = 'PLAYER' | 'SLITHER' | 'ARENA' | 'AMBIANCE' | 'GEAR' | null;

export const Shop: React.FC<ShopProps> = ({ onBack, currency }) => {
    const { recordTransaction, syncDataWithCloud } = useGlobal();
    const { 
        coins, currentAvatarId, selectAvatar, buyAvatar, ownedAvatars, avatarsCatalog,
        currentFrameId, selectFrame, buyFrame, ownedFrames, framesCatalog,
        currentWallpaperId, selectWallpaper, buyWallpaper, ownedWallpapers, wallpapersCatalog,
        currentTitleId, selectTitle, buyTitle, ownedTitles, titlesCatalog,
        currentMalletId, selectMallet, buyMallet, ownedMallets, malletsCatalog,
        currentSlitherSkinId, selectSlitherSkin, buySlitherSkin, ownedSlitherSkins, slitherSkinsCatalog,
        currentSlitherAccessoryId, selectSlitherAccessory, buySlitherAccessory, ownedSlitherAccessories, slitherAccessoriesCatalog,
        currentTankId, selectTank, buyTank, ownedTanks, tanksCatalog,
        currentTankAccessoryId, selectTankAccessory, buyTankAccessory, ownedTankAccessories, tankAccessoriesCatalog
    } = currency;

    const [activeGroup, setActiveGroup] = useState<ShopGroup>(null);

    const handleBuyItem = async (item: any, category: string, buyFn: (id: string, price: number) => void, ownedList: string[]) => {
        if (coins >= item.price && !ownedList.includes(item.id)) {
            buyFn(item.id, item.price);
            recordTransaction('PURCHASE', -item.price, `Achat ${category}: ${item.name}`);
            await syncDataWithCloud();
        }
    };

    const getGroupLabel = (group: ShopGroup) => {
        switch(group) {
            case 'PLAYER': return 'Identité';
            case 'SLITHER': return 'Cyber Serpent';
            case 'ARENA': return 'Arena Clash';
            case 'AMBIANCE': return 'Atmosphère';
            case 'GEAR': return 'Air Hockey';
            default: return 'CATÉGORIES';
        }
    };

    const SectionHeader = ({ title, icon: Icon, color }: any) => (
        <div className="flex items-center gap-3 mb-4 mt-8 first:mt-2">
            <div className={`p-2 rounded-lg bg-gray-900 border border-white/10 ${color}`}><Icon size={18} /></div>
            <h3 className="font-black italic text-lg uppercase tracking-widest text-white">{title}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
    );

    const ItemCard = ({ item, isOwned, isSelected, onBuy, onSelect, colorClass, category }: any) => {
        const canAfford = coins >= item.price;
        
        const renderPreview = () => {
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
                        <AccessoryIcon 
                            size={32} 
                            style={{ color: item.color, filter: `drop-shadow(0 0 8px ${item.color})` }}
                            className="relative z-10 transform group-hover:scale-110 transition-transform" 
                        />
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
                if (item.svg) {
                    return (
                        <div className="flex border border-white/20 w-14 h-9 rounded-sm overflow-hidden shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
                            <img src={`data:image/svg+xml;base64,${item.svg}`} alt={item.name} className="w-full h-full object-cover bg-gray-700" />
                        </div>
                    );
                }
                return (
                    <div className="flex border border-white/20 w-14 h-9 rounded-sm overflow-hidden shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
                        {item.colors.map((c: string, idx: number) => (
                            <div key={idx} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                        ))}
                    </div>
                );
            }
            return null;
        };

        return (
            <div className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group relative overflow-hidden ${isSelected ? `bg-${colorClass}-900/30 border-${colorClass}-500 shadow-[0_0_30px_rgba(var(--neon-accent-rgb),0.3)]` : isOwned ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'}`}>
                <div className="mb-3 h-16 flex items-center justify-center">{renderPreview()}</div>
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

    return (
        <div className="flex flex-col h-full w-full bg-[#05050a] relative overflow-hidden font-sans text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={activeGroup ? () => setActiveGroup(null) : onBack} className="p-2.5 bg-gray-800/80 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] leading-none">BOUTIQUE</h1>
                        <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] mt-1 uppercase">{getGroupLabel(activeGroup)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-md">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_10px_#eab308]"><Coins size={12} className="text-black" fill="black" /></div>
                    <span className="font-mono font-black text-yellow-100 text-lg">{coins.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-24 overflow-y-auto custom-scrollbar z-10">
                {!activeGroup ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={() => setActiveGroup('PLAYER')} className="group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-cyan-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/40 via-blue-900/40 to-black"></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left"><User size={32} className="text-cyan-400 mb-3" /><h2 className="text-xl font-black italic tracking-tight uppercase">Identité</h2><p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">AVATARS • CADRES • TITRES</p></div>
                        </button>
                        <button onClick={() => setActiveGroup('ARENA')} className="group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-red-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/40 via-orange-900/40 to-black"></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left"><Crosshair size={32} className="text-red-400 mb-3" /><h2 className="text-xl font-black italic tracking-tight uppercase">Arena Clash</h2><p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">PERSONNALISATION CHARS</p></div>
                        </button>
                        <button onClick={() => setActiveGroup('SLITHER')} className="group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-indigo-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-900/40 to-black"></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left"><Sparkles size={32} className="text-indigo-400 mb-3" /><h2 className="text-xl font-black italic tracking-tight uppercase">Cyber Serpent</h2><p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">SKINS • ACCESSOIRES</p></div>
                        </button>
                        <button onClick={() => setActiveGroup('AMBIANCE')} className="group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-pink-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-rose-900/40 to-black"></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left"><Map size={32} className="text-pink-400 mb-3" /><h2 className="text-xl font-black italic tracking-tight uppercase">Atmosphère</h2><p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">FONDS D'ÉCRAN</p></div>
                        </button>
                        <button onClick={() => setActiveGroup('GEAR')} className="group relative h-40 rounded-[32px] overflow-hidden border border-white/10 transition-all hover:border-yellow-500/50 hover:scale-[1.02] shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/40 via-orange-900/40 to-black"></div>
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left">
                                <Disc size={32} className="text-yellow-400 mb-3" />
                                <h2 className="text-xl font-black italic tracking-tight uppercase">Air Hockey</h2>
                                <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1">MAILLETS HOCKEY</p>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                        {activeGroup === 'PLAYER' && (
                            <>
                                <SectionHeader title="Titres de Prestige" icon={Type} color="text-yellow-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {titlesCatalog.map(title => (
                                        <ItemCard key={title.id} item={title} category="TITLES" isOwned={ownedTitles.includes(title.id)} isSelected={currentTitleId === title.id} onBuy={() => handleBuyItem(title, 'Titre', buyTitle, ownedTitles)} onSelect={() => selectTitle(title.id)} colorClass="yellow" />
                                    ))}
                                </div>
                                <SectionHeader title="Avatars Néon" icon={User} color="text-cyan-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {avatarsCatalog.map(avatar => (
                                        <ItemCard key={avatar.id} item={avatar} category="AVATARS" isOwned={ownedAvatars.includes(avatar.id)} isSelected={currentAvatarId === avatar.id} onBuy={() => handleBuyItem(avatar, 'Avatar', buyAvatar, ownedAvatars)} onSelect={() => selectAvatar(avatar.id)} colorClass="cyan" />
                                    ))}
                                </div>
                                <SectionHeader title="Cadres de Profil" icon={Palette} color="text-pink-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {framesCatalog.map(frame => (
                                        <ItemCard key={frame.id} item={frame} category="FRAMES" isOwned={ownedFrames.includes(frame.id)} isSelected={currentFrameId === frame.id} onBuy={() => handleBuyItem(frame, 'Cadre', buyFrame, ownedFrames)} onSelect={() => selectFrame(frame.id)} colorClass="pink" />
                                    ))}
                                </div>
                            </>
                        )}

                        {activeGroup === 'ARENA' && (
                            <>
                                <SectionHeader title="Blindages Arena Clash" icon={Crosshair} color="text-red-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {tanksCatalog.map(tank => (
                                        <ItemCard key={tank.id} item={tank} category="TANKS" isOwned={ownedTanks.includes(tank.id)} isSelected={currentTankId === tank.id} onBuy={() => handleBuyItem(tank, 'Char', buyTank, ownedTanks)} onSelect={() => selectTank(tank.id)} colorClass="red" />
                                    ))}
                                </div>
                                
                                <SectionHeader title="Drapeaux de Combat" icon={Flag} color="text-blue-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {tankAccessoriesCatalog.map(acc => (
                                        <ItemCard key={acc.id} item={acc} category="TANK_ACCESSORIES" isOwned={ownedTankAccessories.includes(acc.id)} isSelected={currentTankAccessoryId === acc.id} onBuy={() => handleBuyItem(acc, 'Drapeau', buyTankAccessory, ownedTankAccessories)} onSelect={() => selectTankAccessory(acc.id)} colorClass="blue" />
                                    ))}
                                </div>
                            </>
                        )}

                        {activeGroup === 'AMBIANCE' && (
                            <>
                                <SectionHeader title="Fonds d'écran" icon={Map} color="text-pink-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {wallpapersCatalog.map(wp => (
                                        <ItemCard key={wp.id} item={wp} category="WALLPAPERS" isOwned={ownedWallpapers.includes(wp.id)} isSelected={currentWallpaperId === wp.id} onBuy={() => handleBuyItem(wp, 'Wallpaper', buyWallpaper, ownedWallpapers)} onSelect={() => selectWallpaper(wp.id)} colorClass="pink" />
                                    ))}
                                </div>
                            </>
                        )}

                        {activeGroup === 'SLITHER' && (
                            <>
                                <SectionHeader title="Skins Cyber Serpent" icon={Pipette} color="text-indigo-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {slitherSkinsCatalog.map(skin => (
                                        <div key={skin.id} className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group relative overflow-hidden ${currentSlitherSkinId === skin.id ? 'bg-indigo-900/30 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : ownedSlitherSkins.includes(skin.id) ? 'bg-gray-800/60 border-white/10' : 'bg-gray-900/60 border-white/5'}`}>
                                            <div className="mb-2 relative w-24 h-24 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full border-2 relative overflow-hidden shadow-2xl transition-transform group-hover:scale-110" style={{ background: `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`, borderColor: 'rgba(255,255,255,0.4)', boxShadow: `0 0 25px ${skin.glowColor}80` }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,transparent_30%,rgba(0,0,0,0.5)_100%)]"></div></div>
                                            </div>
                                            <div className="flex flex-col gap-1 mb-3 w-full">
                                                <h3 className="font-black text-[10px] text-white truncate w-full uppercase">{skin.name}</h3>
                                                <span className={`text-[7px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded border self-center ${skin.rarity === 'LEGENDARY' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' : skin.rarity === 'EPIC' ? 'text-purple-400 border-purple-500/50 bg-purple-500/10' : 'text-gray-500 border-white/10 bg-white/5'}`}>{skin.rarity}</span>
                                            </div>
                                            {ownedSlitherSkins.includes(skin.id) ? (
                                                <button onClick={() => selectSlitherSkin(skin.id)} disabled={currentSlitherSkinId === skin.id} className={`w-full py-2.5 rounded-2xl text-[10px] font-black transition-all ${currentSlitherSkinId === skin.id ? 'bg-green-600/20 text-green-400' : 'bg-indigo-600 text-white'}`}>{currentSlitherSkinId === skin.id ? 'ACTIF' : 'CHOISIR'}</button>
                                            ) : (
                                                <button onClick={() => handleBuyItem(skin, 'Skin Slither', buySlitherSkin, ownedSlitherSkins)} disabled={coins < skin.price} className={`w-full py-2.5 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${coins >= skin.price ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{skin.price.toLocaleString()} <Coins size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <SectionHeader title="Accessoires Cyber" icon={Glasses} color="text-purple-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {slitherAccessoriesCatalog.map(acc => (
                                        <ItemCard 
                                            key={acc.id} 
                                            item={acc} 
                                            category="SLITHER_ACCESSORIES" 
                                            isOwned={ownedSlitherAccessories.includes(acc.id)} 
                                            isSelected={currentSlitherAccessoryId === acc.id} 
                                            onBuy={() => handleBuyItem(acc, 'Accessoire Slither', buySlitherAccessory, ownedSlitherAccessories)} 
                                            onSelect={() => selectSlitherAccessory(acc.id)} 
                                            colorClass="purple" 
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {activeGroup === 'GEAR' && (
                            <>
                                <SectionHeader title="Skins Maillets" icon={Disc} color="text-pink-400" />
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {malletsCatalog.map(mallet => (
                                        <ItemCard key={mallet.id} item={mallet} category="MALLETS" isOwned={ownedMallets.includes(mallet.id)} isSelected={currentMalletId === mallet.id} onBuy={() => handleBuyItem(mallet, 'Maillet', buyMallet, ownedMallets)} onSelect={() => selectMallet(mallet.id)} colorClass="pink" />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {activeGroup && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-bottom-2 duration-300">
                    <button onClick={() => setActiveGroup(null)} className="px-6 py-3 bg-gray-900 border border-white/20 rounded-full text-[10px] font-black tracking-widest text-white shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2 backdrop-blur-md">
                        <LayoutGrid size={14} /> TOUTES LES CATÉGORIES
                    </button>
                </div>
            )}
        </div>
    );
};