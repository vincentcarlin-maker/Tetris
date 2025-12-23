import React, { useMemo } from 'react';
import { UserCircle, Coins, Star, Trophy } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';

const GAME_LABELS: Record<string, string> = {
    tetris: 'Tetris', arenaclash: 'Arena Clash', stack: 'Stack', runner: 'Neon Run',
    pacman: 'Pacman', snake: 'Snake', breaker: 'Breaker', invaders: 'Invaders',
    lumen: 'Lumen Order', memory: 'Memory', skyjo: 'Skyjo', uno: 'Uno', mastermind: 'Mastermind', slither: 'Cyber Serpent'
};

export const UserProfileCard: React.FC = () => {
    const { currency, highScores } = useGlobal();
    const { t } = currency;
    
    const currentAvatar = useMemo(() => 
        currency.avatarsCatalog.find((a: any) => a.id === currency.currentAvatarId) || currency.avatarsCatalog[0], 
    [currency.currentAvatarId, currency.avatarsCatalog]);

    const currentFrame = useMemo(() => 
        currency.framesCatalog.find((f: any) => f.id === currency.currentFrameId) || currency.framesCatalog[0], 
    [currency.currentFrameId, currency.framesCatalog]);

    const currentTitle = useMemo(() => 
        currency.titlesCatalog.find((t: any) => t.id === currency.currentTitleId), 
    [currency.currentTitleId, currency.titlesCatalog]);
    
    const topScores = useMemo(() => {
        return Object.entries(highScores.highScores)
            .filter(([key, val]) => typeof val === 'number' && val > 0 && key !== 'watersort' && key !== 'rush')
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3);
    }, [highScores.highScores]);

    const AvatarIcon = currentAvatar.icon;

    return (
        <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>
            
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle size={16} className="text-neon-blue" /> {t.profile}</h3>
            
            <div className="flex items-center gap-6 mb-8">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 flex items-center justify-center relative border-2 ${currentFrame.cssClass} shadow-xl`}>
                    <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                        <AvatarIcon size={40} className={currentAvatar.color} />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black text-white italic truncate">{currency.username}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {currentTitle && currentTitle.id !== 't_none' && (
                            <span className={`text-[9px] font-black uppercase tracking-wider ${currentTitle.color} ${currentTitle.shadow || ''} bg-gray-900/80 px-1.5 py-0.5 rounded border border-white/10`}>
                                {currentTitle.name}
                            </span>
                        )}
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${currency.playerRank.color}`}>
                            {currency.playerRank.title}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                    <Coins size={18} className="text-yellow-400 mb-1" />
                    <span className="text-lg font-black font-mono">{currency.coins.toLocaleString()}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{t.coins}</span>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                    <Star size={18} className="text-purple-400 mb-1" />
                    <span className="text-lg font-black font-mono">{currency.inventory.length}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{t.badges}</span>
                </div>
            </div>

            <div className="bg-black/60 rounded-2xl p-4 border border-white/5">
                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Trophy size={12}/> {t.record.toUpperCase()}S</h4>
                <div className="space-y-2">
                    {topScores.length > 0 ? topScores.map(([key, score]) => (
                        <div key={key} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-400 font-bold">{GAME_LABELS[key as string] || key}</span>
                            <span className="text-white font-mono font-bold">{(score as number).toLocaleString()}</span>
                        </div>
                    )) : (
                        <p className="text-[10px] text-gray-600 italic">Aucun score enregistré...</p>
                    )}
                </div>
            </div>
        </div>
    );
};