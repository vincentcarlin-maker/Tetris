
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    gameActivity?: string; // New: What they are playing
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

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ audio, currency, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured }) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    const { playCoin, playVictory } = audio;
    
    const [showSocial, setShowSocial] = useState(false);
    const [socialTab, setSocialTab] = useState<'FRIENDS' | 'CHAT' | 'ADD' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    const [showConfig, setShowConfig] = useState(false);
    const [configUrl, setConfigUrl] = useState('');
    const [configKey, setConfigKey] = useState('');
    
    const [activityLog, setActivityLog] = useState<{id: number, text: string, type: 'game'|'login'|'win'}[]>([]);

    // NEW: Global Chat / System Messages
    const [globalChat, setGlobalChat] = useState<{id: number, text: string, sender: string, isSystem: boolean, type?: string}[]>([]);

    const [btnTop, setBtnTop] = useState(window.innerHeight / 3);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef(0);
    const initialTopRef = useRef(0);

    // New state for message preview bubble
    const [notificationPreview, setNotificationPreview] = useState<{ senderId: string, senderName: string, text: string } | null>(null);
    const notificationTimerRef = useRef<any>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const globalChatEndRef = useRef<HTMLDivElement>(null);

    // --- STABLE REFS FOR SUBSCRIPTIONS ---
    // Includes onlineUsers to resolve IDs without re-subscribing
    const stateRef = useRef({
        friends,
        activeChatId,
        showSocial,
        username,
        isConnectedToSupabase,
        onlineUsers
    });

    useEffect(() => {
        stateRef.current = { friends, activeChatId, showSocial, username, isConnectedToSupabase, onlineUsers };
    }, [friends, activeChatId, showSocial, username, isConnectedToSupabase, onlineUsers]);

    const playCoinRef = useRef(playCoin);
    const playVictoryRef = useRef(playVictory);
    useEffect(() => { playCoinRef.current = playCoin; playVictoryRef.current = playVictory; }, [playCoin, playVictory]);


    const handleDragStart = (clientY: number) => {
        isDraggingRef.current = true;
        dragStartRef.current = clientY;
        initialTopRef.current = btnTop;
    };

    const handleDragMove = useCallback((clientY: number) => {
        if (!isDraggingRef.current) return;
        const delta = clientY - dragStartRef.current;
        const newTop = Math.max(60, Math.min(window.innerHeight - 60, initialTopRef.current + delta));
        setBtnTop(newTop);
    }, []);

    const handleDragEnd = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    // Listen for admin events to update activity log AND global chat
    useEffect(() => {
        const handleAdminEvent = (e: CustomEvent) => {
            const { message, type } = e.detail;
            if (message) {
                // Add to Activity Log
                setActivityLog(prev => [{ 
                    id: Date.now(), 
                    text: `[ADMIN] ${message}`, 
                    type: type === 'warning' ? 'win' : 'game'
                }, ...prev].slice(0, 15));

                // Add to Global Chat / Notification as "Neon Arcade"
                setGlobalChat(prev => [...prev, {
                    id: Date.now(),
                    text: message,
                    sender: 'Neon Arcade',
                    isSystem: true,
                    type: type
                }]);
                
                // Show notification if social is closed
                if (!stateRef.current.showSocial) {
                    setNotificationPreview({ 
                        senderId: 'system', 
                        senderName: 'Neon Arcade', 
                        text: message 
                    });
                    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                    notificationTimerRef.current = setTimeout(() => setNotificationPreview(null), 5000);
                }
            }
        };
        window.addEventListener('neon_admin_event', handleAdminEvent as EventListener);
        return () => window.removeEventListener('neon_admin_event', handleAdminEvent as EventListener);
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => handleDragMove(e.clientY);
        const onUp = () => handleDragEnd();
        const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY);
        
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onUp);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onUp);
        };
    }, [handleDragMove, handleDragEnd]);

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
            DB.getUnreadCount(username).then(count => {
                setUnreadCount(prev => prev + count);
            });
        }
        
        const conf = getStoredConfig();
        setConfigUrl(conf.url);
        setConfigKey(conf.key);
    }, [isConnectedToSupabase, username]);

    // --- REALTIME FRIEND REQUESTS SUBSCRIPTION ---
    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (data.type === 'FRIEND_REQUEST') {
                const currentFriends = stateRef.current.friends;
                setRequests(prev => {
                    if (prev.some(r => r.id === data.senderId) || currentFriends.some(f => f.id === data.senderId)) return prev;
                    playCoinRef.current();
                    return [...prev, {
                        id: data.senderId,
                        name: data.name,
                        avatarId: data.avatarId,
                        frameId: data.frameId,
                        timestamp: Date.now()
                    }];
                });
            }
            if (data.type === 'FRIEND_ACCEPT') {
                playVictoryRef.current();
                const newFriend: Friend = { 
                    id: data.senderId, 
                    name: data.name, 
                    avatarId: data.avatarId, 
                    frameId: data.frameId, 
                    status: 'online', 
                    lastSeen: Date.now() 
                };
                setFriends(prev => {
                    if (prev.some(f => f.id === newFriend.id)) return prev;
                    const updated = [...prev, newFriend];
                    localStorage.setItem('neon_friends', JSON.stringify(updated));
                    return updated;
                });
            }
        });
        return () => unsubscribe();
    }, [mp.subscribe]);

    // --- REALTIME MESSAGING SUBSCRIPTION (STABLE) ---
    useEffect(() => {
        if (!isConnectedToSupabase || !supabase || !username) return;

        const channelName = `messages_listener_${username}`;
        // console.log("🔌 Subscribing to messages on channel:", channelName);

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
                    if (friend) {
                        chatKey = friend.id;
                        senderDisplayName = friend.name;
                    } else {
                        const onlineUser = stateRef.current.onlineUsers.find(u => u.name === senderUsername);
                        if (onlineUser) {
                            chatKey = onlineUser.id;
                            senderDisplayName = onlineUser.name;
                        }
                    }

                    setMessages(prev => {
                        const existingChat = prev[chatKey] || [];
                        if (existingChat.find(m => m.id === newMsg.id.toString())) return prev;
                        
                        return { 
                            ...prev, 
                            [chatKey]: [...existingChat, { 
                                id: newMsg.id.toString(), 
                                senderId: chatKey, 
                                text: newMsg.text, 
                                timestamp: new Date(newMsg.created_at).getTime(), 
                                read: false
                            }]
                        };
                    });

                    const currentActiveId = stateRef.current.activeChatId;
                    const isSocialOpen = stateRef.current.showSocial;

                    if (currentActiveId !== chatKey || !isSocialOpen) {
                        setUnreadCount(prev => prev + 1);
                        setNotificationPreview({ senderId: chatKey, senderName: senderDisplayName, text: newMsg.text });
                        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                        notificationTimerRef.current = setTimeout(() => setNotificationPreview(null), 5000);
                    } else {
                        DB.markMessagesAsRead(senderUsername, currentUsername);
                    }
                }
            ).subscribe();

        return () => { 
            supabase.removeChannel(channel); 
        };
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

                if (f.status !== newStatus || 
                    JSON.stringify(f.stats) !== JSON.stringify(newStats) || 
                    f.lastSeen !== newLastSeen || 
                    f.gameActivity !== newGameActivity) {
                    
                    return { 
                        ...f, 
                        status: newStatus, 
                        lastSeen: newLastSeen, 
                        stats: newStats,
                        gameActivity: newGameActivity 
                    };
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

    // --- ACTIONS ---
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
        setFriends(prev => {
            const updated = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
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
                let targetUsername = friend ? friend.name : null;
                if (!targetUsername) {
                    const onlineUser = onlineUsers.find(u => u.id === friendId);
                    if (onlineUser) targetUsername = onlineUser.name;
                }
                if (!targetUsername) targetUsername = friendId;

                await DB.markMessagesAsRead(targetUsername, username);
                const history = await DB.getMessages(username, targetUsername);
                
                const formattedMessages: PrivateMessage[] = history.map((row: any) => ({ 
                    id: row.id.toString(), 
                    senderId: row.sender_id === username ? username : friendId, 
                    text: row.text, 
                    timestamp: new Date(row.created_at).getTime(), 
                    read: row.read 
                }));
                setMessages(prev => ({ ...prev, [friendId]: formattedMessages }));
            } catch (e) { console.error("Failed to load chat history", e); } finally { setIsLoadingHistory(false); }
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
            const delay = 1000 + Math.random() * 2000;
            setTimeout(() => {
                const botMsg: PrivateMessage = { id: Date.now().toString(), senderId: activeChatId, text: "Bip bop... Je suis un robot mais j'apprécie le message !", timestamp: Date.now(), read: false };
                setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), botMsg] }));
                setUnreadCount(c => c + 1);
                setNotificationPreview({ senderId: activeChatId, senderName: MOCK_COMMUNITY_PLAYERS.find(b => b.id === activeChatId)?.name || "Bot", text: "Bip bop..." });
                setTimeout(() => setNotificationPreview(null), 5000);
                playCoin();
            }, delay);

        } else if (isConnectedToSupabase) {
            const friend = friends.find(f => f.id === activeChatId);
            let targetUsername = friend ? friend.name : null;
            if (!targetUsername) {
                const onlineUser = onlineUsers.find(u => u.id === activeChatId);
                if (onlineUser) targetUsername = onlineUser.name;
            }
            if (!targetUsername) targetUsername = activeChatId;

            const result = await DB.sendMessage(username, targetUsername, text);
            if (result) {
                setMessages(prev => {
                    const chat = prev[activeChatId] || [];
                    return { ...prev, [activeChatId]: chat.map(m => m.id === tempId ? { ...m, id: result.id.toString(), pending: false } : m) };
                });
            }
        }
    };

    const removeFriend = (id: string) => {
        setFriends(prev => {
            const updated = prev.filter(f => f.id !== id);
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        if (activeChatId === id) setActiveChatId(null);
    };

    const handleOpenSocial = () => {
        if (!isDraggingRef.current) {
            setShowSocial(true);
            setNotificationPreview(null);
            
            if (notificationPreview) {
                setSocialTab('CHAT');
                // Only open private chat if notification isn't system
                if (notificationPreview.senderId !== 'system') {
                    openChat(notificationPreview.senderId);
                } else {
                    setSocialTab('COMMUNITY'); // Go to community tab for system messages
                }
            } else if (unreadCount > 0 && activeChatId) {
                setSocialTab('CHAT');
            }
        }
    };

    const displayedCommunity = [
        ...onlineUsers.filter(u => u.id !== mp.peerId),
        ...MOCK_COMMUNITY_PLAYERS
    ].filter(p => !friends.some(f => f.id === p.id))
    .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id))
    .sort((a, b) => {
        const aIsBot = a.id.startsWith('bot_');
        const bIsBot = b.id.startsWith('bot_');
        if (aIsBot && !bIsBot) return 1;
        if (!aIsBot && bIsBot) return -1;
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return 0;
    });

    const getFrameClass = (frameId?: string) => framesCatalog.find(f => f.id === frameId)?.cssClass || 'border-white/10';
    const hasOnlineFriends = friends.some(f => !f.id.startsWith('bot_') && onlineUsers.some(ou => ou.id === f.id && ou.status === 'online'));
    const hubStatusColor = hasOnlineFriends ? 'bg-green-500 shadow-[0_0_5px_lime]' : isConnectedToSupabase ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' : 'bg-gray-500';
    const formatLastSeen = (timestamp: number) => {
        if (!timestamp) return 'Jamais';
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h`;
        return `${Math.floor(hours / 24)} j`;
    };

    const getGameName = (gameId?: string) => {
        if (!gameId) return '';
        return GAME_NAMES[gameId] || gameId.charAt(0).toUpperCase() + gameId.slice(1);
    };

    return (
        <>
            <div style={{ top: `${btnTop}px` }} className="fixed right-0 z-[100] transition-none flex items-center flex-row-reverse pointer-events-none">
                <div onMouseDown={(e) => handleDragStart(e.clientY)} onTouchStart={(e) => handleDragStart(e.touches[0].clientY)} onClick={handleOpenSocial} className={`pointer-events-auto p-3 bg-gray-900/90 rounded-l-2xl ${notificationPreview ? 'text-purple-400 animate-pulse border-purple-500/50' : 'text-blue-400 hover:text-white border-blue-500/30'} border-l border-y backdrop-blur-md active:scale-95 shadow-[-5px_0_15px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none transition-colors`} title="Amis & Social">
                    {notificationPreview ? <MessageSquare size={24} /> : <Users size={24} />}
                    <div className={`absolute top-2 right-3 w-3 h-3 rounded-full border-2 border-gray-900 ${notificationPreview ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : hubStatusColor} pointer-events-none`}></div>
                    {unreadCount > 0 && <div className="absolute top-2 left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce border-2 border-black pointer-events-none">{unreadCount}</div>}
                </div>

                {/* NOTIFICATION PREVIEW BUBBLE */}
                {notificationPreview && !showSocial && (
                    <div onClick={handleOpenSocial} className="pointer-events-auto mr-2 bg-gray-900/90 backdrop-blur-md border border-purple-500/50 rounded-xl p-3 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 max-w-[200px] cursor-pointer group hover:bg-gray-800 transition-colors flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-purple-400 truncate">{notificationPreview.senderName}</span>
                            <span className="text-[10px] text-gray-500">À l'instant</span>
                        </div>
                        <p className="text-xs text-white truncate group-hover:text-purple-100">{notificationPreview.text}</p>
                        <div className="text-[10px] text-purple-500 font-bold flex items-center gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            OUVRIR <ChevronRight size={12} />
                        </div>
                    </div>
                )}
            </div>

            {selectedPlayer && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors z-10"><X size={20} /></button>
                        <div className="flex justify-center mt-8 mb-3">
                            <div className={`w-24 h-24 rounded-2xl bg-gray-900 p-1 border-2 ${getFrameClass(selectedPlayer.frameId)}`}>
                                {(() => {
                                    const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    return (<div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={48} className={avatar.color} /></div>);
                                })()}
                            </div>
                        </div>
                        <div className="px-6 pb-6 text-center">
                            <h2 className="text-2xl font-black text-white italic mb-1">{selectedPlayer.name}</h2>
                            <div className="flex flex-col items-center mb-6">
                                <div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} /><span className="text-xs text-gray-400 font-bold tracking-widest">{selectedPlayer.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</span></div>
                                <div className="mt-2 bg-gray-800/50 rounded-lg px-4 py-2 border border-white/5 flex flex-col items-center w-full max-w-[200px]">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">DERNIÈRE CONNEXION</span>
                                    <span className="text-xs font-mono text-gray-300 font-bold">{selectedPlayer.status === 'online' ? 'MAINTENANT' : formatFullDate(selectedPlayer.lastSeen)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-center mb-6">
                                {selectedPlayer.id === mp.peerId ? ( <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">C'est votre profil</div> ) : !friends.some(f => f.id === selectedPlayer?.id) ? (
                                    <button onClick={() => { sendFriendRequest(selectedPlayer!.id); setSelectedPlayer(null); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg"><UserPlus size={16} /> AJOUTER</button>
                                ) : (
                                    <>
                                        <button onClick={() => openChat(selectedPlayer!.id)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-sm transition-colors"><MessageSquare size={16} /> MESSAGE</button>
                                        <button onClick={() => { removeFriend(selectedPlayer!.id); setSelectedPlayer(null); }} className="p-2 border border-red-500/50 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSocial && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-md h-[650px] max-h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b border-white/10 flex items-center justify-center bg-black/40 relative">
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2"><Users className="text-blue-400" /> SOCIAL</h2>
                            <button onClick={() => setShowSocial(false)} className="absolute right-4 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} className="text-gray-400 hover:text-white" /></button>
                        </div>
                        <div className="flex p-2 gap-2 bg-black/20 overflow-x-auto">
                            <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'FRIENDS' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>AMIS ({friends.length})</button>
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>COMMUNAUTÉ</button>
                            <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>DEMANDES {requests.length > 0 && `(${requests.length})`}</button>
                            {activeChatId && <button onClick={() => setSocialTab('CHAT')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'CHAT' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>TCHAT</button>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                            {socialTab === 'COMMUNITY' && (
                                <div className="space-y-4">
                                    <div className={`border p-3 rounded-lg text-center mb-2 flex items-center justify-center gap-2 ${isConnectedToSupabase ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-gray-800/50 border-white/10 text-gray-400'}`}>
                                        {isConnectedToSupabase ? ( <><Cloud size={16} /> <span className="text-xs font-bold">CONNECTÉ</span></> ) : !isSupabaseConfigured ? ( <><CloudOff size={16} /> <span className="text-xs font-bold">MODE HORS-LIGNE</span></> ) : ( <><Wifi size={16} className="animate-pulse" /> <span className="text-xs font-bold">CONNEXION...</span></> )}
                                    </div>

                                    {/* GLOBAL CHAT AREA */}
                                    {globalChat.length > 0 && (
                                        <div className="bg-black/40 rounded-lg p-2 border border-white/5 mb-4">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><MessageSquare size={10}/> Chat Global</p>
                                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar-thin">
                                                {globalChat.map(msg => (
                                                    <div key={msg.id} className="text-xs flex flex-col bg-white/5 p-1.5 rounded border border-white/5">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="font-bold text-neon-blue text-[10px]">{msg.sender}</span>
                                                            <span className="text-[8px] text-gray-500">{new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <span className="text-white break-words">{msg.text}</span>
                                                    </div>
                                                ))}
                                                <div ref={globalChatEndRef}/>
                                            </div>
                                        </div>
                                    )}

                                    {/* FRIEND CODE DISPLAY */}
                                    <div className="bg-gray-800/40 p-2 rounded-lg border border-white/5 flex items-center justify-between mb-4 shadow-sm">
                                         <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase flex items-center gap-2"><User size={12}/> MON CODE AMI</span>
                                         <button onClick={() => { if(mp.peerId) { navigator.clipboard.writeText(mp.peerId); alert('Code copié !'); } }} className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-300 transition-colors active:scale-95" title="Copier le code">
                                            {mp.peerId || '...'} <Copy size={12} />
                                         </button>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-2 border border-white/5 mb-4">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Activity size={10}/> Activité récente</p>
                                        <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar-thin">
                                            {activityLog.map(log => (<div key={log.id} className={`text-xs flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 ${log.type === 'win' ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>{log.type === 'win' ? <Trophy size={10} className="text-yellow-500"/> : log.type === 'game' ? <Gamepad2 size={10} className="text-blue-400"/> : <Zap size={10} className="text-green-400"/>}<span>{log.text}</span></div>))}
                                        </div>
                                    </div>
                                    {displayedCommunity.map(player => {
                                        const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                        const AvIcon = avatar.icon;
                                        const isBot = player.id.startsWith('bot_');
                                        const isOnline = player.status === 'online';
                                        return (
                                            <div key={player.id} onClick={() => setSelectedPlayer(player as Friend)} className={`flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border ${isBot ? 'border-white/10 hover:border-purple-500/50' : 'border-green-500/30 hover:border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]'} cursor-pointer transition-all group`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}>
                                                        <AvIcon size={20} className={avatar.color} />
                                                        {isBot ? null : <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black ${isOnline ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-gray-200 group-hover:text-white">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">{isBot ? <Bot size={10}/> : <Globe size={10} className={isOnline ? "text-green-400" : "text-gray-500"}/>} {isBot ? 'Simulation' : (isOnline ? 'En Ligne' : 'Hors Ligne')}</span>
                                                    </div>
                                                </div>
                                                <UserPlus size={18} className="text-gray-600 group-hover:text-blue-400" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {socialTab === 'FRIENDS' && (
                                <div className="space-y-2">
                                    {friends.length === 0 ? <div className="text-center text-gray-500 py-8 italic text-sm">Aucun ami connecté.<br/>Allez dans l'onglet Communauté !</div> : (
                                        friends.map(friend => {
                                            const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            const isPlaying = friend.status === 'online' && friend.gameActivity && friend.gameActivity !== 'menu' && friend.gameActivity !== 'shop';
                                            const gameName = getGameName(friend.gameActivity);

                                            return (
                                                <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5 hover:bg-gray-800 transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}><AvIcon size={20} className={avatar.color} />{friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-gray-200">{friend.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] ${isPlaying ? 'text-pink-400 font-bold animate-pulse flex items-center gap-1' : 'text-gray-500'}`}>
                                                                    {isPlaying ? <><Gamepad2 size={10}/> Joue à {gameName}</> : friend.status === 'online' ? 'En ligne' : `Vu ${formatLastSeen(friend.lastSeen)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); openChat(friend.id); }} className="p-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-colors relative"><MessageSquare size={16} /></button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                            {socialTab === 'REQUESTS' && (
                                <div className="space-y-2">
                                    {requests.length === 0 ? <div className="text-center text-gray-500 py-8 italic text-sm">Aucune demande en attente.</div> : (
                                        requests.map(req => {
                                            const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            return (
                                                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={20} className={avatar.color} /></div><span className="font-bold text-sm text-gray-200">{req.name}</span></div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => acceptRequest(req)} className="p-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-colors"><CheckCircle size={18} /></button>
                                                        <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"><XCircle size={18} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                            {socialTab === 'CHAT' && activeChatId && (
                                <div className="flex flex-col h-full">
                                    {isLoadingHistory && <div className="flex justify-center p-2"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                    <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar">
                                        {messages[activeChatId]?.length > 0 ? messages[activeChatId].map((msg, i) => (
                                            <div key={i} className={`flex ${msg.senderId === username ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === username ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'} flex gap-2 items-end group relative`}>
                                                    <span>{msg.text}</span>
                                                    {msg.pending && <Clock size={10} className="text-white/70 animate-pulse mb-0.5" title="Envoi en cours..."/>}
                                                    {!msg.pending && <span className="text-[8px] opacity-50 mb-0.5">{new Date(msg.timestamp).getHours()}:{String(new Date(msg.timestamp).getMinutes()).padStart(2, '0')}</span>}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center text-gray-500 text-xs py-10 flex flex-col items-center"><Inbox size={32} className="mb-2 opacity-50"/>Aucun message. Dites bonjour !</div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendPrivateMessage} className="flex gap-2 mt-auto">
                                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500 transition-colors" autoFocus />
                                        <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 transition-colors"><Send size={20} /></button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
