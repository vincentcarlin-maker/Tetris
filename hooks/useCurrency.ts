
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Zap, Star, Crown, Flame, Target, Ghost, Smile, Hexagon, Gem, Heart, Rocket, Bot, User, Gamepad2, Headphones, Skull, Circle, Sparkles, Box } from 'lucide-react';

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
    cssClass: string; // Tailwind classes for the border/glow
    description: string;
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

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
    { id: 'fr_neon_blue', name: 'Néon Bleu', price: 500, cssClass: 'border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse', description: 'Une lueur froide.' },
    { id: 'fr_neon_pink', name: 'Néon Rose', price: 500, cssClass: 'border-pink-500 shadow-[0_0_10px_#ec4899] animate-pulse', description: 'Flashy et stylé.' },
    { id: 'fr_gold', name: 'Or Pur', price: 2500, cssClass: 'border-yellow-400 shadow-[0_0_15px_#facc15] bg-gradient-to-br from-yellow-300/20 to-yellow-600/20', description: 'Le luxe absolu.' },
    { id: 'fr_glitch', name: 'Glitch', price: 5000, cssClass: 'border-red-500 shadow-[2px_0_0_#00f3ff,-2px_0_0_#ff00ff] animate-pulse', description: 'Erreur système détectée.' },
    { id: 'fr_rainbow', name: 'Arc-en-ciel', price: 8000, cssClass: 'border-transparent bg-[linear-gradient(45deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] bg-[length:400%] animate-[gradient_3s_linear_infinite] shadow-lg', description: 'Toutes les couleurs.' },
    { id: 'fr_fire', name: 'Infernal', price: 12000, cssClass: 'border-orange-600 shadow-[0_0_20px_#ea580c] animate-[pulse_0.5s_ease-in-out_infinite]', description: 'Brûlant.' },
    { id: 'fr_diamond', name: 'Diamant', price: 20000, cssClass: 'border-cyan-200 shadow-[0_0_20px_#a5f3fc] ring-2 ring-white/50', description: 'Incassable et brillant.' },
];

export const SOLUTION_COST = 200;

export const useCurrency = () => {
    const [coins, setCoins] = useState(0);
    const [inventory, setInventory] = useState<string[]>([]);
    
    // User Identity
    const [username, setUsername] = useState("Joueur Néon");
    const [currentAvatarId, setCurrentAvatarId] = useState("av_bot");
    const [ownedAvatars, setOwnedAvatars] = useState<string[]>(["av_bot", "av_human"]);
    
    const [currentFrameId, setCurrentFrameId] = useState("fr_none");
    const [ownedFrames, setOwnedFrames] = useState<string[]>(["fr_none"]);

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
        const storedFrame = localStorage.getItem('neon-frame');
        const storedOwnedFrames = localStorage.getItem('neon-owned-frames');

        if (storedName) setUsername(storedName);
        if (storedAvatar) setCurrentAvatarId(storedAvatar);
        if (storedOwnedAvatars) setOwnedAvatars(JSON.parse(storedOwnedAvatars));
        
        if (storedFrame) setCurrentFrameId(storedFrame);
        if (storedOwnedFrames) setOwnedFrames(JSON.parse(storedOwnedFrames));

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

    const selectAvatar = useCallback((avatarId: string) => {
        if (ownedAvatars.includes(avatarId)) {
            setCurrentAvatarId(avatarId);
            localStorage.setItem('neon-avatar', avatarId);
        }
    }, [ownedAvatars]);

    const buyFrame = useCallback((frameId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedFrames(prevOwned => {
                    const newOwned = [...prevOwned, frameId];
                    localStorage.setItem('neon-owned-frames', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const selectFrame = useCallback((frameId: string) => {
        if (ownedFrames.includes(frameId)) {
            setCurrentFrameId(frameId);
            localStorage.setItem('neon-frame', frameId);
        }
    }, [ownedFrames]);

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
        // Frames
        currentFrameId,
        selectFrame,
        buyFrame,
        ownedFrames,
        framesCatalog: FRAMES_CATALOG,
        // Game Unlocks
        unlockedSolutions,
        buySolution
    };
};
