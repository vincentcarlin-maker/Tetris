
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
    // For diagonal boxes, any number placement is valid as long as it's not in the box itself.
    // They are independent of each other initially.
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle
    for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    let idx = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            grid[row + i][col + j] = nums[idx++];
        }
    }
};

let recursionCount = 0;

const fillRemaining = (grid: Grid, i: number, j: number): boolean => {
    recursionCount++;
    if (recursionCount > 50000) return false; // Safety break

    if (j >= GRID_SIZE) {
        i += 1;
        j = 0;
    }
    if (i >= GRID_SIZE) return true;

    // Skip diagonal boxes
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

const removeDigits = (grid: Grid, count: number) => {
    const cells: {r: number, c: number}[] = [];
    for(let r=0; r<GRID_SIZE; r++){
        for(let c=0; c<GRID_SIZE; c++){
             if (grid[r][c] !== null) cells.push({r,c});
        }
    }
    
    // Shuffle cells array
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const toRemove = Math.min(count, cells.length);
    for(let i=0; i<toRemove; i++){
        const {r, c} = cells[i];
        grid[r][c] = BLANK;
    }
};

export const generateSudoku = (difficulty: Difficulty) => {
    recursionCount = 0;
    let grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    
    fillDiagonal(grid);
    
    if (!fillRemaining(grid, 0, 3)) {
        // Should rarely happen with diagonal filling first
        // Return a default grid or retry logic if needed, but safe fallback here
        // Just clear it to be safe
        grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    }
    
    const solution = grid.map(row => [...row]);
    
    let removeCount = 30; // Easy
    if (difficulty === 'MEDIUM') removeCount = 40;
    if (difficulty === 'HARD') removeCount = 50;
    
    const puzzleGrid = grid.map(row => [...row]);
    removeDigits(puzzleGrid, removeCount);
    
    return { initial: puzzleGrid, solution };
};
