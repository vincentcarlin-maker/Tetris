
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, Users, User, Globe, Play, LogOut, Zap, Brain, Rocket, Star, Heart, Ghost, Smile, Anchor, Music, Sun, Moon } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { MemoryCard, Difficulty } from './types';

interface MemoryGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

// Icons pool for cards
const ICONS = [Zap, Rocket, Star, Heart, Ghost, Smile, Anchor, Music, Sun, Moon, Users, User, Globe, Trophy, Coins, Brain];

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING'>('MENU');
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Online state
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    const { playCoin, playVictory, playGameOver, playMove, resumeAudio } = audio;

    // Handle Online Connection
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
            setOpponentLeft(false);
        }
        return () => mp.disconnect();
    }, [gameMode]);

    // Handle Online Mode Transition
    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (gameState !== 'MENU' && !opponentLeft) setGameState('MENU');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (gameState !== 'PLAYING') {
                startOnlineGame();
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    // Network Message Handling
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'GAME_MOVE') {
                handleCardClick(data.cardIndex, true);
            }
            else if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setIsGameOver(true);
            }
            else if (data.type === 'REMATCH_START') {
                startOnlineGame();
            }
            else if (data.type === 'MEMORY_SETUP') {
                // Client receives card layout from Host
                const layout = data.cards.map((c: any) => ({...c, icon: ICONS[c.iconIndex]})); // Re-map icons
                setCards(layout);
            }
        });
        return () => unsubscribe();
    }, [mp.subscribe, cards, flippedIndices, currentPlayer]);

    const generateCards = (diff: Difficulty) => {
        let pairCount = 6;
        if (diff === 'MEDIUM') pairCount = 12;
        if (diff === 'HARD') pairCount = 18; // 6x6

        const selectedIcons = ICONS.slice(0, pairCount);
        const deck: MemoryCard[] = [];
        
        selectedIcons.forEach((icon, i) => {
            deck.push({ id: i * 2, iconId: String(i), isFlipped: false, isMatched: false });
            deck.push({ id: i * 2 + 1, iconId: String(i), isFlipped: false, isMatched: false });
        });

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const startSoloGame = () => {
        setGameMode('SOLO');
        const deck = generateCards(difficulty);
        setCards(deck);
        setFlippedIndices([]);
        setMoves(0);
        setIsGameOver(false);
        setEarnedCoins(0);
        setGameState('PLAYING');
        resumeAudio();
    };

    const startOnlineGame = () => {
        setGameMode('ONLINE');
        setFlippedIndices([]);
        setMoves(0);
        setScores({ p1: 0, p2: 0 });
        setIsGameOver(false);
        setEarnedCoins(0);
        setGameState('PLAYING');
        setCurrentPlayer(1); // Host is always P1, Client is P2

        // Host generates and shares cards
        if (mp.isHost) {
            const deck = generateCards('MEDIUM'); // Fixed difficulty for online
            setCards(deck);
            // Send simplified deck (icons not serializable)
            const deckData = deck.map(c => ({ ...c, iconIndex: parseInt(c.iconId) }));
            mp.sendData({ type: 'MEMORY_SETUP', cards: deckData });
        }
        // Client waits for MEMORY_SETUP
    };

    const checkGameOver = (currentCards: MemoryCard[], currentScores?: {p1: number, p2: number}) => {
        if (currentCards.every(c => c.isMatched)) {
            setIsGameOver(true);
            
            if (gameMode === 'SOLO') {
                playVictory();
                addCoins(50);
                setEarnedCoins(50);
            } else if (currentScores) {
                const isMeP1 = mp.amIP1;
                const myScore = isMeP1 ? currentScores.p1 : currentScores.p2;
                const oppScore = isMeP1 ? currentScores.p2 : currentScores.p1;
                
                if (myScore > oppScore) {
                    playVictory();
                    addCoins(50);
                    setEarnedCoins(50);
                } else if (myScore < oppScore) {
                    playGameOver();
                } else {
                    // Draw
                    playGameOver(); 
                }
            }
        }
    };

    const handleCardClick = (index: number, isNetworkMove = false) => {
        if (isGameOver || cards[index].isFlipped || cards[index].isMatched) return;
        if (flippedIndices.length >= 2) return; // Wait for flip back

        // Online Turn Check
        if (gameMode === 'ONLINE' && !isNetworkMove) {
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
        }

        playMove();

        // Send move
        if (gameMode === 'ONLINE' && !isNetworkMove) {
            mp.sendGameMove({ cardIndex: index });
        }

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [idx1, idx2] = newFlipped;
            
            if (newCards[idx1].iconId === newCards[idx2].iconId) {
                // Match!
                playCoin();
                setTimeout(() => {
                    const matchedCards = [...newCards];
                    matchedCards[idx1].isMatched = true;
                    matchedCards[idx2].isMatched = true;
                    setCards(matchedCards);
                    setFlippedIndices([]);
                    
                    if (gameMode === 'ONLINE') {
                        setScores(prev => {
                            const newScores = { ...prev, [currentPlayer === 1 ? 'p1' : 'p2']: prev[currentPlayer === 1 ? 'p1' : 'p2'] + 1 };
                            checkGameOver(matchedCards, newScores);
                            return newScores;
                        });
                        // Keep turn
                    } else {
                        checkGameOver(matchedCards);
                    }
                }, 500);
            } else {
                // No Match
                setTimeout(() => {
                    const resetCards = [...newCards];
                    resetCards[idx1].isFlipped = false;
                    resetCards[idx2].isFlipped = false;
                    setCards(resetCards);
                    setFlippedIndices([]);
                    
                    if (gameMode === 'ONLINE') {
                        setCurrentPlayer(prev => prev === 1 ? 2 : 1);
                    }
                }, 1000);
            }
        }
    };

    const handleLocalBack = () => {
        if (gameState === 'MENU') {
            onBack();
        } else if (gameMode === 'ONLINE') {
            mp.leaveGame();
            setOnlineStep('lobby');
            setGameState('MENU');
        } else {
            setGameState('MENU');
        }
    };

    const renderLobby = () => {
        const availablePlayers = mp.players.filter(p => p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4 animate-in fade-in">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-purple-400 tracking-wider">LOBBY MEMORY</h3>
                     <button onClick={() => mp.createRoom('memory')} className="w-full py-3 bg-purple-500 text-white font-black tracking-widest rounded-xl text-sm hover:bg-purple-400 transition-all flex items-center justify-center gap-2">
                        <Play size={18} fill="white"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {availablePlayers.length > 0 ? (
                        availablePlayers.map(player => {
                            const isHostingThis = player.status === 'hosting' && player.extraInfo === 'memory';
                            const isHostingOther = player.status === 'hosting' && player.extraInfo !== 'memory';
                            
                            return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{player.name}</span>
                                        {isHostingOther && <span className="text-[9px] text-gray-500">Joue à {player.extraInfo || 'autre chose'}</span>}
                                        {!isHostingThis && !isHostingOther && <span className="text-[9px] text-green-400">DISPONIBLE</span>}
                                    </div>
                                    {isHostingThis ? (
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                    ) : (
                                        <div className="px-3 py-1.5 bg-gray-800 text-gray-500 font-bold rounded text-[10px]">
                                            {isHostingOther ? 'OCCUPÉ' : 'EN LIGNE'}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucun joueur en ligne...</p>}
                </div>
             </div>
         );
    };

    if (gameMode === 'ONLINE' && onlineStep === 'lobby' && gameState !== 'PLAYING') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-4">
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 pr-2 pb-1">MEMORY</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] pr-2 pb-1">NEON MEMORY</h1>
                <button onClick={gameState === 'PLAYING' ? startSoloGame : undefined} className={`p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform ${gameState !== 'PLAYING' ? 'opacity-0' : ''}`}><RefreshCw size={20} /></button>
            </div>

            {/* Menu */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <h1 className="text-5xl font-black text-white mb-8 italic tracking-tight drop-shadow-[0_0_15px_#a78bfa]">MEMORY</h1>
                    <div className="flex flex-col gap-4 w-full max-w-[240px]">
                        <button onClick={() => { setDifficulty('EASY'); startSoloGame(); }} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Brain size={20} className="text-green-500"/> FACILE (12)
                        </button>
                        <button onClick={() => { setDifficulty('MEDIUM'); startSoloGame(); }} className="px-6 py-4 bg-gray-800 border-2 border-yellow-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Brain size={20} className="text-yellow-500"/> MOYEN (24)
                        </button>
                        <button onClick={() => { setDifficulty('HARD'); startSoloGame(); }} className="px-6 py-4 bg-gray-800 border-2 border-red-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Brain size={20} className="text-red-500"/> DIFFICILE (36)
                        </button>
                        <button onClick={() => setGameMode('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-purple-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Globe size={20} className="text-purple-500"/> EN LIGNE
                        </button>
                    </div>
                </div>
            )}

            {/* Wait Screen */}
            {gameMode === 'ONLINE' && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center">
                    <div className="text-purple-400 font-bold animate-pulse mb-4">EN ATTENTE D'UN JOUEUR...</div>
                    <button onClick={mp.cancelHosting} className="px-4 py-2 bg-red-600 rounded text-white font-bold">ANNULER</button>
                </div>
            )}

            {/* Game Board */}
            <div className="flex-1 w-full max-w-lg flex flex-col relative z-10 overflow-hidden">
                {/* Stats */}
                <div className="flex justify-between items-center mb-4 bg-gray-900/50 px-4 py-2 rounded-lg border border-white/10">
                    {gameMode === 'SOLO' ? (
                        <>
                            <div className="text-gray-400 text-xs font-bold tracking-widest">COUPS: <span className="text-white text-lg font-mono ml-2">{moves}</span></div>
                            <div className="text-gray-400 text-xs font-bold tracking-widest">PAIRES: <span className="text-white text-lg font-mono ml-2">{flippedIndices.length > 0 ? '' : cards.filter(c => c.isMatched).length / 2}</span></div>
                        </>
                    ) : (
                        <>
                            <div className={`text-xs font-bold tracking-widest ${currentPlayer === 1 ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`}>
                                {mp.amIP1 ? 'MOI' : 'ADV.'} : <span className="text-lg font-mono ml-1">{scores.p1}</span>
                            </div>
                            <div className={`text-xs font-bold tracking-widest ${currentPlayer === 2 ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`}>
                                {!mp.amIP1 ? 'MOI' : 'ADV.'} : <span className="text-lg font-mono ml-1">{scores.p2}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Grid */}
                <div className={`grid gap-2 w-full h-full content-center transition-all ${
                    cards.length === 12 ? 'grid-cols-3' : cards.length === 24 ? 'grid-cols-4' : 'grid-cols-6'
                }`}>
                    {cards.map((card, index) => {
                        // Use mapped icon
                        const Icon = ICONS[parseInt(card.iconId)] || Zap;
                        return (
                            <button
                                key={index}
                                onClick={() => handleCardClick(index)}
                                className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 transform ${
                                    card.isFlipped || card.isMatched 
                                    ? (card.isMatched ? 'bg-green-500/20 border-green-500 rotate-y-180' : 'bg-purple-600 border-purple-400 rotate-y-180')
                                    : 'bg-gray-800 border-white/10 hover:bg-gray-700'
                                } border-2 relative overflow-hidden`}
                            >
                                {(card.isFlipped || card.isMatched) ? (
                                    <Icon size={24} className="text-white" />
                                ) : (
                                    <div className="text-purple-900/20 font-black text-xl">?</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Game Over Overlay */}
                {(isGameOver || opponentLeft) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in rounded-xl">
                        {opponentLeft ? (
                            <>
                                <LogOut size={48} className="text-red-500 mb-2"/>
                                <h2 className="text-3xl font-black text-white mb-4">ADVERSAIRE PARTI</h2>
                            </>
                        ) : (
                            <>
                                <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                                <h2 className="text-4xl font-black text-white mb-2">
                                    {gameMode === 'SOLO' ? 'TERMINÉ !' : (
                                        (mp.amIP1 && scores.p1 > scores.p2) || (!mp.amIP1 && scores.p2 > scores.p1) ? 'VICTOIRE !' : scores.p1 === scores.p2 ? 'ÉGALITÉ' : 'DÉFAITE'
                                    )}
                                </h2>
                                {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                                <div className="flex gap-4">
                                    <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : startSoloGame} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                                    {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); setIsGameOver(false); setOpponentLeft(false); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                                    {gameMode === 'SOLO' && <button onClick={handleLocalBack} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">MENU</button>}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
