
import React, { useState } from 'react';
import { Volume2, VolumeX, Vibrate, VibrateOff, LogOut, Shield, RefreshCw, ArrowLeft, Settings, Info, LayoutGrid, Key, X, Check, Lock } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface SettingsMenuProps {
    onBack: () => void;
    onLogout: () => void;
    onOpenDashboard: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onLogout, onOpenDashboard, audio, currency }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);

    const handleSavePassword = async () => {
        const currentStored = localStorage.getItem('neon_current_password');
        
        // Basic validation
        if (oldPassword !== currentStored) {
            setMsg({ text: "L'ancien mot de passe est incorrect.", type: 'error' });
            return;
        }
        if (newPassword.length < 4) {
            setMsg({ text: "Le nouveau mot de passe est trop court.", type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMsg({ text: "Les mots de passe ne correspondent pas.", type: 'error' });
            return;
        }

        try {
            // Update Local Auth DB
            const usersDb = JSON.parse(localStorage.getItem('neon_users_db') || '{}');
            usersDb[currency.username] = newPassword;
            localStorage.setItem('neon_users_db', JSON.stringify(usersDb));

            // Update Current Session
            localStorage.setItem('neon_current_password', newPassword);

            // Update Local Data Mirror
            const localDataStr = localStorage.getItem(`neon_data_${currency.username}`);
            if (localDataStr) {
                const data = JSON.parse(localDataStr);
                data.password = newPassword;
                localStorage.setItem(`neon_data_${currency.username}`, JSON.stringify(data));
            }

            // Update Cloud
            if (isSupabaseConfigured) {
                await DB.updateUserData(currency.username, { password: newPassword });
            }

            setMsg({ text: "Mot de passe modifié avec succès !", type: 'success' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setMsg(null);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }, 1500);
        } catch (e) {
            setMsg({ text: "Erreur lors de la sauvegarde.", type: 'error' });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-black/20 font-sans text-white p-4 overflow-y-auto">
            
            {showPasswordModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        
                        <h3 className="text-xl font-black text-white italic mb-6 flex items-center gap-2">
                            <Key className="text-neon-pink" size={24}/> CHANGER MOT DE PASSE
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">ANCIEN MOT DE PASSE</label>
                                <input 
                                    type="password" 
                                    value={oldPassword} 
                                    onChange={e => setOldPassword(e.target.value)} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-pink outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">NOUVEAU MOT DE PASSE</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">CONFIRMER</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none"
                                />
                            </div>
                        </div>

                        {msg && (
                            <div className={`mt-4 p-3 rounded-lg text-xs font-bold text-center ${msg.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                {msg.text}
                            </div>
                        )}

                        <button 
                            onClick={handleSavePassword}
                            className="w-full mt-6 py-3 bg-neon-blue text-black font-black tracking-widest rounded-xl hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2"
                        >
                            <Check size={18} strokeWidth={3}/> SAUVEGARDER
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-24">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)] pr-2 pb-1">
                        RÉGLAGES
                    </h1>
                    <div className="w-10"></div>
                </div>

                {/* Audio Settings */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings size={16} /> AUDIO & HAPTIQUE
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${!audio.isMuted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {!audio.isMuted ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Effets Sonores</p>
                                    <p className="text-xs text-gray-500">{!audio.isMuted ? 'Activés' : 'Désactivés'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={audio.toggleMute}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${!audio.isMuted ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!audio.isMuted ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${audio.isVibrationEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {audio.isVibrationEnabled ? <Vibrate size={20}/> : <VibrateOff size={20}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Vibrations</p>
                                    <p className="text-xs text-gray-500">{audio.isVibrationEnabled ? 'Activées' : 'Désactivées'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={audio.toggleVibration}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${audio.isVibrationEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${audio.isVibrationEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings size={16} /> COMPTE
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Connecté en tant que</p>
                                <p className="text-lg font-black text-white">{currency.username}</p>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <LogOut size={14}/> DÉCONNEXION
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white"
                        >
                            <Lock size={16}/> CHANGER MOT DE PASSE
                        </button>

                        {/* Admin Section */}
                        {currency.isSuperUser && (
                            <div className="p-3 bg-red-900/10 rounded-xl border border-red-500/30 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                        <Shield size={16}/> GOD MODE (ADMIN)
                                    </div>
                                    <button 
                                        onClick={currency.toggleAdminMode}
                                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${currency.adminModeActive ? 'bg-red-500' : 'bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${currency.adminModeActive ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <p className="text-[10px] text-red-300/70 mb-3">
                                    Active l'accès à tous les jeux désactivés et les fonctionnalités de test.
                                </p>
                                <button 
                                    onClick={onOpenDashboard}
                                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                    <LayoutGrid size={14} /> OUVRIR LE DASHBOARD
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={16} /> À PROPOS
                    </h3>
                    
                    <div className="flex flex-col gap-3 text-center">
                        <p className="text-xs text-gray-500">
                            Neon Arcade v2.9.2<br/>
                            Développé avec ❤️
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl border border-white/5 transition-all text-xs flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14}/> RECHARGER L'APPLICATION
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
