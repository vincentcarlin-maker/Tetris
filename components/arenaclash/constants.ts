import { TankSkin, TankAccessory } from '../../constants/types';

export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 2400;
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

export const BULLET_SPEED = 12;
export const MATCH_DURATION = 120;
export const RESPAWN_TIME = 3000;

export const COLORS = {
    player: '#00d9ff',   // Cyan
    enemy: '#ff2df5',    // Pink
    bullet: '#ffff00',   // Yellow
    powerup: {
        HEALTH: '#ef4444',
        SHIELD: '#3b82f6',
        TRIPLE: '#eab308',
        BOOST: '#d946ef'
    }
};

export const BOT_NAMES = ["Neo", "Glitch", "Viper", "Ghost", "Cyborg", "Pixel", "Byte", "Kilo", "Mega", "Tera", "Apex", "Zero", "Rogue", "Titan", "Volt"];

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const ARENA_DIFFICULTY_SETTINGS: Record<Difficulty, { 
    botSpeed: number, 
    botHp: number, 
    botShield: number, 
    botWeaponDelay: number,
    coinMult: number,
    color: string
}> = {
    EASY: { botSpeed: 2.8, botHp: 80, botShield: 0, botWeaponDelay: 1000, coinMult: 1, color: 'text-green-400 border-green-500' },
    MEDIUM: { botSpeed: 3.8, botHp: 100, botShield: 0, botWeaponDelay: 600, coinMult: 1.5, color: 'text-yellow-400 border-yellow-500' },
    HARD: { botSpeed: 5.2, botHp: 150, botShield: 50, botWeaponDelay: 300, coinMult: 2.5, color: 'text-red-500 border-red-500' }
};

export interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface MapConfig {
    id: string;
    name: string;
    colors: {
        bg: string;
        grid: string;
        wall: string;
        wallBorder: string;
    };
    obstacles: Obstacle[];
}

export const MAPS: MapConfig[] = [
    {
        id: 'city',
        name: 'MÉGAPOPOLE NÉON',
        colors: { bg: '#020208', grid: 'rgba(0, 217, 255, 0.03)', wall: '#0a0a1a', wallBorder: '#00f3ff' },
        obstacles: [
            // --- QUARTIER NORD-OUEST ---
            { x: 150, y: 150, w: 350, h: 250 }, { x: 600, y: 150, w: 200, h: 250 },
            { x: 150, y: 500, w: 650, h: 150 },
            
            // --- QUARTIER NORD-EST ---
            { x: 1000, y: 150, w: 400, h: 250 }, { x: 1500, y: 150, w: 300, h: 250 }, { x: 1900, y: 150, w: 350, h: 250 },
            { x: 1000, y: 500, w: 1250, h: 150 },

            // --- QUARTIER CENTRAL ---
            { x: 150, y: 850, w: 400, h: 400 }, { x: 750, y: 850, w: 300, h: 300 },
            { x: 1250, y: 850, w: 400, h: 700 }, { x: 1850, y: 850, w: 400, h: 300 },

            // --- QUARTIER SUD-OUEST ---
            { x: 150, y: 1450, w: 650, h: 200 },
            { x: 150, y: 1750, w: 300, h: 500 }, { x: 550, y: 1750, w: 250, h: 500 },

            // --- QUARTIER SUD-EST ---
            { x: 1000, y: 1750, w: 500, h: 500 }, { x: 1600, y: 1750, w: 650, h: 250 },
            { x: 1600, y: 2100, w: 650, h: 150 },

            // --- BLOCS DE SIGNALISATION / DÉCOR ---
            { x: 1100, y: 1100, w: 100, h: 100 }, // Rond-point central décor
        ]
    },
    {
        id: 'forest',
        name: 'CYBER FOREST',
        colors: { bg: '#020f02', grid: 'rgba(34, 197, 94, 0.1)', wall: 'rgba(34, 197, 94, 0.2)', wallBorder: '#22c55e' },
        obstacles: [
            { x: 300, y: 300, w: 120, h: 120 }, { x: 1800, y: 300, w: 120, h: 120 },
            { x: 300, y: 1800, w: 120, h: 120 }, { x: 1800, y: 1800, w: 120, h: 120 },
            { x: 1100, y: 1100, w: 200, h: 200 },
        ]
    },
    {
        id: 'desert',
        name: 'SOLAR DUST',
        colors: { bg: '#1a0c00', grid: 'rgba(249, 115, 22, 0.1)', wall: 'rgba(234, 179, 8, 0.2)', wallBorder: '#facc15' },
        obstacles: [
            { x: 400, y: 400, w: 1600, h: 80 }, { x: 400, y: 1900, w: 1600, h: 80 },
            { x: 400, y: 480, w: 80, h: 1420 }, { x: 1920, y: 480, w: 80, h: 1420 },
        ]
    }
];

export interface Entity {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: string;
}

export type PowerUpType = 'HEALTH' | 'SHIELD' | 'TRIPLE' | 'BOOST';

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
    powerups: { type: PowerUpType, expiry: number }[];
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
    type: PowerUpType;
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

export interface KillEvent {
    id: number;
    killer: string;
    victim: string;
    time: number;
}