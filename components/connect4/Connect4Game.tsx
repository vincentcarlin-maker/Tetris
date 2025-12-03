
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, Trophy, Play, CircleDot, Coins, Globe, Loader2, AlertCircle, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, Swords, Clipboard, X, Check } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer, PlayerInfo } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>; // Use shared instance
}

const ROWS = 6;
const COLS = 7;

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


// Helpers
const createBoard = (): BoardState => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinFull = (board: BoardState): WinState => {
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
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
      }
    }
  }
  
  if (board.every(row => row.every(cell => cell !== 0))) {
    return { winner: 'DRAW', line: [] };
  }

  return { winner: null, line: [] };
};


export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp }) => {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Animation State
  const [animatingCell, setAnimatingCell] = useState<{r: number, c: number} | null>(null);
  const isAnimatingRef = useRef(false);
  const animationTimerRef = useRef<any>(null);

  // MATCHMAKING & GAME STATE
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  
  // Identity
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();
  
  // Interaction State
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio
  const { playMove, playLand, playGameOver, playVictory } = audio;
  
  // Auto-scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Sync Self Info to Multiplayer State
  useEffect(() => {
    mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
          isAnimatingRef.current = false;
      };
  }, []);

  // Reset Game
  const resetGame = useCallback((isOnlineReset = false) => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    isAnimatingRef.current = false;
    
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinState({ winner: null, line: [] });
    setIsAiThinking(false);
    setEarnedCoins(0);
    setActiveReaction(null);
    setAnimatingCell(null);

    if (gameMode !== 'ONLINE') {
        setChatHistory([]);
    }
  }, [gameMode]);

  // Handle Mode Change
  const cycleMode = () => {
    if (gameMode === 'PVE') setGameMode('PVP');
    else if (gameMode === 'PVP') {
        setGameMode('ONLINE');
    }
    else {
        setGameMode('PVE');
        mp.disconnect();
    }
    resetGame();
  };

  // Connect to lobby when switching to online mode
  useEffect(() => {
    if (gameMode === 'ONLINE') {
      setOnlineStep('connecting');
      mp.connect();
    } else {
      mp.disconnect();
    }
    return () => mp.disconnect();
  }, [gameMode]);

  // Effect to handle multiplayer state changes from the hook
  useEffect(() => {
      const self = mp.players.find(p => p.id === mp.peerId);
      const isHosting = self?.status === 'hosting';

      if (mp.mode === 'lobby') {
          if (isHosting) {
              setOnlineStep('game');
          } else {
              setOnlineStep('lobby');
              if (onlineStep === 'game' && !isHosting) {
                  resetGame();
              }
          }
      } else if (mp.mode === 'in_game') {
          setOnlineStep('game');
          if (!winState.winner) {
              const isBoardEmpty = board.every(row => row.every(cell => cell === 0));
              if (!isBoardEmpty) {
                   resetGame(); 
              }
          }
      } else if (mp.mode === 'disconnected' && gameMode === 'ONLINE') {
          setOnlineStep('connecting');
      }
  }, [mp.mode, gameMode, mp.players, mp.peerId]);
  
  // Handle Difficulty Change
  const cycleDifficulty = () => {
    const diffs: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
    setDifficulty(diffs[nextIdx]);
    if (gameMode === 'PVE') resetGame();
  };

  const isMyTurnOnline = mp.mode === 'in_game' && ((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2));
  const isHostingAndWaiting = gameMode === 'ONLINE' && !mp.gameOpponent && onlineStep === 'game';

  // Drop Piece Logic
  const handleColumnClick = useCallback((colIndex: number, isAiMove = false) => {
    if (winState.winner || isAnimatingRef.current) return;
    if (gameMode === 'PVE' && isAiThinking && !isAiMove) return;
    
    if (gameMode === 'ONLINE') {
        if (mp.mode !== 'in_game' || !mp.gameOpponent || !isMyTurnOnline) return;
    }
    
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIndex] === 0) {
        rowIndex = r;
        break;
      }
    }

    if (rowIndex === -1) return;

    if (gameMode === 'ONLINE') {
        mp.sendGameMove(colIndex);
    } else {
        const newBoard = board.map(row => [...row]);
        newBoard[rowIndex][colIndex] = currentPlayer;
        
        isAnimatingRef.current = true;
        setBoard(newBoard);
        setAnimatingCell({ r: rowIndex, c: colIndex });
        playMove(); 

        animationTimerRef.current = setTimeout(() => {
            playLand();
            setAnimatingCell(null);
            
            const result = checkWinFull(newBoard);
            if (result.winner) {
              setWinState(result);
              if (result.winner === 1) { 
                  playVictory();
                  let reward = 10;
                  if (gameMode === 'PVE') {
                      if (difficulty === 'EASY') reward = 5;
                      else if (difficulty === 'MEDIUM') reward = 15;
                      else if (difficulty === 'HARD') reward = 30;
                  }
                  addCoins(reward);
                  setEarnedCoins(reward);
              } else {
                  playGameOver();
              }
            } else {
              setCurrentPlayer(prev => prev === 1 ? 2 : 1);
            }
            isAnimatingRef.current = false;
        }, 500); 
    }

  }, [board, currentPlayer, winState.winner, isAiThinking, playMove, playLand, playGameOver, playVictory, gameMode, difficulty, addCoins, mp, isMyTurnOnline]);

  // Send Reaction
  const sendReaction = useCallback((reactionId: string) => {
      if (gameMode === 'ONLINE' && mp.mode === 'in_game') {
          setActiveReaction({ id: reactionId, isMe: true });
          mp.sendData({ type: 'REACTION', id: reactionId });
          setTimeout(() => setActiveReaction(null), 3000);
      }
  }, [gameMode, mp]);

  // Send Chat
  const sendChat = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || mp.mode !== 'in_game') return;
      
      const msg: ChatMessage = {
          id: Date.now(),
          text: chatInput.trim(),
          senderName: username,
          isMe: true,
          timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, msg]);
      mp.sendData({ type: 'CHAT', text: msg.text, senderName: username });
      setChatInput('');
  };

  // Multiplayer Data Handling
  useEffect(() => {
    const handleData = (data: any) => {
        if (data.type === 'GAME_MOVE_RELAY') {
            const { col, player, nextPlayer } = data;
            const rowIndex = board.findIndex((row, r) => board[r][col] === 0 && (r === ROWS - 1 || board[r+1][col] !== 0));
            
            if (rowIndex !== -1) {
                isAnimatingRef.current = true;
                const newBoard = board.map(r => [...r]);
                newBoard[rowIndex][col] = player;
                setBoard(newBoard);
                setCurrentPlayer(player);
                setAnimatingCell({ r: rowIndex, c: col });
                playMove();

                animationTimerRef.current = setTimeout(() => {
                    playLand();
                    setAnimatingCell(null);
                    const result = checkWinFull(newBoard);
                    if (result.winner) {
                        setWinState(result);
                         if ((mp.amIP1 && result.winner === 1) || (!mp.amIP1 && result.winner === 2)) {
                           playVictory();
                           const onlineReward = 50;
                           addCoins(onlineReward);
                           setEarnedCoins(onlineReward);
                         } else {
                           playGameOver();
                         }
                    } else {
                        setCurrentPlayer(nextPlayer);
                    }
                    isAnimatingRef.current = false;
                }, 500);
            }
        }
        if (data.type === 'REACTION') {
            setActiveReaction({ id: data.id, isMe: false });
            setTimeout(() => setActiveReaction(null), 3000);
        }
        if (data.type === 'CHAT') {
            setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
        }
        if (data.type === 'REMATCH_START') {
            resetGame(true);
        }
    };
    mp.setOnDataReceived(handleData);
    return () => mp.setOnDataReceived(null);
  }, [mp, board, playMove, playLand, playGameOver, playVictory, addCoins, resetGame]);


  // AI Turn Handling
  useEffect(() => {
    if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAiThinking && !isAnimatingRef.current) {
      setIsAiThinking(true);
    }
  }, [gameMode, currentPlayer, winState.winner, isAiThinking]);

  // AI SAFETY: Force stop thinking if too long (2s)
  useEffect(() => {
      let safetyTimer: any;
      if (isAiThinking) {
          safetyTimer = setTimeout(() => {
              if (isAiThinking) {
                  // Fallback random move to unfreeze
                  const validCols = [];
                  for(let c=0; c<COLS; c++) {
                      if (board[0][c] === 0) validCols.push(c);
                  }
                  if (validCols.length > 0) {
                      const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
                      handleColumnClick(randomCol, true);
                  }
                  setIsAiThinking(false);
              }
          }, 2000);
      }
      return () => { if (safetyTimer) clearTimeout(safetyTimer); }
  }, [isAiThinking, board, handleColumnClick]);

  useEffect(() => {
    if (!isAiThinking) return;
    const timer = setTimeout(() => {
        try {
            const bestCol = getBestMove(board, difficulty);
            if (bestCol !== -1) {
                handleColumnClick(bestCol, true);
            }
        } catch (e) {
            console.error("AI Error", e);
        }
        setIsAiThinking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isAiThinking, board, difficulty, handleColumnClick]);

  // ... render functions ...
  const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
  };

  const renderOnlineLobby = () => {
    if (onlineStep === 'connecting') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-cyan-400">
                <Loader2 size={48} className="animate-spin" />
                <p className="font-bold tracking-widest">CONNEXION AU LOBBY...</p>
                {mp.error && <p className="text-red-500 text-sm mt-4">{mp.error}</p>}
            </div>
        );
    }

    if (onlineStep === 'lobby') {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);

        return (
             <div className="flex flex-col h-full animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold text-center text-cyan-300 tracking-wider">LOBBY EN LIGNE</h3>
                     <button onClick={mp.createRoom} className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg text-xs hover:bg-green-400 transition-colors flex items-center gap-2">
                        <Play size={14}/> CRÉER UNE PARTIE
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
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-3 py-1.5 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">
                                            REJOINDRE
                                        </button>
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
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
       <style>{`@keyframes dropIn { 0% { transform: translateY(var(--drop-start)); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }`}</style>

       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-transparent pointer-events-none"></div>

       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
         <div className="z-20 relative">
             <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                <ArrowLeft size={20} />
             </button>
         </div>
         <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full">
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)] truncate">NEON CONNECT</h1>
         </div>
         <div className="z-20 relative min-w-[40px] flex justify-end">
            {(gameMode !== 'ONLINE' || onlineStep === 'game') && !isHostingAndWaiting && (
                <button onClick={() => resetGame(false)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                    <RefreshCw size={20} />
                </button>
            )}
         </div>
       </div>

       <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button onClick={cycleMode} disabled={mp.mode === 'in_game' || isHostingAndWaiting} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[110px] disabled:opacity-50">
                {gameMode === 'PVE' && <Cpu size={14} className="text-neon-blue"/>}
                {gameMode === 'PVP' && <User size={14} className="text-neon-pink"/>}
                {gameMode === 'ONLINE' && <Globe size={14} className="text-green-400"/>}
                {gameMode === 'PVE' && 'VS ORDI'}
                {gameMode === 'PVP' && 'VS JOUEUR'}
                {gameMode === 'ONLINE' && 'EN LIGNE'}
            </button>
          </div>
          {gameMode === 'PVE' ? (
              <button onClick={cycleDifficulty} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[80px] justify-center">
                {difficulty === 'EASY' && <span className="text-green-400">FACILE</span>}
                {difficulty === 'MEDIUM' && <span className="text-yellow-400">MOYEN</span>}
                {difficulty === 'HARD' && <span className="text-red-500">DIFFICILE</span>}
              </button>
          ) : <div className="w-[80px]"></div>}
       </div>

       {!winState.winner && onlineStep === 'game' && (
            <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
                isHostingAndWaiting ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' :
                currentPlayer === 1 
                    ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                    : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
            }`}>
                <CircleDot size={12} className={isAiThinking || isHostingAndWaiting ? 'animate-spin' : ''} /> 
                {isHostingAndWaiting ? "EN ATTENTE D'UN ADVERSAIRE..." : gameMode === 'ONLINE' ? (isMyTurnOnline ? "C'EST TON TOUR !" : "L'ADVERSAIRE RÉFLÉCHIT...") : (isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR JOUEUR ${currentPlayer}`)}
            </div>
       )}

       <div className={`relative z-10 p-2 sm:p-4 bg-black/60 rounded-2xl border-4 border-gray-700/80 shadow-2xl backdrop-blur-md w-full max-w-lg aspect-[7/6]`}>
            {gameMode === 'ONLINE' && onlineStep !== 'game' ? (
                renderOnlineLobby()
            ) : (
                <>
                    {activeReaction && (() => {
                        const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                        if (!reaction) return null;
                        const positionClass = activeReaction.isMe ? 'bottom-[-20px] right-[-20px] sm:right-[-40px]' : 'top-[-20px] left-[-20px] sm:left-[-40px]';
                        const anim = reaction.anim || 'animate-bounce';
                        return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
                    })()}

                    <div className="grid grid-cols-7 gap-1 sm:gap-3 relative">
                        {isHostingAndWaiting && <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-xl pointer-events-none"><div className="animate-pulse"><Loader2 size={64} className="text-yellow-400 animate-spin opacity-50" /></div></div>}
                        <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                                {Array.from({ length: COLS }).map((_, c) => <div key={`col-${c}`} onClick={() => !isHostingAndWaiting && handleColumnClick(c)} className={`h-full transition-colors rounded-full ${winState.winner || isAnimatingRef.current || isHostingAndWaiting ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}/>)}
                        </div>
                        {Array.from({ length: COLS }).map((_, c) => (
                            <div key={c} className="flex flex-col gap-1 sm:gap-3">
                                {Array.from({ length: ROWS }).map((_, r) => {
                                    const val = board[r][c];
                                    const isWinningPiece = winState.line.some(([wr, wc]) => wr === r && wc === c);
                                    const isAnimating = animatingCell?.r === r && animatingCell?.c === c;
                                    const animationStyle: React.CSSProperties = isAnimating ? { animation: 'dropIn 0.5s cubic-bezier(0.5, 0, 0.75, 0)', '--drop-start': `-${(r * 110) + 120}%`, zIndex: 0, position: 'absolute', inset: 0, margin: 'auto' } as React.CSSProperties : {};
                                    return (
                                        <div key={`${r}-${c}`} className="relative w-full aspect-square rounded-full bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border-2 border-white/20 group-hover:border-white/30 transition-colors overflow-visible">
                                            {val !== 0 && <div style={animationStyle} className={`absolute inset-0 m-auto w-full h-full rounded-full transition-all duration-500 shadow-lg ${val === 1 ? 'bg-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.6)]' : 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.6)]'} ${isWinningPiece ? 'animate-pulse ring-4 ring-white z-10 brightness-125' : ''}`}><div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent"></div></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </>
            )}
       </div>

       {gameMode === 'ONLINE' && onlineStep === 'game' && !winState.winner && !isHostingAndWaiting && (
            <div className="w-full max-w-lg mt-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 z-20">
                <div className="flex justify-between items-center gap-2 p-2 bg-gray-900/80 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
                    {REACTIONS.map(reaction => {
                        const Icon = reaction.icon;
                        return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-2 rounded-xl transition-all active:scale-95 border shrink-0 ${reaction.bg} ${reaction.border} hover:scale-110 group`}><Icon size={20} className={`${reaction.color} drop-shadow-[0_0_5px_currentColor] group-hover:drop-shadow-[0_0_10px_currentColor] transition-all`} /></button>;
                    })}
                </div>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                    {chatHistory.length === 0 && <div className="text-gray-600 text-xs italic text-center py-2">Aucun message</div>}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[85%]`}>
                                {!msg.isMe && <span className="text-[8px] text-gray-500 ml-1 mb-0.5">{msg.senderName}</span>}
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold break-words ${msg.isMe ? 'bg-neon-pink/20 text-pink-100 border border-neon-pink/30' : 'bg-neon-blue/20 text-cyan-100 border border-neon-blue/30'}`}>{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-2">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3 focus-within:border-neon-blue focus-within:ring-1 focus-within:ring-neon-blue transition-all">
                        <MessageSquare size={16} className="text-gray-500 mr-2" />
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-sm w-full h-10 placeholder-gray-600" />
                    </div>
                    <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 flex items-center justify-center bg-neon-blue text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send size={18} /></button>
                </form>
            </div>
       )}
       
       {isHostingAndWaiting && (
             <div className="mt-6 z-20 animate-in slide-in-from-bottom-4">
                 <button onClick={mp.cancelHosting} className="px-8 py-3 bg-red-600/90 text-white font-bold rounded-full border border-red-400 hover:bg-red-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2"><X size={20} /> ANNULER LA PARTIE</button>
             </div>
       )}
       
       {gameMode === 'ONLINE' && onlineStep === 'game' && !isHostingAndWaiting && !winState.winner && <button onClick={mp.leaveGame} className="mt-2 text-xs text-red-400 underline hover:text-red-300 z-10">Quitter la partie</button>}

        {winState.winner && (
             <div className="absolute bottom-10 z-30 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                 {(winState.winner !== 'DRAW' && earnedCoins > 0) && <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                <div className="bg-black/80 px-6 py-2 rounded-full border border-white/20 mb-4">
                    <span className="text-xl font-black italic">{winState.winner === 'DRAW' ? "MATCH NUL" : gameMode === 'ONLINE' ? (((mp.amIP1 && winState.winner === 1) || (!mp.amIP1 && winState.winner === 2)) ? "TU AS GAGNÉ !" : "TU AS PERDU...") : `VICTOIRE JOUEUR ${winState.winner} !`}</span>
                </div>
                {(gameMode !== 'ONLINE' || (mp.isHost && mp.mode === 'in_game')) && <button onClick={() => gameMode === 'ONLINE' ? mp.requestRematch() : resetGame(false)} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"><Play size={20} fill="black"/> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>}
                {gameMode === 'ONLINE' && !mp.isHost && mp.mode === 'in_game' && <button onClick={() => mp.requestRematch()} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"><Play size={20} fill="black"/> REVANCHE</button>}
                {gameMode === 'ONLINE' && <button onClick={mp.leaveGame} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-full border border-white/10 hover:bg-gray-700">RETOUR AU LOBBY</button>}
             </div>
        )}
    </div>
  );
};
