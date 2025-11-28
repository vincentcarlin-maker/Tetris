
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Position {
    x: number; // Grid-based float (e.g. 1.5)
    y: number;
}

export type GhostColor = 'red' | 'pink' | 'cyan' | 'orange';
export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';

export interface Ghost {
    id: number;
    pos: Position;
    dir: Direction;
    color: GhostColor;
    mode: GhostMode;
    startPos: Position;
    speed: number;
}

export interface Pacman {
    pos: Position;
    dir: Direction;
    nextDir: Direction;
    speed: number;
    isPowered: boolean;
}

// 0: Empty, 1: Wall, 2: Dot, 3: Power Pellet, 4: Gate
export type TileType = 0 | 1 | 2 | 3 | 4;
export type Grid = TileType[][];

export interface GameState {
    status: 'start' | 'playing' | 'gameOver' | 'won';
    score: number;
    lives: number;
    level: number;
}
