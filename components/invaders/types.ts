
export interface Entity {
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
}

export interface Player extends Entity {
    color: string;
}

export interface Enemy extends Entity {
    type: 'basic' | 'shooter' | 'heavy' | 'kamikaze';
    color: string;
    health: number;
    score: number;
    dx: number;
    dy: number;
}

export interface Bullet extends Entity {
    dy: number;
    color: string;
    isEnemy: boolean;
}

export interface Particle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export type GamePhase = 'MENU' | 'PLAYING' | 'GAMEOVER';
