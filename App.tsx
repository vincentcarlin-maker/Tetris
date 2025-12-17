
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { TetrisGame } from './components/TetrisGame';
import { Connect4Game } from './components/connect4/Connect4Game';
import { SudokuGame } from './components/sudoku/SudokuGame';
import { BreakerGame } from './components/breaker/BreakerGame';
import { PacmanGame } from './components/pacman/PacmanGame';
import { MemoryGame } from './components/memory/MemoryGame';
import { BattleshipGame } from './components/battleship/BattleshipGame';
import { SnakeGame } from './components/snake/SnakeGame';
import { InvadersGame } from './components/invaders/InvadersGame';
import { AirHockeyGame } from './components/airhockey/AirHockeyGame';
import { MastermindGame } from './components/mastermind/MastermindGame';
import { UnoGame } from './components/uno/UnoGame';
import { WaterSortGame } from './components/watersort/WaterSortGame';
import { CheckersGame } from './components/checkers/CheckersGame';
import { RunnerGame } from './components/runner/RunnerGame';
import { StackGame } from './components/stack/StackGame'; 
import { ArenaClashGame } from './components/arenaclash/ArenaClashGame'; 
import { SkyjoGame } from './components/skyjo/SkyjoGame';
import { LumenOrderGame } from './components/lumen/LumenOrderGame';
import { Shop } from './components/Shop';
import { AdminDashboard } from './components/AdminDashboard';
import { SocialOverlay } from './components/SocialOverlay';
import { LoginScreen } from './components/LoginScreen';
import { useGameAudio } from './hooks/useGameAudio';
import { useCurrency } from './hooks/useCurrency';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useDailySystem } from './hooks/useDailySystem';
import { useHighScores } from './hooks/useHighScores';
import { useSupabase } from './hooks/useSupabase';
import { DB } from './lib/supabaseClient';
import { AlertTriangle, Info, Construction } from 'lucide-react';


