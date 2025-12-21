import React from 'react';
import { Flag, AlertTriangle, Users, Coins, Gamepad2, MessageSquare } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const FlagsSection: React.FC<{ featureFlags: any, setFeatureFlags: any, mp: any }> = ({ featureFlags, setFeatureFlags, mp }) => {
    const toggleFlag = (key: string) => {
        const newState = { ...featureFlags, [key]: !featureFlags[key] };
        setFeatureFlags(newState);
        localStorage.setItem('neon_feature_flags', JSON.stringify(newState));
        mp.sendAdminBroadcast(`Feature Update: ${key}`, 'game_config', { flags: newState });
        if (isSupabaseConfigured) DB.saveSystemConfig({ featureFlags: newState });
    };

    const FLAG_DEFS = [
        { key: 'maintenance_mode', label: 'Mode Maintenance', icon: AlertTriangle, color: 'text-red-400' },
        { key: 'social_module', label: 'Module Social', icon: Users, color: 'text-blue-400' },
        { key: 'economy_system', label: 'Système Économique', icon: Coins, color: 'text-yellow-400' },
        { key: 'beta_games', label: 'Jeux Bêta', icon: Gamepad2, color: 'text-purple-400' },
        { key: 'global_chat', label: 'Chat Global', icon: MessageSquare, color: 'text-cyan-400' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            {FLAG_DEFS.map(f => (
                <div key={f.key} className="bg-gray-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className={`p-2 bg-black/30 rounded-lg ${f.color}`}><f.icon size={20}/></div><span className="font-bold text-sm">{f.label}</span></div>
                    <button onClick={() => toggleFlag(f.key)} className={`w-12 h-6 rounded-full relative transition-colors ${featureFlags[f.key] ? 'bg-green-500' : 'bg-gray-600'}`}><div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${featureFlags[f.key] ? 'left-7' : 'left-1'}`}></div></button>
                </div>
            ))}
        </div>
    );
};