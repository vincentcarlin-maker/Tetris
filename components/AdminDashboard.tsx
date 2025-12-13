
import React, { useState, useEffect } from 'react';
import { Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, Trash2, Ban, AlertTriangle, Check } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';
import { AVATARS_CATALOG, FRAMES_CATALOG } from '../hooks/useCurrency';

interface AdminDashboardProps {
    onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'GAMES'>('OVERVIEW');
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    
    // Action Confirmation State
    const [confirmAction, setConfirmAction] = useState<{ type: 'DELETE' | 'BAN' | 'UNBAN', username: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!isSupabaseConfigured) {
            // Mock data for demo/offline - Increased count and recent bias for better graph visuals
            const mockProfiles = Array.from({ length: 50 }).map((_, i) => ({
                username: `Player_${i + 1}`,
                // Distribute updates over the last 7 days primarily
                updated_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
                data: {
                    coins: Math.floor(Math.random() * 5000),
                    highScores: {
                        tetris: Math.floor(Math.random() * 20000),
                        snake: Math.floor(Math.random() * 50),
                        pacman: Math.floor(Math.random() * 10000)
                    },
                    avatarId: 'av_bot',
                    frameId: 'fr_none',
                    inventory: [],
                    ownedAvatars: [],
                    ownedFrames: [],
                    banned: false // Mock banned status
                }
            }));
            setProfiles(mockProfiles);
            return;
        }

