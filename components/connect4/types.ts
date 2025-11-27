
export type Player = 1 | 2; // 1 = Human/P1 (Pink), 2 = AI/P2 (Cyan)
export type CellValue = Player | 0;
export type BoardState = CellValue[][]; // 6 rows, 7 cols
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'PVP' | 'PVE';

export interface WinState {
  winner: Player | 'DRAW' | null;
  line: [number, number][]; // Array of [row, col] coordinates
}
