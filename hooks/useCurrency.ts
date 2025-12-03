
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Zap, Star, Crown, Flame, Target, Ghost, Smile, Hexagon, Gem, Heart, Rocket, Bot, User, Gamepad2, Headphones, Skull, Glasses, Sun, Monitor, Disc,  Sparkles,  Shield } from 'lucide-react';

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

export type AccessoryType = 'HEAD' | 'EYES' | 'EFFECT';

export interface Accessory {
    id: string;
    name: string;
    price: number;
    type: AccessoryType;
    icon: any; // Used for shop display
    color: string;
    renderOffset?: { top: string, scale: number }; // Visual tweaking
}

export const BADGES_CATALOG: Badge[] = [
  { id: 'b_recruit', name: 'Recrue Néon', price: 100, icon: Smile, description: 'Bienvenue dans l\'arcade.', color: 'text-blue-400' },
  { id: 'b_gamer', name: 'Gamer', price: 500, icon: Zap, description: 'Tu commences à chauffer.', color: 'text-yellow-400' },
  { id: 'b_sniper', name: 'Précision', price: 1000, icon: Target, description: 'Dans le mille.', color: 'text-red-500' },
  { id: 'b_ghost', name: 'Fantôme', price: 1500, icon: Ghost, description: 'Invisible mais présent.', color: 'text-purple-400' },
  { id: 'b_star', name: 'Star', price: 2500, icon: Star, description: 'Tu brilles de mille feux.', color: 'text-pink-500' },
  { id: 'b_flame', name: 'En Feu', price: 4000, icon: Flame, description: 'Impossible de t\'arrêter.', color: 'text-orange-500' },
  { id: 'b_hexa', name: 'Cyber', price: 6000, icon: Hexagon, description: 'Architecture parfaite.', color: 'text-cyan-400' },
  { id: 'b_heart', name: 'Vie Extra', price: 8000, icon: Heart, description: 'L\'amour du jeu.', color: 'text-red-400' },
  { id: 'b_rocket', name: 'Turbo', price: 10000, icon: Rocket, description: 'Vers l\'infini.', color: 'text-indigo-400' },
  { id: 'b_gem', name: 'Richesse', price: 15000, icon: Gem, description: 'Le luxe ultime.', color: 'text-emerald-400' },
  { id: 'b_champion', name: 'Champion', price: 25000, icon: Trophy, description: 'Le sommet du podium.', color: 'text-yellow-300' },
  { id: 'b_king', name: 'Roi Néon', price: 50000, icon: Crown, description: 'Tu possèdes l\'arcade.', color: 'text-amber-400' },
];

export const AVATARS_CATALOG: Avatar[] = [
    { id: 'av_bot', name: 'Néon Bot', price: 0, icon: Bot, color: 'text-cyan-400', bgGradient: 'from-cyan-900/50 to-blue-900/50' },
    { id: 'av_human', name: 'Humain', price: 0, icon: User, color: 'text-gray-200', bgGradient: 'from-gray-800/50 to-slate-800/50' },
    { id: 'av_smile', name: 'Good Vibes', price: 500, icon: Smile, color: 'text-yellow-400', bgGradient: 'from-yellow-900/50 to-orange-900/50' },
    { id: 'av_zap', name: 'Voltage', price: 1000, icon: Zap, color: 'text-blue-400', bgGradient: 'from-blue-900/50 to-cyan-900/50' },
    { id: 'av_game', name: 'Pro Gamer', price: 2000, icon: Gamepad2, color: 'text-purple-400', bgGradient: 'from-purple-900/50 to-pink-900/50' },
    { id: 'av_music', name: 'DJ Néon', price: 3000, icon: Headphones, color: 'text-pink-400', bgGradient: 'from-pink-900/50 to-rose-900/50' },
    { id: 'av_skull', name: 'Hardcore', price: 5000, icon: Skull, color: 'text-red-500', bgGradient: 'from-red-900/50 to-orange-900/50' },
    { id: 'av_ghost', name: 'Spectre', price: 7500, icon: Ghost, color: 'text-indigo-400', bgGradient: 'from-indigo-900/50 to-violet-900/50' },
    { id: 'av_rocket', name: 'Cosmique', price: 10000, icon: Rocket, color: 'text-emerald-400', bgGradient: 'from-emerald-900/50 to-teal-900/50' },
    { id: 'av_king', name: 'Le King', price: 25000, icon: Crown, color: 'text-amber-400', bgGradient: 'from-amber-900/50 to-yellow-900/50' },
];