type ViewState = 'menu' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'airhockey' | 'mastermind' | 'uno' | 'watersort' | 'checkers' | 'runner' | 'stack' | 'arenaclash' | 'skyjo' | 'lumen' | 'shop' | 'admin_dashboard';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [globalAlert, setGlobalAlert] = useState<{ message: string, type: 'info' | 'warning' } | null>(null);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    
    // Global Disabled Games State (Loaded from LS first, then updated via Broadcast)
    const [disabledGames, setDisabledGames] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('neon_disabled_games') || '[]'); } catch { return []; }
    });

    // Feature Flags (Maintenance, etc.)
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => {
        try { 
            return JSON.parse(localStorage.getItem('neon_feature_flags') || '{}');
        } catch { return {}; }
    });

    // Global Events State
    const [globalEvents, setGlobalEvents] = useState<any[]>(() => {
        try { 
            return JSON.parse(localStorage.getItem('neon_admin_events') || '[]');
        } catch { return []; }
    });

    // Event Progress State
    const [eventProgress, setEventProgress] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem('neon_event_progress') || '{}'); } catch { return {}; }
    });

    const audio = useGameAudio();
    const currency = useCurrency();
    const mp = useMultiplayer(); 
    const { highScores, updateHighScore, importScores } = useHighScores(); 

    const { 
        streak, 
        showDailyModal, 
        todaysReward, 
        claimDailyBonus, 
        quests, 
        reportQuestProgress,
        claimQuestReward,
        claimAllBonus,
        allCompletedBonusClaimed
    } = useDailySystem(currency.addCoins);

    const { 
        onlineUsers, 
        globalLeaderboard, 
        isConnectedToSupabase, 
        isSupabaseConfigured,
        loginAndFetchProfile,
        syncProfileToCloud
    } = useSupabase(
        mp.peerId, 
        currency.username, 
        currency.currentAvatarId, 
        currency.currentFrameId,
        highScores,
        currentView
    );

    const saveTimeoutRef = useRef<any>(null);

    // Initial Load of System Config (Ensure all players have the latest rules)
    useEffect(() => {
        const loadSystemConfig = async () => {
            if (!isConnectedToSupabase) return;
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
    }, [isConnectedToSupabase]);

    // Sync latest data from cloud on startup/reconnect to prevent overwriting gifts/updates
    useEffect(() => {
        if (isAuthenticated && isConnectedToSupabase && !isCloudSynced && currency.username) {
            loginAndFetchProfile(currency.username).then(profile => {
                if (profile && profile.data) {
                    console.log("☁️ Synced profile from cloud on connect");
                    currency.importData(profile.data);
                    if (profile.data.highScores) {
                        importScores(profile.data.highScores);
                    }
                }
                setIsCloudSynced(true);
            });
        }
    }, [isAuthenticated, isConnectedToSupabase, isCloudSynced, currency.username, loginAndFetchProfile, currency.importData, importScores]);

    const buildSavePayload = () => {
        const cachedPassword = localStorage.getItem('neon_current_password');
        const payload: any = {
            coins: currency.coins,
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
            highScores: highScores,
            quests: quests,
            questsDate: localStorage.getItem('neon_quests_date'), // Fix: Sync Quest Date
            streak: streak,
            lastLogin: localStorage.getItem('neon_last_login')
        };
        
        if (cachedPassword) {
            payload.password = cachedPassword;
        }
        return payload;
    };

    // Auto-Save
    useEffect(() => {
        if (!isAuthenticated || !currency.username) return;
        
        // Prevent overwriting cloud data with stale local data before initial sync
        if (isConnectedToSupabase && !isCloudSynced) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            const payload = buildSavePayload();
            syncProfileToCloud(currency.username, payload);
            
            // FIX: Save to local user slot for offline backup/persistence (Important for Admin/Vincent account)
            localStorage.setItem(`neon_data_${currency.username}`, JSON.stringify(payload));
            
        }, 2000); 
    }, [
        currency.coins, 
        currency.currentAvatarId, 
        currency.currentFrameId,
        currency.currentWallpaperId,
        currency.currentTitleId,
        currency.currentMalletId,
        currency.inventory,
        currency.ownedAvatars,
        currency.ownedFrames,
        currency.ownedWallpapers,
        currency.ownedTitles,
        currency.ownedMallets,
        highScores, 
        quests, 
        streak, 
        isConnectedToSupabase, 
        isCloudSynced
    ]);

    // Admin Global Listener (Alerts AND Config Updates)
    useEffect(() => {
        const handleAdminEvent = (e: CustomEvent) => {
            const { message, type, data } = e.detail;
            
            // Handle Config Updates
            if (type === 'game_config') {
                if (Array.isArray(data)) {
                    // It's a disabled games list update
                    setDisabledGames(data);
                    localStorage.setItem('neon_disabled_games', JSON.stringify(data));
                    
                    // If user is currently playing a disabled game, kick them out (unless admin/immune)
                    const isImmune = currency.username === 'Vincent' || currency.username === 'Test' || currency.adminModeActive;
                    if (data.includes(currentView) && !isImmune && currentView !== 'menu' && currentView !== 'shop') {
                        setCurrentView('menu');
                        setGlobalAlert({ message: "Ce jeu a été désactivé par l'administrateur.", type: 'warning' });
                        setTimeout(() => setGlobalAlert(null), 5000);
                        return;
                    }
                } else if (data && data.flags) {
                    // It's a feature flags update
                    setFeatureFlags(data.flags);
                    localStorage.setItem('neon_feature_flags', JSON.stringify(data.flags));
                }
            }

            // Handle Event Sync
            if (type === 'sync_events') {
                if (Array.isArray(data)) {
                    setGlobalEvents(data);
                    localStorage.setItem('neon_admin_events', JSON.stringify(data));
                }
                if (!message) return; // Silent sync if no message
            }

            // Handle User Specific Updates (Gifts, etc.)
            if (type === 'user_update') {
                if (data && data.targetUser === currency.username) {
                    if (data.action === 'ADD_COINS') {
                        // Apply locally first
                        currency.addCoins(data.amount);
                        audio.playVictory();
                        
                        // FORCE immediate cloud sync to acknowledge receipt and prevent overwrite
                        setIsCloudSynced(true);
                        setTimeout(() => {
                             const payload = buildSavePayload();
                             syncProfileToCloud(currency.username, payload);
                             localStorage.setItem(`neon_data_${currency.username}`, JSON.stringify(payload));
                        }, 1000);
                    }
                }
            }

            // Handle Text Alerts (Display the banner)
            if (message) {
                 // For personal updates, show specific alert only to target
                if (type === 'user_update') {
                    if (data && data.targetUser === currency.username) {
                         setGlobalAlert({ message, type: 'info' });
                         setTimeout(() => setGlobalAlert(null), 5000);
                    }
                } else {
                    setGlobalAlert({ message, type: type === 'game_config' ? 'info' : type });
                    if (type === 'warning') audio.playGameOver(); 
                    else audio.playVictory();
                    
                    setTimeout(() => setGlobalAlert(null), 5000);
                }
            }
        };
        window.addEventListener('neon_admin_event', handleAdminEvent as EventListener);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent as EventListener);
    }, [audio, currentView, currency.username, currency.adminModeActive, currency.addCoins, syncProfileToCloud]);

    useEffect(() => {
        const storedName = localStorage.getItem('neon-username');
        if (storedName) {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            mp.connect();
        }
        return () => mp.disconnect();
    }, [isAuthenticated]);

    useEffect(() => {
        const bgElement = document.getElementById('app-background');
        if (bgElement) {
            const wallpaper = currency.wallpapersCatalog.find(w => w.id === currency.currentWallpaperId);
            if (wallpaper) {
                bgElement.style.background = wallpaper.cssValue;
                if (wallpaper.bgSize) {
                    bgElement.style.backgroundSize = wallpaper.bgSize;
                    bgElement.style.backgroundPosition = '0 0'; 
                } else if (currency.currentWallpaperId !== 'bg_brick') {
                    bgElement.style.backgroundSize = 'cover';
                    bgElement.style.backgroundPosition = 'center';
                } else {
                    bgElement.style.backgroundSize = '100% 100%, 200px 60px';
                    bgElement.style.backgroundPosition = '';
                }
            }
        }
    }, [currency.currentWallpaperId, currency.wallpapersCatalog]);

    useEffect(() => {
        const gameViews: ViewState[] = ['tetris', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship', 'snake', 'invaders', 'airhockey', 'mastermind', 'uno', 'watersort', 'checkers', 'runner', 'stack', 'arenaclash', 'skyjo', 'lumen'];
        const isGameView = gameViews.includes(currentView);
        if (isGameView) {
            document.body.classList.add('overflow-hidden');
            document.body.style.touchAction = 'none';
        } else {
            document.body.classList.remove('overflow-hidden');
            document.body.style.touchAction = 'auto';
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
            document.body.style.touchAction = 'auto';
        };
    }, [currentView]);

    // Calculate Active Event (Fix Date Logic)
    const currentActiveEvent = globalEvents.find(e => {
        if (!e.active) return false;
        const now = new Date();
        // Convert dates to timestamps for safer comparison
        const start = new Date(e.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(e.endDate);
        end.setHours(23, 59, 59, 999);
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
                    newProgress[key] = Math.min(obj.target, currentVal + 1);
                    changed = true;
                } else if (obj.type === 'EARN_COINS' && metric === 'coins') {
                    newProgress[key] = Math.min(obj.target, currentVal + value);
                    changed = true;
                } else if (obj.type === 'REACH_SCORE' && metric === 'score') {
                    if (value >= obj.target) {
                        newProgress[key] = obj.target;
                        changed = true;
                    } else if (value > currentVal) {
                         newProgress[key] = value;
                         changed = true;
                    }
                }
            });

            if (changed) {
                localStorage.setItem('neon_event_progress', JSON.stringify(newProgress));
                return newProgress;
            }
            return prev;
        });
    }, [currentActiveEvent]);

    const addCoinsWithSoundAndQuest = (amount: number) => {
        if (amount > 0) {
            currency.addCoins(amount);
            audio.playCoin();
            reportQuestProgress('any', 'coins', amount);
            updateEventProgress('any', 'coins', amount);
        }
    };

    const handleSelectGame = (game: string) => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        if (game === 'admin_dashboard') {
            setCurrentView('admin_dashboard');
            return;
        }
        
        // Security check for disabled games (redundant with MainMenu but safe)
        const isRestricted = disabledGames.includes(game);
        const isImmune = currency.username === 'Vincent' || currency.username === 'Test' || currency.adminModeActive;
        
        if (isRestricted && !isImmune) {
             setGlobalAlert({ message: "Ce jeu est actuellement désactivé.", type: 'warning' });
             setTimeout(() => setGlobalAlert(null), 2000);
             return;
        }

        // BUG FIX: Removed automatic quest reporting here. 
        // Quests are now only updated when the game actually starts inside the component.
        
        setCurrentView(game as ViewState);
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    const handleLogin = (username: string, cloudData?: any) => {
        currency.updateUsername(username);
        if (cloudData) {
            currency.importData(cloudData);
            if (cloudData.highScores) {
                importScores(cloudData.highScores);
            }
            setIsCloudSynced(true); // Mark as synced
            syncProfileToCloud(username, cloudData);
            // Ensure local slot is up to date immediately on login
            localStorage.setItem(`neon_data_${username}`, JSON.stringify(cloudData));
        } else {
            currency.refreshData(); 
        }
        setIsAuthenticated(true);
        setShowLoginModal(false);
        audio.playVictory();
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        mp.disconnect();
        setIsCloudSynced(false); // Reset sync state
    };

    const handleGameEvent = useCallback((gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => {
        reportQuestProgress(gameId, eventType, value);
        updateEventProgress(gameId, eventType, value);
    }, [reportQuestProgress, updateEventProgress]);

    // --- MAINTENANCE MODE CHECK ---
    const isMaintenance = featureFlags.maintenance_mode;
    const isImmune = currency.username === 'Vincent' || currency.adminModeActive;
    
    if (isMaintenance && !isImmune) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-black/90 p-4 text-center animate-in fade-in">
                <div className="p-6 rounded-2xl bg-gray-900 border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] max-w-md">
                    <Construction size={64} className="mx-auto text-yellow-500 mb-6 animate-pulse"/>
                    <h1 className="text-3xl font-black text-white mb-2">MAINTENANCE</h1>
                    <p className="text-gray-400 mb-6">Le serveur est actuellement en cours de mise à jour. Veuillez revenir plus tard.</p>
                    {isAuthenticated && <p className="text-xs text-gray-600 font-mono mb-4">ID: {currency.username}</p>}
                    <button onClick={handleLogout} className="px-6 py-2 bg-gray-800 text-gray-300 rounded-full hover:text-white transition-colors text-sm font-bold border border-white/10">Se déconnecter</button>
                </div>
            </div>
        );
    }

    return (
        <>
            {globalAlert && (
                <div className="fixed top-0 left-0 right-0 z-[300] flex justify-center p-4 pointer-events-none animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className={`bg-gray-900/90 backdrop-blur-md border-l-4 ${globalAlert.type === 'warning' ? 'border-red-500 text-red-200' : 'border-blue-500 text-blue-200'} rounded-r-lg p-4 shadow-2xl flex items-center gap-4 max-w-md w-full`}>
                        {globalAlert.type === 'warning' ? <AlertTriangle className="text-red-500 animate-pulse" size={24} /> : <Info className="text-blue-500 animate-bounce" size={24} />}
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-widest mb-1">{globalAlert.type === 'warning' ? 'ALERTE SYSTÈME' : 'MESSAGE ADMIN'}</h4>
                            <p className="font-bold text-lg leading-tight text-white">{globalAlert.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {showLoginModal && (
                <LoginScreen 
                    onLogin={handleLogin} 
                    onCancel={() => setShowLoginModal(false)}
                    onAttemptLogin={loginAndFetchProfile}
                />
            )}

            {isAuthenticated && (
                <SocialOverlay 
                    audio={audio} 
                    currency={currency} 
                    mp={mp} 
                    onlineUsers={onlineUsers} 
                    isConnectedToSupabase={isConnectedToSupabase}
                    isSupabaseConfigured={isSupabaseConfigured}
                />
            )}
            
            {currentView === 'shop' && isAuthenticated && (
                <Shop onBack={handleBackToMenu} currency={currency} />
            )}

            {currentView === 'admin_dashboard' && isAuthenticated && currency.isSuperUser && (
                <AdminDashboard onBack={handleBackToMenu} mp={mp} onlineUsers={onlineUsers} />
            )}

            {/* Game Components */}
            {currentView === 'tetris' && isAuthenticated && <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('tetris', metric, val)} />}
            {currentView === 'connect4' && isAuthenticated && <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('connect4', metric, val)} />}
            {currentView === 'sudoku' && isAuthenticated && <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('sudoku', metric, val)} />}
            {currentView === 'breaker' && isAuthenticated && <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('breaker', metric, val)} />}
            {currentView === 'pacman' && isAuthenticated && <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('pacman', metric, val)} />}
            {currentView === 'memory' && isAuthenticated && <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('memory', metric, val)} />}
            {currentView === 'battleship' && isAuthenticated && <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('battleship', metric, val)} />}
            {currentView === 'snake' && isAuthenticated && <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('snake', metric, val)} />}
            {currentView === 'invaders' && isAuthenticated && <InvadersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('invaders', metric, val)} />}
            {currentView === 'airhockey' && isAuthenticated && <AirHockeyGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('airhockey', metric, val)} />}
            {currentView === 'mastermind' && isAuthenticated && <MastermindGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('mastermind', metric, val)} />}
            {currentView === 'uno' && isAuthenticated && <UnoGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('uno', metric, val)} />}
            {currentView === 'watersort' && isAuthenticated && <WaterSortGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('watersort', metric, val)} />}
            {currentView === 'checkers' && isAuthenticated && <CheckersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('checkers', metric, val)} />}
            {currentView === 'runner' && isAuthenticated && <RunnerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('runner', metric, val)} />}
            {currentView === 'stack' && isAuthenticated && <StackGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('stack', metric, val)} />}
            {currentView === 'arenaclash' && isAuthenticated && <ArenaClashGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('arenaclash', metric, val)} />}
            {currentView === 'skyjo' && isAuthenticated && <SkyjoGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('skyjo', metric, val)} />}
            {currentView === 'lumen' && isAuthenticated && <LumenOrderGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('lumen', metric, val)} />}

            {currentView === 'menu' && (
                <MainMenu 
                    onSelectGame={handleSelectGame} 
                    audio={audio} 
                    currency={currency} 
                    mp={mp}
                    onLogout={handleLogout}
                    isAuthenticated={isAuthenticated}
                    onLoginRequest={() => setShowLoginModal(true)}
                    dailyData={{
                        streak,
                        showDailyModal,
                        todaysReward,
                        claimDailyBonus,
                        quests,
                        claimQuestReward,
                        claimAllBonus,
                        allCompletedBonusClaimed
                    }}
                    onlineUsers={globalLeaderboard.length > 0 ? globalLeaderboard : onlineUsers}
                    disabledGamesList={disabledGames}
                    activeEvent={currentActiveEvent}
                    eventProgress={eventProgress}
                />
            )}
        </>
    );
}

export default App;
