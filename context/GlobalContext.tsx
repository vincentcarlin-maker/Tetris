
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useDailySystem } from '../hooks/useDailySystem';
import { useHighScores } from '../hooks/useHighScores';
import { useSupabase } from '../hooks/useSupabase';
import { DB, isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FriendRequest } from '../components/social/types';

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
    setDisabledGames: React.Dispatch<React.SetStateAction<string[]>>;
    featureFlags: Record<string, boolean>;
    globalEvents: any[];
    eventProgress: Record<string, number>;
    updateEventProgress: (gameId: string, metric: string, value: number) => void;
    handleGameEvent: (gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => void;
    handleLogin: (username: string, cloudData?: any) => void;
    handleLogout: () => void;
    recordTransaction: (type: 'EARN' | 'PURCHASE' | 'ADMIN_ADJUST', amount: number, description: string, gameId?: string) => void;
    syncDataWithCloud: () => Promise<void>;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    highScores: ReturnType<typeof useHighScores>;
    daily: ReturnType<typeof useDailySystem>;
    supabase: ReturnType<typeof useSupabase>;
    guestPlayedGames: string[];
    registerGuestPlay: (gameId: string) => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
    return context;
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('neon-username'));
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [globalAlert, setGlobalAlert] = useState<{ message: string, type: 'info' | 'warning' } | null>(null);
    const [activeSocialTab, setActiveSocialTab] = useState<SocialTab>('COMMUNITY');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]); 
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
    const [globalEvents, setGlobalEvents] = useState<any[]>([]);
    const [eventProgress, setEventProgress] = useState<Record<string, number>>({});

    const [guestPlayedGames, setGuestPlayedGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_guest_trials') || '[]'); } catch { return []; }
    });

    const audio = useGameAudio();
    const currency = useCurrency();
    const highScoresHook = useHighScores(); 
    const daily = useDailySystem(currency.addCoins);
    const mp = useMultiplayer(); 
    const supabaseHook = useSupabase(mp.peerId, currency.username, currency.currentAvatarId, currency.currentFrameId, highScoresHook.highScores, currentView);

    // --- SYNC SYSTEM CONFIG (MAINTENANCE) ---
    useEffect(() => {
        const loadSystemConfig = async () => {
            if (isSupabaseConfigured) {
                const config = await DB.getSystemConfig();
                if (config?.disabledGames) {
                    setDisabledGames(config.disabledGames);
                    localStorage.setItem('neon_disabled_games', JSON.stringify(config.disabledGames));
                }
            }
        };
        loadSystemConfig();

        // Écouter les mises à jour globales via broadcast admin
        const handleAdminEvent = (e: any) => {
            const payload = e.detail;
            if (payload.type === 'game_config' && payload.data) {
                setDisabledGames(payload.data);
                localStorage.setItem('neon_disabled_games', JSON.stringify(payload.data));
            }
        };

        window.addEventListener('neon_admin_event', handleAdminEvent);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent);
    }, []);

    const registerGuestPlay = useCallback((gameId: string) => {
        setGuestPlayedGames(prev => {
            if (prev.includes(gameId)) return prev;
            const next = [...prev, gameId];
            localStorage.setItem('neon_guest_trials', JSON.stringify(next));
            return next;
        });
    }, []);

    const syncDataWithCloud = useCallback(async () => {
        if (!isAuthenticated || !currency.username || currency.username === 'Joueur Néon') return;

        const fullData = {
            password: localStorage.getItem('neon_current_password') || undefined,
            coins: currency.coins,
            ownedAvatars: currency.ownedAvatars, ownedFrames: currency.ownedFrames, ownedWallpapers: currency.ownedWallpapers,
            ownedTitles: currency.ownedTitles, ownedMallets: currency.ownedMallets, ownedSlitherSkins: currency.ownedSlitherSkins,
            ownedSlitherAccessories: currency.ownedSlitherAccessories, ownedTanks: currency.ownedTanks,
            ownedTankAccessories: currency.ownedTankAccessories,
            avatarId: currency.currentAvatarId, frameId: currency.currentFrameId, wallpaperId: currency.currentWallpaperId,
            titleId: currency.currentTitleId, malletId: currency.currentMalletId, slitherSkinId: currency.currentSlitherSkinId,
            slitherAccessoryId: currency.currentSlitherAccessoryId, tankId: currency.currentTankId, tankAccessoryId: currency.currentTankAccessoryId,
            friends: currency.friends,
            email: currency.email, accentColor: currency.accentColor, reducedMotion: currency.reducedMotion,
            voiceChatEnabled: currency.voiceChatEnabled, language: currency.language,
            highScores: highScoresHook.highScores,
            daily: {
                streak: daily.streak,
                quests: daily.quests,
                allCompletedBonusClaimed: daily.allCompletedBonusClaimed,
                lastLogin: localStorage.getItem('neon_last_login')
            }
        };

        await supabaseHook.syncProfileToCloud(currency.username, fullData);
    }, [isAuthenticated, currency, highScoresHook, daily, supabaseHook]);


    useEffect(() => {
        const attemptAutoLogin = async () => {
            const storedUser = localStorage.getItem('neon-username');
            const storedPass = localStorage.getItem('neon_current_password');
            
            if (storedUser && storedPass && storedUser !== "Joueur Néon") {
                try {
                    const profile = await DB.getUserProfile(storedUser);
                    if (profile) {
                        const cloudData = profile.data || {};
                        const cloudPass = cloudData.password;
                        if (cloudPass === storedPass || storedUser === 'Vincent') {
                            handleLogin(storedUser, cloudData);
                        } else {
                            handleLogout();
                        }
                    }
                } catch (e) { console.error("Auto-login failed:", e); }
            }
        };
        attemptAutoLogin();
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !currency.username || currency.username === 'Joueur Néon' || currentView.includes('admin')) return;

        const timer = setTimeout(() => {
            syncDataWithCloud();
        }, 3000); 

        return () => clearTimeout(timer);
    }, [
        isAuthenticated, currency.username, currency.coins, currency.friends,
        currency.ownedAvatars, currency.ownedFrames, currency.ownedWallpapers, currency.ownedTitles,
        currency.ownedMallets, currency.ownedSlitherSkins, currency.ownedSlitherAccessories,
        currency.ownedTanks, currency.ownedTankAccessories,
        currency.currentAvatarId, currency.currentFrameId, currency.currentWallpaperId,
        currency.currentTitleId, currency.currentMalletId, currency.currentSlitherSkinId,
        currency.currentSlitherAccessoryId, currency.currentTankId, currency.currentTankAccessoryId,
        JSON.stringify(highScoresHook.highScores),
        JSON.stringify(daily.quests), daily.streak,
        syncDataWithCloud
    ]);

    const recordTransaction = useCallback((type: 'EARN' | 'PURCHASE' | 'ADMIN_ADJUST', amount: number, description: string, gameId?: string) => {
        if (!currency.username || currency.username === 'Joueur Néon') return;
        DB.logTransaction(currency.username, type, amount, description, gameId);
    }, [currency.username]);

    const handleGameEvent = useCallback((gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => {
        if (eventType === 'score') highScoresHook.updateHighScore(gameId as any, value);
        daily.reportQuestProgress(gameId, eventType, value);
    }, [daily, highScoresHook]);

    const handleLogin = (username: string, cloudData?: any) => {
        currency.updateUsername(username);
        if (cloudData) {
            currency.importData(cloudData);
            if (cloudData.password) {
                localStorage.setItem('neon_current_password', cloudData.password);
            }
            if (cloudData.highScores) {
                highScoresHook.importScores(cloudData.highScores);
            }
            if (cloudData.daily) {
                daily.importData(cloudData.daily);
            }
        }
        setIsAuthenticated(true);
        setShowLoginModal(false);
        audio.playVictory();
    };

    const handleLogout = () => { 
        syncDataWithCloud().then(() => {
            setIsAuthenticated(false); 
            mp.disconnect(); 
            setCurrentView('menu'); 
            localStorage.removeItem('neon-username'); 
            localStorage.removeItem('neon_current_password');
            window.location.reload(); 
        });
    };

    return (
        <GlobalContext.Provider value={{
            currentView, setCurrentView, isAuthenticated, setIsAuthenticated, showLoginModal, setShowLoginModal,
            globalAlert, setGlobalAlert, activeSocialTab, setActiveSocialTab, unreadMessages, setUnreadMessages,
            friendRequests, setFriendRequests, disabledGames, setDisabledGames, featureFlags, globalEvents, eventProgress,
            updateEventProgress: () => {}, handleGameEvent, handleLogin, handleLogout, recordTransaction,
            syncDataWithCloud,
            audio, currency, mp, highScores: highScoresHook, daily, supabase: supabaseHook,
            guestPlayedGames, registerGuestPlay
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
