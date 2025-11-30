
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Zap, Ghost, Star, Heart, Crown, Diamond, Anchor, Music, Sun, Moon, Cloud, Snowflake, Flame, Droplets, Skull, Gamepad2, Rocket, Coins, User, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { MemoryCard, MemoryGameState } from './types';

interface MemoryGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
}

// Icons pool for cards
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

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, audio, addCoins }) => {
    const { playMove, playLand, playVictory, playGameOver, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.memory || 0; // Moves based, lower is better. 0 means no record.

    // Multiplayer Hook
    const mp = useMultiplayer();
    
    // Game State
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [moves, setMoves] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Block input during animation
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Online State
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForDeck, setIsWaitingForDeck] = useState(false);

    // Refs
    const processingTimeoutRef = useRef<any>(null);

    // --- GAME LOGIC ---

    const generateDeck = () => {
        const gridSize = 18; // 6x3
        const pairsCount = gridSize / 2;
        const selectedIcons = ICONS.slice(0, pairsCount);
        
        let deck: MemoryCard[] = [];
        selectedIcons.forEach((item, index) => {
            // Create Pair
            deck.push({ id: index * 2, iconId: item.id, isFlipped: false, isMatched: false });
            deck.push({ id: index * 2 + 1, iconId: item.id, isFlipped: false, isMatched: false });
        });

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        // Re-assign IDs to be index-based for easier sync
        deck = deck.map((c, i) => ({ ...c, id: i }));

        return deck;
    };

    const startSoloGame = () => {
        const deck = generateDeck();
        setCards(deck);
        setFlippedIndices([]);
        setScores({ p1: 0, p2: 0 });
        setMoves(0);
        setCurrentPlayer(1);
        setIsGameOver(false);
        setIsProcessing(false);
        setEarnedCoins(0);
        playLand(); // Start sound
    };

    // --- MULTIPLAYER SETUP ---

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
        }
        return () => mp.disconnect();
    }, [gameMode]);

    useEffect(() => {
        if (mp.mode === 'lobby') {
            const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            
            // If Host, generate and send deck
            if (mp.isHost && !isWaitingForDeck && cards.length === 0) {
                 const deck = generateDeck();
                 // Send deck to guest
                 // We use a slight delay to ensure connection is ready
                 setTimeout(() => {
                     const deckData = deck.map(c => c.iconId); // Send simplified deck (just IDs)
                     mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData });
                     
                     // Init local
                     setCards(deck);
                     setFlippedIndices([]);
                     setScores({ p1: 0, p2: 0 });
                     setCurrentPlayer(1);
                     setIsGameOver(false);
                     setIsProcessing(false);
                 }, 500);
            } else if (!mp.isHost) {
                // Guest waits for deck
                if (cards.length === 0) setIsWaitingForDeck(true);
            }
        }
    }, [mp.mode, mp.isHost]);

    // --- ONLINE DATA HANDLING ---
    useEffect(() => {
        const handleData = (data: any) => {
            if (data.type === 'MEMORY_INIT') {
                // Reconstruct deck from IDs
                const deckIds: string[] = data.deckIds;
                const newDeck: MemoryCard[] = deckIds.map((iconId, i) => ({
                    id: i,
                    iconId,
                    isFlipped: false,
                    isMatched: false
                }));
                setCards(newDeck);
                setFlippedIndices([]);
                setScores({ p1: 0, p2: 0 });
                setCurrentPlayer(1);
                setIsGameOver(false);
                setIsProcessing(false);
                setIsWaitingForDeck(false);
            }
            if (data.type === 'MEMORY_FLIP') {
                const index = data.index;
                handleCardClick(index, true); // True = remote move
            }
            if (data.type === 'REMATCH_START') {
                 if (mp.isHost) {
                     const deck = generateDeck();
                     const deckData = deck.map(c => c.iconId);
                     mp.sendData({ type: 'MEMORY_INIT', deckIds: deckData });
                     setCards(deck);
                     setFlippedIndices([]);
                     setScores({ p1: 0, p2: 0 });
                     setCurrentPlayer(1);
                     setIsGameOver(false);
                 } else {
                     setIsWaitingForDeck(true);
                     setCards([]);
                 }
            }
        };
        mp.setOnDataReceived(handleData);
    }, [mp, cards, isProcessing]);

    // --- CORE GAMEPLAY ---

    const handleCardClick = (index: number, isRemote = false) => {
        resumeAudio();
        // Validation checks
        if (isProcessing) return;
        if (cards[index].isMatched || cards[index].isFlipped) return;
        
        // Online Turn check
        if (gameMode === 'ONLINE' && !isRemote) {
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
            mp.sendData({ type: 'MEMORY_FLIP', index });
        }

        playMove();

        // 1. Flip the card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        // 2. If 2 cards flipped, check match
        if (newFlipped.length === 2) {
            setIsProcessing(true); // Lock input
            setMoves(m => m + 1); // Solo move count

            const idx1 = newFlipped[0];
            const idx2 = newFlipped[1];
            const card1 = newCards[idx1];
            const card2 = newCards[idx2];

            if (card1.iconId === card2.iconId) {
                // MATCH!
                setTimeout(() => {
                    playVictory(); // Small success sound
                    
                    const matchedCards = [...newCards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    // Reset flipped status visually (but keep matched status to hide/dim them or keep them face up)
                    // Actually standard memory keeps them face up.
                    setCards(matchedCards);
                    setFlippedIndices([]);
                    
                    // Update Scores
                    if (gameMode === 'ONLINE') {
                        setScores(prev => ({
                            ...prev,
                            p1: currentPlayer === 1 ? prev.p1 + 1 : prev.p1,
                            p2: currentPlayer === 2 ? prev.p2 + 1 : prev.p2
                        }));
                        // Online rule: If you match, you play again?
                        // Let's do: Match = Play Again.
                        // So currentPlayer doesn't change.
                    }
                    
                    setIsProcessing(false);

                    // Check Game Over
                    if (matchedCards.every(c => c.isMatched)) {
                        handleGameOver(matchedCards);
                    }

                }, 500);
            } else {
                // MISS!
                setTimeout(() => {
                    playLand(); // "Thud" sound for miss
                    const resetCards = [...newCards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                    
                    // Switch turn
                    if (gameMode === 'ONLINE') {
                        setCurrentPlayer(prev => prev === 1 ? 2 : 1);
                    }
                    
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    const handleGameOver = (finalCards: MemoryCard[]) => {
        setIsGameOver(true);
        if (gameMode === 'SOLO') {
            // Check High Score (Lower moves is better)
            // If highScore is 0, it's first time playing
            if (highScore === 0 || moves < highScore) {
                updateHighScore('memory', moves + 1); // +1 because the last move just happened
            }
            
            // Coins reward
            const reward = 20;
            addCoins(reward);
            setEarnedCoins(reward);
        } else {
            // Online reward
            const p1Score = currentPlayer === 1 ? scores.p1 + 1 : scores.p1;
            const p2Score = currentPlayer === 2 ? scores.p2 + 1 : scores.p2;
            
            const winner = p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : 0; // 0 draw
            const isMeP1 = mp.amIP1;
            const didIWin = (isMeP1 && winner === 1) || (!isMeP1 && winner === 2);
            
            if (didIWin) {
                addCoins(50);
                setEarnedCoins(50);
            }
        }
    };

    const handleRematch = () => {
        if (gameMode === 'ONLINE') {
            mp.requestRematch();
        } else {
            startSoloGame();
        }
    };
    
    // Initial Start
    useEffect(() => {
        if (gameMode === 'SOLO') {
            startSoloGame();
        }
    }, [gameMode]);


    // --- RENDER HELPERS ---

    const renderCard = (card: MemoryCard) => {
        const iconData = ICONS.find(i => i.id === card.iconId);
        const Icon = iconData ? iconData.icon : RefreshCw;
        const color = iconData ? iconData.color : 'text-white';
        
        // Animation classes
        const flipClass = card.isFlipped || card.isMatched ? 'rotate-y-180' : '';
        const matchClass = card.isMatched ? 'opacity-50 shadow-[0_0_15px_#22c55e] border-green-500' : 'border-white/20';
        
        return (
            <div 
                key={card.id} 
                className="relative w-full aspect-[2/3] perspective-1000 cursor-pointer"
                onClick={() => handleCardClick(card.id)}
            >
                <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${flipClass}`}>
                    {/* FRONT (Hidden initially) - The Content */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 border-2 rounded-md flex items-center justify-center ${matchClass} shadow-lg`}>
                        <Icon size={32} className={`${color} drop-shadow-[0_0_10px_currentColor]`} />
                    </div>

                    {/* BACK (Visible initially) - The App Logo */}
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

    const renderLobby = () => {
         const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
         
         return (
             <div className="flex flex-col w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4 animate-in fade-in">
                 <h2 className="text-xl font-bold text-center text-purple-400 mb-6">LOBBY MEMORY</h2>
                 <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-bold rounded-lg mb-4 hover:bg-green-400">
                     CRÉER UNE PARTIE
                 </button>
                 
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Parties disponibles</p>
                 <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] custom-scrollbar">
                     {hostingPlayers.length === 0 && <p className="text-center text-gray-500 italic py-4">Aucune partie trouvée.</p>}
                     {hostingPlayers.map(p => (
                         <div key={p.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-white/10">
                             <span className="font-bold">{p.name}</span>
                             <button onClick={() => mp.joinRoom(p.id)} className="px-3 py-1 bg-neon-blue text-black text-xs font-bold rounded">REJOINDRE</button>
                         </div>
                     ))}
                 </div>
             </div>
         );
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
             {/* Styles for 3D Flip */}
             <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
            
            {/* Ambient Light */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>

            {/* Header (Always Visible) */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                    <Home size={20} />
                </button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    NEON MEMORY
                </h1>
                {gameMode === 'SOLO' && (
                    <button onClick={startSoloGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                        <RefreshCw size={20} />
                    </button>
                )}
                {gameMode === 'ONLINE' && <div className="w-10" />}
            </div>

            {/* Mode Selector (Only if not in active online game) */}
            {(!mp.gameOpponent || isGameOver) && (
                <div className="flex bg-gray-900 rounded-full border border-white/10 p-1 mb-2 z-10 shrink-0">
                    <button 
                        onClick={() => setGameMode('SOLO')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${gameMode === 'SOLO' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        SOLO
                    </button>
                    <button 
                        onClick={() => setGameMode('ONLINE')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${gameMode === 'ONLINE' ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN LIGNE
                    </button>
                </div>
            )}

            {/* CONTENT AREA */}
            {gameMode === 'ONLINE' && onlineStep === 'connecting' ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                     <Loader2 size={48} className="text-purple-400 animate-spin mb-4" />
                     <p className="text-purple-300 font-bold">CONNEXION...</p>
                 </div>
            ) : gameMode === 'ONLINE' && onlineStep === 'lobby' ? (
                 <div className="flex-1 w-full flex items-start justify-center pt-4">
                     {renderLobby()}
                 </div>
            ) : (
                 <>
                    {/* HUD */}
                    <div className="w-full max-w-lg flex justify-between items-center mb-2 z-10 px-4 shrink-0">
                        {gameMode === 'SOLO' ? (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">COUPS</span>
                                    <span className="text-2xl font-mono font-bold text-white">{moves}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span>
                                    <span className="text-2xl font-mono font-bold text-yellow-400">{highScore > 0 ? highScore : '-'}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 1 ? 'bg-neon-pink/20 border-neon-pink' : 'bg-gray-800/50 border-transparent'}`}>
                                    <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{mp.amIP1 ? 'TOI (P1)' : 'ADV (P1)'}</span>
                                    <span className="text-2xl font-mono font-bold text-neon-pink">{scores.p1}</span>
                                </div>
                                <div className="text-gray-500 font-black text-xl">VS</div>
                                <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 2 ? 'bg-neon-blue/20 border-neon-blue' : 'bg-gray-800/50 border-transparent'}`}>
                                    <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{!mp.amIP1 ? 'TOI (P2)' : 'ADV (P2)'}</span>
                                    <span className="text-2xl font-mono font-bold text-neon-blue">{scores.p2}</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Status Message Online */}
                    {gameMode === 'ONLINE' && !isGameOver && (
                        <div className="mb-2 z-10 text-sm font-bold animate-pulse text-center h-6 shrink-0">
                            {isWaitingForDeck ? "Attente de l'hôte..." : 
                            isProcessing ? "Validation..." : 
                            ((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2)) ? <span className="text-green-400">C'EST TON TOUR !</span> : <span className="text-gray-500">L'ADVERSAIRE JOUE...</span>}
                        </div>
                    )}

                    {/* GRID */}
                    <div className="w-full max-w-[400px] grid grid-cols-6 gap-1 z-10 p-1 mb-6">
                        {cards.map(card => renderCard(card))}
                    </div>
                 </>
            )}

            {/* Game Over Overlay */}
            {isGameOver && (
                <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
                    <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                    <h2 className="text-4xl font-black italic text-white mb-2">PARTIE TERMINÉE</h2>
                    
                    {gameMode === 'SOLO' ? (
                        <div className="text-center mb-6">
                            <p className="text-gray-400 text-sm tracking-widest mb-1">COUPS TOTAL</p>
                            <p className="text-3xl font-mono text-white mb-4">{moves}</p>
                            {moves < highScore || highScore === 0 ? (
                                <div className="text-green-400 font-bold text-sm animate-pulse">NOUVEAU RECORD !</div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-center mb-6">
                            <p className="text-xl font-bold mb-2">
                                {scores.p1 > scores.p2 ? (mp.amIP1 ? "TU AS GAGNÉ !" : "L'ADVERSAIRE A GAGNÉ") : 
                                 scores.p2 > scores.p1 ? (!mp.amIP1 ? "TU AS GAGNÉ !" : "L'ADVERSAIRE A GAGNÉ") : 
                                 "MATCH NUL !"}
                            </p>
                            <div className="flex gap-8 text-2xl font-mono">
                                <div className="text-neon-pink">P1: {scores.p1}</div>
                                <div className="text-neon-blue">P2: {scores.p2}</div>
                            </div>
                        </div>
                    )}

                    {earnedCoins > 0 && (
                        <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500">
                            <Coins className="text-yellow-400" size={20} />
                            <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button 
                            onClick={handleRematch}
                            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            <RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}
                        </button>
                        {gameMode === 'ONLINE' && (
                             <button onClick={mp.leaveGame} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Hosting Waiting Overlay */}
            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="mt-8 px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold">ANNULER</button>
                </div>
            )}
        </div>
    );
};
