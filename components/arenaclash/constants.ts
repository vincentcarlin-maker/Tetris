import { TankSkin, TankAccessory } from '../../constants/types';

export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 2400;
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

export const BULLET_SPEED = 12;
export const MATCH_DURATION = 120;
export const RESPAWN_TIME = 3000;

export const COLORS = {
    player: '#00d9ff',
    enemy: '#ff2df5',
    bullet: '#ffff00',
    zones: {
        HEAL: '#22c55e',
        DANGER: '#ef4444',
        BOOST: '#facc15',
        SLOW: '#f97316'
    }
};

export const BOT_NAMES = ["Neo", "Glitch", "Viper", "Ghost", "Cyborg", "Pixel", "Byte", "Kilo", "Mega", "Tera"];

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

export interface SpecialZone {
    x: number;
    y: number;
    radius: number;
    type: 'HEAL' | 'DANGER' | 'BOOST' | 'SLOW';
    label: string;
}

export interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'building' | 'tree' | 'pond' | 'rock' | 'crate' | 'pylon';
    subType?: string; // e.g., 'A', 'B', 'DOCK'
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

export const MAPS: MapConfig[] = [
    {
        id: 'city',
        name: 'MÉGAPOPOLE NÉON 2.0',
        colors: { bg: '#050508', grid: 'rgba(0, 217, 255, 0.05)', wall: '#0a0a1a', wallBorder: '#00f3ff' },
        zones: [
            { x: 1200, y: 1200, radius: 150, type: 'HEAL', label: 'MED-CENTER' },
            { x: 400, y: 400, radius: 100, type: 'BOOST', label: 'OVERCHARGE' },
            { x: 2000, y: 2000, radius: 100, type: 'BOOST', label: 'OVERCHARGE' },
            { x: 1200, y: 400, radius: 120, type: 'DANGER', label: 'VOLTAGE AREA' },
            { x: 1200, y: 2000, radius: 120, type: 'DANGER', label: 'VOLTAGE AREA' },
        ],
        obstacles: [
            { x: 100, y: 100, w: 300, h: 300, type: 'building', subType: 'A1' },
            { x: 450, y: 100, w: 150, h: 300, type: 'building', subType: 'DOCK' },
            { x: 100, y: 450, w: 500, h: 200, type: 'building', subType: 'A2' },
            { x: 800, y: 100, w: 400, h: 400, type: 'building', subType: 'B1' },
            { x: 1250, y: 100, w: 300, h: 150, type: 'building', subType: 'B2' },
            { x: 1750, y: 100, w: 200, h: 550, type: 'building', subType: 'C1' },
            { x: 2000, y: 100, w: 300, h: 250, type: 'building', subType: 'C2' },
            { x: 100, y: 800, w: 350, h: 450, type: 'building', subType: 'D1' },
            { x: 500, y: 800, w: 200, h: 200, type: 'building', subType: 'TECH' },
            { x: 100, y: 1400, w: 600, h: 150, type: 'building', subType: 'LAB' },
            { x: 850, y: 1500, w: 400, h: 300, type: 'building', subType: 'STORAGE' },
            { x: 1300, y: 1500, w: 200, h: 800, type: 'building', subType: 'HQ' },
            { x: 1650, y: 850, w: 400, h: 400, type: 'building', subType: 'CORE' },
            { x: 1650, y: 1300, w: 400, h: 600, type: 'building', subType: 'HACK-HUB' },
            { x: 1650, y: 2000, w: 650, h: 300, type: 'building', subType: 'EXIT' },
            // Mobilier Urbain (Obstacles petits pour couverture)
            { x: 700, y: 700, w: 40, h: 40, type: 'crate' },
            { x: 750, y: 700, w: 40, h: 40, type: 'crate' },
            { x: 1400, y: 1000, w: 20, h: 20, type: 'pylon' },
            { x: 1000, y: 1400, w: 20, h: 20, type: 'pylon' },
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
    type: 'HEALTH' | 'SHIELD' | 'TRIPLE' | 'BOOST';
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