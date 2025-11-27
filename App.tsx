
import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { TetrisGame } from './components/TetrisGame';
import { RushGame } from './components/rush/RushGame';
import { Connect4Game } from './components/connect4/Connect4Game';
import { SudokuGame } from './components/sudoku/SudokuGame';
import { Shop } from './components/Shop';
import { useGameAudio } from './hooks/useGameAudio';
import { useCurrency } from './hooks/useCurrency';

type ViewState = 'menu' | 'tetris' | 'rush' | 'connect4' | 'sudoku' | 'shop';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');
    const audio = useGameAudio();
    const currency = useCurrency();

    const handleSelectGame = (game: string) => {
        if (game === 'tetris') setCurrentView('tetris');
        else if (game === 'rush') setCurrentView('rush');
        else if (game === 'connect4') setCurrentView('connect4');
        else if (game === 'sudoku') setCurrentView('sudoku');
        else if (game === 'shop') setCurrentView('shop');
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    if (currentView === 'shop') {
        return <Shop onBack={handleBackToMenu} currency={currency} />;
    }

    if (currentView === 'tetris') {
        return <TetrisGame onBack={handleBackToMenu} audio={audio} addCoins={currency.addCoins} />;
    }

    if (currentView === 'rush') {
        return <RushGame onBack={handleBackToMenu} audio={audio} addCoins={currency.addCoins} />;
    }

    if (currentView === 'connect4') {
        return <Connect4Game onBack={handleBackToMenu} audio={audio} addCoins={currency.addCoins} />;
    }

    if (currentView === 'sudoku') {
        return <SudokuGame onBack={handleBackToMenu} audio={audio} addCoins={currency.addCoins} />;
    }

    return <MainMenu onSelectGame={handleSelectGame} audio={audio} currency={currency} />;
}

export default App;
