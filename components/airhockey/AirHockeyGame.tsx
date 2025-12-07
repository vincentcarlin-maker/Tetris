
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, LogOut, ArrowLeft, User, Users, Globe } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency, Mallet } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';

interface AirHockeyGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
}

// --- TYPES ---
interface Entity {
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    color: string;
}
type GameState = 'menu' | 'difficulty_select' | 'playing' | 'scored' | 'gameOver';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type GameMode = 'SINGLE' | 'LOCAL_VS' | 'ONLINE';

// --- CONSTANTS ---
const TABLE_WIDTH = 400;
const TABLE_HEIGHT = 600;
const PUCK_RADIUS = 15;
const MALLET_RADIUS = 25;
const GOAL_WIDTH = 120;
const MAX_SCORE = 7;
const PUCK_FRICTION = 0.995;
const PUCK_MAX_SPEED = 15;

const DIFFICULTY_SETTINGS = {
    EASY: { speed: 3, accuracy: 0.6, prediction: 0 },
    MEDIUM: { speed: 5, accuracy: 0.85, prediction: 0.5 },
    HARD: { speed: 7, accuracy: 0.98, prediction: 1.0 },
};

// Helper: Linear Interpolation for smooth movement
const lerp = (start: number, end: number, t: number) => {
    return start + (end - start) * t;
};

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({ onBack, audio, addCoins, mp }) => {
    const { currentMalletId, malletsCatalog, username, currentAvatarId, avatarsCatalog } = useCurrency();
    const { subscribe, sendData, isHost, peerId, mode: mpMode } = mp; 
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
    
    // Score is now absolute: P1 (Host/Bottom in Single) vs P2 (Client/Top in Single)
    const [score, setScore] = useState({ p1: 0, p2: 0 });
    
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [winner, setWinner] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    
    // Online specific state
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    const { playPaddleHit, playWallHit, playGoalScore, playVictory, playGameOver, resumeAudio } = audio;

    // --- GAME OBJECT REFS ---
    const puckRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' });
    const playerMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#00f3ff' });
    const opponentMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#ffe600' });
    
    const animationFrameRef = useRef<number>(0);
    const isScoringRef = useRef(false); // Prevents multiple goals per shot
    
    // Input Refs (Targets for smoothing)
    const p1TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const p2TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Physics State Refs (Previous positions for velocity calc)
    const lastP1PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const lastP2PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Network Data Refs
    const latestNetworkStateRef = useRef<any>(null);
    const latestNetworkInputRef = useRef<{x: number, y: number} | null>(null);

    // Sync Self Info
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId);
    }, [username, currentAvatarId, mp]);

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

    // Define resetRound first so it can be used in startGame
    const resetRound = useCallback((isBottomGoal: boolean) => {
        const newPuckY = isBottomGoal ? TABLE_HEIGHT / 2 + 50 : TABLE_HEIGHT / 2 - 50;
        
        // Reset Local State
        puckRef.current = {
            x: TABLE_WIDTH / 2,
            y: newPuckY,
            vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
        };
        // Reset positions
        playerMalletRef.current.x = TABLE_WIDTH / 2;
        playerMalletRef.current.y = TABLE_HEIGHT - 100;
        opponentMalletRef.current.x = TABLE_WIDTH / 2;
        opponentMalletRef.current.y = 100;
        
        // Reset targets
        p1TargetRef.current = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 };
        p2TargetRef.current = { x: TABLE_WIDTH / 2, y: 100 };
        
        isScoringRef.current = false;
        
        // If Host, broadcast reset to ensure client snaps
        if (gameMode === 'ONLINE' && isHost) {
            sendData({ type: 'AIRHOCKEY_RESET', puckY: newPuckY });
        }

        setGameState('playing');
    }, [gameMode, isHost, sendData]);

    const startGame = useCallback((diff: Difficulty, mode: GameMode = 'SINGLE') => {
        setDifficulty(diff);
        setGameMode(mode);
        setScore({ p1: 0, p2: 0 });
        setWinner(null);
        setEarnedCoins(0);
        isScoringRef.current = false;
        resetRound(true);
        setGameState('playing');
        resumeAudio();
    }, [resetRound, resumeAudio]);

    // Handle Online Mode Transition
    useEffect(() => {
        if (mpMode === 'lobby') {
            if (isHost) {
                if (onlineStep !== 'game') {
                    setOnlineStep('game');
                    // When hosting, we go straight to "playing" state (but waiting for opponent)
                    resetRound(true);
                }
            } else {
                if (onlineStep !== 'lobby') {
                    setOnlineStep('lobby');
                }
                // Ensure we are in menu state to show the lobby list properly
                if (gameState === 'playing' || gameState === 'gameOver') setGameState('menu'); 
            }
        } else if (mpMode === 'in_game') {
            if (onlineStep !== 'game') setOnlineStep('game');
            setOpponentLeft(false);
            if (gameState !== 'playing') {
                startGame('MEDIUM', 'ONLINE'); // Difficulty ignored for online
            }
        }
    }, [mpMode, isHost, onlineStep, gameState, resetRound, startGame]);

    const handleGameOverCheck = (currentScore: {p1: number, p2: number}) => {
        if (currentScore.p1 >= MAX_SCORE || currentScore.p2 >= MAX_SCORE) {
            const p1Wins = currentScore.p1 >= MAX_SCORE;
            
            if (gameMode === 'SINGLE') {
                setWinner(p1Wins ? 'Player' : 'CPU');
            } else if (gameMode === 'ONLINE') {
                setWinner(p1Wins ? 'P1' : 'P2');
            } else {
                setWinner(p1Wins ? 'J1' : 'J2');
            }
            
            setGameState('gameOver');
            
            // Audio & Coins logic
            // In Single: P1 is Player.
            // In Online: P1 is Host, P2 is Client.
            const amIWinner = (gameMode === 'SINGLE' && p1Wins) || 
                              (gameMode === 'ONLINE' && ((isHost && p1Wins) || (!isHost && !p1Wins))) ||
                              (gameMode === 'LOCAL_VS' && p1Wins);

            if (amIWinner) {
                playVictory();
                if (gameMode === 'SINGLE' || gameMode === 'ONLINE') {
                    const reward = 50 + (difficulty === 'MEDIUM' ? 25 : difficulty === 'HARD' ? 50 : 0);
                    addCoins(reward);
                    setEarnedCoins(reward);
                }
            } else {
                playGameOver();
            }
        }
    }

    // Network Message Handling
    useEffect(() => {
        const unsubscribe = subscribe((data: any) => {
            if (data.type === 'AIRHOCKEY_STATE') {
                latestNetworkStateRef.current = data;
            }
            else if (data.type === 'AIRHOCKEY_INPUT') {
                latestNetworkInputRef.current = data;
            }
            else if (data.type === 'AIRHOCKEY_SCORE') {
                setScore(data.score); // Client receives authoritative score
                if (data.score.p1 >= MAX_SCORE || data.score.p2 >= MAX_SCORE) {
                    handleGameOverCheck(data.score);
                } else {
                    playGoalScore();
                }
            }
            else if (data.type === 'AIRHOCKEY_RESET') {
                // FORCE SNAP on Reset
                const hostPuckY = data.puckY;
                // Invert Y for Client
                const clientPuckY = TABLE_HEIGHT - hostPuckY;
                
                puckRef.current = {
                    x: TABLE_WIDTH / 2,
                    y: clientPuckY,
                    vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
                };
                latestNetworkStateRef.current = null; // Clear interpolator
                isScoringRef.current = false;
                setGameState('playing');
            }
            else if (data.type === 'LEAVE_GAME') {
                setOpponentLeft(true);
                setGameState('gameOver');
                setWinner('ADVERSAIRE PARTI');
            }
            else if (data.type === 'REMATCH_START') {
                startGame('MEDIUM', 'ONLINE');
            }
        });
        return () => unsubscribe();
    }, [subscribe, startGame]); 

    const selectMode = (mode: GameMode) => {
        setGameMode(mode);
        if (mode === 'SINGLE') {
            setGameState('difficulty_select');
        } else if (mode === 'LOCAL_VS') {
            startGame('MEDIUM', 'LOCAL_VS');
        } 
        // For ONLINE, the useEffect triggers connection logic
    };

    const handleGoal = (isBottomGoal: boolean) => {
        if (isScoringRef.current) return;
        // Only Host or Single Player handles game logic
        if (gameMode === 'ONLINE' && !isHost) return;

        isScoringRef.current = true;
        setGameState('scored');
        
        setScore(prevScore => {
            const newScore = { ...prevScore };
            if (isBottomGoal) {
                newScore.p2 += 1; // P2 scored (puck went into bottom goal)
            } else {
                newScore.p1 += 1; // P1 scored (puck went into top goal)
            }
            
            // Broadcast Score if Online Host
            if (gameMode === 'ONLINE' && isHost) {
                sendData({ type: 'AIRHOCKEY_SCORE', score: newScore });
            }

            // Sound logic
            if (isBottomGoal) {
                 if (gameMode === 'SINGLE') playGameOver(); else playGoalScore(); 
            } else {
                playGoalScore();
            }

            handleGameOverCheck(newScore);

            if (newScore.p1 < MAX_SCORE && newScore.p2 < MAX_SCORE) {
                setTimeout(() => resetRound(isBottomGoal), 1500);
            }

            return newScore;
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
        } 
        else if (puck.vy < 0) { 
            const timeToReach = (puck.y - targetY) / Math.abs(puck.vy);
            let predictedX = puck.x + (puck.vx * timeToReach);
            if (predictedX < 0) predictedX = -predictedX;
            if (predictedX > TABLE_WIDTH) predictedX = 2 * TABLE_WIDTH - predictedX;
            if (predictedX < 0) predictedX = 0;
            if (predictedX > TABLE_WIDTH) predictedX = TABLE_WIDTH;
            targetX = (predictedX * prediction) + (puck.x * (1 - prediction));
        } else {
            if (puck.y > TABLE_HEIGHT / 2) {
                targetX = (TABLE_WIDTH / 2 + puck.x) / 2;
            }
        }

        const errorMag = (1 - accuracy) * 80;
        const timeFactor = Date.now() / 400; 
        const currentError = Math.sin(timeFactor) * errorMag;
        targetX += currentError;

        const dx = targetX - cpu.x;
        const dy = targetY - cpu.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
            const angle = Math.atan2(dy, dx);
            cpu.vx = Math.cos(angle) * speed;
            cpu.vy = Math.sin(angle) * speed;
        } else {
            cpu.vx = 0;
            cpu.vy = 0;
        }

        cpu.x += cpu.vx;
        cpu.y += cpu.vy;

        const maxY = (TABLE_HEIGHT / 2) - cpu.radius; 
        cpu.y = Math.max(cpu.radius, Math.min(maxY, cpu.y));
        cpu.x = Math.max(cpu.radius, Math.min(TABLE_WIDTH - cpu.radius, cpu.x));
    };

    const drawMallet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, malletStyle?: Mallet, isOpponent: boolean = false) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (isOpponent) {
            // CPU = Yellow, Player 2 / Opponent = Red
            const color = (gameMode === 'LOCAL_VS' || gameMode === 'ONLINE') ? '#ff0055' : '#ffe600';
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            return;
        }

        if (!malletStyle || malletStyle.type === 'basic') {
            ctx.fillStyle = malletStyle?.colors[0] || '#00f3ff';
            ctx.shadowColor = malletStyle?.colors[0] || '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if (malletStyle.type === 'gradient') {
            const grad = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
            grad.addColorStop(0, malletStyle.colors[0]);
            grad.addColorStop(1, malletStyle.colors[1] || malletStyle.colors[0]);
            ctx.fillStyle = grad;
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (malletStyle.type === 'ring' || malletStyle.type === 'target') {
            ctx.fillStyle = malletStyle.colors[1] || '#000';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = malletStyle.colors[0];
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI);
            ctx.strokeStyle = malletStyle.colors[0];
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.2, 0, 2 * Math.PI);
            ctx.fillStyle = malletStyle.colors[0];
            ctx.fill();
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 15;
        } else if (malletStyle.type === 'flower') {
            ctx.fillStyle = malletStyle.colors[1];
            ctx.shadowColor = malletStyle.colors[0];
            ctx.shadowBlur = 10;
            const petalCount = 6;
            for(let i=0; i<petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const px = x + Math.cos(angle) * (radius * 0.6);
                const py = y + Math.sin(angle) * (radius * 0.6);
                ctx.beginPath();
                ctx.arc(px, py, radius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = malletStyle.colors[0];
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = malletStyle.colors[1];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (malletStyle.type === 'complex') {
            const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
            const colors = malletStyle.colors;
            colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
            ctx.fillStyle = grad;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    };

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const puck = puckRef.current;
        const player = playerMalletRef.current;
        const opponent = opponentMalletRef.current;

        // --- ONLINE LOGIC BRANCHING ---
        if (gameMode === 'ONLINE') {
            if (isHost) {
                // === HOST LOGIC (AUTHORITATIVE) ===
                
                // 1. Update Player 1 (Host) from local input
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                // 2. Update Player 2 (Client) from network input (Transformed)
                if (latestNetworkInputRef.current) {
                    const clientInput = latestNetworkInputRef.current;
                    // Transform Client's Bottom-view coordinates to Host's Top-view
                    const targetX = TABLE_WIDTH - clientInput.x;
                    const targetY = TABLE_HEIGHT - clientInput.y;
                    
                    p2TargetRef.current = { x: targetX, y: targetY };
                }
                
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;

                // 3. Physics (Host Authoritative)
                runPhysics(puck, player, opponent);

                // 4. Send State
                sendData({
                    type: 'AIRHOCKEY_STATE',
                    puck: { x: puck.x, y: puck.y, vx: puck.vx, vy: puck.vy },
                    p1: { x: player.x, y: player.y }, // Host position
                    p2: { x: opponent.x, y: opponent.y } // Client position
                });

            } else {
                // === CLIENT LOGIC ===
                
                // 1. Local Prediction for Paddle (Immediate response)
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                
                // Smooth local movement
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                // 2. Send Input
                sendData({
                    type: 'AIRHOCKEY_INPUT',
                    x: p1TargetRef.current.x,
                    y: p1TargetRef.current.y
                });

                // 3. Interpolate Network Entities
                if (latestNetworkStateRef.current) {
                    const state = latestNetworkStateRef.current;
                    
                    // Invert coordinates for Client View (180deg rotation)
                    // Host's Puck
                    const targetPuckX = TABLE_WIDTH - state.puck.x;
                    const targetPuckY = TABLE_HEIGHT - state.puck.y;
                    
                    // Host's P1 is Client's Opponent (Top)
                    const targetOppX = TABLE_WIDTH - state.p1.x; 
                    const targetOppY = TABLE_HEIGHT - state.p1.y;

                    // Interpolate
                    puck.x = lerp(puck.x, targetPuckX, 0.4);
                    puck.y = lerp(puck.y, targetPuckY, 0.4);
                    
                    opponent.x = lerp(opponent.x, targetOppX, 0.3);
                    opponent.y = lerp(opponent.y, targetOppY, 0.3);
                }
            }
        } 
        else {
            // --- OFFLINE / LOCAL LOGIC ---
            
            // Player 1 (Bottom)
            player.vx = player.x - lastP1PosRef.current.x;
            player.vy = player.y - lastP1PosRef.current.y;
            lastP1PosRef.current = { x: player.x, y: player.y };
            player.x += (p1TargetRef.current.x - player.x) * 0.4;
            player.y += (p1TargetRef.current.y - player.y) * 0.4;

            // Player 2 / CPU (Top)
            if (gameMode === 'SINGLE') {
                updateAI();
            } else {
                // Local VS: Update P2 from touch input
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;
            }

            runPhysics(puck, player, opponent);
        }

        // --- RENDER ---
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

                // Board
                ctx.fillStyle = '#0a0a12';
                ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

                // Center Lines
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.moveTo(0, TABLE_HEIGHT / 2);
                ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT / 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 50, 0, 2 * Math.PI);
                ctx.stroke();

                // Goals
                const goalMinX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
                const goalMaxX = (TABLE_WIDTH + GOAL_WIDTH) / 2;
                ctx.strokeStyle = '#ff00ff';
                ctx.shadowColor = '#ff00ff';
                ctx.beginPath();
                ctx.moveTo(goalMinX, 0); ctx.lineTo(goalMaxX, 0); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(goalMinX, TABLE_HEIGHT); ctx.lineTo(goalMaxX, TABLE_HEIGHT); ctx.stroke();

                ctx.shadowBlur = 0; 

                // Draw Puck
                ctx.beginPath();
                ctx.arc(puck.x, puck.y, puck.radius, 0, 2 * Math.PI);
                ctx.fillStyle = puck.color;
                ctx.shadowColor = puck.color;
                ctx.shadowBlur = 20;
                ctx.fill();

                // Draw Player Mallet (My Mallet - Always Bottom)
                const playerMalletStyle = malletsCatalog.find(m => m.id === currentMalletId);
                drawMallet(ctx, player.x, player.y, player.radius, playerMalletStyle, false);

                // Draw Opponent Mallet (Always Top)
                drawMallet(ctx, opponent.x, opponent.y, opponent.radius, undefined, true);
            }
        }

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, difficulty, currentMalletId, malletsCatalog, gameMode, isHost, sendData]);

    // Physics Engine (Extracted to reuse/skip)
    const runPhysics = (puck: Entity, player: Entity, opponent: Entity) => {
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= PUCK_FRICTION;
        puck.vy *= PUCK_FRICTION;

        // Wall Collisions
        if (puck.x < puck.radius || puck.x > TABLE_WIDTH - puck.radius) {
            puck.vx *= -1;
            puck.x = puck.x < puck.radius ? puck.radius : TABLE_WIDTH - puck.radius;
            playWallHit();
        }

        const goalYTop = 0;
        const goalYBottom = TABLE_HEIGHT;
        const goalMinX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
        const goalMaxX = (TABLE_WIDTH + GOAL_WIDTH) / 2;

        // Goal Detection
        if (puck.x > goalMinX && puck.x < goalMaxX) {
            if (puck.y < goalYTop) handleGoal(false); // Top Goal (Puck went UP) -> Player (P1) scored
            if (puck.y > goalYBottom) handleGoal(true); // Bottom Goal (Puck went DOWN) -> Opponent (P2) scored
        } else {
            // Top/Bottom Wall Bounce
            if (puck.y < puck.radius) {
                puck.vy *= -1;
                puck.y = puck.radius;
                playWallHit();
            }
            if (puck.y > TABLE_HEIGHT - puck.radius) {
                puck.vy *= -1;
                puck.y = TABLE_HEIGHT - puck.radius;
                playWallHit();
            }
        }

        // Mallet Collisions
        [player, opponent].forEach(mallet => {
            const dx = puck.x - mallet.x;
            const dy = puck.y - mallet.y;
            let distance = Math.hypot(dx, dy);
            if (distance === 0) distance = 0.01;

            const min_dist = puck.radius + mallet.radius;
            
            if (distance < min_dist) {
                const nx = dx / distance;
                const ny = dy / distance;
                const overlap = min_dist - distance;
                
                puck.x += nx * overlap;
                puck.y += ny * overlap;

                const vRelX = puck.vx - mallet.vx;
                const vRelY = puck.vy - mallet.vy;
                const velAlongNormal = vRelX * nx + vRelY * ny;

                if (velAlongNormal < 0) {
                    playPaddleHit();
                    const restitution = 1.0; 
                    const impulse = -(1 + restitution) * velAlongNormal;
                    puck.vx += impulse * nx;
                    puck.vy += impulse * ny;
                }
                
                const speed = Math.hypot(puck.vx, puck.vy);
                if (speed > PUCK_MAX_SPEED) {
                    const ratio = PUCK_MAX_SPEED / speed;
                    puck.vx *= ratio;
                    puck.vy *= ratio;
                }
            }
        });
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameLoop]);

    // --- INPUT HANDLING ---

    const updateTargets = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // Player 1 Control (Standard Bottom) - Always active for "Me"
        // In Online mode, client only cares about their own input (visually bottom)
        if (gameMode !== 'LOCAL_VS' || y > TABLE_HEIGHT / 2) {
             // In Online Client mode, we treat the whole board as input area but clamp to bottom half
             // This allows dragging from anywhere but paddle stays in half
             p1TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
            };
        }
        
        // Player 2 Control (Top Half - VS Mode Only)
        if (gameMode === 'LOCAL_VS' && y <= TABLE_HEIGHT / 2) {
            p2TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(MALLET_RADIUS, Math.min(TABLE_HEIGHT / 2 - MALLET_RADIUS, y)),
            };
        }
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        updateTargets(e.clientX, e.clientY);
    }, [gameMode]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            updateTargets(touch.clientX, touch.clientY);
        }
    }, [gameMode]);

    const handleTouchStart = (e: React.TouchEvent) => {
        resumeAudio();
        handleTouchMove(e);
    };

    const handleLocalBack = () => {
        if (gameState === 'menu') {
            onBack();
        } else if (gameMode === 'ONLINE' && onlineStep === 'lobby') {
            mp.disconnect();
            setGameState('menu');
        } else if (gameState === 'playing' && gameMode === 'ONLINE') {
            mp.leaveGame();
            setGameState('menu');
        } else {
            setGameState('menu');
        }
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-blue-300 tracking-wider drop-shadow-md">LOBBY AIR HOCKEY</h3>
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
                </div>
             </div>
         );
    };

    // --- DISPLAY SCORE LOGIC ---
    // If Online:
    //   If Host: My Score = P1, Opponent Score = P2
    //   If Client: My Score = P2, Opponent Score = P1
    const myScore = (gameMode === 'ONLINE' && !isHost) ? score.p2 : score.p1;
    const oppScore = (gameMode === 'ONLINE' && !isHost) ? score.p1 : score.p2;

    // --- LOBBY VIEW ---
    if (gameMode === 'ONLINE' && onlineStep === 'lobby' && gameState !== 'playing') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 pr-2 pb-1">AIR HOCKEY</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            <div className="w-full max-w-md flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex items-center gap-4 font-black text-2xl">
                    <span className="text-neon-blue">{myScore}</span>
                    <span className="text-white text-lg">VS</span>
                    <span className="text-pink-500">{oppScore}</span>
                </div>
                <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else setGameState('menu'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>

            <div 
                className={`relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden cursor-none ${gameMode === 'LOCAL_VS' ? 'border-pink-500/30' : ''}`}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT} className="w-full h-full" />
                
                {/* MENU PRINCIPAL */}
                {gameState === 'menu' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                        <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#00f3ff]">AIR HOCKEY</h1>
                        
                        <div className="flex flex-col gap-4 w-full max-w-[240px] mt-8">
                            <button onClick={() => selectMode('SINGLE')} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                <User size={20} className="text-neon-blue"/> 1 JOUEUR
                            </button>
                            <button onClick={() => selectMode('LOCAL_VS')} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                <Users size={20} className="text-pink-500"/> 2 JOUEURS (VS)
                            </button>
                            <button onClick={() => selectMode('ONLINE')} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                                <Globe size={20} className="text-green-500"/> EN LIGNE
                            </button>
                        </div>
                    </div>
                )}

                {/* WAIT SCREEN FOR ONLINE */}
                {gameMode === 'ONLINE' && onlineStep === 'game' && !mp.gameOpponent && (
                    <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center">
                        <div className="text-blue-400 font-bold animate-pulse mb-4">EN ATTENTE D'UN JOUEUR...</div>
                        <button onClick={mp.cancelHosting} className="px-4 py-2 bg-red-600 rounded text-white font-bold">ANNULER</button>
                    </div>
                )}

                {/* SELECTEUR DIFFICULTÉ (SOLO UNIQUEMENT) */}
                {gameState === 'difficulty_select' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                        <h2 className="text-3xl font-black text-white mb-6">DIFFICULTÉ</h2>
                        <div className="flex flex-col gap-3 w-full max-w-[200px]">
                            <button onClick={() => startGame('EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                            <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                            <button onClick={() => startGame('HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
                        </div>
                        <button onClick={() => setGameState('menu')} className="mt-8 text-gray-500 text-sm hover:text-white">RETOUR</button>
                    </div>
                )}
                
                {/* GAME OVER */}
                {(gameState === 'gameOver' || opponentLeft) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in">
                        {opponentLeft ? (
                            <>
                                <LogOut size={48} className="text-red-500 mb-2"/>
                                <h2 className="text-3xl font-black text-white mb-4">ADVERSAIRE PARTI</h2>
                            </>
                        ) : (
                            gameMode === 'SINGLE' ? (
                                winner === 'Player' ? (
                                    <>
                                        <Trophy size={64} className="text-yellow-400 mb-4 drop-shadow-[0_0_20px_#facc15]" />
                                        <h2 className="text-4xl font-black text-white mb-2">VICTOIRE !</h2>
                                        {earnedCoins > 0 && <div className="mb-4 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                                    </>
                                ) : (
                                    <h2 className="text-4xl font-black text-red-500 mb-6">DÉFAITE</h2>
                                )
                            ) : (
                                <>
                                    <Trophy size={64} className={(gameMode === 'ONLINE' && ((isHost && winner === 'P1') || (!isHost && winner === 'P2'))) || (winner === 'J1' || winner === 'Player') ? "text-neon-blue" : "text-pink-500"} />
                                    <h2 className="text-4xl font-black text-white mb-2 mt-4">
                                        {gameMode === 'ONLINE' ? 
                                            ((isHost && winner === 'P1') || (!isHost && winner === 'P2') ? "VICTOIRE !" : "DÉFAITE...") 
                                            : `${winner === 'J1' ? 'JOUEUR 1' : 'JOUEUR 2'} GAGNE !`}
                                    </h2>
                                </>
                            )
                        )}
                        
                        <div className="flex flex-col gap-3 mt-4">
                            {gameMode === 'ONLINE' ? (
                                <>
                                    {!opponentLeft && <button onClick={() => mp.requestRematch()} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg">REVANCHE</button>}
                                    <button onClick={() => { mp.leaveGame(); setGameState('menu'); }} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">QUITTER</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startGame(difficulty, gameMode)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg">REJOUER</button>
                                    <button onClick={onBack} className="text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">QUITTER</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
