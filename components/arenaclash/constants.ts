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
    type: 'building' | 'tree' | 'pond' | 'rock' | 'crate' | 'pylon' | 'ruin' | 'tent' | 'bush' | 'trunk' | 'cactus' | 'bone' | 'obelisk' | 'palm' | 'bench' | 'barrier' | 'trash_bin';
    subType?: 'HELIPAD' | 'HVAC' | 'OFFICE' | 'HQ' | 'LAB' | 'ROOF_DETAIL' | 'WALL' | 'RIVER' | 'OASIS' | 'RUIN' | 'TEMPLE' | 'OUTPOST'; 
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
            // --- QUARTIER NORD-OUEST ---
            { x: 100, y: 100, w: 400, h: 400, type: 'building', subType: 'HELIPAD' },
            { x: 520, y: 100, w: 150, h: 250, type: 'building', subType: 'HVAC' },
            { x: 520, y: 380, w: 150, h: 30, type: 'bench' },
            { x: 100, y: 550, w: 400, h: 15, type: 'barrier' },
            { x: 550, y: 550, w: 15, h: 15, type: 'pylon' },

            // --- QUARTIER NORD-EST ---
            { x: 1700, y: 100, w: 300, h: 500, type: 'building', subType: 'HVAC' },
            { x: 2100, y: 100, w: 200, h: 200, type: 'building', subType: 'OFFICE' },
            { x: 1700, y: 650, w: 400, h: 15, type: 'barrier' },
            { x: 2150, y: 350, w: 20, h: 20, type: 'trash_bin' },
            { x: 1650, y: 100, w: 15, h: 15, type: 'pylon' },

            // --- CENTRE HQ ---
            { x: 950, y: 950, w: 500, h: 500, type: 'building', subType: 'HQ' },
            { x: 900, y: 1100, w: 20, h: 20, type: 'trash_bin' },
            { x: 1480, y: 1100, w: 20, h: 20, type: 'pylon' },
            { x: 1100, y: 880, w: 100, h: 30, type: 'bench' },
            { x: 1300, y: 880, w: 100, h: 30, type: 'bench' },

            // --- ZONE INDUSTRIELLE SUD-OUEST ---
            { x: 100, y: 1700, w: 450, h: 300, type: 'building', subType: 'HVAC' },
            { x: 600, y: 1700, w: 100, h: 500, type: 'building', subType: 'ROOF_DETAIL' },
            { x: 100, y: 1600, w: 150, h: 40, type: 'crate' },
            { x: 260, y: 1600, w: 40, h: 40, type: 'crate' },
            { x: 100, y: 2050, w: 450, h: 15, type: 'barrier' },

            // --- QUARTIER RÉSIDENTIEL SUD-EST ---
            { x: 1700, y: 1700, w: 300, h: 300, type: 'building', subType: 'OFFICE' },
            { x: 2100, y: 1700, w: 200, h: 600, type: 'building', subType: 'HVAC' },
            { x: 1700, y: 2100, w: 300, h: 200, type: 'building', subType: 'ROOF_DETAIL' },
            { x: 1600, y: 1700, w: 15, h: 200, type: 'barrier' },
            { x: 1850, y: 1600, w: 15, h: 15, type: 'pylon' },
        ]
    },
    {
        id: 'forest',
        name: 'FORÊT ÉMERAUDE',
        colors: { bg: '#020a05', grid: 'rgba(34, 197, 94, 0.05)', wall: '#051a08', wallBorder: '#22c55e' },
        zones: [
            { x: 1200, y: 1200, radius: 180, type: 'HEAL', label: 'SOURCE SACRÉE' },
            { x: 500, y: 500, radius: 120, type: 'SLOW', label: 'MARÉCAGE' },
            { x: 1900, y: 1900, radius: 120, type: 'SLOW', label: 'SABLES MOUVANTS' },
        ],
        obstacles: [
            { x: 300, y: 200, w: 80, h: 80, type: 'tree' },
            { x: 450, y: 800, w: 100, h: 100, type: 'tree' },
            { x: 900, y: 300, w: 70, h: 70, type: 'tree' },
            { x: 1500, y: 400, w: 120, h: 120, type: 'tree' },
            { x: 2000, y: 1200, w: 90, h: 90, type: 'tree' },
            { x: 1000, y: 1000, w: 150, h: 60, type: 'ruin', subType: 'WALL' },
            { x: 1200, y: 800, w: 60, h: 150, type: 'ruin', subType: 'WALL' },
            { x: 700, y: 400, w: 100, h: 100, type: 'rock' },
            { x: 1400, y: 1800, w: 120, h: 80, type: 'rock' },
            { x: 0, y: 1200, w: 2400, h: 120, type: 'pond', subType: 'RIVER' },
        ]
    },
    {
        id: 'solar_dust',
        name: 'SOLAR DUST',
        colors: { bg: '#2b1a0a', grid: 'rgba(249, 115, 22, 0.08)', wall: '#3d2610', wallBorder: '#f97316' },
        zones: [
            { x: 1200, y: 1200, radius: 220, type: 'HEAL', label: 'OASIS SACRÉ' },
            { x: 600, y: 600, radius: 180, type: 'SLOW', label: 'DUNES PROFONDES' },
        ],
        obstacles: [
            { x: 1100, y: 1100, w: 200, h: 200, type: 'pond', subType: 'OASIS' },
            { x: 1050, y: 1050, w: 60, h: 60, type: 'palm' },
            { x: 1300, y: 1050, w: 60, h: 60, type: 'palm' },
            { x: 1050, y: 1300, w: 60, h: 60, type: 'palm' },
            { x: 400, y: 400, w: 150, h: 60, type: 'obelisk', subType: 'RUIN' },
            { x: 1800, y: 400, w: 120, h: 120, type: 'building', subType: 'TEMPLE' },
            { x: 400, y: 1800, w: 200, h: 200, type: 'building', subType: 'OUTPOST' },
            { x: 300, y: 1000, w: 40, h: 40, type: 'cactus' },
            { x: 800, y: 200, w: 50, h: 50, type: 'cactus' },
            { x: 1000, y: 2000, w: 120, h: 80, type: 'rock' },
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

export interface KillEvent {
    id: number;
    killer: string;
    victim: string;
    time: number;
}
