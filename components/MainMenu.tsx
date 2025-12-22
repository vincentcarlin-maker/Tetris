
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Coins, Zap, Trophy, Star, Users, Info } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores, HighScores } from '../hooks/useHighScores';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { DailyQuest } from '../hooks/useDailySystem'; 
import { DailyBonusModal } from './DailyBonusModal';
import { OnlineUser } from '../hooks/useSupabase';
import { InstallGuide } from './pwa/InstallGuide';

// Import sub-components
import { ArcadeLogo } from './main_menu/ArcadeLogo';
import { TopBar } from './main_menu/TopBar';
import { UserProfileSummary } from './main_menu/UserProfileSummary';
import { DailyQuestWidget } from './main_menu/DailyQuestWidget';
import { LeaderboardWidget } from './main_menu/LeaderboardWidget';
import { GameGrid } from './main_menu/GameGrid';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    onLogout: () => void;
    isAuthenticated?: boolean;
    onLoginRequest?: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    dailyData: {
        streak: number;
        showDailyModal: boolean;
        todaysReward: number;
        claimDailyBonus: () => void;
        quests: DailyQuest[];
        claimQuestReward: (id: string) => void;
        claimAllBonus: () => void;
        allCompletedBonusClaimed: boolean;
    };
    onlineUsers: OnlineUser[]; 
    liveUsers?: OnlineUser[]; 
    onOpenSocial?: (tab: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS') => void; 
    disabledGamesList?: string[]; 
    activeEvent?: {
        id: string;
        title: string;
        description: string;
        type: 'XP_BOOST' | 'TOURNAMENT' | 'SPECIAL_QUEST' | 'COMMUNITY';
        active: boolean;
        startDate: string;
        endDate: string;
        theme?: {
            primaryColor: string;
            backgroundImage?: string;
        };
        objectives?: { type: string, target: number, gameIds: string[] }[];
        rewards?: { coins: number, badgeId?: string, skinId?: string };
    };
    eventProgress?: Record<string, number>;
    highScores: HighScores;
}

