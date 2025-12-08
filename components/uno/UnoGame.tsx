
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle, Play, RotateCcw, Ban, Palette, Users, Globe, User, Loader2, Send, MessageSquare, Smile, Frown, ThumbsUp, Heart, LogOut, Hand } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

// --- TYPES ---
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'black';
type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

interface Card {
    id: string;
    color: Color;
    value: Value;
    score: number;
}

interface FlyingCardData {
    card: Card;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    rotation: number;
}

type Turn = 'PLAYER' | 'CPU';
type GameMode = 'SOLO' | 'ONLINE';
type GameState = 'playing' | 'gameover' | 'color_select' | 'menu';

// --- CONFIG ---
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { 
        border: 'border-red-500', 
        text: 'text-red-500', 
        shadow: 'shadow-red-500/50', 
        bg: 'bg-red-950',
        gradient: 'from-red-600 to-red-900'
    },
    blue: { 
        border: 'border-cyan-500', 
        text: 'text-cyan-500', 
        shadow: 'shadow-cyan-500/50', 
        bg: 'bg-cyan-950',
        gradient: 'from-cyan-600 to-blue-900'
    },
    green: { 
        border: 'border-green-500', 
        text: 'text-green-500', 
        shadow: 'shadow-green-500/50', 
        bg: 'bg-green-950',
        gradient: 'from-green-600 to-emerald-900'
    },
    yellow: { 
        border: 'border-yellow-400', 
        text: 'text-yellow-400', 
        shadow: 'shadow-yellow-400/50', 
        bg: 'bg-yellow-950',
        gradient: 'from-yellow-500 to-orange-800'
    },
    black: { 
        border: 'border-purple-500', 
        text: 'text-white', 
        shadow: 'shadow-purple-500/50', 
        bg: 'bg-gray-900',
        gradient: 'from-purple-600 via-pink-600 to-blue-600' 
    },
};

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;
    const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];

    const addCard = (color: Color, value: Value, score: number) => {
        deck.push({ id: `card_${idCounter++}`, color, value, score });
    };

    COLORS.forEach(color => {
        addCard(color, '0', 0); // 1 zero
        for (let i = 1; i <= 9; i++) {
            addCard(color, i.toString() as Value, i);
            addCard(color, i.toString() as Value, i);
        }
        SPECIAL_VALUES.forEach(val => {
            addCard(color, val, 20);
            addCard(color, val, 20);
        });
    });

    // Wilds
    for (let i = 0; i < 4; i++) {
        addCard('black', 'wild', 50);
        addCard('black', 'wild4', 50);
    }

    return deck.sort(() => Math.random() - 0.5);
};

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp }) => {
    // Identity
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

    // Game Mode State
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    const [gameState, setGameState] = useState<GameState>('menu');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);

    // Chat
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    // Gameplay State
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [cpuHand, setCpuHand] = useState<Card[]>([]); // Acts as Opponent Hand in Online Mode
    const [turn, setTurn] = useState<Turn>('PLAYER');
    
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);

    // Animation States
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    // Sync Self Info
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
            setOpponentLeft(false);
        }
        return () => mp.disconnect();
    }, [gameMode]);

    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (gameState === 'playing') setGameState('menu');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    // Handle Network Data
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'UNO_START') {
                setIsReady(true);
                setOpponentReady(true);
                startNewGame(data.deckSeed); // Seeded start for sync
            }
            else if (data.type === 'UNO_INIT_STATE') {
                // Host sends initial state
                if (!mp.isHost) {
                    setDeck(data.deck);
                    setPlayerHand(data.p2Hand); // I am P2
                    setCpuHand(data.p1Hand); // Opponent is P1
                    setDiscardPile(data.discard);
                    setActiveColor(data.activeColor);
                    setTurn('CPU'); // Host (P1) starts
                    setGameState('playing');
                    setIsReady(true);
                    setOpponentReady(true);
                }
            }
            else if (data.type === 'UNO_MOVE') {
                handleOpponentMove(data.move);
            }
            else if (data.type === 'REMATCH_START') {
                if (mp.isHost) triggerOnlineStart();
            }
            else if (data.type === 'CHAT') {
                setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            }
            else if (data.type === 'REACTION') {
                setActiveReaction({ id: data.id, isMe: false });
                setTimeout(() => setActiveReaction(null), 3000);
            }
            else if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setGameState('gameover');
                setMessage("Adversaire parti");
            }
        });
        return () => unsubscribe();
    }, [mp]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- GAME LOGIC ---

    const triggerOnlineStart = () => {
        // Host Logic to Init Game
        const newDeck = generateDeck();
        const p1Hand = newDeck.splice(0, 7);
        const p2Hand = newDeck.splice(0, 7);
        let firstCard = newDeck.pop()!;
        while (firstCard.color === 'black') {
            newDeck.unshift(firstCard);
            firstCard = newDeck.pop()!;
        }
        
        setDeck(newDeck);
        setPlayerHand(p1Hand); // Host is P1
        setCpuHand(p2Hand); // Guest is P2 (visually CPU hand)
        setDiscardPile([firstCard]);
        setActiveColor(firstCard.color);
        setTurn('PLAYER'); // Host starts
        setGameState('playing');
        setWinner(null);
        setScore(0);
        setUnoShout(null);
        setMessage("C'est parti !");
        setEarnedCoins(0);
        setHasDrawnThisTurn(false);
        setIsAnimating(false);
        setPlayDirection(1);
        setPlayerCalledUno(false);
        setShowContestButton(false);
        resumeAudio();

        // Send State to Guest
        mp.sendData({
            type: 'UNO_INIT_STATE',
            deck: newDeck,
            p1Hand: p1Hand,
            p2Hand: p2Hand,
            discard: [firstCard],
            activeColor: firstCard.color
        });
    };

    const startNewGame = (seed?: number) => {
        if (gameMode === 'ONLINE') {
            if (mp.isHost) triggerOnlineStart();
            else mp.sendData({ type: 'UNO_START' });
            return;
        }

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
        setGameState('playing');
        setWinner(null);
        setScore(0);
        setUnoShout(null);
        setMessage("C'est parti !");
        setEarnedCoins(0);
        setHasDrawnThisTurn(false);
        setIsAnimating(false);
        setPlayDirection(1);
        setPlayerCalledUno(false);
        setShowContestButton(false);
        resumeAudio();
    };

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: Card[]) => {
        playLand();
        // In Online Mode, drawCard is purely local logic for "drawing from a deck".
        // Sync is handled via events.
        
        let currentDeck = [...deck];
        let currentDiscard = manualDiscardPile ? [...manualDiscardPile] : [...discardPile];
        const drawnCards: Card[] = [];
        let didReshuffle = false;

        for(let i=0; i<amount; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length > 1) {
                    const top = currentDiscard.pop()!;
                    currentDeck = currentDiscard.sort(() => Math.random() - 0.5);
                    currentDiscard = [top];
                    setMessage("Mélange du talon...");
                    didReshuffle = true;
                } else {
                    // Deck empty, generate fresh cards if needed (P2P fallback)
                    const emergencyCard: Card = { id: `emerg_${Date.now()}_${i}`, color: 'red', value: '1', score: 1 }; 
                    drawnCards.push(emergencyCard); 
                    continue; 
                }
            }
            drawnCards.push(currentDeck.pop()!);
        }

        setDeck(currentDeck);
        if (didReshuffle) setDiscardPile(currentDiscard);

        if (target === 'PLAYER') setPlayerHand(prev => [...prev, ...drawnCards]);
        else setCpuHand(prev => [...prev, ...drawnCards]);
        
        return drawnCards;
    };

    useEffect(() => {
        if (turn === 'PLAYER') {
            setHasDrawnThisTurn(false);
            setPlayerCalledUno(false); 
        }
    }, [turn]);

    // --- MANUAL DRAW ACTION ---
    const handleDrawPileClick = () => {
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || hasDrawnThisTurn) return;

        const drawn = drawCard('PLAYER', 1);
        setHasDrawnThisTurn(true);

        const newCard = drawn[0];
        if (newCard) {
            // Online Sync: "I drew a card"
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_MOVE', move: { type: 'DRAW' } });

            const topCard = discardPile[discardPile.length - 1];
            const canPlay = 
                newCard.color === activeColor || 
                newCard.value === topCard.value || 
                newCard.color === 'black';

            if (canPlay) {
                setMessage("Carte jouable !");
            } else {
                setMessage("Pas de chance...");
                setTimeout(() => setTurn('CPU'), 1000);
            }
        }
    };

    // --- UNO CALL ACTIONS ---
    const handleUnoClick = () => {
        if (turn === 'PLAYER' && playerHand.length === 2 && !playerCalledUno) {
            setPlayerCalledUno(true);
            setUnoShout('PLAYER');
            playPaddleHit();
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_MOVE', move: { type: 'SHOUT_UNO' } });
            setTimeout(() => setUnoShout(null), 1500);
        }
    };

    const handleContestClick = () => {
        if (showContestButton) {
            setMessage("CONTRE-UNO ! +2 pour l'adversaire");
            playPaddleHit();
            setShowContestButton(false);
            drawCard('CPU', 2);
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_MOVE', move: { type: 'CONTEST_UNO' } });
        }
    };

    // --- ANIMATION & PLAY ---
    const animateCardPlay = (card: Card, index: number, actor: Turn, startRect?: DOMRect) => {
        setIsAnimating(true);
        playMove();

        const discardRect = discardPileRef.current?.getBoundingClientRect();
        if (!discardRect) {
            executeCardEffect(card, index, actor);
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
            executeCardEffect(card, index, actor);
            setIsAnimating(false);
        }, 500);
    };

    const executeCardEffect = (card: Card, index: number, actor: Turn, forcedColor?: Color) => {
        let hand = actor === 'PLAYER' ? [...playerHand] : [...cpuHand];
        
        // Remove card logic
        // For local player: Find by ID
        // For online opponent: Remove index if ID doesn't match or just pop if generic
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1);
        else hand.splice(index, 1);
        
        if (actor === 'PLAYER') setPlayerHand(hand);
        else setCpuHand(hand);

        const newDiscardPile = [...discardPile, card];
        setDiscardPile(newDiscardPile);
        
        if (card.color !== 'black') {
            setActiveColor(card.color);
        } else if (forcedColor) {
            setActiveColor(forcedColor);
        }

        // --- UNO CHECK LOGIC ---
        if (hand.length === 1) {
            if (actor === 'PLAYER') {
                if (!playerCalledUno) {
                    setMessage("OUBLI UNO ! +2");
                    playGameOver(); 
                    drawCard('PLAYER', 2, newDiscardPile);
                    if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_MOVE', move: { type: 'PENALTY_DRAW', amount: 2 } });
                }
            } else {
                // CPU/Opponent Logic
                if (gameMode === 'SOLO') {
                    // CPU Logic: 25% chance CPU forgets to say UNO
                    const cpuForgets = Math.random() < 0.25; 
                    if (cpuForgets) {
                        setShowContestButton(true);
                        setTimeout(() => setShowContestButton(false), 2000);
                    } else {
                        setUnoShout('CPU');
                        playPaddleHit();
                        setTimeout(() => setUnoShout(null), 1500);
                    }
                } else {
                    // Online: We rely on "SHOUT_UNO" event. If not received, show contest button.
                    // Actually for P2P ease, let's just trigger shout if opponent hand is 1. 
                    // To implement strict Uno rules P2P requires complex timestamping.
                    // Simplification: Auto-shout for opponent visual
                    setUnoShout('CPU');
                    playPaddleHit();
                    setTimeout(() => setUnoShout(null), 1500);
                }
            }
        }

        if (hand.length === 0) {
            handleGameOver(actor);
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
            drawCard(nextTurn, 2, newDiscardPile);
            nextTurn = actor;
        } else if (card.value === 'wild') {
            setMessage("Joker !");
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return;
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    setActiveColor(bestColor);
                    setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                } else if (forcedColor) {
                    setActiveColor(forcedColor);
                    setMessage(`ADV choisit : ${forcedColor.toUpperCase()}`);
                }
            }
        } else if (card.value === 'wild4') {
            setMessage("+4 cartes !");
            drawCard(nextTurn, 4, newDiscardPile);
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; 
            } else {
                if (gameMode === 'SOLO') {
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    setActiveColor(bestColor);
                    setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                } else if (forcedColor) {
                    setActiveColor(forcedColor);
                    setMessage(`ADV choisit : ${forcedColor.toUpperCase()}`);
                }
                nextTurn = actor;
            }
        }

        setTurn(nextTurn);
    };

    const handleOpponentMove = (move: any) => {
        if (move.type === 'PLAY') {
            // Opponent played a card
            animateCardPlay(move.card, 0, 'CPU');
            if (move.pickedColor) {
                // Defer setting color until animation finishes? 
                // executeCardEffect handles animation delay logic internally somewhat or we pass it
                // Actually executeCardEffect is called AFTER animation.
                // We need to pass pickedColor to executeCardEffect
                setTimeout(() => {
                    setActiveColor(move.pickedColor);
                    setMessage(`ADV choisit : ${move.pickedColor.toUpperCase()}`);
                }, 600);
            }
        } else if (move.type === 'DRAW') {
            drawCard('CPU', 1);
            setMessage("L'adversaire pioche");
            setTurn('PLAYER');
        } else if (move.type === 'SHOUT_UNO') {
            setUnoShout('CPU');
            playPaddleHit();
            setTimeout(() => setUnoShout(null), 1500);
        } else if (move.type === 'CONTEST_UNO') {
            setMessage("CONTRE-UNO ! +2 pour toi");
            playPaddleHit();
            drawCard('PLAYER', 2);
        } else if (move.type === 'PENALTY_DRAW') {
            drawCard('CPU', move.amount);
        }
    };

    // --- PLAYER ACTION ---
    const handlePlayerCardClick = (e: React.MouseEvent, card: Card, index: number) => {
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating) return;

        const topCard = discardPile[discardPile.length - 1];
        const isCompatible = 
            card.color === activeColor || 
            card.value === topCard.value || 
            card.color === 'black';

        if (isCompatible) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            
            // If Wild, we need to pick color first? 
            // In this implementation, animate first, then if wild, show color picker.
            // When color picked, send move online.
            animateCardPlay(card, index, 'PLAYER', rect);
            
            // If not wild, send move immediately after animation trigger
            if (card.color !== 'black' && gameMode === 'ONLINE') {
                mp.sendData({ type: 'UNO_MOVE', move: { type: 'PLAY', card } });
            }
        }
    };

    const handleColorSelect = (color: Color) => {
        setActiveColor(color);
        setGameState('playing');
        setTurn('CPU');
        
        if (gameMode === 'ONLINE') {
            // Find the wild card we just played (it's top of discard now)
            const playedCard = discardPile[discardPile.length - 1];
            mp.sendData({ type: 'UNO_MOVE', move: { type: 'PLAY', card: playedCard, pickedColor: color } });
        }
    };

    // --- CPU AI ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'CPU' && gameState === 'playing' && !isAnimating) {
            const timer = setTimeout(() => {
                const topCard = discardPile[discardPile.length - 1];
                
                const validIndices = cpuHand.map((c, i) => ({c, i})).filter(({c}) => 
                    c.color === activeColor || c.value === topCard.value || c.color === 'black'
                );

                if (validIndices.length > 0) {
                    validIndices.sort((a, b) => {
                        if (a.c.color === 'black') return 1;
                        if (a.c.value === 'draw2' || a.c.value === 'skip' || a.c.value === 'reverse') return -1;
                        return 0;
                    });
                    const move = validIndices[0];
                    animateCardPlay(move.c, move.i, 'CPU');
                } else {
                    drawCard('CPU', 1);
                    setTurn('PLAYER');
                }
            }, 1500); 
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, cpuHand, activeColor, discardPile, isAnimating, gameMode]);

    const handleGameOver = (winnerTurn: Turn) => {
        setWinner(winnerTurn);
        setGameState('gameover');
        if (winnerTurn === 'PLAYER') {
            playVictory();
            const points = cpuHand.reduce((acc, c) => acc + c.score, 0);
            setScore(points);
            const coins = Math.max(10, Math.floor(points / 2));
            addCoins(coins);
            setEarnedCoins(coins);
            updateHighScore('uno', points);
        } else {
            playGameOver();
        }
    };

    const sendChat = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || mp.mode !== 'in_game') return;
        const msg: ChatMessage = { id: Date.now(), text: chatInput.trim(), senderName: username, isMe: true, timestamp: Date.now() };
        setChatHistory(prev => [...prev, msg]);
        mp.sendData({ type: 'CHAT', text: msg.text, senderName: username });
        setChatInput('');
    };

    const sendReaction = (reactionId: string) => {
        if (gameMode === 'ONLINE' && mp.mode === 'in_game') {
            setActiveReaction({ id: reactionId, isMe: true });
            mp.sendData({ type: 'REACTION', id: reactionId });
            setTimeout(() => setActiveReaction(null), 3000);
        }
    };

    const renderReactionVisual = (reactionId: string, color: string) => {
        const reaction = REACTIONS.find(r => r.id === reactionId);
        if (!reaction) return null;
        const Icon = reaction.icon;
        const anim = reaction.anim || 'animate-bounce';
        return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
    };

    // --- SUB-COMPONENTS ---
    const CardView = ({ card, onClick, faceUp = true, small = false, style }: { card: Card, onClick?: (e: React.MouseEvent) => void, faceUp?: boolean, small?: boolean, style?: React.CSSProperties }) => {
        if (!faceUp) {
            return (
                <div style={style} className={`
                    ${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} 
                    bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center
                    shadow-lg relative overflow-hidden group
                `}>
                    <div className="absolute inset-0 opacity-10" 
                         style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px'}}>
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/50 rounded-full border border-gray-600 flex flex-col items-center justify-center relative z-10 rotate-12">
                        <span className="font-script text-neon-pink text-[10px] sm:text-xs leading-none drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">Neon</span>
                        <span className="font-black italic text-cyan-400 text-sm sm:text-lg leading-none drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">UNO</span>
                    </div>
                </div>
            );
        }

        const config = COLOR_CONFIG[card.color];
        let displayValue: string = card.value;
        let Icon = null;

        if (card.value === 'skip') Icon = Ban;
        else if (card.value === 'reverse') Icon = RotateCcw;
        else if (card.value === 'draw2') displayValue = '+2';
        else if (card.value === 'wild') Icon = Palette;
        else if (card.value === 'wild4') displayValue = '+4';

        const isPlayerHand = onClick !== undefined;
        let isPlayable = true;
        
        if (isPlayerHand && turn === 'PLAYER') {
             const topCard = discardPile[discardPile.length - 1];
             if (topCard) {
                 isPlayable = card.color === activeColor || card.value === topCard.value || card.color === 'black';
             }
        }

        const liftClass = isPlayerHand 
            ? (isPlayable 
                ? '-translate-y-6 sm:-translate-y-8 shadow-[0_0_25px_rgba(255,255,255,0.4)] z-30 brightness-110 ring-2 ring-white/70' 
                : 'brightness-50 z-0 translate-y-2') 
            : '';

        const isWild = card.color === 'black';

        return (
            <div 
                onClick={onClick}
                style={style}
                className={`
                    ${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} 
                    relative rounded-xl flex flex-col items-center justify-center overflow-hidden
                    cursor-pointer hover:scale-105 transition-all duration-300 select-none
                    shadow-xl border-2 ${config.border} ${liftClass} bg-gray-900
                `}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80 z-0`}></div>
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] z-0"></div>

                <div className={`
                    absolute inset-2 sm:inset-3 rounded-[50%_/_40%] border border-white/20 bg-black/40 backdrop-blur-sm 
                    flex items-center justify-center z-10 shadow-inner
                    ${isWild ? 'animate-pulse border-white/50' : ''}
                `}>
                    <div className={`
                        font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] 
                        ${isWild ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-4xl sm:text-6xl' : 'text-white text-3xl sm:text-5xl'}
                        flex items-center justify-center
                    `}>
                        {Icon ? <Icon size={small ? 20 : 40} strokeWidth={2.5}/> : displayValue}
                    </div>
                </div>

                <div className="absolute top-1 left-1.5 text-[10px] sm:text-sm font-bold leading-none text-white drop-shadow-md z-20">
                    {Icon ? <Icon size={12}/> : displayValue}
                </div>
                <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-sm font-bold leading-none transform rotate-180 text-white drop-shadow-md z-20">
                    {Icon ? <Icon size={12}/> : displayValue}
                </div>
            </div>
        );
    };

    const FlyingCardOverlay = () => {
        if (!flyingCard) return null;
        return (
            <div 
                className="fixed z-[100] pointer-events-none"
                style={{
                    left: 0, top: 0,
                    animation: 'flyCard 0.5s ease-in-out forwards'
                }}
            >
                <style>{`
                    @keyframes flyCard {
                        0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); }
                        100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); }
                    }
                `}</style>
                <CardView card={flyingCard.card} style={{ width: '80px', height: '112px' }} />
            </div>
        );
    };

    let spacingClass = '-space-x-12 sm:-space-x-16';
    let rotationFactor = 3; 
    
    if (playerHand.length <= 5) {
        spacingClass = '-space-x-6 sm:-space-x-8'; 
        rotationFactor = 5;
    } else if (playerHand.length <= 10) {
        spacingClass = '-space-x-12 sm:-space-x-16';
        rotationFactor = 3;
    } else {
        spacingClass = '-space-x-16 sm:-space-x-24'; 
        rotationFactor = 1.5;
    }

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-red-400 tracking-wider drop-shadow-md">LOBBY UNO</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 && (
                        <>
                            <p className="text-xs text-yellow-400 font-bold tracking-widest my-2">PARTIES DISPONIBLES</p>
                            {hostingPlayers.map(player => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                const AvatarIcon = avatar.icon;
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                            <span className="font-bold">{player.name}</span>
                                        </div>
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                    </div>
                                );
                            })}
                        </>
                    )}
                    {hostingPlayers.length === 0 && <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie disponible...<br/>Créez la vôtre !</p>}
                    {otherPlayers.length > 0 && (
                        <>
                             <p className="text-xs text-gray-500 font-bold tracking-widest my-2 pt-2 border-t border-white/10">AUTRES JOUEURS</p>
                             {otherPlayers.map(player => {
                                 const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                 const AvatarIcon = avatar.icon;
                                 return (
                                     <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/30 rounded-lg border border-white/5 opacity-70">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                             <span className="font-bold text-gray-400">{player.name}</span>
                                         </div>
                                         <span className="text-xs font-bold text-gray-500">{player.status === 'in_game' ? "EN JEU" : "INACTIF"}</span>
                                     </div>
                                 );
                             })}
                        </>
                    )}
                </div>
             </div>
         );
    };

    // --- VIEW LOGIC ---

    const initGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        if (mode === 'SOLO') {
            startNewGame();
        } else {
            setGameState('menu');
        }
    };

    const handleLocalBack = () => {
        if (gameState === 'menu' && gameMode === 'SOLO') onBack();
        else if (gameMode === 'ONLINE') {
            if (onlineStep === 'lobby') {
                setGameState('menu');
                mp.disconnect();
            } else if (onlineStep === 'game') {
                mp.leaveGame();
                setOnlineStep('lobby');
            } else {
                setGameState('menu');
                mp.disconnect();
            }
        }
        else setGameState('menu');
    };

    if (gameState === 'menu' && gameMode === 'SOLO') {
        // Initial Menu
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#ef4444]">NEON UNO</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => initGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                        <User size={24} className="text-neon-blue"/> 1 JOUEUR
                    </button>
                    <button onClick={() => initGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                        <Globe size={24} className="text-green-500"/> EN LIGNE
                    </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-300 pr-2 pb-1">NEON UNO</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-red-400 animate-spin mb-4" /><p className="text-red-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black pointer-events-none"></div>

            <FlyingCardOverlay />

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/10">{message}</span>
                </div>
                <button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else startNewGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                if (!reaction) return null;
                const positionClass = activeReaction.isMe ? 'bottom-32 right-4' : 'top-20 left-4';
                const anim = reaction.anim || 'animate-bounce';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
            })()}

            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-red-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-gray-700 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* Game Area */}
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10">
                
                {/* CPU Hand */}
                <div ref={cpuHandRef} className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-hidden h-24 sm:h-32 items-start pt-2">
                    {cpuHand.map((card, i) => (
                        <div key={card.id} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }}>
                            <CardView card={card} faceUp={false} />
                        </div>
                    ))}
                </div>

                {/* Center Table */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 relative">
                    
                    {/* Direction Indicator Area - Surrounding Both Piles */}
                    <div className={`absolute pointer-events-none transition-colors duration-500 ${COLOR_CONFIG[activeColor].text} opacity-30 z-0`}>
                        <div className="w-[320px] h-[180px] border-4 border-dashed border-current rounded-[50px] relative flex items-center justify-center">
                             {/* Arrows indicating direction (Static) */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3">
                                 {playDirection === 1 ? <ArrowRight size={32} /> : <ArrowLeft size={32} />}
                             </div>
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-black px-3">
                                 {playDirection === 1 ? <ArrowLeft size={32} /> : <ArrowRight size={32} />}
                             </div>
                        </div>
                    </div>

                    {/* Draw Pile (Deck) - Interactive */}
                    <div 
                        onClick={handleDrawPileClick}
                        className={`relative group z-10 transition-transform ${turn === 'PLAYER' && !hasDrawnThisTurn ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}
                    >
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                            {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>}
                            <Layers size={32} className="text-gray-600" />
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-black shadow">
                                {deck.length}
                            </div>
                            {turn === 'PLAYER' && !hasDrawnThisTurn && (
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">
                                    PIOCHER
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Discard Pile Area */}
                    <div className="relative flex items-center justify-center z-10" ref={discardPileRef}>
                        <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                        
                        <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">
                            {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}
                        </div>
                    </div>
                </div>

                {/* Player Area Container */}
                <div className="w-full relative px-4 z-20 pb-8 min-h-[180px] flex flex-col justify-end">
                    
                    {/* Buttons Layer */}
                    <div className="absolute -top-16 left-0 right-0 flex justify-center pointer-events-none z-30 h-16 items-end">
                        {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && (
                            <button 
                                onClick={handleUnoClick}
                                className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce transition-all active:scale-95 flex items-center gap-2 border-4 border-yellow-400"
                            >
                                <Megaphone size={24} fill="white" /> CRIER UNO !
                            </button>
                        )}

                        {showContestButton && (
                            <button 
                                onClick={handleContestClick}
                                className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse transition-all active:scale-95 flex items-center gap-2 border-4 border-red-600"
                            >
                                <AlertTriangle size={24} fill="black" /> CONTRE-UNO !
                            </button>
                        )}
                    </div>

                    {/* Player Hand - Overflow Visible Fix */}
                    <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4">
                        <div className={`flex justify-center min-w-fit px-8 ${spacingClass} items-end min-h-[160px] transition-all duration-500`}>
                            {playerHand.map((card, i) => {
                                if (flyingCard && flyingCard.card.id === card.id) {
                                    return (
                                        <div key={card.id} style={{ width: '0px', transition: 'width 0.5s' }}></div>
                                    )
                                }

                                return (
                                    <div 
                                        key={card.id} 
                                        style={{ 
                                            transform: `rotate(${(i - playerHand.length/2) * rotationFactor}deg) translateY(${Math.abs(i - playerHand.length/2) * (rotationFactor * 1.5)}px)`,
                                            zIndex: i 
                                        }}
                                        className={`transition-transform duration-300 origin-bottom`}
                                    >
                                        <CardView card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {gameMode === 'ONLINE' && gameState !== 'gameover' && !isReady && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-red-500 mb-2" size={48} />
                    <p className="text-white font-bold animate-pulse">SYNCHRONISATION...</p>
                </div>
            )}

            {gameMode === 'ONLINE' && gameState !== 'gameover' && (
                <div className="w-full max-w-lg mt-auto z-20 px-2 flex flex-col gap-2 pb-4 absolute bottom-0 left-1/2 -translate-x-1/2">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar w-full">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    {chatHistory.length > 0 && (
                        <div className="flex flex-col gap-1 max-h-16 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                            {chatHistory.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${msg.isMe ? 'bg-purple-500/20 text-purple-100' : 'bg-gray-700/50 text-gray-300'}`}>{!msg.isMe && <span className="mr-1 opacity-50">{msg.senderName}:</span>}{msg.text}</div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                    <form onSubmit={sendChat} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-xl disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            )}

            {/* Overlays */}
            {unoShout && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 animate-bounce drop-shadow-[0_0_25px_rgba(255,0,0,0.8)] transform -rotate-12">
                        UNO !
                    </div>
                </div>
            )}

            {gameState === 'color_select' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in">
                    <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">CHOISIR UNE COULEUR</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {COLORS.map(c => (
                            <button 
                                key={c}
                                onClick={() => handleColorSelect(c)}
                                className={`w-32 h-32 rounded-2xl border-4 ${COLOR_CONFIG[c].border} bg-gray-900 hover:scale-105 transition-transform flex items-center justify-center group`}
                            >
                                <div className={`w-16 h-16 rounded-full ${COLOR_CONFIG[c].text.replace('text', 'bg')} shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform`}></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(gameState === 'gameover' || opponentLeft) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in zoom-in p-6">
                    {opponentLeft ? (
                        <>
                            <LogOut size={48} className="text-red-500 mb-2" />
                            <h2 className="text-3xl font-black italic text-white mb-2">ADVERSAIRE PARTI</h2>
                        </>
                    ) : winner === 'PLAYER' ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                            <h2 className="text-5xl font-black text-white italic mb-2">VICTOIRE !</h2>
                            <div className="flex flex-col items-center gap-2 mb-8">
                                <span className="text-gray-400 font-bold tracking-widest text-sm">SCORE FINAL</span>
                                <span className="text-4xl font-mono text-neon-blue">{score}</span>
                            </div>
                            {earnedCoins > 0 && (
                                <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse">
                                    <Coins className="text-yellow-400" size={24} />
                                    <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                            <h2 className="text-5xl font-black text-white italic mb-4">DÉFAITE...</h2>
                            <p className="text-gray-400 mb-8 text-center">L'adversaire a vidé sa main.</p>
                        </>
                    )}
                    
                    <div className="flex gap-4">
                        <button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else startNewGame(); }} className="px-8 py-4 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                            <RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}
                        </button>
                        <button onClick={handleLocalBack} className="px-8 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">
                            {gameMode === 'ONLINE' ? 'QUITTER' : 'MENU'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
