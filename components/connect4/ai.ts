
import { BoardState, CellValue, Player } from './types';

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER_1 = 1; // Human usually
const PLAYER_2 = 2; // AI usually

// Helper to check for a win (reused in game logic but needed here for simulation)
export const checkWin = (board: BoardState): { winner: Player | null } => {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) {
        return { winner: board[r][c] as Player };
      }
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
        return { winner: board[r][c] as Player };
      }
    }
  }
  // Diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r-1][c+1] && board[r][c] === board[r-2][c+2] && board[r][c] === board[r-3][c+3]) {
        return { winner: board[r][c] as Player };
      }
    }
  }
  // Diagonal \
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) {
        return { winner: board[r][c] as Player };
      }
    }
  }
  return { winner: null };
};

// Get valid columns (not full)
const getValidLocations = (board: BoardState): number[] => {
  const validLocs = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) {
      validLocs.push(c);
    }
  }
  return validLocs;
};

// Find the next open row in a column
const getNextOpenRow = (board: BoardState, col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      return r;
    }
  }
  return -1;
};

// Evaluate a window of 4 cells
const evaluateWindow = (window: number[], piece: number): number => {
  let score = 0;
  const oppPiece = piece === PLAYER_1 ? PLAYER_2 : PLAYER_1;

  const pieceCount = window.filter(cell => cell === piece).length;
  const emptyCount = window.filter(cell => cell === EMPTY).length;
  const oppCount = window.filter(cell => cell === oppPiece).length;

  if (pieceCount === 4) score += 100;
  else if (pieceCount === 3 && emptyCount === 1) score += 5;
  else if (pieceCount === 2 && emptyCount === 2) score += 2;

  if (oppCount === 3 && emptyCount === 1) score -= 4;

  return score;
};

// Heuristic score function
const scorePosition = (board: BoardState, piece: number): number => {
  let score = 0;

  // Center column preference
  const centerArray = [];
  for (let r = 0; r < ROWS; r++) {
    centerArray.push(board[r][Math.floor(COLS / 2)]);
  }
  const centerCount = centerArray.filter(cell => cell === piece).length;
  score += centerCount * 3;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    const rowArray = board[r];
    for (let c = 0; c < COLS - 3; c++) {
      const window = rowArray.slice(c, c + 4);
      score += evaluateWindow(window, piece);
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    const colArray = [];
    for (let r = 0; r < ROWS; r++) {
      colArray.push(board[r][c]);
    }
    for (let r = 0; r < ROWS - 3; r++) {
      const window = colArray.slice(r, r + 4);
      score += evaluateWindow(window, piece);
    }
  }

  // Diagonal /
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
      score += evaluateWindow(window as number[], piece);
    }
  }

  // Diagonal \
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
      score += evaluateWindow(window as number[], piece);
    }
  }

  return score;
};

// Minimax algorithm
const minimax = (
  board: BoardState, 
  depth: number, 
  alpha: number, 
  beta: number, 
  maximizingPlayer: boolean
): [number, number] => { // Returns [column, score]
  const validLocations = getValidLocations(board);
  const isTerminal = checkWin(board).winner !== null || validLocations.length === 0;

  if (depth === 0 || isTerminal) {
    if (isTerminal) {
      const { winner } = checkWin(board);
      if (winner === PLAYER_2) return [-1, 10000000];
      else if (winner === PLAYER_1) return [-1, -10000000];
      else return [-1, 0]; // Draw
    } else {
      return [-1, scorePosition(board, PLAYER_2)];
    }
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    let column = validLocations[Math.floor(Math.random() * validLocations.length)];
    
    for (const col of validLocations) {
      const row = getNextOpenRow(board, col);
      const bCopy = board.map(r => [...r]);
      bCopy[row][col] = PLAYER_2;
      const newScore = minimax(bCopy, depth - 1, alpha, beta, false)[1];
      
      if (newScore > value) {
        value = newScore;
        column = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [column, value];
  } else {
    let value = Infinity;
    let column = validLocations[Math.floor(Math.random() * validLocations.length)];

    for (const col of validLocations) {
      const row = getNextOpenRow(board, col);
      const bCopy = board.map(r => [...r]);
      bCopy[row][col] = PLAYER_1;
      const newScore = minimax(bCopy, depth - 1, alpha, beta, true)[1];

      if (newScore < value) {
        value = newScore;
        column = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [column, value];
  }
};

export const getBestMove = (board: BoardState, difficulty: string): number => {
  const validMoves = getValidLocations(board);
  
  // 1. Easy: Random move
  if (difficulty === 'EASY') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 2. Medium: Depth 2 (looks ahead slightly)
  if (difficulty === 'MEDIUM') {
    // 30% chance of random error to make it beatable
    if (Math.random() < 0.3) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    const [col] = minimax(board, 2, -Infinity, Infinity, true);
    return col !== -1 ? col : validMoves[0];
  }

  // 3. Hard: Depth 5 (Strong play)
  const [col] = minimax(board, 5, -Infinity, Infinity, true);
  return col !== -1 ? col : validMoves[0];
};
