
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { MemoryCard, Difficulty, GameMode, GamePhase, ChatMessage } from '../types';
import { generateDeck } from '../logic';
import { DIFFICULTY_CONFIG } from '../constants';

export const useMemoryLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { playMove, playLand, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();
    const highScore = highScores.memory || 0;

    // --- STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [moves, setMoves] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Online
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForDeck, setIsWaitingForDeck] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const handleDataRef = useRef<(data: any) => void>(null);

    // --- INIT ---
    useEffect(() => {
        const diffName = DIFFICULTY_CONFIG[difficulty].name;
        if (mp.isHost) {
             mp.updateSelfInfo(username, currentAvatarId, undefined, diffName);
        } else {
             mp.updateSelfInfo(username, currentAvatarId);
        }
    }, [username, currentAvatarId, difficulty, mp.isHost, mp.updateSelfInfo]);

    // --- GAME ACTIONS ---
    const startSoloGame = (diff: Difficulty) => {
        setDifficulty(diff);
        const deck = generateDeck(diff);
        setCards(deck);
        setFlippedIndices([]);
        setScores({ p1: 0, p2: 0 });
        setMoves(0);
        setCurrentPlayer(1);
        setIsGameOver(false);
        setIsProcessing(false);
        setEarnedCoins(0);
        setPhase('GAME');
        resumeAudio();
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const startOnlineGame = () => {
        setCards([]);
        setFlippedIndices([]);
        setScores({ p1: 0, p2: 0 });
        setMoves(0);
        setIsGameOver(false);
        setEarnedCoins(0);
        setIsWaitingForDeck(false);
        setChatHistory([]);
        setOpponentLeft(false);
        setPhase('GAME');
        setGameMode('ONLINE');
    };

    const handleCardClick = (index: number, isRemote = false) => {
        if (isProcessing) return;
        if (cards[index].isMatched || cards[index].isFlipped) return;
        
        if (gameMode === 'ONLINE' && !isRemote) {
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
            mp.sendData({ type: 'MEMORY_FLIP', index });
        }

        resumeAudio();
        playMove();

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setIsProcessing(true);
            setMoves(m => m + 1);

            const idx1 = newFlipped[0];
            const idx2 = newFlipped[1];
            const card1 = newCards[idx1];
            const card2 = newCards[idx2];

            if (card1.iconId === card2.iconId) {
                // MATCH
                setTimeout(() => {
                    playVictory();
                    const matchedCards = [...newCards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);
                    
                    if (onReportProgress) onReportProgress('action', 1);

                    if (gameMode === 'ONLINE') {
                        setScores(prev => ({
                            ...prev,
                            p1: currentPlayer === 1 ? prev.p1 + 1 : prev.p1,
                            p2: currentPlayer === 2 ? prev.p2 + 1 : prev.p2
                        }));
                    }
                    setIsProcessing(false);
                    if (matchedCards.every(c => c.isMatched)) handleGameOver(matchedCards);
                }, 500);
            } else {
                // MISS
                setTimeout(() => {
                    playLand();
                    const resetCards = [...newCards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                    if (gameMode === 'ONLINE') setCurrentPlayer(prev => prev === 1 ? 2 : 1);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    const handleGameOver = (finalCards: MemoryCard[]) => {
        setIsGameOver(true);
        if (gameMode === 'SOLO') {
            if (highScore === 0 || moves < highScore) updateHighScore('memory', moves + 1);
            const reward = DIFFICULTY_CONFIG[difficulty].bonus;
            addCoins(reward);
            setEarnedCoins(reward);
        } else {
            const p1Score = currentPlayer === 1 ? scores.p1 + 1 : scores.p1;
            const p2Score = currentPlayer === 2 ? scores.p2 + 1 : scores.p2;
            const winner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0;
            const isMeP1 = mp.amIP1;
            const didIWin = (isMeP1 && winner === 1) || (!isMeP1 && winner === 2);
            if (didIWin) {
                addCoins(50);
                setEarnedCoins(50);
                if (onReportProgress) onReportProgress('win', 1);
            }
        }
    };

    // --- MULTIPLAYER SYNC ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
            setOnlineStep('connecting'); 
            setOpponentLeft(false);
        }
    }, [gameMode]);

    useEffect(() => {
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';

        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (cards.length > 0) setCards([]); // Reset if back to lobby
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            
            if (mp.isHost && !isWaitingForDeck && cards.length === 0) {
                 const deck = generateDeck(difficulty);
                 setTimeout(() => {
                     const deckData = deck.map(c => c.iconId); 
                     mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData, difficulty });
                     setCards(deck);
                     setFlippedIndices([]);
                     setScores({ p1: 0, p2: 0 });
                     setCurrentPlayer(1);
                     setIsGameOver(false);
                     setIsProcessing(false);
                 }, 1000);
            } else if (!mp.isHost) {
                if (cards.length === 0) setIsWaitingForDeck(true);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, cards.length]);

    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'MEMORY_INIT') {
                const deckIds: string[] = data.deckIds;
                const newDifficulty: Difficulty = data.difficulty;
                setDifficulty(newDifficulty); 
                const newDeck: MemoryCard[] = deckIds.map((iconId, i) => ({ id: i, iconId, isFlipped: false, isMatched: false }));
                setCards(newDeck);
                setFlippedIndices([]);
                setScores({ p1: 0, p2: 0 });
                setCurrentPlayer(1);
                setIsGameOver(false);
                setIsProcessing(false);
                setIsWaitingForDeck(false);
                setOpponentLeft(false);
            }
            if (data.type === 'MEMORY_FLIP') {
                const index = data.index;
                handleCardClick(index, true); 
            }
            if (data.type === 'REMATCH_START') {
                 if (mp.isHost) {
                     setCards([]); setFlippedIndices([]); setScores({ p1: 0, p2: 0 }); setIsGameOver(false);
                     setTimeout(() => {
                         const deck = generateDeck(difficulty);
                         const deckData = deck.map(c => c.iconId);
                         mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData, difficulty });
                         setCards(deck);
                         setCurrentPlayer(1);
                     }, 1000);
                 } else {
                     setIsWaitingForDeck(true); setCards([]);
                 }
            }
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setIsGameOver(true); }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe();
    }, [mp]);

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
        phase, setPhase,
        gameMode, setGameMode,
        difficulty, setDifficulty,
        cards, flippedIndices, scores, moves, currentPlayer, isGameOver,
        earnedCoins, highScore, isProcessing,
        onlineStep, isWaitingForDeck, opponentLeft, chatHistory, activeReaction,
        startSoloGame, startOnlineGame, handleCardClick,
        sendChat, sendReaction,
        mp
    };
};
