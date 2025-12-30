
import React from 'react';
import { 
    LayoutGrid, Globe, Gamepad2, Puzzle, Trophy, Hexagon, 
    Crosshair, Activity, Rocket, Ghost, Wind, Brain, 
    BrainCircuit, Sparkles, Ship, Crown, Search
} from 'lucide-react';

// --- CUSTOM ICONS ---
export const CustomTetrisIcon = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("rect", { x: "2", y: "15", width: "6", height: "6", rx: "1", fill: "#00f3ff", fillOpacity: "0.2", stroke: "#00f3ff" }),
        React.createElement("rect", { x: "9", y: "15", width: "6", height: "6", rx: "1", fill: "#9d00ff", fillOpacity: "0.2", stroke: "#9d00ff" }),
        React.createElement("rect", { x: "16", y: "15", width: "6", height: "6", rx: "1", fill: "#ff00ff", fillOpacity: "0.2", stroke: "#ff00ff" }),
        React.createElement("rect", { x: "9", y: "8", width: "6", height: "6", rx: "1", fill: "#9d00ff", fillOpacity: "0.2", stroke: "#9d00ff" })
    );

export const CustomSnakeIcon = ({ size, className }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className },
        React.createElement("path", { d: "M4 20h4a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 0-2-2V6a2 2 0 0 0-2-2H9" }),
        React.createElement("circle", { cx: "8", cy: "4", r: "2" })
    );

