
import React from 'react';
import { Home, Gamepad2, ShoppingBag, MessageSquare } from 'lucide-react';

interface BottomNavProps {
    currentView: string;
    onNavigate: (view: any) => void;
    onToggleSocial: () => void;
    unreadCount: number;
    showSocial: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, onToggleSocial, unreadCount, showSocial }) => {
    const isMenu = currentView === 'menu';
    const isShop = currentView === 'shop';

    const NavButton = ({ 
        icon: Icon, 
        label, 
        active, 
        onClick, 
        badge 
    }: { 
        icon: any, 
        label: string, 
        active: boolean, 
        onClick: () => void,
        badge?: number 
    }) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${active ? 'text-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : ''}`}>
                <Icon size={24} className={active ? 'drop-shadow-[0_0_8px_#00f3ff]' : ''} />
            </div>
            <span className={`text-[10px] font-black tracking-widest mt-0.5 uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
            {badge !== undefined && badge > 0 && (
                <div className="absolute top-1 right-[20%] bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black animate-pulse">
                    {badge > 9 ? '9+' : badge}
                </div>
            )}
            {active && (
                <div className="absolute -bottom-1 w-12 h-1 bg-neon-blue rounded-full shadow-[0_0_10px_#00f3ff] animate-in slide-in-from-bottom-1 duration-300"></div>
            )}
        </button>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[250] px-4 pb-4 pointer-events-none">
            <div className="max-w-md mx-auto w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center justify-around p-1 pointer-events-auto ring-1 ring-white/5">
                <NavButton 
                    icon={Home} 
                    label="Accueil" 
                    active={isMenu && !showSocial} 
                    onClick={() => { onNavigate('menu'); if(showSocial) onToggleSocial(); }} 
                />
                <NavButton 
                    icon={Gamepad2} 
                    label="Le Hub" 
                    active={isMenu && !showSocial} 
                    onClick={() => { onNavigate('menu'); if(showSocial) onToggleSocial(); }} 
                />
                <NavButton 
                    icon={ShoppingBag} 
                    label="Shop" 
                    active={isShop} 
                    onClick={() => { onNavigate('shop'); if(showSocial) onToggleSocial(); }} 
                />
                <NavButton 
                    icon={MessageSquare} 
                    label="Social" 
                    active={showSocial} 
                    onClick={onToggleSocial} 
                    badge={unreadCount}
                />
            </div>
        </div>
    );
};
