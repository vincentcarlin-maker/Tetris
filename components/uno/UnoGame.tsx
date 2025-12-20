
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

const COLOR_CONFIG: Record<Color, { border: string, text: string, shadow: string, bg: string, gradient: string }> = {
    red: { border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-red-500/50', bg: 'bg-red-950', gradient: 'from-red-600 to-red-900' },
    blue: { border: 'border-cyan-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', gradient: 'from-cyan-600 to-blue-900' },
    green: { border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-green-500/50', bg: 'bg-green-950', gradient: 'from-green-600 to-emerald-900' },
    yellow: { border: 'border-yellow-400', text: 'text-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-950', gradient: 'from-yellow-500 to-orange-800' },
    black: { border: 'border-purple-500', text: 'text-white', shadow: 'shadow-purple-500/50', bg: 'bg-gray-900', gradient: 'from-purple-600 via-pink-600 to-blue-600' },
};

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
    const chatEndRef = useRef<HTMLDivElement>(null);
    const handleDataRef = useRef<(data: any) => void>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
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
    const handleContestClick = () => { if (showContestButton) { setMessage("CONTRE-UNO ! +2 pour ADV"); playPaddleHit(); setShowContestButton(false); drawCard('CPU', 2); } };

    const animateCardPlay = (card: Card, index: number, actor: Turn, startRect?: DOMRect, isRemote: boolean = false) => {
        setIsAnimating(true); playMove(); const discardRect = discardPileRef.current?.getBoundingClientRect();
        if (!discardRect) { executeCardEffect(card, index, actor, isRemote); setIsAnimating(false); return; }
        let startX = startRect ? startRect.left : (cpuHandRef.current ? cpuHandRef.current.getBoundingClientRect().left + cpuHandRef.current.getBoundingClientRect().width/2 : window.innerWidth / 2);
        let startY = startRect ? startRect.top : (cpuHandRef.current ? cpuHandRef.current.getBoundingClientRect().top + 20 : 50);
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
        else if (card.value === 'wild') { setMessage("Joker !"); if (actor === 'PLAYER') { setGameState('color_select'); return; } else { if (gameMode === 'SOLO') { const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 }; hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; }); const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b); setActiveColor(bestColor); setMessage(`CPU choisit : ${bestColor.toUpperCase()}`); } } }
        else if (card.value === 'wild4') { setMessage("+4 cartes !"); if (!isRemote || (mp.isHost && gameMode === 'ONLINE')) drawCard(nextTurn, 4, newDiscardPile); if (actor === 'PLAYER') { setGameState('color_select'); return; } else { if (gameMode === 'SOLO') { const colorsCount: any = { red: 0, blue: 0, green: 0, yellow: 0 }; hand.forEach(c => { if(c.color !== 'black') colorsCount[c.color]++; }); const bestColor = (Object.keys(colorsCount) as Color[]).reduce((a, b) => colorsCount[a] > colorsCount[b] ? a : b); setActiveColor(bestColor); setMessage(`CPU choisit : ${bestColor.toUpperCase()}`); } nextTurn = actor; } }
        setTurn(nextTurn);
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: Card, index: number) => { e.stopPropagation(); if (turn !== 'PLAYER' || gameState !== 'playing' || isAnimating || showTutorial) return; setShowContestButton(false); if (checkCompatibility(card)) { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); animateCardPlay(card, index, 'PLAYER', rect); if (gameMode === 'ONLINE' && card.color !== 'black') mp.sendData({ type: 'UNO_PLAY', card }); } };
    const handleColorSelect = (color: Color) => { setActiveColor(color); setGameState('playing'); const topCard = discardPile[discardPile.length - 1]; let nextTurn: Turn = topCard.value === 'wild4' ? 'PLAYER' : 'CPU'; if (topCard.value === 'wild4') setMessage("L'adversaire passe son tour !"); setTurn(nextTurn); if (gameMode === 'ONLINE') mp.sendData({ type: 'UNO_PLAY', card: discardPile[discardPile.length - 1], nextColor: color }); };
    const handleGameOver = (winnerTurn: Turn) => { setWinner(winnerTurn); setGameState('gameover'); if (winnerTurn === 'PLAYER') { playVictory(); const points = cpuHand.length * 10 + 50; setScore(points); const coins = Math.max(10, Math.floor(points / 2)); addCoins(coins); setEarnedCoins(coins); updateHighScore('uno', points); if (onReportProgress) onReportProgress('win', 1); } else playGameOver(); };

    useEffect(() => { if (gameMode === 'SOLO' && turn === 'CPU' && gameState === 'playing' && !isAnimating) { const timer = setTimeout(() => { const topCard = discardPile[discardPile.length - 1]; const validIndices = cpuHand.map((c, i) => ({c, i})).filter(({c}) => c.color === activeColor || c.value === topCard.value || c.color === 'black'); if (validIndices.length > 0) { validIndices.sort((a, b) => { if (a.c.color === 'black') return 1; if (a.c.value === 'draw2' || a.c.value === 'skip' || a.c.value === 'reverse') return -1; return 0; }); const move = validIndices[0]; animateCardPlay(move.c, move.i, 'CPU'); } else { drawCard('CPU', 1); setTurn('PLAYER'); } }, 1500); return () => clearTimeout(timer); } }, [turn, gameState, cpuHand, activeColor, discardPile, isAnimating, gameMode]);

    const sendChat = (e?: React.FormEvent) => { if (e) e.preventDefault(); if (!chatInput.trim() || mp.mode !== 'in_game') return; const msg: ChatMessage = { id: Date.now(), text: chatInput.trim(), senderName: username, isMe: true, timestamp: Date.now() }; setChatHistory(prev => [...prev, msg]); mp.sendData({ type: 'CHAT', text: msg.text, senderName: username }); setChatInput(''); };
    const sendReaction = (reactionId: string) => { if (gameMode === 'ONLINE' && mp.mode === 'in_game') { setActiveReaction({ id: reactionId, isMe: true }); mp.sendData({ type: 'REACTION', id: reactionId }); setTimeout(() => setActiveReaction(null), 3000); } };
    const handleLocalBack = () => { if (phase === 'GAME' || (gameMode === 'ONLINE' && onlineStep === 'lobby')) backToMenu(); else onBack(); };

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
    if (gameMode === 'ONLINE' && onlineStep === 'lobby') { return ( <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2"> <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" /> <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0"> <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button> <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 pr-2 pb-1">NEON ONE</h1> <div className="w-10"></div> </div> { mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId).length > 0 ? mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId).map(player => ( <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center"><User size={24}/></div> <span>{player.name}</span> </div> <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs">REJOINDRE</button> </div> )) : <p>Aucune partie...</p> } </div> ); }

    return (
        <div ref={mainContainerRef} className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans touch-none select-none">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            {showTutorial && <TutorialOverlay gameId="uno" onClose={() => setShowTutorial(false)} />}
            {flyingCard && <div className="fixed z-[100] pointer-events-none" style={{left: 0, top: 0, animation: 'flyCard 0.5s ease-in-out forwards'}}> <style>{`@keyframes flyCard { 0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); } 100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); } }`}</style> <CardView card={flyingCard.card} style={{ width: '80px', height: '112px' }} /> </div>}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center"><h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] pr-2 pb-1">NEON ONE</h1><span className="text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10">{message}</span></div>
                <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button><button onClick={() => startNewGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button></div>
            </div>
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10 min-h-0 shrink">
                <div ref={cpuHandRef} className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-hidden h-32 sm:h-48 items-start pt-4 shrink-0"> {cpuHand.map((card, i) => ( <div key={card.id || i} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }}> <CardView card={card} faceUp={false} /> </div> ))} </div>
                <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 relative min-h-[150px] shrink">
                    <div onClick={handleDrawPileClick} className={`relative group z-10 transition-transform ${turn === 'PLAYER' ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}> <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative"> {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>} <Layers size={32} className="text-gray-600" /> <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white ${hasDrawnThisTurn ? 'bg-red-600' : 'bg-black/50'} px-2 py-1 rounded transition-colors`}>{hasDrawnThisTurn ? 'PASSER' : 'PIOCHER'}</div> </div> </div>
                    <div className="relative flex items-center justify-center z-10" ref={discardPileRef}> <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div> <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">{discardPile.length > 0 && <CardView card={discardPile[discardPile.length-1]} />}</div> </div>
                </div>
                <div className={`w-full relative px-4 z-20 ${gameMode === 'ONLINE' ? 'pb-24' : 'pb-4'} min-h-[180px] flex flex-col justify-end shrink-0`}>
                    <div className="absolute -top-20 left-0 right-0 flex justify-center pointer-events-none z-50 h-20 items-end gap-4"> {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && ( <button onClick={handleUnoClick} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce flex items-center gap-2 border-4 border-yellow-400"><Megaphone size={24} fill="white" /> CRIER ONE !</button> )} {showContestButton && <button onClick={handleContestClick} className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse flex items-center gap-2 border-4 border-red-600"><AlertTriangle size={24} fill="black" /> CONTRE-ONE !</button>} </div>
                    <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4"> <div className={`flex w-fit mx-auto px-8 -space-x-12 sm:-space-x-16 items-end min-h-[160px] transition-all duration-500`}> {playerHand.map((card, i) => ( <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * 3}deg) translateY(${Math.abs(i - playerHand.length/2) * 4}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}> <CardView card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} /> </div> ))} </div> </div>
                </div>
            </div>
            {gameState === 'gameover' && ( <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center"> {winner === 'PLAYER' ? ( <> <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" /> <h2 className="text-5xl font-black text-white italic mb-2">VICTOIRE !</h2> </> ) : ( <> <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" /> <h2 className="text-5xl font-black text-white italic mb-4">DÉFAITE...</h2> </> )} <button onClick={() => startNewGame(gameMode)} className="px-8 py-4 bg-green-500 text-black font-black tracking-widest rounded-full flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button> </div> )}
        </div>
    );
};
