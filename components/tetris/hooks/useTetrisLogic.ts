
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlayer } from '../../../hooks/usePlayer';
import { useBoard } from '../../../hooks/useBoard';
import { useHighScores } from '../../../hooks/useHighScores';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { createBoard, checkCollision } from '../../../gameHelpers';
import { LINE_POINTS, SPEED_INCREMENT, LINES_PER_LEVEL } from '../constants';
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

    const stateRef = useRef({ gameOver, isPaused, inMenu, player, board, score, level, rows });
    useEffect(() => {
        stateRef.current = { gameOver, isPaused, inMenu, player, board, score, level, rows };
    }, [gameOver, isPaused, inMenu, player, board, score, level, rows]);

    // Gestion du gain de score et des niveaux
    useEffect(() => {
        if (rowsCleared > 0) {
            playClear();
            const newPoints = LINE_POINTS[rowsCleared - 1] * (level + 1);
            
            setScore(prev => {
                const ns = prev + newPoints;
                if (onReportProgress) onReportProgress('score', ns);
                return ns;
            });

            setRows(prev => {
                const newRows = prev + rowsCleared;
                if (onReportProgress) onReportProgress('action', rowsCleared);
                
                // Calcul du nouveau niveau basé sur les lignes totales
                const newLevel = Math.floor(newRows / LINES_PER_LEVEL);
                if (newLevel > level) {
                    setLevel(newLevel);
                    setDropTime(prevTime => (prevTime ? prevTime * SPEED_INCREMENT : null));
                }
                return newRows;
            });
        }
    }, [rowsCleared, level, playClear, onReportProgress]);

    // Calcul des pièces en temps réel (affichage seulement)
    useEffect(() => {
        setEarnedCoins(Math.floor(score / 250));
    }, [score]);

    // distribution des pièces UNIQUE lors du Game Over
    const hasAwardedCoins = useRef(false);
    useEffect(() => {
        if (gameOver && score > 0 && !hasAwardedCoins.current && !inMenu) {
            hasAwardedCoins.current = true;
            const coinsToAward = Math.floor(score / 250);
            if (coinsToAward > 0) addCoins(coinsToAward);
            updateHighScore('tetris', score);
        }
    }, [gameOver, score, addCoins, updateHighScore, inMenu]);

    const startGame = useCallback((startLevel: number = 0) => {
        setBoard(createBoard());
        resetPlayer();
        setScore(0);
        setRows(0);
        setLevel(startLevel);
        setEarnedCoins(0);
        setGameOver(false);
        setIsPaused(false);
        setInMenu(false);
        hasAwardedCoins.current = false;
        
        const initialSpeed = Math.max(120, 800 * Math.pow(SPEED_INCREMENT, startLevel));
        setDropTime(initialSpeed);
        
        playClear(); 
        if (onReportProgress) onReportProgress('play', 1);
    }, [setBoard, resetPlayer, playClear, onReportProgress]);

    const drop = useCallback(() => {
        const { gameOver: go, isPaused: ip, inMenu: im, player: p, board: b } = stateRef.current;
        if (go || ip || im) return;

        if (!checkCollision(p, b, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            if (p.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
                playGameOver();
            } else {
                playLand();
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    }, [updatePlayerPos, playGameOver, playLand]);
    
    useGameLoop(drop, isPaused || gameOver || inMenu ? null : dropTime);

    const hardDrop = useCallback(() => {
        const { gameOver: go, isPaused: ip, inMenu: im, player: p, board: b } = stateRef.current;
        if (go || ip || im) return;
        
        let newY = p.pos.y;
        while (!checkCollision(p, b, { x: 0, y: newY - p.pos.y + 1 })) {
            newY++;
        }
        updatePlayerPos({ x: 0, y: newY - p.pos.y, collided: true });
        playLand();
    }, [updatePlayerPos, playLand]);

    const movePlayer = useCallback((dir: -1 | 1) => {
        const { gameOver: go, isPaused: ip, inMenu: im, player: p, board: b } = stateRef.current;
        if (go || ip || im) return;
        
        if (!checkCollision(p, b, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0, collided: false });
            playMove();
        }
    }, [updatePlayerPos, playMove]);

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
