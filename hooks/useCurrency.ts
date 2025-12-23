
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Badge, Avatar, Frame, SlitherSkin, SlitherAccessory, Wallpaper, Title, Mallet, TankSkin, TankAccessory,
    SLITHER_SKINS_CATALOG, BADGES_CATALOG, AVATARS_CATALOG, SLITHER_ACCESSORIES_CATALOG, 
    FRAMES_CATALOG, WALLPAPERS_CATALOG, TITLES_CATALOG, MALLETS_CATALOG, TANKS_CATALOG, TANK_ACCESSORIES_CATALOG, TRANSLATIONS 
} from '../constants/catalog';

export type { Badge, Avatar, Frame, SlitherSkin, SlitherAccessory, Wallpaper, Title, Mallet, TankSkin, TankAccessory };
export { SLITHER_SKINS_CATALOG, BADGES_CATALOG, AVATARS_CATALOG, SLITHER_ACCESSORIES_CATALOG, FRAMES_CATALOG, WALLPAPERS_CATALOG, TITLES_CATALOG, MALLETS_CATALOG, TANKS_CATALOG, TANK_ACCESSORIES_CATALOG };

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
    
    const [language, setLanguageState] = useState<string>(() => (localStorage.getItem('neon-language')) || 'fr');
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

    const [currentTankId, setCurrentTankId] = useState(() => localStorage.getItem('neon-tank') || "tk_classic");
    const [ownedTanks, setOwnedTanks] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-tanks') || '["tk_classic"]'); } catch { return ["tk_classic"]; }
    });

    const [currentTankAccessoryId, setCurrentTankAccessoryId] = useState(() => localStorage.getItem('neon-tank-accessory') || "ta_none");
    const [ownedTankAccessories, setOwnedTankAccessories] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-tank-accessories') || '["ta_none"]'); } catch { return ["ta_none"]; }
    });

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('neon-accent-color') || 'default');
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('neon-reduced-motion') === 'true');
    const [voiceChatEnabled, setVoiceChatEnabled] = useState(() => localStorage.getItem('neon-voice-chat') !== 'false');

    const [adminModeActive, setAdminModeActive] = useState(() => localStorage.getItem('neon-admin-mode') === 'true');
    const isSuperUser = username === 'Vincent';

    useEffect(() => {
        const root = document.documentElement;
        if (accentColor === 'default') {
            root.style.setProperty('--neon-accent', '#00f3ff');
            root.style.setProperty('--neon-accent-rgb', '0, 243, 255');
        } else {
            root.style.setProperty('--neon-accent', accentColor);
            const rgb = hexToRgb(accentColor);
            if (rgb) root.style.setProperty('--neon-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    }, [accentColor]);

    const addCoins = useCallback((amount: number) => {
        setCoins(prev => {
            const newVal = prev + amount;
            localStorage.setItem('neon-coins', newVal.toString());
            return newVal;
        });
    }, []);

    const importData = useCallback((data: any) => {
        if (!data) return;
        if (data.coins !== undefined) { setCoins(data.coins); localStorage.setItem('neon-coins', data.coins.toString()); }
        if (data.inventory) { setInventory(data.inventory); localStorage.setItem('neon-inventory', JSON.stringify(data.inventory)); }
        if (data.avatarId) { setCurrentAvatarId(data.avatarId); localStorage.setItem('neon-avatar', data.avatarId); }
        if (data.ownedAvatars) { setOwnedAvatars(data.ownedAvatars); localStorage.setItem('neon_owned_avatars', JSON.stringify(data.ownedAvatars)); }
        if (data.frameId) { setCurrentFrameId(data.frameId); localStorage.setItem('neon-frame', data.frameId); }
        if (data.ownedFrames) { setOwnedFrames(data.ownedFrames); localStorage.setItem('neon-owned-frames', JSON.stringify(data.ownedFrames)); }
        if (data.malletId) { setCurrentMalletId(data.malletId); localStorage.setItem('neon-mallet', data.malletId); }
        if (data.ownedMallets) { setOwnedMallets(data.ownedMallets); localStorage.setItem('neon-owned-mallets', JSON.stringify(data.ownedMallets)); }
        if (data.tankId) { setCurrentTankId(data.tankId); localStorage.setItem('neon-tank', data.tankId); }
        if (data.ownedTanks) { setOwnedTanks(data.ownedTanks); localStorage.setItem('neon-owned-tanks', JSON.stringify(data.ownedTanks)); }
    }, []);

    const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.fr, [language]);

    return { 
        coins, inventory, ownedAvatars, ownedFrames, ownedWallpapers, ownedTitles, ownedMallets, ownedSlitherSkins, ownedSlitherAccessories, ownedTanks, ownedTankAccessories,
        accentColor, updateAccentColor: (c: string) => { setAccentColor(c); localStorage.setItem('neon-accent-color', c); },
        voiceChatEnabled, toggleVoiceChat: () => setVoiceChatEnabled(v => !v),
        language, setLanguage: (l: string) => { setLanguageState(l); localStorage.setItem('neon-language', l); }, t,
        isSuperUser, adminModeActive, toggleAdminMode: () => setAdminModeActive(v => !v),
        addCoins, username, updateUsername: (n: string) => { setUsername(n); localStorage.setItem('neon-username', n); },
        currentAvatarId, selectAvatar: (id: string) => { setCurrentAvatarId(id); localStorage.setItem('neon-avatar', id); },
        buyAvatar: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedAvatars(p => [...p, id]); localStorage.setItem('neon_owned_avatars', JSON.stringify([...ownedAvatars, id])); } },
        avatarsCatalog: AVATARS_CATALOG,
        currentFrameId, selectFrame: (id: string) => { setCurrentFrameId(id); localStorage.setItem('neon-frame', id); },
        buyFrame: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedFrames(p => [...p, id]); localStorage.setItem('neon-owned-frames', JSON.stringify([...ownedFrames, id])); } },
        framesCatalog: FRAMES_CATALOG,
        currentMalletId, selectMallet: (id: string) => { setCurrentMalletId(id); localStorage.setItem('neon-mallet', id); },
        buyMallet: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedMallets(p => [...p, id]); localStorage.setItem('neon-owned-mallets', JSON.stringify([...ownedMallets, id])); } },
        malletsCatalog: MALLETS_CATALOG,
        currentTankId, selectTank: (id: string) => { setCurrentTankId(id); localStorage.setItem('neon-tank', id); },
        buyTank: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedTanks(p => [...p, id]); localStorage.setItem('neon-owned-tanks', JSON.stringify([...ownedTanks, id])); } },
        tanksCatalog: TANKS_CATALOG,
        currentTankAccessoryId, selectTankAccessory: (id: string) => { setCurrentTankAccessoryId(id); localStorage.setItem('neon-tank-accessory', id); },
        buyTankAccessory: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedTankAccessories(p => [...p, id]); localStorage.setItem('neon-owned-tank-accessories', JSON.stringify([...ownedTankAccessories, id])); } },
        tankAccessoriesCatalog: TANK_ACCESSORIES_CATALOG,
        currentWallpaperId, selectWallpaper: (id: string) => { setCurrentWallpaperId(id); localStorage.setItem('neon-wallpaper', id); },
        buyWallpaper: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedWallpapers(p => [...p, id]); localStorage.setItem('neon-owned-wallpapers', JSON.stringify([...ownedWallpapers, id])); } },
        wallpapersCatalog: WALLPAPERS_CATALOG,
        currentTitleId, selectTitle: (id: string) => { setCurrentTitleId(id); localStorage.setItem('neon-title', id); },
        buyTitle: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedTitles(p => [...p, id]); localStorage.setItem('neon-owned-titles', JSON.stringify([...ownedTitles, id])); } },
        titlesCatalog: TITLES_CATALOG,
        currentSlitherSkinId, selectSlitherSkin: (id: string) => { setCurrentSlitherSkinId(id); localStorage.setItem('neon-slither-skin', id); },
        buySlitherSkin: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedSlitherSkins(p => [...p, id]); localStorage.setItem('neon-owned-slither-skins', JSON.stringify([...ownedSlitherSkins, id])); } },
        slitherSkinsCatalog: SLITHER_SKINS_CATALOG,
        currentSlitherAccessoryId, selectSlitherAccessory: (id: string) => { setCurrentSlitherAccessoryId(id); localStorage.setItem('neon-slither-accessory', id); },
        buySlitherAccessory: (id: string, cost: number) => { if (coins >= cost) { addCoins(-cost); setOwnedSlitherAccessories(p => [...p, id]); localStorage.setItem('neon-owned-slither-accessories', JSON.stringify([...ownedSlitherAccessories, id])); } },
        slitherAccessoriesCatalog: SLITHER_ACCESSORIES_CATALOG,
        badgesCatalog: BADGES_CATALOG,
        playerRank: { title: "VAGABOND", color: "text-gray-400" }, 
        inventoryCount: inventory.length,
        email, updateEmail: (e: string) => { setEmail(e); localStorage.setItem('neon-email', e); },
        reducedMotion, toggleReducedMotion: () => setReducedMotion(v => !v),
        importData, refreshData: () => {}
    };
};
