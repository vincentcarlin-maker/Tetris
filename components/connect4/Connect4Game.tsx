
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, CircleDot, Coins, Home, Play, Users, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, Loader2, Globe } from 'lucide-react';
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
        { r: 1, c: 1 },  // Diagonal Bas-Droite
        { r: 1, c: -1 }  // Diagonal Bas-Gauche
    ];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const player = board[r][c];
            if (player === 0) continue;

            for (const { r: dr, c: dc } of directions) {
                let line: [number, number][] = [[r, c]];
                let match = true;

                for (let i = 1; i < 4; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;

                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) {
                        match = false;
                        break;
                    }
                    line.push([nr, nc]);
                }

                if (match) {
                    return { winner: player as Player, line };
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

  // Handle Multiplayer Mode Transition
  useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (board.some(r => r.some(c => c !== 0))) resetGame(); // Reset board if returning to lobby
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
        }
  }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

  
  // Game Logic Helper (Defined early to be used in refs)
  const resetGame = useCallback(() => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    isAnimatingRef.current = false;
    
    const newBoard = createBoard();
    setBoard(newBoard);
    boardRef.current = newBoard; 
    
    setCurrentPlayer(1);
    setWinState({ winner: null, line: [] });
    setIsAiThinking(false);
    setEarnedCoins(0);
    setAnimatingCell(null);
    setOpponentLeft(false);
  }, []);

  // Main Game Action
  const handleColumnClick = useCallback((colIndex: number, isRemoteMove = false) => {
    if (winState.winner || isAnimatingRef.current || opponentLeft) return;
    
    // Online Turn Check
    if (gameMode === 'ONLINE' && !isRemoteMove) {
        if (!mp.gameOpponent) return; // Wait for opponent
        const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
        if (!isMyTurn) return; // Not my turn
    }

    if (gameMode === 'PVE' && isAiThinking && !isRemoteMove) return;
    
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (boardRef.current[r][colIndex] === 0) {
        rowIndex = r;
        break;
      }
    }

    if (rowIndex === -1) return;

    // Send Move Online if local player played
    if (gameMode === 'ONLINE' && !isRemoteMove) {
        mp.sendGameMove({ col: colIndex });
    }

    const newBoard = boardRef.current.map(row => [...row]);
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
          
          const isMeP1 = mp.amIP1;
          const didIWin = gameMode === 'ONLINE' ? ((isMeP1 && result.winner === 1) || (!isMeP1 && result.winner === 2)) : (result.winner === 1);

          if (didIWin) { 
              playVictory();
              let reward = 10;
              if (gameMode === 'PVE') {
                  if (difficulty === 'EASY') reward = 5;
                  else if (difficulty === 'MEDIUM') reward = 15;
                  else if (difficulty === 'HARD') reward = 30;
              }
              if (gameMode === 'PVP') reward = 5; 
              if (gameMode === 'ONLINE') reward = 50;
              
              addCoins(reward);
              setEarnedCoins(reward);
          } else {
              if (gameMode === 'PVP') playVictory(); 
              else playGameOver(); 
          }
        } else {
          // Switch Player
          // Logic: 1 -> 2, 2 -> 1
          setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        }
        isAnimatingRef.current = false;
    }, 500); 

  }, [currentPlayer, winState.winner, isAiThinking, playMove, playLand, playGameOver, playVictory, gameMode, difficulty, addCoins, mp, opponentLeft]);

  // STABLE SUBSCRIPTION REF
  const handleDataRef = useRef<(data: any) => void>(null);
  
  useEffect(() => {
      handleDataRef.current = (data: any) => {
        if (data.type === 'GAME_MOVE') {
            const col = data.col;
            handleColumnClick(col, true);
        }
        if (data.type === 'REMATCH_START') resetGame();
        if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
        if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
        if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setWinState({ winner: null, line: [] }); }
      };
  }); // No deps -> updates on every render

  // Multiplayer Subscription - RUNS ONCE
  useEffect(() => {
    const unsubscribe = mp.subscribe((data: any) => {
        if (handleDataRef.current) {
            handleDataRef.current(data);
        }
    });
    return () => unsubscribe();
  }, [mp.subscribe]);

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
        } catch (e) {
            console.error("AI Error", e);
        }
        setIsAiThinking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isAiThinking, board, difficulty, handleColumnClick]);

  // --- ACTIONS SOCIALES ---
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

  const handleOpponentLeftAction = (action: 'lobby' | 'wait') => {
        if (action === 'lobby') {
            mp.leaveGame(); 
            setGameMode('ONLINE');
            setOnlineStep('lobby');
        } else {
            mp.leaveGame(); 
            mp.createRoom(); 
        }
        setOpponentLeft(false);
  };

  const handleLocalBack = () => {
      if (gameStage === 'DIFFICULTY') setGameStage('MENU');
      else if (gameStage === 'GAME') {
          if (gameMode === 'ONLINE') {
              mp.leaveGame();
              setGameStage('MENU');
          } else {
              setGameStage('MENU');
          }
      } else {
          onBack();
      }
  };

  const startGame = (mode: GameMode, diff?: Difficulty) => {
      setGameMode(mode);
      if (diff) setDifficulty(diff);
      resetGame();
      setGameStage('GAME');
      resumeAudio();
  };

  const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-pink-300 tracking-wider drop-shadow-md">LOBBY PUISSANCE 4</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
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
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
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
  };

  // --- LOBBY VIEW ---
  if (gameMode === 'ONLINE' && onlineStep === 'lobby' && gameStage === 'GAME') {
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 pr-2 pb-1">PUISSANCE 4</h1>
                <div className="w-10"></div>
            </div>
            {renderLobby()}
        </div>
      );
  }

  // --- MENU VIEW ---
  if (gameStage === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#d946ef]">PUISSANCE 4</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => setGameStage('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Cpu size={24} className="text-neon-blue"/> 1 JOUEUR
                </button>
                <button onClick={() => startGame('PVP')} className="px-6 py-4 bg-gray-800 border-2 border-neon-pink text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Users size={24} className="text-neon-pink"/> 2 JOUEURS (LOCAL)
                </button>
                <button onClick={() => startGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
  }

  // --- DIFFICULTY VIEW ---
  if (gameStage === 'DIFFICULTY') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h2 className="text-3xl font-black text-white mb-8">DIFFICULTÉ</h2>
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                <button onClick={() => startGame('PVE', 'EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                <button onClick={() => startGame('PVE', 'MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                <button onClick={() => startGame('PVE', 'HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
            </div>
            <button onClick={() => setGameStage('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
        </div>
      );
  }

  // --- GAME VIEW ---
  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
       <style>{`@keyframes dropIn { 0% { transform: translateY(var(--drop-start)); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }`}</style>

       <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-transparent pointer-events-none"></div>

       {/* REACTION DISPLAY */}
       {activeReaction && (() => {
            const reaction = REACTIONS.find(r => r.id === activeReaction.id);
            if (!reaction) return null;
            const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
            const anim = reaction.anim || 'animate-bounce';
            return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
       })()}

       <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
         <div className="z-20 relative">
             <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                <ArrowLeft size={20} />
             </button>
         </div>
         <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full">
            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)] pr-2 pb-1">NEON CONNECT</h1>
         </div>
         <div className="z-20 relative min-w-[40px] flex justify-end">
            <button onClick={() => resetGame()} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                <RefreshCw size={20} />
            </button>
         </div>
       </div>

       {/* ONLINE STATUS INDICATOR */}
       {gameMode === 'ONLINE' && !winState.winner && (
            <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors bg-gray-900 border-white/20`}>
                {!mp.gameOpponent ? (
                    <span className="flex items-center gap-2 text-gray-400"><Loader2 size={12} className="animate-spin"/> EN ATTENTE...</span>
                ) : (
                    <>
                        <div className={`w-2 h-2 rounded-full ${currentPlayer === 1 ? 'bg-neon-pink shadow-[0_0_5px_#ff00ff]' : 'bg-neon-blue shadow-[0_0_5px_#00f3ff]'}`}></div>
                        <span className={currentPlayer === 1 ? 'text-neon-pink' : 'text-neon-blue'}>
                            {((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2)) ? "C'EST TON TOUR" : "L'ADVERSAIRE JOUE..."}
                        </span>
                    </>
                )}
            </div>
       )}

       {/* PVE STATUS */}
       {gameMode !== 'ONLINE' && !winState.winner && (
            <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
                currentPlayer === 1 
                    ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                    : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
            }`}>
                <CircleDot size={12} className={isAiThinking ? 'animate-spin' : ''} /> 
                {isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR JOUEUR ${currentPlayer}`}
            </div>
       )}

       <div className={`relative z-10 p-2 sm:p-4 bg-black/60 rounded-2xl border-4 border-gray-700/80 shadow-2xl backdrop-blur-md w-full max-w-lg aspect-[7/6]`}>
            {/* WAITING OVERLAY */}
            {gameMode === 'ONLINE' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-4">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-colors">ANNULER</button>
                </div>
            )}

            <div className="grid grid-cols-7 gap-1 sm:gap-3 relative">
                <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                        {Array.from({ length: COLS }).map((_, c) => <div key={`col-${c}`} onClick={() => handleColumnClick(c)} className={`h-full transition-colors rounded-full ${winState.winner || isAnimatingRef.current || (gameMode === 'ONLINE' && !mp.gameOpponent) ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}/>)}
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
       </div>

       {/* CHAT & REACTIONS (ONLINE ONLY) */}
       {gameMode === 'ONLINE' && !winState.winner && !opponentLeft && mp.gameOpponent && (
            <div className="w-full max-w-lg mt-2 flex flex-col gap-2 z-20 px-2 shrink-0">
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
                    <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-neon-blue text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                </form>
            </div>
       )}

        {/* WIN / GAMEOVER / OPPONENT LEFT OVERLAY */}
        {(winState.winner || opponentLeft) && (
             <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
                 {opponentLeft ? (
                     <>
                        <LogOut size={64} className="text-red-500 mb-4" />
                        <h2 className="text-3xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
                            <button onClick={() => handleOpponentLeftAction('wait')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"><Users size={18} /> ATTENDRE UN JOUEUR</button>
                            <button onClick={() => handleOpponentLeftAction('lobby')} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={18} /> RETOUR AU LOBBY</button>
                        </div>
                     </>
                 ) : (
                     <>
                        {(winState.winner !== 'DRAW' && earnedCoins > 0) && <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                        <div className="bg-black/80 px-6 py-2 rounded-full border border-white/20 mb-4">
                            <span className="text-xl font-black italic">
                                {winState.winner === 'DRAW' ? "MATCH NUL" : 
                                 gameMode === 'ONLINE' ? 
                                    ((mp.amIP1 && winState.winner === 1) || (!mp.amIP1 && winState.winner === 2) ? "TU AS GAGNÉ !" : "L'ADVERSAIRE A GAGNÉ") 
                                    : `VICTOIRE JOUEUR ${winState.winner} !`}
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : resetGame} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"><Play size={20} fill="black"/> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                            {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                        </div>
                        {gameMode !== 'ONLINE' && <button onClick={handleLocalBack} className="mt-4 text-xs text-gray-400 underline hover:text-white">Retour au Menu</button>}
                     </>
                 )}
             </div>
        )}
    </div>
  );
};
