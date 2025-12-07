
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, X, MessageSquare, Send, Copy, Plus, Bell, Globe, UserPlus, CheckCircle, XCircle, Trash2, Activity, Play, Bot, Wifi, Radar, Zap, Trophy, Gamepad2, CloudOff, Cloud, Settings, Save, RefreshCw, BarChart2, Clock } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { saveSupabaseConfig, clearSupabaseConfig, getStoredConfig } from '../lib/supabaseClient';
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
    [key: string]: any; // To allow for snake, invaders, etc.
}

interface Friend {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    stats?: PlayerStats;
}

interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
    pending?: boolean; // New for store & forward
}

interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
    stats?: PlayerStats;
}

// --- MOCK DATA FOR COMMUNITY ---
const MOCK_COMMUNITY_PLAYERS: Friend[] = [
    { id: 'bot_1', name: 'NeonStriker', avatarId: 'av_rocket', status: 'online', lastSeen: Date.now(), stats: { tetris: 12000, breaker: 5000, pacman: 0, memory: 0, rush: 5, sudoku: 0 } },
    { id: 'bot_2', name: 'PixelQueen', avatarId: 'av_cat', frameId: 'fr_neon_pink', status: 'online', lastSeen: Date.now(), stats: { tetris: 5000, breaker: 8000, pacman: 15000, memory: 12, rush: 10, sudoku: 0 } },
    { id: 'bot_3', name: 'CyberWolf', avatarId: 'av_skull', frameId: 'fr_glitch', status: 'online', lastSeen: Date.now(), stats: { tetris: 25000, breaker: 2000, pacman: 5000, memory: 0, rush: 20, sudoku: 0 } },
    { id: 'bot_4', name: 'RetroMaster', avatarId: 'av_game', status: 'offline', lastSeen: Date.now() - 300000, stats: { tetris: 0, breaker: 0, pacman: 20000, memory: 0, rush: 0, sudoku: 0 } },
    { id: 'bot_5', name: 'GlitchHunter', avatarId: 'av_ghost', frameId: 'fr_cyber', status: 'online', lastSeen: Date.now(), stats: { tetris: 15000, breaker: 15000, pacman: 15000, memory: 20, rush: 15, sudoku: 0 } },
    { id: 'bot_6', name: 'ArcadeFan', avatarId: 'av_bot', status: 'online', lastSeen: Date.now(), stats: { tetris: 2000, breaker: 1000, pacman: 2000, memory: 5, rush: 2, sudoku: 0 } },
    { id: 'bot_7', name: 'VaporWave', avatarId: 'av_sun', frameId: 'fr_sunset', status: 'online', lastSeen: Date.now(), stats: { tetris: 8000, breaker: 2000, pacman: 1000, memory: 0, rush: 0, sudoku: 0 } },
    { id: 'bot_8', name: 'Dr.Pixels', avatarId: 'av_human', status: 'online', lastSeen: Date.now(), stats: { tetris: 30000, breaker: 0, pacman: 0, memory: 50, rush: 0, sudoku: 0 } },
];

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

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ audio, currency, mp, onlineUsers, isConnectedToSupabase, isSupabaseConfigured }) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    
    const [showSocial, setShowSocial] = useState(false);
    const [socialTab, setSocialTab] = useState<'FRIENDS' | 'CHAT' | 'ADD' | 'COMMUNITY' | 'REQUESTS'>('COMMUNITY');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [friendInput, setFriendInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);
    
    // Config Modal State
    const [showConfig, setShowConfig] = useState(false);
    const [configUrl, setConfigUrl] = useState('');
    const [configKey, setConfigKey] = useState('');
    
    // Server Activity Log State
    const [activityLog, setActivityLog] = useState<{id: number, text: string, type: 'game'|'login'|'win'}[]>([]);

    // Draggable Button State
    const [btnTop, setBtnTop] = useState(window.innerHeight / 3);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef(0);
    const initialTopRef = useRef(0);

    const activeChatIdRef = useRef<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Update Refs
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    // --- DRAG LOGIC ---
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


    // --- INITIALIZATION ---
    useEffect(() => {
        // Load Data
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) {
                    setFriends(parsed.map((f: any) => ({ ...f, status: 'offline', lastSeen: f.lastSeen || 0 }))); 
                }
            } catch (e) { localStorage.removeItem('neon_friends'); }
        }
        
        const storedMessages = localStorage.getItem('neon_dms');
        if (storedMessages) {
            try {
                const parsed = JSON.parse(storedMessages);
                if (parsed && typeof parsed === 'object') setMessages(parsed);
            } catch (e) { localStorage.removeItem('neon_dms'); }
        }
        
        // Load Config for UI
        const conf = getStoredConfig();
        setConfigUrl(conf.url);
        setConfigKey(conf.key);
    }, []);

    // --- SYNC FRIENDS ONLINE STATUS & STATS ---
    useEffect(() => {
        setFriends(prevFriends => {
            const updated = prevFriends.map(f => {
                const onlineUser = onlineUsers.find(u => u.id === f.id);
                // Note: onlineUser might have status 'offline' now due to persistence in useSupabase
                const isRealUserOnline = onlineUser && onlineUser.status === 'online';
                const isBot = f.id.startsWith('bot_');

                const newStatus = (isRealUserOnline || isBot) ? 'online' : 'offline';
                const newStats = onlineUser ? onlineUser.stats : f.stats; // Get updated stats from real user

                // Only update if status or stats changed to avoid loops
                if (f.status !== newStatus || JSON.stringify(f.stats) !== JSON.stringify(newStats)) {
                    return { ...f, status: newStatus, lastSeen: Date.now(), stats: newStats };
                }
                return f;
            });

            // Equality check to prevent re-render loop if nothing changed
            if (JSON.stringify(updated) !== JSON.stringify(prevFriends)) {
                return updated;
            }
            return prevFriends;
        });
    }, [onlineUsers]);

    // --- STORE & FORWARD LOGIC ---
    useEffect(() => {
        if (!mp.isConnected || !isConnectedToSupabase) return;

        // Check for pending messages for currently online users
        onlineUsers.forEach(user => {
            if (user.status !== 'online') return;
            
            const userMessages = messages[user.id];
            if (userMessages && userMessages.some(m => m.pending)) {
                // Found pending messages for this online user
                const pendingMsgs = userMessages.filter(m => m.pending);
                
                // Send them one by one
                pendingMsgs.forEach(msg => {
                    mp.connectTo(user.id);
                    // Use a small timeout to ensure connection is established if not already
                    setTimeout(() => {
                        mp.sendTo(user.id, { type: 'DM', text: msg.text });
                    }, 500);
                });

                // Mark as sent locally
                setMessages(prev => {
                    const chat = prev[user.id];
                    if (!chat) return prev;
                    const updatedChat = chat.map(m => m.pending ? { ...m, pending: undefined } : m);
                    const updated = { ...prev, [user.id]: updatedChat };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
            }
        });
    }, [onlineUsers, messages, mp, isConnectedToSupabase]);


    // --- ACTIVITY GENERATOR ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.4) { // 60% chance to skip to vary timing
                const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
                
                // PRIORITÉ AUX AMIS EN LIGNE (80% de chance)
                const onlineFriends = friends.filter(f => f.status === 'online');
                let randomUser: Friend | undefined;

                if (onlineFriends.length > 0 && Math.random() > 0.2) {
                    // Priorité aux amis
                    randomUser = onlineFriends[Math.floor(Math.random() * onlineFriends.length)];
                } else {
                    // Sinon mélange bots et joueurs globaux (filtrés en ligne seulement)
                    const potentialUsers = [...MOCK_COMMUNITY_PLAYERS, ...onlineUsers.filter(u => u.status === 'online').map(u => ({...u} as Friend))];
                    if (potentialUsers.length > 0) {
                        randomUser = potentialUsers[Math.floor(Math.random() * potentialUsers.length)];
                    }
                }
                
                if (randomUser) {
                    const text = template.replace("{name}", randomUser.name);
                    
                    let type: 'game' | 'login' | 'win' = 'game';
                    if (text.includes('connecté')) type = 'login';
                    if (text.includes('gagné') || text.includes('record')) type = 'win';

                    setActivityLog(prev => {
                        const newLog = [{ id: Date.now(), text, type }, ...prev].slice(0, 10); // Keep last 10
                        return newLog;
                    });
                }
            }
        }, 3000); // New event every ~3-5 seconds

        return () => clearInterval(interval);
    }, [onlineUsers, friends]);

    // Unread Count
    useEffect(() => {
        let count = 0;
        if (messages && typeof messages === 'object') {
            (Object.values(messages) as PrivateMessage[][]).forEach(msgs => {
                if (Array.isArray(msgs)) {
                    msgs.forEach(m => {
                        if (m && !m.read && m.senderId !== mp.peerId) count++;
                    });
                }
            });
        }
        count += requests.length;
        setUnreadCount(count);
    }, [messages, mp.peerId, requests]);

    // Auto-mark messages
    useEffect(() => {
        if (showSocial && activeChatId && messages[activeChatId]) {
            const hasUnread = messages[activeChatId].some(m => !m.read && m.senderId !== mp.peerId);
            if (hasUnread) {
                setMessages(prev => {
                    const chat = prev[activeChatId];
                    if (!chat) return prev;
                    const updatedChat = chat.map(m => m.senderId !== mp.peerId && !m.read ? { ...m, read: true } : m);
                    const updated = { ...prev, [activeChatId]: updatedChat };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
            }
        }
    }, [messages, activeChatId, showSocial, mp.peerId]);

    // --- SHARED MP SUBSCRIPTION ---
    useEffect(() => {
        // Subscribe to messages via the shared MP instance
        const unsubscribe = mp.subscribe((data: any, conn: any) => {
            const senderId = conn.peer;

            if (data.type === 'HELLO' || data.type === 'HELLO_FRIEND') {
                setFriends(prev => {
                    if (!prev.find(f => f.id === senderId)) return prev;
                    return prev.map(f => f.id === senderId ? { 
                        ...f, 
                        name: data.name, 
                        avatarId: data.avatarId, 
                        frameId: data.frameId,
                        status: 'online' as const, 
                        lastSeen: Date.now(),
                        stats: data.stats
                    } : f);
                });
            }
            else if (data.type === 'FRIEND_REQUEST') {
                const currentFriends = JSON.parse(localStorage.getItem('neon_friends') || '[]');
                const alreadyFriend = currentFriends.some((f: any) => f.id === data.senderId);

                if (!alreadyFriend) {
                    setRequests(currReq => {
                        if (currReq.find(r => r.id === data.senderId)) return currReq;
                        audio.playCoin(); 
                        return [...currReq, { id: data.senderId, name: data.name, avatarId: data.avatarId, frameId: data.frameId, timestamp: Date.now(), stats: data.stats }];
                    });
                }
            }
            else if (data.type === 'FRIEND_ACCEPT') {
                const newFriend: Friend = {
                    id: data.senderId,
                    name: data.name,
                    avatarId: data.avatarId,
                    frameId: data.frameId,
                    status: 'online',
                    lastSeen: Date.now(),
                    stats: data.stats
                };
                
                setFriends(prev => {
                    if (prev.find(f => f.id === newFriend.id)) return prev;
                    const updated = [...prev, newFriend];
                    localStorage.setItem('neon_friends', JSON.stringify(updated));
                    return updated;
                });
                setRequests(prev => prev.filter(r => r.id !== data.senderId));
                audio.playCoin();
            }
            else if (data.type === 'DM') {
                const isCurrentlyReading = showSocial && activeChatIdRef.current === senderId;
                const msg: PrivateMessage = {
                    id: Date.now().toString() + Math.random(),
                    senderId: senderId,
                    text: data.text,
                    timestamp: Date.now(),
                    read: isCurrentlyReading
                };
                
                setMessages(prev => {
                    const chat = prev[senderId] || [];
                    const updated = { ...prev, [senderId]: [...chat, msg] };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
                
                if (!isCurrentlyReading) audio.playCoin();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [mp, showSocial, audio]);

    // Connect to friends automatically when online (No longer requires opening social tab)
    useEffect(() => {
        if (mp.isConnected && friends.length > 0) {
            friends.forEach(f => {
                // Don't connect to bots via PeerJS
                if (!f.id.startsWith('bot_')) {
                    // Only connect if they are actually online (via Supabase)
                    const onlineStatus = onlineUsers.find(u => u.id === f.id)?.status;
                    if (onlineStatus === 'online') {
                        mp.connectTo(f.id);
                    }
                }
            });
        }
    }, [mp.isConnected, friends, mp, onlineUsers]);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, showSocial]);

    // --- ACTIONS ---
    const sendFriendRequest = (targetId: string) => {
        if (targetId === mp.peerId) return;

        // --- BOT LOGIC ---
        if (targetId.startsWith('bot_')) {
            alert(`Demande envoyée !`);
            
            // Simulate Acceptance Delay
            setTimeout(() => {
                const bot = MOCK_COMMUNITY_PLAYERS.find(b => b.id === targetId);
                if (bot) {
                    setFriends(prev => {
                        // Avoid duplicates
                        if (prev.find(f => f.id === bot.id)) return prev;
                        
                        audio.playVictory(); // Sound feedback
                        
                        // Fake Welcome Message
                        const welcomeMsg = ["Salut !", "Prêt à jouer ?", "Duel ?", "Bienvenue !", "Hey !"][Math.floor(Math.random() * 5)];
                        const msg: PrivateMessage = {
                            id: Date.now().toString(),
                            senderId: bot.id,
                            text: welcomeMsg,
                            timestamp: Date.now(),
                            read: false
                        };
                        setMessages(prevMsgs => {
                            const updated = { ...prevMsgs, [bot.id]: [msg] };
                            localStorage.setItem('neon_dms', JSON.stringify(updated));
                            return updated;
                        });

                        const updated = [...prev, { ...bot, status: 'online' }];
                        localStorage.setItem('neon_friends', JSON.stringify(updated));
                        return updated;
                    });
                }
            }, 1500);
            return;
        }

        // --- REAL LOGIC ---
        mp.connectTo(targetId);
        // Send request after short delay to ensure connection
        setTimeout(() => {
            mp.sendTo(targetId, { type: 'FRIEND_REQUEST', senderId: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId });
            alert('Demande envoyée !');
        }, 500);
    };

    const acceptRequest = (req: FriendRequest) => {
        const newFriend: Friend = { id: req.id, name: req.name, avatarId: req.avatarId, frameId: req.frameId, status: 'online', lastSeen: Date.now(), stats: req.stats };
        setFriends(prev => {
            const updated = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        setRequests(prev => prev.filter(r => r.id !== req.id));

        mp.connectTo(req.id);
        setTimeout(() => {
            mp.sendTo(req.id, { type: 'FRIEND_ACCEPT', senderId: mp.peerId, name: username, avatarId: currentAvatarId, frameId: currentFrameId });
        }, 500);
    };

    const sendPrivateMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeChatId || !mp.peerId) return;

        // Is user online?
        const onlineUser = onlineUsers.find(u => u.id === activeChatId);
        const isOnline = (onlineUser && onlineUser.status === 'online') || activeChatId.startsWith('bot_');
        
        const msg: PrivateMessage = { 
            id: Date.now().toString(), 
            senderId: mp.peerId, 
            text: chatInput.trim(), 
            timestamp: Date.now(), 
            read: true,
            pending: !isOnline // Store & Forward flag
        };

        setMessages(prev => {
            const chat = prev[activeChatId] || [];
            const updated = { ...prev, [activeChatId]: [...chat, msg] };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });

        // Handle Bot Reply
        if (activeChatId.startsWith('bot_')) {
            setTimeout(() => {
                const replies = ["Haha", "Bien joué", "Ok", "On verra !", ":)", "Pas mal", "Trop fort"];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                const botMsg: PrivateMessage = { id: Date.now().toString(), senderId: activeChatId, text: reply, timestamp: Date.now(), read: false };
                setMessages(prev => {
                    const chat = prev[activeChatId] || [];
                    const updated = { ...prev, [activeChatId]: [...chat, botMsg] };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
                audio.playCoin();
            }, 2000);
        } else if (isOnline) {
            // Send Immediately
            mp.sendTo(activeChatId, { type: 'DM', text: chatInput.trim() });
        } else {
            // Queued locally, will be sent by useEffect when user comes online
        }
        
        setChatInput('');
    };

    const openChat = (friendId: string) => {
        setActiveChatId(friendId);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        setMessages(prev => {
            const chat = prev[friendId];
            if (!chat) return prev;
            const updatedChat = chat.map(m => m.senderId !== mp.peerId ? { ...m, read: true } : m);
            const updated = { ...prev, [friendId]: updatedChat };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });
    };

    const formatLastSeen = (timestamp: number) => {
        if (!timestamp) return 'Jamais';
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h`;
        return `${Math.floor(hours / 24)} j`;
    };

    const removeFriend = (id: string) => {
        setFriends(prev => {
            const updated = prev.filter(f => f.id !== id);
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        if (activeChatId === id) setActiveChatId(null);
    };

    // --- COMMUNITY LOGIC ---
    // Merge online users (persisted via useSupabase) and bots
    const displayedCommunity = [
        ...onlineUsers.filter(u => u.id !== mp.peerId), // Supabase Global (includes offline history now)
        ...MOCK_COMMUNITY_PLAYERS // Bots
    ]
    .filter(p => !friends.some(f => f.id === p.id)) // Filter out friends
    .filter((p, index, self) => index === self.findIndex((t) => t.id === p.id)) // Dedupe
    .sort((a, b) => {
        // Sort: Bots last, then online first, then offline
        const aIsBot = a.id.startsWith('bot_');
        const bIsBot = b.id.startsWith('bot_');
        if (aIsBot && !bIsBot) return 1;
        if (!aIsBot && bIsBot) return -1;
        
        // Both real or both bots
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        
        return 0;
    });

    const getFrameClass = (frameId?: string) => {
        return framesCatalog.find(f => f.id === frameId)?.cssClass || 'border-white/10';
    };

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        saveSupabaseConfig(configUrl, configKey);
        setShowConfig(false);
    };

    const hasOnlineFriends = friends.some(
        f => !f.id.startsWith('bot_') && onlineUsers.some(ou => ou.id === f.id && ou.status === 'online')
    );

    const hubStatusColor = hasOnlineFriends
        ? 'bg-green-500 shadow-[0_0_5px_lime]'
        : isConnectedToSupabase
        ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' // Blue for connected but no friends online
        : 'bg-gray-500';

    return (
        <>
            {/* DRAGGABLE FLOATING BUTTON */}
            <div 
                style={{ top: `${btnTop}px` }}
                className="fixed right-0 z-[100] transition-none"
            >
                <div
                    onMouseDown={(e) => handleDragStart(e.clientY)}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
                    onClick={() => { if (!isDraggingRef.current) setShowSocial(true); }}
                    className="p-3 bg-gray-900/90 rounded-l-2xl text-blue-400 hover:text-white border-l border-y border-blue-500/30 backdrop-blur-md active:scale-95 shadow-[-5px_0_15px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center relative touch-none"
                    title="Amis & Social"
                >
                    <Users size={24} />
                    {/* Status Dot - Repositioned inside the button */}
                    <div className={`absolute top-2 right-3 w-3 h-3 rounded-full border-2 border-gray-900 ${hubStatusColor} pointer-events-none`}></div>
                    
                    {unreadCount > 0 && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce border-2 border-black pointer-events-none">
                            {unreadCount}
                        </div>
                    )}
                </div>
            </div>

            {/* PLAYER PROFILE MODAL */}
            {selectedPlayer && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors z-10"><X size={20} /></button>
                        
                        <div className="flex justify-center mt-8 mb-3">
                            <div className={`w-24 h-24 rounded-2xl bg-gray-900 p-1 border-2 ${getFrameClass(selectedPlayer.frameId)}`}>
                                {(() => {
                                    const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    return (
                                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}>
                                            <AvIcon size={48} className={avatar.color} />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="px-6 pb-6 text-center">
                            <h2 className="text-2xl font-black text-white italic mb-1">{selectedPlayer.name}</h2>
                            <div className="flex flex-col items-center mb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} />
                                    <span className="text-xs text-gray-400 font-bold tracking-widest">{selectedPlayer.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</span>
                                </div>
                                {selectedPlayer.status === 'offline' && selectedPlayer.lastSeen > 0 && <span className="text-[10px] text-gray-600 font-mono">VU : {formatLastSeen(selectedPlayer.lastSeen)}</span>}
                                {selectedPlayer.id.startsWith('bot_') && <span className="text-[10px] text-blue-400 font-mono bg-blue-900/30 px-2 rounded mt-1">SIMULATION IA</span>}
                                {!selectedPlayer.id.startsWith('bot_') && <span className="text-[10px] text-green-400 font-mono bg-green-900/30 px-2 rounded mt-1">JOUEUR RÉEL</span>}
                            </div>

                            {/* STATISTICS GRID */}
                            {selectedPlayer.stats && (
                                <div className="bg-black/40 rounded-xl p-3 mb-6 border border-white/5">
                                    <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-center gap-2"><BarChart2 size={12}/> STATISTIQUES</h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between bg-gray-800/50 p-1.5 rounded">
                                            <span className="text-gray-400">Tetris</span>
                                            <span className="text-neon-blue font-mono font-bold">{selectedPlayer.stats.tetris?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between bg-gray-800/50 p-1.5 rounded">
                                            <span className="text-gray-400">Pacman</span>
                                            <span className="text-yellow-400 font-mono font-bold">{selectedPlayer.stats.pacman?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between bg-gray-800/50 p-1.5 rounded">
                                            <span className="text-gray-400">Breaker</span>
                                            <span className="text-pink-400 font-mono font-bold">{selectedPlayer.stats.breaker?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="flex justify-between bg-gray-800/50 p-1.5 rounded">
                                            <span className="text-gray-400">Snake</span>
                                            <span className="text-green-400 font-mono font-bold">{(selectedPlayer.stats as any).snake?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 justify-center mb-6">
                                {selectedPlayer.id === mp.peerId ? (
                                    <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">C'est votre profil</div>
                                ) : !friends.some(f => f.id === selectedPlayer?.id) ? (
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

            {/* CONFIG MODAL */}
            {showConfig && (
                <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] p-6 relative">
                        <button onClick={() => setShowConfig(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X size={20} /></button>
                        
                        <h2 className="text-xl font-black text-white italic mb-4 flex items-center gap-2">
                            <Settings className="text-blue-400"/> CONFIG. CLOUD
                        </h2>
                        
                        <p className="text-gray-400 text-xs mb-4">
                            Connectez-vous à Supabase pour voir les joueurs en ligne.
                            <br/><span className="text-blue-400 hover:underline cursor-pointer" onClick={() => window.open('https://supabase.com', '_blank')}>Créer un compte gratuit</span>
                        </p>

                        <form onSubmit={handleSaveConfig} className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">URL PROJET</label>
                                <input type="text" value={configUrl} onChange={e => setConfigUrl(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="https://xyz.supabase.co" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">CLÉ API (ANON)</label>
                                <input type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="ey..." />
                            </div>
                            
                            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg mt-2 flex items-center justify-center gap-2">
                                <Save size={16} /> SAUVEGARDER
                            </button>
                        </form>
                        
                        <button onClick={() => { clearSupabaseConfig(); setShowConfig(false); }} className="w-full py-2 border border-red-500/30 text-red-400 hover:bg-red-900/20 font-bold rounded-lg mt-2 flex items-center justify-center gap-2 text-xs">
                            <RefreshCw size={14} /> RÉINITIALISER
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN SOCIAL MODAL */}
            {showSocial && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-md h-[650px] max-h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-center bg-black/40 relative">
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                                <Users className="text-blue-400" /> SOCIAL
                            </h2>
                            <button onClick={() => setShowSocial(false)} className="absolute right-4 p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-2 gap-2 bg-black/20 overflow-x-auto">
                            <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'FRIENDS' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>AMIS ({friends.length})</button>
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>COMMUNAUTÉ</button>
                            <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>DEMANDES {requests.length > 0 && `(${requests.length})`}</button>
                            {activeChatId && <button onClick={() => setSocialTab('CHAT')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'CHAT' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>TCHAT</button>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                            {/* TAB: COMMUNITY */}
                            {socialTab === 'COMMUNITY' && (
                                <div className="space-y-4">
                                    {/* CLOUD STATUS */}
                                    <div className={`border p-3 rounded-lg text-center mb-2 flex items-center justify-center gap-2 ${isConnectedToSupabase ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-gray-800/50 border-white/10 text-gray-400'}`}>
                                        {isConnectedToSupabase ? (
                                            <><Cloud size={16} /> <span className="text-xs font-bold">CONNECTÉ</span></>
                                        ) : !isSupabaseConfigured ? (
                                            <><CloudOff size={16} /> <span className="text-xs font-bold">MODE HORS-LIGNE</span></>
                                        ) : (
                                            <><Wifi size={16} className="animate-pulse" /> <span className="text-xs font-bold">CONNEXION...</span></>
                                        )}
                                    </div>

                                    {/* ACTIVITY FEED */}
                                    <div className="bg-black/30 rounded-lg p-2 border border-white/5 mb-4">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Activity size={10}/> Activité récente</p>
                                        <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar-thin">
                                            {activityLog.map(log => (
                                                <div key={log.id} className="text-xs text-gray-300 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    {log.type === 'win' ? <Trophy size={10} className="text-yellow-500"/> : log.type === 'game' ? <Gamepad2 size={10} className="text-blue-400"/> : <Zap size={10} className="text-green-400"/>}
                                                    <span>{log.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {displayedCommunity.map(player => {
                                        const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                        const AvIcon = avatar.icon;
                                        // Cast to Friend type for safety with mock data
                                        const tempFriend: Friend = { 
                                            id: player.id, 
                                            name: player.name, 
                                            avatarId: player.avatarId, 
                                            frameId: (player as any).frameId, 
                                            status: player.status, 
                                            lastSeen: player.lastSeen,
                                            stats: (player as any).stats
                                        };
                                        const isBot = player.id.startsWith('bot_');
                                        const isOnline = player.status === 'online';
                                        
                                        return (
                                            <div key={player.id} onClick={() => setSelectedPlayer(tempFriend)} className={`flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border ${isBot ? 'border-white/10 hover:border-purple-500/50' : 'border-green-500/30 hover:border-green-500/50 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]'} cursor-pointer transition-all group`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}>
                                                        <AvIcon size={20} className={avatar.color} />
                                                        {isBot ? null : <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black ${isOnline ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-gray-200 group-hover:text-white">{player.name}</span>
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            {isBot ? <Bot size={10}/> : <Globe size={10} className={isOnline ? "text-green-400" : "text-gray-500"}/>} 
                                                            {isBot ? 'Simulation' : (isOnline ? 'En Ligne' : 'Hors Ligne')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <UserPlus size={18} className="text-gray-600 group-hover:text-blue-400" />
                                            </div>
                                        );
                                    })}
                                    
                                    {displayedCommunity.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                                            <Radar size={32} className="animate-spin opacity-50"/>
                                            <p className="text-xs">Recherche de joueurs...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: FRIENDS */}
                            {socialTab === 'FRIENDS' && (
                                <div className="space-y-2">
                                    {friends.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8 italic text-sm">
                                            Aucun ami connecté.<br/>Allez dans l'onglet Communauté !
                                        </div>
                                    ) : (
                                        friends.map(friend => {
                                            const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            // Stats preview
                                            const bestScore = friend.stats ? Math.max(friend.stats.tetris || 0, friend.stats.breaker || 0, friend.stats.pacman || 0) : 0;

                                            return (
                                                <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5 hover:bg-gray-800 transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative`}>
                                                            <AvIcon size={20} className={avatar.color} />
                                                            {friend.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-gray-200">{friend.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-500">{friend.status === 'online' ? 'En ligne' : `Vu ${formatLastSeen(friend.lastSeen)}`}</span>
                                                                {bestScore > 0 && (
                                                                    <span className="text-[9px] bg-yellow-900/40 text-yellow-500 px-1.5 rounded border border-yellow-500/20 flex items-center gap-0.5">
                                                                        <Trophy size={8}/> {bestScore.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); openChat(friend.id); }} className="p-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-colors">
                                                        <MessageSquare size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* TAB: REQUESTS */}
                            {socialTab === 'REQUESTS' && (
                                <div className="space-y-2">
                                    {requests.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8 italic text-sm">Aucune demande en attente.</div>
                                    ) : (
                                        requests.map(req => {
                                            const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            return (
                                                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={20} className={avatar.color} /></div>
                                                        <span className="font-bold text-sm text-gray-200">{req.name}</span>
                                                    </div>
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

                            {/* TAB: CHAT */}
                            {socialTab === 'CHAT' && activeChatId && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar">
                                        {messages[activeChatId]?.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.senderId === mp.peerId ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === mp.peerId ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'} flex gap-2 items-end`}>
                                                    <span>{msg.text}</span>
                                                    {msg.pending && <Clock size={10} className="text-white/70 animate-pulse mb-0.5" title="En attente de connexion"/>}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendPrivateMessage} className="flex gap-2 mt-auto">
                                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500 transition-colors" />
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
