
import React from 'react';
import { Gamepad2, Settings, Edit2, Coins } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

interface GamesSectionProps {
    profiles: any[];
    disabledGames: string[];
    setDisabledGames: React.Dispatch<React.SetStateAction<string[]>>;
    mp: any;
}

const GAMES_LIST = [
    { id: 'slither', name: 'Neon Slither', version: '1.0' },
    { id: 'tetris', name: 'Tetris', version: '2.1' },
    { id: 'connect4', name: 'Connect 4', version: '1.5' },
    { id: 'sudoku', name: 'Sudoku', version: '1.2' },
    { id: 'breaker', name: 'Breaker', version: '3.0' },
    { id: 'pacman', name: 'Pacman', version: '2.4' },
    { id: 'snake', name: 'Snake', version: '1.0' },
    { id: 'invaders', name: 'Invaders', version: '1.0' },
    { id: 'airhockey', name: 'Air Hockey', version: '1.0' },
    { id: 'mastermind', name: 'Mastermind', version: '1.0' },
    { id: 'uno', name: 'Uno', version: '1.0' },
    { id: 'watersort', name: 'Neon Mix', version: '1.0' },
    { id: 'checkers', name: 'Dames', version: '1.0' },
    { id: 'runner', name: 'Neon Run', version: '1.0' },
    { id: 'stack', name: 'Stack', version: '1.0' },
    { id: 'arenaclash', name: 'Arena Clash', version: '1.0' },
    { id: 'skyjo', name: 'Skyjo', version: '1.0' },
    { id: 'lumen', name: 'Lumen Order', version: '1.0' },
    { id: 'memory', name: 'Memory', version: '1.0' },
    { id: 'battleship', name: 'Bataille', version: '1.0' }
];

export const GamesSection: React.FC<GamesSectionProps> = ({ disabledGames, setDisabledGames, mp }) => {
    const toggleGame = (gameId: string) => {
        const newArr = disabledGames.includes(gameId) ? disabledGames.filter(id => id !== gameId) : [...disabledGames, gameId];
        setDisabledGames(newArr);
        localStorage.setItem('neon_disabled_games', JSON.stringify(newArr));
        mp.sendAdminBroadcast(disabledGames.includes(gameId) ? 'Jeu réactivé' : 'Jeu en maintenance', 'game_config', newArr);
        if (isSupabaseConfigured) DB.saveSystemConfig({ disabledGames: newArr });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
            {GAMES_LIST.map(game => {
                const isDisabled = disabledGames.includes(game.id);
                return (
                    <div key={game.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isDisabled ? 'bg-red-900/10 border-red-500/30' : 'bg-gray-800 border-white/10'}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDisabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}><Gamepad2 size={24} /></div>
                                <div><h4 className="font-bold text-lg text-white">{game.name}</h4><p className="text-[10px] text-gray-500 font-mono">v{game.version}</p></div>
                            </div>
                            <button onClick={() => toggleGame(game.id)} className={`relative w-12 h-6 rounded-full transition-colors ${isDisabled ? 'bg-gray-600' : 'bg-green-500'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDisabled ? 'translate-x-0' : 'translate-x-6'}`}></div></button>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                            <button className="flex-1 py-2 text-xs bg-blue-600/20 text-blue-400 font-bold rounded-lg border border-blue-500/30 flex items-center justify-center gap-2"><Edit2 size={14}/> CONFIGURER</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
