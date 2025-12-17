
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Users, MessageSquare, Send, Copy, Bell, Globe, UserPlus, CheckCircle, XCircle, Activity, Play, Bot, MoreVertical, Smile, ArrowLeft, Search, Inbox, Clock } from 'lucide-react';
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

interface SocialOverlayProps {
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
    isConnectedToSupabase: boolean;
    isSupabaseConfigured: boolean;
    onUnreadChange?: (count: number) => void;
    
    // Props pour la gestion centralisée des requêtes
    friendRequests: FriendRequest[];
    setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;

    activeTabOverride?: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS';
    onTabChangeOverride?: (tab: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS') => void;
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
}

interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
    pending?: boolean;
}

const MOCK_COMMUNITY_PLAYERS: Friend[] = [
    { id: 'bot_1', name: 'NeonStriker', avatarId: 'av_rocket', status: 'online', lastSeen: Date.now(), gameActivity: 'tetris' },
    { id: 'bot_2', name: 'PixelQueen', avatarId: 'av_cat', frameId: 'fr_neon_pink', status: 'online', lastSeen: Date.now(), gameActivity: 'pacman' },
    { id: 'bot_3', name: 'CyberWolf', avatarId: 'av_skull', frameId: 'fr_glitch', status: 'online', lastSeen: Date.now(), gameActivity: 'menu' },
];

