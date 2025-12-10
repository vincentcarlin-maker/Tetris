
import { BoardState, Piece, PlayerColor, Position, Move, Difficulty } from './types';

export const BOARD_SIZE = 10;

// Init board: Red (P2) top (0-3), White (P1) bottom (6-9)
export const createInitialBoard = (): BoardState => {
    const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    let idCounter = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            // International draughts: Bottom-left (relative to white) is active.
            // If (0,0) is top-left.
            // Row 9 (Bottom), Col 0 (Left). 9+0=9 (Odd).
            if ((r + c) % 2 === 1) {
                if (r < 4) {
                    board[r][c] = { id: `r-${idCounter++}`, player: 'red', isKing: false };
                } else if (r > 5) {
                    board[r][c] = { id: `w-${idCounter++}`, player: 'white', isKing: false };
                }
            }
        }
    }
    return board;
};

const isValidPos = (r: number, c: number) => r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;

// --- JUMP LOGIC (DFS) ---

interface JumpPath {
    to: Position;
    jumped: Position[];
}

// Find all possible jump sequences for a specific piece
const getCaptureChains = (
    board: BoardState, 
    piece: Piece, 
    r: number, 
    c: number, 
    jumpedIds: Set<string> // To prevent jumping the same piece twice in one turn
): JumpPath[] => {
    let paths: JumpPath[] = [];

    // Directions for the piece (Kings move differently)
    const checkDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of checkDirs) {
        // Pawn logic: capture adjacent
        // King logic: capture at distance
        let dist = 1;
        while (true) {
            if (!piece.isKing && dist > 1) break; // Pawns calculate 1 step distance for detection

            const enemyR = r + (dr * dist);
            const enemyC = c + (dc * dist);

            if (!isValidPos(enemyR, enemyC)) break;

            const target = board[enemyR][enemyC];

            // If we hit our own piece, stop in this direction
            if (target && target.player === piece.player) break;

            // If we hit an enemy
            if (target && target.player !== piece.player) {
                if (jumpedIds.has(target.id)) break; // Already jumped this sequence

                // Check landing spots behind enemy
                let landDist = 1;
                while (true) {
                    // Pawns must land exactly behind (landDist=1)
                    // Kings can land anywhere after
                    if (!piece.isKing && landDist > 1) break;

                    const landR = enemyR + (dr * landDist);
                    const landC = enemyC + (dc * landDist);

                    if (!isValidPos(landR, landC)) break;
                    
                    // If landing spot is occupied, we can't land there
                    if (board[landR][landC] !== null && (landR !== r || landC !== c)) break; 

                    // Valid Jump found! 
                    const newJumpedIds = new Set(jumpedIds);
                    newJumpedIds.add(target.id);
                    
                    const subPaths = getCaptureChains(board, piece, landR, landC, newJumpedIds);

                    if (subPaths.length > 0) {
                        subPaths.forEach(sp => {
                            paths.push({
                                to: { r: landR, c: landC },
                                jumped: [{r: enemyR, c: enemyC}, ...sp.jumped]
                            });
                        });
                    } else {
                        paths.push({
                            to: { r: landR, c: landC },
                            jumped: [{r: enemyR, c: enemyC}]
                        });
                    }

                    landDist++;
                }
                break; // Stop looking in this direction after finding the first enemy
            }
            dist++;
        }
    }
    return paths;
};

