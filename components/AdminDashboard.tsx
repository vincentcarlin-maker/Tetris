
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, 
    Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, 
    Trash2, Ban, AlertTriangle, Check, Radio, Plus, Zap, Eye, Smartphone, 
    Edit2, Settings, Flag, Megaphone, FileText, Rocket, Lock, Save, Download, 
    RefreshCw, Moon, Sun, Volume2, Battery, Globe, ToggleLeft, ToggleRight,
    LogOut, TrendingUp, PieChart, MessageSquare, Gift, Star, Target, Palette, 
    Copy, Layers, Bell, RefreshCcw, CreditCard, ShoppingCart, History, AlertOctagon,
    Banknote, Percent, User, BookOpen, Sliders, TrendingDown, MicOff, Key, Crown,
    Mail, Inbox, Send, Smartphone as PhoneIcon
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
    { id: 'NOTIFICATIONS', label: 'Communication', icon: Bell },
    { id: 'ECONOMY', label: 'Économie', icon: Coins },
    { id: 'GAMES', label: 'Gestion Jeux', icon: Gamepad2 },
    { id: 'USERS', label: 'Utilisateurs', icon: Users },
    { id: 'STATS', label: 'Statistiques', icon: BarChart2 },
    { id: 'CONFIG', label: 'Configuration', icon: Settings },
    { id: 'FLAGS', label: 'Feature Flags', icon: Flag },
    { id: 'EVENTS', label: 'Événements', icon: Calendar },
    { id: 'DATA', label: 'Données', icon: Database },
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
    
    // User Management State
    const [userFilter, setUserFilter] = useState<'ALL' | 'ONLINE' | 'BANNED' | 'STAFF'>('ALL');
    const [userDetailTab, setUserDetailTab] = useState<'GENERAL' | 'HISTORY' | 'ADMIN'>('GENERAL');

    // Notifications State
    const [notifTab, setNotifTab] = useState<'INAPP' | 'PUSH' | 'EMAIL'>('INAPP');
    const [notifHistory, setNotifHistory] = useState<{id: number, type: string, target: string, content: string, time: number}[]>([]);
    
    // Push State
    const [pushTitle, setPushTitle] = useState('');
    const [pushBody, setPushBody] = useState('');
    const [pushTarget, setPushTarget] = useState('ALL');

    // Email State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

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

    const handleBroadcast = (e: React.FormEvent, type: 'info' | 'warning' = 'info') => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        mp.sendAdminBroadcast(broadcastMsg, type);
        
        setNotifHistory(prev => [{
            id: Date.now(),
            type: 'IN-APP',
            target: 'GLOBAL',
            content: broadcastMsg,
            time: Date.now()
        }, ...prev]);

        alert('Message In-App envoyé !');
        setBroadcastMsg('');
    };

    const handleSendPush = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pushTitle.trim() || !pushBody.trim()) return;
        
        // Simulation d'envoi Push
        setNotifHistory(prev => [{
            id: Date.now(),
            type: 'PUSH',
            target: pushTarget,
            content: `${pushTitle} - ${pushBody}`,
            time: Date.now()
        }, ...prev]);

        alert(`Notification Push envoyée à ${pushTarget} ! (Simulation)`);
        setPushTitle('');
        setPushBody('');
    };

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailSubject.trim() || !emailBody.trim()) return;

        // Simulation d'envoi Email
        setNotifHistory(prev => [{
            id: Date.now(),
            type: 'EMAIL',
            target: 'ALL_USERS',
            content: `${emailSubject}`,
            time: Date.now()
        }, ...prev]);

        alert('Campagne Email lancée ! (Simulation)');
        setEmailSubject('');
        setEmailBody('');
    };

    const handleGiftCoins = async () => {
        if (!selectedUser) return;
        const currentCoins = selectedUser.data?.coins || 0;
        const newAmount = currentCoins + giftAmount;
        
        // 1. Update DB (Source of Truth)
        if (isSupabaseConfigured) {
            await DB.updateUserData(selectedUser.username, { coins: newAmount });
        }
        
        // 2. Broadcast to user (if online) to update their local state instantly
        mp.sendAdminBroadcast(
            `🎁 Cadeau Admin : +${giftAmount} Pièces !`, 
            'user_update', 
            { 
                targetUser: selectedUser.username, 
                action: 'ADD_COINS', 
                amount: giftAmount 
            }
        );

        // 3. Local Dashboard Mirror Update (Visual Feedback for Admin)
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr); d.coins = newAmount;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }
        
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: { ...u.data, coins: newAmount } } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: { ...prev.data, coins: newAmount } }));
        alert(`Envoyé ! Nouveau solde pour ${selectedUser.username} : ${newAmount}`);
    };

    const handleUpdateUserProp = async (prop: string, value: any) => {
        if (!selectedUser) return;
        const newData = { ...selectedUser.data, [prop]: value };
        
        if (isSupabaseConfigured) await DB.updateUserData(selectedUser.username, { [prop]: value });
        
        const userDataStr = localStorage.getItem('neon_data_' + selectedUser.username);
        if (userDataStr) {
            const d = JSON.parse(userDataStr); d[prop] = value;
            localStorage.setItem('neon_data_' + selectedUser.username, JSON.stringify(d));
        }
        
        setProfiles(p => p.map(u => u.username === selectedUser.username ? { ...u, data: newData } : u));
        setSelectedUser((prev: any) => ({ ...prev, data: newData }));
        
        // Notify if sanction
        if (prop === 'banned' || prop === 'muted' || prop === 'role') {
            mp.sendAdminBroadcast("Mise à jour de votre compte", "user_update", { targetUser: selectedUser.username, action: 'UPDATE_PROP', prop, value });
        }
    };

    const handleBan = () => {
        if (!selectedUser) return;
        const isBanned = selectedUser.data?.banned;
        if (!isBanned && !window.confirm(`Voulez-vous vraiment bannir l'utilisateur ${selectedUser.username} ?`)) return;
        handleUpdateUserProp('banned', !isBanned);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte de ${selectedUser.username} ? Cette action est irréversible.`);
        if (!confirmDelete) return;

        const username = selectedUser.username;

        // 1. Supabase deletion
        if (isSupabaseConfigured) {
            await DB.deleteUser(username);
        }

        // 2. Local Storage deletion
        const usersDbStr = localStorage.getItem('neon_users_db');
        if (usersDbStr) {
            const usersDb = JSON.parse(usersDbStr);
            delete usersDb[username];
            localStorage.setItem('neon_users_db', JSON.stringify(usersDb));
        }
        localStorage.removeItem('neon_data_' + username);

        // 3. Update State
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
            banned: false
        };

        // 1. Update Cloud
        if (isSupabaseConfigured) {
            await DB.updateUserData('Vincent', freshData);
        }

        // 2. Update Local Storage Mirror
        localStorage.setItem('neon_data_Vincent', JSON.stringify(freshData));

        // 3. If currently logged in as Vincent, reset active session keys immediately
        const currentUser = localStorage.getItem('neon-username');
        if (currentUser === 'Vincent') {
            localStorage.setItem('neon-coins', '0');
            localStorage.setItem('neon-inventory', '[]');
            localStorage.setItem('neon-avatar', 'av_bot');
            localStorage.setItem('neon-owned-avatars', JSON.stringify(['av_bot', 'av_human']));
            localStorage.setItem('neon-highscores', JSON.stringify(freshData.highScores));
            // Force reset of other cosmetic keys to defaults
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

    const handleDeleteEvent = (id: string) => {
        if(!window.confirm("Supprimer cet événement ?")) return;
        const newEvents = adminEvents.filter(e => e.id !== id);
        setAdminEvents(newEvents);
        localStorage.setItem('neon_admin_events', JSON.stringify(newEvents));
        
        // Broadcast update
        mp.sendAdminBroadcast("Sync Events", "sync_events", newEvents);
        
        if (isSupabaseConfigured) {
            DB.saveSystemConfig({ events: newEvents });
        }
    };

    const openEventModal = (event?: AdminEvent) => {
        setEventTab('GENERAL');
        if (event) {
            setCurrentEvent(event);
        } else {
            setCurrentEvent({
                id: '', 
                title: '', 
                description: '', 
                type: 'XP_BOOST', 
                startDate: new Date().toISOString().split('T')[0], 
                endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], 
                active: true,
                objectives: [{ type: 'PLAY_GAMES', target: 5, gameIds: [] }],
                rewards: { coins: 100 },
                theme: { primaryColor: '#00f3ff' },
                leaderboardActive: false
            });
        }
        setShowEventModal(true);
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

    // --- RENDERERS ---

    const renderNotifications = () => (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                <button onClick={() => setNotifTab('INAPP')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${notifTab === 'INAPP' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <Megaphone size={14}/> IN-APP BROADCAST
                </button>
                <button onClick={() => setNotifTab('PUSH')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${notifTab === 'PUSH' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <PhoneIcon size={14}/> NOTIFICATIONS PUSH
                </button>
                <button onClick={() => setNotifTab('EMAIL')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${notifTab === 'EMAIL' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <Mail size={14}/> EMAILING
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                
                {/* LEFT: ACTION FORM */}
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 flex flex-col overflow-y-auto">
                    {notifTab === 'INAPP' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2"><Radio size={20}/> MESSAGE EN DIRECT</h3>
                            <p className="text-xs text-gray-400">Envoie un message instantané à tous les joueurs connectés en ce moment.</p>
                            
                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">CONTENU DU MESSAGE</label>
                                <textarea 
                                    value={broadcastMsg}
                                    onChange={e => setBroadcastMsg(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none h-32 resize-none"
                                    placeholder="Ex: Maintenance serveur dans 5 minutes..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button onClick={(e) => handleBroadcast(e, 'info')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Radio size={18}/> INFO
                                </button>
                                <button onClick={(e) => handleBroadcast(e, 'warning')} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <AlertTriangle size={18}/> ALERTE
                                </button>
                            </div>
                        </div>
                    )}

                    {notifTab === 'PUSH' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Smartphone size={20}/> NOTIFICATION MOBILE</h3>
                            <p className="text-xs text-gray-400">Envoie une notification native aux appareils (PWA/Mobile).</p>
                            
                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">TITRE</label>
                                <input 
                                    type="text" 
                                    value={pushTitle} 
                                    onChange={e => setPushTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Ex: Bonus de Connexion !"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">MESSAGE</label>
                                <textarea 
                                    value={pushBody}
                                    onChange={e => setPushBody(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none h-24 resize-none"
                                    placeholder="Ex: Revenez jouer pour gagner 500 pièces..."
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">CIBLE</label>
                                <select 
                                    value={pushTarget} 
                                    onChange={e => setPushTarget(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                                >
                                    <option value="ALL">Tous les utilisateurs</option>
                                    <option value="ACTIVE_7D">Actifs (7 jours)</option>
                                    <option value="INACTIVE_30D">Inactifs (30 jours)</option>
                                    <option value="ANDROID">Android</option>
                                    <option value="IOS">iOS</option>
                                </select>
                            </div>

                            <button onClick={handleSendPush} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                                <Send size={18}/> ENVOYER PUSH
                            </button>
                        </div>
                    )}

                    {notifTab === 'EMAIL' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2"><Mail size={20}/> CAMPAGNE E-MAIL</h3>
                            <p className="text-xs text-gray-400">Newsletter ou annonces importantes.</p>
                            
                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">SUJET</label>
                                <input 
                                    type="text" 
                                    value={emailSubject} 
                                    onChange={e => setEmailSubject(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-yellow-500 outline-none"
                                    placeholder="Ex: Nouveautés de la semaine"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs text-gray-300 font-bold block mb-1">CONTENU (HTML/Text)</label>
                                <textarea 
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-yellow-500 outline-none h-40 resize-none font-mono"
                                    placeholder="<h1>Bonjour %username% !</h1>..."
                                />
                            </div>

                            <button onClick={handleSendEmail} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
                                <Send size={18}/> ENVOYER EMAILS
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: HISTORY LOG */}
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><History size={20}/> HISTORIQUE D'ENVOI</h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {notifHistory.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-10">Aucun historique récent.</p>}
                        
                        {notifHistory.map(log => (
                            <div key={log.id} className="bg-black/30 p-3 rounded-lg border border-white/5 relative">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        log.type === 'IN-APP' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                                        log.type === 'PUSH' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                                        'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-[10px] text-gray-500">{new Date(log.time).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-300 font-bold mb-1">Cible: <span className="text-white">{log.target}</span></p>
                                <p className="text-sm text-white break-words">{log.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
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

                        {/* RICH LIST */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> CLASSEMENT FORTUNE (TOP 10)</h4>
                            <div className="space-y-2">
                                {richList.map((p, i) => (
                                    <div key={p.username} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-white/5 hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setSelectedUser(p)}>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-black font-mono text-lg w-8 text-center ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-orange-400':'text-gray-600'}`}>#{i+1}</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">{p.username}</span>
                                                <span className="text-[10px] text-gray-500">ID: {p.username}</span>
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

                {ecoTab === 'CONFIG' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Gift size={20} className="text-pink-400"/> RÉCOMPENSES QUOTIDIENNES</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">BASE (JOUR 1)</label>
                                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg px-3 py-2">
                                        <Coins size={16} className="text-yellow-400 mr-2"/>
                                        <input type="number" value={dailyRewardBase} onChange={e => setDailyRewardBase(Number(e.target.value))} className="bg-transparent text-white font-mono w-full outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold block mb-2">BONUS / JOUR (STREAK)</label>
                                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg px-3 py-2">
                                        <Plus size={16} className="text-green-400 mr-2"/>
                                        <input type="number" value={dailyRewardStreak} onChange={e => setDailyRewardStreak(Number(e.target.value))} className="bg-transparent text-white font-mono w-full outline-none" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">Note: Ces valeurs seront appliquées lors de la prochaine connexion des joueurs.</p>
                            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs">SAUVEGARDER CONFIG</button>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Percent size={20} className="text-blue-400"/> MULTIPLICATEURS GLOBAUX</h3>
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                <div>
                                    <div className="text-sm font-bold text-white">Week-end Double XP</div>
                                    <div className="text-xs text-gray-500">Multiplie tous les gains par 2.</div>
                                </div>
                                <ToggleLeft className="text-gray-600" size={32}/>
                            </div>
                        </div>
                    </div>
                )}

                {ecoTab === 'TRANSACTIONS' && (
                    <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="p-4">Date/Heure</th>
                                    <th className="p-4">Utilisateur</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {mockTransactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-white/5">
                                        <td className="p-4 text-gray-500 font-mono text-xs">{tx.time}</td>
                                        <td className="p-4 font-bold text-white">{tx.user}</td>
                                        <td className="p-4 text-xs">
                                            <span className={`px-2 py-1 rounded ${tx.action.includes('ACHAT') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {tx.action}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {ecoTab === 'ABUSE' && (
                    <div className="space-y-4">
                        <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="text-red-500"/>
                                <div>
                                    <h4 className="font-bold text-red-200">Seuil de Détection</h4>
                                    <p className="text-xs text-red-300/70">Alerter si un utilisateur dépasse ce montant.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" value={abuseThreshold} onChange={e => setAbuseThreshold(Number(e.target.value))} className="bg-black/50 border border-red-500/30 rounded px-3 py-1 text-white font-mono w-32 outline-none" />
                                <span className="text-xs text-red-400 font-bold">PIÈCES</span>
                            </div>
                        </div>

                        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-gray-800/50">
                                <h4 className="font-bold text-white text-sm">UTILISATEURS SUSPECTS ({suspiciousUsers.length})</h4>
                            </div>
                            {suspiciousUsers.length > 0 ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                                        <tr>
                                            <th className="p-4">Utilisateur</th>
                                            <th className="p-4 text-center">Solde</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {suspiciousUsers.map(p => (
                                            <tr key={p.username} className="hover:bg-red-900/10 transition-colors">
                                                <td className="p-4 font-bold text-white">{p.username}</td>
                                                <td className="p-4 text-center font-mono text-yellow-400 font-bold">{p.data?.coins?.toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setSelectedUser(p)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold mr-2">DÉTAILS</button>
                                                    <button className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold">BANNIR</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-gray-500 italic text-sm">Aucun utilisateur suspect détecté.</div>
                            )}
                        </div>
                    </div>
                )}
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
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Banknote size={16}/> Masse Monétaire</h4>
                    <div className="flex items-center gap-2">
                        <Coins size={24} className="text-yellow-400"/>
                        <span className="text-3xl font-black text-white">{totalCoins.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><User size={16}/> Moyenne / Joueur</h4>
                    <div className="flex items-center gap-2">
                        <TrendingUp size={24} className="text-green-400"/>
                        <span className="text-3xl font-black text-white">
                            {economyPlayersCount > 0 ? Math.round(totalCoins / economyPlayersCount).toLocaleString() : 0}
                        </span>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><ShoppingCart size={16}/> Items Vendus</h4>
                    <div className="flex items-center gap-2">
                        <Gamepad2 size={24} className="text-cyan-400"/>
                        <span className="text-3xl font-black text-white">
                            {totalItemsSold.toLocaleString()}
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
                                <span className="text-xs font-bold text-gray-300 w-24 truncate">{g.name}</span>
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
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Gamepad2 className="text-blue-400"/> CATALOGUE DE JEUX</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GAMES_LIST.map(rawGame => {
                    const game = getGameData(rawGame);
                    const isDisabled = disabledGames.includes(game.id);
                    const stats = getGameDetailedStats(game.id);
                    
                    return (
                        <div key={game.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all relative overflow-hidden group ${isDisabled ? 'bg-red-900/10 border-red-500/30' : 'bg-gray-800 border-white/10 hover:border-blue-500/30'}`}>
                            
                            {/* Header */}
                            <div className="flex justify-between items-center z-10 relative">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDisabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                        <Gamepad2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-lg ${isDisabled ? 'text-gray-400' : 'text-white'}`}>{game.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono">v{game.version}</p>
                                    </div>
                                </div>
                                <button onClick={() => toggleGame(game.id)} className={`relative w-12 h-6 rounded-full transition-colors ${isDisabled ? 'bg-gray-600' : 'bg-green-500'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDisabled ? 'translate-x-0' : 'translate-x-6'}`}></div>
                                </button>
                            </div>

                            {/* Mini Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-2 z-10 relative">
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">JOUÉS</p>
                                    <p className="text-sm font-bold text-blue-400">{stats.totalPlays}</p>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">ABANDON</p>
                                    <p className={`text-sm font-bold ${stats.abandonRate > 30 ? 'text-red-400' : 'text-green-400'}`}>{stats.abandonRate}%</p>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold">REWARD</p>
                                    <p className="text-sm font-bold text-yellow-400">{game.baseReward || 50}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto pt-3 border-t border-white/5 z-10 relative">
                                <button onClick={() => handleOpenGameEdit(rawGame)} className="flex-1 py-2 text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold rounded-lg transition-colors border border-blue-500/30 flex items-center justify-center gap-2">
                                    <Edit2 size={14}/> CONFIGURER
                                </button>
                            </div>
                            
                            {/* Background decoration */}
                            <div className="absolute -right-4 -bottom-4 text-white/5 transform rotate-12 pointer-events-none">
                                <Gamepad2 size={100} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderUsers = () => {
        // Filter Logic
        const filteredUsers = profiles.filter(p => {
            const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            
            const isOnline = onlineUsers.some(u => u.id === p.username && u.status === 'online');
            
            if (userFilter === 'ONLINE') return isOnline;
            if (userFilter === 'BANNED') return p.data?.banned;
            if (userFilter === 'STAFF') return p.data?.role === 'ADMIN' || p.data?.role === 'MOD';
            
            return true;
        });

        return (
            <div className="animate-in fade-in h-full flex flex-col">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un joueur (ID, Nom)..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-white/10">
                        <button onClick={() => setUserFilter('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${userFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>TOUS</button>
                        <button onClick={() => setUserFilter('ONLINE')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${userFilter === 'ONLINE' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>EN LIGNE</button>
                        <button onClick={() => setUserFilter('BANNED')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${userFilter === 'BANNED' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>BANNIS</button>
                        <button onClick={() => setUserFilter('STAFF')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${userFilter === 'STAFF' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>STAFF</button>
                    </div>
                </div>

                <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Utilisateur</th>
                                    <th className="p-4 text-center">Rôle</th>
                                    <th className="p-4 text-center">Statut</th>
                                    <th className="p-4 text-center">Solde</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(p => {
                                    const isOnline = onlineUsers.some(u => u.id === p.username && u.status === 'online');
                                    const role = p.data?.role || 'USER';
                                    
                                    return (
                                        <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedUser(p); setUserDetailTab('GENERAL'); }}>
                                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs border border-white/10">
                                                    {p.username.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div>{p.username}</div>
                                                    <div className="text-[10px] text-gray-500 font-normal font-mono">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Jamais'}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${role === 'ADMIN' ? 'bg-red-900/30 text-red-400 border-red-500/30' : role === 'MOD' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-400 border-white/10'}`}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-400' : p.data?.banned ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                                    {p.data?.banned ? 'BANNI' : isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-mono text-yellow-400">{p.data?.coins || 0}</td>
                                            <td className="p-4 text-right"><div className="p-2 hover:bg-white/10 rounded-full inline-block"><ChevronRight size={16} className="text-gray-500"/></div></td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Aucun utilisateur trouvé.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

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

    // --- MAIN LAYOUT ---
    return (
        <div className="h-full w-full bg-black/95 text-white font-sans flex overflow-hidden">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-gray-900 border-r border-white/10 flex flex-col shrink-0 hidden md:flex">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ADMIN PANEL</h1>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">v3.3.0 • SYSTEM: ONLINE</p>
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
                    {activeSection === 'NOTIFICATIONS' && renderNotifications()}
                    {activeSection === 'ECONOMY' && renderEconomy()}
                    {activeSection === 'STATS' && renderStats()}
                    {activeSection === 'GAMES' && renderGamesManager()}
                    {activeSection === 'USERS' && renderUsers()}
                    {activeSection === 'CONFIG' && renderConfig()}
                    {activeSection === 'FLAGS' && renderFeatureFlags()}
                    {activeSection === 'EVENTS' && renderEvents()}
                    {activeSection === 'DATA' && renderData()}
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
                    <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Gamepad2 size={24}/></div>
                                <div>
                                    <h3 className="text-lg font-black text-white">{editingGame.config.name}</h3>
                                    <span className="text-xs text-gray-500 font-mono">ID: {editingGame.id}</span>
                                </div>
                            </div>
                            <button onClick={() => setEditingGame(null)} className="text-gray-400 hover:text-white"><X/></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-black/20 p-2 gap-2 border-b border-white/5">
                            <button onClick={() => setGameEditTab('GENERAL')} className={`flex-1 py-2 text-xs font-bold rounded ${gameEditTab === 'GENERAL' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>GÉNÉRAL</button>
                            <button onClick={() => setGameEditTab('RULES')} className={`flex-1 py-2 text-xs font-bold rounded ${gameEditTab === 'RULES' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>RÈGLES</button>
                            <button onClick={() => setGameEditTab('PARAMS')} className={`flex-1 py-2 text-xs font-bold rounded ${gameEditTab === 'PARAMS' ? 'bg-yellow-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>PARAMÈTRES</button>
                            <button onClick={() => setGameEditTab('STATS')} className={`flex-1 py-2 text-xs font-bold rounded ${gameEditTab === 'STATS' ? 'bg-green-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>STATS</button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            
                            {/* GENERAL TAB */}
                            {gameEditTab === 'GENERAL' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">NOM DU JEU</label>
                                        <input 
                                            type="text" 
                                            value={editingGame.config.name} 
                                            onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, name: e.target.value}})} 
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-bold" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">VERSION</label>
                                        <input 
                                            type="text" 
                                            value={editingGame.config.version} 
                                            onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, version: e.target.value}})} 
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono" 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* RULES TAB */}
                            {gameEditTab === 'RULES' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30 flex gap-2 items-start">
                                        <BookOpen className="text-purple-400 shrink-0 mt-0.5" size={16}/>
                                        <p className="text-xs text-purple-200">Définissez les règles affichées aux joueurs lors du tutoriel ou de l'écran d'accueil.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">DESCRIPTION & RÈGLES</label>
                                        <textarea 
                                            value={editingGame.config.rules || ''} 
                                            onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, rules: e.target.value}})} 
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-purple-500 outline-none h-40 resize-none text-sm leading-relaxed"
                                            placeholder="Ex: Alignez 3 symboles pour gagner..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PARAMS TAB */}
                            {gameEditTab === 'PARAMS' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-500/30 flex gap-2 items-center">
                                        <Sliders className="text-yellow-400" size={16}/>
                                        <p className="text-xs text-yellow-200">Ajustez l'équilibrage du jeu.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">NIVEAUX MAX</label>
                                            <input 
                                                type="number" 
                                                value={editingGame.config.maxLevel || 20} 
                                                onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, maxLevel: parseInt(e.target.value)}})} 
                                                className="w-full bg-black border border-white/20 rounded-lg p-2 text-white font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold block mb-1">RÉCOMPENSE BASE</label>
                                            <div className="flex items-center bg-black border border-white/20 rounded-lg px-2">
                                                <Coins size={14} className="text-yellow-400 mr-2"/>
                                                <input 
                                                    type="number" 
                                                    value={editingGame.config.baseReward || 50} 
                                                    onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, baseReward: parseInt(e.target.value)}})} 
                                                    className="w-full bg-transparent py-2 text-white font-mono outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">DIFFICULTÉ GLOBALE</label>
                                        <select 
                                            value={editingGame.config.difficulty || 'ADAPTIVE'} 
                                            onChange={e => setEditingGame({...editingGame, config: {...editingGame.config, difficulty: e.target.value as any}})}
                                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white outline-none"
                                        >
                                            <option value="EASY">Facile (Débutant)</option>
                                            <option value="MEDIUM">Moyen (Standard)</option>
                                            <option value="HARD">Difficile (Expert)</option>
                                            <option value="ADAPTIVE">Adaptative (Auto)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* STATS TAB */}
                            {gameEditTab === 'STATS' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    {(() => {
                                        const stats = getGameDetailedStats(editingGame.id);
                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 text-center">
                                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Popularité</p>
                                                        <p className="text-3xl font-black text-blue-400">{stats.totalPlays}</p>
                                                        <p className="text-[10px] text-gray-400">parties jouées</p>
                                                    </div>
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/10 text-center">
                                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Actifs</p>
                                                        <p className="text-3xl font-black text-green-400">{stats.activePlayers}</p>
                                                        <p className="text-[10px] text-gray-400">joueurs uniques</p>
                                                    </div>
                                                </div>

                                                <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-bold text-red-300 flex items-center gap-2"><TrendingDown size={16}/> Taux d'Abandon</span>
                                                        <span className="text-2xl font-black text-red-500">{stats.abandonRate}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500" style={{ width: `${stats.abandonRate}%` }}></div>
                                                    </div>
                                                    <p className="text-[10px] text-red-400/70 mt-2 italic">Basé sur les joueurs avec un score nul ou très faible.</p>
                                                </div>

                                                <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-2">Score Moyen</p>
                                                    <p className="text-2xl font-mono text-yellow-400">{stats.avgScore}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-white/10 bg-black/40 flex gap-4">
                            <button onClick={() => setEditingGame(null)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">ANNULER</button>
                            <button onClick={handleSaveGameEdit} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                                <Save size={18}/> SAUVEGARDER CONFIG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW ENHANCED USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedUser(null)}>
                    <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Header Profile */}
                        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-gray-900 to-gray-800 relative">
                            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg border-2 border-white/20">
                                    {selectedUser.username.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">{selectedUser.username}</h2>
                                    <div className="flex items-center gap-3 mt-1 text-sm">
                                        <span className="font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded">ID: {selectedUser.username}</span>
                                        {(() => {
                                            const isOnline = onlineUsers.some(u => u.id === selectedUser.username && u.status === 'online');
                                            return (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${isOnline ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700/50 text-gray-400'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                                    {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {selectedUser.data?.role === 'ADMIN' && <span className="text-[10px] bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold flex items-center gap-1"><Shield size={10}/> ADMIN</span>}
                                        {selectedUser.data?.role === 'MOD' && <span className="text-[10px] bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 font-bold flex items-center gap-1"><Shield size={10}/> MODÉRATEUR</span>}
                                        {selectedUser.data?.banned && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1"><Ban size={10}/> BANNI</span>}
                                        {selectedUser.data?.muted && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 font-bold flex items-center gap-1"><MicOff size={10}/> MUET</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-black/20 p-2 gap-2 border-b border-white/5">
                            <button onClick={() => setUserDetailTab('GENERAL')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${userDetailTab === 'GENERAL' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>PROFIL</button>
                            <button onClick={() => setUserDetailTab('HISTORY')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${userDetailTab === 'HISTORY' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>PERFORMANCES</button>
                            <button onClick={() => setUserDetailTab('ADMIN')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${userDetailTab === 'ADMIN' ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>SANCTIONS & RÔLES</button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-900">
                            
                            {/* TAB: GENERAL */}
                            {userDetailTab === 'GENERAL' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Coins size={14}/> SOLDE ACTUEL</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-3xl font-mono text-yellow-400 font-bold">{selectedUser.data?.coins || 0}</span>
                                                <button onClick={handleGiftCoins} className="text-[10px] bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded font-bold transition-colors">AJOUTER</button>
                                            </div>
                                            {giftAmount > 0 && <input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="mt-2 w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white" placeholder="Montant"/>}
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                            <p className="text-gray-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Clock size={14}/> DERNIÈRE ACTIVITÉ</p>
                                            <span className="text-xl font-bold text-white">{new Date(selectedUser.updated_at).toLocaleDateString()}</span>
                                            <p className="text-xs text-gray-500">{new Date(selectedUser.updated_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                        <p className="text-gray-500 text-xs font-bold uppercase mb-3">INVENTAIRE (Aperçu)</p>
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="px-3 py-1 bg-black/30 rounded border border-white/10 text-xs text-gray-300">
                                                Avatars: <span className="text-white font-bold">{selectedUser.data?.ownedAvatars?.length || 0}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-black/30 rounded border border-white/10 text-xs text-gray-300">
                                                Cadres: <span className="text-white font-bold">{selectedUser.data?.ownedFrames?.length || 0}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-black/30 rounded border border-white/10 text-xs text-gray-300">
                                                Badges: <span className="text-white font-bold">{selectedUser.data?.inventory?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: HISTORY (High Scores) */}
                            {userDetailTab === 'HISTORY' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">RECORDS PAR JEU</h3>
                                    <div className="bg-gray-800 rounded-xl border border-white/10 overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-900/50 text-gray-400 font-bold uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3">Jeu</th>
                                                    <th className="p-3 text-right">Meilleur Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {GAMES_LIST.map(game => {
                                                    const score = selectedUser.data?.highScores?.[game.id];
                                                    // Handle Sudoku complexity (object)
                                                    const displayScore = (game.id === 'sudoku' && typeof score === 'object') ? score?.medium : score;
                                                    
                                                    if (displayScore === undefined || displayScore === 0) return null;

                                                    return (
                                                        <tr key={game.id} className="hover:bg-white/5">
                                                            <td className="p-3 font-bold text-gray-300">{game.name}</td>
                                                            <td className="p-3 text-right font-mono text-cyan-400 font-bold">{displayScore}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {Object.keys(selectedUser.data?.highScores || {}).length === 0 && (
                                                    <tr><td colSpan={2} className="p-6 text-center text-gray-500 italic">Aucune partie jouée.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: ADMIN (Sanctions & Roles) */}
                            {userDetailTab === 'ADMIN' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    
                                    {/* ROLE MANAGEMENT */}
                                    <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl">
                                        <h4 className="text-purple-300 font-bold text-sm mb-4 flex items-center gap-2"><Crown size={16}/> GESTION DU RÔLE</h4>
                                        <div className="flex gap-2">
                                            {['USER', 'MOD', 'ADMIN'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleUpdateUserProp('role', role)}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${selectedUser.data?.role === role || (!selectedUser.data?.role && role === 'USER') 
                                                        ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.4)]' 
                                                        : 'bg-gray-800 text-gray-400 border-transparent hover:border-white/20'}`}
                                                >
                                                    {role === 'USER' ? 'JOUEUR' : role === 'MOD' ? 'MODÉRATEUR' : 'ADMINISTRATEUR'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SANCTIONS */}
                                    <div className="space-y-3">
                                        <h4 className="text-red-300 font-bold text-sm mb-2 flex items-center gap-2"><Shield size={16}/> SANCTIONS</h4>
                                        
                                        {/* MUTE */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-white/5">
                                            <div>
                                                <div className="font-bold text-white text-sm flex items-center gap-2"><MicOff size={14}/> MUTE (CHAT)</div>
                                                <div className="text-xs text-gray-500">Empêche l'utilisateur de parler dans le chat global.</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUpdateUserProp('muted', !selectedUser.data?.muted)}
                                                className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${selectedUser.data?.muted ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                            >
                                                {selectedUser.data?.muted ? 'DÉMUT' : 'MUTE'}
                                            </button>
                                        </div>

                                        {/* BAN */}
                                        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-white/5">
                                            <div>
                                                <div className="font-bold text-white text-sm flex items-center gap-2"><Ban size={14}/> BANNISSEMENT</div>
                                                <div className="text-xs text-gray-500">Bloque l'accès complet au jeu.</div>
                                            </div>
                                            <button 
                                                onClick={handleBan}
                                                className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${selectedUser.data?.banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                                            >
                                                {selectedUser.data?.banned ? 'DÉBANNIR' : 'BANNIR'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* DANGER ZONE */}
                                    <div className="pt-4 border-t border-red-500/20 mt-4">
                                        <button onClick={handleDeleteUser} className="w-full py-3 bg-red-950/50 hover:bg-red-900 border border-red-900 text-red-500 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs">
                                            <Trash2 size={14}/> SUPPRIMER LE COMPTE DÉFINITIVEMENT
                                        </button>
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
