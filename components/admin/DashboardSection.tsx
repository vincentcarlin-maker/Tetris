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
    { id: 'sudoku', name: 'Sudoku' }, { id: 'breaker', name: 'Breaker' }, { id: 'pacman', name: 'Pacman' }
];

export const DashboardSection: React.FC<DashboardSectionProps> = ({ profiles, onlineUsers, detailed = false }) => {
    const totalCoins = profiles.reduce((acc, p) => acc + (p.data?.coins || 0), 0);
    const activeUsers = onlineUsers.filter(u => u.status === 'online').length;
    const totalItemsSold = profiles.reduce((acc, p) => acc + (p.data?.inventory?.length || 0), 0);

    const gamePopularity = useMemo(() => {
        const stats: Record<string, number> = {};
        profiles.forEach(p => {
            const scores = p.data?.highScores || {};
            Object.keys(scores).forEach(id => { if (scores[id] > 0) stats[id] = (stats[id] || 0) + 1; });
        });
        return Object.entries(stats).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
    }, [profiles]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Utilisateurs Total" value={profiles.length} trend="+12%" />
                <StatCard icon={Activity} label="Actifs (Live)" value={activeUsers} subtext={`Sur ${GAMES_LIST.length} jeux`} color="text-green-400" />
                <StatCard icon={Coins} label="Masse Monétaire" value={totalCoins.toLocaleString()} subtext="Économie stable" color="text-yellow-400" />
                <StatCard icon={LifeBuoy} label="Tickets Support" value="--" subtext="Action requise" color="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-purple-400"/> ACTIVITÉ JOUEURS (7J)</h3>
                    <div className="h-48 flex items-end gap-2 justify-between px-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="w-full bg-purple-900/30 rounded-t-lg hover:bg-purple-600/50 transition-colors" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> CLASSEMENT FORTUNE</h4>
                    <div className="space-y-3">
                        {richList.map((p, i) => (
                            <div key={p.username} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5">
                                <span className="text-sm font-bold text-white">{p.username}</span>
                                <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold">{p.data?.coins?.toLocaleString()} <Coins size={14}/></div>
                            </div>
                        ))}
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