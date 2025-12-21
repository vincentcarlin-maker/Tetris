
import { useState, useRef, useEffect, useCallback } from 'react';
import { SkyjoCard, GamePhase, Turn, SubTurnState, ChatMessage } from '../types';
import { generateDeck, checkColumns, calculateScore } from '../logic';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useHighScores } from '../../../hooks/useHighScores';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';

export const useSkyjoLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();

    // --- STATE ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    
    const [deck, setDeck] = useState<SkyjoCard[]>([]);
    const [discardPile, setDiscardPile] = useState<SkyjoCard[]>([]);
    const [playerGrid, setPlayerGrid] = useState<SkyjoCard[]>([]);
    const [cpuGrid, setCpuGrid] = useState<SkyjoCard[]>([]);
    
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [currentDrawnCard, setCurrentDrawnCard] = useState<SkyjoCard | null>(null);
    const [firstFinisher, setFirstFinisher] = useState<Turn | null>(null);
    const [subTurnState, setSubTurnState] = useState<SubTurnState>('IDLE');
    
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState<Turn | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [doubledScore, setDoubledScore] = useState<Turn | null>(null);

    // Online
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);

    const setupRevealedIndicesRef = useRef(new Set<number>());
    const handleDataRef = useRef<(data: any) => void>(null);

    // --- INIT ---
    useEffect(() => { mp.updateSelfInfo(username, currentAvatarId); }, [username, currentAvatarId, mp]);

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
            const pHand = newDeck.splice(0, 12).map(c => ({...c}));
            const cHand = newDeck.splice(0, 12).map(c => ({...c}));
            const topCard = newDeck.pop()!;
            topCard.isRevealed = true;

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
            setPhase('LOBBY'); // Important: Passer en phase lobby pour afficher l'UI de connexion/lobby
            setOnlineStep('connecting');
            mp.connect();
        }
    };

    // --- LOGIC ACTIONS ---
    const handleSetupReveal = (index: number) => {
        if (phase !== 'SETUP') return;
        if (setupRevealedIndicesRef.current.has(index)) return;
        if (setupRevealedIndicesRef.current.size >= 2) return;

        setupRevealedIndicesRef.current.add(index);
        playMove();
        setPlayerGrid(prev => prev.map((c, i) => i === index ? { ...c, isRevealed: true } : c));

        if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_SETUP_REVEAL', index });

        if (setupRevealedIndicesRef.current.size >= 2) {
            setTimeout(() => {
                setPhase('PLAYING');
                setMessage("À vous de jouer !");
            }, 500);
        }
    };

    const handleDeckClick = () => {
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || subTurnState !== 'IDLE') return;
        
        let currentDeck = [...deck];
        if (currentDeck.length === 0) {
            if (discardPile.length <= 1) { setMessage("Plus de cartes !"); return; }
            const top = discardPile.pop()!;
            currentDeck = discardPile.map(c => ({ ...c, isRevealed: false })).sort(() => Math.random() - 0.5);
            setDiscardPile([top]);
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
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || subTurnState !== 'IDLE') {
            if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
                setDiscardPile(prev => [...prev, currentDrawnCard]);
                setCurrentDrawnCard(null);
                setSubTurnState('MUST_REVEAL');
                setMessage("Révélez une carte cachée");
                playPaddleHit();
                return;
            }
            return;
        }
        if (discardPile.length === 0) return;

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

        if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
            playLand();
            const oldCard = { ...playerGrid[index], isRevealed: true };
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

        if (subTurnState === 'MUST_REVEAL') {
            if (playerGrid[index].isRevealed) { setMessage("Déjà révélée !"); return; }
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
        const allRevealed = finalGrid.every(c => c.isRevealed || c.isCleared);
        if (allRevealed) {
            if (phase === 'PLAYING') {
                setPhase('LAST_TURN');
                setFirstFinisher('PLAYER');
                setMessage("Dernier tour !");
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_LAST_TURN' });
                setTurn('CPU');
                if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_PASS' });
            } else if (phase === 'LAST_TURN') {
                handleGameOver(finalGrid, cpuGrid);
            }
        } else {
            setTurn('CPU');
            setMessage("Tour de l'adversaire...");
            if (gameMode === 'ONLINE') mp.sendData({ type: 'SKYJO_PASS' });
        }
    };

    const handleGameOver = (pGrid: SkyjoCard[], cGrid: SkyjoCard[]) => {
        const finalP = pGrid.map(c => ({ ...c, isRevealed: true }));
        const finalC = cGrid.map(c => ({ ...c, isRevealed: true }));
        const procP = checkColumns(finalP);
        const procC = checkColumns(finalC);

        setPlayerGrid(procP);
        setCpuGrid(procC);

        let pScore = calculateScore(procP);
        let cScore = calculateScore(procC);

        if (firstFinisher === 'PLAYER' && pScore >= cScore) {
            pScore *= 2;
            setDoubledScore('PLAYER');
        } else if (firstFinisher === 'CPU' && cScore >= pScore) {
            cScore *= 2;
            setDoubledScore('CPU');
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

    // --- AI ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'CPU' && (phase === 'PLAYING' || phase === 'LAST_TURN')) {
            const timer = setTimeout(() => {
                // ... (Logic AI identique à l'originale, simplifiée ici pour gain place)
                let aiGrid = [...cpuGrid];
                let aiDiscard = [...discardPile];
                let aiDeck = [...deck];
                const topDiscard = aiDiscard[aiDiscard.length - 1];
                let cardToPlay: SkyjoCard | null = null;
                let fromDiscard = false;

                if (topDiscard && topDiscard.value < 5) {
                    cardToPlay = topDiscard; aiDiscard.pop(); fromDiscard = true;
                } else {
                    if (aiDeck.length === 0) aiDeck = generateDeck();
                    cardToPlay = aiDeck.pop()!; cardToPlay.isRevealed = true;
                }

                let swapIdx = -1; let maxVal = -99;
                aiGrid.forEach((c, i) => { if (!c.isCleared && c.isRevealed && c.value > maxVal) { maxVal = c.value; swapIdx = i; } });

                if (cardToPlay.value < maxVal) {
                    const old = { ...aiGrid[swapIdx], isRevealed: true }; aiGrid[swapIdx] = cardToPlay; aiDiscard.push(old);
                } else if (!fromDiscard) {
                    aiDiscard.push(cardToPlay);
                    const hiddenIndices = aiGrid.map((c, i) => (!c.isRevealed && !c.isCleared) ? i : -1).filter(i => i !== -1);
                    if (hiddenIndices.length > 0) aiGrid[hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)]].isRevealed = true;
                } else {
                     const old = { ...aiGrid[swapIdx], isRevealed: true }; aiGrid[swapIdx] = cardToPlay; aiDiscard.push(old);
                }

                aiGrid = checkColumns(aiGrid);
                setCpuGrid(aiGrid); setDiscardPile(aiDiscard); setDeck(aiDeck); playMove();

                const allRev = aiGrid.every(c => c.isRevealed || c.isCleared);
                if (allRev) {
                    if (phase === 'PLAYING') {
                        setPhase('LAST_TURN'); setFirstFinisher('CPU'); setMessage("Dernier tour (CPU) !"); setTurn('PLAYER');
                    } else handleGameOver(playerGrid, aiGrid);
                } else if (phase === 'LAST_TURN') handleGameOver(playerGrid, aiGrid);
                else { setTurn('PLAYER'); setMessage("À vous !"); }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, gameMode, phase]);

    // --- MULTIPLAYER HANDLER ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'SKYJO_INIT') {
                setPlayerGrid(data.hand); setCpuGrid(data.oppHand); setDiscardPile([data.topCard]);
                setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                setPhase('SETUP'); setMessage("Révélez 2 cartes pour commencer");
                setDeck(Array(20).fill(null) as any);
                setSubTurnState('IDLE'); setFirstFinisher(null); setDoubledScore(null);
                setupRevealedIndicesRef.current.clear();
                setIsWaitingForHost(false); setOpponentLeft(false);
            }
            if (data.type === 'SKYJO_SETUP_REVEAL') {
                const newGrid = cpuGrid.map((c, i) => i === data.index ? { ...c, isRevealed: true } : c);
                setCpuGrid(newGrid); playMove();
            }
            if (data.type === 'SKYJO_DRAW_DECK') setMessage("L'adversaire pioche...");
            if (data.type === 'SKYJO_DRAW_DISCARD') {
                setDiscardPile(prev => prev.slice(0, -1)); setMessage("L'adversaire prend la défausse");
            }
            if (data.type === 'SKYJO_SWAP') {
                const newGrid = cpuGrid.map((c, i) => i === data.index ? { ...data.newCard, isRevealed: true } : c);
                setCpuGrid(checkColumns(newGrid)); setDiscardPile(prev => [...prev, data.discarded]); playLand();
            }
            if (data.type === 'SKYJO_REVEAL') {
                const newGrid = cpuGrid.map((c, i) => i === data.index ? { ...c, isRevealed: true } : c);
                setCpuGrid(checkColumns(newGrid)); playLand();
            }
            if (data.type === 'SKYJO_LAST_TURN') {
                setMessage("Dernier tour (Adversaire) !"); setPhase('LAST_TURN'); setFirstFinisher('CPU');
            }
            if (data.type === 'SKYJO_PASS') { setTurn('PLAYER'); setMessage("À vous !"); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); handleGameOver(playerGrid, cpuGrid); }
            if (data.type === 'REMATCH_START') startGame('ONLINE');
            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe();
    }, [mp]);

    useEffect(() => {
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');

            // Force phase LOBBY if not playing/setup
            if (phase !== 'MENU' && phase !== 'SETUP' && phase !== 'PLAYING' && phase !== 'LAST_TURN' && phase !== 'ENDED') {
                 if (phase !== 'LOBBY') setPhase('LOBBY');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (mp.isHost) {
                // Host initiates game setup
                if (phase === 'LOBBY' || phase === 'MENU') {
                     resetGame();
                     const newDeck = generateDeck();
                     const pHand = newDeck.splice(0, 12).map(c => ({...c}));
                     const cHand = newDeck.splice(0, 12).map(c => ({...c}));
                     const topCard = newDeck.pop()!;
                     topCard.isRevealed = true;
                     setDeck(newDeck);
                     setPlayerGrid(pHand);
                     setCpuGrid(cHand); // Used to store opponent's hand logic for verification/display
                     setDiscardPile([topCard]);
                     
                     // Send INIT to opponent
                     setTimeout(() => {
                         mp.sendData({
                             type: 'SKYJO_INIT',
                             hand: cHand, // Opponent gets this hand
                             oppHand: pHand, // Opponent sees host hand as opponent
                             topCard: topCard,
                             startTurn: mp.peerId
                         });
                     }, 1000);
                }
            } else {
                if (phase === 'MENU') {
                     setPhase('LOBBY');
                }
                if (!isWaitingForHost) setIsWaitingForHost(true);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    const sendChat = (text: string) => {
        const msg: ChatMessage = { id: Date.now(), text, senderName: username, isMe: true, timestamp: Date.now() };
        setChatHistory(prev => [...prev, msg]);
        mp.sendData({ type: 'CHAT', text, senderName: username });
    };

    const sendReaction = (id: string) => {
        setActiveReaction({ id, isMe: true });
        mp.sendData({ type: 'REACTION', id });
        setTimeout(() => setActiveReaction(null), 3000);
    };

    return {
        phase, setPhase,
        gameMode, setGameMode,
        deck, discardPile, playerGrid, cpuGrid,
        turn, subTurnState, currentDrawnCard,
        message, winner, earnedCoins, doubledScore,
        onlineStep, setOnlineStep, isWaitingForHost, opponentLeft,
        chatHistory, activeReaction,
        startGame, resetGame,
        handleSetupReveal, handleDeckClick, handleDiscardPileClick, handleGridCardClick,
        sendChat, sendReaction
    };
};