export const CustomCyberSerpentIcon = ({ size = "100%", className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "cs-neonGlow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "12", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("linearGradient", { id: "cs-neonBody", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#22D3EE" }),
          React.createElement("stop", { offset: "100%", stopColor: "#4ADE80" })
        ),
        React.createElement("linearGradient", { id: "cs-darkBg", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#0F172A" }),
          React.createElement("stop", { offset: "100%", stopColor: "#1E293B" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "url(#cs-darkBg)" }),
      React.createElement("path", { d: "M0 128H512M0 256H512M0 384H512M128 0V512M256 0V512M384 0V512", stroke: "#1E293B", strokeWidth: "2", opacity: "0.5" }),
      React.createElement("circle", { cx: "100", cy: "110", r: "8", fill: "#FACC15", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "430", cy: "120", r: "6", fill: "#F472B6", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "80", cy: "400", r: "10", fill: "#22D3EE", filter: "url(#cs-neonGlow)" }),
      React.createElement("g", { id: "cs-neon-slither" },
        React.createElement("g", { filter: "url(#cs-neonGlow)" },
          React.createElement("circle", { cx: "130", cy: "380", r: "35", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "175", cy: "325", r: "38", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "235", cy: "290", r: "42", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" }),
          React.createElement("circle", { cx: "310", cy: "265", r: "48", stroke: "url(#cs-neonBody)", strokeWidth: "6", fill: "none" })
        ),
        React.createElement("circle", { cx: "130", cy: "380", r: "35", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "175", cy: "325", r: "38", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "235", cy: "290", r: "42", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("circle", { cx: "310", cy: "265", r: "48", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "2" }),
        React.createElement("g", { id: "cs-head-group" },
          React.createElement("circle", { cx: "385", cy: "215", r: "62", stroke: "url(#cs-neonBody)", strokeWidth: "8", fill: "none", filter: "url(#cs-neonGlow)" }),
          React.createElement("circle", { cx: "385", cy: "215", r: "62", fill: "#0F172A", stroke: "url(#cs-neonBody)", strokeWidth: "3" }),
          React.createElement("g", { id: "cs-eyes-fixed" },
            React.createElement("circle", { cx: "360", cy: "185", r: "24", fill: "#0F172A" }),
            React.createElement("circle", { cx: "360", cy: "185", r: "20", stroke: "#22D3EE", strokeWidth: "2", fill: "none" }),
            React.createElement("circle", { cx: "358", cy: "182", r: "8", fill: "#22D3EE", filter: "url(#cs-neonGlow)" }),
            React.createElement("circle", { cx: "415", cy: "205", r: "24", fill: "#0F172A" }),
            React.createElement("circle", { cx: "415", cy: "205", r: "20", stroke: "#22D3EE", strokeWidth: "2", fill: "none" }),
            React.createElement("circle", { cx: "418", cy: "202", r: "8", fill: "#22D3EE", filter: "url(#cs-neonGlow)" })
          ),
          React.createElement("path", { d: "M370 240 A 30 30 0 0 0 410 245", stroke: "white", strokeWidth: "4", strokeLinecap: "round", strokeOpacity: "0.2" })
        )
      ),
      React.createElement("circle", { cx: "350", cy: "400", r: "2", fill: "#4ADE80", filter: "url(#cs-neonGlow)" }),
      React.createElement("circle", { cx: "200", cy: "150", r: "1.5", fill: "#22D3EE", filter: "url(#cs-neonGlow)" })
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

export const CustomAirHockeyIcon = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => 
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg", className },
      React.createElement("defs", null,
        React.createElement("filter", { id: "ah-glow", x: "-100%", y: "-100%", width: "300%", height: "300%" },
          React.createElement("feGaussianBlur", { stdDeviation: "15", result: "blur" }),
          React.createElement("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
        ),
        React.createElement("filter", { id: "ah-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%" },
          React.createElement("feDropShadow", { dx: "0", dy: "15", stdDeviation: "12", floodOpacity: "0.5" })
        ),
        React.createElement("linearGradient", { id: "ah-tableBg", x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
          React.createElement("stop", { offset: "0%", stopColor: "#0F172A" }),
          React.createElement("stop", { offset: "100%", stopColor: "#1E293B" })
        ),
        React.createElement("radialGradient", { id: "ah-strikerBody", cx: "40%", cy: "30%", r: "70%" },
          React.createElement("stop", { offset: "0%", stopColor: "#38BDF8" }),
          React.createElement("stop", { offset: "70%", stopColor: "#0369A1" }),
          React.createElement("stop", { offset: "100%", stopColor: "#082F49" })
        ),
        React.createElement("radialGradient", { id: "ah-puckBody", cx: "40%", cy: "30%", r: "70%" },
          React.createElement("stop", { offset: "0%", stopColor: "#F87171" }),
          React.createElement("stop", { offset: "80%", stopColor: "#B91C1C" }),
          React.createElement("stop", { offset: "100%", stopColor: "#7F1D1D" })
        )
      ),
      React.createElement("rect", { width: "512", height: "512", rx: "108", fill: "url(#ah-tableBg)" }),
      React.createElement("rect", { x: "40", y: "40", width: "432", height: "432", rx: "20", stroke: "#334155", strokeWidth: "2", fill: "none", opacity: "0.3" }),
      React.createElement("circle", { cx: "256", cy: "256", r: "160", stroke: "#334155", strokeWidth: "4", fill: "none", opacity: "0.2" }),
      React.createElement("line", { x1: "256", y1: "40", x2: "256", y2: "472", stroke: "#334155", strokeWidth: "2", strokeDasharray: "12 8" }),
      React.createElement("g", { filter: "url(#ah-shadow)" },
        React.createElement("circle", { cx: "380", cy: "350", r: "45", fill: "url(#ah-puckBody)", filter: "url(#ah-glow)" }),
        React.createElement("circle", { cx: "380", cy: "350", r: "38", stroke: "white", strokeWidth: "2", strokeOpacity: "0.3", fill: "none" }),
        React.createElement("ellipse", { cx: "365", cy: "335", rx: "15", ry: "8", fill: "white", fillOpacity: "0.25", transform: "rotate(-30, 365, 335)" })
      ),
      React.createElement("g", { filter: "url(#ah-shadow)" },
        React.createElement("circle", { cx: "210", cy: "240", r: "95", fill: "url(#ah-strikerBody)", filter: "url(#ah-glow)" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "65", fill: "#0EA5E9", stroke: "#0369A1", strokeWidth: "3" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "35", fill: "#0C4A6E" }),
        React.createElement("circle", { cx: "210", cy: "240", r: "28", fill: "url(#ah-strikerBody)" }),
        React.createElement("path", { d: "M145 240 A 65 65 0 0 1 210 175", stroke: "white", strokeWidth: "6", strokeLinecap: "round", strokeOpacity: "0.4" }),
        React.createElement("circle", { cx: "180", cy: "210", r: "4", fill: "white", fillOpacity: "0.6" })
      ),
      React.createElement("circle", { cx: "320", cy: "290", r: "2.5", fill: "#38BDF8", opacity: "0.4" }),
      React.createElement("circle", { cx: "300", cy: "360", r: "2", fill: "#F87171", opacity: "0.4" })
    );

// --- CONFIGURATIONS ---

export const GAMES_CONFIG = [
    { id: 'slither', category: 'ARCADE', name: 'CYBER SERPENT', icon: CustomCyberSerpentIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'neon_seek', category: 'PUZZLE', name: 'NEON SEEK', icon: Search, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: true }, reward: 'GAINS', beta: false },
    { id: 'lumen', category: 'PUZZLE', name: 'LUMEN ORDER', icon: Hexagon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: true },
    { id: 'skyjo', category: 'STRATEGY', name: 'NEON SKYJO', icon: LayoutGrid, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30', hoverBorder: 'hover:border-purple-400', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]', glow: 'rgba(168,85,247,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'arenaclash', category: 'ARCADE', name: 'ARENA CLASH', icon: Crosshair, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-400', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: true },
    { id: 'stack', category: 'ARCADE', name: 'STACK', icon: CustomStackIcon, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'tetris', category: 'ARCADE', name: 'TETRIS', icon: CustomTetrisIcon, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', hoverBorder: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]', glow: 'rgba(34,211,238,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'runner', category: 'ARCADE', name: 'NEON RUN', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', hoverBorder: 'hover:border-orange-400', shadow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]', glow: 'rgba(251,146,60,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'watersort', category: 'PUZZLE', name: 'NEON MIX', icon: CustomNeonMixIcon, color: 'text-pink-400', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]', glow: 'rgba(244,114,182,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'checkers', category: 'STRATEGY', name: 'DAMES', icon: Crown, color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-500/30', hoverBorder: 'hover:border-teal-400', shadow: 'hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]', glow: 'rgba(45,212,191,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'uno', category: 'STRATEGY', name: 'UNO', icon: CustomUnoIcon, color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30', hoverBorder: 'hover:border-red-500', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]', glow: 'rgba(239,68,68,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'snake', category: 'ARCADE', name: 'SNAKE', icon: CustomSnakeIcon, color: 'text-green-500', bg: 'bg-green-900/20', border: 'border-green-500/30', hoverBorder: 'hover:border-green-500', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]', glow: 'rgba(34,197,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'invaders', category: 'ARCADE', name: 'INVADERS', icon: Rocket, color: 'text-rose-500', bg: 'bg-rose-900/20', border: 'border-rose-500/30', hoverBorder: 'hover:border-rose-500', shadow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]', glow: 'rgba(244,63,94,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'breaker', category: 'ARCADE', name: 'BREAKER', icon: CustomBreakerIcon, color: 'text-fuchsia-500', bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-500/30', hoverBorder: 'hover:border-fuchsia-500', shadow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]', glow: 'rgba(217,70,239,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'pacman', category: 'ARCADE', name: 'PACMAN', icon: Ghost, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', hoverBorder: 'hover:border-yellow-400', shadow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]', glow: 'rgba(250,204,21,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'airhockey', category: 'ARCADE', name: 'AIR HOCKEY', icon: CustomAirHockeyIcon, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: 'GAINS', beta: false },
    { id: 'sudoku', category: 'PUZZLE', name: 'SUDOKU', icon: Brain, color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-500/30', hoverBorder: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]', glow: 'rgba(56,189,248,0.8)', badges: { solo: true, online: false, vs: false, new: false }, reward: '50', beta: false },
    { id: 'mastermind', category: 'PUZZLE', name: 'MASTERMIND', icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', hoverBorder: 'hover:border-indigo-400', shadow: 'hover:shadow-[0_0_20px_rgba(129,140,248,0.3)]', glow: 'rgba(129,140,248,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'connect4', category: 'STRATEGY', name: 'CONNECT 4', icon: CustomConnect4Icon, color: 'text-pink-500', bg: 'bg-pink-900/20', border: 'border-pink-500/30', hoverBorder: 'hover:border-pink-500', shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]', glow: 'rgba(236,72,153,0.8)', badges: { solo: true, online: true, vs: true, new: false }, reward: '30', beta: false },
    { id: 'memory', category: 'PUZZLE', name: 'MEMORY', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-500/30', hoverBorder: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]', glow: 'rgba(167,139,250,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
    { id: 'battleship', category: 'STRATEGY', name: 'BATAILLE', icon: Ship, color: 'text-blue-500', bg: 'bg-blue-900/20', border: 'border-blue-500/30', hoverBorder: 'hover:border-blue-500', shadow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]', glow: 'rgba(59,130,246,0.8)', badges: { solo: true, online: true, vs: false, new: false }, reward: 'GAINS', beta: false },
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
