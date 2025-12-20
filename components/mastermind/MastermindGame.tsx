
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, BrainCircuit, Delete, Check, X, User, Globe, Play, ArrowLeft, Loader2, LogOut, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, Lock, Unlock, Eye, HelpCircle, Palette, Search } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';

interface MastermindGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const COLORS = [
    { id: 0, bg: 'bg-red-500', glow: 'shadow-[0_0_15px_#ef4444]', hex: '#ef4444' },
    { id: 1, bg: 'bg-green-500', glow: 'shadow-[0_0_15px_#22c55e]', hex: '#22c55e' },
    { id: 2, bg: 'bg-blue-500', glow: 'shadow-[0_0_15px_#3b82f6]', hex: '#3b82f6' },
    { id: 3, bg: 'bg-yellow-400', glow: 'shadow-[0_0_15px_#facc15]', hex: '#facc15' },
    { id: 4, bg: 'bg-cyan-400', glow: 'shadow-[0_0_15px_#22d3ee]', hex: '#22d3ee' },
    { id: 5, bg: 'bg-purple-500', glow: 'shadow-[0_0_15px_#a855f7]', hex: '#a855f7' }
];

const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;

export const MastermindGame: React.FC<MastermindGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { username, currentAvatarId } = useCurrency();
    const [secretCode, setSecretCode] = useState<number[]>([]);
    const [guesses, setGuesses] = useState<(number[] | null)[]>(Array(MAX_ATTEMPTS).fill(null));
    const [feedback, setFeedback] = useState<{ exact: number; partial: number }[]>([]);
    const [currentGuess, setCurrentGuess] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'creating' | 'waiting'>('playing');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [activeRow, setActiveRow] = useState(0);
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [phase, setPhase] = useState<'MENU' | 'GAME'>('MENU');
    const [showTutorial, setShowTutorial] = useState(false);
    
    const { playMove, playLand, playVictory, playGameOver, resumeAudio, playPaddleHit } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.mastermind || 0;

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_mastermind_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_mastermind_tutorial_seen', 'true');
        }
    }, []);

    const generateFeedback = (guess: number[], secret: number[]) => {
        let exact = 0;
        let partial = 0;
        const secretCopy = [...secret];
        const guessCopy = [...guess];

        // First pass: exact matches
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guessCopy[i] === secretCopy[i]) {
                exact++;
                secretCopy[i] = -1;
                guessCopy[i] = -2;
            }
        }

        // Second pass: partial matches
        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guessCopy[i] === -2) continue;
            const index = secretCopy.indexOf(guessCopy[i]);
            if (index !== -1) {
                partial++;
                secretCopy[index] = -1;
            }
        }

        return { exact, partial };
    };

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE') => {
        const targetMode = modeOverride || gameMode;
        setGuesses(Array(MAX_ATTEMPTS).fill(null));
        setFeedback([]);
        setCurrentGuess([]);
        setActiveRow(0);
        setEarnedCoins(0);
        
        if (targetMode === 'SOLO') {
            const newCode = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
            setSecretCode(newCode);
            setGameState('playing');
            playLand();
        } else {
            setGameState(mp.isHost ? 'creating' : 'waiting');
        }
        if (onReportProgress) onReportProgress('play', 1);
    };

    const handleInput = (colorIndex: number) => {
        if (gameState !== 'playing' || currentGuess.length >= CODE_LENGTH) return;
        playMove();
        setCurrentGuess(prev => [...prev, colorIndex]);
    };

    const removeLast = () => {
        if (currentGuess.length === 0) return;
        playPaddleHit();
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    const submitGuess = () => {
        if (currentGuess.length < CODE_LENGTH || gameState !== 'playing') return;

        const result = generateFeedback(currentGuess, secretCode);
        const newGuesses = [...guesses];
        newGuesses[activeRow] = currentGuess;
        setGuesses(newGuesses);
        setFeedback(prev => [...prev, result]);

        if (result.exact === CODE_LENGTH) {
            setGameState('won');
            playVictory();
            const bonus = (MAX_ATTEMPTS - activeRow) * 15;
            addCoins(bonus);
            setEarnedCoins(bonus);
            updateHighScore('mastermind', activeRow + 1);
            if (onReportProgress) onReportProgress('win', 1);
        } else if (activeRow >= MAX_ATTEMPTS - 1) {
            setGameState('lost');
            playGameOver();
        } else {
            playLand();
            setActiveRow(prev => prev + 1);
            setCurrentGuess([]);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    };

    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <BrainCircuit size={80} className="text-cyan-400 mb-6 animate-pulse drop-shadow-[0_0_15px_#22d3ee]" />
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22d3ee]">NEON CODE</h1>
                <p className="text-gray-400 text-sm mb-12 tracking-widest uppercase">Décryptez la séquence</p>
                
                <div className="flex flex-col gap-4 w-full max-w-[260px]">
                    <button 
                        onClick={() => { setGameMode('SOLO'); setPhase('GAME'); startNewGame('SOLO'); }} 
                        className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                    >
                        <User size={24} className="text-neon-blue"/> 1 JOUEUR
                    </button>
                    <button 
                        onClick={() => { setGameMode('ONLINE'); setPhase('GAME'); }} 
                        className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                    >
                        <Globe size={24} className="text-green-500"/> EN LIGNE
                    </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline tracking-widest uppercase">Retour au menu</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="mastermind" onClose={() => setShowTutorial(false)} />}

            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
                <button onClick={() => setPhase('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-black italic text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]">NEON CODE</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => startNewGame()} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-md flex flex-col gap-4 min-h-0 z-10 py-2">
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-2 px-2 pb-4">
                    {guesses.map((guess, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${idx === activeRow ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'bg-black/40 border-white/5 opacity-80'}`}>
                            <div className="flex gap-3">
                                <div className="text-[10px] font-mono text-gray-600 w-4 flex items-center">{idx + 1}</div>
                                <div className="flex gap-2">
                                    {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                                        const colorIdx = idx === activeRow ? currentGuess[i] : guess?.[i];
                                        const color = colorIdx !== undefined ? COLORS[colorIdx] : null;
                                        return (
                                            <div key={i} className={`w-8 h-8 rounded-full border-2 transition-all ${color ? `${color.bg} ${color.glow} border-white/40` : 'bg-gray-900 border-white/10'}`}>
                                                {idx === activeRow && i === currentGuess.length && <div className="w-full h-full rounded-full animate-pulse bg-white/20" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 bg-black/40 p-1.5 rounded-lg border border-white/5">
                                {feedback[idx] ? (
                                    <>
                                        {Array.from({ length: feedback[idx].exact }).map((_, i) => <div key={`e-${i}`} className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]" />)}
                                        {Array.from({ length: feedback[idx].partial }).map((_, i) => <div key={`p-${i}`} className="w-2 h-2 rounded-full bg-white shadow-[0_0_5px_white]" />)}
                                        {Array.from({ length: CODE_LENGTH - (feedback[idx].exact + feedback[idx].partial) }).map((_, i) => <div key={`v-${i}`} className="w-2 h-2 rounded-full bg-gray-800" />)}
                                    </>
                                ) : (
                                    Array.from({ length: CODE_LENGTH }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-gray-800" />)
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900/90 backdrop-blur-xl border-t-2 border-white/10 p-6 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col gap-6 shrink-0">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Essais restants</span><span className="text-xl font-mono font-bold text-white">{MAX_ATTEMPTS - activeRow}</span></div>
                        <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Meilleur</span><span className="text-xl font-mono font-bold text-yellow-400">{bestScore === 0 ? '--' : `${bestScore} cps`}</span></div>
                    </div>
                    <div className="flex justify-between gap-2">
                        {COLORS.map((color, i) => (
                            <button
                                key={i}
                                onClick={() => handleInput(i)}
                                disabled={gameState !== 'playing' || currentGuess.length >= CODE_LENGTH}
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${color.bg} ${color.glow} border-2 border-white/20 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={removeLast} disabled={gameState !== 'playing' || currentGuess.length === 0} className="flex-1 py-4 bg-gray-800 border border-white/10 rounded-2xl font-black text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"><Delete size={20}/> RETOUR</button>
                        <button onClick={submitGuess} disabled={gameState !== 'playing' || currentGuess.length < CODE_LENGTH} className="flex-[2] py-4 bg-cyan-600 text-white rounded-2xl font-black italic tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:shadow-none"><Check size={24} strokeWidth={3}/> VALIDER</button>
                    </div>
                </div>
            </div>

            {(gameState === 'won' || gameState === 'lost') && (
                <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in fade-in">
                    {gameState === 'won' ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
                            <h2 className="text-5xl font-black italic text-white mb-2">DÉCRYPTÉ !</h2>
                            <p className="text-cyan-400 font-bold mb-6 tracking-widest">EN {activeRow + 1} TENTATIVES</p>
                        </>
                    ) : (
                        <>
                            <X size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                            <h2 className="text-5xl font-black italic text-white mb-2">ÉCHEC</h2>
                            <p className="text-gray-400 font-bold mb-6 tracking-widest uppercase">SÉCURITÉ MAXIMALE</p>
                        </>
                    )}
                    <div className="flex flex-col items-center gap-2 mb-8 bg-white/5 p-4 rounded-3xl border border-white/10">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Code Secret</span>
                        <div className="flex gap-3">
                            {secretCode.map((c, i) => (
                                <div key={i} className={`w-10 h-10 rounded-xl ${COLORS[c].bg} ${COLORS[c].glow} border-2 border-white/30`} />
                            ))}
                        </div>
                    </div>
                    {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => startNewGame()} className="flex-1 py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl"><RefreshCw size={20}/> REJOUER</button>
                    </div>
                </div>
            )}
        </div>
    );
};
