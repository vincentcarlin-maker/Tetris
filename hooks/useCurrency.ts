
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
    type: 'CROWN' | 'HAT' | 'GLASSES' | 'NINJA' | 'VIKING' | 'HALO' | 'HORNS' | 'CAT_EARS' | 'MOUSTACHE' | 'MONOCLE' | 'EYEPATCH' | 'BERET' | 'CAP' | 'FEZ' | 'SOMBRERO' | 'TIARA' | 'WITCH' | 'COWBOY' | 'MASK' | 'FLOWER' | 'STAR' | 'ROBOT' | 'DEVIL' | 'ANGEL' | 'HERO';
    color: string;
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
    // --- LES CLASSIQUES (0 - 500) ---
    { id: 'ss_cyan', name: 'Cyan Néon', price: 0, primaryColor: '#00f3ff', secondaryColor: '#0088ff', glowColor: '#00f3ff', pattern: 'solid', rarity: 'COMMON', description: 'Le look original.' },
    { id: 'ss_pink', name: 'Rose Flash', price: 200, primaryColor: '#ff00ff', secondaryColor: '#cc00cc', glowColor: '#ff00ff', pattern: 'solid', rarity: 'COMMON', description: 'Vibrant et assumé.' },
    { id: 'ss_lime', name: 'Lime Toxique', price: 200, primaryColor: '#ccff00', secondaryColor: '#88aa00', glowColor: '#ccff00', pattern: 'solid', rarity: 'COMMON', description: 'Attention, corrosif !' },
    { id: 'ss_orange', name: 'Orange Feu', price: 200, primaryColor: '#ff9d00', secondaryColor: '#cc6600', glowColor: '#ff9d00', pattern: 'solid', rarity: 'COMMON', description: 'Chaleur intense.' },
    { id: 'ss_purple', name: 'Violet Royal', price: 200, primaryColor: '#9d00ff', secondaryColor: '#6600cc', glowColor: '#9d00ff', pattern: 'solid', rarity: 'COMMON', description: 'Mystique.' },
    { id: 'ss_red', name: 'Rouge Sang', price: 200, primaryColor: '#ff4d4d', secondaryColor: '#990000', glowColor: '#ff4d4d', pattern: 'solid', rarity: 'COMMON', description: 'Agressif.' },
    { id: 'ss_yellow', name: 'Jaune Solaire', price: 200, primaryColor: '#ffe600', secondaryColor: '#aa9900', glowColor: '#ffe600', pattern: 'solid', rarity: 'COMMON', description: 'Brillant.' },
    { id: 'ss_white', name: 'Blanc Pur', price: 500, primaryColor: '#ffffff', secondaryColor: '#cccccc', glowColor: '#ffffff', pattern: 'solid', rarity: 'COMMON', description: 'Éclat céleste.' },
    
    // --- MÉTALLIQUES (750 - 1500) ---
    { id: 'ss_steel', name: 'Acier Poli', price: 750, primaryColor: '#94a3b8', secondaryColor: '#475569', glowColor: '#ffffff', pattern: 'metallic', rarity: 'RARE', description: 'Reflets industriels.' },
    { id: 'ss_gold', name: 'Or Pur', price: 1500, primaryColor: '#fbbf24', secondaryColor: '#b45309', glowColor: '#fbbf24', pattern: 'metallic', rarity: 'RARE', description: 'La marque du luxe.' },
    { id: 'ss_silver', name: 'Argent Lunaire', price: 1200, primaryColor: '#e2e8f0', secondaryColor: '#94a3b8', glowColor: '#e2e8f0', pattern: 'metallic', rarity: 'RARE', description: 'Éclat de lune.' },
    { id: 'ss_bronze', name: 'Bronze Antique', price: 800, primaryColor: '#d97706', secondaryColor: '#78350f', glowColor: '#d97706', pattern: 'metallic', rarity: 'RARE', description: 'Style vintage.' },
    { id: 'ss_copper', name: 'Cuivre Brûlé', price: 900, primaryColor: '#ea580c', secondaryColor: '#9a3412', glowColor: '#ea580c', pattern: 'metallic', rarity: 'RARE', description: 'Conducteur d\'énergie.' },
    { id: 'ss_obsidian', name: 'Obsidienne', price: 1500, primaryColor: '#1e293b', secondaryColor: '#020617', glowColor: '#9d00ff', pattern: 'metallic', rarity: 'RARE', description: 'Verre volcanique.' },
    { id: 'ss_emerald_met', name: 'Émeraude Chrome', price: 1300, primaryColor: '#10b981', secondaryColor: '#064e3b', glowColor: '#10b981', pattern: 'metallic', rarity: 'RARE', description: 'Précieux et brillant.' },
    { id: 'ss_ruby_met', name: 'Rubis Chrome', price: 1300, primaryColor: '#ef4444', secondaryColor: '#7f1d1d', glowColor: '#ef4444', pattern: 'metallic', rarity: 'RARE', description: 'Éclat rubis.' },

    // --- MOTIFS (1000 - 2500) ---
    { id: 'ss_zebra', name: 'Zèbre Néon', price: 1000, primaryColor: '#ffffff', secondaryColor: '#000000', glowColor: '#ffffff', pattern: 'stripes', rarity: 'RARE', description: 'Rayures élégantes.' },
    { id: 'ss_tiger', name: 'Tigre Cyber', price: 1200, primaryColor: '#ff9d00', secondaryColor: '#000000', glowColor: '#ff9d00', pattern: 'stripes', rarity: 'RARE', description: 'Prédateur néon.' },
    { id: 'ss_checker', name: 'Damier Rétro', price: 1000, primaryColor: '#ffffff', secondaryColor: '#333333', glowColor: '#00f3ff', pattern: 'checker', rarity: 'RARE', description: 'Arcade classique.' },
    { id: 'ss_leopard', name: 'Léopard Cyan', price: 1500, primaryColor: '#00f3ff', secondaryColor: '#000000', glowColor: '#00f3ff', pattern: 'dots', rarity: 'EPIC', description: 'Agilité tachetée.' },
    { id: 'ss_dots_pink', name: 'Pois Flash', price: 1100, primaryColor: '#ff00ff', secondaryColor: '#ffffff', glowColor: '#ff00ff', pattern: 'dots', rarity: 'RARE', description: 'Look pop.' },
    { id: 'ss_army', name: 'Camouflage Cyber', price: 1400, primaryColor: '#22c55e', secondaryColor: '#064e3b', glowColor: '#22c55e', pattern: 'grid', rarity: 'RARE', description: 'Invisible sur la grille.' },
    { id: 'ss_snake_skin', name: 'Écailles Vrai', price: 2000, primaryColor: '#10b981', secondaryColor: '#facc15', glowColor: '#10b981', pattern: 'checker', rarity: 'EPIC', description: 'Comme un vrai.' },
    { id: 'ss_candy', name: 'Sucre d\'Orge', price: 1800, primaryColor: '#ff0000', secondaryColor: '#ffffff', glowColor: '#ff0000', pattern: 'stripes', rarity: 'EPIC', description: 'Délicieusement rapide.' },

    // --- COSMIQUES (3000 - 5000) ---
    { id: 'ss_galaxy', name: 'Galaxie Profonde', price: 3500, primaryColor: '#312e81', secondaryColor: '#1e1b4b', glowColor: '#a855f7', pattern: 'pulse', rarity: 'EPIC', description: 'Poussière d\'étoiles.' },
    { id: 'ss_nebula', name: 'Nébuleuse', price: 4000, primaryColor: '#ec4899', secondaryColor: '#1e1b4b', glowColor: '#ec4899', pattern: 'pulse', rarity: 'EPIC', description: 'Gaz stellaire.' },
    { id: 'ss_supernova', name: 'Supernova', price: 4500, primaryColor: '#fbbf24', secondaryColor: '#ef4444', glowColor: '#fbbf24', pattern: 'pulse', rarity: 'EPIC', description: 'Explosion cosmique.' },
    { id: 'ss_blackhole', name: 'Trou Noir', price: 5000, primaryColor: '#000000', secondaryColor: '#312e81', glowColor: '#00f3ff', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Rien ne s\'échappe.' },
    { id: 'ss_starlight', name: 'Étoilé', price: 3800, primaryColor: '#ffffff', secondaryColor: '#0f172a', glowColor: '#ffffff', pattern: 'dots', rarity: 'EPIC', description: 'Ciel de nuit.' },
    { id: 'ss_mars', name: 'Planète Rouge', price: 3200, primaryColor: '#7f1d1d', secondaryColor: '#f87171', glowColor: '#ef4444', pattern: 'pulse', rarity: 'EPIC', description: 'Vibes martiennes.' },
    { id: 'ss_jupiter', name: 'Jupiter', price: 3500, primaryColor: '#b45309', secondaryColor: '#d97706', glowColor: '#facc15', pattern: 'stripes', rarity: 'EPIC', description: 'La géante gazeuse.' },

    // --- ÉLÉMENTS & MAGIE (6000 - 10000) ---
    { id: 'ss_magma', name: 'Magma Ardent', price: 6500, primaryColor: '#ef4444', secondaryColor: '#ea580c', glowColor: '#ef4444', pattern: 'pulse', rarity: 'LEGENDARY', description: 'La lave qui coule.' },
    { id: 'ss_ice_peak', name: 'Glace Éternelle', price: 6500, primaryColor: '#22d3ee', secondaryColor: '#ffffff', glowColor: '#22d3ee', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Froid absolu.' },
    { id: 'ss_thunder', name: 'Foudre Bleue', price: 7000, primaryColor: '#00f3ff', secondaryColor: '#1e3a8a', glowColor: '#ffffff', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Électrisant.' },
    { id: 'ss_toxic_waste', name: 'Déchet Toxique', price: 6000, primaryColor: '#4ade80', secondaryColor: '#064e3b', glowColor: '#4ade80', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Radioactif.' },
    { id: 'ss_holy', name: 'Lueur Divine', price: 8500, primaryColor: '#fffbeb', secondaryColor: '#fef3c7', glowColor: '#facc15', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Lumière pure.' },
    { id: 'ss_chaos', name: 'Ombre du Chaos', price: 8500, primaryColor: '#000000', secondaryColor: '#7f1d1d', glowColor: '#ef4444', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Destruction.' },
    { id: 'ss_forest_spirit', name: 'Esprit de Forêt', price: 7500, primaryColor: '#10b981', secondaryColor: '#064e3b', glowColor: '#34d399', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Énergie vitale.' },

    // --- LÉGENDAIRES UNIQUES (15000+) ---
    { id: 'ss_rainbow_flow', name: 'Flux Chroma', price: 15000, primaryColor: '#ff0000', secondaryColor: '#ffffff', glowColor: '#00f3ff', pattern: 'rainbow', rarity: 'LEGENDARY', description: 'Toutes les fréquences.' },
    { id: 'ss_diamond_core', name: 'Cœur de Diamant', price: 20000, primaryColor: '#ffffff', secondaryColor: '#bae6fd', glowColor: '#38bdf8', pattern: 'metallic', rarity: 'LEGENDARY', description: 'Indestructible.' },
    { id: 'ss_void', name: 'Le Vide', price: 25000, primaryColor: '#000000', secondaryColor: '#000000', glowColor: '#ffffff', pattern: 'pulse', rarity: 'LEGENDARY', description: 'La fin de tout.' },
    { id: 'ss_cyber_pulse', name: 'Pulse Cyberpunk', price: 18000, primaryColor: '#ff00ff', secondaryColor: '#00f3ff', glowColor: '#ff00ff', pattern: 'grid', rarity: 'LEGENDARY', description: 'Future Noir.' },
    { id: 'ss_golden_dragon', name: 'Dragon d\'Or', price: 50000, primaryColor: '#fbbf24', secondaryColor: '#d97706', glowColor: '#fbbf24', pattern: 'checker', rarity: 'LEGENDARY', description: 'Le souverain de l\'arène.' },
    { id: 'ss_plasma_storm', name: 'Tempête Plasma', price: 16000, primaryColor: '#a855f7', secondaryColor: '#06b6d4', glowColor: '#a855f7', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Énergie cinétique.' },
    { id: 'ss_matrix_core', name: 'Code Source', price: 17000, primaryColor: '#00ff00', secondaryColor: '#000000', glowColor: '#00ff00', pattern: 'grid', rarity: 'LEGENDARY', description: 'Vous voyez les lignes.' },
    { id: 'ss_blood_moon', name: 'Lune de Sang', price: 14000, primaryColor: '#450a0a', secondaryColor: '#ef4444', glowColor: '#ef4444', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Nuit de chasse.' },
    { id: 'ss_hologram', name: 'Hologramme', price: 19000, primaryColor: '#00f3ff', secondaryColor: '#ffffff', glowColor: '#00f3ff', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Immatériel.' },
    { id: 'ss_dark_fire', name: 'Feu Sombre', price: 22000, primaryColor: '#000000', secondaryColor: '#ea580c', glowColor: '#ea580c', pattern: 'pulse', rarity: 'LEGENDARY', description: 'Chaleur froide.' },
    { id: 'ss_infinity', name: 'Infini', price: 100000, primaryColor: '#ffffff', secondaryColor: '#000000', glowColor: '#ffffff', pattern: 'rainbow', rarity: 'LEGENDARY', description: 'L\'ultime trophée.' },
];

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
    { id: 'av_cat', name: 'Néon Cat', price: 1000, icon: Cat, color: 'text-pink-400', bgGradient: 'from-pink-900/50 to-purple-900/50' },
    { id: 'av_unicorn', name: 'Licorne', price: 5000, icon: Sparkles, color: 'text-white', bgGradient: 'from-pink-300 via-purple-300 to-indigo-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]' },
    { id: 'av_flower', name: 'Fleur', price: 1500, icon: Flower, color: 'text-fuchsia-400', bgGradient: 'from-fuchsia-900/50 to-pink-900/50' },
    { id: 'av_love', name: 'Love', price: 2000, icon: Heart, color: 'text-red-500', bgGradient: 'from-red-900/50 to-rose-900/50' },
    { id: 'av_ring', name: 'Bague', price: 4000, icon: Gem, color: 'text-cyan-200', bgGradient: 'from-yellow-400/60 via-yellow-600/60 to-amber-700/60 ring-2 ring-yellow-400/50' },
    { id: 'av_bag', name: 'Sac', price: 2000, icon: ShoppingBag, color: 'text-rose-400', bgGradient: 'from-rose-900/50 to-red-900/50' },
    { id: 'av_rainbow', name: 'Arc-en-ciel', price: 6000, icon: Rainbow, color: 'text-indigo-300', bgGradient: 'from-red-500/30 via-green-500/30 to-blue-500/30' },
    { id: 'av_sun', name: 'Soleil', price: 2500, icon: Sun, color: 'text-orange-400', bgGradient: 'from-orange-900/50 to-yellow-900/50' },
    { id: 'av_moon', name: 'Lune', price: 2500, icon: Moon, color: 'text-indigo-300', bgGradient: 'from-indigo-900/50 to-slate-900/50' },
    { id: 'av_ice', name: 'Glace', price: 3000, icon: Snowflake, color: 'text-cyan-200', bgGradient: 'from-cyan-900/50 to-white/10' },
    { id: 'av_water', name: 'Eau', price: 3000, icon: Droplets, color: 'text-blue-400', bgGradient: 'from-blue-900/50 to-cyan-900/50' },
    { id: 'av_music', name: 'Musique', price: 2500, icon: Music, color: 'text-violet-400', bgGradient: 'from-violet-900/50 to-fuchsia-900/50' },
    { id: 'av_anchor', name: 'Ancre', price: 2000, icon: Anchor, color: 'text-teal-400', bgGradient: 'from-teal-900/50 to-cyan-900/50' },
    { id: 'av_magic', name: 'Magie', price: 3000, icon: Sparkles, color: 'text-purple-300', bgGradient: 'from-purple-900/50 to-indigo-900/50' },
    { id: 'av_precious', name: 'Précieux', price: 5000, icon: Gem, color: 'text-cyan-300', bgGradient: 'from-cyan-900/50 to-emerald-900/50' },
    { id: 'av_smile', name: 'Good Vibes', price: 500, icon: Smile, color: 'text-yellow-400', bgGradient: 'from-yellow-900/50 to-orange-900/50' },
    { id: 'av_zap', name: 'Voltage', price: 1000, icon: Zap, color: 'text-blue-400', bgGradient: 'from-blue-900/50 to-cyan-900/50' },
    { id: 'av_game', name: 'Pro Gamer', price: 2000, icon: Gamepad2, color: 'text-purple-400', bgGradient: 'from-purple-900/50 to-pink-900/50' },
    { id: 'av_music_dj', name: 'DJ Néon', price: 3000, icon: Headphones, color: 'text-pink-400', bgGradient: 'from-pink-900/50 to-rose-900/50' },
    { id: 'av_skull', name: 'Hardcore', price: 5000, icon: Skull, color: 'text-red-500', bgGradient: 'from-red-900/50 to-orange-900/50' },
    { id: 'av_ghost', name: 'Spectre', price: 7500, icon: Ghost, color: 'text-indigo-400', bgGradient: 'from-indigo-900/50 to-violet-900/50' },
    { id: 'av_rocket', name: 'Cosmique', price: 10000, icon: Rocket, color: 'text-emerald-400', bgGradient: 'from-emerald-900/50 to-teal-900/50' },
    { id: 'av_king', name: 'Le King', price: 25000, icon: Crown, color: 'text-amber-400', bgGradient: 'from-amber-900/50 to-yellow-900/50' },
];

export const SLITHER_ACCESSORIES_CATALOG: SlitherAccessory[] = [
    { id: 'sa_none', name: 'Aucun', price: 0, type: 'HAT', color: 'transparent', description: 'Garder la tête libre.' },
    { id: 'sa_crown_gold', name: 'Couronne d\'Or', price: 5000, type: 'CROWN', color: '#ffe600', description: 'Le roi de l\'arène.' },
    { id: 'sa_crown_silver', name: 'Couronne d\'Argent', price: 4000, type: 'CROWN', color: '#e2e8f0', description: 'Éclat métallique.' },
    { id: 'sa_tiara_pink', name: 'Diadème Rose', price: 3500, type: 'TIARA', color: '#ff00ff', description: 'Élégance néon.' },
    { id: 'sa_tophat_black', name: 'Haut-de-forme Noir', price: 1500, type: 'HAT', color: '#111827', description: 'Un ver distingué.' },
    { id: 'sa_beret_red', name: 'Béret Rouge', price: 1000, type: 'BERET', color: '#ef4444', description: 'L\'artiste de l\'arène.' },
    { id: 'sa_cap_red', name: 'Casquette Rouge', price: 800, type: 'CAP', color: '#ef4444', description: 'Ver sportif.' },
    { id: 'sa_cowboy_brown', name: 'Chapeau Cowboy', price: 2500, type: 'COWBOY', color: '#78350f', description: 'Le shérif glissant.' },
    { id: 'sa_witch', name: 'Chapeau de Sorcier', price: 4500, type: 'WITCH', color: '#4c1d95', description: 'Magie noire.' },
    { id: 'sa_sunglasses_black', name: 'Cyber Lunettes', price: 1000, type: 'GLASSES', color: '#00f3ff', description: 'Style futuriste.' },
    { id: 'sa_ninja_red', name: 'Bandeau Ninja Rouge', price: 2000, type: 'NINJA', color: '#ef4444', description: 'Maître du camouflage.' },
    { id: 'sa_halo_gold', name: 'Auréole Céleste', price: 5000, type: 'HALO', color: '#ffe600', description: 'Ver angélique.' },
    { id: 'sa_horns_red', name: 'Cornes Démoniaques', price: 5000, type: 'HORNS', color: '#ef4444', description: 'Petit diable.' },
];

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
    { id: 'fr_neon_blue', name: 'Néon Bleu', price: 500, cssClass: 'border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse', description: 'Une lueur froide.' },
    { id: 'fr_neon_pink', name: 'Néon Rose', price: 500, cssClass: 'border-pink-500 shadow-[0_0_10px_#ec4899] animate-pulse', description: 'Flashy et stylé.' },
    { id: 'fr_toxic', name: 'Toxique', price: 1500, cssClass: 'border-lime-500 shadow-[0_0_15px_#84cc16] bg-[radial-gradient(circle,transparent_40%,rgba(132,204,22,0.3)_100%)]', description: 'Attention, corrosif.' },
    { id: 'fr_gold', name: 'Or Pur', price: 2500, cssClass: 'border-yellow-400 shadow-[0_0_15px_#facc15] bg-gradient-to-br from-yellow-300/20 to-yellow-600/20', description: 'Le luxe absolu.' },
];

export const WALLPAPERS_CATALOG: Wallpaper[] = [
    { id: 'bg_brick', name: 'Briques Sombres', price: 0, cssValue: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 100%), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'60\' viewBox=\'0 0 200 60\'%3E%3Cdefs%3E%3Cfilter id=\'roughEdges\' x=\'-20%25\' y=\'-20%25\' width=\'140%25\' height=\'140%25\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'4\' result=\'noise\'/%3E%3CfeDisplacementMap in=\'SourceGraphic\' in2=\'noise\' scale=\'1.5\' xChannelSelector=\'R\' yChannelSelector=\'G\'/%3E%3C/filter%3E%3Cfilter id=\'grain\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'200\' height=\'60\' fill=\'%23050505\'/%3E%3Cg filter=\'url(%23roughEdges)\'%3E%3Crect x=\'2\' y=\'2\' width=\'96\' height=\'26\' fill=\'%2315151a\' /%3E%3Crect x=\'102\' y=\'2\' width=\'96\' height=\'26\' fill=\'%23131318\' /%3E%3Crect x=\'-2\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23111116\' /%3E%3Crect x=\'52\' y=\'32\' width=\'96\' height=\'26\' fill=\'%23141419\' /%3E%3Crect x=\'152\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23121217\' /%3E%3C/g%3E%3Crect width=\'200\' height=\'60\' fill=\'%23fff\' opacity=\'0.05\' filter=\'url(%23grain)\'/%3E%3C/svg%3E")', description: 'L\'atmosphère originale.' },
    { id: 'bg_cyber_grid', name: 'Grille Néon', price: 1000, cssValue: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px), #020205', bgSize: '40px 40px', description: 'Un classique de la science-fiction.' },
    { id: 'bg_sunset', name: 'Horizon Synth', price: 2500, cssValue: 'linear-gradient(to bottom, #2d0b5a 0%, #7c1d7c 50%, #f97316 100%)', description: 'Une ambiance retro-wave chaleureuse.' },
    { id: 'bg_matrix', name: 'Code Source', price: 4000, cssValue: 'linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0.9)), repeating-linear-gradient(0deg, rgba(0,255,0,0.1) 0px, rgba(0,255,0,0.1) 1px, transparent 1px, transparent 2px)', bgSize: '100% 3px', description: 'Entrez dans la simulation.' },
    { id: 'bg_nebula', name: 'Nébuleuse Astral', price: 1500, cssValue: 'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)', description: 'Le calme des profondeurs de l\'espace.' },
    { id: 'bg_speed', name: 'Vitesse Lumière', price: 5000, cssValue: 'black url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'1\' height=\'20\' x=\'50\' y=\'10\' fill=\'white\' opacity=\'0.3\' /%3E%3Crect width=\'1\' height=\'30\' x=\'20\' y=\'60\' fill=\'white\' opacity=\'0.2\' /%3E%3Crect width=\'1\' height=\'15\' x=\'80\' y=\'40\' fill=\'white\' opacity=\'0.4\' /%3E%3C/svg%3E")', bgSize: '200px 200px', description: 'Pour ceux qui ne s\'arrêtent jamais.' }
];

export const TITLES_CATALOG: Title[] = [
    { id: 't_none', name: '', price: 0, color: 'text-gray-500', description: 'Aucun titre.' },
    { id: 't_novice', name: 'NOVICE', price: 100, color: 'text-gray-400', description: 'On commence tous quelque part.' },
];

export const MALLETS_CATALOG: Mallet[] = [
    // --- LES CLASSIQUES (0 - 500) ---
    { id: 'm_classic', name: 'Classique Cyan', price: 0, colors: ['#00f3ff'], type: 'basic', description: 'Le standard de l\'arcade.' },
    { id: 'm_basic_pink', name: 'Simple Rose', price: 200, colors: ['#ff00ff'], type: 'basic', description: 'Un classique vibrant.' },
    { id: 'm_basic_yellow', name: 'Simple Jaune', price: 200, colors: ['#ffe600'], type: 'basic', description: 'Eclat pur.' },
    { id: 'm_basic_green', name: 'Simple Vert', price: 200, colors: ['#00ff9d'], type: 'basic', description: 'Énergie naturelle.' },
    { id: 'm_fire', name: 'Feu Solaire', price: 500, colors: ['#ff4500'], type: 'basic', description: 'Une frappe brûlante.' },
    { id: 'm_poison', name: 'Venin', price: 500, colors: ['#a3e635'], type: 'basic', description: 'Rapide et toxique.' },
    { id: 'm_obsidian', name: 'Obsidienne', price: 500, colors: ['#1e293b'], type: 'basic', description: 'Frappe sombre.' },
    { id: 'm_ghost', name: 'Spectre', price: 500, colors: ['#e2e8f0'], type: 'basic', description: 'Presque invisible.' },

    // --- DÉGRADÉS NÉON (750 - 2000) ---
    { id: 'm_plasma', name: 'Plasma Pink', price: 1000, colors: ['#ff00ff', '#9d00ff'], type: 'gradient', description: 'Énergie pure.' },
    { id: 'm_arctic', name: 'Cristal', price: 1000, colors: ['#ffffff', '#00f3ff'], type: 'gradient', description: 'Froid comme la glace.' },
    { id: 'm_sunset', name: 'Crépuscule', price: 1200, colors: ['#f97316', '#ef4444'], type: 'gradient', description: 'Couleurs du soir.' },
    { id: 'm_ocean', name: 'Abysse', price: 1200, colors: ['#1e3a8a', '#06b6d4'], type: 'gradient', description: 'Profondeur marine.' },
    { id: 'm_forest', name: 'Amazonie', price: 1200, colors: ['#064e3b', '#22c55e'], type: 'gradient', description: 'Force de la jungle.' },
    { id: 'm_electric', name: 'Voltage', price: 1500, colors: ['#facc15', '#00f3ff'], type: 'gradient', description: 'Haute tension.' },
    { id: 'm_cyber', name: 'Cyberpunk', price: 1800, colors: ['#ff00ff', '#00f3ff'], type: 'gradient', description: 'Le futur maintenant.' },
    { id: 'm_nebula', name: 'Nébuleuse', price: 2000, colors: ['#7c3aed', '#db2777'], type: 'gradient', description: 'Gaz stellaire.' },

    // --- MÉTALLIQUES & LUXE (2500 - 5000) ---
    { id: 'm_iron', name: 'Fer Forgé', price: 2500, colors: ['#475569', '#1e293b'], type: 'gradient', description: 'Solidité brute.' },
    { id: 'm_silver', name: 'Argent Pur', price: 3000, colors: ['#e2e8f0', '#94a3b8'], type: 'gradient', description: 'Éclat métallique.' },
    { id: 'm_gold', name: 'Or Pur', price: 5000, colors: ['#facc15', '#a16207'], type: 'gradient', description: 'Le luxe de la victoire.' },
    { id: 'm_ruby', name: 'Rubis Noir', price: 4500, colors: ['#ef4444', '#000000'], type: 'gradient', description: 'Pierre précieuse sombre.' },
    { id: 'm_emerald', name: 'Émeraude', price: 4500, colors: ['#10b981', '#064e3b'], type: 'gradient', description: 'Éclat vert précieux.' },
    { id: 'm_sapphire', name: 'Saphir', price: 4500, colors: ['#3b82f6', '#1e3a8a'], type: 'gradient', description: 'Bleu royal intense.' },
    { id: 'm_platinum', name: 'Platine', price: 5000, colors: ['#ffffff', '#cbd5e1'], type: 'gradient', description: 'Rareté absolue.' },

    // --- MOTIFS SPÉCIAUX (2000 - 4000) ---
    { id: 'm_target', name: 'Précision', price: 2000, colors: ['#ffffff', '#ff0000'], type: 'target', description: 'Visez juste.' },
    { id: 'm_bullseye', name: 'Plein Centre', price: 2500, colors: ['#000000', '#00ff00'], type: 'target', description: 'Focus total.' },
    { id: 'm_flower_pink', name: 'Lotus', price: 3000, colors: ['#ff00ff', '#ffffff'], type: 'flower', description: 'Éclat floral.' },
    { id: 'm_flower_blue', name: 'Iris', price: 3000, colors: ['#00f3ff', '#1e3a8a'], type: 'flower', description: 'Zenitude néon.' },
    { id: 'm_toxic_ring', name: 'Biohazard', price: 3500, colors: ['#000000', '#ccff00'], type: 'target', description: 'Danger imminent.' },
    { id: 'm_vortex', name: 'Vortex', price: 4000, colors: ['#000000', '#9d00ff'], type: 'target', description: 'Aspiration vers la victoire.' },

    // --- ÉLÉMENTAIRES & NATURE (6000 - 9000) ---
    { id: 'm_magma', name: 'Magma', price: 6000, colors: ['#ff4500', '#000000', '#ff0000'], type: 'complex', description: 'Fusion volcanique.' },
    { id: 'm_thunder', name: 'Foudre', price: 7000, colors: ['#00f3ff', '#ffffff', '#1e3a8a'], type: 'complex', description: 'Électrisant.' },
    { id: 'm_toxic_slime', name: 'Slime', price: 6500, colors: ['#ccff00', '#064e3b', '#ccff00'], type: 'complex', description: 'Visqueux mais efficace.' },
    { id: 'm_ice_age', name: 'Glaciaire', price: 7500, colors: ['#ffffff', '#93c5fd', '#1e3a8a'], type: 'complex', description: 'Zéro absolu.' },
    { id: 'm_solar_flare', name: 'Éruption', price: 8000, colors: ['#facc15', '#f97316', '#ef4444'], type: 'complex', description: 'Tempête solaire.' },
    { id: 'm_abyss_depth', name: 'Abyssal', price: 8500, colors: ['#000000', '#1e1b4b', '#3b82f6'], type: 'complex', description: 'Le noir des profondeurs.' },

    // --- LÉGENDAIRES (10000 - 50000) ---
    { id: 'm_rainbow', name: 'Chroma', price: 10000, colors: ['#ff0000', '#00ff00', '#0000ff'], type: 'complex', description: 'Toutes les fréquences.' },
    { id: 'm_void', name: 'Le Vide', price: 15000, colors: ['#000000', '#000000', '#ffffff'], type: 'complex', description: 'L\'absence de lumière.' },
    { id: 'm_matrix', name: 'Code Source', price: 20000, colors: ['#00ff00', '#000000', '#00ff00'], type: 'complex', description: 'Entrez dans la simulation.' },
    { id: 'm_galaxy_master', name: 'Galactique', price: 25000, colors: ['#4c1d95', '#ec4899', '#3b82f6'], type: 'complex', description: 'Souverain de l\'espace.' },
    { id: 'm_supernova_legend', name: 'Supernova', price: 30000, colors: ['#ffffff', '#fbbf24', '#ef4444'], type: 'complex', description: 'Explosion finale.' },
    { id: 'm_diamond_core', name: 'Cœur de Diamant', price: 40000, colors: ['#ffffff', '#bae6fd', '#ffffff'], type: 'complex', description: 'Indestructible.' },
    { id: 'm_infinity_mallet', name: 'L\'Infini', price: 50000, colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'], type: 'complex', description: 'L\'ultime maillet.' },

    // --- ÉDITIONS SPÉCIALES ---
    { id: 'm_zebra_cyber', name: 'Zèbre Cyber', price: 4000, colors: ['#ffffff', '#000000', '#ffffff'], type: 'complex', description: 'Rayures futuristes.' },
    { id: 'm_neon_pulse', name: 'Pulsation', price: 5500, colors: ['#00f3ff', '#000000', '#ff00ff'], type: 'complex', description: 'Rythme visuel.' },
    { id: 'm_lava_lamp', name: 'Lava Lamp', price: 6000, colors: ['#f97316', '#9d00ff'], type: 'gradient', description: 'Psychédélique.' },
    { id: 'm_arctic_storm', name: 'Blizzard', price: 7000, colors: ['#e2e8f0', '#ffffff', '#00f3ff'], type: 'complex', description: 'Froid tourbillonnant.' },
    { id: 'm_cyber_dragon', name: 'Dragon', price: 12000, colors: ['#ef4444', '#facc15', '#000000'], type: 'complex', description: 'Souffle de feu.' },
    { id: 'm_hologram', name: 'Hologramme', price: 18000, colors: ['#a5f3fc', '#ffffff', '#a5f3fc'], type: 'complex', description: 'Immatériel.' },
    { id: 'm_midnight', name: 'Minuit', price: 3500, colors: ['#0f172a', '#334155'], type: 'gradient', description: 'Ciel nocturne.' },
    { id: 'm_stardust', name: 'Poussière d\'Etoiles', price: 8500, colors: ['#ffffff', '#000000', '#facc15'], type: 'complex', description: 'Éclats cosmiques.' },
];

export type Language = 'fr' | 'en';

export const TRANSLATIONS: Record<Language, any> = {
    fr: {
        settings: "Réglages",
        language: "Langue",
        profile: "Mon Profil Néon",
        style: "Style Néon",
        performance: "Performance",
        account: "Compte",
        legal: "Légal & Infos",
        danger_zone: "Zone de Danger",
        logout: "Déconnexion",
        score: "Score",
        record: "Record",
        coins: "Pièces",
        badges: "Badges",
        motion_reduced: "Motion Réduite",
        sound_fx: "Effets Sonores",
        edit_password: "Changer Mot de Passe",
        delete_account: "Supprimer Compte",
        welcome: "Neon Arcade",
        play: "Jouer",
        online_users: "En Ligne",
        shop: "Boutique",
        chat: "Chat",
        social: "Social",
        home: "Accueil"
    },
    en: {
        settings: "Settings",
        language: "Language",
        profile: "My Neon Profile",
        style: "Neon Style",
        performance: "Performance",
        account: "Account",
        legal: "Legal & Info",
        danger_zone: "Danger Zone",
        logout: "Log Out",
        score: "Score",
        record: "Record",
        coins: "Coins",
        badges: "Badges",
        motion_reduced: "Reduced Motion",
        sound_fx: "Sound Effects",
        edit_password: "Change Password",
        delete_account: "Delete Account",
        welcome: "Neon Arcade",
        play: "Play",
        online_users: "Online",
        shop: "Shop",
        chat: "Chat",
        social: "Social",
        home: "Home"
    }
};

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
    
    const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('neon-language') as Language) || 'fr');

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

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('neon-language', lang);
    };

    const t = useMemo(() => TRANSLATIONS[language], [language]);

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
