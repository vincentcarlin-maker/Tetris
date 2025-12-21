
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Home, RefreshCw, Trophy, Coins, Crown, User, Users, Globe, Play, Loader2, ArrowLeft, Shield, Zap, Skull, CheckCircle, HelpCircle, MousePointer2, ArrowUp, Ban, LogOut, Monitor, Layers, ArrowRight, Wifi, Search } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { BoardState, Move, PlayerColor, Position, Difficulty } from './types';
import { createInitialBoard, getValidMoves, executeMove, getBestMove, BOARD_SIZE } from './logic';
import { TutorialOverlay } from '../Tutorials';

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
    const { playMove, playLand, playVictory, playGameOver, playPaddleHit, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const { username, currentAvatarId, avatarsCatalog } = useCurrency();

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
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Multi-turn state
    const [mustJumpPos, setMustJumpPos] = useState<Position | null>(null);

    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);

    const handleDataRef = useRef<(data: any) => void>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // --- SETUP ---
    useEffect(() => {
        // Tag user as playing "Checkers" for the lobby filter
        mp.updateSelfInfo(username, currentAvatarId, undefined, 'Checkers');
    }, [username, currentAvatarId, mp.updateSelfInfo]);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_checkers_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_checkers_tutorial_seen', 'true');
        }
    }, []);

    // --- EFFECT: PREVENT OVERSCROLL ---
    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const handleTouchMove = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Allow scrolling only in chat/lists marked with custom-scrollbar or root if auto
            if (target.closest('.custom-scrollbar') || target === container) return;
            e.preventDefault();
        };

        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => container.removeEventListener('touchmove', handleTouchMove);
    }, []);

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

    // --- ONLINE STATE MANAGEMENT ---
    useEffect(() => {
        const isHosting = mp.isHost || mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        
        if (mp.mode === 'lobby') {
            if (isHosting) {
                setOnlineStep('game');
                if (menuPhase === 'MENU') initGame('ONLINE');
            } else {
                setOnlineStep('lobby');
            }
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            
            if (menuPhase === 'MENU') {
                setMenuPhase('GAME');
            }

            // --- INITIALIZATION PROTOCOL ---
            if (mp.isHost) {
                // Host logic: Reset and Send Init
                resetGame();
                setTimeout(() => {
                    mp.sendData({ type: 'CHECKERS_INIT' });
                }, 1000);
            } else {
                // Guest logic: Wait for Host
                setIsWaitingForHost(true);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

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
        resumeAudio();
        
        if (onReportProgress) onReportProgress('play', 1);
    };

    const initGame = (mode: 'SOLO' | 'LOCAL' | 'ONLINE', diff?: Difficulty) => {
        setGameMode(mode);
        if (diff) setDifficulty(diff);
        
        if (mode === 'SOLO') {
            setMenuPhase('DIFFICULTY');
        } else {
            setMenuPhase('GAME');
            if (mode !== 'ONLINE') {
                resetGame();
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
        if (winner || isWaitingForHost || showTutorial) return;
        
        // Online Turn Check
        if (gameMode === 'ONLINE') {
            if (!mp.gameOpponent) return; // Wait for opponent to exist
            const isMyTurn = (mp.amIP1 && turn === 'white') || (!mp.amIP1 && turn === 'red');
            if (!isMyTurn) return;
        }
        // Solo CPU Check
        if (gameMode === 'SOLO' && turn === 'red') return;

        const clickedPiece = board[r][c];
        const isMyPiece = clickedPiece?.player === turn;

        // 1. Select a piece
        if (isMyPiece) {
            // Respect forced jump rule (mustJumpPos) or Global Forced Jumps
            if (mustJumpPos) {
                if (r !== mustJumpPos.r || c !== mustJumpPos.c) return;
            } else {
                // If there are ANY mandatory jumps on the board, user MUST click one of them
                const forced = mandatoryJumpPositions.has(`${r},${c}`);
                const hasAnyForcedMoves = mandatoryJumpPositions.size > 0;
                
                if (hasAnyForcedMoves && !forced) {
                    // Cannot select a non-jumping piece if jumps exist
                    return;
                }
            }

            const allMoves = getValidMoves(board, turn, mustJumpPos || undefined);
            const pieceMoves = allMoves.filter(m => m.from.r === r && m.from.c === c);
            
            if (pieceMoves.length > 0) {
                playPaddleHit();
                setSelectedPos({ r, c });
                setAvailableMoves(pieceMoves);
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
        if (gameMode === 'SOLO' && turn === 'red' && !winner && !showTutorial) {
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
    }, [turn, gameMode, winner, board, mustJumpPos, difficulty, showTutorial]);

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
                setIsWaitingForHost(false); // Guest receives start signal
            }
            if (data.type === 'CHECKERS_MOVE') {
                performMove(data.move);
            }
            if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                // Force winner state to prevent board interaction, but opponentLeft flag handles the UI overlay
                setWinner(mp.amIP1 ? 'white' : 'red'); 
            }
            if (data.type === 'REMATCH_START') {
                if (mp.isHost) {
                    resetGame();
                    setTimeout(() => {
                        mp.sendData({ type: 'CHECKERS_INIT' });
                    }, 1000);
                } else {
                    setIsWaitingForHost(true);
                }
            }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp.subscribe]);

    // --- CALCULATE MANDATORY JUMPS FOR HIGHLIGHTING ---
    const mandatoryJumpPositions = useMemo(() => {
        if (winner || isWaitingForHost) return new Set<string>();

        // If we are mid-combo (multijump), the only mandatory piece is the one currently moving
        if (mustJumpPos) {
            return new Set([`${mustJumpPos.r},${mustJumpPos.c}`]);
        }

        // Get all valid moves for current player
        const allMoves = getValidMoves(board, turn);
        
        // If there are jumps (isJump=true), logic.ts ensures only jumps are returned in allMoves
        // We just need to collect the unique start positions of these jumps
        const positions = new Set<string>();
        if (allMoves.length > 0 && allMoves[0].isJump) {
            allMoves.forEach(m => positions.add(`${m.from.r},${m.from.c}`));
        }
        
        return positions;
    }, [board, turn, mustJumpPos, winner, isWaitingForHost]);

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
                            
                            // Highlight forced piece (Calculated via Memo)
                            // Only highlight if it's the current player's turn to avoid spoiling CPU moves
                            const isMandatory = mandatoryJumpPositions.has(`${r},${c}`) && (gameMode !== 'SOLO' || turn === 'white');

                            let bgClass = isPlayableSquare ? 'bg-black/40 shadow-inner' : 'bg-white/10';
                            if (isTarget) bgClass = 'bg-green-500/20 shadow-[inset_0_0_15px_#22c55e]';

                            return (
                                <div 
                                    key={`${r}-${c}`}
                                    onClick={() => handleCellClick(r, c)}
                                    className={`relative flex items-center justify-center ${bgClass} ${isTarget ? 'cursor-pointer' : ''}`}
                                >
                                    {isTarget && <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                    
                                    {piece && (
                                        <div className={`
                                            relative w-[80%] aspect-square rounded-full flex items-center justify-center
                                            transition-all duration-300
                                            ${piece.player === 'white' 
                                                ? 'text-cyan-400 shadow-[0_0_10px_#22d3ee]' 
                                                : 'text-pink-500 shadow-[0_0_10px_#ec4899]'}
                                            ${isSelected ? 'scale-110 brightness-150 z-10' : ''}
                                            ${isMandatory ? 'ring-4 ring-yellow-400 shadow-[0_0_15px_#facc15] animate-pulse z-10' : ''}
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
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 {/* Create Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-cyan-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/40 active:scale-95">
                        <Play size={20} fill="black"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adversaires disponibles</span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-cyan-400 hover:text-black transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE PARTIE DÉTECTÉE</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

    // --- RENDER PHASES ---

    if (menuPhase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                {/* Background layers - Cyan/Pink theme */}
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse delay-1000 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    
                    {/* Title */}
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Crown size={56} className="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.8)] animate-bounce hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-pink-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter w-full">
                                NEON<br className="md:hidden"/> DAMES
                            </h1>
                            <Crown size={56} className="text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.8)] animate-bounce hidden md:block" />
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        
                        {/* SOLO */}
                        <button onClick={() => initGame('SOLO')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                    <User size={32} className="text-cyan-400" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors">SOLO</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Affrontez l'IA dans une partie rapide. Défendez votre camp.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                JOUER CONTRE IA <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        {/* ONLINE */}
                        <button onClick={() => initGame('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                                    <Globe size={32} className="text-pink-400" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-pink-300 transition-colors">EN LIGNE</h2>
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Rejoignez le lobby et défiez d'autres joueurs en duel.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-pink-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    </div>
                    
                    {/* Local VS */}
                    <div className="w-full max-w-sm md:max-w-3xl mt-6 flex-shrink-0">
                         <button onClick={() => initGame('LOCAL')} className="w-full p-4 rounded-2xl bg-gray-900/30 border border-white/5 hover:bg-gray-800/50 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white font-bold text-xs tracking-widest">
                            <Users size={16} /> 2 JOUEURS LOCAL (MÊME ÉCRAN)
                         </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg">
                            <Home size={14} /> RETOUR AU MENU PRINCIPAL
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (menuPhase === 'DIFFICULTY') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <h2 className="text-3xl font-black text-white mb-8 italic">DIFFICULTÉ</h2>
                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => {
                        const s = DIFFICULTY_CONFIG[d];
                        return (
                            <button 
                                key={d} 
                                onClick={() => { setDifficulty(d); startGame(); }}
                                className={`group flex items-center justify-between px-6 py-4 border-2 rounded-xl transition-all ${s.color} hover:bg-gray-800 hover:scale-105 active:scale-95`}
                            >
                                <div className="flex items-center gap-3">
                                    {d === 'EASY' && <Shield size={24}/>}
                                    {d === 'MEDIUM' && <Zap size={24}/>}
                                    {d === 'HARD' && <Skull size={24}/>}
                                    <span className="font-bold">{s.name}</span>
                                </div>
                                <div className="text-[10px] opacity-70 group-hover:opacity-100 font-mono">
                                    +{s.bonus}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setMenuPhase('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white underline">RETOUR</button>
            </div>
        );
    }

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-300 pr-2 pb-1">DAMES</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} className={`h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-4 select-none touch-none`}>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="checkers" onClose={() => setShowTutorial(false)} />}

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
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Turn Indicator */}
            {!winner && !opponentLeft && (
                <div className={`mb-4 px-6 py-2 rounded-full border border-white/10 font-bold text-sm shadow-lg transition-colors ${turn === 'white' ? 'bg-cyan-900/50 text-cyan-400 animate-pulse' : 'bg-pink-900/50 text-pink-500 animate-pulse'}`}>
                    {gameMode === 'ONLINE' 
                        ? ((mp.amIP1 && turn === 'white') || (!mp.amIP1 && turn === 'red') ? "C'EST TON TOUR" : "L'ADVERSAIRE JOUE...") 
                        : (turn === 'white' ? "TOUR CYAN" : "TOUR ROSE")}
                </div>
            )}

            {isWaitingForHost && gameMode === 'ONLINE' && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4"/>
                    <p className="font-bold">EN ATTENTE DE L'HÔTE...</p>
                    <button onClick={mp.leaveGame} className="mt-4 px-4 py-2 bg-red-600 rounded text-sm font-bold">QUITTER</button>
                </div>
            )}
            
            {/* Lobby Waiting Overlay for Host */}
            {gameMode === 'ONLINE' && mp.isHost && onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {renderBoard()}

            {(winner || opponentLeft) && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in p-6 text-center">
                    {opponentLeft ? (
                        <>
                            <LogOut size={64} className="text-red-500 mb-4" />
                            <h2 className="text-3xl font-black italic text-white mb-2">ADVERSAIRE PARTI</h2>
                            <div className="flex flex-col gap-4 w-full max-w-[280px]">
                                 <button onClick={handleLocalBack} className="w-full py-3 bg-gray-800 border border-white/10 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"><Home size={18}/> RETOUR AU MENU</button>
                            </div>
                        </>
                    ) : (
                        <>
                            {(() => {
                                let isVictory = false;
                                if (gameMode === 'ONLINE') {
                                    isVictory = (mp.amIP1 && winner === 'white') || (!mp.amIP1 && winner === 'red');
                                } else if (gameMode === 'SOLO') {
                                    isVictory = winner === 'white';
                                } else {
                                    // Local multiplayer
                                    return (
                                        <>
                                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                                            <h2 className="text-5xl font-black italic text-white mb-2">{winner === 'white' ? 'CYAN' : 'ROSE'} GAGNE !</h2>
                                        </>
                                    );
                                }

                                if (isVictory) {
                                    return (
                                        <>
                                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                                            <h2 className="text-5xl font-black italic text-white mb-2">VICTOIRE !</h2>
                                            <p className="text-green-400 font-bold mb-6">ADVERSAIRE ÉLIMINÉ</p>
                                            {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                                        </>
                                    );
                                } else {
                                    return (
                                        <>
                                            <Ban size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                                            <h2 className="text-5xl font-black italic text-white mb-4">DÉFAITE...</h2>
                                        </>
                                    );
                                }
                            })()}
                            
                            <div className="flex gap-4 w-full max-w-[280px]">
                                <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : resetGame} className="flex-1 px-4 py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2 text-sm"><RefreshCw size={18} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                                {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 text-sm">QUITTER</button>}
                            </div>
                            {gameMode !== 'ONLINE' && <button onClick={handleLocalBack} className="w-full max-w-[280px] mt-2 py-3 bg-gray-800 border border-white/10 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"><Home size={18}/> RETOUR AU MENU</button>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
