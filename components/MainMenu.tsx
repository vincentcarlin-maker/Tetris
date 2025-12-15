
import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download, Users, Wind, Activity, Globe, Calendar, CheckCircle, Rocket, LogOut, Copy, Vibrate, VibrateOff, User, Shield, ShieldAlert, Cloud, Palette, Star, Settings, Eye, EyeOff, Hourglass, Hash, Crown, LayoutGrid, Zap, Gamepad2, Puzzle, BarChart2, Layers, Crosshair, Gift, Target, Info, X, AlertTriangle, ArrowDown } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { DailyQuest } from '../hooks/useDailySystem'; 
import { DailyBonusModal } from './DailyBonusModal';
import { OnlineUser } from '../hooks/useSupabase';

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
    activeEvent?: {
        id: string;
        title: string;
        description: string;
        type: 'XP_BOOST' | 'TOURNAMENT' | 'SPECIAL_QUEST' | 'COMMUNITY';
        active: boolean;
        startDate: string;
        endDate: string;
        theme?: {
            primaryColor: string;
            backgroundImage?: string;
        };
        objectives?: { type: string, target: number, gameIds: string[] }[];
        rewards?: { coins: number, badgeId?: string, skinId?: string };
    };
    eventProgress?: Record<string, number>;
}

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
       {/* Ligne 1 (Haut - Vide) */}
       <circle cx="7" cy="8" r="1.5" fill="#374151" stroke="none" />
       <circle cx="12" cy="8" r="1.5" fill="#374151" stroke="none" />
       <circle cx="17" cy="8" r="1.5" fill="#374151" stroke="none" />

       {/* Ligne 2 (Milieu) */}
       <circle cx="7" cy="13" r="1.5" fill="#ec4899" stroke="none" /> {/* Rose */}
       <circle cx="12" cy="13" r="1.5" fill="#374151" stroke="none" />
       <circle cx="17" cy="13" r="1.5" fill="#06b6d4" stroke="none" /> {/* Cyan */}

       {/* Ligne 3 (Bas) */}
       <circle cx="7" cy="17.5" r="1.5" fill="#06b6d4" stroke="none" /> {/* Cyan */}
       <circle cx="12" cy="17.5" r="1.5" fill="#ec4899" stroke="none" /> {/* Rose */}
       <circle cx="17" cy="17.5" r="1.5" fill="#ec4899" stroke="none" /> {/* Rose */}
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
        {/* Tube 1 (Left) - Yellow */}
        <path d="M3 11v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-6" fill="#facc15" stroke="none" />
        <path d="M3 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" stroke="#ffffff" strokeOpacity="0.9" />
        
        {/* Tube 2 (Center) - Cyan */}
        <path d="M10 6v11a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-11" fill="#22d3ee" stroke="none" />
        <path d="M10 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" stroke="#ffffff" strokeOpacity="0.9" />

        {/* Tube 3 (Right) - Pink */}
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
    { id: 'neondrop', category: 'ARCADE', name: 'NEON DROP', icon: ArrowDown, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: true }, reward: 'GAINS' },
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
    { id: 'neondrop', label: 'NEON DROP', unit: '', type: 'high', color: 'text-yellow-400' },
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

const FlyingCoin = React.memo(({ startX, startY, targetX, targetY, delay, onComplete }: { startX: number, startY: number, targetX: number, targetY: number, delay: number, onComplete: () => void }) => {
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', top: startY, left: startX, opacity: 1, transform: 'scale(0.5)', zIndex: 100, pointerEvents: 'none', transition: 'none' });
    useEffect(() => {
        const animTimeout = setTimeout(() => {
             setStyle({ position: 'fixed', top: targetY, left: targetX, opacity: 0, transform: 'scale(0.8) rotate(360deg)', zIndex: 100, pointerEvents: 'none', transition: `top 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-in 0.5s, transform 0.8s linear` });
        }, delay * 1000 + 50);
        const endTimeout = setTimeout(onComplete, 800 + delay * 1000 + 50);
        return () => { clearTimeout(animTimeout); clearTimeout(endTimeout); };
    }, [targetX, targetY, delay, onComplete]);
    return (<div style={style} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"><Coins size={24} fill="#facc15" /></div>);
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

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency, mp, dailyData, onLogout, isAuthenticated = false, onLoginRequest, onlineUsers, disabledGamesList = [], activeEvent, eventProgress }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog, currentFrameId, framesCatalog, addCoins, currentTitleId, titlesCatalog, currentMalletId } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    const [scoreTab, setScoreTab] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [showEventInfo, setShowEventInfo] = useState(false);
    
    const { streak, showDailyModal, todaysReward, claimDailyBonus, quests, claimQuestReward, claimAllBonus, allCompletedBonusClaimed } = dailyData;

    const [activeGlow, setActiveGlow] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isQuestsExpanded, setIsQuestsExpanded] = useState(false);
    const [animatingQuestId, setAnimatingQuestId] = useState<string | null>(null);
    const [flyingCoins, setFlyingCoins] = useState<{id: number, startX: number, startY: number, targetX: number, targetY: number, delay: number}[]>([]);
    const coinBalanceRef = useRef<HTMLDivElement>(null);

    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });
    
    const handleGameStart = (gameId: string) => { 
        onSelectGame(gameId); 
    };

    const spawnCoins = (startX: number, startY: number, amount: number) => {
        const targetRect = coinBalanceRef.current?.getBoundingClientRect();
        if (!targetRect) return;
        const targetX = targetRect.left + (targetRect.width / 2) - 12; 
        const targetY = targetRect.top + (targetRect.height / 2) - 12;
        const count = Math.min(Math.floor(amount / 10) + 5, 20); 
        const newCoins = [];
        for (let i = 0; i < count; i++) {
            newCoins.push({ id: Date.now() + Math.random(), startX: startX + (Math.random() - 0.5) * 40, startY: startY + (Math.random() - 0.5) * 40, targetX, targetY, delay: i * 0.05 });
        }
        setFlyingCoins(prev => [...prev, ...newCoins]);
    };

    const handleDailyBonusClaim = () => {
        spawnCoins(window.innerWidth / 2, window.innerHeight / 2, todaysReward);
        claimDailyBonus();
    };

    const handleClaim = (q: DailyQuest, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        