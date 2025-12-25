
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { COLORS, CODE_LENGTH, MAX_ATTEMPTS } from '../constants';
import { calculateFeedback, generateSecretCode } from '../logic';
import { GameMode, GamePhase, ChatMessage, Feedback } from '../types';

export const useMastermindLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();
    const bestScore = highScores.mastermind || 0;

    // --- STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    
    // Gameplay
    const [secretCode, setSecretCode] = useState<number[]>([]);
    const [guesses, setGuesses] = useState<number[][]>(Array(MAX_ATTEMPTS).fill(null));
    const [feedback, setFeedback] = useState<Feedback[]>(Array(MAX_ATTEMPTS).fill(null));
    const [currentGuess, setCurrentGuess] = useState<number[]>([]);
    const [activeRow, setActiveRow] = useState(0);
    const [makerBuffer, setMakerBuffer] = useState<number[]>([]); // For Codemaker

    // Online & Roles
    const [isCodemaker, setIsCodemaker] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);
    
    // Feedback UI
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const handleDataRef = useRef<(data: any) => void>(null);

    // --- INIT ---
    useEffect(() => { 
        if (mp?.updateSelfInfo) {
            mp.updateSelfInfo(username, currentAvatarId, undefined, 'Mastermind'); 
        }
    }, [username, currentAvatarId, mp]);

    const resetGame = () => {
        setSecretCode([]);
        setGuesses(Array(MAX_ATTEMPTS).fill(null));
        setFeedback(Array(MAX_ATTEMPTS).fill(null));
        setCurrentGuess([]);
        setActiveRow(0);
        setMakerBuffer([]);
        setEarnedCoins(0);
        setResultMessage(null);
        setOpponentLeft(false);
        setIsCodemaker(false);
        setPhase('MENU');
    };

    const startGame = (mode: GameMode) => {
        resetGame();
        setGameMode(mode);
        resumeAudio();

        if (mode === 'SOLO') {
            const code = generateSecretCode();
            setSecretCode(code);
            setPhase('PLAYING');
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            setPhase('LOBBY'); 
            setOnlineStep('connecting');
            if (mp?.connect) mp.connect();
        }
    };

    // --- GAMEPLAY ACTIONS (CODEBREAKER) ---
    const handleColorClick = (colorIndex: number) => {
        if (phase !== 'PLAYING' || currentGuess.length >= CODE_LENGTH || isCodemaker) return;
        playMove();
        setCurrentGuess(prev => [...prev, colorIndex]);
    };

    const handleDelete = () => {
        if (phase !== 'PLAYING' || currentGuess.length === 0 || isCodemaker) return;
        playPaddleHit();
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    const handleSubmitGuess = () => {
        if (phase !== 'PLAYING' || currentGuess.length !== CODE_LENGTH || isCodemaker) return;

        const fb = calculateFeedback(currentGuess, secretCode);
        
        // Update Board
        const newGuesses = [...guesses];
        newGuesses[activeRow] = currentGuess;
        setGuesses(newGuesses);

        const newFeedback = [...feedback];
        newFeedback[activeRow] = fb;
        setFeedback(newFeedback);

        // Sync Online
        if (gameMode === 'ONLINE' && mp?.sendData) {
            mp.sendData({ type: 'MASTERMIND_GUESS_SYNC', rowIdx: activeRow, guess: currentGuess, fb });
        }

        // Check Win/Loss
        const nextRow = activeRow + 1;
        if (fb.exact === CODE_LENGTH) {
            handleWin(nextRow);
        } else if (nextRow >= MAX_ATTEMPTS) {
            handleLoss();
        } else {
            playLand();
            setActiveRow(nextRow);
            setCurrentGuess([]);
        }
    };

    // --- GAMEPLAY ACTIONS (CODEMAKER) ---
    const handleMakerColorSelect = (colorIndex: number) => {
        if (makerBuffer.length < CODE_LENGTH) {
            playMove();
            setMakerBuffer(prev => [...prev, colorIndex]);
        }
    };

    const handleMakerDelete = () => {
        if (makerBuffer.length > 0) {
            playPaddleHit();
            setMakerBuffer(prev => prev.slice(0, -1));
        }
    };

    const handleMakerSubmit = () => {
        if (makerBuffer.length === CODE_LENGTH) {
            setSecretCode(makerBuffer);
            setPhase('PLAYING');
            playVictory();
            if (mp?.sendData) mp.sendData({ type: 'MASTERMIND_SET_CODE', code: makerBuffer });
        }
    };

    // --- OUTCOME ---
    const handleWin = (attempts: number) => {
        if (gameMode === 'SOLO') {
            setPhase('GAMEOVER');
            playVictory();
            const scoreBase = (MAX_ATTEMPTS - attempts + 1) * 10;
            const coins = Math.floor(scoreBase / 2) + 10;
            if (bestScore === 0 || attempts < bestScore) updateHighScore('mastermind', attempts);
            addCoins(coins);
            setEarnedCoins(coins);
            setResultMessage("CODE DÉCRYPTÉ !");
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            if (isCodemaker) {
                setPhase('GAMEOVER');
                setResultMessage("IL A TROUVÉ VOTRE CODE !");
                playGameOver();
            } else {
                setPhase('GAMEOVER');
                setResultMessage("CODE DÉCRYPTÉ ! VICTOIRE !");
                playVictory();
                addCoins(50);
                setEarnedCoins(50);
                if (mp?.sendData) mp.sendData({ type: 'MASTERMIND_GAME_OVER', result: 'BREAKER_WON' });
                if (onReportProgress) onReportProgress('win', 1);
            }
        }
    };

    const handleLoss = () => {
        if (gameMode === 'SOLO') {
            setPhase('GAMEOVER');
            playGameOver();
            setResultMessage("ÉCHEC... CODE NON TROUVÉ.");
        } else {
             if (isCodemaker) {
                setPhase('GAMEOVER');
                setResultMessage("VOTRE CODE EST RESTÉ SECRET !");
                playVictory();
                addCoins(50);
                setEarnedCoins(50);
                if (onReportProgress) onReportProgress('win', 1);
            } else {
                setPhase('GAMEOVER');
                setResultMessage("ÉCHEC... PLUS D'ESSAIS.");
                playGameOver();
                if (mp?.sendData) mp.sendData({ type: 'MASTERMIND_GAME_OVER', result: 'BREAKER_LOST' });
            }
        }
    };

    // --- MULTIPLAYER ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'MASTERMIND_SET_CODE') {
                setSecretCode(data.code);
                setPhase('PLAYING');
                playLand();
            }
            if (data.type === 'MASTERMIND_GUESS_SYNC') {
                const { rowIdx, guess, fb } = data;
                const newGuesses = [...guesses]; newGuesses[rowIdx] = guess; setGuesses(newGuesses);
                const newFeedback = [...feedback]; newFeedback[rowIdx] = fb; setFeedback(newFeedback);
                setActiveRow(rowIdx + 1);
                playLand();
            }
            if (data.type === 'MASTERMIND_GAME_OVER') {
                if (data.result === 'BREAKER_WON') handleWin(0);
                if (data.result === 'BREAKER_LOST') handleLoss();
            }
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setPhase('GAMEOVER'); setResultMessage("ADVERSAIRE PARTI."); }
            if (data.type === 'REMATCH_START') {
                 resetGame();
                 if (mp?.isHost) {
                     setIsCodemaker(true);
                     setPhase('CREATION');
                 } else {
                     setIsCodemaker(false);
                     setPhase('WAITING');
                 }
            }
        };
    });

    useEffect(() => {
        if (!mp?.subscribe) return;
        const unsubscribe = mp.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe();
    }, [mp]);

    useEffect(() => {
        if (!mp || !mp.mode) return; // FIX: Protection évaluation mp.mode
        if (gameMode !== 'ONLINE' && mp.mode !== 'in_game') return;

        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) {
                 setOnlineStep('game');
                 setIsCodemaker(true);
                 setPhase('CREATION');
            } else {
                 setOnlineStep('lobby');
                 if (phase === 'MENU') setPhase('LOBBY');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase === 'MENU' || phase === 'LOBBY') {
                setGameMode('ONLINE');
                if (mp.isHost) {
                     setIsCodemaker(true);
                     setPhase('CREATION');
                } else {
                     setIsCodemaker(false);
                     setPhase('WAITING');
                }
            }
        }
    }, [mp?.mode, mp?.isHost, mp?.players, mp?.peerId, phase, gameMode]);

    const sendChat = (text: string) => {
        const msg: ChatMessage = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() };
        setChatHistory(prev => [...prev, msg]);
        if (mp?.sendData) mp.sendData({ type: 'CHAT', text, senderName: username });
    };

    const sendReaction = (id: string) => {
        setActiveReaction({ id, isMe: true });
        if (mp?.sendData) mp.sendData({ type: 'REACTION', id });
        setTimeout(() => setActiveReaction(null), 3000);
    };

    return {
        phase, setPhase,
        gameMode, setGameMode,
        onlineStep, setOnlineStep,
        guesses, feedback, activeRow, currentGuess,
        secretCode, isCodemaker, makerBuffer,
        resultMessage, earnedCoins, bestScore,
        chatHistory, activeReaction, opponentLeft,
        mp,
        startGame, resetGame,
        handleColorClick, handleDelete, handleSubmitGuess,
        handleMakerColorSelect, handleMakerDelete, handleMakerSubmit,
        sendChat, sendReaction
    };
};
