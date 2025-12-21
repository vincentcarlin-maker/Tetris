import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle, Play, RotateCcw, Ban, Palette, User, Globe, Users, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, HelpCircle, MousePointer2, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { Card as CardType, GamePhase, GameState, Turn, ChatMessage, Color, Value } from './types';
import { generateDeck, isCardPlayable, getCpuMove } from './logic';
import { Card } from './common/Card';
import { UnoMenu } from './views/UnoMenu';
import { GameOver } from './views/GameOver';
import { ColorSelector } from './views/ColorSelector';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

interface FlyingCardData {
    card: CardType;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    rotation: number;
}

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600' },
};


export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    // --- HOOKS ---
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

    // --- GAME STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [deck, setDeck] = useState<CardType[]>([]);
    const [discardPile, setDiscardPile] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [cpuHand, setCpuHand] = useState<CardType[]>([]); // Represents Opponent in Online
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [activeColor, setActiveColor] = useState<Color>('black');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [score, setScore] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Direction: 1 = Clockwise, -1 = Counter-Clockwise (Visual only in 1v1)
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);

    // Manual Mechanics State
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);
    const [opponentCalledUno, setOpponentCalledUno] = useState(false);

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
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // STATE REF to fix stale closures in timeouts
    const gameStateRef = useRef({ playerHand, cpuHand, discardPile, activeColor, turn });
    useEffect(() => {
        gameStateRef.current = { playerHand, cpuHand, discardPile, activeColor, turn };
    }, [playerHand, cpuHand, discardPile, activeColor, turn]);

    const checkCompatibility = useCallback((card: CardType) => {
        const topCard = discardPile[discardPile.length - 1];
        return isCardPlayable(card, topCard, activeColor);
    }, [activeColor, discardPile]);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_uno_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_uno_tutorial_seen', 'true');
        }
    }, []);

    // --- EFFECT: PREVENT OVERSCROLL ---
    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const handleTouchMove = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Allow scrolling only in chat/lists marked with custom-scrollbar or root if auto
            if (target.closest('.custom-scrollbar') || target === container) return;
            e.preventDefault();
        };

        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => container.removeEventListener('touchmove', handleTouchMove);
    }, []);

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
            // Only leave specific game context
            if (mp.mode === 'in_game' || mp.isHost) {
                mp.leaveGame();
            }
            setOpponentLeft(false);
        }
    }, [gameMode, mp]);

    // --- HELPER: RESET TABLE ---
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
        setFlyingCard(null); // Fix: Reset flying card to prevent ghost blocks
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

    const backToMenu = () => {
        setPhase('MENU');
        if (gameMode === 'ONLINE') {
            if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame();
        }
    };

    // --- EFFECT: TURN CHANGE LOGIC ---
    useEffect(() => {
        if (turn === 'PLAYER') {
            setHasDrawnThisTurn(false);
        } else {
            // When turn goes to CPU, reset player flags
            setPlayerCalledUno(false);
            setShowContestButton(false);
        }
    }, [turn]);

    // --- EFFECT: LOBBY/GAME TRANSITION ---
    useEffect(() => {
        // Fix: Do not interrupt SOLO game when lobby state changes
        if (gameMode === 'SOLO') return;

        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            if (phase === 'GAME' && (playerHand.length > 0 || cpuHand.length > 0 || winner)) {
                clearTable();
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase === 'MENU') {
                initGame('ONLINE');
            } else if (phase === 'GAME') {
                const isGameRunning = playerHand.length > 0 || cpuHand.length > 0 || isWaitingForHost;
                if (!isGameRunning) {
                    startNewGame('ONLINE');
                }
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase, playerHand.length, cpuHand.length, winner, clearTable, isWaitingForHost, gameMode]);

    // --- EFFECT: ONLINE DATA HANDLER (STABLE) ---
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
                if (mp.isHost) {
                    drawCard('CPU', data.amount || 1);
                }
            }
            if (data.type === 'UNO_DRAW_NOTIFY') {
                const count = data.count;
                // Generate unique IDs for dummies to avoid key collision
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
                if (last && checkCompatibility(last)) {
                    setMessage("Carte jouable !");
                } else {
                    setMessage("Pas de chance...");
                    // Fix: Auto-pass for Guest if unplayable to match Host behavior
                    setTimeout(() => handlePassTurn(), 1000);
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
                // IMPORTANT FIX: Check current state to prevent overriding local win
                // If I already won locally (gameover), ignore incoming defeat signals
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
    }, [mp]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- GAME ACTIONS ---

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE' | any) => {
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

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: CardType[], isRemoteEffect: boolean = false) => {
        if (gameMode === 'ONLINE' && !mp.isHost) {
            if (target === 'PLAYER') {
                if (isRemoteEffect) return [];
                mp.sendData({ type: 'UNO_DRAW_REQ', amount });
                return [];
            } else {
                // Target is CPU (Host) - This runs when Guest plays +2/+4 against Host
                // We rely on UNO_DRAW_NOTIFY to add dummies to ensure no duplication
                return []; 
            }
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
            // If player drew, they lose the right to contest previously
            setShowContestButton(false);
            
            if (gameMode === 'ONLINE' && mp.isHost) {
                mp.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length });
            }
        } else {
            if (gameMode === 'SOLO') {
                setCpuHand(prev => [...prev, ...drawnCards]);
                // If CPU drew, reset their call state
                setOpponentCalledUno(false);
            } else {
                // Online Host logic for Opponent - Add visual dummies with unique IDs
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

    const handlePassTurn = () => {
        setMessage("Tour passé");
        setHasDrawnThisTurn(false);
        setTurn('CPU');
        if (gameMode === 'ONLINE') {
            mp.sendData({ type: 'UNO_PASS' });
        }
    };

    const handleDrawPileClick = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return;

        setShowContestButton(false); // Player interacting clears contest opportunity

        if (hasDrawnThisTurn) {
            handlePassTurn();
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
                } else {
                    setMessage("Carte jouable !");
                }
            } else {
                mp.sendData({ type: 'UNO_DRAW_REQ', amount: 1 });
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
            // Opponent draws 2 cards
            drawCard('CPU', 2);
        }
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

    const executeCardEffect = (card: CardType, index: number, actor: Turn, isRemote: boolean) => {
        // USE STATE REF TO AVOID STALE CLOSURES
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
            // Player Validation
            if (hand.length === 1 && !playerCalledUno) {
                 setMessage("OUBLI UNO ! +2");
                 playGameOver(); 
                 drawCard('PLAYER', 2, newDiscardPile);
            }
            setShowContestButton(false); // Player's turn effectively ends
        } else {
            // CPU/Opponent Validation
            if (hand.length === 1) {
                let forgot = false;
                
                if (gameMode === 'SOLO') {
                    // CPU randomly forgets
                    forgot = Math.random() > 0.8;
                    if (!forgot) {
                        setUnoShout('CPU');
                        setTimeout(() => setUnoShout(null), 1500);
                    }
                } else {
                    // Online: Check if they sent shout signal
                    forgot = !opponentCalledUno;
                }

                if (forgot) {
                    setShowContestButton(true);
                }
            } else {
                setShowContestButton(false);
            }
        }
        
        // Check Win
        if (hand.length === 0) {
            handleGameOver(actor);
            
            // IMPORTANT FIX: Only the actual winner (local player) sends the GAME_OVER signal
            if (gameMode === 'ONLINE' && !isRemote) {
                mp.sendData({ type: 'UNO_GAME_OVER', winner: mp.peerId });
            }
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

    const handlePlayerCardClick = (e: React.MouseEvent, card: CardType, index: number) => {
        e.stopPropagation();
        if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return;

        setShowContestButton(false); // Player action clears contest opportunity

        if (checkCompatibility(card)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            animateCardPlay(card, index, 'PLAYER', rect);
            if (gameMode === 'ONLINE') {
                if (card.color !== 'black') {
                    mp.sendData({ type: 'UNO_PLAY', card });
                }
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

    // --- SOLO AI LOOP ---
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

    const FlyingCardOverlay = () => {
        if (!flyingCard) return null;
        return (
            <div className="fixed z-[100] pointer-events-none" style={{left: 0, top: 0, animation: 'flyCard 0.5s ease-in-out forwards'}}>
                <style>{`@keyframes flyCard { 0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); } 100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); } }`}</style>
                <Card card={flyingCard.card} style={{ width: '80px', height: '112px' }} />
            </div>
        );
    };

    // --- MAIN RENDER ---
    if (phase === 'MENU') {
        return <UnoMenu onInitGame={initGame} onBack={onBack} />;
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
        <div ref={mainContainerRef} className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans touch-none select-none">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black pointer-events-none"></div>

            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="uno" onClose={() => setShowTutorial(false)} />}

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
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] pr-2 pb-1">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/10 animate-pulse">{message}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => startNewGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
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
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10 min-h-0">
                {/* CPU Hand */}
                <div ref={cpuHandRef} className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-hidden h-32 sm:h-48 items-start pt-4 shrink-0">
                    {cpuHand.map((card, i) => (
                        <div key={card.id || i} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }}>
                            <Card card={card} faceUp={false} />
                        </div>
                    ))}
                </div>

                {/* Center Table */}
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 relative min-h-[150px] shrink">
                    <div className={`absolute pointer-events-none transition-colors duration-500 ${COLOR_CONFIG[activeColor].text} opacity-30 z-0`}>
                        <div className="w-[320px] h-[180px] border-4 border-dashed border-current rounded-[50px] relative flex items-center justify-center">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowRight size={32} /> : <ArrowLeft size={32} />}</div>
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowLeft size={32} /> : <ArrowRight size={32} />}</div>
                        </div>
                    </div>
                    {/* Draw Pile */}
                    <div onClick={handleDrawPileClick} className={`relative group z-10 transition-transform ${turn === 'PLAYER' ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}>
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                            {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>}
                            <Layers size={32} className="text-gray-600" />
                            {turn === 'PLAYER' && <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white ${hasDrawnThisTurn ? 'bg-red-600' : 'bg-black/50'} px-2 py-1 rounded transition-colors`}>{hasDrawnThisTurn ? 'PASSER' : 'PIOCHER'}</div>}
                        </div>
                    </div>
                    {/* Discard Pile */}
                    <div className="relative flex items-center justify-center z-10" ref={discardPileRef}>
                        <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                        <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">{discardPile.length > 0 && <Card card={discardPile[discardPile.length-1]} />}</div>
                    </div>
                </div>

                {/* Player Hand */}
                <div className={`w-full relative px-4 z-20 ${gameMode === 'ONLINE' ? 'pb-24' : 'pb-4'} min-h-[180px] flex flex-col justify-end shrink-0`}>
                    <div className="absolute -top-20 left-0 right-0 flex justify-center pointer-events-none z-50 h-20 items-end gap-4">
                        {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && (
                            <button onClick={handleUnoClick} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce transition-all active:scale-95 flex items-center gap-2 border-4 border-yellow-400"><Megaphone size={24} fill="white" /> CRIER UNO !</button>
                        )}
                        {showContestButton && <button onClick={handleContestClick} className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse transition-all active:scale-95 flex items-center gap-2 border-4 border-red-600"><AlertTriangle size={24} fill="black" /> CONTRE-UNO !</button>}
                    </div>
                    <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4">
                        <div className={`flex w-fit mx-auto px-8 ${spacingClass} items-end min-h-[160px] transition-all duration-500`}>
                            {playerHand.map((card, i) => {
                                if (flyingCard && flyingCard.card.id === card.id) return <div key={card.id} style={{ width: '0px', transition: 'width 0.5s' }}></div>;
                                return <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * rotationFactor}deg) translateY(${Math.abs(i - playerHand.length/2) * (rotationFactor * 1.5)}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}><Card card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} isPlayable={checkCompatibility(card)} /></div>;
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

            {gameState === 'color_select' && <ColorSelector onColorSelect={handleColorSelect} />}

            {(gameState === 'gameover' || opponentLeft) && (
                <GameOver
                    winner={winner}
                    score={score}
                    earnedCoins={earnedCoins}
                    gameMode={gameMode}
                    onRematch={gameMode === 'ONLINE' ? () => mp.requestRematch() : () => startNewGame(gameMode)}
                    onBackToMenu={backToMenu}
                    opponentLeft={opponentLeft}
                />
            )}
        </div>
    );
};
