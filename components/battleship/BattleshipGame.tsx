
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, Crosshair, Anchor, ShieldAlert, Coins, RotateCw, Play, Ship, Trash2, AlertCircle, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, LogOut, Loader2, Cpu, Globe, ArrowLeft } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { GRID_SIZE, createEmptyGrid, generateRandomShips, checkHit, getCpuMove, SHIPS_CONFIG, isValidPlacement, placeShipOnGrid } from './logic';
import { Grid, Ship as ShipType, CellStatus, ShipType as ShipTypeName } from './types';

interface BattleshipGameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>; // Shared connection
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

// --- COMPOSANT VISUEL NAVIRE ---
const ShipVisual: React.FC<{ type: ShipTypeName, size: number, orientation: 'horizontal' | 'vertical', isSunk: boolean, isGhost?: boolean, isValid?: boolean, isSelected?: boolean }> = ({ type, size, orientation, isSunk, isGhost, isValid, isSelected }) => {
    const isVertical = orientation === 'vertical';
    
    // Style du conteneur du bateau
    const style: React.CSSProperties = {
        position: 'absolute',
        top: '2%', 
        left: '2%',
        width: '96%',
        height: '96%',
        pointerEvents: 'none',
        zIndex: isGhost ? 20 : 10,
        transition: isGhost ? 'none' : 'all 0.3s ease', 
        filter: isSunk ? 'none' : isGhost ? 'none' : isSelected ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) brightness(1.2)' : 'drop-shadow(0 0 5px rgba(0, 243, 255, 0.5))',
        opacity: isGhost ? 0.7 : 1
    };

    let strokeColor = '#00f3ff';
    let fillColor = 'rgba(10, 10, 20, 0.9)';
    let detailColor = 'rgba(0, 243, 255, 0.3)';

    if (isSunk) {
        strokeColor = '#ef4444'; 
        fillColor = 'rgba(40, 0, 0, 0.95)';
        detailColor = '#7f1d1d';
    } else if (isGhost) {
        strokeColor = isValid ? '#22c55e' : '#ef4444'; 
        fillColor = isValid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        detailColor = isValid ? '#4ade80' : '#f87171';
    } else if (isSelected) {
        strokeColor = '#ff00ff'; // Pink instead of green
        fillColor = 'rgba(255, 0, 255, 0.2)'; 
        detailColor = '#ff00ff';
    }

    const renderShipSVG = () => {
        const vbWidth = isVertical ? 100 : size * 100;
        const vbHeight = isVertical ? size * 100 : 100;
        const viewBox = `0 0 ${vbWidth} ${vbHeight}`;
        
        let path = "";
        let details = null;

        const W = isVertical ? 100 : size * 100;
        const H = isVertical ? size * 100 : 100;
        const mx = isVertical ? 25 : 5;
        const my = isVertical ? 5 : 25;
        const dw = W - 2 * mx;
        const dh = H - 2 * my;

        if (type === 'CARRIER') {
            if (!isVertical) {
                path = `M ${mx+10},${my} L ${W-mx-10},${my} L ${W-mx},${my+dh/2} L ${W-mx-10},${H-my} L ${mx+10},${H-my} L ${mx},${my+dh/2} Z`;
                details = (<><line x1={mx+20} y1={H/2} x2={W-mx-30} y2={H/2} stroke={detailColor} strokeWidth="3" strokeDasharray="10,10" /><rect x={W-mx-50} y={my+5} width="20" height="15" fill={detailColor} rx="2" /></>);
            } else {
                path = `M ${mx},${my+10} L ${mx},${H-my-10} L ${mx+dw/2},${H-my} L ${W-mx},${H-my-10} L ${W-mx},${my+10} L ${mx+dw/2},${my} Z`;
                details = (<><line x1={W/2} y1={my+20} x2={W/2} y2={H-my-30} stroke={detailColor} strokeWidth="3" strokeDasharray="10,10" /><rect x={W-mx-20} y={H-my-50} width="15" height="20" fill={detailColor} rx="2" /></>);
            }
        } else if (type === 'BATTLESHIP') {
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+30},${my} L ${W-mx-10},${my} L ${W-mx-10},${H-my} L ${mx+30},${H-my} Z`;
                details = (<><circle cx={mx+50} cy={H/2} r="8" fill="none" stroke={detailColor} strokeWidth="2" /><line x1={mx+50} y1={H/2} x2={mx+80} y2={H/2} stroke={detailColor} strokeWidth="2" /><circle cx={W-mx-50} cy={H/2} r="8" fill="none" stroke={detailColor} strokeWidth="2" /><line x1={W-mx-50} y1={H/2} x2={W-mx-80} y2={H/2} stroke={detailColor} strokeWidth="2" /><rect x={W/2-20} y={my+10} width="40" height="30" fill={detailColor} opacity="0.5" /></>);
            } else {
                path = `M ${W/2},${my} L ${mx},${my+30} L ${mx},${H-my-10} L ${W-mx},${H-my-10} L ${W-mx},${my+30} Z`;
                details = (<><circle cx={W/2} cy={my+50} r="8" fill="none" stroke={detailColor} strokeWidth="2" /><line x1={W/2} y1={my+50} x2={W/2} y2={my+80} stroke={detailColor} strokeWidth="2" /><circle cx={W/2} cy={H-my-50} r="8" fill="none" stroke={detailColor} strokeWidth="2" /><rect x={mx+10} y={H/2-20} width="30" height="40" fill={detailColor} opacity="0.5" /></>);
            }
        } else if (type === 'CRUISER') {
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+20},${my} L ${W-mx-15},${my} L ${W-mx},${H/2} L ${W-mx-15},${H-my} L ${mx+20},${H-my} Z`;
                details = (<><circle cx={W/2} cy={H/2} r="10" stroke={detailColor} strokeWidth="2" fill="none" /><line x1={mx+40} y1={H/2} x2={mx+60} y2={H/2} stroke={detailColor} strokeWidth="2" /></>);
            } else {
                path = `M ${W/2},${my} L ${mx},${my+20} L ${mx},${H-my-15} L ${W/2},${H-my} L ${W-mx},${H-my-15} L ${W-mx},${my+20} Z`;
                details = (<><circle cx={W/2} cy={H/2} r="10" stroke={detailColor} strokeWidth="2" fill="none" /><line x1={W/2} y1={my+40} x2={W/2} y2={my+60} stroke={detailColor} strokeWidth="2" /></>);
            }
        } else if (type === 'SUBMARINE') {
            if (!isVertical) {
                path = `M ${mx+10},${H/2} Q ${mx+10},${my} ${W/2},${my} Q ${W-mx-10},${my} ${W-mx-10},${H/2} Q ${W-mx-10},${H-my} ${W/2},${H-my} Q ${mx+10},${H-my} ${mx+10},${H/2}`;
                details = <circle cx={W/2} cy={H/2} r="6" fill={detailColor} />;
            } else {
                path = `M ${W/2},${my+10} Q ${mx},${my+10} ${mx},${H/2} Q ${mx},${H-my-10} ${W/2},${H-my-10} Q ${W-mx},${H-my-10} ${W-mx},${H/2} Q ${W-mx},${my+10} ${W/2},${my+10}`;
                details = <circle cx={W/2} cy={H/2} r="6" fill={detailColor} />;
            }
        } else if (type === 'DESTROYER') {
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+15},${my+5} L ${W-mx},${my+5} L ${W-mx},${H-my-5} L ${mx+15},${H-my-5} Z`;
                details = <line x1={mx+20} y1={H/2} x2={mx+35} y2={H/2} stroke={detailColor} strokeWidth="2" />;
            } else {
                path = `M ${W/2},${my} L ${mx+5},${my+15} L ${mx+5},${H-my} L ${W-mx-5},${H-my} L ${W-mx-5},${my+15} Z`;
                details = <line x1={W/2} y1={my+20} x2={W/2} y2={my+35} stroke={detailColor} strokeWidth="2" />;
            }
        }

        return (
            <svg viewBox={viewBox} className="w-full h-full" style={isSelected ? { filter: 'drop-shadow(0 0 4px #ff00ff)' } : {}}>
                <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={isSelected ? "4" : "3"} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                {details}
                {isSunk && (<><line x1="5" y1="5" x2={vbWidth-5} y2={vbHeight-5} stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.8" /><line x1={vbWidth-5} y1="5" x2="5" y2={vbHeight-5} stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.8" /><rect x="2" y="2" width={vbWidth-4} height={vbHeight-4} fill="none" stroke="#ef4444" strokeWidth="6" rx="5" /></>)}
            </svg>
        );
    };

    return <div style={style}>{renderShipSVG()}</div>;
};


export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
  // --- Game State ---
  const [phase, setPhase] = useState<'MENU' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
  const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
  
  // --- Online State ---
  const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  // --- Grids ---
  const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
  const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid());
  const [cpuRealGrid, setCpuRealGrid] = useState<Grid>(createEmptyGrid()); 
  
  const [playerShips, setPlayerShips] = useState<ShipType[]>([]);
  const [cpuShips, setCpuShips] = useState<ShipType[]>([]);
  
  // --- Setup Phase ---
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [setupGrid, setSetupGrid] = useState<Grid>(createEmptyGrid());
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  
  // --- Input Handling ---
  const setupGridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{r: number, c: number}>({ r: 0, c: 0 });
  const [hoverCell, setHoverCell] = useState<{r: number, c: number} | null>(null);
  const pointerStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const pressedShipRef = useRef<ShipType | null>(null);
  const isDragStartedRef = useRef(false);
  const [draggedShipOriginal, setDraggedShipOriginal] = useState<ShipType | null>(null);

  const [notification, setNotification] = useState<{text: string, subtext?: string, type: 'HIT'|'SUNK'|'MISS'} | null>(null);
  const [missile, setMissile] = useState<{ r: number, c: number, target: 'PLAYER' | 'CPU' } | null>(null);
  const lastCpuHitRef = useRef<{ r: number, c: number } | null>(null);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit, resumeAudio } = audio;
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();

  const handleDataRef = useRef<any>(null);

  const handleGameOver = useCallback((w: 'PLAYER' | 'CPU') => {
    setWinner(w);
    setPhase('GAMEOVER');
    if (w === 'PLAYER') {
      playVictory();
      const reward = 100;
      addCoins(reward);
      setEarnedCoins(reward);
      if (onReportProgress) onReportProgress('win', 1);
    } else { playGameOver(); }
  }, [addCoins, playGameOver, playVictory, onReportProgress]);
  
  const resetGame = useCallback(() => {
    // Keep mode but reset to Setup
    setPhase('SETUP');
    setTurn('PLAYER');
    setWinner(null);
    setPlayerGrid(createEmptyGrid());
    setCpuGrid(createEmptyGrid());
    setCpuRealGrid(createEmptyGrid());
    setPlayerShips([]);
    setCpuShips([]);
    setSetupGrid(createEmptyGrid());
    setCurrentShipIndex(0);
    setEarnedCoins(0);
    lastCpuHitRef.current = null;
    setNotification(null);
    setMissile(null);
    setIsDragging(false);
    setHoverCell(null);
    setDragOffset({ r: 0, c: 0 });
    setDraggedShipOriginal(null);
    setSelectedShipId(null);
    pointerStartRef.current = null;
    pressedShipRef.current = null;
    isDragStartedRef.current = false;
    setIsReady(false);
    setOpponentReady(false);
    setOpponentLeft(false);
    if (onReportProgress) onReportProgress('play', 1);
  }, [onReportProgress]);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => { setNotification(null); }, 2000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
      mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

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

  useEffect(() => {
        const isHosting = mp.players.find(p => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (phase === 'PLAYING') resetGame();
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
        }
  }, [mp.mode, mp.isHost, mp.players, mp.peerId, phase, resetGame]);

  // Stable Multiplayer Data Handler
  useEffect(() => {
    handleDataRef.current = (data: any) => {
        const handleOnlineShotReceived = (r: number, c: number) => {
            if (phase === 'GAMEOVER') return;
            launchAttack(r, c, 'PLAYER', () => {
                const isHit = playerGrid[r][c] === 1;
                const newPlayerGrid = playerGrid.map(row => [...row]);
                newPlayerGrid[r][c] = isHit ? 3 : 2;
                setPlayerGrid(newPlayerGrid);
      
                let resultStatus: 'HIT' | 'MISS' | 'SUNK' = isHit ? 'HIT' : 'MISS';
                let sunkShipDetails = null;
      
                if (isHit) {
                    playBlockHit();
                    const newPlayerShips = playerShips.map(s => ({ ...s }));
                    const update = checkHit(r, c, newPlayerShips);
                    if (update.sunk) {
                        playShipSink();
                        resultStatus = 'SUNK';
                        const sunkShip = newPlayerShips.find(s => s.id === update.shipId);
                        if (sunkShip) sunkShipDetails = { type: sunkShip.type, size: sunkShip.size, orientation: sunkShip.orientation, row: sunkShip.row, col: sunkShip.col, sunk: true };
                        setNotification({ text: "ALERTE !", subtext: "NAVIRE COULÉ", type: 'SUNK' });
                    } else {
                        setNotification({ text: "IMPACT !", type: 'HIT' });
                    }
                    setPlayerShips(newPlayerShips);
                    if (newPlayerShips.every(s => s.sunk)) {
                        handleGameOver('CPU');
                        mp.sendData({ type: 'BATTLESHIP_RESULT', r, c, status: resultStatus, shipDetails: sunkShipDetails });
                        return;
                    }
                } else {
                    playWallHit();
                    setTurn('PLAYER');
                }
                mp.sendData({ type: 'BATTLESHIP_RESULT', r, c, status: resultStatus, shipDetails: sunkShipDetails });
            });
        };
        
        const handleOnlineResultReceived = (r: number, c: number, status: 'HIT'|'MISS'|'SUNK', shipDetails: any) => {
            if (phase === 'GAMEOVER') return;
            const newCpuGrid = cpuGrid.map(row => [...row]);
            newCpuGrid[r][c] = (status === 'HIT' || status === 'SUNK') ? 3 : 2;
            setCpuGrid(newCpuGrid);
      
            if (status === 'HIT' || status === 'SUNK') {
                playBlockHit();
                if (status === 'SUNK') {
                    playShipSink();
                    setNotification({ text: "COULÉ !", type: 'SUNK' });
                    if (shipDetails) setCpuShips(prev => [...prev, { ...shipDetails, id: `enemy-ship-${Date.now()}` }]);
                    else setCpuShips(prev => [...prev, { id: 'unknown', sunk: true } as ShipType]);
                    
                    if (onReportProgress) onReportProgress('action', 1);

                    const newSunkCount = cpuShips.filter(s => s.sunk).length + 1;
                    if (newSunkCount >= SHIPS_CONFIG.length) {
                        handleGameOver('PLAYER');
                        return;
                    }
                } else {
                    setNotification({ text: "TOUCHÉ !", type: 'HIT' });
                }
                setTurn('PLAYER'); 
            } else {
                playWallHit();
                setTurn('CPU');
            }
        };

        switch (data.type) {
            case 'BATTLESHIP_READY': setOpponentReady(true); break;
            case 'BATTLESHIP_SHOT': handleOnlineShotReceived(data.r, data.c); break;
            case 'BATTLESHIP_RESULT': handleOnlineResultReceived(data.r, data.c, data.status, data.shipDetails); break;
            case 'REMATCH_START': resetGame(); break;
            case 'CHAT': setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]); break;
            case 'REACTION': setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); break;
            case 'LEAVE_GAME': setOpponentLeft(true); setPhase('GAMEOVER'); break;
        }
    };
  });

  // Multiplayer Subscription
  useEffect(() => {
    const unsubscribe = mp.subscribe((data: any) => {
        if(handleDataRef.current) {
            handleDataRef.current(data);
        }
    });
    return () => unsubscribe();
  }, [mp]);

  const clearSetup = () => {
      setSetupGrid(createEmptyGrid());
      setPlayerShips([]);
      setCurrentShipIndex(0);
      setSelectedShipId(null);
  };

  const randomizePlayerShips = () => {
    const { grid, ships } = generateRandomShips();
    setSetupGrid(grid);
    setPlayerShips(ships);
    setCurrentShipIndex(SHIPS_CONFIG.length);
    setSelectedShipId(null);
    playMove();
  };

  const findNextAvailableShipIndex = (currentShips: ShipType[]) => {
      const placedCounts: {[key: string]: number} = {};
      currentShips.forEach(s => { placedCounts[s.type] = (placedCounts[s.type] || 0) + 1; });
      for (let i = 0; i < SHIPS_CONFIG.length; i++) {
          if (!placedCounts[SHIPS_CONFIG[i].type]) return i;
      }
      return SHIPS_CONFIG.length;
  };

  // --- POINTER EVENTS ---
  const getGridCoords = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (!setupGridRef.current) return null;
    const rect = setupGridRef.current.getBoundingClientRect();
    let clientX, clientY;
    // @ts-ignore
    if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    // @ts-ignore
    else if ((e as any).changedTouches && (e as any).changedTouches.length > 0) { clientX = (e as any).changedTouches[0].clientX; clientY = (e as any).changedTouches[0].clientY; }
    else { clientX = (e as any).clientX; clientY = (e as any).clientY; }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let c = Math.floor((x / rect.width) * 10);
    let r = Math.floor((y / rect.height) * 10);
    if (c < 0) c = 0; if (c > 9) c = 9;
    if (r < 0) r = 0; if (r > 9) r = 9;
    return { r, c };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'SETUP') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDragStartedRef.current = false;
    pressedShipRef.current = null;
    if (setupGridRef.current) { setupGridRef.current.setPointerCapture(e.pointerId); }
    const coords = getGridCoords(e);
    if (!coords) return;
    const { r, c } = coords;
    const existingShip = playerShips.find(s => {
        if (s.orientation === 'horizontal') return r === s.row && c >= s.col && c < s.col + s.size;
        else return c === s.col && r >= s.row && r < s.row + s.size;
    });
    if (existingShip) {
        pressedShipRef.current = existingShip;
        setDragOffset({ r: r - existingShip.row, c: c - existingShip.col });
    } else {
        if (currentShipIndex < SHIPS_CONFIG.length) {
            setDragOffset({ r: 0, c: 0 });
            setIsDragging(true); 
            isDragStartedRef.current = true;
            setHoverCell({ r, c });
            setDraggedShipOriginal(null);
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (phase !== 'SETUP') return;
    e.preventDefault();
    const coords = getGridCoords(e);
    if (!coords) return;
    if (pressedShipRef.current && !isDragStartedRef.current) {
        if (pointerStartRef.current) {
            const dx = e.clientX - pointerStartRef.current.x;
            const dy = e.clientY - pointerStartRef.current.y;
            if (Math.hypot(dx, dy) > 15) {
                isDragStartedRef.current = true;
                const shipToRemove = pressedShipRef.current;
                setDraggedShipOriginal(shipToRemove);
                const newShips = playerShips.filter(s => s.id !== shipToRemove.id);
                const newGrid = createEmptyGrid();
                newShips.forEach(s => placeShipOnGrid(newGrid, s));
                setPlayerShips(newShips);
                setSetupGrid(newGrid);
                const configIndex = SHIPS_CONFIG.findIndex(conf => conf.type === shipToRemove.type);
                setCurrentShipIndex(configIndex);
                setOrientation(shipToRemove.orientation);
                setSelectedShipId(shipToRemove.id);
                setIsDragging(true);
                setHoverCell({ r: shipToRemove.row, c: shipToRemove.col });
            }
        }
    }
    if (isDragging) {
        const effR = coords.r - dragOffset.r;
        const effC = coords.c - dragOffset.c;
        setHoverCell({ r: effR, c: effC });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (phase !== 'SETUP') return;
    if (setupGridRef.current) { setupGridRef.current.releasePointerCapture(e.pointerId); }
    if (!isDragStartedRef.current && !isDragging) {
        if (pressedShipRef.current) {
            const shipId = pressedShipRef.current.id;
            if (selectedShipId !== shipId) { setSelectedShipId(shipId); playPaddleHit(); }
        } else { setSelectedShipId(null); }
        pressedShipRef.current = null; pointerStartRef.current = null; return;
    }
    setIsDragging(false);
    isDragStartedRef.current = false;
    pressedShipRef.current = null;
    pointerStartRef.current = null;
    let placed = false;
    if (hoverCell && currentShipIndex < SHIPS_CONFIG.length) {
        const { r, c } = hoverCell;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            const shipConfig = SHIPS_CONFIG[currentShipIndex];
            if (isValidPlacement(setupGrid, r, c, shipConfig.size, orientation)) {
                 const newShip: ShipType = { id: draggedShipOriginal?.id || `p-ship-${currentShipIndex}-${Date.now()}`, type: shipConfig.type, size: shipConfig.size, hits: 0, orientation, row: r, col: c, sunk: false };
                  const newGrid = setupGrid.map(row => [...row]);
                  placeShipOnGrid(newGrid, newShip);
                  const updatedShips = [...playerShips, newShip];
                  setSetupGrid(newGrid);
                  setPlayerShips(updatedShips);
                  setCurrentShipIndex(findNextAvailableShipIndex(updatedShips));
                  setSelectedShipId(newShip.id);
                  playMove();
                  setHoverCell(null);
                  setDraggedShipOriginal(null);
                  placed = true;
            }
        }
    }
    if (!placed && draggedShipOriginal) {
        const newGrid = setupGrid.map(row => [...row]);
        placeShipOnGrid(newGrid, draggedShipOriginal);
        const updatedShips = [...playerShips, draggedShipOriginal];
        setSetupGrid(newGrid);
        setPlayerShips(updatedShips);
        setCurrentShipIndex(findNextAvailableShipIndex(updatedShips));
        setDraggedShipOriginal(null);
        setSelectedShipId(draggedShipOriginal.id);
    }
  };
  
  const attemptRotateShip = (ship: ShipType) => {
        const newOrientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        const tempGrid = createEmptyGrid();
        const otherShips = playerShips.filter(s => s.id !== ship.id);
        otherShips.forEach(s => placeShipOnGrid(tempGrid, s));
        if (isValidPlacement(tempGrid, ship.row, ship.col, ship.size, newOrientation)) {
             const newShip: ShipType = { ...ship, orientation: newOrientation };
             placeShipOnGrid(tempGrid, newShip);
             const updatedShips = [...otherShips, newShip];
             setSetupGrid(tempGrid);
             setPlayerShips(updatedShips);
             playMove();
        }
  };

  const handleOrientationToggle = () => {
      if (selectedShipId) { const ship = playerShips.find(s => s.id === selectedShipId); if (ship) attemptRotateShip(ship); } 
      else { setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal'); }
  };
  
  const handleSetupRightClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); handleOrientationToggle(); };

  const startGame = () => {
    if (playerShips.length < SHIPS_CONFIG.length) return;
    if (gameMode === 'SOLO') {
        setPlayerGrid(setupGrid);
        const { grid: cpuReal, ships: cpuS } = generateRandomShips();
        setCpuRealGrid(cpuReal);
        setCpuShips(cpuS);
        setPhase('PLAYING');
        playVictory();
    } else {
        setIsReady(true);
        mp.sendData({ type: 'BATTLESHIP_READY' });
    }
    setSelectedShipId(null);
  };

  useEffect(() => {
      if (gameMode === 'ONLINE' && isReady && opponentReady && phase === 'SETUP') {
          setPlayerGrid(setupGrid);
          setPhase('PLAYING');
          setTurn(mp.isHost ? 'PLAYER' : 'CPU');
          playVictory();
      }
  }, [gameMode, isReady, opponentReady, phase, setupGrid, mp.isHost]);

  const launchAttack = (r: number, c: number, target: 'CPU' | 'PLAYER', callback: () => void) => {
      playLaserShoot();
      setMissile({ r, c, target });
      setTimeout(() => { setMissile(null); callback(); }, 500);
  };

  const handleCellClick = (r: number, c: number) => {
    if (phase !== 'PLAYING' || turn !== 'PLAYER' || missile) return;
    if (cpuGrid[r][c] !== 0) return;

    if (gameMode === 'ONLINE') {
        mp.sendData({ type: 'BATTLESHIP_SHOT', r, c });
    } else {
        launchAttack(r, c, 'CPU', () => {
            const isHit = cpuRealGrid[r][c] === 1;
            const newCpuGrid = cpuGrid.map(row => [...row]);
            newCpuGrid[r][c] = isHit ? 3 : 2;
            setCpuGrid(newCpuGrid);

            if (isHit) {
                playBlockHit();
                const shipUpdate = checkHit(r, c, cpuShips);
                if (shipUpdate.sunk) {
                    playShipSink();
                    const sunkShip = cpuShips.find(s => s.id === shipUpdate.shipId);
                    const shipName = SHIPS_CONFIG.find(sc => sc.type === sunkShip?.type)?.label || sunkShip?.type;
                    setNotification({ text: "COULÉ !", subtext: shipName, type: 'SUNK' });
                    if (onReportProgress) onReportProgress('action', 1);
                } else { setNotification({ text: "TOUCHÉ !", type: 'HIT' }); }
                if (cpuShips.every(s => s.sunk)) { handleGameOver('PLAYER'); return; }
            } else {
                playWallHit();
                setTurn('CPU');
            }
        });
    }
  };

  useEffect(() => {
    if (gameMode === 'SOLO' && phase === 'PLAYING' && turn === 'CPU' && !missile) {
      const timer = setTimeout(() => { cpuFire(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, phase, missile, gameMode]);

  const cpuFire = () => {
    const move = getCpuMove(playerGrid, lastCpuHitRef.current);
    const { r, c } = move;
    launchAttack(r, c, 'PLAYER', () => {
        const isHit = playerGrid[r][c] === 1;
        const newPlayerGrid = playerGrid.map(row => [...row]);
        newPlayerGrid[r][c] = isHit ? 3 : 2;
        setPlayerGrid(newPlayerGrid);

        if (isHit) {
            playBlockHit();
            lastCpuHitRef.current = { r, c };
            const shipUpdate = checkHit(r, c, playerShips);
            if (shipUpdate.sunk) {
                playShipSink();
                lastCpuHitRef.current = null;
                const sunkShip = playerShips.find(s => s.id === shipUpdate.shipId);
                const shipName = SHIPS_CONFIG.find(sc => sc.type === sunkShip?.type)?.label || sunkShip?.type;
                setNotification({ text: "ALERTE !", subtext: `${shipName} COULÉ`, type: 'SUNK' });
            } else { setNotification({ text: "IMPACT !", type: 'HIT' }); }
            if (playerShips.every(s => s.sunk)) { handleGameOver('CPU'); }
        } else {
            playWallHit();
            setTurn('PLAYER');
        }
    });
  };
  
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

  const renderCell = (status: CellStatus, isCpuBoard: boolean, r: number, c: number) => {
    let content = null;
    let bgClass = "bg-blue-900/20 border-blue-500/20";
    if (status === 2) { content = <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-50 animate-pulse"></div>; } 
    else if (status === 3) {
      bgClass = "bg-red-900/40 border-red-500/50 z-20";
      content = (<div className="w-full h-full flex items-center justify-center relative"><div className="absolute inset-0 bg-red-500/30 animate-pulse rounded-full"></div><div className="w-[70%] h-[70%] bg-red-600 rotate-45 transform skew-x-12 shadow-[0_0_10px_red]"></div></div>);
    } 
    const hoverClass = (isCpuBoard && phase === 'PLAYING' && turn === 'PLAYER' && status === 0 && !missile) ? "hover:bg-red-500/20 hover:border-red-400 cursor-crosshair" : "";
    return <div key={`${r}-${c}`} className={`relative w-full h-full border ${bgClass} ${hoverClass} flex items-center justify-center transition-colors pointer-events-none`}>{content}</div>;
  };

  const renderShipsLayer = (ships: ShipType[], isPreview = false) => {
      return (
          <div className="absolute inset-0 w-full h-full pointer-events-none p-1">
              {ships.map((ship) => {
                  if (ship.row === undefined || ship.col === undefined) return null;
                  if (!isPreview && !ship.sunk) return null; 
                  return (
                      <div key={ship.id} style={{ position: 'absolute', left: `${ship.col * 10}%`, top: `${ship.row * 10}%`, width: ship.orientation === 'horizontal' ? `${ship.size * 10}%` : '10%', height: ship.orientation === 'vertical' ? `${ship.size * 10}%` : '10%' }}>
                          <ShipVisual type={ship.type} size={ship.size} orientation={ship.orientation} isSunk={ship.sunk} isGhost={false} isValid={true} /> 
                      </div>
                  );
              })}
          </div>
      );
  };

  // --- MENU VIEW ---
  if (phase === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22c55e]">NEON FLEET</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => { setGameMode('SOLO'); setPhase('SETUP'); setSelectedShipId(null); }} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Cpu size={24} className="text-neon-blue"/> 1 JOUEUR
                </button>
                <button onClick={() => { setGameMode('ONLINE'); setPhase('SETUP'); setSelectedShipId(null); }} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
  }

  if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
      const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={() => { if(gameMode === 'ONLINE') mp.leaveGame(); setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 pr-2 pb-1">NEON FLEET</h1>
                <div className="w-10"></div>
            </div>
            <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-green-300 tracking-wider drop-shadow-md">LOBBY BATAILLE</h3>
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
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie... Créez la vôtre !</p>}
                </div>
             </div>
        </div>
      );
  }

  if (gameMode === 'ONLINE' && onlineStep === 'connecting') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black/90 text-white">
            <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
            <p className="text-green-300 font-bold">CONNEXION...</p>
        </div>
      );
  }

  // --- GAME VIEW ---
  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-2 select-none touch-none">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-transparent pointer-events-none"></div>

        {/* NOTIFICATION OVERLAY */}
        {notification && (
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-xl border-2 flex flex-col items-center animate-in zoom-in duration-200 ${notification.type === 'HIT' ? 'bg-red-900/90 border-red-500 shadow-[0_0_30px_red]' : 'bg-green-900/90 border-green-500 shadow-[0_0_30px_lime]'}`}>
                <span className="text-3xl font-black italic tracking-widest text-white drop-shadow-md">{notification.text}</span>
                {notification.subtext && <span className="text-sm font-bold text-gray-200 mt-1 uppercase">{notification.subtext}</span>}
            </div>
        )}

        {/* Reaction Display */}
        {activeReaction && (() => {
            const reaction = REACTIONS.find(r => r.id === activeReaction.id);
            if (!reaction) return null;
            const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
            return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}>{<reaction.icon size={48} className={`${reaction.color} drop-shadow-[0_0_20px_currentColor]`} />}</div></div>;
        })()}

        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10 mb-2 shrink-0">
            <button onClick={() => { if (phase === 'SETUP' && gameMode === 'ONLINE') { mp.leaveGame(); setPhase('MENU'); } else if (phase === 'SETUP') setPhase('MENU'); else { if(gameMode==='ONLINE') mp.leaveGame(); setPhase('MENU'); } }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] pr-2 pb-1">NEON FLEET</h1>
            {phase === 'SETUP' ? (
                <button onClick={clearSetup} className="p-2 bg-gray-800 rounded-lg text-red-400 hover:text-red-300 border border-white/10 active:scale-95 transition-transform"><Trash2 size={20} /></button>
            ) : (
                <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            )}
        </div>

        {/* SETUP PHASE */}
        {phase === 'SETUP' && (
            <div className="flex-1 w-full max-w-md flex flex-col items-center relative z-20">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-white mb-1">DÉPLOIEMENT</h2>
                    <p className="text-xs text-gray-400">Glissez les navires sur la grille.<br/>Tapez pour pivoter.</p>
                </div>

                {/* Setup Grid */}
                <div 
                    ref={setupGridRef}
                    className="relative w-full aspect-square bg-gray-900/80 border-2 border-green-500/30 rounded-lg shadow-2xl overflow-hidden touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onContextMenu={handleSetupRightClick}
                >
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
                        {Array.from({ length: 100 }).map((_, i) => (
                            <div key={i} className={`border border-white/5 ${hoverCell && hoverCell.r * 10 + hoverCell.c === i ? 'bg-white/10' : ''}`}></div>
                        ))}
                    </div>
                    {renderShipsLayer(playerShips, true)}
                    {isDragging && currentShipIndex < SHIPS_CONFIG.length && hoverCell && (
                        <div className="absolute pointer-events-none opacity-70" 
                             style={{ 
                                 left: `${(hoverCell.c * 10)}%`, 
                                 top: `${(hoverCell.r * 10)}%`, 
                                 width: orientation === 'horizontal' ? `${SHIPS_CONFIG[currentShipIndex].size * 10}%` : '10%', 
                                 height: orientation === 'vertical' ? `${SHIPS_CONFIG[currentShipIndex].size * 10}%` : '10%' 
                             }}>
                            <ShipVisual type={SHIPS_CONFIG[currentShipIndex].type} size={SHIPS_CONFIG[currentShipIndex].size} orientation={orientation} isSunk={false} isGhost={true} isValid={isValidPlacement(setupGrid, hoverCell.r, hoverCell.c, SHIPS_CONFIG[currentShipIndex].size, orientation)} />
                        </div>
                    )}
                </div>

                <div className="w-full flex items-center justify-between mt-6 px-2">
                    <button onClick={randomizePlayerShips} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95"><RefreshCw size={14}/> ALÉATOIRE</button>
                    <button onClick={handleOrientationToggle} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-white/10 text-xs font-bold active:scale-95"><RotateCw size={14}/> PIVOTER</button>
                </div>

                <button 
                    onClick={startGame}
                    disabled={playerShips.length < SHIPS_CONFIG.length || (gameMode === 'ONLINE' && isReady)}
                    className={`mt-6 w-full py-3 rounded-xl font-black tracking-widest text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${playerShips.length === SHIPS_CONFIG.length ? (isReady ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black hover:bg-white hover:scale-105 shadow-[0_0_15px_#22c55e]') : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                    {isReady ? <><Loader2 className="animate-spin" size={20}/> EN ATTENTE...</> : <><Play size={20} fill="black"/> COMBATTRE</>}
                </button>
            </div>
        )}

        {/* PLAYING PHASE */}
        {phase === 'PLAYING' && (
            <div className="flex-1 w-full max-w-md flex flex-col relative z-20">
                {/* Status Bar */}
                <div className={`mb-2 px-4 py-1.5 rounded-full border flex items-center justify-center gap-2 text-xs font-bold shadow-lg transition-colors self-center ${turn === 'PLAYER' ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {turn === 'PLAYER' ? <><Crosshair size={14}/> À VOUS DE TIRER</> : <><ShieldAlert size={14}/> L'ENNEMI VISE...</>}
                </div>

                {/* ENEMY GRID (Target) */}
                <div className="relative w-full aspect-square bg-black/60 border-2 border-red-500/30 rounded-lg shadow-lg overflow-hidden mb-4">
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 z-10">
                        {Array.from({ length: 100 }).map((_, i) => {
                            const r = Math.floor(i / 10);
                            const c = i % 10;
                            return (
                                <div key={i} onClick={() => handleCellClick(r, c)} className="pointer-events-auto">
                                    {renderCell(cpuGrid[r][c], true, r, c)}
                                </div>
                            );
                        })}
                    </div>
                    {/* CPU Ships (Hidden until Game Over) */}
                    {renderShipsLayer(cpuShips, phase === 'GAMEOVER')}
                    
                    {/* Missile Animation */}
                    {missile && missile.target === 'CPU' && (
                        <div className="absolute z-30 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_#4ade80] transition-all duration-500" style={{ left: '50%', top: '100%', transform: `translate(${missile.c * 100 * 4 - 200}%, ${missile.r * 100 * 4 - 400}%)` }}></div>
                    )}
                </div>

                {/* PLAYER GRID (Mini) */}
                <div className="relative w-1/2 aspect-square self-center bg-gray-900/80 border border-green-500/30 rounded-lg shadow-md overflow-hidden">
                     <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 z-10 pointer-events-none">
                        {Array.from({ length: 100 }).map((_, i) => {
                            const r = Math.floor(i / 10);
                            const c = i % 10;
                            return renderCell(playerGrid[r][c], false, r, c);
                        })}
                    </div>
                    {renderShipsLayer(playerShips, true)}
                    
                    {/* Missile Animation (Incoming) */}
                    {missile && missile.target === 'PLAYER' && (
                        <div className="absolute z-30 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red] transition-all duration-500" style={{ left: '50%', top: '-20%', transform: `translate(${missile.c * 100 * 2 - 100}%, ${missile.r * 100 * 2}%)` }}></div>
                    )}
                </div>

                {/* ONLINE CHAT */}
                {gameMode === 'ONLINE' && mp.gameOpponent && (
                    <div className="absolute bottom-0 w-full px-2 pb-2 z-30">
                        <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                            {REACTIONS.map(reaction => {
                                const Icon = reaction.icon;
                                return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                            })}
                        </div>
                        <form onSubmit={sendChat} className="flex gap-2">
                            <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                            <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-green-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                        </form>
                    </div>
                )}
            </div>
        )}

        {/* GAME OVER */}
        {phase === 'GAMEOVER' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
                {winner === 'PLAYER' ? (
                    <>
                        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">VICTOIRE !</h2>
                        <p className="text-green-400 font-bold mb-6">LA FLOTTE ENNEMIE EST DÉTRUITE</p>
                        {earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span></div>}
                    </>
                ) : (
                    <>
                        <Anchor size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">DÉFAITE...</h2>
                        <p className="text-red-400 font-bold mb-6">{opponentLeft ? "ADVERSAIRE PARTI" : "VOTRE FLOTTE A COULÉ"}</p>
                    </>
                )}
                <div className="flex gap-4">
                    <button onClick={gameMode === 'ONLINE' ? () => mp.requestRematch() : resetGame} className="px-8 py-3 bg-white text-black font-black tracking-widest text-lg rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"><RefreshCw size={20} /> {gameMode === 'ONLINE' ? 'REVANCHE' : 'REJOUER'}</button>
                    {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setPhase('MENU'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                </div>
            </div>
        )}
    </div>
  );
};
