
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, 
    Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, 
    Trash2, Ban, AlertTriangle, Check, Radio, Plus, Zap, Eye, Smartphone, 
    Edit2, Settings, Flag, Megaphone, FileText, Rocket, Lock, Save, Download, 
    RefreshCw, Moon, Sun, Volume2, Battery, Globe, ToggleLeft, ToggleRight,
    LogOut, TrendingUp, PieChart, MessageSquare, Gift
} from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';
import { AVATARS_CATALOG, FRAMES_CATALOG } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { OnlineUser } from '../hooks/useSupabase';

interface AdminDashboardProps {
    onBack: () => void;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
}

// --- CONFIGURATION ---
const SECTIONS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'GAMES', label: 'Gestion Jeux', icon: Gamepad2 },
    { id: 'APPEARANCE', label: 'Apparence', icon: Eye },
    { id: 'USERS', label: 'Utilisateurs', icon: Users },
    { id: 'STATS', label: 'Statistiques', icon: BarChart2 },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'FLAGS', label: 'Feature Flags', icon: Flag },
    { id: 'CONTENT', label: 'Contenu', icon: Megaphone },
    { id: 'EVENTS', label: 'Événements', icon: Calendar },
    { id: 'LOGS', label: 'Logs', icon: FileText },
    { id: 'DATA', label: 'Données', icon: Database },
    { id: 'SECURITY', label: 'Sécurité', icon: Shield },
    { id: 'FUTURE', label: 'Roadmap', icon: Rocket },
];

