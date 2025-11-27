
import { Grid, Difficulty } from './types';

const BLANK = null;
const GRID_SIZE = 9;

// --- Helper Functions ---

const shuffle = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

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
    if (j >= GRID_SIZE && i < GRID_SIZE - 1) {
        i = i + 1;
        j = 0;
    }
    if (i >= GRID_SIZE && j >= GRID_SIZE) return true;

    if (i < 3) {
        if (j < 3) j = 3;
    } else if (i < 6) {
        if (j === (i / 3) * 3) j = j + 3;
    } else {
        if (j === 6) {
            i = i + 1;
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

const removeDigits = (grid: Grid, count: number) => {
    let attempts = count;
    while (attempts > 0) {
        let i = Math.floor(Math.random() * GRID_SIZE);
        let j = Math.floor(Math.random() * GRID_SIZE);
        while (grid[i][j] === BLANK) {
            i = Math.floor(Math.random() * GRID_SIZE);
            j = Math.floor(Math.random() * GRID_SIZE);
        }
        grid[i][j] = BLANK;
        attempts--;
    }
};

export const generateSudoku = (difficulty: Difficulty) => {
    // 1. Create Empty Grid
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));

    // 2. Fill Diagonal Boxes (Independent)
    fillDiagonal(grid);

    // 3. Fill Remaining (Backtracking)
    fillRemaining(grid, 0, 3);

    // 4. Copy solution
    const solution = grid.map(row => [...row]);

    // 5. Remove Digits based on difficulty
    let removeCount = 30; // Easy
    if (difficulty === 'MEDIUM') removeCount = 40;
    if (difficulty === 'HARD') removeCount = 50;

    const puzzleGrid = grid.map(row => [...row]);
    removeDigits(puzzleGrid, removeCount);

    return { initial: puzzleGrid, solution };
};
