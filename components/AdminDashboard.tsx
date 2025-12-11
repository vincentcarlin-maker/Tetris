
import React, { useState, useEffect } from 'react';
import { Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, Database, LayoutGrid, Trophy } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminDashboardProps {
    onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'GAMES'>('OVERVIEW');
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!isSupabaseConfigured) {
            // Mock data for demo/offline
            const mockProfiles = Array.from({ length: 15 }).map((_, i) => ({
                username: `Player_${i + 1}`,
                updated_at: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
                data: {
                    coins: Math.floor(Math.random() * 5000),
                    highScores: {
                        tetris: Math.floor(Math.random() * 20000),
                        snake: Math.floor(Math.random() * 50),
                        pacman: Math.floor(Math.random() * 10000)
                    },
                    avatarId: 'av_bot'
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

    // Total Economy
    const totalCoins = profiles.reduce((acc, p) => acc + (p.data?.coins || 0), 0);

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

    return (
        <div className="h-full w-full bg-black/90 text-white font-sans overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-900/80 border-b border-white/10 p-4 flex justify-between items-center backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-white/10"><Home size={18} /></button>
                    <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Database className="text-blue-400"/> ADMIN DASHBOARD
                    </h1>
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>VUE D'ENSEMBLE</button>
                    <button onClick={() => setActiveTab('USERS')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'USERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>UTILISATEURS</button>
                    <button onClick={() => setActiveTab('GAMES')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'GAMES' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>JEUX</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {loading ? (
                    <div className="flex items-center justify-center h-full text-blue-400 font-bold animate-pulse">CHARGEMENT DES DONNÉES...</div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'OVERVIEW' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Total Inscrits" value={totalUsers} icon={Users} color="blue" />
                                    <StatCard title="Actifs Aujourd'hui" value={activeToday} sub={`${Math.round((activeToday/totalUsers)*100 || 0)}% du total`} icon={Activity} color="green" />
                                    <StatCard title="Masse Monétaire" value={totalCoins.toLocaleString()} icon={Coins} color="yellow" />
                                    <StatCard title="Jeux Actifs" value={Object.values(gameStats).filter(v => v > 0).length} icon={LayoutGrid} color="purple" />
                                </div>

                                {/* Quick Activity Chart (Simulation) */}
                                <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2"><BarChart2 size={16}/> CONNEXIONS (7 DERNIERS JOURS)</h3>
                                    <div className="flex items-end justify-between h-40 gap-2">
                                        {[45, 60, 35, 80, 50, 90, activeToday].map((val, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end group">
                                                <div 
                                                    style={{ height: `${Math.max(10, (val / 100) * 100)}%` }} 
                                                    className={`w-full ${i === 6 ? 'bg-blue-500' : 'bg-gray-700'} rounded-t-sm transition-all duration-500 hover:bg-blue-400 relative`}
                                                >
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{val}</div>
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
                                <div className="flex justify-between mb-4">
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher un pseudo..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 self-center">{filteredUsers.length} joueurs trouvés</div>
                                </div>

                                <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
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
                                                // Calculate best game
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

                                                return (
                                                    <tr key={p.username} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-white flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 text-xs">
                                                                {p.username.substring(0,2).toUpperCase()}
                                                            </div>
                                                            {p.username}
                                                        </td>
                                                        <td className="p-4 text-center text-yellow-400 font-mono">{p.data?.coins || 0}</td>
                                                        <td className="p-4 text-center text-gray-400 text-xs">
                                                            {new Date(p.updated_at).toLocaleDateString()} <span className="opacity-50">{new Date(p.updated_at).toLocaleTimeString().slice(0,5)}</span>
                                                        </td>
                                                        <td className="p-4 text-center text-blue-300 text-xs uppercase">{bestGame}</td>
                                                        <td className="p-4 text-right">
                                                            <button className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors">VOIR</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
