import { TankSkin, TankAccessory } from '../../constants/types';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Entity {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
}

export interface Character extends Entity {
    name: string;
    hp: number;
    maxHp: number;
    angle: number;
    vx: number;
    vy: number;
    speed: number;
    weaponDelay: number;
    lastShot: number;
    isDead: boolean;
    respawnTimer: number;
    score: number;
    shield: number;
    powerups: { type: string, expiry: number }[];
    targetId?: string | null;
    skin?: TankSkin;
    accessory?: TankAccessory;
}

export interface Bullet extends Entity {
    vx: number;
    vy: number;
    ownerId: string;
    damage: number;
    life: number;
}

export interface PowerUp extends Entity {
    type: 'HEALTH' | 'SHIELD' | 'RAPID' | 'BOOST' | 'TRIPLE' | 'EMP' | 'BOMB' | 'COIN';
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export interface SpecialZone {
    x: number;
    y: number;
    radius: number;
    type: 'HEAL' | 'DANGER' | 'BOOST' | 'SLOW';
    label: string;
}

export type ObstacleType = 'building' | 'tree' | 'pond' | 'rock' | 'crate' | 'pylon' | 'ruin' | 'tent' | 'bush' | 'trunk' | 'cactus' | 'bone' | 'obelisk' | 'palm' | 'bench' | 'barrier' | 'trash_bin' | 'mushroom' | 'crystal' | 'peak' | 'ice_pillar';

export interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
    type: ObstacleType;
    subType?: string;
}

export interface MapConfig {
    id: string;
    name: string;
    colors: {
        bg: string;
        grid: string;
        wall: string;
        wallBorder: string;
        accent?: string;
    };
    obstacles: Obstacle[];
    zones: SpecialZone[];
}

export interface KillEvent {
    id: number;
    killer: string;
    victim: string;
    time: number;
}