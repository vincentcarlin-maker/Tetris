
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, Trophy, Play, CircleDot, Coins } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove, checkWin } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
}

const ROWS = 6;
const COLS = 7;

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
  
  // Audio
  const { playMove, playGameOver, playVictory } = audio;

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinState({ winner: null, line: [] });
    setIsAiThinking(false);
  }, []);

  // Handle Mode Change
  const toggleMode = () => {
    setGameMode(prev => prev === 'PVE' ? 'PVP' : 'PVE');
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
  const handleColumnClick = useCallback((colIndex: number, isAi = false) => {
    // If it's not the AI playing, we block if game over or if AI is currently thinking (blocking user input)
    if (winState.winner) return;
    if (!isAi && isAiThinking) return;
    
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

    // Check Win
    const result = checkWinFull(newBoard);
    if (result.winner) {
      setWinState(result);
      if (result.winner === 1 || (gameMode === 'PVP' && result.winner === 2)) {
          playVictory();
          // Récompense seulement si joueur 1 gagne (contre IA ou PVP)
          if (result.winner === 1) addCoins(30);
          if (gameMode === 'PVP' && result.winner === 2) addCoins(30);
      } else if (result.winner === 2 && gameMode === 'PVE') {
          playGameOver();
      } else {
          playGameOver(); // Draw
      }
    } else {
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    }

  }, [board, currentPlayer, winState.winner, isAiThinking, playMove, playGameOver, playVictory, gameMode, addCoins]);

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


  return (
    <div className="h-full w-full flex flex-col items-center bg-[#0a0a12] relative overflow-hidden text-white font-sans p-4">
       {/* Background */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none"></div>

       {/* Header */}
       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
         <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <ArrowLeft size={20} />
         </button>
         
         <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)]">
                NEON CONNECT
            </h1>
         </div>

         <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
           <RefreshCw size={20} />
         </button>
       </div>

       {/* Game Controls / Status */}
       <div className="w-full max-w-lg flex justify-between items-center mb-6 z-10 px-2">
          {/* Left: Mode Switch */}
          <button 
            onClick={toggleMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors"
          >
            {gameMode === 'PVE' ? <Cpu size={14} className="text-neon-blue"/> : <User size={14} className="text-neon-pink"/>}
            {gameMode === 'PVE' ? 'VS ORDI' : 'VS JOUEUR'}
          </button>

          {/* Center: Turn Indicator */}
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              winState.winner 
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              : currentPlayer === 1 
                ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
          }`}>
             {winState.winner ? (
                 <span className="flex items-center gap-2"><Trophy size={14}/> {winState.winner === 'DRAW' ? 'MATCH NUL' : `VICTOIRE J${winState.winner === 1 ? '1' : '2'} !`}</span>
             ) : (
                 <span className="flex items-center gap-2">
                    <CircleDot size={12} className={isAiThinking ? 'animate-spin' : ''} /> 
                    {isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR J${currentPlayer}`}
                 </span>
             )}
          </div>

          {/* Right: Difficulty */}
          {gameMode === 'PVE' ? (
              <button 
                onClick={cycleDifficulty}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[80px] justify-center"
              >
                {difficulty === 'EASY' && <span className="text-green-400">FACILE</span>}
                {difficulty === 'MEDIUM' && <span className="text-yellow-400">MOYEN</span>}
                {difficulty === 'HARD' && <span className="text-red-500">DIFFICILE</span>}
              </button>
          ) : (
              <div className="w-[80px]"></div> // Spacer
          )}
       </div>

       {/* Game Board */}
       <div className="relative z-10 p-4 bg-gray-900/80 rounded-2xl border-4 border-gray-800 shadow-2xl backdrop-blur-sm">
           
           {/* Grid */}
           <div className="grid grid-cols-7 gap-2 sm:gap-3">
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

       {/* Instructions */}
       {!winState.winner && (
           <div className="mt-8 text-gray-500 text-xs tracking-widest text-center animate-pulse">
               {isAiThinking ? "ANALYSE EN COURS..." : "TOUCHE UNE COLONNE POUR JOUER"}
           </div>
       )}

        {/* Victory/Draw Actions */}
        {winState.winner && (
             <div className="absolute bottom-10 z-30 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                 {/* Reward Display */}
                 {(winState.winner === 1 || (gameMode === 'PVP' && winState.winner === 2)) && (
                    <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="text-yellow-100 font-bold">+30 PIÈCES</span>
                    </div>
                 )}

                <button
                    onClick={resetGame}
                    className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
                >
                    <Play size={20} fill="black"/> NOUVELLE PARTIE
                </button>
             </div>
        )}

    </div>
  );
};