export const ACCESSORIES_CATALOG: Accessory[] = [
    // HEAD
    { id: 'acc_crown', name: 'Couronne', price: 5000, type: 'HEAD', icon: Crown, color: 'text-yellow-400' },
    { id: 'acc_halo', name: 'Halo', price: 2500, type: 'HEAD', icon: Disc, color: 'text-cyan-300' },
    { id: 'acc_headphones', name: 'Casque', price: 1500, type: 'HEAD', icon: Headphones, color: 'text-pink-500' },
    // EYES
    { id: 'acc_shades', name: 'Lunettes', price: 800, type: 'EYES', icon: Glasses, color: 'text-black' },
    { id: 'acc_visor', name: 'Visière VR', price: 1200, type: 'EYES', icon: Monitor, color: 'text-red-500' },
    { id: 'acc_star_eyes', name: 'Yeux Etoiles', price: 2000, type: 'EYES', icon: Star, color: 'text-yellow-300' },
    // EFFECT
    { id: 'acc_fire', name: 'Aura Feu', price: 3000, type: 'EFFECT', icon: Flame, color: 'text-orange-500' },
    { id: 'acc_sparkles', name: 'Paillettes', price: 1000, type: 'EFFECT', icon: Sparkles, color: 'text-white' },
    { id: 'acc_zap', name: 'Electrique', price: 4000, type: 'EFFECT', icon: Zap, color: 'text-blue-400' },
    { id: 'acc_ghost', name: 'Fantôme', price: 5000, type: 'EFFECT', icon: Ghost, color: 'text-purple-500' },
];

export const SOLUTION_COST = 200;

export interface EquippedAccessories {
    head: string | null;
    eyes: string | null;
    effect: string | null;
}

