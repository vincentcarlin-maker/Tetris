
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Zap, Star, Crown, Flame, Target, Ghost, Smile, Hexagon, Gem, Heart, Rocket } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  price: number;
  icon: any;
  description: string;
  color: string;
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

export const useCurrency = () => {
    const [coins, setCoins] = useState(0);
    const [inventory, setInventory] = useState<string[]>([]);

    useEffect(() => {
        const storedCoins = localStorage.getItem('neon-coins');
        const storedInv = localStorage.getItem('neon-inventory');
        
        if (storedCoins) setCoins(parseInt(storedCoins, 10));
        if (storedInv) setInventory(JSON.parse(storedInv));
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

    // Système de Rangs basé sur le nombre de badges
    const playerRank = useMemo(() => {
        const count = inventory.length;
        if (count >= 12) return { title: 'LÉGENDE VIVANTE', color: 'text-amber-400', glow: 'shadow-amber-400/50' };
        if (count >= 8) return { title: 'MAÎTRE ARCADE', color: 'text-purple-400', glow: 'shadow-purple-400/50' };
        if (count >= 5) return { title: 'CHASSEUR DE PIXELS', color: 'text-cyan-400', glow: 'shadow-cyan-400/50' };
        if (count >= 2) return { title: 'EXPLORATEUR', color: 'text-green-400', glow: 'shadow-green-400/50' };
        return { title: 'VAGABOND NÉON', color: 'text-gray-400', glow: 'shadow-gray-400/20' };
    }, [inventory]);

    return { coins, inventory, addCoins, buyBadge, catalog: BADGES_CATALOG, playerRank };
};
