
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 1200;
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
    EASY: { botSpeed: 2.5, botHp: 80, botShield: 0, botWeaponDelay: 1000, coinMult: 1, color: 'text-green-400 border-green-500' },
    MEDIUM: { botSpeed: 3.5, botHp: 100, botShield: 0, botWeaponDelay: 600, coinMult: 1.5, color: 'text-yellow-400 border-yellow-500' },
    HARD: { botSpeed: 4.8, botHp: 150, botShield: 50, botWeaponDelay: 300, coinMult: 2.5, color: 'text-red-500 border-red-500' }
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
        name: 'NÉON CITY',
        colors: { bg: '#050510', grid: 'rgba(0, 217, 255, 0.1)', wall: 'rgba(176, 0, 255, 0.2)', wallBorder: '#b000ff' },
        obstacles: [
            { x: 200, y: 200, w: 100, h: 100 }, { x: 900, y: 200, w: 100, h: 100 },
            { x: 200, y: 900, w: 100, h: 100 }, { x: 900, y: 900, w: 100, h: 100 },
            { x: 550, y: 550, w: 100, h: 100 }, { x: 500, y: 100, w: 200, h: 50 },
            { x: 500, y: 1050, w: 200, h: 50 }, { x: 100, y: 500, w: 50, h: 200 },
            { x: 1050, y: 500, w: 50, h: 200 },
        ]
    },
    {
        id: 'forest',
        name: 'CYBER FOREST',
        colors: { bg: '#020f02', grid: 'rgba(34, 197, 94, 0.1)', wall: 'rgba(34, 197, 94, 0.2)', wallBorder: '#22c55e' },
        obstacles: [
            { x: 300, y: 300, w: 80, h: 80 }, { x: 820, y: 300, w: 80, h: 80 },
            { x: 300, y: 820, w: 80, h: 80 }, { x: 820, y: 820, w: 80, h: 80 },
            { x: 560, y: 560, w: 80, h: 80 }, { x: 100, y: 100, w: 150, h: 150 },
            { x: 950, y: 950, w: 150, h: 150 }, { x: 950, y: 100, w: 150, h: 150 },
            { x: 100, y: 950, w: 150, h: 150 }, { x: 580, y: 200, w: 40, h: 200 },
            { x: 580, y: 800, w: 40, h: 200 },
        ]
    },
    {
        id: 'desert',
        name: 'SOLAR DUST',
        colors: { bg: '#1a0c00', grid: 'rgba(249, 115, 22, 0.1)', wall: 'rgba(234, 179, 8, 0.2)', wallBorder: '#facc15' },
        obstacles: [
            { x: 400, y: 400, w: 400, h: 50 }, { x: 400, y: 750, w: 400, h: 50 },
            { x: 400, y: 450, w: 50, h: 300 }, { x: 750, y: 450, w: 50, h: 300 },
            { x: 150, y: 150, w: 100, h: 100 }, { x: 950, y: 950, w: 100, h: 100 },
            { x: 150, y: 950, w: 100, h: 100 }, { x: 950, y: 150, w: 100, h: 100 },
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
    powerups: { type: PowerUpType, expiry: number }[];
    targetId?: string | null;
}

export interface Bullet extends Entity {
    ownerId: string;
    vx: number;
    vy: number;
    damage: number;
    life: number;
}

export type PowerUpType = 'HEALTH' | 'SHIELD' | 'TRIPLE' | 'BOOST';

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
