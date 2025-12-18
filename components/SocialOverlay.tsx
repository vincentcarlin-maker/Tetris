
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Users, MessageSquare, Send, Copy, Bell, Globe, UserPlus, CheckCircle, XCircle, Activity, Play, Bot, MoreVertical, Smile, ArrowLeft, Search, Inbox, Clock, RefreshCw, UserMinus, X, Trophy, Calendar, Zap } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { DB, supabase } from '../lib/supabaseClient';
import { OnlineUser } from '../hooks/useSupabase';

export interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
}

interface Friend {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    gameActivity?: string; 
    lastMessage?: string;
    lastMessageTime?: number;
    stats?: any;
}

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

interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
    pending?: boolean;
}

const GAME_NAMES: Record<string, string> = {
    'tetris': 'Tetris', 'connect4': 'Connect 4', 'sudoku': 'Sudoku', 'breaker': 'Breaker',
    'pacman': 'Pacman', 'memory': 'Memory', 'battleship': 'Bataille', 'snake': 'Snake',
    'invaders': 'Invaders', 'airhockey': 'Air Hockey', 'mastermind': 'Mastermind',
    'uno': 'Uno', 'watersort': 'Neon Mix', 'checkers': 'Dames', 'runner': 'Neon Run',
    'stack': 'Stack', 'arenaclash': 'Arena Clash', 'skyjo': 'Skyjo', 'lumen': 'Lumen', 'shop': 'Boutique', 'menu': 'Menu'
};

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ 
    audio, currency, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured, 
    onUnreadChange, friendRequests, setFriendRequests, activeTabOverride, onTabChangeOverride 
}) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    const { playCoin, playVictory, playLand } = audio;
    
    const [localTab, setLocalTab] = useState<'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const socialTab = activeTabOverride || localTab;
    const setSocialTab = onTabChangeOverride || setLocalTab;

    const [friends, setFriends] = useState<Friend[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [communitySearch, setCommunitySearch] = useState('');
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [notificationPreview, setNotificationPreview] = useState<{ senderId: string, senderName: string, text: string } | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ friends, activeChatId, username, isConnectedToSupabase, onlineUsers });

    useEffect(() => {
        stateRef.current = { friends, activeChatId, username, isConnectedToSupabase, onlineUsers };
    }, [friends, activeChatId, username, isConnectedToSupabase, onlineUsers]);

    const isMessagingCategory = socialTab === 'FRIENDS' || socialTab === 'CHAT';

    useEffect(() => { if (onUnreadChange) onUnreadChange(unreadCount); }, [unreadCount, onUnreadChange]);

    useEffect(() => {
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) setFriends(parsed.map((f: any) => ({ ...f, status: 'offline' })));
            } catch (e) { localStorage.removeItem('neon_friends'); }
        }
        if (isConnectedToSupabase && username) {
            DB.getUnreadCount(username).then(count => setUnreadCount(count));
            DB.getPendingRequests(username).then(reqs => {
                setFriendRequests(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const newReqs = reqs.filter((r: any) => !existingIds.has(r.id));
                    return [...prev, ...newReqs];
                });
            });
        }
    }, [isConnectedToSupabase, username, setFriendRequests]);

    useEffect(() => {
        if (!isConnectedToSupabase || !supabase || !username) return;
        const channel = supabase.channel(`msg_${username}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.receiver_id !== username) return;
                
                if (newMsg.text === 'CMD:FRIEND_REQUEST') {
                    DB.getUserProfile(newMsg.sender_id).then(profile => {
                        const newReq = {
                            id: newMsg.sender_id,
                            name: newMsg.sender_id,
                            avatarId: profile?.data?.avatarId || 'av_bot',
                            frameId: profile?.data?.frameId,
                            timestamp: Date.now()
                        };
                        setFriendRequests(prev => {
                            if (prev.some(r => r.id === newReq.id)) return prev;
                            playCoin();
                            return [...prev, newReq];
                        });
                    });
                    return;
                }
                
                const senderUsername = newMsg.sender_id;
                const senderId = stateRef.current.onlineUsers.find(u => u.name === senderUsername)?.id || senderUsername;
                
                setMessages(prev => {
                    const chat = prev[senderId] || [];
                    return { ...prev, [senderId]: [...chat, { id: newMsg.id.toString(), senderId, text: newMsg.text, timestamp: new Date(newMsg.created_at).getTime(), read: false }] };
                });

                if (stateRef.current.activeChatId !== senderId) {
                    setUnreadCount(c => c + 1);
                    setNotificationPreview({ senderId, senderName: senderUsername, text: newMsg.text });
                    setTimeout(() => setNotificationPreview(null), 5000);
                    playCoin();
                } else {
                    DB.markMessagesAsRead(senderUsername, username);
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [isConnectedToSupabase, username, playCoin, setFriendRequests]);

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'FRIEND_ACCEPT') {
                const sender = data.sender;
                playVictory();
                setNotificationPreview({ senderId: sender.id, senderName: sender.name, text: "A accepté votre demande d'ami !" });
                setTimeout(() => setNotificationPreview(null), 5000);
                
                const newFriend: Friend = { 
                    id: sender.id, 
                    name: sender.name, 
                    avatarId: sender.avatarId, 
                    frameId: sender.frameId, 
                    status: 'online', 
                    lastSeen: Date.now() 
                };
                
                setFriends(prev => {
                    if (prev.some(f => f.name === newFriend.name)) return prev;
                    const newList = [...prev, newFriend];
                    localStorage.setItem('neon_friends', JSON.stringify(newList));
                    return newList;
                });
            }
        });
        return () => unsubscribe();
    }, [mp, playVictory]);

    useEffect(() => {
        setFriends(prev => prev.map(f => {
            const onlineEntry = onlineUsers.find(u => u.name === f.name);
            const isReallyOnline = onlineEntry && onlineEntry.status === 'online';
            
            return isReallyOnline 
                ? { ...f, id: onlineEntry.id, status: 'online', gameActivity: onlineEntry.gameActivity, lastSeen: onlineEntry.lastSeen, stats: onlineEntry.stats } 
                : { ...f, status: 'offline' };
        }));
    }, [onlineUsers]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChatId, socialTab]);

    const openChat = async (friend: Friend) => {
        setActiveChatId(friend.id);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        
        const unreadInChat = messages[friend.id]?.filter(m => !m.read && m.senderId !== username).length || 0;
        setUnreadCount(c => Math.max(0, c - unreadInChat));

        if (friend.id.startsWith('bot_')) return;
        if (isConnectedToSupabase) {
            setIsLoadingHistory(true);
            try {
                await DB.markMessagesAsRead(friend.name, username);
                const history = await DB.getMessages(username, friend.name);
                const formatted = history.map((m: any) => ({
                    id: m.id.toString(),
                    senderId: m.sender_id === username ? username : friend.id,
                    text: m.text,
                    timestamp: new Date(m.created_at).getTime(),
                    read: m.read
                }));
                setMessages(prev => ({ ...prev, [friend.id]: formatted }));
            } finally { setIsLoadingHistory(false); }
        }
    };

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeChatId || !username) return;
        
        const text = chatInput.trim();
        const tempId = 'temp_' + Date.now();
        const msg: PrivateMessage = { id: tempId, senderId: username, text, timestamp: Date.now(), read: true, pending: true };
        
        setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
        setChatInput('');

        if (activeChatId.startsWith('bot_')) {
            setTimeout(() => {
                const botMsg = { id: Date.now().toString(), senderId: activeChatId, text: "Bip bop... Reçu !", timestamp: Date.now(), read: false };
                setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), botMsg] }));
                playCoin();
            }, 1000);
        } else if (isConnectedToSupabase) {
            const friend = friends.find(f => f.id === activeChatId) || { name: activeChatId };
            const res = await DB.sendMessage(username, friend.name, text);
            if (res) {
                setMessages(prev => ({ ...prev, [activeChatId]: (prev[activeChatId] || []).map(m => m.id === tempId ? { ...m, id: res.id.toString(), pending: false } : m) }));
            }
        }
    };

    const sendFriendRequest = async () => {
        if (!selectedPlayer) return;
        if (friends.some(f => f.name === selectedPlayer.name)) {
            openChat(friends.find(f => f.name === selectedPlayer.name)!);
            return;
        }

        let targetPeerId = selectedPlayer.id;
        if (!targetPeerId.startsWith('user_')) {
            const liveUser = onlineUsers.find(u => u.name === selectedPlayer.name);
            if (liveUser) targetPeerId = liveUser.id;
        }

        if (mp.peerId && targetPeerId.startsWith('user_')) {
            mp.sendTo(targetPeerId, {
                type: 'FRIEND_REQUEST',
                sender: { id: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId }
            });
        }

        if (isConnectedToSupabase) {
            await DB.sendFriendRequestDB(username, selectedPlayer.name);
        }

        alert(`Demande d'ami envoyée à ${selectedPlayer.name} !`);
        setSelectedPlayer(null);
    };

    const removeFriend = (friendId: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce joueur de vos amis ?")) return;
        setFriends(prev => {
            const newList = prev.filter(f => f.id !== friendId);
            localStorage.setItem('neon_friends', JSON.stringify(newList));
            return newList;
        });
        setSelectedPlayer(null);
    };

    const acceptRequest = (req: FriendRequest) => {
        const newFriend: Friend = { id: req.id, name: req.name, avatarId: req.avatarId, frameId: req.frameId, status: 'online', lastSeen: Date.now() };
        setFriends(prev => {
            if (prev.some(f => f.name === newFriend.name)) return prev;
            const newList = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(newList));
            return newList;
        });
        setFriendRequests(prev => prev.filter(r => r.id !== req.id));
        if (isConnectedToSupabase) DB.acceptFriendRequestDB(username, req.id);
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
        setFriendRequests(prev => prev.filter(r => r.id !== reqId));
        if (isConnectedToSupabase) DB.acceptFriendRequestDB(username, reqId); 
    };
    
    const handleCommunitySearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!communitySearch.trim() || !isConnectedToSupabase) return;
        setIsSearching(true);
        const results = await DB.searchUsers(communitySearch);
        const filtered = results.filter((u: any) => 
            u.name !== username && !friends.some(f => f.name === u.name)
        ).map((u: any) => {
            const onlineMatch = onlineUsers.find(o => o.name === u.name);
            return {
                ...u,
                id: onlineMatch ? onlineMatch.id : u.id,
                status: onlineMatch ? 'online' : 'offline'
            };
        });
        setSearchResults(filtered);
        setIsSearching(false);
    };

    const clearSearch = () => {
        setCommunitySearch('');
        setSearchResults([]);
    };

    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    const filteredFriends = useMemo(() => {
        return friends.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (a.status === 'online' && b.status !== 'online') return -1;
                if (a.status !== 'online' && b.status === 'online') return 1;
                return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
            });
    }, [friends, searchTerm]);

    const onlineOnlyCommunity = useMemo(() => {
        return onlineUsers.filter(p => {
            if (p.id === mp.peerId || p.name === username) return false;
            return p.status === 'online';
        }).reduce((acc: OnlineUser[], current) => {
            if (!acc.find(item => item.name === current.name)) acc.push(current);
            return acc;
        }, []);
    }, [onlineUsers, mp.peerId, username]);

    const activeFriend = useMemo(() => friends.find(f => f.id === activeChatId), [activeChatId, friends]);

    const handlePlayerClick = async (player: any) => {
        playLand();
        // Si les stats manquent et que Supabase est là, on tente de récupérer le profil complet
        if (!player.stats && isConnectedToSupabase && player.name) {
            const profile = await DB.getUserProfile(player.name);
            if (profile && profile.data) {
                setSelectedPlayer({
                    ...player,
                    stats: profile.data.highScores,
                    lastSeen: new Date(profile.updated_at).getTime()
                });
                return;
            }
        }
        setSelectedPlayer(player as Friend);
    };

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

    return (
        <div className="h-full w-full flex flex-col bg-black/20 font-sans text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            <div className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 w-full z-10 flex flex-col shrink-0">
                <div className="p-4 flex items-center justify-center">
                    <h2 className={`text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r flex items-center gap-2 ${isMessagingCategory ? 'from-cyan-400 to-blue-500' : 'from-purple-400 to-pink-500'}`}>
                        {isMessagingCategory ? <MessageSquare size={24}/> : <Globe size={24}/>} 
                        {isMessagingCategory ? 'MESSAGERIE' : 'HUB SOCIAL'}
                    </h2>
                </div>

                <div className="flex p-2 gap-2 bg-black/20 mx-4 mb-2 rounded-xl">
                    {isMessagingCategory ? (
                        <>
                            <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'FRIENDS' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>DISCUSSIONS</button>
                            {activeChatId && <button onClick={() => setSocialTab('CHAT')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'CHAT' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>TCHAT ACTIF</button>}
                        </>
                    ) : (
                        <>
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>EN LIGNE</button>
                            <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all relative ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>
                                REQUÊTES
                                {friendRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center border border-black">{friendRequests.length}</span>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col relative pb-20 custom-scrollbar">
                {socialTab === 'FRIENDS' && (
                    <div className="flex flex-col h-full animate-in slide-in-from-left-4">
                        <div className="px-4 py-3 border-b border-white/5 flex gap-2 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input type="text" placeholder="Filtrer mes messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredFriends.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                    <MessageSquare size={48} className="opacity-20 mb-4" />
                                    <p className="text-sm font-bold">Aucune discussion active</p>
                                </div>
                            ) : (
                                filteredFriends.map(friend => {
                                    const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                                    const lastMsg = messages[friend.id]?.[messages[friend.id].length - 1];
                                    return (
                                        <div key={friend.id} onClick={() => openChat(friend)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/5 bg-gray-800/40 mb-2">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border-2 ${getFrameClass(friend.frameId)}`}>
                                                <avatar.icon size={24} className={avatar.color} />
                                                {friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-[0_0_5px_#22c55e]"></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5"><span className="font-bold text-sm text-gray-200 group-hover:text-white truncate">{friend.name}</span><span className="text-[10px] text-gray-500 whitespace-nowrap">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span></div>
                                                <p className={`text-xs truncate ${messages[friend.id]?.some(m => !m.read && m.senderId !== username) ? 'text-white font-bold' : 'text-gray-500'}`}>{lastMsg ? (lastMsg.senderId === username ? 'Toi : ' : '') + lastMsg.text : 'Démarrer la discussion'}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {socialTab === 'CHAT' && activeFriend && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-4 bg-gray-900/40 relative">
                        <div className="px-4 py-3 bg-gray-900/90 border-b border-white/10 flex items-center gap-3 backdrop-blur-md sticky top-0 z-20">
                            <button onClick={() => setSocialTab('FRIENDS')} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><ArrowLeft size={20}/></button>
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center border ${getFrameClass(activeFriend.frameId)}`}>{React.createElement((avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).icon, { size: 20, className: (avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).color })}</div>
                            <div className="flex-1 min-w-0"><span className="font-bold text-sm text-white truncate">{activeFriend.name}</span><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${activeFriend.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeFriend.status === 'online' ? (activeFriend.gameActivity && activeFriend.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[activeFriend.gameActivity]}` : 'En ligne') : 'Hors-ligne'}</span></div></div>
                            <button onClick={() => handlePlayerClick(activeFriend)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><MoreVertical size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoadingHistory && <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            {messages[activeChatId!]?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.senderId === username ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}><div className={`max-w-[85%] flex flex-col ${msg.senderId === username ? 'items-end' : 'items-start'}`}><div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg relative border ${msg.senderId === username ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-white/20 rounded-br-none' : 'bg-gray-800 text-gray-100 border-white/5 rounded-bl-none'}`}>{msg.text}<div className="flex items-center gap-1 mt-1 opacity-50 justify-end"><span className="text-[8px] font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>{msg.senderId === username && msg.pending && <Clock size={8} className="animate-pulse" />}</div></div></div></div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 bg-gray-900/90 border-t border-white/10 backdrop-blur-md sticky bottom-0 z-20">
                            <form onSubmit={sendMessage} className="flex items-center gap-2"><div className="flex-1 bg-gray-800/80 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center focus-within:border-cyan-500/50 transition-all shadow-inner"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ton message néon..." className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500" /><button type="button" className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"><Smile size={20}/></button></div><button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50"><Send size={18} fill="currentColor"/></button></form>
                        </div>
                    </div>
                )}

                {socialTab === 'COMMUNITY' && (
                    <div className="p-4 space-y-4 animate-in fade-in">
                        <div className="bg-gray-800/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-lg">
                            <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ton Code Ami</span><span className="text-sm font-mono font-black text-purple-400 mt-1">{mp.peerId || '...'}</span></div>
                            <button onClick={() => { if(mp.peerId) { navigator.clipboard.writeText(mp.peerId); alert('Code copié !'); } }} className="p-2 bg-purple-900/30 text-purple-400 rounded-xl border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all"><Copy size={18}/></button>
                        </div>

                        <form onSubmit={handleCommunitySearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <input type="text" value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="Rechercher par pseudo..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none pr-10" />
                                {communitySearch && <button onClick={clearSearch} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14}/></button>}
                            </div>
                            <button type="submit" disabled={isSearching} className="bg-purple-600 text-white px-4 rounded-xl font-bold active:scale-95 transition-all">{isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>}</button>
                        </form>
                        
                        {searchResults.length > 0 ? (
                             <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                 <h4 className="text-[10px] text-purple-400 font-bold uppercase tracking-widest px-2">Résultats de recherche</h4>
                                 {searchResults.map(player => {
                                      const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                      return (
                                          <div key={player.id} onClick={() => handlePlayerClick(player)} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-2xl border border-purple-500/30 group cursor-pointer transition-all hover:bg-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}><avatar.icon size={22} className={avatar.color} /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-white">{player.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        {player.status === 'online' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>}
                                                        <span className="text-[10px] text-gray-500">{player.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-gray-700/50 rounded-xl hover:bg-white hover:text-black transition-all"><UserPlus size={18}/></div>
                                          </div>
                                      );
                                 })}
                             </div>
                        ) : communitySearch && !isSearching && (
                            <p className="text-center text-gray-600 text-xs italic py-4">Aucun utilisateur trouvé pour "{communitySearch}"</p>
                        )}

                        {!communitySearch && (
                            <>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2 mt-2">Joueurs Connectés ({onlineOnlyCommunity.length})</h3>
                                <div className="space-y-2">
                                    {onlineOnlyCommunity.length === 0 && <p className="text-center text-gray-500 text-xs italic py-4">Aucun joueur en ligne en dehors de tes amis.</p>}
                                    {onlineOnlyCommunity.map(player => {
                                        const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                        return (
                                            <div key={player.id} onClick={() => handlePlayerClick(player)} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-2xl border border-white/5 hover:bg-gray-800 transition-all group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}><avatar.icon size={22} className={avatar.color} /></div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-white">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> 
                                                            {player.gameActivity && player.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[player.gameActivity] || player.gameActivity}` : 'En ligne'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-white hover:text-black transition-all"><UserPlus size={18}/></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {socialTab === 'REQUESTS' && (
                    <div className="p-4 space-y-3 animate-in fade-in">
                        {friendRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                <Inbox size={48} className="opacity-10 mb-4" />
                                <p className="text-sm font-bold">Aucune demande en attente</p>
                            </div>
                        ) : (
                            friendRequests.map(req => {
                                const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl border border-white/5 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><avatar.icon size={20} className={avatar.color}/></div>
                                            <span className="font-bold text-white text-sm">{req.name}</span>
                                        </div>
                                        <div className="flex gap-2"><button onClick={() => acceptRequest(req)} className="p-2 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-500 transition-colors"><CheckCircle size={20}/></button><button onClick={() => declineRequest(req.id)} className="p-2 bg-red-600/20 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors"><XCircle size={20}/></button></div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {selectedPlayer && (
                <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedPlayer(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-[40px] border border-white/20 shadow-2xl overflow-hidden relative flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="h-24 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-b border-white/10 relative shrink-0">
                            <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white/60 hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="px-6 pb-6 flex flex-col items-center -mt-12 overflow-y-auto custom-scrollbar">
                            <div className={`w-24 h-24 rounded-3xl bg-gray-900 p-1 border-2 mb-4 shrink-0 ${getFrameClass(selectedPlayer.frameId)}`}>
                                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center shadow-2xl`}>{React.createElement((avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).icon, { size: 48, className: (avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).color })}</div>
                            </div>
                            
                            <h2 className="text-2xl font-black text-white italic">{selectedPlayer.name}</h2>
                            
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse' : 'bg-gray-600'}`}></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedPlayer.status === 'online' ? 'En ligne' : 'Hors-ligne'}</span>
                            </div>

                            {/* Section Stats & Connexion */}
                            <div className="w-full mt-6 space-y-4">
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Trophy size={14}/> Records de jeu</h3>
                                    {renderStatsList(selectedPlayer.stats)}
                                </div>

                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={14}/> Dernière connexion</h3>
                                        <p className="text-xs text-white font-mono">{selectedPlayer.lastSeen ? new Date(selectedPlayer.lastSeen).toLocaleString() : 'Inconnue'}</p>
                                    </div>
                                    <Calendar size={20} className="text-gray-600" />
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-3 mt-8">
                                <button onClick={() => { if(friends.some(f => f.name === selectedPlayer.name)) openChat(friends.find(f => f.name === selectedPlayer.name)!); else sendFriendRequest(); }} className="py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">{friends.some(f => f.name === selectedPlayer.name) ? <><MessageSquare size={18}/> ENVOYER UN MESSAGE</> : <><UserPlus size={18}/> AJOUTER EN AMI</>}</button>
                                {friends.some(f => f.name === selectedPlayer.name) && (<button onClick={() => removeFriend(friends.find(f => f.name === selectedPlayer.name)!.id)} className="py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-500/20 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95"><UserMinus size={16} /> SUPPRIMER L'AMI</button>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
