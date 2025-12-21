
export interface Entity {
    x: number; 
    y: number;
    vx: number; 
    vy: number;
    radius: number;
    color: string;
}

export type GameState = 'menu' | 'difficulty_select' | 'playing' | 'scored' | 'gameOver';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'SINGLE' | 'LOCAL_VS' | 'ONLINE';
