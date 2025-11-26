
import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { TetrisGame } from './components/TetrisGame';
import { RushGame } from './components/rush/RushGame';
import { Connect4Game } from './components/connect4/Connect4Game';

type ViewState = 'menu' | 'tetris' | 'rush' | 'connect4';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('menu');

    const handleSelectGame = (game: string) => {
        if (game === 'tetris') {
            setCurrentView('tetris');
        } else if (game === 'rush') {
            setCurrentView('rush');
        } else if (game === 'connect4') {
            setCurrentView('connect4');
        }
    };

    const handleBackToMenu = () => {
        setCurrentView('menu');
    };

    if (currentView === 'tetris') {
        return <TetrisGame onBack={handleBackToMenu} />;
    }

    if (currentView === 'rush') {
        return <RushGame onBack={handleBackToMenu} />;
    }

    if (currentView === 'connect4') {
        return <Connect4Game onBack={handleBackToMenu} />;
    }

    return <MainMenu onSelectGame={handleSelectGame} />;
}

export default App;
