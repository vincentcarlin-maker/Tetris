
import React, { useState, useEffect } from 'react';
import { User, ArrowRight, Sparkles, X, Lock, Key, LogIn, UserPlus } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (username: string) => void;
    onCancel?: () => void;
}

// Clés pour le stockage simulé des utilisateurs
const USERS_DB_KEY = 'neon_users_db';
const DATA_PREFIX = 'neon_data_';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

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
            if (val) data[key] = val;
        });
        
        localStorage.setItem(DATA_PREFIX + user, JSON.stringify(data));
    };

    // Fonction utilitaire pour charger les données d'un utilisateur dans le localStorage actif
    const loadUserDataToActive = (user: string) => {
        const dataStr = localStorage.getItem(DATA_PREFIX + user);
        if (dataStr) {
            const data = JSON.parse(dataStr);
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
        } else {
            // Nouvel utilisateur sans données (ou Admin reset) : On nettoie pour partir de zéro
            // Sauf si c'est l'admin, on laisse useCurrency gérer l'illimité
            const keysToClear = [
                'neon-coins', 'neon-inventory', 'neon-avatar', 'neon-owned-avatars',
                'neon-frame', 'neon-owned-frames', 'neon-wallpaper', 'neon-owned-wallpapers',
                'neon-title', 'neon-owned-titles', 'neon-mallet', 'neon-owned-mallets',
                'neon-highscores', 'neon_daily_quests', 'neon_streak', 'neon_last_login'
            ];
            keysToClear.forEach(key => localStorage.removeItem(key));
            
            // Initialisation de base
            localStorage.setItem('neon-coins', '0');
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // --- ADMIN CHECK ---
        if (username === 'Vincent' && password === '12/05/2008') {
            setIsAnimating(true);
            setTimeout(() => {
                // Pas besoin de charger de données pour l'admin, useCurrency gère l'override
                onLogin('Vincent');
            }, 800);
            return;
        }

        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');

        if (!usersDb[username]) {
            setError("Ce compte n'existe pas.");
            return;
        }

        if (usersDb[username] !== password) {
            setError("Mot de passe incorrect.");
            return;
        }

        // Connexion réussie
        setIsAnimating(true);
        setTimeout(() => {
            // 1. Sauvegarder les données "invité" ou "précédent" si nécessaire (optionnel, ici on écrase)
            // 2. Charger les données du joueur
            loadUserDataToActive(username);
            onLogin(username);
        }, 800);
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (username.trim().length < 3) {
            setError("Le pseudo est trop court.");
            return;
        }
        if (password.length < 4) {
            setError("Le mot de passe est trop court.");
            return;
        }
        if (username.toLowerCase() === 'vincent') {
            setError("Ce pseudo est réservé.");
            return;
        }

        const usersDb = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');

        if (usersDb[username]) {
            setError("Ce pseudo est déjà pris.");
            return;
        }

        // Création du compte
        usersDb[username] = password;
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));

        // --- DATA RECOVERY ---
        // On sauvegarde l'état ACTUEL du localStorage (celui du mode invité) dans le slot du nouvel utilisateur.
        // Ainsi, il récupère sa progression.
        saveCurrentDataToUserSlot(username);

        setIsAnimating(true);
        setTimeout(() => {
            onLogin(username);
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
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-black pointer-events-none"></div>
            
            {/* Close Button (Pour le mode visiteur) */}
            {onCancel && (
                <button 
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 group"
                    title="Mode Visiteur (Accès Menu)"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {/* Logo Area */}
            <div className="relative mb-8 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                <div className="font-script text-8xl text-white transform -rotate-6 z-10 drop-shadow-[0_0_15px_#00f3ff]">Neon</div>
                <div className="font-script text-7xl text-neon-pink transform -rotate-3 -mt-6 ml-12 drop-shadow-[0_0_15px_#ff00ff]">Arcade</div>
                <div className="absolute -inset-10 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 blur-xl rounded-full mix-blend-screen animate-pulse"></div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-700 delay-200">
                
                {/* Tabs */}
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
                <p className="text-gray-400 text-center text-xs mb-6">
                    {mode === 'LOGIN' 
                        ? 'Connecte-toi pour charger ta sauvegarde.' 
                        : 'Tes données actuelles seront sauvegardées sur ce compte.'}
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
                        disabled={!username.trim() || !password.trim()}
                        className={`group relative w-full py-4 rounded-xl font-black text-white tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden ${mode === 'LOGIN' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-pink-600 to-purple-600'}`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            {mode === 'LOGIN' ? (
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
                <span>SAUVEGARDE SÉCURISÉE</span>
                <Sparkles size={12} className="text-yellow-500" />
            </div>
        </div>
    );
};
