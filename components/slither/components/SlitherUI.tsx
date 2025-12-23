
import React, { useState } from 'react';
import { Home, RefreshCw, Trophy, Coins, Zap, User, Globe, Skull, Server, Signal, Palette } from 'lucide-react';
import { SERVERS } from '../constants';
import { OnlineUser } from '../../hooks/useSupabase';
import { QuickLocker } from '../../common/QuickLocker';
import { useCurrency } from '../../../hooks/useCurrency';

interface SlitherUIProps {
    gameState: string;
    gameMode: string;
    score: number;
    rank: { current: number, total: number };
    earnedCoins: number;
    leaderboard: { name: string, score: number, isMe: boolean }[];
    onlineUsers: OnlineUser[];
    isBoosting: boolean;
    onStartSolo: () => void;
    onSetMode: (mode: 'SOLO' | 'ONLINE') => void;
    onJoinServer: (id: string) => void;
    onBackToMenu: () => void;
    onBoostStart: () => void;
    onBoostEnd: () => void;
    onQuit: () => void;
    mp: any;
}

export const SlitherUI: React.FC<SlitherUIProps> = ({
    gameState, gameMode, score, rank, earnedCoins, leaderboard, onlineUsers, isBoosting,
    onStartSolo, onSetMode, onJoinServer, onBackToMenu, onBoostStart, onBoostEnd, onQuit, mp
}) => {
    const { 
        currentSlitherSkinId, selectSlitherSkin, ownedSlitherSkins, slitherSkinsCatalog,
        currentSlitherAccessoryId, selectSlitherAccessory, ownedSlitherAccessories, slitherAccessoriesCatalog
    } = useCurrency();
    
    const [lockerTab, setLockerTab] = useState<'NONE' | 'SKINS' | 'ACCESSORIES'>('NONE');

    if (gameState === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
                <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-black pointer-events-none"></div>
                <div className="fixed inset-0 bg-[linear-gradient(rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                    <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <Zap size={56} className="text-indigo-400 drop-shadow-[0_0_25px_rgba(129,140,248,0.8)] animate-pulse hidden md:block" />
                            <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-[0_0_30px_rgba(129,140,248,0.6)] tracking-tighter w-full">
                                CYBER<br className="md:hidden"/> SERPENT
                            </h1>
                            <Zap size={56} className="text-indigo-400 drop-shadow-[0_0_25px_rgba(129,140,248,0.8)] animate-pulse hidden md:block" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                        <button onClick={onStartSolo} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-indigo-500/50 hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]"><User size={32} className="text-indigo-400" /></div>
                                <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-indigo-300 transition-colors">SOLO</h2>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Défiez les sentinelles du système.</p>
                            </div>
                        </button>

                        <button onClick={() => onSetMode('ONLINE')} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-green-500/50 hover:shadow-[0_0_50px_rgba(34,197,94,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]"><Globe size={32} className="text-green-400" /></div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-green-300 transition-colors">EN LIGNE</h2>
                                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black animate-pulse">LIVE</span>
                                </div>
                                <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Duel de survie sur la grille mondiale.</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 flex gap-4 w-full max-w-sm md:max-w-3xl">
                        <button onClick={() => setLockerTab('SKINS')} className="flex-1 py-4 bg-gray-900/80 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                            <Palette size={18}/> VESTIAIRE SKINS
                        </button>
                        <button onClick={() => setLockerTab('ACCESSORIES')} className="flex-1 py-4 bg-gray-900/80 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                            <User size={18}/> ACCESSOIRES
                        </button>
                    </div>

                    <button onClick={onQuit} className="mt-12 text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                </div>

                {lockerTab === 'SKINS' && (
                    <QuickLocker 
                        title="Vos Skins Serpent"
                        items={slitherSkinsCatalog}
                        ownedIds={ownedSlitherSkins}
                        currentId={currentSlitherSkinId}
                        onSelect={selectSlitherSkin}
                        onClose={() => setLockerTab('NONE')}
                        renderPreview={(skin) => (
                            <div className="w-12 h-12 rounded-full border-2" style={{ background: `linear-gradient(to right, ${skin.primaryColor}, ${skin.secondaryColor})`, borderColor: 'rgba(255,255,255,0.4)', boxShadow: `0 0 15px ${skin.glowColor}80` }}></div>
                        )}
                    />
                )}

                {lockerTab === 'ACCESSORIES' && (
                    <QuickLocker 
                        title="Vos Accessoires Cyber"
                        items={slitherAccessoriesCatalog}
                        ownedIds={ownedSlitherAccessories}
                        currentId={currentSlitherAccessoryId}
                        onSelect={selectSlitherAccessory}
                        onClose={() => setLockerTab('NONE')}
                        renderPreview={(acc) => {
                            const Icon = acc.icon;
                            return <Icon size={32} style={{ color: acc.color }} />;
                        }}
                    />
                )}
            </div>
        );
    }

    if (gameState === 'SERVER_SELECT') {
        return (
             <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205]/95 backdrop-blur-xl p-6 overflow-y-auto touch-auto">
                 <div className="w-full max-w-2xl flex flex-col items-center min-h-full justify-center py-10">
                     <h2 className="text-3xl md:text-4xl font-black text-white italic mb-8 flex items-center gap-3 text-center"><Globe size={40} className="text-indigo-400" /> SÉLECTION SERVEUR</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                         {SERVERS.map(server => {
                             const count = onlineUsers.filter(u => u.gameActivity === server.id).length;
                             const load = count / server.max;
                             const loadColor = load > 0.8 ? 'bg-red-500' : load > 0.5 ? 'bg-yellow-500' : 'bg-green-500';
                             return (
                                 <button key={server.id} onClick={() => onJoinServer(server.id)} className="bg-gray-900 border-2 border-white/10 hover:border-indigo-400 rounded-2xl p-6 text-left transition-all hover:scale-105 group relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Server size={64} /></div>
                                     <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300">{server.name}</h3>
                                     <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">{server.region}</p>
                                     <div className="flex items-center justify-between mt-auto">
                                         <div className="flex items-center gap-2">
                                             <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full ${loadColor}`} style={{ width: `${Math.min(100, load * 100)}%` }}></div></div>
                                             <span className="text-xs font-mono text-white">{count}/{server.max}</span>
                                         </div>
                                         <div className="flex items-center gap-1 text-[10px] text-gray-400"><Signal size={12} className={server.ping < 50 ? 'text-green-500' : 'text-yellow-500'} />{server.ping}ms</div>
                                     </div>
                                 </button>
                             );
                         })}
                     </div>
                     <button onClick={onBackToMenu} className="mt-8 text-gray-500 hover:text-white underline text-sm py-4">Retour</button>
                 </div>
             </div>
        );
    }

    if (gameState === 'PLAYING' || gameState === 'DYING') {
        return (
            <>
                <div className="absolute top-6 left-6 z-20 flex gap-4 items-center pointer-events-none">
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuit(); }} 
                        className="p-3 bg-gray-900/90 rounded-2xl text-white pointer-events-auto border border-white/10 active:scale-95 transition-all shadow-xl"
                    >
                        <Home size={24}/>
                    </button>
                    
                    <div className="flex flex-col ml-2">
                        <span className="text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{Math.floor(score)}</span>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase">Rang: {rank.current} / {rank.total}</span>
                    </div>
                </div>

                <div className="absolute top-6 right-6 z-20 bg-black/20 border border-white/5 p-2.5 rounded-2xl w-36 backdrop-blur-md shadow-2xl">
                    <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5 flex items-center gap-2"><Trophy size={10}/> Records</h4>
                    {leaderboard.map((u, i) => (
                        <div key={i} className={`flex justify-between text-[9px] mb-1 ${u.isMe ? 'text-indigo-400 font-black animate-pulse' : 'text-gray-400'}`}>
                            <span className="truncate w-20">{i+1}. {u.name}</span>
                            <span className="font-mono">{Math.floor(u.score)}</span>
                        </div>
                    ))}
                </div>
            
                <button 
                    onMouseDown={onBoostStart} onMouseUp={onBoostEnd}
                    onTouchStart={onBoostStart} onTouchEnd={onBoostEnd}
                    className={`absolute bottom-10 left-10 z-40 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 transition-all active:scale-110 ${isBoosting ? 'bg-yellow-400 border-white text-black shadow-[0_0_30px_#facc15]' : 'bg-gray-900/80 border-indigo-500/50 text-indigo-500'}`}
                >
                    <Zap size={32} fill={isBoosting ? "black" : "none"} />
                    <span className="text-[10px] font-black tracking-tighter">BOOST</span>
                </button>
            </>
        );
    }

    if (gameState === 'GAMEOVER') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in p-8 text-center">
                <Skull size={100} className="text-red-500 mb-8 drop-shadow-[0_0_30px_#ef4444]" />
                <h2 className="text-6xl font-black italic text-white mb-4">ÉCHOUÉ !</h2>
                <p className="text-5xl font-black text-white font-mono mb-10">{Math.floor(score)}</p>
                {earnedCoins > 0 && <div className="mb-10 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500/50"><Coins className="text-yellow-400" size={28} /><span className="text-yellow-100 font-black text-2xl">+{earnedCoins}</span></div>}
                <div className="flex gap-4 w-full max-w-xs">
                    <button onClick={() => { if(gameMode === 'ONLINE') onJoinServer(SERVERS[0].id); else onStartSolo(); }} className="flex-1 py-4 bg-indigo-600 text-white font-black tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={24} /> REJOUER</button>
                    <button onClick={onBackToMenu} className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-2xl hover:bg-gray-700">MENU</button>
                </div>
            </div>
        );
    }

    return null;
};
