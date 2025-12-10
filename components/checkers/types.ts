
export type PlayerColor = 'white' | 'red'; // White (Cyan - P1) moves UP, Red (Pink - P2) moves DOWN

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Piece {
    id: string;
    player: PlayerColor;
    isKing: boolean;
}

export type BoardState = (Piece | null)[][];

export interface Position {
    r: number;
    c: number;
}

export interface Move {
    from: Position;
    to: Position;
    isJump: boolean;
    jumpedPieces: Position[]; // Array of captured positions for this specific step (usually 1, but tracked for chain)
    pathWeight: number; // Total captures in the full chain this move belongs to
}

export interface GameState {
    board: BoardState;
    turn: PlayerColor;
    winner: PlayerColor | 'DRAW' | null;
    redPieces: number;
    whitePieces: number;
}
