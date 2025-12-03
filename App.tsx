

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
import { SnakeGame } from './components/snake/SnakeGame';
import { Shop } from './components/Shop';
import { SocialOverlay } from './components/SocialOverlay';
import { useGameAudio } from './hooks/useGameAudio';
import { useCurrency } from './hooks/useCurrency';
import { useMultiplayer } from './hooks/useMultiplayer';


type ViewState = 'menu' | 'tetris' | 'rush' | 'connect4' | 'sudoku' | 'breaker' | 'pacman' | 'memory' | 'battleship' | 'snake' | 'shop';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const audio = useGameAudio();
    const currency = useCurrency();
    const mp = useMultiplayer(); // Global Multiplayer Lobby Connection

    // Connect global lobby on mount
    useEffect(() => {
        mp.connect();
        return () => mp.disconnect();
    }, []);

    useEffect(() => {
        const gameViews: ViewState[] = ['tetris', 'rush', 'connect4', 'sudoku', 'breaker', 'pacman', 'memory', 'battleship', 'snake'];
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

    // Wrapper pour déclencher le son à chaque gain
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
        else if (game === 'snake') setCurrentView('snake');
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
                <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />
            )}

            {currentView === 'rush' && (
                <RushGame onBack={handleBackToMenu} audio={audio} currency={{...currency, addCoins: addCoinsWithSound}} />
            )}

            {currentView === 'connect4' && (
                <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} mp={mp} />
            )}

            {currentView === 'sudoku' && (
                <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />
            )}

            {currentView === 'breaker' && (
                <BreakerGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />
            )}
            
            {currentView === 'pacman' && (
                <PacmanGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />
            )}
            
            {currentView === 'memory' && (
                <MemoryGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} mp={mp} />
            )}

            {currentView === 'battleship' && (
                <BattleshipGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} mp={mp} />
            )}

            {currentView === 'snake' && (
                <SnakeGame onBack={handleBackToMenu} audio={audio} addCoins={addCoinsWithSound} />
            )}

            {currentView === 'menu' && (
                <MainMenu onSelectGame={handleSelectGame} audio={audio} currency={currency} mp={mp} />
            )}
        </>
    );
}

export default App;
