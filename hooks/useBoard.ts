
import { useState, useEffect } from 'react';
import { createBoard, BOARD_WIDTH } from '../gameHelpers';
import { Board, Player, TetrominoKey, Cell } from '../types';

export const useBoard = (player: Player, resetPlayer: () => void, ghostPlayer: Player | null, playBlockDestroy: (type: string) => void) => {
    const [board, setBoard] = useState(createBoard());
    const [rowsCleared, setRowsCleared] = useState(0);

    // Effect to handle line clearing animation and removal
    useEffect(() => {
        const clearingRowsIndices = board.reduce((acc, row, idx) => {
            if (row[0][1] === 'clearing') acc.push(idx);
            return acc;
        }, [] as number[]);

        if (clearingRowsIndices.length > 0) {
            
            // 1. Identifier les types de blocs qui sont détruits pour jouer les sons
            const uniqueBlocks = new Set<string>();
            clearingRowsIndices.forEach(rowIndex => {
                board[rowIndex].forEach(cell => {
                    if (cell[0] !== '0' && cell[0] !== 0) {
                        uniqueBlocks.add(String(cell[0]));
                    }
                });
            });

            // 2. Jouer un son pour chaque type de bloc unique présent dans les lignes détruites
            uniqueBlocks.forEach((type) => {
                // Petit délai aléatoire pour éviter que tous les sons se superposent parfaitement (phasing)
                setTimeout(() => {
                    playBlockDestroy(type);
                }, Math.random() * 50);
            });


            const timer = setTimeout(() => {
                // Remove the clearing rows
                setBoard(prev => {
                    const newBoard = prev.filter((_, idx) => !clearingRowsIndices.includes(idx));
                    const newRows = Array.from({ length: clearingRowsIndices.length }, () =>
                        Array.from({ length: BOARD_WIDTH }, () => ['0', 'clear'] as Cell)
                    );
                    return [...newRows, ...newBoard];
                });
                
                // Update score
                setRowsCleared(prev => prev + clearingRowsIndices.length);

            }, 200); // Wait for animation to finish (matches CSS duration)

            return () => clearTimeout(timer);
        }
    }, [board, playBlockDestroy]);

    useEffect(() => {
        setRowsCleared(0);

        const updateBoard = (prevBoard: Board): Board => {
            // 1. Flush the board: Keep merged/clearing cells, remove clear/ghost
            const newBoard = prevBoard.map(
                row => row.map(cell => (cell[1] === 'clear' || cell[1] === 'ghost' ? ['0', 'clear'] : cell)) as typeof row
            );

            // 2. Draw Ghost Piece
            if (ghostPlayer) {
                ghostPlayer.tetromino.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            if (
                                y + ghostPlayer.pos.y >= 0 &&
                                newBoard[y + ghostPlayer.pos.y] &&
                                newBoard[y + ghostPlayer.pos.y][x + ghostPlayer.pos.x] &&
                                newBoard[y + ghostPlayer.pos.y][x + ghostPlayer.pos.x][1] === 'clear' // Only draw on clear cells
                            ) {
                                newBoard[y + ghostPlayer.pos.y][x + ghostPlayer.pos.x] = [
                                    value as TetrominoKey,
                                    'ghost',
                                ];
                            }
                        }
                    });
                });
            }

            // 3. Draw Player Piece
            player.tetromino.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        newBoard[y + player.pos.y][x + player.pos.x] = [
                            value as TetrominoKey,
                            player.collided ? 'merged' : 'clear',
                        ];
                    }
                });
            });

            // 4. Handle Collision
            if (player.collided) {
                resetPlayer();
                
                // Check for lines to clear
                const rowsToClearIndices = newBoard.reduce((acc, row, i) => {
                    // Check if row is full (no '0' cells) and not already clearing
                    if (row.every(cell => cell[0] !== '0') && !row.some(c => c[1] === 'clearing')) {
                        acc.push(i);
                    }
                    return acc;
                }, [] as number[]);

                if (rowsToClearIndices.length > 0) {
                    // Mark rows as clearing instead of removing immediately
                    return newBoard.map((row, i) => 
                        rowsToClearIndices.includes(i) 
                        ? row.map(c => [c[0], 'clearing'] as Cell)
                        : row
                    );
                }
            }

            return newBoard;
        };

        setBoard(prev => updateBoard(prev));
    }, [player, resetPlayer, ghostPlayer]);

    return { board, setBoard, rowsCleared };
};
