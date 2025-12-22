
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Lock, Edit2, Check, Calendar } from 'lucide-react';

interface UserProfileSummaryProps {
    currency: any;
    isAuthenticated: boolean;
    onLoginRequest?: () => void;
    onLogout: () => void;
    onSelectGame: (game: string) => void;
    streak: number;
    t: any;
    language: string;
}

export const UserProfileSummary: React.FC<UserProfileSummaryProps> = ({ 
    currency, isAuthenticated, onLoginRequest, onLogout, onSelectGame, streak, t, language 
}) => {
    const { username, updateUsername, currentAvatarId, avatarsCatalog, currentFrameId, framesCatalog, currentTitleId, titlesCatalog, inventory, badgesCatalog, playerRank } = currency;
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentAvatar = avatarsCatalog.find((a: any) => a.id === currentAvatarId) || avatarsCatalog[0];
    const currentFrame = framesCatalog.find((f: any) => f.id === currentFrameId) || framesCatalog[0];
    const currentTitle = titlesCatalog.find((t: any) => t.id === currentTitleId);
    const AvatarIcon = currentAvatar.icon;
    const ownedBadges = (badgesCatalog || []).filter((b: any) => inventory.includes(b.id));

    useEffect(() => { if (isEditingName && inputRef.current) inputRef.current.focus(); }, [isEditingName]);

    const handleNameSubmit = (e?: React.FormEvent) => { 
        if (e) e.preventDefault(); 
        if (tempName.trim()) { updateUsername(tempName.trim()); } else { setTempName(username); } 
        setIsEditingName(false); 
    };

    return (
        <div className="w-full bg-black/60 border accent-border rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md relative overflow-hidden group shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
            {isAuthenticated && <button onClick={onLogout} className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-400 transition-colors z-30" title={t.logout}><LogOut size={14} /></button>}
            <div className="flex items-center w-full gap-3 z-10">
                <div onClick={() => isAuthenticated ? onSelectGame('shop') : onLoginRequest && onLoginRequest()} className="relative cursor-pointer hover:scale-105 transition-transform shrink-0">
                    {isAuthenticated ? (
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 flex items-center justify-center relative z-10 border-2 ${currentFrame.cssClass}`}>
                            <div className="w-full h-full bg-black/40 rounded-[8px] flex items-center justify-center backdrop-blur-sm">
                                <AvatarIcon size={32} className={currentAvatar.color} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-800 border-2 border-white/20 flex items-center justify-center relative z-10">
                            <Lock size={24} className="text-gray-500" />
                        </div>
                    )}
                    {isAuthenticated && <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[8px] text-white px-1.5 py-0.5 rounded-full border border-white/20 z-20 font-bold shadow-sm">EDIT</div>}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-2">
                                {isEditingName ? (
                                    <form handleNameSubmit={handleNameSubmit} className="flex items-center gap-2 w-full">
                                        <input ref={inputRef} type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={() => handleNameSubmit()} maxLength={12} className="bg-black/50 border border-neon-blue rounded px-2 py-0.5 text-white font-bold text-base w-full outline-none focus:ring-1 ring-neon-blue/50" />
                                        <button type="submit" className="text-green-400"><Check size={16} /></button>
                                    </form>
                                ) : (
                                    <button onClick={() => { setTempName(username); setIsEditingName(true); }} className="flex items-center gap-2 group/edit truncate">
                                        <h2 className="text-lg font-black text-white italic tracking-wide truncate">{username}</h2>
                                        <Edit2 size={12} className="text-gray-500 group-hover/edit:text-white transition-colors opacity-0 group-hover/edit:opacity-100" />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {currentTitle && currentTitle.id !== 't_none' && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${currentTitle.color} ${currentTitle.shadow || ''} bg-gray-900/80 px-1.5 py-0.5 rounded border border-white/10`}>
                                        {currentTitle.name}
                                    </span>
                                )}
                                <span className={`text-[9px] font-bold tracking-wider uppercase ${playerRank.color}`}>{playerRank.title}</span>
                            </div>
                            {ownedBadges.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
                                    {ownedBadges.map((badge: any) => {
                                        const BIcon = badge.icon;
                                        return (<div key={badge.id} title={badge.name} className={`p-1 rounded-lg bg-black/40 border border-white/10 ${badge.color} shadow-[0_0_8px_rgba(0,0,0,0.5)] flex-shrink-0`}><BIcon size={12} /></div>);
                                    })}
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-1"><div className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold bg-yellow-900/10 px-1.5 py-0.5 rounded border border-yellow-500/20"><Calendar size={10} /> J{streak}</div></div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-1 items-start">
                            <h2 className="text-base font-bold text-gray-400 italic">{language === 'fr' ? 'Mode Visiteur' : 'Guest Mode'}</h2>
                            <button onClick={onLoginRequest} className="text-[10px] bg-neon-blue text-black px-3 py-1.5 rounded font-bold hover:bg-white transition-colors shadow-lg active:scale-95 shadow-[0_0_10px_rgba(0,243,255,0.3)] uppercase">{language === 'fr' ? 'SE CONNECTER / CRÉER' : 'LOGIN / REGISTER'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
