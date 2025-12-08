
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle, Play, RotateCcw, Ban, Palette, User, Globe, Users, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

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

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

type Turn = 'PLAYER' | 'CPU'; // CPU = Opponent in Online
type GameState = 'playing' | 'gameover' | 'color_select';
type GamePhase = 'MENU' | 'GAME';

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

const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;
    const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];

    const addCard = (color: Color, value: Value, score: number) => {
        deck.push({ id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`, color, value, score });
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
    // --- HOOKS ---
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();
    const mp = useMultiplayer(); // Multiplayer Hook

    // --- GAME STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [cpuHand, setCpuHand] = useState<Card[]>([]); // Represents Opponent in Online
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    // Direction: 1 = Clockwise, -1 = Counter-Clockwise (Visual only in 1v1)
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);

    // Manual Mechanics State
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);

    // Animation States
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Online States
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const handleDataRef = useRef<(data: any) => void>(null);

    // --- EFFECT: SYNC SELF INFO ---
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    // --- EFFECT: CONNECT/DISCONNECT ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            // DO NOT DISCONNECT GLOBALLY (PRESERVES LOBBY CONNECTION)
            // Only leave specific game context
            if (mp.mode === 'in_game' || mp.isHost) {
                mp.leaveGame();
            }
            setOpponentLeft(false);
        }
    }, [gameMode]);

    // --- HELPER: RESET TABLE (Does NOT change phase to MENU) ---
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
        setPlayDirection(1);
        setPlayerCalledUno(false);
        setShowContestButton(false);
        setChatHistory([]);
        setOpponentLeft(false);
        setGameState('playing');
        setWinner(null);
        setMessage('');
        setIsWaitingForHost(false);
    }, []);

    const backToMenu = () => {
        setPhase('MENU');
        if (gameMode === 'ONLINE') {
            // Keep connection but reset UI
            if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame();
        }
    };

    // --- EFFECT: LOBBY/GAME TRANSITION ---
    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            // If in lobby but have game data, just clear the table, don't kick to menu
            if (phase === 'GAME' && (playerHand.length > 0 || cpuHand.length > 0 || winner)) {
                clearTable();
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase === 'MENU') {
                // If we get thrown into a game from menu, init online game
                initGame('ONLINE');
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase, playerHand.length, cpuHand.length, winner, clearTable]);

    // --- EFFECT: ONLINE DATA HANDLER (STABLE) ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            // UNO_INIT: Host -> Client
            if (data.type === 'UNO_INIT') {
                setPlayerHand(data.hand);
                setCpuHand(Array(data.oppHandCount).fill({ id: 'opp', color: 'black', value: '0', score: 0 })); // Dummy cards
                setDiscardPile([data.topCard]);
                setActiveColor(data.topCard.color === 'black' ? 'red' : data.topCard.color); // Default if black
                setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                setDeck(Array(20).fill(null) as any); // Dummy deck for visuals
                setGameState('playing');
                setMessage("La partie commence !");
                setIsWaitingForHost(false);
                setPlayDirection(1);
            }
            
            // UNO_PLAY: Opponent Played a Card
            if (data.type === 'UNO_PLAY') {
                const card = data.card;
                // Animate from opponent hand, mark as Remote
                animateCardPlay(card, 0, 'CPU', undefined, true);
                if (data.nextColor) setActiveColor(data.nextColor);
            }

            // UNO_DRAW_NOTIFY: Opponent Drew Cards
            if (data.type === 'UNO_DRAW_NOTIFY') {
                const count = data.count;
                // Add dummy cards to opponent hand
                const dummies = Array(count).fill({ id: `opp_draw_${Date.now()}`, color: 'black', value: '0', score: 0 });
                setCpuHand(prev => [...prev, ...dummies]);
                setMessage("L'adversaire pioche...");
            }

            // UNO_DRAW_RESP: Host -> Client (You requested a card, here it is)
            if (data.type === 'UNO_DRAW_RESP') {
                const newCards = data.cards;
                setPlayerHand(prev => [...prev, ...newCards]);
                setHasDrawnThisTurn(true);
                // Check playability of last drawn card
                const last = newCards[newCards.length-1];
                const top = discardPile[discardPile.length-1];
                if (last.color === activeColor || last.value === top.value || last.color === 'black') {
                    setMessage("Carte jouable !");
                } else {
                    setMessage("Pas de chance...");
                    setTimeout(() => {
                        setTurn('CPU');
                        mp.sendData({ type: 'UNO_PASS' });
                    }, 1000);
                }
            }

            // UNO_PASS: Opponent Passed Turn
            if (data.type === 'UNO_PASS') {
                setTurn('PLAYER');
                setMessage("À toi de jouer !");
            }

            // UNO_SHOUT: Opponent shouted UNO
            if (data.type === 'UNO_SHOUT') {
                setUnoShout('CPU');
                playPaddleHit();
                setTimeout(() => setUnoShout(null), 1500);
            }

            // UNO_GAME_OVER
            if (data.type === 'UNO_GAME_OVER') {
                handleGameOver(data.winner === mp.peerId ? 'PLAYER' : 'CPU');
            }

            // CHAT / REACTION
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
    }, [mp]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- GAME ACTIONS ---

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE' | any) => {
        // Handle explicit mode override or fallback to current state (careful with Event objects)
        const targetMode = (typeof modeOverride === 'string' && (modeOverride === 'SOLO' || modeOverride === 'ONLINE')) 
                           ? modeOverride 
                           : gameMode;

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
        } else {
            // ONLINE HOST LOGIC
            if (mp.isHost) {
                const newDeck = generateDeck();
                const pHand = newDeck.splice(0, 7); // Host Hand
                const cHand = newDeck.splice(0, 7); // Client Hand
                let firstCard = newDeck.pop()!;
                while (firstCard.color === 'black') {
                    newDeck.unshift(firstCard);
                    firstCard = newDeck.pop()!;
                }
                setDeck(newDeck);
                setPlayerHand(pHand);
                
                // For Host, 'cpuHand' represents Client Hand visually
                // We store dummies
                setCpuHand(Array(7).fill({ id: 'opp', color: 'black', value: '0', score: 0 }));
                
                setDiscardPile([firstCard]);
                setActiveColor(firstCard.color);
                setTurn('PLAYER'); // Host starts? or random? Let's say Host starts
                
                // Send Init to Client
                // Wait small delay to ensure client ready
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
                // Client waits
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
        // Explicitly pass the mode to ensure logic runs correctly immediately
        // (React state update is async, so gameMode might be stale inside startNewGame otherwise)
        if (mode === 'SOLO') startNewGame('SOLO');
        else if (mode === 'ONLINE' && mp.mode === 'in_game') startNewGame('ONLINE');
    };

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: Card[], isRemoteEffect: boolean = false) => {
        // Client Side Logic (Not Host)
        if (gameMode === 'ONLINE' && !mp.isHost) {
            if (target === 'PLAYER') {
                // I need to draw.
                // If this is a remote effect (Host played +2), I assume Host sent me cards via UNO_DRAW_RESP separately or logic handles it.
                // However, usually host manages state.
                // If Host sends +2 PLAY, Host should ALSO send a draw command or Client should request it.
                // Better approach: If it's a remote effect (I am victim of +2), I should NOT request draw if Host already assigned cards.
                // But Host doesn't assign cards to Client directly unless Client requests or Host forces update.
                // Current logic: Client requests draw. Host responds.
                
                // If this call comes from `executeCardEffect` triggered by `UNO_PLAY` (Remote),
                // we should suppress the draw request here because the Host sends cards via `UNO_DRAW_RESP` usually?
                // Actually no, Host sends `UNO_PLAY`. Client sees +2. Client logic triggers `drawCard`.
                // Client MUST request the cards.
                
                // BUT: Double draw bug suggests multiple triggers.
                if (isRemoteEffect) return []; // Prevent automatic draw on effect if we handle it otherwise?
                
                // Let's assume standard flow: I request cards.
                mp.sendData({ type: 'UNO_DRAW_REQ', amount });
                return [];
            } else {
                // CPU (Host) needs to draw (Visually).
                // If I played +2, I want to see Host draw.
                // Just add dummies.
                const dummies = Array(amount).fill({ id: `opp_draw_${Date.now()}_${Math.random()}`, color: 'black', value: '0', score: 0 });
                setCpuHand(prev => [...prev, ...dummies]);
                return []; 
            }
        }

        // Host / Solo Logic (Deck Manager)
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
        if (didReshuffle) setDiscardPile(currentDiscard);

        if (target === 'PLAYER') {
            setPlayerHand(prev => [...prev, ...drawnCards]);
            if (gameMode === 'ONLINE' && mp.isHost) {
                mp.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length });
            }
        } else {
            // Target CPU (Client)
            if (gameMode === 'SOLO') {
                setCpuHand(prev => [...prev, ...drawnCards]);
            } else {
                // Host dealing to Client
                // Visually add dummies to cpuHand (Host's view of Opponent)
                const dummies = Array(drawnCards.length).fill({id:'opp',color:'black', value:'0', score:0});
                setCpuHand(prev => [...prev, ...dummies]);
                // Send Real Cards to Client
                mp.sendData({ type: 'UNO_DRAW_RESP', cards: drawnCards });
            }
        }
        
        return drawnCards;
    };

    // --- MANUAL DRAW ACTION ---
    const handleDrawPileClick = () => {
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || hasDrawnThisTurn) return;

        if (gameMode === 'SOLO') {
            const drawn = drawCard('PLAYER', 1);
            setHasDrawnThisTurn(true);
            const newCard = drawn[0];
            if (newCard) {
                const topCard = discardPile[discardPile.length - 1];
                const canPlay = newCard.color === activeColor || newCard.value === topCard.value || newCard.color === 'black';
                if (canPlay) setMessage("Carte jouable !");
                else {
                    setMessage("Pas de chance...");
                    setTimeout(() => setTurn('CPU'), 1000);
                }
            }
        } else {
            // Online: Request draw
            if (mp.isHost) {
                // Host acts like Solo but notifies
                const drawn = drawCard('PLAYER', 1);
                setHasDrawnThisTurn(true);
                // Check playability (Same logic)
                const newCard = drawn[0];
                const topCard = discardPile[discardPile.length - 1];
                if (!newCard || !(newCard.color === activeColor || newCard.value === topCard.value || newCard.color === 'black')) {
                    setTimeout(() => {
                        setTurn('CPU');
                        mp.sendData({ type: 'UNO_PASS' });
                    }, 1000);
                }
            } else {
                // Client requests
                mp.sendData({ type: 'UNO_DRAW_REQ', amount: 1 });
                // We wait for 'UNO_DRAW_RESP' to update UI
            }
        }
    };

    // --- ACTIONS ---
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

    const animateCardPlay = (card: Card, index: number, actor: Turn, startRect?: DOMRect, isRemote: boolean = false) => {
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

    const executeCardEffect = (card: Card, index: number, actor: Turn, isRemote: boolean) => {
        let hand = actor === 'PLAYER' ? [...playerHand] : [...cpuHand];
        
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1);
        else hand.splice(index, 1); // Fallback for dummy hands
        
        if (actor === 'PLAYER') setPlayerHand(hand);
        else setCpuHand(hand);

        const newDiscardPile = [...discardPile, card];
        setDiscardPile(newDiscardPile);
        
        if (card.color !== 'black') {
            setActiveColor(card.color);
        }

        // Check Uno Failure (Local logic only, Online needs explicit signals or trust)
        // In Online, we trust the sender's state usually or validate on Host.
        // Simplified: If Player plays and didn't call Uno, punish locally.
        if (actor === 'PLAYER' && hand.length === 1 && !playerCalledUno) {
             setMessage("OUBLI UNO ! +2");
             playGameOver(); 
             drawCard('PLAYER', 2, newDiscardPile);
        }
        
        // Check Win
        if (hand.length === 0) {
            handleGameOver(actor);
            if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_GAME_OVER', winner: actor === 'PLAYER' ? mp.peerId : 'OPPONENT' });
            return;
        }

        let nextTurn: Turn = actor === 'PLAYER' ? 'CPU' : 'PLAYER';
        
        // Effects
        if (card.value === 'skip') {
            setMessage("Passe ton tour !");
            nextTurn = actor;
        } else if (card.value === 'reverse') {
            setMessage("Sens inverse !");
            setPlayDirection(prev => prev * -1 as 1 | -1);
            nextTurn = actor; 
        } else if (card.value === 'draw2') {
            setMessage("+2 cartes !");
            // If remote, assume cards are handled by separate message, do not request draw here
            if (!isRemote) {
                drawCard(nextTurn, 2, newDiscardPile);
            }
            nextTurn = actor;
        } else if (card.value === 'wild') {
            setMessage("Joker !");
            if (actor === 'PLAYER') {
                setGameState('color_select');
                return; // Pause here
            } else {
                // Opponent AI or Remote Logic handled separately
                if (gameMode === 'SOLO') {
                    // CPU logic
                    const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 };
                    cpuHand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; });
                    const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b);
                    setActiveColor(bestColor);
                    setMessage(`CPU choisit : ${bestColor.toUpperCase()}`);
                }
                // Online: Color is sent in 'UNO_PLAY' data, set in handleDataRef
            }
        } else if (card.value === 'wild4') {
            setMessage("+4 cartes !");
            // If remote, assume cards are handled by separate message
            if (!isRemote) {
                drawCard(nextTurn, 4, newDiscardPile);
            }
            
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
                }
                nextTurn = actor;
            }
        }

        setTurn(nextTurn);
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: Card, index: number) => {
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating) return;

        const topCard = discardPile[discardPile.length - 1];
        const isCompatible = card.color === activeColor || card.value === topCard.value || card.color === 'black';

        if (isCompatible) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            animateCardPlay(card, index, 'PLAYER', rect);
            if (gameMode === 'ONLINE') {
                // Send move - Color selection will be sent after selection if Wild
                if (card.color !== 'black') {
                    mp.sendData({ type: 'UNO_PLAY', card });
                }
            }
        }
    };

    const handleColorSelect = (color: Color) => {
        setActiveColor(color);
        setGameState('playing');
        
        // Correctly set turn based on card type just played
        // If Wild+4 was played, it skips opponent, so it remains Player's turn (in 1v1 rules where skip = go again)
        // Wait, standard Uno: Wild+4 skips next player.
        // If 2 players: Player A plays Wild+4. Player B draws 4 and is skipped. Player A goes again.
        // So turn should be PLAYER.
        
        const topCard = discardPile[discardPile.length - 1];
        let nextTurn: Turn = 'CPU';
        
        if (topCard.value === 'wild4') {
             // In 1v1, skipping opponent means Player goes again
             nextTurn = 'PLAYER';
             setMessage("L'adversaire passe son tour !");
        }
        
        setTurn(nextTurn);
        
        if (gameMode === 'ONLINE') {
            // Need to find the last played wild card to send it
            // Or just send 'nextColor' in the packet
            const playedCard = discardPile[discardPile.length - 1];
            mp.sendData({ type: 'UNO_PLAY', card: playedCard, nextColor: color });
        }
    };

    const handleGameOver = (winnerTurn: Turn) => {
        setWinner(winnerTurn);
        setGameState('gameover');
        if (winnerTurn === 'PLAYER') {
            playVictory();
            // Score calc
            const points = cpuHand.length * 10 + 50; // Simplified scoring
            setScore(points);
            const coins = Math.max(10, Math.floor(points / 2));
            addCoins(coins);
            setEarnedCoins(coins);
            updateHighScore('uno', points);
        } else {
            playGameOver();
        }
    };

    // --- SOLO AI LOOP ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'CPU' && gameState === 'playing' && !isAnimating) {
            const timer = setTimeout(() => {
                const topCard = discardPile[discardPile.length - 1];
                const validIndices = cpuHand.map((c, i) => ({c, i})).filter(({c}) => 
                    c.color === activeColor || c.value === topCard.value || c.color === 'black'
                );

                if (validIndices.length > 0) {
                    // Smart-ish AI
                    validIndices.sort((a, b) => {
                        if (a.c.color === 'black') return 1; // Play wilds last
                        if (a.c.value === 'draw2' || a.c.value === 'skip' || a.c.value === 'reverse') return -1; // Play action cards
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

    // --- RENDER HELPERS ---
    
    // Chat Handlers
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

    const handleLocalBack = () => {
        if (phase === 'GAME') {
            backToMenu();
        } else if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
            backToMenu();
        } else {
            onBack();
        }
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-yellow-300 tracking-wider drop-shadow-md">LOBBY UNO</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 ? (
                        hostingPlayers.map(player => {
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
                        })
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie... Créez la vôtre !</p>}
                </div>
             </div>
         );
    };

    // --- CARD VIEW COMPONENT ---
    const CardView = ({ card, onClick, faceUp = true, small = false, style }: { card: Card, onClick?: (e: React.MouseEvent) => void, faceUp?: boolean, small?: boolean, style?: React.CSSProperties }) => {
        if (!faceUp) {
            return (
                <div style={style} className={`
                    ${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} 
                    bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center
                    shadow-lg relative overflow-hidden group
                `}>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
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
             if (topCard) isPlayable = card.color === activeColor || card.value === topCard.value || card.color === 'black';
        }

        const liftClass = isPlayerHand ? (isPlayable ? '-translate-y-6 sm:-translate-y-8 shadow-[0_0_25px_rgba(255,255,255,0.4)] z-30 brightness-110 ring-2 ring-white/70' : 'brightness-50 z-0 translate-y-2') : '';
        const isWild = card.color === 'black';

        return (
            <div onClick={onClick} style={style} className={`${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} relative rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 select-none shadow-xl border-2 ${config.border} ${liftClass} bg-gray-900`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80 z-0`}></div>
                <div className={`absolute inset-2 sm:inset-3 rounded-[50%_/_40%] border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 shadow-inner ${isWild ? 'animate-pulse border-white/50' : ''}`}>
                    <div className={`font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isWild ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-4xl sm:text-6xl' : 'text-white text-3xl sm:text-5xl'} flex items-center justify-center`}>{Icon ? <Icon size={small ? 20 : 40} strokeWidth={2.5}/> : displayValue}</div>
                </div>
                <div className="absolute top-1 left-1.5 text-[10px] sm:text-sm font-bold leading-none text-white drop-shadow-md z-20">{Icon ? <Icon size={12}/> : displayValue}</div>
                <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-sm font-bold leading-none transform rotate-180 text-white drop-shadow-md z-20">{Icon ? <Icon size={12}/> : displayValue}</div>
            </div>
        );
    };

    const FlyingCardOverlay = () => {
        if (!flyingCard) return null;
        return (
            <div className="fixed z-[100] pointer-events-none" style={{left: 0, top: 0, animation: 'flyCard 0.5s ease-in-out forwards'}}>
                <style>{`@keyframes flyCard { 0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); } 100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); } }`}</style>
                <CardView card={flyingCard.card} style={{ width: '80px', height: '112px' }} />
            </div>
        );
    };

    // --- MAIN RENDER ---

    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15]">NEON UNO</h1>
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

    if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 pr-2 pb-1">NEON UNO</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    let spacingClass = '-space-x-12 sm:-space-x-16';
    let rotationFactor = 3; 
    if (playerHand.length <= 5) { spacingClass = '-space-x-6 sm:-space-x-8'; rotationFactor = 5; } 
    else if (playerHand.length <= 10) { spacingClass = '-space-x-12 sm:-space-x-16'; rotationFactor = 3; } 
    else { spacingClass = '-space-x-16 sm:-space-x-24'; rotationFactor = 1.5; }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black pointer-events-none"></div>

            <FlyingCardOverlay />

            {activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                if (!reaction) return null;
                const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
            })()}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/10">{message}</span>
                </div>
                <button onClick={() => startNewGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {gameMode === 'ONLINE' && onlineStep === 'connecting' && (
                 <div className="flex-1 flex flex-col items-center justify-center z-20"><Loader2 size={48} className="text-yellow-400 animate-spin mb-4" /><p className="text-yellow-300 font-bold">CONNEXION...</p></div>
            )}

            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* Game Area */}
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10">
                {/* CPU Hand */}
                <div ref={cpuHandRef} className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-hidden h-24 sm:h-32 items-start pt-2">
                    {cpuHand.map((card, i) => (
                        <div key={i} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }}>
                            <CardView card={card} faceUp={false} />
                        </div>
                    ))}
                </div>

                {/* Center Table */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 relative">
                    <div className={`absolute pointer-events-none transition-colors duration-500 ${COLOR_CONFIG[activeColor].text} opacity-30 z-0`}>
                        <div className="w-[320px] h-[180px] border-4 border-dashed border-current rounded-[50px] relative flex items-center justify-center">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowRight size={32} /> : <ArrowLeft size={32} />}</div>
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowLeft size={32} /> : <ArrowRight size={32} />}</div>
                        </div>
                    </div>
                    {/* Draw Pile */}
                    <div onClick={handleDrawPileClick} className={`relative group z-10 transition-transform ${turn === 'PLAYER' && !hasDrawnThisTurn ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}>
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                            {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>}
                            <Layers size={32} className="text-gray-600" />
                            {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">PIOCHER</div>}
                        </div>
                    </div>
                    {/* Discard Pile */}
                    <div className="relative flex items-center justify-center z-10" ref={discardPileRef}>
                        <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                        <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">{discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}</div>
                    </div>
                </div>

                {/* Player Hand */}
                <div className="w-full relative px-4 z-20 pb-20 min-h-[180px] flex flex-col justify-end">
                    <div className="absolute -top-16 left-0 right-0 flex justify-center pointer-events-none z-30 h-16 items-end">
                        {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && (
                            <button onClick={handleUnoClick} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce transition-all active:scale-95 flex items-center gap-2 border-4 border-yellow-400"><Megaphone size={24} fill="white" /> CRIER UNO !</button>
                        )}
                        {showContestButton && <button onClick={handleContestClick} className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse transition-all active:scale-95 flex items-center gap-2 border-4 border-red-600"><AlertTriangle size={24} fill="black" /> CONTRE-UNO !</button>}
                    </div>
                    <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4">
                        <div className={`flex justify-center min-w-fit px-8 ${spacingClass} items-end min-h-[160px] transition-all duration-500`}>
                            {playerHand.map((card, i) => {
                                if (flyingCard && flyingCard.card.id === card.id) return <div key={card.id} style={{ width: '0px', transition: 'width 0.5s' }}></div>;
                                return <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * rotationFactor}deg) translateY(${Math.abs(i - playerHand.length/2) * (rotationFactor * 1.5)}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}><CardView card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} /></div>;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ONLINE CHAT */}
            {gameMode === 'ONLINE' && !winner && mp.gameOpponent && (
                <div className="w-full max-w-lg z-30 px-2 pb-4 absolute bottom-0">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <form onSubmit={sendChat} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            )}

            {unoShout && <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"><div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 animate-bounce drop-shadow-[0_0_25px_rgba(255,0,0,0.8)] transform -rotate-12">UNO !</div></div>}

            {gameState === 'color_select' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in">
                    <h2 className="text-2xl font-bold text-white mb-8 animate-pulse">CHOISIR UNE COULEUR</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => handleColorSelect(c)} className={`w-32 h-32 rounded-2xl border-4 ${COLOR_CONFIG[c].border} bg-gray-900 hover:scale-105 transition-transform flex items-center justify-center group`}>
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
                            <LogOut size={64} className="text-red-500 mb-4" />
                            <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                            <button onClick={backToMenu} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 mt-4"><Home size={18} /> RETOUR AU MENU</button>
                        </>
                    ) : (
                        <>
                            {winner === 'PLAYER' ? (
                                <>
                                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                                    <h2 className="text-5xl font-black text-white italic mb-2">VICTOIRE !</h2>
                                    <div className="flex flex-col items-center gap-2 mb-8"><span className="text-gray-400 font-bold tracking-widest text-sm">SCORE FINAL</span><span className="text-4xl font-mono text-neon-blue">{score}</span></div>
                                    {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                                </>
                            ) : (
                                <>
                                    <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                                    <h2 className="text-5xl font-black text-white italic mb-4">DÉFAITE...</h2>
                                </>
                            )}
                            <div className="flex gap-4">
                                <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : () => startNewGame(gameMode)} className="px-8 py-4 bg-green-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                                <button onClick={backToMenu} className="px-8 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">MENU</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
