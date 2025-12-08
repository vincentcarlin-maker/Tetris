
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, CircleDot, Coins, Home, Play, Users, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, Loader2, Globe, Trophy } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>;
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

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

// Helpers
const createBoard = (): BoardState => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinFull = (board: BoardState): WinState => {
    const directions = [
        { r: 0, c: 1 },  // Horizontal
        { r: 1, c: 0 },  // Vertical
        { r: 1, c: 1 },  // Diagonal \ (Down-Right)
        { r: 1, c: -1 }  // Diagonal / (Down-Left)
    ];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const player = board[r][c];
            if (player === 0) continue;

            for (const { r: dr, c: dc } of directions) {
                if (
                    r + 3 * dr < ROWS && r + 3 * dr >= 0 &&
                    c + 3 * dc < COLS && c + 3 * dc >= 0
                ) {
                    if (
                        board[r + dr][c + dc] === player &&
                        board[r + 2 * dr][c + 2 * dc] === player &&
                        board[r + 3 * dr][c + 3 * dc] === player
                    ) {
                        return {
                            winner: player,
                            line: [
                                [r, c],
                                [r + dr, c + dc],
                                [r + 2 * dr, c + 2 * dc],
                                [r + 3 * dr, c + 3 * dc]
                            ]
                        };
                    }
                }
            }
        }
    }
    
    if (board.every(row => row.every(cell => cell !== 0))) {
        return { winner: 'DRAW', line: [] };
    }

    return { winner: null, line: [] };
};

