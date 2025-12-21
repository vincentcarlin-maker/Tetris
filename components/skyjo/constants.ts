
export const GRID_COLS = 4;
export const GRID_ROWS = 3;
export const CARDS_PER_PLAYER = 12;

export const CARD_DISTRIBUTION = [
    { val: -2, count: 5 },
    { val: -1, count: 10 },
    { val: 0, count: 15 },
    ...Array.from({ length: 12 }, (_, i) => ({ val: i + 1, count: 10 }))
];

export const REACTIONS = [
    { id: 'angry', icon: 'Frown', color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: 'Hand', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: 'Smile', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: 'Heart', color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: 'ThumbsUp', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: 'Frown', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];
