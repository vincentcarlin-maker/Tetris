
export type PowerUpType = 'magnet' | 'shield' | 'boost';
export type EventType = 'NONE' | 'GOLD_RUSH' | 'NIGHT_TERROR' | 'HYPER_SPEED';

export interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    grounded: boolean;
    color: string;
    rotation: number;
}

export interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'block' | 'spike' | 'drone';
    passed: boolean;
}

export interface CoinEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    collected: boolean;
    offsetY: number;
}

export interface TreasureEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'CHEST' | 'GOLD_DRONE';
    collected: boolean;
    val: number;
}

export interface PowerUpEntity {
    x: number;
    y: number;
    width: number;
    height: number;
    type: PowerUpType;
    collected: boolean;
    offsetY: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'spark' | 'normal';
}

export interface WeatherParticle {
    x: number;
    y: number;
    speed: number;
    size: number;
}

export interface SpeedLine {
    x: number;
    y: number;
    width: number;
    speed: number;
}

export interface Mission {
    id: number;
    type: 'DISTANCE' | 'COINS';
    target: number;
    current: number; 
    reward: number;
    description: string;
    completed?: boolean; 
}

export interface Biome {
    id: string;
    name: string;
    color: string;
    bg: string;
    sky: string;
    particle: string;
}

export interface Skin {
    id: string;
    name: string;
    color: string;
    cost: number;
}
