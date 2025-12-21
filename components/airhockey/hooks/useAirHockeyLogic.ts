import { useState, useRef, useCallback, useEffect } from 'react';
import { useCurrency } from '../../../hooks/useCurrency';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { useGameAudio } from '../../../hooks/useGameAudio';
import { Entity, GameState, GameMode, Difficulty } from '../types';
import { TABLE_WIDTH, TABLE_HEIGHT, PUCK_RADIUS, MALLET_RADIUS, PUCK_FRICTION, PUCK_MAX_SPEED, GOAL_WIDTH, MAX_SCORE, DIFFICULTY_SETTINGS } from '../constants';

// Helper: Linear Interpolation
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

export const useAirHockeyLogic = (
    audio: ReturnType<typeof useGameAudio>,
    addCoins: (amount: number) => void,
    mp: ReturnType<typeof useMultiplayer>,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { username, currentAvatarId, currentMalletId } = useCurrency();
    const { playPaddleHit, playWallHit, playGoalScore, playVictory, playGameOver, resumeAudio } = audio;
    
    // --- STATE ---
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
    const [score, setScore] = useState({ p1: 0, p2: 0 });
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [winner, setWinner] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    // Online state
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    // --- REFS (PHYSICS) ---
    const puckRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' });
    const playerMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#00f3ff' });
    const opponentMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#ffe600' });
    
    // Inputs Targets
    const p1TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const p2TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Previous positions for velocity calculation
    const lastP1PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const lastP2PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });

    // Network Sync Refs
    const latestNetworkStateRef = useRef<any>(null);
    const latestNetworkInputRef = useRef<{x: number, y: number} | null>(null);
    const lastNetworkUpdateRef = useRef(0);
    const isScoringRef = useRef(false);

    // --- SETUP ---
    useEffect(() => { mp.updateSelfInfo(username, currentAvatarId, currentMalletId); }, [username, currentAvatarId, currentMalletId, mp]);

    const resetRound = useCallback((isBottomGoal: boolean, forceGameMode?: GameMode) => {
        const newPuckY = isBottomGoal ? TABLE_HEIGHT / 2 + 50 : TABLE_HEIGHT / 2 - 50;
        
        puckRef.current = { x: TABLE_WIDTH / 2, y: newPuckY, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' };
        playerMalletRef.current.x = TABLE_WIDTH / 2;
        playerMalletRef.current.y = TABLE_HEIGHT - 100;
        opponentMalletRef.current.x = TABLE_WIDTH / 2;
        opponentMalletRef.current.y = 100;
        
        p1TargetRef.current = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 };
        p2TargetRef.current = { x: TABLE_WIDTH / 2, y: 100 };
        
        isScoringRef.current = false;
        
        const mode = forceGameMode || gameMode;
        if (mode === 'ONLINE' && mp.isHost) {
            mp.sendData({ type: 'AIRHOCKEY_RESET', puckY: newPuckY });
        }
        setGameState('playing');
    }, [gameMode, mp]);

    const handleGoal = (isBottomGoal: boolean) => {
        if (isScoringRef.current) return;
        if (gameMode === 'ONLINE' && !mp.isHost) return;

        isScoringRef.current = true;
        setGameState('scored');
        
        const newScore = { ...score };
        if (isBottomGoal) newScore.p2 += 1; else newScore.p1 += 1;
        setScore(newScore);
            
        if (gameMode === 'ONLINE' && mp.isHost) mp.sendData({ type: 'AIRHOCKEY_SCORE', score: newScore });

        if (isBottomGoal) { if (gameMode === 'SINGLE') playGameOver(); else playGoalScore(); } 
        else playGoalScore();

        if (newScore.p1 >= MAX_SCORE || newScore.p2 >= MAX_SCORE) {
            handleGameOverCheck(newScore);
        } else {
            setTimeout(() => resetRound(isBottomGoal), 1500);
        }
    };

    const handleGameOverCheck = (currentScore: {p1: number, p2: number}) => {
        const p1Wins = currentScore.p1 >= MAX_SCORE;
        
        if (gameMode === 'SINGLE') setWinner(p1Wins ? 'Player' : 'CPU');
        else if (gameMode === 'ONLINE') setWinner(p1Wins ? 'P1' : 'P2');
        else setWinner(p1Wins ? 'J1' : 'J2');
        
        setGameState('gameOver');
        
        const amIWinner = (gameMode === 'SINGLE' && p1Wins) || (gameMode === 'ONLINE' && ((mp.isHost && p1Wins) || (!mp.isHost && !p1Wins))) || (gameMode === 'LOCAL_VS' && p1Wins);

        if (amIWinner) {
            playVictory();
            if (gameMode === 'SINGLE' || gameMode === 'ONLINE') {
                const reward = 50 + (difficulty === 'MEDIUM' ? 25 : difficulty === 'HARD' ? 50 : 0);
                addCoins(reward);
                setEarnedCoins(reward);
                if (onReportProgress) onReportProgress('win', 1);
            }
        } else {
            playGameOver();
        }
    };

    const runPhysics = (puck: Entity, player: Entity, opponent: Entity) => {
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= PUCK_FRICTION;
        puck.vy *= PUCK_FRICTION;

        // Wall collisions
        if (puck.x < puck.radius || puck.x > TABLE_WIDTH - puck.radius) {
            puck.vx *= -1;
            puck.x = puck.x < puck.radius ? puck.radius : TABLE_WIDTH - puck.radius;
            playWallHit();
        }

        const goalMinX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
        const goalMaxX = (TABLE_WIDTH + GOAL_WIDTH) / 2;

        if (puck.x > goalMinX && puck.x < goalMaxX) {
            if (puck.y < 0) handleGoal(false);
            if (puck.y > TABLE_HEIGHT) handleGoal(true);
        } else {
            if (puck.y < puck.radius) { puck.vy *= -1; puck.y = puck.radius; playWallHit(); }
            if (puck.y > TABLE_HEIGHT - puck.radius) { puck.vy *= -1; puck.y = TABLE_HEIGHT - puck.radius; playWallHit(); }
        }

        // Mallet collisions
        [player, opponent].forEach(mallet => {
            const dx = puck.x - mallet.x;
            const dy = puck.y - mallet.y;
            const dist = Math.hypot(dx, dy) || 0.01;
            const min_dist = puck.radius + mallet.radius;
            
            if (dist < min_dist) {
                const nx = dx / dist;
                const ny = dy / dist;
                puck.x += nx * (min_dist - dist);
                puck.y += ny * (min_dist - dist);

                const vRelX = puck.vx - mallet.vx;
                const vRelY = puck.vy - mallet.vy;
                const velAlongNormal = vRelX * nx + vRelY * ny;

                if (velAlongNormal < 0) {
                    playPaddleHit();
                    const impulse = -(1 + 1.0) * velAlongNormal;
                    puck.vx += impulse * nx;
                    puck.vy += impulse * ny;
                }
                const s = Math.hypot(puck.vx, puck.vy);
                if (s > PUCK_MAX_SPEED) { puck.vx *= PUCK_MAX_SPEED/s; puck.vy *= PUCK_MAX_SPEED/s; }
            }
        });
    };

    const updateAI = () => {
        const cpu = opponentMalletRef.current;
        const puck = puckRef.current;
        const { speed, accuracy, prediction } = DIFFICULTY_SETTINGS[difficulty];

        let targetX = TABLE_WIDTH / 2;
        let targetY = 100; 

        if (puck.y < TABLE_HEIGHT / 2 && (Math.abs(puck.vy) < 2 || puck.vy > 0)) {
             targetX = puck.x;
             targetY = puck.y;
        } else if (puck.vy < 0) { 
            const timeToReach = (puck.y - targetY) / Math.abs(puck.vy);
            let predictedX = puck.x + (puck.vx * timeToReach);
            if (predictedX < 0) predictedX = -predictedX;
            if (predictedX > TABLE_WIDTH) predictedX = 2 * TABLE_WIDTH - predictedX;
            if (predictedX < 0) predictedX = 0;
            if (predictedX > TABLE_WIDTH) predictedX = TABLE_WIDTH;
            targetX = (predictedX * prediction) + (puck.x * (1 - prediction));
        } else {
            if (puck.y > TABLE_HEIGHT / 2) targetX = (TABLE_WIDTH / 2 + puck.x) / 2;
        }

        targetX += Math.sin(Date.now() / 400) * ((1 - accuracy) * 80); // Error
        const dx = targetX - cpu.x;
        const dy = targetY - cpu.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            const angle = Math.atan2(dy, dx);
            cpu.vx = Math.cos(angle) * speed;
            cpu.vy = Math.sin(angle) * speed;
        } else { cpu.vx = 0; cpu.vy = 0; }

        cpu.x += cpu.vx;
        cpu.y += cpu.vy;
        cpu.y = Math.max(cpu.radius, Math.min((TABLE_HEIGHT / 2) - cpu.radius, cpu.y));
        cpu.x = Math.max(cpu.radius, Math.min(TABLE_WIDTH - cpu.radius, cpu.x));
    };

    // --- MAIN LOOP STEP ---
    const update = () => {
        if (gameState !== 'playing') return;

        const puck = puckRef.current;
        const player = playerMalletRef.current;
        const opponent = opponentMalletRef.current;

        if (gameMode === 'ONLINE') {
            const now = Date.now();
            const shouldSend = now - lastNetworkUpdateRef.current > 40;

            if (mp.isHost) {
                // Host physics logic
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                if (latestNetworkInputRef.current) {
                    p2TargetRef.current = { x: TABLE_WIDTH - latestNetworkInputRef.current.x, y: TABLE_HEIGHT - latestNetworkInputRef.current.y };
                }
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;

                runPhysics(puck, player, opponent);

                if (shouldSend) {
                    mp.sendData({ type: 'AIRHOCKEY_STATE', puck: { x: puck.x, y: puck.y, vx: puck.vx, vy: puck.vy }, p1: { x: player.x, y: player.y }, p2: { x: opponent.x, y: opponent.y } });
                    lastNetworkUpdateRef.current = now;
                }
            } else {
                // Client interpolation
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                if (shouldSend) {
                    mp.sendData({ type: 'AIRHOCKEY_INPUT', x: p1TargetRef.current.x, y: p1TargetRef.current.y });
                    lastNetworkUpdateRef.current = now;
                }
                if (latestNetworkStateRef.current) {
                    const state = latestNetworkStateRef.current;
                    puck.x = lerp(puck.x, TABLE_WIDTH - state.puck.x, 0.4);
                    puck.y = lerp(puck.y, TABLE_HEIGHT - state.puck.y, 0.4);
                    opponent.x = lerp(opponent.x, TABLE_WIDTH - state.p1.x, 0.3);
                    opponent.y = lerp(opponent.y, TABLE_HEIGHT - state.p1.y, 0.3);
                }
            }
        } else {
            // Local Physics
            player.vx = player.x - lastP1PosRef.current.x;
            player.vy = player.y - lastP1PosRef.current.y;
            lastP1PosRef.current = { x: player.x, y: player.y };
            player.x += (p1TargetRef.current.x - player.x) * 0.4;
            player.y += (p1TargetRef.current.y - player.y) * 0.4;

            if (gameMode === 'SINGLE') updateAI();
            else {
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;
            }
            runPhysics(puck, player, opponent);
        }
    };

    const startGame = useCallback((diff: Difficulty, mode: GameMode = 'SINGLE') => {
        setDifficulty(diff);
        setGameMode(mode);
        setScore({ p1: 0, p2: 0 });
        setWinner(null);
        setEarnedCoins(0);
        isScoringRef.current = false;
        resetRound(true, mode);
        setGameState('playing');
        resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress, resetRound, resumeAudio]);

    // --- NETWORK LISTENER ---
    const handleNetworkData = useCallback((data: any) => {
        if (data.type === 'AIRHOCKEY_STATE') latestNetworkStateRef.current = data;
        else if (data.type === 'AIRHOCKEY_INPUT') latestNetworkInputRef.current = data;
        else if (data.type === 'AIRHOCKEY_SCORE') {
            setScore(data.score);
            if (data.score.p1 >= MAX_SCORE || data.score.p2 >= MAX_SCORE) handleGameOverCheck(data.score);
            else playGoalScore();
        }
        else if (data.type === 'AIRHOCKEY_RESET') {
            puckRef.current = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - data.puckY, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' };
            latestNetworkStateRef.current = null;
            isScoringRef.current = false;
            setGameState('playing');
        }
        else if (data.type === 'LEAVE_GAME') {
            setOpponentLeft(true);
            setGameState('gameOver');
            setWinner('ADVERSAIRE PARTI');
        }
        else if (data.type === 'REMATCH_START') startGame('MEDIUM', 'ONLINE');
    }, [playGoalScore, startGame]); 

    useEffect(() => {
        const unsubscribe = mp.subscribe(handleNetworkData);
        return () => unsubscribe();
    }, [mp.subscribe, handleNetworkData]);

    return {
        gameState, setGameState,
        gameMode, setGameMode,
        score, setScore,
        difficulty, setDifficulty,
        winner, setWinner,
        earnedCoins,
        onlineStep, setOnlineStep,
        opponentLeft,
        puckRef, playerMalletRef, opponentMalletRef,
        p1TargetRef, p2TargetRef,
        resetRound, startGame, update,
        currentMalletId
    };
};