        setLoading(true);
        const data = await DB.getFullAdminExport();
        setProfiles(data);
        setLoading(false);
    };

    // --- AGGREGATION LOGIC ---
    const totalUsers = profiles.length;
    
    // Active today
    const now = new Date();
    const activeToday = profiles.filter(p => {
        const d = new Date(p.updated_at);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Calculate Last 7 Days Activity for Graph
    const getConnectionStats = () => {
        const stats: number[] = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() - i);
            
            const count = profiles.filter(p => {
                const pDate = new Date(p.updated_at);
                return pDate.getDate() === targetDate.getDate() &&
                       pDate.getMonth() === targetDate.getMonth() &&
                       pDate.getFullYear() === targetDate.getFullYear();
            }).length;
            
            stats.push(count);
        }
        return stats;
    };

    const connectionStats = getConnectionStats();
    const maxConnectionCount = Math.max(...connectionStats, 5); // Minimum scale of 5 to avoid flat graph if values are low

    // Total Economy (Excluding Admin 'Vincent')
    const totalCoins = profiles.reduce((acc, p) => {
        if (p.username === 'Vincent') return acc;
        return acc + (p.data?.coins || 0);
    }, 0);

    // Game Popularity (Count users who have a score > 0)
    const gameStats: Record<string, number> = {};
    const gameNames = ['tetris', 'snake', 'pacman', 'breaker', '2048', 'sudoku', 'memory', 'uno'];
    
    gameNames.forEach(game => {
        gameStats[game] = profiles.filter(p => {
            const scores = p.data?.highScores;
            if (!scores) return false;
            if (typeof scores[game] === 'object') return true; // Sudoku has object structure
            return (scores[game] || 0) > 0;
        }).length;
    });

    const maxGamePlay = Math.max(...Object.values(gameStats), 1);

    // Filter Users
    const filteredUsers = profiles.filter(p => 
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- ACTIONS ---
    const handleAction = async () => {
        if (!confirmAction) return;
        const { type, username } = confirmAction;

        if (type === 'DELETE') {
            if (isSupabaseConfigured) {
                await DB.deleteUser(username);
            }
            // Update local state
            setProfiles(prev => prev.filter(p => p.username !== username));
            if (selectedUser?.username === username) setSelectedUser(null);
        } else if (type === 'BAN' || type === 'UNBAN') {
            const isBanned = type === 'BAN';
            if (isSupabaseConfigured) {
                await DB.updateUserData(username, { banned: isBanned });
            }
            // Update local state
            setProfiles(prev => prev.map(p => {
                if (p.username === username) {
                    return { ...p, data: { ...p.data, banned: isBanned } };
                }
                return p;
            }));
            // Update selected user view if open
            if (selectedUser?.username === username) {
                setSelectedUser(prev => ({ ...prev, data: { ...prev.data, banned: isBanned } }));
            }
        }
        setConfirmAction(null);
    };

    const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
        <div className={`bg-gray-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-lg relative overflow-hidden group hover:border-${color}-500/50 transition-all`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>
            <div className={`p-3 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">{title}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
        </div>
    );

    // Helper to render user details
    const renderUserDetails = () => {
        if (!selectedUser) return null;
        
        const avatar = AVATARS_CATALOG.find(a => a.id === selectedUser.data?.avatarId) || AVATARS_CATALOG[0];
        const AvatarIcon = avatar.icon;
        const frame = FRAMES_CATALOG.find(f => f.id === selectedUser.data?.frameId) || FRAMES_CATALOG[0];
        const scores = selectedUser.data?.highScores || {};
        const isBanned = selectedUser.data?.banned === true;

        return (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center sm:p-4 animate-in fade-in zoom-in duration-200" onClick={() => setSelectedUser(null)}>
                {/* Modale plein écran sur mobile (h-full rounded-none), popup sur desktop (sm:h-auto sm:rounded-2xl) */}
                <div className="bg-gray-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl border-0 sm:border border-white/20 shadow-2xl overflow-hidden relative flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 flex justify-between items-start shrink-0 relative overflow-hidden">
                        {isBanned && <div className="absolute inset-0 bg-red-500/10 pointer-events-none flex items-center justify-center"><span className="text-6xl font-black text-red-500/20 -rotate-12 select-none">BANNI</span></div>}
                        <div className="flex gap-4 items-center relative z-10">
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-4 ${frame.cssClass}`}>
                                <AvatarIcon size={32} className={`${avatar.color} sm:w-10 sm:h-10`} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-white italic flex items-center gap-2">
                                    {selectedUser.username}
                                    {isBanned && <Ban size={20} className="text-red-500" />}
                                </h2>
                                <p className="text-[10px] sm:text-xs text-gray-400 font-mono mt-1 mb-2">ID: {selectedUser.username}</p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold">
                                        LVL {Math.floor(((selectedUser.data?.inventory?.length || 0) / 3) + 1)}
                                    </span>
                                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                                        <Coins size={10} /> {selectedUser.data?.coins || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"><X size={20} className="text-gray-400 hover:text-white"/></button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                        
                        {/* Activity Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Dernière Connexion</span>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-gray-300 truncate">
                                    <Clock size={14}/> {new Date(selectedUser.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Progression</span>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-gray-300">
                                    <Trophy size={14}/> {(selectedUser.data?.inventory?.length || 0)} Badges
                                </div>
                            </div>
                        </div>

                        {/* Scores */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Activity size={16} className="text-green-400"/> PERFORMANCES & SCORES</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Object.entries(scores).map(([game, score]: [string, any]) => {
                                    if (typeof score === 'object') return null; 
                                    if (score === 0) return null;
                                    return (
                                        <div key={game} className="bg-gray-800/50 p-2 rounded border border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase truncate w-full">{game}</span>
                                            <span className="text-xs sm:text-sm font-mono text-white text-right">{score}</span>
                                        </div>
                                    );
                                })}
                                {/* Handle Sudoku specifically if it exists */}
                                {scores.sudoku && (
                                    <div className="bg-gray-800/50 p-2 rounded border border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase truncate">SUDOKU (Moy)</span>
                                        <span className="text-xs sm:text-sm font-mono text-white text-right">{scores.sudoku.medium || '-'}</span>
                                    </div>
                                )}
                            </div>
                            {Object.keys(scores).length === 0 && <p className="text-gray-500 text-xs italic">Aucun score enregistré.</p>}
                        </div>

                        {/* Raw Data Preview (Debug) */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Database size={16} className="text-purple-400"/> DONNÉES BRUTES</h3>
                            <div className="bg-black p-3 rounded-lg border border-white/10 font-mono text-[10px] text-gray-400 h-32 overflow-y-auto custom-scrollbar">
                                <pre>{JSON.stringify(selectedUser.data, null, 2)}</pre>
                            </div>
                        </div>

                        {/* DANGER ZONE */}
                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={16}/> ZONE DE DANGER</h3>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmAction({ type: isBanned ? 'UNBAN' : 'BAN', username: selectedUser.username })}
                                    className={`flex-1 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${isBanned ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 border border-orange-600/50'}`}
                                >
                                    {isBanned ? <><Check size={14}/> DÉBANNIR</> : <><Ban size={14}/> BANNIR</>}
                                </button>
                                <button 
                                    onClick={() => setConfirmAction({ type: 'DELETE', username: selectedUser.username })}
                                    className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                    <Trash2 size={14}/> SUPPRIMER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-black/90 text-white font-sans overflow-hidden flex flex-col">
            {renderUserDetails()}

            {/* CONFIRMATION MODAL */}
            {confirmAction && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200" onClick={() => setConfirmAction(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-white/20 p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className={`mx-auto mb-4 ${confirmAction.type === 'DELETE' ? 'text-red-500' : 'text-orange-500'}`} />
                        <h3 className="text-xl font-black text-center text-white mb-2">CONFIRMATION</h3>
                        <p className="text-gray-400 text-sm text-center mb-6">
                            Êtes-vous sûr de vouloir {confirmAction.type === 'DELETE' ? 'supprimer définitivement' : confirmAction.type === 'BAN' ? 'bannir' : 'débannir'} l'utilisateur <strong className="text-white">{confirmAction.username}</strong> ?
                            {confirmAction.type === 'DELETE' && <span className="block mt-2 text-red-400 font-bold">Cette action est irréversible.</span>}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-gray-800 rounded-lg text-white font-bold text-sm hover:bg-gray-700 transition-colors">ANNULER</button>
                            <button onClick={handleAction} className={`flex-1 py-3 rounded-lg text-white font-bold text-sm transition-colors ${confirmAction.type === 'DELETE' ? 'bg-red-600 hover:bg-red-500' : 'bg-orange-600 hover:bg-orange-500'}`}>CONFIRMER</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gray-900/80 border-b border-white/10 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center backdrop-blur-md z-10 shrink-0 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-white/10"><Home size={18} /></button>
                    <h1 className="text-lg sm:text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Shield className="text-blue-400"/> DASHBOARD
                    </h1>
                </div>
                
                {/* Scrollable Tabs on Mobile */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 min-w-max">
                        <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>VUE D'ENSEMBLE</button>
                        <button onClick={() => setActiveTab('USERS')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>UTILISATEURS</button>
                        <button onClick={() => setActiveTab('GAMES')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'GAMES' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>JEUX</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                
                {loading ? (
                    <div className="flex items-center justify-center h-full text-blue-400 font-bold animate-pulse">CHARGEMENT DES DONNÉES...</div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'OVERVIEW' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Total Inscrits" value={totalUsers} icon={Users} color="blue" />
                                    <StatCard title="Actifs Aujourd'hui" value={activeToday} sub={`${Math.round((activeToday/totalUsers)*100 || 0)}% du total`} icon={Activity} color="green" />
                                    <StatCard title="Masse Monétaire" value={totalCoins.toLocaleString()} icon={Coins} color="yellow" />
                                    <StatCard title="Jeux Actifs" value={Object.values(gameStats).filter(v => v > 0).length} icon={LayoutGrid} color="purple" />
                                </div>

                                {/* Quick Activity Chart */}
                                <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2"><BarChart2 size={16}/> CONNEXIONS (7 DERNIERS JOURS)</h3>
                                    <div className="flex items-end justify-between h-40 gap-2">
                                        {connectionStats.map((val, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end group">
                                                <div className="text-[10px] text-gray-300 text-center mb-1 font-mono font-bold">{val}</div>
                                                <div 
                                                    style={{ height: `${Math.max(10, (val / maxConnectionCount) * 100)}%` }} 
                                                    className={`w-full ${i === 6 ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-gray-700 border-t border-gray-600'} rounded-t-sm transition-all duration-500 hover:bg-blue-400 relative`}
                                                >
                                                </div>
                                                <div className="text-[10px] text-gray-500 text-center mt-2 border-t border-white/5 pt-1">
                                                    {i === 6 ? 'AUJ' : `J-${6-i}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USERS TAB */}
                        {activeTab === 'USERS' && (
                            <div className="animate-in fade-in">
                                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4 sm:gap-0">
                                    <div className="relative w-full sm:max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher un pseudo..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 self-center whitespace-nowrap">{filteredUsers.length} joueurs trouvés</div>
                                </div>

                                {/* Desktop Table */}
                                <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden hidden md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="p-4">Joueur</th>
                                                <th className="p-4 text-center">Pièces</th>
                                                <th className="p-4 text-center">Dernière Connexion</th>
                                                <th className="p-4 text-center">Meilleur Jeu</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredUsers.map(p => {
                                                // Calculate best game logic
                                                let bestGame = '-';
                                                let maxScore = -1;
                                                if (p.data?.highScores) {
                                                    Object.entries(p.data.highScores).forEach(([game, score]: [string, any]) => {
                                                        if (typeof score === 'number' && score > maxScore) {
                                                            maxScore = score;
                                                            bestGame = game;
                                                        }
                                                    });
                                                }
                                                const isBanned = p.data?.banned;

                                                return (
                                                    <tr key={p.username} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-white flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 text-xs">
                                                                {p.username.substring(0,2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                {p.username}
                                                                {isBanned && <span className="text-[9px] text-red-500 font-black tracking-widest bg-red-900/20 px-1 rounded w-fit">BANNI</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center text-yellow-400 font-mono">{p.data?.coins || 0}</td>
                                                        <td className="p-4 text-center text-gray-400 text-xs">
                                                            {new Date(p.updated_at).toLocaleDateString()} <span className="opacity-50">{new Date(p.updated_at).toLocaleTimeString().slice(0,5)}</span>
                                                        </td>
                                                        <td className="p-4 text-center text-blue-300 text-xs uppercase">{bestGame}</td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => setSelectedUser(p)} className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors">VOIR</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-3">
                                    {filteredUsers.map(p => {
                                        // Mobile best game logic
                                        let bestGame = '-';
                                        let maxScore = -1;
                                        if (p.data?.highScores) {
                                            Object.entries(p.data.highScores).forEach(([game, score]: [string, any]) => {
                                                if (typeof score === 'number' && score > maxScore) {
                                                    maxScore = score;
                                                    bestGame = game;
                                                }
                                            });
                                        }
                                        const isBanned = p.data?.banned;

                                        return (
                                            <div key={p.username} onClick={() => setSelectedUser(p)} className="bg-gray-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 text-xs font-bold text-white">
                                                            {p.username.substring(0,2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white text-sm">{p.username}</span>
                                                            {isBanned && <span className="text-[8px] text-red-500 font-black tracking-widest">BANNI</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-yellow-400 font-mono text-sm">
                                                        <Coins size={12} /> {p.data?.coins || 0}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                                                    <div className="text-gray-500 flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(p.updated_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-blue-300 uppercase font-bold">
                                                        {bestGame} <ChevronRight size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* GAMES TAB */}
                        {activeTab === 'GAMES' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"><Trophy size={20}/> POPULARITÉ DES JEUX</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {Object.entries(gameStats)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([game, count]) => (
                                        <div key={game} className="bg-gray-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 group hover:border-green-500/30 transition-all">
                                            <div className="w-24 text-sm font-bold text-gray-300 uppercase tracking-wider">{game}</div>
                                            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                                                <div 
                                                    style={{ width: `${(count / maxGamePlay) * 100}%` }} 
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full relative group-hover:shadow-[0_0_10px_#10b981] transition-all duration-700"
                                                >
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="w-12 text-right font-mono font-bold text-green-400">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
