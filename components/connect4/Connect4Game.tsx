
import React, { useState, useEffect, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Play, Loader2, Users, Cpu, ArrowLeft } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { AVATARS_CATALOG } from '../../hooks/useCurrency';
import { checkWin, getBestMove } from './ai';
import { BoardState, Player, Difficulty, GameMode } from './types';

interface Connect4GameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

const ROWS = 6;
const COLS = 7;
const EMPTY = 0;

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp }) => {
    const [gameMode, setGameMode] = useState<GameMode | null>(null); // 'PVE', 'PVP', 'ONLINE'
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [board, setBoard] = useState<BoardState>(Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1); // 1 = Red/P1, 2 = Yellow/AI/P2
    const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
    const [winningLine, setWinningLine] = useState<[number, number][]>([]);
    
    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');

    const { playMove, playVictory, playGameOver, playCoin } = audio;

    // Reset Game
    const resetGame = useCallback(() => {
        setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY)));
        setCurrentPlayer(1);
        setWinner(null);
        setWinningLine([]);
        if (gameMode === 'ONLINE' && mp.mode === 'in_game') {
            // Online reset logic if needed, usually rematch handled by MP hook
        }
    }, [gameMode, mp.mode]);

    // Initialize Online
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (mp.isConnected) setOnlineStep('lobby');
            else mp.connect();
        }
    }, [gameMode, mp.isConnected]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (mp.mode === 'in_game') setOnlineStep('game');
            else if (mp.mode === 'lobby') setOnlineStep('lobby');
        }
    }, [mp.mode, gameMode]);

    // Handle Drop
    const handleDrop = useCallback((col: number) => {
        if (winner) return;
        if (gameMode === 'ONLINE' && !mp.isMyTurn) return;
        if (gameMode === 'PVE' && currentPlayer === 2) return; // AI turn

        // Find lowest empty row
        let row = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === EMPTY) {
                row = r;
                break;
            }
        }

        if (row === -1) return; // Column full

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);
        playMove();

        // Check Win
        const winState = checkWin(newBoard);
        if (winState.winner) {
            setWinner(winState.winner);
            // We don't have the line coordinates from checkWin in ai.ts currently (it returns {winner}). 
            // In a full impl we'd get coordinates. For now, just setting winner.
            // Assuming simple implementation.
            if (gameMode === 'ONLINE') {
                // If I made the winning move, I win
                if (mp.isMyTurn) {
                    playVictory();
                    addCoins(30);
                } else {
                    playGameOver();
                }
            } else if (winState.winner === 1) {
                playVictory();
                addCoins(10);
            } else {
                playGameOver();
            }
        } else {
            // Check Draw
            if (newBoard.every(r => r.every(c => c !== EMPTY))) {
                setWinner('DRAW');
                playGameOver();
            } else {
                // Switch Turn
                const nextPlayer = currentPlayer === 1 ? 2 : 1;
                setCurrentPlayer(nextPlayer);
                
                if (gameMode === 'ONLINE') {
                    mp.sendGameMove({ col });
                }
            }
        }
    }, [board, currentPlayer, winner, gameMode, mp, playMove, playVictory, playGameOver, addCoins]);

    // AI Logic
    useEffect(() => {
        if (gameMode === 'PVE' && currentPlayer === 2 && !winner) {
            const timer = setTimeout(() => {
                const col = getBestMove(board, difficulty);
                handleDrop(col);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [gameMode, currentPlayer, winner, board, difficulty, handleDrop]);

    // Multiplayer Data Handling
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            mp.setOnDataReceived((data) => {
                if (data.type === 'GAME_MOVE' || data.type === 'GAME_MOVE_RELAY') {
                    // Opponent move (or relay of my move if host)
                    // Update board based on col
                    const col = data.col;
                    const player = data.player; // 1 or 2
                    
                    setBoard(prev => {
                        let row = -1;
                        for (let r = ROWS - 1; r >= 0; r--) {
                            if (prev[r][col] === EMPTY) {
                                row = r;
                                break;
                            }
                        }
                        if (row === -1) return prev;
                        const newB = prev.map(r => [...r]);
                        newB[row][col] = player;
                        
                        // Check win logic duplicates here usually or use a shared reducer
                        const winState = checkWin(newB);
                        if (winState.winner) {
                            setWinner(winState.winner);
                            if ((mp.amIP1 && winState.winner === 1) || (!mp.amIP1 && winState.winner === 2)) {
                                playVictory();
                                addCoins(30);
                            } else {
                                playGameOver();
                            }
                        } else if (newB.every(r => r.every(c => c !== EMPTY))) {
                            setWinner('DRAW');
                        } else {
                            setCurrentPlayer(player === 1 ? 2 : 1);
                        }
                        
                        return newB;
                    });
                    if (data.player !== (mp.amIP1 ? 1 : 2)) playMove();
                } else if (data.type === 'REMATCH_START') {
                    resetGame();
                }
            });
        }
    }, [gameMode, mp, resetGame, playMove, playVictory, playGameOver, addCoins]);

    const renderOnlineLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);

        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-center text-cyan-300 tracking-wider">LOBBY EN LIGNE</h3>
                     <button onClick={() => mp.createRoom('connect4')} className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg text-xs hover:bg-green-400 transition-colors flex items-center gap-2">
                        <Play size={14}/> CRÉER UNE PARTIE
                     </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 && (
                        <>
                            <p className="text-xs text-yellow-400 font-bold tracking-widest my-2">PARTIES DISPONIBLES</p>
                            {hostingPlayers.map(player => {
                                const avatar = AVATARS_CATALOG.find(a => a.id === player.avatarId) || AVATARS_CATALOG[0];
                                const AvatarIcon = avatar.icon;
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                            <span className="font-bold text-white">{player.name}</span>
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
                                 const avatar = AVATARS_CATALOG.find(a => a.id === player.avatarId) || AVATARS_CATALOG[0];
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

    const renderMenu = () => (
        <div className="flex flex-col gap-4 w-full max-w-sm animate-in fade-in zoom-in">
            <h2 className="text-4xl font-black text-center italic text-pink-500 mb-6 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">CONNECT 4</h2>
            
            <button onClick={() => setGameMode('PVE')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all group">
                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform"><Cpu size={24}/></div>
                <div className="text-left">
                    <h3 className="font-bold text-white">CONTRE L'IA</h3>
                    <p className="text-xs text-gray-400">Entraînez-vous en solo</p>
                </div>
            </button>

            <button onClick={() => setGameMode('PVP')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all group">
                <div className="p-3 bg-pink-500/20 rounded-lg text-pink-400 group-hover:scale-110 transition-transform"><Users size={24}/></div>
                <div className="text-left">
                    <h3 className="font-bold text-white">2 JOUEURS (LOCAL)</h3>
                    <p className="text-xs text-gray-400">Sur le même écran</p>
                </div>
            </button>

            <button onClick={() => setGameMode('ONLINE')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all group">
                <div className="p-3 bg-green-500/20 rounded-lg text-green-400 group-hover:scale-110 transition-transform"><Users size={24}/></div>
                <div className="text-left">
                    <h3 className="font-bold text-white">EN LIGNE</h3>
                    <p className="text-xs text-gray-400">Affrontez d'autres joueurs</p>
                </div>
            </button>
        </div>
    );

    if (!gameMode) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20}/> MENU
                    </button>
                </div>
                {renderMenu()}
            </div>
        );
    }

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <button onClick={() => { mp.disconnect(); setGameMode(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20}/> RETOUR
                    </button>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex flex-col items-center gap-4 text-cyan-400">
                        <Loader2 size={48} className="animate-spin" />
                        <p className="font-bold tracking-widest">CONNEXION AU LOBBY...</p>
                    </div>
                ) : renderOnlineLobby()}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center p-4 bg-transparent relative">
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => { if(gameMode === 'ONLINE') mp.leaveGame(); setGameMode(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
                    <ArrowLeft size={16}/> {gameMode === 'ONLINE' ? 'QUITTER' : 'MENU'}
                </button>
            </div>

            <div className="flex items-center gap-4 mb-4 mt-8">
                <div className={`px-4 py-2 rounded-lg border ${currentPlayer === 1 ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    JOUEUR 1
                </div>
                <div className="font-black text-xl italic">VS</div>
                <div className={`px-4 py-2 rounded-lg border ${currentPlayer === 2 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    {gameMode === 'PVE' ? 'CPU' : 'JOUEUR 2'}
                </div>
            </div>

            <div className="bg-blue-900/40 p-4 rounded-xl border-4 border-blue-800 shadow-[0_0_30px_rgba(30,58,138,0.5)] backdrop-blur-md">
                <div className="grid grid-cols-7 gap-2 bg-blue-900/50 p-2 rounded-lg">
                    {board.map((row, r) => (
                        row.map((cell, c) => (
                            <div 
                                key={`${r}-${c}`} 
                                onClick={() => handleDrop(c)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                                    cell === 0 ? 'bg-gray-900/50 shadow-inner' :
                                    cell === 1 ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' :
                                    'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                                }`}
                            />
                        ))
                    ))}
                </div>
            </div>

            {winner && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in">
                    <h2 className="text-5xl font-black italic text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        {winner === 'DRAW' ? 'MATCH NUL' : `JOUEUR ${winner} GAGNE !`}
                    </h2>
                    <div className="flex gap-4">
                        <button onClick={resetGame} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                            <RefreshCw size={20} /> REJOUER
                        </button>
                        <button onClick={() => { if(gameMode==='ONLINE') mp.leaveGame(); setGameMode(null); }} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors shadow-lg">
                            QUITTER
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
