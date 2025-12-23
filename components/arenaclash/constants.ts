import { TankSkin, TankAccessory } from '../../constants/types';

export const CANVAS_WIDTH = 1400;
export const CANVAS_HEIGHT = 1400;
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 600;

export const BULLET_SPEED = 14;
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

export const BOT_NAMES = ["Spectre-01", "Neon-Ripper", "Viper-X", "Ghost-Unit", "Cyber-Drone", "Glitch-Bot", "Byte-Z", "Mega-Bit"];

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
    MEDIUM: { botSpeed: 3.8, botHp: 100, botShield: 20, botWeaponDelay: 600, coinMult: 1.5, color: 'text-yellow-400 border-yellow-500' },
    HARD: { botSpeed: 5.2, botHp: 160, botShield: 60, botWeaponDelay: 350, coinMult: 2.5, color: 'text-red-500 border-red-500' }
};

export interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
    type?: 'building' | 'wall' | 'kiosk';
    label?: string;
}

export interface MapConfig {
    id: string;
    name: string;
    description: string;
    colors: {
        bg: string;
        grid: string;
        wall: string;
        wallBorder: string;
        floorDetail: string;
    };
    obstacles: Obstacle[];
}

export const MAPS: MapConfig[] = [
    {
        id: 'city',
        name: 'NÉON CITY - DISTRICT 7',
        description: 'Zone urbaine dense avec gratte-ciels et enseignes holographiques.',
        colors: { 
            bg: '#020208', 
            grid: 'rgba(0, 243, 255, 0.05)', 
            wall: '#0a0a1f', 
            wallBorder: '#00f3ff',
            floorDetail: 'rgba(255, 255, 255, 0.03)'
        },
        obstacles: [
            // AVENUE CENTRALE (Bâtiments massifs)
            { x: 300, y: 300, w: 250, h: 180, type: 'building', label: 'TETRO TOWER' },
            { x: 850, y: 300, w: 250, h: 180, type: 'building', label: 'CYBER HUB' },
            { x: 300, y: 920, w: 250, h: 180, type: 'building', label: 'PAC-CORP' },
            { x: 850, y: 920, w: 250, h: 180, type: 'building', label: 'SNAKE LAB' },
            
            // BLOCS CENTRAUX (Plaza)
            { x: 625, y: 625, w: 150, h: 150, type: 'building', label: 'ARCADE HQ' },
            
            // RUES LATÉRALES (Murs de soutien)
            { x: 50, y: 650, w: 150, h: 40, type: 'wall' },
            { x: 1200, y: 650, w: 150, h: 40, type: 'wall' },
            { x: 650, y: 50, w: 40, h: 150, type: 'wall' },
            { x: 650, y: 1200, w: 40, h: 150, type: 'wall' },

            // PETITS KIOSQUES (Abri temporaire)
            { x: 100, y: 100, w: 60, h: 60, type: 'kiosk' },
            { x: 1240, y: 100, w: 60, h: 60, type: 'kiosk' },
            { x: 100, y: 1240, w: 60, h: 60, type: 'kiosk' },
            { x: 1240, y: 1240, w: 60, h: 60, type: 'kiosk' },
        ]
    },
    {
        id: 'forest',
        name: 'CYBER FOREST',
        description: 'Forêt synthétique aux arbres de fibre optique.',
        colors: { bg: '#020f02', grid: 'rgba(34, 197, 94, 0.1)', wall: 'rgba(34, 197, 94, 0.2)', wallBorder: '#22c55e', floorDetail: 'rgba(34, 197, 94, 0.05)' },
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
        description: 'Plaine désertique brûlée par un soleil de données.',
        colors: { bg: '#1a0c00', grid: 'rgba(249, 115, 22, 0.1)', wall: 'rgba(234, 179, 8, 0.2)', wallBorder: '#facc15', floorDetail: 'rgba(234, 179, 8, 0.05)' },
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
    type?: 'spark' | 'smoke' | 'debris';
}

export interface KillEvent {
    id: number;
    killer: string;
    victim: string;
    time: number;
}