const FlyingCoin = React.memo(({ startX, startY, targetX, targetY, delay, onComplete }: { startX: number, startY: number, targetX: number, targetY: number, delay: number, onComplete: () => void }) => {
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', top: startY, left: startX, opacity: 1, transform: 'scale(0.5)', zIndex: 100, pointerEvents: 'none', transition: 'none' });
    useEffect(() => {
        const animTimeout = setTimeout(() => {
             setStyle({ position: 'fixed', top: targetY, left: targetX, opacity: 0, transform: 'scale(0.8) rotate(360deg)', zIndex: 100, pointerEvents: 'none', transition: `top 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-in 0.5s, transform 0.8s linear` });
        }, delay * 1000 + 50);
        const endTimeout = setTimeout(onComplete, 800 + delay * 1000 + 50);
        return () => { clearTimeout(animTimeout); clearTimeout(endTimeout); };
    }, [targetX, targetY, delay, onComplete]);
    return (<div style={style} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"><Coins size={24} fill="#facc15" /></div>);
});

export const MainMenu: React.FC<MainMenuProps> = ({ 
    onSelectGame, audio, currency, mp, dailyData, onLogout, isAuthenticated = false, 
    onLoginRequest, onlineUsers, liveUsers, onOpenSocial, disabledGamesList = [], 
    activeEvent, eventProgress, highScores 
}) => {
    const { username, t, language } = currency;
    const { streak, showDailyModal, todaysReward, claimDailyBonus, quests, claimQuestReward } = dailyData;
    
    const [showEventInfo, setShowEventInfo] = useState(false);
    const [flyingCoins, setFlyingCoins] = useState<{id: number, startX: number, startY: number, targetX: number, targetY: number, delay: number}[]>([]);
    
    const coinBalanceRef = useRef<HTMLDivElement>(null);
    const onlineCount = (liveUsers || onlineUsers).filter(u => u.status === 'online' && u.id !== mp.peerId).length;

    const handleGameStart = (gameId: string) => onSelectGame(gameId); 

    const spawnCoins = (startX: number, startY: number, amount: number) => {
        const targetRect = coinBalanceRef.current?.getBoundingClientRect();
        if (!targetRect) return;
        const targetX = targetRect.left + (targetRect.width / 2) - 12; 
        const targetY = targetRect.top + (targetRect.height / 2) - 12;
        const count = Math.min(Math.floor(amount / 10) + 5, 20); 
        const newCoins = [];
        for (let i = 0; i < count; i++) {
            newCoins.push({ id: Date.now() + Math.random(), startX: startX + (Math.random() - 0.5) * 40, startY: startY + (Math.random() - 0.5) * 40, targetX, targetY, delay: i * 0.05 });
        }
        setFlyingCoins(prev => [...prev, ...newCoins]);
    };

    const handleDailyBonusClaim = () => {
        spawnCoins(window.innerWidth / 2, window.innerHeight / 2, todaysReward);
        claimDailyBonus();
    };

    const handleClaim = (q: DailyQuest, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        spawnCoins(rect.left + rect.width / 2, rect.top + rect.height / 2, q.reward);
        audio.playCoin();
        claimQuestReward(q.id);
    };

    useEffect(() => { audio.resumeAudio(); }, [audio]);
    
    useEffect(() => { if (isAuthenticated) mp.updateSelfInfo(username, currency.currentAvatarId, currency.currentMalletId); }, [username, currency.currentAvatarId, currency.currentMalletId, mp, isAuthenticated]);

    const handleReload = () => { window.location.reload(); };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto pb-24">
            
            {flyingCoins.map(coin => <FlyingCoin key={coin.id} startX={coin.startX} startY={coin.startY} targetX={coin.targetX} targetY={coin.targetY} delay={coin.delay} onComplete={() => setFlyingCoins(prev => prev.filter(c => c.id !== coin.id))} />)}
            
            {showDailyModal && isAuthenticated && <DailyBonusModal streak={streak} reward={todaysReward} onClaim={handleDailyBonusClaim} />}
            
            <TopBar 
                isAuthenticated={isAuthenticated} 
                coins={currency.coins} 
                onLoginRequest={onLoginRequest} 
                onOpenSocial={onOpenSocial}
                onlineCount={onlineCount}
                onReload={handleReload}
                language={language}
                onCoinsRef={(el) => { if (el) (coinBalanceRef as any).current = el; }}
            />

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-6 mt-12 pb-10">
                 
                 <ArcadeLogo />

                 {/* NOUVEAU: Guide d'installation intelligent */}
                 <InstallGuide />
                 
                 {activeEvent && (
                     <div 
                        onClick={() => setShowEventInfo(true)}
                        className={`w-full mt-4 p-4 rounded-xl border-2 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-700 backdrop-blur-md cursor-pointer relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                        style={{
                            borderColor: activeEvent.theme?.primaryColor || '#fff',
                            background: activeEvent.theme?.backgroundImage ? `${activeEvent.theme.backgroundImage}` : 'rgba(30, 58, 138, 0.6)'
                        }}
                     >
                         <div className="flex items-center gap-4 z-10">
                             <div className="p-2 rounded-full border-2 bg-black/30" style={{ borderColor: activeEvent.theme?.primaryColor || 'inherit', color: activeEvent.theme?.primaryColor || 'inherit' }}>
                                 {activeEvent.type === 'XP_BOOST' && <Zap size={24} className="animate-pulse"/>}
                                 {activeEvent.type === 'TOURNAMENT' && <Trophy size={24} className="animate-bounce"/>}
                                 {activeEvent.type === 'SPECIAL_QUEST' && <Star size={24} className="animate-spin-slow"/>}
                                 {activeEvent.type === 'COMMUNITY' && <Users size={24} className="animate-pulse"/>}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-[10px] font-black tracking-[0.2em] opacity-80 uppercase" style={{ color: activeEvent.theme?.primaryColor || 'white' }}>{activeEvent.type.replace('_', ' ')}</span>
                                 <span className="font-black text-lg uppercase leading-tight drop-shadow-md text-white">{activeEvent.title}</span>
                             </div>
                         </div>
                         <div className="px-3 py-1 bg-white/20 rounded-lg text-xs font-black tracking-wider animate-pulse border border-white/30 text-white z-10 flex items-center gap-1 uppercase">
                             <Info size={12} /> {language === 'fr' ? 'DÉTAILS' : 'DETAILS'}
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                     </div>
                 )}

                 <UserProfileSummary 
                    currency={currency} 
                    isAuthenticated={isAuthenticated} 
                    onLoginRequest={onLoginRequest} 
                    onLogout={onLogout} 
                    onSelectGame={onSelectGame} 
                    streak={streak} 
                    t={t} 
                    language={language} 
                 />

                 <DailyQuestWidget 
                    quests={quests} 
                    isAuthenticated={isAuthenticated} 
                    language={language} 
                    onClaim={handleClaim} 
                    onGameStart={handleGameStart} 
                 />

                 <LeaderboardWidget 
                    highScores={highScores} 
                    onlineUsers={onlineUsers} 
                    language={language} 
                 />

                 <GameGrid 
                    onSelectGame={handleGameStart} 
                    disabledGames={disabledGamesList} 
                    username={username} 
                    adminModeActive={currency.adminModeActive} 
                    language={language} 
                 />

                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">v3.1 • NEON ARCADE</div>
             </div>
        </div>
    );
}
