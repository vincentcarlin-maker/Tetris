
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Zap, Star, Crown, Flame, Target, Ghost, Smile, Hexagon, Gem, Heart, Rocket, Bot, User, Gamepad2, Headphones, Skull, Circle, Sparkles, Box, Image, Type, Cat, Flower, Rainbow, ShoppingBag, Sun, Moon, Snowflake, Droplets, Music, Anchor, Terminal, TreeDeciduous, Waves, Sunset, Disc, Pipette, Glasses } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  price: number;
  icon: any;
  description: string;
  color: string;
}

export interface Avatar {
    id: string;
    name: string;
    price: number;
    icon: any;
    color: string;
    bgGradient: string;
}

export interface Frame {
    id: string;
    name: string;
    price: number;
    cssClass: string;
    description: string;
}

export interface SlitherSkin {
    id: string;
    name: string;
    price: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    pattern?: 'solid' | 'stripes' | 'dots' | 'checker' | 'rainbow' | 'grid' | 'pulse' | 'metallic';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    description: string;
}

export interface SlitherAccessory {
    id: string;
    name: string;
    price: number;
    type: 'CROWN' | 'HAT' | 'VISOR' | 'NINJA' | 'HALO' | 'HORNS' | 'CAT_EARS' | 'HEADPHONES' | 'WITCH' | 'VIKING' | 'HERO' | 'DRAGON';
    color: string;
    secondaryColor?: string;
    description: string;
}

export interface Wallpaper {
    id: string;
    name: string;
    price: number;
    cssValue: string;
    description: string;
    bgSize?: string;
}

export interface Title {
    id: string;
    name: string;
    price: number;
    color: string;
    description: string;
}

export interface Mallet {
    id: string;
    name: string;
    price: number;
    colors: string[];
    type: 'basic' | 'gradient' | 'ring' | 'flower' | 'target' | 'complex';
    description: string;
}

export const SLITHER_SKINS_CATALOG: SlitherSkin[] = [
    { id: 'ss_cyan', name: 'Cyan Néon', price: 0, primaryColor: '#00f3ff', secondaryColor: '#0088ff', glowColor: '#00f3ff', pattern: 'solid', rarity: 'COMMON', description: 'Le look original.' },
    { id: 'ss_pink', name: 'Rose Flash', price: 200, primaryColor: '#ff00ff', secondaryColor: '#cc00cc', glowColor: '#ff00ff', pattern: 'solid', rarity: 'COMMON', description: 'Vibrant et assumé.' },
    { id: 'ss_gold', name: 'Or Pur', price: 1500, primaryColor: '#fbbf24', secondaryColor: '#b45309', glowColor: '#fbbf24', pattern: 'metallic', rarity: 'RARE', description: 'La marque du luxe.' },
    { id: 'ss_obsidian', name: 'Obsidienne', price: 1500, primaryColor: '#1e293b', secondaryColor: '#020617', glowColor: '#9d00ff', pattern: 'metallic', rarity: 'RARE', description: 'Verre volcanique.' },
    { id: 'ss_rainbow_flow', name: 'Flux Chroma', price: 15000, primaryColor: '#ff0000', secondaryColor: '#ffffff', glowColor: '#00f3ff', pattern: 'rainbow', rarity: 'LEGENDARY', description: 'Toutes les fréquences.' },
    { id: 'ss_void', name: 'Le Vide', price: 25000, primaryColor: '#000000', secondaryColor: '#000000', glowColor: '#ffffff', pattern: 'pulse', rarity: 'LEGENDARY', description: 'La fin de tout.' },
];