export const getValidMoves = (board: BoardState, player: PlayerColor, mustMovePiece?: Position): Move[] => {
    let moves: Move[] = [];
    
    // --- REFINED ALGORITHM ---
    const candidates: Move[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (!piece || piece.player !== player) continue;
            if (mustMovePiece && (r !== mustMovePiece.r || c !== mustMovePiece.c)) continue;

            // -- JUMPS --
            const checkDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of checkDirs) {
                let dist = 1;
                while (true) {
                    if (!piece.isKing && dist > 1) break;
                    
                    const enemyR = r + (dr * dist);
                    const enemyC = c + (dc * dist);
                    
                    if (!isValidPos(enemyR, enemyC)) break;
                    
                    const target = board[enemyR][enemyC];
                    if (target && target.player === piece.player) break; // Blocked by self

                    if (target && target.player !== player) {
                        // Found enemy, look for landing spots
                        let landDist = 1;
                        while(true) {
                            if (!piece.isKing && landDist > 1) break;
                            const landR = enemyR + (dr * landDist);
                            const landC = enemyC + (dc * landDist);
                            
                            if (!isValidPos(landR, landC)) break;
                            if (board[landR][landC] !== null) break; // Landing blocked

                            const jumpedSet = new Set<string>();
                            jumpedSet.add(target.id);
                            const subChains = getCaptureChains(board, piece, landR, landC, jumpedSet);
                            
                            const maxSub = subChains.length > 0 ? Math.max(...subChains.map(s => s.jumped.length)) : 0;
                            
                            candidates.push({
                                from: {r,c},
                                to: {r: landR, c: landC},
                                isJump: true,
                                jumpedPieces: [{r: enemyR, c: enemyC}],
                                pathWeight: 1 + maxSub
                            });

                            landDist++;
                        }
                        break; // Stop scanning this dir after enemy
                    }
                    dist++;
                }
            }

            // -- SIMPLE MOVES (Only if no jumps found globally) --
            if (!mustMovePiece) { 
                const moveDirs = [];
                if (!piece.isKing) {
                    if (player === 'white') moveDirs.push([-1, -1], [-1, 1]);
                    else moveDirs.push([1, -1], [1, 1]);
                } else {
                    moveDirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
                }

                for (const [dr, dc] of moveDirs) {
                    let dist = 1;
                    while(true) {
                        if (!piece.isKing && dist > 1) break;
                        const nr = r + (dr*dist);
                        const nc = c + (dc*dist);
                        if (!isValidPos(nr, nc)) break;
                        if (board[nr][nc] !== null) break;

                        candidates.push({
                            from: {r,c},
                            to: {r: nr, c: nc},
                            isJump: false,
                            jumpedPieces: [],
                            pathWeight: 0
                        });
                        dist++;
                    }
                }
            }
        }
    }

    // --- FILTERING ---
    let globalMax = 0;
    candidates.forEach(m => { if(m.pathWeight > globalMax) globalMax = m.pathWeight; });

    // Force mandatory jumps if any exist (weight > 0)
    if (globalMax > 0) {
        return candidates.filter(m => m.pathWeight === globalMax);
    }

    return candidates;
};

export const executeMove = (board: BoardState, move: Move): { newBoard: BoardState, promoted: boolean } => {
    const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
    const piece = newBoard[move.from.r][move.from.c]!;

    newBoard[move.to.r][move.to.c] = piece;
    newBoard[move.from.r][move.from.c] = null;

    if (move.isJump && move.jumpedPieces) {
        move.jumpedPieces.forEach(p => {
            newBoard[p.r][p.c] = null;
        });
    }

    let promoted = false;
    if (!piece.isKing) {
        const isPromoLine = (piece.player === 'white' && move.to.r === 0) || (piece.player === 'red' && move.to.r === BOARD_SIZE - 1);
        if (isPromoLine) {
            // Note: In real draughts, promotion stops the turn immediately. 
            // We handle the king conversion in the main component `handleTurnEnd` for logic simplicity with multi-jumps.
            promoted = true;
        }
    }

    return { newBoard, promoted }; 
};

// --- MINIMAX AI ---

const evaluateBoard = (board: BoardState, player: PlayerColor): number => {
    let score = 0;
    const opponent = player === 'white' ? 'red' : 'white';

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = board[r][c];
            if (!p) continue;

            let value = 10; // Basic piece
            if (p.isKing) value = 30; // King value

            // Position bonus (center control)
            if (c >= 3 && c <= 6 && r >= 3 && r <= 6) value += 2;
            
            // Back row protection bonus
            if (!p.isKing) {
                if (p.player === 'white' && r === BOARD_SIZE - 1) value += 3;
                if (p.player === 'red' && r === 0) value += 3;
            }

            if (p.player === player) score += value;
            else score -= value;
        }
    }
    return score;
};

const minimax = (
    board: BoardState, 
    depth: number, 
    alpha: number, 
    beta: number, 
    maximizing: boolean, 
    player: PlayerColor
): number => {
    if (depth === 0) {
        return evaluateBoard(board, player);
    }

    const currentPlayer = maximizing ? player : (player === 'white' ? 'red' : 'white');
    const validMoves = getValidMoves(board, currentPlayer);

    if (validMoves.length === 0) {
        // No moves = loss
        return maximizing ? -1000 : 1000;
    }

    if (maximizing) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const { newBoard } = executeMove(board, move);
            // Handling multi-jumps in recursion is complex; simplifying by assuming turn ends or just evaluating state
            // To be accurate, if it's a jump, we should check for follow-up. 
            // For this implementation, we treat each atomic move as a state transition.
            const ev = minimax(newBoard, depth - 1, alpha, beta, false, player);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const { newBoard } = executeMove(board, move);
            const ev = minimax(newBoard, depth - 1, alpha, beta, true, player);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getBestMove = (board: BoardState, player: PlayerColor, difficulty: Difficulty): Move | null => {
    const moves = getValidMoves(board, player);
    if (moves.length === 0) return null;

    // 1. Easy: Random
    if (difficulty === 'EASY') {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // 2. Medium/Hard: Minimax
    const depth = difficulty === 'MEDIUM' ? 2 : 4; 
    let bestMove = moves[0];
    let maxVal = -Infinity;

    for (const move of moves) {
        const { newBoard } = executeMove(board, move);
        const val = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player);
        if (val > maxVal) {
            maxVal = val;
            bestMove = move;
        }
    }

    return bestMove;
};
