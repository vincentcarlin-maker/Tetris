
import React from 'react';
import { X, Trophy, Calendar, MessageSquare, UserPlus, UserMinus, Star, Clock, Send } from 'lucide-react';
import { Friend } from './types';
import { GAME_NAMES } from './types';
import { Avatar, Frame } from '../../hooks/useCurrency';

interface PlayerProfileModalProps {
    player: Friend;
    onClose: () => void;
    onAddFriend: () => void;
    onRemoveFriend: (id: string) => void;
    onOpenChat: (friend: Friend) => void;
    isFriend: boolean;
    isPending: boolean; // Nouveau: pour bloquer les doublons
    avatarsCatalog: Avatar[];
    framesCatalog: Frame[];
    badgesCatalog: any[];
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ 
    player, onClose, onAddFriend, onRemoveFriend, onOpenChat, isFriend, isPending,
    avatarsCatalog, framesCatalog, badgesCatalog 
}) => {
    
    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    const renderStatsList = (stats?: any) => {
        if (!stats) return <p className="text-gray-600 text-xs italic">Aucune statistique enregistrée.</p>;
        
        const games = Object.keys(stats).filter(k => stats[k] > 0);
        if (games.length === 0) return <p className="text-gray-600 text-xs italic">Le joueur n'a pas encore de records.</p>;

        return (
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {games.map(gameId => {
                    const val = stats[gameId];
                    const displayVal = typeof val === 'object' ? (val.medium || Object.values(val)[0]) : val;
                    return (
                        <div key={gameId} className="bg-black/30 border border-white/5 rounded-lg p-2 flex flex-col items-center">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{GAME_NAMES[gameId] || gameId}</span>
                            <span className="text-xs font-mono font-bold text-cyan-400">{displayVal.toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBadgeCollection = (inventory?: string[]) => {
        if (!inventory || inventory.length === 0) return <p className="text-gray-600 text-xs italic">Aucun badge collectionné.</p>;
        
        const ownedBadges = badgesCatalog.filter(b => inventory.includes(b.id));
        
        return (
            <div className="flex flex-wrap gap-1.5 mt-2">
                {ownedBadges.map(badge => {
                    const BIcon = badge.icon;
                    return (
                        <div key={badge.id} title={badge.name} className={`p-1.5 rounded-lg bg-black/40 border border-white/10 ${badge.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}>
                            <BIcon size={14} />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-gray-900 w-full max-w-sm max-h-[85vh] rounded-[40px] border border-white/20 shadow-2xl overflow-hidden relative flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="h-24 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-b border-white/10 relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white/60 hover:text-white transition-colors"><X size={20}/></button>
                </div>
                
                <div className="px-6 pb-6 flex flex-col items-center -mt-12 overflow-y-auto custom-scrollbar flex-1">
                    <div className={`w-24 h-24 rounded-3xl bg-gray-900 p-1 border-2 mb-4 shrink-0 ${getFrameClass(player.frameId)}`}>
                        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center shadow-2xl`}>
                            {React.createElement((avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0]).icon, { size: 48, className: (avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0]).color })}
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white italic">{player.name}</h2>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-2 h-2 rounded-full ${player.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse' : 'bg-gray-600'}`}></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{player.status === 'online' ? 'En ligne' : 'Hors-ligne'}</span>
                    </div>

                    <div className="w-full mt-6 space-y-4">
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Trophy size={14}/> Records de jeu</h3>
                            {renderStatsList(player.stats)}
                        </div>

                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Star size={14}/> Collection de Badges</h3>
                            {renderBadgeCollection(player.inventory)}
                        </div>

                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={14}/> Dernière connexion</h3>
                                <p className="text-xs text-white font-mono">{player.lastSeen ? new Date(player.lastSeen).toLocaleString() : 'Inconnue'}</p>
                            </div>
                            <Calendar size={20} className="text-gray-600" />
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-8 shrink-0">
                        {isFriend ? (
                            <button 
                                onClick={() => onOpenChat(player)} 
                                className="py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                            >
                                <MessageSquare size={18}/> ENVOYER UN MESSAGE
                            </button>
                        ) : isPending ? (
                            <div className="py-4 bg-gray-800 text-cyan-400 rounded-2xl font-black text-sm border border-cyan-500/30 flex items-center justify-center gap-2 cursor-default">
                                <Clock size={18} className="animate-pulse" /> DEMANDE EN COURS
                            </div>
                        ) : (
                            <button 
                                onClick={onAddFriend} 
                                className="py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                            >
                                <UserPlus size={18}/> AJOUTER EN AMI
                            </button>
                        )}
                        
                        {isFriend && (
                            <button 
                                onClick={() => onRemoveFriend(player.id)} 
                                className="py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-500/20 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <UserMinus size={16} /> SUPPRIMER L'AMI
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
