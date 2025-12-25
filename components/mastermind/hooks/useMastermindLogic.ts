
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

    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    const [secretCode, setSecretCode] = useState<number[]>([]);
    const [guesses, setGuesses] = useState<number[][]>(Array(MAX_ATTEMPTS).fill(null));
    const [feedback, setFeedback] = useState<Feedback[]>(Array(MAX_ATTEMPTS).fill(null));
    const [currentGuess, setCurrentGuess] = useState<number[]>([]);
    const [activeRow, setActiveRow] = useState(0);
    const [makerBuffer, setMakerBuffer] = useState<number[]>([]);
    const [isCodemaker, setIsCodemaker] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const handleDataRef = useRef<(data: any) => void>(null);

    // --- MULTIPLAYER LIFECYCLE ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp?.connect();
        } else {
            mp?.disconnect();
            setOnlineStep('connecting');
            setOpponentLeft(false);
        }
    }, [gameMode]);

    useEffect(() => {
        if (!mp) return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);

            // INITIALISATION DES RÔLES
            if (mp.isHost) {
                if (phase === 'MENU' || phase === 'LOBBY') {
                    setIsCodemaker(true);
                    setPhase('CREATION');
                }
            } else {
                setIsCodemaker(false);
                if (phase === 'MENU' || phase === 'LOBBY') {
                    setPhase('WAITING');
                }
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, gameMode]);

    useEffect(() => { mp?.updateSelfInfo(username, currentAvatarId, undefined, 'Mastermind'); }, [username, currentAvatarId, mp]);

    const resetGame = useCallback(() => {
        setGuesses(Array(MAX_ATTEMPTS).fill(null));
        setFeedback(Array(MAX_ATTEMPTS).fill(null));
        setCurrentGuess([]);
        setActiveRow(0);
        setMakerBuffer([]);
        setEarnedCoins(0);
        setResultMessage(null);
        setOpponentLeft(false);
        // On ne reset pas isCodemaker ici pour garder le rôle en ligne
    }, []);

    const startGame = (mode: GameMode) => {
        resetGame();
        setGameMode(mode);
        resumeAudio();
        if (mode === 'SOLO') {
            setIsCodemaker(false);
            setSecretCode(generateSecretCode());
            setPhase('PLAYING');
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            setPhase('LOBBY');
        }
    };

    const handleWin = useCallback((attempts: number) => {
        setPhase('GAMEOVER');
        if (gameMode === 'SOLO') {
            playVictory();
            const coins = Math.floor((MAX_ATTEMPTS - attempts + 1) * 5) + 10;
            if (bestScore === 0 || attempts < bestScore) updateHighScore('mastermind', attempts);
            addCoins(coins); setEarnedCoins(coins); setResultMessage("CODE DÉCRYPTÉ !");
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            if (isCodemaker) { 
                setResultMessage("IL A TROUVÉ VOTRE CODE !"); 
                playGameOver(); 
            } else { 
                setResultMessage("CODE DÉCRYPTÉ ! VICTOIRE !"); 
                playVictory(); 
                addCoins(50); 
                setEarnedCoins(50); 
                if (onReportProgress) onReportProgress('win', 1); 
            }
        }
    }, [gameMode, isCodemaker, bestScore, updateHighScore, addCoins, onReportProgress, playVictory, playGameOver]);

    const handleLoss = useCallback(() => {
        setPhase('GAMEOVER');
        if (gameMode === 'SOLO') { playGameOver(); setResultMessage("ÉCHEC... CODE NON TROUVÉ."); }
        else {
            if (isCodemaker) { 
                setResultMessage("VOTRE CODE EST RESTÉ SECRET !"); 
                playVictory(); 
                addCoins(50); 
                setEarnedCoins(50); 
                if (onReportProgress) onReportProgress('win', 1); 
            } else { 
                setResultMessage("ÉCHEC... PLUS D'ESSAIS."); 
                playGameOver(); 
            }
        }
    }, [gameMode, isCodemaker, playVictory, playGameOver, addCoins, onReportProgress]);

    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'MASTERMIND_SET_CODE') { 
                setSecretCode(data.code); 
                setPhase('PLAYING'); 
                playLand(); 
            }
            if (data.type === 'MASTERMIND_GUESS_SYNC') {
                const newGuesses = [...guesses]; newGuesses[data.rowIdx] = data.guess; setGuesses(newGuesses);
                const newFeedback = [...feedback]; newFeedback[data.rowIdx] = data.fb; setFeedback(newFeedback);
                setActiveRow(data.rowIdx + 1); 
                playLand();
                
                if (data.fb.exact === CODE_LENGTH) handleWin(data.rowIdx + 1);
                else if (data.rowIdx >= MAX_ATTEMPTS - 1) handleLoss();
            }
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setPhase('GAMEOVER'); setResultMessage("ADVERSAIRE PARTI."); }
            if (data.type === 'REMATCH_START') { 
                resetGame(); 
                setGameMode('ONLINE'); 
                setPhase(mp?.isHost ? 'CREATION' : 'WAITING'); 
                setIsCodemaker(!!mp?.isHost); 
            }
        };
    });

    useEffect(() => {
        const unsubscribe = mp?.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe && unsubscribe();
    }, [mp]);

    return {
        phase, setPhase, gameMode, setGameMode, onlineStep, setOnlineStep, guesses, feedback, activeRow, currentGuess, secretCode, isCodemaker, makerBuffer, resultMessage, earnedCoins, bestScore, chatHistory, activeReaction, opponentLeft, mp,
        startGame, resetGame,
        handleColorClick: (i: number) => { if (phase === 'PLAYING' && !isCodemaker) { playMove(); setCurrentGuess(p => [...p, i]); } },
        handleDelete: () => { if (phase === 'PLAYING' && !isCodemaker) { playPaddleHit(); setCurrentGuess(p => p.slice(0, -1)); } },
        handleSubmitGuess: () => {
            if (phase === 'PLAYING' && currentGuess.length === CODE_LENGTH) {
                const fb = calculateFeedback(currentGuess, secretCode);
                const newG = [...guesses]; newG[activeRow] = currentGuess; setGuesses(newG);
                const newF = [...feedback]; newF[activeRow] = fb; setFeedback(newF);
                
                if (gameMode === 'ONLINE') mp?.sendData({ type: 'MASTERMIND_GUESS_SYNC', rowIdx: activeRow, guess: currentGuess, fb });
                
                if (fb.exact === CODE_LENGTH) handleWin(activeRow + 1);
                else if (activeRow >= MAX_ATTEMPTS - 1) handleLoss();
                else { playLand(); setActiveRow(r => r + 1); setCurrentGuess([]); }
            }
        },
        handleMakerColorSelect: (i: number) => { if (makerBuffer.length < CODE_LENGTH) { playMove(); setMakerBuffer(p => [...p, i]); } },
        handleMakerDelete: () => { if (makerBuffer.length > 0) { playPaddleHit(); setMakerBuffer(p => p.slice(0, -1)); } },
        handleMakerSubmit: () => { 
            if (makerBuffer.length === CODE_LENGTH) { 
                setSecretCode(makerBuffer); 
                setPhase('PLAYING'); 
                playVictory(); 
                if (mp?.sendData) mp.sendData({ type: 'MASTERMIND_SET_CODE', code: makerBuffer }); 
            } 
        },
        sendChat: (t: string) => { const msg = { id: Date.now(), text: t, senderName: username, isMe: true, timestamp: Date.now() }; setChatHistory(p => [...p, msg]); mp?.sendData({ type: 'CHAT', text: t, senderName: username }); },
        sendReaction: (id: string) => { setActiveReaction({ id, isMe: true }); mp?.sendData({ type: 'REACTION', id }); setTimeout(() => setActiveReaction(null), 3000); }
    };
};
