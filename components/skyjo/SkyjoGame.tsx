
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, ArrowLeft, Play, Layers, RotateCcw, User, Globe, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, AlertTriangle } from 'lucide-react';
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
    { val: -2, count: 5 }, { val: -1, count: 10 }, { val: 0, count: 15 },
    ...Array.from({ length: 12 }, (_, i) => ({ val: i + 1, count: 10 }))
];

const generateDeck = (): SkyjoCard[] => {
    let deck: SkyjoCard[] = [];
    let idCounter = 0;
    CARD_DISTRIBUTION.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            deck.push({ id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`, value: item.val, isRevealed: false, isCleared: false });
        }
    });
    return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (grid: SkyjoCard[]) => grid.reduce((acc, card) => card.isCleared ? acc : acc + (card.isRevealed ? card.value : 0), 0);

const checkColumns = (grid: SkyjoCard[]): SkyjoCard[] => {
    const newGrid = [...grid];
    let changed = false;
    for (let col = 0; col < GRID_COLS; col++) {
        const idx1 = col; const idx2 = col + GRID_COLS; const idx3 = col + 2 * GRID_COLS;
        const c1 = newGrid[idx1]; const c2 = newGrid[idx2]; const c3 = newGrid[idx3];
        if (c1.isRevealed && c2.isRevealed && c3.isRevealed && !c1.isCleared && !c2.isCleared && !c3.isCleared) {
            if (c1.value === c2.value && c2.value === c3.value) { newGrid[idx1] = { ...c1, isCleared: true }; newGrid[idx2] = { ...c2, isCleared: true }; newGrid[idx3] = { ...c3, isCleared: true }; changed = true; }
        }
    }
    return changed ? newGrid : grid;
};

export const SkyjoGame: React.FC<SkyjoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();

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
    const [showTutorial, setShowTutorial] = useState(false);
    const [doubledScore, setDoubledScore] = useState<Turn | null>(null);

    const resetGame = () => { setDeck([]); setDiscardPile([]); setPlayerGrid([]); setCpuGrid([]); setCurrentDrawnCard(null); setPhase('SETUP'); setMessage("Révélez 2 cartes pour commencer"); setWinner(null); setEarnedCoins(0); setSubTurnState('IDLE'); setFirstFinisher(null); setDoubledScore(null); };

    const startGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        if (mode === 'SOLO') {
            resetGame(); resumeAudio(); const newDeck = generateDeck(); const pHand = newDeck.splice(0, 12); const cHand = newDeck.splice(0, 12); const topCard = newDeck.pop()!; topCard.isRevealed = true;
            cHand[Math.floor(Math.random() * 12)].isRevealed = true; cHand[Math.floor(Math.random() * 12)].isRevealed = true;
            setDeck(newDeck); setPlayerGrid(pHand); setCpuGrid(cHand); setDiscardPile([topCard]);
            if (onReportProgress) onReportProgress('play', 1);
        }
    };

    const handleGridCardClick = (index: number) => {
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER') return;
        if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
            playLand(); const oldCard = { ...playerGrid[index], isRevealed: true }; const newGrid = playerGrid.map((c, i) => i === index ? { ...currentDrawnCard, isRevealed: true } : c);
            const processedGrid = checkColumns(newGrid); setPlayerGrid(processedGrid); setDiscardPile(prev => [...prev, oldCard]); setCurrentDrawnCard(null); setSubTurnState('IDLE');
            endTurn(processedGrid);
        } else if (subTurnState === 'MUST_REVEAL' && !playerGrid[index].isRevealed) {
            playLand(); const newGrid = playerGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c); const processedGrid = checkColumns(newGrid); setPlayerGrid(processedGrid); setSubTurnState('IDLE');
            endTurn(processedGrid);
        }
    };

    const endTurn = (finalGrid: SkyjoCard[]) => {
        const allRevealed = finalGrid.every(c => c.isRevealed || c.isCleared);
        if (allRevealed) {
            if (phase === 'PLAYING') { setPhase('LAST_TURN'); setFirstFinisher('PLAYER'); setMessage("Dernier tour !"); setTurn('CPU'); }
            else handleGameOver(finalGrid, cpuGrid);
        } else { setTurn('CPU'); setMessage("Tour de l'adversaire..."); }
    };

    const handleGameOver = (pGrid: SkyjoCard[], cGrid: SkyjoCard[]) => {
        const procP = checkColumns(pGrid.map(c => ({ ...c, isRevealed: true }))); const procC = checkColumns(cGrid.map(c => ({ ...c, isRevealed: true })));
        setPlayerGrid(procP); setCpuGrid(procC); let pScore = calculateScore(procP); let cScore = calculateScore(procC);
        if (firstFinisher === 'PLAYER' && pScore >= cScore) { pScore *= 2; setDoubledScore('PLAYER'); }
        else if (firstFinisher === 'CPU' && cScore >= pScore) { cScore *= 2; setDoubledScore('CPU'); }
        setPhase('ENDED');
        if (pScore < cScore) { setWinner('PLAYER'); playVictory(); addCoins(50); setEarnedCoins(50); if (onReportProgress) onReportProgress('win', 1); } else { setWinner('CPU'); playGameOver(); }
    };

    // Fix: Added missing handler for back navigation
    const handleLocalBack = () => {
        if (phase === 'MENU') onBack();
        else setPhase('MENU');
    };

    // Fix: Added missing handler for initial card setup
    const handleSetupReveal = (index: number) => {
        if (phase !== 'SETUP' || playerGrid[index].isRevealed) return;
        const newGrid = playerGrid.map((c, i) => i === index ? { ...c, isRevealed: true } : c);
        setPlayerGrid(newGrid);
        playLand();
        const revealedCount = newGrid.filter(c => c.isRevealed).length;
        if (revealedCount >= 2) {
            setPhase('PLAYING');
            setMessage("C'est parti ! Piochez une carte.");
        }
    };

    // Fix: Added missing handler for drawing from deck
    const handleDeckClick = () => {
        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || currentDrawnCard || subTurnState !== 'IDLE') return;
        const newDeck = [...deck];
        const drawn = newDeck.pop();
        if (drawn) {
            setDeck(newDeck);
            setCurrentDrawnCard(drawn);
            setSubTurnState('HOLDING_DECK');
            playLand();
        }
    };

    // Fix: Added missing handler for drawing or discarding from discard pile
    const handleDiscardPileClick = () => {
        if (phase === 'ENDED') return;
        
        if (subTurnState === 'HOLDING_DECK' && currentDrawnCard) {
            // Discarding the drawn card
            setDiscardPile(prev => [...prev, { ...currentDrawnCard, isRevealed: true }]);
            setCurrentDrawnCard(null);
            setSubTurnState('MUST_REVEAL');
            playLand();
            return;
        }

        if ((phase !== 'PLAYING' && phase !== 'LAST_TURN') || turn !== 'PLAYER' || currentDrawnCard || subTurnState !== 'IDLE') return;
        if (discardPile.length === 0) return;
        
        const newDiscard = [...discardPile];
        const drawn = newDiscard.pop()!;
        setDiscardPile(newDiscard);
        setCurrentDrawnCard(drawn);
        setSubTurnState('HOLDING_DECK');
        playLand();
    };

    if (phase === 'MENU') { return ( <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"> <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#a855f7]">NEON TWELVE</h1> <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8"> <button onClick={() => startGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95"> <User size={24} className="text-neon-blue"/> SOLO </button> <button onClick={() => startGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95"> <Globe size={24} className="text-green-500"/> EN LIGNE </button> </div> <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button> </div> ); }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            {showTutorial && <TutorialOverlay gameId="skyjo" onClose={() => setShowTutorial(false)} />}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                {/* Fixed missing handleLocalBack */}
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center"><h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 pr-2 pb-1">NEON TWELVE</h1><span className="text-[10px] text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10 animate-pulse">{message}</span></div>
                <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button><button onClick={() => startGame(gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button></div>
            </div>
            <div className="flex-1 w-full max-w-md flex flex-col gap-2 relative z-10 min-h-0 pb-2 justify-center">
                <div className="w-full bg-gray-900/50 rounded-xl p-1 border border-white/5 relative">
                    <div className="flex justify-between px-2 mb-1"><span className="text-xs font-bold text-gray-500">ADVERSAIRE</span><span className="text-xs font-bold text-gray-500">SCORE: {calculateScore(cpuGrid)}</span></div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">{cpuGrid.map((card, i) => ( <div key={card.id || i} className="flex justify-center"><SkyjoCardComponent card={card} /></div> ))}</div>
                </div>
                <div className="flex items-center justify-center gap-4 sm:gap-8 h-20 sm:h-32 relative shrink-0">
                    {/* Fixed missing handleDeckClick and handleDiscardPileClick */}
                    <div onClick={handleDeckClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard ? 'hover:scale-105' : 'opacity-50'}`}><div className="w-10 h-14 sm:w-20 sm:h-28 bg-gray-800 rounded-md sm:rounded-lg border sm:border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center"><Layers className="text-purple-400" /></div><span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">PIOCHE</span></div>
                    <div onClick={handleDiscardPileClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard ? 'hover:scale-105' : ''}`}>{discardPile.length > 0 ? ( <SkyjoCardComponent card={discardPile[discardPile.length-1]} /> ) : ( <div className="w-10 h-14 sm:w-20 sm:h-28 bg-black/50 rounded-md sm:rounded-lg border sm:border-2 border-white/10 border-dashed flex items-center justify-center"></div> )}<span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">DÉFAUSSE</span></div>
                    {currentDrawnCard && <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 animate-in zoom-in duration-200"><SkyjoCardComponent card={currentDrawnCard} highlight /><span className="text-[10px] font-bold bg-black/80 px-2 py-1 rounded text-white border border-white/20">CARTE EN MAIN</span></div>}
                </div>
                <div className={`w-full bg-gray-900/80 rounded-xl p-1 border-2 ${turn === 'PLAYER' ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10'} transition-all relative`}>
                    <div className="flex justify-between px-2 mb-1"><span className="text-xs font-bold text-cyan-400">VOUS</span><span className="text-xs font-bold text-white">SCORE: {calculateScore(playerGrid)}</span></div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">{playerGrid.map((card, i) => ( <div key={card.id || i} className="flex justify-center"><SkyjoCardComponent card={card} onClick={() => { if (phase === 'SETUP') handleSetupReveal(i); else handleGridCardClick(i); }} interactive={turn === 'PLAYER'} /></div> ))}</div>
                </div>
                {phase === 'ENDED' && ( <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center"><Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" /><h2 className="text-4xl font-black italic text-white mb-2">{winner === 'PLAYER' ? "VICTOIRE !" : "DÉFAITE..."}</h2><button onClick={() => startGame(gameMode)} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button></div> )}
            </div>
        </div>
    );
};
