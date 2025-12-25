
import React from 'react';
import { Flag, AlertTriangle, Users, Coins, Gamepad2, MessageSquare } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const FlagsSection: React.FC<{ featureFlags: any, setFeatureFlags: any, mp: any }> = ({ featureFlags, setFeatureFlags, mp }) => {
    const toggleFlag = async (key: string) => {
        const newState = { ...featureFlags, [key]: !featureFlags[key] };
        
        // 1. Update local UI
        setFeatureFlags(newState);
        localStorage.setItem('neon_feature_flags', JSON.stringify(newState));
        
        // 2. Broadcast to all online users (Real-time impact)
        mp.sendAdminBroadcast(
            `Système : Feature Flag [${key}] mis à jour`, 
            'game_config', 
            { flags: newState }
        );
        
        // 3. Persistent save
        if (isSupabaseConfigured) {
            await DB.saveSystemConfig({ featureFlags: newState });
        }
    };

    const FLAG_DEFS = [
        { key: 'maintenance_mode', label: 'Mode Maintenance', icon: AlertTriangle, color: 'text-red-400', desc: 'Redirige les membres vers l\'écran de maintenance.' },
        { key: 'social_module', label: 'Module Social', icon: Users, color: 'text-blue-400', desc: 'Toggles les fonctions Chat, Amis et Profil.' },
        { key: 'economy_system', label: 'Système Économique', icon: Coins, color: 'text-yellow-400', desc: 'Active/Désactive le Shop, les gains et les Coins.' },
        { key: 'beta_games', label: 'Jeux Bêta', icon: Gamepad2, color: 'text-purple-400', desc: 'Rend visible les jeux en phase expérimentale.' },
        { key: 'global_chat', label: 'Chat Global', icon: MessageSquare, color: 'text-cyan-400', desc: 'Active la messagerie en direct dans les salons.' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            {FLAG_DEFS.map(f => (
                <div key={f.key} className="bg-gray-800 p-5 rounded-2xl border border-white/10 flex flex-col gap-4 group hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 bg-black/30 rounded-xl ${f.color} shadow-inner`}><f.icon size={20}/></div>
                            <div>
                                <span className="font-black text-sm uppercase tracking-wider text-white">{f.label}</span>
                                <p className="text-[10px] text-gray-500 font-medium leading-tight max-w-[150px] mt-0.5">{f.desc}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => toggleFlag(f.key)} 
                            className={`w-14 h-7 rounded-full relative transition-all duration-300 ${featureFlags[f.key] ? 'bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.4)]' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${featureFlags[f.key] ? 'left-8' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
