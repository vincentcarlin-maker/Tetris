
import React from 'react';
import { Cpu, Globe, ArrowRight, Users, Home, Sparkles } from 'lucide-react';
import { Difficulty, GamePhase } from '../types';

interface Connect4MenuProps {
    phase: GamePhase;
    setPhase: (p: GamePhase) => void;
    onStart: (mode: 'PVE' | 'PVP' | 'ONLINE', diff?: Difficulty) => void;
    onBack: () => void;
}

// Logo de marque spécifique pour Neon Connect
const Connect4BrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full overflow-visible">
        <div className="relative">
            {/* Grille de fond stylisée */}
            <div className="absolute inset-0 bg-indigo-900/20 blur-2xl rounded-full animate-pulse"></div>
            
            <div className="relative flex gap-1.5 p-2 bg-gray-900 border-2 border-indigo-500/50 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transform -rotate-2">
                {/* Colonne 1 (Mixte) */}
                <div className="flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-white/5 shadow-inner"></div>
                    <div className="w-6 h-6 rounded-full bg-neon-pink shadow-[0_0_10px_#ff00ff] border border-white/20"></div>
                </div>
                
                {/* Colonne 2 (La Victoire) */}
                <div className="flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-neon-blue shadow-[0_0_15px_#00f3ff] border border-white/30 animate-bounce"></div>
                    <div className="w-6 h-6 rounded-full bg-neon-blue shadow-[0_0_15px_#00f3ff] border border-white/30"></div>
                </div>

                {/* Colonne 3 (Le blocage) */}
                <div className="flex flex-col gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-neon-pink shadow-[0_0_10px_#ff00ff] border border-white/20"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-white/5 shadow-inner"></div>
                </div>

                {/* Animation de jeton qui tombe */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-neon-pink shadow-[0_0_20px_#ff00ff] border-2 border-white/40 animate-[drop_2s_infinite_ease-in]"></div>
            </div>

            {/* Particules étincelantes */}
            <Sparkles size={16} className="absolute -top-4 -right-4 text-yellow-400 animate-pulse" />
            <div className="absolute -bottom-2 -left-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
        </div>

        <style>{`
            @keyframes drop {
                0% { transform: translate(-50%, 0); opacity: 0; }
                20% { opacity: 1; }
                80% { transform: translate(-50%, 60px); opacity: 1; }
                100% { transform: translate(-50%, 65px); opacity: 0; }
            }
        `}</style>
    </div>
);

export const Connect4Menu: React.FC<Connect4MenuProps> = ({ phase, setPhase, onStart, onBack }) => {

    if (phase === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(236,72,153,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <Connect4BrandingLogo />
                        <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(236,72,153,0.6)] tracking-tighter pr-4 uppercase mb-4">
                            NEON<br className="md:hidden"/> CONNECT
                        </h1>
                        <div className="inline-block px-6 py-2 rounded-full border border-pink-500/30 bg-pink-900/20 backdrop-blur-sm">
                            <p className="text-pink-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Alignez • Bloquez • Gagnez</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={() => setPhase('DIFFICULTY')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]"><Cpu size={32} className="text-pink-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-pink-300 transition-colors uppercase">Solo</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Affrontez l'IA dans un duel de stratégie.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-pink-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">LANCER LA SIMULATION <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>

                        <button onClick={() => onStart('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><Globe size={32} className="text-purple-400" /></div>
                                <div className="flex items-center gap-3 mb-2"><h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-purple-300 transition-colors uppercase">En Ligne</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Rejoignez le lobby et affrontez d'autres joueurs.</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                        </button>
                    </div>
                    
                    <div className="w-full max-w-sm md:max-w-3xl mt-6 flex-shrink-0">
                         <button onClick={() => onStart('PVP')} className="w-full p-4 rounded-2xl bg-gray-900/30 border border-white/5 hover:bg-gray-800/50 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white font-bold text-xs tracking-widest uppercase italic">
                            <Users size={16} /> 2 JOUEURS LOCAL (MÊME ÉCRAN)
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
                <h2 className="text-3xl font-black text-white mb-8 italic uppercase tracking-widest">Difficulté IA</h2>
                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                    <button onClick={() => onStart('PVE', 'EASY')} className="px-6 py-3 border border-green-500 text-green-400 font-bold rounded-xl hover:bg-green-500 hover:text-black transition-all uppercase tracking-widest italic">Facile</button>
                    <button onClick={() => onStart('PVE', 'MEDIUM')} className="px-6 py-3 border border-yellow-500 text-yellow-400 font-bold rounded-xl hover:bg-yellow-500 hover:text-black transition-all uppercase tracking-widest italic">Moyen</button>
                    <button onClick={() => onStart('PVE', 'HARD')} className="px-6 py-3 border border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest italic">Difficile</button>
                </div>
                <button onClick={() => setPhase('MENU')} className="mt-8 text-gray-500 text-sm hover:text-white font-bold uppercase tracking-widest italic underline">Retour</button>
            </div>
        );
    }
    
    return null;
};
