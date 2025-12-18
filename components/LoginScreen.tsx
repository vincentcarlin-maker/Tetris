
import React, { useState, useEffect } from 'react';
import { User, ArrowRight, Sparkles, X, Lock, Key, LogIn, UserPlus, Cloud, Check, ShieldAlert, Mail, RefreshCcw, Hash, FileText } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

// --- CONFIGURATION EMAILJS (À configurer par l'utilisateur) ---
const EMAILJS_SERVICE_ID = 'service_default'; 
const EMAILJS_TEMPLATE_ID = 'template_reset_pass';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; 

interface LoginScreenProps {
    onLogin: (username: string, cloudData?: any) => void;
    onCancel?: () => void;
    onAttemptLogin: (username: string) => Promise<any>;
}

const USERS_DB_KEY = 'neon_users_db';
const DATA_PREFIX = 'neon_data_';

type ForgotStep = 'EMAIL' | 'CODE' | 'NEW_PASS';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel, onAttemptLogin }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [acceptCGU, setAcceptCGU] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [targetUser, setTargetUser] = useState<any | null>(null);

    const saveCurrentDataToUserSlot = (user: string) => {
        const mapping: Record<string, string> = {
            'neon-coins': 'coins',
            'neon-inventory': 'inventory',
            'neon-avatar': 'avatarId',
            'neon-owned-avatars': 'ownedAvatars',
            'neon-frame': 'frameId',
            'neon-owned-frames': 'ownedFrames',
            'neon-wallpaper': 'wallpaperId',
            'neon-owned-wallpapers': 'ownedWallpapers',
            'neon-title': 'titleId',
            'neon-owned-titles': 'ownedTitles',
            'neon-mallet': 'malletId',
            'neon-owned-mallets': 'ownedMallets',
            'neon-highscores': 'highScores'
        };
        const data: any = {};
        Object.entries(mapping).forEach(([localKey, cloudKey]) => {
            const val = localStorage.getItem(localKey);
            if (val) { try { data[cloudKey] = JSON.parse(val); } catch { data[cloudKey] = val; } }
        });
        return data;
    };

    const handleSuccess = (user: string, pass: string, data: any) => {
        localStorage.setItem('neon_current_password', pass);
        setIsAnimating(true);
        setTimeout(() => { onLogin(user, data); }, 800);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (username === 'Vincent' && password === '12/05/2008') {
            let loginData = null;
            try {
                const cloudProfile = await onAttemptLogin('Vincent');
                if (cloudProfile && cloudProfile.data) loginData = cloudProfile.data;
            } catch(e) {}
            if (!loginData) {
                const localBackup = localStorage.getItem(DATA_PREFIX + 'Vincent');
                if (localBackup) try { loginData = JSON.parse(localBackup); } catch {}
            }
            if (!loginData) loginData = saveCurrentDataToUserSlot('Vincent');
            handleSuccess('Vincent', password, loginData);
            return;
        }

        try {
            const cloudProfile = await onAttemptLogin(username);
            if (cloudProfile) {
                const cloudData = cloudProfile.data || {};
                if (cloudData.banned === true) { setError("Compte suspendu."); setIsLoading(false); return; }
                if (cloudData.password && cloudData.password !== password) { setError("Mot de passe incorrect."); setIsLoading(false); return; }
                handleSuccess(username, password, cloudData);
                return;
            }
        } catch (e) {}

        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
        if (!usersDb[username]) { setError("Ce compte n'existe pas."); setIsLoading(false); return; }
        if (usersDb[username] !== password) { setError("Mot de passe incorrect."); setIsLoading(false); return; }
        const dataStr = localStorage.getItem(DATA_PREFIX + username);
        handleSuccess(username, password, dataStr ? JSON.parse(dataStr) : null);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!acceptCGU) { setError("Vous devez accepter les CGU."); return; }
        setIsLoading(true);
        if (username.trim().length < 3) { setError("Pseudo trop court."); setIsLoading(false); return; }
        if (password.length < 4) { setError("Mot de passe trop court."); setIsLoading(false); return; }
        try {
            const cloudProfile = await onAttemptLogin(username);
            if (cloudProfile) { setError("Ce pseudo est déjà pris."); setIsLoading(false); return; }
        } catch(e) {}
        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
        if (usersDb[username]) { setError("Pseudo déjà pris."); setIsLoading(false); return; }
        
        usersDb[username] = password;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
        const freshData = { coins: 0, inventory: [], avatarId: 'av_bot', ownedAvatars: ['av_bot', 'av_human'], frameId: 'fr_none', ownedFrames: ['fr_none'], wallpaperId: 'bg_brick', ownedWallpapers: ['bg_brick'], titleId: 't_none', ownedTitles: ['t_none'], malletId: 'm_classic', ownedMallets: ['m_classic'], highScores: { tetris: 0, breaker: 0, pacman: 0, snake: 0, invaders: 0, runner: 0, stack: 0, arenaclash: 0, sudoku: {}, memory: 0, mastermind: 0, uno: 0, game2048: 0, watersort: 1 }, streak: 0, quests: [], password: password, banned: false, cgu_accepted: true, cgu_date: new Date().toISOString() };
        handleSuccess(username, password, freshData);
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!email.trim() || !email.includes('@')) { setError("Veuillez entrer une adresse e-mail valide."); setIsLoading(false); return; }
        if (!isSupabaseConfigured) { setError("Le serveur n'est pas configuré pour l'envoi d'e-mails."); setIsLoading(false); return; }
        try {
            const user = await DB.getUserByEmail(email);
            if (!user) { setError("Aucun compte n'est associé à cette adresse e-mail."); setIsLoading(false); return; }
            setTargetUser(user);
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = Date.now() + 15 * 60 * 1000;
            await DB.updateUserData(user.username, { reset_code: code, reset_expiry: expiry });
            const templateParams = { to_name: user.username, to_email: email.trim(), reset_code: code, app_name: 'Neon Arcade' };
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID, user_id: EMAILJS_PUBLIC_KEY, template_params: templateParams })
            });
            if (response.ok) { setForgotStep('CODE'); setSuccessMsg("Code de vérification envoyé !"); } else {
                if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') { setForgotStep('CODE'); setSuccessMsg("Mode démo : Code = " + code); } else { setError("Erreur lors de l'envoi de l'e-mail."); }
            }
        } catch (e: any) { setError("Une erreur est survenue : " + e.message); } finally { setIsLoading(false); }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (!targetUser) return;
        const userData = targetUser.data;
        if (userData.reset_code === otpCode && Date.now() < userData.reset_expiry) { setForgotStep('NEW_PASS'); setSuccessMsg(null); } else { setError("Code invalide ou expiré."); }
        setIsLoading(false);
    };

    const handleResetPasswordFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        if (password.length < 4) { setError("Le mot de passe doit faire au moins 4 caractères."); setIsLoading(false); return; }
        if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); setIsLoading(false); return; }
        try {
            const updatedData = { ...targetUser.data, password: password, reset_code: null, reset_expiry: null };
            await DB.updateUserData(targetUser.username, updatedData);
            const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
            usersDb[targetUser.username] = password;
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
            localStorage.setItem(DATA_PREFIX + targetUser.username, JSON.stringify(updatedData));
            setSuccessMsg("Mot de passe réinitialisé avec succès !");
            setTimeout(() => { setMode('LOGIN'); setForgotStep('EMAIL'); setSuccessMsg(null); }, 2000);
        } catch (e) { setError("Erreur lors de la mise à jour."); } finally { setIsLoading(false); }
    };

    const handleClose = () => { if (onCancel) { setIsAnimating(true); setTimeout(() => { onCancel(); }, 500); } };

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#020202]/90 backdrop-blur-md transition-opacity duration-700 ${isAnimating ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-black pointer-events-none"></div>
            
            {onCancel && (
                <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 group">
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            <div className="relative mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                <div className="font-script text-8xl text-white transform -rotate-6 z-10 drop-shadow-[0_0_15px_#00f3ff]">Neon</div>
                <div className="font-script text-7xl text-neon-pink transform -rotate-3 -mt-6 ml-12 drop-shadow-[0_0_15px_#ff00ff]">Arcade</div>
            </div>

            <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-700 delay-200">
                {mode === 'LOGIN' && (
                    <>
                        <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                            <button onClick={() => setMode('LOGIN')} className="flex-1 py-2 rounded-md text-sm font-bold bg-neon-blue text-black shadow-lg">CONNEXION</button>
                            <button onClick={() => setMode('REGISTER')} className="flex-1 py-2 rounded-md text-sm font-bold text-gray-400 hover:text-white">INSCRIPTION</button>
                        </div>
                        <h2 className="text-xl font-black text-white italic text-center mb-6">BON RETOUR</h2>
                        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="text-gray-500 group-focus-within:text-neon-blue" size={20} /></div>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Pseudo" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-blue font-bold" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="text-gray-500 group-focus-within:text-neon-pink" size={20} /></div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-pink font-bold" />
                            </div>
                            <button type="button" onClick={() => { setMode('FORGOT'); setForgotStep('EMAIL'); setError(null); }} className="text-right text-[10px] text-gray-500 hover:text-neon-blue font-bold uppercase">Mot de passe oublié ?</button>
                            {error && <div className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-2 rounded border border-red-500/30 animate-pulse">{error}</div>}
                            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg active:scale-95 transition-all">
                                {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
                            </button>
                        </form>
                    </>
                )}

                {mode === 'REGISTER' && (
                    <>
                        <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                            <button onClick={() => setMode('LOGIN')} className="flex-1 py-2 rounded-md text-sm font-bold text-gray-400 hover:text-white">CONNEXION</button>
                            <button onClick={() => setMode('REGISTER')} className="flex-1 py-2 rounded-md text-sm font-bold bg-neon-pink text-white shadow-lg">INSCRIPTION</button>
                        </div>
                        <h2 className="text-xl font-black text-white italic text-center mb-6">CRÉER UN COMPTE</h2>
                        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="text-gray-500 group-focus-within:text-neon-pink" size={20} /></div>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Pseudo" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-pink font-bold" />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="text-gray-500 group-focus-within:text-neon-blue" size={20} /></div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-blue font-bold" />
                            </div>
                            
                            <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5 mt-2">
                                <button 
                                    type="button"
                                    onClick={() => setAcceptCGU(!acceptCGU)}
                                    className={`w-5 h-5 rounded border transition-all shrink-0 flex items-center justify-center ${acceptCGU ? 'bg-neon-pink border-neon-pink' : 'border-gray-600 bg-black/40'}`}
                                >
                                    {acceptCGU && <Check size={14} strokeWidth={4} className="text-white"/>}
                                </button>
                                <p className="text-[10px] text-gray-400 leading-tight">
                                    J'accepte les <span className="text-white underline cursor-pointer">CGU</span> et la <span className="text-white underline cursor-pointer">Politique de Confidentialité</span> de Neon Arcade.
                                </p>
                            </div>

                            {error && <div className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-2 rounded border border-red-500/30">{error}</div>}
                            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg active:scale-95 transition-all disabled:opacity-50">
                                {isLoading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
                            </button>
                        </form>
                    </>
                )}

                {mode === 'FORGOT' && (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <button onClick={() => setMode('LOGIN')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase mb-6"><ArrowRight className="rotate-180" size={14}/> Retour</button>
                        <h2 className="text-xl font-black text-white italic text-center mb-2">RÉCUPÉRATION</h2>
                        
                        {forgotStep === 'EMAIL' && (
                            <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
                                <p className="text-gray-400 text-center text-xs mb-4">Saisissez l'e-mail de votre compte pour recevoir un code de vérification.</p>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="text-gray-500 group-focus-within:text-neon-blue" size={20} /></div>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-blue font-bold" autoFocus />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2">
                                    {isLoading ? <RefreshCcw className="animate-spin" /> : 'ENVOYER LE CODE'}
                                </button>
                            </form>
                        )}

                        {forgotStep === 'CODE' && (
                            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                                <p className="text-gray-400 text-center text-xs mb-4">Entrez le code à 6 chiffres envoyé à <span className="text-white font-bold">{email}</span>.</p>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Hash className="text-gray-500 group-focus-within:text-purple-400" size={20} /></div>
                                    <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-purple-400 font-black" autoFocus />
                                </div>
                                <button type="submit" disabled={isLoading || otpCode.length < 6} className="w-full py-4 bg-purple-600 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isLoading ? <RefreshCcw className="animate-spin" /> : 'VÉRIFIER LE CODE'}
                                </button>
                                <button type="button" onClick={() => setForgotStep('EMAIL')} className="text-center text-xs text-gray-500 hover:text-white uppercase font-bold">Réessayer un autre e-mail</button>
                            </form>
                        )}

                        {forgotStep === 'NEW_PASS' && (
                            <form onSubmit={handleResetPasswordFinal} className="flex flex-col gap-4">
                                <p className="text-gray-400 text-center text-xs mb-4">Vérification réussie ! Choisissez votre nouveau mot de passe.</p>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="text-gray-500 group-focus-within:text-neon-pink" size={20} /></div>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-pink font-bold" autoFocus />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Check className="text-gray-500 group-focus-within:text-neon-pink" size={20} /></div>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmer mot de passe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-neon-pink font-bold" />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-pink-600 rounded-xl font-black text-white shadow-lg flex items-center justify-center gap-2">
                                    {isLoading ? <RefreshCcw className="animate-spin" /> : 'CHANGER LE MOT DE PASSE'}
                                </button>
                            </form>
                        )}

                        {error && <div className="mt-4 text-red-500 text-xs font-bold text-center bg-red-900/20 py-3 rounded border border-red-500/30 flex items-center justify-center gap-2"><ShieldAlert size={16} /> {error}</div>}
                        {successMsg && <div className="mt-4 text-green-400 text-xs font-bold text-center bg-green-900/20 py-3 rounded border border-green-500/30 flex items-center justify-center gap-2"><Check size={16} /> {successMsg}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};
