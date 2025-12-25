
import React from 'react';
import { 
    LayoutGrid, Globe, Gamepad2, Puzzle, Trophy, Hexagon, 
    Crosshair, Activity, Rocket, Ghost, Wind, Brain, 
    BrainCircuit, Sparkles, Ship, Crown
} from 'lucide-react';

// --- CUSTOM ICONS ---
export const CustomTetrisIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("rect", { x: "2", y: "6", width: "6", height: "6", rx: "1.5" }),
        React.createElement("rect", { x: "9", y: "6", width: "6", height: "6", rx: "1.5" }),
        React.createElement("rect", { x: "16", y: "6", width: "6", height: "6", rx: "1.5" }),
        React.createElement("rect", { x: "9", y: "13", width: "6", height: "6", rx: "1.5" })
    );

export const CustomSnakeIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M4 20h4a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 0-2-2V6a2 2 0 0 0-2-2H9" }),
        React.createElement("circle", { cx: "8", cy: "4", r: "2" })
    );

export const CustomSlitherIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10" }),
        React.createElement("path", { d: "M12 12c-2 0-4 1.5-4 4s2 4 4 4 4-1.5 4-4" }),
        React.createElement("circle", { cx: "12", cy: "7", r: "1" }),
        React.createElement("circle", { cx: "12", cy: "12", r: "1" })
    );

export const CustomUnoIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("rect", { x: "4", y: "6", width: "8.5", height: "13", rx: "1.5", transform: "rotate(-20 8.25 18)", fill: "#ef4444", stroke: "#ef4444", fillOpacity: "0.3" }),
        React.createElement("rect", { x: "6.5", y: "5", width: "8.5", height: "13", rx: "1.5", transform: "rotate(-5 10.75 18)", fill: "#3b82f6", stroke: "#3b82f6", fillOpacity: "0.3" }),
        React.createElement("rect", { x: "9", y: "5", width: "8.5", height: "13", rx: "1.5", transform: "rotate(10 13.25 18)", fill: "#22c55e", stroke: "#22c55e", fillOpacity: "0.3" }),
        React.createElement("rect", { x: "11.5", y: "6", width: "8.5", height: "13", rx: "1.5", transform: "rotate(20 15.75 18)", fill: "#eab308", stroke: "#eab308", fillOpacity: "0.3" }),
        React.createElement("ellipse", { cx: "15.75", cy: "12.5", rx: "2", ry: "3.5", transform: "rotate(20 15.75 12.5)", fill: "none", stroke: "rgba(255,255,255,0.5)" })
    );

export const CustomConnect4Icon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M4 21v-2", stroke: "#6b7280" }),
        React.createElement("path", { d: "M20 21v-2", stroke: "#6b7280" }),
        React.createElement("rect", { x: "2", y: "3", width: "20", height: "17", rx: "2", stroke: "#4b5563", fill: "#1f2937" }),
        React.createElement("circle", { cx: "7", cy: "8", r: "1.5", fill: "#374151", stroke: "none" }),
        React.createElement("circle", { cx: "12", cy: "8", r: "1.5", fill: "#374151", stroke: "none" }),
        React.createElement("circle", { cx: "17", cy: "8", r: "1.5", fill: "#374151", stroke: "none" }),
        React.createElement("circle", { cx: "7", cy: "13", r: "1.5", fill: "#ec4899", stroke: "none" }),
        React.createElement("circle", { cx: "12", cy: "13", r: "1.5", fill: "#374151", stroke: "none" }),
        React.createElement("circle", { cx: "17", cy: "13", r: "1.5", fill: "#06b6d4", stroke: "none" }),
        React.createElement("circle", { cx: "7", cy: "17.5", r: "1.5", fill: "#06b6d4", stroke: "none" }),
        React.createElement("circle", { cx: "12", cy: "17.5", r: "1.5", fill: "#ec4899", stroke: "none" }),
        React.createElement("circle", { cx: "17", cy: "17.5", r: "1.5", fill: "#ec4899", stroke: "none" })
    );

export const CustomBreakerIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("rect", { x: "2", y: "3", width: "6", height: "4", rx: "1" }),
        React.createElement("rect", { x: "9", y: "3", width: "6", height: "4", rx: "1" }),
        React.createElement("rect", { x: "16", y: "3", width: "6", height: "4", rx: "1" }),
        React.createElement("rect", { x: "2", y: "8", width: "6", height: "4", rx: "1" }),
        React.createElement("rect", { x: "16", y: "8", width: "6", height: "4", rx: "1" }),
        React.createElement("circle", { cx: "12", cy: "15", r: "2", fill: "currentColor" }),
        React.createElement("path", { d: "M4 20h16", strokeWidth: "2.5" })
    );

