
import React, { useMemo } from 'react';
import { Search, MessageSquare, LifeBuoy, ShieldCheck } from 'lucide-react';
import { Friend, PrivateMessage, SUPPORT_ID } from './types';
import { Avatar, Frame } from '../../hooks/useCurrency';

interface FriendsListProps {
    friends: Friend[];
    messages: Record<string, PrivateMessage[]>;
    currentUsername: string;
    avatarsCatalog: Avatar[];
    framesCatalog: Frame[];
    onOpenChat: (friend: Friend) => void;
    searchTerm: string;
    onSearchChange: (val: string) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ 
    friends, messages, currentUsername, avatarsCatalog, framesCatalog, 
    onOpenChat, searchTerm, onSearchChange 
}) => {
    
    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    const filteredFriends = useMemo(() => {
        return friends.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (a.status === 'online' && b.status !== 'online') return -1;
                if (a.status !== 'online' && b.status === 'online') return 1;
                return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
            });
    }, [friends, searchTerm]);

    const supportMessages = messages[SUPPORT_ID];

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-left-4">
            <div className="px-4 py-3 border-b border-white/5 flex gap-2 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        placeholder="Filtrer mes messages..." 
                        value={searchTerm} 
                        onChange={e => onSearchChange(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors" 
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* CARTE SUPPORT TECHNIQUE */}
                {supportMessages && (
                    <div 
                        onClick={() => onOpenChat({id: SUPPORT_ID, name: 'Support Technique', avatarId: 'av_bot', frameId: 'fr_neon_blue', status: 'online', lastSeen: Date.now()} as any)} 
                        className="flex items-center gap-3 p-3 hover:bg-cyan-900/20 rounded-2xl cursor-pointer transition-all group border border-cyan-500/20 bg-gray-800/60 mb-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center relative border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]`}>
                            <LifeBuoy size={24} className="text-white" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-[0_0_5px_#22c55e]"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="font-black text-sm text-cyan-400 group-hover:text-white truncate flex items-center gap-1"><ShieldCheck size={12}/> SUPPORT TECHNIQUE</span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                    {new Date(supportMessages[supportMessages.length - 1].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className={`text-xs truncate ${supportMessages.some(m => !m.read && m.senderId !== currentUsername) ? 'text-white font-bold' : 'text-gray-400 italic'}`}>
                                {supportMessages[supportMessages.length - 1].text.replace(/\[SUPPORT_REPLY\]/, '')}
                            </p>
                        </div>
                    </div>
                )}

                {filteredFriends.length === 0 && !supportMessages ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <MessageSquare size={48} className="opacity-20 mb-4" />
                        <p className="text-sm font-bold">Aucune discussion active</p>
                    </div>
                ) : (
                    filteredFriends.map(friend => {
                        const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                        const friendMsgs = messages[friend.id];
                        const lastMsg = friendMsgs?.[friendMsgs.length - 1];
                        
                        return (
                            <div key={friend.id} onClick={() => onOpenChat(friend)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/5 bg-gray-800/40 mb-2">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border-2 ${getFrameClass(friend.frameId)}`}>
                                    <avatar.icon size={24} className={avatar.color} />
                                    {friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-[0_0_5px_#22c55e]"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-sm text-gray-200 group-hover:text-white truncate">{friend.name}</span>
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                            {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${friendMsgs?.some(m => !m.read && m.senderId !== currentUsername) ? 'text-white font-bold' : 'text-gray-500'}`}>
                                        {lastMsg ? (lastMsg.senderId === currentUsername ? 'Toi : ' : '') + lastMsg.text : 'Démarrer la discussion'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