const GAME_NAMES: Record<string, string> = {
    'tetris': 'Tetris', 'connect4': 'Connect 4', 'sudoku': 'Sudoku', 'breaker': 'Breaker',
    'pacman': 'Pacman', 'memory': 'Memory', 'battleship': 'Bataille', 'snake': 'Snake',
    'invaders': 'Invaders', 'airhockey': 'Air Hockey', 'mastermind': 'Mastermind',
    'uno': 'Uno', 'watersort': 'Neon Mix', 'checkers': 'Dames', 'runner': 'Neon Run',
    'stack': 'Stack', 'arenaclash': 'Arena Clash', 'skyjo': 'Skyjo', 'shop': 'Boutique', 'menu': 'Menu'
};

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ 
    audio, currency, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured, 
    onUnreadChange, friendRequests, setFriendRequests, activeTabOverride, onTabChangeOverride 
}) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    const { playCoin, playVictory } = audio;
    
    const [localTab, setLocalTab] = useState<'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const socialTab = activeTabOverride || localTab;
    const setSocialTab = onTabChangeOverride || setLocalTab;

    const [friends, setFriends] = useState<Friend[]>([]);
    // const [requests, setRequests] = useState<FriendRequest[]>([]); // Géré par App.tsx
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [notificationPreview, setNotificationPreview] = useState<{ senderId: string, senderName: string, text: string } | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({ friends, activeChatId, username, isConnectedToSupabase, onlineUsers });

    useEffect(() => {
        stateRef.current = { friends, activeChatId, username, isConnectedToSupabase, onlineUsers };
    }, [friends, activeChatId, username, isConnectedToSupabase, onlineUsers]);

    const isMessagingCategory = socialTab === 'FRIENDS' || socialTab === 'CHAT';

    useEffect(() => { if (onUnreadChange) onUnreadChange(unreadCount); }, [unreadCount, onUnreadChange]);
    // useEffect(() => { if (onRequestsChange) onRequestsChange(requests.length); }, [requests.length, onRequestsChange]);

    // Charger les amis depuis le LocalStorage
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
        }
    }, [isConnectedToSupabase, username]);

    // Écouter les messages privés (Base de données)
    useEffect(() => {
        if (!isConnectedToSupabase || !supabase || !username) return;
        const channel = supabase.channel(`msg_${username}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.receiver_id !== username) return;
                
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
    }, [isConnectedToSupabase, username, playCoin]);

    // Écouter les événements temps réel (ACCEPTATIONS UNIQUEMENT ICI - REQUETES GEREES PAR APP.TSX)
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any, conn: any) => {
            // RECEPTION D'UNE ACCEPTATION D'AMI
            if (data.type === 'FRIEND_ACCEPT') {
                const sender = data.sender;
                playVictory();
                setNotificationPreview({ senderId: sender.id, senderName: sender.name, text: "A accepté votre demande d'ami !" });
                setTimeout(() => setNotificationPreview(null), 5000);
                
                // Ajouter aux amis localement
                const newFriend: Friend = { 
                    id: sender.id, 
                    name: sender.name, 
                    avatarId: sender.avatarId, 
                    frameId: sender.frameId, 
                    status: 'online', 
                    lastSeen: Date.now() 
                };
                
                setFriends(prev => {
                    const newList = [...prev, newFriend];
                    localStorage.setItem('neon_friends', JSON.stringify(newList));
                    return newList;
                });
            }
        });
        return () => unsubscribe();
    }, [mp, friends, playCoin, playVictory]);

    useEffect(() => {
        setFriends(prev => prev.map(f => {
            const onlineEntry = onlineUsers.find(u => u.id === f.id);
            const isReallyOnline = onlineEntry && onlineEntry.status === 'online';
            
            return isReallyOnline 
                ? { ...f, status: 'online', gameActivity: onlineEntry.gameActivity, lastSeen: onlineEntry.lastSeen } 
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

    // --- GESTION DES AMIS ---

    const sendFriendRequest = () => {
        if (!selectedPlayer || !mp.peerId) return;
        
        // 1. Check if already friend
        if (friends.some(f => f.id === selectedPlayer.id)) {
            openChat(selectedPlayer);
            return;
        }

        // 2. Check if request already pending? (Optional)

        // 3. Send Realtime Signal
        mp.sendTo(selectedPlayer.id, {
            type: 'FRIEND_REQUEST',
            sender: { 
                id: mp.peerId, 
                name: username, 
                avatarId: currentAvatarId, 
                frameId: currentFrameId 
            }
        });

        alert(`Demande d'ami envoyée à ${selectedPlayer.name} !`);
        setSelectedPlayer(null);
    };

    const acceptRequest = (req: FriendRequest) => {
        // 1. Add to local friends
        const newFriend: Friend = { 
            id: req.id, 
            name: req.name, 
            avatarId: req.avatarId, 
            frameId: req.frameId, 
            status: 'online', 
            lastSeen: Date.now() 
        };
        
        setFriends(prev => {
            const newList = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(newList));
            return newList;
        });

        // 2. Remove request (Utilise le setter global)
        setFriendRequests(prev => prev.filter(r => r.id !== req.id));

        // 3. Notify sender they are accepted
        if (mp.peerId) {
            mp.sendTo(req.id, {
                type: 'FRIEND_ACCEPT',
                sender: { 
                    id: mp.peerId, 
                    name: username, 
                    avatarId: currentAvatarId, 
                    frameId: currentFrameId 
                }
            });
        }
        playVictory();
    };

    const declineRequest = (reqId: string) => {
        setFriendRequests(prev => prev.filter(r => r.id !== reqId));
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

    const displayedCommunity = useMemo(() => {
        const allPotential = [...onlineUsers, ...MOCK_COMMUNITY_PLAYERS];
        const filtered = allPotential.filter(p => {
            if (p.id === mp.peerId || p.name === username) return false;
            if (friends.some(f => f.id === p.id || f.name === p.name)) return false;
            return true;
        });
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();
        const unique = filtered.filter(p => {
            if (seenIds.has(p.id) || seenNames.has(p.name)) return false;
            seenIds.add(p.id);
            seenNames.add(p.name);
            return true;
        });
        return unique.sort((a, b) => {
            if (a.status === 'online' && b.status !== 'online') return -1;
            if (a.status !== 'online' && b.status === 'online') return 1;
            return 0;
        });
    }, [onlineUsers, mp.peerId, friends, username]);

    const activeFriend = useMemo(() => friends.find(f => f.id === activeChatId) || MOCK_COMMUNITY_PLAYERS.find(b => b.id === activeChatId), [activeChatId, friends]);

    return (
        <div className="h-full w-full flex flex-col bg-black/20 font-sans text-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-transparent pointer-events-none"></div>
            
            {notificationPreview && (
                <div onClick={() => { setSocialTab('FRIENDS'); openChat({ id: notificationPreview.senderId, name: notificationPreview.senderName } as any); setNotificationPreview(null); }} className="fixed bottom-24 right-4 z-[100] bg-gray-900/95 border border-cyan-500/50 rounded-xl p-3 shadow-2xl animate-in slide-in-from-right-10 cursor-pointer max-w-[240px] flex flex-col gap-1 ring-1 ring-cyan-500/30">
                    <span className="text-xs font-bold text-cyan-400">{notificationPreview.senderName}</span>
                    <p className="text-xs text-white truncate">{notificationPreview.text}</p>
                </div>
            )}

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
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>COMMUNAUTÉ</button>
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
                                <input 
                                    type="text" 
                                    placeholder="Filtrer mes messages..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                                />
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
                                    const AvIcon = avatar.icon;
                                    const unreadInChat = messages[friend.id]?.filter(m => !m.read && m.senderId !== username).length || 0;
                                    const lastMsg = messages[friend.id]?.[messages[friend.id].length - 1];
                                    return (
                                        <div key={friend.id} onClick={() => openChat(friend)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-white/5 bg-gray-800/40 mb-2">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border-2 ${getFrameClass(friend.frameId)}`}>
                                                <AvIcon size={24} className={avatar.color} />
                                                {friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-[0_0_5px_#22c55e]"></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="font-bold text-sm text-gray-200 group-hover:text-white truncate">{friend.name}</span>
                                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-xs truncate flex-1 ${unreadInChat > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                                                        {lastMsg ? (lastMsg.senderId === username ? 'Toi : ' : '') + lastMsg.text : 'Démarrer la discussion'}
                                                    </p>
                                                    {unreadInChat > 0 && <span className="ml-2 w-5 h-5 bg-cyan-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)]">{unreadInChat}</span>}
                                                </div>
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
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center border ${getFrameClass(activeFriend.frameId)}`}>
                                {React.createElement((avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).icon, { size: 20, className: (avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).color })}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <span className="font-bold text-sm text-white truncate">{activeFriend.name}</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${activeFriend.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {activeFriend.status === 'online' ? (activeFriend.gameActivity && activeFriend.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[activeFriend.gameActivity]}` : 'En ligne') : 'Hors-ligne'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPlayer(activeFriend)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><MoreVertical size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoadingHistory && <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            {messages[activeChatId!]?.map((msg) => {
                                const isMe = msg.senderId === username;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg relative border ${
                                                isMe 
                                                ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-white/20 rounded-br-none shadow-cyan-900/20' 
                                                : 'bg-gray-800 text-gray-100 border-white/5 rounded-bl-none shadow-black/40'
                                            }`}>
                                                {msg.text}
                                                <div className="flex items-center gap-1 mt-1 opacity-50 justify-end">
                                                    <span className="text-[8px] font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    {isMe && msg.pending && <Clock size={8} className="animate-pulse" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 bg-gray-900/90 border-t border-white/10 backdrop-blur-md sticky bottom-0 z-20">
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-800/80 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center focus-within:border-cyan-500/50 transition-all shadow-inner">
                                    <input 
                                        type="text" 
                                        value={chatInput} 
                                        onChange={e => setChatInput(e.target.value)} 
                                        placeholder="Ton message néon..." 
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                    />
                                    <button type="button" className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"><Smile size={20}/></button>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!chatInput.trim()}
                                    className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <Send size={18} fill="currentColor"/>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {socialTab === 'COMMUNITY' && (
                    <div className="p-4 space-y-4 animate-in fade-in">
                        <div className="bg-gray-800/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-lg">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ton Code Ami</span>
                                <span className="text-sm font-mono font-black text-purple-400 mt-1">{mp.peerId || '...'}</span>
                            </div>
                            <button onClick={() => { if(mp.peerId) { navigator.clipboard.writeText(mp.peerId); alert('Code copié !'); } }} className="p-2 bg-purple-900/30 text-purple-400 rounded-xl border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all"><Copy size={18}/></button>
                        </div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2 mt-6">Joueurs suggérés</h3>
                        <div className="space-y-2">
                            {displayedCommunity.map(player => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                const AvIcon = avatar.icon;
                                const isFriend = friends.some(f => f.id === player.id);
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-2xl border border-white/5 hover:bg-gray-800 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}>
                                                <AvIcon size={22} className={avatar.color} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-white">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">{player.status === 'online' ? <><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> En ligne</> : 'Hors-ligne'}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedPlayer(player as Friend)} className={`p-2 rounded-xl transition-all ${isFriend ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700/50 text-gray-300 hover:bg-white hover:text-black'}`}>
                                            {isFriend ? <MessageSquare size={18}/> : <UserPlus size={18}/>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
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
                                const AvIcon = avatar.icon;
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl border border-white/5 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><AvIcon size={20} className={avatar.color}/></div>
                                            <span className="font-bold text-white text-sm">{req.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => acceptRequest(req)} className="p-2 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-500 transition-colors"><CheckCircle size={20}/></button>
                                            <button onClick={() => declineRequest(req.id)} className="p-2 bg-red-600/20 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors"><XCircle size={20}/></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {selectedPlayer && (
                <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in" onClick={() => setSelectedPlayer(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-[40px] border border-white/20 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <div className="h-24 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-b border-white/10"></div>
                        <div className="px-6 pb-8 flex flex-col items-center -mt-12">
                            <div className={`w-24 h-24 rounded-3xl bg-gray-900 p-1 border-2 mb-4 ${getFrameClass(selectedPlayer.frameId)}`}>
                                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center shadow-2xl`}>
                                    {React.createElement((avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).icon, { size: 48, className: (avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]).color })}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white italic">{selectedPlayer.name}</h2>
                            <span className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">ID: {selectedPlayer.id}</span>
                            <div className="w-full flex flex-col gap-3 mt-8">
                                <button onClick={() => { if(friends.some(f => f.id === selectedPlayer.id)) openChat(selectedPlayer); else sendFriendRequest(); }} className="py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                    {friends.some(f => f.id === selectedPlayer.id) ? <MessageSquare size={18}/> : <UserPlus size={18}/>} 
                                    {friends.some(f => f.id === selectedPlayer.id) ? 'MESSAGE' : 'AJOUTER'}
                                </button>
                                <button onClick={() => setSelectedPlayer(null)} className="py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl font-black text-sm transition-all border border-white/5 flex items-center justify-center gap-2 active:scale-95">ANNULER</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
