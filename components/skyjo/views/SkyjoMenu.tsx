
import React from 'react';
import { Home, ArrowRight, User, Globe } from 'lucide-react';

interface SkyjoMenuProps {
    onStart: (mode: 'SOLO' | 'ONLINE') => void;
    onBack: () => void;
}

export const SkyjoMenu: React.FC<SkyjoMenuProps> = ({ onStart, onBack }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            {/* Background layers */}
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                     <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.6)] tracking-tighter pr-4">
                        CYBER<br className="md:hidden"/> SKY
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                    <button onClick={() => onStart('SOLO')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><User size={32} className="text-purple-400" /></div>
                            <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-purple-300 transition-colors">SOLO</h2>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Défiez l'ordinateur dans une partie rapide.</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-purple-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                            LANCER UNE PARTIE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>

                    <button onClick={() => onStart('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]"><Globe size={32} className="text-pink-400" /></div>
                            <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-pink-300 transition-colors">EN LIGNE</h2>
                            <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Rejoignez le lobby et affrontez d'autres joueurs.</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-pink-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">
                            REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg">
                        <Home size={14} /> RETOUR AU MENU PRINCIPAL
                    </button>
                </div>
            </div>
        </div>
    );
};
