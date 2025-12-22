
import React from 'react';

export const ArcadeLogo: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-4 animate-in fade-in slide-in-from-top-8 duration-700 mb-2 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-gradient-to-br from-neon-blue/60 via-neon-purple/40 to-neon-pink/60 blur-[100px] rounded-full pointer-events-none -z-10 mix-blend-screen opacity-100 animate-glow-accent" />
            <div className="relative mb-[-15px] z-10 hover:scale-105 transition-transform duration-300 group">
                <div className="w-36 h-12 bg-gray-950 rounded-xl border-2 accent-border shadow-[0_0_40px_rgba(var(--neon-accent-rgb),0.5),inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-xl"></div>
                    <div className="relative flex items-center justify-center w-8 h-8 group-hover:-rotate-12 transition-transform duration-300 z-20">
                         <div className="absolute bottom-1/2 w-2 h-6 bg-gray-600 rounded-full origin-bottom transform -rotate-12 border border-black"></div>
                         <div className="absolute bottom-[40%] w-6 h-6 bg-gradient-to-br from-neon-pink via-purple-600 to-purple-900 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] border border-white/20 transform -translate-x-1 -translate-y-1 z-30">
                            <div className="absolute top-1 left-1 w-2 h-1 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
                         </div>
                         <div className="w-8 h-8 bg-black/50 rounded-full border border-gray-700 shadow-inner z-10"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 transform rotate-6">
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] border border-white/30 animate-pulse"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] border border-white/30"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] border border-white/30"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] border border-white/30"></div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center relative z-20 mt-2">
                 <div className="font-script text-6xl md:text-8xl text-white transform -rotate-6 z-10 drop-shadow-[0_0_20px_var(--neon-blue,#00f3ff)]" style={{ textShadow: '0 0 10px var(--neon-blue, #00f3ff), 0 0 25px var(--neon-blue, #00f3ff)' }}>Neon</div>
                <div className="font-script text-5xl md:text-7xl text-neon-pink transform -rotate-3 -mt-4 ml-10" style={{ textShadow: '0 0 10px #ff00ff, 0 0 25px #ff00ff' }}>Arcade</div>
            </div>
        </div>
    );
};
