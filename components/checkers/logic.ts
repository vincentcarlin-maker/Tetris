
import { BoardState, Piece, PlayerColor, Position, Move } from './types';

export const BOARD_SIZE = 8;

// Init board: Red (P2) top, White (P1) bottom
export const createInitialBoard = (): BoardState => {
    const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    let idCounter = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if ((r + c) % 2 === 1) {
                if (r < 3) {
                    board[r][c] = { id: `r-${idCounter++}`, player: 'red', isKing: false };
                } else if (r > 4) {
                    board[r][c] = { id: `w-${idCounter++}`, player: 'white', isKing: false };
                }
            }
        }
    }
    return board;
};

const isValidPos = (r: number, c: number) => r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;

export const getValidMoves = (board: BoardState, player: PlayerColor): Move[] => {
    const moves: Move[] = [];
    const jumps: Move[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (!piece || piece.player !== player) continue;

            const directions = [];
            if (piece.player === 'white' || piece.isKing) directions.push([-1, -1], [-1, 1]); // Move Up
            if (piece.player === 'red' || piece.isKing) directions.push([1, -1], [1, 1]);   // Move Down

            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                if (isValidPos(nr, nc)) {
                    // 1. Simple Move
                    if (!board[nr][nc]) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc }, isJump: false });
                    }
                    // 2. Jump (Capture)
                    else if (board[nr][nc]?.player !== player) {
                        const jr = nr + dr;
                        const jc = nc + dc;
                        if (isValidPos(jr, jc) && !board[jr][jc]) {
                            jumps.push({ 
                                from: { r, c }, 
                                to: { r: jr, c: jc }, 
                                isJump: true,
                                jumpedPiece: { r: nr, c: nc }
                            });
                        }
                    }
                }
            }
        }
    }

    // Forced Capture Rule: If jumps exist, only return jumps
    return jumps.length > 0 ? jumps : moves;
};

export const executeMove = (board: BoardState, move: Move): { newBoard: BoardState, promoted: boolean } => {
    const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
    const piece = newBoard[move.from.r][move.from.c]!;

    // Move piece
    newBoard[move.to.r][move.to.c] = piece;
    newBoard[move.from.r][move.from.c] = null;

    // Capture
    if (move.isJump && move.jumpedPiece) {
        newBoard[move.jumpedPiece.r][move.jumpedPiece.c] = null;
    }

    // King Promotion
    let promoted = false;
    if (!piece.isKing) {
        if ((piece.player === 'white' && move.to.r === 0) || 
            (piece.player === 'red' && move.to.r === BOARD_SIZE - 1)) {
            piece.isKing = true;
            promoted = true;
        }
    }

    return { newBoard, promoted };
};

// --- AI (Simple Evaluation) ---
export const getBestMove = (board: BoardState, player: PlayerColor): Move | null => {
    const moves = getValidMoves(board, player);
    if (moves.length === 0) return null;

    // 1. Always take jumps
    const jumps = moves.filter(m => m.isJump);
    if (jumps.length > 0) return jumps[Math.floor(Math.random() * jumps.length)];

    // 2. Prioritize safety (don't move to where you can be eaten) - simplified
    // Random for basic difficulty
    return moves[Math.floor(Math.random() * moves.length)];
};
