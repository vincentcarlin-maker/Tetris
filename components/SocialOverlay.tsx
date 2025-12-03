
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, X, MessageSquare, Send, Copy, Plus, Bell, Globe, UserPlus, CheckCircle, XCircle, Trash2, Activity } from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';

interface SocialOverlayProps {
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
    mp: ReturnType<typeof useMultiplayer>;
}

interface PlayerStats {
    tetris: number;
    breaker: number;
    pacman: number;
    memory: number;
    rush: number;
    sudoku: number;
}

interface Friend {
    id: string;
    name: string;
    avatarId: string;
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
}

interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    timestamp: number;
    stats?: PlayerStats;
}

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ audio, currency, mp }) => {
    const { username, currentAvatarId, avatarsCatalog } = currency;
    
    const [showSocial, setShowSocial] = useState(false);
    const [socialTab, setSocialTab] = useState<'FRIENDS' | 'CHAT' | 'ADD' | 'COMMUNITY' | 'REQUESTS'>('FRIENDS');
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [friendInput, setFriendInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);

    const activeChatIdRef = useRef<string | null>(null);
    const showSocialRef = useRef<boolean>(false);
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Record<string, DataConnection>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);
    const handleConnectionRef = useRef<((conn: DataConnection) => void) | null>(null);

    // Update Refs
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
        showSocialRef.current = showSocial;
    }, [activeChatId, showSocial]);

    // --- INITIALIZATION ---
    useEffect(() => {
        // Load Data - SECURED
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) {
                    setFriends(parsed.map((f: any) => ({ ...f, status: 'offline', lastSeen: f.lastSeen || 0 }))); 
                } else {
                    console.warn('Invalid friends structure, resetting');
                    localStorage.removeItem('neon_friends');
                }
            } catch (e) { 
                console.warn('Failed to parse friends, resetting', e); 
                localStorage.removeItem('neon_friends');
            }
        }
        
        const storedMessages = localStorage.getItem('neon_dms');
        if (storedMessages) {
            try {
                const parsed = JSON.parse(storedMessages);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    setMessages(parsed);
                } else {
                    console.warn('Invalid DMs structure, resetting');
                    localStorage.removeItem('neon_dms');
                }
            } catch (e) {
                console.warn('Failed to parse DMs, resetting', e);
                localStorage.removeItem('neon_dms');
            }
        }

        // Initialize Peer
        let storedId = localStorage.getItem('neon_social_id');
        if (!storedId) {
            storedId = 'neon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', storedId);
        }
        setMyPeerId(storedId);

        try {
            const peer = new Peer(storedId);
            peerRef.current = peer;

            peer.on('connection', (conn) => {
                if (handleConnectionRef.current) handleConnectionRef.current(conn);
            });
            
            peer.on('error', (err) => {
                console.error("Social Peer Error:", err);
                // Don't crash app on peer error
            });
        } catch (e) {
            console.error("Failed to initialize PeerJS:", e);
        }

        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    // Sync Global Lobby Presence
    useEffect(() => {
        // We always update self info in the global lobby, even if social modal is closed
        // This allows people to see us in the "Community" tab
        const socialPayload = {
            id: myPeerId,
            stats: { 
                tetris: 0, breaker: 0, pacman: 0, memory: 0, rush: 0, sudoku: 0 // Placeholder, handled in individual games mostly
            }
        };
        mp.updateSelfInfo(username, currentAvatarId, JSON.stringify(socialPayload));
        // We do NOT call mp.connect() here, App.tsx handles the global connection.
    }, [username, currentAvatarId, myPeerId, mp]);

    // Unread Count - SECURED LOOP
    useEffect(() => {
        let count = 0;
        if (messages && typeof messages === 'object') {
            (Object.values(messages) as PrivateMessage[][]).forEach(msgs => {
                if (Array.isArray(msgs)) {
                    msgs.forEach(m => {
                        if (m && !m.read && m.senderId !== myPeerId) count++;
                    });
                }
            });
        }
        count += requests.length;
        setUnreadCount(count);
    }, [messages, myPeerId, requests]);

    // --- PEER JS HANDLERS ---
    const handleConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            connectionsRef.current[conn.peer] = conn;
        });

        conn.on('data', (data: any) => {
            if (data.type === 'HELLO_FRIEND' || data.type === 'WELCOME_FRIEND') {
                setFriends(prev => {
                    const exists = prev.find(f => f.id === conn.peer);
                    if (!exists) return prev; // Don't add randoms as friends automatically
                    
                    return prev.map(f => f.id === conn.peer ? { 
                        ...f, 
                        name: data.name, 
                        avatarId: data.avatarId, 
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
                        return [...currReq, { id: data.senderId, name: data.name, avatarId: data.avatarId, timestamp: Date.now(), stats: data.stats }];
                    });
                }
            }
            else if (data.type === 'FRIEND_ACCEPT') {
                const newFriend: Friend = {
                    id: data.senderId,
                    name: data.name,
                    avatarId: data.avatarId,
                    status: 'online',
                    lastSeen: Date.now(),
                    stats: data.stats
                };
                
                setFriends(prev => {
                    const exists = prev.find(f => f.id === newFriend.id);
                    if (exists) return prev;
                    const updated = [...prev, newFriend];
                    localStorage.setItem('neon_friends', JSON.stringify(updated));
                    return updated;
                });
                setRequests(prev => prev.filter(r => r.id !== data.senderId));
                audio.playCoin();
            }
            else if (data.type === 'DM') {
                const isCurrentlyReading = showSocialRef.current && activeChatIdRef.current === conn.peer;
                const msg: PrivateMessage = {
                    id: Date.now().toString() + Math.random(),
                    senderId: conn.peer,
                    text: data.text,
                    timestamp: Date.now(),
                    read: isCurrentlyReading
                };
                
                setMessages(prev => {
                    const chat = prev[conn.peer] || [];
                    const updated = { ...prev, [conn.peer]: [...chat, msg] };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
                
                if (!isCurrentlyReading) audio.playCoin();
            }
            else if (data.type === 'PING') {
                 setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'online', lastSeen: Date.now() } : f));
                 conn.send({ type: 'PONG' });
            }
            else if (data.type === 'PONG') {
                 setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'online', lastSeen: Date.now() } : f));
            }
        });
        
        conn.on('close', () => {
            delete connectionsRef.current[conn.peer];
            setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' as const } : f));
        });

        conn.on('error', () => {
            delete connectionsRef.current[conn.peer];
             setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' as const } : f));
        });

    }, [username, currentAvatarId, audio]);

    useEffect(() => {
        handleConnectionRef.current = handleConnection;
    }, [handleConnection]);

    // Connect to friends when opening social
    useEffect(() => {
        if (showSocial && peerRef.current) {
            friends.forEach(f => {
                if (connectionsRef.current[f.id] && connectionsRef.current[f.id].open) return;
                try {
                    const conn = peerRef.current!.connect(f.id);
                    if (conn) {
                        handleConnection(conn);
                        conn.on('open', () => {
                            conn.send({ type: 'HELLO_FRIEND', name: username, avatarId: currentAvatarId });
                        });
                    }
                } catch (e) {
                    console.warn("Failed to connect to friend", f.id, e);
                }
            });
        }
    }, [showSocial, friends.length, handleConnection, username, currentAvatarId]);

    // Heartbeat
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            (Object.values(connectionsRef.current) as DataConnection[]).forEach(conn => {
                if (conn.open) conn.send({ type: 'PING' });
            });
            setFriends(prev => {
                let changed = false;
                const newFriends = prev.map(f => {
                    if (f.status === 'online') {
                        if (!f.lastSeen || (now - f.lastSeen > 15000)) {
                            const conn = connectionsRef.current[f.id];
                            if (conn) { conn.close(); delete connectionsRef.current[f.id]; }
                            changed = true;
                            return { ...f, status: 'offline' as const };
                        }
                    }
                    return f;
                });
                if (changed) localStorage.setItem('neon_friends', JSON.stringify(newFriends));
                return newFriends;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, showSocial]);

    // --- ACTIONS ---
    const sendFriendRequest = (targetId: string) => {
        if (targetId === myPeerId) return;
        if (connectionsRef.current[targetId]?.open) {
            connectionsRef.current[targetId].send({ type: 'FRIEND_REQUEST', senderId: myPeerId, name: username, avatarId: currentAvatarId });
            alert('Demande envoyée !');
            return;
        }
        if (peerRef.current) {
            try {
                const conn = peerRef.current.connect(targetId);
                handleConnection(conn);
                conn.on('open', () => {
                    setTimeout(() => {
                        conn.send({ type: 'FRIEND_REQUEST', senderId: myPeerId, name: username, avatarId: currentAvatarId });
                    }, 500);
                });
                alert('Demande envoyée !');
            } catch (e) {
                alert('Erreur lors de l\'envoi de la demande.');
            }
        }
    };

    const acceptRequest = (req: FriendRequest) => {
        const newFriend: Friend = { id: req.id, name: req.name, avatarId: req.avatarId, status: 'online', lastSeen: Date.now(), stats: req.stats };
        setFriends(prev => {
            const updated = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        setRequests(prev => prev.filter(r => r.id !== req.id));

        if (connectionsRef.current[req.id]?.open) {
             connectionsRef.current[req.id].send({ type: 'FRIEND_ACCEPT', senderId: myPeerId, name: username, avatarId: currentAvatarId });
        } else if (peerRef.current) {
            try {
                const conn = peerRef.current.connect(req.id);
                conn.on('open', () => {
                    conn.send({ type: 'FRIEND_ACCEPT', senderId: myPeerId, name: username, avatarId: currentAvatarId });
                    handleConnection(conn);
                });
            } catch(e) { console.warn('Could not connect to accept request', e); }
        }
    };

    const sendPrivateMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeChatId) return;

        const msg: PrivateMessage = { id: Date.now().toString(), senderId: myPeerId, text: chatInput.trim(), timestamp: Date.now(), read: true };
        setMessages(prev => {
            const chat = prev[activeChatId] || [];
            const updated = { ...prev, [activeChatId]: [...chat, msg] };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });

        const conn = connectionsRef.current[activeChatId];
        if (conn && conn.open) conn.send({ type: 'DM', text: chatInput.trim() });
        setChatInput('');
    };

    const openChat = (friendId: string) => {
        setActiveChatId(friendId);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        setMessages(prev => {
            const chat = prev[friendId];
            if (!chat) return prev;
            const updatedChat = chat.map(m => m.senderId !== myPeerId ? { ...m, read: true } : m);
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

    // Filter community players
    const communityPlayers = mp.players.filter(p => {
        if (p.id === myPeerId) return false; 
        if (p.extraInfo) {
            try {
                const data = JSON.parse(p.extraInfo);
                if (friends.find(f => f.id === data.id)) return false; 
            } catch (e) { }
        }
        return true;
    });

    const parseExtraInfo = (player: any) => {
        if (!player.extraInfo) return null;
        try { return JSON.parse(player.extraInfo); } catch (e) { return null; }
    };

    return (
        <>
            {/* FLOATING BUTTON (Right Side Tab) */}
            <button 
                onClick={() => setShowSocial(true)}
                className="fixed top-1/2 right-0 -translate-y-1/2 z-[100] p-3 bg-gray-900/90 rounded-l-2xl text-blue-400 hover:text-white border-l border-y border-blue-500/30 backdrop-blur-md active:scale-95 transition-all shadow-[-5px_0_15px_rgba(0,0,0,0.5)] group"
                title="Amis & Social"
            >
                <Users size={24} />
                {unreadCount > 0 && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce border-2 border-black">
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* PLAYER PROFILE MODAL */}
            {selectedPlayer && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors z-10"><X size={20} /></button>
                        
                        <div className="flex justify-center mt-8 mb-3">
                            <div className="w-24 h-24 rounded-2xl bg-gray-900 p-1">
                                {(() => {
                                    const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    return (
                                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-2 border-white/20 shadow-lg`}>
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
                            </div>

                            <div className="flex gap-2 justify-center mb-6">
                                {selectedPlayer.id === myPeerId ? (
                                    <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">C'est votre profil</div>
                                ) : !friends.some(f => f.id === selectedPlayer.id) ? (
                                    <button onClick={() => { sendFriendRequest(selectedPlayer.id); setSelectedPlayer(null); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg"><UserPlus size={16} /> AJOUTER</button>
                                ) : (
                                    <>
                                        <button onClick={() => openChat(selectedPlayer.id)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-sm transition-colors"><MessageSquare size={16} /> MESSAGE</button>
                                        <button onClick={() => { removeFriend(selectedPlayer.id); setSelectedPlayer(null); }} className="p-2 border border-red-500/50 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN SOCIAL MODAL */}
            {showSocial && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-900 w-full max-w-md h-[650px] max-h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                                <Users className="text-blue-400" /> HUB SOCIAL
                            </h2>
                            <button onClick={() => setShowSocial(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
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
                                    <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg text-center mb-4">
                                        <p className="text-purple-300 text-xs font-bold">JOUEURS CONNECTÉS</p>
                                    </div>
                                    {communityPlayers.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Globe size={48} className="mb-4 opacity-50" /><p className="text-sm">Personne d'autre n'est connecté...</p></div>
                                    ) : (
                                        communityPlayers.map(player => {
                                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            const extra = parseExtraInfo(player);
                                            const targetId = extra?.id || player.id; 
                                            const isMe = targetId === myPeerId;
                                            const tempFriend: Friend = { id: targetId, name: player.name, avatarId: player.avatarId, status: 'online', lastSeen: Date.now(), stats: extra?.stats };

                                            return (
                                                <div key={player.id} onClick={() => setSelectedPlayer(tempFriend)} className={`flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border border-white/10`}><AvIcon size={18} className={avatar.color} /></div>
                                                        <div><h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">{player.name} {isMe && '(Moi)'}</h4></div>
                                                    </div>
                                                    {!isMe && <button onClick={(e) => { e.stopPropagation(); sendFriendRequest(targetId); }} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg"><UserPlus size={16} /></button>}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div className="pt-4 border-t border-white/10 mt-4"><button onClick={() => setSocialTab('ADD')} className="w-full py-3 text-xs text-gray-400 hover:text-white border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors">Ajouter par Code Ami manuel</button></div>
                                </div>
                            )}

                            {/* TAB: REQUESTS */}
                            {socialTab === 'REQUESTS' && (
                                <div className="space-y-2">
                                    {requests.length === 0 ? <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Bell size={48} className="mb-4 opacity-50" /><p>Aucune demande.</p></div> : requests.map(req => {
                                        const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                        const AvIcon = avatar.icon;
                                        return (
                                            <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-pink-500/30">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><AvIcon size={18} className={avatar.color} /></div>
                                                    <div><h4 className="font-bold text-white text-sm">{req.name}</h4></div>
                                                </div>
                                                <div className="flex gap-2"><button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="p-2 hover:bg-red-500/20 text-red-500 rounded-full"><XCircle size={20} /></button><button onClick={() => acceptRequest(req)} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg"><CheckCircle size={20} /></button></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TAB: ADD FRIEND */}
                            {socialTab === 'ADD' && (
                                <div className="flex flex-col gap-6">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 text-center">
                                        <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Mon Code Ami</p>
                                        <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-blue-500/30">
                                            <code className="flex-1 font-mono text-blue-300 text-lg font-bold tracking-wider">{myPeerId}</code>
                                            <button onClick={() => navigator.clipboard.writeText(myPeerId)} className="p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={friendInput} onChange={(e) => setFriendInput(e.target.value)} placeholder="Code ami..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors font-mono" />
                                        <button onClick={() => { if(friendInput.trim()) sendFriendRequest(friendInput); setFriendInput(''); }} className="px-4 bg-green-600 rounded-lg hover:bg-green-500 transition-colors text-white font-bold"><Plus size={20} /></button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: FRIENDS */}
                            {socialTab === 'FRIENDS' && (
                                <div className="space-y-2">
                                    {friends.length === 0 ? <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Users size={48} className="mb-4 opacity-50" /><p>Aucun ami.</p><button onClick={() => setSocialTab('COMMUNITY')} className="mt-4 text-blue-400 underline text-sm">Voir la communauté</button></div> : friends.map(friend => {
                                        const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                                        const AvIcon = avatar.icon;
                                        const unread = (messages[friend.id] || []).filter(m => !m.read && m.senderId !== myPeerId).length;
                                        return (
                                            <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="group flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border border-white/10`}>
                                                        <AvIcon size={20} className={avatar.color} />
                                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${friend.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white group-hover:text-blue-300 transition-colors">{friend.name}</h4>
                                                        <p className="text-[10px] text-gray-500 font-mono">{friend.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {unread > 0 && <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">{unread}</div>}
                                                    <button onClick={(e) => { e.stopPropagation(); openChat(friend.id); }} className="p-2 hover:bg-white/10 rounded-full text-gray-500 group-hover:text-white transition-colors"><MessageSquare size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TAB: CHAT */}
                            {socialTab === 'CHAT' && activeChatId && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar">
                                        {(messages[activeChatId] || []).length === 0 && <p className="text-center text-gray-600 text-xs py-4">Début de la conversation</p>}
                                        {(messages[activeChatId] || []).map(msg => (
                                            <div key={msg.id} className={`flex ${msg.senderId === myPeerId ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === myPeerId ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>{msg.text}</div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendPrivateMessage} className="flex gap-2 pt-2 border-t border-white/10">
                                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors text-sm" />
                                        <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-500"><Send size={20} /></button>
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
