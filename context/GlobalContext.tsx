
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useDailySystem, DailyQuest } from '../hooks/useDailySystem';
import { useHighScores, HighScores } from '../hooks/useHighScores';
import { useSupabase, OnlineUser } from '../hooks/useSupabase';
import { DB } from '../lib/supabaseClient';
import { FriendRequest } from '../components/SocialOverlay';

// --- TYPES ---
export type ViewState = 'menu' | 'social' | 'settings' | 'contact' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'airhockey' | 'mastermind' | 'uno' | 'watersort' | 'checkers' | 'runner' | 'stack' | 'arenaclash' | 'skyjo' | 'lumen' | 'slither' | 'shop' | 'admin_dashboard';
export type SocialTab = 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS';

interface GlobalContextType {
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    isAuthenticated: boolean;
    setIsAuthenticated: (val: boolean) => void;
    showLoginModal: boolean;
    setShowLoginModal: (val: boolean) => void;
    globalAlert: { message: string, type: 'info' | 'warning' } | null;
    setGlobalAlert: (val: { message: string, type: 'info' | 'warning' } | null) => void;
    activeSocialTab: SocialTab;
    setActiveSocialTab: (tab: SocialTab) => void;
    unreadMessages: number;
    setUnreadMessages: (count: number) => void;
    friendRequests: FriendRequest[];
    setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
    disabledGames: string[];
    featureFlags: Record<string, boolean>;
    globalEvents: any[];
    eventProgress: Record<string, number>;
    updateEventProgress: (gameId: string, metric: string, value: number) => void;
    handleGameEvent: (gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => void;
    handleLogin: (username: string, cloudData?: any) => void;
    handleLogout: () => void;
    
    // Hooks exposés
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    highScores: ReturnType<typeof useHighScores>;
    daily: ReturnType<typeof useDailySystem>;
    supabase: ReturnType<typeof useSupabase>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
    return context;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE CORE ---
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [globalAlert, setGlobalAlert] = useState<{ message: string, type: 'info' | 'warning' } | null>(null);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    
    // --- SOCIAL ---
    const [activeSocialTab, setActiveSocialTab] = useState<SocialTab>('COMMUNITY');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]); 

    // --- CONFIG & ADMIN ---
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem('neon_feature_flags') || '{}'); } catch { return {}; }
    });
    const [globalEvents, setGlobalEvents] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_admin_events') || '[]'); } catch { return []; }
    });
    const [eventProgress, setEventProgress] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem('neon_event_progress') || '{}'); } catch { return {}; }
    });

    // --- HOOKS INITIALIZATION ---
    const audio = useGameAudio();
    const currency = useCurrency();
    const mp = useMultiplayer(); 
    const highScoresHook = useHighScores(); 
    const daily = useDailySystem(currency.addCoins);
    const supabaseHook = useSupabase(
        mp.peerId, currency.username, currency.currentAvatarId, currency.currentFrameId,
        highScoresHook.highScores, currentView
    );

    const saveTimeoutRef = useRef<any>(null);

    // --- EFFECTS ---

    // 1. Auth Init
    useEffect(() => {
        const storedName = localStorage.getItem('neon-username');
        if (storedName) setIsAuthenticated(true);
    }, []);

    // 2. MP Connection
    useEffect(() => {
        if (isAuthenticated) mp.connect();
        return () => mp.disconnect();
    }, [isAuthenticated]);

    // 3. Friend Requests Listener
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'FRIEND_REQUEST') {
                const sender = data.sender;
                setFriendRequests(prev => {
                    if (prev.some(r => r.id === sender.id)) return prev;
                    const storedFriends = localStorage.getItem('neon_friends');
                    let friends = [];
                    if (storedFriends) { try { friends = JSON.parse(storedFriends); } catch {} }
                    if (friends.some((f: any) => f.id === sender.id)) return prev;
                    audio.playCoin(); 
                    return [...prev, { ...sender, timestamp: Date.now() }];
                });
            }
        });
        return () => unsubscribe();
    }, [mp, audio]);

    // 4. System Config Loader
    useEffect(() => {
        const loadSystemConfig = async () => {
            if (!supabaseHook.isConnectedToSupabase) return;
            const sysConfig = await DB.getSystemConfig();
            if (sysConfig) {
                if (sysConfig.disabledGames && Array.isArray(sysConfig.disabledGames)) {
                    setDisabledGames(sysConfig.disabledGames);
                    localStorage.setItem('neon_disabled_games', JSON.stringify(sysConfig.disabledGames));
                }
                if (sysConfig.events && Array.isArray(sysConfig.events)) {
                    setGlobalEvents(sysConfig.events);
                    localStorage.setItem('neon_admin_events', JSON.stringify(sysConfig.events));
                }
                if (sysConfig.featureFlags) {
                    setFeatureFlags(sysConfig.featureFlags);
                    localStorage.setItem('neon_feature_flags', JSON.stringify(sysConfig.featureFlags));
                }
            }
        };
        loadSystemConfig();
    }, [supabaseHook.isConnectedToSupabase]);

    // 5. Cloud Sync (Download)
    useEffect(() => {
        if (isAuthenticated && supabaseHook.isConnectedToSupabase && !isCloudSynced && currency.username) {
            supabaseHook.loginAndFetchProfile(currency.username).then(profile => {
                if (profile && profile.data) {
                    const d = new Date();
                    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    currency.importData(profile.data);
                    if (profile.data.highScores) highScoresHook.importScores(profile.data.highScores);
                    if (profile.data.quests && profile.data.questsDate === todayStr) daily.updateQuestsState(profile.data.quests);
                }
                setIsCloudSynced(true);
            });
        }
    }, [isAuthenticated, supabaseHook.isConnectedToSupabase, isCloudSynced, currency.username]);

    // 6. Cloud Save (Upload)
    const buildSavePayload = () => {
        const cachedPassword = localStorage.getItem('neon_current_password');
        const payload: any = {
            coins: currency.coins,
            email: currency.email,
            inventory: currency.inventory,
            avatarId: currency.currentAvatarId,
            ownedAvatars: currency.ownedAvatars,
            frameId: currency.currentFrameId,
            ownedFrames: currency.ownedFrames,
            wallpaperId: currency.currentWallpaperId,
            ownedWallpapers: currency.ownedWallpapers,
            titleId: currency.currentTitleId,
            ownedTitles: currency.ownedTitles,
            malletId: currency.currentMalletId,
            ownedMallets: currency.ownedMallets,
            highScores: highScoresHook.highScores,
            quests: daily.quests,
            questsDate: localStorage.getItem('neon_quests_date'),
            streak: daily.streak,
            lastLogin: localStorage.getItem('neon_last_login')
        };
        if (cachedPassword) payload.password = cachedPassword;
        return payload;
    };

    useEffect(() => {
        if (!isAuthenticated || !currency.username) return;
        if (supabaseHook.isConnectedToSupabase && !isCloudSynced) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            const payload = buildSavePayload();
            supabaseHook.syncProfileToCloud(currency.username, payload);
            localStorage.setItem(`neon_data_${currency.username}`, JSON.stringify(payload));
        }, 2000); 
    }, [
        currency.coins, currency.email, currency.currentAvatarId, currency.currentFrameId,
        currency.currentWallpaperId, currency.currentTitleId, currency.currentMalletId,
        currency.inventory, currency.ownedAvatars, currency.ownedFrames, currency.ownedWallpapers,
        currency.ownedTitles, currency.ownedMallets, highScoresHook.highScores, daily.quests, daily.streak, 
        supabaseHook.isConnectedToSupabase, isCloudSynced
    ]);

    // 7. Admin Events
    useEffect(() => {
        const handleAdminEvent = (e: CustomEvent) => {
            const { message, type, data } = e.detail;
            if (type === 'game_config') {
                if (Array.isArray(data)) {
                    setDisabledGames(data);
                    localStorage.setItem('neon_disabled_games', JSON.stringify(data));
                    const isImmune = currency.username === 'Vincent' || currency.adminModeActive;
                    if (data.includes(currentView) && !isImmune && currentView !== 'menu' && currentView !== 'shop') {
                        setCurrentView('menu');
                        setGlobalAlert({ message: "Jeu désactivé par l'admin.", type: 'warning' });
                        setTimeout(() => setGlobalAlert(null), 5000);
                        return;
                    }
                } else if (data && data.flags) {
                    setFeatureFlags(data.flags);
                    localStorage.setItem('neon_feature_flags', JSON.stringify(data.flags));
                }
            }
            if (type === 'sync_events' && Array.isArray(data)) {
                setGlobalEvents(data);
                localStorage.setItem('neon_admin_events', JSON.stringify(data));
            }
            if (type === 'user_update' && data?.targetUser === currency.username) {
                if (data.action === 'ADD_COINS') {
                    currency.addCoins(data.amount);
                    audio.playVictory();
                    setIsCloudSynced(true);
                    setTimeout(() => {
                         const payload = buildSavePayload();
                         supabaseHook.syncProfileToCloud(currency.username, payload);
                         localStorage.setItem(`neon_data_${currency.username}`, JSON.stringify(payload));
                    }, 1000); 
                }
            }
            if (message) {
                if (type === 'user_update' && data?.targetUser !== currency.username) return;
                setGlobalAlert({ message, type: type === 'game_config' ? 'info' : type });
                if (type === 'warning') audio.playGameOver(); else audio.playVictory();
                setTimeout(() => setGlobalAlert(null), 5000);
            }
        };
        window.addEventListener('neon_admin_event', handleAdminEvent as EventListener);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent as EventListener);
    }, [audio, currentView, currency.username, currency.adminModeActive]);

    // --- ACTIONS ---

    const currentActiveEvent = globalEvents.find(e => {
        if (!e.active) return false;
        const now = new Date();
        const start = new Date(e.startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(e.endDate); end.setHours(23, 59, 59, 999);
        return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
    });

    const updateEventProgress = useCallback((gameId: string, metric: string, value: number) => {
        if (!currentActiveEvent) return;
        setEventProgress(prev => {
            const newProgress = { ...prev };
            let changed = false;
            currentActiveEvent.objectives?.forEach((obj: any, index: number) => {
                const key = `${currentActiveEvent.id}_${index}`;
                const currentVal = newProgress[key] || 0;
                if (currentVal >= obj.target) return;
                const gameMatch = obj.gameIds.length === 0 || obj.gameIds.includes(gameId);
                if (!gameMatch && gameId !== 'any') return;
                if (obj.type === 'PLAY_GAMES' && metric === 'play') {
                    newProgress[key] = Math.min(obj.target, currentVal + 1); changed = true;
                } else if (obj.type === 'EARN_COINS' && metric === 'coins') {
                    newProgress[key] = Math.min(obj.target, currentVal + value); changed = true;
                } else if (obj.type === 'REACH_SCORE' && metric === 'score') {
                    if (value >= obj.target) { newProgress[key] = obj.target; changed = true; }
                    else if (value > currentVal) { newProgress[key] = value; changed = true; }
                }
            });
            if (changed) { localStorage.setItem('neon_event_progress', JSON.stringify(newProgress)); return newProgress; }
            return prev;
        });
    }, [currentActiveEvent]);

    const handleGameEvent = useCallback((gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => {
        if (eventType === 'score') highScoresHook.updateHighScore(gameId as any, value);
        daily.reportQuestProgress(gameId, eventType, value);
        updateEventProgress(gameId, eventType, value);
    }, [daily.reportQuestProgress, updateEventProgress, highScoresHook.updateHighScore]);

    const handleLogin = (username: string, cloudData?: any) => {
        currency.updateUsername(username);
        if (cloudData) {
            currency.importData(cloudData);
            if (cloudData.highScores) highScoresHook.importScores(cloudData.highScores);
            const d = new Date();
            const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (cloudData.quests && cloudData.questsDate === todayStr) daily.updateQuestsState(cloudData.quests);
            setIsCloudSynced(true);
            supabaseHook.syncProfileToCloud(username, cloudData);
            localStorage.setItem(`neon_data_${username}`, JSON.stringify(cloudData));
        } else { currency.refreshData(); }
        setIsAuthenticated(true);
        setShowLoginModal(false);
        audio.playVictory();
    };

    const handleLogout = () => { setIsAuthenticated(false); mp.disconnect(); setIsCloudSynced(false); setCurrentView('menu'); };

    return (
        <GlobalContext.Provider value={{
            currentView, setCurrentView, isAuthenticated, setIsAuthenticated, showLoginModal, setShowLoginModal,
            globalAlert, setGlobalAlert, activeSocialTab, setActiveSocialTab, unreadMessages, setUnreadMessages,
            friendRequests, setFriendRequests, disabledGames, featureFlags, globalEvents, eventProgress,
            updateEventProgress, handleGameEvent, handleLogin, handleLogout,
            audio, currency, mp, highScores: highScoresHook, daily, supabase: supabaseHook
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
