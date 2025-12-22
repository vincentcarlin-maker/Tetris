
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Badge, Avatar, Frame, SlitherSkin, SlitherAccessory, Wallpaper, Title, Mallet,
    SLITHER_SKINS_CATALOG, BADGES_CATALOG, AVATARS_CATALOG, SLITHER_ACCESSORIES_CATALOG, 
    FRAMES_CATALOG, WALLPAPERS_CATALOG, TITLES_CATALOG, MALLETS_CATALOG, TRANSLATIONS 
} from '../constants/catalog';

// Re-export pour compatibilité avec le reste de l'app (Shop, SocialOverlay, etc.)
export type { Badge, Avatar, Frame, SlitherSkin, SlitherAccessory, Wallpaper, Title, Mallet };
export { SLITHER_SKINS_CATALOG, BADGES_CATALOG, AVATARS_CATALOG, SLITHER_ACCESSORIES_CATALOG, FRAMES_CATALOG, WALLPAPERS_CATALOG, TITLES_CATALOG, MALLETS_CATALOG };

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

    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('neon-accent-color') || 'default');
    const [privacySettings, setPrivacySettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('neon_privacy') || '{"hideOnline": false, "blockRequests": false}'); } catch { return {hideOnline: false, blockRequests: false}; }
    });
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('neon-reduced-motion') === 'true');

    // Fix: Add voiceChatEnabled state, defaulting to true.
    const [voiceChatEnabled, setVoiceChatEnabled] = useState(() => {
        const saved = localStorage.getItem('neon-voice-chat');
        return saved !== null ? saved === 'true' : true;
    });

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

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        localStorage.setItem('neon-language', lang);
    };

    const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.fr, [language]);

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

    // Fix: Add toggle function for voice chat
    const toggleVoiceChat = useCallback(() => {
        setVoiceChatEnabled(prev => {
            const newState = !prev;
            localStorage.setItem('neon-voice-chat', String(newState));
            return newState;
        });
    }, []);

    const playerRank = useMemo(() => {
        if (isSuperUser) return { title: language === 'fr' ? 'ADMINISTRATEUR' : 'ADMINISTRATOR', color: 'text-red-500', glow: 'shadow-red-500/50' };
        const count = inventory.length;
        if (count >= 12) return { title: language === 'fr' ? 'LÉGENDE VIVANTE' : 'LIVING LEGEND', color: 'text-amber-400', glow: 'shadow-amber-400/50' };
        if (count >= 8) return { title: language === 'fr' ? 'MAÎTRE ARCADE' : 'ARCADE MASTER', color: 'text-purple-400', glow: 'shadow-purple-400/50' };
        if (count >= 5) return { title: language === 'fr' ? 'CHASSEUR DE PIXELS' : 'PIXEL HUNTER', color: 'text-cyan-400', glow: 'shadow-cyan-400/50' };
        if (count >= 2) return { title: language === 'fr' ? 'EXPLORATEUR' : 'EXPLORER', color: 'text-green-400', glow: 'shadow-green-400/50' };
        return { title: language === 'fr' ? 'VAGABOND NÉON' : 'NEON WANDERER', color: 'text-gray-400', glow: 'shadow-gray-400/20' };
    }, [inventory, isSuperUser, language]);

    return { 
        coins, inventory, ownedAvatars, ownedFrames, ownedWallpapers, ownedTitles, ownedMallets, ownedSlitherSkins, ownedSlitherAccessories,
        accentColor, updateAccentColor, privacySettings, togglePrivacy, reducedMotion, toggleReducedMotion,
        // Fix: Export voiceChatEnabled and its toggle function.
        voiceChatEnabled, toggleVoiceChat,
        language, setLanguage, t,
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
