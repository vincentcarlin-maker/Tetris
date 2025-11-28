import { TileType } from './types';

// 0: Empty, 1: Wall, 2: Dot, 3: Power Pellet, 4: Gate
const M: TileType = 1; // Wall
const o: TileType = 2; // Dot
const P: TileType = 3; // Power
const _: TileType = 0; // Empty
const G: TileType = 4; // Gate

// Classic-ish layout adapted for vertical screen (19x21 roughly)
// 19 cols width is good for mobile
export const LEVEL_MAP: TileType[][] = [
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
    [_,_,_,_,o,_,_,M,_,_,_,M,_,_,o,_,_,_,_], // Tunnel row
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

export const COLS = LEVEL_MAP[0].length;
export const ROWS = LEVEL_MAP.length;

// Starting positions
export const PACMAN_START = { x: 9, y: 16 };
export const GHOST_HOUSE_EXIT = { x: 9, y: 8 };
export const GHOST_HOUSE_CENTER = { x: 9, y: 10 };