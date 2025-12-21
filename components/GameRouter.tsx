
import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { MainMenu } from './MainMenu';
import { TetrisGame } from './TetrisGame';
import { Connect4Game } from './connect4/Connect4Game';
import { SudokuGame } from './sudoku/SudokuGame';
import { BreakerGame } from './breaker/BreakerGame';
import { PacmanGame } from './pacman/PacmanGame';
import { MemoryGame } from './memory/MemoryGame';
import { BattleshipGame } from './battleship/BattleshipGame';
import { SnakeGame } from './snake/SnakeGame';
import { InvadersGame } from './invaders/InvadersGame';
import { AirHockeyGame } from './airhockey/AirHockeyGame';
import { MastermindGame } from './mastermind/MastermindGame';
import { UnoGame } from './uno/UnoGame';
import { WaterSortGame } from './watersort/WaterSortGame';
import { CheckersGame } from './checkers/CheckersGame';
import { RunnerGame } from './runner/RunnerGame';
import { StackGame } from './stack/StackGame'; 
import { ArenaClashGame } from './arenaclash/ArenaClashGame'; 
import { SkyjoGame } from './skyjo/SkyjoGame';
import { LumenOrderGame } from './lumen/LumenOrderGame';
import { SlitherGame } from './slither/SlitherGame';
import { Game2048 } from './game2048/Game2048';
import { Shop } from './Shop';
import { AdminDashboard } from './AdminDashboard';
import { SocialOverlay } from './SocialOverlay';
import { SettingsMenu } from './SettingsMenu';
import { ContactOverlay } from './ContactOverlay';
import { Construction } from 'lucide-react';

