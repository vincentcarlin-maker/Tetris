
import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download, Users, Wind, Activity, Globe, Calendar, CheckCircle, Rocket, LogOut, Copy, Vibrate, VibrateOff, User, Shield, ShieldAlert, Cloud, Palette, Star, Settings, Eye, EyeOff, Hourglass, Hash, Crown, LayoutGrid, Zap, Gamepad2, Puzzle, BarChart2, Layers, Crosshair, Clock } from 'lucide-react';
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
        endDate: string;
        multiplier?: number;
        theme?: string;
    };
}

// ... (Icons components unchanged) ...
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

// Visual Theme Components
const ThemeParticles = ({ theme }: { theme: string }) => {
    if (theme === 'winter') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="absolute bg-white rounded-full opacity-60 animate-[fall_5s_linear_infinite]" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-${Math.random() * 20}%`,
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 3 + 4}s`
                        }}
                    />
                ))}
            </div>
        );
    }
    if (theme === 'gold') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="absolute bg-yellow-400 rounded-full opacity-60 animate-[rise_4s_ease-in_infinite]" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            bottom: `-${Math.random() * 20}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            animationDelay: `${Math.random() * 4}s`,
                            boxShadow: '0 0 10px gold'
                        }}
                    />
                ))}
            </div>
        );
    }
    // Default or other themes
    return null;
};

// Countdown Timer Component
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
            } else {
                setTimeLeft(null);
            }
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [endDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center gap-1 font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded border border-white/20">
            <Clock size={12} className="text-white"/>
            <span>{String(timeLeft.h).padStart(2,'0')}h {String(timeLeft.m).padStart(2,'0')}m {String(timeLeft.s).padStart(2,'0')}s</span>
        </div>
    );
};

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

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency, mp, dailyData, onLogout, isAuthenticated = false, onLoginRequest, onlineUsers, disabledGamesList = [], activeEvent }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog, currentFrameId, framesCatalog, addCoins, currentTitleId, titlesCatalog, currentMalletId } = currency;
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
        spawnCoins(rect.left + rect.width / 2, rect.top + rect.height / 2, q.reward);
        audio.playCoin();
        setAnimatingQuestId(q.id);
        claimQuestReward(q.id);
        setTimeout(() => setAnimatingQuestId(null), 1500);
    };

    const handleClaimAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (allCompletedBonusClaimed) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        spawnCoins(rect.left + rect.width / 2, rect.top + rect.height / 2, 200);
        audio.playVictory();
        claimAllBonus();
    }

    useEffect(() => { audio.resumeAudio(); }, [audio]);
    useEffect(() => { if (isEditingName && inputRef.current) inputRef.current.focus(); }, [isEditingName]);
    useEffect(() => {
        const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    useEffect(() => { if (isAuthenticated) mp.updateSelfInfo(username, currentAvatarId, currentMalletId); }, [username, currentAvatarId, currentMalletId, mp, isAuthenticated]);

    const handleInstallClick = () => { if (!installPrompt) return; installPrompt.prompt(); installPrompt.userChoice.then((choiceResult: any) => { setInstallPrompt(null); }); };
    const handleReload = () => { window.location.reload(); };
    const handleNameSubmit = (e?: React.FormEvent) => { if (e) e.preventDefault(); if (tempName.trim()) { updateUsername(tempName.trim()); } else { setTempName(username); } setIsEditingName(false); };
    
    const ownedBadges = catalog.filter(b => inventory.includes(b.id));
    const currentAvatar = avatarsCatalog.find(a => a.id === currentAvatarId) || avatarsCatalog[0];
    const currentFrame = framesCatalog.find(f => f.id === currentFrameId) || framesCatalog[0];
    const currentTitle = titlesCatalog.find(t => t.id === currentTitleId);
    const AvatarIcon = currentAvatar.icon;

    // Leaderboard Helper
    const getTopScoreForGame = (game: { id: string, type: string }) => {
        if (onlineUsers.length === 0) return { name: '-', score: 0 };
        const sorted = [...onlineUsers].sort((a, b) => {
            const scoreA = a.stats?.[game.id] || 0;
            const scoreB = b.stats?.[game.id] || 0;
            if (game.type === 'low') {
                const realA = scoreA === 0 ? Infinity : scoreA;
                const realB = scoreB === 0 ? Infinity : scoreB;
                return realA - realB;
            }
            return scoreB - scoreA;
        });
        const top = sorted[0];
        const topScore = top.stats?.[game.id] || 0;
        if (!topScore) return { name: '-', score: 0 };
        return { name: top.name, score: topScore };
    };

    const getQuestIcon = (gameId: string) => {
        const game = GAMES_CONFIG.find(g => g.id === gameId);
        return game ? game.icon : Coins;
    };

    const getDifficultyColor = (diff: string) => {
        switch(diff) {
            case 'EASY': return 'text-green-400 border-green-500/50 bg-green-900/20';
            case 'MEDIUM': return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20';
            case 'HARD': return 'text-red-500 border-red-500/50 bg-red-900/20';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-800';
        }
    };

    const allQuestsCompleted = quests.every(q => q.isCompleted);

    // Dynamic Theme Class
    const getEventThemeClass = (theme?: string) => {
        if (theme === 'winter') return 'bg-cyan-900/40 border-cyan-400 text-cyan-100 shadow-cyan-500/20';
        if (theme === 'gold') return 'bg-yellow-900/40 border-yellow-400 text-yellow-100 shadow-yellow-500/20';
        if (theme === 'cyber') return 'bg-purple-900/40 border-purple-400 text-purple-100 shadow-purple-500/20';
        if (theme === 'halloween') return 'bg-orange-900/40 border-orange-500 text-orange-100 shadow-orange-500/20';
        // Fallback to type
        if (activeEvent?.type === 'XP_BOOST') return 'bg-yellow-900/40 border-yellow-400 text-yellow-100 shadow-yellow-500/20';
        if (activeEvent?.type === 'TOURNAMENT') return 'bg-purple-900/40 border-purple-400 text-purple-100 shadow-purple-500/20';
        if (activeEvent?.type === 'SPECIAL_QUEST') return 'bg-green-900/40 border-green-400 text-green-100 shadow-green-500/20';
        return 'bg-blue-900/40 border-blue-400 text-blue-100 shadow-blue-500/20';
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto">
            
            {/* Event Theme Overlay (Particles/Atmosphere) */}
            {activeEvent && activeEvent.theme && <ThemeParticles theme={activeEvent.theme} />}

            {flyingCoins.map(coin => <FlyingCoin key={coin.id} startX={coin.startX} startY={coin.startY} targetX={coin.targetX} targetY={coin.targetY} delay={coin.delay} onComplete={() => setFlyingCoins(prev => prev.filter(c => c.id !== coin.id))} />)}
            {showDailyModal && isAuthenticated && <DailyBonusModal streak={streak} reward={todaysReward} onClaim={handleDailyBonusClaim} />}
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-10 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`} style={{ background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none', opacity: activeGlow ? 0.6 : 0 }} />

            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                {isAuthenticated ? (
                    <div ref={coinBalanceRef} className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400" size={20} />
                        <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                    </div>
                ) : (
                    <button onClick={onLoginRequest} className="flex items-center gap-2 bg-neon-blue/20 backdrop-blur-md px-4 py-2 rounded-full border border-neon-blue/50 hover:bg-neon-blue/40 transition-colors animate-pulse"><User className="text-neon-blue" size={20} /><span className="text-neon-blue font-bold text-sm">SE CONNECTER</span></button>
                )}
                <div className="flex gap-3">
                    {isAuthenticated && <button onClick={() => onSelectGame('shop')} className="p-2 bg-gray-900/80 rounded-full text-yellow-400 hover:text-white border border-yellow-500/30 backdrop-blur-sm active:scale-95 transition-transform shadow-[0_0_10px_rgba(234,179,8,0.2)]" title="Boutique"><ShoppingBag size={20} /></button>}
                    {installPrompt && <button onClick={handleInstallClick} className="p-2 bg-neon-pink/20 rounded-full text-neon-pink hover:bg-neon-pink hover:text-white border border-neon-pink/50 backdrop-blur-sm active:scale-95 transition-all animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.4)]" title="Installer l'application"><Download size={20} /></button>}
                    <button onClick={handleReload} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform" title="Actualiser"><RefreshCw size={20} /></button>
                    <button onClick={audio.toggleVibration} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform">{audio.isVibrationEnabled ? <Vibrate size={20} /> : <VibrateOff size={20} />}</button>
                    <button onClick={audio.toggleMute} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform">{audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                </div>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-6 mt-12 pb-10">
                 <ArcadeLogo />

                 {/* EVENT BANNER - NEW DESIGN */}
                 {activeEvent && (
                     <div className={`w-full mt-4 p-4 rounded-xl border-2 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-700 relative overflow-hidden backdrop-blur-md ${getEventThemeClass(activeEvent.theme)}`}>
                         
                         {/* Animated background sheen */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>

                         <div className="flex justify-between items-start mb-2 relative z-10">
                             <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-full border-2 bg-black/40 ${
                                     activeEvent.type === 'XP_BOOST' ? 'border-yellow-400 text-yellow-400' :
                                     activeEvent.type === 'TOURNAMENT' ? 'border-purple-400 text-purple-400' :
                                     activeEvent.type === 'SPECIAL_QUEST' ? 'border-green-400 text-green-400' :
                                     'border-blue-400 text-blue-400'
                                 }`}>
                                     {activeEvent.type === 'XP_BOOST' && <Zap size={20} className="animate-pulse"/>}
                                     {activeEvent.type === 'TOURNAMENT' && <Trophy size={20} className="animate-bounce"/>}
                                     {activeEvent.type === 'SPECIAL_QUEST' && <Star size={20} className="animate-spin-slow"/>}
                                     {activeEvent.type === 'COMMUNITY' && <Users size={20} className="animate-pulse"/>}
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
                         
                         <p className="text-xs opacity-90 leading-snug bg-black/20 p-2 rounded relative z-10 border border-white/5">{activeEvent.description}</p>
                     </div>
                 )}

                 {/* CARTE DE PROFIL COMPACTE */}
<div {...bindGlow('rgba(200, 230, 255, 0.8)')} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md relative overflow-hidden group shadow-lg transition-all duration-300">
    {/* ... (Profile Card Content Unchanged) ... */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
    
    {/* Logout */}
    {isAuthenticated && <button onClick={onLogout} className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-400 transition-colors z-30" title="Se déconnecter"><LogOut size={14} /></button>}

    <div className="flex items-center w-full gap-3 z-10">
        <div onClick={() => isAuthenticated ? onSelectGame('shop') : onLoginRequest && onLoginRequest()} className="relative cursor-pointer hover:scale-105 transition-transform shrink-0">
            {isAuthenticated ? (
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 flex items-center justify-center relative z-10 border-2 ${currentFrame.cssClass}`}>
                    <div className="w-full h-full bg-black/40 rounded-[8px] flex items-center justify-center backdrop-blur-sm">
                        <AvatarIcon size={32} className={currentAvatar.color} />
                    </div>
                </div>
            ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-800 border-2 border-white/20 flex items-center justify-center relative z-10">
                    <Lock size={24} className="text-gray-500" />
                </div>
            )}
            {isAuthenticated && <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[8px] text-white px-1.5 py-0.5 rounded-full border border-white/20 z-20 font-bold shadow-sm">EDIT</div>}
        </div>

        <div className="flex-1 flex flex-col justify-center min-w-0">
            {isAuthenticated ? (
                <>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <form onSubmit={handleNameSubmit} className="flex items-center gap-2 w-full">
                                <input ref={inputRef} type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={() => handleNameSubmit()} maxLength={12} className="bg-black/50 border border-neon-blue rounded px-2 py-0.5 text-white font-bold text-base w-full outline-none focus:ring-1 ring-neon-blue/50" />
                                <button type="submit" className="text-green-400"><Check size={16} /></button>
                            </form>
                        ) : (
                            <button onClick={() => { setTempName(username); setIsEditingName(true); }} className="flex items-center gap-2 group/edit truncate">
                                <h2 className="text-lg font-black text-white italic tracking-wide truncate">{username}</h2>
                                <Edit2 size={12} className="text-gray-500 group-hover/edit:text-white transition-colors opacity-0 group-hover/edit:opacity-100" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {currentTitle && currentTitle.id !== 't_none' && (
                            <span className={`text-[9px] font-black uppercase tracking-wider ${currentTitle.color} bg-gray-900/80 px-1.5 py-0.5 rounded border border-white/10`}>
                                {currentTitle.name}
                            </span>
                        )}
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${playerRank.color}`}>
                            {playerRank.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold bg-yellow-900/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                            <Calendar size={10} /> J{streak}
                        </div>
                        {ownedBadges.length > 0 && (
                            <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold bg-blue-900/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                <Trophy size={10} /> {ownedBadges.length}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-1 items-start">
                    <h2 className="text-base font-bold text-gray-400 italic">Mode Visiteur</h2>
                    <button onClick={onLoginRequest} className="text-[10px] bg-neon-blue text-black px-3 py-1.5 rounded font-bold hover:bg-white transition-colors shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                        SE CONNECTER / CRÉER
                    </button>
                </div>
            )}
        </div>
    </div>
    
    {isAuthenticated && currency.isSuperUser && (
        <div className="w-full flex gap-1 mt-1">
            <button onClick={currency.toggleAdminMode} className={`flex-1 py-1.5 rounded-md font-black text-[9px] tracking-widest flex items-center justify-center gap-1 transition-all border ${currency.adminModeActive ? 'bg-red-900/50 text-red-400 border-red-500/50' : 'bg-green-900/50 text-green-400 border-green-500/50'}`}>
                {currency.adminModeActive ? <><ShieldAlert size={10}/> GOD: ON</> : <><Shield size={10}/> GOD: OFF</>}
            </button>
            {currency.adminModeActive && (
                <>
                    <button onClick={() => onSelectGame('admin_dashboard')} className="flex-1 py-1.5 bg-purple-900/50 text-purple-400 border border-purple-500/50 rounded-md font-black text-[9px] tracking-widest flex items-center justify-center gap-1">
                        <BarChart2 size={10}/> DASHBOARD
                    </button>
                </>
            )}
        </div>
    )}

    {isAuthenticated && ownedBadges.length > 0 && (
        <div className="w-full bg-black/20 rounded-lg p-1.5 flex gap-2 overflow-x-auto no-scrollbar border border-white/5 mt-1">
            {ownedBadges.slice().reverse().map(badge => { 
                const Icon = badge.icon; 
                return (
                    <div key={badge.id} className="relative shrink-0 group/badge" title={badge.name}>
                        <div className="w-7 h-7 bg-gray-800/80 rounded border border-white/10 flex items-center justify-center shadow-sm group-hover/badge:border-white/30 transition-colors">
                            <Icon size={14} className={badge.color} />
                        </div>
                    </div>
                ); 
            })}
        </div>
    )}
</div>

                 {/* --- DAILY QUESTS PANEL --- */}
                 {/* ... (Quests Panel unchanged) ... */}
                 <div {...bindGlow('rgba(34, 197, 94, 0.8)')} className={`w-full bg-black/80 border ${isAuthenticated ? 'border-green-500/30' : 'border-gray-700/50'} rounded-xl p-3 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.1)] relative overflow-hidden group hover:border-green-500/50 hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] hover:ring-1 hover:ring-green-500/30 transition-all duration-300 ${!isAuthenticated ? 'opacity-70 grayscale' : ''}`}>
                     {isAuthenticated && (<><div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full pointer-events-none"></div><div className="absolute -left-6 -bottom-6 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div></>)}
                     <div onClick={() => isAuthenticated && setIsQuestsExpanded(!isQuestsExpanded)} className={`flex items-center justify-between border-white/10 relative z-10 cursor-pointer ${isQuestsExpanded ? 'border-b mb-2 pb-2' : ''}`}>
                         <div className="flex items-center gap-2 overflow-hidden py-1">
                             <h3 className="text-base font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] whitespace-nowrap pr-2">
                                <CheckCircle size={16} className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> 
                                DÉFIS DU JOUR
                             </h3>
                             {isAuthenticated && !isQuestsExpanded && (<div className="flex gap-1 ml-1 animate-in fade-in duration-300 shrink-0">{quests.map((q) => (<div key={q.id} title={q.description} className={`w-3 h-3 flex items-center justify-center rounded-full border transition-colors ${q.isCompleted ? 'bg-green-500 border-green-400 shadow-[0_0_5px_#22c55e]' : 'bg-gray-800/50 border-white/10'}`}>{q.isCompleted && <Check size={8} className="text-black" strokeWidth={4} />}</div>))}</div>)}
                         </div>
                         {isAuthenticated ? <div className="flex items-center gap-2 shrink-0"><span className="text-[9px] text-green-400 font-mono font-bold tracking-widest bg-green-900/30 border border-green-500/30 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(34,197,94,0.1)]">{new Date().toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}</span><ChevronDown size={16} className={`text-green-400 transition-transform duration-300 ${isQuestsExpanded ? 'rotate-180' : ''}`} /></div> : <Lock size={16} className="text-gray-500" />}
                     </div>
                     
                     {isAuthenticated && isQuestsExpanded && (
                         <div className="space-y-3 relative z-10 animate-in slide-in-from-top-2 duration-300">
                             {quests.map(quest => {
                                 const GameIcon = getQuestIcon(quest.gameId);
                                 const diffColor = getDifficultyColor(quest.difficulty);
                                 const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
                                 
                                 return (
                                     <div key={quest.id} className={`relative flex flex-col p-3 rounded-lg border transition-all duration-300 ${quest.isCompleted ? 'bg-green-950/40 border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' : 'bg-gray-900/60 border-white/5 hover:border-white/20'}`}>
                                         {animatingQuestId === quest.id && (<div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none z-50"><div className="relative"><Coins size={40} className="text-yellow-400 absolute -top-4 -left-4 animate-ping opacity-75" /><div className="text-yellow-300 font-black text-xl absolute -top-8 -left-2 animate-bounce drop-shadow-[0_0_10px_gold]">+{quest.reward}</div></div></div>)}
                                         
                                         <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-3">
                                                 <div className={`p-1.5 rounded-md ${diffColor}`}>
                                                     <GameIcon size={16} />
                                                 </div>
                                                 <div>
                                                     <span className={`text-xs font-bold tracking-wide block ${quest.isCompleted ? 'text-green-100 line-through decoration-green-500/50' : 'text-gray-200'}`}>{quest.description}</span>
                                                     <span className="text-[9px] text-gray-500 font-mono">{quest.progress}/{quest.target}</span>
                                                 </div>
                                             </div>
                                             {quest.isCompleted && !quest.isClaimed ? (
                                                 <button onClick={(e) => handleClaim(quest, e)} className="px-3 py-1.5 bg-yellow-400 text-black text-[10px] font-black tracking-wider rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse flex items-center gap-1 shrink-0"><Coins size={12} fill="black" /> +{quest.reward}</button>
                                             ) : quest.isClaimed ? (
                                                 <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded border border-green-500/20 shrink-0"><Check size={12} className="text-green-400" /><span className="text-[10px] font-black text-green-400 tracking-wider">FAIT</span></div>
                                             ) : (
                                                 <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono font-bold bg-yellow-900/10 px-2 py-1 rounded border border-yellow-500/20 shrink-0"><Coins size={10} /> {quest.reward}</div>
                                             )}
                                         </div>
                                         {/* Progress Bar */}
                                         <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                             <div className={`h-full transition-all duration-500 ${quest.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                         </div>
                                     </div>
                                 );
                             })}
                             
                             {/* Grand Slam Bonus */}
                             {allQuestsCompleted && (
                                 <div className={`mt-4 p-3 rounded-xl border-2 flex items-center justify-between ${allCompletedBonusClaimed ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-400 animate-pulse'}`}>
                                     <div className="flex items-center gap-3">
                                         <Trophy size={24} className="text-yellow-400 drop-shadow-[0_0_5px_gold]" />
                                         <div>
                                             <span className="text-xs font-black text-yellow-100 block">GRAND CHELEM</span>
                                             <span className="text-[10px] text-yellow-200/70">Tous les défis complétés !</span>
                                         </div>
                                     </div>
                                     {allCompletedBonusClaimed ? (
                                         <span className="text-[10px] font-bold text-yellow-500 bg-yellow-900/40 px-2 py-1 rounded">RÉCUPÉRÉ</span>
                                     ) : (
                                         <button onClick={handleClaimAll} className="px-4 py-2 bg-yellow-400 text-black font-black text-xs rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_gold] flex items-center gap-1"><Coins size={14}/> +200</button>
                                     )}
                                 </div>
                             )}
                         </div>
                     )}
                 </div>

                 {/* High Scores Panel */}
                 <div {...bindGlow('rgba(250, 204, 21, 0.8)')} className="w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30">
                    <button onClick={() => setShowScores(s => !s)} className="w-full p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><Trophy size={20} className="text-yellow-400" /><h3 className="text-lg font-bold text-white italic">SCORES & CLASSEMENTS</h3></div>
                        <ChevronDown size={20} className={`transition-transform ${showScores ? 'rotate-180' : ''}`} />
                    </button>
                    {showScores && (
                        <div className="px-4 pb-4 animate-in fade-in duration-300">
                            <div className="flex bg-black/30 p-1 rounded-lg mb-3">
                                <button onClick={() => setScoreTab('LOCAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'LOCAL' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}>MON RECORDS</button>
                                <button onClick={() => setScoreTab('GLOBAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'GLOBAL' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>MONDE (HISTOIRE)</button>
                            </div>
                            {scoreTab === 'LOCAL' ? (
                                <div className="space-y-2">
                                    {LEADERBOARD_GAMES.map(game => {
                                        // @ts-ignore
                                        const score = highScores[game.id];
                                        // Handle specific cases like Sudoku (object)
                                        const displayScore = game.id === 'sudoku' && typeof score === 'object' ? score?.medium : score;
                                        
                                        if (displayScore && displayScore > 0) {
                                            return (
                                                <div key={game.id} className="py-2 border-t border-white/5 flex justify-between">
                                                    <span className={`text-xs font-bold ${game.color}`}>{game.label}</span>
                                                    <span className="text-xs font-mono">{displayScore.toLocaleString()} {game.unit}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                    <div className="text-center text-[10px] text-gray-500 pt-2">Jouez pour établir des records</div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-500 text-center italic mb-2 flex items-center justify-center gap-1"><Cloud size={10}/> Classement historique Cloud</p>
                                    {LEADERBOARD_GAMES.map(game => {
                                        const top = getTopScoreForGame(game);
                                        return (
                                            <div key={game.id} className="py-2 border-t border-white/5 flex justify-between items-center">
                                                <h4 className={`font-bold text-sm ${game.color}`}>{game.label}</h4>
                                                <div className="text-right"><p className="text-xs text-gray-400 font-bold">{top.name}</p><p className="font-mono text-lg">{top.score > 0 ? `${top.score.toLocaleString()} ${game.unit}` : '-'}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                 {/* --- GAME CATEGORY TABS --- */}
                 <div className="flex gap-2 w-full overflow-x-auto pb-2 no-scrollbar px-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all border
                                ${activeCategory === cat.id 
                                    ? 'bg-neon-blue text-black border-neon-blue'
                                    : 'bg-gray-900 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                }
                            `}
                        >
                            <cat.icon size={14} /> {cat.label}
                        </button>
                    ))}
                 </div>

                 {/* --- GAME GRID --- */}
                 <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    {GAMES_CONFIG.filter(g => {
                        if (activeCategory === 'ALL') return true;
                        if (activeCategory === 'ONLINE') return g.badges.online;
                        return g.category === activeCategory;
                    }).map((game) => {
                        const isRestricted = disabledGamesList.includes(game.id);
                        const isImmune = username === 'Vincent' || username === 'Test' || currency.adminModeActive;
                        const isDisabled = isRestricted && !isImmune;
                        
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
                                {!isDisabled && <div className={`absolute inset-0 ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>}
                                
                                {isDisabled && (
                                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
                                        <div className="bg-red-900/90 text-red-200 font-black text-[9px] px-2 py-1 rounded border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transform -rotate-12 animate-pulse flex items-center gap-1">
                                            <Lock size={10} /> DÉSACTIVÉ
                                        </div>
                                    </div>
                                )}

                                <div className="w-full flex justify-end gap-1 relative z-10">
                                    {isRestricted && isImmune && (
                                        <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)]" title="Désactivé pour les joueurs (Admin Bypass)">
                                            OFF
                                        </div>
                                    )}
                                    {game.badges.new && !isDisabled && <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse" title="Nouveau Jeu">NEW</div>}
                                    {game.badges.online && <div className="p-1 rounded bg-black/40 text-green-400 border border-green-500/30" title="En Ligne"><Globe size={10} /></div>}
                                    {game.badges.vs && <div className="p-1 rounded bg-black/40 text-pink-400 border border-pink-500/30" title="Versus"><Users size={10} /></div>}
                                </div>
                                <div className={`p-2 rounded-lg bg-gray-900/50 ${!isDisabled ? game.color : 'text-gray-500'} ${!isDisabled && 'group-hover:scale-110'} transition-transform relative z-10 shadow-lg border border-white/5`}>
                                    <game.icon size={32} />
                                    {!isAuthenticated && !isDisabled && <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/30"><Lock size={10} className="text-white"/></div>}
                                </div>
                                <div className="text-center relative z-10 w-full">
                                    <h3 className={`font-black italic text-sm tracking-wider text-white ${!isDisabled && `group-hover:${game.color}`} transition-colors uppercase`}>{game.name}</h3>
                                    {game.reward && !isDisabled && <div className="flex items-center justify-center gap-1 mt-0.5 opacity-60 text-[8px] font-mono text-gray-300"><Coins size={8} className="text-yellow-500" /><span>{game.reward}</span></div>}
                                </div>
                            </button>
                        );
                    })}
                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">v2.8 • EVENTS UPDATE</div>
             </div>
        </div>
    );
}
