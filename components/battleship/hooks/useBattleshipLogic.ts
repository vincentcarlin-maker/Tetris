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
    const { username, currentAvatarId } = useCurrency();
    const { playBlockHit, playWallHit, playVictory, playGameOver, playMove, playLaserShoot, playShipSink, playPaddleHit, playSplash, resumeAudio } = audio;

    const [phase, setPhase] = useState<'MENU' | 'LOBBY' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('MENU');
    const [turn, setTurn] = useState<'PLAYER' | 'CPU'>('PLAYER');
    const [gameMode, setGameMode] = useState<'SOLO' | 'ONLINE'>('SOLO');
    const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
    const [cpuGrid, setCpuGrid] = useState<Grid>(createEmptyGrid());
    const [cpuRealGrid, setCpuRealGrid] = useState<Grid>(createEmptyGrid());
    const [playerShips, setPlayerShips] = useState<Ship[]>([]);
    const [cpuShips, setCpuShips] = useState<Ship[]>([]);
    const [setupGrid, setSetupGrid] = useState<Grid>(createEmptyGrid());
    const [setupShips, setSetupShips] = useState<Ship[]>([]);
    const [selectedShipType, setSelectedShipType] = useState<ShipType | null>(null);
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [isReady, setIsReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [notification, setNotification] = useState<{text: string, type: 'HIT'|'SUNK'|'MISS'} | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [winner, setWinner] = useState<'PLAYER' | 'CPU' | null>(null);
    const [shakeBoard, setShakeBoard] = useState(false);

    const handleDataRef = useRef<(data: any) => void>(null);

    useEffect(() => {
        if (gameMode === 'ONLINE') {
            setOnlineStep('connecting');
            mp?.connect();
        } else {
            mp?.disconnect();
            setOnlineStep('connecting');
            setOpponentLeft(false);
        }
    }, [gameMode]);

    useEffect(() => {
        if (!mp) return;
        const isHosting = mp.players.find((p: any) => p.id === mp.peerId)?.status === 'hosting';
        if (mp.mode === 'lobby') {
            if (isHosting) setOnlineStep('game');
            else setOnlineStep('lobby');
            if (phase !== 'MENU' && phase !== 'LOBBY') setPhase('LOBBY');
        } else if (mp.mode === 'in_game') {
            setOnlineStep('game');
            setOpponentLeft(false);
            setPhase('SETUP'); // Une fois le match trouvé, on place ses bateaux
        } else if (mp.mode === 'connecting') {
            setOnlineStep('connecting');
        }
    }, [mp?.mode, mp?.players, mp?.peerId]);

    useEffect(() => { mp?.updateSelfInfo(username, currentAvatarId, undefined, 'Battleship'); }, [username, currentAvatarId, mp]);

    const triggerShake = useCallback(() => {
        setShakeBoard(true);
        setTimeout(() => setShakeBoard(false), 500);
    }, []);

    const resetGame = useCallback(() => {
        setPhase('SETUP'); setTurn('PLAYER'); setWinner(null);
        setPlayerGrid(createEmptyGrid()); setCpuGrid(createEmptyGrid()); setCpuRealGrid(createEmptyGrid());
        setPlayerShips([]); setCpuShips([]); setSetupGrid(createEmptyGrid()); setSetupShips([]);
        setSelectedShipType(null); setEarnedCoins(0); setNotification(null);
        setIsReady(false); setOpponentReady(false); setOpponentLeft(false);
        setShakeBoard(false);
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    const handleSetupCellClick = useCallback((r: number, c: number) => {
        if (!selectedShipType || phase !== 'SETUP') return;
        
        const shipConfig = SHIPS_CONFIG.find(s => s.type === selectedShipType);
        if (!shipConfig) return;

        if (isValidPlacement(setupGrid, r, c, shipConfig.size, orientation)) {
            const newShip: Ship = {
                id: `ship-${Date.now()}`,
                type: selectedShipType,
                size: shipConfig.size,
                hits: 0,
                orientation,
                row: r,
                col: c,
                sunk: false
            };
            
            const newGrid = setupGrid.map(row => [...row]);
            placeShipOnGrid(newGrid, newShip);
            
            setSetupGrid(newGrid);
            setSetupShips(prev => [...prev, newShip]);
            setSelectedShipType(null);
            playMove();
        } else {
            playWallHit();
        }
    }, [selectedShipType, phase, setupGrid, orientation, playMove, playWallHit]);

    const handleShotResult = (r: number, c: number, status: 'HIT'|'MISS'|'SUNK', shipDetails: any) => {
        const newG = cpuGrid.map(row => [...row]);
        newG[r][c] = (status === 'HIT' || status === 'SUNK') ? 3 : 2;
        setCpuGrid(newG);
        if (status === 'HIT' || status === 'SUNK') {
            playBlockHit();
            triggerShake();
            if (status === 'SUNK') {
                playShipSink(); setNotification({ text: "NAVIRE ENNEMI COULÉ !", type: 'SUNK' });
                if (gameMode === 'ONLINE' && shipDetails) setCpuShips(p => [...p, { ...shipDetails, id: `enemy-${Date.now()}` }]);
                const sunkCount = gameMode === 'ONLINE' ? cpuShips.length + 1 : cpuShips.filter(s => s.sunk).length;
                if (sunkCount >= 5) { setWinner('PLAYER'); setPhase('GAMEOVER'); playVictory(); addCoins(100); setEarnedCoins(100); }
            } else setNotification({ text: "TOUCHÉ !", type: 'HIT' });
        } else { playSplash(); setTurn('CPU'); }
    };

    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'BATTLESHIP_READY') {
                setOpponentReady(true);
                if (isReady) { setPhase('PLAYING'); setTurn(mp.isHost ? 'PLAYER' : 'CPU'); }
            }
            if (data.type === 'BATTLESHIP_SHOT') {
                const isHit = playerGrid[data.r][data.c] === 1;
                const newG = playerGrid.map(row => [...row]); newG[data.r][data.c] = isHit ? 3 : 2; setPlayerGrid(newG);
                let res: any = isHit ? 'HIT' : 'MISS'; let sDetails = null;
                if (isHit) {
                    triggerShake();
                    const newS = playerShips.map(s => ({ ...s })); const update = checkHit(data.r, data.c, newS);
                    if (update.sunk) { res = 'SUNK'; const s = newS.find(sh => sh.id === update.shipId); if (s) sDetails = s; }
                    setPlayerShips(newS); if (newS.every(s => s.sunk)) { setWinner('CPU'); setPhase('GAMEOVER'); playGameOver(); }
                } else setTurn('PLAYER');
                mp?.sendData({ type: 'BATTLESHIP_RESULT', r: data.r, c: data.c, status: res, shipDetails: sDetails });
            }
            if (data.type === 'BATTLESHIP_RESULT') handleShotResult(data.r, data.c, data.status, data.shipDetails);
            if (data.type === 'LEAVE_GAME') { setOpponentLeft(true); setWinner('PLAYER'); setPhase('GAMEOVER'); }
            if (data.type === 'REMATCH_START') resetGame();
        };
    });

    useEffect(() => {
        if (isReady && opponentReady && phase === 'SETUP') {
             setPhase('PLAYING');
             setTurn(mp.isHost ? 'PLAYER' : 'CPU');
        }
    }, [isReady, opponentReady, phase, mp.isHost]);

    useEffect(() => {
        const unsubscribe = mp?.subscribe((data: any) => handleDataRef.current?.(data));
        return () => unsubscribe && unsubscribe();
    }, [mp]);

    return {
        phase, setPhase, turn, gameMode, setGameMode, playerGrid, cpuGrid, playerShips, cpuShips, setupGrid, setupShips, selectedShipType, setSelectedShipType, orientation, setOrientation, onlineStep, setOnlineStep, isReady, opponentReady, opponentLeft, notification, earnedCoins, winner,
        shakeBoard,
        resetGame, randomizeSetup: () => { const { grid, ships } = generateRandomShips(); setSetupGrid(grid); setSetupShips(ships); setSelectedShipType(null); playMove(); },
        handleSetupCellClick,
        startBattle: () => { 
            setPlayerShips(setupShips); setPlayerGrid(setupGrid); 
            if (gameMode === 'SOLO') { 
                const { grid, ships } = generateRandomShips(); 
                setCpuRealGrid(grid); setCpuShips(ships); setPhase('PLAYING'); playVictory(); 
            } else { 
                setIsReady(true); mp?.sendData({ type: 'BATTLESHIP_READY' }); 
            } 
        },
        handleAttack: (r: number, c: number) => { if (phase === 'PLAYING' && turn === 'PLAYER' && cpuGrid[r][c] === 0) { playLaserShoot(); if (gameMode === 'ONLINE') mp?.sendData({ type: 'BATTLESHIP_SHOT', r, c }); else { const isHit = cpuRealGrid[r][c] === 1; let res: any = isHit ? 'HIT' : 'MISS'; let sD = null; if (isHit) { const newS = cpuShips.map(s => ({...s})); const upd = checkHit(r, c, newS); if (upd.sunk) { res = 'SUNK'; sD = newS.find(sh => sh.id === upd.shipId); } setCpuShips(newS); if (newS.every(s => s.sunk)) { setWinner('PLAYER'); setPhase('GAMEOVER'); playVictory(); addCoins(100); setEarnedCoins(100); } } handleShotResult(r, c, res, sD); } } },
        onToggleOrientation: () => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')
    };
};