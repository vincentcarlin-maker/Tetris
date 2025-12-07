
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Users, User, Globe, Play, LogOut, Cpu } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { BoardState, Player, WinState, Difficulty, GameMode } from './types';
import { checkWin, getBestMove } from './ai';

interface Connect4GameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

const ROWS = 6;
const COLS = 7;

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp }) => {
    const [board, setBoard] = useState<BoardState>(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [winningLine, setWinningLine] = useState<[number, number][]>([]);
    
    const [gameMode, setGameMode] = useState<GameMode>('PVE');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [earnedCoins, setEarnedCoins] = useState(0);

    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    const { playMove, playVictory, playGameOver, playCoin, resumeAudio } = audio;

    // AI Turn effect
    useEffect(() => {
        if (gameMode === 'PVE' && currentPlayer === 2 && !winner && gameState === 'PLAYING') {
            const timer = setTimeout(() => {
                const col = getBestMove(board, difficulty);
                dropPiece(col);
            }, 600); // Artificial delay
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, winner, gameState, gameMode, board, difficulty]);

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

    // Handle Online Mode Transition
    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            if (gameState !== 'MENU' && !opponentLeft) {
                setGameState('MENU'); 
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (gameState !== 'PLAYING') {
                startOnlineGame();
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    // Network Message Handling
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'GAME_MOVE') {
                // Opponent moved
                dropPiece(data.col, true); 
            }
            else if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setWinner(null); // Or force win
                setGameState('GAMEOVER');
            }
            else if (data.type === 'REMATCH_START') {
                startOnlineGame();
            }
        });
        return () => unsubscribe();
    }, [mp.subscribe, board, currentPlayer, winner]); // Dependencies important for dropPiece context

    const startSoloGame = (diff: Difficulty) => {
        setDifficulty(diff);
        setGameMode('PVE');
        resetGame();
    };

    const startLocalPvp = () => {
        setGameMode('PVP');
        resetGame();
    };

    const startOnlineGame = () => {
        setGameMode('ONLINE');
        // Reset board but keep online context
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
        setWinner(null);
        setWinningLine([]);
        setEarnedCoins(0);
        setGameState('PLAYING');
        // Determine starting player based on host status or mp logic
        // MP hook sets mp.isMyTurn and mp.amIP1. 
        // In Connect4: Player 1 (Red) always starts.
        // If I am P1, I am Player 1. If not, I am Player 2.
        setCurrentPlayer(1); 
    };

    const resetGame = () => {
        setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
        setCurrentPlayer(1);
        setWinner(null);
        setWinningLine([]);
        setEarnedCoins(0);
        setGameState('PLAYING');
        resumeAudio();
    };

    const checkGameWin = (currentBoard: BoardState, player: Player) => {
        const win = checkWin(currentBoard);
        if (win.winner) {
            setWinner(win.winner);
            // Re-scan to find line for visuals
            // (Simplified logic: checkWin in ai.ts returns winner, not line. We'd need a helper for line.)
            // For now, assume visuals just show winner overlay.
            setGameState('GAMEOVER');
            
            const isMe = (gameMode === 'PVE' && win.winner === 1) ||
                         (gameMode === 'PVP') || // Someone won
                         (gameMode === 'ONLINE' && ((mp.amIP1 && win.winner === 1) || (!mp.amIP1 && win.winner === 2)));

            if (isMe) {
                playVictory();
                if (gameMode !== 'PVP') {
                    const reward = gameMode === 'PVE' ? (difficulty === 'HARD' ? 50 : 20) : 50;
                    addCoins(reward);
                    setEarnedCoins(reward);
                }
            } else {
                playGameOver();
            }
        } else {
            // Check Draw
            if (currentBoard.every(row => row.every(cell => cell !== 0))) {
                setWinner('DRAW');
                setGameState('GAMEOVER');
                playGameOver();
            }
        }
    };

    const dropPiece = (colIndex: number, isNetworkMove = false) => {
        if (winner || gameState !== 'PLAYING') return;
        
        // Online turn check
        if (gameMode === 'ONLINE' && !isNetworkMove) {
            const isMyTurn = (mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2);
            if (!isMyTurn) return;
        }

        const newBoard = board.map(row => [...row]);
        // Find lowest empty row in col
        let rowIndex = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (newBoard[r][colIndex] === 0) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return; // Column full

        newBoard[rowIndex][colIndex] = currentPlayer;
        setBoard(newBoard);
        playMove();

        // Send move if online and local action
        if (gameMode === 'ONLINE' && !isNetworkMove) {
            mp.sendGameMove({ col: colIndex });
        }

        checkGameWin(newBoard, currentPlayer);
        
        if (!checkWin(newBoard).winner) {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        }
    };

    const handleLocalBack = () => {
        if (gameState === 'MENU') {
            onBack();
        } else if (gameMode === 'ONLINE') {
            mp.leaveGame();
            setOnlineStep('lobby');
            setGameState('MENU');
        } else {
            setGameState('MENU');
        }
    };

    // Render Logic
    const renderCell = (r: number, c: number) => {
        const val = board[r][c];
        let colorClass = 'bg-gray-900/50 border-gray-800';
        if (val === 1) colorClass = 'bg-pink-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border-pink-600';
        if (val === 2) colorClass = 'bg-cyan-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border-cyan-600';
        
        return (
            <div 
                key={`${r}-${c}`} 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${colorClass}`}
            />
        );
    };

    const renderLobby = () => {
        // Filter players: Not me
        const availablePlayers = mp.players.filter(p => p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4 animate-in fade-in">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-pink-400 tracking-wider">LOBBY CONNECT 4</h3>
                     <button onClick={() => mp.createRoom('connect4')} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {availablePlayers.length > 0 ? (
                        availablePlayers.map(player => {
                            const isHostingThis = player.status === 'hosting' && player.extraInfo === 'connect4';
                            const isHostingOther = player.status === 'hosting' && player.extraInfo !== 'connect4';
                            
                            return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{player.name}</span>
                                        {isHostingOther && <span className="text-[9px] text-gray-500">Joue à {player.extraInfo || 'autre chose'}</span>}
                                        {!isHostingThis && !isHostingOther && <span className="text-[9px] text-green-400">DISPONIBLE</span>}
                                    </div>
                                    {isHostingThis ? (
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                    ) : (
                                        <div className="px-3 py-1.5 bg-gray-800 text-gray-500 font-bold rounded text-[10px]">
                                            {isHostingOther ? 'OCCUPÉ' : 'EN LIGNE'}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucun joueur en ligne...</p>}
                </div>
             </div>
         );
    };

    if (gameMode === 'ONLINE' && onlineStep === 'lobby' && gameState !== 'PLAYING') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-4">
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 pr-2 pb-1">CONNECT 4</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-black to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] pr-2 pb-1">CONNECT 4</h1>
                <button onClick={gameState === 'PLAYING' ? resetGame : undefined} className={`p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform ${gameState !== 'PLAYING' ? 'opacity-0' : ''}`}><RefreshCw size={20} /></button>
            </div>

            {/* Menu */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <h1 className="text-5xl font-black text-white mb-8 italic tracking-tight drop-shadow-[0_0_15px_#ec4899]">CONNECT 4</h1>
                    <div className="flex flex-col gap-4 w-full max-w-[240px]">
                        <button onClick={() => startSoloGame('EASY')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <User size={20} className="text-green-500"/> SOLO (FACILE)
                        </button>
                        <button onClick={() => startSoloGame('MEDIUM')} className="px-6 py-4 bg-gray-800 border-2 border-yellow-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <User size={20} className="text-yellow-500"/> SOLO (MOYEN)
                        </button>
                        <button onClick={() => startSoloGame('HARD')} className="px-6 py-4 bg-gray-800 border-2 border-red-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Cpu size={20} className="text-red-500"/> SOLO (DIFF.)
                        </button>
                        <button onClick={startLocalPvp} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Users size={20} className="text-pink-500"/> 2 JOUEURS
                        </button>
                        <button onClick={() => setGameMode('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-blue-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Globe size={20} className="text-blue-500"/> EN LIGNE
                        </button>
                    </div>
                </div>
            )}

            {/* Wait Screen */}
            {gameMode === 'ONLINE' && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center">
                    <div className="text-pink-400 font-bold animate-pulse mb-4">EN ATTENTE D'UN JOUEUR...</div>
                    <button onClick={mp.cancelHosting} className="px-4 py-2 bg-red-600 rounded text-white font-bold">ANNULER</button>
                </div>
            )}

            {/* Game Board */}
            <div className="relative z-10 flex flex-col items-center">
                
                {/* Status Bar */}
                <div className="mb-4 flex items-center gap-4 bg-gray-900/80 px-6 py-2 rounded-full border border-white/10">
                    <div className={`flex items-center gap-2 ${currentPlayer === 1 ? 'text-pink-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                        <div className="w-3 h-3 rounded-full bg-pink-500"></div> 
                        {gameMode === 'ONLINE' ? (mp.amIP1 ? 'MOI' : 'ADVERSAIRE') : 'JOUEUR 1'}
                    </div>
                    <div className="text-gray-600">VS</div>
                    <div className={`flex items-center gap-2 ${currentPlayer === 2 ? 'text-cyan-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        {gameMode === 'ONLINE' ? (!mp.amIP1 ? 'MOI' : 'ADVERSAIRE') : (gameMode === 'PVE' ? 'CPU' : 'JOUEUR 2')}
                    </div>
                </div>

                <div className="p-4 bg-blue-900/30 rounded-xl border-4 border-blue-800 shadow-[0_0_30px_rgba(30,64,175,0.4)] backdrop-blur-sm relative">
                    {/* Columns Click Areas */}
                    <div className="absolute inset-0 z-20 flex">
                        {Array.from({ length: COLS }).map((_, c) => (
                            <div 
                                key={c} 
                                onClick={() => dropPiece(c)}
                                className="flex-1 h-full hover:bg-white/5 transition-colors cursor-pointer"
                            />
                        ))}
                    </div>

                    <div className="grid grid-rows-6 gap-2">
                        {board.map((row, r) => (
                            <div key={r} className="flex gap-2">
                                {row.map((_, c) => renderCell(r, c))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Over Overlay */}
                {(winner || opponentLeft) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in rounded-xl">
                        {opponentLeft ? (
                            <>
                                <LogOut size={48} className="text-red-500 mb-2"/>
                                <h2 className="text-3xl font-black text-white mb-4">ADVERSAIRE PARTI</h2>
                            </>
                        ) : (
                            winner === 'DRAW' ? (
                                <h2 className="text-4xl font-black text-gray-300 mb-6">MATCH NUL</h2>
                            ) : (
                                <>
                                    <Trophy size={64} className={winner === 1 ? "text-pink-500" : "text-cyan-500"} />
                                    <h2 className={`text-4xl font-black mb-2 mt-4 ${winner === 1 ? "text-pink-500" : "text-cyan-500"}`}>
                                        {gameMode === 'ONLINE' 
                                            ? ((mp.amIP1 && winner === 1) || (!mp.amIP1 && winner === 2) ? 'VICTOIRE !' : 'DÉFAITE...')
                                            : (gameMode === 'PVE' && winner === 2 ? 'DÉFAITE' : `JOUEUR ${winner} GAGNE !`)
                                        }
                                    </h2>
                                    {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                                </>
                            )
                        )}
                        
                        <div className="flex gap-4">
                            <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : resetGame} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"><Play size={20} fill="black"/> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                            {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); setWinner(null); setOpponentLeft(false); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                        </div>
                        {gameMode !== 'ONLINE' && <button onClick={handleLocalBack} className="mt-4 text-xs text-gray-400 underline hover:text-white">Retour au Menu</button>}
                    </div>
                )}
            </div>
        </div>
    );
};
