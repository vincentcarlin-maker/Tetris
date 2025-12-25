
import React, { useState, useEffect } from 'react';
import { 
    Settings, Volume2, Shield, Coins, MessageSquare, 
    Construction, UserPlus, Save, RefreshCw, AlertTriangle,
    BellRing, Database, Info
} from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const ConfigSection: React.FC = () => {
    const [config, setConfig] = useState({
        maintenanceMessage: "Le serveur est actuellement en cours de mise à jour.",
        welcomeCoins: 100,
        globalMultiplier: 1.0,
        chatCooldown: 3,
        maxFriendRequestsPerDay: 10,
        allowNewRegistrations: true,
        defaultAudio: true
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            if (isSupabaseConfigured) {
                const cloudConfig = await DB.getSystemConfig();
                if (cloudConfig) setConfig(prev => ({ ...prev, ...cloudConfig }));
            }
        };
        loadConfig();
    }, []);

    const handleChange = (key: keyof typeof config, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (isSupabaseConfigured) {
            await DB.saveSystemConfig(config);
        }
        // Simulation de sauvegarde locale si nécessaire
        localStorage.setItem('neon_sys_config', JSON.stringify(config));
        
        setIsSaving(false);
        setHasChanges(false);
        alert("Configuration de la Grille mise à jour !");
    };

    const ConfigCard = ({ icon: Icon, title, children, color = "text-blue-400" }: any) => (
        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${color}`}>
                <Icon size={18} /> {title}
            </h3>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in pb-20">
            
            {/* Barre de Sauvegarde Flottante */}
            {hasChanges && (
                <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black italic tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center gap-3 active:scale-95 transition-all"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save />} 
                        APPLIQUER LES MODIFICATIONS
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* MAINTENANCE */}
                <ConfigCard icon={Construction} title="Maintenance & Accès" color="text-yellow-500">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Message de maintenance</label>
                            <textarea 
                                value={config.maintenanceMessage}
                                onChange={e => handleChange('maintenanceMessage', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-yellow-500 outline-none transition-all h-20 resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <UserPlus className="text-gray-400" size={18}/>
                                <span className="text-sm font-bold">Nouvelles Inscriptions</span>
                            </div>
                            <button 
                                onClick={() => handleChange('allowNewRegistrations', !config.allowNewRegistrations)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${config.allowNewRegistrations ? 'bg-green-500' : 'bg-red-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.allowNewRegistrations ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </ConfigCard>

                {/* ÉCONOMIE */}
                <ConfigCard icon={Coins} title="Économie Globale" color="text-yellow-400">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">Prime de Bienvenue</span>
                                <span className="text-[10px] text-gray-500 uppercase">Donné aux nouveaux comptes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={config.welcomeCoins}
                                    onChange={e => handleChange('welcomeCoins', parseInt(e.target.value))}
                                    className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-right font-mono font-bold text-yellow-400 focus:border-yellow-400 outline-none"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">Multiplicateur de Gains</span>
                                <span className="text-[10px] text-gray-500 uppercase">Ajustement global des récompenses</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" min="0.5" max="3.0" step="0.1" 
                                    value={config.globalMultiplier}
                                    onChange={e => handleChange('globalMultiplier', parseFloat(e.target.value))}
                                    className="w-24 accent-yellow-500"
                                />
                                <span className="font-mono font-bold text-yellow-400 w-8 text-right">x{config.globalMultiplier.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </ConfigCard>

                {/* SOCIAL */}
                <ConfigCard icon={MessageSquare} title="Règles Sociales" color="text-cyan-400">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">Spam Delay (sec)</span>
                                <span className="text-[10px] text-gray-500 uppercase">Cooldown entre les messages</span>
                            </div>
                            <input 
                                type="number" 
                                value={config.chatCooldown}
                                onChange={e => handleChange('chatCooldown', parseInt(e.target.value))}
                                className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono font-bold text-cyan-400 outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">Limite Demandes / Jour</span>
                                <span className="text-[10px] text-gray-500 uppercase">Anti-harcèlement</span>
                            </div>
                            <input 
                                type="number" 
                                value={config.maxFriendRequestsPerDay}
                                onChange={e => handleChange('maxFriendRequestsPerDay', parseInt(e.target.value))}
                                className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-center font-mono font-bold text-cyan-400 outline-none"
                            />
                        </div>
                    </div>
                </ConfigCard>

                {/* AUDIO PAR DÉFAUT */}
                <ConfigCard icon={Volume2} title="Audio Système" color="text-purple-400">
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Volume2 className="text-purple-400" size={20}/>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">Audio par défaut</span>
                                <span className="text-[10px] text-gray-500">Activé pour les nouveaux visiteurs</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleChange('defaultAudio', !config.defaultAudio)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${config.defaultAudio ? 'bg-purple-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.defaultAudio ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                </ConfigCard>

            </div>

            {/* INFO PANEL */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-3xl p-6 flex items-start gap-4 shadow-inner">
                <Info className="text-blue-500 shrink-0 mt-1" />
                <div className="text-xs text-blue-200/70 leading-relaxed">
                    <p className="font-bold text-blue-300 uppercase tracking-widest mb-2">Note de sécurité :</p>
                    Les modifications apportées ici affectent instantanément l'expérience de tous les utilisateurs connectés. 
                    Le <span className="text-white font-bold">Multiplicateur Global</span> s'applique en plus des multiplicateurs de difficulté individuels des jeux.
                </div>
            </div>
        </div>
    );
};
