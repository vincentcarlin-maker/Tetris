import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { BoardState, Player, WinState, GameMode, Difficulty, GamePhase, ChatMessage } from '../types';
import { createBoard, checkWinFull } from '../logic';
import { getBestMove } from '../ai';
import { ROWS } from '../constants';

export const useConnect4Logic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { username, currentAvatarId } = useCurrency();
    const { playMove, playLand, playVictory, playGameOver, resumeAudio } = audio;

    // --- STATE ---
    const [board, setBoard] = useState<BoardState>(createBoard());
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('PVE');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [lastDrop, setLastDrop] = useState<{ r: number, c: number } | null>(null);

    // Online specific
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
    const [opponentLeft, setOpponentLeft] = useState(false);

    // Refs
    const boardRef = useRef<BoardState>(createBoard());
    const isAnimatingRef = useRef(false);
    const animationTimerRef = useRef<any>(null);
    const handleDataRef = useRef<(data: any) => void>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        boardRef.current = board;
    }, [board]);

    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    // --- CONNECTION MANAGEMENT ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setPhase('LOBBY');
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (mp.mode !== 'disconnected') mp.disconnect();
        }
    }, [gameMode]);

    // --- GAME ACTIONS ---
    const startGame = (mode: GameMode, diff?: Difficulty) => {
        setGameMode(mode);
        if (diff) setDifficulty(diff);
        
        if (mode !== 'ONLINE') {
            resetGame();
            setPhase('GAME');
            resumeAudio();
        }
    };

    const resetGame = useCallback(() => {
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        isAnimatingRef.current = false;
        
        const newBoard = createBoard();
        setBoard(newBoard);
        boardRef.current = newBoard;
        
        setCurrentPlayer(1);
        setWinState({ winner: null, line: [] });
        setIsAiThinking(false);
        setEarnedCoins(0);
        setOpponentLeft(false);
        setLastDrop(null);
        
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    // --- CORE GAMEPLAY ---
    const handleColumnClick = useCallback((colIndex: number, isRemoteMove = false) => {
        // Bloquer si le jeu est fini ou si une animation est déjà en cours
        if (winState.winner || isAnimatingRef.current || opponentLeft) return;
        
        // Online Turn Check
        if (gameMode === 'ONLINE' && !isRemoteMove) {
            if (!mp.gameOpponent) return;
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
        }

        // Find drop row
        let rowIndex = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (boardRef.current[r][colIndex] === 0) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return; // Column full

        // Send Move Online
        if (gameMode === 'ONLINE' && !isRemoteMove) {
            mp.sendGameMove({ col: colIndex });
        }

        const newBoard = boardRef.current.map(row => [...row]);
        newBoard[rowIndex][colIndex] = currentPlayer;

        isAnimatingRef.current = true;
        setLastDrop({ r: rowIndex, c: colIndex });
        setBoard(newBoard);
        playMove();

        animationTimerRef.current = setTimeout(() => {
            playLand();
            const result = checkWinFull(newBoard);
            
            if (result.winner) {
                setWinState(result);
                handleGameOver(result.winner);
            } else {
                setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            }
            isAnimatingRef.current = false;
        }, 550); // Légèrement supérieur à la durée de l'animation CSS (500ms)

    }, [currentPlayer, winState.winner, gameMode, mp, opponentLeft, playMove, playLand]);

    const handleGameOver = (winner: Player | 'DRAW') => {
        const isMeP1 = mp.amIP1;
        const didIWin = gameMode === 'ONLINE' ? ((isMeP1 && winner === 1) || (!isMeP1 && winner === 2)) : (winner === 1);

        if (didIWin) {
            playVictory();
            let reward = 10;
            if (gameMode === 'PVE') {
                if (difficulty === 'EASY') reward = 5;
                if (difficulty === 'MEDIUM') reward = 15;
                if (difficulty === 'HARD') reward = 30;
            } else if (gameMode === 'ONLINE') {
                reward = 50;
            }
            addCoins(reward);
            setEarnedCoins(reward);
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            if (gameMode === 'PVP') playVictory();
            else playGameOver();
        }
    };

    // --- AI ---
    useEffect(() => {
        if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAiThinking) {
            // On attend que l'animation du joueur soit finie avant de lancer la réflexion
            const checkAndPlay = () => {
                if (isAnimatingRef.current) {
                    setTimeout(checkAndPlay, 100);
                    return;
                }
                
                setIsAiThinking(true);
                setTimeout(() => {
                    const bestCol = getBestMove(boardRef.current, difficulty);
                    if (bestCol !== -1) {
                        handleColumnClick(bestCol, true);
                    }
                    setIsAiThinking(false);
                }, 800); // Temps de "réflexion" simulé
            };

            const timer = setTimeout(checkAndPlay, 200);
            return () => clearTimeout(timer);
        }
    }, [gameMode, currentPlayer, winState.winner, difficulty, handleColumnClick]);

    // --- MULTIPLAYER HANDLERS ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'GAME_MOVE') handleColumnClick(data.col, true);
            if (data.type === 'REMATCH_START') resetGame();
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setWinState({ winner: null, line: [] }); }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe();
    }, [mp]);

    useEffect(() => {
        if (gameMode !== 'ONLINE') return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby'); 
            if (phase !== 'MENU' && phase !== 'DIFFICULTY') {
                if (phase !== 'LOBBY') setPhase('LOBBY');
            }
            if (board.some(r => r.some(c => c !== 0))) resetGame();
        } else if (mp.mode === 'in_game') {
            setPhase('GAME');
            setOnlineStep('game');
            setOpponentLeft(false);
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, gameMode, phase, resetGame]);

    const sendChat = (text: string) => {
        const msg: ChatMessage = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() };
        setChatHistory(prev => [...prev, msg]);
        mp.sendData({ type: 'CHAT', text, senderName: username });
    };

    const sendReaction = (id: string) => {
        setActiveReaction({ id, isMe: true });
        mp.sendData({ type: 'REACTION', id });
        setTimeout(() => setActiveReaction(null), 3000);
    };

    return {
        board, phase, setPhase, gameMode, setGameMode, difficulty,
        currentPlayer, winState, isAiThinking, earnedCoins, lastDrop,
        chatHistory, activeReaction, opponentLeft,
        onlineStep, setOnlineStep,
        isAnimating: isAnimatingRef.current,
        startGame, resetGame, handleColumnClick,
        sendChat, sendReaction
    };
};