
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
import { ArenaClashGame } from './components/arenaclash/ArenaClashGame'; // Added Arena Clash
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


type ViewState = 'menu' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'airhockey' | 'mastermind' | 'uno' | 'watersort' | 'checkers' | 'runner' | 'stack' | 'arenaclash' | 'shop' | 'admin_dashboard';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
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
        currentView // Pass current activity to presence
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

    // 1. Debounced Save on State Change
    useEffect(() => {
        if (!isAuthenticated || !currency.username) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            syncProfileToCloud(currency.username, buildSavePayload());
            console.log("☁️ Auto-Saved to Cloud");
        }, 2000); 

    }, [
        currency.coins, currency.currentAvatarId, 
        highScores, quests, streak
    ]);


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

        if (game === 'tetris') setCurrentView('tetris');
        else if (game === 'connect4') setCurrentView('connect4');
        else if (game === 'sudoku') setCurrentView('sudoku');
        else if (game === 'breaker') setCurrentView('breaker');
        else if (game === 'pacman') setCurrentView('pacman');
        else if (game === 'memory') setCurrentView('memory');
        else if (game === 'battleship') setCurrentView('battleship');
        else if (game === 'snake') setCurrentView('snake');
        else if (game === 'invaders') setCurrentView('invaders');
        else if (game === 'airhockey') setCurrentView('airhockey');
        else if (game === 'mastermind') setCurrentView('mastermind');
        else if (game === 'uno') setCurrentView('uno');
        else if (game === 'watersort') setCurrentView('watersort');
        else if (game === 'checkers') setCurrentView('checkers');
        else if (game === 'runner') setCurrentView('runner');
        else if (game === 'stack') setCurrentView('stack');
        else if (game === 'arenaclash') setCurrentView('arenaclash');
        else if (game === 'shop') setCurrentView('shop');
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    const handleLogin = (username: string, cloudData?: any) => {
        currency.updateUsername(username);
        
        if (cloudData) {
            console.log("📥 Importing Cloud Data...", cloudData);
            currency.importData(cloudData);
            if (cloudData.highScores) {
                importScores(cloudData.highScores);
            }
            console.log("💾 Force Initial Save for", username);
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

    // Generic Event Handler for Games to report progress
    const handleGameEvent = useCallback((gameId: string, eventType: 'score' | 'win' | 'action' | 'play', value: number) => {
        reportQuestProgress(gameId, eventType, value);
    }, [reportQuestProgress]);

    return (
        <>
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
                <AdminDashboard onBack={handleBackToMenu} />
            )}

            {currentView === 'tetris' && isAuthenticated && (
                <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('tetris', metric, val)} />
            )}

            {currentView === 'connect4' && isAuthenticated && (
                <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('connect4', metric, val)} />
            )}

            {currentView === 'sudoku' && isAuthenticated && (
                <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('sudoku', metric, val)} />
            )}

            {currentView === 'breaker' && isAuthenticated && (
                <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('breaker', metric, val)} />
            )}
            
            {currentView === 'pacman' && isAuthenticated && (
                <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('pacman', metric, val)} />
            )}
            
            {currentView === 'memory' && isAuthenticated && (
                <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('memory', metric, val)} />
            )}

            {currentView === 'battleship' && isAuthenticated && (
                <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('battleship', metric, val)} />
            )}

            {currentView === 'snake' && isAuthenticated && (
                <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('snake', metric, val)} />
            )}

            {currentView === 'invaders' && isAuthenticated && (
                <InvadersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('invaders', metric, val)} />
            )}
            
            {currentView === 'airhockey' && isAuthenticated && (
                <AirHockeyGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('airhockey', metric, val)} />
            )}

            {currentView === 'mastermind' && isAuthenticated && (
                <MastermindGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('mastermind', metric, val)} />
            )}

            {currentView === 'uno' && isAuthenticated && (
                <UnoGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('uno', metric, val)} />
            )}

            {currentView === 'watersort' && isAuthenticated && (
                <WaterSortGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('watersort', metric, val)} />
            )}

            {currentView === 'checkers' && isAuthenticated && (
                <CheckersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} onReportProgress={(metric, val) => handleGameEvent('checkers', metric, val)} />
            )}

            {currentView === 'runner' && isAuthenticated && (
                <RunnerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('runner', metric, val)} />
            )}

            {currentView === 'stack' && isAuthenticated && (
                <StackGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('stack', metric, val)} />
            )}

            {currentView === 'arenaclash' && isAuthenticated && (
                <ArenaClashGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} onReportProgress={(metric, val) => handleGameEvent('arenaclash', metric, val)} />
            )}

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
