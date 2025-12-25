
import React from 'react';
import { User, Globe, Users, ArrowRight, Play, Shield, Zap, Skull, Home, Crown } from 'lucide-react';
import { Difficulty } from '../types';

interface CheckersMenuProps {
    phase: 'MENU' | 'DIFFICULTY';
    onSelectMode: (mode: 'SOLO' | 'LOCAL' | 'ONLINE') => void;
    onSelectDifficulty: (diff: Difficulty) => void;
    onBack: () => void;
    onReturnToMain: () => void;
}

// Logo stylisé spécifique pour les Dames
const CheckersBrandingLogo = () => (
    <div className="flex items-center justify-center gap-4 mb-6 relative">
        <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-40 animate-pulse"></div>
            <Crown size={56} className="text-cyan-400 drop-shadow-[0_0_15px_#22d3ee] transform -rotate-12 relative z-10" strokeWidth={2.5} />
        </div>
        <div className="relative">
            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-40 animate-pulse delay-700"></div>
            <Crown size={56} className="text-pink-500 drop-shadow-[0_0_15px_#ec4899] transform rotate-12 relative z-10" strokeWidth={2.5} />
        </div>
    </div>
);

export const CheckersMenu: React.FC<CheckersMenuProps> = ({ phase, onSelectMode, onSelectDifficulty, onBack, onReturnToMain }) => {
    if (phase === 'MENU') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl gap-4 animate-in fade-in zoom-in duration-500">
                
                {/* Section Titre et Logo */}
                <div className="mb-8 w-full text-center animate-in slide-in-from-top-10 duration-700 px-4">
                    <CheckersBrandingLogo />
                    <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 drop-shadow-[0_0_30px_rgba(45,212,191,0.5)] tracking-tighter w-full uppercase mb-4">
                        NEON<br className="md:hidden"/> DAMES
                    </h1>
                    <div className="inline-block px-6 py-2 rounded-full border border-teal-500/30 bg-teal-900/20 backdrop-blur-sm">
                        <p className="text-teal-200 font-bold tracking-[0.3em] text-xs md:text-sm uppercase">Capturez • Dominez • Couronnez</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                    <button onClick={() => onSelectMode('SOLO')} className="group relative h-48 md:h-64 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 p-8 text-left flex flex-col justify-between shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <User size={32} className="text-cyan-400" />
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase mb-1">Solo</h2>
                            <p className="text-gray-400 text-xs">Affrontez l'intelligence artificielle du système.</p>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">Défier la grille <ArrowRight size={16} /></div>
                    </button>

                    <button onClick={() => onSelectMode('ONLINE')} className="group relative h-48 md:h-64 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 p-8 text-left flex flex-col justify-between shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Globe size={32} className="text-pink-500" />
                        <div>
                            <div className="flex items-center gap-3 mb-1"><h2 className="text-2xl font-black text-white italic uppercase">En Ligne</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                            <p className="text-gray-400 text-xs">Duel stratégique contre un amiral distant.</p>
                        </div>
                        <div className="flex items-center gap-2 text-pink-500 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">Rejoindre le lobby <ArrowRight size={16} /></div>
                    </button>
                </div>
                
                <button onClick={() => onSelectMode('LOCAL')} className="w-full max-w-sm py-4 bg-gray-800/50 rounded-2xl border border-white/5 text-gray-400 hover:text-white hover:bg-gray-700 transition-all font-bold text-xs tracking-widest flex items-center justify-center gap-2 mt-4"><Users size={16} /> DEUX JOUEURS LOCAL</button>
                
                <button onClick={onReturnToMain} className="text-gray-500 hover:text-white text-xs font-black tracking-widest flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg transition-all mt-4 uppercase"><Home size={14}/> Retour Arcade</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-md px-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-black text-white italic mb-10 uppercase tracking-widest">Niveau de Menace</h2>
            <div className="flex flex-col gap-4 w-full max-w-md">
                {[
                    { id: 'EASY', label: 'Novice', icon: Shield, color: 'text-green-400 border-green-500/30 hover:border-green-500' },
                    { id: 'MEDIUM', label: 'Vétéran', icon: Zap, color: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500' },
                    { id: 'HARD', label: 'Maître', icon: Skull, color: 'text-red-500 border-red-500/30 hover:border-red-500' }
                ].map(d => (
                    <button key={d.id} onClick={() => onSelectDifficulty(d.id as Difficulty)} className={`flex items-center justify-between p-6 bg-gray-900/60 border-2 rounded-[24px] transition-all hover:scale-105 active:scale-95 ${d.color} shadow-lg`}>
                        <div className="flex items-center gap-4">
                            <d.icon size={28}/>
                            <span className="text-xl font-black uppercase italic">{d.label}</span>
                        </div>
                        <ArrowRight size={20}/>
                    </button>
                ))}
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold underline uppercase tracking-widest">Retour</button>
        </div>
    );
};
