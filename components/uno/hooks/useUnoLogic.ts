import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { useCurrency } from '../../../hooks/useCurrency';
import { Card as CardType, GamePhase, GameState, Turn, ChatMessage, Color, Value, FlyingCardData } from '../types';
import { generateDeck, isCardPlayable, getCpuMove } from '../logic';

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

    // --- GAME STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [deck, setDeck] = useState<CardType[]>([]);
    const [discardPile, setDiscardPile] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [cpuHand, setCpuHand] = useState<CardType[]>([]);
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);

    // Mechanics
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);
    const [opponentCalledUno, setOpponentCalledUno] = useState(false);

    // Animation
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Online
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    // Refs
    const handleDataRef = useRef<(data: any) => void>(null);
    const gameStateRef = useRef({ playerHand, cpuHand, discardPile, activeColor, turn });

    useEffect(() => {
        gameStateRef.current = { playerHand, cpuHand, discardPile, activeColor, turn };
    }, [playerHand, cpuHand, discardPile, activeColor, turn]);

    // --- INITIALIZATION ---
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_uno_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_uno_tutorial_seen', 'true');
        }
    }, []);

    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame();
            setOpponentLeft(false);
        }
    }, [gameMode, mp]);

    const checkCompatibility = useCallback((card: CardType) => {
        const topCard = discardPile[discardPile.length - 1];
        return isCardPlayable(card, topCard, activeColor);
    }, [activeColor, discardPile]);

    const clearTable = useCallback(() => {
        setPlayerHand([]);
        setCpuHand([]);
        setDeck([]);
        setDiscardPile([]);
        setScore(0);
        setUnoShout(null);
        setEarnedCoins(0);
        setHasDrawnThisTurn(false);
        setIsAnimating(false);
        setFlyingCard(null); 
        setPlayDirection(1);
        setPlayerCalledUno(false);
        setShowContestButton(false);
        setOpponentCalledUno(false);
        setChatHistory([]);
        setOpponentLeft(false);
        setGameState('playing');
        setWinner(null);
        setMessage('');
        setIsWaitingForHost(false);
    }, []);

    // --- GAMEPLAY ACTIONS ---

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: CardType[], isRemoteEffect: boolean = false) => {
        if (gameMode === 'ONLINE' && !mp.isHost) {
            if (target === 'PLAYER') {
                if (isRemoteEffect) return [];
                mp.sendData({ type: 'UNO_DRAW_REQ', amount });
                return [];
            } else return []; 
        }

        playLand();
        let currentDeck = [...deck];
        let currentDiscard = manualDiscardPile ? [...manualDiscardPile] : [...discardPile];
        const drawnCards: CardType[] = [];
        let didReshuffle = false;

        for(let i=0; i<amount; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length > 1) {
                    const top = currentDiscard.pop()!;
                    currentDeck = currentDiscard.map(c => ({ ...c, isRevealed: false })).sort(() => Math.random() - 0.5);
                    currentDiscard = [top];
                    setMessage("Mélange du talon...");
                    didReshuffle = true;
                } else break;
            }
            drawnCards.push(currentDeck.pop()!);
        }

        setDeck(currentDeck);
        if (didReshuffle) setDiscardPile(currentDiscard);

        if (target === 'PLAYER') {
            setPlayerHand(prev => [...prev, ...drawnCards]);
            setShowContestButton(false);
            if (gameMode === 'ONLINE' && mp.isHost) {
                mp.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length });
            }
        } else {
            if (gameMode === 'SOLO') {
                setCpuHand(prev => [...prev, ...drawnCards]);
                setOpponentCalledUno(false);
            } else {
                const dummies = Array.from({ length: drawnCards.length }).map((_, i) => ({ 
                    id: `opp_draw_${Date.now()}_${i}`, 
                    color: 'black' as Color, 
                    value: '0' as Value, 
                    score: 0 
                }));
                setCpuHand(prev => [...prev, ...dummies]);
                setOpponentCalledUno(false);
                mp.sendData({ type: 'UNO_DRAW_RESP', cards: drawnCards });
            }
        }
        return drawnCards;
    };

    const handleGameOver = (winnerTurn: Turn) => {
        setWinner(winnerTurn);
        setGameState('gameover');
        if (winnerTurn === 'PLAYER') {
            playVictory();
            const points = cpuHand.length * 10 + 50; 
            setScore(points);
            const coins = Math.max(10, Math.floor(points / 2));
            addCoins(coins);
            setEarnedCoins(coins);
            updateHighScore('uno', points);
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            playGameOver();
        }
    };

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE') => {
        const targetMode = modeOverride || gameMode;
        clearTable();
        resumeAudio();
        setMessage("Distribution...");

        if (targetMode === 'SOLO') {
            const newDeck = generateDeck();
            const pHand = newDeck.splice(0, 7);
            const cHand = newDeck.splice(0, 7);
            let firstCard = newDeck.pop()!;
            while (firstCard.color === 'black') {
                newDeck.unshift(firstCard);
                firstCard = newDeck.pop()!;
            }
            setDeck(newDeck);
            setPlayerHand(pHand);
            setCpuHand(cHand);
            setDiscardPile([firstCard]);
            setActiveColor(firstCard.color);
            setTurn('PLAYER');
            setMessage("C'est parti !");
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
                setDeck(newDeck);
                setPlayerHand(pHand);
                const dummies = Array.from({ length: 7 }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                setCpuHand(dummies);
                setDiscardPile([firstCard]);
                setActiveColor(firstCard.color);
                setTurn('PLAYER');
                
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
                setIsWaitingForHost(true);
                setPlayerHand([]);
                setCpuHand([]);
                setDiscardPile([]);
            }
        }
    };

    const initGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        setPhase('GAME');
        if (mode === 'SOLO') startNewGame('SOLO');
        else if (mode === 'ONLINE' && mp.mode === 'in_game') startNewGame('ONLINE');
    };

    const executeCardEffect = (card: CardType, index: number, actor: Turn, isRemote: boolean) => {
        const currentState = gameStateRef.current;
        let hand = actor === 'PLAYER' ? [...currentState.playerHand] : [...currentState.cpuHand];
        let discard = [...currentState.discardPile];
        
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1);
        else hand.splice(index, 1);
        
        if (actor === 'PLAYER') setPlayerHand(hand);
        else setCpuHand(hand);

        const newDiscardPile = [...discard, card];
        setDiscardPile(newDiscardPile);
        
        if (card.color !== 'black') {
            setActiveColor(card.color);
        }

        // --- UNO CHECK LOGIC ---
        if (actor === 'PLAYER') {
            if (hand.length === 1 && !playerCalledUno) {
                 setMessage("OUBLI UNO ! +2");
                 playGameOver(); 
                 drawCard('PLAYER', 2, newDiscardPile);
            }
            setShowContestButton(false);
        } else {
            if (hand.length === 1) {
                let forgot = false;
                if (gameMode === 'SOLO') {
                    forgot = Math.random() > 0.8;
                    if (!forgot) {
                        setUnoShout('CPU');
                        setTimeout(() => setUnoShout(null), 1500);
                    }
                } else {
                    forgot = !opponentCalledUno;
                }
                if (forgot) setShowContestButton(true);
            } else {
                setShowContestButton(false);
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
            setMessage("Passe ton tour !");
            nextTurn = actor;
        } else if (card.value === 'reverse') {
            setMessage("Sens inverse !");
            setPlayDirection(prev => prev * -1 as 1 | -1);
            nextTurn = actor; 
        } else if (card.value === 'draw2') {
            setMessage("+2 cartes !");
            if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) {
                drawCard(nextTurn, 2, newDiscardPile);
            }
            nextTurn = actor;
        } else if (card.value === 'wild') {
            setMessage("Joker !");
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return;
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    setActiveColor(bestColor);
                    setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                }
            }
        } else if (card.value === 'wild4') {
            setMessage("+4 cartes !");
            if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) {
                drawCard(nextTurn, 4, newDiscardPile);
            }
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; 
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    setActiveColor(bestColor);
                    setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                }
                nextTurn = actor;
            }
        }

        setTurn(nextTurn);
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
                const totalWidth = cpuHand.length * 20; 
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

    // --- EVENT HANDLERS ---

    const handleDrawPileClick = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return;

        setShowContestButton(false); 

        if (hasDrawnThisTurn) {
            setMessage("Tour passé");
            setHasDrawnThisTurn(false);
            setTurn('CPU');
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_PASS' });
            return;
        }

        if (gameMode === 'SOLO') {
            const drawn = drawCard('PLAYER', 1);
            setHasDrawnThisTurn(true);
            const newCard = drawn[0];
            
            if (newCard && checkCompatibility(newCard)) {
                setMessage("Carte jouable !");
            } else {
                setMessage("Pas de chance...");
                setTimeout(() => setTurn('CPU'), 1000);
            }
        } else {
            if (mp.isHost) {
                const drawn = drawCard('PLAYER', 1);
                setHasDrawnThisTurn(true);
                const newCard = drawn[0];
                if (!newCard || !checkCompatibility(newCard)) {
                    setTimeout(() => {
                        setTurn('CPU');
                        mp.sendData({ type: 'UNO_PASS' });
                    }, 1000);
                } else setMessage("Carte jouable !");
            } else mp.sendData({ type: 'UNO_DRAW_REQ', amount: 1 });
        }
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: CardType, index: number) => {
        e.stopPropagation();
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return;
        setShowContestButton(false); 
        if (checkCompatibility(card)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            animateCardPlay(card, index, 'PLAYER', rect);
            if (gameMode === 'ONLINE' && card.color !== 'black') {
                mp.sendData({ type: 'UNO_PLAY', card });
            }
        }
    };

    const handleColorSelect = (color: Color) => {
        setActiveColor(color);
        setGameState('playing');
        
        const topCard = discardPile[discardPile.length - 1];
        let nextTurn: Turn = 'CPU';
        
        if (topCard.value === 'wild4') {
             nextTurn = 'PLAYER';
             setMessage("L'adversaire passe son tour !");
        }
        
        setTurn(nextTurn);
        if (gameMode === 'ONLINE') {
            const playedCard = discardPile[discardPile.length - 1];
            mp.sendData({ type: 'UNO_PLAY', card: playedCard, nextColor: color });
        }
    };

    const handleUnoClick = () => {
        if (turn === 'PLAYER' && playerHand.length === 2 && !playerCalledUno) {
            setPlayerCalledUno(true);
            setUnoShout('PLAYER');
            playPaddleHit();
            setTimeout(() => setUnoShout(null), 1500);
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_SHOUT' });
        }
    };

    const handleContestClick = () => {
        if (showContestButton) {
            setMessage("CONTRE-UNO ! +2 pour ADV");
            playPaddleHit();
            setShowContestButton(false);
            drawCard('CPU', 2);
        }
    };

    // --- ONLINE HANDLERS ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'UNO_INIT') {
                setPlayerHand(data.hand);
                const dummies = Array.from({ length: data.oppHandCount }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                setCpuHand(dummies);
                setDiscardPile([data.topCard]);
                setActiveColor(data.topCard.color === 'black' ? 'red' : data.topCard.color);
                setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                setDeck(Array(20).fill(null) as any);
                setGameState('playing');
                setMessage("La partie commence !");
                setIsWaitingForHost(false);
                setPlayDirection(1);
                if (onReportProgress) onReportProgress('play', 1);
            }
            if (data.type === 'UNO_PLAY') {
                const card = data.card;
                animateCardPlay(card, 0, 'CPU', undefined, true);
                if (data.nextColor) setActiveColor(data.nextColor);
            }
            if (data.type === 'UNO_DRAW_REQ') {
                if (mp.isHost) drawCard('CPU', data.amount || 1);
            }
            if (data.type === 'UNO_DRAW_NOTIFY') {
                const count = data.count;
                const dummies = Array.from({ length: count }).map((_, i) => ({ 
                    id: `opp_draw_${Date.now()}_${i}`, 
                    color: 'black' as Color, 
                    value: '0' as Value, 
                    score: 0 
                }));
                setCpuHand(prev => [...prev, ...dummies]);
                setMessage("L'adversaire pioche...");
                setOpponentCalledUno(false);
            }
            if (data.type === 'UNO_DRAW_RESP') {
                const newCards = data.cards;
                setPlayerHand(prev => [...prev, ...newCards]);
                setHasDrawnThisTurn(true);
                const last = newCards[newCards.length-1];
                if (last && checkCompatibility(last)) setMessage("Carte jouable !");
                else {
                    setMessage("Pas de chance...");
                    setTimeout(() => { setMessage("Tour passé"); setHasDrawnThisTurn(false); setTurn('CPU'); mp.sendData({ type: 'UNO_PASS' }); }, 1000);
                }
            }
            if (data.type === 'UNO_PASS') {
                setTurn('PLAYER');
                setMessage("À toi de jouer !");
            }
            if (data.type === 'UNO_SHOUT') {
                setUnoShout('CPU');
                setOpponentCalledUno(true);
                playPaddleHit();
                setTimeout(() => setUnoShout(null), 1500);
            }
            if (data.type === 'UNO_GAME_OVER') {
                if (gameState === 'gameover') return;
                handleGameOver(data.winner === mp.peerId ? 'PLAYER' : 'CPU');
            }
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); handleGameOver('PLAYER'); }
            if (data.type === 'REMATCH_START') startNewGame('ONLINE');
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp.subscribe]);

    // --- AI LOOP ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'CPU' && gameState === 'playing' && !isAnimating) {
            const timer = setTimeout(() => {
                const topCard = discardPile[discardPile.length - 1];
                const move = getCpuMove(cpuHand, topCard, activeColor);
                
                if (move) {
                    animateCardPlay(move.card, move.index, 'CPU');
                } else {
                    drawCard('CPU', 1);
                    setTurn('PLAYER');
                }
            }, 1200); 
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, cpuHand, activeColor, discardPile, isAnimating, gameMode]);

    // --- TRANSITIONS ---
    useEffect(() => {
        if (gameMode === 'SOLO') return;
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game'); else setOnlineStep('lobby');
            if (phase === 'GAME' && (playerHand.length > 0 || cpuHand.length > 0 || winner)) clearTable();
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game'); setOpponentLeft(false);
            if (phase === 'MENU') initGame('ONLINE');
            else if (phase === 'GAME') {
                const isGameRunning = playerHand.length > 0 || cpuHand.length > 0 || isWaitingForHost;
                if (!isGameRunning) startNewGame('ONLINE');
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase, playerHand.length, cpuHand.length, winner, clearTable, isWaitingForHost, gameMode]);

    const sendChat = (text: string) => {
        const msg: ChatMessage = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() };
        setChatHistory(prev => [...prev, msg]);
        mp.sendData({ type: 'CHAT', text, senderName: username });
    };

    const sendReaction = (reactionId: string) => {
        if (gameMode === 'ONLINE' && mp.mode === 'in_game') {
            setActiveReaction({ id: reactionId, isMe: true });
            mp.sendData({ type: 'REACTION', id: reactionId });
            setTimeout(() => setActiveReaction(null), 3000);
        }
    };

    const backToMenuAction = () => {
        setPhase('MENU');
        if (gameMode === 'ONLINE') { if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame(); }
    };

    return {
        // State
        phase, gameMode, deck, discardPile, playerHand, cpuHand, turn, gameState, activeColor, winner, score, unoShout, message, earnedCoins, showTutorial, playDirection, hasDrawnThisTurn, playerCalledUno, showContestButton, opponentCalledUno, flyingCard, isAnimating, onlineStep, isWaitingForHost, opponentLeft, chatHistory, activeReaction,
        
        // Methods
        initGame, startNewGame, checkCompatibility, onDrawPileClick: handleDrawPileClick, onPlayerCardClick: handlePlayerCardClick, onUnoClick: handleUnoClick, onContestClick: handleContestClick, handleColorSelect, sendChat, sendReaction, backToMenu: backToMenuAction, setShowTutorial
    };
};