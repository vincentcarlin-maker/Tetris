
export interface Block {
    x: number;
    z: number;
    width: number;
    depth: number;
    y: number;
    color: string;
}

export interface Debris extends Block {
    vx: number;
    vy: number;
    vz: number;
    scale: number;
}

export type GamePhase = 'MENU' | 'IDLE' | 'PLAYING' | 'GAMEOVER';

export interface CurrentBlockState {
    x: number;
    z: number;
    dir: 1 | -1;
    axis: 'x' | 'z';
}

export interface Dimensions {
    width: number;
    depth: number;
}
