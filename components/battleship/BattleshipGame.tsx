
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, Crosshair, Anchor, ShieldAlert, Coins, RotateCw, Play, Trash2, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, Loader2, Cpu, Globe, ArrowLeft, X, Radio } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { GRID_SIZE, createEmptyGrid, generateRandomShips, checkHit, getCpuMove, SHIPS_CONFIG, isValidPlacement, placeShipOnGrid } from './logic';
import { Grid, Ship as ShipType, ShipType as ShipTypeName } from './types';

interface BattleshipGameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>; 
  onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

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

// --- COMPOSANTS VISUELS ---

const ShipVisual: React.FC<{ type: ShipTypeName, size: number, orientation: 'horizontal' | 'vertical', isSunk: boolean, isGhost?: boolean, isValid?: boolean }> = ({ type, size, orientation, isSunk, isGhost, isValid }) => {
    const isVertical = orientation === 'vertical';
    
    // Base styles
    let containerClass = "relative rounded-md border backdrop-blur-sm flex items-center justify-center transition-all duration-300";
    let colorClass = isSunk ? 'bg-red-900/80 border-red-500' : 'bg-cyan-900/60 border-cyan-400';
    
    if (isGhost) {
        colorClass = isValid ? 'bg-green-500/40 border-green-400' : 'bg-red-500/40 border-red-500';
    }

    return (
        <div className={`w-full h-full p-[2px] pointer-events-none ${isGhost ? 'opacity-70 z-20' : 'z-10'}`}>
            <div className={`${containerClass} w-full h-full ${colorClass} ${isSunk ? '' : 'shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}>
                {/* Tech Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%,rgba(255,255,255,0.1)_100%)] bg-[length:4px_4px] opacity-30"></div>
                
                {/* Structure / Modules */}
                <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-evenly w-full h-full p-[10%]`}>
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className={`bg-black/40 border border-white/20 rounded-sm ${isVertical ? 'w-2/3 h-full mx-auto my-[1px]' : 'h-2/3 w-full my-auto mx-[1px]'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Marker: React.FC<{ status: 2 | 3 }> = ({ status }) => {
    if (status === 2) { // MISS - WATER
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 bg-blue-400 rounded-full z-10"></div>
                <div className="absolute w-full h-full border-2 border-blue-400/50 rounded-full animate-ping opacity-75"></div>
            </div>
        );
    }
    // HIT
    return (
        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-pulse z-10"></div>
            <div className="absolute inset-0 border border-red-500/50 rounded-full animate-ping"></div>
            <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 w-4 h-4" strokeWidth={3} />
        </div>
    );
};

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
  // --- STATE ---
  const [phase, setPhase] = useState<'MENU' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
  const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
  
  // Game Data
  const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
  const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid()); // Visual grid for opponent
  const [cpuRealGrid, setCpuRealGrid] = useState<Grid>(createEmptyGrid()); // Hidden logic grid
  const [playerShips, setPlayerShips] = useState<ShipType[]>([]);
  const [cpuShips, setCpuShips] = useState<ShipType[]>([]);
  
  // Setup State
  const [setupGrid, setSetupGrid] = useState<Grid>(createEmptyGrid());
  const [setupShips, setSetupShips] = useState<ShipType[]>([]);
  const [selectedShipType, setSelectedShipType] = useState<ShipTypeName | null>(null); // From inventory
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // Online State
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  
  // Feedback
  const [notification, setNotification] = useState<{text: string, type: 'HIT'|'SUNK'|'MISS'} | null>(null);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);

  // Refs
  const lastCpuHitRef = useRef<{ r: number, c: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const handleDataRef = useRef<any>(null);

  // Identity
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();
  
  // Audio Destructuring
  const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit, playSplash } = audio;

  // --- INITIALIZATION ---
  useEffect(() => {
      mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

  useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp.connect();
        } else {
            mp.disconnect();
        }
        return () => mp.disconnect();
  }, [gameMode]);

  useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (phase === 'PLAYING') resetGame();
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
        }
  }, [mp.mode, mp.isHost, mp.players, mp.peerId]);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => { setNotification(null); }, 1500);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const resetGame = useCallback(() => {
    setPhase('SETUP');
    setTurn('PLAYER');
    setWinner(null);
    setPlayerGrid(createEmptyGrid());
    setCpuGrid(createEmptyGrid());
    setCpuRealGrid(createEmptyGrid());
    setPlayerShips([]);
    setCpuShips([]);
    
    setSetupGrid(createEmptyGrid());
    setSetupShips([]);
    setSelectedShipType(null);
    
    setEarnedCoins(0);
    lastCpuHitRef.current = null;
    setNotification(null);
    setIsReady(false);
    setOpponentReady(false);
    if (onReportProgress) onReportProgress('play', 1);
  }, [onReportProgress]);

  // --- GAME LOGIC ---

  const handleGameOver = useCallback((w: 'PLAYER' | 'CPU') => {
      setWinner(w);
      setPhase('GAMEOVER');
      if (w === 'PLAYER') {
          playVictory();
          addCoins(100);
          setEarnedCoins(100);
          if (onReportProgress) onReportProgress('win', 1);
      } else {
          playGameOver();
      }
  }, [addCoins, playVictory, playGameOver, onReportProgress]);

  const handleIncomingShot = useCallback((r: number, c: number) => {
      const isHit = playerGrid[r][c] === 1;
      const newGrid = playerGrid.map(row => [...row]);
      newGrid[r][c] = isHit ? 3 : 2;
      setPlayerGrid(newGrid);

      let resultStatus: 'HIT'|'MISS'|'SUNK' = isHit ? 'HIT' : 'MISS';
      let sunkShipDetails = null;

      if (isHit) {
          playBlockHit();
          setShakeBoard(true); setTimeout(() => setShakeBoard(false), 500);
          const newShips = playerShips.map(s => ({ ...s }));
          const update = checkHit(r, c, newShips);
          if (update.sunk) {
              playShipSink();
              resultStatus = 'SUNK';
              const s = newShips.find(sh => sh.id === update.shipId);
              if (s) sunkShipDetails = { type: s.type, size: s.size, orientation: s.orientation, row: s.row, col: s.col, sunk: true };
              setNotification({ text: "ALERTE ! NAVIRE PERDU", type: 'SUNK' });
          } else {
              setNotification({ text: "IMPACT !", type: 'HIT' });
          }
          setPlayerShips(newShips);
          if (newShips.every(s => s.sunk)) {
              handleGameOver('CPU'); // I lost
          }
      } else {
          playSplash();
          setTurn('PLAYER'); // My turn now
      }

      if (gameMode === 'ONLINE') {
          mp.sendData({ type: 'BATTLESHIP_RESULT', r, c, status: resultStatus, shipDetails: sunkShipDetails });
      }
  }, [playerGrid, playerShips, gameMode, mp, handleGameOver, playBlockHit, playShipSink, playSplash]);

  // --- ONLINE DATA HANDLER ---
  useEffect(() => {
    handleDataRef.current = (data: any) => {
        if (data.type === 'BATTLESHIP_READY') setOpponentReady(true);
        if (data.type === 'BATTLESHIP_SHOT') {
            const { r, c } = data;
            // Opponent shot at me
            handleIncomingShot(r, c);
        }
        if (data.type === 'BATTLESHIP_RESULT') {
            const { r, c, status, shipDetails } = data;
            // My shot result
            handleShotResult(r, c, status, shipDetails);
        }
        if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
        if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
        if (data.type === 'LEAVE_GAME') { handleGameOver('PLAYER'); }
        if (data.type === 'REMATCH_START') resetGame();
    };
  });

  useEffect(() => {
    const unsubscribe = mp.subscribe((data: any) => {
        if(handleDataRef.current) handleDataRef.current(data);
    });
    return () => unsubscribe();
  }, [mp]);

  const handleShotResult = (r: number, c: number, status: 'HIT'|'MISS'|'SUNK', shipDetails: any) => {
      const newCpuGrid = cpuGrid.map(row => [...row]);
      newCpuGrid[r][c] = (status === 'HIT' || status === 'SUNK') ? 3 : 2;
      setCpuGrid(newCpuGrid);

      if (status === 'HIT' || status === 'SUNK') {
          playBlockHit();
          if (status === 'SUNK') {
              playShipSink();
              setNotification({ text: "NAVIRE ENNEMI COULÉ !", type: 'SUNK' });
              
              if (gameMode === 'ONLINE') {
                  if (shipDetails) setCpuShips(prev => [...prev, { ...shipDetails, id: `enemy-${Date.now()}` }]);
                  
                  // Check Win Condition (Simple count check for online visual)
                  // In SOLO, win condition is handled in handleAttack, so this is strictly for ONLINE visual state
                  const sunkCount = cpuShips.length + 1; 
                  if (sunkCount >= 5) handleGameOver('PLAYER');
              } else {
                  // In Solo, handleAttack already managed state and win condition
                  // Just report progress here if needed
                  if (onReportProgress) onReportProgress('action', 1);
              }
              
              if (gameMode === 'ONLINE' && onReportProgress) onReportProgress('action', 1);

          } else {
              setNotification({ text: "TOUCHÉ !", type: 'HIT' });
          }
          // Bonus Turn if hit
      } else {
          playSplash();
          setTurn('CPU');
      }
  };

  // --- SETUP INTERACTION ---

  const handleSetupCellClick = (r: number, c: number) => {
      // 1. If ship selected from inventory, try place
      if (selectedShipType) {
          const config = SHIPS_CONFIG.find(s => s.type === selectedShipType);
          if (!config) return;
          
          if (isValidPlacement(setupGrid, r, c, config.size, orientation)) {
              const newShip: ShipType = {
                  id: `ship-${selectedShipType}`,
                  type: selectedShipType,
                  size: config.size,
                  orientation,
                  row: r, col: c, hits: 0, sunk: false
              };
              const newGrid = setupGrid.map(row => [...row]);
              placeShipOnGrid(newGrid, newShip);
              setSetupGrid(newGrid);
              setSetupShips([...setupShips, newShip]);
              setSelectedShipType(null); // Deselect
              playMove();
          } else {
              playWallHit(); // Invalid placement
          }
          return;
      }

      // 2. If clicking existing ship, remove it (Pick up)
      const clickedShip = setupShips.find(s => {
          if (s.orientation === 'horizontal') return r === s.row && c >= s.col && c < s.col + s.size;
          return c === s.col && r >= s.row && r < s.row + s.size;
      });

      if (clickedShip) {
          // Remove from grid
          const newGrid = createEmptyGrid();
          const newShips = setupShips.filter(s => s.id !== clickedShip.id);
          newShips.forEach(s => placeShipOnGrid(newGrid, s));
          setSetupGrid(newGrid);
          setSetupShips(newShips);
          setSelectedShipType(clickedShip.type); // Put back in hand
          playPaddleHit();
      }
  };

  const randomizeSetup = () => {
      const { grid, ships } = generateRandomShips();
      setSetupGrid(grid);
      setSetupShips(ships);
      setSelectedShipType(null);
      playMove();
  };

  const startBattle = () => {
      if (setupShips.length < 5) return;
      
      setPlayerShips(setupShips);
      setPlayerGrid(setupGrid);
      
      if (gameMode === 'SOLO') {
          const { grid: cpuG, ships: cpuS } = generateRandomShips();
          setCpuRealGrid(cpuG);
          setCpuShips(cpuS); // Hidden, used for logic
          setPhase('PLAYING');
          playVictory();
      } else {
          setIsReady(true);
          mp.sendData({ type: 'BATTLESHIP_READY' });
      }
  };

  // --- GAMEPLAY INTERACTION ---

  const handleAttack = (r: number, c: number) => {
      if (phase !== 'PLAYING' || turn !== 'PLAYER') return;
      if (cpuGrid[r][c] !== 0) return; // Already shot there

      playLaserShoot();

      if (gameMode === 'ONLINE') {
          mp.sendData({ type: 'BATTLESHIP_SHOT', r, c });
      } else {
          // Solo Logic
          const isHit = cpuRealGrid[r][c] === 1;
          // CPU Ship Logic Check
          let resultStatus: 'HIT'|'MISS'|'SUNK' = isHit ? 'HIT' : 'MISS';
          let sunkShipDetails = null;

          if (isHit) {
              // Update hidden CPU ships
              const newCpuShips = cpuShips.map(s => ({...s}));
              const update = checkHit(r, c, newCpuShips);
              if (update.sunk) {
                  resultStatus = 'SUNK';
                  const s = newCpuShips.find(sh => sh.id === update.shipId);
                  if (s) sunkShipDetails = s;
              }
              setCpuShips(newCpuShips); // Update hidden state
              
              if (newCpuShips.every(s => s.sunk)) {
                  handleGameOver('PLAYER');
              }
          }

          // Update Visual Grid
          handleShotResult(r, c, resultStatus, sunkShipDetails);
      }
  };

  // CPU Turn Effect
  useEffect(() => {
      if (gameMode === 'SOLO' && phase === 'PLAYING' && turn === 'CPU') {
          const timer = setTimeout(() => {
              const move = getCpuMove(playerGrid, lastCpuHitRef.current);
              handleIncomingShot(move.r, move.c);
              
              // Refined logic: If hit, keep target. If missed but had a target, maybe try another around it next time (getCpuMove handles this if ref persists, but we update ref here based on result)
              if (playerGrid[move.r][move.c] === 1) { 
                  lastCpuHitRef.current = move; 
              } else {
                  lastCpuHitRef.current = null;
              }
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [turn, phase, gameMode, playerGrid, playerShips, handleIncomingShot]); // Added playerShips and handleIncomingShot

  // Sync Start for Online
  useEffect(() => {
      if (gameMode === 'ONLINE' && isReady && opponentReady && phase === 'SETUP') {
          setPhase('PLAYING');
          setTurn(mp.isHost ? 'PLAYER' : 'CPU');
          playVictory();
      }
  }, [isReady, opponentReady, gameMode, phase, mp.isHost]);


  // --- RENDERERS ---

  const renderGrid = (gridData: Grid, onClick?: (r: number, c: number) => void, showShips: boolean = false, ships: ShipType[] = []) => {
      return (
          <div className="grid grid-cols-10 grid-rows-10 w-full aspect-square border-2 border-white/20 bg-black/60 rounded-lg overflow-hidden relative shadow-inner">
                {/* Ship Layer (Absolute) */}
                {showShips && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {ships.map(ship => (
                            <div key={ship.id} style={{ 
                                position: 'absolute', 
                                left: `${ship.col * 10}%`, 
                                top: `${ship.row * 10}%`, 
                                width: ship.orientation === 'horizontal' ? `${ship.size * 10}%` : '10%', 
                                height: ship.orientation === 'vertical' ? `${ship.size * 10}%` : '10%' 
                            }}>
                                <ShipVisual type={ship.type} size={ship.size} orientation={ship.orientation} isSunk={ship.sunk} isGhost={false} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Cells Layer */}
                {Array.from({ length: 100 }).map((_, i) => {
                    const r = Math.floor(i / 10);
                    const c = i % 10;
                    const val = gridData[r][c]; // 0, 1, 2, 3
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => onClick && onClick(r, c)}
                            className={`border border-white/5 w-full h-full relative flex items-center justify-center ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}`}
                        >
                            {(val === 2 || val === 3) && <Marker status={val as 2|3} />}
                        </div>
                    );
                })}
          </div>
      );
  };

  const renderInventory = () => {
      return (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
              {SHIPS_CONFIG.map(config => {
                  const placed = setupShips.find(s => s.type === config.type);
                  const isSelected = selectedShipType === config.type;
                  return (
                      <button 
                        key={config.type}
                        onClick={() => setSelectedShipType(config.type)}
                        disabled={!!placed}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            placed ? 'bg-gray-800 border-gray-700 text-gray-500 opacity-50' :
                            isSelected ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_cyan]' :
                            'bg-gray-900 border-white/20 text-cyan-400 hover:bg-gray-800'
                        }`}
                      >
                          {config.label} ({config.size})
                      </button>
                  );
              })}
          </div>
      );
  };

  const handleLocalBack = () => {
      if (phase === 'SETUP' || phase === 'PLAYING' || phase === 'GAMEOVER') {
          if (gameMode === 'ONLINE') {
              mp.leaveGame();
              setOnlineStep('lobby');
          }
          setPhase('MENU');
      } else if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
          mp.disconnect();
          setPhase('MENU');
      } else {
          onBack();
      }
  };

  const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        const otherPlayers = mp.players.filter(p => p.status !== 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-teal-300 tracking-wider drop-shadow-md">LOBBY BATAILLE</h3>
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

  // --- VIEWS ---

  if (phase === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22c55e]">NEON FLEET</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => { setGameMode('SOLO'); setPhase('SETUP'); }} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                    <Cpu size={24} className="text-neon-blue"/> 1 JOUEUR
                </button>
                <button onClick={() => { setGameMode('ONLINE'); setPhase('SETUP'); }} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
  }

  if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-4">
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
             <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-300 pr-2 pb-1">BATAILLE</h1>
                <div className="w-10"></div>
            </div>
            {renderLobby()}
        </div>
      );
  }
  
  if (gameMode === 'ONLINE' && onlineStep === 'connecting') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black/20 text-white p-4">
             <Loader2 size={48} className="text-teal-400 animate-spin mb-4" />
             <p className="text-teal-300 font-bold">CONNEXION...</p>
        </div>
      );
  }

  return (
    <div className={`h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-2 select-none touch-none ${shakeBoard ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <style>{`@keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-5px, 5px); } 75% { transform: translate(5px, -5px); } }`}</style>
        
        {/* Background FX */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
        
        {notification && (
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-xl border-2 flex flex-col items-center animate-in zoom-in duration-200 ${notification.type === 'HIT' ? 'bg-red-900/90 border-red-500 shadow-[0_0_30px_red]' : 'bg-green-900/90 border-green-500 shadow-[0_0_30px_lime]'}`}>
                <span className="text-2xl font-black italic tracking-widest text-white drop-shadow-md">{notification.text}</span>
            </div>
        )}

        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10 mb-2 shrink-0">
            <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 pr-2">NEON FLEET</h1>
                {phase === 'PLAYING' && (
                    <div className="flex gap-4 text-[10px] font-bold text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                        <span className="text-red-400 flex items-center gap-1"><Target size={10}/> {5 - cpuShips.filter(s=>s.sunk).length} ENNEMIS</span>
                        <span className="text-cyan-400 flex items-center gap-1"><ShieldAlert size={10}/> {5 - playerShips.filter(s=>s.sunk).length} ALLIÉS</span>
                    </div>
                )}
            </div>
            <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
        </div>

        {phase === 'SETUP' && (
            <div className="flex-1 w-full max-w-md flex flex-col items-center z-10 pb-4 overflow-y-auto">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-white mb-1">DÉPLOIEMENT</h2>
                    <p className="text-xs text-gray-400">1. Sélectionnez un navire<br/>2. Touchez la grille pour placer</p>
                </div>

                <div className="w-full max-w-[350px]">
                    {renderGrid(setupGrid, handleSetupCellClick, true, setupShips)}
                </div>

                {renderInventory()}

                <div className="flex gap-4 mt-4 w-full justify-center">
                    <button onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95">
                        <RotateCw size={14}/> {orientation === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'}
                    </button>
                    <button onClick={randomizeSetup} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95">
                        <RefreshCw size={14}/> ALÉATOIRE
                    </button>
                </div>

                <button 
                    onClick={startBattle} 
                    disabled={setupShips.length < 5 || (gameMode==='ONLINE' && isReady)}
                    className={`mt-6 w-full max-w-[300px] py-3 rounded-xl font-black tracking-widest text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${setupShips.length === 5 ? (isReady ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black hover:scale-105') : 'bg-gray-800 text-gray-600'}`}
                >
                    {isReady ? <><Loader2 className="animate-spin" size={20}/> EN ATTENTE...</> : <><Play size={20} fill="black"/> COMBATTRE</>}
                </button>
            </div>
        )}

        {phase === 'PLAYING' && (
            <div className="flex-1 w-full max-w-md flex flex-col items-center z-10">
                <div className={`mb-4 px-4 py-1 rounded-full border text-xs font-bold shadow-lg transition-colors ${turn === 'PLAYER' ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {turn === 'PLAYER' ? "À VOUS DE TIRER" : "L'ENNEMI VISE..."}
                </div>

                {/* ENEMY GRID (Target) */}
                <div className="w-full max-w-[350px] mb-6 relative">
                    <div className="absolute -top-6 left-0 text-[10px] font-bold text-red-400 tracking-widest">ZONE ENNEMIE</div>
                    {renderGrid(cpuGrid, handleAttack, true, cpuShips.filter(s => s.sunk))}
                </div>

                {/* PLAYER GRID (Mini) */}
                <div className="w-[180px] relative opacity-90">
                    <div className="absolute -top-5 left-0 text-[10px] font-bold text-cyan-400 tracking-widest">MA FLOTTE</div>
                    {renderGrid(playerGrid, undefined, true, playerShips)}
                </div>
            </div>
        )}

        {phase === 'GAMEOVER' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
                {winner === 'PLAYER' ? (
                    <>
                        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">VICTOIRE !</h2>
                        <p className="text-green-400 font-bold mb-6">FLOTTE ENNEMIE DÉTRUITE</p>
                        {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                    </>
                ) : (
                    <>
                        <Anchor size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">DÉFAITE...</h2>
                        <p className="text-red-400 font-bold mb-6">VOTRE FLOTTE A COULÉ</p>
                    </>
                )}
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <button onClick={resetGame} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2"><RefreshCw size={20} /> REJOUER</button>
                        {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                    </div>
                    <button onClick={handleLocalBack} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">RETOUR AU MENU</button>
                </div>
            </div>
        )}
    </div>
  );
};