export const CustomNeonMixIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M3 11v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-6", fill: "#facc15", stroke: "none" }),
        React.createElement("path", { d: "M3 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2", stroke: "#ffffff", strokeOpacity: "0.9" }),
        React.createElement("path", { d: "M10 6v11a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-11", fill: "#22d3ee", stroke: "none" }),
        React.createElement("path", { d: "M10 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2", stroke: "#ffffff", strokeOpacity: "0.9" }),
        React.createElement("path", { d: "M17 14v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3", fill: "#e879f9", stroke: "none" }),
        React.createElement("path", { d: "M17 2v15a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2", stroke: "#ffffff", strokeOpacity: "0.9" })
    );

export const CustomStackIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
        React.createElement("path", { d: "M2 17l10 5 10-5" }),
        React.createElement("path", { d: "M2 12l10 5 10-5" })
    );


// --- CONFIGURATIONS ---

export const GAMES_CONFIG = [
    { id: 'slither', category: 'ARCADE', name: 'CYBER SERPENT', icon: CustomSlitherIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'lumen', category: 'PUZZLE', name: 'LUMEN ORDER', icon: Hexagon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'skyjo', category: 'STRATEGY', name: 'NEON SKYJO', icon: LayoutGrid, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30', hoverBorder: 'hover:border-purple-400', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]', glow: 'rgba(168,85,247,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'arenaclash', category: 'ARCADE', name: 'ARENA CLASH', icon: Crosshair, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-400', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'stack', category: 'ARCADE', name: 'STACK', icon: CustomStackIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'tetris', category: 'ARCADE', name: 'TETRIS', icon: CustomTetrisIcon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'runner', category: 'ARCADE', name: 'NEON RUN', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', hoverBorder: 'hover:border-orange-400', shadow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]', glow: 'rgba(251,146,60,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'watersort', category: 'PUZZLE', name: 'NEON MIX', icon: CustomNeonMixIcon, color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]', glow: 'rgba(244,114,182,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'checkers', category: 'STRATEGY', name: 'DAMES', icon: Crown, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-500/30', hoverBorder: 'hover:border-teal-400', shadow: 'hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]', glow: 'rgba(45,212,191,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'uno', category: 'STRATEGY', name: 'UNO', icon: CustomUnoIcon, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-500', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'snake', category: 'ARCADE', name: 'SNAKE', icon: CustomSnakeIcon, color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-500/30', hoverBorder: 'hover:border-green-500', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]', glow: 'rgba(34,197,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'invaders', category: 'ARCADE', name: 'INVADERS', icon: Rocket, color: 'text-rose-500', bg: 'bg-rose-900/20', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500', shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', glow: 'rgba(244,63,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'breaker', category: 'ARCADE', name: 'BREAKER', icon: CustomBreakerIcon, color: 'text-fuchsia-500', bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-500/30', hoverBorder: 'hover:border-fuchsia-500', shadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]', glow: 'rgba(217,70,239,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'pacman', category: 'ARCADE', name: 'PACMAN', icon: Ghost, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS' },
    { id: 'airhockey', category: 'ARCADE', name: 'AIR HOCKEY', icon: Wind, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS' },
    { id: 'sudoku', category: 'PUZZLE', name: 'SUDOKU', icon: Brain, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: '50' },
    { id: 'mastermind', category: 'PUZZLE', name: 'MASTERMIND', icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'connect4', category: 'STRATEGY', name: 'CONNECT 4', icon: CustomConnect4Icon, color: 'text-pink-500', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-500', shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', glow: 'rgba(236,72,153,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: '30' },
    { id: 'memory', category: 'PUZZLE', name: 'MEMORY', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]', glow: 'rgba(167,139,250,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
    { id: 'battleship', category: 'STRATEGY', name: 'BATAILLE', icon: Ship, color: 'text-blue-500', bg: 'bg-blue-900/20', border: 'border-blue-500/30', hoverBorder: 'hover:border-blue-500', shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', glow: 'rgba(59,130,246,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS' },
];

export const CATEGORIES = [
    { id: 'ALL', label: 'TOUT', icon: LayoutGrid },
    { id: 'ONLINE', label: 'EN LIGNE', icon: Globe },
    { id: 'ARCADE', label: 'ARCADE', icon: Gamepad2 },
    { id: 'PUZZLE', label: 'RÉFLEXION', icon: Puzzle },
    { id: 'STRATEGY', label: 'STRATÉGIE', icon: Trophy },
];

export const LEADERBOARD_GAMES = [
    { id: 'slither', label: 'SERPENT', unit: 'pts', type: 'high', color: 'text-indigo-400' },
    { id: 'lumen', label: 'LUMEN', unit: 'pts', type: 'high', color: 'text-cyan-400' },
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
