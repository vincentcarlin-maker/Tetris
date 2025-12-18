
import React, { useState, useMemo } from 'react';
import { Volume2, VolumeX, Vibrate, VibrateOff, LogOut, Shield, RefreshCw, ArrowLeft, Settings, Info, LayoutGrid, Key, X, Check, Lock, Palette, EyeOff, Eye, UserX, Activity, Trash2, Sliders, Trophy, Star, Coins, UserCircle, Target, Clock } from 'lucide-react';
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
}

const ACCENT_COLORS = [
    { name: 'Standard', hex: '#00f3ff' },
    { name: 'Rose', hex: '#ff00ff' },
    { name: 'Violet', hex: '#9d00ff' },
    { name: 'Jaune', hex: '#ffe600' },
    { name: 'Vert', hex: '#00ff9d' },
];

const GAME_LABELS: Record<string, string> = {
    tetris: 'Tetris', arenaclash: 'Arena Clash', stack: 'Stack', runner: 'Neon Run',
    pacman: 'Pacman', snake: 'Snake', breaker: 'Breaker', invaders: 'Invaders',
    lumen: 'Lumen Order', memory: 'Memory', skyjo: 'Skyjo', uno: 'Uno', mastermind: 'Mastermind'
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onLogout, onOpenDashboard, audio, currency, highScores }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);

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

    const handleHardReset = () => {
        if (window.confirm("Ceci va effacer vos préférences locales (audio, thème, vibration). Vos données de jeu sont en sécurité sur le cloud. Continuer ?")) {
            localStorage.removeItem('neon-accent-color');
            localStorage.removeItem('neon-reduced-motion');
            localStorage.removeItem('neon-vibration');
            localStorage.removeItem('neon-privacy');
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

    const AvatarIcon = currentAvatar.icon;

    return (
        <div className="flex flex-col h-full w-full bg-black/20 font-sans text-white p-4 overflow-y-auto custom-scrollbar">
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

            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-24">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]">RÉGLAGES</h1>
                    <div className="w-10"></div>
                </div>

                {/* --- SECTION MON PROFIL --- */}
                <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>
                    
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle size={16} className="text-neon-blue" /> MON PROFIL NÉON</h3>
                    
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

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
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

                    {/* Hall of Fame Snippet */}
                    <div className="bg-black/60 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={12}/> MEILLEURS RECORDS</h4>
                        <div className="space-y-2">
                            {topScores.length > 0 ? topScores.map(([key, score]) => (
                                <div key={key} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <span className="text-gray-400 font-bold">{GAME_LABELS[key] || key}</span>
                                    <span className="text-white font-mono font-bold">{score.toLocaleString()}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-gray-600 italic">Aucun score enregistré...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personnalisation Visuelle */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={16} /> STYLE NÉON</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-400">Couleur d'accentuation</span>
                        <div className="flex gap-2">
                            {ACCENT_COLORS.map(c => (
                                <button 
                                    key={c.hex} 
                                    onClick={() => currency.updateAccentColor(c.hex)}
                                    title={c.name}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${currency.accentColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.hex, boxShadow: currency.accentColor === c.hex ? `0 0 10px ${c.hex}` : 'none' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Confidentialité & Social */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Eye size={16} /> SOCIAL & VIE PRIVÉE</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currency.privacySettings.hideOnline ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'}`}><EyeOff size={20}/></div>
                                <div><p className="font-bold text-sm">Mode Invisible</p><p className="text-[10px] text-gray-500">Ne plus apparaître "En ligne"</p></div>
                            </div>
                            <button onClick={() => currency.togglePrivacy('hideOnline')} className={`w-12 h-6 rounded-full relative transition-colors ${currency.privacySettings.hideOnline ? 'bg-purple-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.privacySettings.hideOnline ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currency.privacySettings.blockRequests ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-gray-400'}`}><UserX size={20}/></div>
                                <div><p className="font-bold text-sm">Bloquer Demandes</p><p className="text-[10px] text-gray-500">Refuser auto les invitations</p></div>
                            </div>
                            <button onClick={() => currency.togglePrivacy('blockRequests')} className={`w-12 h-6 rounded-full relative transition-colors ${currency.privacySettings.blockRequests ? 'bg-red-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.privacySettings.blockRequests ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                {/* Graphismes & Performance */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} /> PERFORMANCE</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currency.reducedMotion ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'}`}><Sliders size={20}/></div>
                                <div><p className="font-bold text-sm">Motion Réduite</p><p className="text-[10px] text-gray-500">Moins d'effets visuels lourds</p></div>
                            </div>
                            <button onClick={currency.toggleReducedMotion} className={`w-12 h-6 rounded-full relative transition-colors ${currency.reducedMotion ? 'bg-orange-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.reducedMotion ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${!audio.isMuted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{!audio.isMuted ? <Volume2 size={20}/> : <VolumeX size={20}/>}</div>
                                <div><p className="font-bold text-sm">Effets Sonores</p><p className="text-[10px] text-gray-500">Sons d'interface et jeux</p></div>
                            </div>
                            <button onClick={audio.toggleMute} className={`w-12 h-6 rounded-full relative transition-colors ${!audio.isMuted ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!audio.isMuted ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                {/* Account & Administration */}
                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Lock size={16} /> COMPTE</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Utilisateur</p>
                                <p className="text-lg font-black text-white">{currency.username}</p>
                            </div>
                            <button onClick={onLogout} className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold transition-all">DECO</button>
                        </div>
                        <button onClick={() => setShowPasswordModal(true)} className="w-full py-3 bg-gray-800 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-gray-300 active:scale-95 transition-all"><Key size={16}/> MODIFIER MOT DE PASSE</button>
                        {currency.isSuperUser && (
                            <div className="mt-2 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-red-400">GOD MODE (ADMIN)</span>
                                    <button onClick={currency.toggleAdminMode} className={`w-12 h-6 rounded-full relative transition-colors ${currency.adminModeActive ? 'bg-red-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.adminModeActive ? 'left-7' : 'left-1'}`}></div></button>
                                </div>
                                <button onClick={onOpenDashboard} className="w-full py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-xs">OUVRIR DASHBOARD</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Danger */}
                <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Trash2 size={16} /> ZONE DE DANGER</h3>
                    <button handleHardReset onClick={handleHardReset} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                        <RefreshCw size={14}/> RÉINITIALISER LES PRÉFÉRENCES LOCALES
                    </button>
                </div>

                {/* About */}
                <div className="text-center py-4">
                    <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">Neon Arcade v2.9.5</p>
                    <p className="text-[10px] text-gray-700 mt-1 italic">Made with ❤️ for Arcade Lovers</p>
                </div>
            </div>
        </div>
    );
};
