
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Play, Loader2, Users, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { AVATARS_CATALOG } from '../../hooks/useCurrency';
import { MemoryCard, MemoryGameState, Difficulty } from './types';
import { Zap, Star, Heart, Cloud, Moon, Sun, Anchor, Music, Ghost, Smile, Skull, Rocket, Crown, Flame, Gem } from 'lucide-react';

const ICONS = [Zap, Star, Heart, Cloud, Moon, Sun, Anchor, Music, Ghost, Smile, Skull, Rocket, Crown, Flame, Gem];

interface MemoryGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE' | null>(null);
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [onlineScores, setOnlineScores] = useState({ p1: 0, p2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState<1|2>(1);

    const { playCoin, playVictory, playGameOver, resumeAudio } = audio;

    const generateCards = () => {
        const selectedIcons = ICONS.slice(0, 8); // 8 pairs = 16 cards
        const deck = [...selectedIcons, ...selectedIcons].map((Icon, i) => ({
            id: i,
            iconId: i % 8,
            IconComponent: Icon,
            isFlipped: false,
            isMatched: false
        }));
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const resetGame = () => {
        const newCards = generateCards();
        setCards(newCards as any);
        setFlippedIndices([]);
        setMatchedCount(0);
        setMoves(0);
        setIsGameOver(false);
        setOnlineScores({ p1: 0, p2: 0 });
        setCurrentPlayer(1);
    };

    // Initialize
    useEffect(() => {
        if (gameMode === 'SOLO') {
            resetGame();
        } else if (gameMode === 'ONLINE') {
            if (mp.isConnected) setOnlineStep('lobby');
            else mp.connect();
        }
    }, [gameMode, mp.isConnected]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (mp.mode === 'in_game') {
                setOnlineStep('game');
                // Host generates and sends cards
                if (mp.amIP1) {
                    const deck = generateCards();
                    // Send simple representation (icon indices)
                    const simpleDeck = deck.map(c => ({ id: c.id, iconId: c.iconId }));
                    mp.sendData({ type: 'MEMORY_INIT', deck: simpleDeck });
                    setCards(deck as any);
                }
            } else if (mp.mode === 'lobby') {
                setOnlineStep('lobby');
            }
        }
    }, [mp.mode, gameMode, mp.amIP1]);

    // Handle Card Click
    const handleCardClick = (index: number) => {
        if (isGameOver || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;
        if (gameMode === 'ONLINE' && !mp.isMyTurn) return;

        resumeAudio();
        
        // Flip locally
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (gameMode === 'ONLINE') {
            mp.sendData({ type: 'MEMORY_FLIP', index });
        }

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            checkForMatch(newFlipped[0], newFlipped[1]);
        }
    };

    const checkForMatch = (idx1: number, idx2: number) => {
        const match = cards[idx1].iconId === cards[idx2].iconId;
        
        if (match) {
            playCoin();
            setTimeout(() => {
                setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isMatched: true } : c));
                setFlippedIndices([]);
                setMatchedCount(c => {
                    const newCount = c + 1;
                    if (newCount >= 8) {
                        setIsGameOver(true);
                        playVictory();
                        if (gameMode === 'SOLO') addCoins(30);
                        // Online win logic handled by scores comparison
                    }
                    return newCount;
                });
                
                if (gameMode === 'ONLINE') {
                    setOnlineScores(prev => {
                        const scorer = currentPlayer === 1 ? 'p1' : 'p2';
                        return { ...prev, [scorer]: prev[scorer] + 1 };
                    });
                    // Player keeps turn on match
                }
            }, 500);
        } else {
            setTimeout(() => {
                setCards(prev => prev.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isFlipped: false } : c));
                setFlippedIndices([]);
                if (gameMode === 'ONLINE') {
                    setCurrentPlayer(p => p === 1 ? 2 : 1);
                    // No direct turn switch message needed, synchronized by logic
                }
            }, 1000);
        }
    };

    // Multiplayer Data Handler
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            mp.setOnDataReceived((data) => {
                if (data.type === 'MEMORY_INIT') {
                    // Guest receives deck
                    const deck = data.deck.map((c: any) => ({
                        ...c,
                        IconComponent: ICONS[c.iconId], // Reconstruct component
                        isFlipped: false,
                        isMatched: false
                    }));
                    setCards(deck);
                    setFlippedIndices([]);
                    setMatchedCount(0);
                    setIsGameOver(false);
                    setOnlineScores({ p1: 0, p2: 0 });
                    setCurrentPlayer(1);
                } else if (data.type === 'MEMORY_FLIP') {
                    // Opponent flip
                    const index = data.index;
                    setCards(prev => {
                        const newCards = [...prev];
                        newCards[index].isFlipped = true;
                        return newCards;
                    });
                    setFlippedIndices(prev => {
                        const newFlipped = [...prev, index];
                        if (newFlipped.length === 2) {
                            // Check match logic same as local but triggered by remote
                            const idx1 = newFlipped[0];
                            const idx2 = newFlipped[1];
                            const card1 = cards[idx1] || { iconId: -1 }; // Safety
                            const card2 = cards[idx2] || { iconId: -2 };
                            
                            // We need access to current cards state, but in useEffect `cards` might be stale 
                            // if not in deps. However, adding `cards` to deps causes re-subscription loop.
                            // Better to use functional updates exclusively or refs.
                            // For simplicity, we rely on the fact that `cards` in this scope is closed over but `checkForMatch` uses functional state?
                            // No, `checkForMatch` uses `cards` from scope.
                            // Refactoring logic into the setCards callback is safer for sync.
                            
                            // Let's implement match logic inside the setCards to ensure fresh state
                            // Actually, just mirroring logic is cleaner:
                            
                            setTimeout(() => {
                                setCards(currCards => {
                                    const c1 = currCards[idx1];
                                    const c2 = currCards[idx2];
                                    const isMatch = c1.iconId === c2.iconId;
                                    
                                    if (isMatch) {
                                        playCoin();
                                        setOnlineScores(s => {
                                            const scorer = currentPlayer === 1 ? 'p1' : 'p2';
                                            return { ...s, [scorer]: s[scorer] + 1 };
                                        });
                                        setMatchedCount(mc => {
                                            if (mc + 1 >= 8) {
                                                setIsGameOver(true);
                                                playVictory();
                                            }
                                            return mc + 1;
                                        });
                                        return currCards.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isMatched: true } : c);
                                    } else {
                                        setTimeout(() => {
                                            setCards(cc => cc.map((c, i) => (i === idx1 || i === idx2) ? { ...c, isFlipped: false } : c));
                                            setCurrentPlayer(p => p === 1 ? 2 : 1);
                                        }, 1000);
                                        return currCards;
                                    }
                                });
                                setFlippedIndices([]);
                            }, 500);
                        }
                        return newFlipped;
                    });
                } else if (data.type === 'REMATCH_START') {
                    if (mp.amIP1) {
                        const deck = generateCards();
                        const simpleDeck = deck.map(c => ({ id: c.id, iconId: c.iconId }));
                        mp.sendData({ type: 'MEMORY_INIT', deck: simpleDeck });
                        setCards(deck as any);
                    }
                }
            });
        }
    }, [gameMode, mp, currentPlayer, cards, playCoin, playVictory]);

    const isInfoValid = (info: string | undefined) => {
        return info && !info.startsWith('{') && info.length < 20;
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);

         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold text-center text-purple-300 tracking-wider">LOBBY MEMORY</h3>
                     <button onClick={() => mp.createRoom('memory')} className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg text-xs hover:bg-green-400 transition-colors flex items-center gap-2">
                        <Play size={14}/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 && (
                        <>
                            <p className="text-xs text-yellow-400 font-bold tracking-widest my-2">PARTIES DISPONIBLES</p>
                            {hostingPlayers.map(player => {
                                const avatar = AVATARS_CATALOG.find(a => a.id === player.avatarId) || AVATARS_CATALOG[0];
                                const AvatarIcon = avatar.icon;
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{player.name}</span>
                                                {isInfoValid(player.extraInfo) && <span className="text-[10px] text-purple-300 font-bold tracking-widest bg-purple-500/10 px-1.5 rounded border border-purple-500/20 w-fit">{player.extraInfo}</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-3 py-1.5 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
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
                                 const avatar = AVATARS_CATALOG.find(a => a.id === player.avatarId) || AVATARS_CATALOG[0];
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

    if (!gameMode) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20}/> MENU
                    </button>
                </div>
                <div className="flex flex-col gap-4 w-full max-w-sm">
                    <h2 className="text-4xl font-black text-center italic text-purple-500 mb-6">NEON MEMORY</h2>
                    <button onClick={() => setGameMode('SOLO')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all">
                        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Gamepad2 size={24}/></div>
                        <div className="text-left"><h3 className="font-bold text-white">SOLO</h3><p className="text-xs text-gray-400">Moins de coups = Meilleur score</p></div>
                    </button>
                    <button onClick={() => setGameMode('ONLINE')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all">
                        <div className="p-3 bg-green-500/20 rounded-lg text-green-400"><Users size={24}/></div>
                        <div className="text-left"><h3 className="font-bold text-white">EN LIGNE</h3><p className="text-xs text-gray-400">Trouvez le plus de paires</p></div>
                    </button>
                </div>
            </div>
        );
    }

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <button onClick={() => { mp.disconnect(); setGameMode(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20}/> RETOUR
                    </button>
                </div>
                {onlineStep === 'connecting' ? <div className="flex flex-col items-center gap-4 text-purple-400"><Loader2 size={48} className="animate-spin" /><p>CONNEXION...</p></div> : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center p-4 bg-transparent relative">
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => { if(gameMode === 'ONLINE') mp.leaveGame(); setGameMode(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
                    <ArrowLeft size={16}/> {gameMode === 'ONLINE' ? 'QUITTER' : 'MENU'}
                </button>
            </div>

            {gameMode === 'ONLINE' ? (
                <div className="flex items-center gap-8 mb-4 mt-8">
                    <div className={`text-center ${currentPlayer === 1 ? 'scale-110 text-pink-400' : 'text-gray-500'}`}>
                        <div className="text-xs font-bold mb-1">JOUEUR 1</div>
                        <div className="text-2xl font-mono">{onlineScores.p1}</div>
                    </div>
                    <div className={`text-center ${currentPlayer === 2 ? 'scale-110 text-cyan-400' : 'text-gray-500'}`}>
                        <div className="text-xs font-bold mb-1">JOUEUR 2</div>
                        <div className="text-2xl font-mono">{onlineScores.p2}</div>
                    </div>
                </div>
            ) : (
                <div className="mt-8 mb-4 text-purple-300 font-mono text-xl font-bold tracking-wider">COUPS: {moves}</div>
            )}

            <div className="grid grid-cols-4 gap-3 w-full max-w-md aspect-square p-2">
                {cards.map((card, i) => {
                    const Icon = (card as any).IconComponent || ICONS[card.iconId];
                    return (
                        <div 
                            key={i} 
                            onClick={() => handleCardClick(i)}
                            className={`relative rounded-xl cursor-pointer transition-all duration-300 transform ${
                                card.isFlipped || card.isMatched ? 'rotate-y-180 bg-purple-900/80 border-purple-500' : 'bg-gray-800 border-white/10 hover:bg-gray-700'
                            } border-2 flex items-center justify-center shadow-lg`}
                        >
                            {(card.isFlipped || card.isMatched) ? (
                                <Icon size={32} className={`${card.isMatched ? 'text-green-400 animate-pulse' : 'text-purple-300'}`} />
                            ) : (
                                <div className="text-purple-900/20 font-black text-2xl">?</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isGameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in">
                    <h2 className="text-5xl font-black italic text-white mb-4">
                        {gameMode === 'SOLO' ? 'TERMINÉ !' : onlineScores.p1 > onlineScores.p2 ? 'JOUEUR 1 GAGNE' : onlineScores.p2 > onlineScores.p1 ? 'JOUEUR 2 GAGNE' : 'ÉGALITÉ'}
                    </h2>
                    <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else resetGame(); }} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                        <RefreshCw size={20} /> REJOUER
                    </button>
                </div>
            )}
        </div>
    );
};
