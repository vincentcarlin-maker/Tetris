
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, CircleDot, Coins, Home, Play, Users, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, Loader2, Globe, HelpCircle, LayoutGrid, Zap, Shield } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>;
  onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

const ROWS = 6;
const COLS = 7;

const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

const createBoard = (): BoardState => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinFull = (board: BoardState): WinState => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
      }
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
      }
    }
  }
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
  if (board.every(row => row.every(cell => cell !== 0))) return { winner: 'DRAW', line: [] };
  return { winner: null, line: [] };
};

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const boardRef = useRef<BoardState>(createBoard());
  const [gameStage, setGameStage] = useState<'MENU' | 'DIFFICULTY' | 'GAME'>('MENU');
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  const { username, currentAvatarId } = useCurrency();
  const [animatingCell, setAnimatingCell] = useState<{r: number, c: number} | null>(null);
  const isAnimatingRef = useRef(false);
  const animationTimerRef = useRef<any>(null);
  const { playMove, playLand, playGameOver, playVictory, resumeAudio } = audio;
  
  useEffect(() => { return () => { if (animationTimerRef.current) clearTimeout(animationTimerRef.current); isAnimatingRef.current = false; }; }, []);
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { const hasSeen = localStorage.getItem('neon_connect4_tutorial_seen'); if (!hasSeen) { setShowTutorial(true); localStorage.setItem('neon_connect4_tutorial_seen', 'true'); } }, []);
  useEffect(() => { mp.updateSelfInfo(username, currentAvatarId); }, [username, currentAvatarId, mp]);
  useEffect(() => { if (gameMode === 'ONLINE') { setOnlineStep('connecting'); mp.connect(); } else { mp.disconnect(); } }, [gameMode]);

  const resetGame = useCallback(() => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    isAnimatingRef.current = false;
    const newBoard = createBoard();
    setBoard(newBoard); boardRef.current = newBoard; 
    setCurrentPlayer(1); setWinState({ winner: null, line: [] }); setIsAiThinking(false); setEarnedCoins(0); setAnimatingCell(null);
    if (onReportProgress) onReportProgress('play', 1);
  }, [onReportProgress]);

  const handleColumnClick = useCallback((colIndex: number, isRemoteMove = false) => {
    if (winState.winner || isAnimatingRef.current || showTutorial) return;
    if (gameMode === 'ONLINE' && !isRemoteMove) {
        if (!mp.gameOpponent) return;
        const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
        if (!isMyTurn) return;
    }
    if (gameMode === 'PVE' && isAiThinking && !isRemoteMove) return;
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) { if (boardRef.current[r][colIndex] === 0) { rowIndex = r; break; } }
    if (rowIndex === -1) return;
    if (gameMode === 'ONLINE' && !isRemoteMove) mp.sendGameMove({ col: colIndex });
    const newBoard = boardRef.current.map(row => [...row]);
    newBoard[rowIndex][colIndex] = currentPlayer;
    isAnimatingRef.current = true;
    setBoard(newBoard); setAnimatingCell({ r: rowIndex, c: colIndex }); playMove(); 
    animationTimerRef.current = setTimeout(() => {
        playLand(); setAnimatingCell(null);
        const result = checkWinFull(newBoard);
        if (result.winner) {
          setWinState(result);
          const isMeP1 = mp.amIP1;
          const didIWin = gameMode === 'ONLINE' ? ((isMeP1 && result.winner === 1) || (!isMeP1 && result.winner === 2)) : (result.winner === 1);
          if (didIWin) { 
              playVictory();
              let reward = 15; if (gameMode === 'ONLINE') reward = 50;
              addCoins(reward); setEarnedCoins(reward); if (onReportProgress) onReportProgress('win', 1);
          } else playGameOver();
        } else setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        isAnimatingRef.current = false;
    }, 500); 
  }, [currentPlayer, winState.winner, isAiThinking, playMove, playLand, playGameOver, playVictory, gameMode, difficulty, addCoins, mp, onReportProgress, showTutorial]);

  if (gameStage === 'MENU') {
      return ( <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"> <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#d946ef]">NEON QUAD</h1> <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8"> <button onClick={() => setGameStage('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"> <Cpu size={24} className="text-neon-blue"/> 1 JOUEUR </button> <button onClick={() => setGameStage('GAME')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"> <Globe size={24} className="text-green-500"/> EN LIGNE </button> </div> <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button> </div> );
  }

  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
         <button onClick={() => setGameStage('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><ArrowLeft size={20} /></button>
         <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)]">NEON QUAD</h1>
         <button onClick={() => resetGame()} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><RefreshCw size={20} /></button>
       </div>
       {/* Reste du plateau... */}
    </div>
  );
};
