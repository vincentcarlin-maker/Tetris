
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, 
    Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, 
    Trash2, Ban, AlertTriangle, Check, Radio, Plus, Zap, Eye, Smartphone, 
    Edit2, Settings, Flag, Megaphone, FileText, Rocket, Lock, Save, Download, 
    RefreshCw, Moon, Sun, Volume2, Battery, Globe, ToggleLeft, ToggleRight,
    LogOut, TrendingUp, PieChart, MessageSquare, Gift, Star, Target, Palette, 
    Copy, Layers, Bell, RefreshCcw, CreditCard, ShoppingCart, History, AlertOctagon,
    Banknote, Percent, User, BookOpen, Sliders, TrendingDown, MicOff, Timer, UserCheck
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

interface GameConfigOverride {
    name: string;
    version: string;
    rules?: string;
    maxLevel?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
    baseReward?: number;
}

// --- CONFIGURATION ---
const SECTIONS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutGrid },
    { id: 'ECONOMY', label: 'Économie', icon: Coins },
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
    
    // User Management State
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState<'ALL' | 'ONLINE' | 'BANNED' | 'ADMIN' | 'MOD'>('ALL');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userDetailTab, setUserDetailTab] = useState<'PROFIL' | 'GAMES' | 'ACTIVITY' | 'SANCTIONS'>('PROFIL');
    
    const [giftAmount, setGiftAmount] = useState(500);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    
    // Economy State
    const [ecoTab, setEcoTab] = useState<'OVERVIEW' | 'CONFIG' | 'TRANSACTIONS' | 'ABUSE'>('OVERVIEW');
    const [abuseThreshold, setAbuseThreshold] = useState(100000);
    const [dailyRewardBase, setDailyRewardBase] = useState(50);
    const [dailyRewardStreak, setDailyRewardStreak] = useState(20);

    // Config Persistence
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });

    // Game Overrides (Name/Version/Config)
    const [gameOverrides, setGameOverrides] = useState<Record<string, GameConfigOverride>>(() => {
        try { return JSON.parse(localStorage.getItem('neon_game_overrides') || '{}'); } catch { return {}; }
    });
    
    // Game Editing State
    const [editingGame, setEditingGame] = useState<{id: string, config: GameConfigOverride} | null>(null);
    const [gameEditTab, setGameEditTab] = useState<'GENERAL' | 'RULES' | 'PARAMS' | 'STATS'>('GENERAL');

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
    const [showEventAnalytics, setShowEventAnalytics] = useState<string | null>(null); // ID of event to show stats for

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

    // --- ACTIONS ---
    const toggleGame = (gameId: string) => {
        const newArr = disabledGames.includes(gameId) ? disabledGames.filter(id => id !== gameId) : [...disabledGames, gameId];
        setDisabledGames(newArr);
        localStorage.setItem('neon_disabled_games', JSON.stringify(newArr));
        
        // Broadcast - Pass array directly
        mp.sendAdminBroadcast(disabledGames.includes(gameId) ? 'Jeu réactivé' : 'Jeu en maintenance', 'game_config', newArr);
        
        // Save to Cloud Config
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ disabledGames: newArr });
        }
    };

    const toggleFlag = (key: string) => {
        setFeatureFlags(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem('neon_feature_flags', JSON.stringify(newState));
            
            // Broadcast the change (clients listen to 'game_config' looking for 'flags' prop)
            mp.sendAdminBroadcast(`Feature Flag Updated: ${key.toUpperCase()} -> ${newState[key] ? 'ON' : 'OFF'}`, 'game_config', { flags: newState });
            
            // Persist to Cloud
            if (isSupabaseConfigured) {
                DB.saveSystemConfig({ featureFlags: newState });
            }
            
            return newState;
        });
    };

    const handleOpenGameEdit = (game: typeof GAMES_LIST[0]) => {
        const override = gameOverrides[game.id] || {};
        setEditingGame({
            id: game.id,
            config: {
                name: override.name || game.name,
                version: override.version || game.version,
                rules: override.rules || "Règles standard appliquées.",
                maxLevel: override.maxLevel || 20,
                difficulty: override.difficulty || 'ADAPTIVE',
                baseReward: override.baseReward || 50
            }
        });
        setGameEditTab('GENERAL');
    };

    const handleSaveGameEdit = () => {
        if (!editingGame) return;
        const newOverrides = { 
            ...gameOverrides, 
            [editingGame.id]: editingGame.config
        };
        setGameOverrides(newOverrides);
        localStorage.setItem('neon_game_overrides', JSON.stringify(newOverrides));
        
        // Save to Cloud
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ gameOverrides: newOverrides });
        }

        setEditingGame(null);
        mp.sendAdminBroadcast(`Mise à jour configuration : ${editingGame.config.name}`, 'info');
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        mp.sendAdminBroadcast(broadcastMsg, 'info');
        alert('Envoyé !');
        setBroadcastMsg('');
    };

    // --- USER MANAGEMENT ACTIONS ---

    const updateUserProperty = async (property: string, value: any) => {
        if (!selectedUser) return;
        
        // 1. Update State
        const updatedData = { ...selectedUser.data, [property]: value };
        
        // 2. Update DB
        if (isSupabaseConfigured) {
            await DB.updateUserData(selectedUser.username, { [property]: value });
        }
        
        // 3. Update Local Storage Mirror
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr);
            d[property] = value;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }

        // 4. Update UI State
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: updatedData } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: updatedData }));
    };

    const handleGiftCoins = async () => {
        if (!selectedUser) return;
        const currentCoins = selectedUser.data?.coins || 0;
        const newAmount = currentCoins + giftAmount;
        
        await updateUserProperty('coins', newAmount);
        
        mp.sendAdminBroadcast(
            `🎁 Cadeau Admin : +${giftAmount} Pièces !`, 
            'user_update', 
            { 
                targetUser: selectedUser.username, 
                action: 'ADD_COINS', 
                amount: giftAmount 
            }
        );
        alert(`Envoyé ! Nouveau solde pour ${selectedUser.username} : ${newAmount}`);
    };

    const handleBan = async () => {
        if (!selectedUser) return;
        const isBanned = !selectedUser.data.banned;
        await updateUserProperty('banned', isBanned);
    };

    const handleMute = async () => {
        if (!selectedUser) return;
        const isMuted = !selectedUser.data.muted;
        await updateUserProperty('muted', isMuted);
    };

    const handleRoleChange = async (role: string) => {
        if (!selectedUser) return;
        await updateUserProperty('role', role);
    };
    
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte de ${selectedUser.username} ? Cette action est irréversible.`);
        if (!confirmDelete) return;

        const username = selectedUser.username;

        if (isSupabaseConfigured) {
            await DB.deleteUser(username);
        }

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
            coins: 0,
            inventory: [],
            avatarId: 'av_bot',
            ownedAvatars: ['av_bot', 'av_human'],
            frameId: 'fr_none',
            ownedFrames: ['fr_none'],
            wallpaperId: 'bg_brick',
            ownedWallpapers: ['bg_brick'],
            titleId: 't_none',
            ownedTitles: ['t_none'],
            malletId: 'm_classic',
            ownedMallets: ['m_classic'],
            highScores: {
                tetris: 0, breaker: 0, pacman: 0, snake: 0, invaders: 0, 
                runner: 0, stack: 0, arenaclash: 0, sudoku: {}, 
                memory: 0, mastermind: 0, uno: 0, game2048: 0, watersort: 1, skyjo: 0
            },
            streak: 0,
            quests: [],
            banned: false,
            role: 'ADMIN'
        };

        if (isSupabaseConfigured) {
            await DB.updateUserData('Vincent', freshData);
        }

        localStorage.setItem('neon_data_Vincent', JSON.stringify(freshData));

        const currentUser = localStorage.getItem('neon-username');
        if (currentUser === 'Vincent') {
            localStorage.setItem('neon-coins', '0');
            localStorage.setItem('neon-inventory', '[]');
            localStorage.setItem('neon-avatar', 'av_bot');
            localStorage.setItem('neon-owned-avatars', JSON.stringify(['av_bot', 'av_human']));
            localStorage.setItem('neon-highscores', JSON.stringify(freshData.highScores));
            // Force reset others
            localStorage.setItem('neon-frame', 'fr_none');
            localStorage.setItem('neon-owned-frames', JSON.stringify(['fr_none']));
            localStorage.setItem('neon-wallpaper', 'bg_brick');
            localStorage.setItem('neon-owned-wallpapers', JSON.stringify(['bg_brick']));
            localStorage.setItem('neon-title', 't_none');
            localStorage.setItem('neon-owned-titles', JSON.stringify(['t_none']));
            localStorage.setItem('neon-mallet', 'm_classic');
            localStorage.setItem('neon-owned-mallets', JSON.stringify(['m_classic']));
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
            // Edit
            newEvents = newEvents.map(e => e.id === eventToSave.id ? eventToSave : e);
        } else {
            // Create
            eventToSave.id = Date.now().toString();
            newEvents.push(eventToSave);
        }
        setAdminEvents(newEvents);
        localStorage.setItem('neon_admin_events', JSON.stringify(newEvents));
        setShowEventModal(false);
        
        // Broadcast FULL list to sync all clients immediately
        mp.sendAdminBroadcast("Sync Events", "sync_events", newEvents);
        
        // Save to Cloud Config
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ events: newEvents });
        }
        
        if (eventToSave.active) {
            mp.sendAdminBroadcast(`Nouvel Événement : ${eventToSave.title}`, 'info');
        }
    };

    const handleDuplicateEvent = (event: AdminEvent) => {
        const dup = { ...event, id: '', title: `${event.title} (Copie)`, active: false };
        openEventModal(dup);
    };

    // --- HELPER ---
    const getGameData = (game: typeof GAMES_LIST[0]) => {
        const override = gameOverrides[game.id];
        return override ? { ...game, ...override } : game;
    };

    const getGameDetailedStats = (gameId: string) => {
        const stats = {
            totalPlays: 0,
            activePlayers: 0,
            abandonRate: 0, // Estimated: percentage of players who played but have 0 score or high score is low
            avgScore: 0
        };

        let totalScore = 0;
        let playersWithScore = 0;
        let zeroScorePlayers = 0;

        profiles.forEach(p => {
            const scores = p.data?.highScores || {};
            // Check if user has played this game (some entry in highScores or stats)
            if (scores[gameId] !== undefined) {
                stats.totalPlays += 1; // Simplification: 1 user who played = 1 "play" for overview
                stats.activePlayers += 1;
                
                const score = typeof scores[gameId] === 'number' ? scores[gameId] : 0;
                
                if (score > 0) {
                    totalScore += score;
                    playersWithScore++;
                } else {
                    zeroScorePlayers++;
                }
            }
        });

        if (playersWithScore > 0) stats.avgScore = Math.round(totalScore / playersWithScore);
        if (stats.totalPlays > 0) stats.abandonRate = Math.round((zeroScorePlayers / stats.totalPlays) * 100);

        return stats;
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

    // Total Items Bought (Approximation based on inventory lengths)
    const totalItemsSold = profiles.reduce((acc, p) => {
        return acc + (p.data?.inventory?.length || 0) + (p.data?.ownedAvatars?.length || 0) + (p.data?.ownedFrames?.length || 0);
    }, 0);

    // Suspicious Users (Abuse Detection)
    const suspiciousUsers = useMemo(() => {
        return profiles.filter(p => (p.data?.coins || 0) >= abuseThreshold).sort((a, b) => b.data.coins - a.data.coins);
    }, [profiles, abuseThreshold]);

    // Mock Transactions (Pour démo)
    const mockTransactions = useMemo(() => {
        const actions = ['ACHAT_SKIN', 'GAIN_JEU', 'BONUS_JOUR', 'CADEAU_ADMIN'];
        return Array.from({length: 20}).map((_, i) => {
            const user = profiles[Math.floor(Math.random() * profiles.length)]?.username || 'Guest';
            const action = actions[Math.floor(Math.random() * actions.length)];
            const amount = action === 'ACHAT_SKIN' ? -500 : action === 'CADEAU_ADMIN' ? 1000 : 50;
            return {
                id: i,
                user,
                action,
                amount,
                time: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleTimeString()
            };
        });
    }, [profiles]); // Recalc only when profiles change

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

    const filteredUsers = useMemo(() => {
        return profiles.filter(p => {
            // Text Search
            if (searchTerm && !p.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Status Filter
            const isOnline = onlineUsers.some(u => u.id === p.username && u.status === 'online');
            if (userFilter === 'ONLINE' && !isOnline) return false;
            if (userFilter === 'BANNED' && !p.data?.banned) return false;
            if (userFilter === 'ADMIN' && p.data?.role !== 'ADMIN' && p.username !== 'Vincent') return false;
            if (userFilter === 'MOD' && p.data?.role !== 'MOD') return false;
            
            return true;
        });
    }, [profiles, searchTerm, userFilter, onlineUsers]);

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

    const renderEconomy = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                <button onClick={() => setEcoTab('OVERVIEW')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${ecoTab === 'OVERVIEW' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <Activity size={14}/> VUE D'ENSEMBLE
                </button>
                <button onClick={() => setEcoTab('CONFIG')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${ecoTab === 'CONFIG' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <Settings size={14}/> CONFIGURATION
                </button>
                <button onClick={() => setEcoTab('TRANSACTIONS')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${ecoTab === 'TRANSACTIONS' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <History size={14}/> HISTORIQUE
                </button>
                <button onClick={() => setEcoTab('ABUSE')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${ecoTab === 'ABUSE' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <AlertOctagon size={14}/> DÉTECTION ABUS
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {ecoTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Banknote size={16}/> Masse Monétaire</h4>
                                <p className="text-3xl font-black text-yellow-400">{totalCoins.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Total des pièces en circulation</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><User size={16}/> Moyenne / Joueur</h4>
                                <p className="text-3xl font-black text-green-400">{economyPlayersCount > 0 ? Math.round(totalCoins / economyPlayersCount).toLocaleString() : 0}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Richesse moyenne</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><ShoppingCart size={16}/> Items Vendus</h4>
                                <p className="text-3xl font-black text-blue-400">{totalItemsSold.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Volume des achats boutique</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const openEventModal = (event?: AdminEvent) => {
        if (event) {
            setCurrentEvent(event);
        } else {
            setCurrentEvent({
                id: '', 
                title: '', 
                description: '', 
                type: 'XP_BOOST', 
                startDate: new Date().toISOString().split('T')[0], 
                endDate: new Date().toISOString().split('T')[0], 
                active: true,
                objectives: [{ type: 'PLAY_GAMES', target: 10, gameIds: [] }],
                rewards: { coins: 100 },
                theme: { primaryColor: '#00f3ff' },
                leaderboardActive: false
            });
        }
        setShowEventModal(true);
    };

    const renderStats = () => (
        <div className="animate-in fade-in h-full p-4 bg-gray-900/50 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BarChart2/> Statistiques Globales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                    <h4 className="text-gray-400 text-sm font-bold uppercase mb-2">Répartition des Jeux</h4>
                    <div className="space-y-2">
                        {gamePopularity.slice(0, 5).map(g => (
                            <div key={g.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-300">{g.name}</span>
                                <span className="font-mono text-purple-400">{g.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                    <h4 className="text-gray-400 text-sm font-bold uppercase mb-2">Top Richesses</h4>
                    <div className="space-y-2">
                        {richList.map((u, i) => (
                            <div key={u.username} className="flex items-center justify-between text-xs">
                                <span className="text-gray-300">{i+1}. {u.username}</span>
                                <span className="font-mono text-yellow-400">{u.data?.coins}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGamesManager = () => (
        <div className="animate-in fade-in h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GAMES_LIST.map(game => {
                    const isDisabled = disabledGames.includes(game.id);
                    const override = gameOverrides[game.id];
                    return (
                        <div key={game.id} className={`p-4 rounded-xl border ${isDisabled ? 'bg-red-900/10 border-red-500/30' : 'bg-gray-800 border-white/10'} transition-all`}>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white">{override?.name || game.name}</h4>
                                <div className={`w-3 h-3 rounded-full ${isDisabled ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Version: {override?.version || game.version}</p>
                            <div className="flex gap-2">
                                <button onClick={() => toggleGame(game.id)} className={`flex-1 py-1.5 rounded text-xs font-bold ${isDisabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {isDisabled ? 'ACTIVER' : 'DÉSACTIVER'}
                                </button>
                                <button onClick={() => handleOpenGameEdit(game)} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600"><Edit2 size={16}/></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderConfig = () => (
        <div className="animate-in fade-in h-full p-4 bg-gray-900/50 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings/> Configuration Système</h3>
            <div className="space-y-6 max-w-lg">
                <div>
                    <label className="text-sm font-bold text-gray-400 mb-1 block">Seuil Détection Abus (Pièces)</label>
                    <input type="number" value={abuseThreshold} onChange={(e) => setAbuseThreshold(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white" />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-400 mb-1 block">Récompense Journalière Base</label>
                    <input type="number" value={dailyRewardBase} onChange={(e) => setDailyRewardBase(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white" />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-400 mb-1 block">Incrément Streak (Pièces/Jour)</label>
                    <input type="number" value={dailyRewardStreak} onChange={(e) => setDailyRewardStreak(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white" />
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500">SAUVEGARDER</button>
            </div>
        </div>
    );

    const renderFeatureFlags = () => (
        <div className="animate-in fade-in h-full">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Flag/> Feature Flags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(featureFlags).map(([key, enabled]) => (
                    <div key={key} className="bg-gray-800 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-white uppercase text-sm">{key.replace('_', ' ')}</h4>
                            <p className="text-xs text-gray-500">{enabled ? 'Module actif' : 'Module désactivé'}</p>
                        </div>
                        <button onClick={() => toggleFlag(key)} className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderContent = () => (
        <div className="animate-in fade-in h-full p-4 bg-gray-900/50 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Megaphone/> Diffusion Message</h3>
            <form onSubmit={handleBroadcast} className="space-y-4 max-w-lg">
                <div>
                    <label className="text-sm font-bold text-gray-400 mb-1 block">Message Global (Visible par tous)</label>
                    <textarea 
                        value={broadcastMsg} 
                        onChange={(e) => setBroadcastMsg(e.target.value)} 
                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white h-32 resize-none"
                        placeholder="Annonce importante..."
                    />
                </div>
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 flex items-center gap-2">
                    <Send size={16}/> DIFFUSER
                </button>
            </form>
        </div>
    );

    const renderEvents = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar/> Événements</h3>
                <button onClick={() => openEventModal()} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg flex items-center gap-2 text-sm hover:bg-green-500">
                    <Plus size={16}/> CRÉER
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {adminEvents.length === 0 && <p className="text-center text-gray-500 italic py-8">Aucun événement configuré.</p>}
                {adminEvents.map(event => (
                    <div key={event.id} className={`p-4 rounded-xl border ${event.active ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-white/10'} relative group`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-lg text-white">{event.title}</h4>
                                <p className="text-xs text-gray-400">{event.type} • {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDuplicateEvent(event)} className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-white hover:text-black"><Copy size={14}/></button>
                                <button onClick={() => { setCurrentEvent(event); setShowEventModal(true); }} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500"><Edit2 size={14}/></button>
                                <button onClick={() => {
                                    const newEvents = adminEvents.filter(e => e.id !== event.id);
                                    setAdminEvents(newEvents);
                                    localStorage.setItem('neon_admin_events', JSON.stringify(newEvents));
                                    mp.sendAdminBroadcast("Sync Events", "sync_events", newEvents);
                                    if(isSupabaseConfigured) DB.saveSystemConfig({ events: newEvents });
                                }} className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className="animate-in fade-in h-full bg-black border border-white/10 rounded-xl p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
            {activityLog.length === 0 && <p className="text-gray-600 italic">Aucune activité récente.</p>}
            {activityLog.map(log => (
                <div key={log.id} className="mb-1">
                    <span className="text-gray-500">[{new Date(log.id).toLocaleTimeString()}]</span> <span className={log.type === 'win' ? 'text-yellow-400' : log.type === 'login' ? 'text-green-400' : 'text-blue-400'}>{log.text}</span>
                </div>
            ))}
        </div>
    );

    const renderData = () => (
        <div className="animate-in fade-in h-full flex flex-col items-center justify-center space-y-6">
            <Database size={64} className="text-gray-600"/>
            <h3 className="text-xl font-bold text-white">Gestion des Données</h3>
            <div className="flex gap-4">
                <button onClick={exportData} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 flex items-center gap-2">
                    <Download size={20}/> EXPORTER JSON
                </button>
            </div>
            <p className="text-xs text-gray-500 max-w-md text-center">Exportez toutes les données utilisateurs, scores et configurations pour sauvegarde.</p>
        </div>
    );

    const renderSecurity = () => (
        <div className="animate-in fade-in h-full p-4 bg-gray-900/50 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Shield/> Sécurité & Urgence</h3>
            <div className="space-y-4">
                <div className="p-4 border border-red-500/30 bg-red-900/10 rounded-xl">
                    <h4 className="font-bold text-red-400 mb-2">Réinitialisation Admin (Vincent)</h4>
                    <p className="text-xs text-gray-400 mb-4">Remet le compte administrateur à zéro. Utile en cas de corruption de données locales.</p>
                    <button onClick={handleResetVincent} className="px-4 py-2 bg-red-600 text-white font-bold rounded text-xs hover:bg-red-500">RÉINITIALISER VINCENT</button>
                </div>
            </div>
        </div>
    );

    const renderFuture = () => (
        <div className="animate-in fade-in h-full flex flex-col items-center justify-center text-center opacity-50">
            <Rocket size={64} className="text-purple-500 mb-4"/>
            <h3 className="text-xl font-bold text-white">Roadmap</h3>
            <p className="text-sm text-gray-400">Fonctionnalités à venir...</p>
        </div>
    );

    const renderUsers = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex gap-4 mb-4 items-center">
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
                <select 
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as any)}
                    className="bg-gray-800 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:border-blue-500 outline-none font-bold"
                >
                    <option value="ALL">Tous les utilisateurs</option>
                    <option value="ONLINE">En ligne</option>
                    <option value="BANNED">Bannis</option>
                    <option value="ADMIN">Administrateurs</option>
                    <option value="MOD">Modérateurs</option>
                </select>
            </div>
            
            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Utilisateur</th>
                                <th className="p-4 text-center">Rôle</th>
                                <th className="p-4 text-center">Statut</th>
                                <th className="p-4 text-center">Pièces</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(p => {
                                    const isOnline = onlineUsers.some(u => u.id === p.username && u.status === 'online');
                                    const role = p.data?.role || (p.username === 'Vincent' ? 'ADMIN' : 'JOUEUR');
                                    return (
                                        <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedUser(p); setUserDetailTab('PROFIL'); }}>
                                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs">{p.username.substring(0,2).toUpperCase()}</div>
                                                <div>
                                                    <div>{p.username}</div>
                                                    <div className="text-[10px] text-gray-500 font-normal">{new Date(p.updated_at).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : role === 'MOD' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                                    {role}
                                                </span>
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
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">Aucun utilisateur trouvé pour ce filtre.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                    <p className="text-[10px] text-gray-500 font-mono mt-1">v3.1.0 • SYSTEM: ONLINE</p>
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
                            <h3 className="text-xl font-black text-white flex items-center gap-2"><Edit2 className="text-green-400"/> GESTION ÉVÉNEMENT</h3>
                            <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-white"><X/></button>
                        </div>
                        <div className="p-6">
                            <button onClick={handleSaveEvent} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg">SAUVEGARDER (SIMULATION)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EVENT ANALYTICS MODAL */}
            {showEventAnalytics && (
                <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowEventAnalytics(null)}>
                    {/* ... Analytics Content ... */}
                </div>
            )}

            {/* GAME EDIT MODAL */}
            {editingGame && (
                <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setEditingGame(null)}>
                    {/* ... Game Edit Content ... */}
                </div>
            )}

            {/* USER DETAIL MODAL - REDESIGNED */}
            {selectedUser && (
                <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedUser(null)}>
                    <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                                    {selectedUser.username.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">{selectedUser.username}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-mono">ID: {selectedUser.username}</span>
                                        {selectedUser.data?.banned && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold">BANNI</span>}
                                        {selectedUser.data?.muted && <span className="text-[10px] bg-yellow-600 text-white px-2 py-0.5 rounded font-bold">MUTÉ</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white"><X/></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-black/20 p-2 gap-2 border-b border-white/5">
                            <button onClick={() => setUserDetailTab('PROFIL')} className={`flex-1 py-2 text-xs font-bold rounded ${userDetailTab === 'PROFIL' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>PROFIL</button>
                            <button onClick={() => setUserDetailTab('GAMES')} className={`flex-1 py-2 text-xs font-bold rounded ${userDetailTab === 'GAMES' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>JEUX</button>
                            <button onClick={() => setUserDetailTab('ACTIVITY')} className={`flex-1 py-2 text-xs font-bold rounded ${userDetailTab === 'ACTIVITY' ? 'bg-green-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>ACTIVITÉ</button>
                            <button onClick={() => setUserDetailTab('SANCTIONS')} className={`flex-1 py-2 text-xs font-bold rounded ${userDetailTab === 'SANCTIONS' ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>SANCTIONS</button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-900/50">
                            
                            {/* TAB: PROFIL */}
                            {userDetailTab === 'PROFIL' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-2">SOLDE / CRÉDITS</label>
                                            <div className="flex gap-2">
                                                <div className="flex items-center bg-black border border-white/10 rounded-lg px-3 py-2 flex-1">
                                                    <Coins size={16} className="text-yellow-400 mr-2"/>
                                                    <span className="text-xl font-mono text-white">{selectedUser.data?.coins || 0}</span>
                                                </div>
                                                <button onClick={() => setShowEventModal(true)} className="px-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg"><Gift size={18}/></button>
                                            </div>
                                            <div className="mt-2 text-[10px] text-gray-500">
                                                <input type="number" placeholder="Montant" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="bg-transparent border-b border-white/10 w-20 text-white outline-none mr-2"/>
                                                <button onClick={handleGiftCoins} className="text-yellow-400 hover:text-white underline">Ajouter/Retirer</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-2">RÔLE UTILISATEUR</label>
                                            <select 
                                                value={selectedUser.data?.role || 'JOUEUR'} 
                                                onChange={(e) => handleRoleChange(e.target.value)}
                                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white outline-none font-bold"
                                            >
                                                <option value="JOUEUR">JOUEUR</option>
                                                <option value="MOD">MODÉRATEUR</option>
                                                <option value="ADMIN">ADMINISTRATEUR</option>
                                            </select>
                                            <p className="text-[10px] text-gray-500 mt-2">Définit les permissions d'accès au dashboard.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-2">INFORMATIONS SYSTÈME</label>
                                        <div className="bg-black/30 rounded-lg border border-white/5 p-3 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">ID Unique</span>
                                                <span className="text-xs font-mono text-white">{selectedUser.username}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Créé le</span>
                                                <span className="text-xs font-mono text-white">{new Date(selectedUser.updated_at).toLocaleDateString()} (Estimé)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Dernière IP</span>
                                                <span className="text-xs font-mono text-white">192.168.x.x (Masqué)</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-white/10 pt-4 mt-4">
                                        <button onClick={handleDeleteUser} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={12}/> Supprimer définitivement le compte</button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: JEUX */}
                            {userDetailTab === 'GAMES' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {GAMES_LIST.map(game => {
                                            const score = selectedUser.data?.highScores?.[game.id] || 0;
                                            return (
                                                <div key={game.id} className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{game.name}</span>
                                                    <span className={`text-xl font-mono font-bold ${score > 0 ? 'text-white' : 'text-gray-600'}`}>{typeof score === 'number' ? score.toLocaleString() : '-'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TAB: ACTIVITÉ */}
                            {userDetailTab === 'ACTIVITY' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div className="bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-800 text-gray-400 font-bold uppercase">
                                                <tr>
                                                    <th className="p-3">Date</th>
                                                    <th className="p-3">Action</th>
                                                    <th className="p-3 text-right">Détails</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {/* Simulated History based on last seen */}
                                                <tr>
                                                    <td className="p-3 text-gray-400 font-mono">{new Date(selectedUser.updated_at).toLocaleString()}</td>
                                                    <td className="p-3 text-white"><span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">LOGIN</span></td>
                                                    <td className="p-3 text-right text-gray-500">Connexion réussie</td>
                                                </tr>
                                                {/* Mock entries for demo */}
                                                <tr>
                                                    <td className="p-3 text-gray-400 font-mono">{new Date(Date.now() - 86400000).toLocaleString()}</td>
                                                    <td className="p-3 text-white"><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">GAME</span></td>
                                                    <td className="p-3 text-right text-gray-500">Tetris (Score: 1200)</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 text-gray-400 font-mono">{new Date(Date.now() - 172800000).toLocaleString()}</td>
                                                    <td className="p-3 text-white"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold">SHOP</span></td>
                                                    <td className="p-3 text-right text-gray-500">Achat Avatar (-500)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-center text-[10px] text-gray-500 italic">L'historique complet est conservé pendant 30 jours.</p>
                                </div>
                            )}

                            {/* TAB: SANCTIONS */}
                            {userDetailTab === 'SANCTIONS' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    {/* BAN */}
                                    <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/20 rounded-lg text-red-500"><Ban size={24}/></div>
                                            <div>
                                                <h4 className="font-bold text-red-200">Bannissement</h4>
                                                <p className="text-xs text-red-300/70">Empêche toute connexion au compte.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleBan} 
                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${selectedUser.data?.banned ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-red-600 text-white hover:bg-red-500'}`}
                                        >
                                            {selectedUser.data?.banned ? 'DÉBANNIR' : 'BANNIR'}
                                        </button>
                                    </div>

                                    {/* MUTE */}
                                    <div className="bg-yellow-900/10 border border-yellow-500/30 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500"><MicOff size={24}/></div>
                                            <div>
                                                <h4 className="font-bold text-yellow-200">Mute (Silence)</h4>
                                                <p className="text-xs text-yellow-300/70">Interdit l'accès au chat et aux messages.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleMute}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${selectedUser.data?.muted ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-yellow-600 text-white hover:bg-yellow-500'}`}
                                        >
                                            {selectedUser.data?.muted ? 'RÉTABLIR' : 'RENDRE MUET'}
                                        </button>
                                    </div>

                                    {/* SUSPENSION */}
                                    <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Timer size={24}/></div>
                                            <div>
                                                <h4 className="font-bold text-white">Suspension Temporaire</h4>
                                                <p className="text-xs text-gray-400">Définir une date de fin de sanction.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="date" className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm w-full outline-none" />
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs">APPLIQUER</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
