
import { SlitherSkin, SlitherAccessory } from '../../hooks/useCurrency';

export interface Point { x: number; y: number; }

export interface Worm {
    id: string;
    name: string;
    segments: Point[];
    angle: number;
    color: string;
    skin?: SlitherSkin; 
    accessory?: SlitherAccessory;
    score: number;
    isBoost: boolean;
    isDead: boolean;
    radius: number;
    aiTargetAngle?: number;
    aiDecisionTimer?: number;
}

export interface Food { 
    id: string; 
    x: number; 
    y: number; 
    val: number; 
    color: string; 
}

export interface Particle { 
    x: number; 
    y: number; 
    vx: number; 
    vy: number; 
    life: number; 
    color: string; 
    size: number; 
}

export type GameState = 'MENU' | 'SERVER_SELECT' | 'PLAYING' | 'DYING' | 'GAMEOVER';
export type GameMode = 'SOLO' | 'ONLINE';

export interface ServerConfig {
    id: string;
    name: string;
    region: string;
    max: number;
    ping: number;
}
