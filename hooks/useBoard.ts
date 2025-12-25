
import { useState, useEffect, useCallback } from 'react';
import { createBoard, BOARD_WIDTH } from '../gameHelpers';
import { Board, Player, TetrominoKey, Cell } from '../types';

export const useBoard = (player: Player, resetPlayer: () => void, ghostPlayer: Player | null, playBlockDestroy: (type: string) => void) => {
    const [board, setBoard] = useState(createBoard());
    const [rowsCleared, setRowsCleared] = useState(0);

    // Fonction pour nettoyer et décaler les lignes
    const sweepRows = useCallback((currentBoard: Board) => {
        const rowsToClearIndices = currentBoard.reduce((acc, row, idx) => {
            if (row.every(cell => cell[0] !== '0')) {
                acc.push(idx);
            }
            return acc;
        }, [] as number[]);

        if (rowsToClearIndices.length === 0) return currentBoard;

        // 1. Jouer les sons pour les blocs détruits
        const uniqueBlocks = new Set<string>();
        rowsToClearIndices.forEach(rowIndex => {
            currentBoard[rowIndex].forEach(cell => {
                if (cell[0] !== '0') uniqueBlocks.add(String(cell[0]));
            });
        });
        uniqueBlocks.forEach((type) => setTimeout(() => playBlockDestroy(type), Math.random() * 50));

        // 2. Marquer comme 'clearing' pour l'animation
        const animatedBoard = currentBoard.map((row, i) =>
            rowsToClearIndices.includes(i)
                ? row.map(c => [c[0], 'clearing'] as Cell)
                : row
        );
        setBoard(animatedBoard);

        // 3. Après l'animation, supprimer et décaler
        setTimeout(() => {
            setBoard(prev => {
                const filteredBoard = prev.filter((_, idx) => !rowsToClearIndices.includes(idx));
                const newRows = Array.from({ length: rowsToClearIndices.length }, () =>
                    Array.from({ length: BOARD_WIDTH }, () => ['0', 'clear'] as Cell)
                );
                return [...newRows, ...filteredBoard];
            });
            setRowsCleared(rowsToClearIndices.length);
        }, 200);

        return animatedBoard;
    }, [playBlockDestroy]);

    useEffect(() => {
        // On ne réinitialise rowsCleared que si on n'est pas en train d'en supprimer
        if (rowsCleared > 0) {
            const timer = setTimeout(() => setRowsCleared(0), 100);
            return () => clearTimeout(timer);
        }
    }, [rowsCleared]);

    useEffect(() => {
        const updateBoard = (prevBoard: Board): Board => {
            // 1. Flush : On garde merged/clearing, on vire clear/ghost
            const newBoard = prevBoard.map(
                row => row.map(cell => (cell[1] === 'clear' || cell[1] === 'ghost' ? ['0', 'clear'] : cell)) as typeof row
            );

            // 2. Draw Ghost
            if (ghostPlayer) {
                ghostPlayer.tetromino.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            const boardY = y + ghostPlayer.pos.y;
                            const boardX = x + ghostPlayer.pos.x;
                            if (newBoard[boardY] && newBoard[boardY][boardX] && newBoard[boardY][boardX][1] === 'clear') {
                                newBoard[boardY][boardX] = [value as TetrominoKey, 'ghost'];
                            }
                        }
                    });
                });
            }

            // 3. Draw Player
            player.tetromino.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const boardY = y + player.pos.y;
                        const boardX = x + player.pos.x;
                        if (newBoard[boardY] && newBoard[boardY][boardX]) {
                            newBoard[boardY][boardX] = [
                                value as TetrominoKey,
                                player.collided ? 'merged' : 'clear',
                            ];
                        }
                    }
                });
            });

            // 4. Collision
            if (player.collided) {
                resetPlayer();
                return sweepRows(newBoard);
            }

            return newBoard;
        };

        setBoard(prev => updateBoard(prev));
    }, [player, resetPlayer, ghostPlayer, sweepRows]);

    return { board, setBoard, rowsCleared };
};
