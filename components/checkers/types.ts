
export type PlayerColor = 'white' | 'red'; // White (Cyan - P1) moves UP, Red (Pink - P2) moves DOWN

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
    jumpedPiece?: Position; // Position of the captured piece
}

export interface GameState {
    board: BoardState;
    turn: PlayerColor;
    winner: PlayerColor | 'DRAW' | null;
    redPieces: number;
    whitePieces: number;
}
