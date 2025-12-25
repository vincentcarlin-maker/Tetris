import React from 'react';
import { Home, Layers, Play, User, Globe, ArrowRight, Sparkles } from 'lucide-react';

interface UnoMenuProps {
    onInitGame: (mode: 'SOLO' | 'ONLINE') => void;
    onBack: () => void;
}

// Logo de marque spécifique pour Neon Uno
const UnoBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full">
        <div className="flex items-center justify-center relative">
            {/* Carte Rouge (Gauche) */}
            <div className="w-14 h-20 bg-gray-900 border-2 border-red-500 rounded-lg absolute -translate-x-12 -rotate-12 shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.1)_25%)] bg-[length:4px_4px]"></div>
                <span className="text-red-500 font-black text-2xl italic">7</span>
            </div>
            
            {/* Carte Bleue (Droite) */}
            <div className="w-14 h-20 bg-gray-900 border-2 border-cyan-500 rounded-lg absolute translate-x-12 rotate-12 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center overflow-hidden animate-pulse delay-300">
                <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(34,211,238,0.1)_25%)] bg-[length:4px_4px]"></div>
                <span className="text-cyan-400 font-black text-2xl italic">2</span>
            </div>

            {/* Carte Centrale (Joker / Logo) */}
            <div className="w-16 h-24 bg-gray-900 border-2 border-yellow-400 rounded-xl relative z-10 shadow-[0_0_25px_rgba(250,204,21,0.5)] transform hover:scale-110 transition-transform duration-500 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#ef4444,#eab308,#22c55e,#3b82f6,#ef4444)] opacity-20 z-0 animate-[spin_4s_linear_infinite]"></div>
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className="font-black italic text-yellow-400 text-xl leading-none drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">NEON</span>
                    <span className="font-black italic text-white text-2xl leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">UNO</span>
                </div>
                <Sparkles size={12} className="absolute top-2 right-2 text-white animate-pulse" />
            </div>
        </div>
        
        {/* Lueur de fond diffuse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none -z-10"></div>
    </div>
);

export const UnoMenu: React.FC<UnoMenuProps> = ({ onInitGame, onBack }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(234,179,8,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
            <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] animate-pulse delay-1000 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                    <UnoBrandingLogo />
                    <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] tracking-tighter w-full uppercase mb-4">
                        NEON<br className="md:hidden"/> UNO
                    </h1>
                    <div className="inline-block px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-900/20 backdrop-blur-sm">
                        <p className="text-yellow-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Couleurs • Chiffres • Stratégie</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                    
                    <button onClick={() => onInitGame('SOLO')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                <User size={32} className="text-yellow-400" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-yellow-300 transition-colors uppercase">Solo</h2>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                Affrontez l'IA dans une partie rapide. Soyez le premier à vider votre main.
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center gap-2 text-yellow-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">
                            LANCER LA PARTIE <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>

                    <button onClick={() => onInitGame('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <Globe size={32} className="text-red-400" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-red-300 transition-colors uppercase">EN LIGNE</h2>
                                <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span>
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
                                Rejoignez le lobby et défiez d'autres joueurs. Bluff et stratégie requis.
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center gap-2 text-red-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4 uppercase italic">
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
