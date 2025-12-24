
import React from 'react';
import { User, Globe, Users, ArrowRight, Play, Shield, Zap, Skull, Home } from 'lucide-react';
import { Difficulty } from '../types';

interface CheckersMenuProps {
    phase: 'MENU' | 'DIFFICULTY';
    onSelectMode: (mode: 'SOLO' | 'LOCAL' | 'ONLINE') => void;
    onSelectDifficulty: (diff: Difficulty) => void;
    onBack: () => void;
    onReturnToMain: () => void;
}

export const CheckersMenu: React.FC<CheckersMenuProps> = ({ phase, onSelectMode, onSelectDifficulty, onBack, onReturnToMain }) => {
    if (phase === 'MENU') {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl gap-8 animate-in fade-in zoom-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                    <button onClick={() => onSelectMode('SOLO')} className="group relative h-48 md:h-64 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 p-8 text-left flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <User size={32} className="text-cyan-400" />
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase mb-1">Solo</h2>
                            <p className="text-gray-400 text-xs">Affrontez l'intelligence artificielle.</p>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">Défier le système <ArrowRight size={16} /></div>
                    </button>

                    <button onClick={() => onSelectMode('ONLINE')} className="group relative h-48 md:h-64 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-pink-500/50 p-8 text-left flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Globe size={32} className="text-pink-500" />
                        <div>
                            <div className="flex items-center gap-3 mb-1"><h2 className="text-2xl font-black text-white italic uppercase">En Ligne</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                            <p className="text-gray-400 text-xs">Jouez contre un autre humain.</p>
                        </div>
                        <div className="flex items-center gap-2 text-pink-500 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">Rejoindre la grille <ArrowRight size={16} /></div>
                    </button>
                </div>
                <button onClick={() => onSelectMode('LOCAL')} className="w-full max-w-sm py-4 bg-gray-800/50 rounded-2xl border border-white/5 text-gray-400 hover:text-white hover:bg-gray-700 transition-all font-bold text-xs tracking-widest flex items-center justify-center gap-2"><Users size={16} /> DEUX JOUEURS LOCAL</button>
                <button onClick={onReturnToMain} className="text-gray-500 hover:text-white text-xs font-black tracking-widest flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg transition-all"><Home size={14}/> RETOUR ARCADE</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-black text-white italic mb-10 uppercase tracking-widest">Menace IA</h2>
            <div className="flex flex-col gap-4 w-full">
                {[
                    { id: 'EASY', label: 'Novice', icon: Shield, color: 'text-green-400 border-green-500/30 hover:border-green-500' },
                    { id: 'MEDIUM', label: 'Vétéran', icon: Zap, color: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500' },
                    { id: 'HARD', label: 'Maître', icon: Skull, color: 'text-red-500 border-red-500/30 hover:border-red-500' }
                ].map(d => (
                    <button key={d.id} onClick={() => onSelectDifficulty(d.id as Difficulty)} className={`flex items-center justify-between p-6 bg-gray-900/60 border-2 rounded-2xl transition-all hover:scale-105 active:scale-95 ${d.color}`}>
                        <div className="flex items-center gap-4">
                            <d.icon size={28}/>
                            <span className="text-xl font-black uppercase italic">{d.label}</span>
                        </div>
                        <ArrowRight size={20}/>
                    </button>
                ))}
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 hover:text-white text-xs font-bold underline uppercase">Retour</button>
        </div>
    );
};
