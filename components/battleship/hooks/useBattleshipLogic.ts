
import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, Ship, ShipType, CellStatus, GameState } from '../types';
import { createEmptyGrid, generateRandomShips, checkHit, getCpuMove, SHIPS_CONFIG, isValidPlacement, placeShipOnGrid } from '../logic';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';

export const useBattleshipLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    // --- STATE ---
    const [phase, setPhase] = useState<'MENU' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    
    // Game Data
    const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
    const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid()); // Visual grid for opponent
    const [cpuRealGrid, setCpuRealGrid] = useState<Grid>(createEmptyGrid()); // Hidden logic grid
    const [playerShips, setPlayerShips] = useState<Ship[]>([]);
    const [cpuShips, setCpuShips] = useState<Ship[]>([]);
    
    // Setup State
    const [setupGrid, setSetupGrid] = useState<Grid>(createEmptyGrid());
    const [setupShips, setSetupShips] = useState<Ship[]>([]);
    const [selectedShipType, setSelectedShipType] = useState<ShipType | null>(null);
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    
    // Online State
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    
    // Feedback
    const [notification, setNotification] = useState<{text: string, type: 'HIT'|'SUNK'|'MISS'} | null>(null);
    const [shakeBoard, setShakeBoard] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);

    // Refs
    const handleDataRef = useRef<any>(null);
    
    const { username, currentAvatarId } = useCurrency();
    const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit, playSplash } = audio;

    // --- AUTOMATIC NOTIFICATION CLEARING ---
    useEffect(() => {
        if (notification) {
            // Réduit à 1200ms pour ne pas gêner le gameplay rapide
            const timer = setTimeout(() => {
                setNotification(null);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- INITIALIZATION ---
    useEffect(() => {
        // Tag user for lobby
        mp.updateSelfInfo(username, currentAvatarId, undefined, 'Battleship');
    }, [username, currentAvatarId, mp]);

    // --- CONNECTION MANAGEMENT ---
    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setPhase('SETUP'); // Exit menu to allow Lobby UI to take over via condition check
            setOnlineStep('connecting');
            mp.connect();
        } else {
            if (mp.mode !== 'disconnected') mp.disconnect();
        }
    }, [gameMode, mp]);

    // --- RESET ---
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
        setOpponentLeft(false);
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    // --- SETUP LOGIC ---
    const handleSetupCellClick = (r: number, c: number) => {
        // 1. If ship selected from inventory, try place
        if (selectedShipType) {
            const config = SHIPS_CONFIG.find(s => s.type === selectedShipType);
            if (!config) return;
            
            if (isValidPlacement(setupGrid, r, c, config.size, orientation)) {
                const newShip: Ship = {
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

    // --- GAMEPLAY LOGIC ---

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
                    
                    const sunkCount = cpuShips.length + 1; 
                    if (sunkCount >= 5) handleGameOver('PLAYER');
                } else {
                    if (onReportProgress) onReportProgress('action', 1);
                }
                
                if (gameMode === 'ONLINE' && onReportProgress) onReportProgress('action', 1);

            } else {
                setNotification({ text: "TOUCHÉ !", type: 'HIT' });
            }
        } else {
            playSplash();
            setTurn('CPU');
        }
    };

    const handleAttack = (r: number, c: number) => {
        if (phase !== 'PLAYING' || turn !== 'PLAYER') return;
        if (cpuGrid[r][c] !== 0) return;

        playLaserShoot();

        if (gameMode === 'ONLINE') {
            mp.sendData({ type: 'BATTLESHIP_SHOT', r, c });
        } else {
            const isHit = cpuRealGrid[r][c] === 1;
            let resultStatus: 'HIT'|'MISS'|'SUNK' = isHit ? 'HIT' : 'MISS';
            let sunkShipDetails = null;

            if (isHit) {
                const newCpuShips = cpuShips.map(s => ({...s}));
                const update = checkHit(r, c, newCpuShips);
                if (update.sunk) {
                    resultStatus = 'SUNK';
                    const s = newCpuShips.find(sh => sh.id === update.shipId);
                    if (s) sunkShipDetails = s;
                }
                setCpuShips(newCpuShips);
                
                if (newCpuShips.every(s => s.sunk)) {
                    handleGameOver('PLAYER');
                }
            }
            handleShotResult(r, c, resultStatus, sunkShipDetails);
        }
    };

    // --- AI TURN ---
    useEffect(() => {
        if (gameMode === 'SOLO' && phase === 'PLAYING' && turn === 'CPU') {
            const timer = setTimeout(() => {
                const move = getCpuMove(playerGrid);
                handleIncomingShot(move.r, move.c);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, phase, gameMode, playerGrid, playerShips, handleIncomingShot]);

    // --- MULTIPLAYER STATE SYNC ---
    useEffect(() => {
        if (gameMode !== 'ONLINE') return;

        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby'); 
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            if (phase === 'MENU') {
                resetGame(); // Transitions to SETUP
            }
        }
    }, [mp.mode, mp.isHost, mp.players, mp.peerId, gameMode, phase, resetGame]);

    // --- ONLINE EVENTS ---
    useEffect(() => {
        if (gameMode === 'ONLINE' && isReady && opponentReady && phase === 'SETUP') {
            setPhase('PLAYING');
            setTurn(mp.isHost ? 'PLAYER' : 'CPU');
            playVictory();
        }
    }, [isReady, opponentReady, gameMode, phase, mp.isHost, playVictory]);

    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'BATTLESHIP_READY') setOpponentReady(true);
            if (data.type === 'BATTLESHIP_SHOT') {
                const { r, c } = data;
                handleIncomingShot(r, c);
            }
            if (data.type === 'BATTLESHIP_RESULT') {
                const { r, c, status, shipDetails } = data;
                handleShotResult(r, c, status, shipDetails);
            }
            if (data.type === 'LEAVE_GAME') { handleGameOver('PLAYER'); setOpponentLeft(true); }
            if (data.type === 'REMATCH_START') resetGame();
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if(handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp]);

    return {
        // State
        phase, setPhase,
        turn,
        gameMode, setGameMode,
        playerGrid,
        cpuGrid,
        playerShips,
        cpuShips,
        setupGrid,
        setupShips,
        selectedShipType, setSelectedShipType,
        orientation, setOrientation,
        onlineStep, setOnlineStep,
        isReady,
        opponentReady,
        opponentLeft,
        notification,
        shakeBoard,
        earnedCoins,
        winner,

        // Actions
        resetGame,
        handleSetupCellClick,
        randomizeSetup,
        startBattle,
        handleAttack,
        
        // Utils
        onToggleOrientation: () => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')
    };
};
