
import { useState, useEffect, useCallback, useRef } from 'react';
import { BoardState, Move, PlayerColor, Position, Difficulty } from '../types';
import { createInitialBoard, getValidMoves, executeMove, getBestMove, BOARD_SIZE } from '../logic';

export const useCheckersLogic = (audio: any, addCoins: any, mp: any, onReportProgress?: any) => {
    const [board, setBoard] = useState<BoardState>(createInitialBoard());
    const [turn, setTurn] = useState<PlayerColor>('white');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [availableMoves, setAvailableMoves] = useState<Move[]>([]);
    const [winner, setWinner] = useState<PlayerColor | 'DRAW' | null>(null);
    const [gameMode, setGameMode] = useState<'SOLO' | 'LOCAL' | 'ONLINE'>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [mustJumpPos, setMustJumpPos] = useState<Position | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [counts, setCounts] = useState({ white: 20, red: 20 });

    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    const handleTurnEnd = useCallback((newBoard: BoardState, prevPlayer: PlayerColor, lastPiecePos?: Position) => {
        if (lastPiecePos) {
            const piece = newBoard[lastPiecePos.r][lastPiecePos.c];
            if (piece && !piece.isKing) {
                const isPromo = (piece.player === 'white' && lastPiecePos.r === 0) || 
                              (piece.player === 'red' && lastPiecePos.r === BOARD_SIZE - 1);
                if (isPromo) { piece.isKing = true; audio.playVictory(); }
            }
        }
        
        const nextPlayer = prevPlayer === 'white' ? 'red' : 'white';
        let w = 0, r = 0;
        newBoard.forEach(row => row.forEach(p => { if (p?.player === 'white') w++; if (p?.player === 'red') r++; }));
        setCounts({ white: w, red: r });

        const nextMoves = getValidMoves(newBoard, nextPlayer);
        if (r === 0) finalizeGame('white');
        else if (w === 0) finalizeGame('red');
        else if (nextMoves.length === 0) finalizeGame(nextPlayer === 'white' ? 'red' : 'white');
        else { setTurn(nextPlayer); setMustJumpPos(null); }
    }, [audio]);

    const finalizeGame = (w: PlayerColor) => {
        setWinner(w);
        const isVictory = gameMode === 'SOLO' ? w === 'white' : (gameMode === 'ONLINE' ? (mp.amIP1 ? w === 'white' : w === 'red') : false);
        if (isVictory) {
            audio.playVictory();
            const bonus = difficulty === 'HARD' ? 100 : difficulty === 'MEDIUM' ? 50 : 25;
            addCoins(bonus);
            setEarnedCoins(bonus);
            if (onReportProgress) onReportProgress('win', 1);
        } else audio.playGameOver();
    };

    const performMove = useCallback((move: Move) => {
        audio.playMove();
        if (move.isJump) audio.playLand();
        const { newBoard } = executeMove(board, move);
        setBoard(newBoard);
        setSelectedPos(null);
        setAvailableMoves([]);

        if (move.isJump) {
            const followUp = getValidMoves(newBoard, turn, move.to).filter(m => m.isJump);
            if (followUp.length > 0) {
                setMustJumpPos(move.to); 
                setAvailableMoves(followUp); 
                setSelectedPos(move.to);
                return;
            }
        }
        handleTurnEnd(newBoard, turn, move.to);
    }, [board, turn, audio, handleTurnEnd]);

    // AI Logic
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'red' && !winner) {
            const timer = setTimeout(() => {
                const move = getBestMove(board, 'red', difficulty);
                if (move) performMove(move);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [turn, gameMode, winner, board, difficulty, performMove]);

    // Online Sync
    useEffect(() => {
        const unsub = mp?.subscribe((data: any) => {
            if (data.type === 'CHECKERS_MOVE') performMove(data.move);
            if (data.type === 'REMATCH_START') resetGame();
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setWinner(mp.amIP1 ? 'white' : 'red'); }
        });
        return () => unsub && unsub();
    }, [mp, performMove]);

    // Online Lifecycle
    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        if (!mp) return;

        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            if (board.some(r => r.some(c => c !== null))) {
                // Si on revient au lobby alors qu'une partie était en cours (reset visuel)
                setBoard(createInitialBoard());
                setTurn('white');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
        } else if (mp.mode === 'connecting') {
            setOnlineStep('connecting');
        }
    }, [mp?.mode, mp?.isHost, mp?.players, mp?.peerId, gameMode]);

    const resetGame = () => {
        setBoard(createInitialBoard());
        setTurn('white');
        setSelectedPos(null);
        setAvailableMoves([]);
        setWinner(null);
        setMustJumpPos(null);
        setCounts({ white: 20, red: 20 });
        setOpponentLeft(false);
    };

    return {
        board, turn, selectedPos, availableMoves, winner, gameMode, setGameMode, 
        difficulty, setDifficulty, mustJumpPos, earnedCoins, counts,
        onlineStep, setOnlineStep, opponentLeft,
        performMove, setSelectedPos, setAvailableMoves, resetGame
    };
};
