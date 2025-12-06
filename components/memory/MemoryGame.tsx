
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Zap, Ghost, Star, Heart, Crown, Diamond, Anchor, Music, Sun, Moon, Cloud, Snowflake, Flame, Droplets, Skull, Gamepad2, Rocket, Coins, Play, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Hand, Users, User, ArrowLeft, LogOut, Globe } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { MemoryCard, Difficulty, ChatMessage } from './types';

interface MemoryGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>; // Shared connection
}

// --- CONFIGURATION ---

const ICONS = [
    { id: 'zap', icon: Zap, color: 'text-yellow-400' },
    { id: 'ghost', icon: Ghost, color: 'text-purple-400' },
    { id: 'star', icon: Star, color: 'text-pink-400' },
    { id: 'heart', icon: Heart, color: 'text-red-500' },
    { id: 'crown', icon: Crown, color: 'text-amber-400' },
    { id: 'diamond', icon: Diamond, color: 'text-cyan-400' },
    { id: 'rocket', icon: Rocket, color: 'text-orange-500' },
    { id: 'gamepad', icon: Gamepad2, color: 'text-green-400' },
    { id: 'skull', icon: Skull, color: 'text-gray-300' },
    { id: 'flame', icon: Flame, color: 'text-orange-600' },
    { id: 'music', icon: Music, color: 'text-blue-400' },
    { id: 'sun', icon: Sun, color: 'text-yellow-200' },
    { id: 'moon', icon: Moon, color: 'text-indigo-300' },
    { id: 'cloud', icon: Cloud, color: 'text-white' },
    { id: 'snow', icon: Snowflake, color: 'text-cyan-200' },
    { id: 'anchor', icon: Anchor, color: 'text-teal-400' },
    { id: 'drop', icon: Droplets, color: 'text-blue-500' },
    { id: 'coin', icon: Coins, color: 'text-yellow-500' },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number, cols: number, name: string, bonus: number }> = {
    EASY: { pairs: 6, cols: 6, name: 'FACILE', bonus: 10 },    // 12 cards -> 6 cols x 2 rows
    MEDIUM: { pairs: 9, cols: 6, name: 'MOYEN', bonus: 20 },   // 18 cards -> 6 cols x 3 rows
    HARD: { pairs: 12, cols: 6, name: 'DIFFICILE', bonus: 40 } // 24 cards -> 6 cols x 4 rows
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

type MenuState = 'MENU' | 'DIFFICULTY' | 'GAME';

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const { playMove, playLand, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.memory || 0; 

    // Identity for Lobby
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();
    
    // Game State
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [moves, setMoves] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Online State
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [menuState, setMenuState] = useState<MenuState>('MENU');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForDeck, setIsWaitingForDeck] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);

    // Chat & Reactions
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    // Helper to sanitize extraInfo (hide JSON stats)
    const isInfoValid = (info?: string) => {
        if (!info) return false;
        if (info.startsWith('{') || info.includes('stats')) return false; // Basic detection of JSON string
        return true;
    };

    // Sync Self Info
    useEffect(() => {
        const diffName = DIFFICULTY_CONFIG[difficulty].name;
        if (mp.isHost) {
             mp.updateSelfInfo(username, currentAvatarId, diffName);
        } else {
             mp.updateSelfInfo(username, currentAvatarId);
        }
    }, [username, currentAvatarId, difficulty, mp.isHost, mp.updateSelfInfo]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // --- GAME LOGIC ---

    const generateDeck = (diff: Difficulty) => {
        const config = DIFFICULTY_CONFIG[diff];
        const selectedIcons = ICONS.slice(0, config.pairs);
        
        let deck: MemoryCard[] = [];
        selectedIcons.forEach((item, index) => {
            deck.push({ id: index * 2, iconId: item.id, isFlipped: false, isMatched: false });
            deck.push({ id: index * 2 + 1, iconId: item.id, isFlipped: false, isMatched: false });
        });

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        deck = deck.map((c, i) => ({ ...c, id: i }));
        return deck;
    };

    const startSoloGame = () => {
        const deck = generateDeck(difficulty);
        setCards(deck);
        setFlippedIndices([]);
        setScores({ p1: 0, p2: 0 });
        setMoves(0);
        setCurrentPlayer(1);
        setIsGameOver(false);
        setIsProcessing(false);
        setEarnedCoins(0);
        playLand(); 
    };

    const startOnlineGame = () => {
        setCards([]);
        setFlippedIndices([]);
        setScores({ p1: 0, p2: 0 });
        setMoves(0);
        setIsGameOver(false);
        setEarnedCoins(0);
        setIsWaitingForDeck(false);
        setChatHistory([]);
        setOpponentLeft(false);
        setMenuState('GAME');
    }

    const initGame = (mode: 'SOLO' | 'ONLINE', diff?: Difficulty) => {
        setGameMode(mode);
        if (diff) setDifficulty(diff);
        
        if (mode === 'SOLO') {
            startSoloGame();
            setMenuState('GAME');
        } else {
            startOnlineGame();
        }
    };

    // --- MULTIPLAYER SETUP ---

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
            setOnlineStep('connecting'); // Reset explicitly
            setOpponentLeft(false);
        }
        return () => mp.disconnect();
    }, [gameMode]);

    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';

        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');

            if (cards.length > 0) {
                 setCards([]);
                 setFlippedIndices([]);
                 setIsGameOver(false);
                 setIsWaitingForDeck(false);
                 setOpponentLeft(false);
            }

        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            
            if (mp.isHost && !isWaitingForDeck && cards.length === 0) {
                 const deck = generateDeck(difficulty);
                 // Delay to ensure guest is ready to receive
                 setTimeout(() => {
                     const deckData = deck.map(c => c.iconId); 
                     mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData, difficulty });
                     setCards(deck);
                     setFlippedIndices([]);
                     setScores({ p1: 0, p2: 0 });
                     setCurrentPlayer(1);
                     setIsGameOver(false);
                     setIsProcessing(false);
                 }, 1000);
            } else if (!mp.isHost) {
                if (cards.length === 0) setIsWaitingForDeck(true);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, cards.length]);

    // --- ONLINE DATA HANDLING ---
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'MEMORY_INIT') {
                const deckIds: string[] = data.deckIds;
                const newDifficulty: Difficulty = data.difficulty;
                setDifficulty(newDifficulty); 
                const newDeck: MemoryCard[] = deckIds.map((iconId, i) => ({ id: i, iconId, isFlipped: false, isMatched: false }));
                setCards(newDeck);
                setFlippedIndices([]);
                setScores({ p1: 0, p2: 0 });
                setCurrentPlayer(1);
                setIsGameOver(false);
                setIsProcessing(false);
                setIsWaitingForDeck(false);
                setOpponentLeft(false);
            }
            if (data.type === 'MEMORY_FLIP') {
                const index = data.index;
                handleCardClick(index, true); 
            }
            if (data.type === 'REMATCH_START') {
                 if (mp.isHost) {
                     // Clear board first
                     setCards([]);
                     setFlippedIndices([]);
                     setScores({ p1: 0, p2: 0 });
                     setIsGameOver(false);
                     
                     // Wait 1s then restart
                     setTimeout(() => {
                         const deck = generateDeck(difficulty);
                         const deckData = deck.map(c => c.iconId);
                         mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData, difficulty });
                         setCards(deck);
                         setCurrentPlayer(1);
                     }, 1000);
                 } else {
                     setIsWaitingForDeck(true);
                     setCards([]);
                 }
            }
            if (data.type === 'CHAT') {
                setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            }
            if (data.type === 'REACTION') {
                setActiveReaction({ id: data.id, isMe: false });
                setTimeout(() => setActiveReaction(null), 3000);
            }
            if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setIsGameOver(true); 
            }
        });
        
        return () => unsubscribe();
    }, [mp, cards, isProcessing, difficulty]);

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

    const handleCardClick = (index: number, isRemote = false) => {
        resumeAudio();
        if (isProcessing) return;
        if (cards[index].isMatched || cards[index].isFlipped) return;
        
        if (gameMode === 'ONLINE' && !isRemote) {
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
            mp.sendData({ type: 'MEMORY_FLIP', index });
        }

        playMove();

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setIsProcessing(true);
            setMoves(m => m + 1);

            const idx1 = newFlipped[0];
            const idx2 = newFlipped[1];
            const card1 = newCards[idx1];
            const card2 = newCards[idx2];

            if (card1.iconId === card2.iconId) {
                // MATCH
                setTimeout(() => {
                    playVictory();
                    const matchedCards = [...newCards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);
                    
                    if (gameMode === 'ONLINE') {
                        setScores(prev => ({
                            ...prev,
                            p1: currentPlayer === 1 ? prev.p1 + 1 : prev.p1,
                            p2: currentPlayer === 2 ? prev.p2 + 1 : prev.p2
                        }));
                    }
                    setIsProcessing(false);
                    if (matchedCards.every(c => c.isMatched)) handleGameOver(matchedCards);
                }, 500);
            } else {
                // MISS
                setTimeout(() => {
                    playLand();
                    const resetCards = [...newCards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                    if (gameMode === 'ONLINE') setCurrentPlayer(prev => prev === 1 ? 2 : 1);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    const handleGameOver = (finalCards: MemoryCard[]) => {
        setIsGameOver(true);
        if (gameMode === 'SOLO') {
            if (highScore === 0 || moves < highScore) updateHighScore('memory', moves + 1);
            const reward = DIFFICULTY_CONFIG[difficulty].bonus;
            addCoins(reward);
            setEarnedCoins(reward);
        } else {
            const p1Score = currentPlayer === 1 ? scores.p1 + 1 : scores.p1;
            const p2Score = currentPlayer === 2 ? scores.p2 + 1 : scores.p2;
            const winner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0;
            const isMeP1 = mp.amIP1;
            const didIWin = (isMeP1 && winner === 1) || (!isMeP1 && winner === 2);
            if (didIWin) {
                addCoins(50);
                setEarnedCoins(50);
            }
        }
    };

    const handleOpponentLeftAction = (action: 'lobby' | 'wait') => {
        if (action === 'lobby') {
            mp.leaveGame(); // Clean cleanup
            setGameMode('ONLINE');
            setOnlineStep('lobby');
        } else {
            // Wait = Become host in lobby
            mp.leaveGame(); // Reset current game state
            mp.createRoom(); // Create new room as host
        }
        setOpponentLeft(false);
    };

    const handleLocalBack = () => {
        if (menuState === 'DIFFICULTY') setMenuState('MENU');
        else if (menuState === 'GAME') {
            if (gameMode === 'ONLINE') {
                mp.leaveGame();
                setMenuState('MENU');
            } else {
                setMenuState('MENU');
            }
        } else {
            onBack();
        }
    };

    const renderCard = (card: MemoryCard) => {
        const iconData = ICONS.find(i => i.id === card.iconId);
        const Icon = iconData ? iconData.icon : RefreshCw;
        const color = iconData ? iconData.color : 'text-white';
        const flipClass = card.isFlipped || card.isMatched ? 'rotate-y-180' : '';
        const matchClass = card.isMatched ? 'opacity-50 shadow-[0_0_15px_#22c55e] border-green-500' : 'border-white/20';
        
        return (
            <div key={card.id} className="relative w-full aspect-[3/4] perspective-1000 cursor-pointer" onClick={() => handleCardClick(card.id)}>
                <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${flipClass}`}>
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 border-2 rounded-md flex items-center justify-center ${matchClass} shadow-lg`}>
                        <Icon size={32} className={`${color} drop-shadow-[0_0_10px_currentColor]`} />
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-gray-800 border border-white/10 rounded-md flex flex-col items-center justify-center group hover:border-white/40 transition-colors shadow-inner">
                         <div className="flex flex-col items-center gap-1">
                             <span className="font-script text-cyan-400 text-[14px] leading-none drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">Neon</span>
                             <span className="font-script text-neon-pink text-[14px] leading-none drop-shadow-[0_0_3px_rgba(255,0,255,0.8)]">Arcade</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);

         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-purple-300 tracking-wider drop-shadow-md">LOBBY MEMORY</h3>
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
                                            <div className="flex flex-col">
                                                <span className="font-bold">{player.name}</span>
                                                {/* Filter out raw JSON data from extraInfo */}
                                                {isInfoValid(player.extraInfo) && <span className="text-[10px] text-purple-300 font-bold tracking-widest bg-purple-500/10 px-1.5 rounded border border-purple-500/20 w-fit">{player.extraInfo}</span>}
                                            </div>
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

    // --- MENU VIEW ---
    if (menuState === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#a855f7]">MEMORY</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => setMenuState('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <User size={24} className="text-neon-blue"/> SOLO
                </button>
                <button onClick={() => initGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
    }

    // --- DIFFICULTY VIEW ---
    if (menuState === 'DIFFICULTY') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h2 className="text-3xl font-black text-white mb-8">DIFFICULTÉ</h2>
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                    <button 
                        key={d} 
                        onClick={() => initGame('SOLO', d)}
                        className={`px-6 py-3 border font-bold rounded hover:text-black transition-all ${
                            d === 'EASY' ? 'border-green-500 text-green-400 hover:bg-green-500' :
                            d === 'MEDIUM' ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500' :
                            'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                    >
                        {DIFFICULTY_CONFIG[d].name}
                    </button>
                ))}
            </div>
            <button onClick={() => setMenuState('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
        </div>
      );
    }

    // --- LOBBY VIEW ---
    if (gameMode === 'ONLINE' && onlineStep === 'lobby' && menuState === 'GAME') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">MEMORY</h1>
                    <div className="w-10"/>
                </div>
                {renderLobby()}
            </div>
        )
    }

    // --- GAME VIEW ---
    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <style>{`.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
            
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">NEON MEMORY</h1>
                {gameMode === 'SOLO' ? <button onClick={startSoloGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button> : <div className="w-10"/>}
            </div>

            {gameMode === 'ONLINE' && onlineStep === 'connecting' ? (
                 <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-purple-400 animate-spin mb-4" /><p className="text-purple-300 font-bold">CONNEXION...</p></div>
            ) : (
                 <>
                    {activeReaction && (() => {
                        const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                        if (!reaction) return null;
                        const positionClass = activeReaction.isMe ? 'bottom-20 right-4' : 'top-20 left-4';
                        const anim = reaction.anim || 'animate-bounce';
                        return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
                    })()}

                    <div className="w-full max-w-lg flex justify-between items-center mb-2 z-10 px-4 shrink-0">
                        {gameMode === 'SOLO' ? (
                            <>
                                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">COUPS</span><span className="text-2xl font-mono font-bold text-white">{moves}</span></div>
                                <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-2xl font-mono font-bold text-yellow-400">{highScore > 0 ? highScore : '-'}</span></div>
                            </>
                        ) : (
                            <>
                                <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 1 ? 'bg-neon-pink/20 border-neon-pink' : 'bg-gray-800/50 border-transparent'}`}><span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{mp.amIP1 ? 'TOI (P1)' : 'ADV (P1)'}</span><span className="text-2xl font-mono font-bold text-neon-pink">{scores.p1}</span></div>
                                <div className="text-gray-500 font-black text-xl">VS</div>
                                <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 2 ? 'bg-neon-blue/20 border-neon-blue' : 'bg-gray-800/50 border-transparent'}`}><span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{!mp.amIP1 ? 'TOI (P2)' : 'ADV (P2)'}</span><span className="text-2xl font-mono font-bold text-neon-blue">{scores.p2}</span></div>
                            </>
                        )}
                    </div>
                    
                    {gameMode === 'ONLINE' && !isGameOver && (
                        <div className="mb-2 z-10 text-sm font-bold animate-pulse text-center h-6 shrink-0">
                            {isWaitingForDeck ? `Partie en ${DIFFICULTY_CONFIG[difficulty].name} rejointe...` : isProcessing ? "..." : ((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2)) ? <span className="text-green-400">C'EST TON TOUR !</span> : <span className="text-gray-500">L'ADVERSAIRE JOUE...</span>}
                        </div>
                    )}

                    <div className="w-full max-w-lg grid gap-1 z-10 p-1 mb-2" style={{ gridTemplateColumns: `repeat(${DIFFICULTY_CONFIG[difficulty].cols}, minmax(0, 1fr))` }}>
                        {cards.map(card => renderCard(card))}
                    </div>

                    {gameMode === 'ONLINE' && !isGameOver && !isWaitingForDeck && (
                        <div className="w-full max-w-lg z-20 px-2 mb-2">
                             <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                                {REACTIONS.map(reaction => {
                                    const Icon = reaction.icon;
                                    return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                                })}
                            </div>
                        </div>
                    )}

                    {gameMode === 'ONLINE' && !isGameOver && !isWaitingForDeck && (
                        <div className="w-full max-w-lg mt-auto z-20 px-2 flex flex-col gap-2 pb-4">
                            <div className="flex flex-col gap-1 max-h-20 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                                {chatHistory.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${msg.isMe ? 'bg-purple-500/20 text-purple-100' : 'bg-gray-700/50 text-gray-300'}`}>{!msg.isMe && <span className="mr-1 opacity-50">{msg.senderName}:</span>}{msg.text}</div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={sendChat} className="flex gap-2">
                                <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                                <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-xl disabled:opacity-50"><Send size={14} /></button>
                            </form>
                        </div>
                    )}
                 </>
            )}

            {(isGameOver || opponentLeft) && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
                    {opponentLeft ? (
                        <>
                            <LogOut size={64} className="text-red-500 mb-4" />
                            <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                            <p className="text-gray-400 text-center mb-8">L'autre joueur a quitté la partie.</p>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button onClick={() => handleOpponentLeftAction('wait')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"><Users size={18} /> ATTENDRE UN JOUEUR</button>
                                <button onClick={() => handleOpponentLeftAction('lobby')} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={18} /> RETOUR AU LOBBY</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                            <h2 className="text-4xl font-black italic text-white mb-2 text-center">PARTIE TERMINÉE</h2>
                            {gameMode === 'SOLO' ? (
                                <div className="text-center mb-6">
                                    <p className="text-gray-400 text-sm tracking-widest mb-1">COUPS TOTAL</p>
                                    <p className="text-3xl font-mono text-white mb-4">{moves}</p>
                                    {moves < highScore || highScore === 0 ? <div className="text-green-400 font-bold text-sm animate-pulse">NOUVEAU RECORD !</div> : null}
                                </div>
                            ) : (
                                <div className="text-center mb-6">
                                    <p className="text-xl font-bold mb-2">{scores.p1 > scores.p2 ? (mp.amIP1 ? "TU AS GAGNÉ !" : "L'ADVERSAIRE A GAGNÉ") : scores.p2 > scores.p1 ? (!mp.amIP1 ? "TU AS GAGNÉ !" : "L'ADVERSAIRE A GAGNÉ") : "MATCH NUL !"}</p>
                                    <div className="flex gap-8 text-2xl font-mono justify-center"><div className="text-neon-pink">P1: {scores.p1}</div><div className="text-neon-blue">P2: {scores.p2}</div></div>
                                </div>
                            )}
                            {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                            <div className="flex gap-4">
                                <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : startSoloGame} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                                {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                                {gameMode === 'SOLO' && <button onClick={handleLocalBack} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">MENU</button>}
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <p className="text-sm text-gray-400 mb-8">Difficulté: {DIFFICULTY_CONFIG[difficulty].name}</p>
                    <div className="flex bg-gray-900 rounded-full border border-white/10 overflow-hidden mb-6">
                            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                                <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${difficulty === d ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>{DIFFICULTY_CONFIG[d].name}</button>
                            ))}
                    </div>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold">ANNULER</button>
                </div>
            )}
        </div>
    );
};
