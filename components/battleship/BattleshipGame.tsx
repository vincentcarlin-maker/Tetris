
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, Crosshair, Anchor, ShieldAlert, Coins, RotateCw, Play, Trash2, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, Loader2, Cpu, Globe, ArrowLeft, X, Radio, HelpCircle, MousePointer2, Ship } from 'lucide-react';
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
    const [showWave, setShowWave] = useState(true);

    useEffect(() => {
        if (status === 2) {
            const timer = setTimeout(() => setShowWave(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (status === 2) { // MISS - WATER
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Vague bleue temporaire */}
                {showWave && (
                    <>
                        <div className="absolute w-full h-full border-2 border-cyan-400 rounded-full animate-[ping_1s_ease-out_infinite] opacity-60"></div>
                        <div className="absolute w-2/3 h-2/3 border border-cyan-500/50 rounded-full animate-[ping_1.5s_ease-out_infinite] opacity-40"></div>
                    </>
                )}
                {/* Point central permanent */}
                <div className="w-1.5 h-1.5 bg-cyan-200/50 rounded-full shadow-[0_0_8px_cyan]"></div>
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
  const [showTutorial, setShowTutorial] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const handleDataRef = useRef<any>(null);

  // Identity
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();
  
  // Audio Destructuring
  const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit, playSplash } = audio;

  // Check localStorage for tutorial seen
  useEffect(() => {
      const hasSeen = localStorage.getItem('neon_battleship_tutorial_seen');
      if (!hasSeen) {
          setShowTutorial(true);
          localStorage.setItem('neon_battleship_tutorial_seen', 'true');
      }
  }, []);

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
      if (showTutorial) return;
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
      if (phase !== 'PLAYING' || turn !== 'PLAYER' || showTutorial) return;
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
      if (gameMode === 'SOLO' && phase === 'PLAYING' && turn === 'CPU' && !showTutorial) {
          const timer = setTimeout(() => {
              // New AI logic analyzes the whole board state, no need for refs
              const move = getCpuMove(playerGrid);
              handleIncomingShot(move.r, move.c);
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [turn, phase, gameMode, playerGrid, playerShips, handleIncomingShot, showTutorial]);

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