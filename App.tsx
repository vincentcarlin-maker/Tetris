
import React, { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { TetrisGame } from './components/TetrisGame';
import { RushGame } from './components/rush/RushGame';
import { Connect4Game } from './components/connect4/Connect4Game';
import { SudokuGame } from './components/sudoku/SudokuGame';
import { BreakerGame } from './components/breaker/BreakerGame';
import { PacmanGame } from './components/pacman/PacmanGame';
import { MemoryGame } from './components/memory/MemoryGame';
import { BattleshipGame } from './components/battleship/BattleshipGame';
import { Shop } from './components/Shop';
import { useGameAudio } from './hooks/useGameAudio';
import { useCurrency } from './hooks/useCurrency';
import { useSocialSystem } from './hooks/useSocialSystem';
import { SocialHub } from './components/SocialHub';
import { MessageSquare } from 'lucide-react';

type ViewState = 'menu' | 'tetris' | 'rush' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'shop';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const audio = useGameAudio();
    const currency = useCurrency();
    const social = useSocialSystem(audio, currency);

    useEffect(() => {
        const gameViews: ViewState[] = ['tetris', 'rush', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship'];
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

    const addCoinsWithSound = (amount: number) => {
        currency.addCoins(amount);
        if (amount > 0) {
            audio.playCoin();
        }
    };

    const handleSelectGame = (game: string) => {
        if (game === 'tetris') setCurrentView('tetris');
        else if (game === 'rush') setCurrentView('rush');
        else if (game === 'connect4') setCurrentView('connect4');
        else if (game === 'sudoku') setCurrentView('sudoku');
        else if (game === 'breaker') setCurrentView('breaker');
        else if (game === 'pacman') setCurrentView('pacman');
        else if (game === 'memory') setCurrentView('memory');
        else if (game === 'battleship') setCurrentView('battleship');
        else if (game === 'shop') setCurrentView('shop');
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    const FloatingChatButton = () => (
        <button 
            onClick={() => social.setShowSocial(true)}
            className="fixed bottom-6 right-6 z-50 p-4 bg-purple-600 rounded-full text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:scale-110 active:scale-95 transition-transform border-2 border-white/20"
        >
            <MessageSquare size={24} />
            {social.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border border-white">
                    {social.unreadCount}
                </div>
            )}
        </button>
    );

    const renderContent = () => {
        if (currentView === 'shop') {
            return <Shop onBack={handleBackToMenu} currency={currency} />;
        }
        if (currentView === 'tetris') {
            return <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'rush') {
            return <RushGame onBack={handleBackToMenu} audio={audio} currency={{...currency, addCoins: addCoinsWithSound}} />;
        }
        if (currentView === 'connect4') {
            return <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'sudoku') {
            return <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'breaker') {
            return <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'pacman') {
            return <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'memory') {
            return <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        if (currentView === 'battleship') {
            return <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />;
        }
        return <MainMenu onSelectGame={handleSelectGame} audio={audio} currency={currency} social={social} />;
    };

    return (
        <>
            {renderContent()}
            <SocialHub social={social} currency={currency} />
            {!social.showSocial && <FloatingChatButton />}
        </>
    );
}

export default App;
