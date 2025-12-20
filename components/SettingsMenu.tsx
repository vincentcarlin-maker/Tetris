
import React, { useState, useMemo, useRef } from 'react';
import { Volume2, VolumeX, Vibrate, VibrateOff, LogOut, Shield, RefreshCw, ArrowLeft, Settings, Info, LayoutGrid, Key, X, Check, Lock, Palette, EyeOff, Eye, UserX, Activity, Trash2, Sliders, Trophy, Star, Coins, UserCircle, Target, Clock, Mail, Edit2, FileText, Gavel, ShieldCheck, Languages, HelpCircle } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { HighScores } from '../hooks/useHighScores';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface SettingsMenuProps {
    onBack: () => void;
    onLogout: () => void;
    onOpenDashboard: () => void;
    onOpenContact: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    highScores: HighScores;
}

const ACCENT_COLORS = [
    { name: 'Standard', hex: 'default' },
    { name: 'Bleu', hex: '#00f3ff' },
    { name: 'Rose', hex: '#ff00ff' },
    { name: 'Violet', hex: '#9d00ff' },
    { name: 'Jaune', hex: '#ffe600' },
    { name: 'Vert', hex: '#00ff9d' },
];

const GAME_LABELS: Record<string, string> = {
    tetris: 'Neon Blocks', arenaclash: 'Arena Clash', stack: 'Stack', runner: 'Neon Run',
    pacman: 'Pacman', snake: 'Snake', breaker: 'Breaker', invaders: 'Invaders',
    lumen: 'Lumen Order', memory: 'Memory', skyjo: 'Skyjo', uno: 'Uno', mastermind: 'Mastermind', slither: 'Cyber Serpent'
};

