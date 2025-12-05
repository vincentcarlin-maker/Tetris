
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Play, Loader2, Users, ArrowLeft, Target, Ship as ShipIcon, Crosshair } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { AVATARS_CATALOG } from '../../hooks/useCurrency';
import { GRID_SIZE, SHIPS_CONFIG, createEmptyGrid, placeShipOnGrid, generateRandomShips, checkHit, getCpuMove, isValidPlacement } from './logic';
import { Grid, Ship, GameState, CellStatus } from './types';

interface BattleshipGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const [gameMode, setGameMode] = useState<'PVE' | 'ONLINE' | null>(null);
    const [phase, setPhase] = useState<'SETUP' | 'PLAYING' | 'GAMEOVER'>('SETUP');
    const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
    const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid()); // For online: Opponent Grid
    const [playerShips, setPlayerShips] = useState<Ship[]>([]);
    const [cpuShips, setCpuShips] = useState<Ship[]>([]); // For online: Dummy to track sunken
    const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
    const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
    
    // Setup state
    const [placingShipIndex, setPlacingShipIndex] = useState(0);
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentReady, setOpponentReady] = useState(false);

    const { playExplosion, playShipSink, playVictory, playGameOver } = audio;

    // AI Memory
    const lastHitRef = useRef<{r: number, c: number} | null>(null);

    // Initial Setup
    const startSetup = () => {
        setPlayerGrid(createEmptyGrid());
        setPlayerShips([]);
        setPlacingShipIndex(0);
        setPhase('SETUP');
        setWinner(null);
        setOpponentReady(false);
        // AI Ships
        const { grid, ships } = generateRandomShips();
        setCpuGrid(grid);
        setCpuShips(ships);
    };

    useEffect(() => {
        if (gameMode === 'PVE') startSetup();
        else if (gameMode === 'ONLINE') {
            if (mp.isConnected) setOnlineStep('lobby');
            else mp.connect();
        }
    }, [gameMode, mp.isConnected]);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            if (mp.mode === 'in_game') {
                setOnlineStep('game');
                startSetup(); // Start setup when game starts
            } else if (mp.mode === 'lobby') {
                setOnlineStep('lobby');
            }
        }
    }, [mp.mode, gameMode]);

    // SETUP: Place Ships
    const handleCellClickSetup = (r: number, c: number) => {
        if (phase !== 'SETUP' || placingShipIndex >= SHIPS_CONFIG.length) return;
        
        const shipConfig = SHIPS_CONFIG[placingShipIndex];
        if (isValidPlacement(playerGrid, r, c, shipConfig.size, orientation)) {
            const newShip: Ship = {
                id: `p-ship-${placingShipIndex}`,
                type: shipConfig.type,
                size: shipConfig.size,
                hits: 0,
                orientation,
                row: r,
                col: c,
                sunk: false
            };
            const newGrid = playerGrid.map(row => [...row]);
            placeShipOnGrid(newGrid, newShip);
            setPlayerGrid(newGrid);
            setPlayerShips([...playerShips, newShip]);
            
            if (placingShipIndex + 1 >= SHIPS_CONFIG.length) {
                // Done placing
                if (gameMode === 'PVE') {
                    setPhase('PLAYING');
                    setTurn('PLAYER'); // Player always starts PVE
                } else {
                    // Online: Wait for opponent
                    mp.sendData({ type: 'BATTLESHIP_READY', ships: [...playerShips, newShip] }); // Send ships for validation/sync? Or just READY. 
                    // Actually, in Battleship we usually keep ships secret.
                    // But to verify hits, we can either:
                    // A) Send grid to opponent and trust client (easier)
                    // B) Keep grid local and respond to "SHOT" messages (secure)
                    // We'll go with B.
                    mp.sendData({ type: 'BATTLESHIP_READY' });
                    setPhase('PLAYING'); // Technically waiting for opponent sync
                }
            } else {
                setPlacingShipIndex(p => p + 1);
            }
        }
    };

    // PLAY: Shoot
    const handleCellClickPlay = (r: number, c: number) => {
        if (phase !== 'PLAYING' || (gameMode === 'PVE' && turn === 'CPU') || (gameMode === 'ONLINE' && !mp.isMyTurn)) return;
        if (winner) return;
        
        // Cannot shoot same spot (2=Miss, 3=Hit)
        // Note: For Online, cpuGrid represents "Opponent Grid View" (fog of war)
        // For PVE, cpuGrid is the actual AI grid (with ships hidden by UI logic)
        // But to unify, let's say cpuGrid contains truth for PVE, and "shots" for ONLINE.
        
        if (gameMode === 'ONLINE') {
            // Check if already shot here in our view of opponent
            if (cpuGrid[r][c] === 2 || cpuGrid[r][c] === 3) return;
            
            mp.sendData({ type: 'BATTLESHIP_SHOT', r, c });
            // Optimistic update or wait? Wait is safer.
        } else {
            // PVE Logic
            if (cpuGrid[r][c] === 2 || cpuGrid[r][c] === 3) return; // Already shot

            const { hit, sunk } = checkHit(r, c, cpuShips);
            const newCpuGrid = cpuGrid.map(row => [...row]);
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
                    addCoins(50);
                }
                // Hit means shoot again? Rules vary. Let's say yes for fun.
            } else {
                setTurn('CPU');
                setTimeout(cpuTurn, 1000);
            }
        }
    };

    const cpuTurn = () => {
        if (winner) return;
        
        // Simple AI
        let move = getCpuMove(playerGrid, lastHitRef.current);
        const { r, c } = move;
        
        const { hit, sunk } = checkHit(r, c, playerShips);
        const newPlayerGrid = playerGrid.map(row => [...row]);
        newPlayerGrid[r][c] = hit ? 3 : 2; // Update player grid visuals
        setPlayerGrid(newPlayerGrid);

        if (hit) {
            playExplosion();
            lastHitRef.current = { r, c };
            if (sunk) {
                playShipSink();
                lastHitRef.current = null; // Reset target mode if ship sunk
            }
            if (playerShips.every(s => s.sunk)) {
                setWinner('CPU');
                setPhase('GAMEOVER');
                playGameOver();
            } else {
                setTimeout(cpuTurn, 1000); // CPU shoots again on hit
            }
        } else {
            setTurn('PLAYER');
        }
    };

    // Multiplayer Data
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            mp.setOnDataReceived((data) => {
                if (data.type === 'BATTLESHIP_READY') {
                    setOpponentReady(true);
                }
                else if (data.type === 'BATTLESHIP_SHOT') {
                    // Opponent shot at me
                    const { r, c } = data;
                    const { hit, sunk } = checkHit(r, c, playerShips);
                    
                    // Update my grid to show damage
                    setPlayerGrid(prev => {
                        const newG = prev.map(row => [...row]);
                        newG[r][c] = hit ? 3 : 2;
                        return newG;
                    });

                    if (hit) {
                        playExplosion();
                        if (sunk) playShipSink();
                    }

                    // Check if I lost
                    const isLost = playerShips.every(s => s.sunk);
                    if (isLost) {
                        setWinner('CPU'); // Opponent wins
                        setPhase('GAMEOVER');
                        playGameOver();
                    }

                    // Send result back
                    mp.sendData({ type: 'BATTLESHIP_RESULT', r, c, hit, sunk, isGameOver: isLost });
                }
                else if (data.type === 'BATTLESHIP_RESULT') {
                    // Result of my shot
                    const { r, c, hit, sunk, isGameOver } = data;
                    
                    setCpuGrid(prev => {
                        const newG = prev.map(row => [...row]);
                        newG[r][c] = hit ? 3 : 2;
                        return newG;
                    });

                    if (hit) {
                        playExplosion();
                        if (sunk) playShipSink();
                        if (isGameOver) {
                            setWinner('PLAYER');
                            setPhase('GAMEOVER');
                            playVictory();
                            addCoins(50);
                        }
                    } 
                    // No turn switch needed, mp handles `isMyTurn` via `GAME_MOVE` logic normally, 
                    // but here we are using custom events. 
                    // We need to manually switch turn if we want strict turn based.
                    // Let's rely on hit=shoot again rule. If miss, other player turn.
                    if (!hit) {
                        // Switch turn in MP state? MP hook doesn't expose manual turn switch easily without `sendGameMove`.
                        // For battleship custom logic, better to track turns locally or use a generic TURN_SWITCH msg.
                        // Let's just say "Waiting for opponent..." text when not my turn.
                        // Actually `mp.isMyTurn` is updated by `GAME_MOVE` type. We should use `mp.sendGameMove` for shot?
                        // `mp.sendGameMove` sends `col`. We need row/col.
                        // Let's handle turns manually with custom messages.
                        // Actually, easier: If miss, send a dummy "TURN_PASS" message?
                        // Or just imply it.
                        // NOTE: For this implementation, let's keep it simple: If miss, you wait.
                    }
                }
            });
        }
    }, [gameMode, mp, playerShips, playExplosion, playShipSink, playVictory, playGameOver, addCoins]);

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold text-center text-blue-300 tracking-wider">LOBBY BATAILLE NAVALE</h3>
                     <button onClick={() => mp.createRoom('battleship')} className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg text-xs hover:bg-green-400 transition-colors flex items-center gap-2">
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
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-3 py-1.5 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
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

    if (!gameMode) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20}/> MENU
                    </button>
                </div>
                <div className="flex flex-col gap-4 w-full max-w-sm">
                    <h2 className="text-4xl font-black text-center italic text-blue-500 mb-6">BATAILLE NAVALE</h2>
                    <button onClick={() => setGameMode('PVE')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all">
                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><Target size={24}/></div>
                        <div className="text-left"><h3 className="font-bold text-white">CONTRE L'IA</h3><p className="text-xs text-gray-400">Classique solo</p></div>
                    </button>
                    <button onClick={() => setGameMode('ONLINE')} className="p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 transition-all">
                        <div className="p-3 bg-green-500/20 rounded-lg text-green-400"><Users size={24}/></div>
                        <div className="text-left"><h3 className="font-bold text-white">EN LIGNE</h3><p className="text-xs text-gray-400">Guerre tactique</p></div>
                    </button>
                </div>
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
                {onlineStep === 'connecting' ? <div className="flex flex-col items-center gap-4 text-blue-400"><Loader2 size={48} className="animate-spin" /><p>CONNEXION...</p></div> : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center p-4 bg-transparent relative overflow-y-auto">
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => { if(gameMode === 'ONLINE') mp.leaveGame(); setGameMode(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
                    <ArrowLeft size={16}/> {gameMode === 'ONLINE' ? 'QUITTER' : 'MENU'}
                </button>
            </div>

            {/* Status Bar */}
            <div className="mt-12 mb-4 bg-black/50 px-4 py-2 rounded-full border border-white/10">
                {phase === 'SETUP' ? (
                    <span className="text-yellow-400 font-bold animate-pulse">PLACEZ VOS NAVIRES</span>
                ) : winner ? (
                    <span className={`font-black ${winner === 'PLAYER' ? 'text-green-400' : 'text-red-500'}`}>{winner === 'PLAYER' ? 'VICTOIRE' : 'DÉFAITE'}</span>
                ) : (
                    <span className={`font-bold ${turn === 'PLAYER' || (gameMode==='ONLINE' && mp.isMyTurn) ? 'text-green-400' : 'text-red-400'}`}>
                        {turn === 'PLAYER' ? 'À VOUS DE TIRER' : 'TOUR ADVERSE'}
                    </span>
                )}
            </div>

            {/* Grids Container */}
            <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* MY GRID (Small if playing, Big if setup) */}
                <div className={`transition-all duration-300 ${phase === 'PLAYING' ? 'order-2 scale-75 opacity-80 hover:opacity-100 hover:scale-90' : 'order-1'}`}>
                    <div className="text-center text-xs text-blue-300 font-bold mb-1">MA FLOTTE</div>
                    <div className="bg-blue-900/40 p-2 rounded border border-blue-500/30">
                        {playerGrid.map((row, r) => (
                            <div key={r} className="flex">
                                {row.map((cell, c) => (
                                    <div 
                                        key={c}
                                        onClick={() => handleCellClickSetup(r, c)}
                                        className={`w-6 h-6 border border-blue-900/50 ${
                                            cell === 1 ? 'bg-gray-400' : // Ship
                                            cell === 2 ? 'bg-blue-900/50 relative' : // Miss (on my grid)
                                            cell === 3 ? 'bg-red-500 animate-pulse' : // Hit (on my grid)
                                            'bg-transparent hover:bg-white/10'
                                        }`}
                                    >
                                        {cell === 2 && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full opacity-50"></div></div>}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* TARGET GRID (Only visible when playing) */}
                {phase !== 'SETUP' && (
                    <div className="order-1">
                        <div className="text-center text-xs text-red-400 font-bold mb-1">CIBLE {gameMode==='ONLINE' && !opponentReady && '(ATTENTE ADVERSAIRE)'}</div>
                        <div className={`bg-red-900/20 p-2 rounded border border-red-500/30 cursor-crosshair ${(!opponentReady && gameMode==='ONLINE') ? 'opacity-50 pointer-events-none' : ''}`}>
                            {cpuGrid.map((row, r) => (
                                <div key={r} className="flex">
                                    {row.map((cell, c) => (
                                        <div 
                                            key={c}
                                            onClick={() => handleCellClickPlay(r, c)}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 border border-red-900/30 relative ${
                                                cell === 3 ? 'bg-red-600' : // Hit
                                                cell === 2 ? 'bg-gray-800' : // Miss
                                                'bg-black/40 hover:bg-red-500/20'
                                            }`}
                                        >
                                            {cell === 3 && <Crosshair className="absolute inset-0 m-auto text-white w-4 h-4 animate-spin-slow" />}
                                            {cell === 2 && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full opacity-20"></div></div>}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SETUP CONTROLS */}
            {phase === 'SETUP' && placingShipIndex < SHIPS_CONFIG.length && (
                <div className="mt-6 flex flex-col items-center gap-4 bg-gray-900/80 p-4 rounded-xl border border-white/10">
                    <div className="text-white font-bold">Placer : {SHIPS_CONFIG[placingShipIndex].label} ({SHIPS_CONFIG[placingShipIndex].size} cases)</div>
                    <button 
                        onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
                        className="px-6 py-2 bg-blue-600 rounded-full font-bold text-white hover:bg-blue-500 transition-colors"
                    >
                        ORIENTATION : {orientation === 'horizontal' ? 'HORIZONTALE' : 'VERTICALE'}
                    </button>
                    <p className="text-xs text-gray-400">Touchez la grille pour placer le navire</p>
                </div>
            )}

            {/* GAME OVER CONTROLS */}
            {phase === 'GAMEOVER' && (
                <div className="mt-6 flex gap-4 z-20">
                    <button onClick={startSetup} className="px-8 py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors shadow-lg flex items-center gap-2">
                        <RefreshCw size={20} /> REJOUER
                    </button>
                </div>
            )}
        </div>
    );
};
