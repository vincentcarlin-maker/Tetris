import React, { useState } from 'react';
import { X, Save, Gamepad2, Zap, Coins, Info, AlertTriangle } from 'lucide-react';

interface GameConfigModalProps {
    game: any;
    onClose: () => void;
    onSave: (updatedGame: any) => void;
}

export const GameConfigModal: React.FC<GameConfigModalProps> = ({ game, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: game.name,
        version: game.version || '1.0',
        reward: game.reward || 'GAINS',
        scoreMult: 1.0,
        maintenance: false
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...game, ...formData });
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-900 w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-gray-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                            <Gamepad2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Configuration : {game.name}</h3>
                            <p className="text-[10px] text-gray-500 font-mono">ID UNIQUE: {game.id.toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Version du moteur</label>
                            <input 
                                type="text" 
                                value={formData.version}
                                onChange={e => setFormData({...formData, version: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Type Récompense</label>
                            <select 
                                value={formData.reward}
                                onChange={e => setFormData({...formData, reward: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="GAINS">Standard (Coins)</option>
                                <option value="XP">XP Uniquement</option>
                                <option value="EVENT">Spécial Événement</option>
                                <option value="NONE">Aucune</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-4 space-y-4">
                        <h4 className="text-xs font-black text-blue-400 uppercase flex items-center gap-2">
                            <Zap size={14}/> Multiplicateurs & Économie
                        </h4>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-gray-300">Ratio Score / Pièces</span>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" min="0.1" max="5.0" step="0.1" 
                                    value={formData.scoreMult}
                                    onChange={e => setFormData({...formData, scoreMult: parseFloat(e.target.value)})}
                                    className="w-32 accent-blue-500"
                                />
                                <span className="font-mono font-bold text-blue-400 w-8">x{formData.scoreMult.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
                        <Info size={20} className="text-yellow-500 shrink-0 mt-1" />
                        <p className="text-[11px] text-yellow-100/70 leading-relaxed italic">
                            Ces paramètres modifient les règles de la grille en temps réel pour tous les joueurs. 
                            Assurez-vous de la stabilité de la version avant de déployer.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all border border-white/5"
                        >
                            ANNULER
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 text-white font-black tracking-widest rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            SAUVEGARDER <Save size={18}/>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};