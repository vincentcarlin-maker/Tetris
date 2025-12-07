
import React, { useState } from 'react';
import { User, ArrowRight, Sparkles, X } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (username: string) => void;
    onCancel?: () => void; // Permet de fermer la fenêtre sans se connecter
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCancel }) => {
    const [username, setUsername] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim().length > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                onLogin(username.trim());
            }, 800); // Wait for exit animation
        }
    };

    const handleClose = () => {
        setIsAnimating(true);
        setTimeout(() => {
            if (onCancel) onCancel();
        }, 500);
    };

    return (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#020202]/90 backdrop-blur-md transition-opacity duration-700 ${isAnimating ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-black pointer-events-none"></div>
            
            {/* Close Button (Only if onCancel is provided) */}
            {onCancel && (
                <button 
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 group"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {/* Logo Area */}
            <div className="relative mb-12 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
                <div className="font-script text-8xl text-white transform -rotate-6 z-10 drop-shadow-[0_0_15px_#00f3ff]">Neon</div>
                <div className="font-script text-7xl text-neon-pink transform -rotate-3 -mt-6 ml-12 drop-shadow-[0_0_15px_#ff00ff]">Arcade</div>
                <div className="absolute -inset-10 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 blur-xl rounded-full mix-blend-screen animate-pulse"></div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-700 delay-200">
                <h2 className="text-2xl font-black text-white italic text-center mb-2">CONNEXION REQUISE</h2>
                <p className="text-gray-400 text-center text-sm mb-8">Crée un pseudo pour jouer et sauvegarder ta progression.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="text-gray-500 group-focus-within:text-neon-blue transition-colors" size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Pseudo..." 
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition-all font-bold text-lg"
                            maxLength={12}
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={!username.trim()}
                        className="group relative w-full py-4 bg-gradient-to-r from-neon-blue to-purple-600 rounded-xl font-black text-white tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                            JOUER <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </form>
            </div>

            <div className="mt-8 text-gray-500 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-1000 delay-500">
                <Sparkles size={12} className="text-yellow-500" />
                <span>SAUVEGARDE AUTOMATIQUE</span>
                <Sparkles size={12} className="text-yellow-500" />
            </div>
        </div>
    );
};
