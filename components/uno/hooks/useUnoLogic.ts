
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { useCurrency } from '../../../hooks/useCurrency';
import { Card as CardType, Turn, Color, Value, FlyingCardData, ChatMessage } from '../types';
import { generateDeck, isCardPlayable, getCpuMove } from '../logic';
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

    const state = useUnoState();
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    // --- MULTIPLAYER LIFECYCLE ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp?.connect();
        } else {
            mp?.disconnect();
            setOnlineStep('connecting');
            state.setOpponentLeft(false);
        }
    }, [gameMode]);

    useEffect(() => {
        if (!mp) return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game'); 
            else setOnlineStep('lobby');
            if (state.phase !== 'MENU') state.setPhase('GAME');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            state.setOpponentLeft(false);
        } else if (mp.mode === 'connecting') {
            setOnlineStep('connecting');
        }
    }, [mp?.mode, mp?.players, mp?.peerId]);

    const checkCompatibility = useCallback((card: CardType) => {
        const topCard = state.discardPile[state.discardPile.length - 1];
        if (!topCard) return true;
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
    }, [state.cpuHand.length, playVictory, playGameOver, addCoins, updateHighScore, onReportProgress, state]);

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: CardType[], isRemoteEffect: boolean = false) => {
        if (gameMode === 'ONLINE' && !mp?.isHost) {
            if (target === 'PLAYER' && !isRemoteEffect) mp?.sendData({ type: 'UNO_DRAW_REQ', amount });
            return [];
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
            if (currentDeck.length > 0) drawnCards.push(currentDeck.pop()!);
        }

        state.setDeck(currentDeck);
        if (didReshuffle) state.setDiscardPile(currentDiscard);

        if (target === 'PLAYER') {
            state.setPlayerHand(prev => [...prev, ...drawnCards]);
            state.setShowContestButton(false);
            if (gameMode === 'ONLINE' && mp?.isHost) mp?.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length });
        } else {
            if (gameMode === 'SOLO') {
                state.setCpuHand(prev => [...prev, ...drawnCards]);
                state.setOpponentCalledUno(false);
            } else {
                const dummies = Array.from({ length: drawnCards.length }).map((_, i) => ({ id: `opp_draw_${Date.now()}_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                state.setCpuHand(prev => [...prev, ...dummies]);
                state.setOpponentCalledUno(false);
                mp?.sendData({ type: 'UNO_DRAW_RESP', cards: drawnCards });
            }
        }
        return drawnCards;
    };

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
            while (firstCard.color === 'black') { newDeck.unshift(firstCard); firstCard = newDeck.pop()!; }
            state.setDeck(newDeck);
            state.setPlayerHand(pHand);
            state.setCpuHand(cHand);
            state.setDiscardPile([firstCard]);
            state.setActiveColor(firstCard.color);
            state.setTurn('PLAYER');
            state.setMessage("C'est parti !");
            if (onReportProgress) onReportProgress('play', 1);
        } else if (mp?.isHost) {
            const newDeck = generateDeck();
            const pHand = newDeck.splice(0, 7);
            const cHand = newDeck.splice(0, 7);
            let firstCard = newDeck.pop()!;
            while (firstCard.color === 'black') { newDeck.unshift(firstCard); firstCard = newDeck.pop()!; }
            state.setDeck(newDeck);
            state.setPlayerHand(pHand);
            state.setCpuHand(Array.from({ length: 7 }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black', value: '0', score: 0 })) as any);
            state.setDiscardPile([firstCard]);
            state.setActiveColor(firstCard.color);
            state.setTurn('PLAYER');
            setTimeout(() => mp?.sendData({ type: 'UNO_INIT', hand: cHand, oppHandCount: 7, topCard: firstCard, startTurn: mp.peerId }), 1000);
        } else {
            state.setIsWaitingForHost(true);
        }
    }, [gameMode, mp, onReportProgress, resumeAudio, state]);

    const executeCardEffect = (card: CardType, index: number, actor: Turn, isRemote: boolean) => {
        let hand = actor === 'PLAYER' ? [...state.playerHand] : [...state.cpuHand];
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1);
        else hand.splice(index, 1);
        
        if (actor === 'PLAYER') state.setPlayerHand(hand);
        else state.setCpuHand(hand);

        const newDiscardPile = [...state.discardPile, card];
        state.setDiscardPile(newDiscardPile);
        if (card.color !== 'black') state.setActiveColor(card.color);

        if (actor === 'PLAYER') {
            if (hand.length === 1 && !state.playerCalledUno) { state.setMessage("OUBLI UNO ! +2"); playGameOver(); drawCard('PLAYER', 2, newDiscardPile); }
            state.setShowContestButton(false);
        } else {
            if (hand.length === 1) {
                let forgot = gameMode === 'SOLO' ? Math.random() > 0.8 : !state.opponentCalledUno;
                if (!forgot && gameMode === 'SOLO') { state.setUnoShout('CPU'); setTimeout(() => state.setUnoShout(null), 1500); }
                if (forgot) state.setShowContestButton(true);
            } else state.setShowContestButton(false);
        }
        
        if (hand.length === 0) { handleGameOver(actor); if (gameMode === 'ONLINE' && !isRemote) mp?.sendData({ type: 'UNO_GAME_OVER', winner: mp.peerId }); return; }

        let nextTurn: Turn = actor === 'PLAYER' ? 'CPU' : 'PLAYER';
        if (card.value === 'skip') { state.setMessage("Passe ton tour !"); nextTurn = actor; }
        else if (card.value === 'reverse') { state.setMessage("Sens inverse !"); state.setPlayDirection(prev => prev * -1 as 1 | -1); nextTurn = actor; }
        else if (card.value === 'draw2') { state.setMessage("+2 cartes !"); if (!isRemote || mp?.isHost) drawCard(nextTurn, 2, newDiscardPile); nextTurn = actor; }
        else if (card.value === 'wild') { state.setMessage("Joker !"); if (actor === 'PLAYER') { state.setGameState('color_select'); return; } else if (gameMode === 'SOLO') { state.setActiveColor('red'); } }
        else if (card.value === 'wild4') { state.setMessage("+4 cartes !"); if (!isRemote || mp?.isHost) drawCard(nextTurn, 4, newDiscardPile); if (actor === 'PLAYER') { state.setGameState('color_select'); return; } else nextTurn = actor; }
        state.setTurn(nextTurn);
    };

    const animateCardPlay = (card: CardType, index: number, actor: Turn, startRect?: DOMRect, isRemote: boolean = false) => {
        setIsAnimating(true);
        playMove();
        const discardRect = discardPileRef.current?.getBoundingClientRect();
        if (!discardRect) { executeCardEffect(card, index, actor, isRemote); setIsAnimating(false); return; }
        setFlyingCard({ card, startX: startRect ? startRect.left : window.innerWidth/2, startY: startRect ? startRect.top : 100, targetX: discardRect.left, targetY: discardRect.top, rotation: Math.random() * 20 - 10 });
        setTimeout(() => { setFlyingCard(null); playLand(); executeCardEffect(card, index, actor, isRemote); setIsAnimating(false); }, 500);
    };

    const network = useUnoNetwork({ mp, state, gameMode, setActiveReaction, callbacks: { onMoveAnim: (card, index, actor, isRemote) => animateCardPlay(card, index, actor, undefined, isRemote), onDrawAnim: (target, amount) => drawCard(target, amount), onGameOver: handleGameOver, onRestart: () => startNewGame('ONLINE'), playAudio: (type) => { if (type === 'VICTORY') playVictory(); else if (type === 'GAMEOVER') playGameOver(); else if (type === 'HIT') playPaddleHit(); else if (type === 'MOVE') playMove(); } } });

    const handleDrawPileClick = () => {
        if (state.turn !== 'PLAYER' || state.gameState !== 'playing' || isAnimating || showTutorial) return;
        if (state.hasDrawnThisTurn) { state.setHasDrawnThisTurn(false); state.setTurn('CPU'); network.sendAction('UNO_PASS'); return; }
        if (gameMode === 'SOLO' || mp?.isHost) {
            const drawn = drawCard('PLAYER', 1); state.setHasDrawnThisTurn(true);
            if (!drawn[0] || !checkCompatibility(drawn[0])) setTimeout(() => { state.setTurn('CPU'); network.sendAction('UNO_PASS'); }, 1000);
        } else network.sendAction('UNO_DRAW_REQ', { amount: 1 });
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: CardType, index: number) => {
        if (state.turn !== 'PLAYER' || state.gameState !== 'playing' || isAnimating || showTutorial) return;
        if (checkCompatibility(card)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            animateCardPlay(card, index, 'PLAYER', rect);
            if (gameMode === 'ONLINE' && card.color !== 'black') network.sendAction('UNO_PLAY', { card });
        }
    };

    return { ...state, gameMode, flyingCard, isAnimating, onlineStep, setOnlineStep, activeReaction, showTutorial, setShowTutorial, initGame: (m: any) => { setGameMode(m); state.setPhase('GAME'); if (m === 'SOLO') startNewGame('SOLO'); }, startNewGame, checkCompatibility, onDrawPileClick: handleDrawPileClick, onPlayerCardClick: handlePlayerCardClick, onUnoClick: () => { state.setPlayerCalledUno(true); state.setUnoShout('PLAYER'); playPaddleHit(); setTimeout(() => state.setUnoShout(null), 1500); network.sendAction('UNO_SHOUT'); }, onContestClick: () => { state.setMessage("CONTRE-UNO ! +2 pour ADV"); playPaddleHit(); state.setShowContestButton(false); drawCard('CPU', 2); }, handleColorSelect: (color: Color) => { state.setActiveColor(color); state.setGameState('playing'); state.setTurn('CPU'); if (gameMode === 'ONLINE') network.sendAction('UNO_PLAY', { card: state.discardPile[state.discardPile.length-1], nextColor: color }); }, sendChat: (text: string) => { const msg = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() }; state.setChatHistory((prev: any) => [...prev, msg]); network.sendAction('CHAT', { text, senderName: username }); }, sendReaction: (id: string) => { setActiveReaction({ id, isMe: true }); network.sendAction('REACTION', { id }); setTimeout(() => setActiveReaction(null), 3000); }, backToMenu: () => { state.setPhase('MENU'); if (gameMode === 'ONLINE') mp?.leaveGame(); } };
};
