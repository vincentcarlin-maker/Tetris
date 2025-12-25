
import React from 'react';
import { Home, Users, ShoppingBag, MessageSquare, Settings } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

interface BottomNavProps {
    currentView: string;
    onNavigate: (view: any) => void;
    onOpenSocial: (tab: 'FRIENDS' | 'COMMUNITY' | 'REQUESTS') => void;
    unreadMessages: number;
    pendingRequests: number;
    showSocial: boolean;
    activeSocialTab: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
    currentView, 
    onNavigate, 
    onOpenSocial, 
    unreadMessages, 
    pendingRequests, 
    showSocial,
    activeSocialTab
}) => {
    const { featureFlags } = useGlobal();
    const isMenu = currentView === 'menu';
    const isShop = currentView === 'shop';
    const isSettings = currentView === 'settings';

    const NavButton = ({ 
        icon: Icon, 
        label, 
        active, 
        onClick, 
        badge,
        activeColor,
        glowColor,
        bgActiveClass
    }: { 
        icon: any, 
        label: string, 
        active: boolean, 
        onClick: () => void,
        badge?: number,
        activeColor: string,
        glowColor: string,
        bgActiveClass: string
    }) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-all relative ${active ? activeColor : 'text-gray-500 hover:text-gray-300'}`}
        >
            <div className={`p-1.5 rounded-xl transition-all ${active ? bgActiveClass : ''}`}>
                <Icon size={22} style={active ? { filter: `drop-shadow(0 0 8px ${glowColor})` } : {}} />
            </div>
            <span className={`text-[9px] font-black tracking-widest mt-0.5 uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
            
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-0.5 right-[18%] bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center border border-black animate-pulse shadow-[0_0_5px_red]">
                    {badge > 9 ? '9+' : badge}
                </div>
            )}
            
            {active && (
                <div className={`absolute -bottom-0.5 w-10 h-0.5 rounded-full animate-in slide-in-from-bottom-1 duration-300`} 
                     style={{ backgroundColor: glowColor, boxShadow: `0 0 10px ${glowColor}` }}></div>
            )}
        </button>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[350] px-4 pb-1.5 pointer-events-none" style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom))' }}>
            <div className="max-w-md mx-auto w-full bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between p-1 pointer-events-auto ring-1 ring-white/5">
                <NavButton 
                    icon={Home} 
                    label="Accueil" 
                    active={isMenu && !showSocial} 
                    onClick={() => onNavigate('menu')} 
                    activeColor="text-neon-blue"
                    glowColor="#00f3ff"
                    bgActiveClass="bg-neon-blue/10"
                />
                
                {featureFlags.social_module && (
                    <NavButton 
                        icon={MessageSquare} 
                        label="Chat" 
                        active={showSocial && (activeSocialTab === 'FRIENDS' || activeSocialTab === 'CHAT')} 
                        onClick={() => onOpenSocial('FRIENDS')} 
                        badge={unreadMessages}
                        activeColor="text-neon-pink"
                        glowColor="#ff00ff"
                        bgActiveClass="bg-neon-pink/10"
                    />
                )}
                
                {featureFlags.social_module && (
                    <NavButton 
                        icon={Users} 
                        label="Social" 
                        active={showSocial && (activeSocialTab === 'COMMUNITY' || activeSocialTab === 'REQUESTS')} 
                        onClick={() => onOpenSocial('COMMUNITY')} 
                        badge={pendingRequests}
                        activeColor="text-neon-green"
                        glowColor="#00ff9d"
                        bgActiveClass="bg-neon-green/10"
                    />
                )}
                
                {featureFlags.economy_system && (
                    <NavButton 
                        icon={ShoppingBag} 
                        label="Shop" 
                        active={isShop && !showSocial} 
                        onClick={() => onNavigate('shop')} 
                        activeColor="text-neon-yellow"
                        glowColor="#ffe600"
                        bgActiveClass="bg-neon-yellow/10"
                    />
                )}
                
                <NavButton 
                    icon={Settings} 
                    label="Réglages" 
                    active={isSettings && !showSocial} 
                    onClick={() => onNavigate('settings')} 
                    activeColor="text-purple-400"
                    glowColor="#c026d3"
                    bgActiveClass="bg-purple-900/20"
                />
            </div>
        </div>
    );
};
