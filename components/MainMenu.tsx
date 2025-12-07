import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Layers, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download, Users, Wind, Activity, Globe, Calendar, CheckCircle, Rocket, LogOut, Copy, Vibrate, VibrateOff, User, Shield, ShieldAlert } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { DailyQuest } from '../hooks/useDailySystem'; // Import interface
import { DailyBonusModal } from './DailyBonusModal';
import { OnlineUser } from '../hooks/useSupabase'; // Import for leaderboards

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    onLogout: () => void;
    isAuthenticated?: boolean;
    onLoginRequest?: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    dailyData: {
        streak: number;
        showDailyModal: boolean;
        todaysReward: number;
        claimDailyBonus: () => void;
        quests: DailyQuest[];
        claimQuestReward: (id: string) => void;
    };
    onlineUsers: OnlineUser[]; // Added for global leaderboard
}

// Custom Snake Icon
const SnakeIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
       <path d="M4 20h4a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9" />
       <circle cx="8" cy="4" r="2" />
    </svg>
);

// Custom Connect 4 Icon
const Connect4Icon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
       {/* Feet */}
       <path d="M4 19v2" />
       <path d="M20 19v2" />
       
       {/* Board */}
       <rect x="2" y="3" width="20" height="16" rx="2" />
       
       {/* Slots 3x3 */}
       <circle cx="7" cy="7" r="1.5" />
       <circle cx="12" cy="7" r="1.5" />
       <circle cx="17" cy="7" r="1.5" />
       
       <circle cx="7" cy="11" r="1.5" />
       <circle cx="12" cy="11" r="1.5" fill="currentColor" />
       <circle cx="17" cy="11" r="1.5" />
       
       <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
       <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
       <circle cx="17" cy="15" r="1.5" />
    </svg>
);

const GAMES_CONFIG = [
    { 
        id: 'tetris', 
        name: 'TETRIS', 
        icon: Grid3X3, 
        color: 'text-cyan-400', 
        bg: 'bg-cyan-900/20',
        border: 'border-cyan-500/30',
        hoverBorder: 'hover:border-cyan-400', 
        shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', 
        glow: 'rgba(34,211,238,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'snake', 
        name: 'SNAKE', 
        icon: SnakeIcon, 
        color: 'text-green-500', 
        bg: 'bg-green-900/20',
        border: 'border-green-500/30',
        hoverBorder: 'hover:border-green-500', 
        shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]', 
        glow: 'rgba(34,197,94,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'invaders', 
        name: 'INVADERS', 
        icon: Rocket, 
        color: 'text-rose-500', 
        bg: 'bg-rose-900/20',
        border: 'border-rose-500/30',
        hoverBorder: 'hover:border-rose-500', 
        shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', 
        glow: 'rgba(244,63,94,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'breaker', 
        name: 'BREAKER', 
        icon: Layers, 
        color: 'text-fuchsia-500', 
        bg: 'bg-fuchsia-900/20',
        border: 'border-fuchsia-500/30',
        hoverBorder: 'hover:border-fuchsia-500', 
        shadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]', 
        glow: 'rgba(217,70,239,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'pacman', 
        name: 'PACMAN', 
        icon: Ghost, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-500/30',
        hoverBorder: 'hover:border-yellow-400', 
        shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', 
        glow: 'rgba(250,204,21,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'airhockey', 
        name: 'AIR HOCKEY', 
        icon: Wind, 
        color: 'text-sky-400', 
        bg: 'bg-sky-900/20',
        border: 'border-sky-500/30',
        hoverBorder: 'hover:border-sky-400', 
        shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', 
        glow: 'rgba(56,189,248,0.8)', 
        badges: { solo: true, online: true, vs: true, new: true }, 
        reward: 'GAINS' 
    },
    { 
        id: 'sudoku', 
        name: 'SUDOKU', 
        icon: Brain, 
        color: 'text-sky-400', 
        bg: 'bg-sky-900/20',
        border: 'border-sky-500/30',
        hoverBorder: 'hover:border-sky-400', 
        shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', 
        glow: 'rgba(56,189,248,0.8)', 
        badges: { solo: true, online: false, vs: false, new: false }, 
        reward: '50' 
    },
    { 
        id: 'connect4', 
        name: 'CONNECT 4', 
        icon: Connect4Icon, 
        color: 'text-pink-500', 
        bg: 'bg-pink-900/20',
        border: 'border-pink-500/30',
        hoverBorder: 'hover:border-pink-500', 
        shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', 
        glow: 'rgba(236,72,153,0.8)', 
        badges: { solo: true, online: true, vs: true, new: false }, 
        reward: '30' 
    },
    { 
        id: 'memory', 
        name: 'MEMORY', 
        icon: Sparkles, 
        color: 'text-violet-400', 
        bg: 'bg-violet-900/20',
        border: 'border-violet-500/30',
        hoverBorder: 'hover:border-violet-400', 
        shadow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]', 
        glow: 'rgba(167,139,250,0.8)', 
        badges: { solo: true, online: true, vs: false, new: false }, 
        reward: 'GAINS' 
    },
    { 
        id: 'battleship', 
        name: 'BATAILLE', 
        icon: Ship, 
        color: 'text-blue-500', 
        bg: 'bg-blue-900/20',
        border: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-500', 
        shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', 
        glow: 'rgba(59,130,246,0.8)', 
        badges: { solo: true, online: true, vs: false, new: false }, 
        reward: 'GAINS' 
    },
];

