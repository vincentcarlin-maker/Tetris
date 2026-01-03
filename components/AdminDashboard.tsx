
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, RefreshCcw, X, Shield, LogOut } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { OnlineUser } from '../hooks/useSupabase';
import { useGlobal } from '../context/GlobalContext';

// Import des sous-composants extraits
import { AdminSidebar, SECTIONS } from './admin/AdminSidebar';
import { DashboardSection } from './admin/DashboardSection';
import { UsersSection } from './admin/UsersSection';
import { GamesSection } from './admin/GamesSection';
import { EventsSection } from './admin/EventsSection';
import { NotificationsSection } from './admin/NotificationsSection';
import { EconomySection } from './admin/EconomySection';
import { ConfigSection } from './admin/ConfigSection';
import { FlagsSection } from './admin/FlagsSection';
import { DataSection } from './admin/DataSection';
import { NeonSeekGenSection } from './admin/NeonSeekGenSection';

interface AdminDashboardProps {
    onBack: () => void;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, mp, onlineUsers }) => {
    const { disabledGames, setDisabledGames } = useGlobal();
    const [activeSection, setActiveSection] = useState('DASHBOARD');
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);

    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('neon_feature_flags') || JSON.stringify({
                maintenance_mode: false,
                social_module: true,
                economy_system: true,
                beta_games: false,
                global_chat: true
            }));
        } catch {
            return { maintenance_mode: false, social_module: true, economy_system: true, beta_games: false, global_chat: true };
        }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        let data: any[] = [];
        if (isSupabaseConfigured) {
            try { 
                data = await DB.getFullAdminExport(); 
                const config = await DB.getSystemConfig();
                if (config?.disabledGames) setDisabledGames(config.disabledGames);
            } catch (e) { console.error(e); }
        }
        if (data.length === 0) {
            const usersDbStr = localStorage.getItem('neon_users_db');
            if (usersDbStr) {
                try {
                    const usersDb = JSON.parse(usersDbStr);
                    Object.keys(usersDb).forEach(username => {
                        const userDataStr = localStorage.getItem('neon_data_' + username);
                        if (userDataStr) {
                            data.push({ username, data: JSON.parse(userDataStr), updated_at: new Date().toISOString() });
                        }
                    });
                } catch {}
            }
        }
        setProfiles(data.filter(u => u.username !== 'SYSTEM_CONFIG'));
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[200] w-full h-[100dvh] bg-black text-white font-sans flex overflow-hidden">
            
            {/* SIDEBAR (Desktop) */}
            <AdminSidebar 
                activeSection={activeSection} 
                onSelectSection={setActiveSection} 
                onLogout={onBack} 
            />

            {/* MOBILE NAVIGATION BLOCK (Header + Tabs) */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-gray-900/95 backdrop-blur-xl border-b border-white/10 z-[210] flex flex-col">
                <div className="h-[env(safe-area-inset-top)] w-full"></div>
                
                {/* Title Bar */}
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                        <Shield size={20} className="text-blue-400 drop-shadow-[0_0_8px_#00f3ff]" />
                        <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 uppercase tracking-tighter text-lg">ADMIN CONSOLE</span>
                    </div>
                    <button 
                        onClick={onBack} 
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white active:bg-red-500 transition-all shadow-lg active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs Bar (Mobile) */}
                <div className="flex overflow-x-auto px-4 pb-3 gap-2 no-scrollbar scroll-smooth">
                    {SECTIONS.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => setActiveSection(s.id)} 
                            className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all active:scale-95 border ${
                                activeSection === s.id 
                                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                : 'bg-black/40 text-gray-500 border-white/5'
                            }`}
                        >
                            {s.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-gray-900 to-black relative">
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pt-40 md:pt-8 pb-10">
                     <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase italic">
                            {React.createElement(SECTIONS.find(s=>s.id===activeSection)?.icon || LayoutGrid, {size: 28, className: "text-blue-400"})} 
                            {SECTIONS.find(s=>s.id===activeSection)?.label}
                        </h2>
                        <button 
                            onClick={() => loadData()}
                            className="hidden md:flex px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-white/10 items-center gap-2 text-xs font-bold transition-all active:scale-95"
                        >
                            <RefreshCcw size={14} className={loading ? "animate-spin" : ""}/> RAFRAÎCHIR
                        </button>
                    </div>

                    <div className="animate-in fade-in duration-500">
                        {activeSection === 'DASHBOARD' && <DashboardSection profiles={profiles} onlineUsers={onlineUsers} />}
                        {activeSection === 'NEON_GEN' && <NeonSeekGenSection mp={mp} />}
                        {activeSection === 'USERS' && <UsersSection profiles={profiles} setProfiles={setProfiles} onlineUsers={onlineUsers} mp={mp} />}
                        {activeSection === 'GAMES' && <GamesSection disabledGames={disabledGames} setDisabledGames={setDisabledGames} mp={mp} />}
                        {activeSection === 'EVENTS' && <EventsSection mp={mp} />}
                        {activeSection === 'NOTIFICATIONS' && <NotificationsSection mp={mp} />}
                        {activeSection === 'ECONOMY' && <EconomySection profiles={profiles} />}
                        {activeSection === 'STATS' && <DashboardSection profiles={profiles} onlineUsers={onlineUsers} detailed />}
                        {activeSection === 'CONFIG' && <ConfigSection />}
                        {activeSection === 'FLAGS' && <FlagsSection featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} mp={mp} />}
                        {activeSection === 'DATA' && <DataSection profiles={profiles} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
