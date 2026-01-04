
import React, { useEffect } from 'react';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { GameRouter } from './components/GameRouter';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';
import { AlertTriangle, Info } from 'lucide-react';

// Wrapper component to consume Context for Layout Elements
const AppContent: React.FC = () => {
    const { 
        currentView, setCurrentView, showLoginModal, setShowLoginModal, 
        globalAlert, handleLogin, isAuthenticated, setActiveSocialTab,
        unreadMessages, friendRequests, currency, supabase
    } = useGlobal();

    // Background Management
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

    // Body Class Management for Games
    useEffect(() => {
        const gameViews = ['tetris', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship', 'snake', 'invaders', 'airhockey', 'mastermind', 'uno', 'watersort', 'checkers', 'runner', 'stack', 'arenaclash', 'skyjo', 'lumen', 'slither'];
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

    const isGameActive = !['menu', 'shop', 'admin_dashboard', 'social', 'settings', 'contact'].includes(currentView);
    // On cache le BottomNav explicitement pour la vue 'social' pour libérer l'espace messagerie
    const shouldShowBottomNav = !isGameActive && currentView !== 'admin_dashboard';

    const handleOpenSocial = (tab: any) => {
        if (!isAuthenticated) { setShowLoginModal(true); return; }
        setActiveSocialTab(tab);
        setCurrentView('social');
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full">
            {globalAlert && (
                <div className="fixed top-0 left-0 right-0 z-[300] flex justify-center p-4 pointer-events-none animate-in slide-in-from-top-10 fade-in duration-500" style={{ top: 'env(safe-area-inset-top)' }}>
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
                    onAttemptLogin={supabase.loginAndFetchProfile}
                />
            )}

            <div className="flex-1 overflow-auto">
                <GameRouter />
            </div>

            {isAuthenticated && shouldShowBottomNav && (
                <BottomNav 
                    currentView={currentView} onNavigate={(v) => setCurrentView(v)} 
                    onOpenSocial={handleOpenSocial} showSocial={currentView === 'social'}
                    activeSocialTab={""} unreadMessages={unreadMessages} pendingRequests={friendRequests.length}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GlobalProvider>
            <AppContent />
        </GlobalProvider>
    );
}

export default App;
