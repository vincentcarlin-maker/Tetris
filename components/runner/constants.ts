
import { Biome, Skin } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 350;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const BASE_SPEED = 5;
export const MAX_SPEED = 14;
export const BOOST_SPEED_MULTIPLIER = 1.8;
export const BIOME_SWITCH_DISTANCE = 250; 

export const BIOMES: Biome[] = [
    { id: 'city', name: 'NÉON CITY', color: '#00f3ff', bg: '#000000', sky: 'rgba(0, 243, 255, 0.1)', particle: '#ffffff' },
    { id: 'forest', name: 'CYBER FOREST', color: '#22c55e', bg: '#051a05', sky: 'rgba(34, 197, 94, 0.1)', particle: '#4ade80' },
    { id: 'desert', name: 'SOLAR DUNES', color: '#f97316', bg: '#1a0c00', sky: 'rgba(249, 115, 22, 0.1)', particle: '#fdba74' },
    { id: 'snow', name: 'ICE SECTOR', color: '#22d3ee', bg: '#081c24', sky: 'rgba(34, 211, 238, 0.1)', particle: '#cffafe' },
];

export const SKINS: Skin[] = [
    { id: 'default', name: 'Néon Cyan', color: '#00f3ff', cost: 0 },
    { id: 'lime', name: 'Toxic Lime', color: '#ccff00', cost: 250 },
    { id: 'pink', name: 'Hot Pink', color: '#ff00ff', cost: 500 },
    { id: 'orange', name: 'Sunset', color: '#ff4500', cost: 1000 },
    { id: 'white', name: 'Fantôme', color: '#ffffff', cost: 2500 },
    { id: 'gold', name: 'Or Légendaire', color: '#ffd700', cost: 5000 },
];
