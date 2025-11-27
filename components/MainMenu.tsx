
import React, { useEffect } from 'react';
import { Play, Grid3X3, Car, CircleDot, Volume2, VolumeX } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    audio: ReturnType<typeof useGameAudio>;
}

// Composant pour le logo stylisé
const ArcadeLogo = () => {
    // Le "A" est remplacé par un joystick d'arcade
    const JoystickA = () => (
        <div className="relative w-[4.5rem] h-[5rem] flex items-center justify-center -mb-2">
            {/* Base du joystick (forme du A) */}
            <div 
                className="w-full h-full bg-gradient-to-t from-neon-blue/50 to-white"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 15% 100%, 50% 25%, 85% 100%, 100% 100%)' }}
            />
            {/* Bâton */}
            <div className="absolute top-[35%] w-1.5 h-1/2 bg-gray-300 rounded-t-full" />
            {/* Boule */}
            <div className="absolute top-[20%] w-6 h-6 rounded-full bg-neon-pink border-2 border-white shadow-[0_0_10px_#ff00ff]" />
        </div>
    );

    return (
        <div className="text-center space-y-0 animate-in fade-in slide-in-from-top-8 duration-700 flex flex-col items-center mb-6">
            {/* NEON: Très lisible, style "Tube Néon Blanc" */}
            <div 
                className="text-8xl font-black italic tracking-widest text-white drop-shadow-[0_0_10px_#00f3ff] relative z-10"
                style={{ textShadow: '0 0 20px rgba(0, 243, 255, 0.8), 0 0 40px rgba(0, 243, 255, 0.4)' }}
            >
                NEON
            </div>
            
            {/* ARCADE: Style Glitch dynamique */}
            <div className="flex items-end justify-center -mt-6 animate-glitch-main opacity-90">
                <JoystickA />
                <span className="glitch text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-purple drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]" data-text="RCADE">RCADE</span>
            </div>
        </div>
    );
};


export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio }) => {
    
    useEffect(() => {
        audio.resumeAudio(); // Déverrouille le contexte audio, crucial pour iOS
    }, [audio]);

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
            
            {/* Mute Button */}
            <div className="absolute top-6 right-6 z-20">
                <button 
                    onClick={audio.toggleMute} 
                    className="p-2 bg-gray-800/50 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                >
                    {audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-8">
                 
                 <ArcadeLogo />

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
