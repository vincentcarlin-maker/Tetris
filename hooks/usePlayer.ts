
import { useState, useCallback } from 'react';
import { TETROMINOS, randomTetromino, BOARD_WIDTH } from '../gameHelpers';
import { Player, TetrominoShape, Board } from '../types';
import { checkCollision } from '../gameHelpers';

export const usePlayer = () => {
    const [player, setPlayer] = useState<Player>({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS['0'].shape,
        collided: false,
    });
    
    const [nextTetrominoShape, setNextTetrominoShape] = useState<TetrominoShape>(
        randomTetromino().shape
    );
    const [heldTetrominoShape, setHeldTetrominoShape] = useState<TetrominoShape | null>(null);
    const [canHold, setCanHold] = useState(true);

    const rotate = (matrix: TetrominoShape, dir: number) => {
        const rotatedTetro = matrix.map((_, index) =>
            matrix.map(col => col[index]),
        );
        if (dir > 0) return rotatedTetro.map(row => row.reverse());
        return rotatedTetro.reverse();
    };

    const playerRotate = (board: Board, dir: number) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, board, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const updatePlayerPos = useCallback(({ x, y, collided }: { x: number; y: number; collided: boolean }): void => {
        setPlayer(prev => ({
            ...prev,
            pos: { x: prev.pos.x + x, y: prev.pos.y + y },
            collided,
        }));
    }, []);

    const resetPlayer = useCallback(() => {
        setPlayer({
            pos: { x: BOARD_WIDTH / 2 - 1, y: 0 },
            tetromino: nextTetrominoShape,
            collided: false,
        });
        setNextTetrominoShape(randomTetromino().shape);
        setCanHold(true);
    }, [nextTetrominoShape]);

    const playerHold = useCallback(() => {
        if (!canHold) return;

        const newHeldTetromino = player.tetromino;
        const pieceToSet = heldTetrominoShape || nextTetrominoShape;

        setPlayer(prev => ({
            ...prev,
            pos: { x: BOARD_WIDTH / 2 - 1, y: 0 },
            tetromino: pieceToSet,
            collided: false,
        }));
        setHeldTetrominoShape(newHeldTetromino);
        
        if (!heldTetrominoShape) {
             setNextTetrominoShape(randomTetromino().shape);
        }
        
        setCanHold(false);
    }, [canHold, player.tetromino, heldTetrominoShape, nextTetrominoShape]);


    return { player, updatePlayerPos, resetPlayer, playerRotate, playerHold, nextTetromino: { shape: nextTetrominoShape }, heldTetromino: { shape: heldTetrominoShape } };
};