export const GameRouter: React.FC = () => {
    const { 
        currentView, setCurrentView, isAuthenticated, setShowLoginModal, 
        audio, currency, mp, highScores, daily, supabase, 
        friendRequests, setFriendRequests, unreadMessages, setUnreadMessages,
        activeSocialTab, setActiveSocialTab, disabledGames, featureFlags,
        handleGameEvent, updateEventProgress, handleLogout, globalEvents, eventProgress
    } = useGlobal();

    const handleBackToMenu = () => setCurrentView('menu');
    
    // Wrapper for adding coins that also reports progress
    const addCoinsWithEvent = (amount: number) => {
        if (amount > 0) {
            currency.addCoins(amount);
            audio.playCoin();
            daily.reportQuestProgress('any', 'coins', amount);
            updateEventProgress('any', 'coins', amount);
        }
    };

    const handleSelectGame = (game: string) => {
        if (!isAuthenticated) { setShowLoginModal(true); return; }
        if (game === 'admin_dashboard') { setCurrentView('admin_dashboard'); return; }
        
        const isRestricted = disabledGames.includes(game);
        const isImmune = currency.username === 'Vincent' || currency.adminModeActive;
        
        if (isRestricted && !isImmune) {
             // Alert is handled in GlobalContext event listener usually, but here we can force a UI feedback
             return;
        }
        setCurrentView(game as any);
    };

    const handleOpenSocial = (tab: any) => {
        if (!isAuthenticated) { setShowLoginModal(true); return; }
        setActiveSocialTab(tab);
        setCurrentView('social');
    };

    // Maintenance Check
    const isMaintenance = featureFlags.maintenance_mode;
    const isImmuneUser = currency.username === 'Vincent' || currency.adminModeActive;
    
    if (isMaintenance && !isImmuneUser) {
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

    // --- ROUTING ---

    if (currentView === 'menu') {
        return (
            <MainMenu 
                onSelectGame={handleSelectGame} audio={audio} currency={currency} mp={mp} onLogout={handleLogout}
                isAuthenticated={isAuthenticated} onLoginRequest={() => setShowLoginModal(true)}
                dailyData={{ ...daily }}
                onlineUsers={supabase.globalLeaderboard.length > 0 ? supabase.globalLeaderboard : supabase.onlineUsers} 
                liveUsers={supabase.onlineUsers}
                onOpenSocial={handleOpenSocial} disabledGamesList={disabledGames} 
                activeEvent={globalEvents.find(e => e.active)} eventProgress={eventProgress}
                highScores={highScores.highScores}
            />
        );
    }

    if (currentView === 'shop' && isAuthenticated) return <Shop onBack={handleBackToMenu} currency={currency} />;
    if (currentView === 'admin_dashboard' && isAuthenticated && currency.isSuperUser) return <AdminDashboard onBack={handleBackToMenu} mp={mp} onlineUsers={supabase.onlineUsers} />;
    
    if (currentView === 'social' && isAuthenticated) {
        return (
            <SocialOverlay 
                audio={audio} currency={currency} mp={mp} onlineUsers={supabase.onlineUsers} 
                isConnectedToSupabase={supabase.isConnectedToSupabase} isSupabaseConfigured={supabase.isSupabaseConfigured}
                onUnreadChange={setUnreadMessages} friendRequests={friendRequests} setFriendRequests={setFriendRequests}
                activeTabOverride={activeSocialTab} onTabChangeOverride={setActiveSocialTab}
            />
        );
    }
    
    if (currentView === 'settings' && isAuthenticated) return <SettingsMenu onBack={handleBackToMenu} onLogout={handleLogout} onOpenDashboard={() => setCurrentView('admin_dashboard')} onOpenContact={() => setCurrentView('contact')} audio={audio} currency={currency} highScores={highScores.highScores} />;
    if (currentView === 'contact' && isAuthenticated) return <ContactOverlay onBack={() => setCurrentView('settings')} audio={audio} currency={currency} />;

    // --- GAMES ---
    if (currentView === 'tetris' && isAuthenticated) return <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('tetris', metric, val)} />;
    if (currentView === 'connect4' && isAuthenticated) return <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('connect4', metric, val)} />;
    if (currentView === 'sudoku' && isAuthenticated) return <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('sudoku', metric, val)} />;
    if (currentView === 'breaker' && isAuthenticated) return <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('breaker', metric, val)} />;
    if (currentView === 'pacman' && isAuthenticated) return <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('pacman', metric, val)} />;
    if (currentView === 'memory' && isAuthenticated) return <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('memory', metric, val)} />;
    if (currentView === 'battleship' && isAuthenticated) return <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('battleship', metric, val)} />;
    if (currentView === 'snake' && isAuthenticated) return <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('snake', metric, val)} />;
    if (currentView === 'invaders' && isAuthenticated) return <InvadersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('invaders', metric, val)} />;
    if (currentView === 'airhockey' && isAuthenticated) return <AirHockeyGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('airhockey', metric, val)} />;
    if (currentView === 'mastermind' && isAuthenticated) return <MastermindGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('mastermind', metric, val)} />;
    if (currentView === 'uno' && isAuthenticated) return <UnoGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('uno', metric, val)} />;
    if (currentView === 'watersort' && isAuthenticated) return <WaterSortGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('watersort', metric, val)} />;
    if (currentView === 'checkers' && isAuthenticated) return <CheckersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('checkers', metric, val)} />;
    if (currentView === 'runner' && isAuthenticated) return <RunnerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('runner', metric, val)} />;
    if (currentView === 'stack' && isAuthenticated) return <StackGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('stack', metric, val)} />;
    if (currentView === 'arenaclash' && isAuthenticated) return <ArenaClashGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('arenaclash', metric, val)} />;
    if (currentView === 'skyjo' && isAuthenticated) return <SkyjoGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('skyjo', metric, val)} />;
    if (currentView === 'lumen' && isAuthenticated) return <LumenOrderGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} onReportProgress={(metric, val) => handleGameEvent('lumen', metric, val)} />;
    if (currentView === 'slither' && isAuthenticated) return <SlitherGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithEvent} mp={mp} onReportProgress={(metric, val) => handleGameEvent('slither', metric, val)} onlineUsers={supabase.onlineUsers} />;
    
    // Fallback
    return <MainMenu 
        onSelectGame={handleSelectGame} audio={audio} currency={currency} mp={mp} onLogout={handleLogout}
        isAuthenticated={isAuthenticated} onLoginRequest={() => setShowLoginModal(true)}
        dailyData={{ ...daily }}
        onlineUsers={supabase.globalLeaderboard} 
        onOpenSocial={handleOpenSocial} disabledGamesList={disabledGames} 
        activeEvent={undefined} eventProgress={eventProgress}
        highScores={highScores.highScores}
    />;
};
