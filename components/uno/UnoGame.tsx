import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, User, Cpu, Ban, RotateCcw, Plus, Palette, Layers, Hexagon, ChevronRight } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
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
type GameState = 'playing' | 'gameover' | 'color_select';

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

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins }) => {
    // State
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [cpuHand, setCpuHand] = useState<Card[]>([]);
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    // Direction: 1 = Clockwise, -1 = Counter-Clockwise
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);

    // Animation States
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();

    // --- GAME LOOP ---

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
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
        resumeAudio();
    };

    // Draw Card Logic with optional manual discard pile state to prevent race conditions
    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: Card[]) => {
        playLand();
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
                    break;
                }
            }
            drawnCards.push(currentDeck.pop()!);
        }

        setDeck(currentDeck);
        
        if (didReshuffle) {
            setDiscardPile(currentDiscard);
        }

        if (target === 'PLAYER') setPlayerHand(prev => [...prev, ...drawnCards]);
        else setCpuHand(prev => [...prev, ...drawnCards]);
        
        return drawnCards;
    };

    useEffect(() => {
        if (turn === 'PLAYER') {
            setHasDrawnThisTurn(false);
        }
    }, [turn]);

    // --- AUTO DRAW LOGIC ---
    useEffect(() => {
        if (turn === 'PLAYER' && gameState === 'playing' && !isAnimating) {
            const topCard = discardPile[discardPile.length - 1];
            if (!topCard) return;

            const canPlay = playerHand.some(c => 
                c.color === activeColor || 
                c.value === topCard.value || 
                c.color === 'black'
            );

            if (!canPlay) {
                if (!hasDrawnThisTurn) {
                    const timer = setTimeout(() => {
                        setMessage("Bloqué... Pioche auto !");
                        drawCard('PLAYER', 1);
                        setHasDrawnThisTurn(true);
                    }, 1000);
                    return () => clearTimeout(timer);
                } else {
                    const timer = setTimeout(() => {
                        setMessage("Toujours rien... Passe !");
                        setTurn('CPU');
                    }, 1500);
                    return () => clearTimeout(timer);
                }
            } else {
                if (hasDrawnThisTurn) {
                    setMessage("Tu peux jouer !");
                }
            }
        }
    }, [turn, playerHand, activeColor, discardPile, gameState, hasDrawnThisTurn, isAnimating]);

    // --- ANIMATION ---
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

    const executeCardEffect = (card: Card, index: number, actor: Turn) => {
        let hand = actor === 'PLAYER' ? [...playerHand] : [...cpuHand];
        
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) {
            hand.splice(cardInHandIndex, 1);
        } else {
            hand.splice(index, 1);
        }
        
        if (actor === 'PLAYER') setPlayerHand(hand);
        else setCpuHand(hand);

        // Update pile immediately to prevent race conditions with drawCard
        const newDiscardPile = [...discardPile, card];
        setDiscardPile(newDiscardPile);
        
        if (card.color !== 'black') {
            setActiveColor(card.color);
        }

        if (hand.length === 1) {
            setUnoShout(actor);
            playPaddleHit();
            setTimeout(() => setUnoShout(null), 2000);
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
            nextTurn = actor; // In 2 player, reverse acts like skip
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
                const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                setActiveColor(bestColor);
                setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
            }
        } else if (card.value === 'wild4') {
            setMessage("+4 cartes !");
            drawCard(nextTurn, 4, newDiscardPile);
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; 
            } else {
                const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                setActiveColor(bestColor);
                setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                nextTurn = actor;
            }
        }

        setTurn(nextTurn);
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
            animateCardPlay(card, index, 'PLAYER', rect);
        }
    };

    const handleColorSelect = (color: Color) => {
        setActiveColor(color);
        setGameState('playing');
        setTurn('CPU');
    };

    // --- CPU AI ---
    useEffect(() => {
        if (turn === 'CPU' && gameState === 'playing' && !isAnimating) {
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

            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, cpuHand, activeColor, discardPile, isAnimating]);

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
                    <div className="absolute -inset-1 bg-gradient-to-tr from-transparent via-white/5 to-transparent group-hover:via-white/10 transition-all"></div>
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
                ? '-translate-y-4 sm:-translate-y-6 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-20 brightness-110 ring-2 ring-white/50' 
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
                
                {isWild && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-30"></div>
                )}
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

    // Calculate spacing
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

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black pointer-events-none"></div>

            <FlyingCardOverlay />

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/10">{message}</span>
                </div>
                <button onClick={startNewGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

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
                <div className="flex-1 flex items-center justify-center gap-8 sm:gap-16">
                    {/* Draw Pile */}
                    <div className="relative group opacity-80 cursor-not-allowed">
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                            <Layers size={32} className="text-gray-600" />
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-black shadow">
                                {deck.length}
                            </div>
                        </div>
                    </div>

                    {/* Discard Pile Area */}
                    <div className="relative flex items-center justify-center" ref={discardPileRef}>
                        {/* DIRECTION RING INDICATOR */}
                        <div className={`absolute -inset-[50px] pointer-events-none transition-colors duration-500 ${COLOR_CONFIG[activeColor].text}`}>
                            <div 
                                className="w-full h-full absolute inset-0 flex items-center justify-center"
                                style={{
                                    animation: `spin 4s linear infinite`,
                                    animationDirection: playDirection === 1 ? 'normal' : 'reverse'
                                }}
                            >
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                {[0, 120, 240].map((deg) => (
                                    <div 
                                        key={deg} 
                                        className="absolute w-8 h-8 flex items-center justify-center"
                                        style={{
                                            transform: `rotate(${deg}deg) translate(80px) rotate(90deg)`
                                        }}
                                    >
                                        <ChevronRight size={32} strokeWidth={4} className="drop-shadow-[0_0_5px_currentColor]" />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-20 border-current animate-pulse"></div>
                        </div>

                        <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                        
                        <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">
                            {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}
                        </div>
                    </div>
                </div>

                {/* Player Hand */}
                <div className="w-full overflow-x-auto pb-6 px-4 no-scrollbar z-20">
                    <div className={`flex justify-center min-w-fit px-8 ${spacingClass} items-end min-h-[160px] pt-4 transition-all duration-500`}>
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

            {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in zoom-in p-6">
                    {winner === 'PLAYER' ? (
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
                            <Cpu size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                            <h2 className="text-5xl font-black text-white italic mb-4">DÉFAITE...</h2>
                            <p className="text-gray-400 mb-8 text-center">L'ordinateur a vidé sa main.</p>
                        </>
                    )}
                    
                    <div className="flex gap-4">
                        <button onClick={startNewGame} className="px-8 py-4 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                            <RefreshCw size={20} /> REJOUER
                        </button>
                        <button onClick={onBack} className="px-8 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">
                            MENU
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};