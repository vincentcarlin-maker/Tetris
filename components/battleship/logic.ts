
import { Grid, Ship, ShipType, CellStatus } from './types';

export const GRID_SIZE = 10;

// Configuration avec Labels Français
export const SHIPS_CONFIG: { type: ShipType; size: number; label: string }[] = [
  { type: 'CARRIER', size: 5, label: 'PORTE-AVIONS' },
  { type: 'BATTLESHIP', size: 4, label: 'CUIRASSÉ' },
  { type: 'CRUISER', size: 3, label: 'CROISEUR' },
  { type: 'SUBMARINE', size: 3, label: 'SOUS-MARIN' },
  { type: 'DESTROYER', size: 2, label: 'TORPILLEUR' },
];

export const createEmptyGrid = (): Grid => 
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

// Vérifie si un placement est valide
export const isValidPlacement = (grid: Grid, row: number, col: number, size: number, orientation: 'horizontal' | 'vertical'): boolean => {
  if (orientation === 'horizontal') {
    if (col + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (grid[row][col + i] !== 0) return false;
    }
  } else {
    if (row + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (grid[row + i][col] !== 0) return false;
    }
  }
  return true;
};

// Place un navire sur la grille
export const placeShipOnGrid = (grid: Grid, ship: Ship) => {
  if (ship.orientation === 'horizontal') {
    for (let i = 0; i < ship.size; i++) grid[ship.row][ship.col + i] = 1;
  } else {
    for (let i = 0; i < ship.size; i++) grid[ship.row + i][ship.col] = 1;
  }
};

// Génération aléatoire des navires
export const generateRandomShips = (): { grid: Grid; ships: Ship[] } => {
  const grid = createEmptyGrid();
  const ships: Ship[] = [];

  SHIPS_CONFIG.forEach((config, idx) => {
    let placed = false;
    while (!placed) {
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      if (isValidPlacement(grid, row, col, config.size, orientation)) {
        const newShip: Ship = {
          id: `ship-${idx}`,
          type: config.type,
          size: config.size,
          hits: 0,
          orientation,
          row,
          col,
          sunk: false
        };
        placeShipOnGrid(grid, newShip);
        ships.push(newShip);
        placed = true;
      }
    }
  });

  return { grid, ships };
};

// Vérifie si un tir touche un navire spécifique
export const checkHit = (r: number, c: number, ships: Ship[]): { hit: boolean, shipId?: string, sunk?: boolean } => {
  for (const ship of ships) {
    let isHit = false;
    if (ship.orientation === 'horizontal') {
      if (r === ship.row && c >= ship.col && c < ship.col + ship.size) isHit = true;
    } else {
      if (c === ship.col && r >= ship.row && r < ship.row + ship.size) isHit = true;
    }

    if (isHit) {
      ship.hits++;
      const sunk = ship.hits >= ship.size;
      ship.sunk = sunk;
      return { hit: true, shipId: ship.id, sunk };
    }
  }
  return { hit: false };
};

// --- SMART AI LOGIC (Hunter-Target with Parity) ---
// 0: Empty/Unknown (or Ship hidden), 2: Miss, 3: Hit
export const getCpuMove = (grid: Grid): { r: number, c: number } => {
  const size = grid.length;
  const hits: {r: number, c: number}[] = [];
  const availableMoves: {r: number, c: number}[] = [];

  // 1. Analyze Board State
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      // Note: 1 represents a ship, but for the AI logic it counts as Unknown/Targetable just like 0
      if (cell === 3) hits.push({ r, c }); 
      if (cell === 0 || cell === 1) availableMoves.push({ r, c });
    }
  }

  // Helper to check cell status safely
  const getCell = (r: number, c: number) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return 2; // Treat out of bounds as miss/blocked
      return grid[r][c];
  };

  const isUnknown = (r: number, c: number) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      const cell = grid[r][c];
      return cell === 0 || cell === 1;
  };

  // 2. TARGET MODE: Find unfinished hits
  // We look for hits that have adjacent unknown squares
  let bestTarget: {r: number, c: number} | null = null;
  let maxPriority = -1;

  for (const hit of hits) {
      const neighbors = [
          { r: hit.r - 1, c: hit.c }, // Up
          { r: hit.r + 1, c: hit.c }, // Down
          { r: hit.r, c: hit.c - 1 }, // Left
          { r: hit.r, c: hit.c + 1 }  // Right
      ];

      // Check context to detect ship orientation
      // Is this hit part of a vertical line of hits?
      const up = getCell(hit.r - 1, hit.c);
      const down = getCell(hit.r + 1, hit.c);
      const isVerticalChain = up === 3 || down === 3;

      // Is this hit part of a horizontal line of hits?
      const left = getCell(hit.r, hit.c - 1);
      const right = getCell(hit.r, hit.c + 1);
      const isHorizontalChain = left === 3 || right === 3;

      for (const n of neighbors) {
          if (isUnknown(n.r, n.c)) {
              let priority = 1; // Standard neighbor

              // INTELLIGENCE: 
              // If we found a vertical chain, prioritize Up/Down neighbors heavily
              if (isVerticalChain && n.c === hit.c) priority = 10;
              // If we found a horizontal chain, prioritize Left/Right neighbors heavily
              if (isHorizontalChain && n.r === hit.r) priority = 10;

              // If we found a better target based on logic, save it
              if (priority > maxPriority) {
                  maxPriority = priority;
                  bestTarget = n;
              }
          }
      }
  }

  if (bestTarget) return bestTarget;

  // 3. HUNT MODE (Parity Optimization)
  // Only target "even" squares (checkerboard pattern) to find ships faster
  // Smallest ship is 2, so checkerboard guarantees a hit eventually.
  const parityMoves = availableMoves.filter(m => (m.r + m.c) % 2 === 0);
  
  if (parityMoves.length > 0) {
      return parityMoves[Math.floor(Math.random() * parityMoves.length)];
  }

  // Fallback: Random available
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};
