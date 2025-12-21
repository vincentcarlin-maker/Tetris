
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { useCurrency } from '../../../hooks/useCurrency';
import { Card as CardType, GamePhase, Turn, Color, Value, FlyingCardData } from '../types';
import { generateDeck, isCardPlayable, getCpuMove } from '../logic';

// Import sub-hooks
import { useUnoState } from './useUnoState';
import { useUnoNetwork } from './useUnoNetwork';

interface UseUnoLogicProps {
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
    discardPileRef: React.RefObject<HTMLDivElement>;
    cpuHandRef: React.RefObject<HTMLDivElement>;
}

export const useUnoLogic = ({ audio, addCoins, mp, onReportProgress, discardPileRef, cpuHandRef }: UseUnoLogicProps) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();

    // --- SUB-HOOKS ---
    const state = useUnoState(); // All state variables are here
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    
    // Animation specific state (UI only)
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    // --- CORE LOGIC HELPERS ---
    
    const checkCompatibility = useCallback((card: CardType) => {
        const topCard = state.discardPile[state.discardPile.length - 1];
        return isCardPlayable(card, topCard, state.activeColor);
    }, [state.activeColor, state.discardPile]);

    const handleGameOver = useCallback((winnerTurn: Turn) => {
        state.setWinner(winnerTurn);
        state.setGameState('gameover');
        if (winnerTurn === 'PLAYER') {
            playVictory();
            const points = state.cpuHand.length * 10 + 50; 
            state.setScore(points);
            const coins = Math.max(10, Math.floor(points / 2));
            addCoins(coins);
            state.setEarnedCoins(coins);
            updateHighScore('uno', points);
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            playGameOver();
        }
    }, [state.cpuHand.length, playVictory, playGameOver, addCoins, updateHighScore, onReportProgress]);

    const startNewGame = useCallback((modeOverride?: 'SOLO' | 'ONLINE') => {
        const targetMode = modeOverride || gameMode;
        state.resetState();
        resumeAudio();
        state.setMessage("Distribution...");

        if (targetMode === 'SOLO') {
            const newDeck = generateDeck();
            const pHand = newDeck.splice(0, 7);
            const cHand = newDeck.splice(0, 7);
            let firstCard = newDeck.pop()!;
            while (firstCard.color === 'black') {
                newDeck.unshift(firstCard);
                firstCard = newDeck.pop()!;
            }
            state.setDeck(newDeck);
            state.setPlayerHand(pHand);
            state.setCpuHand(cHand);
            state.setDiscardPile([firstCard]);
            state.setActiveColor(firstCard.color);
            state.setTurn('PLAYER');
            state.setMessage("C'est parti !");
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            if (mp.isHost) {
                const newDeck = generateDeck();
                const pHand = newDeck.splice(0, 7);
                const cHand = newDeck.splice(0, 7);
                let firstCard = newDeck.pop()!;
                while (firstCard.color === 'black') {
                    newDeck.unshift(firstCard);
                    firstCard = newDeck.pop()!;
                }
                state.setDeck(newDeck);
                state.setPlayerHand(pHand);
                const dummies = Array.from({ length: 7 }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                state.setCpuHand(dummies);
                state.setDiscardPile([firstCard]);
                state.setActiveColor(firstCard.color);
                state.setTurn('PLAYER');
                
                setTimeout(() => {
                    mp.sendData({
                        type: 'UNO_INIT',
                        hand: cHand,
                        oppHandCount: 7,
                        topCard: firstCard,
                        startTurn: mp.peerId
                    });
                }, 1000);
            } else {
                state.setIsWaitingForHost(true);
            }
        }
    }, [gameMode, mp, onReportProgress, resumeAudio, state]);

    // --- GAME ACTIONS ---

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: CardType[], isRemoteEffect: boolean = false) => {
        if (gameMode === 'ONLINE' && !mp.isHost) {
            if (target === 'PLAYER') {
                if (isRemoteEffect) return [];
                mp.sendData({ type: 'UNO_DRAW_REQ', amount });
                return [];
            } else return []; 
        }

        playLand();
        let currentDeck = [...state.deck];
        let currentDiscard = manualDiscardPile ? [...manualDiscardPile] : [...state.discardPile];
        const drawnCards: CardType[] = [];
        let didReshuffle = false;

        for(let i=0; i<amount; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length > 1) {
                    const top = currentDiscard.pop()!;
                    currentDeck = currentDiscard.map(c => ({ ...c, isRevealed: false })).sort(() => Math.random() - 0.5);
                    currentDiscard = [top];
                    state.setMessage("Mélange du talon...");
                    didReshuffle = true;
                } else break;
            }
            drawnCards.push(currentDeck.pop()!);
        }

        state.setDeck(currentDeck);
        if (didReshuffle) state.setDiscardPile(currentDiscard);

        if (target === 'PLAYER') {
            state.setPlayerHand(prev => [...prev, ...drawnCards]);
            state.setShowContestButton(false);
            if (gameMode === 'ONLINE' && mp.isHost) {
                mp.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length });
            }
        } else {
            if (gameMode === 'SOLO') {
                state.setCpuHand(prev => [...prev, ...drawnCards]);
                state.setOpponentCalledUno(false);
            } else {
                const dummies = Array.from({ length: drawnCards.length }).map((_, i) => ({ 
                    id: `opp_draw_${Date.now()}_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 
                }));
                state.setCpuHand(prev => [...prev, ...dummies]);
                state.setOpponentCalledUno(false);
                mp.sendData({ type: 'UNO_DRAW_RESP', cards: drawnCards });
            }
        }
        return drawnCards;
    };

    const executeCardEffect = (card: CardType, index: number, actor: Turn, isRemote: boolean) => {
        let hand = actor === 'PLAYER' ? [...state.playerHand] : [...state.cpuHand];
        let discard = [...state.discardPile];
        
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1);
        else hand.splice(index, 1);
        
        if (actor === 'PLAYER') state.setPlayerHand(hand);
        else state.setCpuHand(hand);

        const newDiscardPile = [...discard, card];
        state.setDiscardPile(newDiscardPile);
        
        if (card.color !== 'black') {
            state.setActiveColor(card.color);
        }

        // UNO Check
        if (actor === 'PLAYER') {
            if (hand.length === 1 && !state.playerCalledUno) {
                 state.setMessage("OUBLI UNO ! +2");
                 playGameOver(); 
                 drawCard('PLAYER', 2, newDiscardPile);
            }
            state.setShowContestButton(false);
        } else {
            if (hand.length === 1) {
                let forgot = false;
                if (gameMode === 'SOLO') {
                    forgot = Math.random() > 0.8;
                    if (!forgot) {
                        state.setUnoShout('CPU');
                        setTimeout(() => state.setUnoShout(null), 1500);
                    }
                } else {
                    forgot = !state.opponentCalledUno;
                }
                if (forgot) state.setShowContestButton(true);
            } else {
                state.setShowContestButton(false);
            }
        }
        
        if (hand.length === 0) {
            handleGameOver(actor);
            if (gameMode === 'ONLINE' && !isRemote) {
                mp.sendData({ type: 'UNO_GAME_OVER', winner: mp.peerId });
            }
            return;
        }

        let nextTurn: Turn = actor === 'PLAYER' ? 'CPU' : 'PLAYER';
        
        if (card.value === 'skip') {
            state.setMessage("Passe ton tour !");
            nextTurn = actor;
        } else if (card.value === 'reverse') {
            state.setMessage("Sens inverse !");
            state.setPlayDirection(prev => prev * -1 as 1 | -1);
            nextTurn = actor; 
        } else if (card.value === 'draw2') {
            state.setMessage("+2 cartes !");
            if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) {
                drawCard(nextTurn, 2, newDiscardPile);
            }
            nextTurn = actor;
        } else if (card.value === 'wild') {
            state.setMessage("Joker !");
            if (actor === 'PLAYER') {
                state.setGameState('color_select');
                return;
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    state.setActiveColor(bestColor);
                    state.setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                }
            }
        } else if (card.value === 'wild4') {
            state.setMessage("+4 cartes !");
            if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) {
                drawCard(nextTurn, 4, newDiscardPile);
            }
            if (actor === 'PLAYER') {
                state.setGameState('color_select');
                return; 
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    state.setActiveColor(bestColor);
                    state.setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                }
                nextTurn = actor;
            }
        }

        state.setTurn(nextTurn);
    };

    const animateCardPlay = (card: CardType, index: number, actor: Turn, startRect?: DOMRect, isRemote: boolean = false) => {
        setIsAnimating(true);
        playMove();

        const discardRect = discardPileRef.current?.getBoundingClientRect();
        if (!discardRect) {
            executeCardEffect(card, index, actor, isRemote);
            setIsAnimating(false);
            return;
        }

        let startX = 0;
        let startY = 0;

        if (startRect) {
            startX = startRect.left;
            startY = startRect.top;
        } else {
            if (cpuHandRef.current) {
                const handRect = cpuHandRef.current.getBoundingClientRect();
                const totalWidth = state.cpuHand.length * 20; 
                const startOffset = handRect.left + (handRect.width / 2) - (totalWidth / 2);
                startX = startOffset + (index * 20);
                startY = handRect.top + 20;
            } else {
                startX = window.innerWidth / 2;
                startY = 50;
            }
        }

        setFlyingCard({
            card,
            startX,
            startY,
            targetX: discardRect.left,
            targetY: discardRect.top,
            rotation: Math.random() * 20 - 10
        });

        setTimeout(() => {
            setFlyingCard(null);
            playLand();
            executeCardEffect(card, index, actor, isRemote);
            setIsAnimating(false);
        }, 500);
    };

    // --- NETWORK ---
    const network = useUnoNetwork({
        mp,
        state,
        gameMode,
        setActiveReaction,
        callbacks: {
            onMoveAnim: (card, index, actor, isRemote) => animateCardPlay(card, index, actor, undefined, isRemote),
            onDrawAnim: (target, amount) => drawCard(target, amount),
            onGameOver: handleGameOver,
            onRestart: () => startNewGame('ONLINE'),
            playAudio: (type) => {
                if (type === 'VICTORY') playVictory();
                else if (type === 'GAMEOVER') playGameOver();
                else if (type === 'HIT') playPaddleHit();
                else if (type === 'MOVE') playMove();
            }
        }
    });

    // --- UI INTERACTIONS ---

    const handleDrawPileClick = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (state.turn !== 'PLAYER' || state.gameState !== 'playing' || isAnimating || showTutorial) return;

        state.setShowContestButton(false); 

        if (state.hasDrawnThisTurn) {
            state.setMessage("Tour passé");
            state.setHasDrawnThisTurn(false);
            state.setTurn('CPU');
            network.sendAction('UNO_PASS');
            return;
        }

        if (gameMode === 'SOLO') {
            const drawn = drawCard('PLAYER', 1);
            state.setHasDrawnThisTurn(true);
            const newCard = drawn[0];
            
            if (newCard && checkCompatibility(newCard)) {
                state.setMessage("Carte jouable !");
            } else {
                state.setMessage("Pas de chance...");
                setTimeout(() => state.setTurn('CPU'), 1000);
            }
        } else {
            if (mp.isHost) {
                const drawn = drawCard('PLAYER', 1);
                state.setHasDrawnThisTurn(true);
                const newCard = drawn[0];
                if (!newCard || !checkCompatibility(newCard)) {
                    setTimeout(() => {
                        state.setTurn('CPU');
                        network.sendAction('UNO_PASS');
                    }, 1000);
                } else state.setMessage("Carte jouable !");
            } else network.sendAction('UNO_DRAW_REQ', { amount: 1 });
        }
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: CardType, index: number) => {
        e.stopPropagation();
        if (state.turn !== 'PLAYER' || state.gameState !== 'playing' || isAnimating || showTutorial) return;
        state.setShowContestButton(false); 
        if (checkCompatibility(card)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            animateCardPlay(card, index, 'PLAYER', rect);
            if (gameMode === 'ONLINE' && card.color !== 'black') {
                network.sendAction('UNO_PLAY', { card });
            }
        }
    };

    const handleColorSelect = (color: Color) => {
        state.setActiveColor(color);
        state.setGameState('playing');
        
        const topCard = state.discardPile[state.discardPile.length - 1];
        let nextTurn: Turn = 'CPU';
        
        if (topCard.value === 'wild4') {
             nextTurn = 'PLAYER';
             state.setMessage("L'adversaire passe son tour !");
        }
        
        state.setTurn(nextTurn);
        if (gameMode === 'ONLINE') {
            const playedCard = state.discardPile[state.discardPile.length - 1];
            network.sendAction('UNO_PLAY', { card: playedCard, nextColor: color });
        }
    };

    const handleUnoClick = () => {
        if (state.turn === 'PLAYER' && state.playerHand.length === 2 && !state.playerCalledUno) {
            state.setPlayerCalledUno(true);
            state.setUnoShout('PLAYER');
            playPaddleHit();
            setTimeout(() => state.setUnoShout(null), 1500);
            network.sendAction('UNO_SHOUT');
        }
    };

    const handleContestClick = () => {
        if (state.showContestButton) {
            state.setMessage("CONTRE-UNO ! +2 pour ADV");
            playPaddleHit();
            state.setShowContestButton(false);
            drawCard('CPU', 2);
        }
    };

    // --- AI LOOP ---
    useEffect(() => {
        if (gameMode === 'SOLO' && state.turn === 'CPU' && state.gameState === 'playing' && !isAnimating) {
            const timer = setTimeout(() => {
                const topCard = state.discardPile[state.discardPile.length - 1];
                const move = getCpuMove(state.cpuHand, topCard, state.activeColor);
                
                if (move) {
                    animateCardPlay(move.card, move.index, 'CPU');
                } else {
                    drawCard('CPU', 1);
                    state.setTurn('PLAYER');
                }
            }, 1200); 
            return () => clearTimeout(timer);
        }
    }, [state.turn, state.gameState, state.cpuHand, state.activeColor, state.discardPile, isAnimating, gameMode]);

    // --- TRANSITIONS ---
    useEffect(() => {
        if (gameMode === 'SOLO') return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game'); else setOnlineStep('lobby');
            if (state.phase === 'GAME' && (state.playerHand.length > 0 || state.cpuHand.length > 0 || state.winner)) state.resetState();
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game'); state.setOpponentLeft(false);
            if (state.phase === 'MENU') initGame('ONLINE');
            else if (state.phase === 'GAME') {
                const isGameRunning = state.playerHand.length > 0 || state.cpuHand.length > 0 || state.isWaitingForHost;
                if (!isGameRunning) startNewGame('ONLINE');
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, state.phase, state.playerHand.length, state.cpuHand.length, state.winner, state.isWaitingForHost, gameMode]);

    const sendChat = (text: string) => {
        const msg = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() };
        state.setChatHistory((prev: any) => [...prev, msg]);
        network.sendAction('CHAT', { text, senderName: username });
    };

    const sendReaction = (id: string) => {
        setActiveReaction({ id, isMe: true });
        network.sendAction('REACTION', { id });
        setTimeout(() => setActiveReaction(null), 3000);
    };

    const initGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        state.setPhase('GAME');
        if (mode === 'SOLO') startNewGame('SOLO');
        else if (mode === 'ONLINE' && mp.mode === 'in_game') startNewGame('ONLINE');
    };

    const backToMenu = () => {
        state.setPhase('MENU');
        if (gameMode === 'ONLINE') { if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame(); }
    };

    return {
        // State
        ...state,
        gameMode, flyingCard, isAnimating, onlineStep, activeReaction, showTutorial, setShowTutorial,
        
        // Actions
        initGame, startNewGame, checkCompatibility, 
        onDrawPileClick: handleDrawPileClick, 
        onPlayerCardClick: handlePlayerCardClick, 
        onUnoClick: handleUnoClick, 
        onContestClick: handleContestClick, 
        handleColorSelect, 
        sendChat, sendReaction, 
        backToMenu
    };
};
