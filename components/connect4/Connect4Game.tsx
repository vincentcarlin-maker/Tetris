
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, Trophy, Play, CircleDot, Coins, Globe, Copy, Check, LogIn, Loader2, Users, Radio } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove, checkWin } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
}

const ROWS = 6;
const COLS = 7;
const EMOJIS = ['👋', '😂', '😎', '😭', '😡', '🤔', '👍', '❤️'];

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
  const [showNumpad, setShowNumpad] = useState(false);
  
  // Emoji State
  const [localEmoji, setLocalEmoji] = useState<string | null>(null);
  const [remoteEmoji, setRemoteEmoji] = useState<string | null>(null);
  
  // Audio
  const { playMove, playGameOver, playVictory } = audio;

  // Reset Game
  const resetGame = useCallback((sendSync = false) => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinState({ winner: null, line: [] });
    setIsAiThinking(false);
    setEarnedCoins(0);
    setLocalEmoji(null);
    setRemoteEmoji(null);

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
    }
    else {
        setGameMode('PVE');
        mp.disconnect();
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
          // No coins for local PVP or Online
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

  // Send Emoji
  const sendEmoji = useCallback((emoji: string) => {
      if (gameMode === 'ONLINE' && mp.isConnected) {
          setLocalEmoji(emoji);
          mp.sendData({ type: 'EMOJI', emoji });
          // Auto clear local emoji
          setTimeout(() => setLocalEmoji(null), 2500);
      }
  }, [gameMode, mp.isConnected, mp]);

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
            if (data.type === 'EMOJI') {
                setRemoteEmoji(data.emoji);
                setTimeout(() => setRemoteEmoji(null), 2500);
            }
        });
    }
  }, [gameMode, mp.isConnected, handleColumnClick, resetGame, mp]);


  // AI Turn Handling - Split into two effects to prevent cleanup race conditions
  
  // 1. Trigger Thinking State
  useEffect(() => {
    if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAiThinking) {
      setIsAiThinking(true);
    }
  }, [gameMode, currentPlayer, winState.winner, isAiThinking]);

  // 2. Perform AI Move
  useEffect(() => {
    if (!isAiThinking) return;
    
    // Timer to simulate thinking and allow UI update
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
       {/* Ambient Light Reflection (MIX-BLEND-HARD-LIGHT pour révéler les briques) */}
       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />

       {/* Background */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-transparent pointer-events-none"></div>

       {/* Header */}
       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
         <button onClick={() => { mp.disconnect(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <ArrowLeft size={20} />
         </button>
         
         <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)]">
                NEON CONNECT
            </h1>
         </div>

         <button onClick={() => resetGame(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <RefreshCw size={20} />
         </button>
       </div>

       {/* Game Controls / Status */}
       <div className="w-full max-w-lg flex justify-between items-center mb-6 z-10 px-2 flex-wrap gap-2">
          {/* Left: Mode Switch */}
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

          {/* Right: Difficulty or Online Status */}
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
              <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${mp.isConnected ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
                  {mp.isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
              </div>
          ) : (
              <div className="w-[80px]"></div>
          )}
       </div>

       {/* ONLINE LOBBY OVERLAY (NEW DESIGN) */}
       {gameMode === 'ONLINE' && !mp.isConnected && (
           <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md overflow-y-auto touch-pan-y flex flex-col items-center pt-8 pb-20">
               
               <h2 className="text-3xl font-black italic text-white mb-2 text-center leading-tight">SALON ONLINE</h2>
               <p className="text-gray-400 text-xs mb-6 text-center max-w-[80%]">Entrez le code d'un ami ou rejoignez une salle publique.</p>
               
               {mp.error && (
                   <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 text-xs max-w-xs text-center break-words">
                       {mp.error}
                   </div>
               )}

               <div className="w-full max-w-sm px-4 grid gap-6">
                   
                   {/* MY CODE SECTION */}
                   <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
                       <h3 className="text-neon-pink font-bold tracking-widest text-[10px] mb-2 uppercase">Votre Code Joueur</h3>
                       {mp.isLoading ? (
                           <div className="flex items-center gap-2 text-gray-400 text-xs h-12">
                               <Loader2 size={16} className="animate-spin" /> Connexion au serveur...
                           </div>
                       ) : (
                           <div className="w-full flex items-center justify-center gap-2">
                               <div className="text-4xl font-mono font-bold text-neon-pink tracking-widest drop-shadow-[0_0_10px_#ff00ff]">
                                   {mp.shortId || '----'}
                               </div>
                           </div>
                       )}
                   </div>

                   {/* JOIN SECTION */}
                   <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-lg">
                       <h3 className="text-neon-blue font-bold tracking-widest text-[10px] mb-3 uppercase">Code Adversaire</h3>
                       
                       <div className="flex items-center gap-2 mb-4">
                           <div className="h-12 w-32 bg-black/50 border-2 border-neon-blue rounded-lg flex items-center justify-center text-2xl font-mono font-bold text-white tracking-widest">
                               {remoteCodeInput || ''}
                               <span className="animate-pulse text-neon-blue ml-1">_</span>
                           </div>
                           <button 
                               onClick={() => mp.connectToPeer(remoteCodeInput)}
                               disabled={remoteCodeInput.length !== 4}
                               className="h-12 px-6 bg-neon-blue text-black font-bold rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-[0_0_10px_rgba(0,243,255,0.4)]"
                           >
                               REJOINDRE
                           </button>
                       </div>

                       {/* NUMPAD */}
                       <div className="grid grid-cols-3 gap-2 w-full max-w-[200px]">
                           {[1,2,3,4,5,6,7,8,9].map(n => (
                               <button 
                                   key={n}
                                   onClick={() => handleNumpad(n.toString())}
                                   className="h-10 bg-gray-800 rounded hover:bg-gray-700 text-white font-bold text-lg active:scale-95 transition-transform"
                               >
                                   {n}
                               </button>
                           ))}
                           <button onClick={() => setRemoteCodeInput('')} className="h-10 bg-gray-800 rounded hover:bg-gray-700 text-red-400 font-bold text-xs">C</button>
                           <button onClick={() => handleNumpad('0')} className="h-10 bg-gray-800 rounded hover:bg-gray-700 text-white font-bold text-lg">0</button>
                           <button onClick={() => handleNumpad('DEL')} className="h-10 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 font-bold text-xs">DEL</button>
                       </div>
                   </div>

                   {/* PUBLIC ROOMS SHORTCUTS */}
                   <div className="flex flex-col gap-2">
                       <h3 className="text-gray-500 font-bold tracking-widest text-[10px] text-center uppercase">Salons Publics</h3>
                       <div className="grid grid-cols-2 gap-3">
                           <button 
                                onClick={() => {
                                    setRemoteCodeInput('1111');
                                    mp.connectToPeer('1111');
                                    setTimeout(() => {
                                        if (!mp.isConnected && !mp.isHost) {
                                            if (confirm("Personne dans le Salon 1. Voulez-vous créer ce salon ?")) {
                                                mp.hostRoom('1111');
                                            }
                                        }
                                    }, 2000);
                                }}
                                className="bg-gray-800 border border-white/5 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 active:scale-95 transition-all"
                            >
                               <Users size={16} className="text-green-400" />
                               <span className="text-xs font-bold text-gray-300">SALON #1</span>
                           </button>
                           <button 
                                onClick={() => {
                                     setRemoteCodeInput('2222');
                                     mp.connectToPeer('2222');
                                     setTimeout(() => {
                                        if (!mp.isConnected && !mp.isHost) {
                                            if (confirm("Personne dans le Salon 2. Voulez-vous créer ce salon ?")) {
                                                mp.hostRoom('2222');
                                            }
                                        }
                                    }, 2000);
                                }}
                                className="bg-gray-800 border border-white/5 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 active:scale-95 transition-all"
                            >
                               <Users size={16} className="text-purple-400" />
                               <span className="text-xs font-bold text-gray-300">SALON #2</span>
                           </button>
                       </div>
                   </div>

               </div>
               
               <button 
                    onClick={() => {
                        setGameMode('PVE'); 
                        mp.disconnect();
                    }}
                    className="mt-6 text-gray-500 text-xs underline hover:text-white"
               >
                   Retour au menu
               </button>
           </div>
       )}

       {/* Turn Indicator (Moved below header for better visibility in online) */}
       {!winState.winner && (
            <div className={`mb-4 px-6 py-2 rounded-full border flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
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
       <div className={`relative z-10 p-4 bg-black/60 rounded-2xl border-4 border-gray-800 shadow-2xl backdrop-blur-md transition-opacity duration-500 ${gameMode === 'ONLINE' && !mp.isConnected ? 'opacity-0' : 'opacity-100'}`}>
           
           {/* EMOJI OVERLAYS */}
           {remoteEmoji && (
               <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
                   <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                       {remoteEmoji}
                   </div>
               </div>
           )}
           
           {localEmoji && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-pulse">
                   <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                       {localEmoji}
                   </div>
               </div>
           )}

           {/* Grid */}
           <div className="grid grid-cols-7 gap-2 sm:gap-3 relative">
               {/* Click Columns (Invisible overlays for better hit area) */}
               <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div 
                            key={`col-${c}`}
                            onClick={() => handleColumnClick(c)}
                            className={`h-full cursor-pointer hover:bg-white/5 transition-colors rounded-full ${
                                winState.winner ? 'pointer-events-none' : ''
                            }`}
                        />
                    ))}
               </div>

               {/* Cells */}
               {Array.from({ length: COLS }).map((_, c) => (
                   <div key={c} className="flex flex-col gap-2 sm:gap-3">
                       {Array.from({ length: ROWS }).map((_, r) => {
                           const val = board[r][c];
                           const isWinningPiece = winState.line.some(([wr, wc]) => wr === r && wc === c);
                           
                           return (
                               <div 
                                key={`${r}-${c}`} 
                                className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 shadow-inner flex items-center justify-center border border-white/5"
                               >
                                   {/* Token */}
                                   {val !== 0 && (
                                       <div className={`w-full h-full rounded-full animate-bounce transition-all duration-500 shadow-lg ${
                                           val === 1 
                                           ? 'bg-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.6)]' 
                                           : 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.6)]'
                                       } ${isWinningPiece ? 'animate-pulse ring-4 ring-white z-10 brightness-125' : ''}`}>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent"></div>
                                            <div className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-white/20 blur-[1px]"></div>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               ))}
           </div>
       </div>

       {/* EMOJI BAR (Only for Online/PVP) */}
       {gameMode === 'ONLINE' && mp.isConnected && !winState.winner && (
            <div className="mt-6 flex gap-3 p-2 bg-gray-900/80 rounded-full border border-white/10 z-20 animate-in slide-in-from-bottom-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => sendEmoji(emoji)}
                        className="text-2xl hover:scale-125 transition-transform active:scale-95 p-1 grayscale hover:grayscale-0"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
       )}

        {/* Victory/Draw Actions */}
        {winState.winner && (
             <div className="absolute bottom-10 z-30 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                 {/* Reward Display (PVE Only) */}
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
                                ? (mp.isHost && winState.winner === 1) || (!mp.isHost && winState.winner === 2) 
                                    ? "TU AS GAGNÉ !" 
                                    : "TU AS PERDU..."
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
