export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const INITIAL_SPEED = 150;
export const MIN_SPEED = 60;
export const SPEED_INCREMENT = 2;

export const FOOD_TYPES = {
    NORMAL: { color: '#ef4444', glow: '#ef4444', points: 10, prob: 0.7 },
    STRAWBERRY: { color: '#ff00ff', glow: '#ff00ff', points: 30, prob: 0.1, effect: 'SPEED_UP' },
    BANANA: { color: '#facc15', glow: '#facc15', points: 20, prob: 0.1, effect: 'SLOW_DOWN' },
    CHERRY: { color: '#f43f5e', glow: '#f43f5e', points: 50, prob: 0.1 }
};