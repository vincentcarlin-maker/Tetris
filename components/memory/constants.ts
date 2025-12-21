
import { Zap, Ghost, Star, Heart, Crown, Diamond, Rocket, Gamepad2, Skull, Flame, Music, Sun, Moon, Cloud, Snowflake, Anchor, Droplets, Coins, Frown, Hand, Smile, ThumbsUp } from 'lucide-react';
import { Difficulty } from './types';

export const ICONS = [
    { id: 'zap', icon: Zap, color: 'text-yellow-400' },
    { id: 'ghost', icon: Ghost, color: 'text-purple-400' },
    { id: 'star', icon: Star, color: 'text-pink-400' },
    { id: 'heart', icon: Heart, color: 'text-red-500' },
    { id: 'crown', icon: Crown, color: 'text-amber-400' },
    { id: 'diamond', icon: Diamond, color: 'text-cyan-400' },
    { id: 'rocket', icon: Rocket, color: 'text-orange-500' },
    { id: 'gamepad', icon: Gamepad2, color: 'text-green-400' },
    { id: 'skull', icon: Skull, color: 'text-gray-300' },
    { id: 'flame', icon: Flame, color: 'text-orange-600' },
    { id: 'music', icon: Music, color: 'text-blue-400' },
    { id: 'sun', icon: Sun, color: 'text-yellow-200' },
    { id: 'moon', icon: Moon, color: 'text-indigo-300' },
    { id: 'cloud', icon: Cloud, color: 'text-white' },
    { id: 'snow', icon: Snowflake, color: 'text-cyan-200' },
    { id: 'anchor', icon: Anchor, color: 'text-teal-400' },
    { id: 'drop', icon: Droplets, color: 'text-blue-500' },
    { id: 'coin', icon: Coins, color: 'text-yellow-500' },
];

export const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number, cols: number, name: string, bonus: number }> = {
    EASY: { pairs: 6, cols: 6, name: 'FACILE', bonus: 10 },    // 12 cards
    MEDIUM: { pairs: 9, cols: 6, name: 'MOYEN', bonus: 20 },   // 18 cards
    HARD: { pairs: 12, cols: 6, name: 'DIFFICILE', bonus: 40 } // 24 cards
};

export const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];
