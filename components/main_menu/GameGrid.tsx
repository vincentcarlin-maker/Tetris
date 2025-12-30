
import React, { useState, useMemo } from 'react';
import { GAMES_CONFIG, CATEGORIES } from '../../constants/gamesConfig';
import { Globe, Construction, Lock, Zap } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface GameGridProps {
    onSelectGame: (game: string) => void;
    disabledGames: string[];
    username: string;
    adminModeActive: boolean;
    language: string;
}

export const GameGrid: React.FC<GameGridProps> = ({ onSelectGame, disabledGames, username, adminModeActive, language }) => {
    const { isAuthenticated, guestPlayedGames, featureFlags } = useGlobal();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeGlow, setActiveGlow] = useState<string | null>(null);

    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });

    const categoriesLocalized = useMemo(() => {
        return CATEGORIES.map(c => {
            if (c.id === 'ALL') return { ...c, label: language === 'fr' ? 'TOUT' : 'ALL' };
            if (c.id === 'ONLINE') return { ...c, label: language === 'fr' ? 'EN LIGNE' : 'ONLINE' };
            if (c.id === 'PUZZLE') return { ...c, label: language === 'fr' ? 'RÉFLEXION' : 'PUZZLE' };
            if (c.id === 'STRATEGY') return { ...c, label: language === 'fr' ? 'STRATÉGIE' : 'STRATEGY' };
            return c;
        });
    }, [language]);

    const isAdmin = username === 'Vincent' || adminModeActive;

    return (
        <div className="w-full">
            <div className="flex gap-2 w-full overflow-x-auto pb-2 no-scrollbar px-1 mb-2">
                {categoriesLocalized.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all border ${activeCategory === cat.id ? 'bg-neon-accent text-black border-neon-accent shadow-[0_0_10px_rgba(var(--neon-accent-rgb),0.5)]' : 'bg-gray-900 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}>
                        <cat.icon size={14} /> {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {GAMES_CONFIG
                    .filter(g => { 
                        if (activeCategory === 'ONLINE') if(!g.badges.online) return false;
                        if (activeCategory !== 'ALL' && activeCategory !== 'ONLINE' && g.category !== activeCategory) return false;
                        if (!featureFlags.beta_games && g.beta && !isAdmin) return false;
                        return true; 
                    })
                    .sort((a, b) => {
                        const aDisabled = disabledGames.includes(a.id);
                        const bDisabled = disabledGames.includes(b.id);
                        if (aDisabled === bDisabled) return 0;
                        return aDisabled ? 1 : -1;
                    })
                    .map((game) => {
                        const isGloballyDisabled = disabledGames.includes(game.id);
                        const isPlayable = !isGloballyDisabled || isAdmin;
                        const hasTried = !isAuthenticated && guestPlayedGames.includes(game.id);
                        const canTry = !isAuthenticated && !hasTried;

                        if (['airhockey', 'slither', 'snake', 'tetris', 'battleship', 'connect4', 'skyjo', 'checkers', 'pacman', 'invaders', 'breaker', 'lumen', 'sudoku', 'arenaclash', 'stack', 'runner'].includes(game.id)) {
                            const ringColor = game.id === 'airhockey' ? 'focus:ring-sky-400' : 
                                              game.id === 'slither' ? 'focus:ring-indigo-400' :
                                              game.id === 'snake' ? 'focus:ring-green-500' :
                                              game.id === 'tetris' ? 'focus:ring-cyan-400' :
                                              game.id === 'battleship' ? 'focus:ring-blue-500' :
                                              game.id === 'connect4' ? 'focus:ring-pink-500' :
                                              game.id === 'skyjo' ? 'focus:ring-purple-400' :
                                              game.id === 'pacman' ? 'focus:ring-yellow-400' :
                                              game.id === 'invaders' ? 'focus:ring-rose-500' :
                                              game.id === 'breaker' ? 'focus:ring-fuchsia-500' :
                                              game.id === 'lumen' ? 'focus:ring-cyan-400' :
                                              game.id === 'sudoku' ? 'focus:ring-sky-400' :
                                              game.id === 'arenaclash' ? 'focus:ring-red-500' :
                                              game.id === 'stack' ? 'focus:ring-indigo-400' :
                                              game.id === 'runner' ? 'focus:ring-orange-400' :
                                              'focus:ring-teal-400';
                            return (
                                <button
                                    key={game.id}
                                    onClick={() => isPlayable && onSelectGame(game.id)}
                                    disabled={!isPlayable}
                                    className={`group relative aspect-square rounded-xl overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 border ${ringColor} ${!isPlayable ? 'cursor-not-allowed border-red-900/50' : `hover:scale-[1.02] active:scale-95 ${game.border} ${game.hoverBorder} ${game.shadow}`}`}
                                    {...(isPlayable ? bindGlow(game.glow) : {})}
                                >
                                    <game.icon size="100%" className={`w-full h-full transition-all duration-300 ${isPlayable ? 'group-hover:brightness-110' : 'grayscale opacity-60'}`} />
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-2 z-10">
                                        <h3 className="font-black italic text-sm tracking-wider text-white drop-shadow-lg uppercase">{game.name}</h3>
                                    </div>
                                    
                                    <div className="absolute top-0 right-0 w-full flex justify-end gap-1 p-3 z-20">
                                        {canTry && isPlayable && (<div className="px-1.5 py-0.5 rounded bg-green-600/90 text-white border border-green-500/50 text-[8px] font-black tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse flex items-center gap-1 uppercase"><Zap size={8} fill="white"/> Essai Libre</div>)}
                                        {game.badges.new && isPlayable && !canTry && <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse uppercase">{language === 'fr' ? 'NOUVEAU' : 'NEW'}</div>}
                                        {game.badges.online && isPlayable && <div className="p-1 rounded bg-black/40 text-green-400 border border-green-500/30" title={language === 'fr' ? 'En Ligne' : 'Online'}><Globe size={10} /></div>}
                                    </div>
                                    
                                    {!isPlayable && (<div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-red-500/30 rounded-xl"><Construction className="text-red-500 mb-1 animate-pulse" size={24} /><span className="text-[10px] font-black text-red-500 tracking-widest bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20">MAINTENANCE</span></div>)}
                                    {hasTried && isPlayable && (<div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[1px] flex flex-col items-center justify-center border-2 border-white/10 rounded-xl"><Lock className="text-gray-400 mb-1" size={24} /><span className="text-[9px] font-black text-white/50 tracking-widest uppercase px-2 py-0.5 rounded">Rejoindre</span></div>)}
                                </button>
                            );
                        }

                        return (
                            <button key={game.id} onClick={() => onSelectGame(game.id)} disabled={!isPlayable} {...(isPlayable ? bindGlow(game.glow) : {})} className={`group relative flex flex-col items-center justify-between p-3 aspect-square bg-black/60 border rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md ${!isPlayable ? 'border-red-900/50 cursor-not-allowed' : `${game.border} ${game.hoverBorder} ${game.shadow} hover:scale-[1.02] active:scale-95`}`}>
                                
                                {game.beta && (<div className="absolute top-2 left-2 bg-purple-600/90 text-white text-[7px] px-1.5 py-0.5 rounded border border-purple-400 font-black tracking-widest z-30 shadow-[0_0_10px_purple]">BETA</div>)}
                                {isAdmin && isGloballyDisabled && (<div className="absolute top-2 right-2 bg-red-600/90 text-white text-[7px] px-1.5 py-0.5 rounded border border-red-400 font-black tracking-widest z-30 shadow-[0_0_10px_red]">DEPRECATED</div>)}
                                {!isPlayable && (<div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-red-500/30 rounded-xl"><Construction className="text-red-500 mb-1 animate-pulse" size={24} /><span className="text-[10px] font-black text-red-500 tracking-widest bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20">MAINTENANCE</span></div>)}
                                {hasTried && isPlayable && (<div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[1px] flex flex-col items-center justify-center border-2 border-white/10 rounded-xl"><Lock className="text-gray-400 mb-1" size={24} /><span className="text-[9px] font-black text-white/50 tracking-widest uppercase px-2 py-0.5 rounded">Rejoindre</span></div>)}

                                {isPlayable && <div className={`absolute inset-0 ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>}
                                
                                <div className="w-full flex justify-end gap-1 relative z-10">
                                    {canTry && isPlayable && (<div className="px-1.5 py-0.5 rounded bg-green-600/90 text-white border border-green-500/50 text-[8px] font-black tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse flex items-center gap-1 uppercase"><Zap size={8} fill="white"/> Essai Libre</div>)}
                                    {game.badges.new && isPlayable && !canTry && <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse uppercase">{language === 'fr' ? 'NOUVEAU' : 'NEW'}</div>}
                                    {game.badges.online && isPlayable && <div className="p-1 rounded bg-black/40 text-green-400 border border-green-500/30" title={language === 'fr' ? 'En Ligne' : 'Online'}><Globe size={10} /></div>}
                                </div>
                                
                                <div className={`p-2 rounded-lg bg-gray-900/50 ${isPlayable ? game.color : 'text-gray-500'} ${isPlayable && 'group-hover:scale-110'} transition-transform relative z-10 shadow-lg border border-white/5`}><game.icon size={32} /></div>
                                <div className="text-center relative z-10 w-full"><h3 className={`font-black italic text-sm tracking-wider text-white ${isPlayable && `group-hover:${game.color}`} transition-colors uppercase`}>{game.name}</h3></div>
                            </button>
                        );
                })}
            </div>
            
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-20 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`} style={{ background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none', opacity: activeGlow ? 0.6 : 0 }} />
        </div>
    );
};
