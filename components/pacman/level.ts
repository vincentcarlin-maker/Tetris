
import { TileType } from './types';

// 0: Empty, 1: Wall, 2: Dot, 3: Power Pellet, 4: Gate
const M: TileType = 1; // Wall
const o: TileType = 2; // Dot
const P: TileType = 3; // Power
const _: TileType = 0; // Empty
const G: TileType = 4; // Gate

// --- LEVEL 1: CLASSIC ---
const LEVEL_1: TileType[][] = [
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
    [M,o,o,o,o,o,o,o,o,M,o,o,o,o,o,o,o,o,M],
    [M,P,M,M,o,M,M,M,o,M,o,M,M,M,o,M,M,P,M],
    [M,o,M,M,o,M,M,M,o,M,o,M,M,M,o,M,M,o,M],
    [M,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,M],
    [M,o,M,M,o,M,o,M,M,M,M,M,o,M,o,M,M,o,M],
    [M,o,o,o,o,M,o,o,o,M,o,o,o,M,o,o,o,o,M],
    [M,M,M,M,o,M,M,M,_,M,_,M,M,M,o,M,M,M,M],
    [_,_,_,M,o,M,_,_,_,_,_,_,_,M,o,M,_,_,_],
    [M,M,M,M,o,M,_,M,M,G,M,M,_,M,o,M,M,M,M],
    [_,_,_,_,o,_,_,M,_,_,_,M,_,_,o,_,_,_,_], // Tunnel row (index 10)
    [M,M,M,M,o,M,_,M,M,M,M,M,_,M,o,M,M,M,M],
    [_,_,_,M,o,M,_,_,_,_,_,_,_,M,o,M,_,_,_],
    [M,M,M,M,o,M,o,M,M,M,M,M,o,M,M,M,M,M,M],
    [M,o,o,o,o,o,o,o,o,M,o,o,o,o,o,o,o,o,M],
    [M,o,M,M,o,M,M,M,o,M,o,M,M,M,o,M,M,o,M],
    [M,P,o,M,o,o,o,o,o,_,o,o,o,o,o,M,o,P,M],
    [M,M,o,M,o,M,o,M,M,M,M,M,o,M,o,M,o,M,M],
    [M,o,o,o,o,M,o,o,o,M,o,o,o,M,o,o,o,o,M],
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
];

// --- LEVEL 2: THE ARENA (More open, vertical corridors) ---
const LEVEL_2: TileType[][] = [
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
    [M,P,o,o,o,o,M,o,o,M,o,o,M,o,o,o,o,P,M],
    [M,o,M,M,M,o,M,o,M,M,M,o,M,o,M,M,M,o,M],
    [M,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,M],
    [M,o,M,M,o,M,M,M,M,M,M,M,M,M,o,M,M,o,M],
    [M,o,M,M,o,o,o,o,o,M,o,o,o,o,o,M,M,o,M],
    [M,o,M,M,M,M,M,M,_,M,_,M,M,M,M,M,M,o,M],
    [M,o,o,o,o,o,o,_,_,_,_,_,o,o,o,o,o,o,M],
    [M,M,M,M,M,M,_,M,M,G,M,M,_,M,M,M,M,M,M],
    [_,_,_,_,_,_,_,M,_,_,_,M,_,_,_,_,_,_,_], // Tunnel
    [M,M,M,M,M,M,_,M,M,M,M,M,_,M,M,M,M,M,M],
    [M,o,o,o,o,o,o,_,_,_,_,_,o,o,o,o,o,o,M],
    [M,o,M,M,M,M,M,M,_,M,_,M,M,M,M,M,M,o,M],
    [M,o,o,o,o,M,o,o,o,M,o,o,o,M,o,o,o,o,M],
    [M,M,M,o,M,M,o,M,M,M,M,M,o,M,M,o,M,M,M],
    [M,P,o,o,o,o,o,o,o,o,o,o,o,o,o,o,o,P,M],
    [M,o,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,o,M],
    [M,o,o,o,o,o,o,o,o,M,o,o,o,o,o,o,o,o,M],
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
];

// --- LEVEL 3: THE LABYRINTH (Tight corners, more walls) ---
const LEVEL_3: TileType[][] = [
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
    [M,o,o,o,M,o,o,o,o,M,o,o,o,o,M,o,o,o,M],
    [M,o,M,o,M,o,M,M,o,M,o,M,M,o,M,o,M,o,M],
    [M,P,M,o,o,o,M,o,o,_,o,o,M,o,o,o,M,P,M],
    [M,M,M,M,M,o,M,o,M,M,M,o,M,o,M,M,M,M,M],
    [M,o,o,o,o,o,o,o,o,M,o,o,o,o,o,o,o,o,M],
    [M,o,M,M,M,o,M,M,_,M,_,M,M,o,M,M,M,o,M],
    [M,o,M,_,_,_,M,_,_,_,_,_,M,_,_,_,M,o,M],
    [M,o,M,_,M,M,M,M,M,G,M,M,M,M,M,_,M,o,M],
    [_,o,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,o,_], // Tunnel
    [M,o,M,_,M,M,M,M,M,M,M,M,M,M,M,_,M,o,M],
    [M,o,M,_,_,_,_,_,_,_,_,_,_,_,_,_,M,o,M],
    [M,o,M,M,M,o,M,M,M,M,M,M,M,o,M,M,M,o,M],
    [M,o,o,o,o,o,M,o,o,o,o,o,M,o,o,o,o,o,M],
    [M,M,M,o,M,M,M,o,M,M,M,o,M,M,M,o,M,M,M],
    [M,P,o,o,o,o,o,o,o,M,o,o,o,o,o,o,o,P,M],
    [M,o,M,M,M,M,M,M,o,M,o,M,M,M,M,M,M,o,M],
    [M,o,o,o,o,o,o,o,o,_,o,o,o,o,o,o,o,o,M],
    [M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M,M],
];

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

export const COLS = 19;
export const ROWS = 20; // Approx based on arrays

// Starting positions
export const PACMAN_START = { x: 9, y: 16 };
export const GHOST_HOUSE_EXIT = { x: 9, y: 8 };
export const GHOST_HOUSE_CENTER = { x: 9, y: 10 };
