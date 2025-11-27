
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CellValue = number | null;
export type Grid = CellValue[][];
export type CellCoords = { r: number; c: number };

export interface GameState {
  initialGrid: Grid;
  playerGrid: Grid;
  solution: Grid;
  difficulty: Difficulty;
  selectedCell: CellCoords | null;
  mistakes: number;
  isWon: boolean;
}
