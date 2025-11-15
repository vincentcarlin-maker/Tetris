
import { useState, useEffect, useCallback } from 'react';
import { createBoard } from '../gameHelpers';
import { Board, Player, TetrominoKey } from '../types';

export const useBoard = (player: Player, resetPlayer: () => void, ghostPlayer: Player | null) => {
    const [board, setBoard] = useState(createBoard());
    const [rowsCleared, setRowsCleared] = useState(0);

    useEffect(() => {
        setRowsCleared(0);

        const sweepRows = (newBoard: Board): Board =>
            newBoard.reduce((ack, row) => {
                if (row.findIndex(cell => cell[0] === '0') === -1) {
                    setRowsCleared(prev => prev + 1);
                    ack.unshift(new Array(newBoard[0].length).fill(['0', 'clear']));
                    return ack;
                }
                ack.push(row);
                return ack;
            }, [] as Board);

        const updateBoard = (prevBoard: Board): Board => {
            const newBoard = prevBoard.map(
                row => row.map(cell => (cell[1] === 'clear' || cell[1] === 'ghost' ? ['0', 'clear'] : cell)) as typeof row
            );

            // Draw the ghost piece
            if (ghostPlayer) {
                ghostPlayer.tetromino.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            if (
                                y + ghostPlayer.pos.y >= 0 &&
                                newBoard[y + ghostPlayer.pos.y] &&
                                newBoard[y + ghostPlayer.pos.y][x + ghostPlayer.pos.x] &&
                                newBoard[y + ghostPlayer.pos.y][x + ghostPlayer.pos.x][1] !== 'merged'
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


            // Draw the player piece
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

            if (player.collided) {
                resetPlayer(); 
                return sweepRows(newBoard);
            }
            return newBoard;
        };

        setBoard(prev => updateBoard(prev));
    }, [player, resetPlayer, ghostPlayer]);

    return { board, setBoard, rowsCleared };
};
