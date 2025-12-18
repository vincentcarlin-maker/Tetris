
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Zap, Star, Crown, Flame, Target, Ghost, Smile, Hexagon, Gem, Heart, Rocket, Bot, User, Gamepad2, Headphones, Skull, Circle, Sparkles, Box, Image, Type, Cat, Flower, Rainbow, ShoppingBag, Sun, Moon, Snowflake, Droplets, Music, Anchor, Terminal, TreeDeciduous, Waves, Sunset, Disc } from 'lucide-react';

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

export interface Wallpaper {
    id: string;
    name: string;
    price: number;
    cssValue: string; // CSS background property
    description: string;
    bgSize?: string; // Optional custom background size
}

export interface Title {
    id: string;
    name: string; // The text displayed
    price: number;
    color: string; // Tailwind text color class
    description: string;
}

export interface Mallet {
    id: string;
    name: string;
    price: number;
    colors: string[]; // Colors used for gradient or patterns
    type: 'basic' | 'gradient' | 'ring' | 'flower' | 'target' | 'complex';
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

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
    { id: 'fr_neon_blue', name: 'Néon Bleu', price: 500, cssClass: 'border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse', description: 'Une lueur froide.' },
    { id: 'fr_neon_pink', name: 'Néon Rose', price: 500, cssClass: 'border-pink-500 shadow-[0_0_10px_#ec4899] animate-pulse', description: 'Flashy et stylé.' },
    { id: 'fr_toxic', name: 'Toxique', price: 1500, cssClass: 'border-lime-500 shadow-[0_0_15px_#84cc16] bg-[radial-gradient(circle,transparent_40%,rgba(132,204,22,0.3)_100%)]', description: 'Attention, corrosif.' },
    { id: 'fr_nature', name: 'Nature', price: 2000, cssClass: 'border-emerald-500 ring-2 ring-green-800 shadow-[0_0_10px_#10b981]', description: 'Force de la terre.' },
    { id: 'fr_gold', name: 'Or Pur', price: 2500, cssClass: 'border-yellow-400 shadow-[0_0_15px_#facc15] bg-gradient-to-br from-yellow-300/20 to-yellow-600/20', description: 'Le luxe absolu.' },
    { id: 'fr_ice', name: 'Glace', price: 3000, cssClass: 'border-cyan-200 shadow-[0_0_15px_#a5f3fc] bg-gradient-to-t from-white/10 to-cyan-400/20', description: 'Refroidissement liquide.' },
    { id: 'fr_love', name: 'Amour', price: 3500, cssClass: 'border-rose-500 shadow-[0_0_15px_#f43f5e] ring-2 ring-pink-400/50', description: 'Cœur ardent.' },
    { id: 'fr_forest', name: 'Forêt', price: 4000, cssClass: 'border-green-700 ring-4 ring-green-900/50 shadow-[0_0_15px_#15803d]', description: 'Profond et mystérieux.' },
    { id: 'fr_cyber', name: 'Cyber', price: 4500, cssClass: 'border-yellow-400 border-dashed ring-1 ring-black shadow-[0_0_10px_#facc15] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(250,204,21,0.1)_5px,rgba(250,204,21,0.1)_10px)]', description: 'Alerte système.' },
    { id: 'fr_ocean', name: 'Océan', price: 4800, cssClass: 'border-blue-600 shadow-[0_0_20px_#2563eb] bg-gradient-to-b from-cyan-500/20 to-blue-900/50', description: 'Les abysses.' },
    { id: 'fr_glitch', name: 'Glitch', price: 5000, cssClass: 'border-red-500 shadow-[2px_0_0_#00f3ff,-2px_0_0_#ff00ff] animate-pulse', description: 'Erreur système détectée.' },
    { id: 'fr_sunset', name: 'Sunset', price: 5500, cssClass: 'border-orange-500 shadow-[0_0_15px_#f97316] bg-gradient-to-tr from-purple-500/30 to-orange-500/30', description: 'Vibes relax.' },
    { id: 'fr_galaxy', name: 'Galaxie', price: 6000, cssClass: 'border-indigo-400 shadow-[0_0_20px_#818cf8] bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900', description: 'L\'immensité de l\'espace.' },
    { id: 'fr_terminal', name: 'Terminal', price: 7000, cssClass: 'border-green-500 border-2 font-mono bg-black/80 shadow-[inset_0_0_10px_#22c55e]', description: '>_ System Ready' },
    { id: 'fr_rainbow', name: 'Arc-en-ciel', price: 8000, cssClass: 'border-transparent bg-[linear-gradient(45deg,#ff0000,#ff7300,#fffb00,#48ff00,#00ffd5,#002bff,#7a00ff,#ff00c8,#ff0000)] bg-[length:400%] animate-[gradient_3s_linear_infinite] shadow-lg', description: 'Toutes les couleurs.' },
    { id: 'fr_bw', name: 'Noir & Blanc', price: 9000, cssClass: 'border-white bg-black grayscale shadow-[0_0_0_4px_black,0_0_0_6px_white]', description: 'Classique intemporel.' },
    { id: 'fr_royal', name: 'Royal', price: 10000, cssClass: 'border-purple-600 ring-4 ring-yellow-500 shadow-[0_0_25px_#9333ea]', description: 'Pour les rois et reines.' },
    { id: 'fr_fire', name: 'Infernal', price: 12000, cssClass: 'border-orange-600 shadow-[0_0_20px_#ea580c] animate-[pulse_0.5s_ease-in-out_infinite] bg-gradient-to-t from-red-600/30 to-orange-500/10', description: 'Brûlant.' },
    { id: 'fr_matrix', name: 'Matrice', price: 15000, cssClass: 'border-green-500 shadow-[inset_0_0_20px_#22c55e] font-mono', description: 'Le code source.' },
    { id: 'fr_diamond', name: 'Diamant', price: 20000, cssClass: 'border-cyan-100 shadow-[0_0_20px_#cffafe] ring-2 ring-white bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.4)_100%)]', description: 'Incassable et brillant.' },
    { id: 'fr_angel', name: 'Angélique', price: 25000, cssClass: 'border-white ring-4 ring-white/30 shadow-[0_0_30px_white] bg-white/10', description: 'Pur et céleste.' },
    { id: 'fr_demon', name: 'Démoniaque', price: 30000, cssClass: 'border-red-900 ring-2 ring-red-600 shadow-[0_0_30px_#7f1d1d] bg-gradient-to-b from-black via-red-900/50 to-black', description: 'Sombre et puissant.' },
];

