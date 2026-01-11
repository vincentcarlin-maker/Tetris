
import React from 'react';
import { Coins, User, Users, RefreshCw } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

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
    const { featureFlags } = useGlobal();

    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-3">
            {isAuthenticated ? (
                featureFlags.economy_system ? (
                    <div ref={onCoinsRef} className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                        <Coins className="text-yellow-400" size={14} />
                        <span className="text-yellow-100 font-mono font-bold text-xs">{coins.toLocaleString()}</span>
                    </div>
                ) : <div className="w-8"></div>
            ) : (
                <button onClick={onLoginRequest} className="flex items-center gap-1.5 bg-neon-blue/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-neon-blue/30 hover:bg-neon-blue/30 transition-colors animate-pulse">
                    <User className="text-neon-blue" size={14} />
                    <span className="text-neon-blue font-bold text-[9px] uppercase tracking-wider">{language === 'fr' ? 'CONNECT' : 'LOGIN'}</span>
                </button>
            )}
            
            <div className="flex gap-1.5">
                {isAuthenticated && onOpenSocial && featureFlags.social_module && (
                    <button 
                        onClick={() => onOpenSocial('COMMUNITY')} 
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-green-950/30 text-green-400 rounded-full border border-green-500/20 font-bold text-[9px] hover:bg-green-500/20 transition-all shadow-[0_0_8px_rgba(34,197,94,0.1)] active:scale-95"
                        title={language === 'fr' ? 'Amis connectés' : 'Online Friends'}
                    >
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_3px_#22c55e]"></div>
                        <Users size={12} />
                        <span className="font-mono">{onlineCount}</span>
                    </button>
                )}
                <button 
                    onClick={onReload} 
                    className="p-1.5 bg-gray-900/60 rounded-full text-gray-500 hover:text-white border border-white/5 backdrop-blur-sm active:scale-90 transition-all" 
                    title="Actualiser"
                >
                    <RefreshCw size={14} />
                </button>
            </div>
        </div>
    );
};