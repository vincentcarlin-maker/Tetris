
import React, { useState, useEffect } from 'react';
import { User, ArrowRight, Sparkles, X, Lock, Key, LogIn, UserPlus, Cloud, Check } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (username: string, cloudData?: any) => void;
    onCancel?: () => void;
    onAttemptLogin: (username: string) => Promise<any>; // New prop for async check
}

// Clés pour le stockage simulé des utilisateurs (Local Fallback)
const USERS_DB_KEY = 'neon_users_db';
const DATA_PREFIX = 'neon_data_';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel, onAttemptLogin }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fonction utilitaire pour sauvegarder les données du joueur actuel (local) vers son slot de sauvegarde
    const saveCurrentDataToUserSlot = (user: string) => {
        const keysToSave = [
            'neon-coins', 'neon-inventory', 'neon-avatar', 'neon-owned-avatars',
            'neon-frame', 'neon-owned-frames', 'neon-wallpaper', 'neon-owned-wallpapers',
            'neon-title', 'neon-owned-titles', 'neon-mallet', 'neon-owned-mallets',
            'neon-highscores', 'neon_daily_quests', 'neon_streak', 'neon_last_login'
        ];
        
        const data: any = {};
        keysToSave.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try {
                    data[key] = JSON.parse(val); // Parse JSON to store clean object in DB
                } catch {
                    data[key] = val;
                }
            }
        });
        return data;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // --- ADMIN CHECK ---
        if (username === 'Vincent' && password === '12/05/2008') {
            setIsAnimating(true);
            setTimeout(() => {
                onLogin('Vincent');
            }, 800);
            return;
        }

        // --- CHLOÉ CHECK ---
        if (username === 'Chloé' && password === 'chloé') {
            setIsAnimating(true);
            
            // Capture l'avancée actuelle (Local Storage générique) pour l'assigner au profil Chloé
            // Cela permet de ne pas perdre la progression faite avant la connexion
            const currentProgress = saveCurrentDataToUserSlot('Chloé');

            setTimeout(() => {
                // On passe currentProgress comme "cloudData" pour forcer l'import immédiat dans l'App
                onLogin('Chloé', currentProgress);
            }, 800);
            return;
        }

        try {
            // 1. Check Cloud
            const cloudProfile = await onAttemptLogin(username);
            
            if (cloudProfile) {
                // User exists in cloud
                const cloudData = cloudProfile.data || {};
                
                // Simple password check (Insecure for demo but matches requirements)
                if (cloudData.password && cloudData.password !== password) {
                    setError("Mot de passe incorrect.");
                    setIsLoading(false);
                    return;
                }
                
                // Success Cloud Login
                setIsAnimating(true);
                setTimeout(() => {
                    onLogin(username, cloudData);
                }, 800);
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

        // Success Local Login
        setIsAnimating(true);
        setTimeout(() => {
            // Restore local data slot
            const dataStr = localStorage.getItem(DATA_PREFIX + username);
            const localData = dataStr ? JSON.parse(dataStr) : null;
            onLogin(username, localData);
        }, 800);
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (username.trim().length < 3) { setError("Le pseudo est trop court."); setIsLoading(false); return; }
        if (password.length < 4) { setError("Le mot de passe est trop court."); setIsLoading(false); return; }
        if (username.toLowerCase() === 'vincent') { setError("Ce pseudo est réservé."); setIsLoading(false); return; }

        // Check if taken (Local)
        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
        if (usersDb[username]) { setError("Ce pseudo est déjà pris (Local)."); setIsLoading(false); return; }

        // Check if taken (Cloud)
        try {
            const cloudProfile = await onAttemptLogin(username);
            if (cloudProfile) { setError("Ce pseudo est déjà pris (Cloud)."); setIsLoading(false); return; }
        } catch(e) {}

        // --- REGISTER SUCCESS ---
        
        // 1. Save Local Creds
        usersDb[username] = password;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));

        // 2. Capture Current Data
        const currentData = saveCurrentDataToUserSlot(username);
        // Embed password in data for our simple cloud logic
        currentData.password = password;

        setIsAnimating(true);
        setTimeout(() => {
            onLogin(username, currentData); // This will trigger the initial save to cloud in App
        }, 800);
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
                <button 
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 group"
                    title="Mode Visiteur (Accès Menu)"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            <div className="relative mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                <div className="font-script text-8xl text-white transform -rotate-6 z-10 drop-shadow-[0_0_15px_#00f3ff]">Neon</div>
                <div className="font-script text-7xl text-neon-pink transform -rotate-3 -mt-6 ml-12 drop-shadow-[0_0_15px_#ff00ff]">Arcade</div>
            </div>

            <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-700 delay-200">
                
                <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                    <button 
                        onClick={() => { setMode('LOGIN'); setError(null); }}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        CONNEXION
                    </button>
                    <button 
                        onClick={() => { setMode('REGISTER'); setError(null); }}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-neon-pink text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        INSCRIPTION
                    </button>
                </div>

                <h2 className="text-xl font-black text-white italic text-center mb-2">
                    {mode === 'LOGIN' ? 'BON RETOUR' : 'CRÉER UN COMPTE'}
                </h2>
                <p className="text-gray-400 text-center text-xs mb-6 flex items-center justify-center gap-1">
                    <Cloud size={12}/> Sauvegarde Cloud Activée
                </p>

                <form onSubmit={mode === 'LOGIN' ? handleLoginSubmit : handleRegisterSubmit} className="flex flex-col gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="text-gray-500 group-focus-within:text-neon-blue transition-colors" size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Pseudo" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Key className="text-gray-500 group-focus-within:text-neon-pink transition-colors" size={20} />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mot de passe" 
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink/50 transition-all font-bold"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs font-bold text-center bg-red-900/20 py-2 rounded border border-red-500/50 animate-pulse">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || !username.trim() || !password.trim()}
                        className={`group relative w-full py-4 rounded-xl font-black text-white tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden ${mode === 'LOGIN' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-pink-600 to-purple-600'}`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? 'CONNEXION...' : mode === 'LOGIN' ? (
                                <>SE CONNECTER <LogIn size={20} /></>
                            ) : (
                                <>JOUER & SAUVEGARDER <UserPlus size={20} /></>
                            )}
                        </span>
                    </button>
                </form>
            </div>

            <div className="mt-8 text-gray-500 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-1000 delay-500">
                <Sparkles size={12} className="text-yellow-500" />
                <span>CROSS-DEVICE READY</span>
                <Sparkles size={12} className="text-yellow-500" />
            </div>
        </div>
    );
};