const COMING_SOON = [
    { name: 'MASTERMIND', icon: BrainCircuit },
    { name: 'UNO', icon: Copy }
];

const FlyingCoin = React.memo(({ startX, startY, targetX, targetY, delay, onComplete }: { startX: number, startY: number, targetX: number, targetY: number, delay: number, onComplete: () => void }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        top: startY,
        left: startX,
        opacity: 1,
        transform: 'scale(0.5)',
        zIndex: 100,
        pointerEvents: 'none',
        transition: 'none'
    });

    useEffect(() => {
        const animTimeout = setTimeout(() => {
             setStyle({
                position: 'fixed',
                top: targetY,
                left: targetX,
                opacity: 0,
                transform: 'scale(0.8) rotate(360deg)',
                zIndex: 100,
                pointerEvents: 'none',
                transition: `top 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-in 0.5s, transform 0.8s linear`
            });
        }, delay * 1000 + 50);

        const endTimeout = setTimeout(onComplete, 800 + delay * 1000 + 50);

        return () => {
            clearTimeout(animTimeout);
            clearTimeout(endTimeout);
        };
    }, [targetX, targetY, delay, onComplete]);

    return (
        <div style={style} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
            <Coins size={24} fill="#facc15" />
        </div>
    );
});

const ArcadeLogo = () => {
    return (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-top-8 duration-700 mb-2 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-b from-neon-pink/40 to-neon-blue/40 blur-[60px] rounded-full pointer-events-none -z-10 mix-blend-hard-light opacity-80" />
            <div className="relative mb-[-25px] z-10 hover:scale-105 transition-transform duration-300 group">
                <div className="w-48 h-16 bg-gray-900 rounded-2xl border-2 border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15),inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                    <div className="relative flex items-center justify-center w-12 h-12 group-hover:-rotate-12 transition-transform duration-300">
                         <div className="absolute bottom-1/2 w-3 h-8 bg-gray-600 rounded-full origin-bottom transform -rotate-12 border border-black"></div>
                         <div className="absolute bottom-[40%] w-10 h-10 bg-gradient-to-br from-neon-pink via-purple-600 to-purple-900 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] border border-white/20 transform -translate-x-1 -translate-y-2 z-10">
                            <div className="absolute top-2 left-2 w-3 h-2 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
                         </div>
                         <div className="w-10 h-10 bg-black/50 rounded-full border border-gray-700 shadow-inner"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 transform rotate-6">
                         <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] border border-white/30 animate-pulse"></div>
                         <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] border border-white/30"></div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center relative z-20 mt-2">
                 <div className="font-script text-7xl text-white transform -rotate-6 z-10 animate-pulse" style={{ textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff' }}>Neon</div>
                <div className="font-script text-6xl text-neon-pink transform -rotate-3 -mt-4 ml-8 animate-pulse" style={{ textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff', animationDelay: '150ms' }}>Arcade</div>
            </div>
        </div>
    );
};

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency, mp, dailyData, onLogout, isAuthenticated = false, onLoginRequest, onlineUsers }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog, currentFrameId, framesCatalog, addCoins, currentTitleId, titlesCatalog, currentMalletId } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    const [scoreTab, setScoreTab] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
    
    // --- DAILY SYSTEM DATA (Passed from App) ---
    const { streak, showDailyModal, todaysReward, claimDailyBonus, quests, claimQuestReward } = dailyData;

    const [activeGlow, setActiveGlow] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Username editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Collapsible Quests State - Fermé par défaut
    const [isQuestsExpanded, setIsQuestsExpanded] = useState(false);
    
    // Animation state for claiming reward
    const [animatingQuestId, setAnimatingQuestId] = useState<string | null>(null);
    
    // Flying Coins State
    const [flyingCoins, setFlyingCoins] = useState<{id: number, startX: number, startY: number, targetX: number, targetY: number, delay: number}[]>([]);
    const coinBalanceRef = useRef<HTMLDivElement>(null);

    // Helpers pour gérer l'interaction tactile et souris
    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });
    
    // Helper to start game
    const handleGameStart = (gameId: string) => {
        onSelectGame(gameId);
    };

    const spawnCoins = (startX: number, startY: number, amount: number) => {
        const targetRect = coinBalanceRef.current?.getBoundingClientRect();
        if (!targetRect) return;

        const targetX = targetRect.left + (targetRect.width / 2) - 12; 
        const targetY = targetRect.top + (targetRect.height / 2) - 12;

        const count = Math.min(Math.floor(amount / 10) + 5, 20); // Min 5, Max 20 coins
        const newCoins = [];
        
        for (let i = 0; i < count; i++) {
            newCoins.push({
                id: Date.now() + Math.random(),
                startX: startX + (Math.random() - 0.5) * 40, 
                startY: startY + (Math.random() - 0.5) * 40,
                targetX,
                targetY,
                delay: i * 0.05 // Staggered start
            });
        }
        setFlyingCoins(prev => [...prev, ...newCoins]);
    };

    const handleDailyBonusClaim = () => {
        spawnCoins(window.innerWidth / 2, window.innerHeight / 2, todaysReward);
        claimDailyBonus();
    };

    const handleClaim = (q: DailyQuest, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Spawn Coins Visuals
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        spawnCoins(rect.left + rect.width / 2, rect.top + rect.height / 2, q.reward);

        // Audio & Visual Trigger
        audio.playCoin();
        setAnimatingQuestId(q.id);
        
        // Claim logic
        claimQuestReward(q.id);
        
        // Reset animation state
        setTimeout(() => setAnimatingQuestId(null), 1500);
    };

    useEffect(() => {
        audio.resumeAudio(); 
    }, [audio]);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    // Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Sync Presence in Global Lobby
    useEffect(() => {
        if (isAuthenticated) {
            mp.updateSelfInfo(username, currentAvatarId, currentMalletId);
        }
    }, [username, currentAvatarId, currentMalletId, mp, isAuthenticated]);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: any) => {
            setInstallPrompt(null);
        });
    };

    const handleReload = () => {
        window.location.reload();
    };

    const handleNameSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (tempName.trim()) {
            updateUsername(tempName.trim());
        } else {
            setTempName(username); // Revert if empty
        }
        setIsEditingName(false);
    };
    
    // Récupération des badges possédés
    const ownedBadges = catalog.filter(b => inventory.includes(b.id));

    // Current Avatar & Frame & Title
    const currentAvatar = avatarsCatalog.find(a => a.id === currentAvatarId) || avatarsCatalog[0];
    const currentFrame = framesCatalog.find(f => f.id === currentFrameId) || framesCatalog[0];
    const currentTitle = titlesCatalog.find(t => t.id === currentTitleId);
    const AvatarIcon = currentAvatar.icon;

    // Calcul des stats pour affichage (Local)
    const sudokuEasyBest = highScores.sudoku?.easy;
    const sudokuMediumBest = highScores.sudoku?.medium;
    const sudokuHardBest = highScores.sudoku?.hard;
    const breakerHighScore = highScores.breaker || 0;
    const pacmanHighScore = highScores.pacman || 0;
    const snakeHighScore = highScores.snake || 0;
    const invadersHighScore = highScores.invaders || 0;
    const memoryBestMoves = highScores.memory || 0;

    // --- LEADERBOARD HELPER ---
    const getTopScoreForGame = (game: string) => {
        if (onlineUsers.length === 0) return { name: '-', score: 0 };
        
        const sorted = [...onlineUsers].sort((a, b) => {
            const scoreA = a.stats?.[game] || 0;
            const scoreB = b.stats?.[game] || 0;
            if (game === 'memory' || game === 'sudoku') {
                // Lower is better, but 0 means no score so treat as Infinity
                const realA = scoreA === 0 ? Infinity : scoreA;
                const realB = scoreB === 0 ? Infinity : scoreB;
                return realA - realB;
            }
            return scoreB - scoreA; // Higher is better
        });

        const top = sorted[0];
        const topScore = top.stats?.[game] || 0;
        
        // If score is 0/invalid
        if (!topScore) return { name: '-', score: 0 };

        return { name: top.name, score: topScore };
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto">
            
            {/* Flying Coins Layer */}
            {flyingCoins.map(coin => (
                <FlyingCoin 
                    key={coin.id}
                    startX={coin.startX}
                    startY={coin.startY}
                    targetX={coin.targetX}
                    targetY={coin.targetY}
                    delay={coin.delay}
                    onComplete={() => setFlyingCoins(prev => prev.filter(c => c.id !== coin.id))}
                />
            ))}

            {showDailyModal && isAuthenticated && (
                <DailyBonusModal streak={streak} reward={todaysReward} onClaim={handleDailyBonusClaim} />
            )}

            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-10 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`} style={{ background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none', opacity: activeGlow ? 0.6 : 0 }} />

            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                
                {/* Coin Balance or Login Button */}
                {isAuthenticated ? (
                    <div ref={coinBalanceRef} className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                    </div>
                ) : (
                    <button onClick={onLoginRequest} className="flex items-center gap-2 bg-neon-blue/20 backdrop-blur-md px-4 py-2 rounded-full border border-neon-blue/50 hover:bg-neon-blue/40 transition-colors animate-pulse">
                        <User className="text-neon-blue" size={20} />
                        <span className="text-neon-blue font-bold text-sm">SE CONNECTER</span>
                    </button>
                )}

                <div className="flex gap-3">
                    {isAuthenticated && (
                        <button onClick={() => onSelectGame('shop')} className="p-2 bg-gray-900/80 rounded-full text-yellow-400 hover:text-white border border-yellow-500/30 backdrop-blur-sm active:scale-95 transition-transform shadow-[0_0_10px_rgba(234,179,8,0.2)]" title="Boutique">
                            <ShoppingBag size={20} />
                        </button>
                    )}

                    {installPrompt && (
                        <button onClick={handleInstallClick} className="p-2 bg-neon-pink/20 rounded-full text-neon-pink hover:bg-neon-pink hover:text-white border border-neon-pink/50 backdrop-blur-sm active:scale-95 transition-all animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.4)]" title="Installer l'application">
                            <Download size={20} />
                        </button>
                    )}

                    <button onClick={handleReload} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform" title="Actualiser l'application">
                        <RefreshCw size={20} />
                    </button>

                    {/* Vibration Toggle */}
                    <button onClick={audio.toggleVibration} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform">
                        {audio.isVibrationEnabled ? <Vibrate size={20} /> : <VibrateOff size={20} />}
                    </button>

                    <button onClick={audio.toggleMute} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform">
                        {audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-6 mt-12 pb-10">
                 
                 <ArcadeLogo />

                 {/* CARTE DE PROFIL DU JOUEUR */}
                 <div {...bindGlow('rgba(200, 230, 255, 0.8)')} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-4 backdrop-blur-md relative overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:ring-1 hover:ring-white/30">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                     
                     {/* Logout Button (Only if authenticated) */}
                     {isAuthenticated && (
                         <button 
                            onClick={onLogout}
                            className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-400 transition-colors z-30"
                            title="Se déconnecter"
                         >
                            <LogOut size={16} />
                         </button>
                     )}

                     <div className="flex items-center w-full gap-4 z-10">
                        {/* Avatar with Frame */}
                        <div onClick={() => isAuthenticated ? onSelectGame('shop') : onLoginRequest && onLoginRequest()} className="relative cursor-pointer hover:scale-105 transition-transform">
                            {isAuthenticated ? (
                                <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 flex items-center justify-center relative z-10 border-2 ${currentFrame.cssClass}`}>
                                    <div className="w-full h-full bg-black/40 rounded-[8px] flex items-center justify-center backdrop-blur-sm">
                                        <AvatarIcon size={40} className={currentAvatar.color} />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-gray-800 border-2 border-white/20 flex items-center justify-center relative z-10">
                                    <Lock size={32} className="text-gray-500" />
                                </div>
                            )}
                            
                            {isAuthenticated && <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[10px] text-white px-2 py-0.5 rounded-full border border-white/20 z-20">EDIT</div>}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 flex flex-col justify-center">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isEditingName ? (
                                            <form onSubmit={handleNameSubmit} className="flex items-center gap-2 w-full">
                                                <input ref={inputRef} type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={() => handleNameSubmit()} maxLength={12} className="bg-black/50 border border-neon-blue rounded px-2 py-1 text-white font-bold text-lg w-full outline-none focus:ring-2 ring-neon-blue/50"/>
                                                <button type="submit" className="text-green-400"><Check size={20} /></button>
                                            </form>
                                        ) : (
                                            <button onClick={() => { setTempName(username); setIsEditingName(true); }} className="flex items-center gap-2 group/edit">
                                                <h2 className="text-2xl font-black text-white italic tracking-wide truncate max-w-[150px]">{username}</h2>
                                                <Edit2 size={14} className="text-gray-500 group-hover/edit:text-white transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* DISPLAY EQUIPPED TITLE IF EXISTS */}
                                    {currentTitle && currentTitle.id !== 't_none' && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${currentTitle.color} mb-1 bg-gray-900/50 px-2 py-0.5 rounded w-fit border border-white/10`}>
                                            {currentTitle.name}
                                        </span>
                                    )}

                                    <span className={`text-xs font-bold tracking-widest uppercase ${playerRank.color}`}>{playerRank.title}</span>
                                    
                                    {/* Streak Badge */}
                                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-500 font-bold bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-500/20 w-fit">
                                        <Calendar size={12} /> SÉRIE : {streak} JOURS
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 items-start">
                                    <h2 className="text-xl font-bold text-gray-400 italic">Mode Visiteur</h2>
                                    <button onClick={onLoginRequest} className="text-xs bg-neon-blue text-black px-3 py-1 rounded font-bold hover:bg-white transition-colors">
                                        CRÉER UN PROFIL
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>

                     {/* ADMIN TOGGLE BUTTON */}
                     {isAuthenticated && currency.isSuperUser && (
                         <button 
                            onClick={currency.toggleAdminMode}
                            className={`w-full py-2 mt-2 rounded-lg font-black text-xs tracking-widest flex items-center justify-center gap-2 transition-all border ${
                                currency.adminModeActive 
                                ? 'bg-red-900/50 text-red-400 border-red-500/50 hover:bg-red-900/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-green-900/50 text-green-400 border-green-500/50 hover:bg-green-900/80'
                            }`}
                         >
                             {currency.adminModeActive ? (
                                 <><ShieldAlert size={16}/> GOD MODE : ACTIVÉ</>
                             ) : (
                                 <><Shield size={16}/> GOD MODE : DÉSACTIVÉ</>
                             )}
                         </button>
                     )}

                     <div className="w-full h-px bg-white/10" />

                     {/* BADGES */}
                     {isAuthenticated ? (
                         ownedBadges.length > 0 ? (
                             <div className="flex gap-3 overflow-x-auto w-full justify-start py-2 no-scrollbar z-10 mask-linear">
                                 {ownedBadges.slice().reverse().map(badge => {
                                     const Icon = badge.icon;
                                     return (
                                         <div key={badge.id} className="relative shrink-0 animate-in fade-in zoom-in duration-300">
                                             <div className="w-10 h-10 bg-black/60 rounded-lg border border-white/10 flex items-center justify-center shadow-lg" title={badge.name}>
                                                 <Icon size={20} className={badge.color} />
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         ) : (
                             <div className="text-xs text-gray-600 italic py-2 w-full text-center">Joue pour gagner des badges !</div>
                         )
                     ) : (
                         <div className="text-xs text-gray-600 italic py-2 w-full text-center flex items-center justify-center gap-2">
                             <Lock size={12}/> Connecte-toi pour gagner des badges
                         </div>
                     )}
                 </div>

                 {/* --- DAILY QUESTS PANEL (NEW DESIGN) --- */}
                 <div {...bindGlow('rgba(34, 197, 94, 0.8)')} className={`w-full bg-black/80 border ${isAuthenticated ? 'border-green-500/30' : 'border-gray-700/50'} rounded-xl p-3 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.1)] relative overflow-hidden group hover:border-green-500/50 hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] hover:ring-1 hover:ring-green-500/30 transition-all duration-300 ${!isAuthenticated ? 'opacity-70 grayscale' : ''}`}>
                     {/* Decorative background glow */}
                     {isAuthenticated && (
                         <>
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                         </>
                     )}

                     <div 
                        onClick={() => isAuthenticated && setIsQuestsExpanded(!isQuestsExpanded)} 
                        className={`flex items-center justify-between border-white/10 relative z-10 cursor-pointer ${isQuestsExpanded ? 'border-b mb-2 pb-2' : ''}`}
                     >
                         <div className="flex items-center gap-2 overflow-hidden py-1">
                             <h3 className="text-base font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] whitespace-nowrap pr-2">
                                <CheckCircle size={16} className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> 
                                DÉFIS DU JOUR
                             </h3>
                             
                             {/* Show quick status when collapsed */}
                             {isAuthenticated && !isQuestsExpanded && (
                                 <div className="flex gap-1 ml-1 animate-in fade-in duration-300 shrink-0">
                                     {quests.map((q, i) => (
                                         <div key={q.id} title={q.description} className={`w-3 h-3 flex items-center justify-center rounded-full border transition-colors ${q.isCompleted ? 'bg-green-500 border-green-400 shadow-[0_0_5px_#22c55e]' : 'bg-gray-800/50 border-white/10'}`}>
                                             {q.isCompleted && <Check size={8} className="text-black" strokeWidth={4} />}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         {isAuthenticated ? (
                             <div className="flex items-center gap-2 shrink-0">
                                 <span className="text-[9px] text-green-400 font-mono font-bold tracking-widest bg-green-900/30 border border-green-500/30 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                    {new Date().toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                                 </span>
                                 <ChevronDown size={16} className={`text-green-400 transition-transform duration-300 ${isQuestsExpanded ? 'rotate-180' : ''}`} />
                             </div>
                         ) : (
                             <Lock size={16} className="text-gray-500" />
                         )}
                     </div>
                     
                     {isAuthenticated && isQuestsExpanded && (
                         <div className="space-y-3 relative z-10 animate-in slide-in-from-top-2 duration-300">
                             {quests.map(quest => (
                                 <div key={quest.id} className={`relative flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                                     quest.isCompleted 
                                     ? 'bg-green-950/40 border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' 
                                     : 'bg-gray-900/60 border-white/5 hover:border-white/20'
                                 }`}>
                                     {/* Coin Burst Animation Effect */}
                                     {animatingQuestId === quest.id && (
                                         <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none z-50">
                                             <div className="relative">
                                                 <Coins size={40} className="text-yellow-400 absolute -top-4 -left-4 animate-ping opacity-75" />
                                                 <div className="text-yellow-300 font-black text-xl absolute -top-8 -left-2 animate-bounce drop-shadow-[0_0_10px_gold]">+{quest.reward}</div>
                                                 <div className="absolute w-2 h-2 bg-yellow-400 rounded-full top-0 left-0 animate-[ping_0.5s_ease-out_infinite]" style={{animationDelay: '0.1s'}}></div>
                                                 <div className="absolute w-2 h-2 bg-yellow-200 rounded-full top-4 left-4 animate-[ping_0.6s_ease-out_infinite]" style={{animationDelay: '0.2s'}}></div>
                                                 <div className="absolute w-1 h-1 bg-white rounded-full -top-2 left-6 animate-[ping_0.4s_ease-out_infinite]" style={{animationDelay: '0.05s'}}></div>
                                             </div>
                                         </div>
                                     )}

                                     <div className="flex flex-col gap-1.5 flex-1">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-2.5 h-2.5 rounded-sm rotate-45 ${
                                                 quest.isCompleted 
                                                 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' 
                                                 : 'bg-gray-700 border border-white/20'
                                             }`} />
                                             <span className={`text-xs font-bold tracking-wide ${
                                                 quest.isCompleted 
                                                 ? 'text-green-100 line-through decoration-green-500/50 decoration-2' 
                                                 : 'text-gray-300'
                                             }`}>
                                                {quest.description}
                                             </span>
                                         </div>
                                         {/* Progress Bar for 'any' target (Coins) */}
                                         {quest.targetGame === 'any' && !quest.isCompleted && (
                                             <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1 max-w-[140px] ml-5 border border-white/5">
                                                 <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_8px_#ca8a04]" style={{ width: `${(quest.progress / quest.target) * 100}%` }}></div>
                                             </div>
                                         )}
                                     </div>
                                     
                                     {quest.isCompleted && !quest.isClaimed ? (
                                         <button onClick={(e) => handleClaim(quest, e)} className="px-3 py-1.5 bg-yellow-400 text-black text-[10px] font-black tracking-wider rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse flex items-center gap-1 shrink-0 relative overflow-hidden group/btn">
                                             <div className="absolute inset-0 bg-white/50 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                             <Coins size={12} fill="black" /> +{quest.reward}
                                         </button>
                                     ) : quest.isClaimed ? (
                                         <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded border border-green-500/20 shrink-0">
                                             <Check size={12} className="text-green-400" />
                                             <span className="text-[10px] font-black text-green-400 tracking-wider">FAIT</span>
                                         </div>
                                     ) : (
                                         <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono font-bold bg-yellow-900/10 px-2 py-1 rounded border border-yellow-500/20 shrink-0">
                                             <Coins size={10} /> {quest.reward}
                                         </div>
                                     )}
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

                 {/* High Scores Panel */}
                 <div {...bindGlow('rgba(250, 204, 21, 0.8)')} className="w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30">
                    <button onClick={() => setShowScores(s => !s)} className="w-full p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-yellow-400" />
                            <h3 className="text-lg font-bold text-white italic">SCORES & CLASSEMENTS</h3>
                        </div>
                        <ChevronDown size={20} className={`transition-transform ${showScores ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showScores && (
                        <div className="px-4 pb-4 animate-in fade-in duration-300">
                            {/* SCORE TABS */}
                            <div className="flex bg-black/30 p-1 rounded-lg mb-3">
                                <button onClick={() => setScoreTab('LOCAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'LOCAL' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}>MON RECORDS</button>
                                <button onClick={() => setScoreTab('GLOBAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'GLOBAL' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>MONDE (LIVE)</button>
                            </div>

                            {scoreTab === 'LOCAL' ? (
                                <div className="space-y-2">
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-neon-blue">TETRIS NÉON</h4><p className="text-2xl font-mono">{highScores.tetris?.toLocaleString() || 0}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-rose-500">NEON INVADERS</h4><p className="text-2xl font-mono">{invadersHighScore.toLocaleString() || 0}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-green-500">NEON SNAKE</h4><p className="text-2xl font-mono">{snakeHighScore.toLocaleString() || 0}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-neon-pink">NEON BREAKER</h4><p className="text-2xl font-mono">{breakerHighScore.toLocaleString() || 0}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-yellow-400">NEON PAC</h4><p className="text-2xl font-mono">{pacmanHighScore.toLocaleString() || 0}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-purple-400">NEON MEMORY</h4><p className="text-2xl font-mono">{memoryBestMoves > 0 ? memoryBestMoves + ' coups' : '-'}</p></div>
                                    <div className="py-2 border-t border-white/5"><h4 className="font-bold text-cyan-400">NEON SUDOKU</h4>
                                        {sudokuEasyBest !== undefined || sudokuMediumBest !== undefined || sudokuHardBest !== undefined ? (
                                            <div className="flex justify-around text-center text-xs mt-1">
                                                <div><p className="text-green-400">FACILE</p><p className="font-mono text-lg">{sudokuEasyBest ?? '-'}</p></div>
                                                <div><p className="text-yellow-400">MOYEN</p><p className="font-mono text-lg">{sudokuMediumBest ?? '-'}</p></div>
                                                <div><p className="text-red-500">DIFFICILE</p><p className="font-mono text-lg">{sudokuHardBest ?? '-'}</p></div>
                                            </div>
                                        ) : <p className="text-sm text-gray-500">Aucun record</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-500 text-center italic mb-2">Meilleurs scores des joueurs connectés</p>
                                    {[
                                        { id: 'tetris', name: 'TETRIS', color: 'text-neon-blue' },
                                        { id: 'invaders', name: 'INVADERS', color: 'text-rose-500' },
                                        { id: 'snake', name: 'SNAKE', color: 'text-green-500' },
                                        { id: 'breaker', name: 'BREAKER', color: 'text-neon-pink' },
                                        { id: 'pacman', name: 'PACMAN', color: 'text-yellow-400' },
                                    ].map(game => {
                                        const top = getTopScoreForGame(game.id);
                                        return (
                                            <div key={game.id} className="py-2 border-t border-white/5 flex justify-between items-center">
                                                <h4 className={`font-bold text-sm ${game.color}`}>{game.name}</h4>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold">{top.name}</p>
                                                    <p className="font-mono text-lg">{top.score > 0 ? top.score.toLocaleString() : '-'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Special Handling for Memory (Lower is Better) */}
                                    <div className="py-2 border-t border-white/5 flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-purple-400">MEMORY</h4>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold">{getTopScoreForGame('memory').name}</p>
                                            <p className="font-mono text-lg">{getTopScoreForGame('memory').score > 0 ? getTopScoreForGame('memory').score + ' cps' : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                 {/* --- GAME GRID --- */}
                 <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    {GAMES_CONFIG.map((game) => (
                        <button key={game.id} onClick={() => handleGameStart(game.id)} {...bindGlow(game.glow)} className={`group relative flex flex-col items-center justify-between p-3 h-32 bg-black/60 border ${game.border} rounded-xl overflow-hidden transition-all duration-300 ${game.hoverBorder} ${game.shadow} hover:scale-[1.02] active:scale-95 backdrop-blur-md`}>
                            <div className={`absolute inset-0 ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
                            <div className="w-full flex justify-end gap-1 relative z-10">
                                {game.badges.new && <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse" title="Nouveau Jeu">NEW</div>}
                                {game.badges.online && <div className="p-1 rounded bg-black/40 text-green-400 border border-green-500/30" title="En Ligne"><Globe size={10} /></div>}
                                {game.badges.vs && <div className="p-1 rounded bg-black/40 text-pink-400 border border-pink-500/30" title="Versus"><Users size={10} /></div>}
                            </div>
                            <div className={`p-2 rounded-lg bg-gray-900/50 ${game.color} group-hover:scale-110 transition-transform relative z-10 shadow-lg border border-white/5`}>
                                <game.icon size={32} />
                                {!isAuthenticated && <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/30"><Lock size={10} className="text-white"/></div>}
                            </div>
                            <div className="text-center relative z-10 w-full">
                                <h3 className={`font-black italic text-sm tracking-wider text-white group-hover:${game.color} transition-colors uppercase`}>{game.name}</h3>
                                {game.reward && <div className="flex items-center justify-center gap-1 mt-0.5 opacity-60 text-[8px] font-mono text-gray-300"><Coins size={8} className="text-yellow-500" /><span>{game.reward}</span></div>}
                            </div>
                        </button>
                    ))}
                    
                    {COMING_SOON.map((game, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-3 h-32 bg-black/30 border border-white/5 rounded-xl opacity-50 grayscale">
                            <game.icon size={24} className="text-gray-500 mb-2" />
                            <span className="font-bold text-xs text-gray-500">{game.name}</span>
                            <span className="text-[8px] text-gray-600 mt-1 flex items-center gap-1"><Lock size={8}/> BIENTÔT</span>
                        </div>
                    ))}
                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">v1.9.7 • GLOBAL SCORES</div>
             </div>
        </div>
    );
}