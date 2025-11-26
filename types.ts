
export type TetrominoShape = (string | number)[][];
export type TetrominoKey = '0' | 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export type Tetromino = {
  shape: TetrominoShape;
  color: string;
};

export type Tetrominos = {
  [key in TetrominoKey]: Tetromino;
};

export type Cell = [TetrominoKey, 'clear' | 'merged' | 'ghost' | 'clearing'];
export type Board = Cell[][];

export type Player = {
  pos: { x: number; y: number };
  tetromino: TetrominoShape;
  collided: boolean;
};

export type NextTetromino = {
  shape: TetrominoShape;
}

export type HeldTetromino = {
    shape: TetrominoShape | null;
}
