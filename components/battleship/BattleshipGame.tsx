
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, Crosshair, Anchor, ShieldAlert, Coins, RotateCw, Play, Ship, X, Trash2, AlertCircle } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { useHighScores } from '../../hooks/useHighScores';
import { GRID_SIZE, createEmptyGrid, generateRandomShips, checkHit, getCpuMove, SHIPS_CONFIG, isValidPlacement, placeShipOnGrid } from './logic';
import { Grid, Ship as ShipType, CellStatus, ShipType as ShipTypeName } from './types';

interface BattleshipGameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
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

    // Couleurs Dynamiques
    let strokeColor = '#00f3ff';
    let fillColor = 'rgba(10, 10, 20, 0.9)';
    let detailColor = 'rgba(0, 243, 255, 0.3)';

    if (isSunk) {
        strokeColor = '#ef4444'; // Red warning color
        fillColor = 'rgba(40, 0, 0, 0.95)'; // Very dark red background
        detailColor = '#7f1d1d'; // Dark red details
    } else if (isGhost) {
        strokeColor = isValid ? '#22c55e' : '#ef4444'; // Vert ou Rouge
        fillColor = isValid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        detailColor = isValid ? '#4ade80' : '#f87171';
    } else if (isSelected) {
        strokeColor = '#ffffff';
        fillColor = 'rgba(40, 40, 60, 0.95)'; // Lighter, distinct background
        detailColor = '#ffffff';
    }

    const renderShipSVG = () => {
        // Pour éviter l'étirement, on définit un viewBox fixe de 100x100 par cellule
        const vbWidth = isVertical ? 100 : size * 100;
        const vbHeight = isVertical ? size * 100 : 100;
        const viewBox = `0 0 ${vbWidth} ${vbHeight}`;
        
        let path = "";
        let details = null;

        // Dimensions logiques
        const W = isVertical ? 100 : size * 100;
        const H = isVertical ? size * 100 : 100;

        // Margins pour faire le bateau plus fin (Sleek look)
        const mx = isVertical ? 25 : 5; // Marge X
        const my = isVertical ? 5 : 25; // Marge Y

        // Zone de dessin effective
        const dw = W - 2 * mx;
        const dh = H - 2 * my;

        if (type === 'CARRIER') { // Porte-avions (5)
            if (!isVertical) {
                // Horizontal Sleek Carrier
                path = `M ${mx+10},${my} L ${W-mx-10},${my} L ${W-mx},${my+dh/2} L ${W-mx-10},${H-my} L ${mx+10},${H-my} L ${mx},${my+dh/2} Z`;
                details = (
                    <>
                        <line x1={mx+20} y1={H/2} x2={W-mx-30} y2={H/2} stroke={detailColor} strokeWidth="3" strokeDasharray="10,10" />
                        <rect x={W-mx-50} y={my+5} width="20" height="15" fill={detailColor} rx="2" />
                    </>
                );
            } else {
                path = `M ${mx},${my+10} L ${mx},${H-my-10} L ${mx+dw/2},${H-my} L ${W-mx},${H-my-10} L ${W-mx},${my+10} L ${mx+dw/2},${my} Z`;
                details = (
                    <>
                        <line x1={W/2} y1={my+20} x2={W/2} y2={H-my-30} stroke={detailColor} strokeWidth="3" strokeDasharray="10,10" />
                        <rect x={W-mx-20} y={H-my-50} width="15" height="20" fill={detailColor} rx="2" />
                    </>
                );
            }
        } else if (type === 'BATTLESHIP') { // Cuirassé (4)
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+30},${my} L ${W-mx-10},${my} L ${W-mx-10},${H-my} L ${mx+30},${H-my} Z`;
                details = (
                    <>
                        <circle cx={mx+50} cy={H/2} r="8" fill="none" stroke={detailColor} strokeWidth="2" />
                        <line x1={mx+50} y1={H/2} x2={mx+80} y2={H/2} stroke={detailColor} strokeWidth="2" />
                        <circle cx={W-mx-50} cy={H/2} r="8" fill="none" stroke={detailColor} strokeWidth="2" />
                        <line x1={W-mx-50} y1={H/2} x2={W-mx-80} y2={H/2} stroke={detailColor} strokeWidth="2" />
                        <rect x={W/2-20} y={my+10} width="40" height="30" fill={detailColor} opacity="0.5" />
                    </>
                );
            } else {
                path = `M ${W/2},${my} L ${mx},${my+30} L ${mx},${H-my-10} L ${W-mx},${H-my-10} L ${W-mx},${my+30} Z`;
                details = (
                    <>
                        <circle cx={W/2} cy={my+50} r="8" fill="none" stroke={detailColor} strokeWidth="2" />
                        <line x1={W/2} y1={my+50} x2={W/2} y2={my+80} stroke={detailColor} strokeWidth="2" />
                        <circle cx={W/2} cy={H-my-50} r="8" fill="none" stroke={detailColor} strokeWidth="2" />
                        <rect x={mx+10} y={H/2-20} width="30" height="40" fill={detailColor} opacity="0.5" />
                    </>
                );
            }
        } else if (type === 'CRUISER') { // Croiseur (3)
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+20},${my} L ${W-mx-15},${my} L ${W-mx},${H/2} L ${W-mx-15},${H-my} L ${mx+20},${H-my} Z`;
                details = (
                    <>
                        <circle cx={W/2} cy={H/2} r="10" stroke={detailColor} strokeWidth="2" fill="none" />
                        <line x1={mx+40} y1={H/2} x2={mx+60} y2={H/2} stroke={detailColor} strokeWidth="2" />
                    </>
                );
            } else {
                path = `M ${W/2},${my} L ${mx},${my+20} L ${mx},${H-my-15} L ${W/2},${H-my} L ${W-mx},${H-my-15} L ${W-mx},${my+20} Z`;
                details = (
                    <>
                        <circle cx={W/2} cy={H/2} r="10" stroke={detailColor} strokeWidth="2" fill="none" />
                        <line x1={W/2} y1={my+40} x2={W/2} y2={my+60} stroke={detailColor} strokeWidth="2" />
                    </>
                );
            }
        } else if (type === 'SUBMARINE') { // Sous-marin (3)
            if (!isVertical) {
                path = `M ${mx+10},${H/2} Q ${mx+10},${my} ${W/2},${my} Q ${W-mx-10},${my} ${W-mx-10},${H/2} Q ${W-mx-10},${H-my} ${W/2},${H-my} Q ${mx+10},${H-my} ${mx+10},${H/2}`;
                details = <circle cx={W/2} cy={H/2} r="6" fill={detailColor} />;
            } else {
                path = `M ${W/2},${my+10} Q ${mx},${my+10} ${mx},${H/2} Q ${mx},${H-my-10} ${W/2},${H-my-10} Q ${W-mx},${H-my-10} ${W-mx},${H/2} Q ${W-mx},${my+10} ${W/2},${my+10}`;
                details = <circle cx={W/2} cy={H/2} r="6" fill={detailColor} />;
            }
        } else if (type === 'DESTROYER') { // Destroyer (2)
            if (!isVertical) {
                path = `M ${mx},${H/2} L ${mx+15},${my+5} L ${W-mx},${my+5} L ${W-mx},${H-my-5} L ${mx+15},${H-my-5} Z`;
                details = <line x1={mx+20} y1={H/2} x2={mx+35} y2={H/2} stroke={detailColor} strokeWidth="2" />;
            } else {
                path = `M ${W/2},${my} L ${mx+5},${my+15} L ${mx+5},${H-my} L ${W-mx-5},${H-my} L ${W-mx-5},${my+15} Z`;
                details = <line x1={W/2} y1={my+20} x2={W/2} y2={my+35} stroke={detailColor} strokeWidth="2" />;
            }
        }

        return (
            <svg 
                viewBox={viewBox} 
                className="w-full h-full" 
            >
                <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={isSelected ? "4" : "3"} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                {details}
                {isSunk && (
                    <>
                        {/* Dramatic Red Cross for Sunk Ships - Thicker and Bolder */}
                        <line x1="5" y1="5" x2={vbWidth-5} y2={vbHeight-5} stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
                        <line x1={vbWidth-5} y1="5" x2="5" y2={vbHeight-5} stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
                        <rect x="2" y="2" width={vbWidth-4} height={vbHeight-4} fill="none" stroke="#ef4444" strokeWidth="6" rx="5" />
                    </>
                )}
            </svg>
        );
    };

    return (
        <div style={style}>
            {renderShipSVG()}
        </div>
    );
};


