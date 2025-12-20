
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle, Play, RotateCcw, Ban, Palette, User, Globe, Users, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, HelpCircle, MousePointer2, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
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

type Turn = 'PLAYER' | 'CPU'; 
type GameState = 'playing' | 'gameover' | 'color_select';
type GamePhase = 'MENU' | 'GAME';

// --- CONFIG ---
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string, label: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900', label: 'ROUGE' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900', label: 'BLEU' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900', label: 'VERT' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800', label: 'JAUNE' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600', label: 'NOIR' },
};

const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;
    const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];
    const addCard = (color: Color, value: Value, score: number) => {
        deck.push({ id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`, color, value, score });
    };
    COLORS.forEach(color => {
        addCard(color, '0', 0);
        for (let i = 1; i <= 9; i++) { addCard(color, i.toString() as Value, i); addCard(color, i.toString() as Value, i); }
        SPECIAL_VALUES.forEach(val => { addCard(color, val, 20); addCard(color, val, 20); });
    });
    for (let i = 0; i < 4; i++) { addCard('black', 'wild', 50); addCard('black', 'wild4', 50); }
    return deck.sort(() => Math.random() - 0.5);
};

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();

    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
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
    const [showTutorial, setShowTutorial] = useState(false);
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);
    const [opponentCalledUno, setOpponentCalledUno] = useState(false);
    const [flyingCard, setFlyingCard] = useState<FlyingCardData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const discardPileRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);
    const handleDataRef = useRef<(data: any) => void>(null);
    const gameStateRef = useRef({ playerHand, cpuHand, discardPile, activeColor, turn });

    useEffect(() => { gameStateRef.current = { playerHand, cpuHand, discardPile, activeColor, turn }; }, [playerHand, cpuHand, discardPile, activeColor, turn]);
    useEffect(() => { const hasSeen = localStorage.getItem('neon_uno_tutorial_seen'); if (!hasSeen) { setShowTutorial(true); localStorage.setItem('neon_uno_tutorial_seen', 'true'); } }, []);

    const checkCompatibility = useCallback((card: Card) => {
        const topCard = discardPile[discardPile.length - 1];
        if (!topCard) return false;
        return card.color === activeColor || card.value === topCard.value || card.color === 'black';
    }, [activeColor, discardPile]);

    useEffect(() => { mp.updateSelfInfo(username, currentAvatarId); }, [username, currentAvatarId, mp]);
    useEffect(() => { if (gameMode === 'ONLINE') { setOnlineStep('connecting'); mp.connect(); } else { if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame(); setOpponentLeft(false); } }, [gameMode, mp]);

    const clearTable = useCallback(() => {
        setPlayerHand([]); setCpuHand([]); setDeck([]); setDiscardPile([]); setScore(0); setUnoShout(null); setEarnedCoins(0); setHasDrawnThisTurn(false); setIsAnimating(false); setFlyingCard(null); setPlayDirection(1); setPlayerCalledUno(false); setShowContestButton(false); setOpponentCalledUno(false); setChatHistory([]); setOpponentLeft(false); setGameState('playing'); setWinner(null); setMessage(''); setIsWaitingForHost(false);
    }, []);

    const backToMenu = () => { setPhase('MENU'); if (gameMode === 'ONLINE' && (mp.mode === 'in_game' || mp.isHost)) mp.leaveGame(); };

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE' | any) => {
        const targetMode = (typeof modeOverride === 'string' && (modeOverride === 'SOLO' || modeOverride === 'ONLINE')) ? modeOverride : gameMode;
        clearTable(); resumeAudio(); setMessage("Distribution...");
        if (targetMode === 'SOLO') {
            const newDeck = generateDeck(); const pHand = newDeck.splice(0, 7); const cHand = newDeck.splice(0, 7); let firstCard = newDeck.pop()!;
            while (firstCard.color === 'black') { newDeck.unshift(firstCard); firstCard = newDeck.pop()!; }
            setDeck(newDeck); setPlayerHand(pHand); setCpuHand(cHand); setDiscardPile([firstCard]); setActiveColor(firstCard.color); setTurn('PLAYER'); setMessage("C'est parti !");
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            if (mp.isHost) {
                const newDeck = generateDeck(); const pHand = newDeck.splice(0, 7); const cHand = newDeck.splice(0, 7); let firstCard = newDeck.pop()!;
                while (firstCard.color === 'black') { newDeck.unshift(firstCard); firstCard = newDeck.pop()!; }
                setDeck(newDeck); setPlayerHand(pHand); const dummies = Array.from({ length: 7 }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                setCpuHand(dummies); setDiscardPile([firstCard]); setActiveColor(firstCard.color); setTurn('PLAYER');
                setTimeout(() => { mp.sendData({ type: 'UNO_INIT', hand: cHand, oppHandCount: 7, topCard: firstCard, startTurn: mp.peerId }); }, 1000);
            } else { setIsWaitingForHost(true); setPlayerHand([]); setCpuHand([]); setDiscardPile([]); }
        }
    };

    const initGame = (mode: 'SOLO' | 'ONLINE') => { setGameMode(mode); setPhase('GAME'); if (mode === 'SOLO') startNewGame('SOLO'); else if (mode === 'ONLINE' && mp.mode === 'in_game') startNewGame('ONLINE'); };

    const drawCard = (target: Turn, amount: number = 1, manualDiscardPile?: Card[], isRemoteEffect: boolean = false) => {
        if (gameMode === 'ONLINE' && !mp.isHost) { if (target === 'PLAYER') { if (!isRemoteEffect) mp.sendData({ type: 'UNO_DRAW_REQ', amount }); return []; } return []; }
        playLand(); let currentDeck = [...deck]; let currentDiscard = manualDiscardPile ? [...manualDiscardPile] : [...discardPile]; const drawnCards: Card[] = []; let didReshuffle = false;
        for(let i=0; i<amount; i++) {
            if (currentDeck.length === 0) { if (currentDiscard.length > 1) { const top = currentDiscard.pop()!; currentDeck = currentDiscard.sort(() => Math.random() - 0.5); currentDiscard = [top]; setMessage("Mélange du talon..."); didReshuffle = true; } else break; }
            drawnCards.push(currentDeck.pop()!);
        }
        setDeck(currentDeck); if (didReshuffle) setDiscardPile(currentDiscard);
        if (target === 'PLAYER') { setPlayerHand(prev => [...prev, ...drawnCards]); setShowContestButton(false); if (gameMode === 'ONLINE' && mp.isHost) mp.sendData({ type: 'UNO_DRAW_NOTIFY', count: drawnCards.length }); }
        else {
            if (gameMode === 'SOLO') { setCpuHand(prev => [...prev, ...drawnCards]); setOpponentCalledUno(false); }
            else { const dummies = Array.from({ length: drawnCards.length }).map((_, i) => ({ id: `opp_draw_${Date.now()}_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 })); setCpuHand(prev => [...prev, ...dummies]); setOpponentCalledUno(false); mp.sendData({ type: 'UNO_DRAW_RESP', cards: drawnCards }); }
        }
        return drawnCards;
    };

    const handlePassTurn = () => { setMessage("Tour passé"); setHasDrawnThisTurn(false); setTurn('CPU'); if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_PASS' }); };

    const handleDrawPileClick = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation(); if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return;
        setShowContestButton(false);
        if (hasDrawnThisTurn) { handlePassTurn(); return; }
        if (gameMode === 'SOLO') { const drawn = drawCard('PLAYER', 1); setHasDrawnThisTurn(true); const newCard = drawn[0]; if (newCard && checkCompatibility(newCard)) setMessage("Carte jouable !"); else { setMessage("Pas de chance..."); setTimeout(() => setTurn('CPU'), 1000); } }
        else { if (mp.isHost) { const drawn = drawCard('PLAYER', 1); setHasDrawnThisTurn(true); const newCard = drawn[0]; if (!newCard || !checkCompatibility(newCard)) { setTimeout(() => { setTurn('CPU'); mp.sendData({ type: 'UNO_PASS' }); }, 1000); } else setMessage("Carte jouable !"); } else mp.sendData({ type: 'UNO_DRAW_REQ', amount: 1 }); }
    };

    const handleUnoClick = () => { if (turn === 'PLAYER' && playerHand.length === 2 && !playerCalledUno) { setPlayerCalledUno(true); setUnoShout('PLAYER'); playPaddleHit(); setTimeout(() => setUnoShout(null), 1500); if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_SHOUT' }); } };
    const handleContestClick = () => { if (showContestButton) { setMessage("CONTRE-UNO ! +2 pour ADV"); playPaddleHit(); setShowContestButton(false); drawCard('CPU', 2); if(gameMode === 'ONLINE') mp.sendData({ type: 'UNO_CONTEST' }); } };

    const animateCardPlay = (card: Card, index: number, actor: Turn, startRect?: DOMRect, isRemote: boolean = false) => {
        setIsAnimating(true); playMove(); const discardRect = discardPileRef.current?.getBoundingClientRect();
        if (!discardRect) { executeCardEffect(card, index, actor, isRemote); setIsAnimating(false); return; }
        let startX = startRect ? startRect.left : (window.innerWidth / 2);
        let startY = startRect ? startRect.top : (50);
        setFlyingCard({ card, startX, startY, targetX: discardRect.left, targetY: discardRect.top, rotation: Math.random() * 20 - 10 });
        setTimeout(() => { setFlyingCard(null); playLand(); executeCardEffect(card, index, actor, isRemote); setIsAnimating(false); }, 500);
    };

    const executeCardEffect = (card: Card, index: number, actor: Turn, isRemote: boolean) => {
        const currentState = gameStateRef.current; let hand = actor === 'PLAYER' ? [...currentState.playerHand] : [...currentState.cpuHand];
        const cardInHandIndex = hand.findIndex(c => c.id === card.id);
        if (cardInHandIndex !== -1) hand.splice(cardInHandIndex, 1); else hand.splice(index, 1);
        if (actor === 'PLAYER') setPlayerHand(hand); else setCpuHand(hand);
        const newDiscardPile = [...currentState.discardPile, card]; setDiscardPile(newDiscardPile);
        if (card.color !== 'black') setActiveColor(card.color);
        if (actor === 'PLAYER') { if (hand.length === 1 && !playerCalledUno) { setMessage("OUBLI UNO ! +2"); playGameOver(); drawCard('PLAYER', 2, newDiscardPile); } setShowContestButton(false); }
        else { if (hand.length === 1) { let forgot = gameMode === 'SOLO' ? Math.random() > 0.8 : !opponentCalledUno; if (forgot) setShowContestButton(true); else { setUnoShout('CPU'); setTimeout(() => setUnoShout(null), 1500); } } else setShowContestButton(false); }
        if (hand.length === 0) { handleGameOver(actor); if (gameMode === 'ONLINE' && !isRemote) mp.sendData({ type: 'UNO_GAME_OVER', winner: mp.peerId }); return; }
        let nextTurn: Turn = actor === 'PLAYER' ? 'CPU' : 'PLAYER';
        if (card.value === 'skip') { setMessage("Passe ton tour !"); nextTurn = actor; }
        else if (card.value === 'reverse') { setMessage("Sens inverse !"); setPlayDirection(prev => prev * -1 as 1 | -1); nextTurn = actor; }
        else if (card.value === 'draw2') { setMessage("+2 cartes !"); if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) drawCard(nextTurn, 2, newDiscardPile); nextTurn = actor; }
        else if (card.value === 'wild') { setMessage("Joker !"); if (actor === 'PLAYER') { setGameState('color_select'); return; } else { if (gameMode === 'SOLO') { const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 }; hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; }); const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b); setActiveColor(bestColor); setMessage(`CPU choisit : ${COLOR_CONFIG[bestColor].label}`); } } }
        else if (card.value === 'wild4') { setMessage("+4 cartes !"); if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) drawCard(nextTurn, 4, newDiscardPile); if (actor === 'PLAYER') { setGameState('color_select'); return; } else { if (gameMode === 'SOLO') { const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 }; hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; }); const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b); setActiveColor(bestColor); setMessage(`CPU choisit : ${COLOR_CONFIG[bestColor].label}`); } nextTurn = actor; } }
        setTurn(nextTurn);
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: Card, index: number) => { e.stopPropagation(); if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return; setShowContestButton(false); if (checkCompatibility(card)) { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); animateCardPlay(card, index, 'PLAYER', rect); if (gameMode === 'ONLINE' && card.color !== 'black') mp.sendData({ type: 'UNO_PLAY', card }); } };
    
    const handleColorSelect = (color: Color) => { 
        setActiveColor(color); 
        setGameState('playing'); 
        const topCard = discardPile[discardPile.length - 1]; 
        let nextTurn: Turn = topCard.value === 'wild4' ? 'PLAYER' : 'CPU'; 
        if (topCard.value === 'wild4') setMessage("L'adversaire passe son tour !"); 
        else setMessage(`Couleur choisie : ${COLOR_CONFIG[color].label}`);
        setTurn(nextTurn); 
        if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_PLAY', card: discardPile[discardPile.length - 1], nextColor: color }); 
    };

    const handleGameOver = (winnerTurn: Turn) => { setWinner(winnerTurn); setGameState('gameover'); if (winnerTurn === 'PLAYER') { playVictory(); const points = cpuHand.length * 10 + 50; setScore(points); const coins = Math.max(10, Math.floor(points / 2)); addCoins(coins); setEarnedCoins(coins); updateHighScore('uno', points); if (onReportProgress) onReportProgress('win', 1); } else playGameOver(); };

    // --- MULTIPLAYER PROTOCOL (RESTORED) ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'UNO_INIT') {
                setPlayerHand(data.hand);
                const dummies = Array.from({ length: data.oppHandCount }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                setCpuHand(dummies);
                setDiscardPile([data.topCard]);
                setActiveColor(data.topCard.color);
                setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                setGameState('playing');
                setIsWaitingForHost(false);
                setMessage("Prêt !");
            }
            if (data.type === 'UNO_PLAY') {
                if (data.nextColor) {
                    setActiveColor(data.nextColor);
                    setMessage(`Couleur demandée : ${COLOR_CONFIG[data.nextColor].label}`);
                }
                animateCardPlay(data.card, 0, 'CPU', undefined, true);
            }
            if (data.type === 'UNO_DRAW_REQ' && mp.isHost) {
                drawCard('CPU', data.amount || 1);
            }
            if (data.type === 'UNO_DRAW_RESP') {
                setPlayerHand(prev => [...prev, ...data.cards]);
                setTurn('CPU');
                setMessage("Carte piochée");
            }
            if (data.type === 'UNO_DRAW_NOTIFY') {
                const dummies = Array.from({ length: data.count }).map((_, i) => ({ id: `opp_draw_${Date.now()}_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                setCpuHand(prev => [...prev, ...dummies]);
            }
            if (data.type === 'UNO_PASS') {
                setTurn('PLAYER');
                setMessage("Ton tour !");
            }
            if (data.type === 'UNO_SHOUT') {
                setOpponentCalledUno(true);
                setUnoShout('CPU');
                setTimeout(() => setUnoShout(null), 1500);
            }
            if (data.type === 'UNO_CONTEST') {
                setMessage("CONTRE-UNO RÉUSSI !");
                drawCard('PLAYER', 2);
            }
            if (data.type === 'UNO_GAME_OVER') {
                handleGameOver('CPU');
            }
            if (data.type === 'REMATCH_START') {
                startNewGame('ONLINE');
            }
            if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setGameState('gameover');
            }
        };
    }, [mp.isHost, mp.peerId]);

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp]);

    useEffect(() => { if (gameMode === 'SOLO' && turn === 'CPU' && gameState === 'playing' && !isAnimating) { const timer = setTimeout(() => { const topCard = discardPile[discardPile.length - 1]; const validIndices = cpuHand.map((c, i) => ({c, i})).filter(({c}) => c.color === activeColor || c.value === topCard.value || c.color === 'black'); if (validIndices.length > 0) { validIndices.sort((a, b) => { if (a.c.color === 'black') return 1; if (a.c.value === 'draw2' || a.c.value === 'skip' || a.c.value === 'reverse') return -1; return 0; }); const move = validIndices[0]; animateCardPlay(move.c, move.i, 'CPU'); } else { drawCard('CPU', 1); setTurn('PLAYER'); } }, 1500); return () => clearTimeout(timer); } }, [turn, gameState, cpuHand, activeColor, discardPile, isAnimating, gameMode]);

    const handleLocalBack = () => { if (phase === 'GAME' || (gameMode === 'ONLINE' && onlineStep === 'lobby')) backToMenu(); else onBack(); };

    // --- CARD VIEW COMPONENT ---
    const CardView = ({ card, onClick, faceUp = true, small = false, style }: { card: Card, onClick?: (e: React.MouseEvent) => void, faceUp?: boolean, small?: boolean, style?: React.CSSProperties }) => {
        if (!faceUp) { return ( <div style={style} className={`${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden group`}> <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div> <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/50 rounded-full border border-gray-600 flex flex-col items-center justify-center relative z-10 rotate-12"> <span className="font-script text-neon-pink text-[10px] sm:text-xs leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Neon</span> <span className="font-black italic text-cyan-400 text-sm sm:text-lg leading-none drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">ONE</span> </div> </div> ); }
        const config = COLOR_CONFIG[card.color]; let displayValue: string = card.value; let Icon = null;
        if (card.value === 'skip') Icon = Ban; else if (card.value === 'reverse') Icon = RotateCcw; else if (card.value === 'draw2') displayValue = '+2'; else if (card.value === 'wild') Icon = Palette; else if (card.value === 'wild4') displayValue = '+4';
        const isPlayerHand = onClick !== undefined; let isPlayable = isPlayerHand && turn === 'PLAYER' ? checkCompatibility(card) : true;
        const liftClass = isPlayerHand ? (isPlayable ? '-translate-y-6 sm:-translate-y-8 shadow-[0_0_25px_rgba(255,255,255,0.4)] z-30 brightness-110 ring-2 ring-white/70' : 'brightness-50 z-0 translate-y-2') : '';
        const isWild = card.color === 'black';
        return ( <div onClick={onClick} style={style} className={`${small ? 'w-10 h-14' : 'w-20 h-28 sm:w-28 sm:h-40'} relative rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 select-none shadow-xl border-2 ${config.border} ${liftClass} bg-gray-900`}> {isWild ? ( <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#ef4444,#eab308,#22c55e,#3b82f6,#ef4444)] animate-[spin_4s_linear_infinite] opacity-100 z-0"></div> ) : ( <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80 z-0`}></div> )} <div className={`absolute inset-2 sm:inset-3 rounded-[50%_/_40%] border ${isWild ? 'border-white/40 bg-black/80' : 'border-white/20 bg-black/40'} backdrop-blur-sm flex items-center justify-center z-10 shadow-inner`}> <div className={`font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isWild ? (Icon ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400') : 'text-white'} text-3xl sm:text-5xl flex items-center justify-center`}> {Icon ? <Icon size={small ? 20 : 40} strokeWidth={2.5} className={isWild ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : ""} /> : displayValue} </div> </div> <div className="absolute top-1 left-1.5 text-[10px] sm:text-sm font-bold leading-none text-white drop-shadow-md z-20"> {Icon ? <Icon size={12}/> : displayValue} </div> <div className="absolute bottom-1 right-1.5 text-[10px] sm:text-sm font-bold leading-none transform rotate-180 text-white drop-shadow-md z-20"> {Icon ? <Icon size={12}/> : displayValue} </div> <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20"></div> </div> );
    };

    if (phase === 'MENU') { return ( <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"> <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15]">NEON ONE</h1> <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8"> <button onClick={() => initGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95"> <User size={24} className="text-neon-blue"/> 1 JOUEUR </button> <button onClick={() => initGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95"> <Globe size={24} className="text-green-500"/> EN LIGNE </button> </div> <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button> </div> ); }
    
    if (gameMode === 'ONLINE' && onlineStep === 'lobby') { return ( <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2"> <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" /> <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0"> <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button> <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 pr-2 pb-1">NEON ONE</h1> <div className="w-10"></div> </div> { mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId).length > 0 ? mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId).map(player => ( <div key={player.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-white/10 mb-2"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-white/10"><User size={24}/></div> <span className="font-bold">{player.name}</span> </div> <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-black rounded-lg text-xs shadow-lg active:scale-95">REJOINDRE</button> </div> )) : <p className="text-gray-500 italic mt-20">Aucune partie disponible...</p> } </div> ); }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans touch-none select-none">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-40 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            {showTutorial && <TutorialOverlay gameId="uno" onClose={() => setShowTutorial(false)} />}
            {unoShout && <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none animate-in zoom-in duration-300"> <div className="bg-red-600 px-10 py-5 rounded-full border-4 border-yellow-400 shadow-[0_0_50px_red] transform -rotate-12"> <span className="text-6xl font-black italic text-white drop-shadow-lg tracking-tighter">ONE !</span> </div> </div>}
            {flyingCard && <div className="fixed z-[100] pointer-events-none" style={{left: 0, top: 0, animation: 'flyCard 0.5s ease-in-out forwards'}}> <style>{`@keyframes flyCard { 0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); } 100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); } }`}</style> <CardView card={flyingCard.card} style={{ width: '80px', height: '112px' }} /> </div>}
            
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center"><h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] pr-2 pb-1">NEON ONE</h1><span className="text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10 tracking-widest">{message || (turn === 'PLAYER' ? 'À TOI !' : "L'ADVERSAIRE JOUE...")}</span></div>
                <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button><button onClick={() => startNewGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button></div>
            </div>

            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10 min-h-0 shrink">
                {/* OPPONENT HAND */}
                <div ref={cpuHandRef} className="flex justify-center -space-x-8 sm:-space-x-12 px-4 overflow-hidden h-32 sm:h-48 items-start pt-4 shrink-0 transition-all"> 
                    {cpuHand.map((card, i) => ( 
                        <div key={card.id || i} style={{ transform: `rotate(${(i - cpuHand.length/2) * 4}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }} className="transition-transform duration-500"> 
                            <CardView card={card} faceUp={false} /> 
                        </div> 
                    ))} 
                    {cpuHand.length > 8 && <div className="absolute top-20 right-4 bg-red-600 text-white font-black px-2 py-1 rounded text-xs shadow-lg">{cpuHand.length}</div>}
                </div>

                {/* CENTER AREA (PILE & DRAW) */}
                <div className="flex-1 flex items-center justify-center gap-6 sm:gap-12 relative min-h-[150px] shrink">
                    <div onClick={handleDrawPileClick} className={`relative group z-10 transition-transform ${turn === 'PLAYER' && !isAnimating ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}> 
                        <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative"> 
                            {turn === 'PLAYER' && !hasDrawnThisTurn && !isAnimating && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse rounded-xl"></div>} 
                            <Layers size={32} className="text-gray-600" /> 
                            <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-white ${hasDrawnThisTurn ? 'bg-red-600' : 'bg-black/50'} px-2 py-1 rounded-full border border-white/10 transition-colors`}>{hasDrawnThisTurn ? 'PASSER' : 'PIOCHER'}</div> 
                        </div> 
                    </div>
                    <div className="relative flex items-center justify-center z-10" ref={discardPileRef}> 
                        <div className={`absolute -inset-12 rounded-full blur-3xl opacity-50 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div> 
                        <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">
                            {discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}
                        </div> 
                    </div>
                </div>

                {/* PLAYER HAND */}
                <div className={`w-full relative px-4 z-20 ${gameMode === 'ONLINE' ? 'pb-24' : 'pb-4'} min-h-[180px] flex flex-col justify-end shrink-0`}>
                    <div className="absolute -top-20 left-0 right-0 flex justify-center pointer-events-none z-50 h-20 items-end gap-4"> 
                        {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && ( 
                            <button onClick={handleUnoClick} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce flex items-center gap-2 border-4 border-yellow-400"><Megaphone size={24} fill="white" /> CRIER ONE !</button> 
                        )} 
                        {showContestButton && (
                            <button onClick={handleContestClick} className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse flex items-center gap-2 border-4 border-red-600"><AlertTriangle size={24} fill="black" /> CONTRE-ONE !</button>
                        )} 
                    </div>
                    <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4"> 
                        <div className={`flex w-fit mx-auto px-8 -space-x-12 sm:-space-x-16 items-end min-h-[160px] transition-all duration-500`}> 
                            {playerHand.map((card, i) => ( 
                                <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * 3}deg) translateY(${Math.abs(i - playerHand.length/2) * 4}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}> 
                                    <CardView card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} /> 
                                </div> 
                            ))} 
                        </div> 
                    </div>
                </div>
            </div>

            {/* COLOR SELECT MODAL (RESTORED) */}
            {gameState === 'color_select' && (
                <div className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-gray-900 p-8 rounded-[40px] border border-white/10 shadow-2xl flex flex-col items-center relative">
                        <div className="absolute -top-12 p-4 bg-gray-900 border border-white/10 rounded-full shadow-2xl text-cyan-400 animate-bounce">
                            <Palette size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-white italic mb-8 mt-4 tracking-tighter">CHOISIS TA COULEUR</h2>
                        <div className="grid grid-cols-2 gap-6 w-64">
                            {COLORS.map(color => (
                                <button 
                                    key={color}
                                    onClick={() => handleColorSelect(color)}
                                    className={`aspect-square rounded-3xl border-4 ${COLOR_CONFIG[color].border} ${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].shadow} active:scale-90 transition-all shadow-xl group overflow-hidden relative`}
                                >
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                                    <div className="absolute top-2 left-2 w-4 h-4 bg-white/30 rounded-full blur-[2px]"></div>
                                </button>
                            ))}
                        </div>
                        <p className="mt-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">Le changement d'ambiance sera immédiat</p>
                    </div>
                </div>
            )}

            {/* GAMEOVER MODAL (RESTORED) */}
            {gameState === 'gameover' && ( 
                <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500"> 
                    {opponentLeft ? ( 
                        <div className="flex flex-col items-center gap-4"> 
                            <LogOut size={80} className="text-red-500 mb-2 animate-pulse"/> 
                            <h2 className="text-4xl font-black text-white italic">L'ADVERSAIRE A QUITTÉ</h2> 
                        </div> 
                    ) : winner === 'PLAYER' ? ( <> <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" /> <h2 className="text-5xl font-black text-white italic mb-2">VICTOIRE !</h2> </> ) : ( <> <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" /> <h2 className="text-5xl font-black text-white italic mb-4">DÉFAITE...</h2> </> )} 
                    
                    {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-black text-xl">+{earnedCoins} PIÈCES</span></div>} 
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs"> 
                        <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else startNewGame(gameMode); }} className="w-full py-4 bg-green-500 text-black font-black tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_#22c55e] transition-all hover:bg-white">
                            <RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'DEMANDER REVANCHE' : 'REJOUER'}
                        </button> 
                        <button onClick={handleLocalBack} className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl border border-white/5 hover:bg-gray-700 transition-colors">QUITTER LE SALON</button> 
                    </div> 
                </div> 
            )}

            {/* WAITING FOR OPPONENT ONLINE */}
            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2 text-white">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4 shadow-lg active:scale-95">ANNULER</button>
                </div>
            )}
        </div>
    );
};
