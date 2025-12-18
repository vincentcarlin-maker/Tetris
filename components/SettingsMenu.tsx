import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Vibrate, VibrateOff, LogOut, Shield, RefreshCw, ArrowLeft, Settings, Info, LayoutGrid, Key, X, Check, Lock, Palette, EyeOff, Eye, UserX, Activity, Trash2, Sliders, Trophy, Star, Coins, UserCircle, Target, Clock, Mail, Edit2, Monitor, Globe2, Heart, Code2, Sparkles, CloudCheck, ShieldCheck } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { HighScores } from '../hooks/useHighScores';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface SettingsMenuProps {
    onBack: () => void;
    onLogout: () => void;
    onOpenDashboard: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    highScores: HighScores;
    isConnectedToSupabase: boolean;
}

const ACCENT_COLORS = [
    { name: 'Standard', hex: 'default' },
    { name: 'Bleu', hex: '#00f3ff' },
    { name: 'Rose', hex: '#ff00ff' },
    { name: 'Violet', hex: '#9d00ff' },
    { name: 'Jaune', hex: '#ffe600' },
    { name: 'Vert', hex: '#00ff9d' },
];

const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const GAME_LABELS: Record<string, string> = {
    tetris: 'Tetris', arenaclash: 'Arena Clash', stack: 'Stack', runner: 'Neon Run',
    pacman: 'Pacman', snake: 'Snake', breaker: 'Breaker', invaders: 'Invaders',
    lumen: 'Lumen Order', memory: 'Memory', skyjo: 'Skyjo', uno: 'Uno', mastermind: 'Mastermind'
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onLogout, onOpenDashboard, audio, currency, highScores, isConnectedToSupabase }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);

    // Email Edit State
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState(currency.email);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const handleSavePassword = async () => {
        const currentStored = localStorage.getItem('neon_current_password');
        if (oldPassword !== currentStored) { setMsg({ text: "L'ancien mot de passe est incorrect.", type: 'error' }); return; }
        if (newPassword.length < 4) { setMsg({ text: "Le nouveau mot de passe est trop court.", type: 'error' }); return; }
        if (newPassword !== confirmPassword) { setMsg({ text: "Les mots de passe ne correspondent pas.", type: 'error' }); return; }

        try {
            const usersDb = JSON.parse(localStorage.getItem('neon_users_db') || '{}');
            usersDb[currency.username] = newPassword;
            localStorage.setItem('neon_users_db', JSON.stringify(usersDb));
            localStorage.setItem('neon_current_password', newPassword);
            if (isSupabaseConfigured) await DB.updateUserData(currency.username, { password: newPassword });
            setMsg({ text: "Mot de passe modifié !", type: 'success' });
            setTimeout(() => { setShowPasswordModal(false); setMsg(null); }, 1500);
        } catch (e) { setMsg({ text: "Erreur lors de la sauvegarde.", type: 'error' }); }
    };

    const handleSaveEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tempEmail.trim();
        if (trimmed && !trimmed.includes('@')) {
            alert("Veuillez entrer une adresse e-mail valide.");
            return;
        }
        
        currency.updateEmail(trimmed);
        if (isSupabaseConfigured) {
            await DB.updateUserData(currency.username, { email: trimmed });
        }
        setIsEditingEmail(false);
        audio.playVictory();
    };

    const handleHardReset = () => {
        if (window.confirm("Ceci va effacer vos préférences locales (audio, thème, vibration). Vos données de jeu sont en sécurité sur le cloud. Continuer ?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const currentAvatar = useMemo(() => 
        currency.avatarsCatalog.find(a => a.id === currency.currentAvatarId) || currency.avatarsCatalog[0], 
    [currency.currentAvatarId, currency.avatarsCatalog]);

    const currentFrame = useMemo(() => 
        currency.framesCatalog.find(f => f.id === currency.currentFrameId) || currency.framesCatalog[0], 
    [currency.currentFrameId, currency.framesCatalog]);

    const currentTitle = useMemo(() => 
        currency.titlesCatalog.find(t => t.id === currency.currentTitleId), 
    [currency.currentTitleId, currency.titlesCatalog]);

    const topScores = useMemo(() => {
        return Object.entries(highScores)
            .filter(([key, val]) => typeof val === 'number' && val > 0 && key !== 'watersort' && key !== 'rush')
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 3);
    }, [highScores]);

    const selectedColorName = useMemo(() => {
        return ACCENT_COLORS.find(c => c.hex === currency.accentColor)?.name || 'Thématique';
    }, [currency.accentColor]);

    const AvatarIcon = currentAvatar.icon;

    return (
        <div className="flex flex-col h-full w-full bg-black/20 font-sans text-white p-4 overflow-y-auto custom-scrollbar">
            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        <h3 className="text-xl font-black text-white italic mb-6 flex items-center gap-2"><Key className="text-neon-pink" size={24}/> MOT DE PASSE</h3>
                        <div className="space-y-4">
                            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Ancien mot de passe" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-pink outline-none" />
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none" />
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmer" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none" />
                        </div>
                        {msg && <div className={`mt-4 p-3 rounded-lg text-xs font-bold text-center ${msg.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{msg.text}</div>}
                        <button onClick={handleSavePassword} className="w-full mt-6 py-3 bg-neon-blue text-black font-black tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)]"><Check size={18} strokeWidth={3}/> VALIDER</button>
                    </div>
                </div>
            )}

            {/* Credits Modal */}
            {showCreditsModal && (
                <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-900 w-full max-w-md rounded-3xl border border-white/20 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-pink to-neon-purple"></div>
                        <button onClick={() => setShowCreditsModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 mb-6 shadow-xl">
                                <Sparkles size={48} className="text-neon-yellow animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black italic text-white mb-2 tracking-tighter">NEON ARCADE</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em] mb-8">Version 3.4.0 • Pro Build</p>
                            
                            <div className="space-y-6 w-full text-left">
                                <div className="flex items-start gap-4">
                                    <Code2 className="text-neon-blue shrink-0 mt-1" size={20}/>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Développement</p>
                                        <p className="text-sm font-bold text-white">Vincent • Lead Engineer</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Monitor className="text-neon-pink shrink-0 mt-1" size={20}/>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interface & FX</p>
                                        <p className="text-sm font-bold text-white">Pixel Studio • UI/UX Design</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CloudCheck className="text-neon-green shrink-0 mt-1" size={20}/>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Infrastructure</p>
                                        <p className="text-sm font-bold text-white">Supabase Realtime • Database</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 w-full">
                                <p className="text-[10px] text-gray-500 italic">"Conçu pour raviver la flamme des salles d'arcade des années 80."</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-24">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]">RÉGLAGES</h1>
                    <div className="w-10"></div>
                </div>

                {/* Profil & Status Pro */}
                <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><UserCircle size={16} className="text-neon-blue" /> MON PROFIL</h3>
                        {isConnectedToSupabase && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-[9px] font-black animate-pulse">
                                <ShieldCheck size={12}/> CLOUD SYNCED
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 flex items-center justify-center relative border-2 ${currentFrame.cssClass} shadow-xl`}>
                            <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                                <AvatarIcon size={40} className={currentAvatar.color} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-black text-white italic truncate">{currency.username}</h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {currentTitle && currentTitle.id !== 't_none' && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${currentTitle.color} bg-black/40 px-2 py-0.5 rounded border border-white/10`}>
                                        {currentTitle.name}
                                    </span>
                                )}
                                <span className={`text-[9px] font-bold tracking-wider uppercase ${currency.playerRank.color}`}>
                                    {currency.playerRank.title}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                            <Coins size={18} className="text-yellow-400 mb-1" />
                            <span className="text-lg font-black font-mono">{currency.coins.toLocaleString()}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Solde Actuel</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                            <Star size={18} className="text-purple-400 mb-1" />
                            <span className="text-lg font-black font-mono">{currency.inventory.length}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Badges Gagnés</span>
                        </div>
                    </div>
                </div>

                {/* Graphismes Pro */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Monitor size={16} className="text-neon-pink" /> GRAPHISMES AVANCÉS</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currency.crtEffect ? 'bg-neon-pink/20 text-neon-pink' : 'bg-gray-700/50 text-gray-400'}`}><Monitor size={20}/></div>
                                <div><p className="font-bold text-sm">Effet CRT Rétro</p><p className="text-[10px] text-gray-500">Scanlines & Distorsion CRT</p></div>
                            </div>
                            <button onClick={currency.toggleCrtEffect} className={`w-12 h-6 rounded-full relative transition-colors ${currency.crtEffect ? 'bg-neon-pink' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.crtEffect ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        
                        <div className="flex justify-between items-center px-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Accentuation</span>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{selectedColorName}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                                {ACCENT_COLORS.map(c => (
                                    <button 
                                        key={c.hex} 
                                        onClick={() => currency.updateAccentColor(c.hex)}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${currency.accentColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                                        style={{ background: c.hex === 'default' ? 'conic-gradient(from 0deg, #00f3ff, #ff00ff, #9d00ff, #00f3ff)' : c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Langues & Région */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe2 size={16} className="text-neon-green" /> LANGUE & RÉGION</h3>
                    <div className="flex gap-2">
                        {LANGUAGES.map(lang => (
                            <button 
                                key={lang.code}
                                onClick={() => currency.updateLanguage(lang.code)}
                                className={`flex-1 flex flex-col items-center py-3 rounded-xl border transition-all ${currency.currentLanguage === lang.code ? 'bg-green-600/20 border-green-500 shadow-lg' : 'bg-black/40 border-white/5 text-gray-500'}`}
                            >
                                <span className="text-2xl mb-1">{lang.flag}</span>
                                <span className="text-[10px] font-black tracking-widest uppercase">{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audio & Performance */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} className="text-neon-yellow" /> PERFORMANCE & AUDIO</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${!audio.isMuted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{!audio.isMuted ? <Volume2 size={20}/> : <VolumeX size={20}/>}</div>
                                <div><p className="font-bold text-sm">Volume Principal</p><p className="text-[10px] text-gray-500">Audio Global</p></div>
                            </div>
                            <button onClick={audio.toggleMute} className={`w-12 h-6 rounded-full relative transition-colors ${!audio.isMuted ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!audio.isMuted ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${audio.isVibrationEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/50 text-gray-400'}`}>{audio.isVibrationEnabled ? <Vibrate size={20}/> : <VibrateOff size={20}/>}</div>
                                <div><p className="font-bold text-sm">Haptique</p><p className="text-[10px] text-gray-500">Vibrations d'impact</p></div>
                            </div>
                            <button onClick={audio.toggleVibration} className={`w-12 h-6 rounded-full relative transition-colors ${audio.isVibrationEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${audio.isVibrationEnabled ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                {/* Sécurité du Compte */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Lock size={16} className="text-purple-400" /> SÉCURITÉ DU COMPTE</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                            <div><p className="text-[10px] text-gray-500 font-bold uppercase">Identifiant</p><p className="text-sm font-black">{currency.username}</p></div>
                            <button onClick={() => setShowPasswordModal(true)} className="p-2 bg-purple-900/30 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all"><Key size={18}/></button>
                        </div>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Mail size={10}/> E-mail de récupération</span>
                                {!isEditingEmail && <button onClick={() => { setIsEditingEmail(true); setTempEmail(currency.email); }} className="text-neon-blue text-[10px] font-bold uppercase">{currency.email ? 'Modifier' : 'Ajouter'}</button>}
                            </div>
                            {isEditingEmail ? (
                                <form onSubmit={handleSaveEmail} className="flex gap-2 mt-2">
                                    <input type="email" value={tempEmail} onChange={e => setTempEmail(e.target.value)} className="flex-1 bg-gray-800 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none" autoFocus />
                                    <button type="submit" className="text-green-400"><Check size={18}/></button>
                                </form>
                            ) : <p className="text-sm font-bold truncate">{currency.email || 'Non renseigné'}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Pro Actions */}
                <div className="flex gap-3 shrink-0">
                    <button onClick={() => setShowCreditsModal(true)} className="flex-1 py-4 bg-gray-800 border border-white/10 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all active:scale-95"><Info size={16}/> CRÉDITS</button>
                    <button onClick={onLogout} className="flex-1 py-4 bg-red-900/20 border border-red-500/20 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-red-400 hover:bg-red-600 hover:text-white transition-all active:scale-95"><LogOut size={16}/> DÉCONNEXION</button>
                </div>

                {currency.isSuperUser && (
                    <button onClick={onOpenDashboard} className="w-full py-4 bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500/30 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Shield size={18}/> ADMINISTRATION SYSTEME</button>
                )}

                <div className="flex flex-col items-center gap-4 py-8 border-t border-red-500/20 mt-4">
                    <button onClick={handleHardReset} className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={12}/> Réinitialiser toutes les données locales</button>
                    <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">Neon Arcade Pro • v3.4.0 • Built with Supabase</p>
                </div>
            </div>
        </div>
    );
};