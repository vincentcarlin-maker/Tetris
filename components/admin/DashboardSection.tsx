
import React, { useMemo } from 'react';
import { Users, Activity, Coins, LifeBuoy, BarChart2, Trophy, PieChart, TrendingUp, Banknote, ShoppingCart, Gamepad2 } from 'lucide-react';
import { OnlineUser } from '../../hooks/useSupabase';

interface DashboardSectionProps {
    profiles: any[];
    onlineUsers: OnlineUser[];
    detailed?: boolean;
}

const GAMES_LIST = [
    { id: 'slither', name: 'Neon Slither' }, { id: 'tetris', name: 'Tetris' }, { id: 'connect4', name: 'Connect 4' },
    { id: 'sudoku', name: 'Sudoku' }, { id: 'breaker', name: 'Breaker' }, { id: 'pacman', name: 'Pacman' },
    { id: 'snake', name: 'Snake' }, { id: 'invaders', name: 'Invaders' }, { id: 'runner', name: 'Neon Run' },
    { id: 'stack', name: 'Stack' }, { id: 'arenaclash', name: 'Arena Clash' }, { id: 'skyjo', name: 'Skyjo' },
    { id: 'lumen', name: 'Lumen Order' }, { id: 'uno', name: 'Uno' }, { id: 'watersort', name: 'Neon Mix' },
    { id: 'checkers', name: 'Dames' }, { id: 'mastermind', name: 'Mastermind' }, { id: 'memory', name: 'Memory' },
    { id: 'battleship', name: 'Bataille' }
];

