import React, { useState, useEffect, useMemo } from 'react';
import { 
    Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, 
    Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, 
    Trash2, Ban, AlertTriangle, Check, Radio, Plus, Zap, Eye, Smartphone, 
    Edit2, Settings, Flag, Megaphone, FileText, Rocket, Lock, Save, Download, 
    RefreshCw, Moon, Sun, Volume2, Battery, Globe, ToggleLeft, ToggleRight,
    LogOut, TrendingUp, PieChart, MessageSquare, Gift, Star, Target, Palette, Copy, Layers, Bell, RefreshCcw,
    CreditCard, ShoppingCart, DollarSign, AlertOctagon, History, User
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

interface EventObjective {
    type: 'PLAY_GAMES' | 'REACH_SCORE' | 'EARN_COINS';
    target: number;
    gameIds: string[]; // Multi-game support
}

interface EventReward {
    coins: number;
    badgeId?: string;
    skinId?: string;
}

interface EventTheme {
    primaryColor: string;
    backgroundImage?: string;
}

interface AdminEvent {
    id: string;
    title: string;
    description: string;
    type: 'XP_BOOST' | 'TOURNAMENT' | 'SPECIAL_QUEST' | 'COMMUNITY';
    startDate: string;
    endDate: string;
    active: boolean;
    // New Features
    objectives?: EventObjective[];
    rewards?: EventReward;
    theme?: EventTheme;
    leaderboardActive?: boolean;
}

// --- CONFIGURATION ---
const SECTIONS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'ECONOMY', label: 'Économie', icon: Coins }, // NEW SECTION
    { id: 'GAMES', label: 'Gestion Jeux', icon: Gamepad2 },
    { id: 'USERS', label: 'Utilisateurs', icon: Users },
    { id: 'STATS', label: 'Statistiques', icon: BarChart2 },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'FLAGS', label: 'Feature Flags', icon: Flag },
    { id: 'CONTENT', label: 'Contenu', icon: Megaphone },
    { id: 'EVENTS', label: 'Événements', icon: Calendar },
    { id: 'LOGS', label: 'Logs', icon: FileText },
    { id: 'DATA', label: 'Données', icon: Database },
    { id: 'SECURITY', label: 'Sécurité', icon: Shield },
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
    
    // Economy Sub-tabs
    const [economyTab, setEconomyTab] = useState<'OVERVIEW' | 'TRANSACTIONS' | 'REWARDS' | 'ABUSE'>('OVERVIEW');
    const [dailyRewardBase, setDailyRewardBase] = useState(50);
    const [dailyRewardBonus, setDailyRewardBonus] = useState(20);

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

    // Events State
    const [adminEvents, setAdminEvents] = useState<AdminEvent[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_admin_events') || '[]'); } catch { return []; }
    });
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventTab, setEventTab] = useState<'GENERAL' | 'OBJECTIVES' | 'REWARDS' | 'THEME'>('GENERAL');
    const [showEventAnalytics, setShowEventAnalytics] = useState<string | null>(null);

    const [currentEvent, setCurrentEvent] = useState<AdminEvent>({
        id: '', title: '', description: '', type: 'XP_BOOST', startDate: '', endDate: '', active: true,
        objectives: [{ type: 'PLAY_GAMES', target: 10, gameIds: [] }],
        rewards: { coins: 100 },
        theme: { primaryColor: '#00f3ff' },
        leaderboardActive: false
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
        
        // FILTRAGE : On retire l'utilisateur technique 'SYSTEM_CONFIG' de la liste
        const realUsers = data.filter(u => u.username !== 'SYSTEM_CONFIG');
        
        setProfiles(realUsers);
        setLoading(false);
    };

    // --- ECONOMY HELPERS ---
    const suspiciousUsers = useMemo(() => {
        return profiles.filter(p => {
            const coins = p.data?.coins || 0;
            // Suspicious if > 50k coins OR huge scores in specific games
            if (coins > 50000) return true;
            if (p.data?.highScores?.tetris > 1000000) return true;
            return false;
        });
    }, [profiles]);

    const transactionLogs = useMemo(() => {
        // Mocking a transaction log based on profile states
        // In a real app, this would query a 'transactions' table
        const logs: any[] = [];
        profiles.slice(0, 20).forEach(p => {
            if (p.data?.inventory && p.data.inventory.length > 0) {
                p.data.inventory.forEach((item: string) => {
                    logs.push({
                        id: Math.random(),
                        user: p.username,
                        type: 'PURCHASE',
                        item: item,
                        amount: -500, // Avg price
                        date: new Date(p.updated_at).getTime() - Math.random() * 86400000 * 5
                    });
                });
            }
            if (p.data?.coins > 1000) {
                 logs.push({
                        id: Math.random(),
                        user: p.username,
                        type: 'REWARD',
                        item: 'Daily Bonus',
                        amount: +150,
                        date: new Date(p.updated_at).getTime() - Math.random() * 86400000
                    });
            }
        });
        return logs.sort((a, b) => b.date - a.date);
    }, [profiles]);

    const saveEconomyConfig = () => {
        const config = {
            dailyRewardBase,
            dailyRewardBonus
        };
        // Save to system config in DB
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ economyConfig: config });
        }
        // Broadcast update
        mp.sendAdminBroadcast("Mise à jour économie", "game_config", { economy: config });
        alert("Configuration économie sauvegardée !");
    };

    // --- ACTIONS ---
    const toggleGame = (gameId: string) => {
        const newArr = disabledGames.includes(gameId) ? disabledGames.filter(id => id !== gameId) : [...disabledGames, gameId];
        setDisabledGames(newArr);
        localStorage.setItem('neon_disabled_games', JSON.stringify(newArr));
        mp.sendAdminBroadcast(disabledGames.includes(gameId) ? 'Jeu réactivé' : 'Jeu en maintenance', 'game_config', newArr);
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ disabledGames: newArr });
        }
    };

    const toggleFlag = (key: string) => {
        setFeatureFlags(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem('neon_feature_flags', JSON.stringify(newState));
            mp.sendAdminBroadcast(`Feature Flag Updated: ${key.toUpperCase()} -> ${newState[key] ? 'ON' : 'OFF'}`, 'game_config', { flags: newState });
            if (isSupabaseConfigured) {
                DB.saveSystemConfig({ featureFlags: newState });
            }
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
        const currentCoins = selectedUser.data?.coins || 0;
        const newAmount = currentCoins + giftAmount;
        if (isSupabaseConfigured) {
            await DB.updateUserData(selectedUser.username, { coins: newAmount });
        }
        mp.sendAdminBroadcast(
            `🎁 Cadeau Admin : +${giftAmount} Pièces !`, 
            'user_update', 
            { 
                targetUser: selectedUser.username, 
                action: 'ADD_COINS', 
                amount: giftAmount 
            }
        );
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr); d.coins = newAmount;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: { ...u.data, coins: newAmount } } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: { ...prev.data, coins: newAmount } }));
        alert(`Envoyé ! Nouveau solde pour ${selectedUser.username} : ${newAmount}`);
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
    
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte de ${selectedUser.username} ? Cette action est irréversible.`);
        if (!confirmDelete) return;
        const username = selectedUser.username;
        if (isSupabaseConfigured) await DB.deleteUser(username);
        const usersDbStr = localStorage.getItem('neon_users_db');
        if (usersDbStr) {
            const usersDb = JSON.parse(usersDbStr);
            delete usersDb[username];
            localStorage.setItem('neon_users_db', JSON.stringify(usersDb));
        }
        localStorage.removeItem('neon_data_' + username);
        setProfiles(prev => prev.filter(p => p.username !== username));
        setSelectedUser(null);
    };

    const handleResetVincent = async () => {
        if (!confirm("ATTENTION: Réinitialiser TOTALEMENT le compte Vincent ? (0 pièces, 0 items)")) return;
        const freshData = {
            coins: 0, inventory: [], avatarId: 'av_bot', ownedAvatars: ['av_bot', 'av_human'],
            frameId: 'fr_none', ownedFrames: ['fr_none'], wallpaperId: 'bg_brick', ownedWallpapers: ['bg_brick'],
            titleId: 't_none', ownedTitles: ['t_none'], malletId: 'm_classic', ownedMallets: ['m_classic'],
            highScores: { tetris: 0, breaker: 0, pacman: 0, snake: 0, invaders: 0, runner: 0, stack: 0, arenaclash: 0, sudoku: {}, memory: 0, mastermind: 0, uno: 0, game2048: 0, watersort: 1, skyjo: 0 },
            streak: 0, quests: [], banned: false
        };
        if (isSupabaseConfigured) await DB.updateUserData('Vincent', freshData);
        localStorage.setItem('neon_data_Vincent', JSON.stringify(freshData));
        const currentUser = localStorage.getItem('neon-username');
        if (currentUser === 'Vincent') {
            localStorage.setItem('neon-coins', '0'); localStorage.setItem('neon-inventory', '[]');
            localStorage.setItem('neon-avatar', 'av_bot'); localStorage.setItem('neon-owned-avatars', JSON.stringify(['av_bot', 'av_human']));
            localStorage.setItem('neon-highscores', JSON.stringify(freshData.highScores));
        }
        alert("Compte Vincent réinitialisé ! La page va se recharger.");
        window.location.reload();
    };

    const exportData = () => {
        const dataStr = JSON.stringify(profiles, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'neon_arcade_backup.json');
        linkElement.click();
    };

    // --- EVENT HANDLERS ---
    const handleSaveEvent = () => {
        let newEvents = [...adminEvents];
        const eventToSave = { ...currentEvent };
        if (eventToSave.id) {
            newEvents = newEvents.map(e => e.id === eventToSave.id ? eventToSave : e);
        } else {
            eventToSave.id = Date.now().toString();
            newEvents.push(eventToSave);
        }
        setAdminEvents(newEvents);
        localStorage.setItem('neon_admin_events', JSON.stringify(newEvents));
        setShowEventModal(false);
        mp.sendAdminBroadcast("Sync Events", "sync_events", newEvents);
        if (isSupabaseConfigured) DB.saveSystemConfig({ events: newEvents });
        if (eventToSave.active) mp.sendAdminBroadcast(`Nouvel Événement : ${eventToSave.title}`, 'info');
    };

    const handleDuplicateEvent = (event: AdminEvent) => {
        const dup = { ...event, id: '', title: `${event.title} (Copie)`, active: false };
        openEventModal(dup);
    };

    const handleDeleteEvent = (id: string) => {
        if(!window.confirm("Supprimer cet événement ?")) return;
        const newEvents = adminEvents.filter(e => e.id !== id);
        setAdminEvents(newEvents);
        localStorage.setItem('neon_admin_events', JSON.stringify(newEvents));
        mp.sendAdminBroadcast("Sync Events", "sync_events", newEvents);
        if (isSupabaseConfigured) DB.saveSystemConfig({ events: newEvents });
    };

    const openEventModal = (event?: AdminEvent) => {
        setEventTab('GENERAL');
        if (event) {
            setCurrentEvent(event);
        } else {
            setCurrentEvent({
                id: '', title: '', description: '', type: 'XP_BOOST', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], active: true,
                objectives: [{ type: 'PLAY_GAMES', target: 5, gameIds: [] }],
                rewards: { coins: 100 },
                theme: { primaryColor: '#00f3ff' },
                leaderboardActive: false
            });
        }
        setShowEventModal(true);
    };

    const getGameData = (game: typeof GAMES_LIST[0]) => {
        const override = gameOverrides[game.id];
        return override ? { ...game, ...override } : game;
    };

    // --- AGGREGATES ---
    const totalCoins = profiles.reduce((acc, p) => {
        if (p.username === 'Vincent') {
            const isGodMode = localStorage.getItem('neon-admin-mode') === 'true';
            if (isGodMode) return acc;
        }
        return acc + (p.data?.coins || 0);
    }, 0);

    const economyPlayersCount = profiles.reduce((acc, p) => {
        if (p.username === 'Vincent') {
             const isGodMode = localStorage.getItem('neon-admin-mode') === 'true';
             if (isGodMode) return acc;
        }
        return acc + 1;
    }, 0);

    const activeUsers = onlineUsers.filter(u => u.status === 'online').length;

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

    const renderEconomy = () => (
        <div className="h-full flex flex-col animate-in fade-in">
            <div className="flex bg-gray-900 rounded-xl p-1 gap-1 mb-4 border border-white/10 shrink-0">
                <button onClick={() => setEconomyTab('OVERVIEW')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${economyTab === 'OVERVIEW' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}>VUE D'ENSEMBLE</button>
                <button onClick={() => setEconomyTab('TRANSACTIONS')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${economyTab === 'TRANSACTIONS' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>TRANSACTIONS</button>
                <button onClick={() => setEconomyTab('REWARDS')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${economyTab === 'REWARDS' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>RÉCOMPENSES</button>
                <button onClick={() => setEconomyTab('ABUSE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${economyTab === 'ABUSE' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>RISQUE & SÉCURITÉ</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {economyTab === 'OVERVIEW' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Masse Monétaire</h4>
                                <div className="flex items-center gap-2">
                                    <Coins size={32} className="text-yellow-400"/>
                                    <span className="text-4xl font-black text-white">{totalCoins.toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp size={12}/> Circulation stable</div>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Richesse Moyenne</h4>
                                <div className="flex items-center gap-2">
                                    <User size={32} className="text-blue-400"/>
                                    <span className="text-4xl font-black text-white">
                                        {economyPlayersCount > 0 ? Math.round(totalCoins / economyPlayersCount).toLocaleString() : 0}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10 shadow-lg">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">Inflation (Est.)</h4>
                                <div className="flex items-center gap-2">
                                    <Activity size={32} className="text-purple-400"/>
                                    <span className="text-4xl font-black text-white">2.4%</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Basée sur les gains/dépenses</div>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy className="text-yellow-400"/> CLASSEMENT FORTUNE</h4>
                            <div className="space-y-2">
                                {richList.map((p, i) => (
                                    <div key={p.username} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(p)}>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-black font-mono text-lg w-8 text-center ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-orange-400':'text-gray-600'}`}>#{i+1}</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{p.username}</span>
                                                <span className="text-[10px] text-gray-500">{new Date(p.updated_at).toLocaleDateString()}</span>
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
                )}

                {economyTab === 'TRANSACTIONS' && (
                    <div className="bg-gray-800 rounded-xl border border-white/10 overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50">
                            <h4 className="font-bold text-white flex items-center gap-2"><History size={18}/> FLUX RÉCENTS</h4>
                            <span className="text-xs text-gray-500">Dernières 24h (Simulé)</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {transactionLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${log.type === 'PURCHASE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {log.type === 'PURCHASE' ? <ShoppingCart size={14}/> : <Gift size={14}/>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-white block">{log.item}</span>
                                            <span className="text-gray-500">{log.user} • {new Date(log.date).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold ${log.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {log.amount > 0 ? '+' : ''}{log.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {economyTab === 'REWARDS' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar className="text-green-400"/> BONUS QUOTIDIEN</h4>
                            <p className="text-xs text-gray-400 mb-6">Configurez les montants distribués aux joueurs chaque jour.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">MONTANT DE BASE</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={dailyRewardBase} onChange={(e) => setDailyRewardBase(parseInt(e.target.value))} className="bg-black border border-white/20 rounded p-2 text-white w-full font-mono text-lg" />
                                        <Coins className="text-yellow-500"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">BONUS PAR JOUR (STREAK)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={dailyRewardBonus} onChange={(e) => setDailyRewardBonus(parseInt(e.target.value))} className="bg-black border border-white/20 rounded p-2 text-white w-full font-mono text-lg" />
                                        <Coins className="text-yellow-500"/>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Ex: Jour 1 = Base, Jour 2 = Base + Bonus, etc.</p>
                                </div>
                                <button onClick={saveEconomyConfig} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg mt-4">
                                    <Save size={18}/> APPLIQUER LA CONFIGURATION
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {economyTab === 'ABUSE' && (
                    <div className="space-y-4">
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-4">
                            <AlertOctagon size={32} className="text-red-500"/>
                            <div>
                                <h4 className="text-red-100 font-bold">Système Anti-Fraude</h4>
                                <p className="text-xs text-red-300">Les comptes ci-dessous présentent des anomalies (Solde > 50k ou Scores impossibles).</p>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900 text-gray-400 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="p-4">Utilisateur</th>
                                        <th className="p-4 text-center">Solde</th>
                                        <th className="p-4 text-center">Raison</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {suspiciousUsers.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic">Aucune activité suspecte détectée.</td></tr>
                                    ) : (
                                        suspiciousUsers.map(p => (
                                            <tr key={p.username} className="hover:bg-white/5">
                                                <td className="p-4 font-bold text-white">{p.username}</td>
                                                <td className="p-4 text-center font-mono text-yellow-400">{p.data?.coins}</td>
                                                <td className="p-4 text-center text-xs text-red-300 bg-red-900/20 rounded">
                                                    {p.data?.coins > 50000 ? "Richesse Excessive" : "Score Suspect"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setSelectedUser(p)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors">EXAMINER</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

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

    const renderEvents = () => (
        <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-green-400"/> GESTIONNAIRE D'ÉVÉNEMENTS</h3>
                <button onClick={() => openEventModal()} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg hover:scale-105 transition-all">
                    <Plus size={16}/> CRÉER
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminEvents.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-800/50 rounded-xl border border-white/5 border-dashed text-gray-500">
                        Aucun événement planifié.
                    </div>
                )}
                {adminEvents.map(evt => {
                    const isPast = new Date(evt.endDate) < new Date();
                    const isActive = evt.active && !isPast;
                    
                    let typeColor = 'text-gray-400 border-gray-500';
                    let Icon = Calendar;
                    if (evt.type === 'XP_BOOST') { typeColor = 'text-yellow-400 border-yellow-500'; Icon = Zap; }
                    if (evt.type === 'TOURNAMENT') { typeColor = 'text-purple-400 border-purple-500'; Icon = Trophy; }
                    if (evt.type === 'SPECIAL_QUEST') { typeColor = 'text-green-400 border-green-500'; Icon = Star; }
                    if (evt.type === 'COMMUNITY') { typeColor = 'text-blue-400 border-blue-500'; Icon = Users; }

                    return (
                        <div key={evt.id} className={`p-4 rounded-xl border flex flex-col gap-2 relative group transition-all ${isActive ? 'bg-gray-800 border-white/20 shadow-lg' : 'bg-gray-900 border-white/5 opacity-70'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${typeColor} bg-black/30`}>
                                        <Icon size={20}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{evt.title}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColor} bg-opacity-10`}>{evt.type.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {isActive ? 'ACTIF' : isPast ? 'TERMINÉ' : 'INACTIF'}
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-400 line-clamp-2 mt-2 bg-black/20 p-2 rounded">{evt.description}</p>
                            
                            {/* Detailed Info Preview */}
                            <div className="flex gap-2 mt-2 text-[10px] font-mono text-gray-500">
                                {evt.objectives && evt.objectives.length > 0 && <span className="bg-blue-900/30 px-1 rounded flex items-center gap-1"><Target size={8}/> {evt.objectives.length} OBJ</span>}
                                {evt.rewards && (evt.rewards.coins > 0 || evt.rewards.skinId) && <span className="bg-yellow-900/30 px-1 rounded flex items-center gap-1"><Gift size={8}/> REWARDS</span>}
                                {evt.theme && <span className="bg-purple-900/30 px-1 rounded flex items-center gap-1"><Palette size={8}/> THEME</span>}
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono mt-1">
                                <span className="flex items-center gap-1"><Clock size={10}/> {new Date(evt.startDate).toLocaleDateString()}</span>
                                <span>➔</span>
                                <span className="flex items-center gap-1"><Clock size={10}/> {new Date(evt.endDate).toLocaleDateString()}</span>
                            </div>

                            <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                <button onClick={() => openEventModal(evt)} className="flex-1 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-bold transition-colors">ÉDITER</button>
                                <button onClick={() => handleDuplicateEvent(evt)} className="py-1.5 px-3 bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white rounded text-xs font-bold transition-colors" title="Dupliquer"><Copy size={14}/></button>
                                <button onClick={() => setShowEventAnalytics(evt.id)} className="py-1.5 px-3 bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white rounded text-xs font-bold transition-colors" title="Statistiques"><BarChart2 size={14}/></button>
                                <button onClick={() => handleDeleteEvent(evt.id)} className="py-1.5 px-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-bold transition-colors"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* EVENT ANALYTICS MODAL */}
            {showEventAnalytics && (
                <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowEventAnalytics(null)}>
                    <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/20 shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowEventAnalytics(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><BarChart2 className="text-blue-400"/> ANALYTIQUES ÉVÉNEMENT</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                                <p className="text-xs text-gray-500 font-bold uppercase">Participation</p>
                                <p className="text-3xl font-black text-white">42%</p>
                                <p className="text-[10px] text-green-400">+5% vs avg</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                                <p className="text-xs text-gray-500 font-bold uppercase">Taux Complétion</p>
                                <p className="text-3xl font-black text-yellow-400">15%</p>
                                <p className="text-[10px] text-gray-400">Standard</p>
                            </div>
                        </div>
                        
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-40 flex items-end justify-between gap-2 px-6 pb-2">
                             {[30, 50, 45, 80, 60, 95, 40].map((h, i) => (
                                <div key={i} className="w-full bg-blue-500/50 hover:bg-blue-400 rounded-t" style={{ height: `${h}%` }}></div>
                             ))}
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">Activité sur les 7 derniers jours</p>
                    </div>
                </div>
            )}
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
                                        <div className={`h-full ${g.count > 0 ? 'bg-blue-500' : 'bg-gray-600'}`} style={{ width: `${Math.min(100, (g.count / profiles.length) * 100)}%` }}></div>
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
        </div>
    );

    const renderLogs = () => <div className="animate-in fade-in">Logs système...</div>;
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
                
                <div className="bg-red-900/20 p-6 rounded-xl border border-red-500/30 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-red-400">Réinitialiser Vincent</h4>
                        <p className="text-xs text-red-300">Remet à zéro le compte Admin (0 pièces, 0 items).</p>
                    </div>
                    <button onClick={handleResetVincent} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all">
                        <RefreshCcw size={18}/> RÉINITIALISER
                    </button>
                </div>
            </div>
        </div>
    );
    const renderSecurity = () => <div className="animate-in fade-in">Paramètres de sécurité...</div>;
    const renderFuture = () => <div className="animate-in fade-in">Roadmap...</div>;

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
                    {activeSection === 'ECONOMY' && renderEconomy()}
                    {activeSection === 'STATS' && renderStats()}
                    {activeSection === 'GAMES' && renderGamesManager()}
                    {activeSection === 'USERS' && renderUsers()}
                    {activeSection === 'CONFIG' && renderConfig()}
                    {activeSection === 'FLAGS' && renderFeatureFlags()}
                    {activeSection === 'CONTENT' && renderContent()}
                    {activeSection === 'EVENTS' && renderEvents()}
                    {activeSection === 'LOGS' && renderLogs()}
                    {activeSection === 'DATA' && renderData()}
                    {activeSection === 'SECURITY' && renderSecurity()}
                    {activeSection === 'FUTURE' && renderFuture()}
                    
                    {['APPEARANCE'].includes(activeSection) && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-50">
                            <Lock size={48} className="mb-4"/>
                            <p className="font-bold">SECTION EN DÉVELOPPEMENT</p>
                        </div>
                    )}
                </div>
            </div>

            {/* EVENTS MODAL */}
            {showEventModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <h3 className="text-xl font-black text-white flex items-center gap-2"><Edit2 className="text-green-400"/> {currentEvent.id ? 'ÉDITER' : 'CRÉER'} ÉVÉNEMENT</h3>
                            <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-white"><X/></button>
                        </div>
                        
                        <div className="flex bg-black/20 p-2 gap-2">
                            <button onClick={() => setEventTab('GENERAL')} className={`flex-1 py-2 text-xs font-bold rounded ${eventTab === 'GENERAL' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>GÉNÉRAL</button>
                            <button onClick={() => setEventTab('OBJECTIVES')} className={`flex-1 py-2 text-xs font-bold rounded ${eventTab === 'OBJECTIVES' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>OBJECTIFS</button>
                            <button onClick={() => setEventTab('REWARDS')} className={`flex-1 py-2 text-xs font-bold rounded ${eventTab === 'REWARDS' ? 'bg-yellow-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>RÉCOMPENSES</button>
                            <button onClick={() => setEventTab('THEME')} className={`flex-1 py-2 text-xs font-bold rounded ${eventTab === 'THEME' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>VISUEL</button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {eventTab === 'GENERAL' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">TITRE</label>
                                        <input type="text" value={currentEvent.title} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-green-500 outline-none" placeholder="Ex: Week-end XP" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">TYPE</label>
                                            <select value={currentEvent.type} onChange={e => setCurrentEvent({...currentEvent, type: e.target.value as any})} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-green-500 outline-none">
                                                <option value="XP_BOOST">Boost XP/Coins</option>
                                                <option value="TOURNAMENT">Tournoi</option>
                                                <option value="SPECIAL_QUEST">Quête Spéciale</option>
                                                <option value="COMMUNITY">Communauté</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-2 rounded-lg border border-white/10 w-full justify-center hover:bg-gray-700">
                                                <input type="checkbox" checked={currentEvent.active} onChange={e => setCurrentEvent({...currentEvent, active: e.target.checked})} className="accent-green-500 w-4 h-4" />
                                                <span className="text-sm font-bold text-white">ACTIF</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">DÉBUT</label>
                                            <input type="date" value={currentEvent.startDate} onChange={e => setCurrentEvent({...currentEvent, startDate: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-green-500 outline-none text-xs" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">FIN</label>
                                            <input type="date" value={currentEvent.endDate} onChange={e => setCurrentEvent({...currentEvent, endDate: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-green-500 outline-none text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">DESCRIPTION</label>
                                        <textarea value={currentEvent.description} onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white focus:border-green-500 outline-none h-20 resize-none text-sm" placeholder="Détails de l'événement..." />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-3 rounded-lg border border-white/10 hover:bg-gray-700">
                                            <input type="checkbox" checked={currentEvent.leaderboardActive} onChange={e => setCurrentEvent({...currentEvent, leaderboardActive: e.target.checked})} className="accent-purple-500 w-4 h-4" />
                                            <div>
                                                <span className="text-sm font-bold text-white block">Leaderboard Dédié</span>
                                                <span className="text-[10px] text-gray-400">Classement temporaire spécifique à l'événement</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {eventTab === 'OBJECTIVES' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30 mb-2">
                                        <p className="text-xs text-purple-200">Configurez les conditions de progression.</p>
                                    </div>
                                    {currentEvent.objectives?.map((obj, i) => (
                                        <div key={i} className="bg-gray-800 p-3 rounded-lg border border-white/10 space-y-3 relative">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">TYPE</label>
                                                    <select value={obj.type} onChange={e => {
                                                        const newObjs = [...(currentEvent.objectives || [])];
                                                        newObjs[i] = { ...obj, type: e.target.value as any };
                                                        setCurrentEvent({ ...currentEvent, objectives: newObjs });
                                                    }} className="w-full bg-black border border-white/20 rounded p-1 text-sm text-white">
                                                        <option value="PLAY_GAMES">Jouer des parties</option>
                                                        <option value="REACH_SCORE">Atteindre un score</option>
                                                        <option value="EARN_COINS">Gagner des pièces</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 font-bold block mb-1">OBJECTIF (VALEUR)</label>
                                                    <input type="number" value={obj.target} onChange={e => {
                                                        const newObjs = [...(currentEvent.objectives || [])];
                                                        newObjs[i] = { ...obj, target: parseInt(e.target.value) };
                                                        setCurrentEvent({ ...currentEvent, objectives: newObjs });
                                                    }} className="w-full bg-black border border-white/20 rounded p-1 text-sm text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 font-bold block mb-1">JEUX CONCERNÉS (IDs séparés par virgule)</label>
                                                <input type="text" value={obj.gameIds.join(', ')} onChange={e => {
                                                    const newObjs = [...(currentEvent.objectives || [])];
                                                    newObjs[i] = { ...obj, gameIds: e.target.value.split(',').map(s => s.trim()) };
                                                    setCurrentEvent({ ...currentEvent, objectives: newObjs });
                                                }} className="w-full bg-black border border-white/20 rounded p-1 text-xs text-white font-mono" placeholder="Ex: tetris, snake (laisser vide pour tous)" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {eventTab === 'REWARDS' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30 mb-2">
                                        <p className="text-xs text-yellow-200">Récompenses accordées à la fin de l'événement ou des objectifs.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1 flex items-center gap-2"><Coins size={14} className="text-yellow-400"/> PIÈCES</label>
                                            <input type="number" value={currentEvent.rewards?.coins} onChange={e => setCurrentEvent({ ...currentEvent, rewards: { ...currentEvent.rewards, coins: parseInt(e.target.value) } })} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white text-lg font-mono font-bold text-yellow-400" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1 flex items-center gap-2"><Shield size={14} className="text-blue-400"/> BADGE ID (Optionnel)</label>
                                            <input type="text" value={currentEvent.rewards?.badgeId || ''} onChange={e => setCurrentEvent({ ...currentEvent, rewards: { ...currentEvent.rewards, badgeId: e.target.value } as any })} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white font-mono text-sm" placeholder="ex: b_event_winter" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1 flex items-center gap-2"><Palette size={14} className="text-pink-400"/> SKIN/AVATAR ID (Optionnel)</label>
                                            <input type="text" value={currentEvent.rewards?.skinId || ''} onChange={e => setCurrentEvent({ ...currentEvent, rewards: { ...currentEvent.rewards, skinId: e.target.value } as any })} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white font-mono text-sm" placeholder="ex: av_santa" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {eventTab === 'THEME' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-pink-900/20 p-3 rounded-lg border border-pink-500/30 mb-2">
                                        <p className="text-xs text-pink-200">Personnalisez l'apparence de l'interface pendant l'événement.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">COULEUR NÉON</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={currentEvent.theme?.primaryColor || '#00f3ff'} onChange={e => setCurrentEvent({ ...currentEvent, theme: { ...currentEvent.theme, primaryColor: e.target.value } })} className="h-10 w-full bg-transparent border-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="w-full h-10 rounded border-2 flex items-center justify-center font-bold text-black" style={{ backgroundColor: currentEvent.theme?.primaryColor || '#00f3ff', borderColor: '#fff', boxShadow: `0 0 10px ${currentEvent.theme?.primaryColor || '#00f3ff'}` }}>
                                                PREVIEW
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">IMAGE DE FOND (URL CSS)</label>
                                        <textarea value={currentEvent.theme?.backgroundImage || ''} onChange={e => setCurrentEvent({ ...currentEvent, theme: { ...currentEvent.theme, backgroundImage: e.target.value } as any })} className="w-full bg-black border border-white/20 rounded-lg p-2 text-white text-xs font-mono h-20" placeholder="linear-gradient(...), url(...)" />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-white/10 bg-black/40">
                            <button onClick={handleSaveEvent} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                                <Save size={18}/> SAUVEGARDER
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                            <button onClick={handleDeleteUser} className="w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-red-950 text-red-500 border border-red-900 hover:bg-red-900 transition-colors mt-2">
                                <Trash2 size={14}/> SUPPRIMER LE COMPTE DÉFINITIVEMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};