import React from 'react';
import { Home, Play, Search, Target, Sparkles, Zap, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { SeekLevel } from '../types';

interface NeonSeekMenuProps {
    levels: SeekLevel[];
    onSelectLevel: (level: SeekLevel) => void;
    onBack: () => void;
}

const SeekBrandingLogo = () => (
    <div className="flex items-center justify-center mb-8 relative h-32 w-full overflow-visible">
        <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-xl rotate-12 animate-[spin_12s_linear_infinite] opacity-50"></div>
            <div className="relative z-10 w-20 h-20 bg-gray-950 border-2 border-yellow-400 rounded-full shadow-[0_0_20px_#facc15] flex items-center justify-center">
                <div className="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>
                <Search size={40} className="text-white drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            </div>
            <div className="absolute -top-4 -right-4 bg-yellow-600 p-2 rounded-lg border border-yellow-400 shadow-lg transform -rotate-12 animate-bounce">
                <Target size={16} className="text-white" />
            </div>
        </div>
    </div>
);

export const NeonSeekMenu: React.FC<NeonSeekMenuProps> = ({ levels, onSelectLevel, onBack }) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(250,204,21,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                <div className="mb-6 md:mb-10 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                    <SeekBrandingLogo />
                    <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-amber-300 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] tracking-tighter w-full uppercase mb-4">
                        NEON<br className="md:hidden"/> SEEK
                    </h1>
                    <div className="inline-block px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-900/20 backdrop-blur-sm">
                        <p className="text-yellow-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase italic">Analysez • Localisez • Récupérez</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl flex-shrink-0 mb-12">
                    {levels.map((lvl, i) => (
                        <button 
                            key={lvl.id} 
                            onClick={() => onSelectLevel(lvl)}
                            className="group relative h-52 md:h-72 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(250,204,21,0.2)] text-left p-6 flex flex-col justify-between"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <img src={lvl.image} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity grayscale group-hover:grayscale-0" alt={lvl.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                                        {lvl.id.includes('training') ? <ShieldCheck size={20}/> : <Zap size={20}/>}
                                    </div>
                                    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded border ${
                                        lvl.difficulty === 'FACILE' ? 'text-green-400 border-green-500/30 bg-green-900/20' :
                                        lvl.difficulty === 'MOYEN' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20' :
                                        'text-red-500 border-red-500/30 bg-red-900/20'
                                    }`}>
                                        {lvl.difficulty}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-white italic group-hover:text-yellow-300 transition-colors uppercase truncate">{lvl.title}</h2>
                                <p className="text-gray-400 text-[10px] leading-tight mt-1 line-clamp-2">{lvl.description}</p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between text-yellow-400 font-bold text-xs tracking-widest group-hover:text-white transition-colors">
                                <span className="flex items-center gap-1.5 uppercase italic">
                                    {lvl.objects.length} OBJETS • +{lvl.reward} <Sparkles size={10} />
                                </span>
                                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg uppercase tracking-widest italic">
                        <Home size={14} /> RETOUR AU MENU PRINCIPAL
                    </button>
                </div>
            </div>
        </div>
    );
};