import React from 'react';
import { Home, Brain, Globe, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Difficulty, GameMode, GamePhase } from '../types';
import { DIFFICULTY_CONFIG } from '../constants';

interface MemoryMenuProps {
    phase: GamePhase;
    setPhase: (p: GamePhase) => void;
    onStartSolo: (diff: Difficulty) => void;
    onStartOnline: () => void;
    onBack: () => void;
}

// Logo de marque spécifique pour Neon Memory
const MemoryBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full overflow-visible">
        <div className="relative flex items-center justify-center gap-6">
            {/* Carte Face Cachée (Gauche) */}
            <div className="w-16 h-24 bg-gray-900 border-2 border-purple-500/50 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] flex flex-col items-center justify-center transform -rotate-12 transition-transform group-hover:-rotate-15">
                <div className="flex flex-col items-center gap-0.5 opacity-40">
                    <span className="font-script text-cyan-400 text-[10px] leading-none">Neon</span>
                    <span className="font-script text-neon-pink text-[10px] leading-none">Arcade</span>
                </div>
            </div>
            
            {/* Carte Face Révélée (Droite) */}
            <div className="w-16 h-24 bg-gray-950 border-2 border-pink-500 rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center justify-center relative z-10 transform rotate-12 transition-all hover:scale-110 hover:rotate-6">
                <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full animate-pulse"></div>
                <Star size={32} className="text-pink-400 drop-shadow-[0_0_10px_#ec4899] animate-bounce" fill="currentColor" />
                <Sparkles size={12} className="absolute top-2 right-2 text-white animate-ping" />
            </div>
        </div>
        
        {/* Lueur de fond diffuse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none -z-10"></div>
    </div>
);

export const MemoryMenu: React.FC<MemoryMenuProps> = ({ phase, setPhase, onStartSolo, onStartOnline, onBack }) => {

    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4 group">
                        <MemoryBrandingLogo />
                        <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] tracking-tighter w-full uppercase mb-4">
                            NEON<br className="md:hidden"/> MEMORY
                        </h1>
                        <div className="inline-block px-6 py-2 rounded-full border border-purple-500/30 bg-purple-900/20 backdrop-blur-sm">
                            <p className="text-purple-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Observez • Retenez • Associez</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={() => setPhase('DIFFICULTY')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><Brain size={32} className="text-purple-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-purple-300 transition-colors uppercase">Solo</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Trouvez les paires en un minimum de coups.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">Lancer la partie <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>

                        <button onClick={onStartOnline} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] text-left p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]"><Globe size={32} className="text-pink-400" /></div>
                                <div className="flex items-center gap-3 mb-2"><h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-pink-300 transition-colors uppercase">En Ligne</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Défiez d'autres joueurs en duel de mémoire.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-pink-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">Rejoindre le lobby <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>
                    </div>

                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                        <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest italic"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'DIFFICULTY') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <h2 className="text-3xl font-black text-white mb-8 italic uppercase tracking-widest">Difficulté</h2>
                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                        <button 
                            key={d} 
                            onClick={() => onStartSolo(d)}
                            className={`px-6 py-3 border font-bold rounded-xl hover:text-black transition-all uppercase tracking-widest active:scale-95 ${
                                d === 'EASY' ? 'border-green-500 text-green-400 hover:bg-green-500' :
                                d === 'MEDIUM' ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500' :
                                'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                        >
                            {DIFFICULTY_CONFIG[d].name}
                        </button>
                    ))}
                </div>
                <button onClick={() => setPhase('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white font-bold uppercase tracking-widest italic border-b border-transparent hover:border-gray-500 transition-all">Retour</button>
            </div>
        );
    }

    return null;
};