type LegalTab = 'CGU' | 'PRIVACY' | 'MENTIONS';

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onLogout, onOpenDashboard, onOpenContact, audio, currency, highScores }) => {
    const { t, language, setLanguage } = currency;
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState<{text: string, type: 'error' | 'success'} | null>(null);

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
        if (isSupabaseConfigured) await DB.updateUserData(currency.username, { email: trimmed });
        setIsEditingEmail(false);
        audio.playVictory();
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.prompt("⚠️ ACTION IRRÉVERSIBLE ⚠️\nPour supprimer votre compte et TOUTES vos données (scores, achats, pièces), tapez votre pseudo ci-dessous :");
        if (confirmation === currency.username) {
            if (isSupabaseConfigured) await DB.deleteUser(currency.username);
            localStorage.removeItem('neon-username');
            localStorage.removeItem('neon_current_password');
            localStorage.removeItem(`neon_data_${currency.username}`);
            alert("Compte supprimé. Au revoir !");
            window.location.reload();
        } else if (confirmation !== null) {
            alert("Pseudo incorrect. Annulation.");
        }
    };

    const handleHardReset = () => {
        if (window.confirm("Ceci va effacer vos préférences locales (audio, thème, vibration). Vos données de jeu sont en sécurité sur le cloud. Continuer ?")) {
            localStorage.removeItem('neon-accent-color');
            localStorage.removeItem('neon-reduced-motion');
            localStorage.removeItem('neon-vibration');
            localStorage.removeItem('neon_privacy');
            localStorage.removeItem('neon-language');
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
            {/* Modal Mot de passe */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        <h3 className="text-xl font-black text-white italic mb-6 flex items-center gap-2"><Key className="text-neon-pink" size={24}/> {t.edit_password.toUpperCase()}</h3>
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

            {/* Centre Légal */}
            {legalTab && (
                <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-gray-900 w-full max-w-xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex flex-col bg-gray-800/50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-white flex items-center gap-2 italic"><ShieldCheck className="text-neon-blue" /> CENTRE LÉGAL</h3>
                                <button onClick={() => setLegalTab(null)} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20}/></button>
                            </div>
                            <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
                                <button onClick={() => setLegalTab('CGU')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'CGU' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}>CGU</button>
                                <button onClick={() => setLegalTab('PRIVACY')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'PRIVACY' ? 'bg-neon-pink text-black' : 'text-gray-400 hover:text-white'}`}>RGPD</button>
                                <button onClick={() => setLegalTab('MENTIONS')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'MENTIONS' ? 'bg-neon-yellow text-black' : 'text-gray-400 hover:text-white'}`}>MENTIONS</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-300 leading-relaxed custom-scrollbar">
                            {legalTab === 'CGU' && (
                                <div className="animate-in slide-in-from-left-4">
                                    <h4 className="text-neon-blue font-black uppercase tracking-widest mb-4">Conditions Générales d'Utilisation</h4>
                                    <section className="mb-4">
                                        <p className="font-bold text-white mb-1">1. Objet</p>
                                        <p>Neon Arcade fournit des jeux rétro et des fonctionnalités sociales. L'utilisation implique l'acceptation pleine et entière de ces termes.</p>
                                    </section>
                                    <section className="mb-4">
                                        <p className="font-bold text-white mb-1">2. Monnaie Virtuelle</p>
                                        <p>Les "Pièces Néon" sont une monnaie purement fictive. Elles ne peuvent en aucun cas être converties en argent réel. Tout abus ou tentative de triche pourra entraîner une remise à zéro du compte.</p>
                                    </section>
                                    <section className="mb-4">
                                        <p className="font-bold text-white mb-1">3. Responsabilité</p>
                                        <p>L'éditeur ne peut être tenu responsable en cas d'indisponibilité du service ou de perte de progression liée à un incident technique.</p>
                                    </section>
                                </div>
                            )}
                            {legalTab === 'PRIVACY' && (
                                <div className="animate-in slide-in-from-right-4">
                                    <h4 className="text-neon-pink font-black uppercase tracking-widest mb-4">Politique de Confidentialité (RGPD)</h4>
                                    <section className="mb-4">
                                        <p className="font-bold text-white mb-1">Données collectées :</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Pseudo (public) : Pour le classement et le social.</li>
                                            <li>Email (privé) : Pour la récupération de mot de passe (si fourni).</li>
                                            <li>Stats de jeu : Scores et inventaire.</li>
                                        </ul>
                                    </section>
                                    <section className="mb-4">
                                        <p className="font-bold text-white mb-1">Vos Droits :</p>
                                        <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données via les réglages de l'application.</p>
                                    </section>
                                    <section>
                                        <p className="font-bold text-white mb-1">Conservation :</p>
                                        <p>Vos données sont conservées tant que votre compte est actif. Un compte inactif pendant 24 mois pourra être supprimé.</p>
                                    </section>
                                </div>
                            )}
                            {legalTab === 'MENTIONS' && (
                                <div className="animate-in fade-in">
                                    <h4 className="text-neon-yellow font-black uppercase tracking-widest mb-4">Mentions Légales</h4>
                                    <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                                        <p><span className="text-gray-500 uppercase text-[10px] block">Éditeur</span> Neon Arcade Project</p>
                                        <p><span className="text-gray-500 uppercase text-[10px] block">Hébergement</span> Supabase Inc. (USA) / Google Cloud</p>
                                        <p><span className="text-gray-500 uppercase text-[10px] block">Contact</span> support@neon-arcade.io</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-gray-800/30">
                            <button onClick={() => setLegalTab(null)} className="w-full py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-neon-blue transition-colors shadow-lg">FERMER</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-24">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)] uppercase">{t.settings}</h1>
                    <div className="w-10"></div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>
                    
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><UserCircle size={16} className="text-neon-blue" /> {t.profile}</h3>
                    
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

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                            <Coins size={18} className="text-yellow-400 mb-1" />
                            <span className="text-lg font-black font-mono">{currency.coins.toLocaleString()}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{t.coins}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                            <Star size={18} className="text-purple-400 mb-1" />
                            <span className="text-lg font-black font-mono">{currency.inventory.length}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{t.badges}</span>
                        </div>
                    </div>

                    <div className="bg-black/60 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={12}/> {t.record.toUpperCase()}S</h4>
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

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Languages size={16} className="text-neon-green" /> {t.language}</h3>
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
                        <button 
                            onClick={() => setLanguage('fr')} 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'fr' ? 'bg-neon-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            FRANÇAIS
                        </button>
                        <button 
                            onClick={() => setLanguage('en')} 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-neon-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            ENGLISH
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={16} className="text-neon-pink" /> {t.style}</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Accentuation</span>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{selectedColorName}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                                {ACCENT_COLORS.map(c => (
                                    <button 
                                        key={c.hex} 
                                        onClick={() => currency.updateAccentColor(c.hex)}
                                        title={c.name}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${currency.accentColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ 
                                            background: c.hex === 'default' 
                                                ? 'conic-gradient(from 0deg, #00f3ff, #ff00ff, #9d00ff, #00f3ff)' 
                                                : c.hex, 
                                            boxShadow: currency.accentColor === c.hex && c.hex !== 'default' ? `0 0 10px ${c.hex}` : 'none' 
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} className="text-neon-yellow" /> {t.performance}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${currency.reducedMotion ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'}`}><Sliders size={20}/></div>
                                <div><p className="font-bold text-sm">{t.motion_reduced}</p><p className="text-[10px] text-gray-500">Moins d'effets visuels lourds</p></div>
                            </div>
                            <button onClick={currency.toggleReducedMotion} className={`w-12 h-6 rounded-full relative transition-colors ${currency.reducedMotion ? 'bg-orange-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.reducedMotion ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${!audio.isMuted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{!audio.isMuted ? <Volume2 size={20}/> : <VolumeX size={20}/>}</div>
                                <div><p className="font-bold text-sm">{t.sound_fx}</p><p className="text-[10px] text-gray-500">Sons d'interface et jeux</p></div>
                            </div>
                            <button onClick={audio.toggleMute} className={`w-12 h-6 rounded-full relative transition-colors ${!audio.isMuted ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!audio.isMuted ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Lock size={16} /> {t.account}</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Utilisateur</p>
                                <p className="text-lg font-black text-white">{currency.username}</p>
                            </div>
                            <button onClick={onLogout} className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold transition-all">DECO</button>
                        </div>

                        <div className="bg-black/40 rounded-xl border border-white/5 p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Mail size={10}/> Adresse E-mail</span>
                                {!isEditingEmail && (
                                    <button onClick={() => { setIsEditingEmail(true); setTempEmail(currency.email); }} className="text-neon-blue text-[10px] font-bold uppercase hover:underline">
                                        {currency.email ? 'Modifier' : 'Ajouter'}
                                    </button>
                                )}
                            </div>
                            {isEditingEmail ? (
                                <form onSubmit={handleSaveEmail} className="flex gap-2 mt-2">
                                    <input 
                                        ref={emailInputRef}
                                        type="email" 
                                        value={tempEmail} 
                                        onChange={e => setTempEmail(e.target.value)} 
                                        placeholder="votre@email.com"
                                        className="flex-1 bg-gray-800 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-blue"
                                        autoFocus
                                    />
                                    <button type="submit" className="p-1 text-green-400 hover:bg-green-400/20 rounded transition-colors"><Check size={18}/></button>
                                    <button type="button" onClick={() => setIsEditingEmail(false)} className="p-1 text-red-400 hover:bg-red-400/20 rounded transition-colors"><X size={18}/></button>
                                </form>
                            ) : (
                                <p className={`text-sm font-bold ${currency.email ? 'text-white' : 'text-gray-600 italic'}`}>
                                    {currency.email || 'Aucune adresse associée'}
                                </p>
                            )}
                        </div>

                        <button onClick={() => setShowPasswordModal(true)} className="w-full py-3 bg-gray-800 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-gray-300 active:scale-95 transition-all"><Key size={16}/> {t.edit_password.toUpperCase()}</button>
                        
                        {currency.isSuperUser && (
                            <div className="mt-2 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-red-400">GOD MODE (ADMIN)</span>
                                    <button onClick={currency.toggleAdminMode} className={`w-12 h-6 rounded-full relative transition-colors ${currency.adminModeActive ? 'bg-red-500' : 'bg-gray-600'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.adminModeActive ? 'left-7' : 'left-1'}`}></div></button>
                                </div>
                                <button onClick={onOpenDashboard} className="w-full py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-xs">OUVRIR DASHBOARD</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><HelpCircle size={16} className="text-neon-blue" /> {t.support}</h3>
                    <button onClick={onOpenContact} className="w-full py-3 bg-neon-blue/10 border border-neon-blue/30 hover:bg-neon-blue/20 text-neon-blue rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <Mail size={18} /> {t.contact.toUpperCase()}
                    </button>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Gavel size={16} /> {t.legal}</h3>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setLegalTab('CGU')} className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all">
                            <FileText size={16} className="text-neon-blue" /> CONSULTER LES CGU / RGPD
                        </button>
                    </div>
                </div>

                <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-5 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Trash2 size={16} /> {t.danger_zone}</h3>
                    <div className="space-y-3">
                        <button onClick={handleHardReset} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={14}/> RÉINITIALISER LES PRÉFÉRENCES LOCALES
                        </button>
                        <button onClick={handleDeleteAccount} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg">
                            <UserX size={16}/> {t.delete_account.toUpperCase()}
                        </button>
                    </div>
                </div>

                <div className="text-center py-4">
                    <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">Neon Arcade v3.1.0</p>
                    <p className="text-[10px] text-gray-700 mt-1 italic">Tous droits réservés</p>
                </div>
            </div>
        </div>
    );
};
