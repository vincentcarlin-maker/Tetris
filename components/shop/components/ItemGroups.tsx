
import React from 'react';
import { Type, User, Palette, Map, Pipette, Glasses, Crosshair, Flag, Disc, Award } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { ShopCategory, ShopItem } from '../types';
import { ItemCard } from './ItemCard';
import { SectionHeader } from './SectionHeader';

interface ItemGroupsProps {
    group: ShopCategory;
}

export const ItemGroups: React.FC<ItemGroupsProps> = ({ group }) => {
    const { currency, recordTransaction, syncDataWithCloud } = useGlobal();
    const { coins } = currency;

    const handleBuyItem = async (item: ShopItem, categoryName: string, buyFn: (id: string, cost: number) => void) => {
        if (coins >= item.price) {
            buyFn(item.id, item.price);
            recordTransaction('PURCHASE', -item.price, `Achat ${categoryName}: ${item.name}`);
            await syncDataWithCloud();
        }
    };
    
    const renderContent = () => {
        switch (group) {
            case 'PLAYER':
                return <>
                    <SectionHeader title="Titres de Prestige" icon={Type} color="text-yellow-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.titlesCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="TITLES" isOwned={currency.ownedTitles.includes(item.id)} isSelected={currency.currentTitleId === item.id} onBuy={() => handleBuyItem(item, 'Titre', currency.buyTitle)} onSelect={() => currency.selectTitle(item.id)} colorClass="yellow" coins={coins}/>)}
                    </div>
                    <SectionHeader title="Avatars Néon" icon={User} color="text-cyan-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.avatarsCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="AVATARS" isOwned={currency.ownedAvatars.includes(item.id)} isSelected={currency.currentAvatarId === item.id} onBuy={() => handleBuyItem(item, 'Avatar', currency.buyAvatar)} onSelect={() => currency.selectAvatar(item.id)} colorClass="cyan" coins={coins}/>)}
                    </div>
                    <SectionHeader title="Badges de Succès" icon={Award} color="text-green-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.badgesCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="BADGES" isOwned={currency.inventory.includes(item.id)} isSelected={false} onBuy={() => handleBuyItem(item, 'Badge', currency.buyBadge)} onSelect={() => {}} colorClass="green" coins={coins}/>)}
                    </div>
                    <SectionHeader title="Cadres de Profil" icon={Palette} color="text-pink-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.framesCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="FRAMES" isOwned={currency.ownedFrames.includes(item.id)} isSelected={currency.currentFrameId === item.id} onBuy={() => handleBuyItem(item, 'Cadre', currency.buyFrame)} onSelect={() => currency.selectFrame(item.id)} colorClass="pink" coins={coins}/>)}
                    </div>
                </>;
            case 'ARENA':
                return <>
                    <SectionHeader title="Blindages Arena Clash" icon={Crosshair} color="text-red-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.tanksCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="TANKS" isOwned={currency.ownedTanks.includes(item.id)} isSelected={currency.currentTankId === item.id} onBuy={() => handleBuyItem(item, 'Char', currency.buyTank)} onSelect={() => currency.selectTank(item.id)} colorClass="red" coins={coins}/>)}
                    </div>
                    <SectionHeader title="Drapeaux de Combat" icon={Flag} color="text-blue-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.tankAccessoriesCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="TANK_ACCESSORIES" isOwned={currency.ownedTankAccessories.includes(item.id)} isSelected={currency.currentTankAccessoryId === item.id} onBuy={() => handleBuyItem(item, 'Drapeau', currency.buyTankAccessory)} onSelect={() => currency.selectTankAccessory(item.id)} colorClass="blue" coins={coins}/>)}
                    </div>
                </>;
            case 'AMBIANCE':
                 return <>
                    <SectionHeader title="Fonds d'écran" icon={Map} color="text-pink-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {currency.wallpapersCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="WALLPAPERS" isOwned={currency.ownedWallpapers.includes(item.id)} isSelected={currency.currentWallpaperId === item.id} onBuy={() => handleBuyItem(item, 'Wallpaper', currency.buyWallpaper)} onSelect={() => currency.selectWallpaper(item.id)} colorClass="pink" coins={coins}/>)}
                    </div>
                </>;
            case 'SLITHER':
                return <>
                    <SectionHeader title="Skins Cyber Serpent" icon={Pipette} color="text-indigo-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.slitherSkinsCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="SLITHER_SKINS" isOwned={currency.ownedSlitherSkins.includes(item.id)} isSelected={currency.currentSlitherSkinId === item.id} onBuy={() => handleBuyItem(item, 'Skin Slither', currency.buySlitherSkin)} onSelect={() => currency.selectSlitherSkin(item.id)} colorClass="indigo" coins={coins}/>)}
                    </div>
                    <SectionHeader title="Accessoires Cyber" icon={Glasses} color="text-purple-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.slitherAccessoriesCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="SLITHER_ACCESSORIES" isOwned={currency.ownedSlitherAccessories.includes(item.id)} isSelected={currency.currentSlitherAccessoryId === item.id} onBuy={() => handleBuyItem(item, 'Accessoire Slither', currency.buySlitherAccessory)} onSelect={() => currency.selectSlitherAccessory(item.id)} colorClass="purple" coins={coins}/>)}
                    </div>
                </>;
            case 'GEAR':
                return <>
                    <SectionHeader title="Skins Maillets" icon={Disc} color="text-pink-400" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currency.malletsCatalog.map((item: ShopItem) => <ItemCard key={item.id} item={item} category="MALLETS" isOwned={currency.ownedMallets.includes(item.id)} isSelected={currency.currentMalletId === item.id} onBuy={() => handleBuyItem(item, 'Maillet', currency.buyMallet)} onSelect={() => currency.selectMallet(item.id)} colorClass="pink" coins={coins}/>)}
                    </div>
                </>;
            default:
                return null;
        }
    };
    
    return <div className="animate-in fade-in slide-in-from-right-4 duration-400">{renderContent()}</div>;
};