const GAMES_LIST = [
    { id: 'tetris', name: 'Tetris', version: '2.1' },
    { id: 'connect4', name: 'Connect 4', version: '1.5' },
    { id: 'sudoku', name: 'Sudoku', version: '1.2' },
    { id: 'breaker', name: 'Breaker', version: '3.0' },
    { id: 'pacman', name: 'Pacman', version: '2.4' },
    { id: 'memory', name: 'Memory', version: '1.1' },
    { id: 'battleship', name: 'Bataille', version: '1.8' },
    { id: 'snake', name: 'Snake', version: '1.9' },
    { id: 'invaders', name: 'Invaders', version: '1.3' },
    { id: 'airhockey', name: 'Air Hockey', version: '1.4' },
    { id: 'mastermind', name: 'Mastermind', version: '1.0' },
    { id: 'uno', name: 'Uno', version: '2.2' },
    { id: 'watersort', name: 'Neon Mix', version: '1.6' },
    { id: 'checkers', name: 'Dames', version: '1.0' },
    { id: 'runner', name: 'Neon Run', version: '2.5' },
    { id: 'stack', name: 'Stack', version: '1.2' },
    { id: 'arenaclash', name: 'Arena Clash', version: '1.0' },
    { id: 'skyjo', name: 'Skyjo', version: '1.0' }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, mp, onlineUsers }) => {
    const [activeSection, setActiveSection] = useState('DASHBOARD');
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [giftAmount, setGiftAmount] = useState(500);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    
    // Config Persistence
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });

    // Game Overrides (Name/Version)
    const [gameOverrides, setGameOverrides] = useState<Record<string, {name: string, version: string}>>(() => {
        try { return JSON.parse(localStorage.getItem('neon_game_overrides') || '{}'); } catch { return {}; }
    });
    const [editingGame, setEditingGame] = useState<{id: string, name: string, version: string} | null>(null);

    // Feature Flags State
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
            return {
                maintenance_mode: false,
                social_module: true,
                economy_system: true,
                beta_games: false,
                global_chat: true
            };
        }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        let data: any[] = [];
        if (isSupabaseConfigured) {
            try { data = await DB.getFullAdminExport(); } catch (e) { console.error(e); }
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
        setProfiles(data);
        setLoading(false);
    };

    // --- ACTIONS ---
    const toggleGame = (gameId: string) => {
        const newArr = disabledGames.includes(gameId) ? disabledGames.filter(id => id !== gameId) : [...disabledGames, gameId];
        setDisabledGames(newArr);
        localStorage.setItem('neon_disabled_games', JSON.stringify(newArr));
        mp.sendAdminBroadcast(disabledGames.includes(gameId) ? 'Jeu réactivé' : 'Jeu en maintenance', 'game_config', newArr);
    };

    const toggleFlag = (key: string) => {
        setFeatureFlags(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem('neon_feature_flags', JSON.stringify(newState));
            // Broadcast the change (clients can listen to 'game_config' if implemented)
            mp.sendAdminBroadcast(`Feature Flag Updated: ${key.toUpperCase()} -> ${newState[key] ? 'ON' : 'OFF'}`, 'game_config', { flags: newState });
            return newState;
        });
    };

    const handleSaveGameEdit = () => {
        if (!editingGame) return;
        const newOverrides = { 
            ...gameOverrides, 
            [editingGame.id]: { name: editingGame.name, version: editingGame.version } 
        };
        setGameOverrides(newOverrides);
        localStorage.setItem('neon_game_overrides', JSON.stringify(newOverrides));
        setEditingGame(null);
        mp.sendAdminBroadcast(`Mise à jour : ${editingGame.name} v${editingGame.version}`, 'info');
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        mp.sendAdminBroadcast(broadcastMsg, 'info');
        alert('Envoyé !');
        setBroadcastMsg('');
    };

    const handleGiftCoins = async () => {
        if (!selectedUser) return;
        const newAmount = (selectedUser.data.coins || 0) + giftAmount;
        if (isSupabaseConfigured) await DB.updateUserData(selectedUser.username, { coins: newAmount });
        // Local Mirror
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr); d.coins = newAmount;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: { ...u.data, coins: newAmount } } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: { ...prev.data, coins: newAmount } }));
    };

    const handleBan = async () => {
        if (!selectedUser) return;
        const isBanned = !selectedUser.data.banned;
        if (isSupabaseConfigured) await DB.updateUserData(selectedUser.username, { banned: isBanned });
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr); d.banned = isBanned;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: { ...u.data, banned: isBanned } } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: { ...prev.data, banned: isBanned } }));
    };

    const exportData = () => {
        const dataStr = JSON.stringify(profiles, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'neon_arcade_backup.json');
        linkElement.click();
    };

    // --- HELPER ---
    const getGameData = (game: typeof GAMES_LIST[0]) => {
        const override = gameOverrides[game.id];
        return override ? { ...game, ...override } : game;
    };

    // --- AGGREGATES ---
    // Calcul de la masse monétaire en excluant Vincent si le God Mode est activé
    const totalCoins = profiles.reduce((acc, p) => {
        if (p.username === 'Vincent') {
            const isGodMode = localStorage.getItem('neon-admin-mode') === 'true';
            if (isGodMode) return acc;
        }
        return acc + (p.data?.coins || 0);
    }, 0);

    // Calcul du nombre de joueurs comptabilisés (pour la moyenne)
    const economyPlayersCount = profiles.reduce((acc, p) => {
        if (p.username === 'Vincent') {
             const isGodMode = localStorage.getItem('neon-admin-mode') === 'true';
             if (isGodMode) return acc;
        }
        return acc + 1;
    }, 0);

    const activeUsers = onlineUsers.filter(u => u.status === 'online').length;

    // --- CALCULATED STATS ---
    const gamePopularity = useMemo(() => {
        const stats: Record<string, number> = {};
        profiles.forEach(p => {
            const scores = p.data?.highScores || {};
            Object.keys(scores).forEach(gameKey => {
                if (scores[gameKey] > 0) {
                    stats[gameKey] = (stats[gameKey] || 0) + 1;
                }
            });
        });
        // Convert to array and sort
        return Object.entries(stats)
            .map(([id, count]) => {
                const gameName = GAMES_LIST.find(g => g.id === id)?.name || id;
                return { id, name: gameName, count };
            })
            .sort((a, b) => b.count - a.count);
    }, [profiles]);

    const richList = useMemo(() => {
        return [...profiles]
            .sort((a, b) => (b.data?.coins || 0) - (a.data?.coins || 0))
            .slice(0, 5);
    }, [profiles]);

    // --- RENDERERS ---

    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase">Utilisateurs Total</p>
                            <h3 className="text-3xl font-black text-white">{profiles.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Users size={20}/></div>
                    </div>
                    <div className="text-xs text-green-400 flex items-center gap-1"><ArrowUp size={12}/> +12% ce mois</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase">Actifs (Live)</p>
                            <h3 className="text-3xl font-black text-green-400">{activeUsers}</h3>
                        </div>
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Activity size={20}/></div>
                    </div>
                    <div className="text-xs text-gray-500">Sur {GAMES_LIST.length} jeux disponibles</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase">Masse Monétaire</p>
                            <h3 className="text-3xl font-black text-yellow-400">{totalCoins.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><Coins size={20}/></div>
                    </div>
                    <div className="text-xs text-gray-500">Économie stable</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase">Alertes Système</p>
                            <h3 className="text-3xl font-black text-red-500">0</h3>
                        </div>
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><AlertTriangle size={20}/></div>
                    </div>
                    <div className="text-xs text-green-400">Système opérationnel</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-purple-400"/> ACTIVITÉ JOUEURS (7J)</h3>
                    <div className="h-48 flex items-end gap-2 justify-between px-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="w-full bg-purple-900/30 rounded-t-lg relative group hover:bg-purple-600/50 transition-colors" style={{ height: `${h}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                        <span>LUN</span><span>MAR</span><span>MER</span><span>JEU</span><span>VEN</span><span>SAM</span><span>DIM</span>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> JEUX POPULAIRES (TOP 4)</h3>
                    <div className="space-y-3">
                        {gamePopularity.slice(0, 4).map((g, i) => (
                            <div key={g.id} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-300 w-24 truncate">{g.name}</span>
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-cyan-500' : i === 2 ? 'bg-purple-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (g.count / profiles.length) * 100)}%` }}></div>
                                </div>
                                <span className="text-xs font-mono text-gray-400">{g.count}</span>
                            </div>
                        ))}
                        {gamePopularity.length === 0 && <p className="text-gray-500 text-xs italic">Pas assez de données...</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFeatureFlags = () => (
        <div className="animate-in fade-in space-y-6 max-w-3xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Flag size={20} className="text-orange-400"/> MODULES & SYSTÈME
                </h3>
                
                <div className="space-y-4">
                    {/* MAINTENANCE */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${featureFlags.maintenance_mode ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Mode Maintenance</div>
                                <div className="text-xs text-gray-500">Bloque l'accès aux joueurs non-admin.</div>
                            </div>
                        </div>
                        <button onClick={() => toggleFlag('maintenance_mode')} className={`w-14 h-8 rounded-full transition-colors relative ${featureFlags.maintenance_mode ? 'bg-red-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${featureFlags.maintenance_mode ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* SOCIAL */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${featureFlags.social_module ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Module Social</div>
                                <div className="text-xs text-gray-500">Amis, Chat privé, Présence en ligne.</div>
                            </div>
                        </div>
                        <button onClick={() => toggleFlag('social_module')} className={`w-14 h-8 rounded-full transition-colors relative ${featureFlags.social_module ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${featureFlags.social_module ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* ECONOMY */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${featureFlags.economy_system ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                <Coins size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Système Économique</div>
                                <div className="text-xs text-gray-500">Gains de pièces, Boutique, Cadeaux.</div>
                            </div>
                        </div>
                        <button onClick={() => toggleFlag('economy_system')} className={`w-14 h-8 rounded-full transition-colors relative ${featureFlags.economy_system ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${featureFlags.economy_system ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* BETA GAMES */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${featureFlags.beta_games ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                <Gamepad2 size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Jeux Bêta / Expérimental</div>
                                <div className="text-xs text-gray-500">Affiche les jeux en cours de développement.</div>
                            </div>
                        </div>
                        <button onClick={() => toggleFlag('beta_games')} className={`w-14 h-8 rounded-full transition-colors relative ${featureFlags.beta_games ? 'bg-purple-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${featureFlags.beta_games ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    
                    {/* GLOBAL CHAT */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${featureFlags.global_chat ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Chat Global (Jeux)</div>
                                <div className="text-xs text-gray-500">Active le chat et les réactions dans les jeux multijoueurs.</div>
                            </div>
                        </div>
                        <button onClick={() => toggleFlag('global_chat')} className={`w-14 h-8 rounded-full transition-colors relative ${featureFlags.global_chat ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${featureFlags.global_chat ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="animate-in fade-in space-y-6">
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
                <BarChart2 className="text-purple-400" /> STATISTIQUES GLOBALES
            </h3>

            {/* ECONOMY STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Richesse Totale</h4>
                    <div className="flex items-center gap-2">
                        <Coins size={24} className="text-yellow-400"/>
                        <span className="text-3xl font-black text-white">{totalCoins.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Moyenne / Joueur</h4>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={24} className="text-green-400"/>
                        <span className="text-3xl font-black text-white">
                            {economyPlayersCount > 0 ? Math.round(totalCoins / economyPlayersCount).toLocaleString() : 0}
                        </span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Jeux Joués (Cumul)</h4>
                    <div className="flex items-center gap-2">
                        <Gamepad2 size={24} className="text-cyan-400"/>
                        <span className="text-3xl font-black text-white">
                            {gamePopularity.reduce((acc, g) => acc + g.count, 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* DETAILED CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GAME POPULARITY FULL */}
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><PieChart size={18} className="text-pink-400"/> RÉPARTITION DES JEUX</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {gamePopularity.map((g) => (
                            <div key={g.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                                <span className="text-xs font-bold text-gray-300">{g.name}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (g.count / profiles.length) * 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-mono text-white w-8 text-right">{g.count}</span>
                                </div>
                            </div>
                        ))}
                        {gamePopularity.length === 0 && <p className="text-gray-500 text-sm">Aucune donnée de jeu.</p>}
                    </div>
                </div>

                {/* RICH LIST */}
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> CLASSEMENT FORTUNE (TOP 5)</h4>
                    <div className="space-y-3">
                        {richList.map((p, i) => (
                            <div key={p.username} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className={`font-black font-mono text-lg w-6 ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-orange-400':'text-gray-600'}`}>#{i+1}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{p.username}</span>
                                        <span className="text-[10px] text-gray-500">Dernière vue: {new Date(p.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 font-mono font-bold">
                                    {p.data?.coins?.toLocaleString() || 0} <Coins size={14}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGamesManager = () => (
        <div className="animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {GAMES_LIST.map(rawGame => {
                    const game = getGameData(rawGame);
                    const isDisabled = disabledGames.includes(game.id);
                    return (
                        <div key={game.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isDisabled ? 'bg-red-900/10 border-red-500/30' : 'bg-gray-800 border-white/10'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDisabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        <Gamepad2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isDisabled ? 'text-gray-400' : 'text-white'}`}>{game.name}</h4>
                                        <p className="text-[10px] text-gray-500">v{game.version}</p>
                                    </div>
                                </div>
                                <button onClick={() => toggleGame(game.id)} className={`relative w-12 h-6 rounded-full transition-colors ${isDisabled ? 'bg-gray-600' : 'bg-green-500'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDisabled ? 'translate-x-0' : 'translate-x-6'}`}></div>
                                </button>
                            </div>
                            <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                                <button onClick={() => toggleGame(game.id)} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-colors ${isDisabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-900/50 hover:bg-red-900 text-red-300'}`}>
                                    {isDisabled ? 'ACTIVER' : 'MAINTENANCE'}
                                </button>
                                <button onClick={() => setEditingGame(game)} className="flex-1 py-1.5 text-[10px] bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold rounded transition-colors border border-blue-500/30">
                                    ÉDITER
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un joueur..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Utilisateur</th>
                                <th className="p-4 text-center">Statut</th>
                                <th className="p-4 text-center">Pièces</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles.filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                                const isOnline = onlineUsers.some(u => u.id === p.username && u.status === 'online');
                                return (
                                    <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(p)}>
                                        <td className="p-4 font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs">{p.username.substring(0,2).toUpperCase()}</div>
                                            <div>
                                                <div>{p.username}</div>
                                                <div className="text-[10px] text-gray-500 font-normal">{new Date(p.updated_at).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-400' : p.data?.banned ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                                {p.data?.banned ? 'BANNI' : isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-mono text-yellow-400">{p.data?.coins || 0}</td>
                                        <td className="p-4 text-right"><Edit2 size={16} className="text-gray-500 hover:text-white inline-block"/></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderConfig = () => (
        <div className="animate-in fade-in space-y-6 max-w-3xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={20}/> PARAMÈTRES GLOBAUX</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Volume2 className="text-gray-400"/>
                            <div><div className="text-sm font-bold text-white">Sons & Musique</div><div className="text-xs text-gray-500">Activer l'audio par défaut</div></div>
                        </div>
                        <ToggleRight className="text-green-500" size={24}/>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Zap className="text-gray-400"/>
                            <div><div className="text-sm font-bold text-white">Haute Performance</div><div className="text-xs text-gray-500">Désactiver les effets visuels lourds</div></div>
                        </div>
                        <ToggleLeft className="text-gray-500" size={24}/>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Battery className="text-gray-400"/>
                            <div><div className="text-sm font-bold text-white">Mode Économie</div><div className="text-xs text-gray-500">Limiter à 30 FPS</div></div>
                        </div>
                        <ToggleLeft className="text-gray-500" size={24}/>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Globe className="text-gray-400"/>
                            <div><div className="text-sm font-bold text-white">Langue</div><div className="text-xs text-gray-500">Français (Défaut)</div></div>
                        </div>
                        <span className="text-xs font-bold bg-gray-700 px-2 py-1 rounded">FR</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => (
        <div className="animate-in fade-in space-y-6 max-w-2xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2"><Megaphone size={20}/> DIFFUSION SYSTÈME</h3>
                <textarea 
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none h-32 resize-none mb-4"
                    placeholder="Message à envoyer à tous les joueurs connectés..."
                />
                <button onClick={handleBroadcast} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"><Radio size={18}/> ENVOYER MAINTENANT</button>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><FileText size={20}/> NEWS & PATCH NOTES</h3>
                <div className="space-y-2">
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 flex justify-between items-center">
                        <span className="text-sm font-bold text-white">Mise à jour v2.7 (Skyjo)</span>
                        <span className="text-xs text-green-400">PUBLIÉ</span>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 flex justify-between items-center opacity-60">
                        <span className="text-sm font-bold text-white">Maintenance Serveur</span>
                        <span className="text-xs text-gray-500">BROUILLON</span>
                    </div>
                    <button className="w-full py-2 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/10 transition-colors">+ NOUVEL ARTICLE</button>
                </div>
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="bg-black/80 border border-white/10 rounded-xl flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                <div className="text-green-400 mb-1">[SYSTEM] Dashboard initialized.</div>
                <div className="text-blue-400 mb-1">[AUTH] User 'Vincent' logged in as ADMIN.</div>
                <div className="text-gray-400 mb-1">[GAME] Skyjo session started (Room: #8291).</div>
                <div className="text-red-400 mb-1">[ERROR] Failed to sync user 'Guest_99' (Timeout).</div>
                <div className="text-yellow-400 mb-1">[WARN] High server load detected (85%).</div>
                <div className="text-gray-400 mb-1">[GAME] Tetris score submission: 15400 by 'PixelQueen'.</div>
                {/* Simulated Logs */}
                {Array.from({length: 15}).map((_, i) => (
                    <div key={i} className="text-gray-500 mb-1 opacity-50">[DEBUG] Trace {Math.random().toString(36).substr(2, 8)}... OK</div>
                ))}
            </div>
            <div className="mt-4 flex gap-4">
                <button className="flex-1 py-2 bg-gray-800 text-white font-bold rounded-lg border border-white/10 hover:bg-gray-700">FILTRER</button>
                <button className="flex-1 py-2 bg-gray-800 text-white font-bold rounded-lg border border-white/10 hover:bg-gray-700">EXPORTER LOGS</button>
            </div>
        </div>
    );

    const renderData = () => (
        <div className="animate-in fade-in max-w-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Database size={20} className="text-green-400"/> DONNÉES & SAUVEGARDES</h3>
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-white">Export Global (JSON)</h4>
                        <p className="text-xs text-gray-400">Télécharger toute la base de données actuelle.</p>
                    </div>
                    <button onClick={exportData} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2"><Download size={18}/> EXPORTER</button>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 flex items-center justify-between opacity-50">
                    <div>
                        <h4 className="font-bold text-white">Import (Restauration)</h4>
                        <p className="text-xs text-gray-400">Écraser les données actuelles (Danger).</p>
                    </div>
                    <button disabled className="px-6 py-3 bg-gray-700 text-gray-500 font-bold rounded-lg cursor-not-allowed">IMPORTER</button>
                </div>
                <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30 flex items-center justify-between mt-8">
                    <div>
                        <h4 className="font-bold text-red-400">Réinitialisation d'Urgence</h4>
                        <p className="text-xs text-red-300">Supprime toutes les données locales et cache.</p>
                    </div>
                    <button className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-2"><Trash2 size={18}/> WIPE</button>
                </div>
            </div>
        </div>
    );

    // --- MAIN LAYOUT ---
    return (
        <div className="h-full w-full bg-black/95 text-white font-sans flex overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-gray-900 border-r border-white/10 flex flex-col shrink-0 hidden md:flex">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ADMIN PANEL</h1>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">v3.0.0 • SYSTEM: ONLINE</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {SECTIONS.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <s.icon size={18} /> {s.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-white/10">
                    <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-900/20 transition-all">
                        <LogOut size={18} /> QUITTER
                    </button>
                </div>
            </div>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-gray-900 border-b border-white/10 z-50 p-4 flex justify-between items-center">
                <span className="font-black italic text-blue-400">ADMIN</span>
                <button onClick={onBack}><X size={24} className="text-white"/></button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-900 to-black md:relative pt-16 md:pt-0">
                {/* Mobile Tabs */}
                <div className="md:hidden flex overflow-x-auto p-2 gap-2 bg-gray-900 border-b border-white/10 shrink-0">
                    {SECTIONS.map(s => (
                        <button key={s.id} onClick={() => setActiveSection(s.id)} className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeSection === s.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                        {React.createElement(SECTIONS.find(s=>s.id===activeSection)?.icon || LayoutGrid, {size: 28, className: "text-blue-400"})} 
                        {SECTIONS.find(s=>s.id===activeSection)?.label.toUpperCase()}
                    </h2>

                    {activeSection === 'DASHBOARD' && renderDashboard()}
                    {activeSection === 'STATS' && renderStats()}
                    {activeSection === 'GAMES' && renderGamesManager()}
                    {activeSection === 'USERS' && renderUsers()}
                    {activeSection === 'CONFIG' && renderConfig()}
                    {activeSection === 'FLAGS' && renderFeatureFlags()}
                    {activeSection === 'CONTENT' && renderContent()}
                    {activeSection === 'LOGS' && renderLogs()}
                    {activeSection === 'DATA' && renderData()}
                    
                    {/* Placeholder for other sections */}
                    {['APPEARANCE', 'EVENTS', 'SECURITY', 'FUTURE'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-50">
                            <Lock size={48} className="mb-4"/>
                            <p className="font-bold">SECTION EN DÉVELOPPEMENT</p>
                        </div>
                    )}
                </div>
            </div>

            {/* GAME EDIT MODAL */}
            {editingGame && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setEditingGame(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditingGame(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Edit2 className="text-blue-400"/> ÉDITER LE JEU</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-1">ID SYSTÈME</label>
                                <input type="text" value={editingGame.id} disabled className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-gray-500 cursor-not-allowed font-mono text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold block mb-1">NOM DU JEU</label>
                                <input 
                                    type="text" 
                                    value={editingGame.name} 
                                    onChange={e => setEditingGame({...editingGame, name: e.target.value})} 
                                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-blue-500 outline-none font-bold" 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold block mb-1">VERSION</label>
                                <input 
                                    type="text" 
                                    value={editingGame.version} 
                                    onChange={e => setEditingGame({...editingGame, version: e.target.value})} 
                                    className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-blue-500 outline-none font-mono" 
                                />
                            </div>
                            <button onClick={handleSaveGameEdit} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                                <Save size={18}/> SAUVEGARDER
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedUser(null)}>
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-white/20 shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                                {selectedUser.username.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">{selectedUser.username}</h3>
                                <p className="text-xs text-gray-400 font-mono">ID: {selectedUser.username}</p>
                                {selectedUser.data?.banned && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold">BANNI</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold">PIÈCES</p>
                                <p className="text-xl font-mono text-yellow-400">{selectedUser.data?.coins || 0}</p>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold">DERNIÈRE VUE</p>
                                <p className="text-xs text-white">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-800 p-3 rounded-lg border border-white/5">
                                <label className="text-xs text-gray-400 font-bold block mb-2">GIFT DE PIÈCES</label>
                                <div className="flex gap-2">
                                    <input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="bg-black border border-white/10 rounded px-2 py-1 text-white w-24 text-sm" />
                                    <button onClick={handleGiftCoins} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded transition-colors">ENVOYER</button>
                                </div>
                            </div>
                            
                            <button onClick={handleBan} className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 ${selectedUser.data?.banned ? 'bg-green-600 text-white' : 'bg-red-600/20 text-red-500 border border-red-500/50'}`}>
                                {selectedUser.data?.banned ? <><Check size={14}/> DÉBANNIR</> : <><Ban size={14}/> BANNIR L'UTILISATEUR</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
