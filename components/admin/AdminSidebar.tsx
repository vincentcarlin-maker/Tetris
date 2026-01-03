
import React from 'react';
import { LayoutGrid, Bell, Coins, Gamepad2, Users, BarChart2, Settings, Flag, Calendar, Database, LogOut, Terminal, Image } from 'lucide-react';

export const SECTIONS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'NEON_GEN', label: 'Générateur Seek', icon: Image },
    { id: 'NOTIFICATIONS', label: 'Communication', icon: Bell },
    { id: 'ECONOMY', label: 'Économie', icon: Coins },
    { id: 'GAMES', label: 'Gestion Jeux', icon: Gamepad2 },
    { id: 'USERS', label: 'Console Joueurs', icon: Terminal },
    { id: 'STATS', label: 'Statistiques', icon: BarChart2 },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'FLAGS', label: 'Feature Flags', icon: Flag },
    { id: 'EVENTS', label: 'Événements', icon: Calendar },
    { id: 'DATA', label: 'Données', icon: Database },
];

interface AdminSidebarProps {
    activeSection: string;
    onSelectSection: (id: string) => void;
    onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSelectSection, onLogout }) => (
    <div className="w-64 bg-gray-900 border-r border-white/10 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ADMIN PANEL</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-1">v3.4.0 • SYSTEM: ONLINE</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {SECTIONS.map(s => (
                <button 
                    key={s.id}
                    onClick={() => onSelectSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <s.icon size={18} /> {s.label}
                </button>
            ))}
        </div>
        <div className="p-4 border-t border-white/10">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-900/20 transition-all">
                <LogOut size={18} /> QUITTER
            </button>
        </div>
    </div>
);
