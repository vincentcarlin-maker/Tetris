
import { Board, Player, Tetromino, Tetrominos, TetrominoKey } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const createBoard = (): Board =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    new Array(BOARD_WIDTH).fill(['0', 'clear'])
  );

export const TETROMINOS: Tetrominos = {
  '0': { shape: [[0]], color: 'transparent' },
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
    ],
    color: '80, 227, 230', // Cyan
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0],
    ],
    color: '36, 95, 223', // Blue
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L'],
    ],
    color: '223, 173, 36', // Orange
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '223, 217, 36', // Yellow
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: '48, 211, 56', // Green
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0],
    ],
    color: '132, 61, 198', // Purple
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: '227, 78, 78', // Red
  },
};

export const randomTetromino = (): Tetromino => {
  const tetrominos: TetrominoKey[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};


export const checkCollision = (player: Player, board: Board, { x: moveX, y: moveY }: { x: number; y: number }): boolean => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
        for (let x = 0; x < player.tetromino[y].length; x += 1) {
            if (player.tetromino[y][x] !== 0) {
                if (
                    // 1. Check that our move is inside the game areas height (y)
                    !board[y + player.pos.y + moveY] ||
                    // 2. Check that our move is inside the game areas width (x)
                    !board[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
                    // 3. Check that the cell we are moving to isn't set to clear
                    board[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
                ) {
                    return true;
                }
            }
        }
    }
    return false;
};
