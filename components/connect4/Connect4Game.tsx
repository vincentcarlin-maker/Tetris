
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, Trophy, Play, CircleDot, Coins, Globe, Loader2, Server, AlertCircle, CheckCircle2, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, Zap, Eye, X, Check, Swords } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer, PlayerInfo } from '../../hooks/useMultiplayer';
import { useCurrency, AVATARS_CATALOG } from '../../hooks/useCurrency';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
}

const ROWS = 6;
const COLS = 7;

// Réactions Néon
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500' },
    { id: 'shock', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500' },
];

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

interface GameSession {
    id: string;
    opponentId: string;
    isGameHost: boolean; // True if I challenged, false if I was challenged
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
      if (board[r][c] && board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) {
        return { winner: board[r][c] as Player, line: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
      }
    }
  }
  
  if (board.every(row => row.every(cell => cell !== 0))) {
    return { winner: 'DRAW', line: [] };
  }

  return { winner: null, line: [] };
};

// Component carte joueur extrait pour éviter les re-rendus
interface SalonPlayerCardProps {
    player: PlayerInfo;
    myId: string | null;
    outgoingInvite: { targetId: string; gameId: string } | null;
    onInvite: (id: string) => void;
    onCancel: () => void;
}

const SalonPlayerCard: React.FC<SalonPlayerCardProps> = ({ player, myId, outgoingInvite, onInvite, onCancel }) => {
    const av = AVATARS_CATALOG.find(a => a.id === player.avatarId);
    const AvatarIcon = av ? av.icon : User;
    const isMe = player.id === myId;
    const isBusy = player.status === 'PLAYING';
    const isInvited = outgoingInvite?.targetId === player.id;
    
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border mb-2 transition-all ${isMe ? 'bg-gray-800/50 border-white/20' : 'bg-black/50 border-white/10 hover:bg-white/5'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMe ? 'bg-neon-pink/20' : 'bg-gray-800'}`}>
                    <AvatarIcon size={20} className={isMe ? 'text-neon-pink' : 'text-gray-400'} />
                </div>
                <div>
                    <p className="font-bold text-white text-sm truncate max-w-[120px]">{player.name} {isMe && "(Moi)"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${isBusy ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{isBusy ? 'EN JEU' : 'DISPONIBLE'}</span>
                    </div>
                </div>
            </div>

            {!isMe && (
                <button 
                    onClick={() => isInvited ? onCancel() : onInvite(player.id)}
                    disabled={isBusy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                        ${isInvited 
                            ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' 
                            : isBusy
                                ? 'bg-gray-800 text-gray-600 border-transparent cursor-not-allowed'
                                : 'bg-neon-blue/20 text-neon-blue border-neon-blue hover:bg-neon-blue hover:text-black'
                        }
                    `}
                >
                    {isInvited ? 'ANNULER' : isBusy ? 'OCCUPÉ' : 'DÉFIER'}
                </button>
            )}
        </div>
    );
};

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins }) => {
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

  // Multiplayer Hook
  const mp = useMultiplayer();
  
  // MATCHMAKING & GAME STATE
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<{from: string, name: string, gameId: string} | null>(null);
  const [outgoingInvite, setOutgoingInvite] = useState<{ targetId: string; gameId: string } | null>(null);
  
  // Identity
  const { username, currentAvatarId } = useCurrency();
  
  // Interaction State
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio
  const { playMove, playLand, playGameOver, playVictory } = audio;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        if (mp.isConnected || mp.peerId) {
            mp.disconnect();
        }
    };
  }, []); 

  // Auto-scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const multiplayerStateRef = useRef({ gameSession, outgoingInvite, incomingInvite, currentPlayer });
  useEffect(() => {
      multiplayerStateRef.current = { gameSession, outgoingInvite, incomingInvite, currentPlayer };
  }, [gameSession, outgoingInvite, incomingInvite, currentPlayer]);


  // Sync Self Info to Multiplayer State
  useEffect(() => {
    if (mp.peerId) {
        mp.updateSelfInfo(username, currentAvatarId);
    }
  }, [mp.peerId, username, currentAvatarId, mp]);

  // Reset Game
  const resetGame = useCallback((sendSync = false) => {
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

    if (sendSync && gameMode === 'ONLINE' && gameSession) {
        mp.sendTo(gameSession.opponentId, { type: 'RESET' });
    }
  }, [mp, gameMode, gameSession]);

  // Handle Mode Change
  const cycleMode = () => {
    if (gameMode === 'PVE') setGameMode('PVP');
    else if (gameMode === 'PVP') {
        setGameMode('ONLINE');
        mp.initializePeer();
        setIsLobbyOpen(true);
        setGameSession(null);
    }
    else {
        setGameMode('PVE');
        mp.disconnect();
        setIsLobbyOpen(false);
        setGameSession(null);
    }
    resetGame();
  };

  // --- AUTO CONNECT LOGIC ---
  useEffect(() => {
    if (gameMode === 'ONLINE' && isLobbyOpen) {
        const shouldConnect = !mp.isConnected && !mp.isHost && !mp.isLoading && !mp.connectionErrorType;
        if (shouldConnect) {
             mp.connectToPeer(mp.GLOBAL_ROOM_ID);
        }
    }
  }, [gameMode, isLobbyOpen, mp.isConnected, mp.isHost, mp.isLoading, mp.connectionErrorType, mp]);

  // Fallback Host on Connection Failure
  useEffect(() => {
    if (gameMode === 'ONLINE' && mp.connectionErrorType === 'PEER_UNAVAILABLE' && !mp.isHost) {
        mp.hostRoom(mp.GLOBAL_ROOM_ID);
    }
  }, [gameMode, mp.connectionErrorType, mp.isHost, mp]);
  
  // Race Condition Handler: If hosting fails because someone else just became host, try connecting again.
  useEffect(() => {
      if (mp.connectionErrorType === 'RACE_CONDITION_RESOLVED') {
          console.log("Race condition resolved. Re-attempting connection to global room.");
          mp.connectToPeer(mp.GLOBAL_ROOM_ID);
      }
  }, [mp.connectionErrorType, mp]);


  // Handle Difficulty Change
  const cycleDifficulty = () => {
    const diffs: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const nextIdx = (diffs.indexOf(difficulty) + 1) % diffs.length;
    setDifficulty(diffs[nextIdx]);
    if (gameMode === 'PVE') resetGame();
  };

  // Drop Piece Logic
  const handleColumnClick = useCallback((colIndex: number, isAi = false, isRemote = false) => {
    const state = multiplayerStateRef.current;
    if (winState.winner || isAnimatingRef.current) return;
    
    if (gameMode === 'PVE' && !isAi && isAiThinking) return;

    if (gameMode === 'ONLINE') {
        if (!state.gameSession) return;
        const isMyTurn = (state.gameSession.isGameHost && state.currentPlayer === 1) || (!state.gameSession.isGameHost && state.currentPlayer === 2);
        if (!isMyTurn && !isRemote) return;
    }
    
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][colIndex] === 0) {
        rowIndex = r;
        break;
      }
    }

    if (rowIndex === -1) return;

    isAnimatingRef.current = true;
    
    const newBoard = board.map(row => [...row]);
    newBoard[rowIndex][colIndex] = currentPlayer;
    setBoard(newBoard);
    
    setAnimatingCell({ r: rowIndex, c: colIndex });
    playMove(); 

    if (gameMode === 'ONLINE' && !isRemote && state.gameSession) {
        mp.sendTo(state.gameSession.opponentId, { type: 'MOVE', col: colIndex });
    }

    animationTimerRef.current = setTimeout(() => {
        playLand();
        setAnimatingCell(null);
        
        const result = checkWinFull(newBoard);
        if (result.winner) {
          setWinState(result);
          
          const isMyWin = gameMode === 'ONLINE' && state.gameSession && (
              (state.gameSession.isGameHost && result.winner === 1) || (!state.gameSession.isGameHost && result.winner === 2)
          ) || (gameMode !== 'ONLINE' && result.winner === 1);

          if (isMyWin) {
              playVictory();
              addCoins(30);
              setEarnedCoins(30);
          } else {
              playGameOver();
          }
        } else {
          setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        }
        isAnimatingRef.current = false;
    }, 500); 

  }, [board, currentPlayer, winState.winner, isAiThinking, playMove, playLand, playGameOver, playVictory, gameMode, addCoins, mp]);

  // Send Reaction
  const sendReaction = useCallback((reactionId: string) => {
      if (gameMode === 'ONLINE' && gameSession) {
          setActiveReaction({ id: reactionId, isMe: true });
          mp.sendTo(gameSession.opponentId, { type: 'REACTION', id: reactionId });
          setTimeout(() => setActiveReaction(null), 3000);
      }
  }, [gameMode, gameSession, mp]);

  // Send Chat
  const sendChat = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || !gameSession) return;
      
      const msg: ChatMessage = {
          id: Date.now(),
          text: chatInput.trim(),
          senderName: username,
          isMe: true,
          timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, msg]);
      mp.sendTo(gameSession.opponentId, { type: 'CHAT', text: msg.text, senderName: username });
      setChatInput('');
  };

  // Invite Logic
  const sendInvite = useCallback((targetId: string) => {
      const gameId = Math.random().toString(36).substring(2, 9);
      setOutgoingInvite({ targetId, gameId });
      mp.sendTo(targetId, { type: 'INVITE', name: username, gameId });
  }, [mp, username]);

  const acceptInvite = useCallback(() => {
    if (!incomingInvite) return;
    const { from, gameId } = incomingInvite;

    mp.sendTo(from, { type: 'ACCEPT_INVITE', gameId });
    mp.updateStatus('PLAYING');
    
    setGameSession({ id: gameId, opponentId: from, isGameHost: false });
    setIsLobbyOpen(false);
    resetGame(false);
    setIncomingInvite(null);
    setOutgoingInvite(null);
    
  }, [mp, resetGame, incomingInvite]);

  const declineInvite = useCallback(() => {
    if (!incomingInvite) return;
    mp.sendTo(incomingInvite.from, { type: 'DECLINE_INVITE' });
    setIncomingInvite(null);
  }, [mp, incomingInvite]);
  
  const cancelInvite = useCallback(() => {
      if (!outgoingInvite) return;
      mp.sendTo(outgoingInvite.targetId, { type: 'DECLINE_INVITE' });
      setOutgoingInvite(null);
  }, [outgoingInvite, mp]);


  // SEND REQUEST INFO (HOST to GUEST) or GUEST INFO (GUEST to HOST)
  useEffect(() => {
    if (gameMode === 'ONLINE' && mp.isConnected && !mp.isHost) {
        mp.sendData({
            type: 'JOIN_INFO',
            name: username,
            avatarId: currentAvatarId
        });
    }
  }, [gameMode, mp.isConnected, mp.isHost, username, currentAvatarId, mp]);

  // Multiplayer Data Handling
  useEffect(() => {
    if (gameMode === 'ONLINE') {
        const handler = (data: any) => {
            const state = multiplayerStateRef.current;
            const sender = data.sender || data.from;

            if (state.gameSession && sender === state.gameSession.opponentId) {
                if (data.type === 'MOVE') handleColumnClick(data.col, false, true);
                if (data.type === 'RESET') resetGame(false);
                if (data.type === 'REACTION') {
                    setActiveReaction({ id: data.id, isMe: false });
                    setTimeout(() => setActiveReaction(null), 3000);
                }
                if (data.type === 'CHAT') {
                    setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
                }
                if (data.type === 'QUIT_GAME') {
                    setGameSession(null); setIsLobbyOpen(true); setChatHistory([]); mp.updateStatus('AVAILABLE'); alert("L'adversaire a quitté la partie.");
                }
            }

            if (data.type === 'INVITE') {
                if (!state.gameSession && !state.incomingInvite) {
                    setIncomingInvite({ from: sender, name: data.name, gameId: data.gameId });
                } else {
                    mp.sendTo(sender, { type: 'BUSY' });
                }
            }
            if (data.type === 'ACCEPT_INVITE') {
                if (state.outgoingInvite && state.outgoingInvite.targetId === sender && state.outgoingInvite.gameId === data.gameId) {
                    mp.updateStatus('PLAYING');
                    setGameSession({ id: data.gameId, opponentId: sender, isGameHost: true });
                    setIsLobbyOpen(false);
                    resetGame();
                    setOutgoingInvite(null);
                }
            }
            if (data.type === 'DECLINE_INVITE') {
                if (state.outgoingInvite && state.outgoingInvite.targetId === sender) {
                    setOutgoingInvite(null); alert("Invitation refusée.");
                }
            }
            if (data.type === 'BUSY') {
                 if (state.outgoingInvite && state.outgoingInvite.targetId === sender) {
                    setOutgoingInvite(null); alert("Ce joueur est déjà en partie.");
                }
            }
            if (data.type === 'REQUEST_INFO') {
                mp.sendData({ type: 'JOIN_INFO', name: username, avatarId: currentAvatarId });
            }
        };
        
        mp.setOnDataReceived(handler);
        return () => mp.setOnDataReceived(null);
    }
  }, [gameMode, mp, handleColumnClick, resetGame, username, currentAvatarId]);


  // AI Turn Handling
  useEffect(() => {
    if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAiThinking && !isAnimatingRef.current) {
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


  const quitOnlineGame = () => {
      if (gameSession) {
          mp.sendTo(gameSession.opponentId, { type: 'QUIT_GAME' });
      }
      setGameSession(null);
      setIsLobbyOpen(true);
      setChatHistory([]);
      mp.updateStatus('AVAILABLE');
  };
  
  // --- RENDER VISUAL FOR REACTION ---
  const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;

      if (reactionId === 'sad') {
          return (
              <div className="relative">
                  <Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} />
                  <div className="absolute top-[22px] left-[13px] w-1.5 h-1.5 bg-blue-300 rounded-full animate-[tear-fall_1s_infinite]"></div>
                  <div className="absolute top-[22px] right-[13px] w-1.5 h-1.5 bg-blue-300 rounded-full animate-[tear-fall_1s_infinite_0.5s]"></div>
                  <style>{`
                    @keyframes tear-fall {
                        0% { top: 22px; opacity: 1; transform: scale(1); }
                        80% { top: 45px; opacity: 0; transform: scale(0.5); }
                        100% { top: 45px; opacity: 0; }
                    }
                  `}</style>
              </div>
          );
      }

      if (reactionId === 'happy') {
        return (
            <div className="relative animate-[grow-laugh_0.8s_ease-in-out_infinite]">
                <Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} />
                <style>{`
                  @keyframes grow-laugh {
                      0%, 100% { transform: scale(1) rotate(-5deg); }
                      50% { transform: scale(1.3) rotate(5deg); }
                  }
                `}</style>
            </div>
        );
      }

      if (reactionId === 'angry') {
        return (
            <div className="relative animate-[shake_0.3s_linear_infinite]">
                <Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} />
                <div className={`absolute top-[14px] left-[10px] w-3 h-1 ${color.replace('text-', 'bg-')} rotate-[30deg] rounded-full shadow-[0_0_5px_currentColor]`}></div>
                <div className={`absolute top-[14px] right-[10px] w-3 h-1 ${color.replace('text-', 'bg-')} -rotate-[30deg] rounded-full shadow-[0_0_5px_currentColor]`}></div>
                 <style>{`
                  @keyframes shake {
                      0% { transform: translate(1px, 1px) rotate(0deg); }
                      25% { transform: translate(-1px, -2px) rotate(-1deg); }
                      50% { transform: translate(-3px, 0px) rotate(1deg); }
                      75% { transform: translate(3px, 2px) rotate(0deg); }
                      100% { transform: translate(1px, -1px) rotate(-1deg); }
                  }
                `}</style>
            </div>
        );
      }
      
      if (reactionId === 'love') return <div className="relative animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]"><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
      if (reactionId === 'wave') return <div className="relative animate-[wave_1s_ease-in-out_infinite]"><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /><style>{`@keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-20deg); } 75% { transform: rotate(20deg); } }`}</style></div>;

      return <div className="animate-bounce"><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
  };


  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
       <style>{`
            @keyframes dropIn {
                0% { transform: translateY(var(--drop-start)); opacity: 1; }
                100% { transform: translateY(0); opacity: 1; }
            }
       `}</style>

       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-transparent pointer-events-none"></div>

       {/* Header */}
       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
         <div className="z-20 relative">
             <button onClick={() => { mp.disconnect(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                <ArrowLeft size={20} />
             </button>
         </div>
         
         <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full">
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)] truncate">
                 NEON CONNECT
             </h1>
         </div>

         <div className="z-20 relative min-w-[40px] flex justify-end">
            {(gameMode !== 'ONLINE' || gameSession) && (
                <button onClick={() => resetGame(true)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                    <RefreshCw size={20} />
                </button>
            )}
         </div>
       </div>

       {/* Game Controls / Status */}
       <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button 
                onClick={cycleMode}
                disabled={gameMode === 'ONLINE' && !!gameSession} // Lock mode change during online game
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-white/10 text-xs font-bold hover:bg-gray-800 transition-colors min-w-[110px] disabled:opacity-50"
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
              <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${mp.isConnected ? 'bg-green-900/30 border-green-500 text-green-400 animate-pulse' : 'bg-yellow-900/30 border-yellow-500 text-yellow-400'}`}>
                  {mp.isConnected ? 'CONNECTÉ' : 'RECHERCHE...'}
              </div>
          ) : <div className="w-[80px]"></div>}
       </div>
       
       {/* INCOMING INVITE MODAL */}
       {incomingInvite && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
               <div className="bg-gray-900 border-2 border-neon-blue rounded-2xl p-6 max-w-xs w-full shadow-[0_0_30px_rgba(0,243,255,0.3)] text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-transparent pointer-events-none"></div>
                   <Swords size={48} className="text-neon-blue mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-white mb-1">{incomingInvite.name}</h3>
                   <p className="text-gray-400 text-sm mb-6">te défie en duel !</p>
                   <div className="flex gap-3">
                       <button onClick={declineInvite} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold border border-white/10 hover:bg-gray-700 transition-colors">REFUSER</button>
                       <button onClick={acceptInvite} className="flex-1 py-3 rounded-xl bg-neon-blue text-black font-bold hover:bg-white transition-colors shadow-[0_0_15px_#00f3ff]">ACCEPTER</button>
                   </div>
               </div>
           </div>
       )}

       {/* ONLINE LOBBY (PLAYER FINDER) */}
       {gameMode === 'ONLINE' && isLobbyOpen && (
           <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md overflow-y-auto touch-pan-y flex flex-col items-center pt-24 pb-20 animate-in fade-in duration-300">
               <h2 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 mb-2 text-center tracking-wide">TROUVER UN ADVERSAIRE</h2>
               
                {!mp.isConnected && !mp.isHost ? (
                    <div className="flex flex-col items-center gap-4 mt-10">
                        {mp.error ? (
                            <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-center max-w-xs">
                                <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                                <p className="font-bold">{mp.error}</p>
                                <button 
                                    onClick={() => { mp.disconnect(); mp.connectToPeer(mp.GLOBAL_ROOM_ID); }}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-500"
                                >
                                    RÉESSAYER
                                </button>
                            </div>
                        ) : (
                            <>
                                <Loader2 size={48} className="text-neon-blue animate-spin" />
                                <p className="text-gray-400 animate-pulse text-sm">Connexion au salon...</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="w-full max-w-md px-4 mt-4">
                        <div className="flex flex-col gap-1 pb-20">
                            {mp.players.map((p) => (
                                <SalonPlayerCard 
                                    key={p.id} 
                                    player={p} 
                                    myId={mp.peerId}
                                    outgoingInvite={outgoingInvite}
                                    onInvite={sendInvite}
                                    onCancel={cancelInvite}
                                />
                            ))}
                            {mp.players.length === 1 && (
                                <div className="text-center py-10 text-gray-500 italic">
                                    <p>En attente d'autres joueurs...</p>
                                    <div className="mt-4 animate-spin w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full mx-auto"></div>
                                </div>
                            )}
                        </div>
                    </div>
               )}

               <button onClick={() => { setGameMode('PVE'); mp.disconnect(); setIsLobbyOpen(false); }} className="absolute bottom-6 text-gray-500 text-xs underline hover:text-white">
                   Quitter le mode en ligne
               </button>
           </div>
       )}

       {/* Turn Indicator (Only if not in lobby) */}
       {!winState.winner && !isLobbyOpen && (
            <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
                currentPlayer === 1 
                    ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                    : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
            }`}>
                <CircleDot size={12} className={isAiThinking ? 'animate-spin' : ''} /> 
                {gameMode === 'ONLINE' ? (
                    gameSession ? (
                        (gameSession.isGameHost && currentPlayer === 1) || (!gameSession.isGameHost && currentPlayer === 2) 
                        ? "C'EST TON TOUR !" 
                        : "L'ADVERSAIRE RÉFLÉCHIT..."
                    ) : "EN ATTENTE..."
                ) : (
                    isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR JOUEUR ${currentPlayer}`
                )}
            </div>
       )}

       {/* Game Board */}
       <div className={`relative z-10 p-2 sm:p-4 bg-black/60 rounded-2xl border-4 border-gray-800 shadow-2xl backdrop-blur-md transition-opacity duration-500 ${(gameMode === 'ONLINE' && !gameSession) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           
           {activeReaction && (() => {
               const reaction = REACTIONS.find(r => r.id === activeReaction.id);
               if (!reaction) return null;
               const positionClass = activeReaction.isMe ? 'bottom-[-20px] right-[-20px] sm:right-[-40px]' : 'top-[-20px] left-[-20px] sm:left-[-40px]';
               return (
                   <div className={`absolute z-50 pointer-events-none ${positionClass}`}>
                       <div className="bg-black/90 rounded-full p-3 border-2 border-white/20 backdrop-blur-md shadow-2xl">
                           {renderReactionVisual(reaction.id, reaction.color)}
                       </div>
                   </div>
               );
           })()}

           <div className="grid grid-cols-7 gap-1 sm:gap-3 relative">
               <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div key={`col-${c}`} onClick={() => handleColumnClick(c)} className={`h-full transition-colors rounded-full ${winState.winner || isAnimatingRef.current ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}/>
                    ))}
               </div>
               {Array.from({ length: COLS }).map((_, c) => (
                   <div key={c} className="flex flex-col gap-1 sm:gap-3">
                       {Array.from({ length: ROWS }).map((_, r) => {
                           const val = board[r][c];
                           const isWinningPiece = winState.line.some(([wr, wc]) => wr === r && wc === c);
                           const isAnimating = animatingCell?.r === r && animatingCell?.c === c;
                           const animationStyle: React.CSSProperties = isAnimating ? {
                                animation: 'dropIn 0.5s cubic-bezier(0.6, -0.28, 0.735, 0.045)',
                                '--drop-start': `-${r * 110}%`, 
                                zIndex: 50,
                                position: 'relative'
                           } as React.CSSProperties : {};

                           return (
                               <div key={`${r}-${c}`} className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/60 shadow-inner flex items-center justify-center border border-white/5">
                                   {val !== 0 && (
                                       <div 
                                            style={animationStyle}
                                            className={`w-full h-full rounded-full transition-all duration-500 shadow-lg ${
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

       {/* REACTION & CHAT BAR (Only for Online & In Game) */}
       {gameMode === 'ONLINE' && gameSession && !winState.winner && (
            <div className="w-full max-w-lg mt-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 z-20">
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

                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                    {chatHistory.length === 0 && <div className="text-gray-600 text-xs italic text-center py-2">Aucun message</div>}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[85%]`}>
                                {!msg.isMe && <span className="text-[8px] text-gray-500 ml-1 mb-0.5">{msg.senderName}</span>}
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold break-words ${msg.isMe ? 'bg-neon-pink/20 text-pink-100 border border-neon-pink/30' : 'bg-neon-blue/20 text-cyan-100 border border-neon-blue/30'}`}>
                                    {msg.text}
                                </div>
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
                    <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 flex items-center justify-center bg-neon-blue text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Send size={18} />
                    </button>
                </form>
            </div>
       )}
       
       {/* Quit Button (In Game) */}
       {gameMode === 'ONLINE' && gameSession && (
            <button onClick={quitOnlineGame} className="mt-2 text-xs text-red-400 underline hover:text-red-300 z-10">
                Quitter la partie
            </button>
       )}

        {/* Victory/Draw Actions */}
        {winState.winner && (
             <div className="absolute bottom-10 z-30 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                 {(winState.winner !== 'DRAW' && gameMode === 'ONLINE' && gameSession && ((gameSession.isGameHost && winState.winner === 1) || (!gameSession.isGameHost && winState.winner === 2)) || (gameMode !== 'ONLINE' && winState.winner === 1)) && (
                    <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="text-yellow-100 font-bold">+30 PIÈCES</span>
                    </div>
                 )}
                <div className="bg-black/80 px-6 py-2 rounded-full border border-white/20 mb-4">
                    <span className="text-xl font-black italic">
                        {winState.winner === 'DRAW' 
                            ? "MATCH NUL" 
                            : gameMode === 'ONLINE' && gameSession
                                ? ((gameSession.isGameHost && winState.winner === 1) || (!gameSession.isGameHost && winState.winner === 2) ? "TU AS GAGNÉ !" : "TU AS PERDU...")
                                : `VICTOIRE JOUEUR ${winState.winner} !`
                        }
                    </span>
                </div>
                {(gameMode !== 'ONLINE' || (gameSession && gameSession.isGameHost)) && (
                    <button
                        onClick={() => resetGame(true)}
                        className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
                    >
                        <Play size={20} fill="black"/> REJOUER
                    </button>
                )}
                {gameMode === 'ONLINE' && gameSession && !gameSession.isGameHost && (
                    <div className="text-xs text-gray-500 animate-pulse">
                        En attente de l'hôte pour rejouer...
                    </div>
                )}
                
                {gameMode === 'ONLINE' && (
                     <button onClick={quitOnlineGame} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-full border border-white/10 hover:bg-gray-700">
                         RETOUR AU SALON
                     </button>
                )}
             </div>
        )}
    </div>
  );
};
