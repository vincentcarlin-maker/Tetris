
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type GameMode = 'CLASSIC' | 'NEON';
export type FoodType = 'NORMAL' | 'STRAWBERRY' | 'BANANA' | 'CHERRY';

export interface FoodItem extends Position {
    type: FoodType;
}

export interface Teleporter extends Position {
    id: number;
    targetId: number;
    color: string;
}

export interface Particle extends Position {
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}
