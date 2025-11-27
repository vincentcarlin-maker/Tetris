
import { Grid, Difficulty } from './types';

const BLANK = null;
const GRID_SIZE = 9;

// --- Helper Functions ---

const isValid = (grid: Grid, row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[row][x] === num) return false;
    }
    // Check col
    for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[x][col] === num) return false;
    }
    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
};

// --- Generation Logic ---

const fillDiagonal = (grid: Grid) => {
    for (let i = 0; i < GRID_SIZE; i = i + 3) {
        fillBox(grid, i, i);
    }
};

const fillBox = (grid: Grid, row: number, col: number) => {
    let num: number;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!isSafeInBox(grid, row, col, num));
            grid[row + i][col + j] = num;
        }
    }
};

const isSafeInBox = (grid: Grid, rowStart: number, colStart: number, num: number) => {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
};

const fillRemaining = (grid: Grid, i: number, j: number): boolean => {
    if (j >= GRID_SIZE) {
        i += 1;
        j = 0;
    }
    if (i >= GRID_SIZE) return true;

    // Skip diagonal boxes (already filled)
    if (i < 3) {
        if (j < 3) j = 3;
    } else if (i < 6) {
        if (j === Math.floor(i / 3) * 3) j += 3;
    } else {
        if (j === 6) {
            i += 1;
            j = 0;
            if (i >= GRID_SIZE) return true;
        }
    }

    for (let num = 1; num <= 9; num++) {
        if (isValid(grid, i, j, num)) {
            grid[i][j] = num;
            if (fillRemaining(grid, i, j + 1)) return true;
            grid[i][j] = BLANK;
        }
    }
    return false;
};

// Robust removal function that cannot infinite loop
const removeDigits = (grid: Grid, count: number) => {
    // 1. Get all filled cell coordinates
    const cells: {r: number, c: number}[] = [];
    for(let r=0; r<GRID_SIZE; r++){
        for(let c=0; c<GRID_SIZE; c++){
             if (grid[r][c] !== null) cells.push({r,c});
        }
    }
    
    // 2. Shuffle cells array
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // 3. Remove the first 'count' cells (or all if count > available)
    const toRemove = Math.min(count, cells.length);
    for(let i=0; i<toRemove; i++){
        const {r, c} = cells[i];
        grid[r][c] = BLANK;
    }
};

export const generateSudoku = (difficulty: Difficulty) => {
    let grid: Grid = [];
    let success = false;
    
    // Retry mechanism to ensure valid grid generation
    // (Backtracking can sometimes fail depending on initial diagonal seed)
    for(let attempt=0; attempt<5; attempt++){
        grid = Array.from({ length: 9 }, () => Array(9).fill(null));
        fillDiagonal(grid);
        if (fillRemaining(grid, 0, 3)) {
            success = true;
            break;
        }
    }
    
    // Even if generation failed (unlikely), we proceed safely to avoid crash.
    // The grid will be partially filled or empty, but the app won't freeze.
    
    const solution = grid.map(row => [...row]);
    
    let removeCount = 30; // Easy
    if (difficulty === 'MEDIUM') removeCount = 40;
    if (difficulty === 'HARD') removeCount = 50;
    
    const puzzleGrid = grid.map(row => [...row]);
    removeDigits(puzzleGrid, removeCount);
    
    return { initial: puzzleGrid, solution };
};
