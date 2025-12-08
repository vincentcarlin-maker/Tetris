
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

// --- AI LOGIC (Simple Hunt & Target) ---
export const getCpuMove = (grid: Grid, lastHit: { r: number, c: number } | null): { r: number, c: number } => {
  const availableMoves: { r: number, c: number }[] = [];
  
  // Lister tous les coups possibles
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0 || grid[r][c] === 1) { // 0=Empty, 1=Ship (Hidden to AI logic, but targetable)
        availableMoves.push({ r, c });
      }
    }
  }

  // MODE "TARGET": Si on a touché au coup précédent, on essaie les cases adjacentes
  if (lastHit) {
    const adjacents = [
      { r: lastHit.r - 1, c: lastHit.c }, // Up
      { r: lastHit.r + 1, c: lastHit.c }, // Down
      { r: lastHit.r, c: lastHit.c - 1 }, // Left
      { r: lastHit.r, c: lastHit.c + 1 }, // Right
    ];

    const validTargets = adjacents.filter(pos => 
      pos.r >= 0 && pos.r < GRID_SIZE && 
      pos.c >= 0 && pos.c < GRID_SIZE && 
      (grid[pos.r][pos.c] === 0 || grid[pos.r][pos.c] === 1)
    );

    if (validTargets.length > 0) {
      return validTargets[Math.floor(Math.random() * validTargets.length)];
    }
  }

  // MODE "HUNT": Tir aléatoire
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};
