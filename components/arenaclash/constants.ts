
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
    type?: 'building' | 'tree' | 'pond' | 'rock' | 'bridge';
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
}

export const MAPS: MapConfig[] = [
    {
        id: 'city',
        name: 'MÉGAPOPOLE NÉON',
        colors: { bg: '#020208', grid: 'rgba(0, 217, 255, 0.03)', wall: '#0a0a1a', wallBorder: '#00f3ff' },
        obstacles: [
            { x: 150, y: 150, w: 350, h: 250, type: 'building' }, { x: 600, y: 150, w: 200, h: 250, type: 'building' },
            { x: 150, y: 500, w: 650, h: 150, type: 'building' },
            { x: 1000, y: 150, w: 400, h: 250, type: 'building' }, { x: 1500, y: 150, w: 300, h: 250, type: 'building' }, { x: 1900, y: 150, w: 350, h: 250, type: 'building' },
            { x: 1000, y: 500, w: 1250, h: 150, type: 'building' },
            { x: 150, y: 850, w: 400, h: 400, type: 'building' }, { x: 750, y: 850, w: 300, h: 300, type: 'building' },
            { x: 1250, y: 850, w: 400, h: 700, type: 'building' }, { x: 1850, y: 850, w: 400, h: 300, type: 'building' },
            { x: 150, y: 1450, w: 650, h: 200, type: 'building' },
            { x: 150, y: 1750, w: 300, h: 500, type: 'building' }, { x: 550, y: 1750, w: 250, h: 500, type: 'building' },
            { x: 1000, y: 1750, w: 500, h: 500, type: 'building' }, { x: 1600, y: 1750, w: 650, h: 250, type: 'building' },
            { x: 1600, y: 2100, w: 650, h: 150, type: 'building' },
            { x: 1100, y: 1100, w: 100, h: 100, type: 'building' },
        ]
    },
    {
        id: 'forest',
        name: 'CYBER FOREST',
        colors: { bg: '#020502', grid: 'rgba(34, 197, 94, 0.05)', wall: '#051405', wallBorder: '#22c55e', accent: '#0088ff' },
        obstacles: [
            { x: 0, y: 1100, w: 2400, h: 180, type: 'pond' }, 
            { x: 500, y: 0, w: 150, h: 1100, type: 'pond' },  
            { x: 1600, y: 1280, w: 150, h: 1120, type: 'pond' }, 
            { x: 450, y: 1080, w: 250, h: 220, type: 'bridge' }, 
            { x: 1550, y: 1080, w: 250, h: 220, type: 'bridge' }, 
            { x: 1550, y: 1600, w: 250, h: 120, type: 'bridge' }, 
            { x: 200, y: 200, w: 120, h: 120, type: 'tree' }, { x: 350, y: 350, w: 100, h: 100, type: 'tree' },
            { x: 800, y: 200, w: 140, h: 140, type: 'tree' }, { x: 1000, y: 400, w: 110, h: 110, type: 'tree' },
            { x: 1300, y: 250, w: 130, h: 130, type: 'tree' }, { x: 1800, y: 300, w: 150, h: 150, type: 'tree' },
            { x: 2100, y: 500, w: 120, h: 120, type: 'tree' }, { x: 2000, y: 100, w: 90, h: 90, type: 'tree' },
            { x: 200, y: 1500, w: 130, h: 130, type: 'tree' }, { x: 400, y: 1700, w: 110, h: 110, type: 'tree' },
            { x: 800, y: 1500, w: 140, h: 140, type: 'tree' }, { x: 1100, y: 1800, w: 160, h: 160, type: 'tree' },
            { x: 1400, y: 2100, w: 130, h: 130, type: 'tree' }, { x: 1900, y: 150, w: 120, h: 120, type: 'tree' },
            { x: 2100, y: 1800, w: 150, h: 150, type: 'tree' }, { x: 100, y: 2100, w: 100, h: 100, type: 'tree' },
            { x: 700, y: 2000, w: 115, h: 115, type: 'tree' }, { x: 1600, y: 800, w: 140, h: 140, type: 'tree' }
        ]
    },
    {
        id: 'desert',
        name: 'SOLAR DUST',
        colors: { 
            bg: '#1a0c00', 
            grid: 'rgba(255, 165, 0, 0.05)', 
            wall: '#2a1400', 
            wallBorder: '#f97316',
            accent: '#facc15' 
        },
        obstacles: [
            // Dunes et roches néon
            { x: 100, y: 100, w: 300, h: 80, type: 'rock' },
            { x: 100, y: 180, w: 80, h: 400, type: 'rock' },
            { x: 600, y: 400, w: 500, h: 120, type: 'rock' },
            { x: 1200, y: 100, w: 200, h: 600, type: 'rock' },
            { x: 1600, y: 400, w: 600, h: 100, type: 'rock' },
            { x: 200, y: 800, w: 800, h: 150, type: 'rock' },
            { x: 1200, y: 900, w: 900, h: 150, type: 'rock' },
            { x: 100, y: 1100, w: 400, h: 400, type: 'rock' },
            { x: 700, y: 1200, w: 300, h: 300, type: 'rock' },
            { x: 1400, y: 1300, w: 600, h: 200, type: 'rock' },
            { x: 300, y: 1700, w: 1200, h: 100, type: 'rock' },
            { x: 1800, y: 1700, w: 400, h: 500, type: 'rock' },
            { x: 200, y: 2000, w: 1000, h: 150, type: 'rock' },
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
