
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Coins, Users, User, Globe, Play, LogOut, Crosshair, Anchor, ShieldAlert } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { Grid, Ship, GameState, ShipType } from './types';
import { generateRandomShips, checkHit, getCpuMove, createEmptyGrid, SHIPS_CONFIG } from './logic';

interface BattleshipGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins, mp }) => {
    // Game State
    const [phase, setPhase] = useState<'MENU' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
    const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid());
    const [playerShips, setPlayerShips] = useState<Ship[]>([]);
    const [cpuShips, setCpuShips] = useState<Ship[]>([]);
    const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
    const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
    const [lastCpuHit, setLastCpuHit] = useState<{r:number, c:number} | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [gameMode, setGameMode] = useState<'PVE' | 'ONLINE'>('PVE');

    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [iAmReady, setIAmReady] = useState(false);

    const { playExplosion, playShipSink, playVictory, playGameOver, resumeAudio } = audio;

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
            if (phase !== 'MENU' && !opponentLeft) setPhase('MENU');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase !== 'SETUP') {
                // Auto start setup for online
                setGameMode('ONLINE');
                const { grid, ships } = generateRandomShips();
                setPlayerGrid(grid);
                setPlayerShips(ships);
                setPhase('SETUP');
                setOpponentReady(false);
                setIAmReady(false);
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

    // Network Message Handling
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'BATTLESHIP_READY') {
                setOpponentReady(true);
                // If both ready, start game
                if (iAmReady) {
                    setPhase('PLAYING');
                    // Host starts
                    setTurn(mp.isHost ? 'PLAYER' : 'CPU'); 
                }
            }
            else if (data.type === 'BATTLESHIP_FIRE') {
                // Opponent fired at me (data.r, data.c)
                // Check local hit
                const { hit, shipId, sunk } = checkHit(data.r, data.c, playerShips);
                
                // Update local player grid visually (marks hit/miss)
                const newGrid = [...playerGrid];
                newGrid[data.r][data.c] = hit ? 3 : 2;
                setPlayerGrid(newGrid);

                if (hit) {
                    playExplosion();
                    if (sunk) playShipSink();
                }

                // Send result back
                mp.sendData({ 
                    type: 'BATTLESHIP_RESULT', 
                    r: data.r, 
                    c: data.c, 
                    hit, 
                    sunk, 
                    shipId,
                    gameOver: playerShips.every(s => s.sunk || (s.id === shipId && sunk)) // Check if I lost
                });

                // It's my turn now
                setTurn('PLAYER');
            }
            else if (data.type === 'BATTLESHIP_RESULT') {
                // I fired, got result
                const newCpuGrid = [...cpuGrid];
                newCpuGrid[data.r][data.c] = data.hit ? 3 : 2;
                setCpuGrid(newCpuGrid);

                if (data.hit) {
                    playExplosion();
                    if (data.sunk) playShipSink();
                }

                if (data.gameOver) {
                    setWinner('PLAYER');
                    setPhase('GAMEOVER');
                    playVictory();
                    addCoins(100);
                    setEarnedCoins(100);
                } else {
                    // Opponent's turn now
                    setTurn('CPU'); // Visual label for "Opponent"
                }
            }
            else if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setPhase('GAMEOVER');
            }
            else if (data.type === 'REMATCH_START') {
                // Reset to setup
                const { grid, ships } = generateRandomShips();
                setPlayerGrid(grid);
                setPlayerShips(ships);
                setCpuGrid(createEmptyGrid());
                setPhase('SETUP');
                setOpponentReady(false);
                setIAmReady(false);
            }
        });
        return () => unsubscribe();
    }, [mp.subscribe, playerShips, playerGrid, cpuGrid, iAmReady, gameMode]);

    // AI Turn (PVE)
    useEffect(() => {
        if (gameMode === 'PVE' && phase === 'PLAYING' && turn === 'CPU' && !winner) {
            const timeout = setTimeout(() => {
                const move = getCpuMove(playerGrid, lastCpuHit);
                const { hit, shipId, sunk } = checkHit(move.r, move.c, playerShips);
                
                const newGrid = [...playerGrid];
                newGrid[move.r][move.c] = hit ? 3 : 2;
                setPlayerGrid(newGrid);

                if (hit) {
                    playExplosion();
                    setLastCpuHit(move);
                    if (sunk) {
                        playShipSink();
                        setLastCpuHit(null); // Reset hunter mode
                    }
                    // Check Loss
                    if (playerShips.every(s => s.sunk)) {
                        setWinner('CPU');
                        setPhase('GAMEOVER');
                        playGameOver();
                    } else {
                        // AI fires again if hit? Standard rules say no usually, but arcade yes.
                        // Let's stick to standard turn switch for PVE balance.
                        setTurn('PLAYER'); 
                    }
                } else {
                    setTurn('PLAYER');
                }
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [turn, phase, winner, playerGrid, playerShips, lastCpuHit, gameMode]);

    const startPVE = () => {
        setGameMode('PVE');
        const { grid, ships } = generateRandomShips();
        setPlayerGrid(grid);
        setPlayerShips(ships);
        // Setup AI
        const ai = generateRandomShips();
        setCpuGrid(createEmptyGrid()); // We don't see ships
        setCpuShips(ai.ships);
        // Actual grid logic for AI hits stored in checking function or we need a hidden grid
        // For local PVE, we need to store AI's ship positions.
        // Let's store AI grid with ships but display hidden version.
        // Refactoring slightly: cpuGrid will store visual state (Hit/Miss). cpuShips stores logic.
        
        setPhase('SETUP');
        setWinner(null);
        setEarnedCoins(0);
        resumeAudio();
    };

    const randomizeShips = () => {
        const { grid, ships } = generateRandomShips();
        setPlayerGrid(grid);
        setPlayerShips(ships);
    };

    const confirmSetup = () => {
        if (gameMode === 'ONLINE') {
            setIAmReady(true);
            mp.sendData({ type: 'BATTLESHIP_READY' });
            if (opponentReady) {
                setPhase('PLAYING');
                setTurn(mp.isHost ? 'PLAYER' : 'CPU'); // Host starts
            }
        } else {
            setPhase('PLAYING');
            setTurn('PLAYER');
        }
    };

    const handleCellClick = (r: number, c: number) => {
        if (phase !== 'PLAYING' || turn !== 'PLAYER' || winner) return;
        
        // Check if already fired
        if (cpuGrid[r][c] !== 0) return;

        if (gameMode === 'ONLINE') {
            mp.sendData({ type: 'BATTLESHIP_FIRE', r, c });
            // Wait for result... don't update local grid yet
        } else {
            // PVE Logic
            // Check Hit on AI Ships
            const { hit, sunk } = checkHit(r, c, cpuShips);
            const newCpuGrid = [...cpuGrid];
            newCpuGrid[r][c] = hit ? 3 : 2;
            setCpuGrid(newCpuGrid);

            if (hit) {
                playExplosion();
                if (sunk) playShipSink();
                // Check Win
                if (cpuShips.every(s => s.sunk)) {
                    setWinner('PLAYER');
                    setPhase('GAMEOVER');
                    playVictory();
                    addCoins(100);
                    setEarnedCoins(100);
                }
            } else {
                setTurn('CPU');
            }
        }
    };

    const handleLocalBack = () => {
        if (phase === 'MENU') {
            onBack();
        } else if (gameMode === 'ONLINE') {
            mp.leaveGame();
            setOnlineStep('lobby');
            setPhase('MENU');
        } else {
            setPhase('MENU');
        }
    };

    const renderGrid = (grid: Grid, isPlayer: boolean, hidden = false) => {
        return (
            <div className="grid grid-cols-10 gap-px bg-blue-900/50 border border-blue-500/30 p-1">
                {grid.map((row, r) => (
                    row.map((cell, c) => {
                        let content = null;
                        let bg = 'bg-blue-950/80';
                        
                        if (cell === 1) { // Ship
                            bg = isPlayer ? 'bg-gray-500' : (hidden ? 'bg-blue-950/80' : 'bg-gray-500');
                        } else if (cell === 2) { // Miss
                            bg = 'bg-blue-900';
                            content = <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50"/>;
                        } else if (cell === 3) { // Hit
                            bg = 'bg-red-900/50';
                            content = <div className="text-red-500 text-xs animate-pulse">X</div>;
                        }

                        // Hover effect for targeting
                        const canInteract = !isPlayer && phase === 'PLAYING' && turn === 'PLAYER' && cell === 0;

                        return (
                            <div 
                                key={`${r}-${c}`} 
                                onClick={() => !isPlayer && handleCellClick(r, c)}
                                className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center ${bg} ${canInteract ? 'hover:bg-blue-800 cursor-crosshair' : ''}`}
                            >
                                {content}
                            </div>
                        );
                    })
                ))}
            </div>
        );
    };

    const renderLobby = () => {
        const availablePlayers = mp.players.filter(p => p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4 animate-in fade-in">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-blue-400 tracking-wider">LOBBY BATAILLE NAVALE</h3>
                     <button onClick={() => mp.createRoom('battleship')} className="w-full py-3 bg-blue-500 text-white font-black tracking-widest rounded-xl text-sm hover:bg-blue-400 transition-all flex items-center justify-center gap-2">
                        <Play size={18} fill="white"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {availablePlayers.length > 0 ? (
                        availablePlayers.map(player => {
                            const isHostingThis = player.status === 'hosting' && player.extraInfo === 'battleship';
                            const isHostingOther = player.status === 'hosting' && player.extraInfo !== 'battleship';
                            
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

    if (gameMode === 'ONLINE' && onlineStep === 'lobby' && phase !== 'SETUP' && phase !== 'PLAYING') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-4">
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 pr-2 pb-1">BATAILLE</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] pr-2 pb-1">BATAILLE</h1>
                <button onClick={phase === 'SETUP' ? randomizeShips : undefined} className={`p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform ${phase !== 'SETUP' ? 'opacity-0' : ''}`}><RefreshCw size={20} /></button>
            </div>

            {/* MENU */}
            {phase === 'MENU' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <h1 className="text-5xl font-black text-white mb-8 italic tracking-tight drop-shadow-[0_0_15px_#3b82f6]">BATAILLE</h1>
                    <div className="flex flex-col gap-4 w-full max-w-[240px]">
                        <button onClick={startPVE} className="px-6 py-4 bg-gray-800 border-2 border-cyan-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Anchor size={20} className="text-cyan-500"/> SOLO (PVE)
                        </button>
                        <button onClick={() => setGameMode('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-blue-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Globe size={20} className="text-blue-500"/> EN LIGNE
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN GAME */}
            <div className="flex flex-col items-center gap-4 z-10 w-full max-w-lg">
                
                {phase === 'SETUP' && (
                    <div className="bg-black/80 p-6 rounded-xl border border-blue-500/30 text-center animate-in fade-in">
                        <h2 className="text-xl font-bold text-blue-300 mb-4">PLACEMENT DES NAVIRES</h2>
                        <div className="mb-4">
                            {renderGrid(playerGrid, true)}
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={randomizeShips} className="px-4 py-2 bg-gray-700 rounded text-white text-xs font-bold hover:bg-gray-600 flex items-center gap-2"><RefreshCw size={14}/> ALÉATOIRE</button>
                            <button 
                                onClick={confirmSetup} 
                                disabled={iAmReady}
                                className={`px-6 py-2 bg-blue-600 rounded text-white text-xs font-bold hover:bg-blue-500 transition-all ${iAmReady ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {iAmReady ? (opponentReady ? 'LANCEMENT...' : 'EN ATTENTE...') : 'CONFIRMER'}
                            </button>
                        </div>
                    </div>
                )}

                {phase === 'PLAYING' && (
                    <div className="flex flex-col gap-6 w-full items-center animate-in fade-in">
                        {/* Status */}
                        <div className={`px-6 py-2 rounded-full border border-white/10 font-bold tracking-widest text-sm ${turn === 'PLAYER' ? 'bg-green-500/20 text-green-400 animate-pulse border-green-500/50' : 'bg-red-500/20 text-red-400'}`}>
                            {turn === 'PLAYER' ? 'À VOUS DE TIRER' : 'TOUR ADVERSE'}
                        </div>

                        {/* Opponent Grid (Target) */}
                        <div className="relative group">
                            <div className="absolute -top-6 left-0 text-xs font-bold text-red-400 flex items-center gap-1"><Crosshair size={12}/> ZONE ENNEMIE</div>
                            {renderGrid(cpuGrid, false, true)}
                        </div>

                        {/* Player Grid (Self) */}
                        <div className="relative opacity-80 scale-90">
                            <div className="absolute -top-6 left-0 text-xs font-bold text-blue-400 flex items-center gap-1"><ShieldAlert size={12}/> MA FLOTTE</div>
                            {renderGrid(playerGrid, true)}
                        </div>
                    </div>
                )}

                {/* GAME OVER */}
                {(phase === 'GAMEOVER' || opponentLeft) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in rounded-xl p-4">
                        {opponentLeft ? (
                            <>
                                <LogOut size={48} className="text-red-500 mb-2"/>
                                <h2 className="text-3xl font-black text-white mb-4">ADVERSAIRE PARTI</h2>
                            </>
                        ) : (
                            <>
                                <Trophy size={64} className={winner === 'PLAYER' ? "text-yellow-400" : "text-gray-500"} />
                                <h2 className="text-4xl font-black text-white mb-2 mt-4">{winner === 'PLAYER' ? 'VICTOIRE !' : 'DÉFAITE...'}</h2>
                                {winner === 'PLAYER' && earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                            </>
                        )}
                        
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                          {gameMode === 'ONLINE' ? (
                              <>
                                <button onClick={() => mp.requestRematch()} className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"><Play size={16}/> REVANCHE</button>
                                <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); setPhase('MENU'); }} className="w-full py-3 bg-transparent border border-white/20 text-white font-bold rounded hover:bg-white/10 transition-colors flex items-center justify-center gap-2"><LogOut size={16}/> RETOUR AU LOBBY</button>
                              </>
                          ) : (
                              <>
                                <button onClick={startPVE} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"><RefreshCw size={16}/> REJOUER</button>
                                <button onClick={handleLocalBack} className="w-full py-3 bg-transparent border border-white/20 text-gray-400 font-bold rounded hover:text-white transition-colors">MENU</button>
                              </>
                          )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
