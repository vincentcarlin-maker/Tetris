
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, LogOut, ArrowLeft, User, Users, Globe, Pause, Loader2, HelpCircle, ArrowRight, Zap, Shield } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency, Mallet } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { TutorialOverlay } from '../Tutorials';

interface AirHockeyGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
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

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { currentMalletId, malletsCatalog, username, currentAvatarId, avatarsCatalog } = useCurrency();
    const { subscribe, sendData, isHost, peerId, mode: mpMode } = mp; 
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
    const [isPaused, setIsPaused] = useState(false);
    
    const [score, setScore] = useState({ p1: 0, p2: 0 });
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [winner, setWinner] = useState<string | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Online specific state
    const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
    const [opponentLeft, setOpponentLeft] = useState(false);

    const { playPaddleHit, playWallHit, playGoalScore, playVictory, playGameOver, resumeAudio } = audio;

    // --- GAME OBJECT REFS ---
    const puckRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff' });
    const playerMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#00f3ff' });
    const opponentMalletRef = useRef<Entity>({ x: TABLE_WIDTH / 2, y: 100, vx: 0, vy: 0, radius: MALLET_RADIUS, color: '#ffe600' });
    
    const animationFrameRef = useRef<number>(0);
    const isScoringRef = useRef(false); 
    
    // Input Refs
    const p1TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const p2TargetRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Physics State Refs
    const lastP1PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 });
    const lastP2PosRef = useRef<{ x: number, y: number }>({ x: TABLE_WIDTH / 2, y: 100 });
    
    // Network Data Refs
    const latestNetworkStateRef = useRef<any>(null);
    const latestNetworkInputRef = useRef<{x: number, y: number} | null>(null);
    const lastNetworkUpdateRef = useRef(0);

    // Sync Self Info
    useEffect(() => {
        mp.updateSelfInfo(username, currentAvatarId, currentMalletId);
    }, [username, currentAvatarId, currentMalletId, mp]);

    // Check localStorage for tutorial seen
    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_airhockey_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_airhockey_tutorial_seen', 'true');
        }
    }, []);

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

    const togglePause = () => {
        if (gameState !== 'playing' || showTutorial) return;
        if (gameMode === 'ONLINE') return; // No pause online
        setIsPaused(prev => !prev);
    };

    const resetRound = useCallback((isBottomGoal: boolean, forceGameMode?: GameMode) => {
        const newPuckY = isBottomGoal ? TABLE_HEIGHT / 2 + 50 : TABLE_HEIGHT / 2 - 50;
        
        puckRef.current = {
            x: TABLE_WIDTH / 2,
            y: newPuckY,
            vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
        };
        playerMalletRef.current.x = TABLE_WIDTH / 2;
        playerMalletRef.current.y = TABLE_HEIGHT - 100;
        opponentMalletRef.current.x = TABLE_WIDTH / 2;
        opponentMalletRef.current.y = 100;
        
        p1TargetRef.current = { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 100 };
        p2TargetRef.current = { x: TABLE_WIDTH / 2, y: 100 };
        
        isScoringRef.current = false;
        
        const mode = forceGameMode || gameMode;
        if (mode === 'ONLINE' && isHost) {
            sendData({ type: 'AIRHOCKEY_RESET', puckY: newPuckY });
        }

        setGameState('playing');
        setIsPaused(false);
    }, [gameMode, isHost, sendData]);

    const startGame = useCallback((diff: Difficulty, mode: GameMode = 'SINGLE') => {
        if (showTutorial) return;
        setDifficulty(diff);
        setGameMode(mode);
        setScore({ p1: 0, p2: 0 });
        setWinner(null);
        setEarnedCoins(0);
        isScoringRef.current = false;
        setIsPaused(false);
        resetRound(true, mode);
        setGameState('playing');
        resumeAudio();
        if (onReportProgress) onReportProgress('play', 1);
    }, [resetRound, resumeAudio, onReportProgress, showTutorial]);

    // Handle Online Mode Transition
    useEffect(() => {
        if (mpMode === 'lobby') {
            if (isHost) {
                if (onlineStep !== 'game') {
                    setOnlineStep('game');
                    resetRound(true, 'ONLINE');
                }
            } else {
                if (onlineStep !== 'lobby') {
                    setOnlineStep('lobby');
                }
                if (gameState === 'playing' || gameState === 'gameOver') setGameState('menu'); 
            }
        } else if (mpMode === 'in_game') {
            if (onlineStep !== 'game') setOnlineStep('game');
            setOpponentLeft(false);
            
            if (gameState === 'menu' || gameState === 'difficulty_select') {
                startGame('MEDIUM', 'ONLINE'); 
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
            setIsPaused(false);
            
            const amIWinner = (gameMode === 'SINGLE' && p1Wins) || 
                              (gameMode === 'ONLINE' && ((isHost && p1Wins) || (!isHost && !p1Wins))) ||
                              (gameMode === 'LOCAL_VS' && p1Wins);

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
        }
    }

    useEffect(() => {
        const unsubscribe = subscribe((data: any) => {
            if (data.type === 'AIRHOCKEY_STATE') {
                latestNetworkStateRef.current = data;
            }
            else if (data.type === 'AIRHOCKEY_INPUT') {
                latestNetworkInputRef.current = data;
            }
            else if (data.type === 'AIRHOCKEY_SCORE') {
                setScore(data.score);
                if (data.score.p1 >= MAX_SCORE || data.score.p2 >= MAX_SCORE) {
                    handleGameOverCheck(data.score);
                } else {
                    playGoalScore();
                }
            }
            else if (data.type === 'AIRHOCKEY_RESET') {
                const hostPuckY = data.puckY;
                const clientPuckY = TABLE_HEIGHT - hostPuckY;
                puckRef.current = {
                    x: TABLE_WIDTH / 2,
                    y: clientPuckY,
                    vx: 0, vy: 0, radius: PUCK_RADIUS, color: '#ff00ff'
                };
                latestNetworkStateRef.current = null;
                isScoringRef.current = false;
                setGameState('playing');
                setIsPaused(false);
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
        if (showTutorial) return;
        setGameMode(mode);
        if (mode === 'SINGLE') {
            setGameState('difficulty_select');
        } else if (mode === 'LOCAL_VS') {
            startGame('MEDIUM', 'LOCAL_VS');
        } 
    };

    const handleGoal = (isBottomGoal: boolean) => {
        if (isScoringRef.current) return;
        if (gameMode === 'ONLINE' && !isHost) return;

        isScoringRef.current = true;
        setGameState('scored');
        
        setScore(prevScore => {
            const newScore = { ...prevScore };
            if (isBottomGoal) {
                newScore.p2 += 1;
            } else {
                newScore.p1 += 1;
            }
            
            if (gameMode === 'ONLINE' && isHost) {
                sendData({ type: 'AIRHOCKEY_SCORE', score: newScore });
            }

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
        if (malletStyle) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);

            if (malletStyle.type === 'basic') {
                ctx.fillStyle = malletStyle.colors[0];
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else if (malletStyle.type === 'gradient' || malletStyle.type === 'complex') {
                const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
                if (malletStyle.colors.length > 1) {
                    malletStyle.colors.forEach((c, i) => {
                        grad.addColorStop(i / (malletStyle.colors.length - 1), c);
                    });
                } else {
                    grad.addColorStop(0, malletStyle.colors[0]);
                    grad.addColorStop(1, malletStyle.colors[0]);
                }
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else if (malletStyle.type === 'target') {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, malletStyle.colors[0]);
                grad.addColorStop(0.3, malletStyle.colors[0]);
                grad.addColorStop(0.3, malletStyle.colors[1] || '#000');
                grad.addColorStop(0.6, malletStyle.colors[1] || '#000');
                grad.addColorStop(0.6, malletStyle.colors[0]);
                grad.addColorStop(1, malletStyle.colors[0]);
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 10;
            } else if (malletStyle.type === 'flower') {
                const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                grad.addColorStop(0, malletStyle.colors[1] || '#fff');
                grad.addColorStop(0.2, malletStyle.colors[1] || '#fff');
                grad.addColorStop(0.2, malletStyle.colors[0]);
                grad.addColorStop(1, malletStyle.colors[0]);
                ctx.fillStyle = grad;
                ctx.shadowColor = malletStyle.colors[0];
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = malletStyle.colors[0];
            }

            ctx.fill();
            
            // Inner border/highlight
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Inner circle detail (handle)
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fill();
            ctx.stroke();

            ctx.restore();
            return;
        }

        const defaultColor = isOpponent ? ((gameMode === 'LOCAL_VS' || gameMode === 'ONLINE') ? '#ff0055' : '#ffe600') : '#00f3ff';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = defaultColor;
        ctx.shadowColor = defaultColor;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Default handle
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.stroke();
    };

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing' || showTutorial) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        if (isPaused) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const puck = puckRef.current;
        const player = playerMalletRef.current;
        const opponent = opponentMalletRef.current;

        if (gameMode === 'ONLINE') {
            const now = Date.now();
            const shouldSend = now - lastNetworkUpdateRef.current > 40;

            if (isHost) {
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                if (latestNetworkInputRef.current) {
                    const clientInput = latestNetworkInputRef.current;
                    const targetX = TABLE_WIDTH - clientInput.x;
                    const targetY = TABLE_HEIGHT - clientInput.y;
                    p2TargetRef.current = { x: targetX, y: targetY };
                }
                
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;

                runPhysics(puck, player, opponent);

                if (shouldSend) {
                    sendData({
                        type: 'AIRHOCKEY_STATE',
                        puck: { x: puck.x, y: puck.y, vx: puck.vx, vy: puck.vy },
                        p1: { x: player.x, y: player.y },
                        p2: { x: opponent.x, y: opponent.y }
                    });
                    lastNetworkUpdateRef.current = now;
                }

            } else {
                player.vx = player.x - lastP1PosRef.current.x;
                player.vy = player.y - lastP1PosRef.current.y;
                lastP1PosRef.current = { x: player.x, y: player.y };
                
                player.x += (p1TargetRef.current.x - player.x) * 0.4;
                player.y += (p1TargetRef.current.y - player.y) * 0.4;

                if (shouldSend) {
                    sendData({
                        type: 'AIRHOCKEY_INPUT',
                        x: p1TargetRef.current.x,
                        y: p1TargetRef.current.y
                    });
                    lastNetworkUpdateRef.current = now;
                }

                if (latestNetworkStateRef.current) {
                    const state = latestNetworkStateRef.current;
                    const targetPuckX = TABLE_WIDTH - state.puck.x;
                    const targetPuckY = TABLE_HEIGHT - state.puck.y;
                    const targetOppX = TABLE_WIDTH - state.p1.x; 
                    const targetOppY = TABLE_HEIGHT - state.p1.y;

                    puck.x = lerp(puck.x, targetPuckX, 0.4);
                    puck.y = lerp(puck.y, targetPuckY, 0.4);
                    
                    opponent.x = lerp(opponent.x, targetOppX, 0.3);
                    opponent.y = lerp(opponent.y, targetOppY, 0.3);
                }
            }
        } 
        else {
            player.vx = player.x - lastP1PosRef.current.x;
            player.vy = player.y - lastP1PosRef.current.y;
            lastP1PosRef.current = { x: player.x, y: player.y };
            player.x += (p1TargetRef.current.x - player.x) * 0.4;
            player.y += (p1TargetRef.current.y - player.y) * 0.4;

            if (gameMode === 'SINGLE') {
                updateAI();
            } else {
                opponent.vx = opponent.x - lastP2PosRef.current.x;
                opponent.vy = opponent.y - lastP2PosRef.current.y;
                lastP2PosRef.current = { x: opponent.x, y: opponent.y };
                opponent.x += (p2TargetRef.current.x - opponent.x) * 0.4;
                opponent.y += (p2TargetRef.current.y - opponent.y) * 0.4;
            }

            runPhysics(puck, player, opponent);
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
                ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
                
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)'; ctx.lineWidth = 2; 
                ctx.beginPath(); ctx.moveTo(0, TABLE_HEIGHT/2); ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT/2); ctx.stroke();
                
                ctx.beginPath(); ctx.arc(TABLE_WIDTH/2, TABLE_HEIGHT/2, 50, 0, 2*Math.PI); ctx.stroke();
                ctx.beginPath(); ctx.arc(TABLE_WIDTH/2, TABLE_HEIGHT/2, 4, 0, 2*Math.PI); ctx.fillStyle = '#00f3ff'; ctx.fill();

                const goalX = (TABLE_WIDTH - GOAL_WIDTH) / 2;
                ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
                ctx.fillRect(goalX, -20, GOAL_WIDTH, 40); 
                ctx.fillRect(goalX, TABLE_HEIGHT - 20, GOAL_WIDTH, 40); 
                
                ctx.strokeStyle = '#ff00ff';
                ctx.beginPath(); ctx.moveTo(goalX, 0); ctx.lineTo(goalX + GOAL_WIDTH, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(goalX, TABLE_HEIGHT); ctx.lineTo(goalX + GOAL_WIDTH, TABLE_HEIGHT); ctx.stroke();

                ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.radius, 0, 2*Math.PI); ctx.fillStyle = puck.color; ctx.fill();

                const playerMalletStyle = malletsCatalog.find(m => m.id === currentMalletId);
                drawMallet(ctx, player.x, player.y, player.radius, playerMalletStyle, false);

                const opponentMalletId = mp.gameOpponent?.malletId;
                const opponentMalletStyle = malletsCatalog.find(m => m.id === opponentMalletId);
                drawMallet(ctx, opponent.x, opponent.y, opponent.radius, opponentMalletStyle, true);
            }
        }

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, difficulty, currentMalletId, malletsCatalog, gameMode, isHost, sendData, isPaused, showTutorial]);

    const runPhysics = (puck: Entity, player: Entity, opponent: Entity) => {
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= PUCK_FRICTION;
        puck.vy *= PUCK_FRICTION;

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

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [gameLoop]);

    const updateTargets = (clientX: number, clientY: number) => {
        if (!canvasRef.current || isPaused || showTutorial) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = TABLE_WIDTH / rect.width;
        const scaleY = TABLE_HEIGHT / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        if (gameMode !== 'LOCAL_VS' || y > TABLE_HEIGHT / 2) {
             p1TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(TABLE_HEIGHT / 2 + MALLET_RADIUS, Math.min(TABLE_HEIGHT - MALLET_RADIUS, y)),
            };
        }
        if (gameMode === 'LOCAL_VS' && y <= TABLE_HEIGHT / 2) {
            p2TargetRef.current = {
                x: Math.max(MALLET_RADIUS, Math.min(TABLE_WIDTH - MALLET_RADIUS, x)),
                y: Math.max(MALLET_RADIUS, Math.min(TABLE_HEIGHT / 2 - MALLET_RADIUS, y)),
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => updateTargets(e.clientX, e.clientY);
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isPaused || showTutorial) return;
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) updateTargets(e.touches[i].clientX, e.touches[i].clientY);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPaused || showTutorial) return;
        resumeAudio();
        handleTouchMove(e);
    };

    const handleLocalBack = () => {
        if (gameMode === 'ONLINE') {
            if (onlineStep === 'game') {
                mp.leaveGame();
                setOnlineStep('lobby');
            } else {
                mp.disconnect();
                setGameState('menu');
                setGameMode('SINGLE');
            }
            return;
        }
        
        if (gameState !== 'menu') {
            setGameState('menu');
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
                     <h3 className="text-xl font-black text-center text-cyan-300 tracking-wider drop-shadow-md">LOBBY AIR HOCKEY</h3>
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

    if (gameMode === 'ONLINE' && onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 pr-2 pb-1">AIR HOCKEY</h1>
                    <div className="w-10"></div>
                </div>
                {onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    // --- MENU VIEW (NEW STYLE) ---
    if (gameState === 'menu' && !showTutorial) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                {/* Background layers */}
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                {/* Floating Particles/Orbs for ambience - fixed position */}
                <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="fixed bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] animate-pulse delay-1000 pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    
                    {/* Title Section */}
                    <div className="mb-6 md:mb-12 text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0">
                         <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter">
                            NEON<br className="md:hidden"/> HOCKEY
                        </h1>
                    </div>

                    {/* Game Modes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        
                        {/* SOLO / LOCAL CARD */}
                        <button onClick={() => { setGameMode('SINGLE'); setGameState('difficulty_select'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                    <User size={32} className="text-cyan-400 fill-cyan-400" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors">SOLO / VS</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Affrontez l'IA ou défiez un ami sur le même écran. Réflexes et précision.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                CONFIGURER LA PARTIE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>

                        {/* ONLINE CARD */}
                        <button onClick={() => setGameMode('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    <Globe size={32} className="text-blue-400" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-blue-300 transition-colors">EN LIGNE</h2>
                                    <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                    Rejoignez le lobby et trouvez un adversaire à travers le monde.
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center gap-2 text-blue-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                                REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg">
                            <Home size={14} /> RETOUR AU MENU PRINCIPAL
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-transparent font-sans touch-none overflow-hidden p-4">
            {/* TUTORIAL OVERLAY */}
            {showTutorial && <TutorialOverlay gameId="airhockey" onClose={() => setShowTutorial(false)} />}

            <div className="w-full max-w-md flex items-center justify-between z-20 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex items-center gap-4 font-black text-2xl">
                    <span className="text-neon-blue">{(gameMode === 'ONLINE' && !isHost) ? score.p2 : score.p1}</span>
                    <span className="text-white text-lg">VS</span>
                    <span className="text-pink-500">{(gameMode === 'ONLINE' && !isHost) ? score.p1 : score.p2}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    {gameMode !== 'ONLINE' && gameState === 'playing' && (
                        <button onClick={togglePause} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    )}
                    <button onClick={() => { if(gameMode==='ONLINE') mp.requestRematch(); else setGameState('menu'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            <div 
                className={`relative w-full max-w-md aspect-[2/3] bg-black/80 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden cursor-none ${gameMode === 'LOCAL_VS' ? 'border-pink-500/30' : ''}`}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                <canvas ref={canvasRef} width={TABLE_WIDTH} height={TABLE_HEIGHT} className="w-full h-full" />
                
                {/* Difficulty Select Overlay */}
                {gameState === 'difficulty_select' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
                        <h2 className="text-3xl font-black text-white mb-8 italic">MODE DE JEU</h2>
                        
                        <div className="flex flex-col gap-4 w-56">
                            <button onClick={() => startGame('MEDIUM', 'LOCAL_VS')} className="px-6 py-4 bg-gray-800 border-2 border-pink-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2 mb-4 shadow-lg active:scale-95">
                                <Users size={20} className="text-pink-500"/> 2 JOUEURS (VS)
                            </button>
                            
                            <div className="h-px bg-white/10 w-full mb-2"></div>
                            <p className="text-center text-xs text-gray-400 font-bold mb-2">DIFFICULTÉ IA (SOLO)</p>
                            
                            <button onClick={() => startGame('EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded-xl hover:bg-green-500 hover:text-black transition-all">FACILE</button>
                            <button onClick={() => startGame('MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded-xl hover:bg-yellow-500 hover:text-black transition-all">MOYEN</button>
                            <button onClick={() => startGame('HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all">DIFFICILE</button>
                        </div>
                        <button onClick={() => setGameState('menu')} className="mt-8 text-gray-500 text-sm hover:text-white underline">RETOUR</button>
                    </div>
                )}

                {isPaused && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <h2 className="text-4xl font-black text-white mb-6 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">PAUSE</h2>
                        <div className="flex flex-col gap-3 w-48">
                            <button onClick={togglePause} className="w-full py-3 bg-green-500 text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)]"><Play size={20} /> REPRENDRE</button>
                            <button onClick={handleLocalBack} className="w-full py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 border border-white/10"><Home size={20} /> QUITTER</button>
                        </div>
                    </div>
                )}

                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in fade-in">
                        <h2 className="text-5xl font-black italic mb-2 drop-shadow-[0_0_10px_currentColor]" style={{ color: winner === 'Player' || winner === 'P1' || winner === 'J1' ? '#00f3ff' : '#ff0055' }}>
                            {winner === 'Player' ? 'VICTOIRE !' : winner === 'CPU' ? 'DÉFAITE...' : `${winner} GAGNE !`}
                        </h2>
                        <div className="text-center mb-6">
                            <p className="text-gray-400 text-xs tracking-widest">SCORE FINAL</p>
                            <div className="flex gap-4 justify-center items-center mt-2">
                                <span className="text-4xl font-mono text-neon-blue">{score.p1}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-4xl font-mono text-pink-500">{score.p2}</span>
                            </div>
                        </div>
                        {earnedCoins > 0 && (
                            <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse">
                                <Coins className="text-yellow-400" size={20} />
                                <span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => { if(gameMode === 'ONLINE') mp.requestRematch(); else startGame(difficulty, gameMode); }} className="px-8 py-3 bg-white text-black font-black tracking-widest rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                                <RefreshCw size={20} /> {gameMode==='ONLINE' ? 'REVANCHE' : 'REJOUER'}
                            </button>
                            {gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); setOnlineStep('lobby'); }} className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-full hover:bg-gray-700">QUITTER</button>}
                        </div>
                        <button onClick={handleLocalBack} className="mt-4 text-gray-400 hover:text-white text-xs tracking-widest border-b border-transparent hover:border-white transition-all">RETOUR AU MENU</button>
                    </div>
                )}
                
                {gameMode === 'ONLINE' && isHost && onlineStep === 'game' && !mp.gameOpponent && (
                    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                        <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                        <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                        <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold">ANNULER</button>
                    </div>
                )}
            </div>
        </div>
    );
};
