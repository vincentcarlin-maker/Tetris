
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, ArrowLeft, Play, Layers, RotateCcw, User, Globe, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, AlertTriangle, ArrowRight, Grid3X3, Zap } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { SkyjoCard as SkyjoCardComponent } from './SkyjoCard';
import { SkyjoCard, GamePhase, Turn, SubTurnState, ChatMessage } from './types';

interface SkyjoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// --- CONSTANTS ---
const GRID_COLS = 4;
const GRID_ROWS = 3;
const CARDS_PER_PLAYER = 12;

const CARD_DISTRIBUTION = [
    { val: -2, count: 5 },
    { val: -1, count: 10 },
    { val: 0, count: 15 },
    ...Array.from({ length: 12 }, (_, i) => ({ val: i + 1, count: 10 }))
];

const generateDeck = (): SkyjoCard[] => {
    let deck: SkyjoCard[] = [];
    let idCounter = 0;
    CARD_DISTRIBUTION.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            deck.push({
                id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`,
                value: item.val,
                isRevealed: false,
                isCleared: false
            });
        }
    });
    return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (grid: SkyjoCard[]) => {
    return grid.reduce((acc, card) => card.isCleared ? acc : acc + (card.isRevealed ? card.value : 0), 0);
};

const checkColumns = (grid: SkyjoCard[]): SkyjoCard[] => {
    const newGrid = [...grid];
    let changed = false;

    for (let col = 0; col < GRID_COLS; col++) {
        const idx1 = col;
        const idx2 = col + GRID_COLS;
        const idx3 = col + 2 * GRID_COLS;

        const c1 = newGrid[idx1];
        const c2 = newGrid[idx2];
        const c3 = newGrid[idx3];

        // Ensure all are revealed, not already cleared, and values match
        if (c1.isRevealed && c2.isRevealed && c3.isRevealed && 
            !c1.isCleared && !c2.isCleared && !c3.isCleared) {
            
            if (c1.value === c2.value && c2.value === c3.value) {
                // Column Match! Mark as cleared.
                newGrid[idx1] = { ...c1, isCleared: true };
                newGrid[idx2] = { ...c2, isCleared: true };
                newGrid[idx3] = { ...c3, isCleared: true };
                changed = true;
            }
        }
    }
    return changed ? newGrid : grid;
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

export const SkyjoGame: React.FC<SkyjoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    // --- HOOKS ---
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio, playCoin } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

    // --- GAME STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    
    // Board Data
    const [deck, setDeck] = useState<SkyjoCard[]>([]);
    const [discardPile, setDiscardPile] = useState<SkyjoCard[]>([]);
    const [playerGrid, setPlayerGrid] = useState<SkyjoCard[]>([]);
    const [cpuGrid, setCpuGrid] = useState<SkyjoCard[]>([]);
    
    // Control Flow
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [currentDrawnCard, setCurrentDrawnCard] = useState<SkyjoCard | null>(null);
    const [firstFinisher, setFirstFinisher] = useState<Turn | null>(null); // Who finished first
    
    // Strict State Machine for Player Interaction
    const [subTurnState, setSubTurnState] = useState<SubTurnState>('IDLE');
    
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [doubledScore, setDoubledScore] = useState<Turn | null>(null);

    // Online
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const handleDataRef = useRef<(data: any) => void>(null);
    
    // Setup Phase Ref (prevents rapid-fire clicking exploit)
    const setupRevealedIndicesRef = useRef(new Set<number>());

    // --- INITIALIZATION ---
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_skyjo_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_skyjo_tutorial_seen', 'true');
        }
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

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
            if (phase !== 'MENU') setPhase('MENU'); // Return to menu if disconnected
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            
            // Host logic to start game once in_game
            if (mp.isHost && (phase === 'MENU' || phase === 'ENDED')) {
                resetGame();
                const newDeck = generateDeck();
                const pHand = newDeck.splice(0, 12);
                const cHand = newDeck.splice(0, 12);
                const topCard = newDeck.pop()!;
                topCard.isRevealed = true;

                setDeck(newDeck);
                setPlayerGrid(pHand);
                setCpuGrid(cHand); 
                setDiscardPile([topCard]);
                
                // Give connection time to settle
                setTimeout(() => {
                    mp.sendData({
                        type: 'SKYJO_INIT',
                        hand: cHand,
                        oppHand: pHand,
                        topCard,
                        startTurn: mp.peerId
                    });
                }, 1000);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase]);

    // --- RESET & SETUP ---
    const resetGame = () => {
        setDeck([]);
        setDiscardPile([]);
        setPlayerGrid([]);
        setCpuGrid([]);
        setCurrentDrawnCard(null);
        setPhase('SETUP');
        setMessage("Révélez 2 cartes pour commencer");
        setWinner(null);
        setEarnedCoins(0);
        setSubTurnState('IDLE');
        setFirstFinisher(null);
        setDoubledScore(null);
        setupRevealedIndicesRef.current.clear();
    };

    const startGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        
        if (mode === 'SOLO') {
            resetGame();
            resumeAudio();
            const newDeck = generateDeck();
            
            // Player hand
            const pHand = newDeck.splice(0, 12).map(c => ({...c}));
            
            // CPU hand
            const cHand = newDeck.splice(0, 12).map(c => ({...c}));
            
            // Initial Discard
            const topCard = newDeck.pop()!;
            topCard.isRevealed = true;

            // Reveal 2 random cards for CPU immediately
            const idx1 = Math.floor(Math.random() * 12);
            let idx2 = Math.floor(Math.random() * 12);
            while(idx1 === idx2) idx2 = Math.floor(Math.random() * 12);
            cHand[idx1].isRevealed = true;
            cHand[idx2].isRevealed = true;

            setDeck(newDeck);
            setPlayerGrid(pHand);
            setCpuGrid(cHand);
            setDiscardPile([topCard]);
            
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            // ONLINE mode just connects and shows lobby (handled by useEffect)
            setOnlineStep('connecting');
            mp.connect();
        }
    };

    // --- CORE GAMEPLAY LOGIC ---

    // 1. SETUP PHASE: REVEAL 2 CARDS
    const handleSetupReveal = (index: number) => {
        if (phase !== 'SETUP') return;
        
        // Safety check using Ref to prevent race conditions on rapid clicks
        if (setupRevealedIndicesRef.current.has(index)) return;
        if (setupRevealedIndicesRef.current.size >= 2) return;

        setupRevealedIndicesRef.current.add(index);
        
        playMove();
        
        // Use functional update to ensure state consistency
        setPlayerGrid(prevGrid => prevGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c));

        if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_SETUP_REVEAL', index });

        // Check if we hit 2 revealed
        if (setupRevealedIndicesRef.current.size >= 2) {
            setTimeout(() => {
                setPhase('PLAYING');
                setMessage("À vous de jouer !");
            }, 500);
        }
    };

    // 2. PLAYING PHASE ACTIONS
    const handleDeckClick = () => {
        // ALLOW ACTION IN LAST TURN TOO
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || subTurnState !== 'IDLE') return;
        
        // Shuffle check
        let currentDeck = [...deck];
        if (currentDeck.length === 0) {
            if (discardPile.length <= 1) { setMessage("Plus de cartes !"); return; }
            const top = discardPile.pop()!;
            currentDeck = discardPile.map(c => ({ ...c, isRevealed: false })).sort(() => Math.random() - 0.5);
            setDiscardPile([top]);
            setMessage("Mélange...");
        }

        const card = currentDeck.pop()!;
        card.isRevealed = true;
        setDeck(currentDeck);
        setCurrentDrawnCard(card);
        setSubTurnState('HOLDING_DECK');
        setMessage("Échanger (Grille) ou Défausser ?");
        playMove();

        if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_DRAW_DECK' });
    };

    const handleDiscardPileClick = () => {
        // Can only pick discard if IDLE state
        // ALLOW ACTION IN LAST TURN TOO
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || subTurnState !== 'IDLE') {
            // Special Case: If HOLDING_DECK, clicking discard pile means "Discard the drawn card"
            if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
                // Action: Discard drawn card -> Must Reveal one
                setDiscardPile(prev => [...prev, currentDrawnCard]);
                setCurrentDrawnCard(null);
                setSubTurnState('MUST_REVEAL');
                setMessage("Révélez une carte cachée");
                playPaddleHit();
                // Note: Online sync happens via action
                return;
            }
            return;
        }

        if (discardPile.length === 0) return;

        // Action: Pick up top discard -> Must Swap immediately
        const top = discardPile[discardPile.length - 1];
        setDiscardPile(prev => prev.slice(0, -1));
        setCurrentDrawnCard(top);
        setSubTurnState('HOLDING_DECK'); 
        
        setMessage("Échangez avec une carte de la grille");
        playMove();

        if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_DRAW_DISCARD' });
    };

    const handleGridCardClick = (index: number) => {
        if (phase !== 'PLAYING' && phase !== 'LAST_TURN') return;
        if (turn !== 'PLAYER') return;

        // --- SUB-STATE: HOLDING_DECK (Swap) ---
        if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
            playLand();
            
            const oldCard = { ...playerGrid[index], isRevealed: true }; // Force reveal old card when discarding
            const newGrid = playerGrid.map((c, i) => i === index ? { ...currentDrawnCard, isRevealed: true } : c);
            
            const processedGrid = checkColumns(newGrid);
            setPlayerGrid(processedGrid);
            
            setDiscardPile(prev => [...prev, oldCard]);
            setCurrentDrawnCard(null);
            setSubTurnState('IDLE');
            
            if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_SWAP', index, newCard: currentDrawnCard, discarded: oldCard });

            endTurn(processedGrid);
            return;
        }

        // --- SUB-STATE: MUST_REVEAL ---
        if (subTurnState === 'MUST_REVEAL') {
            if (playerGrid[index].isRevealed) {
                setMessage("Déjà révélée ! Choisissez une cachée.");
                return;
            }
            
            playLand();
            const newGrid = playerGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c);
            const processedGrid = checkColumns(newGrid);
            setPlayerGrid(processedGrid);
            setSubTurnState('IDLE');

            if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_REVEAL', index });

            endTurn(processedGrid);
            return;
        }
    };

    const endTurn = (finalGrid: SkyjoCard[]) => {
        // Check Round End
        const allRevealed = finalGrid.every(c => c.isRevealed || c.isCleared);
        
        if (allRevealed) {
            if (phase === 'PLAYING') {
                setPhase('LAST_TURN');
                setFirstFinisher('PLAYER');
                setMessage("Dernier tour !");
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_LAST_TURN' });
                // If I finished, turn goes to opponent
                setTurn('CPU');
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_PASS' });
            } else if (phase === 'LAST_TURN') {
                // I was last player, game ends
                handleGameOver(finalGrid, cpuGrid);
            }
        } else {
            setTurn('CPU');
            setMessage("Tour de l'adversaire...");
            if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_PASS' });
        }
    };

    // --- AI LOGIC ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'CPU' && (phase === 'PLAYING' || phase === 'LAST_TURN')) {
            const timer = setTimeout(() => {
                let aiGrid = [...cpuGrid];
                let aiDiscard = [...discardPile];
                let aiDeck = [...deck];
                const topDiscard = aiDiscard[aiDiscard.length - 1];

                // AI Decision
                let cardToPlay: SkyjoCard | null = null;
                let fromDiscard = false;

                // 1. Take Discard if small (< 5)
                if (topDiscard && topDiscard.value < 5) {
                    cardToPlay = topDiscard;
                    aiDiscard.pop();
                    fromDiscard = true;
                } else {
                    // 2. Draw
                    if (aiDeck.length === 0) aiDeck = generateDeck(); // Simplified reshuffle
                    cardToPlay = aiDeck.pop()!;
                    cardToPlay.isRevealed = true;
                }

                // 3. Action
                // Strategy: Find highest revealed card to swap
                let swapIdx = -1;
                let maxVal = -99;
                
                aiGrid.forEach((c, i) => {
                    if (!c.isCleared && c.isRevealed && c.value > maxVal) {
                        maxVal = c.value;
                        swapIdx = i;
                    }
                });

                // If drawn card better than worst card, Swap
                if (cardToPlay.value < maxVal) {
                    const old = { ...aiGrid[swapIdx], isRevealed: true };
                    aiGrid[swapIdx] = cardToPlay;
                    aiDiscard.push(old);
                } else if (!fromDiscard) {
                    // Drawn card is bad, discard it and reveal hidden
                    aiDiscard.push(cardToPlay);
                    const hiddenIndices = aiGrid.map((c, i) => (!c.isRevealed && !c.isCleared) ? i : -1).filter(i => i !== -1);
                    if (hiddenIndices.length > 0) {
                        const idx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
                        aiGrid[idx] = { ...aiGrid[idx], isRevealed: true };
                    } else {
                        // All revealed? Swap anyway with random
                        const rnd = Math.floor(Math.random() * 12);
                        const old = aiGrid[rnd];
                        aiGrid[rnd] = cardToPlay;
                        aiDiscard.push(old);
                    }
                } else {
                    // Took from discard -> Must swap
                    const old = { ...aiGrid[swapIdx], isRevealed: true };
                    aiGrid[swapIdx] = cardToPlay;
                    aiDiscard.push(old);
                }

                aiGrid = checkColumns(aiGrid);
                
                // Commit AI State
                setCpuGrid(aiGrid);
                setDiscardPile(aiDiscard);
                setDeck(aiDeck);
                playMove();

                // Check End
                const allRev = aiGrid.every(c => c.isRevealed || c.isCleared);
                if (allRev) {
                    if (phase === 'PLAYING') {
                        setPhase('LAST_TURN');
                        setFirstFinisher('CPU');
                        setMessage("Dernier tour (CPU a fini) !");
                        setTurn('PLAYER');
                    } else {
                        handleGameOver(playerGrid, aiGrid);
                    }
                } else if (phase === 'LAST_TURN') {
                    // CPU finished last turn
                    handleGameOver(playerGrid, aiGrid);
                } else {
                    setTurn('PLAYER');
                    setMessage("À vous !");
                }

            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [turn, gameMode, phase]);

    const handleGameOver = (pGrid: SkyjoCard[], cGrid: SkyjoCard[]) => {
        // Reveal All
        const finalP = pGrid.map(c => ({ ...c, isRevealed: true }));
        const finalC = cGrid.map(c => ({ ...c, isRevealed: true }));
        
        // Final Column Check
        const procP = checkColumns(finalP);
        const procC = checkColumns(finalC);

        setPlayerGrid(procP);
        setCpuGrid(procC);

        let pScore = calculateScore(procP);
        let cScore = calculateScore(procC);

        // --- RÈGLE SPÉCIALE SKYJO : DOUBLER LE SCORE ---
        // Si le joueur qui termine n'a pas strictement le plus petit score, son score est doublé.
        if (firstFinisher === 'PLAYER') {
            if (pScore >= cScore) {
                pScore *= 2;
                setDoubledScore('PLAYER');
            }
        } else if (firstFinisher === 'CPU') {
            if (cScore >= pScore) {
                cScore *= 2;
                setDoubledScore('CPU');
            }
        }

        setPhase('ENDED');
        if (pScore < cScore) {
            setWinner('PLAYER');
            playVictory();
            const reward = 50 + (cScore - pScore);
            addCoins(reward);
            setEarnedCoins(reward);
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            setWinner('CPU');
            playGameOver();
        }
    };

    // --- ONLINE DATA HANDLING ---
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'SKYJO_INIT') {
                setPlayerGrid(data.hand); // Received by guest
                setCpuGrid(data.oppHand);
                setDiscardPile([data.topCard]);
                setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                setPhase('SETUP');
                setMessage("Révélez 2 cartes pour commencer");
                setDeck(Array(20).fill(null) as any); // Dummy deck for visuals
                setSubTurnState('IDLE');
                setFirstFinisher(null);
                setDoubledScore(null);
                setupRevealedIndicesRef.current.clear(); // Reset setup counter for Guest
                setIsWaitingForHost(false);
                setOpponentLeft(false);
            }
            if (data.type === 'SKYJO_SETUP_REVEAL') {
                const index = data.index;
                const newGrid = cpuGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c);
                setCpuGrid(newGrid);
                playMove();
            }
            if (data.type === 'SKYJO_DRAW_DECK') {
                // Opponent drew from deck (visual feedback only)
                setMessage("L'adversaire pioche...");
            }
            if (data.type === 'SKYJO_DRAW_DISCARD') {
                const top = discardPile.pop()!;
                setDiscardPile([...discardPile]); // Update pile
                setMessage("L'adversaire prend la défausse");
                // Note: We don't know what they do yet until SWAP or REVEAL comes
            }
            if (data.type === 'SKYJO_SWAP') {
                const { index, newCard, discarded } = data;
                // Opponent swapped card at index
                const newGrid = cpuGrid.map((c, i) => i === index ? { ...newCard, isRevealed: true } : c);
                const procGrid = checkColumns(newGrid);
                setCpuGrid(procGrid);
                setDiscardPile(prev => [...prev, discarded]);
                playLand();
            }
            if (data.type === 'SKYJO_REVEAL') {
                const { index } = data;
                const newGrid = cpuGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c);
                const procGrid = checkColumns(newGrid);
                setCpuGrid(procGrid);
                playLand();
            }
            if (data.type === 'SKYJO_LAST_TURN') {
                setMessage("Dernier tour (Adversaire) !");
                setPhase('LAST_TURN');
                setFirstFinisher('CPU');
            }
            if (data.type === 'SKYJO_PASS') {
                setTurn('PLAYER');
                setMessage("À vous !");
            }
            if (data.type === 'REMATCH_START') {
                startGame('ONLINE');
            }
            if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                handleGameOver(playerGrid, cpuGrid); // Force end
            }
            
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
        });
        return () => unsubscribe();
    }, [mp, cpuGrid, discardPile, playerGrid]);

    // --- RENDER ---
    const handleLocalBack = () => {
        if (phase === 'MENU') {
            onBack();
        } else {
            if (gameMode === 'ONLINE') {
                if (onlineStep === 'game') {
                    mp.leaveGame();
                    setOnlineStep('lobby');
                } else {
                    mp.disconnect();
                    setPhase('MENU');
                }
            } else {
                setPhase('MENU');
            }
        }
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);

         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-purple-300 tracking-wider drop-shadow-md">LOBBY SKYJO</h3>
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
                                            <span className="font-bold">{player.name}</span>
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

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">CYBER SKY</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-purple-400 animate-spin mb-4" /><p className="text-purple-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    // --- MENU VIEW (NEW STYLE) ---
    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                {/* Background layers */}
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                {/* Floating Particles/Orbs for ambience - fixed position */}
                <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="fixed bottom-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse delay-1000 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    
                    {/* Title Section */}
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                         <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] tracking-tighter pr-4">
                            CYBER<br className="md:hidden"/> SKY
                        </h1>
                    </div>

                    {/* Game Modes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        
                        {/* SOLO CARD */}
                        <button onClick={() => startGame('SOLO')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                    <User size={32} className="text-purple-400" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-purple-300 transition-colors">SOLO</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Défiez l'ordinateur dans une partie rapide. Tentez d'obtenir le score le plus bas possible.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                LANCER UNE PARTIE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        {/* ONLINE CARD */}
                        <button onClick={() => startGame('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                                    <Globe size={32} className="text-pink-400" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-pink-300 transition-colors">EN LIGNE</h2>
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Rejoignez le lobby et affrontez d'autres joueurs en temps réel pour le contrôle de la grille.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-pink-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg">
                            <Home size={14} /> RETOUR AU MENU PRINCIPAL
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="skyjo" onClose={() => setShowTutorial(false)} />}

            {gameMode === 'ONLINE' && isWaitingForHost && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-purple-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE DE L'HÔTE...</p>
                    <button onClick={mp.leaveGame} className="px-6 py-2 bg-gray-700 text-white rounded-full text-sm font-bold mt-4 hover:bg-gray-600">QUITTER</button>
                </div>
            )}
            
            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* HEADER */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] pr-2 pb-1">CYBER SKY</h1>
                    <span className="text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10 animate-pulse">{message}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => startGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* GAME AREA */}
            <div className="flex-1 w-full max-w-md flex flex-col gap-2 relative z-10 min-h-0 pb-2 justify-center"> {/* Changed gap-4 to gap-2, added justify-center */}
                
                {/* OPPONENT GRID */}
                <div className="w-full bg-gray-900/50 rounded-xl p-1 border border-white/5 relative"> {/* p-2 -> p-1 */}
                    <div className="flex justify-between px-2 mb-1"> {/* mb-2 -> mb-1 */}
                        <span className="text-xs font-bold text-gray-500">ADVERSAIRE</span>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-500">SCORE: {calculateScore(cpuGrid)}</span>
                            {doubledScore === 'CPU' && <span className="text-[8px] font-black text-red-500 animate-pulse flex items-center gap-1"><AlertTriangle size={8}/> SCORE DOUBLÉ</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2"> {/* gap-2 -> gap-1 sm:gap-2 */}
                        {cpuGrid.map((card, i) => (
                            <div key={card.id || i} className="flex justify-center">
                                <SkyjoCardComponent key={card.id || i} card={card} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* DECKS AREA */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 h-20 sm:h-32 relative shrink-0"> {/* h-32 -> h-20 sm:h-32 */}
                    {/* Deck */}
                    <div onClick={handleDeckClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard && (phase === 'PLAYING' || phase === 'LAST_TURN') ? 'hover:scale-105' : 'opacity-50'}`}>
                        <div className="w-10 h-14 sm:w-20 sm:h-28 bg-gray-800 rounded-md sm:rounded-lg border sm:border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                            <Layers className="text-purple-400" />
                        </div>
                        <span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">PIOCHE</span>
                    </div>

                    {/* Discard */}
                    <div onClick={handleDiscardPileClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard && (phase === 'PLAYING' || phase === 'LAST_TURN') ? 'hover:scale-105' : ''}`}>
                        {discardPile.length > 0 ? (
                            <SkyjoCardComponent card={discardPile[discardPile.length-1]} />
                        ) : (
                            <div className="w-10 h-14 sm:w-20 sm:h-28 bg-black/50 rounded-md sm:rounded-lg border sm:border-2 border-white/10 border-dashed flex items-center justify-center"></div>
                        )}
                        <span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">DÉFAUSSE</span>
                    </div>

                    {/* Active Drawn Card Overlay */}
                    {currentDrawnCard && (
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 animate-in zoom-in duration-200">
                            <SkyjoCardComponent card={currentDrawnCard} style={{ boxShadow: '0 0 30px rgba(255,255,255,0.5)' }} highlight />
                            <span className="text-[10px] font-bold bg-black/80 px-2 py-1 rounded text-white border border-white/20 shadow-lg">CARTE EN MAIN</span>
                        </div>
                    )}
                </div>

                {/* PLAYER GRID */}
                <div className={`w-full bg-gray-900/80 rounded-xl p-1 border-2 ${turn === 'PLAYER' ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10'} transition-all relative`}> {/* p-2 -> p-1 */}
                    <div className="flex justify-between px-2 mb-1"> {/* mb-2 -> mb-1 */}
                        <span className="text-xs font-bold text-cyan-400">VOUS</span>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white">SCORE: {calculateScore(playerGrid)}</span>
                            {doubledScore === 'PLAYER' && <span className="text-[9px] font-black text-red-500 animate-pulse flex items-center gap-1"><AlertTriangle size={10}/> SCORE DOUBLÉ</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2"> {/* gap-2 -> gap-1 sm:gap-2 */}
                        {playerGrid.map((card, i) => (
                            <div key={card.id || i} className="flex justify-center">
                                <SkyjoCardComponent 
                                    card={card} 
                                    onClick={() => {
                                        if (phase === 'SETUP') handleSetupReveal(i);
                                        else handleGridCardClick(i);
                                    }}
                                    interactive={
                                        turn === 'PLAYER' && (
                                            phase === 'SETUP' || 
                                            ((phase === 'PLAYING' || phase === 'LAST_TURN') && subTurnState !== 'IDLE')
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* GAME OVER */}
                {phase === 'ENDED' && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                        <h2 className="text-4xl font-black italic text-white mb-2">{winner === 'PLAYER' ? "VICTOIRE !" : "DÉFAITE..."}</h2>
                        
                        <div className="flex gap-8 mb-6 bg-gray-800/50 p-4 rounded-xl border border-white/10">
                            <div className="text-center relative">
                                <p className="text-xs text-gray-400 font-bold mb-1">VOUS</p>
                                <p className="text-3xl font-mono text-cyan-400">{calculateScore(playerGrid)}</p>
                                {doubledScore === 'PLAYER' && <div className="absolute -top-3 -right-6 text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded rotate-12 shadow-md">DOUBLÉ</div>}
                            </div>
                            <div className="text-center relative">
                                <p className="text-xs text-gray-400 font-bold mb-1">ADV</p>
                                <p className="text-3xl font-mono text-purple-400">{calculateScore(cpuGrid)}</p>
                                {doubledScore === 'CPU' && <div className="absolute -top-3 -right-6 text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded rotate-12 shadow-md">DOUBLÉ</div>}
                            </div>
                        </div>

                        {doubledScore && (
                            <div className="mb-4 text-[10px] text-gray-400 max-w-[200px] border border-red-500/30 bg-red-900/10 p-2 rounded">
                                <AlertTriangle size={12} className="inline mr-1 text-red-500"/>
                                <strong>RÈGLE SKYJO :</strong> Le joueur ayant fini premier n'avait pas le plus petit score. Ses points ont été doublés.
                            </div>
                        )}

                        {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                        <button onClick={() => startGame(gameMode)} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg active:scale-95 flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
                    </div>
                )}
            </div>
        </div>
    );
};