export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins }) => {
  // Game State
  const [phase, setPhase] = useState<'SETUP' | 'PLAYING' | 'GAMEOVER'>('SETUP');
  const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
  const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
  
  // Grids
  const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
  const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid());
  const [cpuRealGrid, setCpuRealGrid] = useState<Grid>(createEmptyGrid());
  
  const [playerShips, setPlayerShips] = useState<ShipType[]>([]);
  const [cpuShips, setCpuShips] = useState<ShipType[]>([]);
  
  // Setup Phase
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [setupGrid, setSetupGrid] = useState<Grid>(createEmptyGrid());
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  
  // Input Handling
  const setupGridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{r: number, c: number}>({ r: 0, c: 0 });
  const [hoverCell, setHoverCell] = useState<{r: number, c: number} | null>(null);
  
  // Refs for sticky drag logic
  const pointerStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const pressedShipRef = useRef<ShipType | null>(null);
  const isDragStartedRef = useRef(false);
  
  // Store the ship being moved to restore it if dropped in invalid location
  const [draggedShipOriginal, setDraggedShipOriginal] = useState<ShipType | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{text: string, subtext?: string, type: 'HIT'|'SUNK'|'MISS'} | null>(null);

  // Animation State: Missile
  const [missile, setMissile] = useState<{ r: number, c: number, target: 'PLAYER' | 'CPU' } | null>(null);

  // AI Memory
  const lastCpuHitRef = useRef<{ r: number, c: number } | null>(null);
  
  const [earnedCoins, setEarnedCoins] = useState(0);
  const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit } = audio;

  // Initialisation
  useEffect(() => {
    resetGame();
  }, []);

  // Clear Notification timer
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => {
              setNotification(null);
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  const resetGame = () => {
    setPhase('SETUP');
    setTurn('PLAYER');
    setWinner(null);
    setPlayerGrid(createEmptyGrid());
    setCpuGrid(createEmptyGrid());
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
  };

  const clearSetup = () => {
      setSetupGrid(createEmptyGrid());
      setPlayerShips([]);
      setCurrentShipIndex(0);
      setSelectedShipId(null);
  };

  // --- SETUP PHASE ---

  const randomizePlayerShips = () => {
    const { grid, ships } = generateRandomShips();
    setSetupGrid(grid);
    setPlayerShips(ships);
    setCurrentShipIndex(SHIPS_CONFIG.length); // All placed
    setSelectedShipId(null);
    playMove();
  };

  // Helper pour trouver le premier index de navire non placé
  const findNextAvailableShipIndex = (currentShips: ShipType[]) => {
      // Compter les occurrences de chaque type dans currentShips
      const placedCounts: {[key: string]: number} = {};
      currentShips.forEach(s => {
          placedCounts[s.type] = (placedCounts[s.type] || 0) + 1;
      });

      // Trouver le premier config qui n'est pas satisfait
      for (let i = 0; i < SHIPS_CONFIG.length; i++) {
          const type = SHIPS_CONFIG[i].type;
          if (!placedCounts[type]) {
              return i;
          }
      }
      return SHIPS_CONFIG.length;
  };

  // --- POINTER EVENTS FOR DRAG AND DROP ---
  const getGridCoords = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (!setupGridRef.current) return null;
    const rect = setupGridRef.current.getBoundingClientRect();
    
    // Normalize coordinates for Touch vs Mouse
    let clientX, clientY;
    // @ts-ignore
    if (e.touches && e.touches.length > 0) {
        // @ts-ignore
        clientX = e.touches[0].clientX;
        // @ts-ignore
        clientY = e.touches[0].clientY;
    } else if ((e as any).changedTouches && (e as any).changedTouches.length > 0) {
         clientX = (e as any).changedTouches[0].clientX;
         clientY = (e as any).changedTouches[0].clientY;
    } else {
        clientX = (e as any).clientX;
        clientY = (e as any).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Safely clamp within grid
    let c = Math.floor((x / rect.width) * 10);
    let r = Math.floor((y / rect.height) * 10);
    
    if (c < 0) c = 0; if (c > 9) c = 9;
    if (r < 0) r = 0; if (r > 9) r = 9;
    
    return { r, c };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'SETUP') return;
    
    // 1. Init Tracking
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDragStartedRef.current = false;
    pressedShipRef.current = null;
    if (setupGridRef.current) {
        setupGridRef.current.setPointerCapture(e.pointerId);
    }

    const coords = getGridCoords(e);
    if (!coords) return;
    const { r, c } = coords;

    // 2. Identify ship (don't pick up yet)
    const existingShip = playerShips.find(s => {
        if (s.orientation === 'horizontal') {
            return r === s.row && c >= s.col && c < s.col + s.size;
        } else {
            return c === s.col && r >= s.row && r < s.row + s.size;
        }
    });

    if (existingShip) {
        pressedShipRef.current = existingShip;
        // Calculate potential offset
        setDragOffset({ r: r - existingShip.row, c: c - existingShip.col });
    } else {
        // New ship from stack
        if (currentShipIndex < SHIPS_CONFIG.length) {
            setDragOffset({ r: 0, c: 0 });
            // For new ships, we drag immediately from grid interaction
            setIsDragging(true); // Immediate ghost for new ships
            isDragStartedRef.current = true; // Mark as dragging
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

    // Sticky Drag Logic: Only start dragging if moved > 15px (Reduced sensitivity for better tap detection)
    if (pressedShipRef.current && !isDragStartedRef.current) {
        if (pointerStartRef.current) {
            const dx = e.clientX - pointerStartRef.current.x;
            const dy = e.clientY - pointerStartRef.current.y;
            if (Math.hypot(dx, dy) > 15) {
                // START DRAG NOW
                isDragStartedRef.current = true;
                const shipToRemove = pressedShipRef.current;
                setDraggedShipOriginal(shipToRemove);
                
                // Remove from grid
                const newShips = playerShips.filter(s => s.id !== shipToRemove.id);
                const newGrid = createEmptyGrid();
                newShips.forEach(s => placeShipOnGrid(newGrid, s));
                
                setPlayerShips(newShips);
                setSetupGrid(newGrid);
                
                const configIndex = SHIPS_CONFIG.findIndex(conf => conf.type === shipToRemove.type);
                setCurrentShipIndex(configIndex);
                setOrientation(shipToRemove.orientation);
                setSelectedShipId(shipToRemove.id); // Select while dragging
                
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
    if (setupGridRef.current) {
        setupGridRef.current.releasePointerCapture(e.pointerId);
    }

    // WAS IT A TAP? (Not dragged)
    if (!isDragStartedRef.current && !isDragging) {
        if (pressedShipRef.current) {
            const shipId = pressedShipRef.current.id;
            // If tapping an already selected ship -> Rotate it
            if (selectedShipId === shipId) {
                attemptRotateShip(pressedShipRef.current);
            } else {
                // Else select it
                setSelectedShipId(shipId);
                playPaddleHit(); // "Click" sound
            }
        } else {
            // Tapped empty space
            setSelectedShipId(null);
        }
        
        // Reset
        pressedShipRef.current = null;
        pointerStartRef.current = null;
        return;
    }

    // WAS DRAGGING -> DROP LOGIC
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
                 const newShip: ShipType = {
                    id: draggedShipOriginal?.id || `p-ship-${currentShipIndex}-${Date.now()}`,
                    type: shipConfig.type,
                    size: shipConfig.size,
                    hits: 0,
                    orientation,
                    row: r,
                    col: c,
                    sunk: false
                  };
                  
                  const newGrid = setupGrid.map(row => [...row]);
                  placeShipOnGrid(newGrid, newShip);
                  
                  const updatedShips = [...playerShips, newShip];
                  setSetupGrid(newGrid);
                  setPlayerShips(updatedShips);
                  setCurrentShipIndex(findNextAvailableShipIndex(updatedShips));
                  
                  // Keep selection on the dropped ship if it was selected or dragged
                  setSelectedShipId(newShip.id);

                  playMove();
                  setHoverCell(null);
                  setDraggedShipOriginal(null);
                  placed = true;
            }
        }
    }

    // Restore if invalid drop
    if (!placed && draggedShipOriginal) {
        const newGrid = setupGrid.map(row => [...row]);
        placeShipOnGrid(newGrid, draggedShipOriginal);
        const updatedShips = [...playerShips, draggedShipOriginal];
        
        setSetupGrid(newGrid);
        setPlayerShips(updatedShips);
        setCurrentShipIndex(findNextAvailableShipIndex(updatedShips));
        setDraggedShipOriginal(null);
        setSelectedShipId(draggedShipOriginal.id); // Keep selected
    }
  };
  
  const attemptRotateShip = (ship: ShipType) => {
        const newOrientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        
        // Remove ship temporarily to check validity
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
        } else {
            // Invalid rotation feedback?
        }
  };

  const handleOrientationToggle = () => {
      if (selectedShipId) {
          const ship = playerShips.find(s => s.id === selectedShipId);
          if (ship) attemptRotateShip(ship);
      } else {
          setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal');
      }
  };
  
  // Right click handler for rotation
  const handleSetupRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleOrientationToggle();
  };

  const startGame = () => {
    if (playerShips.length < SHIPS_CONFIG.length) return;
    
    setPlayerGrid(setupGrid);
    const { grid: cpuReal, ships: cpuS } = generateRandomShips();
    setCpuRealGrid(cpuReal);
    setCpuShips(cpuS);
    
    setPhase('PLAYING');
    setSelectedShipId(null); // Clear selection on start
    playVictory(); // Sound start
  };

  // --- BATTLE PHASE ---

  // Helper to trigger missile animation then result
  const launchAttack = (r: number, c: number, target: 'CPU' | 'PLAYER', callback: () => void) => {
      playLaserShoot(); // Sifflement du missile
      setMissile({ r, c, target });
      
      // Durée de l'animation CSS (voir <style> plus bas)
      setTimeout(() => {
          setMissile(null);
          callback();
      }, 500);
  };

  const handleCpuCellClick = (r: number, c: number) => {
    if (phase !== 'PLAYING' || turn !== 'PLAYER' || missile) return;
    
    // Check if already fired
    if (cpuGrid[r][c] !== 0) return;

    // Trigger Animation first
    launchAttack(r, c, 'CPU', () => {
        const isHit = cpuRealGrid[r][c] === 1;
        const newCpuGrid = cpuGrid.map(row => [...row]);
        newCpuGrid[r][c] = isHit ? 3 : 2; // 3=Hit, 2=Miss
        setCpuGrid(newCpuGrid);

        if (isHit) {
            playBlockHit();
            const shipUpdate = checkHit(r, c, cpuShips);
            
            if (shipUpdate.sunk) {
                playShipSink(); // SOUND EFFECT
                const sunkShip = cpuShips.find(s => s.id === shipUpdate.shipId);
                const shipName = SHIPS_CONFIG.find(sc => sc.type === sunkShip?.type)?.label || sunkShip?.type;
                setNotification({ text: "COULÉ !", subtext: shipName, type: 'SUNK' });
            } else {
                setNotification({ text: "TOUCHÉ !", type: 'HIT' });
            }
            
            if (cpuShips.every(s => s.sunk)) {
                handleGameOver('PLAYER');
                return;
            }
            setTurn('CPU');
        } else {
            playWallHit(); // Splash
            setTurn('CPU');
        }
    });
  };

  // CPU Turn Effect
  useEffect(() => {
    if (phase === 'PLAYING' && turn === 'CPU' && !missile) {
      const timer = setTimeout(() => {
        cpuFire();
      }, 1000); // Delay before CPU decides
      return () => clearTimeout(timer);
    }
  }, [turn, phase, missile]);

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
                playShipSink(); // SOUND EFFECT
                lastCpuHitRef.current = null; // Reset hunter mode logic
                const sunkShip = playerShips.find(s => s.id === shipUpdate.shipId);
                const shipName = SHIPS_CONFIG.find(sc => sc.type === sunkShip?.type)?.label || sunkShip?.type;
                setNotification({ text: "ALERTE !", subtext: `${shipName} COULÉ`, type: 'SUNK' });
            } else {
                setNotification({ text: "IMPACT !", type: 'HIT' });
            }

            if (playerShips.every(s => s.sunk)) {
                handleGameOver('CPU');
            } else {
                setTurn('PLAYER'); 
            }
        } else {
            playWallHit();
            setTurn('PLAYER');
        }
    });
  };

  const handleGameOver = (w: 'PLAYER' | 'CPU') => {
    setWinner(w);
    setPhase('GAMEOVER');
    if (w === 'PLAYER') {
      playVictory();
      const reward = 100;
      addCoins(reward);
      setEarnedCoins(reward);
    } else {
      playGameOver();
    }
  };

  // --- RENDER HELPERS ---

  const renderCell = (status: CellStatus, isCpuBoard: boolean, r: number, c: number) => {
    let content = null;
    let bgClass = "bg-blue-900/20 border-blue-500/20"; // Default water

    if (status === 2) { // Miss
      content = <div className="w-2 h-2 bg-white rounded-full opacity-50 animate-pulse"></div>;
    } else if (status === 3) { // Hit
      bgClass = "bg-red-900/40 border-red-500/50 z-20";
      content = <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full absolute animate-ping bg-red-500/30 rounded-full"></div>
          <Crosshair size={16} className="text-red-500 relative z-10" />
      </div>;
    } 

    const hoverClass = (isCpuBoard && phase === 'PLAYING' && turn === 'PLAYER' && status === 0 && !missile) 
        ? "hover:bg-red-500/20 hover:border-red-400 cursor-crosshair" 
        : "";

    return (
      <div 
        key={`${r}-${c}`} 
        className={`relative w-full h-full border ${bgClass} ${hoverClass} flex items-center justify-center transition-colors pointer-events-none`}
      >
        {content}
      </div>
    );
  };

  const renderShipsLayer = (ships: ShipType[], isPreview = false) => {
      return (
          <div className="absolute inset-0 w-full h-full pointer-events-none p-1">
              {ships.map((ship) => {
                  if (!isPreview && phase === 'PLAYING' && !ship.sunk) return null;

                  return (
                      <div
                        key={ship.id}
                        style={{
                            position: 'absolute',
                            left: `${ship.col * 10}%`,
                            top: `${ship.row * 10}%`,
                            width: ship.orientation === 'horizontal' ? `${ship.size * 10}%` : '10%',
                            height: ship.orientation === 'vertical' ? `${ship.size * 10}%` : '10%',
                            zIndex: 5
                        }}
                      >
                          <ShipVisual 
                            type={ship.type} 
                            size={ship.size} 
                            orientation={ship.orientation} 
                            isSunk={ship.sunk} 
                            isSelected={selectedShipId === ship.id}
                          />
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderGhostShip = () => {
      if (phase !== 'SETUP' || currentShipIndex >= SHIPS_CONFIG.length || !hoverCell) return null;
      
      const config = SHIPS_CONFIG[currentShipIndex];
      // Check validation locally to color the ghost
      const isValid = (hoverCell.r >= 0 && hoverCell.r < GRID_SIZE && hoverCell.c >= 0 && hoverCell.c < GRID_SIZE) 
                      && isValidPlacement(setupGrid, hoverCell.r, hoverCell.c, config.size, orientation);
      
      return (
          <div className="absolute inset-0 w-full h-full pointer-events-none p-1 z-30">
              <div style={{
                  position: 'absolute',
                  left: `${hoverCell.c * 10}%`,
                  top: `${hoverCell.r * 10}%`,
                  width: orientation === 'horizontal' ? `${config.size * 10}%` : '10%',
                  height: orientation === 'vertical' ? `${config.size * 10}%` : '10%',
                  transition: isDragging ? 'none' : 'all 0.1s ease-out'
              }}>
                  <ShipVisual 
                    type={config.type} 
                    size={config.size} 
                    orientation={orientation} 
                    isSunk={false} 
                    isGhost={true} 
                    isValid={isValid} 
                  />
              </div>
          </div>
      );
  };

  // Missile Animation
  const renderMissile = () => {
      if (!missile) return null;
      const isPlayerTarget = missile.target === 'PLAYER';
      
      // Calculate position relative to the grid it's attacking
      const top = missile.r * 10;
      const left = missile.c * 10;

      return (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-lg">
              <div 
                className={`absolute w-[10%] h-[10%] flex items-center justify-center`}
                style={{ 
                    top: `${top}%`, 
                    left: `${left}%`,
                    animation: 'drop-missile 0.5s ease-in forwards'
                }}
              >
                  {/* Rocket Body */}
                  <div className={`w-3 h-12 rounded-full blur-[1px] ${isPlayerTarget ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-cyan-400 shadow-[0_0_15px_cyan]'}`}></div>
                  {/* Trail */}
                  <div className={`absolute -top-20 w-1 h-20 ${isPlayerTarget ? 'bg-gradient-to-t from-red-500 to-transparent' : 'bg-gradient-to-t from-cyan-400 to-transparent'}`}></div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
      <style>{`
        @keyframes drop-missile {
            0% { transform: translateY(-600px) scale(1.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-transparent pointer-events-none"></div>

      {/* NOTIFICATION OVERLAY */}
      {notification && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm px-8 py-6 rounded-2xl border-2 border-white/20 animate-in zoom-in fade-in duration-300 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  <h2 className={`text-5xl font-black italic tracking-tighter ${notification.type === 'SUNK' ? 'text-red-500 drop-shadow-[0_0_15px_red]' : 'text-yellow-400 drop-shadow-[0_0_15px_yellow]'}`}>
                      {notification.text}
                  </h2>
                  {notification.subtext && (
                      <p className="text-white font-bold tracking-widest mt-2 bg-red-900/50 px-3 py-1 rounded text-sm uppercase border border-red-500/30">
                          {notification.subtext}
                      </p>
                  )}
              </div>
          </div>
      )}

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 mb-4 shrink-0">
        <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
          <Home size={20} />
        </button>
        <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
          BATAILLE NAVALE
        </h1>
        <button onClick={resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* SETUP PHASE UI */}
      {phase === 'SETUP' && (
        <div className="flex flex-col items-center gap-4 z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gray-900/80 p-4 rounded-xl border border-blue-500/30 w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-blue-300 font-bold flex items-center gap-2"><Anchor size={18}/> DÉPLOIEMENT</h3>
                    <div className="flex gap-2">
                        <button onClick={handleOrientationToggle} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-gray-600 transition-colors ${selectedShipId ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-700'}`}>
                            <RotateCw size={14} className={orientation === 'vertical' ? 'rotate-90 transition-transform' : 'transition-transform'}/> 
                            {selectedShipId ? 'PIVOTER' : (orientation === 'horizontal' ? 'HORIZ' : 'VERT')}
                        </button>
                        <button onClick={clearSetup} className="p-2 bg-red-900/50 border border-red-500/30 text-red-400 rounded hover:bg-red-900 hover:text-white transition-colors" title="Tout Effacer">
                            <Trash2 size={16} />
                        </button>
                        <button onClick={randomizePlayerShips} className="px-3 py-1.5 bg-blue-600 rounded text-xs font-bold hover:bg-blue-500 transition-colors">
                            AUTO
                        </button>
                    </div>
                </div>
                
                {currentShipIndex < SHIPS_CONFIG.length ? (
                    <div className="mb-2 text-center text-sm text-gray-400">
                        Placez : <span className="text-white font-bold">{SHIPS_CONFIG[currentShipIndex].label}</span> ({SHIPS_CONFIG[currentShipIndex].size} cases)
                    </div>
                ) : (
                    <div className="mb-2 text-center text-green-400 font-bold text-sm flex items-center justify-center gap-2">
                        <Target size={16}/> FLOTTE PRÊTE
                    </div>
                )}

                {/* Setup Grid Container */}
                <div 
                    ref={setupGridRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="relative aspect-square w-full bg-blue-900/10 border-2 border-blue-500/50 rounded-lg overflow-hidden touch-none"
                    onContextMenu={handleSetupRightClick}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-0.5 p-1 z-0 pointer-events-none">
                        {setupGrid.map((row, r) => row.map((cell, c) => renderCell(cell, false, r, c)))}
                    </div>
                    {/* Placed Ships Overlay */}
                    {renderShipsLayer(playerShips, true)}
                    {/* Ghost Ship Overlay */}
                    {renderGhostShip()}
                </div>

                <div className="mt-2 text-[10px] text-gray-500 text-center italic">
                    Tap to Select • Drag to Move • Button to Rotate
                </div>

                {currentShipIndex >= SHIPS_CONFIG.length && (
                    <button onClick={startGame} className="w-full mt-4 py-3 bg-green-500 text-black font-black tracking-widest rounded hover:bg-green-400 shadow-[0_0_15px_#22c55e] transition-all flex items-center justify-center gap-2 animate-pulse">
                        <Play size={20} /> COMMENCER LE COMBAT
                    </button>
                )}
            </div>
        </div>
      )}

      {/* PLAYING PHASE UI */}
      {(phase === 'PLAYING' || phase === 'GAMEOVER') && (
        <div className="flex flex-col gap-4 z-10 w-full max-w-4xl lg:flex-row items-start justify-center animate-in zoom-in duration-300">
            
            {/* ENEMY GRID (Top/Left) */}
            <div className={`flex flex-col gap-2 w-full max-w-md ${turn === 'PLAYER' && phase === 'PLAYING' ? 'opacity-100 scale-105 shadow-xl' : 'opacity-80 scale-95'} transition-all duration-300`}>
                <div className="flex justify-between items-center bg-red-900/30 px-3 py-2 rounded-t-lg border-t border-l border-r border-red-500/30">
                    <span className="text-red-400 font-bold flex items-center gap-2"><Target size={16}/> ZONE ENNEMIE</span>
                    <div className="flex gap-1">
                        {cpuShips.map((s, i) => (
                            <div key={i} className={`h-2 w-4 rounded-full transition-colors duration-500 ${s.sunk ? 'bg-red-600 shadow-[0_0_5px_red]' : 'bg-gray-600'}`} title={s.type}/>
                        ))}
                    </div>
                </div>
                {/* Clickable Grid for CPU */}
                <div className="relative aspect-square w-full bg-black/40 border-2 border-red-500/30 rounded-b-lg shadow-[0_0_20px_rgba(239,68,68,0.1)] overflow-hidden">
                    {/* Missile Animation Overlay */}
                    {missile?.target === 'CPU' && renderMissile()}

                    {/* Grid Overlay for Turn */}
                    {turn === 'CPU' && phase === 'PLAYING' && !missile && (
                        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-red-500 font-bold animate-pulse tracking-widest flex items-center gap-2"><AlertCircle size={20}/> TOUR ADVERSE...</span>
                        </div>
                    )}
                    
                    {/* Ships Layer (Hidden unless sunk or Game Over) */}
                    {renderShipsLayer(cpuShips, phase === 'GAMEOVER')}

                    {/* Cells Layer (Clicks & Markers) */}
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-0.5 p-1 z-10">
                        {cpuGrid.map((row, r) => row.map((cell, c) => (
                            <div 
                                key={`${r}-${c}`} 
                                className={`relative w-full h-full pointer-events-auto`}
                                onClick={() => handleCpuCellClick(r, c)}
                            >
                                {renderCell(cell, true, r, c)}
                            </div>
                        )))}
                    </div>
                </div>
            </div>

            {/* PLAYER GRID (Bottom/Right) */}
            <div className={`flex flex-col gap-2 w-full max-w-md ${turn === 'CPU' && phase === 'PLAYING' ? 'opacity-100 scale-105 shadow-xl' : 'opacity-80 scale-95'} transition-all duration-300`}>
                <div className="flex justify-between items-center bg-blue-900/30 px-3 py-2 rounded-t-lg border-t border-l border-r border-blue-500/30">
                    <span className="text-blue-400 font-bold flex items-center gap-2"><ShieldAlert size={16}/> MA FLOTTE</span>
                    <div className="flex gap-1">
                        {playerShips.map((s, i) => (
                            <div key={i} className={`h-2 w-4 rounded-full transition-colors duration-500 ${s.sunk ? 'bg-red-600' : 'bg-green-500 shadow-[0_0_5px_lime]'}`} title={s.type}/>
                        ))}
                    </div>
                </div>
                <div className="relative aspect-square w-full bg-black/40 border-2 border-blue-500/30 rounded-b-lg overflow-hidden">
                     {/* Missile Animation Overlay */}
                     {missile?.target === 'PLAYER' && renderMissile()}

                     {/* Grid Overlay for Turn */}
                     {turn === 'PLAYER' && phase === 'PLAYING' && !missile && (
                        <div className="absolute inset-0 z-30 bg-blue-500/5 flex items-center justify-center pointer-events-none">
                            <Crosshair size={64} className="text-blue-400/20 animate-pulse" />
                        </div>
                    )}
                    
                    {/* Ships Layer (Always Visible for Player) */}
                    {renderShipsLayer(playerShips, true)}

                    {/* Cells Layer (Hits/Misses only) */}
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-0.5 p-1 z-10 pointer-events-none">
                        {playerGrid.map((row, r) => row.map((cell, c) => renderCell(cell, false, r, c)))}
                    </div>
                </div>
            </div>

        </div>
      )}

      {/* GAMEOVER OVERLAY */}
      {phase === 'GAMEOVER' && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in">
              <div className="bg-gray-900 border-2 border-white/10 p-8 rounded-2xl flex flex-col items-center max-w-sm w-full shadow-2xl">
                  {winner === 'PLAYER' ? (
                      <>
                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_15px_#facc15]" />
                        <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">VICTOIRE !</h2>
                        <p className="text-gray-400 mb-6 text-center">La flotte ennemie a été anéantie.</p>
                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                      </>
                  ) : (
                      <>
                        <Ship size={64} className="text-red-500 mb-4" />
                        <h2 className="text-4xl font-black italic text-red-500 mb-2">DÉFAITE</h2>
                        <p className="text-gray-400 mb-6 text-center">Votre flotte a coulé.</p>
                      </>
                  )}
                  
                  <div className="flex flex-col gap-3 w-full">
                      <button onClick={resetGame} className="w-full py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors">
                          REJOUER
                      </button>
                      <button onClick={onBack} className="w-full py-3 bg-transparent border border-white/20 text-white font-bold rounded hover:bg-white/10 transition-colors">
                          MENU PRINCIPAL
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
