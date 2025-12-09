
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, LogOut, ArrowLeft, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, Megaphone, AlertTriangle, User, Users, Globe, Loader2, RotateCcw } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

// --- TYPES & CONSTANTS ---
type Color = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW' | 'BLACK';
type Type = 'NUMBER' | 'SKIP' | 'REVERSE' | 'DRAW2' | 'WILD' | 'WILD4';

interface Card {
    id: string;
    color: Color;
    type: Type;
    value?: number; // 0-9
}

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

const COLORS: Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const COLOR_CONFIG: Record<string, { bg: string, text: string, border: string }> = {
    RED: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
    BLUE: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    GREEN: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
    YELLOW: { bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400' },
    BLACK: { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-600' },
};

// Reactions
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

const CardView = ({ card, onClick, className }: { card: Card, onClick?: (e: React.MouseEvent) => void, className?: string }) => {
    const config = COLOR_CONFIG[card.color] || COLOR_CONFIG['BLACK'];
    
    const renderContent = () => {
        if (card.type === 'NUMBER') return <span className="text-4xl font-black">{card.value}</span>;
        if (card.type === 'SKIP') return <div className="flex flex-col items-center"><div className="w-8 h-8 border-4 border-current rounded-full flex items-center justify-center"><div className="w-6 h-1 bg-current rotate-45"></div></div></div>;
        if (card.type === 'REVERSE') return <RotateCcw size={32} strokeWidth={3} />;
        if (card.type === 'DRAW2') return <div className="text-2xl font-black flex flex-col items-center leading-none"><span>+2</span><div className="flex -space-x-2 mt-1"><div className="w-4 h-6 border bg-current rounded-sm"></div><div className="w-4 h-6 border bg-current rounded-sm"></div></div></div>;
        if (card.type === 'WILD') return <div className="grid grid-cols-2 w-12 h-12 gap-0.5"><div className="bg-red-500 rounded-tl-full"></div><div className="bg-blue-500 rounded-tr-full"></div><div className="bg-yellow-400 rounded-bl-full"></div><div className="bg-green-500 rounded-br-full"></div></div>;
        if (card.type === 'WILD4') return <div className="flex flex-col items-center"><span className="text-xl font-black mb-1">+4</span><div className="grid grid-cols-2 w-8 h-8 gap-0.5"><div className="bg-red-500 rounded-sm"></div><div className="bg-blue-500 rounded-sm"></div><div className="bg-yellow-400 rounded-sm"></div><div className="bg-green-500 rounded-sm"></div></div></div>;
    };

    return (
        <div 
            onClick={onClick}
            className={`w-24 h-36 rounded-xl border-4 ${config.border} ${config.bg} ${config.text} flex flex-col items-center justify-center shadow-lg relative select-none cursor-pointer hover:-translate-y-4 transition-transform duration-200 ${className}`}
        >
            <div className="w-20 h-32 rounded-lg border-2 border-white/20 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                <div className="drop-shadow-md filter">{renderContent()}</div>
            </div>
            {/* Small corner indicators */}
            <div className="absolute top-1 left-1 text-[10px] font-bold">{card.type === 'NUMBER' ? card.value : (card.type === 'WILD' ? 'W' : card.type === 'WILD4' ? '+4' : card.type[0])}</div>
            <div className="absolute bottom-1 right-1 text-[10px] font-bold rotate-180">{card.type === 'NUMBER' ? card.value : (card.type === 'WILD' ? 'W' : card.type === 'WILD4' ? '+4' : card.type[0])}</div>
        </div>
    );
};

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp }) => {
    // --- STATE ---
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'color_select' | 'gameover'>('menu');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [turn, setTurn] = useState<'PLAYER' | 'OPPONENT'>('PLAYER');
    const [winner, setWinner] = useState<'PLAYER' | 'OPPONENT' | null>(null);
    
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [opponentHandCount, setOpponentHandCount] = useState(7);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);
    const [drawPileCount, setDrawPileCount] = useState(50);
    const [currentColor, setCurrentColor] = useState<Color>('RED'); // Active color (handles Wilds)
    
    const [direction, setDirection] = useState(1); // 1 or -1
    const [unoShout, setUnoShout] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);
    const [flyingCard, setFlyingCard] = useState<{card: Card, from: 'PLAYER' | 'OPPONENT' | 'DECK', to: 'DISCARD' | 'PLAYER' | 'OPPONENT'} | null>(null);

    // Online
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

    // --- REFS ---
    const handleDataRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- GAME LOGIC HELPERS ---
    const generateDeck = (): Card[] => {
        const deck: Card[] = [];
        const colors: Color[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
        let idCounter = 0;

        colors.forEach(color => {
            deck.push({ id: `c-${idCounter++}`, color, type: 'NUMBER', value: 0 });
            for (let i = 1; i <= 9; i++) {
                deck.push({ id: `c-${idCounter++}`, color, type: 'NUMBER', value: i });
                deck.push({ id: `c-${idCounter++}`, color, type: 'NUMBER', value: i });
            }
            ['SKIP', 'REVERSE', 'DRAW2'].forEach(type => {
                deck.push({ id: `c-${idCounter++}`, color, type: type as Type });
                deck.push({ id: `c-${idCounter++}`, color, type: type as Type });
            });
        });

        for (let i = 0; i < 4; i++) {
            deck.push({ id: `c-${idCounter++}`, color: 'BLACK', type: 'WILD' });
            deck.push({ id: `c-${idCounter++}`, color: 'BLACK', type: 'WILD4' });
        }

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const drawCards = (count: number, deck: Card[]): Card[] => {
        return deck.splice(0, count);
    };

    const checkPlayable = (card: Card, topCard: Card, activeColor: Color) => {
        if (card.color === 'BLACK') return true; // Wilds always playable
        if (card.color === activeColor) return true;
        if (card.type === topCard.type) {
            if (card.type === 'NUMBER') return card.value === topCard.value;
            return true;
        }
        return false;
    };

    // --- GAME ACTIONS ---
    const startGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        if (mode === 'SOLO') {
            resetGame();
            setGameState('playing');
        } else {
            setOnlineStep('connecting');
            mp.connect();
        }
    };

    const resetGame = () => {
        const deck = generateDeck();
        const pHand = drawCards(7, deck);
        const oHandCount = 7;
        let startCard = deck.shift()!;
        while (startCard.color === 'BLACK') {
            deck.push(startCard);
            startCard = deck.shift()!;
        }
        
        setPlayerHand(pHand);
        setOpponentHandCount(oHandCount);
        setDiscardPile([startCard]);
        setCurrentColor(startCard.color);
        setDrawPileCount(deck.length);
        setTurn('PLAYER');
        setWinner(null);
        setPlayerCalledUno(false);
        setUnoShout(false);
        setGameState('playing');
    };

    const handlePlayerCardClick = (e: React.MouseEvent, card: Card, index: number) => {
        e.stopPropagation();
        if (turn !== 'PLAYER' || gameState !== 'playing') return;
        
        const topCard = discardPile[discardPile.length - 1];
        if (checkPlayable(card, topCard, currentColor)) {
            playMove();
            
            // Optimistic Update
            const newHand = [...playerHand];
            newHand.splice(index, 1);
            setPlayerHand(newHand);
            setDiscardPile(prev => [...prev, card]);
            
            if (card.color !== 'BLACK') setCurrentColor(card.color);

            // Handle Special Cards
            let nextTurn: 'PLAYER' | 'OPPONENT' = 'OPPONENT';
            if (card.type === 'SKIP') nextTurn = 'PLAYER';
            if (card.type === 'REVERSE') {
                if (gameMode === 'SOLO' || gameMode === 'ONLINE') nextTurn = 'PLAYER'; // 1v1 reverse = skip
            }
            
            if (card.color === 'BLACK') {
                setGameState('color_select');
                // Don't switch turn yet
            } else {
                if (card.type === 'DRAW2') {
                    setOpponentHandCount(c => c + 2); // Sim logic
                    // In real implementation, we'd handle stacking or passing cards
                    nextTurn = 'PLAYER'; // Skip opponent
                }
                setTurn(nextTurn);
            }

            if (newHand.length === 0) {
                handleGameOver('PLAYER');
            } else if (newHand.length === 1 && !playerCalledUno) {
                // Forgot UNO penalty
                setTimeout(() => {
                    const penalty = [
                        {id: 'p1', color: 'RED', type: 'NUMBER', value: 1}, 
                        {id: 'p2', color: 'BLUE', type: 'NUMBER', value: 2}
                    ] as Card[]; // Mock penalty
                    setPlayerHand(h => [...h, ...penalty]);
                    playPaddleHit(); // Penalty sound
                }, 1000);
            }
        } else {
            playPaddleHit(); // Invalid move
        }
    };

    const handleColorSelect = (color: Color) => {
        setCurrentColor(color);
        setGameState('playing');
        
        const topCard = discardPile[discardPile.length - 1];
        let nextTurn: 'PLAYER' | 'OPPONENT' = 'OPPONENT';
        
        if (topCard.type === 'WILD4') {
            setOpponentHandCount(c => c + 4);
            nextTurn = 'PLAYER';
        }
        
        setTurn(nextTurn);
    };

    const handleDrawCard = () => {
        if (turn !== 'PLAYER' || gameState !== 'playing') return;
        playLand();
        // Sim draw
        const newCard: Card = { id: `d-${Date.now()}`, color: 'RED', type: 'NUMBER', value: Math.floor(Math.random() * 9) };
        setPlayerHand(prev => [...prev, newCard]);
        setTurn('OPPONENT');
    };

    const handleUnoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playerHand.length <= 2) {
            setPlayerCalledUno(true);
            setUnoShout(true);
            setTimeout(() => setUnoShout(false), 2000);
            resumeAudio();
        }
    };

    const handleContestClick = () => {
        // Feature logic would go here
    };

    const handleGameOver = (winner: 'PLAYER' | 'OPPONENT') => {
        setWinner(winner);
        setGameState('gameover');
        if (winner === 'PLAYER') {
            playVictory();
            addCoins(100);
        } else {
            playGameOver();
        }
    };

    // --- AI ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'OPPONENT' && gameState === 'playing' && !winner) {
            const timer = setTimeout(() => {
                // Simple AI
                // Logic: Find first playable card
                // If Wild, pick random color
                setTurn('PLAYER');
                setOpponentHandCount(prev => Math.max(0, prev - 1));
                if (opponentHandCount <= 1) handleGameOver('OPPONENT');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [turn, gameState, winner, gameMode]);

    // --- RENDER HELPERS ---
    const rotationFactor = 5;
    const spacingClass = playerHand.length > 7 ? '-ml-12' : '-ml-8';

    // --- MULTIPLAYER LOBBY ---
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

    // Chat
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

    if (gameState === 'menu') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15]">NEON UNO</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => startGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                        <User size={24} className="text-neon-blue"/> SOLO
                    </button>
                    <button onClick={() => startGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
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
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={() => setGameState('menu')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 pr-2 pb-1">UNO</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-yellow-400 animate-spin mb-4" /><p className="text-yellow-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={() => setGameState('menu')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex items-center gap-2 bg-gray-900/80 px-4 py-1.5 rounded-full border border-white/10">
                    <div className={`w-3 h-3 rounded-full ${COLOR_CONFIG[currentColor].bg} shadow-[0_0_10px_currentColor]`}></div>
                    <span className="font-bold text-sm text-gray-300">{turn === 'PLAYER' ? 'À VOUS' : 'ADVERSAIRE'}</span>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full max-w-lg flex flex-col justify-between relative overflow-hidden">
                
                {/* Opponent Hand */}
                <div className="flex justify-center -mt-8 relative z-0">
                    {Array.from({ length: Math.min(opponentHandCount, 7) }).map((_, i) => (
                        <div key={i} className="w-16 h-24 bg-gray-800 rounded-lg border-2 border-white/20 -ml-4 shadow-lg transform rotate-180">
                            <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-md">
                                <span className="font-script text-xs text-white/20">Neon</span>
                            </div>
                        </div>
                    ))}
                    {opponentHandCount > 7 && <div className="absolute top-10 right-10 text-white font-bold">+{opponentHandCount - 7}</div>}
                </div>

                {/* Center Field */}
                <div className="flex-1 flex items-center justify-center gap-8 z-10">
                    <div className="relative">
                        <div onClick={handleDrawCard} className="w-24 h-36 bg-gray-800 rounded-xl border-4 border-white/10 flex flex-col items-center justify-center shadow-xl cursor-pointer hover:scale-105 transition-transform active:scale-95 group">
                            <span className="font-script text-neon-pink text-xl drop-shadow-[0_0_5px_currentColor]">Neon</span>
                            <span className="font-script text-cyan-400 text-xl drop-shadow-[0_0_5px_currentColor]">Uno</span>
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-gray-900 font-bold text-xs shadow-lg">{drawPileCount}</div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        {discardPile.length > 0 && (
                            <div className="transform rotate-6 transition-transform">
                                <CardView card={discardPile[discardPile.length - 1]} />
                            </div>
                        )}
                        <div className={`absolute -inset-4 rounded-full blur-xl opacity-40 z-[-1] animate-pulse ${COLOR_CONFIG[currentColor].bg}`}></div>
                    </div>
                </div>

                {/* Player Hand */}
                <div className={`w-full relative px-4 ${gameState === 'color_select' ? 'z-[60]' : 'z-20'} ${gameMode === 'ONLINE' ? 'pb-24' : 'pb-4'} min-h-[180px] flex flex-col justify-end shrink-0`}>
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
                                return <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * rotationFactor}deg) translateY(${Math.abs(i - playerHand.length/2) * (rotationFactor * 1.5)}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}><CardView card={card} onClick={(e) => handlePlayerCardClick(e, card, i)} /></div>;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ONLINE CHAT */}
            {gameMode === 'ONLINE' && !winner && mp.gameOpponent && (
                <div className="w-full max-w-lg z-30 px-2 pb-4 absolute bottom-0 pointer-events-auto">
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
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-start pt-24 animate-in fade-in pointer-events-none">
                    {/* Gradient Background - Clear at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/80 to-transparent pointer-events-auto" style={{ bottom: '250px' }} />
                    
                    <div className="relative z-10 pointer-events-auto flex flex-col items-center">
                        <h2 className="text-3xl font-black text-white mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">CHOISIR UNE COULEUR</h2>
                        <div className="grid grid-cols-2 gap-6 bg-gray-900/90 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            {COLORS.map(c => (
                                <button key={c} onClick={() => handleColorSelect(c)} className={`w-28 h-28 rounded-2xl border-4 ${COLOR_CONFIG[c].border} bg-gray-900 hover:scale-105 transition-transform flex items-center justify-center group`}>
                                    <div className={`w-16 h-16 rounded-full ${COLOR_CONFIG[c].text.replace('text', 'bg')} shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform`}></div>
                                </button>
                            ))}
                        </div>
                        <p className="mt-6 text-gray-400 text-xs font-bold tracking-widest uppercase bg-black/50 px-3 py-1 rounded-full border border-white/10">Regardez votre jeu pour choisir stratégiquement</p>
                    </div>
                </div>
            )}

            {(gameState === 'gameover' || opponentLeft) && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in">
                    <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_gold]" />
                    <h2 className="text-4xl font-black italic text-white mb-4">{winner === 'PLAYER' ? 'VICTOIRE !' : 'DÉFAITE...'}</h2>
                    <button onClick={() => resetGame()} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg">REJOUER</button>
                    <button onClick={() => setGameState('menu')} className="mt-4 text-gray-500 hover:text-white underline text-sm">MENU</button>
                </div>
            )}
        </div>
    );
};
