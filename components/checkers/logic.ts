
import { BoardState, Piece, PlayerColor, Position, Move } from './types';

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
    let maxDepth = 0;
    let paths: JumpPath[] = [];

    const directions = [-1, 1];

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
                    
                    // If landing spot is occupied, we can't land there (unless it's the start pos, which is handled by board logic usually, but here we assume 'r,c' is effectively empty during recursion)
                    if (board[landR][landC] !== null && (landR !== r || landC !== c)) break; 

                    // Valid Jump found! 
                    // Recursively check for more jumps from this landing spot
                    const newJumpedIds = new Set(jumpedIds);
                    newJumpedIds.add(target.id);
                    
                    // Recursive call
                    // Temporarily simulate move? No, we just pass the new coordinate and the set of jumped IDs
                    // Note: We don't modify board, just assume 'piece' is at landR, landC
                    const subPaths = getCaptureChains(board, piece, landR, landC, newJumpedIds);

                    if (subPaths.length > 0) {
                        // Extend paths
                        subPaths.forEach(sp => {
                            paths.push({
                                to: { r: landR, c: landC }, // This is the *immediate* next step? No, DFS returns full chains.
                                // Actually for the game engine, we want immediate moves linked to a weight.
                                // Let's simplify: We just want to know the MAX LENGTH achievable from here.
                                // But to return valid Moves, we need the specific immediate landing.
                                
                                // Let's construct the chain:
                                // If subpaths exist, we append current jump to them? 
                                // Actually, standard checkers engine: move one step at a time.
                                // So we need to report: "If I land at landR, landC, I have achieved X total captures"
                                jumped: [{r: enemyR, c: enemyC}, ...sp.jumped]
                            });
                        });
                    } else {
                        // Terminal jump
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
    let maxCaptureCount = 0;

    // Iterate all pieces of player
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (!piece || piece.player !== player) continue;

            // If we are in a multi-jump sequence, we MUST move the specific piece
            if (mustMovePiece && (r !== mustMovePiece.r || c !== mustMovePiece.c)) continue;

            // 1. Calculate Jumps (Captures)
            // Initial call: empty set of jumped IDs
            const chains = getCaptureChains(board, piece, r, c, new Set());
            
            chains.forEach(chain => {
                if (chain.jumped.length > maxCaptureCount) maxCaptureCount = chain.jumped.length;
            });

            chains.forEach(chain => {
                // To allow step-by-step movement in UI, we only look at the *first* jump in the chain.
                // However, we filter based on the *total* chain length (maxCaptureCount).
                // Wait, if I have a chain of 3, the immediate move is just the first hop.
                // But that immediate hop 'inherits' the weight of the full chain.
                
                // We need to identify the immediate landing spot associated with the start of this chain.
                // The 'getCaptureChains' returns flat objects representing the END of chains.
                // This is tricky for step-by-step UI. 
                
                // Refined Approach:
                // Calculate immediate jumps. For each immediate jump, calculate max subsequent jumps.
                // Total Weight = 1 + max_subsequent.
            });
        }
    }

    // --- REFINED ALGORITHM ---
    // 1. Identify all possible IMMEDIATE moves (slides and jumps)
    // 2. Assign a "weight" (total captures possible) to each move
    // 3. Filter by max weight.

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

                            // Check recursion max depth from this landing
                            // Simulate board state? No, standard is: pieces removed at END of turn.
                            // But we cannot jump 'target.id' again.
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

            // -- SIMPLE MOVES (Only if no jumps found globally, but we calculate first) --
            if (!mustMovePiece) { // Cannot slide if in middle of combo
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
    // 1. Find max weight
    let globalMax = 0;
    candidates.forEach(m => { if(m.pathWeight > globalMax) globalMax = m.pathWeight; });

    // 2. Return only moves matching max weight
    return candidates.filter(m => m.pathWeight === globalMax);
};

export const executeMove = (board: BoardState, move: Move): { newBoard: BoardState, promoted: boolean } => {
    // Deep copy
    const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
    const piece = newBoard[move.from.r][move.from.c]!;

    // Move piece
    newBoard[move.to.r][move.to.c] = piece;
    newBoard[move.from.r][move.from.c] = null;

    // Handle captures
    // Note: In visual UI, we remove immediately for simplicity, 
    // though strict rules say "remove at end". Since we prevent re-jumping in logic, this is acceptable for UX.
    if (move.isJump && move.jumpedPieces) {
        move.jumpedPieces.forEach(p => {
            newBoard[p.r][p.c] = null;
        });
    }

    // Promotion
    // Rule: Promotes ONLY if the move *ends* on the line. 
    // If pathWeight > 1 (meaning more jumps available from here), we do NOT promote and must continue as pawn.
    // However, the `executeMove` is per step.
    // If the valid moves from the new position have `isJump` and are continuations, we don't promote?
    // Actually, simpler check: Did we land on promotion line?
    // AND Is the turn over? (Turn is over if no more jumps possible from here matching weight).
    
    // For now, simple promotion check. The logic in component handles multi-turn.
    // We flag 'promoted' only if it stops here.
    
    let promoted = false;
    if (!piece.isKing) {
        const isPromoLine = (piece.player === 'white' && move.to.r === 0) || (piece.player === 'red' && move.to.r === BOARD_SIZE - 1);
        if (isPromoLine) {
            // Check if we can continue jumping?
            // Technically we need to check if there are valid jumps from the new position.
            // If yes, and we are a pawn, we *must* continue jumping as a pawn (backwards maybe).
            // But if we stop, we promote.
            
            // To simplify for this specific function:
            // We just return the board. The Game Component checks for follow-up moves.
            // If no follow-up moves, it promotes there.
            // BUT, visual promotion should happen now? 
            // International rules: "If a pawn reaches the king row during a capture sequence but has to jump backwards, it remains a pawn."
            // So we delay promotion until turn end.
        }
    }

    return { newBoard, promoted: false }; // Promotion handled in component
};

export const getBestMove = (board: BoardState, player: PlayerColor): Move | null => {
    const moves = getValidMoves(board, player);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
};
