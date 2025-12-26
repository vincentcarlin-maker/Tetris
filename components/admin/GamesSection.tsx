
import React, { useState } from 'react';
import { Gamepad2, Settings, Edit2, Coins, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { GameConfigModal } from './game_config/GameConfigModal';

interface GamesSectionProps {
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
    const [selectedGame, setSelectedGame] = useState<any | null>(null);
    const [resettingId, setResettingId] = useState<string | null>(null);

    const toggleGame = async (gameId: string) => {
        const isCurrentlyDisabled = disabledGames.includes(gameId);
        const newArr = isCurrentlyDisabled ? disabledGames.filter(id => id !== gameId) : [...disabledGames, gameId];
        
        // Mise à jour de l'état global et local
        setDisabledGames(newArr);
        localStorage.setItem('neon_disabled_games', JSON.stringify(newArr));
        
        // Notification immédiate de tous les clients via broadcast
        mp.sendAdminBroadcast(newArr, 'game_config');
        
        // Sauvegarde persistante sur Supabase
        if (isSupabaseConfigured) {
            await DB.saveSystemConfig({ disabledGames: newArr });
        }
    };

    const handleSaveConfig = (updatedGame: any) => {
        console.log("Saving game config:", updatedGame);
        mp.sendAdminBroadcast(`${updatedGame.name} mis à jour (v${updatedGame.version})`, 'info');
        setSelectedGame(null);
    };

    const handleResetLeaderboard = async (gameId: string, gameName: string) => {
        if (!isSupabaseConfigured) {
            alert("Impossible : Supabase non configuré.");
            return;
        }

        const confirmReset = window.confirm(`⚠️ DANGER ⚠️\n\nVous êtes sur le point de réinitialiser TOUS les scores pour le jeu : ${gameName}.\n\nCette action est irréversible pour tous les joueurs.\n\nConfirmer ?`);
        if (!confirmReset) return;

        setResettingId(gameId);

        try {
            // 1. Récupérer tous les profils
            const allProfiles = await DB.getFullAdminExport();
            
            // 2. Préparer les mises à jour (on le fait séquentiellement pour éviter de surcharger la DB)
            let count = 0;
            
            // On utilise Promise.all pour paralléliser par lots si besoin, mais ici boucle simple pour la sécurité
            for (const profile of allProfiles) {
                // On vérifie si le joueur a des scores pour ce jeu
                if (profile.data?.highScores && profile.data.highScores[gameId] !== undefined) {
                    const currentScores = profile.data.highScores;
                    
                    // Reset spécifique selon le type de score
                    // Pour Sudoku c'est un objet, pour les autres un nombre
                    const resetValue = gameId === 'sudoku' ? {} : 0;
                    
                    // Si le score est déjà à 0/vide, on passe
                    if (JSON.stringify(currentScores[gameId]) === JSON.stringify(resetValue)) continue;

                    const newScores = { ...currentScores, [gameId]: resetValue };
                    
                    // Mise à jour DB
                    await DB.updateUserData(profile.username, { highScores: newScores });
                    count++;
                }
            }

            // 3. Notifier
            mp.sendAdminBroadcast(`Leaderboard de ${gameName} réinitialisé ! (${count} joueurs affectés)`, 'info');
            alert(`Succès ! Scores remis à zéro pour ${count} joueurs.`);

        } catch (error) {
            console.error("Erreur reset:", error);
            alert("Une erreur est survenue lors de la réinitialisation.");
        } finally {
            setResettingId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
            {GAMES_LIST.map(game => {
                const isDisabled = disabledGames.includes(game.id);
                const isResetting = resettingId === game.id;

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
                            <button 
                                onClick={() => setSelectedGame(game)}
                                disabled={isResetting}
                                className="flex-1 py-2 text-xs bg-blue-600/20 text-blue-400 font-bold rounded-lg border border-blue-500/30 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                            >
                                <Edit2 size={14}/> CONFIGURER
                            </button>
                            
                            <button 
                                onClick={() => handleResetLeaderboard(game.id, game.name)}
                                disabled={isResetting}
                                className="px-3 py-2 text-xs bg-red-600/20 text-red-400 font-bold rounded-lg border border-red-500/30 flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Réinitialiser les scores de ce jeu"
                            >
                                {isResetting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                            </button>
                        </div>
                    </div>
                );
            })}

            {selectedGame && (
                <GameConfigModal 
                    game={selectedGame} 
                    onClose={() => setSelectedGame(null)} 
                    onSave={handleSaveConfig}
                />
            )}
        </div>
    );
};
