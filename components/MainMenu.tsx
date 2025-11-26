
import React from 'react';
import { Play, Grid3X3, Gamepad2, Hammer, Zap, Car, CircleDot } from 'lucide-react';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 relative overflow-hidden bg-[#0a0a12]">
             {/* Background effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black z-0 pointer-events-none"></div>
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-8">
                 <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-8 duration-700">
                     <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                         NEON<br/>ARCADE
                     </h1>
                     <p className="text-neon-blue/60 tracking-[0.3em] text-xs font-bold flex items-center justify-center gap-2">
                        <Zap size={12} className="fill-current" />
                        SÉLECTION DU JEU
                        <Zap size={12} className="fill-current" />
                     </p>
                 </div>

                 <div className="w-full grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                     {/* Tetris Button */}
                     <button
                        onClick={() => onSelectGame('tetris')}
                        className="group relative w-full h-28 bg-gray-900/60 border border-neon-blue/30 hover:border-neon-blue rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-gray-800 rounded-lg text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-colors shadow-lg">
                                    <Grid3X3 size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-blue transition-colors italic">TETRIS NÉON</h3>
                                    <p className="text-xs text-gray-400 group-hover:text-gray-200 font-mono">PUZZLE CLASSIQUE</p>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all">
                                <Play size={20} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Neon Rush Button */}
                     <button 
                        onClick={() => onSelectGame('rush')}
                        className="group relative w-full h-28 bg-gray-900/60 border border-purple-500/30 hover:border-purple-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-4 bg-gray-800 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-lg">
                                    <Car size={32} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-purple-400 transition-colors italic">NEON RUSH</h3>
                                    <p className="text-xs text-gray-400 group-hover:text-gray-200 font-mono">EMBOUTEILLAGE LOGIQUE</p>
                                 </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                <Play size={20} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Connect 4 Button */}
                     <button 
                        onClick={() => onSelectGame('connect4')}
                        className="group relative w-full h-28 bg-gray-900/60 border border-neon-pink/30 hover:border-neon-pink rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-4 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg">
                                    <CircleDot size={32} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic">NEON CONNECT</h3>
                                    <p className="text-xs text-gray-400 group-hover:text-gray-200 font-mono">PUISSANCE 4 • SOLO/DUO</p>
                                 </div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all">
                                <Play size={20} className="ml-1" />
                            </div>
                        </div>
                     </button>
                 </div>
                 
                 <div className="mt-8 text-white/10 text-[10px] tracking-widest">
                    v1.2.0 • JOUEUR 1 PRÊT
                 </div>
             </div>
        </div>
    );
}