export const SLITHER_ACCESSORIES_CATALOG: SlitherAccessory[] = [
    { id: 'sa_none', name: 'Aucun', price: 0, type: 'HAT', color: 'transparent', description: 'Tête nue.' },
    { id: 'sa_crown_gold', name: 'Couronne Royale', price: 5000, type: 'CROWN', color: '#facc15', secondaryColor: '#854d0e', description: 'Le roi de l\'arène.' },
    { id: 'sa_tophat_black', name: 'Haut-de-forme', price: 2000, type: 'HAT', color: '#111827', secondaryColor: '#374151', description: 'Style classique.' },
    { id: 'sa_visor_cyber', name: 'Visière Cyber', price: 3500, type: 'VISOR', color: '#00f3ff', secondaryColor: '#1e40af', description: 'Vision tactique.' },
    { id: 'sa_viking', name: 'Casque Viking', price: 4500, type: 'VIKING', color: '#94a3b8', secondaryColor: '#475569', description: 'Guerrier du nord.' },
    { id: 'sa_halo_gold', name: 'Auréole Céleste', price: 5000, type: 'HALO', color: '#fffbeb', secondaryColor: '#facc15', description: 'Lumière divine.' },
    { id: 'sa_horns_devil', name: 'Cornes Démoniaques', price: 5000, type: 'HORNS', color: '#ef4444', secondaryColor: '#7f1d1d', description: 'Petit diable.' },
    { id: 'sa_headphones', name: 'Casque Audio', price: 3000, type: 'HEADPHONES', color: '#ec4899', secondaryColor: '#701a75', description: 'Rythme de glisse.' },
    { id: 'sa_witch', name: 'Chapeau Sorcier', price: 4000, type: 'WITCH', color: '#4c1d95', secondaryColor: '#2e1065', description: 'Magie noire.' },
    { id: 'sa_dragon', name: 'Cornes de Dragon', price: 8000, type: 'DRAGON', color: '#22c55e', secondaryColor: '#14532d', description: 'Ancêtre mythique.' },
];

export const BADGES_CATALOG: Badge[] = [
  { id: 'b_recruit', name: 'Recrue Néon', price: 100, icon: Smile, description: 'Bienvenue dans l\'arcade.', color: 'text-blue-400' },
  { id: 'b_king', name: 'Roi Néon', price: 50000, icon: Crown, description: 'Tu possèdes l\'arcade.', color: 'text-amber-400' },
];

export const AVATARS_CATALOG: Avatar[] = [
    { id: 'av_bot', name: 'Néon Bot', price: 0, icon: Bot, color: 'text-cyan-400', bgGradient: 'from-cyan-900/50 to-blue-900/50' },
    { id: 'av_human', name: 'Humain', price: 0, icon: User, color: 'text-gray-200', bgGradient: 'from-gray-800/50 to-slate-800/50' },
];

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
];

export const WALLPAPERS_CATALOG: Wallpaper[] = [
    { id: 'bg_brick', name: 'Briques Sombres', price: 0, cssValue: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 100%), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'60\' viewBox=\'0 0 200 60\'%3E%3Cdefs%3E%3Cfilter id=\'roughEdges\' x=\'-20%25\' y=\'-20%25\' width=\'140%25\' height=\'140%25\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'4\' result=\'noise\'/%3E%3CfeDisplacementMap in=\'SourceGraphic\' in2=\'noise\' scale=\'1.5\' xChannelSelector=\'R\' yChannelSelector=\'G\'/%3E%3C/filter%3E%3Cfilter id=\'grain\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'200\' height=\'60\' fill=\'%23050505\'/%3E%3Cg filter=\'url(%23roughEdges)\'%3E%3Crect x=\'2\' y=\'2\' width=\'96\' height=\'26\' fill=\'%2315151a\' /%3E%3Crect x=\'102\' y=\'2\' width=\'96\' height=\'26\' fill=\'%23131318\' /%3E%3Crect x=\'-2\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23111116\' /%3E%3Crect x=\'52\' y=\'32\' width=\'96\' height=\'26\' fill=\'%23141419\' /%3E%3Crect x=\'152\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23121217\' /%3E%3C/g%3E%3Crect width=\'200\' height=\'60\' fill=\'%23fff\' opacity=\'0.05\' filter=\'url(%23grain)\'/%3E%3C/svg%3E")', description: 'L\'atmosphère originale.' },
];

export const TITLES_CATALOG: Title[] = [
    { id: 't_none', name: '', price: 0, color: 'text-gray-500', description: 'Aucun titre.' },
];

