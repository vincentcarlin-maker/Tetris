
import React from 'react';
import { Coins, User, Users, RefreshCw } from 'lucide-react';

interface TopBarProps {
    isAuthenticated: boolean;
    coins: number;
    onLoginRequest?: () => void;
    onOpenSocial?: (tab: 'COMMUNITY') => void;
    onlineCount: number;
    onReload: () => void;
    language: string;
    onCoinsRef?: (el: HTMLDivElement | null) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    isAuthenticated, coins, onLoginRequest, onOpenSocial, onlineCount, 
    onReload, language, onCoinsRef 
}) => {
    return (
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
            {isAuthenticated ? (
                <div ref={onCoinsRef} className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                </div>
            ) : (
                <button onClick={onLoginRequest} className="flex items-center gap-2 bg-neon-blue/20 backdrop-blur-md px-4 py-2 rounded-full border border-neon-blue/50 hover:bg-neon-blue/40 transition-colors animate-pulse">
                    <User className="text-neon-blue" size={20} />
                    <span className="text-neon-blue font-bold text-sm uppercase">{language === 'fr' ? 'SE CONNECTER' : 'LOGIN'}</span>
                </button>
            )}
            <div className="flex gap-3">
                {isAuthenticated && onOpenSocial && (
                    <button 
                        onClick={() => onOpenSocial('COMMUNITY')} 
                        className="flex items-center gap-2 px-3 py-2 bg-green-900/40 text-green-400 rounded-full border border-green-500/30 font-bold text-xs hover:bg-green-500/20 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)] active:scale-95"
                        title={language === 'fr' ? 'Amis connectés' : 'Online Friends'}
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                        <Users size={16} />
                        <span>{onlineCount}</span>
                    </button>
                )}
                <button onClick={onReload} className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform" title="Actualiser"><RefreshCw size={20} /></button>
            </div>
        </div>
    );
};
