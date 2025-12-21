
import React, { useState } from 'react';
import { CheckCircle, ChevronDown, Lock, Check, Coins } from 'lucide-react';
import { GAMES_CONFIG } from '../../constants/gamesConfig';

interface DailyQuestWidgetProps {
    quests: any[];
    isAuthenticated: boolean;
    language: string;
    onClaim: (quest: any, e: React.MouseEvent) => void;
    onGameStart: (gameId: string) => void;
}

export const DailyQuestWidget: React.FC<DailyQuestWidgetProps> = ({ quests, isAuthenticated, language, onClaim, onGameStart }) => {
    const [isQuestsExpanded, setIsQuestsExpanded] = useState(false);

    const getQuestIcon = (gameId: string) => {
        const game = GAMES_CONFIG.find(g => g.id === gameId);
        return game ? game.icon : Coins;
    };

    const getDifficultyColor = (diff: string) => {
        switch(diff) {
            case 'EASY': return 'text-green-400 border-green-500/50 bg-green-900/20';
            case 'MEDIUM': return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20';
            case 'HARD': return 'text-red-500 border-red-500/50 bg-red-900/20';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-800';
        }
    };

    return (
        <div className={`w-full bg-black/80 border ${isAuthenticated ? 'border-green-500/30' : 'border-gray-700/50'} rounded-xl p-3 backdrop-blur-md shadow-[0_0_20px_rgba(34, 197, 94,0.1)] relative overflow-hidden group hover:border-green-500/50 hover:shadow-[0_0_35px_rgba(34, 197, 94,0.5)] hover:ring-1 hover:ring-green-500/30 transition-all duration-300 ${!isAuthenticated ? 'opacity-70 grayscale' : ''}`}>
             <div onClick={() => isAuthenticated && setIsQuestsExpanded(!isQuestsExpanded)} className={`flex items-center justify-between border-white/10 relative z-10 cursor-pointer ${isQuestsExpanded ? 'border-b mb-2 pb-2' : ''}`}>
                 <div className="flex items-center gap-2 overflow-hidden py-1">
                     <h3 className="text-base font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] whitespace-nowrap pr-2 uppercase"><CheckCircle size={16} className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> {language === 'fr' ? 'DÉFIS DU JOUR' : 'DAILY QUESTS'}</h3>
                     {isAuthenticated && !isQuestsExpanded && (<div className="flex gap-1 ml-1 animate-in fade-in duration-300 shrink-0">{quests.map((q) => (<div key={q.id} title={q.description} className={`w-3 h-3 flex items-center justify-center rounded-full border transition-colors ${q.isCompleted ? 'bg-green-500 border-green-400 shadow-[0_0_5px_#22c55e]' : 'bg-gray-800/50 border-white/10'}`}>{q.isCompleted && <Check size={8} className="text-black" strokeWidth={4} />}</div>))}</div>)}
                 </div>
                 {isAuthenticated ? <ChevronDown size={16} className={`text-green-400 transition-transform duration-300 ${isQuestsExpanded ? 'rotate-180' : ''}`} /> : <Lock size={16} className="text-gray-500" />}
             </div>
             {isAuthenticated && isQuestsExpanded && (
                 <div className="space-y-3 relative z-10 animate-in slide-in-from-top-2 duration-300">
                     {quests.map(quest => {
                         const GameIcon = getQuestIcon(quest.gameId);
                         const diffColor = getDifficultyColor(quest.difficulty);
                         const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
                         return (
                             <div key={quest.id} onClick={() => quest.gameId !== 'any' && onGameStart(quest.gameId)} className={`relative flex flex-col p-3 rounded-lg border transition-all duration-300 ${quest.isCompleted ? 'bg-green-950/40 border-green-500/50' : 'bg-gray-900/60 border-white/5 hover:border-white/20'} cursor-pointer group/quest`}>
                                 <div className="flex items-center justify-between mb-2">
                                     <div className="flex items-center gap-3">
                                         <div className={`p-1.5 rounded-md ${diffColor}`}><GameIcon size={16} /></div>
                                         <div><span className={`text-xs font-bold tracking-wide block ${quest.isCompleted ? 'text-green-100 line-through decoration-green-500/50' : 'text-gray-200'}`}>{quest.description}</span><span className="text-[9px] text-gray-500 font-mono">{quest.progress}/{quest.target}</span></div>
                                     </div>
                                     {quest.isCompleted && !quest.isClaimed ? (
                                         <button onClick={(e) => onClaim(quest, e)} className="px-3 py-1.5 bg-yellow-400 text-black text-[10px] font-black tracking-wider rounded hover:bg-white shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse flex items-center justify-center gap-1 shrink-0"><Coins size={12} fill="black" /> +{quest.reward}</button>
                                     ) : quest.isClaimed ? (
                                         <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded border border-green-500/20 shrink-0"><Check size={12} className="text-green-400" /><span className="text-[10px] font-black text-green-400 tracking-wider uppercase">{language === 'fr' ? 'FAIT' : 'DONE'}</span></div>
                                     ) : (
                                         <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-mono font-bold bg-yellow-900/10 px-2 py-1 rounded border border-yellow-500/20 shrink-0"><Coins size={10} /> {quest.reward}</div>
                                     )}
                                 </div>
                                 <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5 relative"><div className={`h-full transition-all duration-500 relative ${quest.isCompleted ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} style={{ width: `${progressPercent}%` }}></div></div>
                             </div>
                         );
                     })}
                 </div>
             )}
        </div>
    );
};