export const WALLPAPERS_CATALOG: Wallpaper[] = [
    { id: 'bg_brick', name: 'Briques Sombres', price: 0, cssValue: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 100%), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'60\' viewBox=\'0 0 200 60\'%3E%3Cdefs%3E%3Cfilter id=\'roughEdges\' x=\'-20%25\' y=\'-20%25\' width=\'140%25\' height=\'140%25\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'4\' result=\'noise\'/%3E%3CfeDisplacementMap in=\'SourceGraphic\' in2=\'noise\' scale=\'1.5\' xChannelSelector=\'R\' yChannelSelector=\'G\'/%3E%3C/filter%3E%3Cfilter id=\'grain\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'200\' height=\'60\' fill=\'%23050505\'/%3E%3Cg filter=\'url(%23roughEdges)\'%3E%3Crect x=\'2\' y=\'2\' width=\'96\' height=\'26\' fill=\'%2315151a\' /%3E%3Crect x=\'102\' y=\'2\' width=\'96\' height=\'26\' fill=\'%23131318\' /%3E%3Crect x=\'-2\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23111116\' /%3E%3Crect x=\'52\' y=\'32\' width=\'96\' height=\'26\' fill=\'%23141419\' /%3E%3Crect x=\'152\' y=\'32\' width=\'50\' height=\'26\' fill=\'%23121217\' /%3E%3C/g%3E%3Crect width=\'200\' height=\'60\' fill=\'%23fff\' opacity=\'0.05\' filter=\'url(%23grain)\'/%3E%3C/svg%3E")', description: 'L\'atmosphère originale.' },
    { id: 'bg_grid', name: 'Grille Rétro', price: 1000, cssValue: 'linear-gradient(rgba(0, 0, 0, 0.9) 0%, rgba(20, 0, 30, 0.9) 100%), repeating-linear-gradient(0deg, transparent 0, transparent 49px, rgba(255, 0, 255, 0.1) 50px), repeating-linear-gradient(90deg, transparent 0, transparent 49px, rgba(0, 243, 255, 0.1) 50px)', description: 'Le cyber-espace classique.' },
    { id: 'bg_carbon', name: 'Fibre Carbone', price: 1500, cssValue: 'radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px, #282828', description: 'Résistant et léger.', bgSize: '16px 16px' },
    { id: 'bg_stars', name: 'Espace Profond', price: 2000, cssValue: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)', description: 'Perdu dans les étoiles.' },
    { id: 'bg_blueprint', name: 'Blueprint', price: 2500, cssValue: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px), #003366', description: 'Plan technique.', bgSize: '40px 40px' },
    { id: 'bg_sunset', name: 'Sunset Rétro', price: 3500, cssValue: 'linear-gradient(to bottom, #2b1055, #7597de)', description: 'Ambiance années 80.' },
    { id: 'bg_aurora', name: 'Aurore', price: 4000, cssValue: 'linear-gradient(to bottom, #000000, #0f2027, #203a43, #2c5364)', description: 'Lumières du nord.' },
    { id: 'bg_circuit', name: 'Circuit', price: 4500, cssValue: 'radial-gradient(#003300 2px, transparent 2.5px), radial-gradient(#003300 2px, transparent 2.5px), #001100', bgSize: '20px 20px, 20px 20px', description: 'Tech verte.' },
    { id: 'bg_matrix', name: 'Le Code', price: 5000, cssValue: 'linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,20,0,0.9)), repeating-linear-gradient(0deg, transparent 0, transparent 2px, #0f0 3px)', description: 'Vous voyez la matrice.' },
    { id: 'bg_tokyo', name: 'Tokyo Night', price: 6500, cssValue: 'radial-gradient(circle at 20% 80%, rgba(255,0,150,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,243,255,0.5) 0%, transparent 50%), #0a0a12', description: 'Lumières de la ville.' },
    { id: 'bg_hex', name: 'Hexagones', price: 8000, cssValue: 'radial-gradient(circle, #2a2a2a 0%, #000000 100%), url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 0L20 10L10 20L0 10Z\' fill=\'%23333\' fill-opacity=\'0.4\'/%3E%3C/svg%3E")', description: 'Structure alvéolaire.' },
];