type GameStage = 'MENU' | 'DIFFICULTY' | 'GAME';

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp }) => {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const boardRef = useRef<BoardState>(createBoard());
  
  const [gameStage, setGameStage] = useState<GameStage>('MENU');
  
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Online State
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  // Identity
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();

  // Animation State
  const [animatingCell, setAnimatingCell] = useState<{r: number, c: number} | null>(null);
  const isAnimatingRef = useRef(false);
  const animationTimerRef = useRef<any>(null);

  // Audio
  const { playMove, playLand, playGameOver, playVictory, resumeAudio } = audio;
  
  useEffect(() => {
      return () => {
          if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
          isAnimatingRef.current = false;
      };
  }, []);

  useEffect(() => {
      boardRef.current = board;
  }, [board]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Sync Self Info for Online
  useEffect(() => {
      mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

  // Handle Online Connection
  useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
            setOpponentLeft(false);
        }
        return () => mp.disconnect();
  }, [gameMode]);

  // Handle Lobby/Game Transitions
  useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (gameStage === 'GAME') resetGame();
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (gameStage !== 'GAME') {
                setGameStage('GAME');
                resetGame();
            }
        }
  }, [mp.mode, mp.isHost, mp.players, mp.peerId, gameStage]);

  // Handle Network Data
  useEffect(() => {
      const unsubscribe = mp.subscribe((data: any) => {
          if (data.type === 'CONNECT4_MOVE') {
              dropPiece(data.col, true); // Remote move
          }
          if (data.type === 'CONNECT4_RESTART') {
              resetGame();
          }
          if (data.type === 'CHAT') {
              setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
          }
          if (data.type === 'REACTION') {
              setActiveReaction({ id: data.id, isMe: false });
              setTimeout(() => setActiveReaction(null), 3000);
          }
          if (data.type === 'LEAVE_GAME') {
              setOpponentLeft(true);
              setWinState({ winner: null, line: [] }); // Reset winner or handle as forfeit
          }
      });
      return () => unsubscribe();
  }, [mp]);

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

  const initGame = (mode: GameMode, diff?: Difficulty) => {
      setGameMode(mode);
      if (diff) setDifficulty(diff);
      
      if (mode === 'PVE') {
          setGameStage('GAME');
          resetGame();
      } else {
          // Online mode handles transitions via effects
      }
  };

  const resetGame = () => {
      setBoard(createBoard());
      setWinState({ winner: null, line: [] });
      setCurrentPlayer(1);
      setIsAiThinking(false);
      setEarnedCoins(0);
      setOpponentLeft(false);
      if (gameMode === 'ONLINE' && mp.isHost) {
          mp.sendData({ type: 'CONNECT4_RESTART' });
      }
  };

  const checkGameStatus = (currentBoard: BoardState) => {
      const result = checkWinFull(currentBoard);
      if (result.winner) {
          setWinState(result);
          if (result.winner === 1 && gameMode === 'PVE') {
              playVictory();
              const reward = difficulty === 'HARD' ? 50 : difficulty === 'MEDIUM' ? 30 : 10;
              addCoins(reward);
              setEarnedCoins(reward);
          } else if (result.winner === 'DRAW') {
              playGameOver();
          } else if (gameMode === 'ONLINE') {
              // Online Logic
              const amIP1 = mp.amIP1;
              const iWon = (amIP1 && result.winner === 1) || (!amIP1 && result.winner === 2);
              if (iWon) {
                  playVictory();
                  addCoins(50);
                  setEarnedCoins(50);
              } else {
                  playGameOver();
              }
          } else {
              playGameOver();
          }
      }
  };

  const dropPiece = useCallback((col: number, isRemote = false) => {
      if (winState.winner || isAnimatingRef.current) return;
      if (gameMode === 'PVE' && isAiThinking) return;
      
      // Online Turn Check
      if (gameMode === 'ONLINE' && !isRemote) {
          if (!mp.isMyTurn) return; // Not my turn
          mp.sendGameMove(col); // Send move to opponent
      }

      setBoard(prev => {
          const newBoard = prev.map(row => [...row]);
          let row = -1;
          // Find lowest empty spot
          for (let r = ROWS - 1; r >= 0; r--) {
              if (newBoard[r][col] === 0) {
                  row = r;
                  break;
              }
          }

          if (row === -1) return prev; // Column full

          // Animation Start
          isAnimatingRef.current = true;
          setAnimatingCell({ r: row, c: col });
          
          // Animate logic via timeout (visual only)
          // Ideally we would animate dropping through rows, but for simplicity we place it.
          // Let's do a quick fake drop animation or just sound
          playMove();

          newBoard[row][col] = currentPlayer;
          
          // Finish Move Logic
          animationTimerRef.current = setTimeout(() => {
              playLand();
              setAnimatingCell(null);
              isAnimatingRef.current = false;
              checkGameStatus(newBoard);
              setCurrentPlayer(prev => prev === 1 ? 2 : 1);
          }, 300); // 300ms drop time simulation

          return newBoard;
      });
  }, [currentPlayer, winState, gameMode, isAiThinking, mp, playMove, playLand]);

  // AI Turn
  useEffect(() => {
      if (gameMode === 'PVE' && currentPlayer === 2 && !winState.winner && !isAnimatingRef.current) {
          setIsAiThinking(true);
          const timer = setTimeout(() => {
              const col = getBestMove(board, difficulty);
              setIsAiThinking(false);
              dropPiece(col);
          }, 700);
          return () => clearTimeout(timer);
      }
  }, [currentPlayer, gameMode, winState, board, difficulty, dropPiece]);

  // --- RENDER HELPERS ---
  const renderCell = (r: number, c: number, value: number) => {
      const isWinCell = winState.line.some(([wr, wc]) => wr === r && wc === c);
      let colorClass = 'bg-gray-900/50 border-white/5';
      if (value === 1) colorClass = 'bg-pink-500 shadow-[0_0_15px_#ec4899] border-pink-400';
      if (value === 2) colorClass = 'bg-cyan-500 shadow-[0_0_15px_#06b6d4] border-cyan-400';
      
      const animateClass = (animatingCell?.r === r && animatingCell?.c === c) ? 'animate-bounce' : '';
      const highlightClass = isWinCell ? 'ring-4 ring-white animate-pulse z-10' : '';

      return (
          <div 
            key={`${r}-${c}`} 
            className="w-full h-full p-1 sm:p-2"
            onClick={() => dropPiece(c)}
          >
              <div className={`w-full h-full rounded-full border-4 transition-all duration-300 ${colorClass} ${animateClass} ${highlightClass}`}>
                  {/* Inner shine */}
                  {value !== 0 && <div className="w-1/3 h-1/3 bg-white/30 rounded-full ml-1 mt-1 blur-[1px]"></div>}
              </div>
          </div>
      );
  };

  const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
  };

  // --- MENU RENDER ---
  if (gameStage === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#ec4899]">CONNECT 4</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => setGameStage('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Cpu size={24} className="text-neon-blue"/> VS ORDI
                </button>
                <button onClick={() => initGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
  }

  // --- DIFFICULTY RENDER ---
  if (gameStage === 'DIFFICULTY') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h2 className="text-3xl font-black text-white mb-8">DIFFICULTÉ</h2>
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                <button onClick={() => initGame('PVE', 'EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                <button onClick={() => initGame('PVE', 'MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                <button onClick={() => initGame('PVE', 'HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
            </div>
            <button onClick={() => setGameStage('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
        </div>
      );
  }

  // --- LOBBY RENDER ---
  if (gameMode === 'ONLINE' && onlineStep !== 'game') {
      const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
      
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={() => { mp.disconnect(); setGameStage('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 pr-2 pb-1">LOBBY CONNECT 4</h1>
                <div className="w-10"></div>
            </div>
            {onlineStep === 'connecting' ? (
                <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-pink-400 animate-spin mb-4" /><p className="text-pink-300 font-bold">CONNEXION...</p></div>
            ) : (
                <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                     <div className="flex flex-col gap-3 mb-4">
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
                        ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie disponible...</p>}
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- GAME RENDER ---
  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-2">
        <style>{`.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }`}</style>
        
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

        {activeReaction && (() => {
            const reaction = REACTIONS.find(r => r.id === activeReaction.id);
            if (!reaction) return null;
            const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
            const anim = reaction.anim || 'animate-bounce';
            return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
        })()}

        <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
            <button onClick={() => { if(gameMode==='ONLINE') mp.leaveGame(); else setGameStage('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
            <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.4)] pr-2 pb-1">CONNECT 4</h1>
            <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else resetGame(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
        </div>

        {gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                <Loader2 size={48} className="text-pink-400 animate-spin mb-4" />
                <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
            </div>
        )}

        <div className="w-full max-w-lg flex justify-between items-center mb-2 z-10 px-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${currentPlayer === 1 ? 'bg-pink-500/20 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-gray-800/50 border-transparent'}`}>
                <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_5px_#ec4899]"></div>
                <span className={`text-xs font-bold ${currentPlayer === 1 ? 'text-pink-200' : 'text-gray-500'}`}>{gameMode === 'ONLINE' ? (mp.amIP1 ? 'TOI' : 'ADV') : 'JOUEUR 1'}</span>
            </div>
            {winState.winner ? (
                <div className="text-xl font-black text-yellow-400 animate-bounce">{winState.winner === 'DRAW' ? 'MATCH NUL' : 'VICTOIRE !'}</div>
            ) : (
                <div className="text-xs text-gray-400 font-mono tracking-widest">{gameMode === 'ONLINE' ? (mp.isMyTurn ? "À TOI !" : "TOUR ADV...") : (currentPlayer === 1 ? "TOUR J1" : "TOUR J2")}</div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${currentPlayer === 2 ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-gray-800/50 border-transparent'}`}>
                <span className={`text-xs font-bold ${currentPlayer === 2 ? 'text-cyan-200' : 'text-gray-500'}`}>{gameMode === 'ONLINE' ? (!mp.amIP1 ? 'TOI' : 'ADV') : (gameMode === 'PVE' ? 'ORDI' : 'JOUEUR 2')}</span>
                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4]"></div>
            </div>
        </div>

        {/* Game Board */}
        <div className="relative w-full max-w-md aspect-[7/6] bg-blue-900/30 border-4 border-blue-500/50 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.2)] p-2 backdrop-blur-md z-10">
            <div className="w-full h-full grid grid-cols-7 grid-rows-6">
                {board.map((row, r) => row.map((val, c) => renderCell(r, c, val)))}
            </div>
            {/* Click zones overlay for columns */}
            {!winState.winner && (
                <div className="absolute inset-0 grid grid-cols-7 z-20">
                    {Array.from({ length: 7 }).map((_, c) => (
                        <div key={c} className="h-full cursor-pointer hover:bg-white/5 transition-colors" onClick={() => dropPiece(c)} />
                    ))}
                </div>
            )}
        </div>

        {gameMode === 'ONLINE' && !opponentLeft && (
            <div className="w-full max-w-lg mt-auto z-20 px-2 flex flex-col gap-2 pb-4 pt-2">
                <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                    {REACTIONS.map(reaction => {
                        const Icon = reaction.icon;
                        return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                    })}
                </div>
                <div className="flex flex-col gap-1 max-h-16 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${msg.isMe ? 'bg-purple-500/20 text-purple-100' : 'bg-gray-700/50 text-gray-300'}`}>{!msg.isMe && <span className="mr-1 opacity-50">{msg.senderName}:</span>}{msg.text}</div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-2">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                    <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-xl disabled:opacity-50"><Send size={14} /></button>
                </form>
            </div>
        )}

        {(winState.winner || opponentLeft) && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
                {opponentLeft ? (
                    <>
                        <LogOut size={64} className="text-red-500 mb-4" />
                        <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                    </>
                ) : (
                    <>
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                        <h2 className="text-4xl font-black italic text-white mb-2 text-center">
                            {winState.winner === 'DRAW' ? 'MATCH NUL' : (gameMode === 'ONLINE' ? ((mp.amIP1 && winState.winner === 1) || (!mp.amIP1 && winState.winner === 2) ? "TU AS GAGNÉ !" : "DÉFAITE...") : (winState.winner === 1 ? "VICTOIRE !" : "DÉFAITE..."))}
                        </h2>
                    </>
                )}
                
                {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                
                <div className="flex gap-4 mt-4">
                    <button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else resetGame(); }} className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-500 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
                        <RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}
                    </button>
                    <button onClick={() => { if(gameMode==='ONLINE') mp.leaveGame(); setGameStage('MENU'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">MENU</button>
                </div>
            </div>
        )}
    </div>
  );
};
