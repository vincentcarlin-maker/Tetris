
import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download, Users, Wind, Activity, Globe, Calendar, CheckCircle, Rocket, LogOut, Copy, Vibrate, VibrateOff, User, Shield, ShieldAlert, Cloud, Palette, Star, Settings, Eye, EyeOff, Hourglass, Hash, Crown, LayoutGrid, Zap, Gamepad2, Puzzle, BarChart2, Layers, Crosshair, Clock, Target, Gift } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { DailyQuest } from '../hooks/useDailySystem'; 
import { DailyBonusModal } from './DailyBonusModal';
import { OnlineUser } from '../hooks/useSupabase';
import { AdminEvent } from './AdminDashboard';

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
        claimAllBonus: () => void;
        allCompletedBonusClaimed: boolean;
    };
    onlineUsers: OnlineUser[]; 
    disabledGamesList?: string[]; 
    activeEvent?: AdminEvent;
    eventProgress?: Record<string, number>;
}

// ... (Icon Components unchanged - TetrisIcon, SnakeIcon, etc.) ...
// Custom Tetris Icon (T-Piece)
const TetrisIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="6" width="6" height="6" rx="1.5" /><rect x="9" y="6" width="6" height="6" rx="1.5" /><rect x="16" y="6" width="6" height="6" rx="1.5" /><rect x="9" y="13" width="6" height="6" rx="1.5" />
    </svg>
);
// Custom Snake Icon
const SnakeIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M4 20h4a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9" /><circle cx="8" cy="4" r="2" />
    </svg>
);
// Custom Uno Icon
const UnoIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <rect x="4" y="6" width="8.5" height="13" rx="1.5" transform="rotate(-20 8.25 18)" fill="#ef4444" stroke="#ef4444" fillOpacity="0.3" />
       <rect x="6.5" y="5" width="8.5" height="13" rx="1.5" transform="rotate(-5 10.75 18)" fill="#3b82f6" stroke="#3b82f6" fillOpacity="0.3" />
       <rect x="9" y="5" width="8.5" height="13" rx="1.5" transform="rotate(10 13.25 18)" fill="#22c55e" stroke="#22c55e" fillOpacity="0.3" />
       <rect x="11.5" y="6" width="8.5" height="13" rx="1.5" transform="rotate(20 15.75 18)" fill="#eab308" stroke="#eab308" fillOpacity="0.3" />
       <ellipse cx="15.75" cy="12.5" rx="2" ry="3.5" transform="rotate(20 15.75 12.5)" fill="none" stroke="rgba(255,255,255,0.5)" />
    </svg>
);
// Custom Connect 4 Icon
const Connect4Icon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       {/* Pieds */}
       <path d="M4 21v-2" stroke="#6b7280" />
       <path d="M20 21v-2" stroke="#6b7280" />
       
       {/* Plateau Neutre (Gris foncé/Bleuté) */}
       <rect x="2" y="3" width="20" height="17" rx="2" stroke="#4b5563" fill="#1f2937" />
       
       {/* Jetons */}
       <circle cx="7" cy="8" r="1.5" fill="#374151" stroke="none" />
       <circle cx="12" cy="8" r="1.5" fill="#374151" stroke="none" />
       <circle cx="17" cy="8" r="1.5" fill="#374151" stroke="none" />
       <circle cx="7" cy="13" r="1.5" fill="#ec4899" stroke="none" /> 
       <circle cx="12" cy="13" r="1.5" fill="#374151" stroke="none" />
       <circle cx="17" cy="13" r="1.5" fill="#06b6d4" stroke="none" />
       <circle cx="7" cy="17.5" r="1.5" fill="#06b6d4" stroke="none" /> 
       <circle cx="12" cy="17.5" r="1.5" fill="#ec4899" stroke="none" /> 
       <circle cx="17" cy="17.5" r="1.5" fill="#ec4899" stroke="none" />
    </svg>
);
// Custom Breaker Icon
const BreakerIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <rect x="2" y="3" width="6" height="4" rx="1" /><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="16" y="3" width="6" height="4" rx="1" /><rect x="2" y="8" width="6" height="4" rx="1" /><rect x="16" y="8" width="6" height="4" rx="1" /><circle cx="12" cy="15" r="2" fill="currentColor" /><path d="M4 20h16" strokeWidth="2.5" />
    </svg>
);
// Custom Neon Mix Icon (3 tubes multicolores)
const NeonMixIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 11v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-6" fill="#facc15" stroke="none" />
        <path d="M3 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" stroke="#ffffff" strokeOpacity="0.9" />
        <path d="M10 6v11a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-11" fill="#22d3ee" stroke="none" />
        <path d="M10 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" stroke="#ffffff" strokeOpacity="0.9" />
        <path d="M17 14v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3" fill="#e879f9" stroke="none" />
        <path d="M17 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" stroke="#ffffff" strokeOpacity="0.9" />
    </svg>
);
// Custom Stack Icon (Isométrique)
const StackIcon = ({ size, className }: { size?: number | string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
    </svg>
);

const GAMES_CONFIG = [
    { id: 'skyjo', category: 'STRATEGY', name: 'NEON SKYJO', icon: Grid3X3, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30', hoverBorder: 'hover:border-purple-400', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]', glow: 'rgba(168,85,247,0.8)', badges: { solo: true, online: true, vs: true, new: true }, reward: 'GAINS' },
    { id: 'arenaclash', category: 'ARCADE', name: 'ARENA CLASH', icon: Crosshair, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-400', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: false, vs: false, new: true }, reward: 'GAINS' },
    { id: 'stack', category: 'ARCADE', name: 'STACK', icon: StackIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'tetris', category: 'ARCADE', name: 'TETRIS', icon: TetrisIcon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'runner', category: 'ARCADE', name: 'NEON RUN', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', hoverBorder: 'hover:border-orange-400', shadow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]', glow: 'rgba(251,146,60,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'watersort', category: 'PUZZLE', name: 'NEON MIX', icon: NeonMixIcon, color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]', glow: 'rgba(244,114,182,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'checkers', category: 'STRATEGY', name: 'DAMES', icon: Crown, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-500/30', hoverBorder: 'hover:border-teal-400', shadow: 'hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]', glow: 'rgba(45,212,191,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'uno', category: 'STRATEGY', name: 'UNO', icon: UnoIcon, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-500', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'snake', category: 'ARCADE', name: 'SNAKE', icon: SnakeIcon, color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-500/30', hoverBorder: 'hover:border-green-500', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]', glow: 'rgba(34,197,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'invaders', category: 'ARCADE', name: 'INVADERS', icon: Rocket, color: 'text-rose-500', bg: 'bg-rose-900/20', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500', shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', glow: 'rgba(244,63,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'breaker', category: 'ARCADE', name: 'BREAKER', icon: BreakerIcon, color: 'text-fuchsia-500', bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-500/30', hoverBorder: 'hover:border-fuchsia-500', shadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]', glow: 'rgba(217,70,239,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'pacman', category: 'ARCADE', name: 'PACMAN', icon: Ghost, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'airhockey', category: 'ARCADE', name: 'AIR HOCKEY', icon: Wind, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'sudoku', category: 'PUZZLE', name: 'SUDOKU', icon: Brain, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: '50' },
    { id: 'mastermind', category: 'PUZZLE', name: 'MASTERMIND', icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'connect4', category: 'STRATEGY', name: 'CONNECT 4', icon: Connect4Icon, color: 'text-pink-500', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-500', shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', glow: 'rgba(236,72,153,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: '30' },
    { id: 'memory', category: 'PUZZLE', name: 'MEMORY', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]', glow: 'rgba(167,139,250,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'battleship', category: 'STRATEGY', name: 'BATAILLE', icon: Ship, color: 'text-blue-500', bg: 'bg-blue-900/20', border: 'border-blue-500/30', hoverBorder: 'hover:border-blue-500', shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', glow: 'rgba(59,130,246,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
];

const CATEGORIES = [
    { id: 'ALL', label: 'TOUT', icon: LayoutGrid },
    { id: 'ONLINE', label: 'EN LIGNE', icon: Globe },
    { id: 'ARCADE', label: 'ARCADE', icon: Gamepad2 },
    { id: 'PUZZLE', label: 'RÉFLEXION', icon: Puzzle },
    { id: 'STRATEGY', label: 'STRATÉGIE', icon: Trophy },
];

const LEADERBOARD_GAMES = [
    { id: 'arenaclash', label: 'ARENA', unit: '', type: 'high', color: 'text-red-500' },
    { id: 'skyjo', label: 'SKYJO', unit: 'pts', type: 'low', color: 'text-purple-400' },
    { id: 'stack', label: 'STACK', unit: '', type: 'high', color: 'text-indigo-400' },
    { id: 'tetris', label: 'TETRIS', unit: '', type: 'high', color: 'text-neon-blue' },
    { id: 'runner', label: 'RUNNER', unit: '', type: 'high', color: 'text-orange-400' },
    { id: 'snake', label: 'SNAKE', unit: '', type: 'high', color: 'text-green-500' },
    { id: 'pacman', label: 'PACMAN', unit: '', type: 'high', color: 'text-yellow-400' },
    { id: 'breaker', label: 'BREAKER', unit: '', type: 'high', color: 'text-fuchsia-500' },
    { id: 'invaders', label: 'INVADERS', unit: '', type: 'high', color: 'text-rose-500' },
    { id: 'uno', label: 'UNO', unit: 'pts', type: 'high', color: 'text-red-500' },
    { id: 'watersort', label: 'NEON MIX', unit: 'Niv', type: 'high', color: 'text-pink-400' },
    { id: 'memory', label: 'MEMORY', unit: 'cps', type: 'low', color: 'text-violet-400' },
    { id: 'mastermind', label: 'NEON MIND', unit: 'cps', type: 'low', color: 'text-indigo-400' },
];

// ... (ThemeParticles, EventCountdown, FlyingCoin, ArcadeLogo components - keep existing logic) ...
// (Omitting for brevity as they are unchanged from previous implementation, ensure they are present in final file)

const ThemeParticles = ({ theme }: { theme: string }) => {
    // ... (Same as before)
    return null; // Placeholder for brevity
};
const EventCountdown = ({ endDate }: { endDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
    useEffect(() => {
        const calculateTime = () => {
            const diff = new Date(endDate).getTime() - new Date().getTime();
            if (diff > 0) {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ h, m, s });
            } else { setTimeLeft(null); }
        };
        calculateTime(); const interval = setInterval(calculateTime, 1000); return () => clearInterval(interval);
    }, [endDate]);
    if (!timeLeft) return null;
    return <div className="flex items-center gap-1 font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded border border-white/20"><Clock size={12} className="text-white"/><span>{String(timeLeft.h).padStart(2,'0')}h {String(timeLeft.m).padStart(2,'0')}m {String(timeLeft.s).padStart(2,'0')}s</span></div>;
};

const FlyingCoin = React.memo(({ startX, startY, targetX, targetY, delay, onComplete }: any) => {
    // ... (Same as before)
    return null;
});

const ArcadeLogo = () => (
    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-top-8 duration-700 mb-2 relative">
        {/* ... (Same as before) */}
        <div className="font-script text-6xl text-neon-pink transform -rotate-3 -mt-4 ml-8 animate-pulse" style={{ textShadow: '0 0 10px #ff00ff' }}>Arcade</div>
    </div>
);

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency, mp, dailyData, onLogout, isAuthenticated = false, onLoginRequest, onlineUsers, disabledGamesList = [], activeEvent, eventProgress }) => {
    // ... (Hooks and State same as before) ...
    const { coins, inventory, catalog, playerRank, username, currentAvatarId, avatarsCatalog, currentFrameId, framesCatalog, currentTitleId, titlesCatalog } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    const [scoreTab, setScoreTab] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const { streak, showDailyModal, todaysReward, claimDailyBonus, quests, claimQuestReward, claimAllBonus, allCompletedBonusClaimed } = dailyData;
    const [activeGlow, setActiveGlow] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isQuestsExpanded, setIsQuestsExpanded] = useState(false);
    const [animatingQuestId, setAnimatingQuestId] = useState<string | null>(null);
    const [flyingCoins, setFlyingCoins] = useState<any[]>([]);
    const coinBalanceRef = useRef<HTMLDivElement>(null);

    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });
    
    const handleGameStart = (gameId: string) => onSelectGame(gameId);

    // ... (Other handlers same as before) ...
    const spawnCoins = (startX: number, startY: number, amount: number) => { /* ... */ };
    const handleDailyBonusClaim = () => { /* ... */ };
    const handleClaim = (q: DailyQuest, e: React.MouseEvent) => { /* ... */ };
    const handleClaimAll = (e: React.MouseEvent) => { /* ... */ };
    const handleInstallClick = () => { /* ... */ };
    const handleReload = () => window.location.reload();
    const handleNameSubmit = (e?: React.FormEvent) => { /* ... */ };

    const ownedBadges = catalog.filter(b => inventory.includes(b.id));
    const currentAvatar = avatarsCatalog.find(a => a.id === currentAvatarId) || avatarsCatalog[0];
    const currentFrame = framesCatalog.find(f => f.id === currentFrameId) || framesCatalog[0];
    const currentTitle = titlesCatalog.find(t => t.id === currentTitleId);
    const AvatarIcon = currentAvatar.icon;

    // Helper for Event Progress
    const getEventProgress = () => {
        if (!activeEvent || !activeEvent.goalType || activeEvent.goalType === 'NONE') return null;
        const current = eventProgress?.[activeEvent.id] || 0;
        const target = activeEvent.goalTarget || 0;
        const percent = Math.min(100, Math.floor((current / target) * 100));
        return { current, target, percent };
    };
    const evtProg = getEventProgress();

    // Helper for targeted games
    const isTargetedGame = (gameId: string) => {
        if (!activeEvent || !activeEvent.targetGameIds || activeEvent.targetGameIds.length === 0) return false;
        return activeEvent.targetGameIds.includes(gameId);
    };

    // ... (getTopScoreForGame, getQuestIcon, getDifficultyColor, etc.) ...
    
    // Dynamic Theme Class
    const getEventThemeClass = (theme?: string) => {
        if (theme === 'winter') return 'bg-cyan-900/40 border-cyan-400 text-cyan-100 shadow-cyan-500/20';
        if (theme === 'gold') return 'bg-yellow-900/40 border-yellow-400 text-yellow-100 shadow-yellow-500/20';
        if (theme === 'cyber') return 'bg-purple-900/40 border-purple-400 text-purple-100 shadow-purple-500/20';
        if (theme === 'halloween') return 'bg-orange-900/40 border-orange-500 text-orange-100 shadow-orange-500/20';
        if (theme === 'christmas') return 'bg-red-900/40 border-red-500 text-red-100 shadow-red-500/20';
        // Fallback
        return 'bg-blue-900/40 border-blue-400 text-blue-100 shadow-blue-500/20';
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto">
            {/* ... (Coins, Modals, Backgrounds) ... */}
            
             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-6 mt-12 pb-10">
                 <ArcadeLogo />

                 {/* EVENT BANNER */}
                 {activeEvent && (
                     <div className={`w-full mt-4 p-4 rounded-xl border-2 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-700 relative overflow-hidden backdrop-blur-md ${getEventThemeClass(activeEvent.theme)}`}>
                         
                         {/* Animated sheen */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

                         <div className="flex justify-between items-start mb-2 relative z-10">
                             <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-full border-2 bg-black/40`}>
                                     {activeEvent.type === 'XP_BOOST' && <Zap size={20} className="animate-pulse"/>}
                                     {activeEvent.type === 'TOURNAMENT' && <Trophy size={20} className="animate-bounce"/>}
                                     {activeEvent.type === 'SPECIAL_QUEST' && <Target size={20} className="animate-spin-slow"/>}
                                     {activeEvent.type === 'COMMUNITY' && <Users size={20} className="animate-pulse"/>}
                                     {activeEvent.type === 'SEASONAL' && <Star size={20} className="animate-pulse"/>}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-[10px] font-black tracking-[0.2em] opacity-80 uppercase flex items-center gap-1">
                                         {activeEvent.type.replace('_', ' ')}
                                         {activeEvent.multiplier && activeEvent.multiplier > 1 && <span className="text-yellow-300 animate-pulse ml-1">x{activeEvent.multiplier} COINS</span>}
                                     </span>
                                     <span className="font-black text-lg uppercase leading-tight drop-shadow-md">{activeEvent.title}</span>
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <div className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black tracking-wider animate-pulse border border-white/30">EN COURS</div>
                                <EventCountdown endDate={activeEvent.endDate} />
                             </div>
                         </div>
                         
                         <p className="text-xs opacity-90 leading-snug bg-black/20 p-2 rounded relative z-10 border border-white/5 mb-2">{activeEvent.description}</p>
                         
                         {/* EVENT PROGRESS BAR */}
                         {evtProg && (
                            <div className="relative z-10 bg-black/40 p-2 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                    <span>PROGRESSION</span>
                                    <span>{evtProg.current} / {evtProg.target}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${evtProg.percent}%` }}></div>
                                </div>
                                {activeEvent.completionReward && (
                                    <div className="flex items-center gap-1 text-[9px] text-yellow-300 mt-1 justify-end">
                                        <Gift size={10} /> +{activeEvent.completionReward} PIÈCES À L'ARRIVÉE
                                    </div>
                                )}
                            </div>
                         )}
                     </div>
                 )}

                 {/* ... (Profile Card, Daily Quests, Leaderboard - unchanged) ... */}
                 
                 {/* GAME GRID (Updated with Event Badges) */}
                 <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    {GAMES_CONFIG.filter(g => {
                        if (activeCategory === 'ALL') return true;
                        if (activeCategory === 'ONLINE') return g.badges.online;
                        return g.category === activeCategory;
                    }).map((game) => {
                        const isRestricted = disabledGamesList.includes(game.id);
                        const isImmune = username === 'Vincent' || username === 'Test' || currency.adminModeActive;
                        const isDisabled = isRestricted && !isImmune;
                        const isEventTarget = isTargetedGame(game.id);
                        
                        return (
                            <button 
                                key={game.id} 
                                onClick={() => handleGameStart(game.id)} 
                                disabled={isDisabled}
                                {...(!isDisabled ? bindGlow(game.glow) : {})} 
                                className={`group relative flex flex-col items-center justify-between p-3 h-32 bg-black/60 border rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md
                                    ${isDisabled 
                                        ? 'border-gray-800 opacity-60 grayscale cursor-not-allowed' 
                                        : `${game.border} ${game.hoverBorder} ${game.shadow} hover:scale-[1.02] active:scale-95`
                                    }`}
                            >
                                {/* Event Highlight */}
                                {isEventTarget && !isDisabled && (
                                    <div className="absolute inset-0 border-2 border-yellow-400/50 animate-pulse rounded-xl z-20 pointer-events-none"></div>
                                )}

                                {!isDisabled && <div className={`absolute inset-0 ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>}
                                
                                <div className="w-full flex justify-end gap-1 relative z-10">
                                    {isEventTarget && !isDisabled && <div className="px-1.5 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black tracking-widest shadow-md flex items-center gap-0.5"><Star size={8} fill="black"/> EVENT</div>}
                                    {/* ... existing badges ... */}
                                </div>
                                <div className={`p-2 rounded-lg bg-gray-900/50 ${!isDisabled ? game.color : 'text-gray-500'} ${!isDisabled && 'group-hover:scale-110'} transition-transform relative z-10 shadow-lg border border-white/5`}>
                                    <game.icon size={32} />
                                </div>
                                <div className="text-center relative z-10 w-full">
                                    <h3 className={`font-black italic text-sm tracking-wider text-white ${!isDisabled && `group-hover:${game.color}`} transition-colors uppercase`}>{game.name}</h3>
                                </div>
                            </button>
                        );
                    })}
                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">v3.5 • EVENTS EVOLUTION</div>
             </div>
        </div>
    );
}
