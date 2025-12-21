
import { Frown, Hand, Smile, Heart, ThumbsUp } from 'lucide-react';
import { Difficulty } from './types';

export const ROWS = 6;
export const COLS = 7;

export const DIFFICULTY_CONFIG: Record<Difficulty, { name: string, color: string, scoreMult: number }> = {
    EASY: { name: 'FACILE', color: 'text-green-400 border-green-500', scoreMult: 1 },
    MEDIUM: { name: 'NORMAL', color: 'text-yellow-400 border-yellow-500', scoreMult: 1.5 },
    HARD: { name: 'DIFFICILE', color: 'text-red-500 border-red-500', scoreMult: 2 }
};

export const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];
