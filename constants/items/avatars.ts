
import { Bot, User, Cat, Sparkles, Flower, Heart, Gem, ShoppingBag, Rainbow, Sun, Moon, Snowflake, Droplets, Music, Anchor, Smile, Zap, Gamepad2, Headphones, Skull, Ghost, Rocket, Crown } from 'lucide-react';
import { Avatar } from '../types';

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
