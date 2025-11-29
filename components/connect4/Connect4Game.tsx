
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, Trophy, Play, CircleDot, Coins, Globe, Loader2, Users, Hand, Smile, Frown, ThumbsUp, Heart, Zap, MessageSquare, Send, Flame } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
}

const ROWS = 6;
const COLS = 7;

// Réactions Néon
const REACTIONS = [
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500' },
    { id: 'angry', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500' }, // Colère ajoutée
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500' },
    { id: 'shock', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500' },
];

// Types pour le Chat
interface ChatMessage {
    id: number;
    text: string;
    isMe: boolean;
    timestamp: number;
}

// Helpers
const createBoard = (): BoardState => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinFull = (board: BoardState): WinState => {
  // We reuse logic but return lines for display
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
      }
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
      }
    }
  }
  // Diagonals
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r-1][c+1] && board[r][c] === board[r-2][c+2] && board[r][c] === board[r-3][c+3]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]] };
      }
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
      }
    }
  }
  
  // Draw
  if (board.every(row => row.every(cell => cell !== 0))) {
    return { winner: 'DRAW', line: [] };
  }

  return { winner: null, line: [] };
};


export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins }) => {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Multiplayer Hook
  const mp = useMultiplayer();
  const [remoteCodeInput, setRemoteCodeInput] = useState('');
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  
  // Identity
  const { username } = useCurrency();
  
  // Interaction State
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio
  const { playMove, playGameOver, playVictory } = audio;

  // Auto-scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Reset Game
  const resetGame = useCallback((sendSync = false) => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinState({ winner: null, line: [] });
    setIsAiThinking(false);
    setEarnedCoins(0);
    setActiveReaction(null);
    setChatHistory([]); // Clear chat on new game? Maybe optional.

    if (sendSync && mp.isConnected) {
        mp.sendData({ type: 'RESET' });
    }
  }, [mp]);

  // Handle Mode Change
  const cycleMode = () => {
    if (gameMode === 'PVE') setGameMode('PVP');
    else if (gameMode === 'PVP') {
        setGameMode('ONLINE');
        mp.initializePeer();
        setIsLobbyOpen(true);
    }
    else {
        setGameMode('PVE');
        mp.disconnect();
        setIsLobbyOpen(false);
    }
    resetGame();
  };

  // Handle Difficulty Change
  const cycleDifficulty = () => {
    const diffs: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
    setDifficulty(diffs[nextIdx]);
    if (gameMode === 'PVE') resetGame();
  };

  // Drop Piece Logic
  const handleColumnClick = useCallback((colIndex: number, isAi = false, isRemote = false) => {
    // Basic checks
    if (winState.winner) return;
    
    // AI Check
    if (gameMode === 'PVE' && !isAi && isAiThinking) return;

    // Multiplayer Checks
    if (gameMode === 'ONLINE') {
        if (!mp.isConnected) return;
        
        // If I am the host (Player 1) and it's not my turn
        if (mp.isHost && currentPlayer !== 1 && !isRemote) return;
        
        // If I am the guest (Player 2) and it's not my turn
        if (!mp.isHost && currentPlayer !== 2 && !isRemote) return;
    }
    
    // Find lowest empty row
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIndex] === 0) {
        rowIndex = r;
        break;
      }
    }

    if (rowIndex === -1) return; // Column full

    // Execute Move
    const newBoard = board.map(row => [...row]);
    newBoard[rowIndex][colIndex] = currentPlayer;
    setBoard(newBoard);
    playMove(); // Trigger sound

    // Send Move to Peer if Online and Local Action
    if (gameMode === 'ONLINE' && !isRemote) {
        mp.sendData({ type: 'MOVE', col: colIndex });
    }

    // Check Win
    const result = checkWinFull(newBoard);
    if (result.winner) {
      setWinState(result);
      
      const isMyWin = (gameMode === 'ONLINE' && ((mp.isHost && result.winner === 1) || (!mp.isHost && result.winner === 2))) ||
                      (gameMode === 'PVP' && (result.winner === 1 || result.winner === 2)) ||
                      (gameMode === 'PVE' && result.winner === 1);

      if (isMyWin) {
          playVictory();
          // STRICT RULE: Coins are ONLY for PVE (Single Player vs AI)
          if (gameMode === 'PVE') { 
             addCoins(30);
             setEarnedCoins(30);
          } else {
             setEarnedCoins(0);
          }
      } else {
          playGameOver();
      }
    } else {
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    }

  }, [board, currentPlayer, winState.winner, isAiThinking, playMove, playGameOver, playVictory, gameMode, addCoins, mp]);

  // Send Reaction
  const sendReaction = useCallback((reactionId: string) => {
      if (gameMode === 'ONLINE' && mp.isConnected) {
          setActiveReaction({ id: reactionId, isMe: true });
          mp.sendData({ type: 'REACTION', id: reactionId });
          setTimeout(() => setActiveReaction(null), 3000);
      }
  }, [gameMode, mp.isConnected, mp]);

  // Send Chat
  const sendChat = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || !mp.isConnected) return;
      
      const msg: ChatMessage = {
          id: Date.now(),
          text: chatInput.trim(),
          isMe: true,
          timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, msg]);
      mp.sendData({ type: 'CHAT', text: msg.text });
      setChatInput('');
  };

  // Exchange Names on connection
  useEffect(() => {
      if (gameMode === 'ONLINE' && mp.isConnected) {
          mp.sendData({ type: 'NAME', name: username });
      }
  }, [gameMode, mp.isConnected, username]);

  // Multiplayer Data Handling
  useEffect(() => {
    if (gameMode === 'ONLINE') {
        mp.setOnDataReceived((data) => {
            if (data.type === 'MOVE') {
                handleColumnClick(data.col, false, true);
            }
            if (data.type === 'RESET') {
                resetGame(false);
            }
            if (data.type === 'REACTION') {
                setActiveReaction({ id: data.id, isMe: false });
                setTimeout(() => setActiveReaction(null), 3000);
            }
            if (data.type === 'CHAT') {
                const msg: ChatMessage = {
                    id: Date.now(),
                    text: data.text,
                    isMe: false,
                    timestamp: Date.now()
                };
                setChatHistory(prev => [...prev, msg]);
            }
        });
    }
  }, [gameMode, mp.isConnected, handleColumnClick, resetGame, mp]);


  // AI Turn Handling
  useEffect(() => {
    if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAiThinking) {
      setIsAiThinking(true);
    }
  }, [gameMode, currentPlayer, winState.winner, isAiThinking]);

  useEffect(() => {
    if (!isAiThinking) return;
    const timer = setTimeout(() => {
        try {
            const bestCol = getBestMove(board, difficulty);
            if (bestCol !== -1) {
              handleColumnClick(bestCol, true);
            }
        } catch (error) {
            console.error("AI Error", error);
        }
        setIsAiThinking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isAiThinking, board, difficulty, handleColumnClick]);

  // Numpad input handler
  const handleNumpad = (digit: string) => {
      if (digit === 'DEL') {
          setRemoteCodeInput(prev => prev.slice(0, -1));
      } else if (remoteCodeInput.length < 4) {
          setRemoteCodeInput(prev => prev + digit);
      }
  };


  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
       {/* Ambient Light Reflection */}
       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-transparent pointer-events-none"></div>

       {/* Header */}
       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
         <button onClick={() => { mp.disconnect(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <ArrowLeft size={20} />
         </button>
         <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)]">
             NEON CONNECT
         </h1>
         <button onClick={() => resetGame(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <RefreshCw size={20} />
         </button>
       </div>

       {/* Game Controls / Status */}
       <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button 
                onClick={cycleMode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[110px]"
            >
                {gameMode === 'PVE' && <Cpu size={14} className="text-neon-blue"/>}
                {gameMode === 'PVP' && <User size={14} className="text-neon-pink"/>}
                {gameMode === 'ONLINE' && <Globe size={14} className="text-green-400"/>}
                
                {gameMode === 'PVE' && 'VS ORDI'}
                {gameMode === 'PVP' && 'VS JOUEUR'}
                {gameMode === 'ONLINE' && 'EN LIGNE'}
            </button>
          </div>

          {gameMode === 'PVE' ? (
              <button 
                onClick={cycleDifficulty}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[80px] justify-center"
              >
                {difficulty === 'EASY' && <span className="text-green-400">FACILE</span>}
                {difficulty === 'MEDIUM' && <span className="text-yellow-400">MOYEN</span>}
                {difficulty === 'HARD' && <span className="text-red-500">DIFFICILE</span>}
              </button>
          ) : gameMode === 'ONLINE' ? (
              <button 
                onClick={() => setIsLobbyOpen(true)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${mp.isConnected ? 'bg-green-900/30 border-green-500 text-green-400 animate-pulse' : 'bg-red-900/30 border-red-500 text-red-400'}`}
              >
                  {mp.isConnected ? 'SALON CONNECTÉ' : 'SALON DÉCONNECTÉ'}
              </button>
          ) : <div className="w-[80px]"></div>}
       </div>

       {/* ONLINE LOBBY OVERLAY (REFINED) */}
       {gameMode === 'ONLINE' && isLobbyOpen && (
           <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md overflow-y-auto touch-pan-y flex flex-col items-center pt-8 pb-20 animate-in fade-in duration-300">
               <h2 className="text-3xl font-black italic text-white mb-6 text-center">SALON MULTIJOUEUR</h2>
               
               {/* STATUS INDICATOR (DOT) */}
               <div className="flex flex-col items-center mb-8 gap-4">
                   <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${mp.isConnected ? 'bg-green-500 shadow-[0_0_50px_#22c55e]' : 'bg-red-500 shadow-[0_0_50px_#ef4444]'}`}>
                        <div className={`absolute inset-0 rounded-full border-4 border-white/20 ${mp.isConnected ? 'animate-ping' : ''}`}></div>
                        {mp.isConnected ? <Users size={40} className="text-white" /> : <Loader2 size={40} className="text-white animate-spin" />}
                   </div>
                   
                   <div className="text-center">
                        <h3 className={`text-xl font-bold ${mp.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {mp.isConnected ? 'CONNEXION ÉTABLIE' : 'EN ATTENTE...'}
                        </h3>
                        {mp.isConnected ? (
                            <p className="text-white mt-1">
                                Adversaire : <span className="font-mono text-neon-pink font-bold">{mp.opponentName || 'Inconnu'}</span>
                            </p>
                        ) : (
                            <p className="text-gray-400 mt-1 text-sm">Le point passera au vert quand un joueur rejoindra.</p>
                        )}
                   </div>
               </div>

               {/* SHOW CODES ONLY IF NOT CONNECTED (OR FOR INFO) */}
               {!mp.isConnected && (
                   <div className="w-full max-w-sm px-4 grid gap-6">
                       <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
                           <h3 className="text-neon-pink font-bold tracking-widest text-[10px] mb-2 uppercase">Votre Code (Partager)</h3>
                           {mp.isLoading ? (
                               <div className="flex items-center gap-2 text-gray-400 text-xs h-12"><Loader2 size={16} className="animate-spin" /> Connexion...</div>
                           ) : (
                               <div className="text-4xl font-mono font-bold text-neon-pink tracking-widest drop-shadow-[0_0_10px_#ff00ff]">{mp.shortId || '----'}</div>
                           )}
                       </div>

                       <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
                           <h3 className="text-neon-blue font-bold tracking-widest text-[10px] mb-3 uppercase">Rejoindre un Salon</h3>
                           <div className="flex items-center gap-2 mb-4">
                               <div className="h-12 w-32 bg-black/50 border-2 border-neon-blue rounded-lg flex items-center justify-center text-2xl font-mono font-bold text-white tracking-widest">{remoteCodeInput}<span className="animate-pulse text-neon-blue ml-1">_</span></div>
                               <button onClick={() => mp.connectToPeer(remoteCodeInput)} disabled={remoteCodeInput.length !== 4} className="h-12 px-6 bg-neon-blue text-black font-bold rounded-lg hover:bg-white disabled:opacity-50 transition-all">OK</button>
                           </div>
                           <div className="grid grid-cols-3 gap-2 w-full max-w-[200px]">
                               {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handleNumpad(n.toString())} className="h-10 bg-gray-800 rounded text-white font-bold">{n}</button>)}
                               <button onClick={() => setRemoteCodeInput('')} className="h-10 bg-gray-800 rounded text-red-400 font-bold text-xs">C</button>
                               <button onClick={() => handleNumpad('0')} className="h-10 bg-gray-800 rounded text-white font-bold">0</button>
                               <button onClick={() => handleNumpad('DEL')} className="h-10 bg-gray-800 rounded text-gray-300 font-bold text-xs">DEL</button>
                           </div>
                       </div>
                   </div>
               )}

               {/* JOIN BUTTON (Only if connected) */}
               {mp.isConnected && (
                   <button 
                        onClick={() => setIsLobbyOpen(false)}
                        className="mt-8 px-8 py-4 bg-green-500 text-black font-black text-xl rounded-full shadow-[0_0_20px_#22c55e] hover:bg-white hover:scale-105 transition-all animate-pulse"
                    >
                        REJOINDRE LE MATCH
                   </button>
               )}

               {/* CLOSE / ERROR */}
               {mp.error && <div className="mt-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-xs">{mp.error}</div>}
               
               <button onClick={() => { setGameMode('PVE'); mp.disconnect(); setIsLobbyOpen(false); }} className="mt-8 text-gray-500 text-xs underline">
                   Quitter le mode en ligne
               </button>
           </div>
       )}

       {/* Turn Indicator */}
       {!winState.winner && !isLobbyOpen && (
            <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
                currentPlayer === 1 
                    ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                    : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
            }`}>
                <CircleDot size={12} className={isAiThinking ? 'animate-spin' : ''} /> 
                {gameMode === 'ONLINE' ? (
                    mp.isConnected ? (
                        (mp.isHost && currentPlayer === 1) || (!mp.isHost && currentPlayer === 2) 
                        ? "C'EST TON TOUR !" 
                        : "L'ADVERSAIRE RÉFLÉCHIT..."
                    ) : "EN ATTENTE..."
                ) : (
                    isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR JOUEUR ${currentPlayer}`
                )}
            </div>
       )}

       {/* Game Board */}
       <div className={`relative z-10 p-2 sm:p-4 bg-black/60 rounded-2xl border-4 border-gray-800 shadow-2xl backdrop-blur-md transition-opacity duration-500 ${gameMode === 'ONLINE' && !mp.isConnected ? 'opacity-0' : 'opacity-100'}`}>
           
           {/* REACTION OVERLAY - Positioned specifically */}
           {activeReaction && (() => {
               const reaction = REACTIONS.find(r => r.id === activeReaction.id);
               if (!reaction) return null;
               const Icon = reaction.icon;
               
               // Dynamic Positioning based on who sent it
               const positionClass = activeReaction.isMe 
                    ? 'bottom-[5%] right-[-10%] sm:right-[-20%]' 
                    : 'top-[5%] left-[-10%] sm:left-[-20%]';

               return (
                   <div className={`absolute z-50 pointer-events-none animate-bounce ${positionClass}`}>
                       <div className="bg-black/80 rounded-full p-2 border border-white/20 backdrop-blur-sm">
                            <Icon size={64} className={`${reaction.color} drop-shadow-[0_0_25px_currentColor]`} />
                       </div>
                   </div>
               );
           })()}

           {/* Grid */}
           <div className="grid grid-cols-7 gap-1 sm:gap-3 relative">
               <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div key={`col-${c}`} onClick={() => handleColumnClick(c)} className={`h-full cursor-pointer hover:bg-white/5 transition-colors rounded-full ${winState.winner ? 'pointer-events-none' : ''}`}/>
                    ))}
               </div>
               {Array.from({ length: COLS }).map((_, c) => (
                   <div key={c} className="flex flex-col gap-1 sm:gap-3">
                       {Array.from({ length: ROWS }).map((_, r) => {
                           const val = board[r][c];
                           const isWinningPiece = winState.line.some(([wr, wc]) => wr === r && wc === c);
                           return (
                               <div key={`${r}-${c}`} className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 shadow-inner flex items-center justify-center border border-white/5">
                                   {val !== 0 && (
                                       <div className={`w-full h-full rounded-full animate-bounce transition-all duration-500 shadow-lg ${
                                           val === 1 
                                           ? 'bg-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.6)]' 
                                           : 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.6)]'
                                       } ${isWinningPiece ? 'animate-pulse ring-4 ring-white z-10 brightness-125' : ''}`}>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent"></div>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               ))}
           </div>
       </div>

       {/* REACTION & CHAT BAR (Only for Online/PVP) */}
       {gameMode === 'ONLINE' && mp.isConnected && !winState.winner && (
            <div className="w-full max-w-lg mt-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 z-20">
                {/* Reactions */}
                <div className="flex justify-between items-center gap-2 p-2 bg-gray-900/80 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
                    {REACTIONS.map(reaction => {
                        const Icon = reaction.icon;
                        return (
                            <button
                                key={reaction.id}
                                onClick={() => sendReaction(reaction.id)}
                                className={`p-2 rounded-xl transition-all active:scale-95 border shrink-0 ${reaction.bg} ${reaction.border} hover:scale-110 group`}
                            >
                                <Icon size={20} className={`${reaction.color} drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_10px_currentColor] transition-all`} />
                            </button>
                        );
                    })}
                </div>

                {/* Chat History Display */}
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-gray-600 text-xs italic text-center py-2">Aucun message</div>
                    )}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold max-w-[85%] break-words ${
                                msg.isMe 
                                ? 'bg-neon-pink/20 text-pink-100 border border-neon-pink/30' 
                                : 'bg-neon-blue/20 text-cyan-100 border border-neon-blue/30'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={sendChat} className="flex gap-2">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3 focus-within:border-neon-blue focus-within:ring-1 focus-within:ring-neon-blue transition-all">
                        <MessageSquare size={16} className="text-gray-500 mr-2" />
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Message..." 
                            className="bg-transparent border-none outline-none text-white text-sm w-full h-10 placeholder-gray-600"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!chatInput.trim()}
                        className="w-10 h-10 flex items-center justify-center bg-neon-blue text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
       )}

        {/* Victory/Draw Actions */}
        {winState.winner && (
             <div className="absolute bottom-10 z-30 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                 {(gameMode === 'PVE' && (winState.winner === 1)) && (
                    <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                    </div>
                 )}
                <div className="bg-black/80 px-6 py-2 rounded-full border border-white/20 mb-4">
                    <span className="text-xl font-black italic">
                        {winState.winner === 'DRAW' 
                            ? "MATCH NUL" 
                            : gameMode === 'ONLINE'
                                ? (mp.isHost && winState.winner === 1) || (!mp.isHost && winState.winner === 2) ? "TU AS GAGNÉ !" : "TU AS PERDU..."
                                : `VICTOIRE JOUEUR ${winState.winner} !`
                        }
                    </span>
                </div>
                <button
                    onClick={() => resetGame(true)}
                    className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
                >
                    <Play size={20} fill="black"/> REJOUER
                </button>
             </div>
        )}
    </div>
  );
};
