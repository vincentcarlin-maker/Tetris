
import React, { useState, useMemo } from 'react';
import { Trophy, ChevronDown, X } from 'lucide-react';
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

    // Calcul du meilleur record pour l'aperçu
    const bestRecordPreview = useMemo(() => {
        let bestLabel = "";
        let bestVal = 0;
        let color = "text-yellow-400";

        for (const game of LEADERBOARD_GAMES) {
            const score = highScores[game.id];
            const val = game.id === 'sudoku' && typeof score === 'object' ? score?.medium : score;
            if (val && (val as number) > bestVal && game.type === 'high') {
                bestVal = val as number;
                bestLabel = game.label;
                color = game.color;
            }
        }
        return bestLabel ? { label: bestLabel, value: bestVal, color } : null;
    }, [highScores]);

    return (
        <div className={`w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250,204,21,0.2)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30 relative z-20 overflow-hidden`}>
            <button 
                onClick={() => setShowScores(!showScores)} 
                className={`w-full p-4 flex items-center justify-between cursor-pointer group/btn transition-colors ${showScores ? 'bg-white/5' : ''}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Trophy size={20} className="text-yellow-400 group-hover/btn:scale-110 transition-transform shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tight truncate w-full">
                            {language === 'fr' ? 'Classements' : 'Leaderboards'}
                        </h3>
                        {!showScores && bestRecordPreview && (
                            <span className={`text-[9px] font-mono font-bold ${bestRecordPreview.color} uppercase tracking-widest truncate animate-in slide-in-from-left-2`}>
                                Record: {bestRecordPreview.value.toLocaleString()} ({bestRecordPreview.label})
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {showScores && <X size={18} className="text-gray-500 hover:text-white" />}
                    {!showScores && <ChevronDown size={20} className={`text-yellow-400 transition-transform duration-300`} />}
                </div>
            </button>
            
            {showScores && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/5 pt-4">
                    <div className="flex bg-black/30 p-1 rounded-lg mb-4 border border-white/5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setScoreTab('LOCAL'); }} 
                            className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all cursor-pointer ${scoreTab === 'LOCAL' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white uppercase'}`}
                        >
                            {language === 'fr' ? 'MES RECORDS' : 'MY RECORDS'}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setScoreTab('GLOBAL'); }} 
                            className={`flex-1 py-2 text-[10px] font-black rounded-md transition-all cursor-pointer ${scoreTab === 'GLOBAL' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white uppercase'}`}
                        >
                            {language === 'fr' ? 'MONDE' : 'WORLD'}
                        </button>
                    </div>
                    
                    {scoreTab === 'LOCAL' ? (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {LEADERBOARD_GAMES.map(game => {
                                const score = highScores[game.id];
                                const displayScore = game.id === 'sudoku' && typeof score === 'object' ? score?.medium : score;
                                if (displayScore && (displayScore as number) > 0) {
                                    return (
                                        <div key={game.id} className="py-2 border-b border-white/5 last:border-0 flex justify-between items-center group/item">
                                            <span className={`text-xs font-bold ${game.color} group-hover/item:brightness-125 transition-all`}>{game.label}</span>
                                            <span className="text-xs font-mono font-bold text-white">{(displayScore as number).toLocaleString()} <span className="text-[10px] text-gray-500 font-normal uppercase">{game.unit}</span></span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                            {!Object.values(highScores).some(v => v && (typeof v === 'number' ? v > 0 : true)) && (
                                <p className="text-center text-gray-600 text-[10px] py-4 italic uppercase tracking-widest">Aucune donnée</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {LEADERBOARD_GAMES.map(game => {
                                const top = getTopScoreForGame(game);
                                return (
                                    <div key={game.id} className="py-2.5 border-b border-white/5 last:border-0 flex justify-between items-center group/world">
                                        <h4 className={`font-bold text-xs ${game.color} group-hover/world:brightness-125 transition-all`}>{game.label}</h4>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-300 font-black uppercase italic">{top.name}</p>
                                            <p className="font-mono text-sm text-white font-bold">{top.score > 0 ? `${top.score.toLocaleString()} ${game.unit}` : '-'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
