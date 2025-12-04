
import React, { useState, useEffect } from 'react';
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
import { Shop } from './components/Shop';
import { SocialOverlay } from './components/SocialOverlay';
import { useGameAudio } from './hooks/useGameAudio';
import { useCurrency } from './hooks/useCurrency';
import { useMultiplayer } from './hooks/useMultiplayer';
import { useDailySystem } from './hooks/useDailySystem';


type ViewState = 'menu' | 'tetris' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'invaders' | 'shop';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const audio = useGameAudio();
    const currency = useCurrency();
    const mp = useMultiplayer(); // Global Multiplayer Lobby Connection

    // DAILY SYSTEM INTEGRATION - Lifted to App level to persist state
    const { 
        streak, 
        showDailyModal, 
        todaysReward, 
        claimDailyBonus, 
        quests, 
        checkGameQuest, 
        checkCoinQuest, 
        claimQuestReward 
    } = useDailySystem(currency.addCoins);

    // Connect global lobby on mount
    useEffect(() => {
        mp.connect();
        return () => mp.disconnect();
    }, []);

    // Apply Background Wallpaper
    useEffect(() => {
        const bgElement = document.getElementById('app-background');
        if (bgElement) {
            const wallpaper = currency.wallpapersCatalog.find(w => w.id === currency.currentWallpaperId);
            if (wallpaper) {
                bgElement.style.background = wallpaper.cssValue;
                
                // Gestion spécifique de la taille du background
                if (wallpaper.bgSize) {
                    bgElement.style.backgroundSize = wallpaper.bgSize;
                    bgElement.style.backgroundPosition = '0 0'; // Start top left for patterns
                } else if (currency.currentWallpaperId !== 'bg_brick') {
                    // Pour les dégradés et images "cover"
                    bgElement.style.backgroundSize = 'cover';
                    bgElement.style.backgroundPosition = 'center';
                } else {
                    // Reset to default style for brick
                    bgElement.style.backgroundSize = '100% 100%, 200px 60px';
                    bgElement.style.backgroundPosition = '';
                }
            }
        }
    }, [currency.currentWallpaperId, currency.wallpapersCatalog]);

    useEffect(() => {
        const gameViews: ViewState[] = ['tetris', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship', 'snake', 'invaders'];
        const isGameView = gameViews.includes(currentView);

        if (isGameView) {
            document.body.classList.add('overflow-hidden');
            document.body.style.touchAction = 'none';
        } else {
            document.body.classList.remove('overflow-hidden');
            document.body.style.touchAction = 'auto';
        }

        // Cleanup function to restore default on component unmount
        return () => {
            document.body.classList.remove('overflow-hidden');
            document.body.style.touchAction = 'auto';
        };
    }, [currentView]);

    // Wrapper pour déclencher le son à chaque gain ET vérifier les quêtes de pièces
    const addCoinsWithSoundAndQuest = (amount: number) => {
        if (amount > 0) {
            currency.addCoins(amount);
            audio.playCoin();
            checkCoinQuest(amount); // Check if this completes a coin quest
        }
    };

    const handleSelectGame = (game: string) => {
        // Trigger "Play X" quest immediately when starting
        checkGameQuest(game);

        if (game === 'tetris') setCurrentView('tetris');
        else if (game === 'connect4') setCurrentView('connect4');
        else if (game === 'sudoku') setCurrentView('sudoku');
        else if (game === 'breaker') setCurrentView('breaker');
        else if (game === 'pacman') setCurrentView('pacman');
        else if (game === 'memory') setCurrentView('memory');
        else if (game === 'battleship') setCurrentView('battleship');
        else if (game === 'snake') setCurrentView('snake');
        else if (game === 'invaders') setCurrentView('invaders');
        else if (game === 'shop') setCurrentView('shop');
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    return (
        <>
            <SocialOverlay audio={audio} currency={currency} mp={mp} />
            
            {currentView === 'shop' && (
                <Shop onBack={handleBackToMenu} currency={currency} />
            )}

            {currentView === 'tetris' && (
                <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}

            {currentView === 'connect4' && (
                <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} />
            )}

            {currentView === 'sudoku' && (
                <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}

            {currentView === 'breaker' && (
                <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}
            
            {currentView === 'pacman' && (
                <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}
            
            {currentView === 'memory' && (
                <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} />
            )}

            {currentView === 'battleship' && (
                <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} mp={mp} />
            )}

            {currentView === 'snake' && (
                <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}

            {currentView === 'invaders' && (
                <InvadersGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSoundAndQuest} />
            )}

            {currentView === 'menu' && (
                <MainMenu 
                    onSelectGame={handleSelectGame} 
                    audio={audio} 
                    currency={currency} 
                    mp={mp}
                    dailyData={{
                        streak,
                        showDailyModal,
                        todaysReward,
                        claimDailyBonus,
                        quests,
                        claimQuestReward
                    }}
                />
            )}
        </>
    );
}

export default App;
