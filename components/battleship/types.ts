
export type ShipType = 'CARRIER' | 'BATTLESHIP' | 'CRUISER' | 'SUBMARINE' | 'DESTROYER';

export interface Ship {
  id: string;
  type: ShipType;
  size: number;
  hits: number;
  orientation: 'horizontal' | 'vertical';
  row: number;
  col: number;
  sunk: boolean;
}

// 0: Empty, 1: Ship, 2: Miss, 3: Hit
export type CellStatus = 0 | 1 | 2 | 3;
export type Grid = CellStatus[][];

export interface GameState {
  phase: 'SETUP' | 'PLAYING' | 'GAMEOVER';
  playerGrid: Grid;
  cpuGrid: Grid; // Visuellement cachée (sauf hits/miss)
  playerShips: Ship[];
  cpuShips: Ship[];
  turn: 'PLAYER' | 'CPU';
  winner: 'PLAYER' | 'CPU' | null;
  lastCpuHit: { r: number, c: number } | null; // Pour l'IA "Hunter"
}