export const useCurrency = () => {
    const [coins, setCoins] = useState(0);
    const [inventory, setInventory] = useState<string[]>([]);
    
    // User Identity
    const [username, setUsername] = useState("Joueur Néon");
    const [currentAvatarId, setCurrentAvatarId] = useState("av_bot");
    const [ownedAvatars, setOwnedAvatars] = useState<string[]>(["av_bot", "av_human"]);
    
    // Accessories
    const [ownedAccessories, setOwnedAccessories] = useState<string[]>([]);
    const [equippedAccessories, setEquippedAccessories] = useState<EquippedAccessories>({ head: null, eyes: null, effect: null });

    // Game Unlocks
    const [unlockedSolutions, setUnlockedSolutions] = useState<number[]>([]);

    useEffect(() => {
        // Load Economy
        const storedCoins = localStorage.getItem('neon-coins');
        const storedInv = localStorage.getItem('neon-inventory');
        if (storedCoins) setCoins(parseInt(storedCoins, 10));
        if (storedInv) setInventory(JSON.parse(storedInv));

        // Load Identity
        const storedName = localStorage.getItem('neon-username');
        const storedAvatar = localStorage.getItem('neon-avatar');
        const storedOwnedAvatars = localStorage.getItem('neon-owned-avatars');
        
        // Load Accessories
        const storedOwnedAcc = localStorage.getItem('neon-owned-accessories');
        const storedEquippedAcc = localStorage.getItem('neon-equipped-accessories');

        if (storedName) setUsername(storedName);
        if (storedAvatar) setCurrentAvatarId(storedAvatar);
        if (storedOwnedAvatars) setOwnedAvatars(JSON.parse(storedOwnedAvatars));
        if (storedOwnedAcc) setOwnedAccessories(JSON.parse(storedOwnedAcc));
        if (storedEquippedAcc) setEquippedAccessories(JSON.parse(storedEquippedAcc));

        // Load Solutions
        const storedSolutions = localStorage.getItem('neon-rush-solutions');
        if (storedSolutions) setUnlockedSolutions(JSON.parse(storedSolutions));
    }, []);

    const addCoins = useCallback((amount: number) => {
        setCoins(prev => {
            const newVal = prev + amount;
            localStorage.setItem('neon-coins', newVal.toString());
            return newVal;
        });
    }, []);

    const buyBadge = useCallback((badgeId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setInventory(prevInv => {
                    const newInv = [...prevInv, badgeId];
                    localStorage.setItem('neon-inventory', JSON.stringify(newInv));
                    return newInv;
                });
                
                return newBalance;
            }
            return prev;
        });
    }, []);

    const updateUsername = useCallback((name: string) => {
        setUsername(name);
        localStorage.setItem('neon-username', name);
    }, []);

    const buyAvatar = useCallback((avatarId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedAvatars(prevOwned => {
                    const newOwned = [...prevOwned, avatarId];
                    localStorage.setItem('neon-owned-avatars', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const buyAccessory = useCallback((accessoryId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedAccessories(prevOwned => {
                    const newOwned = [...prevOwned, accessoryId];
                    localStorage.setItem('neon-owned-accessories', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const selectAvatar = useCallback((avatarId: string) => {
        if (ownedAvatars.includes(avatarId)) {
            setCurrentAvatarId(avatarId);
            localStorage.setItem('neon-avatar', avatarId);
        }
    }, [ownedAvatars]);

    const equipAccessory = useCallback((type: AccessoryType, accessoryId: string | null) => {
        setEquippedAccessories(prev => {
            const next = { ...prev };
            if (type === 'HEAD') next.head = accessoryId;
            if (type === 'EYES') next.eyes = accessoryId;
            if (type === 'EFFECT') next.effect = accessoryId;
            
            localStorage.setItem('neon-equipped-accessories', JSON.stringify(next));
            return next;
        });
    }, []);

    const buySolution = useCallback((levelId: number) => {
        setCoins(prev => {
            if (prev >= SOLUTION_COST) {
                const newBalance = prev - SOLUTION_COST;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setUnlockedSolutions(prevSol => {
                    if (prevSol.includes(levelId)) return prevSol;
                    const newSol = [...prevSol, levelId];
                    localStorage.setItem('neon-rush-solutions', JSON.stringify(newSol));
                    return newSol;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    // Système de Rangs basé sur le nombre de badges
    const playerRank = useMemo(() => {
        const count = inventory.length;
        if (count >= 12) return { title: 'LÉGENDE VIVANTE', color: 'text-amber-400', glow: 'shadow-amber-400/50' };
        if (count >= 8) return { title: 'MAÎTRE ARCADE', color: 'text-purple-400', glow: 'shadow-purple-400/50' };
        if (count >= 5) return { title: 'CHASSEUR DE PIXELS', color: 'text-cyan-400', glow: 'shadow-cyan-400/50' };
        if (count >= 2) return { title: 'EXPLORATEUR', color: 'text-green-400', glow: 'shadow-green-400/50' };
        return { title: 'VAGABOND NÉON', color: 'text-gray-400', glow: 'shadow-gray-400/20' };
    }, [inventory]);

    return { 
        coins, 
        inventory, 
        addCoins, 
        buyBadge, 
        catalog: BADGES_CATALOG, 
        playerRank,
        // Identity Exports
        username,
        updateUsername,
        currentAvatarId,
        selectAvatar,
        buyAvatar,
        ownedAvatars,
        avatarsCatalog: AVATARS_CATALOG,
        // Accessories
        accessoriesCatalog: ACCESSORIES_CATALOG,
        ownedAccessories,
        equippedAccessories,
        buyAccessory,
        equipAccessory,
        // Game Unlocks
        unlockedSolutions,
        buySolution
    };
};
