
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

// --- CONSTANTS ---
const COLORS = [
    'bg-red-500 shadow-[0_0_10px_#ef4444]',      // 0
    'bg-green-500 shadow-[0_0_10px_#22c55e]',    // 1
    'bg-blue-500 shadow-[0_0_10px_#3b82f6]',     // 2
    'bg-yellow-400 shadow-[0_0_10px_#facc15]',   // 3
    'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',     // 4
    'bg-purple-500 shadow-[0_0_10px_#a855f7]',   // 5
];

const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

export const MastermindGame: React.FC<MastermindGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    // Identity
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

    // Game State
    const [secretCode, setSecretCode] = useState<number[]>([]);
    const [guesses, setGuesses] = useState<number[][]>([]);
    const [feedback, setFeedback] = useState<{ exact: number; partial: number }[]>([]);
    const [currentGuess, setCurrentGuess] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'creating' | 'waiting'>('waiting');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [activeRow, setActiveRow] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Online State
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [phase, setPhase] = useState<'MENU' | 'GAME'>('MENU');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isCodemaker, setIsCodemaker] = useState(false); // New: Tracks who created the code
    const [makerBuffer, setMakerBuffer] = useState<number[]>([]); // For code creation UI
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    // Chat
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const bestScore = highScores.mastermind || 0; 

    // Refs
    const handleDataRef = useRef<(data: any) => void>(null);

    // --- SETUP & EFFECTS ---

    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_mastermind_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_mastermind_tutorial_seen', 'true');
        }
    }, []);

    // Connect/Disconnect based on mode
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame();
            setOpponentLeft(false);
        }
    }, [gameMode]);

    // Handle Lobby/Game transition
    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            // If returning to lobby from game
            if (phase === 'GAME' && guesses.some(g => g !== null)) {
                resetLocalGame();
                setPhase('MENU');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase === 'MENU') {
                initGame('ONLINE'); // Auto-start game logic if matched while in menu
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase]);

    // --- GAME LOGIC ---

    const resetLocalGame = () => {
        setSecretCode([]);
        setGuesses(Array(MAX_ATTEMPTS).fill(null));
        setFeedback(Array(MAX_ATTEMPTS).fill(null));
        setCurrentGuess([]);
        setActiveRow(0);
        setGameState('waiting'); // Changed from 'playing' to ensure no interaction before code is set
        setEarnedCoins(0);
        setResultMessage(null);
        setOpponentLeft(false);
        setChatHistory([]);
        setMakerBuffer([]);
        setIsCodemaker(false);
    };

    const startNewGame = (modeOverride?: 'SOLO' | 'ONLINE') => {
        if (showTutorial) return;
        const targetMode = modeOverride || gameMode;
        resetLocalGame();
        resumeAudio();

        if (targetMode === 'SOLO') {
            const newCode = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
            setSecretCode(newCode);
            setGameState('playing'); // Explicitly set playing after code gen
            playLand();
            if (onReportProgress) onReportProgress('play', 1);
        } else {
            // Online: Asymmetric Roles
            if (mp.isHost) {
                // Host is CodeMaker
                setIsCodemaker(true);
                setGameState('creating');
            } else {
                // Guest is CodeBreaker
                setIsCodemaker(false);
                setGameState('waiting');
            }
        }
    };

    const initGame = (mode: 'SOLO' | 'ONLINE') => {
        setGameMode(mode);
        setPhase('GAME');
        if (mode === 'SOLO') startNewGame('SOLO'); // Force passing mode
        else if (mode === 'ONLINE' && mp.mode === 'in_game') startNewGame('ONLINE');
    };

    // --- CODE CREATION LOGIC (HOST) ---
    const handleMakerColorSelect = (colorIndex: number) => {
        if (makerBuffer.length < CODE_LENGTH) {
            playMove();
            setMakerBuffer(prev => [...prev, colorIndex]);
        }
    };

    const handleMakerDelete = () => {
        if (makerBuffer.length > 0) {
            playPaddleHit();
            setMakerBuffer(prev => prev.slice(0, -1));
        }
    };

    const handleMakerSubmit = () => {
        if (makerBuffer.length === CODE_LENGTH) {
            setSecretCode(makerBuffer);
            setGameState('playing'); // Host enters playing mode but as spectator
            playVictory(); // Sound to confirm code set
            mp.sendData({ type: 'MASTERMIND_SET_CODE', code: makerBuffer });
        }
    };

    // --- GAMEPLAY INPUTS ---
    const handleColorClick = (colorIndex: number) => {
        if (showTutorial) return;
        // Can only play if: Playing state, not full row, AND not Codemaker (Codemaker just watches)
        if (gameState !== 'playing' || currentGuess.length >= CODE_LENGTH || isCodemaker) return;
        playMove();
        setCurrentGuess(prev => [...prev, colorIndex]);
    };

    const handleDelete = () => {
        if (showTutorial) return;
        if (gameState !== 'playing' || currentGuess.length === 0 || isCodemaker) return;
        playPaddleHit();
        setCurrentGuess(prev => prev.slice(0, -1));
    };

    const calculateFeedback = (guess: number[], secret: number[]) => {
        let exact = 0;
        let partial = 0;
        const secretCopy = [...secret];
        const guessCopy = [...guess];

        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guess[i] === secret[i]) {
                exact++;
                secretCopy[i] = -1; 
                guessCopy[i] = -2;
            }
        }

        for (let i = 0; i < CODE_LENGTH; i++) {
            if (guessCopy[i] !== -2) {
                const foundIndex = secretCopy.indexOf(guessCopy[i]);
                if (foundIndex !== -1) {
                    partial++;
                    secretCopy[foundIndex] = -1;
                }
            }
        }
        return { exact, partial };
    };

    const handleSubmit = () => {
        if (showTutorial) return;
        // Add safety check for empty secret code
        if (gameState !== 'playing' || currentGuess.length !== CODE_LENGTH || isCodemaker || secretCode.length !== CODE_LENGTH) return;

        const currentFeedback = calculateFeedback(currentGuess, secretCode);
        
        // Update Local State
        const newGuesses = [...guesses];
        newGuesses[activeRow] = currentGuess;
        setGuesses(newGuesses);

        const newFeedback = [...feedback];
        newFeedback[activeRow] = currentFeedback;
        setFeedback(newFeedback);

        const nextRow = activeRow + 1;

        if (gameMode === 'ONLINE') {
            // Sync move to Codemaker
            mp.sendData({ 
                type: 'MASTERMIND_GUESS_SYNC', 
                rowIdx: activeRow, 
                guess: currentGuess, 
                fb: currentFeedback 
            });
        }

        if (currentFeedback.exact === CODE_LENGTH) {
            handleWin(nextRow);
        } else if (nextRow >= MAX_ATTEMPTS) {
            handleLoss();
        } else {
            playLand();
            setActiveRow(nextRow);
            setCurrentGuess([]);
        }
    };

    const handleWin = (attempts: number) => {
        // Called when Codebreaker finds the code
        // If Solo: You Win.
        // If Online Breaker: You Win.
        // If Online Maker: You Lose (Breaker found it).
        
        let coins = 0;
        if (gameMode === 'SOLO') {
            setGameState('won');
            playVictory();
            const scoreBase = (MAX_ATTEMPTS - attempts + 1) * 10;
            coins = Math.floor(scoreBase / 2) + 10;
            if (bestScore === 0 || attempts < bestScore) {
                updateHighScore('mastermind', attempts);
            }
            setResultMessage("CODE DÉCRYPTÉ !");
            if (onReportProgress) onReportProgress('win', 1);
        } else {
            // Online Logic
            if (isCodemaker) {
                // I am Maker, Breaker won -> I lose
                setGameState('lost'); // Maker "lost" because code was found
                setResultMessage("IL A TROUVÉ VOTRE CODE !");
                playGameOver();
            } else {
                // I am Breaker, I won
                setGameState('won');
                setResultMessage("CODE DÉCRYPTÉ ! VICTOIRE !");
                playVictory();
                coins = 50;
                mp.sendData({ type: 'MASTERMIND_GAME_OVER', result: 'BREAKER_WON' });
                if (onReportProgress) onReportProgress('win', 1);
            }
        }
        
        if (coins > 0) {
            addCoins(coins);
            setEarnedCoins(coins);
        }
    };

    const handleLoss = () => {
        // Called when Codebreaker runs out of turns
        // If Solo: You Lose.
        // If Online Breaker: You Lose.
        // If Online Maker: You Win (Code was kept safe).

        if (gameMode === 'SOLO') {
            setGameState('lost');
            playGameOver();
            setResultMessage("ÉCHEC... CODE NON TROUVÉ.");
        } else {
            if (isCodemaker) {
                // I am Maker, Breaker lost -> I win
                setGameState('won');
                setResultMessage("VOTRE CODE EST RESTÉ SECRET !");
                playVictory();
                const coins = 50;
                addCoins(coins);
                setEarnedCoins(coins);
                if (onReportProgress) onReportProgress('win', 1);
            } else {
                // I am Breaker, I lost
                setGameState('lost');
                setResultMessage("ÉCHEC... PLUS D'ESSAIS.");
                playGameOver();
                mp.sendData({ type: 'MASTERMIND_GAME_OVER', result: 'BREAKER_LOST' });
            }
        }
    };

    // --- MULTIPLAYER DATA HANDLER ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            // Received by Guest (Breaker)
            if (data.type === 'MASTERMIND_SET_CODE') {
                setSecretCode(data.code);
                setGameState('playing'); // Breaker starts playing
                playLand();
            }
            // Received by Host (Maker)
            if (data.type === 'MASTERMIND_GUESS_SYNC') {
                const { rowIdx, guess, fb } = data;
                
                const newGuesses = [...guesses];
                newGuesses[rowIdx] = guess;
                setGuesses(newGuesses);

                const newFeedback = [...feedback];
                newFeedback[rowIdx] = fb;
                setFeedback(newFeedback);
                
                setActiveRow(rowIdx + 1);
                playLand();
            }
            // Sync Game Over state
            if (data.type === 'MASTERMIND_GAME_OVER') {
                if (data.result === 'BREAKER_WON') {
                    // Breaker sent win, I am Maker, I lose
                    handleWin(0); // Function handles role logic
                }
                if (data.result === 'BREAKER_LOST') {
                    // Breaker sent loss, I am Maker, I win
                    handleLoss();
                }
            }

            if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setGameState('won'); setResultMessage("ADVERSAIRE PARTI."); }
            if (data.type === 'REMATCH_START') startNewGame();
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp]);

    // --- CHAT & SOCIAL ---
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

    const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
    };

    // --- NAVIGATION ---
    const handleLocalBack = () => {
        if (phase === 'GAME') {
            if (gameMode === 'ONLINE') mp.leaveGame();
            setPhase('MENU');
        } else {
            onBack();
        }
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-cyan-300 tracking-wider drop-shadow-md">LOBBY MASTERMIND</h3>
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

    // --- MENU VIEW ---
    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22d3ee]">NEON MIND</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => initGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
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

    if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 pr-2 pb-1">NEON MIND</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="mastermind" onClose={() => setShowTutorial(false)} />}

            {activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                if (!reaction) return null;
                const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
            })()}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] pr-2 pb-1">NEON MIND</h1>
                    {gameMode === 'ONLINE' && (
                        <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${isCodemaker ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400'}`}>
                            {isCodemaker ? 'CRÉATEUR' : 'DÉCODEUR'}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else startNewGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* CREATION PHASE (Host) */}
            {gameState === 'creating' && (
                <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center z-20">
                    <h2 className="text-2xl font-black text-white mb-8 animate-pulse text-center">CRÉEZ LE CODE SECRET</h2>
                    <div className="flex gap-4 mb-10">
                        {[...Array(CODE_LENGTH)].map((_, i) => (
                            <div key={i} className={`w-14 h-14 rounded-full border-2 ${i < makerBuffer.length ? COLORS[makerBuffer[i]] + ' border-white' : 'bg-gray-800 border-white/20'} transition-all shadow-xl`}></div>
                        ))}
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                        {COLORS.map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleMakerColorSelect(idx)}
                                className={`w-12 h-12 rounded-full ${color} border-2 border-white/20 active:scale-90 transition-transform shadow-lg hover:scale-110`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-4 w-full px-8">
                        <button onClick={handleMakerDelete} className="flex-1 py-3 bg-gray-800 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-900/20 active:scale-95 transition-all"><Delete size={20} className="mx-auto"/></button>
                        <button 
                            onClick={handleMakerSubmit} 
                            disabled={makerBuffer.length !== CODE_LENGTH}
                            className={`flex-[3] py-3 rounded-xl font-black tracking-widest text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${makerBuffer.length === CODE_LENGTH ? 'bg-green-500 text-black hover:bg-white hover:scale-105 shadow-[0_0_15px_#22c55e]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                        >
                            ENVOYER <Send size={20}/>
                        </button>
                    </div>
                </div>
            )}

            {/* WAITING PHASE (Guest) */}
            {gameState === 'waiting' && (
                <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center z-20 text-center p-6">
                    <Lock size={64} className="text-purple-500 mb-6 animate-bounce drop-shadow-[0_0_15px_#a855f7]" />
                    <h2 className="text-xl font-bold text-white mb-2">CODE VERROUILLÉ</h2>
                    <div className="flex items-center gap-2 text-purple-300 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm font-bold tracking-widest">L'HÔTE PRÉPARE LE CODE...</span>
                    </div>
                </div>
            )}

            {/* WAITING FOR OPPONENT FOR HOST (Before Connect) */}
            {gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && onlineStep === 'game' && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* PLAYING PHASE (Board) */}
            {(gameState === 'playing' || gameState === 'won' || gameState === 'lost') && (
                <>
                    {/* Stats */}
                    <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">ESSAIS</span><span className="text-xl font-mono font-bold text-white">{activeRow + 1}/{MAX_ATTEMPTS}</span></div>
                        <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{bestScore > 0 ? `${bestScore} cps` : '-'}</span></div>
                    </div>

                    {/* Codemaker View (Secret shown) */}
                    {isCodemaker && (
                        <div className="w-full max-w-md mb-2 bg-purple-900/30 border border-purple-500/50 rounded-lg p-2 flex flex-col items-center">
                            <span className="text-[10px] text-purple-300 font-bold tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> CODE SECRET (SPECTATEUR)</span>
                            <div className="flex gap-2">
                                {secretCode.map((c, i) => (
                                    <div key={i} className={`w-6 h-6 rounded-full ${COLORS[c]} border border-white/30`} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Board */}
                    <div className="flex-1 w-full max-w-md bg-gray-900/80 border-2 border-cyan-500/30 rounded-xl shadow-2xl relative overflow-y-auto custom-scrollbar p-2 mb-2 backdrop-blur-md z-10">
                        
                        {/* Result Overlay */}
                        {(gameState !== 'playing') && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in text-center p-4">
                                {gameState === 'won' ? (
                                    <>
                                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_gold]" />
                                        <h2 className="text-4xl font-black italic text-white mb-2">{resultMessage || "CODE DÉCRYPTÉ !"}</h2>
                                        {earnedCoins > 0 && (
                                            <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse mb-6">
                                                <Coins className="text-yellow-400" size={24} />
                                                <span className="text-yellow-100 font-bold text-xl">+{earnedCoins}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {isCodemaker ? (
                                            <Unlock size={64} className="text-green-500 mb-4 drop-shadow-[0_0_15px_lime]" />
                                        ) : (
                                            <BrainCircuit size={64} className="text-red-500 mb-4 drop-shadow-[0_0_15px_red]" />
                                        )}
                                        <h2 className="text-3xl font-black italic text-white mb-2">{resultMessage || "PARTIE TERMINÉE"}</h2>
                                        
                                        {/* Always show code if available and not the one who set it (or even if set it, just to be sure in lost state for solo) */}
                                        {secretCode.length > 0 && !isCodemaker && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                                                <span className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-2">Le Code Secret</span>
                                                <div className="flex gap-3">
                                                    {secretCode.map((c, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`w-10 h-10 rounded-full ${COLORS[c]} border-2 border-white/30 shadow-lg`}
                                                            style={{ animationDelay: `${i * 100}ms` }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex gap-4">
                                    <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : startNewGame} className="px-8 py-3 bg-cyan-500 text-black font-black tracking-widest rounded-full hover:bg-white transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                                        <RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}
                                    </button>
                                    {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                                </div>
                            </div>
                        )}

                        {/* Rows */}
                        <div className="flex flex-col gap-1.5 min-h-full justify-end">
                            {[...Array(MAX_ATTEMPTS)].map((_, i) => {
                                const rowIndex = MAX_ATTEMPTS - 1 - i; 
                                const isCurrent = rowIndex === activeRow;
                                const rowData = guesses[rowIndex];
                                const fb = feedback[rowIndex];
                                const isPlayed = !!rowData;

                                return (
                                    <div key={rowIndex} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCurrent ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]' : 'bg-black/40 border-white/5'}`}>
                                        <span className={`text-xs font-mono font-bold w-6 text-center ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{rowIndex + 1}</span>
                                        <div className="flex-1 flex justify-center gap-2 sm:gap-4">
                                            {[...Array(CODE_LENGTH)].map((_, slotIdx) => {
                                                let colorClass = 'bg-black/50 border border-white/10';
                                                if (isCurrent && !isCodemaker) {
                                                    if (slotIdx < currentGuess.length) colorClass = COLORS[currentGuess[slotIdx]];
                                                    else if (slotIdx === currentGuess.length) colorClass += ' ring-1 ring-white/50 animate-pulse';
                                                } else if (isPlayed) {
                                                    colorClass = COLORS[rowData[slotIdx]];
                                                }
                                                return <div key={slotIdx} className={`w-8 h-8 rounded-full shadow-inner ${colorClass} transition-all duration-200`}></div>;
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 w-8">
                                            {isPlayed ? (
                                                <>
                                                    {[...Array(fb.exact)].map((_, fi) => <div key={`e${fi}`} className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>)}
                                                    {[...Array(fb.partial)].map((_, fi) => <div key={`p${fi}`} className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white]"></div>)}
                                                    {[...Array(Math.max(0, 4 - fb.exact - fb.partial))].map((_, fi) => <div key={`n${fi}`} className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>)}
                                                </>
                                            ) : (
                                                [...Array(4)].map((_, fi) => <div key={fi} className="w-2.5 h-2.5 rounded-full bg-gray-800/50"></div>)
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls (Only for Codebreaker) */}
                    {!isCodemaker && (
                        <div className="w-full max-w-md z-20 flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-gray-900/90 p-2 rounded-xl border border-white/10">
                                {COLORS.map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleColorClick(idx)}
                                        disabled={gameState !== 'playing' || currentGuess.length >= CODE_LENGTH}
                                        className={`w-10 h-10 rounded-full ${color} border-2 border-white/20 active:scale-90 transition-transform shadow-lg ${gameState !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                                    />
                                ))}
                            </div>
                            
                            <div className="flex gap-2 h-12">
                                <button 
                                    onClick={handleDelete}
                                    disabled={currentGuess.length === 0 || gameState !== 'playing'}
                                    className="flex-[1] bg-gray-800 text-red-400 rounded-xl flex items-center justify-center border border-white/10 active:bg-gray-700 disabled:opacity-50 transition-colors"
                                >
                                    <Delete size={24} />
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={currentGuess.length !== CODE_LENGTH || gameState !== 'playing'}
                                    className="flex-[3] bg-green-600 text-white font-black tracking-widest text-lg rounded-xl flex items-center justify-center border-b-4 border-green-800 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                >
                                    VALIDER <Check size={20} className="ml-2" strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Online Chat */}
            {gameMode === 'ONLINE' && mp.gameOpponent && (
                <div className="w-full max-w-lg z-30 px-2 pb-4 mt-2">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <form onSubmit={sendChat} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            )}
        </div>
    );
};
