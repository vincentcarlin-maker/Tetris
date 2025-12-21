
import React, { useState, useMemo } from 'react';
import { GAMES_CONFIG, CATEGORIES } from '../../constants/gamesConfig';
import { Globe, Construction } from 'lucide-react';

interface GameGridProps {
    onSelectGame: (game: string) => void;
    disabledGames: string[];
    username: string;
    adminModeActive: boolean;
    language: string;
}

export const GameGrid: React.FC<GameGridProps> = ({ onSelectGame, disabledGames, username, adminModeActive, language }) => {
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
                    .filter(g => { if (activeCategory === 'ALL') return true; if (activeCategory === 'ONLINE') return g.badges.online; return g.category === activeCategory; })
                    .sort((a, b) => {
                        const aDisabled = disabledGames.includes(a.id);
                        const bDisabled = disabledGames.includes(b.id);
                        if (aDisabled === bDisabled) return 0;
                        return aDisabled ? 1 : -1;
                    })
                    .map((game) => {
                        const isGloballyDisabled = disabledGames.includes(game.id);
                        const isAdmin = username === 'Vincent' || adminModeActive;
                        const isPlayable = !isGloballyDisabled || isAdmin;

                        return (
                            <button key={game.id} onClick={() => onSelectGame(game.id)} disabled={!isPlayable} {...(isPlayable ? bindGlow(game.glow) : {})} className={`group relative flex flex-col items-center justify-between p-3 h-32 bg-black/60 border rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md ${!isPlayable ? 'border-red-900/50 cursor-not-allowed' : `${game.border} ${game.hoverBorder} ${game.shadow} hover:scale-[1.02] active:scale-95`}`}>
                                
                                {/* Admin Badge */}
                                {isAdmin && isGloballyDisabled && (
                                     <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[8px] px-1.5 py-0.5 rounded border border-red-400 font-black tracking-widest z-30 shadow-[0_0_10px_red]">
                                        MAINTENANCE
                                     </div>
                                )}

                                {/* Player Maintenance Overlay */}
                                {!isPlayable && (
                                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center border-2 border-red-500/30 rounded-xl">
                                         <Construction className="text-red-500 mb-1 animate-pulse" size={24} />
                                         <span className="text-[10px] font-black text-red-500 tracking-widest bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20">MAINTENANCE</span>
                                    </div>
                                )}

                                {isPlayable && <div className={`absolute inset-0 ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>}
                                <div className="w-full flex justify-end gap-1 relative z-10">
                                    {game.badges.new && isPlayable && <div className="px-1.5 py-0.5 rounded bg-red-600/90 text-white border border-red-500/50 text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse uppercase">{language === 'fr' ? 'NOUVEAU' : 'NEW'}</div>}
                                    {game.badges.online && <div className="p-1 rounded bg-black/40 text-green-400 border border-green-500/30" title={language === 'fr' ? 'En Ligne' : 'Online'}><Globe size={10} /></div>}
                                </div>
                                <div className={`p-2 rounded-lg bg-gray-900/50 ${isPlayable ? game.color : 'text-gray-500'} ${isPlayable && 'group-hover:scale-110'} transition-transform relative z-10 shadow-lg border border-white/5`}><game.icon size={32} /></div>
                                <div className="text-center relative z-10 w-full"><h3 className={`font-black italic text-sm tracking-wider text-white ${isPlayable && `group-hover:${game.color}`} transition-colors uppercase`}>{game.name}</h3></div>
                            </button>
                        );
                })}
            </div>
            
            {/* Background Glow Effect - Handled by parent or globally, but can be injected here if needed */}
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-20 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`} style={{ background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none', opacity: activeGlow ? 0.6 : 0 }} />
        </div>
    );
};
