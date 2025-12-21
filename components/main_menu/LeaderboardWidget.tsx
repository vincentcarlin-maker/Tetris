
import React, { useState } from 'react';
import { Trophy, ChevronDown } from 'lucide-react';
import { LEADERBOARD_GAMES } from '../../constants/gamesConfig';

interface LeaderboardWidgetProps {
    highScores: any;
    onlineUsers: any[];
    language: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ highScores, onlineUsers, language }) => {
    const [showScores, setShowScores] = useState(false);
    const [scoreTab, setScoreTab] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');

    const getTopScoreForGame = (game: { id: string, type: string }) => {
        if (onlineUsers.length === 0) return { name: '-', score: 0 };
        const sorted = [...onlineUsers].sort((a, b) => {
            const scoreA = a.stats?.[game.id] || 0;
            const scoreB = b.stats?.[game.id] || 0;
            if (game.type === 'low') {
                const realA = scoreA === 0 ? Infinity : scoreA;
                const realB = scoreB === 0 ? Infinity : scoreB;
                return realA - realB;
            }
            return scoreB - scoreA;
        });
        const top = sorted[0];
        const topScore = top.stats?.[game.id] || 0;
        if (!topScore) return { name: '-', score: 0 };
        return { name: top.name, score: topScore };
    };

    return (
        <div className="w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250, 204, 21, 0.5)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30">
            <button onClick={() => setShowScores(s => !s)} className="w-full p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Trophy size={20} className="text-yellow-400" /><h3 className="text-lg font-bold text-white italic uppercase">{language === 'fr' ? 'SCORES & CLASSEMENTS' : 'SCORES & LEADERBOARDS'}</h3></div><ChevronDown size={20} className={`transition-transform duration-300 ${showScores ? 'rotate-180' : ''}`} /></button>
            {showScores && (
                <div className="px-4 pb-4 animate-in fade-in duration-300">
                    <div className="flex bg-black/30 p-1 rounded-lg mb-3">
                        <button onClick={() => setScoreTab('LOCAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'LOCAL' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white uppercase'}`}>{language === 'fr' ? 'MES RECORDS' : 'MY RECORDS'}</button>
                        <button onClick={() => setScoreTab('GLOBAL')} className={`flex-1 py-1 text-xs font-bold rounded ${scoreTab === 'GLOBAL' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white uppercase'}`}>{language === 'fr' ? 'MONDE' : 'WORLD'}</button>
                    </div>
                    {scoreTab === 'LOCAL' ? (
                        <div className="space-y-2">
                            {LEADERBOARD_GAMES.map(game => {
                                const score = highScores[game.id];
                                const displayScore = game.id === 'sudoku' && typeof score === 'object' ? score?.medium : score;
                                if (displayScore && (displayScore as number) > 0) return (<div key={game.id} className="py-2 border-t border-white/5 flex justify-between"><span className={`text-xs font-bold ${game.color}`}>{game.label}</span><span className="text-xs font-mono">{(displayScore as number).toLocaleString()} {game.unit}</span></div>);
                                return null;
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {LEADERBOARD_GAMES.map(game => {
                                const top = getTopScoreForGame(game);
                                return (<div key={game.id} className="py-2 border-t border-white/5 flex justify-between items-center"><h4 className={`font-bold text-sm ${game.color}`}>{game.label}</h4><div className="text-right"><p className="text-xs text-gray-400 font-bold">{top.name}</p><p className="font-mono text-lg">{top.score > 0 ? `${top.score.toLocaleString()} ${game.unit}` : '-'}</p></div></div>);
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
