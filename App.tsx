
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
import { AlertTriangle, Info } from 'lucide-react';


type ViewState = 'menu' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'airhockey' | 'mastermind' | 'uno' | 'watersort' | 'checkers' | 'runner' | 'stack' | 'arenaclash' | 'shop' | 'admin_dashboard';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [globalAlert, setGlobalAlert] = useState<{ message: string, type: 'info' | 'warning' } | null>(null);
    
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
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            syncProfileToCloud(currency.username, buildSavePayload());
        }, 2000); 
    }, [currency.coins, currency.currentAvatarId, highScores, quests, streak]);

    // Admin Global Alert Listener
    useEffect(() => {
        const handleAdminEvent = (e: CustomEvent) => {
            const { message, type } = e.detail;
            setGlobalAlert({ message, type });
            // Alert sound
            if (type === 'warning') audio.playGameOver(); 
            else audio.playVictory();
            
            setTimeout(() => setGlobalAlert(null), 8000);
        };
        window.addEventListener('neon_admin_event', handleAdminEvent as EventListener);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent as EventListener);
    }, [audio]);

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
        const gameViews: ViewState[] = ['tetris', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship', 'snake', 'invaders', 'airhockey', 'mastermind', 'uno', 'watersort', 'checkers', 'runner', 'stack', 'arenaclash'];
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

    const addCoinsWithSoundAndQuest = (amount: number) => {
        if (amount > 0) {
            currency.addCoins(amount);
            audio.playCoin();
            reportQuestProgress('any', 'coins', amount);
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
        reportQuestProgress(game, 'play', 1);
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
            syncProfileToCloud(username, cloudData);
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
    };

    const handleGameEvent = useCallback((gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => {
        reportQuestProgress(gameId, eventType, value);
    }, [reportQuestProgress]);

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
                />
            )}
        </>
    );
}

export default App;
