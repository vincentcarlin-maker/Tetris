
import React from 'react';
import { Home, ArrowRight, User, Globe, BrainCircuit, Sparkles, Search, Lock } from 'lucide-react';
import { COLORS } from '../constants';

interface MastermindMenuProps {
    onStart: (mode: 'SOLO' | 'ONLINE') => void;
    onBack: () => void;
}

// Logo de marque spécifique pour Neon Mind (Mastermind)
const MastermindBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full overflow-visible">
        <div className="relative flex flex-col items-center justify-center">
            {/* Lueur de fond diffuse */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none -z-10 animate-pulse"></div>

            {/* Plateau de décodage stylisé */}
            <div className="relative bg-gray-950 border-2 border-indigo-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] flex gap-3 items-center group">
                {/* Slots de couleur */}
                <div className="w-8 h-8 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444] border border-white/20 animate-pulse"></div>
                <div className="w-8 h-8 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e] border border-white/20 animate-pulse [animation-delay:200ms]"></div>
                <div className="w-8 h-8 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] border border-white/20 animate-pulse [animation-delay:400ms]"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_#facc15] border border-white/20 animate-pulse [animation-delay:600ms]"></div>

                {/* Zone de feedback (petits points) */}
                <div className="ml-2 grid grid-cols-2 gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_5px_red] animate-bounce"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white] animate-bounce [animation-delay:150ms]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_5px_white] animate-bounce [animation-delay:300ms]"></div>
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-700 bg-black/40"></div>
                </div>

                {/* Effet de scanline horizontal */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                
                {/* Icône de recherche flottante */}
                <div className="absolute -top-4 -right-4 bg-indigo-600 p-2 rounded-lg border border-indigo-400 shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                    <Search size={16} className="text-white" />
                </div>
            </div>

            {/* Décoration circuit */}
            <div className="absolute -bottom-6 flex gap-8 opacity-30">
                <div className="w-12 h-0.5 bg-indigo-500"></div>
                <div className="w-12 h-0.5 bg-indigo-500"></div>
            </div>
        </div>

        <style>{`
            @keyframes scan {
                0% { top: 10%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 90%; opacity: 0; }
            }
        `}</style>
    </div>
);

export const MastermindMenu: React.FC<MastermindMenuProps> = ({ onStart, onBack }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            {/* Background layers */}
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                
                {/* Title and Logo */}
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                    <MastermindBrandingLogo />
                    <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] tracking-tighter w-full uppercase mb-4">
                        NEON<br className="md:hidden"/> MIND
                    </h1>
                    <div className="inline-block px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-900/20 backdrop-blur-sm">
                        <p className="text-cyan-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Logique • Déduction • Hack</p>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                    
                    {/* SOLO */}
                    <button onClick={() => onStart('SOLO')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                <User size={32} className="text-cyan-400" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors uppercase">Solo</h2>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                Testez votre logique en solo. Trouvez le code secret en un minimum d'essais.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">
                            DÉFIER L'IA <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>

                    {/* ONLINE */}
                    <button onClick={() => onStart('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left p-6 md:p-8 flex flex-col justify-between shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                <Globe size={32} className="text-purple-400" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-purple-300 transition-colors uppercase">EN LIGNE</h2>
                                <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                Un joueur crée le code, l'autre le devine. Rôles asymétriques et stratégie.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">
                            REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest italic">
                        <Home size={14} /> RETOUR AU MENU PRINCIPAL
                    </button>
                </div>
            </div>
        </div>
    );
};
