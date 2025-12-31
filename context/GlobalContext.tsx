
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useDailySystem } from '../hooks/useDailySystem';
import { useHighScores } from '../hooks/useHighScores';
import { useSupabase } from '../hooks/useSupabase';
import { DB, isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { FriendRequest } from '../components/social/types';

export type ViewState = 'menu' | 'social' | 'settings' | 'contact' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'airhockey' | 'mastermind' | 'uno' | 'watersort' | 'checkers' | 'runner' | 'stack' | 'arenaclash' | 'skyjo' | 'lumen' | 'slither' | 'shop' | 'admin_dashboard' | 'neon_seek';
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
    sentRequests: FriendRequest[];
    setSentRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
    refreshSocialData: () => Promise<void>;
    disabledGames: string[];
    setDisabledGames: React.Dispatch<React.SetStateAction<string[]>>;
    featureFlags: Record<string, boolean>;
    setFeatureFlags: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    globalEvents: any[];
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
    isAcceptingFriend: boolean;
    setIsAcceptingFriend: (val: boolean) => void;
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
    const [isAcceptingFriend, setIsAcceptingFriend] = useState(false);
    
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]); 
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });
    
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('neon_feature_flags') || JSON.stringify({
                maintenance_mode: false,
                social_module: true,
                economy_system: true,
                beta_games: true,
                global_chat: true
            }));
        } catch {
            return { maintenance_mode: false, social_module: true, economy_system: true, beta_games: true, global_chat: true };
        }
    });

    const [guestPlayedGames, setGuestPlayedGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_guest_trials') || '[]'); } catch { return []; }
    });

    const audio = useGameAudio();
    const currency = useCurrency();
    const highScoresHook = useHighScores(); 
    const daily = useDailySystem(currency.addCoins);
    const mp = useMultiplayer(); 
    const supabaseHook = useSupabase(mp.peerId, currency.username, currency.currentAvatarId, currency.currentFrameId, highScoresHook.highScores, currentView);

    const refreshSocialData = useCallback(async () => {
        if (!isAuthenticated || !currency.username || !isSupabaseConfigured || isAcceptingFriend) return;
        try {
            const [pending, sent, unread, profile] = await Promise.all([
                DB.getPendingRequests(currency.username),
                DB.getSentRequests(currency.username),
                DB.getUnreadCount(currency.username),
                DB.getUserProfile(currency.username)
            ]);
            
            if (pending) setFriendRequests(pending);
            if (sent) setSentRequests(sent);
            if (profile?.data?.friends) currency.importData({ friends: profile.data.friends });
            setUnreadMessages(unread || 0);
        } catch (e) {
            console.error("Social refresh failed", e);
        }
    }, [isAuthenticated, currency.username, isAcceptingFriend]);

    useEffect(() => {
        if (!isAuthenticated || !currency.username || !supabase) return;

        let deleteTimeout: any = null;

        const channel = supabase.channel(`global_social_${currency.username}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `receiver_id=eq.${currency.username}`
            }, (payload: any) => {
                const msg = payload.new;
                if (msg.text === 'CMD:FRIEND_REQUEST') {
                    refreshSocialData();
                    audio.playCoin();
                } else {
                    setUnreadMessages(prev => prev + 1);
                    audio.playCoin();
                }
            })
            .on('postgres_changes', { 
                event: 'DELETE', 
                schema: 'public', 
                table: 'messages'
            }, () => {
                if (isAcceptingFriend) return; // Ne pas rafraîchir si on est en train d'accepter manuellement
                
                if (deleteTimeout) clearTimeout(deleteTimeout);
                deleteTimeout = setTimeout(() => {
                    refreshSocialData();
                }, 800);
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
            if (deleteTimeout) clearTimeout(deleteTimeout);
        };
    }, [isAuthenticated, currency.username, refreshSocialData, audio, isAcceptingFriend]);

    useEffect(() => {
        if (isAuthenticated) refreshSocialData();
    }, [isAuthenticated, refreshSocialData]);

    useEffect(() => {
        const loadSystemConfig = async () => {
            if (isSupabaseConfigured) {
                const config = await DB.getSystemConfig();
                if (config) {
                    if (config.disabledGames) {
                        setDisabledGames(config.disabledGames);
                        localStorage.setItem('neon_disabled_games', JSON.stringify(config.disabledGames));
                    }
                    if (config.featureFlags) {
                        setFeatureFlags(config.featureFlags);
                        localStorage.setItem('neon_feature_flags', JSON.stringify(config.featureFlags));
                    }
                }
            }
        };
        loadSystemConfig();

        const handleAdminEvent = (e: any) => {
            const payload = e.detail;
            if (payload.type === 'game_config' && payload.data) {
                if (payload.data.flags) {
                    setFeatureFlags(payload.data.flags);
                    localStorage.setItem('neon_feature_flags', JSON.stringify(payload.data.flags));
                } else if (Array.isArray(payload.data)) {
                    setDisabledGames(payload.data);
                    localStorage.setItem('neon_disabled_games', JSON.stringify(payload.data));
                }
            }
            if (payload.message && payload.type !== 'game_config') {
                setGlobalAlert({ message: payload.message, type: payload.type === 'warning' ? 'warning' : 'info' });
                setTimeout(() => setGlobalAlert(null), 5000);
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
        if (!isAuthenticated || !currency.username || currency.username === 'Joueur Néon' || isAcceptingFriend) return;

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
    }, [isAuthenticated, currency, highScoresHook, daily, supabaseHook, isAcceptingFriend]);

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
        if (!isAuthenticated || !currency.username || !syncDataWithCloud || currentView.includes('admin')) return;
        const timer = setTimeout(() => { syncDataWithCloud(); }, 3000); 
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
            friendRequests, setFriendRequests, sentRequests, setSentRequests, refreshSocialData,
            disabledGames, setDisabledGames, featureFlags, setFeatureFlags, handleGameEvent, handleLogin, handleLogout, recordTransaction,
            syncDataWithCloud,
            audio, currency, mp, highScores: highScoresHook, daily, supabase: supabaseHook,
            guestPlayedGames, registerGuestPlay, isAcceptingFriend, setIsAcceptingFriend
        }}>
            {children}
        </GlobalContext.Provider>
    );
};
