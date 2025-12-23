import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { MainMenu } from './MainMenu';
import { TetrisGame } from './tetris/TetrisGame';
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
import { Shop } from './shop/Shop';
import { AdminDashboard } from './AdminDashboard';
import { SocialOverlay } from './SocialOverlay';
import { SettingsMenu } from './settings/SettingsMenu';
import { ContactOverlay } from './ContactOverlay';
import { Construction } from 'lucide-react';

export const GameRouter: React.FC = () => {
    const { 
        currentView, setCurrentView, isAuthenticated, setShowLoginModal, 
        audio, currency, mp, highScores, daily, supabase, 
        friendRequests, setFriendRequests, unreadMessages, setUnreadMessages,
        activeSocialTab, setActiveSocialTab, disabledGames, featureFlags,
        handleGameEvent, handleLogout, recordTransaction
    } = useGlobal();

    const handleBackToMenu = () => setCurrentView('menu');
    
    const addCoinsWithLog = (amount: number, gameId: string) => {
        if (amount > 0) {
            currency.addCoins(amount);
            audio.playCoin();
            recordTransaction('EARN', amount, `Gain de jeu: ${gameId}`, gameId);
            daily.reportQuestProgress('any', 'coins', amount);
        }
    };

    const handleSelectGame = (game: string) => {
        if (!isAuthenticated) { setShowLoginModal(true); return; }
        setCurrentView(game as any);
    };

    if (featureFlags.maintenance_mode && currency.username !== 'Vincent' && !currency.adminModeActive) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-black/90 p-4 text-center">
                <div className="p-6 rounded-2xl bg-gray-900 border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] max-w-md">
                    <Construction size={64} className="mx-auto text-yellow-500 mb-6 animate-pulse"/>
                    <h1 className="text-3xl font-black text-white mb-2">MAINTENANCE</h1>
                    <p className="text-gray-400 mb-6">Le serveur est actuellement en cours de mise à jour.</p>
                    <button onClick={handleLogout} className="px-6 py-2 bg-gray-800 text-gray-300 rounded-full text-sm font-bold border border-white/10">Déconnexion</button>
                </div>
            </div>
        );
    }

    if (currentView === 'menu') {
        return <MainMenu onSelectGame={handleSelectGame} audio={audio} currency={currency} mp={mp} onLogout={handleLogout} isAuthenticated={isAuthenticated} onLoginRequest={() => setShowLoginModal(true)} dailyData={{ ...daily }} onlineUsers={supabase.globalLeaderboard.length > 0 ? supabase.globalLeaderboard : supabase.onlineUsers} liveUsers={supabase.onlineUsers} onOpenSocial={(t) => { setActiveSocialTab(t); setCurrentView('social'); }} disabledGamesList={disabledGames} activeEvent={undefined} eventProgress={{}} highScores={highScores.highScores} />;
    }

    if (currentView === 'shop' && isAuthenticated) return <Shop onBack={handleBackToMenu} />;
    if (currentView === 'admin_dashboard' && isAuthenticated && currency.isSuperUser) return <AdminDashboard onBack={handleBackToMenu} mp={mp} onlineUsers={supabase.onlineUsers} />;
    if (currentView === 'social' && isAuthenticated) return <SocialOverlay audio={audio} currency={currency} mp={mp} onlineUsers={supabase.onlineUsers} isConnectedToSupabase={supabase.isConnectedToSupabase} isSupabaseConfigured={supabase.isSupabaseConfigured} onUnreadChange={setUnreadMessages} friendRequests={friendRequests} setFriendRequests={setFriendRequests} activeTabOverride={activeSocialTab} onTabChangeOverride={setActiveSocialTab} />;
    if (currentView === 'settings' && isAuthenticated) return <SettingsMenu onBack={handleBackToMenu} onLogout={handleLogout} onOpenDashboard={() => setCurrentView('admin_dashboard')} onOpenContact={() => setCurrentView('contact')} />;
    if (currentView === 'contact' && isAuthenticated) return <ContactOverlay onBack={() => setCurrentView('settings')} audio={audio} currency={currency} />;

    const gamesMap: Record<string, React.ReactElement> = {
        tetris: <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'tetris')} onReportProgress={(m, v) => handleGameEvent('tetris', m, v)} />,
        connect4: <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'connect4')} mp={mp} onReportProgress={(m, v) => handleGameEvent('connect4', m, v)} />,
        sudoku: <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'sudoku')} onReportProgress={(m, v) => handleGameEvent('sudoku', m, v)} />,
        breaker: <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'breaker')} onReportProgress={(m, v) => handleGameEvent('breaker', m, v)} />,
        pacman: <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'pacman')} onReportProgress={(m, v) => handleGameEvent('pacman', m, v)} />,
        memory: <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'memory')} mp={mp} onReportProgress={(m, v) => handleGameEvent('memory', m, v)} />,
        battleship: <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'battleship')} mp={mp} onReportProgress={(m, v) => handleGameEvent('battleship', m, v)} />,
        snake: <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'snake')} onReportProgress={(m, v) => handleGameEvent('snake', m, v)} />,
        invaders: <InvadersGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'invaders')} onReportProgress={(m, v) => handleGameEvent('invaders', m, v)} />,
        airhockey: <AirHockeyGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'airhockey')} mp={mp} onReportProgress={(m, v) => handleGameEvent('airhockey', m, v)} />,
        mastermind: <MastermindGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'mastermind')} mp={mp} onReportProgress={(m, v) => handleGameEvent('mastermind', m, v)} />,
        uno: <UnoGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'uno')} mp={mp} onReportProgress={(m, v) => handleGameEvent('uno', m, v)} />,
        watersort: <WaterSortGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'watersort')} onReportProgress={(m, v) => handleGameEvent('watersort', m, v)} />,
        checkers: <CheckersGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'checkers')} mp={mp} onReportProgress={(m, v) => handleGameEvent('checkers', m, v)} />,
        runner: <RunnerGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'runner')} onReportProgress={(m, v) => handleGameEvent('runner', m, v)} />,
        stack: <StackGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'stack')} onReportProgress={(m, v) => handleGameEvent('stack', m, v)} />,
        arenaclash: <ArenaClashGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'arenaclash')} mp={mp} onReportProgress={(m, v) => handleGameEvent('arenaclash', m, v)} />,
        skyjo: <SkyjoGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'skyjo')} mp={mp} onReportProgress={(m, v) => handleGameEvent('skyjo', m, v)} />,
        lumen: <LumenOrderGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'lumen')} onReportProgress={(m, v) => handleGameEvent('lumen', m, v)} />,
        slither: <SlitherGame onBack={handleBackToMenu} audio={audio} addCoins={(a) => addCoinsWithLog(a, 'slither')} mp={mp} onReportProgress={(m, v) => handleGameEvent('slither', m, v)} onlineUsers={supabase.onlineUsers} />
    };

    return gamesMap[currentView] || gamesMap.tetris;
};