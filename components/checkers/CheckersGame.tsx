
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, Crown, User, Users, Globe, Play, Loader2, ArrowLeft, Shield, Zap, Skull } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { BoardState, Move, PlayerColor, Position, Difficulty } from './types';
import { createInitialBoard, getValidMoves, executeMove, getBestMove, BOARD_SIZE } from './logic';

interface CheckersGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { name: string, color: string, bonus: number }> = {
    EASY: { name: 'FACILE', color: 'text-green-400 border-green-500', bonus: 20 },
    MEDIUM: { name: 'NORMAL', color: 'text-yellow-400 border-yellow-500', bonus: 50 },
    HARD: { name: 'DIFFICILE', color: 'text-red-500 border-red-500', bonus: 100 }
};

export const CheckersGame: React.FC<CheckersGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio, playWallHit } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId } = useCurrency();

    // Game State
    const [board, setBoard] = useState<BoardState>(createInitialBoard());
    const [turn, setTurn] = useState<PlayerColor>('white'); // White = Player 1
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [availableMoves, setAvailableMoves] = useState<Move[]>([]);
    const [winner, setWinner] = useState<PlayerColor | 'DRAW' | null>(null);
    const [gameMode, setGameMode] = useState<'SOLO' | 'LOCAL' | 'ONLINE'>('SOLO');
    const [menuPhase, setMenuPhase] = useState<'MENU' | 'DIFFICULTY' | 'GAME'>('MENU');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [whiteCount, setWhiteCount] = useState(20);
    const [redCount, setRedCount] = useState(20);
    
    // Multi-turn state
    const [mustJumpPos, setMustJumpPos] = useState<Position | null>(null);

    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);

    const handleDataRef = useRef<(data: any) => void>(null);

    // --- SETUP ---
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (mp.mode === 'in_game' || mp.isHost) mp.leaveGame();
            setOpponentLeft(false);
        }
        return () => mp.disconnect();
    }, [gameMode]);

    useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            
            if (menuPhase === 'GAME' && (winner || whiteCount < 20 || redCount < 20)) {
                setMenuPhase('MENU');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (menuPhase === 'MENU') {
                initGame('ONLINE'); 
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, menuPhase]);

    // --- LOGIC ---

    const countPieces = (b: BoardState) => {
        let w = 0, r = 0;
        b.forEach(row => row.forEach(p => {
            if (p?.player === 'white') w++;
            if (p?.player === 'red') r++;
        }));
        setWhiteCount(w);
        setRedCount(r);
        return { w, r };
    };

    const resetGame = () => {
        const initial = createInitialBoard();
        setBoard(initial);
        setTurn('white');
        setWinner(null);
        setSelectedPos(null);
        setAvailableMoves([]);
        setWhiteCount(20);
        setRedCount(20);
        setEarnedCoins(0);
        setMustJumpPos(null);
        setOpponentLeft(false);
        setIsWaitingForHost(false);
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const initGame = (mode: 'SOLO' | 'LOCAL' | 'ONLINE', diff?: Difficulty) => {
        setGameMode(mode);
        if (diff) setDifficulty(diff);
        
        if (mode === 'SOLO') {
            setMenuPhase('DIFFICULTY');
        } else {
            setMenuPhase('GAME');
            if (mode === 'LOCAL') {
                resetGame();
            } else if (mode === 'ONLINE') {
                if (mp.isHost) {
                    resetGame();
                    setTimeout(() => mp.sendData({ type: 'CHECKERS_INIT' }), 500);
                } else {
                    setIsWaitingForHost(true);
                }
            }
        }
    };

    const startGame = () => {
        setMenuPhase('GAME');
        resetGame();
    };

    const checkWin = (b: BoardState, nextPlayer: PlayerColor) => {
        const { w, r } = countPieces(b);
        
        // No pieces left
        if (r === 0) return 'white';
        if (w === 0) return 'red';
        
        // No moves left
        const moves = getValidMoves(b, nextPlayer);
        if (moves.length === 0) return nextPlayer === 'white' ? 'red' : 'white'; 
        
        return null;
    };

    const handleTurnEnd = (newBoard: BoardState, prevPlayer: PlayerColor, lastPiecePos?: Position) => {
        // Promotion Check
        if (lastPiecePos) {
            const piece = newBoard[lastPiecePos.r][lastPiecePos.c];
            if (piece && !piece.isKing) {
                const isPromoLine = (piece.player === 'white' && lastPiecePos.r === 0) || 
                                    (piece.player === 'red' && lastPiecePos.r === BOARD_SIZE - 1);
                if (isPromoLine) {
                    piece.isKing = true;
                    playVictory(); // Small sound
                }
            }
        }

        const nextPlayer = prevPlayer === 'white' ? 'red' : 'white';
        const win = checkWin(newBoard, nextPlayer);
        
        if (win) {
            setWinner(win);
            handleGameOver(win);
        } else {
            setTurn(nextPlayer);
            setMustJumpPos(null);
        }
    };

    const performMove = (move: Move) => {
        playMove();
        if (move.isJump) playLand(); // Capture sound

        const { newBoard } = executeMove(board, move);
        setBoard(newBoard);
        setSelectedPos(null);
        setAvailableMoves([]);

        // Multi-jump logic
        if (move.isJump) {
            const followUpMoves = getValidMoves(newBoard, turn, move.to);
            const validContinuations = followUpMoves.filter(m => m.isJump);

            if (validContinuations.length > 0) {
                setMustJumpPos(move.to);
                setAvailableMoves(validContinuations);
                setSelectedPos(move.to); // Auto-select
                return; 
            }
        }

        handleTurnEnd(newBoard, turn, move.to);
    };

    const handleCellClick = (r: number, c: number) => {
        if (winner || isWaitingForHost) return;
        
        // Online Turn Check
        if (gameMode === 'ONLINE') {
            const isMyTurn = (mp.amIP1 && turn === 'white') || (!mp.amIP1 && turn === 'red');
            if (!isMyTurn) return;
        }
        // Solo CPU Check
        if (gameMode === 'SOLO' && turn === 'red') return;

        const clickedPiece = board[r][c];
        const isMyPiece = clickedPiece?.player === turn;

        // 1. Select a piece
        if (isMyPiece) {
            if (mustJumpPos) {
                if (r !== mustJumpPos.r || c !== mustJumpPos.c) {
                    playWallHit(); // Audio feedback for invalid select during chain
                    return;
                }
            }

            const allMoves = getValidMoves(board, turn, mustJumpPos || undefined);
            const pieceMoves = allMoves.filter(m => m.from.r === r && m.from.c === c);
            
            if (pieceMoves.length > 0) {
                playPaddleHit();
                setSelectedPos({ r, c });
                setAvailableMoves(pieceMoves);
            } else {
                // Feedback: Piece cannot move (maybe blocked or forced capture elsewhere)
                // Only play sound if this was an explicit user interaction that failed
                playWallHit();
            }
            return;
        }

        // 2. Move to destination
        if (!clickedPiece && selectedPos) {
            const move = availableMoves.find(m => m.to.r === r && m.to.c === c);
            if (move) {
                if (gameMode === 'ONLINE') {
                    mp.sendData({ type: 'CHECKERS_MOVE', move });
                }
                performMove(move);
            }
        }
    };

    // --- AI ---
    useEffect(() => {
        if (gameMode === 'SOLO' && turn === 'red' && !winner) {
            const timer = setTimeout(() => {
                const move = getBestMove(board, 'red', difficulty);
                
                if (move) {
                    performMove(move);
                } else {
                    setWinner('white');
                    handleGameOver('white');
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, gameMode, winner, board, mustJumpPos, difficulty]);

    const handleGameOver = (w: PlayerColor | 'DRAW') => {
        if (gameMode === 'SOLO' && w === 'white') {
            playVictory();
            const reward = DIFFICULTY_CONFIG[difficulty].bonus;
            addCoins(reward);
            setEarnedCoins(reward);
            if (onReportProgress) onReportProgress('win', 1);
        } else if (gameMode === 'ONLINE') {
            const amIWinner = (mp.amIP1 && w === 'white') || (!mp.amIP1 && w === 'red');
            if (amIWinner) {
                playVictory();
                addCoins(100);
                setEarnedCoins(100);
                if (onReportProgress) onReportProgress('win', 1);
            } else {
                playGameOver();
            }
        } else if (gameMode === 'LOCAL') {
            playVictory();
        }
    };

    // --- ONLINE HANDLER ---
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'CHECKERS_INIT') {
                resetGame();
            }
            if (data.type === 'CHECKERS_MOVE') {
                performMove(data.move);
            }
            if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setWinner(mp.amIP1 ? 'white' : 'red');
            }
            if (data.type === 'REMATCH_START') {
                resetGame();
            }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp]);

    // --- RENDER ---

    const renderBoard = () => {
        // Visual Flip for P2 Online
        const isFlipped = gameMode === 'ONLINE' && !mp.amIP1;
        
        return (
            <div className="relative w-full max-w-md aspect-square bg-gray-900 border-[6px] border-gray-700 rounded-lg shadow-2xl">
                <div className={`grid grid-cols-10 grid-rows-10 w-full h-full ${isFlipped ? 'rotate-180' : ''}`}>
                    {board.map((row, r) => (
                        row.map((piece, c) => {
                            // International 10x10: active squares are odd (r+c)
                            const isPlayableSquare = (r + c) % 2 === 1; 
                            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                            const isTarget = availableMoves.some(m => m.to.r === r && m.to.c === c);

                            let bgClass = isPlayableSquare ? 'bg-black/40 shadow-inner' : 'bg-white/10';
                            if (isTarget) bgClass = 'bg-green-500/20 shadow-[inset_0_0_15px_#22c55e]';

                            return (
                                <div 
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`relative flex items-center justify-center ${bgClass} ${isTarget ? 'cursor-pointer' : ''}`}
                                >
                                    {isTarget && <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse pointer-events-none" />}
                                    
                                    {piece && (
                                        <div className={`
                                            relative w-[80%] aspect-square rounded-full flex items-center justify-center
                                            transition-all duration-300 pointer-events-none
                                            ${piece.player === 'white' 
                                                ? 'text-cyan-400 shadow-[0_0_10px_#22d3ee]' 
                                                : 'text-pink-500 shadow-[0_0_10px_#ec4899]'}
                                            ${isSelected ? 'scale-110 brightness-150 z-10' : ''}
                                            ${isFlipped ? 'rotate-180' : ''}
                                        `}>
                                            <div className={`absolute inset-0 rounded-full opacity-20 ${piece.player === 'white' ? 'bg-cyan-400' : 'bg-pink-500'}`}></div>
                                            <div className={`absolute inset-0 rounded-full border-2 sm:border-4 ${piece.player === 'white' ? 'border-cyan-400' : 'border-pink-500'}`}></div>
                                            <div className={`absolute inset-[25%] rounded-full border opacity-50 ${piece.player === 'white' ? 'border-cyan-400' : 'border-pink-500'}`}></div>
                                            {piece.isKing && <Crown size={16} strokeWidth={2.5} className="relative z-10 drop-shadow-[0_0_5px_currentColor] animate-pulse" />}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
        );
    };

    const handleLocalBack = () => {
        if (gameMode === 'ONLINE') {
            if (onlineStep === 'game') {
                mp.leaveGame();
                setOnlineStep('lobby');
            } else {
                mp.disconnect();
                setMenuPhase('MENU');
            }
            return;
        }

        if (menuPhase === 'GAME') {
            if (gameMode === 'SOLO') setMenuPhase('DIFFICULTY');
            else setMenuPhase('MENU');
        } else if (menuPhase === 'DIFFICULTY') {
            setMenuPhase('MENU');
        } else {
            onBack();
        }
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-cyan-300 tracking-wider drop-shadow-md">LOBBY DAMES</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 ? hostingPlayers.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                            <span className="font-bold text-white ml-2">{p.name}</span>
                            <button onClick={() => mp.joinRoom(p.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                        </div>
                    )) : <p className="text-center text-gray-500 text-sm py-4">Aucune partie disponible</p>}
                </div>
             </div>
        );
    };

    // --- RENDER PHASES ---

    if (menuPhase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22d3ee]">NEON DAMES</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => initGame('SOLO')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                        <User size={24} className="text-neon-blue"/> 1 JOUEUR
                    </button>
                    <button onClick={() => initGame('LOCAL')} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                        <Users size={24} className="text-pink-500"/> 2 JOUEURS
                    </button>
                    <button onClick={() => initGame('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                        <Globe size={24} className="text-green-500"/> EN LIGNE
                    </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    if (menuPhase === 'DIFFICULTY') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h2 className="text-3xl font-black text-white mb-8">DIFFICULTÉ</h2>
                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => {
                        const s = DIFFICULTY_CONFIG[d];
                        return (
                            <button 
                                key={d} 
                                onClick={() => { setDifficulty(d); startGame(); }}
                                className={`group flex items-center justify-between px-6 py-4 border-2 rounded-xl transition-all ${s.color} hover:bg-gray-800`}
                            >
                                <div className="flex items-center gap-3">
                                    {d === 'EASY' && <Shield size={24}/>}
                                    {d === 'MEDIUM' && <Zap size={24}/>}
                                    {d === 'HARD' && <Skull size={24}/>}
                                    <span className="font-bold">{s.name}</span>
                                </div>
                                <div className="text-[10px] opacity-70 group-hover:opacity-100">
                                    <span>GAIN: +{s.bonus}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setMenuPhase('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
            </div>
        );
    }

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-2">
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-cyan-400">DAMES</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? <div className="flex-1 flex items-center justify-center"><Loader2 size={48} className="text-cyan-400 animate-spin" /></div> : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4 select-none">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4 text-xl font-black">
                        <span className="text-pink-500 drop-shadow-[0_0_5px_currentColor]">{redCount}</span>
                        <span className="text-gray-600 text-sm">VS</span>
                        <span className="text-cyan-400 drop-shadow-[0_0_5px_currentColor]">{whiteCount}</span>
                    </div>
                    {gameMode === 'SOLO' && <span className={`text-[9px] font-bold tracking-widest ${DIFFICULTY_CONFIG[difficulty].color.split(' ')[0]}`}>{DIFFICULTY_CONFIG[difficulty].name}</span>}
                </div>
                <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            {/* Turn Indicator */}
            {!winner && (
                <div className={`mb-4 px-6 py-2 rounded-full border border-white/10 font-bold text-sm shadow-lg transition-colors ${turn === 'white' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-pink-900/50 text-pink-500'}`}>
                    {gameMode === 'ONLINE' 
                        ? ((mp.amIP1 && turn === 'white') || (!mp.amIP1 && turn === 'red') ? "C'EST TON TOUR" : "L'ADVERSAIRE JOUE...") 
                        : (turn === 'white' ? "TOUR CYAN" : "TOUR ROSE")}
                </div>
            )}

            {/* HOST WAITING FOR PLAYER */}
            {gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4"/>
                    <p className="font-bold">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="mt-4 px-4 py-2 bg-red-600 rounded text-sm font-bold">ANNULER</button>
                </div>
            )}

            {/* GUEST WAITING FOR HOST INIT */}
            {gameMode === 'ONLINE' && !mp.isHost && isWaitingForHost && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4"/>
                    <p className="font-bold">SYNCHRONISATION...</p>
                </div>
            )}

            {renderBoard()}

            {winner && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in p-6">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                    <h2 className="text-5xl font-black italic text-white mb-2">{winner === 'white' ? 'CYAN' : 'ROSE'} GAGNE !</h2>
                    {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                    <div className="flex gap-4">
                        <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : resetGame} className="px-8 py-4 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                        {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                        <button onClick={handleLocalBack} className="px-8 py-4 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
};
