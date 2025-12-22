
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlayer } from '../../../hooks/usePlayer';
import { useBoard } from '../../../hooks/useBoard';
import { useHighScores } from '../../../hooks/useHighScores';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { createBoard, checkCollision } from '../../../gameHelpers';
import { LINE_POINTS } from '../constants';
import type { Player } from '../../../types';

export const useTetrisLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const [dropTime, setDropTime] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [inMenu, setInMenu] = useState(true);
    
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    const { player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino, heldTetromino, playerHold } = usePlayer();
    const [ghostPlayer, setGhostPlayer] = useState<Player | null>(null);
    
    const { playMove, playRotate, playLand, playClear, playBlockDestroy, playGameOver } = audio;
    const { board, setBoard, rowsCleared } = useBoard(player, resetPlayer, ghostPlayer, playBlockDestroy);
    
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.tetris || 0;

    // Effect to handle score update when lines are cleared
    useEffect(() => {
        if (rowsCleared > 0) {
            playClear();
            const newPoints = LINE_POINTS[rowsCleared - 1] * (level + 1);
            setScore(prev => {
                const ns = prev + newPoints;
                if (onReportProgress) onReportProgress('score', ns);
                return ns;
            });
            setRows(prev => prev + rowsCleared);
            if (onReportProgress) onReportProgress('action', rowsCleared);
        }
    }, [rowsCleared, level, playClear, onReportProgress]);

    // Update earned coins based on score
    useEffect(() => {
        setEarnedCoins(Math.floor(score / 50));
    }, [score]);

    const startGame = useCallback((startLevel: number = 0) => {
        setInMenu(false);
        setBoard(createBoard());
        const initialSpeed = Math.max(100, 1000 / (startLevel + 1) + 200);
        
        setDropTime(initialSpeed);
        resetPlayer();
        setGameOver(false);
        setIsPaused(false);
        setScore(0);
        setRows(0);
        setLevel(startLevel);
        setEarnedCoins(0);
        playClear(); 
        
        if (onReportProgress) onReportProgress('play', 1);
    }, [setBoard, resetPlayer, playClear, onReportProgress]);

    const drop = useCallback(() => {
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(prev => (prev ? prev * 0.9 : null));
        }

        if (!checkCollision(player, board, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                playGameOver();
                updateHighScore('tetris', score);
                if (earnedCoins > 0) addCoins(earnedCoins);
            } else {
                playLand();
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [board, level, player, updatePlayerPos, rows, playGameOver, playLand, score, addCoins, updateHighScore, earnedCoins]);
    
    useGameLoop(drop, isPaused || gameOver || inMenu ? null : dropTime);

    const hardDrop = useCallback(() => {
        if (gameOver || isPaused || inMenu) return;
        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) {
            newY++;
        }
        updatePlayerPos({ x: 0, y: newY - player.pos.y, collided: true });
        playLand();
    }, [gameOver, isPaused, inMenu, player.pos.y, board, updatePlayerPos, playLand]);

    const movePlayer = useCallback((dir: -1 | 1) => {
        if (gameOver || isPaused || inMenu) return;
        if (!checkCollision(player, board, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
            playMove();
        }
    }, [gameOver, isPaused, inMenu, player, board, updatePlayerPos, playMove]);

    // Ghost piece calculation
    useEffect(() => {
        if (gameOver || isPaused || inMenu || !player.tetromino || player.tetromino.length <= 1) {
            setGhostPlayer(null);
            return;
        }
        let newY = player.pos.y;
        while (!checkCollision(player, board, { x: 0, y: newY - player.pos.y + 1 })) newY++;
        setGhostPlayer({ ...player, pos: { x: player.pos.x, y: newY } });
    }, [player, board, gameOver, isPaused, inMenu]);

    return {
        board, player, ghostPlayer, nextTetromino, heldTetromino,
        score, rows, level, gameOver, isPaused, setIsPaused, inMenu, setInMenu, earnedCoins, highScore,
        startGame, drop, hardDrop, movePlayer, playerRotate, playerHold
    };
};
