
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, X, MessageSquare, Send, Copy, Plus, Bell, Globe, UserPlus, CheckCircle, XCircle, Trash2, Activity } from 'lucide-react';
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
}

interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
    stats?: PlayerStats;
}

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ audio, currency, mp }) => {
    const { username, currentAvatarId, currentFrameId, avatarsCatalog, framesCatalog } = currency;
    
    const [showSocial, setShowSocial] = useState(false);
    const [socialTab, setSocialTab] = useState<'FRIENDS' | 'CHAT' | 'ADD' | 'COMMUNITY' | 'REQUESTS'>('FRIENDS');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [friendInput, setFriendInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);

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
    }, []);

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

    // Connect to friends when opening social
    useEffect(() => {
        if (showSocial) {
            friends.forEach(f => {
                mp.connectTo(f.id);
            });
        }
    }, [showSocial, friends, mp]);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, showSocial]);

    // --- ACTIONS ---
    const sendFriendRequest = (targetId: string) => {
        if (targetId === mp.peerId) return;
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

        const msg: PrivateMessage = { id: Date.now().toString(), senderId: mp.peerId, text: chatInput.trim(), timestamp: Date.now(), read: true };
        setMessages(prev => {
            const chat = prev[activeChatId] || [];
            const updated = { ...prev, [activeChatId]: [...chat, msg] };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });

        mp.sendTo(activeChatId, { type: 'DM', text: chatInput.trim() });
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

    // Filter community players (exclude self and friends)
    const communityPlayers = mp.players.filter(p => {
        if (p.id === mp.peerId) return false; 
        if (friends.find(f => f.id === p.id)) return false; 
        return true;
    });

    const getFrameClass = (frameId?: string) => {
        return framesCatalog.find(f => f.id === frameId)?.cssClass || 'border-white/10';
    };

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
                            </div>

                            <div className="flex gap-2 justify-center mb-6">
                                {selectedPlayer.id === mp.peerId ? (
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
                                            const isMe = player.id === mp.peerId;
                                            const tempFriend: Friend = { id: player.id, name: player.name, avatarId: player.avatarId, frameId: undefined, status: 'online', lastSeen: Date.now() };

                                            return (
                                                <div key={player.id} onClick={() => setSelectedPlayer(tempFriend)} className={`flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border-2 ${getFrameClass()}`}>
                                                            <AvIcon size={18} className={avatar.color} />
                                                        </div>
                                                        <div><h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">{player.name} {isMe && '(Moi)'}</h4></div>
                                                    </div>
                                                    {!isMe && <button onClick={(e) => { e.stopPropagation(); sendFriendRequest(player.id); }} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg"><UserPlus size={16} /></button>}
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
                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-2 ${getFrameClass(req.frameId)}`}><AvIcon size={18} className={avatar.color} /></div>
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
                                            <code className="flex-1 font-mono text-blue-300 text-lg font-bold tracking-wider">{mp.peerId}</code>
                                            <button onClick={() => navigator.clipboard.writeText(mp.peerId || '')} className="p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors"><Copy size={16} /></button>
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
                                        const unread = (messages[friend.id] || []).filter(m => !m.read && m.senderId !== mp.peerId).length;
                                        return (
                                            <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="group flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border-2 ${getFrameClass(friend.frameId)}`}>
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
                                            <div key={msg.id} className={`flex ${msg.senderId === mp.peerId ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === mp.peerId ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>{msg.text}</div>
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
