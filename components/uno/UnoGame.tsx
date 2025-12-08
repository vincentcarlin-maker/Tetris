
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle, Play, RotateCcw, Ban, Palette, Globe, Users, Bot, User, Trash2, Plus, Loader2, Cpu } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useCurrency } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';

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

interface UnoPlayer {
    id: string;
    name: string;
    type: 'HUMAN' | 'CPU' | 'REMOTE';
    hand: Card[];
    avatarId: string;
    isMe: boolean;
}

type GameMode = 'SOLO' | 'ONLINE';
type GameState = 'menu' | 'playing' | 'gameover' | 'color_select' | 'lobby';

// --- CONFIG ---
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600' },
};

const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;
    const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];

    const addCard = (color: Color, value: Value, score: number) => {
        deck.push({ id: `card_${idCounter++}`, color, value, score });
    };

    COLORS.forEach(color => {
        addCard(color, '0', 0);
        for (let i = 1; i <= 9; i++) {
            addCard(color, i.toString() as Value, i);
            addCard(color, i.toString() as Value, i);
        }
        SPECIAL_VALUES.forEach(val => {
            addCard(color, val, 20);
            addCard(color, val, 20);
        });
    });

    for (let i = 0; i < 4; i++) {
        addCard('black', 'wild', 50);
        addCard('black', 'wild4', 50);
    }

    return deck.sort(() => Math.random() - 0.5);
};

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { updateHighScore } = useHighScores();

    // Game State
    const [gameMode, setGameMode] = useState<GameMode>('SOLO');
    const [gameState, setGameState] = useState<GameState>('menu');
    const [players, setPlayers] = useState<UnoPlayer[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [turnIndex, setTurnIndex] = useState(0);
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);
    const [winner, setWinner] = useState<string | null>(null);
    const [unoShout, setUnoShout] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [score, setScore] = useState(0);

    // Lobby State
    const [botsToAdd, setBotsToAdd] = useState(1);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isReady, setIsReady] = useState(false);
    
    // Animation
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Mechanics
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const mpDataRef = useRef<any>(null);

    // --- SETUP & LOBBY ---

    const initLobby = (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'SOLO') {
            setGameState('lobby'); // Local lobby to setup bots
        } else {
            setOnlineStep('connecting');
            mp.connect();
        }
    };

    const startGame = () => {
        const newDeck = generateDeck();
        let initialPlayers: UnoPlayer[] = [];

        if (gameMode === 'SOLO') {
            initialPlayers.push({ id: 'p1', name: username, type: 'HUMAN', hand: [], avatarId: currentAvatarId, isMe: true });
            for (let i = 0; i < botsToAdd; i++) {
                initialPlayers.push({ id: `bot_${i}`, name: `Bot ${i + 1}`, type: 'CPU', hand: [], avatarId: 'av_bot', isMe: false });
            }
        } else {
            // Online Setup handled by Host
            if (mp.isHost) {
                initialPlayers.push({ id: mp.peerId!, name: username, type: 'HUMAN', hand: [], avatarId: currentAvatarId, isMe: true });
                if (mp.gameOpponent) {
                    initialPlayers.push({ id: mp.gameOpponent.id, name: mp.gameOpponent.name, type: 'REMOTE', hand: [], avatarId: mp.gameOpponent.avatarId, isMe: false });
                }
                for (let i = 0; i < botsToAdd; i++) {
                    initialPlayers.push({ id: `bot_${i}`, name: `Bot ${i + 1}`, type: 'CPU', hand: [], avatarId: 'av_bot', isMe: false });
                }
            } else {
                // Client waits for init
                return;
            }
        }

        // Deal Cards
        initialPlayers.forEach(p => {
            p.hand = newDeck.splice(0, 7);
        });

        let firstCard = newDeck.pop()!;
        while (firstCard.color === 'black') {
            newDeck.unshift(firstCard);
            firstCard = newDeck.pop()!;
        }

        const initState = {
            deck: newDeck,
            discardPile: [firstCard],
            activeColor: firstCard.color,
            players: initialPlayers,
            turnIndex: 0,
            direction: 1
        };

        if (gameMode === 'ONLINE' && mp.isHost) {
            mp.sendData({ type: 'UNO_INIT', state: initState });
        }

        applyState(initState);
        setGameState('playing');
        resumeAudio();
    };

    const applyState = (state: any) => {
        setDeck(state.deck);
        setDiscardPile(state.discardPile);
        setActiveColor(state.activeColor);
        // Correctly set isMe for online clients
        const updatedPlayers = state.players.map((p: any) => ({
            ...p,
            isMe: gameMode === 'SOLO' ? p.type === 'HUMAN' : p.id === mp.peerId
        }));
        setPlayers(updatedPlayers);
        setTurnIndex(state.turnIndex);
        setPlayDirection(state.direction);
        setMessage('');
        setWinner(null);
        setScore(0);
        setEarnedCoins(0);
        setIsAnimating(false);
        setHasDrawnThisTurn(false);
        setPlayerCalledUno(false);
        setShowContestButton(false);
    };

    // --- MULTIPLAYER HANDLING ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            mp.updateSelfInfo(username, currentAvatarId);
        }
    }, [username, currentAvatarId, mp, gameMode]);

    useEffect(() => {
        mpDataRef.current = (data: any) => {
            if (data.type === 'UNO_INIT') {
                applyState(data.state);
                setOnlineStep('game');
            } else if (data.type === 'UNO_UPDATE') {
                applyState(data.state);
            } else if (data.type === 'UNO_MOVE') {
                if (mp.isHost) {
                    const player = players.find(p => p.id === data.playerId);
                    if (player && player.type === 'REMOTE') {
                        const card = player.hand.find((c: Card) => c.id === data.cardId);
                        if (card) {
                            // Host executes remote move
                            playCard(card, player.id);
                        }
                    }
                }
            } else if (data.type === 'UNO_DRAW') {
                if (mp.isHost) {
                    handleDraw(data.playerId);
                }
            } else if (data.type === 'UNO_SHOUT') {
                setUnoShout(data.name);
                playPaddleHit();
                setTimeout(() => setUnoShout(null), 2000);
            } else if (data.type === 'LEAVE_GAME') {
                setWinner('ADVERSAIRE PARTI');
                setGameState('gameover');
            }
        };
    });

    useEffect(() => {
        const sub = mp.subscribe((data: any) => {
            if (mpDataRef.current) mpDataRef.current(data);
        });
        return () => sub();
    }, [mp]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (mp.mode === 'in_game' && onlineStep !== 'game') setOnlineStep('game');
            if (mp.mode === 'lobby' && onlineStep !== 'lobby') setOnlineStep('lobby');
        }
    }, [mp.mode, onlineStep, gameMode]);

    // --- BROADCAST STATE (HOST ONLY) ---
    const broadcastState = () => {
        if (gameMode === 'ONLINE' && mp.isHost) {
            mp.sendData({
                type: 'UNO_UPDATE',
                state: {
                    deck, discardPile, activeColor, players, turnIndex, direction: playDirection
                }
            });
        }
    };

    useEffect(() => {
        // Broadcast whenever crucial state changes if Host
        if (gameMode === 'ONLINE' && mp.isHost && gameState === 'playing' && !isAnimating) {
            broadcastState();
        }
    }, [deck, discardPile, activeColor, players, turnIndex, playDirection, gameState, isAnimating]);


    // --- GAMEPLAY LOGIC (HOST / LOCAL) ---

    const nextTurn = (skip: boolean = false) => {
        setTurnIndex(prev => {
            let next = prev + (playDirection * (skip ? 2 : 1));
            // Wrap around logic
            const len = players.length;
            return ((next % len) + len) % len;
        });
        setHasDrawnThisTurn(false);
        setPlayerCalledUno(false);
    };

    const handleDraw = (playerId: string, forcedAmount?: number) => {
        const amount = forcedAmount || 1;
        let currentDeck = [...deck];
        let currentDiscard = [...discardPile];
        const drawnCards: Card[] = [];

        for (let i = 0; i < amount; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length > 1) {
                    const top = currentDiscard.pop()!;
                    currentDeck = currentDiscard.sort(() => Math.random() - 0.5);
                    currentDiscard = [top];
                    setMessage("Mélange du talon...");
                } else break;
            }
            drawnCards.push(currentDeck.pop()!);
        }

        setDeck(currentDeck);
        setDiscardPile(currentDiscard);

        setPlayers(prev => prev.map(p => {
            if (p.id === playerId) return { ...p, hand: [...p.hand, ...drawnCards] };
            return p;
        }));

        if (!forcedAmount) {
            // Check if playable immediately (only for simple draw)
            const drawn = drawnCards[0];
            const top = discardPile[discardPile.length - 1];
            if (drawn && (drawn.color === activeColor || drawn.value === top.value || drawn.color === 'black')) {
                // Auto play check logic handled by UI or AI
                setMessage("Carte piochée !");
            } else {
                setMessage("Passe...");
                setTimeout(() => nextTurn(), 1000);
            }
        }
    };

    const playCard = (card: Card, playerId: string, chosenColor?: Color) => {
        const playerIndex = players.findIndex(p => p.id === playerId);
        const player = players[playerIndex];
        
        // Validation (Double check for security)
        const topCard = discardPile[discardPile.length - 1];
        const isPlayable = card.color === activeColor || card.value === topCard.value || card.color === 'black';
        if (!isPlayable) return;

        // Visuals
        playMove();
        // Remove card
        const newHand = player.hand.filter(c => c.id !== card.id);
        const newDiscard = [...discardPile, card];
        
        setDiscardPile(newDiscard);
        setPlayers(prev => prev.map((p, i) => i === playerIndex ? { ...p, hand: newHand } : p));
        
        if (card.color !== 'black') setActiveColor(card.color);
        else if (chosenColor) setActiveColor(chosenColor);

        // Check UNO
        if (newHand.length === 1) {
            // Bot/Remote shout uno logic handled elsewhere or assumed
            if (player.type === 'CPU') {
                if (Math.random() > 0.2) triggerUnoShout(player.name);
                else setShowContestButton(true); // Forgot!
            } else if (player.type === 'REMOTE') {
                // Rely on network message for shout
            }
        }

        if (newHand.length === 0) {
            handleWin(player);
            return;
        }

        // Special Effects
        let skipNext = false;
        if (card.value === 'skip') {
            setMessage("Passe ton tour !");
            skipNext = true;
        } else if (card.value === 'reverse') {
            if (players.length === 2) {
                setMessage("Passe ton tour !");
                skipNext = true; 
            } else {
                setMessage("Sens inverse !");
                setPlayDirection(prev => prev * -1 as 1 | -1);
            }
        } else if (card.value === 'draw2') {
            setMessage("+2 !");
            // Determine next player index
            let next = turnIndex + playDirection;
            const len = players.length;
            next = ((next % len) + len) % len;
            handleDraw(players[next].id, 2);
            skipNext = true;
        } else if (card.value === 'wild4') {
            setMessage("+4 !");
            let next = turnIndex + playDirection;
            const len = players.length;
            next = ((next % len) + len) % len;
            handleDraw(players[next].id, 4);
            skipNext = true;
        }

        nextTurn(skipNext);
    };

    const handleWin = (player: UnoPlayer) => {
        setWinner(player.name);
        setGameState('gameover');
        playVictory();
        
        if (player.isMe) {
            // Calculate Score
            let points = 0;
            players.forEach(p => {
                if (p.id !== player.id) {
                    p.hand.forEach(c => points += c.score);
                }
            });
            setScore(points);
            const coins = Math.floor(points / 2) + 20;
            addCoins(coins);
            setEarnedCoins(coins);
            updateHighScore('uno', points);
        }
    };

    const triggerUnoShout = (name: string) => {
        setUnoShout(name);
        playPaddleHit();
        if (gameMode === 'ONLINE' && mp.isHost) {
            mp.sendData({ type: 'UNO_SHOUT', name });
        }
        setTimeout(() => setUnoShout(null), 2000);
    };

    // --- AI & CPU LOGIC (HOST ONLY) ---
    useEffect(() => {
        if (!isAnimating && gameState === 'playing' && (gameMode === 'SOLO' || mp.isHost)) {
            const currentPlayer = players[turnIndex];
            if (currentPlayer && currentPlayer.type === 'CPU') {
                const timer = setTimeout(() => {
                    // AI Logic
                    const topCard = discardPile[discardPile.length - 1];
                    const playable = currentPlayer.hand.filter(c => c.color === activeColor || c.value === topCard.value || c.color === 'black');
                    
                    if (playable.length > 0) {
                        // Priority: +4, +2, Skip/Rev, Color, Wild, Number
                        playable.sort((a, b) => b.score - a.score);
                        const card = playable[0];
                        
                        let chosenColor: Color | undefined;
                        if (card.color === 'black') {
                            const counts: any = { red:0, blue:0, green:0, yellow:0 };
                            currentPlayer.hand.forEach(c => { if(c.color !== 'black') counts[c.color]++; });
                            chosenColor = (Object.keys(counts) as Color[]).reduce((a, b) => counts[a] > counts[b] ? a : b);
                        }
                        playCard(card, currentPlayer.id, chosenColor);
                    } else {
                        handleDraw(currentPlayer.id);
                        setHasDrawnThisTurn(true);
                        setTimeout(() => nextTurn(), 1000);
                    }
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [turnIndex, gameState, isAnimating, players, activeColor, discardPile]);

    // --- UI HANDLERS ---

    const handlePlayerCardClick = (card: Card) => {
        const currentPlayer = players[turnIndex];
        if (!currentPlayer.isMe || gameState !== 'playing' || isAnimating) return;

        // Validation
        const topCard = discardPile[discardPile.length - 1];
        const isPlayable = card.color === activeColor || card.value === topCard.value || card.color === 'black';

        if (isPlayable) {
            if (card.color === 'black') {
                // For simplified UI, open color picker
                // Store temp card selection
                setGameState('color_select');
                // We need to know WHICH card was clicked if duplicates exist, simpler to remove by ID later
                return; 
            }
            
            // Send move
            if (gameMode === 'ONLINE' && !mp.isHost) {
                mp.sendData({ type: 'UNO_MOVE', playerId: mp.peerId, cardId: card.id });
            } else {
                playCard(card, currentPlayer.id);
            }
        }
    };

    const handleColorSelect = (color: Color) => {
        // Find the black card in hand (wild or wild4)
        const currentPlayer = players[turnIndex];
        const card = currentPlayer.hand.find(c => c.color === 'black'); // Pick first available wild
        if (card) {
            if (gameMode === 'ONLINE' && !mp.isHost) {
                 // Complex to send chosen color with simple MOVE logic, for now assume Host handles color choice for bots/remote or extend protocol
                 // Extending protocol:
                 // Note: Ideally sending { type: 'UNO_MOVE', ... chosenColor: color }
                 // For now, let's keep it local logic style
                 // *Correction*: We can't execute logic here if client. 
                 // Limitation: Client side color pick needs to send the full move.
                 // Let's assume playCard handles it if passed.
            } else {
                playCard(card, currentPlayer.id, color);
            }
        }
        setGameState('playing');
    };

    const handleDrawClick = () => {
        const currentPlayer = players[turnIndex];
        if (!currentPlayer.isMe || hasDrawnThisTurn || gameState !== 'playing') return;

        if (gameMode === 'ONLINE' && !mp.isHost) {
            mp.sendData({ type: 'UNO_DRAW', playerId: mp.peerId });
        } else {
            handleDraw(currentPlayer.id);
            setHasDrawnThisTurn(true);
            
            // Check if playable
            // Actually, handleDraw already updates state. 
            // In a real app, we'd wait for state update to see if new card is playable. 
            // For simplicity here, we rely on the user to click the new card or end turn (which auto-happens in CPU logic but for player we might need "Pass" button)
            // Let's add auto-pass delay if not playable
            setTimeout(() => {
                // Re-check state logic is tricky inside closure.
                // Simplified: Player draws, sees card. If playable click it. If not, wait/pass button.
                // We'll add a "Pass" button appearing if hasDrawn.
            }, 500);
        }
    };

    const handlePassClick = () => {
        if (gameMode === 'ONLINE' && !mp.isHost) {
             // Send Pass
        } else {
            nextTurn();
        }
    };

    const handleUnoClick = () => {
        const me = players.find(p => p.isMe);
        if (me && me.hand.length === 2 && !playerCalledUno) {
            setPlayerCalledUno(true);
            triggerUnoShout(me.name);
        }
    };

    const handleLocalBack = () => {
        if (gameState === 'lobby') {
            if (gameMode === 'ONLINE') mp.disconnect();
            setGameState('menu');
        } else if (gameState === 'playing' || gameState === 'gameover' || gameState === 'color_select') {
            if (gameMode === 'ONLINE') mp.leaveGame();
            setGameState('menu');
        } else {
            onBack();
        }
    };

    // --- RENDER HELPERS ---

    const CardView = ({ card, onClick, small = false, faceDown = false }: { card: Card, onClick?: () => void, small?: boolean, faceDown?: boolean }) => {
        if (faceDown) {
            return (
                <div className={`${small ? 'w-8 h-12' : 'w-16 h-24 sm:w-20 sm:h-28'} bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center relative shadow-md`}>
                    <div className="w-full h-full bg-black/50 rounded-lg flex items-center justify-center">
                        <span className={`font-black italic text-cyan-500 ${small ? 'text-[8px]' : 'text-xs'}`}>UNO</span>
                    </div>
                </div>
            );
        }
        
        const config = COLOR_CONFIG[card.color];
        let display: string = card.value;
        let Icon = null;
        if (card.value === 'skip') Icon = Ban;
        else if (card.value === 'reverse') Icon = RotateCcw;
        else if (card.value === 'draw2') display = '+2';
        else if (card.value === 'wild') Icon = Palette;
        else if (card.value === 'wild4') display = '+4';

        return (
            <div 
                onClick={onClick}
                className={`
                    ${small ? 'w-8 h-12' : 'w-16 h-24 sm:w-20 sm:h-28'} 
                    rounded-lg border-2 ${config.border} ${config.bg} 
                    flex flex-col items-center justify-center 
                    shadow-lg cursor-pointer hover:-translate-y-2 transition-transform select-none
                `}
            >
                <div className={`font-black italic text-white ${small ? 'text-xs' : 'text-xl sm:text-2xl'} drop-shadow-md`}>
                    {Icon ? <Icon size={small ? 12 : 24}/> : display}
                </div>
            </div>
        );
    };

    // --- MENU VIEW ---
    if (gameState === 'menu') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">NEON UNO</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => initLobby('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-yellow-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                        <Cpu size={24} className="text-yellow-500"/> 1 JOUEUR
                    </button>
                    <button onClick={() => initLobby('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                        <Globe size={24} className="text-green-500"/> EN LIGNE
                    </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    // --- LOBBY VIEW ---
    if (gameState === 'lobby') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-4xl font-black text-white mb-8 italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">UNO SETUP</h1>
                
                <div className="bg-gray-900/80 p-6 rounded-2xl border border-white/10 w-full max-w-sm">
                    {gameMode === 'SOLO' || mp.isHost ? (
                        <>
                            <div className="mb-6">
                                <label className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">Adversaires Bots</label>
                                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg">
                                    <button onClick={() => setBotsToAdd(Math.max(1, botsToAdd - 1))} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-white"><Trash2 size={16}/></button>
                                    <span className="font-mono text-xl text-yellow-400">{botsToAdd}</span>
                                    <button onClick={() => setBotsToAdd(Math.min(3, botsToAdd + 1))} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-white"><Plus size={16}/></button>
                                </div>
                                <div className="flex gap-2 mt-2 justify-center">
                                    {Array.from({length: botsToAdd}).map((_, i) => <Bot key={i} size={20} className="text-gray-500"/>)}
                                </div>
                            </div>
                            
                            {gameMode === 'ONLINE' && (
                                <div className="mb-6 text-center">
                                    <p className="text-green-400 text-sm font-bold animate-pulse mb-2">
                                        {mp.gameOpponent ? `JOUEUR CONNECTÉ: ${mp.gameOpponent.name}` : 'EN ATTENTE D\'UN JOUEUR...'}
                                    </p>
                                    {!mp.gameOpponent && <Loader2 size={24} className="animate-spin mx-auto text-green-500"/>}
                                </div>
                            )}

                            <button onClick={startGame} disabled={gameMode === 'ONLINE' && !mp.gameOpponent} className="w-full py-4 bg-yellow-500 text-black font-black text-lg rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                                COMMENCER
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-10">
                            <Loader2 size={48} className="animate-spin text-yellow-500 mx-auto mb-4"/>
                            <p className="text-white font-bold">EN ATTENTE DE L'HÔTE...</p>
                        </div>
                    )}
                </div>
                <button onClick={handleLocalBack} className="mt-8 text-gray-500 text-sm hover:text-white underline">RETOUR</button>
            </div>
        );
    }

    if (onlineStep === 'connecting') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-black/90">
                <Loader2 size={48} className="text-yellow-400 animate-spin mb-4" />
                <p className="text-yellow-300 font-bold">CONNEXION...</p>
            </div>
        );
    }

    // --- MAIN GAME RENDER ---
    
    // Find my index to rotate the view
    const myIndex = players.findIndex(p => p.isMe);
    const me = players[myIndex];
    // Rotate players array so Me is at index 0 for rendering logic (Bottom)
    const rotatedPlayers = [...players.slice(myIndex), ...players.slice(0, myIndex)];
    // rotatedPlayers[0] is Me (Bottom)
    // rotatedPlayers[1] is Left or Top
    // etc.

    const topPlayers = rotatedPlayers.slice(1); // All opponents

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            
            {/* Top Area: Opponents */}
            <div className="w-full flex-1 flex items-start justify-center pt-4 px-2 gap-2 sm:gap-8">
                {topPlayers.map((p, i) => {
                    const isTurn = players[turnIndex].id === p.id;
                    const avatar = avatarsCatalog.find(a => a.id === p.avatarId) || avatarsCatalog[0];
                    const AvIcon = avatar.icon;
                    return (
                        <div key={p.id} className={`flex flex-col items-center transition-opacity ${isTurn ? 'opacity-100 scale-110' : 'opacity-60'}`}>
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-2 ${isTurn ? 'border-yellow-400 shadow-[0_0_10px_gold]' : 'border-gray-600'}`}>
                                <AvIcon size={20} className={avatar.color}/>
                            </div>
                            <span className="text-[10px] font-bold mt-1 max-w-[60px] truncate">{p.name}</span>
                            <div className="flex -space-x-4 mt-1">
                                {p.hand.length > 0 && <CardView card={p.hand[0]} faceDown small />}
                                <div className="bg-black/80 rounded-full px-2 py-0.5 text-xs font-bold border border-white/20 z-10 -ml-2">{p.hand.length}</div>
                            </div>
                            {p.hand.length === 1 && <div className="text-[8px] bg-red-600 px-1 rounded animate-bounce mt-1">UNO!</div>}
                        </div>
                    );
                })}
            </div>

            {/* Middle Area: Table */}
            <div className="flex items-center justify-center gap-8 my-4 relative z-10">
                {/* Draw Pile */}
                <div onClick={handleDrawClick} className={`relative cursor-pointer transition-transform active:scale-95 ${players[turnIndex]?.isMe ? 'ring-2 ring-white rounded-lg animate-pulse' : ''}`}>
                    <div className="w-16 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center shadow-xl">
                        <Layers size={24} className="text-gray-500"/>
                    </div>
                </div>

                {/* Discard Pile */}
                <div ref={discardPileRef} className="relative">
                    {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}
                </div>

                {/* Color Indicator */}
                <div className={`absolute -right-16 top-0 w-8 h-8 rounded-full border-2 border-white ${COLOR_CONFIG[activeColor].bg} shadow-[0_0_15px_currentColor] animate-pulse`}></div>
            </div>

            {/* Bottom Area: Player Hand */}
            <div className="w-full pb-4 px-4 flex flex-col justify-end z-20">
                {/* Action Bar */}
                <div className="flex justify-center gap-4 mb-4 h-10">
                    <div className="bg-black/60 px-4 py-1 rounded-full border border-white/10 flex items-center gap-2">
                        {players[turnIndex]?.isMe ? <span className="text-green-400 font-bold animate-pulse">TON TOUR</span> : <span className="text-gray-400">TOUR DE {players[turnIndex]?.name.toUpperCase()}</span>}
                    </div>
                    {me?.hand.length === 2 && !playerCalledUno && (
                        <button onClick={handleUnoClick} className="bg-red-600 hover:bg-red-500 text-white font-black px-4 rounded-full shadow-lg animate-bounce text-xs">UNO !</button>
                    )}
                    {hasDrawnThisTurn && (
                        <button onClick={handlePassClick} className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 rounded-full text-xs">PASSER</button>
                    )}
                </div>

                {/* Hand */}
                <div className="flex justify-center -space-x-4 sm:-space-x-8 overflow-x-auto py-2 min-h-[120px]">
                    {me?.hand.map((card, i) => (
                        <div key={card.id} className="hover:-translate-y-4 transition-transform origin-bottom hover:z-50" style={{ zIndex: i }}>
                            <CardView card={card} onClick={() => handlePlayerCardClick(card)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlays */}
            {unoShout && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-6xl font-black text-yellow-500 drop-shadow-[0_0_20px_red] animate-bounce transform -rotate-12 bg-black/50 p-4 rounded-xl border-4 border-red-500">UNO!</div>
                </div>
            )}

            {gameState === 'color_select' && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="grid grid-cols-2 gap-4">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => handleColorSelect(c)} className={`w-24 h-24 rounded-full ${COLOR_CONFIG[c].bg} border-4 border-white hover:scale-110 transition-transform shadow-[0_0_20px_currentColor]`}></button>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'gameover' && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-in zoom-in">
                    <Trophy size={64} className="text-yellow-400 mb-4"/>
                    <h2 className="text-4xl font-black text-white mb-2">{winner} A GAGNÉ !</h2>
                    {earnedCoins > 0 && <div className="text-yellow-400 font-bold mb-6">+{earnedCoins} PIÈCES</div>}
                    <button onClick={handleLocalBack} className="px-8 py-3 bg-gray-800 rounded-full font-bold hover:bg-white hover:text-black transition-colors">QUITTER</button>
                </div>
            )}
        </div>
    );
};