export const MALLETS_CATALOG: Mallet[] = [
    { id: 'm_classic', name: 'Classique Cyan', price: 0, colors: ['#00f3ff'], type: 'basic', description: 'Le standard de l\'arcade.' },
    { id: 'm_gold', name: 'Or Pur', price: 5000, colors: ['#facc15', '#a16207'], type: 'gradient', description: 'Le luxe de la victoire.' },
];

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const useCurrency = () => {
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('neon-coins') || '0', 10));
    const [inventory, setInventory] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-inventory') || '[]'); } catch { return []; }
    });
    
    const [username, setUsername] = useState(() => localStorage.getItem('neon-username') || "Joueur Néon");
    const [email, setEmail] = useState(() => localStorage.getItem('neon-email') || "");
    const [currentAvatarId, setCurrentAvatarId] = useState(() => localStorage.getItem('neon-avatar') || "av_bot");
    const [ownedAvatars, setOwnedAvatars] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_owned_avatars') || '["av_bot", "av_human"]'); } catch { return ["av_bot", "av_human"]; }
    });
    
    const [currentFrameId, setCurrentFrameId] = useState(() => localStorage.getItem('neon-frame') || "fr_none");
    const [ownedFrames, setOwnedFrames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-frames') || '["fr_none"]'); } catch { return ["fr_none"]; }
    });

    const [currentSlitherSkinId, setCurrentSlitherSkinId] = useState(() => localStorage.getItem('neon-slither-skin') || "ss_cyan");
    const [ownedSlitherSkins, setOwnedSlitherSkins] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-slither-skins') || '["ss_cyan"]'); } catch { return ["ss_cyan"]; }
    });

    const [currentSlitherAccessoryId, setCurrentSlitherAccessoryId] = useState(() => localStorage.getItem('neon-slither-accessory') || "sa_none");
    const [ownedSlitherAccessories, setOwnedSlitherAccessories] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-slither-accessories') || '["sa_none"]'); } catch { return ["sa_none"]; }
    });

    const [currentWallpaperId, setCurrentWallpaperId] = useState(() => localStorage.getItem('neon-wallpaper') || "bg_brick");
    const [ownedWallpapers, setOwnedWallpapers] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-wallpapers') || '["bg_brick"]'); } catch { return ["bg_brick"]; }
    });

    const [currentTitleId, setCurrentTitleId] = useState(() => localStorage.getItem('neon-title') || "t_none");
    const [ownedTitles, setOwnedTitles] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-titles') || '["t_none"]'); } catch { return ["t_none"]; }
    });

    const [currentMalletId, setCurrentMalletId] = useState(() => localStorage.getItem('neon-mallet') || "m_classic");
    const [ownedMallets, setOwnedMallets] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-mallets') || '["m_classic"]'); } catch { return ["m_classic"]; }
    });

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('neon-accent-color') || 'default');
    const [privacySettings, setPrivacySettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('neon_privacy') || '{"hideOnline": false, "blockRequests": false}'); } catch { return {hideOnline: false, blockRequests: false}; }
    });
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('neon-reduced-motion') === 'true');

    const [adminModeActive, setAdminModeActive] = useState(() => {
        const storedUsername = localStorage.getItem('neon-username');
        if (storedUsername === 'Vincent') {
            const savedMode = localStorage.getItem('neon-admin-mode');
            return savedMode !== null ? JSON.parse(savedMode) : true;
        }
        return false;
    });
    const isSuperUser = username === 'Vincent';

    useEffect(() => {
        const root = document.documentElement;
        if (accentColor === 'default') {
            root.style.removeProperty('--neon-blue');
            root.style.removeProperty('--neon-pink');
            root.style.removeProperty('--neon-purple');
            root.style.removeProperty('--neon-yellow');
            root.style.removeProperty('--neon-green');
            root.style.setProperty('--neon-accent', '#00f3ff');
            root.style.setProperty('--neon-accent-rgb', '0, 243, 255');
        } else {
            root.style.setProperty('--neon-blue', accentColor);
            root.style.setProperty('--neon-pink', accentColor);
            root.style.setProperty('--neon-purple', accentColor);
            root.style.setProperty('--neon-yellow', accentColor);
            root.style.setProperty('--neon-green', accentColor);
            root.style.setProperty('--neon-accent', accentColor);
            
            const rgb = hexToRgb(accentColor);
            if (rgb) {
                root.style.setProperty('--neon-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }
    }, [accentColor]);

    const importData = useCallback((data: any) => {
        if (!data) return;
        if (data.coins !== undefined) { setCoins(data.coins); localStorage.setItem('neon-coins', data.coins.toString()); }
        if (data.email !== undefined) { setEmail(data.email); localStorage.setItem('neon-email', data.email); }
        if (data.inventory) { setInventory(data.inventory); localStorage.setItem('neon-inventory', JSON.stringify(data.inventory)); }
        if (data.avatarId) { setCurrentAvatarId(data.avatarId); localStorage.setItem('neon-avatar', data.avatarId); }
        if (data.ownedAvatars) { setOwnedAvatars(data.ownedAvatars); localStorage.setItem('neon_owned_avatars', JSON.stringify(data.ownedAvatars)); }
        if (data.frameId) { setCurrentFrameId(data.frameId); localStorage.setItem('neon-frame', data.frameId); }
        if (data.ownedFrames) { setOwnedFrames(data.ownedFrames); localStorage.setItem('neon-owned-frames', JSON.stringify(data.ownedFrames)); }
        if (data.slitherSkinId) { setCurrentSlitherSkinId(data.slitherSkinId); localStorage.setItem('neon-slither-skin', data.slitherSkinId); }
        if (data.ownedSlitherSkins) { setOwnedSlitherSkins(data.ownedSlitherSkins); localStorage.setItem('neon-owned-slither-skins', JSON.stringify(data.ownedSlitherSkins)); }
        if (data.slitherAccessoryId) { setCurrentSlitherAccessoryId(data.slitherAccessoryId); localStorage.setItem('neon-slither-accessory', data.slitherAccessoryId); }
        if (data.ownedSlitherAccessories) { setOwnedSlitherAccessories(data.ownedSlitherAccessories); localStorage.setItem('neon-owned-slither-accessories', JSON.stringify(data.ownedSlitherAccessories)); }
        if (data.wallpaperId) { setCurrentWallpaperId(data.wallpaperId); localStorage.setItem('neon-wallpaper', data.wallpaperId); }
        if (data.ownedWallpapers) { setOwnedWallpapers(data.ownedWallpapers); localStorage.setItem('neon-owned-wallpapers', JSON.stringify(data.ownedWallpapers)); }
        if (data.titleId) { setCurrentTitleId(data.titleId); localStorage.setItem('neon-title', data.titleId); }
        if (data.ownedTitles) { setOwnedTitles(data.ownedTitles); localStorage.setItem('neon-owned-titles', JSON.stringify(data.ownedTitles)); }
        if (data.malletId) { setCurrentMalletId(data.malletId); localStorage.setItem('neon-mallet', data.malletId); }
        if (data.ownedMallets) { setOwnedMallets(data.ownedMallets); localStorage.setItem('neon_owned_mallets', JSON.stringify(data.ownedMallets)); }
    }, []);

    const refreshData = useCallback(() => {
        const storedCoins = localStorage.getItem('neon-coins');
        const storedInv = localStorage.getItem('neon-inventory');
        const storedEmail = localStorage.getItem('neon-email');
        if (storedCoins) setCoins(parseInt(storedCoins, 10));
        if (storedInv) setInventory(JSON.parse(storedInv));
        if (storedEmail) setEmail(storedEmail);
        const storedName = localStorage.getItem('neon-username');
        if (storedName) setUsername(storedName);
    }, []);

    useEffect(() => { refreshData(); }, [refreshData]);

    const addCoins = useCallback((amount: number) => {
        setCoins(prev => {
            const newVal = prev + amount;
            localStorage.setItem('neon-coins', newVal.toString());
            return newVal;
        });
    }, []);

    const updateEmail = useCallback((newEmail: string) => {
        setEmail(newEmail);
        localStorage.setItem('neon-email', newEmail);
    }, []);

    const updateAccentColor = (color: string) => {
        setAccentColor(color);
        localStorage.setItem('neon-accent-color', color);
    };

    const togglePrivacy = (key: 'hideOnline' | 'blockRequests') => {
        setPrivacySettings((prev: any) => {
            const newVal = { ...prev, [key]: !prev[key] };
            localStorage.setItem('neon_privacy', JSON.stringify(newVal));
            return newVal;
        });
    };

    const toggleReducedMotion = () => {
        const newVal = !reducedMotion;
        setReducedMotion(newVal);
        localStorage.setItem('neon-reduced-motion', String(newVal));
        if (newVal) document.body.classList.add('reduced-motion');
        else document.body.classList.remove('reduced-motion');
    };

    const playerRank = useMemo(() => {
        if (isSuperUser) return { title: 'ADMINISTRATEUR', color: 'text-red-500', glow: 'shadow-red-500/50' };
        const count = inventory.length;
        if (count >= 12) return { title: 'LÉGENDE VIVANTE', color: 'text-amber-400', glow: 'shadow-amber-400/50' };
        if (count >= 8) return { title: 'MAÎTRE ARCADE', color: 'text-purple-400', glow: 'shadow-purple-400/50' };
        if (count >= 5) return { title: 'CHASSEUR DE PIXELS', color: 'text-cyan-400', glow: 'shadow-cyan-400/50' };
        if (count >= 2) return { title: 'EXPLORATEUR', color: 'text-green-400', glow: 'shadow-green-400/50' };
        return { title: 'VAGABOND NÉON', color: 'text-gray-400', glow: 'shadow-gray-400/20' };
    }, [inventory, isSuperUser]);

    return { 
        coins, inventory, ownedAvatars, ownedFrames, ownedWallpapers, ownedTitles, ownedMallets, ownedSlitherSkins, ownedSlitherAccessories,
        accentColor, updateAccentColor, privacySettings, togglePrivacy, reducedMotion, toggleReducedMotion,
        isSuperUser, adminModeActive, toggleAdminMode: () => { const n = !adminModeActive; setAdminModeActive(n); localStorage.setItem('neon-admin-mode', JSON.stringify(n)); },
        refreshData, importData, addCoins, email, updateEmail,
        buyBadge: (id: string, cost: number) => {
            if (coins >= cost) { addCoins(-cost); setInventory(p => [...p, id]); localStorage.setItem('neon-inventory', JSON.stringify([...inventory, id])); }
        },
        catalog: BADGES_CATALOG, playerRank, username, updateUsername: (n: string) => { setUsername(n); localStorage.setItem('neon-username', n); },
        currentAvatarId, selectAvatar: (id: string) => { setCurrentAvatarId(id); localStorage.setItem('neon-avatar', id); },
        buyAvatar: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedAvatars(p => [...p, id]); localStorage.setItem('neon_owned_avatars', JSON.stringify([...ownedAvatars, id])); } },
        avatarsCatalog: AVATARS_CATALOG,
        currentFrameId, selectFrame: (id: string) => { setCurrentFrameId(id); localStorage.setItem('neon-frame', id); },
        buyFrame: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedFrames(p => [...p, id]); localStorage.setItem('neon-owned-frames', JSON.stringify([...ownedFrames, id])); } },
        framesCatalog: FRAMES_CATALOG,
        currentSlitherSkinId, selectSlitherSkin: (id: string) => { setCurrentSlitherSkinId(id); localStorage.setItem('neon-slither-skin', id); },
        buySlitherSkin: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedSlitherSkins(p => [...p, id]); localStorage.setItem('neon-owned-slither-skins', JSON.stringify([...ownedSlitherSkins, id])); } },
        slitherSkinsCatalog: SLITHER_SKINS_CATALOG,
        currentSlitherAccessoryId, selectSlitherAccessory: (id: string) => { setCurrentSlitherAccessoryId(id); localStorage.setItem('neon-slither-accessory', id); },
        buySlitherAccessory: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedSlitherAccessories(p => [...p, id]); localStorage.setItem('neon-owned-slither-accessories', JSON.stringify([...ownedSlitherAccessories, id])); } },
        slitherAccessoriesCatalog: SLITHER_ACCESSORIES_CATALOG,
        currentWallpaperId, selectWallpaper: (id: string) => { setCurrentWallpaperId(id); localStorage.setItem('neon-wallpaper', id); },
        buyWallpaper: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedWallpapers(p => [...p, id]); localStorage.setItem('neon-owned-wallpapers', JSON.stringify([...ownedWallpapers, id])); } },
        wallpapersCatalog: WALLPAPERS_CATALOG,
        currentTitleId, selectTitle: (id: string) => { setCurrentTitleId(id); localStorage.setItem('neon-title', id); },
        buyTitle: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedTitles(p => [...p, id]); localStorage.setItem('neon-owned-titles', JSON.stringify([...ownedTitles, id])); } },
        titlesCatalog: TITLES_CATALOG,
        currentMalletId, selectMallet: (id: string) => { setCurrentMalletId(id); localStorage.setItem('neon-mallet', id); },
        buyMallet: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedMallets(p => [...p, id]); localStorage.setItem('neon_owned_mallets', JSON.stringify([...ownedMallets, id])); } },
        malletsCatalog: MALLETS_CATALOG,
    };
};
