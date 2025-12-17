
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Users, X, MessageSquare, Send, Copy, Plus, Bell, Globe, UserPlus, CheckCircle, XCircle, Trash2, Activity, Play, Bot, Wifi, Radar, Zap, Trophy, Gamepad2, CloudOff, Cloud, Settings, Save, RefreshCw, BarChart2, Clock, Inbox, User, ChevronRight } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { saveSupabaseConfig, clearSupabaseConfig, getStoredConfig, DB, supabase } from '../lib/supabaseClient';
import { OnlineUser } from '../hooks/useSupabase';

interface SocialOverlayProps {
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
    isConnectedToSupabase: boolean;
    isSupabaseConfigured: boolean;
    externalShow?: boolean;
    onExternalToggle?: (val: boolean) => void;
    onUnreadChange?: (count: number) => void;
    onRequestsChange?: (count: number) => void;
    activeTabOverride?: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS';
    onTabChangeOverride?: (tab: 'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS') => void;
}

interface PlayerStats {
    tetris: number;
    breaker: number;
    pacman: number;
    memory: number;
    rush: number;
    sudoku: number;
    [key: string]: any;
}

interface Friend {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    stats?: PlayerStats;
    gameActivity?: string; 
}

interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
    pending?: boolean;
}

interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
    stats?: PlayerStats;
}

const MOCK_COMMUNITY_PLAYERS: Friend[] = [
    { id: 'bot_1', name: 'NeonStriker', avatarId: 'av_rocket', status: 'online', lastSeen: Date.now(), stats: { tetris: 12000, breaker: 5000, pacman: 0, memory: 0, rush: 5, sudoku: 0 }, gameActivity: 'tetris' },
    { id: 'bot_2', name: 'PixelQueen', avatarId: 'av_cat', frameId: 'fr_neon_pink', status: 'online', lastSeen: Date.now(), stats: { tetris: 5000, breaker: 8000, pacman: 15000, memory: 12, rush: 10, sudoku: 0 }, gameActivity: 'pacman' },
    { id: 'bot_3', name: 'CyberWolf', avatarId: 'av_skull', frameId: 'fr_glitch', status: 'online', lastSeen: Date.now(), stats: { tetris: 25000, breaker: 2000, pacman: 5000, memory: 0, rush: 20, sudoku: 0 }, gameActivity: 'menu' },
    { id: 'bot_4', name: 'RetroMaster', avatarId: 'av_game', status: 'offline', lastSeen: Date.now() - 300000, stats: { tetris: 0, breaker: 0, pacman: 20000, memory: 0, rush: 0, sudoku: 0 } },
];

const GAME_NAMES: Record<string, string> = {
    'tetris': 'Tetris',
    'connect4': 'Connect 4',
    'sudoku': 'Sudoku',
    'breaker': 'Breaker',
    'pacman': 'Pacman',
    'memory': 'Memory',
    'battleship': 'Bataille',
    'snake': 'Snake',
    'invaders': 'Invaders',
    'airhockey': 'Air Hockey',
    'mastermind': 'Mastermind',
    'uno': 'Uno',
    'watersort': 'Neon Mix',
    'checkers': 'Dames',
    'runner': 'Neon Run',
    'stack': 'Stack',
    'arenaclash': 'Arena Clash',
    'skyjo': 'Skyjo',
    'shop': 'Boutique',
    'menu': 'Menu'
};

const ACTIVITY_TEMPLATES = [
    "{name} a lancé Tetris",
    "{name} a atteint le niveau 10 sur Breaker",
    "{name} vient de se connecter",
    "{name} a gagné 50 pièces",
    "{name} a battu son record sur Snake",
    "{name} joue en ligne",
    "{name} a acheté un nouvel avatar",
    "{name} domine le classement",
];

const formatFullDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ 
    audio, currency, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured, 
    externalShow, onExternalToggle, onUnreadChange, onRequestsChange, 
    activeTabOverride, onTabChangeOverride 
}) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    const { playCoin, playVictory } = audio;
    
    const [localShow, setLocalShow] = useState(false);
    const showSocial = externalShow !== undefined ? externalShow : localShow;
    const setShowSocial = onExternalToggle || setLocalShow;

    const [localTab, setLocalTab] = useState<'FRIENDS' | 'CHAT' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const socialTab = activeTabOverride || localTab;
    const setSocialTab = onTabChangeOverride || setLocalTab;

    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    const [activityLog, setActivityLog] = useState<{id: number, text: string, type: 'game'|'login'|'win'}[]>([]);
    const [globalChat, setGlobalChat] = useState<{id: number, text: string, sender: string, isSystem: boolean, type?: string}[]>([]);

    const [notificationPreview, setNotificationPreview] = useState<{ senderId: string, senderName: string, text: string } | null>(null);
    const notificationTimerRef = useRef<any>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const globalChatEndRef = useRef<HTMLDivElement>(null);

    const stateRef = useRef({ friends, activeChatId, showSocial, username, isConnectedToSupabase, onlineUsers });

    useEffect(() => {
        stateRef.current = { friends, activeChatId, showSocial, username, isConnectedToSupabase, onlineUsers };
    }, [friends, activeChatId, showSocial, username, isConnectedToSupabase, onlineUsers]);

    const playCoinRef = useRef(playCoin);
    const playVictoryRef = useRef(playVictory);
    useEffect(() => { playCoinRef.current = playCoin; playVictoryRef.current = playVictory; }, [playCoin, playVictory]);

    useEffect(() => {
        if (onUnreadChange) onUnreadChange(unreadCount);
    }, [unreadCount, onUnreadChange]);

    useEffect(() => {
        if (onRequestsChange) onRequestsChange(requests.length);
    }, [requests.length, onRequestsChange]);

    const handleMarkAllRead = async () => {
        setUnreadCount(0);
        if (isConnectedToSupabase && username) {
            await DB.markAllAsRead(username);
        }
    };

    useEffect(() => {
        const handleAdminEvent = (e: CustomEvent) => {
            const { message, type } = e.detail;
            if (message) {
                setActivityLog(prev => [{ id: Date.now(), text: `[ADMIN] ${message}`, type: type === 'warning' ? 'win' : 'game' }, ...prev].slice(0, 15));
                setGlobalChat(prev => [...prev, { id: Date.now(), text: message, sender: 'Neon Arcade', isSystem: true, type: type }]);
                if (!stateRef.current.showSocial) {
                    setNotificationPreview({ senderId: 'system', senderName: 'Neon Arcade', text: message });
                    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                    notificationTimerRef.current = setTimeout(() => setNotificationPreview(null), 5000);
                }
            }
        };
        window.addEventListener('neon_admin_event', handleAdminEvent as EventListener);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent as EventListener);
    }, []);

    useEffect(() => {
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) {
                    setFriends(parsed.map((f: any) => ({ ...f, status: 'offline', lastSeen: f.lastSeen || 0 }))); 
                }
            } catch (e) { localStorage.removeItem('neon_friends'); }
        }
        if (isConnectedToSupabase && username) {
            DB.getUnreadCount(username).then(count => setUnreadCount(count));
        }
    }, [isConnectedToSupabase, username]);

    useEffect(() => {
        if (!isConnectedToSupabase || !supabase || !username) return;
        const channelName = `messages_listener_${username}`;
        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    const newMsg = payload.new;
                    const currentUsername = stateRef.current.username;
                    if (newMsg.receiver_id !== currentUsername) return;
                    playCoinRef.current();
                    const senderUsername = newMsg.sender_id;
                    let chatKey = senderUsername; 
                    let senderDisplayName = senderUsername;
                    const friend = stateRef.current.friends.find(f => f.name === senderUsername);
                    if (friend) { chatKey = friend.id; senderDisplayName = friend.name; } 
                    else { const onlineUser = stateRef.current.onlineUsers.find(u => u.id === senderUsername); if (onlineUser) { chatKey = onlineUser.id; senderDisplayName = onlineUser.name; } }
                    setMessages(prev => {
                        const existingChat = prev[chatKey] || [];
                        if (existingChat.find(m => m.id === newMsg.id.toString())) return prev;
                        return { ...prev, [chatKey]: [...existingChat, { id: newMsg.id.toString(), senderId: chatKey, text: newMsg.text, timestamp: new Date(newMsg.created_at).getTime(), read: false }] };
                    });
                    const currentActiveId = stateRef.current.activeChatId;
                    const isSocialOpen = stateRef.current.showSocial;
                    if (currentActiveId !== chatKey || !isSocialOpen) {
                        setUnreadCount(prev => prev + 1);
                        setNotificationPreview({ senderId: chatKey, senderName: senderDisplayName, text: newMsg.text });
                        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                        notificationTimerRef.current = setTimeout(() => setNotificationPreview(null), 5000);
                    } else { DB.markMessagesAsRead(senderUsername, currentUsername); }
                }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [isConnectedToSupabase, username]);

    useEffect(() => {
        setFriends(prevFriends => {
            const updated = prevFriends.map(f => {
                const onlineUser = onlineUsers.find(u => u.id === f.id);
                const isRealUserOnline = onlineUser && onlineUser.status === 'online';
                const isBot = f.id.startsWith('bot_');
                const newStatus = (isRealUserOnline || isBot) ? 'online' : 'offline';
                const newStats = onlineUser?.stats || f.stats;
                const newGameActivity = onlineUser?.gameActivity;
                let newLastSeen = f.lastSeen;
                if (isBot && newStatus === 'online') newLastSeen = Date.now();
                else if (onlineUser) newLastSeen = onlineUser.lastSeen;
                if (f.status !== newStatus || JSON.stringify(f.stats) !== JSON.stringify(newStats) || f.lastSeen !== newLastSeen || f.gameActivity !== newGameActivity) {
                    return { ...f, status: newStatus, lastSeen: newLastSeen, stats: newStats, gameActivity: newGameActivity };
                }
                return f;
            });
            if (JSON.stringify(updated) !== JSON.stringify(prevFriends)) return updated;
            return prevFriends;
        });
    }, [onlineUsers]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.4) {
                const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
                const onlineFriends = friends.filter(f => f.status === 'online');
                let randomUser: Friend | undefined;
                if (onlineFriends.length > 0 && Math.random() > 0.2) randomUser = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
                else {
                    const potentialUsers = [...MOCK_COMMUNITY_PLAYERS, ...onlineUsers.filter(u => u.status === 'online').map(u => ({...u} as Friend))];
                    if (potentialUsers.length > 0) randomUser = potentialUsers[Math.floor(Math.random() * potentialUsers.length)];
                }
                if (randomUser) {
                    const text = template.replace("{name}", randomUser.name);
                    let type: 'game' | 'login' | 'win' = 'game';
                    if (text.includes('connecté')) type = 'login';
                    if (text.includes('gagné') || text.includes('record')) type = 'win';
                    setActivityLog(prev => [{ id: Date.now(), text, type }, ...prev].slice(0, 10));
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [onlineUsers, friends]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChatId, showSocial, isLoadingHistory]);
    useEffect(() => { globalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [globalChat, showSocial, socialTab]);

    const sendFriendRequest = (targetId: string) => {
        if (targetId === mp.peerId) return;
        if (targetId.startsWith('bot_')) {
            alert(`Demande envoyée !`);
            setTimeout(() => {
                const bot = MOCK_COMMUNITY_PLAYERS.find(b => b.id === targetId);
                if (bot) {
                    setFriends(prev => {
                        if (prev.find(f => f.id === bot.id)) return prev;
                        playVictory(); 
                        const updated = [...prev, { ...bot, status: 'online' }];
                        localStorage.setItem('neon_friends', JSON.stringify(updated));
                        return updated;
                    });
                }
            }, 1500);
            return;
        }
        mp.sendTo(targetId, { type: 'FRIEND_REQUEST', senderId: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId });
        alert('Demande envoyée !');
    };

    const acceptRequest = (req: FriendRequest) => {
        const newFriend: Friend = { id: req.id, name: req.name, avatarId: req.avatarId, frameId: req.frameId, status: 'online', lastSeen: Date.now(), stats: req.stats };
        setFriends(prev => { const updated = [...prev, newFriend]; localStorage.setItem('neon_friends', JSON.stringify(updated)); return updated; });
        setRequests(prev => prev.filter(r => r.id !== req.id));
        mp.sendTo(req.id, { type: 'FRIEND_ACCEPT', senderId: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId });
        playVictory();
    };

    const openChat = async (friendId: string) => {
        setActiveChatId(friendId);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        setUnreadCount(prev => Math.max(0, prev - (messages[friendId]?.filter(m => !m.read && m.senderId !== username).length || 0)));
        if (friendId.startsWith('bot_')) return;
        if (isConnectedToSupabase) {
            setIsLoadingHistory(true);
            try {
                const friend = friends.find(f => f.id === friendId);
                let targetUsername = friend ? friend.name : onlineUsers.find(u => u.id === friendId)?.name || friendId;
                await DB.markMessagesAsRead(targetUsername, username);
                const history = await DB.getMessages(username, targetUsername);
                const formattedMessages: PrivateMessage[] = history.map((row: any) => ({ id: row.id.toString(), senderId: row.sender_id === username ? username : friendId, text: row.text, timestamp: new Date(row.created_at).getTime(), read: row.read }));
                setMessages(prev => ({ ...prev, [friendId]: formattedMessages }));
            } catch (e) { console.error(e); } finally { setIsLoadingHistory(false); }
        }
    };

    const sendPrivateMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeChatId || !username) return;
        const text = chatInput.trim();
        const tempId = 'temp_' + Date.now();
        const optimisticMsg: PrivateMessage = { id: tempId, senderId: username, text: text, timestamp: Date.now(), read: true, pending: !activeChatId.startsWith('bot_') };
        setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), optimisticMsg] }));
        setChatInput('');
        if (activeChatId.startsWith('bot_')) {
            setTimeout(() => {
                const botMsg: PrivateMessage = { id: Date.now().toString(), senderId: activeChatId, text: "Bip bop... Je suis un robot !", timestamp: Date.now(), read: false };
                setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), botMsg] }));
                setUnreadCount(c => c + 1);
                playCoin();
            }, 1000 + Math.random() * 2000);
        } else if (isConnectedToSupabase) {
            const friend = friends.find(f => f.id === activeChatId);
            let targetUsername = friend ? friend.name : onlineUsers.find(u => u.id === activeChatId)?.name || activeChatId;
            const result = await DB.sendMessage(username, targetUsername, text);
            if (result) setMessages(prev => ({ ...prev, [activeChatId]: (prev[activeChatId] || []).map(m => m.id === tempId ? { ...m, id: result.id.toString(), pending: false } : m) }));
        }
    };

    const removeFriend = (id: string) => {
        setFriends(prev => { const updated = prev.filter(f => f.id !== id); localStorage.setItem('neon_friends', JSON.stringify(updated)); return updated; });
        if (activeChatId === id) setActiveChatId(null);
    };

    const displayedCommunity = useMemo(() => {
        const rawList = [...onlineUsers.filter(u => u.id !== mp.peerId), ...MOCK_COMMUNITY_PLAYERS];
        const nonFriends = rawList.filter(p => !friends.some(f => f.id === p.id));
        const uniqueById = nonFriends.filter((p, index, self) => index === self.findIndex((t) => t.id === p.id));
        uniqueById.sort((a, b) => { if (a.status === 'online' && b.status !== 'online') return -1; if (a.status !== 'online' && b.status === 'online') return 1; return (b.lastSeen || 0) - (a.lastSeen || 0); });
        return uniqueById.filter((p, index, self) => index === self.findIndex((t) => t.name === p.name)).sort((a, b) => { const aIsBot = a.id.startsWith('bot_'); const bIsBot = b.id.startsWith('bot_'); if (a.status === 'online' && b.status !== 'online') return -1; if (a.status !== 'online' && b.status === 'online') return 1; if (!aIsBot && bIsBot) return -1; if (aIsBot && !bIsBot) return 1; return (b.lastSeen || 0) - (a.lastSeen || 0); });
    }, [onlineUsers, mp.peerId, friends]);

    const getFrameClass = (frameId?: string) => framesCatalog.find(f => f.id === frameId)?.cssClass || 'border-white/10';
    const formatLastSeen = (timestamp: number) => { if (!timestamp) return 'Jamais'; const mins = Math.floor((Date.now() - timestamp) / 60000); if (mins < 1) return 'À l\'instant'; if (mins < 60) return `${mins} min`; const hours = Math.floor(mins / 60); if (hours < 24) return `${hours} h`; return `${Math.floor(hours / 24)} j`; };
    const getGameName = (gameId?: string) => gameId ? (GAME_NAMES[gameId] || gameId.charAt(0).toUpperCase() + gameId.slice(1)) : '';

    return (
        <>
            {/* NOTIFICATION PREVIEW BUBBLE (Mobile Friendly) */}
            {notificationPreview && !showSocial && (
                <div onClick={() => { setShowSocial(true); setNotificationPreview(null); }} className="fixed bottom-24 right-4 z-[100] pointer-events-auto bg-gray-900/95 backdrop-blur-md border border-purple-500/50 rounded-xl p-3 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 max-w-[240px] cursor-pointer group hover:bg-gray-800 transition-colors flex flex-col gap-1 ring-1 ring-purple-500/30">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-purple-400 truncate">{notificationPreview.senderName}</span>
                        <span className="text-[10px] text-gray-500">À l'instant</span>
                    </div>
                    <p className="text-xs text-white truncate group-hover:text-purple-100">{notificationPreview.text}</p>
                    <div className="text-[10px] text-purple-500 font-bold flex items-center gap-1 mt-1 justify-end opacity-60 group-hover:opacity-100 transition-opacity">OUVRIR <ChevronRight size={12} /></div>
                </div>
            )}

            {selectedPlayer && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setSelectedPlayer(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors z-10"><X size={20} /></button>
                        <div className="flex justify-center mt-8 mb-3"><div className={`w-24 h-24 rounded-2xl bg-gray-900 p-1 border-2 ${getFrameClass(selectedPlayer.frameId)}`}>{(() => { const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0]; const AvIcon = avatar.icon; return (<div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={48} className={avatar.color} /></div>); })()}</div></div>
                        <div className="px-6 pb-6 text-center"><h2 className="text-2xl font-black text-white italic mb-1">{selectedPlayer.name}</h2><div className="flex flex-col items-center mb-6"><div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} /><span className="text-xs text-gray-400 font-bold tracking-widest">{selectedPlayer.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</span></div><div className="mt-2 bg-gray-800/50 rounded-lg px-4 py-2 border border-white/5 flex flex-col items-center w-full max-w-[200px]"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">DERNIÈRE CONNEXION</span><span className="text-xs font-mono text-gray-300 font-bold">{selectedPlayer.status === 'online' ? 'MAINTENANT' : formatFullDate(selectedPlayer.lastSeen)}</span></div></div><div className="flex gap-2 justify-center mb-6">{selectedPlayer.id === mp.peerId ? ( <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">Ton profil</div> ) : !friends.some(f => f.id === selectedPlayer?.id) ? ( <button onClick={() => { sendFriendRequest(selectedPlayer!.id); setSelectedPlayer(null); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg"><UserPlus size={16} /> AJOUTER</button> ) : ( <> <button onClick={() => openChat(selectedPlayer!.id)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-sm transition-colors"><MessageSquare size={16} /> MESSAGE</button> <button onClick={() => { removeFriend(selectedPlayer!.id); setSelectedPlayer(null); }} className="p-2 border border-red-500/50 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"><Trash2 size={16} /></button> </> )}</div></div>
                    </div>
                </div>
            )}

            {showSocial && (
                <div className="fixed inset-0 z-[280] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-md h-[650px] max-h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b border-white/10 flex items-center justify-center bg-black/40 relative">
                            {unreadCount > 0 && <button onClick={handleMarkAllRead} className="absolute left-4 p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-full transition-colors"><CheckCircle size={16} /></button>}
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2"><Users className="text-blue-400" /> SOCIAL</h2>
                            <button onClick={() => setShowSocial(false)} className="absolute right-4 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} className="text-gray-400 hover:text-white" /></button>
                        </div>
                        <div className="flex p-2 gap-2 bg-black/20 overflow-x-auto shrink-0">
                            <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'FRIENDS' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>AMIS ({friends.length})</button>
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>COMMUNAUTÉ</button>
                            <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>REQUÊTES {requests.length > 0 && `(${requests.length})`}</button>
                            {activeChatId && <button onClick={() => setSocialTab('CHAT')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'CHAT' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>TCHAT</button>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                            {socialTab === 'COMMUNITY' && (
                                <div className="space-y-4">
                                    <div className={`border p-3 rounded-lg text-center mb-2 flex items-center justify-center gap-2 ${isConnectedToSupabase ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-gray-800/50 border-white/10 text-gray-400'}`}>{isConnectedToSupabase ? ( <><Cloud size={16} /> <span className="text-xs font-bold">CONNECTÉ</span></> ) : !isSupabaseConfigured ? ( <><CloudOff size={16} /> <span className="text-xs font-bold">MODE HORS-LIGNE</span></> ) : ( <><Wifi size={16} className="animate-pulse" /> <span className="text-xs font-bold">CONNEXION...</span></> )}</div>
                                    {globalChat.length > 0 && ( <div className="bg-black/40 rounded-lg p-2 border border-white/5 mb-4"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><MessageSquare size={10}/> Chat Global</p><div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar-thin">{globalChat.map(msg => (<div key={msg.id} className="text-xs flex flex-col bg-white/5 p-1.5 rounded border border-white/5"><div className="flex justify-between items-center mb-0.5"><span className="font-bold text-neon-blue text-[10px]">{msg.sender}</span><span className="text-[8px] text-gray-500">{new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div><span className="text-white break-words">{msg.text}</span></div>))}<div ref={globalChatEndRef}/></div></div> )}
                                    <div className="bg-gray-800/40 p-2 rounded-lg border border-white/5 flex items-center justify-between mb-4 shadow-sm"><span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase flex items-center gap-2"><User size={12}/> CODE AMI</span><button onClick={() => { if(mp.peerId) { navigator.clipboard.writeText(mp.peerId); alert('Code copié !'); } }} className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30 transition-colors active:scale-95">{mp.peerId || '...'} <Copy size={12} /></button></div>
                                    <div className="bg-black/30 rounded-lg p-2 border border-white/5 mb-4"><p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Activity size={10}/> Activité</p><div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar-thin">{activityLog.map(log => (<div key={log.id} className={`text-xs flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 ${log.type === 'win' ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>{log.type === 'win' ? <Trophy size={10} className="text-yellow-500"/> : log.type === 'game' ? <Gamepad2 size={10} className="text-blue-400"/> : <Zap size={10} className="text-green-400"/>}<span>{log.text}</span></div>))}</div></div>
                                    {displayedCommunity.map(player => { const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0]; const AvIcon = avatar.icon; const isBot = player.id.startsWith('bot_'); const isOnline = player.status === 'online'; return ( <div key={player.id} onClick={() => setSelectedPlayer(player as Friend)} className={`flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border ${isBot ? 'border-white/10 hover:border-purple-500/50' : 'border-green-500/30 hover:border-green-500/50'} cursor-pointer transition-all group`}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}><AvIcon size={20} className={avatar.color} />{isBot ? null : <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black ${isOnline ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div>}</div><div className="flex flex-col"><span className="font-bold text-sm text-gray-200 group-hover:text-white">{player.name}</span><span className="text-[10px] text-gray-500 flex items-center gap-1">{isBot ? <Bot size={10}/> : <Globe size={10} className={isOnline ? "text-green-400" : "text-gray-500"}/>} {isBot ? 'Simulation' : (isOnline ? 'En Ligne' : 'Hors Ligne')}</span></div></div><UserPlus size={18} className="text-gray-600 group-hover:text-blue-400" /></div> ); })}
                                </div>
                            )}
                            {socialTab === 'FRIENDS' && (
                                <div className="space-y-2">{friends.length === 0 ? <div className="text-center text-gray-500 py-8 italic text-sm">Communauté vide.</div> : ( friends.map(friend => { const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0]; const AvIcon = avatar.icon; const isPlaying = friend.status === 'online' && friend.gameActivity && friend.gameActivity !== 'menu' && friend.gameActivity !== 'shop'; const gameName = getGameName(friend.gameActivity); return ( <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5 hover:bg-gray-800 transition-colors cursor-pointer group"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}><AvIcon size={20} className={avatar.color} />{friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>}</div><div className="flex flex-col"><span className="font-bold text-sm text-gray-200">{friend.name}</span><div className="flex items-center gap-2"><span className={`text-[10px] ${isPlaying ? 'text-pink-400 font-bold animate-pulse flex items-center gap-1' : 'text-gray-500'}`}>{isPlaying ? <><Gamepad2 size={10}/> {gameName}</> : friend.status === 'online' ? 'En ligne' : `${formatLastSeen(friend.lastSeen)}`}</span></div></div></div><button onClick={(e) => { e.stopPropagation(); openChat(friend.id); }} className="p-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-colors relative"><MessageSquare size={16} /></button></div> ); }) )}</div>
                            )}
                            {socialTab === 'REQUESTS' && (
                                <div className="space-y-2">{requests.length === 0 ? <div className="text-center text-gray-500 py-8 italic text-sm">Aucune message.</div> : ( requests.map(req => { const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0]; const AvIcon = avatar.icon; return ( <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={20} className={avatar.color} /></div><span className="font-bold text-sm text-gray-200">{req.name}</span></div><div className="flex gap-2"><button onClick={() => acceptRequest(req)} className="p-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-colors"><CheckCircle size={18} /></button><button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"><XCircle size={18} /></button></div></div> ); }) )}</div>
                            )}
                            {socialTab === 'CHAT' && activeChatId && (
                                <div className="flex flex-col h-full">{isLoadingHistory && <div className="flex justify-center p-2"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}<div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar">{messages[activeChatId]?.length > 0 ? messages[activeChatId].map((msg, i) => ( <div key={i} className={`flex ${msg.senderId === username ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === username ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'} flex gap-2 items-end group relative`}><span>{msg.text}</span>{msg.pending && <Clock size={10} className="text-white/70 animate-pulse mb-0.5"/>}{!msg.pending && <span className="text-[8px] opacity-50 mb-0.5">{new Date(msg.timestamp).getHours()}:{String(new Date(msg.timestamp).getMinutes()).padStart(2, '0')}</span>}</div></div> )) : ( <div className="text-center text-gray-500 text-xs py-10 flex flex-col items-center"><Inbox size={32} className="mb-2 opacity-50"/>Dis bonjour !</div> )}<div ref={chatEndRef} /></div><form onSubmit={sendPrivateMessage} className="flex gap-2 mt-auto"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ton message..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500 transition-colors" autoFocus /><button type="submit" disabled={!chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors"><Send size={20} /></button></form></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
