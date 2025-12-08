
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, RotateCw, RotateCcw, Layers, ArrowLeft, Ban, Repeat, Plus, Palette } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

type Color = 'red' | 'blue' | 'green' | 'yellow' | 'black';
type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

interface Card {
    id: string;
    color: Color;
    value: Value;
}

interface Player {
    id: number;
    name: string;
    hand: Card[];
    isBot: boolean;
}

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
// Note: black is not in base colors for generation, only for wild cards

const COLOR_CONFIG: Record<string, { bg: string, text: string, border: string, shadow: string }> = {
    red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-600', shadow: 'shadow-red-500/50' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-600', shadow: 'shadow-blue-500/50' },
    green: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-600', shadow: 'shadow-green-500/50' },
    yellow: { bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-500', shadow: 'shadow-yellow-400/50' },
    black: { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-600', shadow: 'shadow-gray-500/50' },
};

const CardView = ({ card, onClick, disabled }: { card: Card, onClick?: () => void, disabled?: boolean }) => {
    const config = COLOR_CONFIG[card.color];
    
    let Content = <span className="text-4xl font-black">{card.value}</span>;
    if (card.value === 'skip') Content = <Ban size={32} />;
    if (card.value === 'reverse') Content = <Repeat size={32} />;
    if (card.value === 'draw2') Content = <div className="flex"><Plus size={20}/><span className="text-2xl font-bold">2</span></div>;
    if (card.value === 'wild') Content = <Palette size={32} />;
    if (card.value === 'wild4') Content = <div className="flex"><Plus size={20}/><span className="text-2xl font-bold">4</span></div>;

    return (
        <div 
            onClick={!disabled ? onClick : undefined}
            className={`
                w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 flex flex-col items-center justify-center shadow-lg relative
                transition-all duration-200 
                ${config.bg} ${config.border} ${config.shadow}
                ${!disabled && onClick ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:brightness-110' : ''}
                ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
        >
            <div className="absolute top-1 left-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-black opacity-80">
                {card.value === 'skip' ? 'S' : card.value === 'reverse' ? 'R' : card.value === 'draw2' ? '+2' : card.value === 'wild' ? 'W' : card.value === 'wild4' ? '+4' : card.value}
            </div>
            <div className="w-12 h-18 sm:w-16 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-white drop-shadow-md">
                {Content}
            </div>
            <div className="absolute bottom-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-black opacity-80 rotate-180">
                {card.value === 'skip' ? 'S' : card.value === 'reverse' ? 'R' : card.value === 'draw2' ? '+2' : card.value === 'wild' ? 'W' : card.value === 'wild4' ? '+4' : card.value}
            </div>
        </div>
    );
};

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins }) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.uno || 0;

    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [playDirection, setPlayDirection] = useState<1 | -1>(1); // 1 = clockwise, -1 = counter-clockwise
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<Player | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [drawCount, setDrawCount] = useState(0);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const botTimeoutRef = useRef<any>(null);

    // Initialize Deck
    const createDeck = () => {
        const newDeck: Card[] = [];
        COLORS.forEach(color => {
            // 0
            newDeck.push({ id: `${color}-0`, color, value: '0' });
            // 1-9 twice
            for (let i = 1; i <= 9; i++) {
                newDeck.push({ id: `${color}-${i}-1`, color, value: i.toString() as Value });
                newDeck.push({ id: `${color}-${i}-2`, color, value: i.toString() as Value });
            }
            // Action cards twice
            newDeck.push({ id: `${color}-skip-1`, color, value: 'skip' });
            newDeck.push({ id: `${color}-skip-2`, color, value: 'skip' });
            newDeck.push({ id: `${color}-reverse-1`, color, value: 'reverse' });
            newDeck.push({ id: `${color}-reverse-2`, color, value: 'reverse' });
            newDeck.push({ id: `${color}-draw2-1`, color, value: 'draw2' });
            newDeck.push({ id: `${color}-draw2-2`, color, value: 'draw2' });
        });
        // Wilds
        for (let i = 0; i < 4; i++) {
            newDeck.push({ id: `wild-${i}`, color: 'black', value: 'wild' });
            newDeck.push({ id: `wild4-${i}`, color: 'black', value: 'wild4' });
        }
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const startGame = useCallback(() => {
        const fullDeck = createDeck();
        const initialPlayers: Player[] = [
            { id: 0, name: 'Toi', hand: [], isBot: false },
            { id: 1, name: 'Bot 1', hand: [], isBot: true },
            { id: 2, name: 'Bot 2', hand: [], isBot: true },
            { id: 3, name: 'Bot 3', hand: [], isBot: true },
        ];

        // Deal 7 cards to each
        initialPlayers.forEach(p => {
            p.hand = fullDeck.splice(0, 7);
        });

        // Initial discard
        let initialDiscard = fullDeck.pop()!;
        while (initialDiscard.color === 'black') {
            // Put it back and shuffle if wild is first
            fullDeck.unshift(initialDiscard);
            fullDeck.sort(() => Math.random() - 0.5);
            initialDiscard = fullDeck.pop()!;
        }

        setDeck(fullDeck);
        setDiscardPile([initialDiscard]);
        setPlayers(initialPlayers);
        setCurrentPlayer(0);
        setPlayDirection(1);
        setActiveColor(initialDiscard.color);
        setIsGameOver(false);
        setWinner(null);
        setDrawCount(0);
        setEarnedCoins(0);
        resumeAudio();
    }, [resumeAudio]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    // Turn Management
    useEffect(() => {
        if (isGameOver) return;

        const player = players[currentPlayer];
        if (player && player.isBot) {
            botTimeoutRef.current = setTimeout(() => {
                botTurn(player);
            }, 1500);
        }

        return () => clearTimeout(botTimeoutRef.current);
    }, [currentPlayer, players, isGameOver, activeColor, discardPile]);

    const nextTurn = (skip = false) => {
        setCurrentPlayer(prev => {
            let next = prev + playDirection;
            if (skip) next += playDirection;
            
            // Wrap around
            if (next >= players.length) next = next % players.length;
            if (next < 0) next = players.length + (next % players.length);
            
            return next;
        });
    };

    const drawCard = (count = 1) => {
        if (deck.length < count) {
            // Reshuffle discard pile (except top) into deck
            const top = discardPile[discardPile.length - 1];
            const toShuffle = discardPile.slice(0, discardPile.length - 1);
            if (toShuffle.length === 0 && deck.length === 0) return; // No cards left
            
            const newDeck = [...deck, ...toShuffle].sort(() => Math.random() - 0.5);
            setDeck(newDeck);
            setDiscardPile([top]);
            // Wait for state update then recurse? Or simpler logic:
            // For now assume deck handles it or simple limit
        }

        setDeck(prevDeck => {
            const newDeck = [...prevDeck];
            const drawnCards = newDeck.splice(0, count);
            
            setPlayers(prevPlayers => {
                const newPlayers = [...prevPlayers];
                newPlayers[currentPlayer].hand.push(...drawnCards);
                return newPlayers;
            });
            
            // If human drew, play sound
            if (players[currentPlayer].id === 0) playMove();
            
            return newDeck;
        });
        
        // After draw, simple rule: pass turn (to keep it fast)
        // Or check if playable? Let's implement auto-pass for simplicity on draw
        // Unless it was a draw2/wild4 penalty, which happens before turn logic usually.
        // But here drawCard is called manually or by penalty.
    };

    const handleDrawClick = () => {
        if (drawCount > 0) return; // Already drew
        drawCard(1);
        setDrawCount(1);
        // Timeout to pass turn so user sees the card
        setTimeout(() => {
            nextTurn();
            setDrawCount(0);
        }, 500);
    };

    const isValidPlay = (card: Card) => {
        const top = discardPile[discardPile.length - 1];
        if (card.color === 'black') return true; // Wilds always valid
        if (card.color === activeColor) return true;
        if (card.value === top.value) return true;
        return false;
    };

    const playCard = (card: Card, colorOverride?: Color) => {
        // Remove from hand
        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            const pIndex = newPlayers.findIndex(p => p.id === players[currentPlayer].id);
            newPlayers[pIndex].hand = newPlayers[pIndex].hand.filter(c => c.id !== card.id);
            return newPlayers;
        });

        // Add to discard
        setDiscardPile(prev => [...prev, card]);
        
        // Effects
        let nextSkip = false;
        
        // Color
        if (card.color === 'black') {
            setActiveColor(colorOverride || 'red'); // Default fallback
        } else {
            setActiveColor(card.color);
        }

        playLand(); // Sound

        if (card.value === 'skip') nextSkip = true;
        if (card.value === 'reverse') setPlayDirection(prev => prev * -1 as 1 | -1);
        if (card.value === 'draw2') {
            // Apply draw to next player immediately (simplified)
            // Ideally should be cumulative but simple version:
            let nextP = currentPlayer + playDirection;
            if (nextP >= players.length) nextP %= players.length;
            if (nextP < 0) nextP += players.length;
            
            // We need to modify the players state again, tricky in functional updates.
            // Let's do it in a timeout or helper.
            // Simplified: Next player draws 2 AND is skipped.
            setTimeout(() => {
                // Determine next player index
                let nextPIdx = currentPlayer + playDirection;
                if (nextPIdx >= 4) nextPIdx %= 4;
                if (nextPIdx < 0) nextPIdx += 4;
                
                // Draw logic for next player (simulated)
                setDeck(d => {
                    const nd = [...d];
                    const cards = nd.splice(0, 2);
                    setPlayers(ps => {
                        const nps = [...ps];
                        nps[nextPIdx].hand.push(...cards);
                        return nps;
                    });
                    return nd;
                });
            }, 200);
            nextSkip = true;
        }
        if (card.value === 'wild4') {
             setTimeout(() => {
                let nextPIdx = currentPlayer + playDirection;
                if (nextPIdx >= 4) nextPIdx %= 4;
                if (nextPIdx < 0) nextPIdx += 4;
                
                setDeck(d => {
                    const nd = [...d];
                    const cards = nd.splice(0, 4);
                    setPlayers(ps => {
                        const nps = [...ps];
                        nps[nextPIdx].hand.push(...cards);
                        return nps;
                    });
                    return nd;
                });
            }, 200);
            nextSkip = true;
        }

        // Check Win
        if (players[currentPlayer].hand.length === 1) { // Was 1 before this play, now 0
            const winner = players[currentPlayer];
            setWinner(winner);
            setIsGameOver(true);
            if (winner.id === 0) {
                playVictory();
                addCoins(100);
                setEarnedCoins(100);
                updateHighScore('uno', 100); // Add score
            } else {
                playGameOver();
            }
            return;
        }

        nextTurn(nextSkip);
    };

    const handlePlayerCardClick = (card: Card) => {
        if (currentPlayer !== 0 || isGameOver) return;
        
        if (isValidPlay(card)) {
            if (card.color === 'black') {
                // Show color picker
                // Temporary hack: store pending card and show modal
                // For simplicity, we'll store card in a ref or state
                // and show overlay.
                // Let's assume we just picked red for now or implement picker
                setShowColorPicker(true);
                // Storing card to play in a ref or state would be needed here
                // For this implementation, we'll use a hack to pass card to modal
                (window as any).pendingCard = card;
            } else {
                playCard(card);
            }
        } else {
            playPaddleHit(); // Error sound
        }
    };

    const handleColorPick = (color: Color) => {
        const card = (window as any).pendingCard;
        if (card) {
            playCard(card, color);
            (window as any).pendingCard = null;
        }
        setShowColorPicker(false);
    };

    const botTurn = (player: Player) => {
        // Simple AI
        const validCards = player.hand.filter(c => isValidPlay(c));
        
        if (validCards.length > 0) {
            const card = validCards[0]; // Pick first valid
            let color = 'red';
            if (card.color === 'black') {
                // Pick random color or color they have most of
                color = COLORS[Math.floor(Math.random() * 4)];
            }
            playCard(card, color as Color);
        } else {
            // Draw
            drawCard(1);
            setTimeout(() => nextTurn(), 500);
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

            <div className="w-full max-w-2xl flex items-center justify-between z-10 mb-2 shrink-0 h-[50px]">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <h1 className="text-xl sm:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)] pr-2 pb-1">NEON UNO</h1>
                <button onClick={startGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full max-w-4xl relative flex flex-col justify-between py-4">
                
                {/* Top Bots */}
                <div className="flex justify-center gap-8 sm:gap-16">
                    <div className={`flex flex-col items-center ${currentPlayer === 2 ? 'scale-110 drop-shadow-[0_0_10px_white]' : 'opacity-70'}`}>
                        <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                            <span className="font-bold">B2</span>
                            <div className="absolute -bottom-2 bg-black px-2 rounded-full text-xs border border-white/20">{players[2]?.hand.length}</div>
                        </div>
                    </div>
                </div>

                {/* Middle Row (Bot 1, Table, Bot 3) */}
                <div className="flex items-center justify-between px-4 sm:px-12 flex-1">
                    <div className={`flex flex-col items-center ${currentPlayer === 1 ? 'scale-110 drop-shadow-[0_0_10px_white]' : 'opacity-70'}`}>
                        <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                            <span className="font-bold">B1</span>
                            <div className="absolute -bottom-2 bg-black px-2 rounded-full text-xs border border-white/20">{players[1]?.hand.length}</div>
                        </div>
                    </div>

                    {/* Center Table */}
                    <div className="flex-1 flex items-center justify-center relative">
                        
                        {/* DIRECTION INDICATOR (Surrounds both decks) */}
                        <div className={`absolute pointer-events-none flex items-center justify-center transition-colors duration-500 ${COLOR_CONFIG[activeColor].text} opacity-10 scale-150 sm:scale-100`}>
                            {playDirection === 1 ? (
                                <RotateCw size={320} strokeWidth={0.8} />
                            ) : (
                                <RotateCcw size={320} strokeWidth={0.8} />
                            )}
                        </div>

                        <div className="flex items-center gap-8 sm:gap-16 z-10">
                            {/* Draw Pile */}
                            <div className="relative group opacity-80 cursor-pointer" onClick={() => currentPlayer === 0 && !isGameOver && handleDrawClick()}>
                                <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative transition-transform active:scale-95">
                                    <Layers size={32} className="text-gray-600" />
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-black shadow">
                                        {deck.length}
                                    </div>
                                </div>
                            </div>

                            {/* Discard Pile Area */}
                            <div className="relative flex items-center justify-center" ref={discardPileRef}>
                                <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                                
                                <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">
                                    {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} disabled />}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`flex flex-col items-center ${currentPlayer === 3 ? 'scale-110 drop-shadow-[0_0_10px_white]' : 'opacity-70'}`}>
                        <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                            <span className="font-bold">B3</span>
                            <div className="absolute -bottom-2 bg-black px-2 rounded-full text-xs border border-white/20">{players[3]?.hand.length}</div>
                        </div>
                    </div>
                </div>

                {/* Player Hand */}
                <div className="flex justify-center w-full px-2 overflow-visible z-20">
                    <div className="flex -space-x-8 sm:-space-x-12 overflow-x-auto p-4 min-h-[140px] items-end no-scrollbar">
                        {players[0]?.hand.map((card, i) => (
                            <div key={card.id} style={{ transform: `rotate(${(i - players[0].hand.length/2) * 5}deg) translateY(${currentPlayer === 0 ? '-10px' : '0'})` }} className="hover:z-50 hover:-translate-y-6 transition-transform duration-200">
                                <CardView 
                                    card={card} 
                                    onClick={() => handlePlayerCardClick(card)}
                                    disabled={currentPlayer !== 0 || isGameOver}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Color Picker Overlay */}
            {showColorPicker && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-gray-900 p-6 rounded-2xl border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-center">CHOISIR UNE COULEUR</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleColorPick('red')} className="w-20 h-20 bg-red-500 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_red]"></button>
                            <button onClick={() => handleColorPick('blue')} className="w-20 h-20 bg-blue-500 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_blue]"></button>
                            <button onClick={() => handleColorPick('green')} className="w-20 h-20 bg-green-500 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_green]"></button>
                            <button onClick={() => handleColorPick('yellow')} className="w-20 h-20 bg-yellow-400 rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_yellow]"></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Overlay */}
            {isGameOver && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in">
                    <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                    <h2 className="text-4xl font-black italic text-white mb-2 text-center">{winner?.id === 0 ? "VICTOIRE !" : "PERDU..."}</h2>
                    <p className="text-gray-400 mb-6">{winner?.name} a gagné la partie !</p>
                    {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                    <div className="flex gap-4">
                        <button onClick={startGame} className="px-8 py-3 bg-green-500 text-black font-black rounded-full hover:bg-white transition-colors">REJOUER</button>
                        <button onClick={onBack} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
};
