
import React, { useState, useEffect } from 'react';
import { User, ArrowRight, Sparkles, X, Lock, Key, LogIn, UserPlus, Cloud, Check, ShieldAlert, Mail, RefreshCcw } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface LoginScreenProps {
    onLogin: (username: string, cloudData?: any) => void;
    onCancel?: () => void;
    onAttemptLogin: (username: string) => Promise<any>; // New prop for async check
}

// Clés pour le stockage simulé des utilisateurs (Local Fallback)
const USERS_DB_KEY = 'neon_users_db';
const DATA_PREFIX = 'neon_data_';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel, onAttemptLogin }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Pour le mode FORGOT
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fonction utilitaire pour sauvegarder les données du joueur actuel (local) vers son slot de sauvegarde
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
        
        // 1. Map standard economy/cosmetics
        Object.entries(mapping).forEach(([localKey, cloudKey]) => {
            const val = localStorage.getItem(localKey);
            if (val) {
                try {
                    data[cloudKey] = JSON.parse(val);
                } catch {
                    data[cloudKey] = val;
                }
            }
        });

        // 2. Map generic/special items manually
        const quests = localStorage.getItem('neon_daily_quests');
        if (quests) try { data.quests = JSON.parse(quests); } catch {}

        const streak = localStorage.getItem('neon_streak');
        if (streak) data.streak = parseInt(streak, 10);

        const lastLogin = localStorage.getItem('neon_last_login');
        if (lastLogin) data.lastLogin = lastLogin;

        return data;
    };

    const handleSuccess = (user: string, pass: string, data: any) => {
        // Sauvegarde temporaire du mot de passe pour la session en cours
        localStorage.setItem('neon_current_password', pass);
        
        setIsAnimating(true);
        setTimeout(() => {
            onLogin(user, data);
        }, 800);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // --- ADMIN CHECK (Vincent) ---
        if (username === 'Vincent' && password === '12/05/2008') {
            let loginData = null;
            
            // 1. Attempt Cloud Sync
            try {
                const cloudProfile = await onAttemptLogin('Vincent');
                if (cloudProfile && cloudProfile.data) {
                    loginData = cloudProfile.data; // Cloud priority
                }
            } catch(e) {
                console.warn("Cloud sync failed for Admin, checking local storage...");
            }

            // 2. Attempt Local Storage Specific Slot (Prevent overwriting with 0 if cloud fails)
            if (!loginData) {
                const localBackup = localStorage.getItem(DATA_PREFIX + 'Vincent');
                if (localBackup) {
                    try {
                        loginData = JSON.parse(localBackup);
                    } catch {}
                }
            }

            // 3. Fallback: Snapshot current session (Only if absolutely no data found anywhere)
            if (!loginData) {
                loginData = saveCurrentDataToUserSlot('Vincent');
            }

            handleSuccess('Vincent', password, loginData);
            return;
        }

        // --- CHLOÉ CHECK ---
        if (username === 'Chloé' && password === 'pocky61') {
            let loginData = null;
            
            try {
                const cloudProfile = await onAttemptLogin('Chloé');
                if (cloudProfile && cloudProfile.data) {
                    loginData = cloudProfile.data;
                }
            } catch(e) {}

            if (!loginData) {
                const localBackup = localStorage.getItem(DATA_PREFIX + 'Chloé');
                if (localBackup) {
                    try { loginData = JSON.parse(localBackup); } catch {}
                }
            }

            if (!loginData) {
                loginData = saveCurrentDataToUserSlot('Chloé');
            }

            handleSuccess('Chloé', password, loginData);
            return;
        }

        try {
            // 1. Check Cloud
            const cloudProfile = await onAttemptLogin(username);
            
            if (cloudProfile) {
                const cloudData = cloudProfile.data || {};
                
                // --- VÉRIFICATION DU BANNISSEMENT (CLOUD) ---
                if (cloudData.banned === true) {
                    setError("Ce compte a été suspendu par l'administrateur.");
                    setIsLoading(false);
                    return;
                }

                if (cloudData.password && cloudData.password !== password) {
                    setError("Mot de passe incorrect.");
                    setIsLoading(false);
                    return;
                }
                
                handleSuccess(username, password, cloudData);
                return;
            }
        } catch (e) {
            console.error("Cloud check failed, falling back to local", e);
        }

        // 2. Fallback Local Storage
        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');

        if (!usersDb[username]) {
            setError("Ce compte n'existe pas (Local & Cloud).");
            setIsLoading(false);
            return;
        }

        if (usersDb[username] !== password) {
            setError("Mot de passe incorrect.");
            setIsLoading(false);
            return;
        }

        const dataStr = localStorage.getItem(DATA_PREFIX + username);
        const localData = dataStr ? JSON.parse(dataStr) : null;

        // --- VÉRIFICATION DU BANNISSEMENT (LOCAL) ---
        // Cas rare où le ban serait synchronisé localement
        if (localData && localData.banned === true) {
            setError("Ce compte a été suspendu localement.");
            setIsLoading(false);
            return;
        }

        handleSuccess(username, password, localData);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (username.trim().length < 3) { setError("Le pseudo est trop court."); setIsLoading(false); return; }
        if (password.length < 4) { setError("Le mot de passe est trop court."); setIsLoading(false); return; }
        if (username.toLowerCase() === 'vincent') { setError("Ce pseudo est réservé."); setIsLoading(false); return; }

        // Check if taken
        try {
            const cloudProfile = await onAttemptLogin(username);
            if (cloudProfile) { setError("Ce pseudo est déjà pris (Cloud)."); setIsLoading(false); return; }
        } catch(e) {}

        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
        if (usersDb[username]) { setError("Ce pseudo est déjà pris (Local)."); setIsLoading(false); return; }

        // --- REGISTER SUCCESS ---
        
        usersDb[username] = password;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));

        // Create new account with FRESH data (Reset to zero)
        const freshData = {
            coins: 0,
            inventory: [],
            avatarId: 'av_bot',
            ownedAvatars: ['av_bot', 'av_human'],
            frameId: 'fr_none',
            ownedFrames: ['fr_none'],
            wallpaperId: 'bg_brick',
            ownedWallpapers: ['bg_brick'],
            titleId: 't_none',
            ownedTitles: ['t_none'],
            malletId: 'm_classic',
            ownedMallets: ['m_classic'],
            highScores: {
                tetris: 0, breaker: 0, pacman: 0, snake: 0, invaders: 0, 
                runner: 0, stack: 0, arenaclash: 0, sudoku: {}, 
                memory: 0, mastermind: 0, uno: 0, game2048: 0, watersort: 1
            },
            streak: 0,
            quests: [], // Will be generated by DailySystem on first load
            password: password,
            banned: false
        };

        handleSuccess(username, password, freshData);
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        if (!email.trim() || !email.includes('@')) {
            setError("Veuillez entrer une adresse e-mail valide.");
            setIsLoading(false);
            return;
        }

        if (isSupabaseConfigured) {
            const user = await DB.getUserByEmail(email);
            if (user) {
                // Simulation d'envoi
                setSuccessMsg("Des instructions de récupération ont été envoyées à votre adresse e-mail.");
            } else {
                setError("Aucun compte n'est associé à cette adresse e-mail.");
            }
        } else {
            setError("La récupération par e-mail nécessite une connexion au serveur.");
        }
        setIsLoading(false);
    };

    const handleClose = () => {
        if (onCancel) {
            setIsAnimating(true);
            setTimeout(() => {
                onCancel();
            }, 500);
        }
    };

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
                {mode !== 'FORGOT' ? (
                    <>
                        <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                            <button onClick={() => { setMode('LOGIN'); setError(null); }} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>CONNEXION</button>
                            <button onClick={() => { setMode('REGISTER'); setError(null); }} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-neon-pink text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>INSCRIPTION</button>
                        </div>

                        <h2 className="text-xl font-black text-white italic text-center mb-2">{mode === 'LOGIN' ? 'BON RETOUR' : 'CRÉER UN COMPTE'}</h2>
                        <p className="text-gray-400 text-center text-xs mb-6 flex items-center justify-center gap-1"><Cloud size={12}/> Sauvegarde Cloud Activée</p>

                        <form onSubmit={mode === 'LOGIN' ? handleLoginSubmit : handleRegisterSubmit} className="flex flex-col gap-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="text-gray-500 group-focus-within:text-neon-blue transition-colors" size={20} /></div>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pseudo" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all font-bold" autoFocus />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="text-gray-500 group-focus-within:text-neon-pink transition-colors" size={20} /></div>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50 transition-all font-bold" />
                            </div>

                            {mode === 'LOGIN' && (
                                <button type="button" onClick={() => { setMode('FORGOT'); setError(null); setSuccessMsg(null); }} className="text-right text-[10px] text-gray-500 hover:text-neon-blue transition-colors font-bold uppercase tracking-widest">
                                    Mot de passe oublié ?
                                </button>
                            )}

                            {error && (
                                <div className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-3 rounded border border-red-500/50 animate-pulse flex items-center justify-center gap-2">
                                    <ShieldAlert size={16} /> {error}
                                </div>
                            )}

                            <button type="submit" disabled={isLoading || !username.trim() || !password.trim()} className={`group relative w-full py-4 rounded-xl font-black text-white tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden ${mode === 'LOGIN' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-pink-600 to-purple-600'}`}>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative flex items-center justify-center gap-2">{isLoading ? 'CONNEXION...' : mode === 'LOGIN' ? (<>SE CONNECTER <LogIn size={20} /></>) : (<>JOUER & SAUVEGARDER <UserPlus size={20} /></>)}</span>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <button onClick={() => { setMode('LOGIN'); setError(null); setSuccessMsg(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase mb-6">
                            <ArrowRight className="rotate-180" size={14}/> Retour
                        </button>

                        <h2 className="text-xl font-black text-white italic text-center mb-2">RÉCUPÉRATION</h2>
                        <p className="text-gray-400 text-center text-xs mb-8">Saisissez l'adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation.</p>

                        <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="text-gray-500 group-focus-within:text-neon-blue transition-colors" size={20} /></div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-blue transition-all font-bold" autoFocus />
                            </div>

                            {error && (
                                <div className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-3 rounded border border-red-500/50 flex items-center justify-center gap-2">
                                    <ShieldAlert size={16} /> {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="text-green-400 text-xs font-bold text-center bg-green-900/20 py-3 rounded border border-green-500/50 flex flex-col items-center justify-center gap-2">
                                    <div className="flex items-center gap-2"><Check size={16} /> {successMsg}</div>
                                    <button type="button" onClick={() => setMode('LOGIN')} className="mt-2 text-white underline">Se connecter</button>
                                </div>
                            )}

                            {!successMsg && (
                                <button type="submit" disabled={isLoading || !email.trim()} className="group relative w-full py-4 rounded-xl font-black text-white tracking-widest shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isLoading ? <RefreshCcw size={20} className="animate-spin"/> : <>RÉINITIALISER <ArrowRight size={20}/></>}
                                </button>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
