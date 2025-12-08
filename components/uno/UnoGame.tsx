import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, User, Cpu, Ban, RotateCcw, Plus, Palette, Layers } from 'lucide-react';
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

type Turn = 'PLAYER' | 'CPU';
type GameState = 'playing' | 'gameover' | 'color_select';

// --- CONFIG ---
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];

// Tailwind color maps
const COLOR_MAP: Record<Color, string> = {
    red: 'border-red-500 text-red-500 shadow-[0_0_10px_#ef4444]',
    blue: 'border-cyan-500 text-cyan-500 shadow-[0_0_10px_#06b6d4]',
    green: 'border-green-500 text-green-500 shadow-[0_0_10px_#22c55e]',
    yellow: 'border-yellow-400 text-yellow-400 shadow-[0_0_10px_#facc15]',
    black: 'border-purple-500 text-purple-500 shadow-[0_0_10px_#a855f7] animate-pulse',
};

const BG_COLOR_MAP: Record<Color, string> = {
    red: 'bg-red-500/20',
    blue: 'bg-cyan-500/20',
    green: 'bg-green-500/20',
    yellow: 'bg-yellow-400/20',
    black: 'bg-purple-500/20',
};

// --- LOGIC ---
const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;

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
    const [activeColor, setActiveColor] = useState<Color>('black'); // The color effective on board (for wilds)
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.uno || 0;

    // --- GAME LOOP ---

    // Init
    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        const newDeck = generateDeck();
        const pHand = newDeck.splice(0, 7);
        const cHand = newDeck.splice(0, 7);
        
        // Ensure first card is not a wild draw 4 (simplified: ensure not black)
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
        resumeAudio();
    };

    // Draw Card Logic
    const drawCard = (target: Turn, amount: number = 1) => {
        playLand();
        let currentDeck = [...deck];
        let currentDiscard = [...discardPile];
        const drawnCards: Card[] = [];

        for(let i=0; i<amount; i++) {
            if (currentDeck.length === 0) {
                // Reshuffle discard into deck (keep top)
                if (currentDiscard.length > 1) {
                    const top = currentDiscard.pop()!;
                    currentDeck = currentDiscard.sort(() => Math.random() - 0.5);
                    currentDiscard = [top];
                    setMessage("Mélange du talon...");
                } else {
                    break; // No cards left
                }
            }
            drawnCards.push(currentDeck.pop()!);
        }

        setDeck(currentDeck);
        setDiscardPile(currentDiscard);

        if (target === 'PLAYER') setPlayerHand(prev => [...prev, ...drawnCards]);
        else setCpuHand(prev => [...prev, ...drawnCards]);
        
        return drawnCards;
    };

    // Play Card Logic
    const playCard = (cardIndex: number, actor: Turn) => {
        playMove();
        let hand = actor === 'PLAYER' ? [...playerHand] : [...cpuHand];
        const card = hand.splice(cardIndex, 1)[0];
        
        // Update Hands
        if (actor === 'PLAYER') setPlayerHand(hand);
        else setCpuHand(hand);

        // Update Pile
        setDiscardPile(prev => [...prev, card]);
        
        // Update Color (unless Wild, which handles it later)
        if (card.color !== 'black') {
            setActiveColor(card.color);
        }

        // UNO Check
        if (hand.length === 1) {
            setUnoShout(actor);
            playPaddleHit(); // Alert sound
            setTimeout(() => setUnoShout(null), 2000);
        }

        // Win Check
        if (hand.length === 0) {
            handleGameOver(actor);
            return;
        }

        // Special Effects
        let nextTurn: Turn = actor === 'PLAYER' ? 'CPU' : 'PLAYER';
        
        if (card.value === 'skip') {
            setMessage("Passe ton tour !");
            nextTurn = actor; // Same player plays again
        } else if (card.value === 'reverse') {
            setMessage("Sens inverse !");
            nextTurn = actor; // In 2 player, reverse = skip
        } else if (card.value === 'draw2') {
            setMessage("+2 cartes !");
            drawCard(nextTurn, 2);
            nextTurn = actor; // Skip after draw
        } else if (card.value === 'wild') {
            setMessage("Joker !");
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; // Stop here, wait for color selection
            } else {
                // CPU picks random valid color (or smart pick)
                const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                setActiveColor(bestColor);
                setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
            }
        } else if (card.value === 'wild4') {
            setMessage("+4 cartes !");
            drawCard(nextTurn, 4);
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; 
            } else {
                const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                setActiveColor(bestColor);
                setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                nextTurn = actor; // Skip opponent after +4
            }
        }

        setTurn(nextTurn);
    };

    // --- PLAYER ACTIONS ---

    const handlePlayerCardClick = (card: Card, index: number) => {
        if (turn !== 'PLAYER' || gameState !== 'playing') return;

        const topCard = discardPile[discardPile.length - 1];
        const isCompatible = 
            card.color === activeColor || 
            card.value === topCard.value || 
            card.color === 'black';

        if (isCompatible) {
            playCard(index, 'PLAYER');
        } else {
            // Shake visual (todo)
        }
    };

    const handleDrawClick = () => {
        if (turn !== 'PLAYER' || gameState !== 'playing') return;
        const drawn = drawCard('PLAYER', 1);
        // Play immediately if valid? Standard rule is usually optional, but let's just add to hand for simplicity.
        // Optional: Auto-play if valid to speed up? Let's keep manual.
        
        // Pass turn if drawn card is not playable immediately (Standard rule variant: draw 1 and pass)
        // Let's implement: Draw 1, if playable you CAN play, else pass.
        // For simplicity in UI: Draw 1 -> Pass turn automatically to keep flow fast.
        
        // Check if playable
        const card = drawn[0];
        const isCompatible = card.color === activeColor || card.value === discardPile[discardPile.length-1].value || card.color === 'black';
        
        if (isCompatible) {
            setMessage("Carte jouable piochée !");
            // Give user a chance to play it? Or auto pass?
            // Let's pass to keep it simple for mobile arcade feel
            // Actually, better UX: Add to hand, user must play or pass. 
            // BUT to avoid "Pass" button, let's auto-pass if not playable.
            // If playable, user stays on turn? No, simpler: Draw = Pass turn.
            setTurn('CPU'); 
        } else {
            setTurn('CPU');
        }
    };

    const handleColorSelect = (color: Color) => {
        setActiveColor(color);
        setGameState('playing');
        setTurn('CPU'); // Pass turn after selecting color
    };

    // --- CPU AI ---
    useEffect(() => {
        if (turn === 'CPU' && gameState === 'playing') {
            const timer = setTimeout(() => {
                const topCard = discardPile[discardPile.length - 1];
                
                // Find valid moves
                const validIndices = cpuHand.map((c, i) => ({c, i})).filter(({c}) => 
                    c.color === activeColor || c.value === topCard.value || c.color === 'black'
                );

                if (validIndices.length > 0) {
                    // Simple AI: Prioritize Special cards if hand size > 2, else get rid of regular
                    // Or simply random valid
                    // Let's try to match color first to keep changing colors minimized
                    validIndices.sort((a, b) => {
                        if (a.c.color === 'black') return 1; // Play wilds last
                        if (a.c.value === 'draw2' || a.c.value === 'skip' || a.c.value === 'reverse') return -1; // Aggressive
                        return 0;
                    });
                    
                    playCard(validIndices[0].i, 'CPU');
                } else {
                    // Draw
                    drawCard('CPU', 1);
                    setTurn('PLAYER');
                }

            }, 1500); // Thinking time
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, cpuHand, activeColor, discardPile]);


    const handleGameOver = (winnerTurn: Turn) => {
        setWinner(winnerTurn);
        setGameState('gameover');
        if (winnerTurn === 'PLAYER') {
            playVictory();
            // Calculate Score: Sum of CPU hand
            const points = cpuHand.reduce((acc, c) => acc + c.score, 0);
            setScore(points);
            
            // Coins = Points / 2
            const coins = Math.max(10, Math.floor(points / 2));
            addCoins(coins);
            setEarnedCoins(coins);
            
            updateHighScore('uno', points);
        } else {
            playGameOver();
        }
    };

    // --- RENDERING ---

    const CardView = ({ card, onClick, faceUp = true, small = false }: { card: Card, onClick?: () => void, faceUp?: boolean, small?: boolean }) => {
        if (!faceUp) {
            return (
                <div className={`
                    ${small ? 'w-10 h-14' : 'w-16 h-24 sm:w-24 sm:h-36'} 
                    bg-gray-900 border-2 border-gray-700 rounded-lg flex items-center justify-center
                    shadow-lg relative overflow-hidden
                `}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:4px_4px]"></div>
                    <span className="font-black italic text-gray-700 text-xs transform -rotate-45">UNO</span>
                </div>
            );
        }

        const colorClass = COLOR_MAP[card.color];
        const bgClass = BG_COLOR_MAP[card.color];
        
        let displayValue: string = card.value;
        let Icon = null;

        if (card.value === 'skip') Icon = Ban;
        else if (card.value === 'reverse') Icon = RotateCcw;
        else if (card.value === 'draw2') displayValue = '+2';
        else if (card.value === 'wild') Icon = Palette;
        else if (card.value === 'wild4') displayValue = '+4';

        return (
            <div 
                onClick={onClick}
                className={`
                    ${small ? 'w-10 h-14' : 'w-16 h-24 sm:w-24 sm:h-36'} 
                    ${bgClass} border-2 ${colorClass} rounded-lg flex flex-col items-center justify-center
                    relative cursor-pointer hover:-translate-y-2 transition-transform duration-200 select-none
                `}
            >
                <div className="absolute top-1 left-1 text-[10px] font-bold leading-none">{Icon ? <Icon size={10}/> : displayValue}</div>
                <div className="absolute bottom-1 right-1 text-[10px] font-bold leading-none transform rotate-180">{Icon ? <Icon size={10}/> : displayValue}</div>
                
                <div className="text-2xl sm:text-4xl font-black drop-shadow-md">
                    {Icon ? <Icon size={small ? 16 : 32}/> : displayValue}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans">
            {/* Background Effect */}
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 pointer-events-none ${BG_COLOR_MAP[activeColor] || 'bg-gray-900'}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest">{message}</span>
                </div>
                <button onClick={startNewGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10">
                
                {/* CPU Hand (Top) */}
                <div className="flex justify-center -space-x-4 px-4 overflow-hidden h-24 sm:h-32 items-start">
                    {cpuHand.map((card, i) => (
                        <div key={card.id} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg)` }}>
                            <CardView card={card} faceUp={false} />
                        </div>
                    ))}
                </div>

                {/* Center Table */}
                <div className="flex-1 flex items-center justify-center gap-8 sm:gap-16">
                    {/* Draw Pile */}
                    <div onClick={handleDrawClick} className="relative cursor-pointer group">
                        <div className="absolute -inset-1 bg-white/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                            <Layers size={32} className="text-gray-600" />
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-black shadow">
                                {deck.length}
                            </div>
                        </div>
                    </div>

                    {/* Discard Pile */}
                    <div className="relative">
                        <div className={`absolute -inset-4 rounded-full blur-xl opacity-40 transition-colors duration-500 ${COLOR_MAP[activeColor].split(' ')[0].replace('border', 'bg')}`}></div>
                        <div className="transform rotate-6">
                            {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}
                        </div>
                        {/* Active Color Indicator */}
                        <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full ${COLOR_MAP[activeColor].split(' ')[0].replace('border', 'bg')} shadow-[0_0_10px_currentColor]`}></div>
                    </div>
                </div>

                {/* Player Hand (Bottom) */}
                <div className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-x-visible items-end pb-4 min-h-[120px]">
                    {playerHand.map((card, i) => {
                        const isHover = turn === 'PLAYER';
                        return (
                            <div 
                                key={card.id} 
                                style={{ 
                                    transform: `translateY(${isHover ? 0 : 20}px) rotate(${(i - playerHand.length/2) * 2}deg)`,
                                    zIndex: i 
                                }}
                                className="transition-transform duration-300 hover:-translate-y-6 hover:z-50 hover:scale-110"
                            >
                                <CardView card={card} onClick={() => handlePlayerCardClick(card, i)} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Overlays */}
            
            {/* Uno Shout */}
            {unoShout && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 animate-bounce drop-shadow-[0_0_25px_rgba(255,0,0,0.8)] transform -rotate-12">
                        UNO !
                    </div>
                </div>
            )}

            {/* Color Selector */}
            {gameState === 'color_select' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in">
                    <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">CHOISIR UNE COULEUR</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {COLORS.map(c => (
                            <button 
                                key={c}
                                onClick={() => handleColorSelect(c)}
                                className={`w-32 h-32 rounded-2xl border-4 ${COLOR_MAP[c]} bg-gray-900 hover:scale-105 transition-transform flex items-center justify-center`}
                            >
                                <div className={`w-16 h-16 rounded-full ${BG_COLOR_MAP[c].replace('/20', '')} shadow-[0_0_20px_currentColor]`}></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Over */}
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