export const TITLES_CATALOG: Title[] = [
    { id: 't_none', name: '', price: 0, color: 'text-gray-500', description: 'Aucun titre.' },
    { id: 't_novice', name: 'NOVICE', price: 100, color: 'text-gray-400', description: 'On commence tous quelque part.' },
    { id: 't_tryhard', name: 'TRYHARD', price: 1000, color: 'text-red-500', description: 'Tu ne lâches rien.' },
    { id: 't_pro', name: 'PRO PLAYER', price: 2500, color: 'text-blue-400', description: 'C\'est du sérieux.' },
    { id: 't_boss', name: 'LE BOSS', price: 5000, color: 'text-yellow-400', description: 'Respect.' },
    { id: 't_glitch', name: 'GLITCH HUNTER', price: 7500, color: 'text-green-400', description: 'Tu vois ce que les autres ne voient pas.' },
    { id: 't_legend', name: 'LÉGENDE', price: 15000, color: 'text-purple-400', description: 'Ton nom est connu de tous.' },
    { id: 't_god', name: 'DIEU DU JEU', price: 50000, color: 'text-amber-400', description: 'Au-dessus de la mêlée.' },
];

export const MALLETS_CATALOG: Mallet[] = [
    { id: 'm_classic', name: 'Classique', price: 0, colors: ['#00f3ff'], type: 'basic', description: 'Le standard de l\'arcade.' },
    { id: 'm_red', name: 'Rouge Néon', price: 500, colors: ['#ff0000'], type: 'basic', description: 'Simple et agressif.' },
    { id: 'm_green', name: 'Vert Alien', price: 500, colors: ['#00ff00'], type: 'basic', description: 'Venu d\'ailleurs.' },
    { id: 'm_gold', name: 'Or Pur', price: 5000, colors: ['#ffd700', '#ffaa00'], type: 'gradient', description: 'Pour les champions.' },
    { id: 'm_rainbow', name: 'Arc-en-ciel', price: 3000, colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'], type: 'complex', description: 'Toutes les couleurs de la victoire.' },
    { id: 'm_flower', name: 'Fleur', price: 2000, colors: ['#ff69b4', '#ffff00'], type: 'flower', description: 'Naturellement fort.' },
    { id: 'm_fire', name: 'Feu', price: 2500, colors: ['#ff0000', '#ffff00'], type: 'gradient', description: 'Brûlant.' },
    { id: 'm_ice', name: 'Glace', price: 2500, colors: ['#ffffff', '#00ffff'], type: 'gradient', description: 'Sang froid.' },
    { id: 'm_midnight', name: 'Minuit', price: 1500, colors: ['#191970', '#483D8B'], type: 'gradient', description: 'Sombre et mystérieux.' },
    { id: 'm_target', name: 'Cible', price: 1000, colors: ['#ff0000', '#ffffff'], type: 'target', description: 'Visée parfaite.' },
    { id: 'm_toxic', name: 'Toxique', price: 1500, colors: ['#00ff00', '#000000'], type: 'target', description: 'Dangereux.' },
    { id: 'm_candy', name: 'Bonbon', price: 1200, colors: ['#ff69b4', '#ffffff'], type: 'target', description: 'Sucré mais redoutable.' },
    { id: 'm_sun', name: 'Soleil', price: 2000, colors: ['#ffff00', '#ffa500'], type: 'flower', description: 'Éblouissant.' },
    { id: 'm_ocean', name: 'Océan', price: 1800, colors: ['#000080', '#00bfff'], type: 'gradient', description: 'La force des marées.' },
    { id: 'm_silver', name: 'Argent', price: 4000, colors: ['#c0c0c0', '#ffffff'], type: 'gradient', description: 'Élégance métallique.' },
    { id: 'm_bumblebee', name: 'Abeille', price: 1500, colors: ['#ffff00', '#000000'], type: 'target', description: 'Pique comme une abeille.' },
    { id: 'm_plasma', name: 'Plasma', price: 3500, colors: ['#800080', '#00ffff'], type: 'gradient', description: 'Énergie pure.' },
    { id: 'm_emerald', name: 'Émeraude', price: 4500, colors: ['#006400', '#00ff7f'], type: 'gradient', description: 'Joyau vert.' },
    { id: 'm_ruby', name: 'Rubis', price: 4500, colors: ['#8b0000', '#ff0000'], type: 'gradient', description: 'Pierre de sang.' },
    { id: 'm_glitch', name: 'Glitch', price: 5000, colors: ['#ff00ff', '#00ffff', '#ffff00'], type: 'complex', description: 'Erreur système.' },
];

export const useCurrency = () => {
    // --- STATE INITIALIZATION WITH LOCALSTORAGE LAZY LOADING ---
    const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('neon-coins') || '0', 10));
    const [inventory, setInventory] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-inventory') || '[]'); } catch { return []; }
    });
    
    // User Identity
    const [username, setUsername] = useState(() => localStorage.getItem('neon-username') || "Joueur Néon");
    const [currentAvatarId, setCurrentAvatarId] = useState(() => localStorage.getItem('neon-avatar') || "av_bot");
    const [ownedAvatars, setOwnedAvatars] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-avatars') || '["av_bot", "av_human"]'); } catch { return ["av_bot", "av_human"]; }
    });
    
    const [currentFrameId, setCurrentFrameId] = useState(() => localStorage.getItem('neon-frame') || "fr_none");
    const [ownedFrames, setOwnedFrames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon-owned-frames') || '["fr_none"]'); } catch { return ["fr_none"]; }
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

    // --- ADMIN CHECK ---
    const [adminModeActive, setAdminModeActive] = useState(() => {
        const storedUsername = localStorage.getItem('neon-username');
        if (storedUsername === 'Vincent') {
            const savedMode = localStorage.getItem('neon-admin-mode');
            return savedMode !== null ? JSON.parse(savedMode) : true;
        }
        return false;
    });
    const isSuperUser = username === 'Vincent';
    const isAdmin = isSuperUser && adminModeActive;

    const toggleAdminMode = useCallback(() => {
        setAdminModeActive(prev => {
            const newState = !prev;
            localStorage.setItem('neon-admin-mode', JSON.stringify(newState));
            return newState;
        });
    }, []);

    // --- CLOUD SYNC IMPORT ---
    const importData = useCallback((data: any) => {
        if (!data) return;
        
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        if (data.coins !== undefined) {
            setCoins(data.coins);
            localStorage.setItem('neon-coins', data.coins.toString());
        }
        if (data.inventory) {
            setInventory(data.inventory);
            localStorage.setItem('neon-inventory', JSON.stringify(data.inventory));
        }
        if (data.avatarId) {
            setCurrentAvatarId(data.avatarId);
            localStorage.setItem('neon-avatar', data.avatarId);
        }
        if (data.ownedAvatars) {
            setOwnedAvatars(data.ownedAvatars);
            localStorage.setItem('neon-owned-avatars', JSON.stringify(data.ownedAvatars));
        }
        if (data.frameId) {
            setCurrentFrameId(data.frameId);
            localStorage.setItem('neon-frame', data.frameId);
        }
        if (data.ownedFrames) {
            setOwnedFrames(data.ownedFrames);
            localStorage.setItem('neon-owned-frames', JSON.stringify(data.ownedFrames));
        }
        if (data.wallpaperId) {
            setCurrentWallpaperId(data.wallpaperId);
            localStorage.setItem('neon-wallpaper', data.wallpaperId);
        }
        if (data.ownedWallpapers) {
            setOwnedWallpapers(data.ownedWallpapers);
            localStorage.setItem('neon-owned-wallpapers', JSON.stringify(data.ownedWallpapers));
        }
        if (data.titleId) {
            setCurrentTitleId(data.titleId);
            localStorage.setItem('neon-title', data.titleId);
        }
        if (data.ownedTitles) {
            setOwnedTitles(data.ownedTitles);
            localStorage.setItem('neon-owned-titles', JSON.stringify(data.ownedTitles));
        }
        if (data.malletId) {
            setCurrentMalletId(data.malletId);
            localStorage.setItem('neon-mallet', data.malletId);
        }
        if (data.ownedMallets) {
            setOwnedMallets(data.ownedMallets);
            localStorage.setItem('neon-owned-mallets', JSON.stringify(data.ownedMallets));
        }
        
        // --- SMART QUEST SYNC ---
        // Only overwrite quests if the cloud data is from TODAY or if no local data exists.
        // If local is fresh (Today) and cloud is stale (Yesterday), we prefer local.
        const localQuestDate = localStorage.getItem('neon_quests_date');
        
        if (data.quests && data.questsDate === todayStr) {
             // Cloud is fresh (Today) -> Sync it (e.g. played on another device today)
             localStorage.setItem('neon_daily_quests', JSON.stringify(data.quests));
             localStorage.setItem('neon_quests_date', data.questsDate);
        } else if (!localQuestDate) {
             // No local data -> Take whatever cloud has (DailySystem will reset it if old)
             if (data.quests) localStorage.setItem('neon_daily_quests', JSON.stringify(data.quests));
             if (data.questsDate) localStorage.setItem('neon_quests_date', data.questsDate);
        }
        // Else: Local is likely 'today' (fresh reset) and cloud is 'yesterday' (stale). Keep local.
        
        // PROTECTION FIX: Daily Bonus Overwrite
        const localLastLogin = localStorage.getItem('neon_last_login');
        const isLocalFresh = localLastLogin === todayStr && data.lastLogin !== todayStr;

        if (!isLocalFresh) {
            if (data.streak) localStorage.setItem('neon_streak', data.streak.toString());
            if (data.lastLogin) localStorage.setItem('neon_last_login', data.lastLogin);
        }
    }, []);

    const refreshData = useCallback(() => {
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
        const storedWallpaper = localStorage.getItem('neon-wallpaper');
        const storedOwnedWallpapers = localStorage.getItem('neon-owned-wallpapers');
        const storedTitle = localStorage.getItem('neon-title');
        const storedOwnedTitles = localStorage.getItem('neon-owned-titles');
        const storedMallet = localStorage.getItem('neon-mallet');
        const storedOwnedMallets = localStorage.getItem('neon-owned-mallets');

        if (storedName) setUsername(storedName);
        if (storedAvatar) setCurrentAvatarId(storedAvatar);
        if (storedOwnedAvatars) setOwnedAvatars(JSON.parse(storedOwnedAvatars));
        
        if (storedFrame) setCurrentFrameId(storedFrame);
        if (storedOwnedFrames) setOwnedFrames(JSON.parse(storedOwnedFrames));

        if (storedWallpaper) setCurrentWallpaperId(storedWallpaper);
        if (storedOwnedWallpapers) setOwnedWallpapers(JSON.parse(storedOwnedWallpapers));

        if (storedTitle) setCurrentTitleId(storedTitle);
        if (storedOwnedTitles) setOwnedTitles(JSON.parse(storedOwnedTitles));

        if (storedMallet) setCurrentMalletId(storedMallet);
        if (storedOwnedMallets) setOwnedMallets(JSON.parse(storedOwnedMallets));

        if (storedName === 'Vincent') {
            const savedMode = localStorage.getItem('neon-admin-mode');
            setAdminModeActive(savedMode !== null ? JSON.parse(savedMode) : true);
        } else {
            setAdminModeActive(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

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

    const buyWallpaper = useCallback((wallpaperId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedWallpapers(prevOwned => {
                    const newOwned = [...prevOwned, wallpaperId];
                    localStorage.setItem('neon-owned-wallpapers', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const selectWallpaper = useCallback((wallpaperId: string) => {
        if (ownedWallpapers.includes(wallpaperId)) {
            setCurrentWallpaperId(wallpaperId);
            localStorage.setItem('neon-wallpaper', wallpaperId);
        }
    }, [ownedWallpapers]);

    const buyTitle = useCallback((titleId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedTitles(prevOwned => {
                    const newOwned = [...prevOwned, titleId];
                    localStorage.setItem('neon-owned-titles', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const selectTitle = useCallback((titleId: string) => {
        if (ownedTitles.includes(titleId)) {
            setCurrentTitleId(titleId);
            localStorage.setItem('neon-title', titleId);
        }
    }, [ownedTitles]);

    const buyMallet = useCallback((malletId: string, cost: number) => {
        setCoins(prev => {
            if (prev >= cost) {
                const newBalance = prev - cost;
                localStorage.setItem('neon-coins', newBalance.toString());
                
                setOwnedMallets(prevOwned => {
                    const newOwned = [...prevOwned, malletId];
                    localStorage.setItem('neon-owned-mallets', JSON.stringify(newOwned));
                    return newOwned;
                });
                return newBalance;
            }
            return prev;
        });
    }, []);

    const selectMallet = useCallback((malletId: string) => {
        if (ownedMallets.includes(malletId)) {
            setCurrentMalletId(malletId);
            localStorage.setItem('neon-mallet', malletId);
        }
    }, [ownedMallets]);

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
        coins, 
        inventory,
        ownedAvatars,
        ownedFrames,
        ownedWallpapers,
        ownedTitles,
        ownedMallets,
        
        // Expose Admin state control
        isSuperUser,
        adminModeActive,
        toggleAdminMode,

        refreshData,
        importData,
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
        avatarsCatalog: AVATARS_CATALOG,
        // Frames
        currentFrameId,
        selectFrame,
        buyFrame,
        framesCatalog: FRAMES_CATALOG,
        // Wallpapers
        currentWallpaperId,
        selectWallpaper,
        buyWallpaper,
        wallpapersCatalog: WALLPAPERS_CATALOG,
        // Titles
        currentTitleId,
        selectTitle,
        buyTitle,
        titlesCatalog: TITLES_CATALOG,
        // Mallets
        currentMalletId,
        selectMallet,
        buyMallet,
        malletsCatalog: MALLETS_CATALOG,
    };
};