export const DashboardSection: React.FC<DashboardSectionProps> = ({ profiles, onlineUsers, detailed = false }) => {
    const totalCoins = profiles.reduce((acc, p) => acc + (p.data?.coins || 0), 0);
    const activeUsers = onlineUsers.filter(u => u.status === 'online').length;
    const totalItemsSold = profiles.reduce((acc, p) => acc + (p.data?.inventory?.length || 0), 0);

    // --- ACTIVITY GRAPH DATA LOGIC ---
    const activityData = useMemo(() => {
        // Generate last 7 days dates (YYYY-MM-DD)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const dayLabels = ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', 'Auj.'];

        // Aggregate counts
        const stats = last7Days.map(dateStr => {
            const count = profiles.filter(p => {
                if (!p.updated_at) return false;
                // Check if the updated_at string starts with the date string (simple day match)
                return p.updated_at.startsWith(dateStr);
            }).length;
            return count;
        });

        // Determine scaling factor (max value in the set)
        const maxVal = Math.max(...stats, 1); // Prevent division by zero

        return stats.map((val, i) => ({
            label: dayLabels[i],
            count: val,
            // Calculate height percentage (min 5% for visibility if 0, scaled to max)
            height: val === 0 ? 5 : Math.max(10, (val / maxVal) * 100)
        }));
    }, [profiles]);

    const gamePopularity = useMemo(() => {
        const stats: Record<string, number> = {};
        profiles.forEach(p => {
            const scores = p.data?.highScores || {};
            Object.keys(scores).forEach(id => { if (scores[id] > 0) stats[id] = (stats[id] || 0) + 1; });
        });
        return Object.entries(stats).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
    }, [profiles]);

    const topGames = useMemo(() => {
        return gamePopularity.slice(0, 5).map(g => {
            const info = GAMES_LIST.find(info => info.id === g.id);
            return { ...g, name: info ? info.name : g.id };
        });
    }, [gamePopularity]);

    const richList = useMemo(() => [...profiles].sort((a, b) => (b.data?.coins || 0) - (a.data?.coins || 0)).slice(0, 5), [profiles]);

    if (detailed) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={Banknote} label="Masse Monétaire" value={totalCoins.toLocaleString()} color="text-yellow-400" />
                    <StatCard icon={TrendingUp} label="Moyenne / Joueur" value={profiles.length ? Math.round(totalCoins / profiles.length).toLocaleString() : '0'} color="text-green-400" />
                    <StatCard icon={ShoppingCart} label="Items Vendus" value={totalItemsSold.toLocaleString()} color="text-blue-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><PieChart size={18} className="text-pink-400"/> RÉPARTITION DES JEUX</h4>
                        <div className="space-y-2">
                            {gamePopularity.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                                    <span className="text-xs font-bold text-gray-300 w-24 truncate">{g.id}</span>
                                    <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${(g.count / profiles.length) * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs font-mono text-white">{g.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Utilisateurs Total" value={profiles.length} trend="+12%" />
                <StatCard icon={Activity} label="Actifs (Live)" value={activeUsers} subtext={`Sur ${GAMES_LIST.length} jeux`} color="text-green-400" />
                <StatCard icon={Coins} label="Masse Monétaire" value={totalCoins.toLocaleString()} subtext="Économie stable" color="text-yellow-400" />
                <StatCard icon={LifeBuoy} label="Tickets Support" value="--" subtext="Action requise" color="text-red-500" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Activity Graph */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-white/10 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart2 size={18} className="text-purple-400"/> ACTIVITÉ JOUEURS (7J)
                    </h3>
                    <div className="flex-1 min-h-[250px] flex items-end gap-3 justify-between px-2 pb-2">
                        {activityData.map((data, i) => (
                            <div key={i} className="w-full flex flex-col items-center gap-2 group relative h-full justify-end">
                                {/* Tooltip */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 transform translate-y-2 group-hover:translate-y-0 duration-200">
                                    {data.count} Joueurs
                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                </div>
                                
                                {/* Bar */}
                                <div 
                                    className="w-full bg-purple-900/30 rounded-t-md group-hover:bg-purple-500/50 transition-all duration-500 relative overflow-hidden" 
                                    style={{ height: `${data.height}%` }}
                                >
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/50"></div>
                                </div>
                                
                                {/* Label */}
                                <span className="text-[10px] text-gray-500 font-mono font-bold">{data.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Lists */}
                <div className="space-y-6">
                    
                    {/* Rich List */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-400"/> CLASSEMENT FORTUNE
                        </h4>
                        <div className="space-y-3">
                            {richList.map((p, i) => (
                                <div key={p.username} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5">
                                    <span className="text-sm font-bold text-white truncate max-w-[120px]">{p.username}</span>
                                    <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold text-xs">
                                        {p.data?.coins?.toLocaleString()} <Coins size={12}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Games */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Gamepad2 size={18} className="text-green-400"/> TOP 5 JEUX
                        </h4>
                        <div className="space-y-3">
                            {topGames.map((g, i) => (
                                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5">
                                    <span className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                        <span className={`text-[10px] font-mono w-4 h-4 flex items-center justify-center rounded-full ${i===0?'bg-yellow-500 text-black':i===1?'bg-gray-400 text-black':i===2?'bg-orange-700 text-white':'bg-gray-800 text-gray-500'}`}>#{i+1}</span> 
                                        {g.name}
                                    </span>
                                    <span className="text-xs font-mono text-green-400 font-bold">{g.count} <Users size={10} className="inline"/></span>
                                </div>
                            ))}
                            {topGames.length === 0 && <p className="text-xs text-gray-500 italic text-center py-2">Aucune donnée de jeu.</p>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, trend, subtext, color = "text-blue-400" }: any) => (
    <div className="bg-gray-800 p-4 rounded-xl border border-white/10 shadow-lg">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase">{label}</p>
                <h3 className={`text-3xl font-black ${color.includes('text-white') ? 'text-white' : color}`}>{value}</h3>
            </div>
            <div className={`p-2 bg-opacity-20 rounded-lg ${color.replace('text-', 'bg-')} ${color}`}>{Icon && <Icon size={20}/>}</div>
        </div>
        {trend && <div className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12}/> {trend} ce mois</div>}
        {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
    </div>
);
