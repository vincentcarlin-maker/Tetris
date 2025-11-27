
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CellValue = number | null;
export type Grid = CellValue[][];
export type CellCoords = { r: number; c: number };

export interface GameState {
  initialGrid: Grid; // The puzzle with holes (immutable for a game)
  playerGrid: Grid;  // The grid the player fills
  solution: Grid;    // The solved grid for validation
  difficulty: Difficulty;
  selectedCell: CellCoords | null;
  mistakes: number;
  isWon: boolean;
}
