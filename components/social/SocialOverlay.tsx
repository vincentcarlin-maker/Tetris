
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MessageSquare, Globe, Home as HomeIcon } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency, BADGES_CATALOG } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { OnlineUser } from '../../hooks/useSupabase';
import { useGlobal } from '../../context/GlobalContext';

// Sub-components
import { FriendRequest, PrivateMessage, SUPPORT_ID, Friend } from './types';
import { PlayerProfileModal } from './PlayerProfileModal';
import { ChatView } from './ChatView';
import { FriendsList } from './FriendsList';
import { CommunityView } from './CommunityView';
import { RequestsList } from './RequestsList';

// Re-export specific types if needed by other components, otherwise use internal
export type { FriendRequest };

interface SocialOverlayProps {
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
    isConnectedToSupabase: boolean;
    isSupabaseConfigured: boolean;
    onUnreadChange?: (count: number) => void;
    friendRequests: FriendRequest[];
    setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
    activeTabOverride?: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS';
    onTabChangeOverride?: (tab: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS') => void;
}

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ 
    audio, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured, 
    onUnreadChange, friendRequests, setFriendRequests, activeTabOverride, onTabChangeOverride 
}) => {
    const { currency, setCurrentView, syncDataWithCloud } = useGlobal();
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog, friends, addFriend, removeFriend } = currency;
    const { playCoin, playVictory, playLand } = audio;
    
    const [localTab, setLocalTab] = useState<'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const socialTab = activeTabOverride || localTab;
    const setSocialTab = onTabChangeOverride || setLocalTab;

    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    const [friendsSearchTerm, setFriendsSearchTerm] = useState('');
    const [isCommunitySearching, setIsCommunitySearching] = useState(false);

    const stateRef = useRef({ friends, activeChatId, username, isConnectedToSupabase, onlineUsers });

    useEffect(() => {
        stateRef.current = { friends, activeChatId, username, isConnectedToSupabase, onlineUsers };
    }, [friends, activeChatId, username, isConnectedToSupabase, onlineUsers]);

    const isMessagingCategory = socialTab === 'FRIENDS' || socialTab === 'CHAT';

    useEffect(() => { if (onUnreadChange) onUnreadChange(unreadCount); }, [unreadCount, onUnreadChange]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isSupabaseConfigured && username) {
                DB.getUnreadCount(username).then(count => setUnreadCount(count));
                DB.getPendingRequests(username).then(reqs => {
                    setFriendRequests(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const newReqs = reqs.filter((r: any) => !existingIds.has(r.id));
                        return [...prev, ...newReqs];
                    });
                });
                DB.getMessages(username, SUPPORT_ID).then(msgs => {
                    if (msgs && msgs.length > 0) {
                        const formatted = msgs.map((m: any) => ({
                            id: m.id.toString(),
                            senderId: m.sender_id,
                            text: m.text,
                            timestamp: new Date(m.created_at).getTime(),
                            read: m.read
                        }));
                        setMessages(prev => ({ ...prev, [SUPPORT_ID]: formatted }));
                    }
                });
            }
        };
        loadInitialData();
    }, [isSupabaseConfigured, username, setFriendRequests]);

    useEffect(() => {
        if (!isSupabaseConfigured || !mp.peerId || !username) return;
        const channel = mp.supabase.channel(`msg_${username}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                const newMsg = payload.new;
                if (newMsg.receiver_id !== username) return;
                
                if (newMsg.text === 'CMD:FRIEND_REQUEST') {
                    DB.getUserProfile(newMsg.sender_id).then(profile => {
                        if (profile) {
                            const newReq = { id: profile.username, name: profile.username, avatarId: profile.data?.avatarId || 'av_bot', frameId: profile.data?.frameId, timestamp: Date.now() };
                            setFriendRequests(prev => {
                                if (prev.some(r => r.id === newReq.id)) return prev;
                                playCoin();
                                return [...prev, newReq];
                            });
                        }
                    });
                    return;
                }
                
                const senderUsername = newMsg.sender_id;
                const onlineSender = onlineUsers.find(u => u.name === senderUsername);
                const senderId = onlineSender ? onlineSender.id : (senderUsername === SUPPORT_ID ? SUPPORT_ID : senderUsername);
                
                setMessages(prev => {
                    const chat = prev[senderId] || [];
                    return { ...prev, [senderId]: [...chat, { id: newMsg.id.toString(), senderId: senderUsername, text: newMsg.text, timestamp: new Date(newMsg.created_at).getTime(), read: false }] };
                });

                if (stateRef.current.activeChatId !== senderId) {
                    setUnreadCount(c => c + 1);
                    playCoin();
                } else {
                    DB.markMessagesAsRead(senderUsername, username);
                }
            }).subscribe();
        return () => { mp.supabase.removeChannel(channel); };
    }, [isSupabaseConfigured, mp.peerId, username, playCoin, setFriendRequests, onlineUsers]);

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'FRIEND_ACCEPT') {
                const sender = data.sender;
                playVictory();
                const newFriend: Friend = { id: sender.id, name: sender.name, avatarId: sender.avatarId, frameId: sender.frameId, status: 'online', lastSeen: Date.now() };
                addFriend(newFriend);
            }
        });
        return () => unsubscribe();
    }, [mp, playVictory, addFriend]);

    const openChat = async (friend: Friend) => {
        setActiveChatId(friend.id);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        
        const unreadInChat = messages[friend.id]?.filter(m => !m.read && m.senderId !== username).length || 0;
        setUnreadCount(c => Math.max(0, c - unreadInChat));

        if (friend.id.startsWith('bot_')) return;
        if (isSupabaseConfigured) {
            setIsLoadingHistory(true);
            try {
                const targetName = friend.id === SUPPORT_ID ? SUPPORT_ID : friend.name;
                await DB.markMessagesAsRead(targetName, username);
                const history = await DB.getMessages(username, targetName);
                const formatted = history.map((m: any) => ({
                    id: m.id.toString(),
                    senderId: m.sender_id,
                    text: m.text,
                    timestamp: new Date(m.created_at).getTime(),
                    read: m.read
                }));
                setMessages(prev => ({ ...prev, [friend.id]: formatted }));
            } finally { setIsLoadingHistory(false); }
        }
    };

    const sendMessage = async (text: string) => {
        if (!activeChatId || !username) return;
        
        const tempId = 'temp_' + Date.now();
        const msg: PrivateMessage = { id: tempId, senderId: username, text, timestamp: Date.now(), read: true, pending: true };
        
        setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));

        if (activeChatId.startsWith('bot_')) {
            setTimeout(() => {
                const botMsg = { id: Date.now().toString(), senderId: activeChatId, text: "Bip bop... Reçu !", timestamp: Date.now(), read: false };
                setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), botMsg] }));
                playCoin();
            }, 1000);
        } else if (isSupabaseConfigured) {
            const targetName = activeChatId === SUPPORT_ID ? SUPPORT_ID : (friends.find(f => f.id === activeChatId) || { name: activeChatId }).name;
            const formattedText = activeChatId === SUPPORT_ID ? `[SUPPORT][OBJ:Message Direct] ${text}` : text;
            
            const res = await DB.sendMessage(username, targetName, formattedText);
            if (res) {
                setMessages(prev => ({ ...prev, [activeChatId]: (prev[activeChatId] || []).map(m => m.id === tempId ? { ...m, id: res.id.toString(), pending: false } : m) }));
            }
        }
    };

    const handlePlayerClick = async (player: any) => {
        playLand();
        // Enrichissement systématique depuis la base de données pour avoir les stats et l'inventaire
        if (isSupabaseConfigured && player.name) {
            try {
                const profile = await DB.getUserProfile(player.name);
                if (profile && profile.data) {
                    const isOnline = onlineUsers.some(u => u.name === player.name);
                    setSelectedPlayer({
                        ...player,
                        stats: profile.data.highScores || {},
                        inventory: profile.data.inventory || [],
                        lastSeen: profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now(),
                        status: isOnline ? 'online' : 'offline'
                    });
                    return;
                }
            } catch (err) {
                console.error("Failed to enrich player profile:", err);
            }
        }
        setSelectedPlayer(player as Friend);
    };

    const sendFriendRequest = async () => {
        if (!selectedPlayer) return;
        
        let targetPeerId = selectedPlayer.id;
        const liveUser = onlineUsers.find(u => u.name === selectedPlayer.name);
        if (liveUser) targetPeerId = liveUser.id;

        if (mp.peerId && targetPeerId && (targetPeerId.startsWith('user_') || targetPeerId.startsWith('peer_'))) {
            mp.sendTo(targetPeerId, {
                type: 'FRIEND_REQUEST',
                sender: { id: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId }
            });
        }

        if (isSupabaseConfigured) {
            await DB.sendFriendRequestDB(username, selectedPlayer.name);
        }

        alert(`Demande d'ami envoyée à ${selectedPlayer.name} !`);
        setSelectedPlayer(null);
    };

    const handleRemoveFriend = (friendName: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce joueur de vos amis ?")) return;
        removeFriend(friendName);
        setSelectedPlayer(null);
    };

    const acceptRequest = (req: FriendRequest) => {
        const newFriend: Friend = { id: req.id, name: req.name, avatarId: req.avatarId, frameId: req.frameId, status: 'online', lastSeen: Date.now() };
        addFriend(newFriend);
        setFriendRequests(prev => prev.filter(r => r.id !== req.id));
        if (isSupabaseConfigured) DB.acceptFriendRequestDB(username, req.name);
        if (mp.peerId) {
            const senderOnline = onlineUsers.find(u => u.name === req.name);
            if (senderOnline) {
                mp.sendTo(senderOnline.id, {
                    type: 'FRIEND_ACCEPT',
                    sender: { id: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId }
                });
            }
        }
        playVictory();
    };

    const declineRequest = (reqId: string) => {
        const req = friendRequests.find(r => r.id === reqId);
        if (!req) return;
        setFriendRequests(prev => prev.filter(r => r.id !== reqId));
        if (isSupabaseConfigured) DB.acceptFriendRequestDB(username, req.name);
    };

    const activeFriend = useMemo(() => {
        if (activeChatId === SUPPORT_ID) {
            return { id: SUPPORT_ID, name: 'Support Technique', avatarId: 'av_bot', frameId: 'fr_neon_blue', status: 'online', lastSeen: Date.now() } as Friend;
        }
        return friends.find(f => f.id === activeChatId || f.name === activeChatId);
    }, [activeChatId, friends]);

    return (
        <div className="h-full w-full flex flex-col bg-black/20 font-sans text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 w-full z-10 flex flex-col shrink-0">
                <div className="p-4 flex items-center justify-between">
                    <button onClick={() => setCurrentView('menu')} className="p-2 bg-gray-800/80 rounded-xl text-gray-400 hover:text-white border border-white/10"><HomeIcon size={20} /></button>
                    <h2 className={`text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r flex items-center gap-2 pr-4 pb-1 ${isMessagingCategory ? 'from-cyan-400 to-blue-500' : 'from-purple-400 to-pink-500'}`}>{isMessagingCategory ? <MessageSquare size={24}/> : <Globe size={24}/>} {isMessagingCategory ? 'MESSAGERIE' : 'HUB SOCIAL'}</h2>
                    <div className="w-10"></div>
                </div>
                <div className="flex p-2 gap-2 bg-black/20 mx-4 mb-2 rounded-xl">
                    <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'FRIENDS' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>DISCUSSIONS</button>
                    <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>EN LIGNE</button>
                    <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all relative ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                        REQUÊTES {friendRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center border border-black">{friendRequests.length}</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col relative pb-4 custom-scrollbar">
                {socialTab === 'CHAT' && activeFriend ? (
                    <ChatView activeFriend={activeFriend} messages={messages[activeChatId!] || []} currentUsername={username} avatarsCatalog={avatarsCatalog} framesCatalog={framesCatalog} onBack={() => setSocialTab('FRIENDS')} onOpenProfile={handlePlayerClick} onSendMessage={sendMessage} isLoadingHistory={isLoadingHistory} mp={mp}/>
                ) : socialTab === 'FRIENDS' ? (
                    <FriendsList friends={friends} messages={messages} currentUsername={username} avatarsCatalog={avatarsCatalog} framesCatalog={framesCatalog} onOpenChat={openChat} searchTerm={friendsSearchTerm} onSearchChange={setFriendsSearchTerm}/>
                ) : socialTab === 'COMMUNITY' ? (
                    <CommunityView myPeerId={mp.peerId} currentUsername={username} friends={friends} onlineUsers={onlineUsers} avatarsCatalog={avatarsCatalog} framesCatalog={framesCatalog} onPlayerClick={handlePlayerClick} isSearching={isCommunitySearching} onSearch={async (query) => { setIsCommunitySearching(true); const results = await DB.searchUsers(query); setIsCommunitySearching(false); return results; }}/>
                ) : (
                    <RequestsList requests={friendRequests} avatarsCatalog={avatarsCatalog} onAccept={acceptRequest} onDecline={declineRequest}/>
                )}
            </div>

            {selectedPlayer && (
                <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onAddFriend={sendFriendRequest} onRemoveFriend={() => handleRemoveFriend(selectedPlayer.name)} onOpenChat={openChat} isFriend={friends.some(f => f.name === selectedPlayer.name)} avatarsCatalog={avatarsCatalog} framesCatalog={framesCatalog} badgesCatalog={BADGES_CATALOG}/>
            )}
        </div>
    );
};
