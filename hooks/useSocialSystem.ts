
import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, DataConnection } from 'peerjs';
import { useGameAudio } from './useGameAudio';
import { useCurrency } from './useCurrency';
import { useHighScores } from './useHighScores';
import { useMultiplayer } from './useMultiplayer';

export interface PlayerStats {
    tetris: number;
    breaker: number;
    pacman: number;
    memory: number;
    rush: number;
    sudoku: number;
}

export interface Friend {
    id: string;
    name: string;
    avatarId: string;
    status: 'online' | 'offline';
    lastSeen: number;
    stats?: PlayerStats;
}

export interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
}

export interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    timestamp: number;
    stats?: PlayerStats;
}

const NEON_BOT_ID = 'NEON_BOT_AI';
const NEON_BOT_NAME = 'Neon Bot 🤖';

export const useSocialSystem = (audio: ReturnType<typeof useGameAudio>, currency: ReturnType<typeof useCurrency>) => {
    const { username, currentAvatarId } = currency;
    const { highScores } = useHighScores();
    const mp = useMultiplayer();

    const [showSocial, setShowSocial] = useState(false);
    const [socialTab, setSocialTab] = useState<'FRIENDS' | 'CHAT' | 'ADD' | 'COMMUNITY' | 'REQUESTS'>('FRIENDS');
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [messages, setMessages] = useState<Record<string, PrivateMessage[]>>({});
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedPlayer, setSelectedPlayer] = useState<Friend | null>(null);

    const activeChatIdRef = useRef<string | null>(null);
    const showSocialRef = useRef<boolean>(false);
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Record<string, DataConnection>>({});
    const handleConnectionRef = useRef<((conn: DataConnection) => void) | null>(null);

    // Construct current stats
    const getMyStats = (): PlayerStats => ({
        tetris: highScores.tetris || 0,
        breaker: highScores.breaker || 0,
        pacman: highScores.pacman || 0,
        memory: highScores.memory || 0,
        rush: Object.keys(highScores.rush || {}).length,
        sudoku: Object.keys(highScores.sudoku || {}).length
    });

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
        showSocialRef.current = showSocial;
    }, [activeChatId, showSocial]);

    // --- HEARTBEAT SYSTEM ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            (Object.values(connectionsRef.current) as DataConnection[]).forEach(conn => {
                if (conn.open) {
                    try { conn.send({ type: 'PING' }); } catch (e) {}
                }
            });

            setFriends(prev => {
                let changed = false;
                const newFriends = prev.map(f => {
                    // Bot always online
                    if (f.id === NEON_BOT_ID) {
                        return { ...f, status: 'online' as const, lastSeen: now };
                    }

                    if (f.status === 'online') {
                        if (!f.lastSeen || (now - f.lastSeen > 15000)) {
                            const conn = connectionsRef.current[f.id];
                            if (conn) {
                                conn.close();
                                delete connectionsRef.current[f.id];
                            }
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

    // --- INITIALIZATION ---
    useEffect(() => {
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) {
                    setFriends(parsed.map((f: any) => ({ ...f, status: 'offline', lastSeen: f.lastSeen || 0 }))); 
                }
            } catch (e) {}
        }
        
        const storedMessages = localStorage.getItem('neon_dms');
        if (storedMessages) setMessages(JSON.parse(storedMessages));

        let storedId = localStorage.getItem('neon_social_id');
        if (!storedId) {
            storedId = 'neon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', storedId);
        }
        setMyPeerId(storedId);

        const peer = new Peer(storedId);
        peerRef.current = peer;

        peer.on('connection', (conn) => {
            if (handleConnectionRef.current) handleConnectionRef.current(conn);
        });

        return () => {
            peer.destroy();
            peerRef.current = null;
        };
    }, []);

    // Sync Presence in Global Lobby
    useEffect(() => {
        const socialPayload = { id: myPeerId, stats: getMyStats() };
        mp.updateSelfInfo(username, currentAvatarId, JSON.stringify(socialPayload));
        // We always connect to MP now to be visible globally
        mp.connect(); 
        // Note: mp.disconnect() is handled by the hook cleanup or app unmount
    }, [username, currentAvatarId, myPeerId, highScores]);

    // Unread Count
    useEffect(() => {
        let count = 0;
        (Object.values(messages) as PrivateMessage[][]).forEach(msgs => {
            msgs.forEach(m => {
                if (!m.read && m.senderId !== myPeerId) count++;
            });
        });
        count += requests.length;
        setUnreadCount(count);
    }, [messages, myPeerId, requests]);

    const handleConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            connectionsRef.current[conn.peer] = conn;
        });

        conn.on('data', (data: any) => {
            if (data.type === 'HELLO_FRIEND' || data.type === 'WELCOME_FRIEND') {
                setFriends(prev => {
                    return prev.map(f => f.id === conn.peer ? { 
                        ...f, 
                        name: data.name, 
                        avatarId: data.avatarId, 
                        status: 'online' as const, 
                        lastSeen: Date.now(),
                        stats: data.stats
                    } : f);
                });
                const currentFriends = JSON.parse(localStorage.getItem('neon_friends') || '[]');
                const updatedStorage = currentFriends.map((f: Friend) => f.id === conn.peer ? { ...f, name: data.name, avatarId: data.avatarId, stats: data.stats, lastSeen: Date.now() } : f);
                localStorage.setItem('neon_friends', JSON.stringify(updatedStorage));
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
                const newFriend: Friend = { id: data.senderId, name: data.name, avatarId: data.avatarId, status: 'online', lastSeen: Date.now(), stats: data.stats };
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
                const msg: PrivateMessage = { id: Date.now().toString() + Math.random(), senderId: conn.peer, text: data.text, timestamp: Date.now(), read: isCurrentlyReading };
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
            setFriends(prev => {
                const newFriends = prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' as const } : f);
                localStorage.setItem('neon_friends', JSON.stringify(newFriends));
                return newFriends;
            });
        });

        conn.on('error', () => {
            delete connectionsRef.current[conn.peer];
             setFriends(prev => {
                const newFriends = prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' as const } : f);
                localStorage.setItem('neon_friends', JSON.stringify(newFriends));
                return newFriends;
             });
        });

    }, [username, currentAvatarId, audio]);

    useEffect(() => {
        handleConnectionRef.current = handleConnection;
    }, [handleConnection]);

    // Check status of friends when opening social hub
    useEffect(() => {
        if (showSocial && peerRef.current) {
            (friends as Friend[]).forEach(f => {
                // Skip Bot connection attempt
                if (f.id === NEON_BOT_ID) return;

                if (connectionsRef.current[f.id] && connectionsRef.current[f.id].open) return;
                const conn = peerRef.current!.connect(f.id);
                handleConnection(conn);
                conn.on('open', () => {
                    conn.send({ type: 'HELLO_FRIEND', name: username, avatarId: currentAvatarId, stats: getMyStats() });
                });
            });
        }
    }, [showSocial, friends.length, handleConnection, username, currentAvatarId]);

    // --- ACTIONS ---

    const openChat = (friendId: string) => {
        setActiveChatId(friendId);
        setSocialTab('CHAT');
        setSelectedPlayer(null);
        setMessages(prev => {
            const chat = prev[friendId];
            if (!chat) return prev;
            const hasUnread = chat.some(m => !m.read && m.senderId !== myPeerId);
            if (!hasUnread) return prev;
            const updatedChat = chat.map(m => m.senderId !== myPeerId ? { ...m, read: true } : m);
            const updated = { ...prev, [friendId]: updatedChat };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });
    };

    const sendFriendRequest = (targetId: string) => {
        if (targetId === myPeerId) return;

        // --- BOT FRIEND LOGIC ---
        if (targetId === NEON_BOT_ID) {
             const botFriend: Friend = { 
                 id: NEON_BOT_ID, 
                 name: NEON_BOT_NAME, 
                 avatarId: 'av_bot', 
                 status: 'online', 
                 lastSeen: Date.now(), 
                 stats: { tetris: 999999, breaker: 999999, pacman: 999999, memory: 1, rush: 20, sudoku: 100 } 
             };
             setFriends(prev => {
                const exists = prev.find(f => f.id === botFriend.id);
                if (exists) return prev;
                const updated = [...prev, botFriend];
                localStorage.setItem('neon_friends', JSON.stringify(updated));
                return updated;
             });
             audio.playCoin();
             return;
        }

        if (connectionsRef.current[targetId] && connectionsRef.current[targetId].open) {
            connectionsRef.current[targetId].send({ type: 'FRIEND_REQUEST', senderId: myPeerId, name: username, avatarId: currentAvatarId, stats: getMyStats() });
            alert('Demande envoyée !');
            return;
        }
        if (peerRef.current) {
            const conn = peerRef.current.connect(targetId);
            handleConnection(conn); 
            conn.on('open', () => {
                setTimeout(() => {
                    conn.send({ type: 'FRIEND_REQUEST', senderId: myPeerId, name: username, avatarId: currentAvatarId, stats: getMyStats() });
                }, 500);
            });
            conn.on('error', () => alert("Impossible de joindre le joueur (Hors ligne ou ID invalide)"));
            alert('Demande envoyée !');
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
        
        if (connectionsRef.current[req.id] && connectionsRef.current[req.id].open) {
             connectionsRef.current[req.id].send({ type: 'FRIEND_ACCEPT', senderId: myPeerId, name: username, avatarId: currentAvatarId, stats: getMyStats() });
        } else if (peerRef.current) {
            const conn = peerRef.current.connect(req.id);
            conn.on('open', () => {
                conn.send({ type: 'FRIEND_ACCEPT', senderId: myPeerId, name: username, avatarId: currentAvatarId, stats: getMyStats() });
                handleConnection(conn);
            });
        }
    };

    const rejectRequest = (id: string) => setRequests(prev => prev.filter(r => r.id !== id));

    const removeFriend = (id: string) => {
        setFriends(prev => {
            const updated = prev.filter(f => f.id !== id);
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        if (activeChatId === id) setActiveChatId(null);
        if (selectedPlayer?.id === id) setSelectedPlayer(null);
    };

    const sendPrivateMessage = (text: string) => {
        if (!text.trim() || !activeChatId) return;
        
        const msg: PrivateMessage = { id: Date.now().toString(), senderId: myPeerId, text: text.trim(), timestamp: Date.now(), read: true };
        setMessages(prev => {
            const chat = prev[activeChatId] || [];
            const updated = { ...prev, [activeChatId]: [...chat, msg] };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });

        // --- BOT CHAT LOGIC ---
        if (activeChatId === NEON_BOT_ID) {
            setTimeout(() => {
                const replies = [
                    "Bip boup ! Je suis un robot. 🤖",
                    "Je m'entraîne pour Tetris là...",
                    "Viens jouer contre moi en classé !",
                    "01001000 01100101 01101100 01101100 01101111",
                    "Tu veux un conseil ? Vise les coins."
                ];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                const botMsg: PrivateMessage = { 
                    id: Date.now().toString(), 
                    senderId: NEON_BOT_ID, 
                    text: reply, 
                    timestamp: Date.now(), 
                    read: false 
                };
                setMessages(prev => {
                    const chat = prev[NEON_BOT_ID] || [];
                    const updated = { ...prev, [NEON_BOT_ID]: [...chat, botMsg] };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
                audio.playCoin();
            }, 1000);
            return;
        }

        const conn = connectionsRef.current[activeChatId];
        if (conn && conn.open) {
            conn.send({ type: 'DM', text: text.trim() });
        } else if (peerRef.current) {
            const newConn = peerRef.current.connect(activeChatId);
            handleConnection(newConn);
            newConn.on('open', () => { newConn.send({ type: 'DM', text: text.trim() }); });
        }
    };

    return {
        showSocial, setShowSocial,
        socialTab, setSocialTab,
        myPeerId,
        friends, requests, messages,
        activeChatId, setActiveChatId,
        unreadCount,
        selectedPlayer, setSelectedPlayer,
        openChat,
        sendFriendRequest,
        acceptRequest,
        rejectRequest,
        removeFriend,
        sendPrivateMessage,
        mp, // Expose raw multiplayer hook for Lobby listing
        getMyStats,
        NEON_BOT_ID,
        NEON_BOT_NAME
    };
};
