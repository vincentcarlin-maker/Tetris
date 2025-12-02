
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Grid3X3, Car, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Layers, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download, User, Users, Globe, Wind, Copy, Plus, MessageSquare, Send, Circle, X, Trash2, Bell, UserPlus, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { Peer, DataConnection } from 'peerjs';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
}

// --- TYPES POUR LE SYSTÈME SOCIAL ---
interface PlayerStats {
    tetris: number;
    breaker: number;
    pacman: number;
    memory: number;
    rush: number;
    sudoku: number;
}

interface Friend {
    id: string; // Peer ID
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
    id: string; // Peer ID of sender
    name: string;
    avatarId: string;
    timestamp: number;
    stats?: PlayerStats;
}

// Composant pour le logo stylisé avec manette arcade
const ArcadeLogo = () => {
    return (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-top-8 duration-700 mb-4 relative">
            
            {/* LUMIÈRE PERMANENTE DU LOGO SUR LE MUR DE BRIQUES */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-b from-neon-pink/40 to-neon-blue/40 blur-[60px] rounded-full pointer-events-none -z-10 mix-blend-hard-light opacity-80" />

            {/* 1. THE ARCADE CONTROLLER GRAPHIC */}
            <div className="relative mb-[-25px] z-10 hover:scale-105 transition-transform duration-300 group">
                {/* Panel Body - Removed overflow-hidden to let the joystick ball stick out */}
                <div className="w-48 h-16 bg-gray-900 rounded-2xl border-2 border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15),inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-6 relative">
                    {/* Gloss Effect - Added rounded-2xl to match parent */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                    
                    {/* Joystick (Left) */}
                    <div className="relative flex items-center justify-center w-12 h-12 group-hover:-rotate-12 transition-transform duration-300">
                         {/* Stick Shaft base */}
                         <div className="absolute bottom-1/2 w-3 h-8 bg-gray-600 rounded-full origin-bottom transform -rotate-12 border border-black"></div>
                         {/* Stick Ball */}
                         <div className="absolute bottom-[40%] w-10 h-10 bg-gradient-to-br from-neon-pink via-purple-600 to-purple-900 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] border border-white/20 transform -translate-x-1 -translate-y-2 z-10">
                            <div className="absolute top-2 left-2 w-3 h-2 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
                         </div>
                         {/* Base socket */}
                         <div className="w-10 h-10 bg-black/50 rounded-full border border-gray-700 shadow-inner"></div>
                    </div>

                    {/* Buttons (Right) */}
                    <div className="grid grid-cols-2 gap-2 transform rotate-6">
                         <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] border border-white/30 animate-pulse"></div>
                         <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] border border-white/30"></div>
                    </div>
                </div>
            </div>

            {/* 2. THE TEXT LOGO (UPDATED SCRIPT STYLE) */}
            <div className="flex flex-col items-center relative z-20 mt-2">
                 <div 
                    className="font-script text-7xl text-white transform -rotate-6 z-10"
                    style={{ 
                        textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff'
                    }}
                >
                    Neon
                </div>
                <div 
                    className="font-script text-6xl text-neon-pink transform -rotate-3 -mt-4 ml-8"
                    style={{ 
                        textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff'
                    }}
                >
                    Arcade
                </div>
            </div>

        </div>
    );
};

// Helper pour les badges de mode de jeu
const GameBadge = ({ type }: { type: 'SOLO' | 'VS' | 'ONLINE' }) => {
    let styles = "";
    let icon = null;

    if (type === 'SOLO') {
        styles = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
        icon = <User size={8} />;
    } else if (type === 'VS') {
        styles = "text-pink-400 border-pink-500/30 bg-pink-500/10";
        icon = <Users size={8} />;
    } else if (type === 'ONLINE') {
        styles = "text-green-400 border-green-500/30 bg-green-500/10";
        icon = <Globe size={8} />;
    }

    return (
        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${styles}`}>
            {icon} {type}
        </span>
    );
};


export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    
    // Multiplayer Hook for "Community" tab (Global Presence)
    const mp = useMultiplayer();
    
    // State pour la lumière dynamique (Interaction)
    const [activeGlow, setActiveGlow] = useState<string | null>(null);

    // PWA Install Prompt State
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Social System State
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
    
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Record<string, DataConnection>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Construct current stats
    const getMyStats = (): PlayerStats => ({
        tetris: highScores.tetris || 0,
        breaker: highScores.breaker || 0,
        pacman: highScores.pacman || 0,
        memory: highScores.memory || 0,
        rush: Object.keys(highScores.rush || {}).length,
        sudoku: Object.keys(highScores.sudoku || {}).length
    });

    // Helpers pour gérer l'interaction tactile et souris
    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });
    
    // Username editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        audio.resumeAudio(); // Déverrouille le contexte audio, crucial pour iOS
    }, [audio]);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    // Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // --- SOCIAL SYSTEM INITIALIZATION ---
    useEffect(() => {
        // 1. Load Data
        const storedFriends = localStorage.getItem('neon_friends');
        if (storedFriends) {
            try {
                const parsed = JSON.parse(storedFriends);
                if (Array.isArray(parsed)) {
                    setFriends(parsed as Friend[]);
                }
            } catch (e) {
                console.warn('Failed to parse friends list', e);
            }
        }
        
        const storedMessages = localStorage.getItem('neon_dms');
        if (storedMessages) setMessages(JSON.parse(storedMessages));

        // 2. Initialize Peer (Persistent ID)
        let storedId = localStorage.getItem('neon_social_id');
        if (!storedId) {
            storedId = 'neon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('neon_social_id', storedId);
        }
        setMyPeerId(storedId);

        const peer = new Peer(storedId);
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('Social Peer Open:', id);
        });

        peer.on('connection', (conn) => {
            handleConnection(conn);
        });

        peer.on('error', (err) => {
            console.warn('Social Peer Error:', err);
        });

        return () => {
            peer.destroy();
            peerRef.current = null;
        };
    }, []);

    // Sync Presence in Global Lobby (useMultiplayer)
    useEffect(() => {
        if (showSocial) {
            const socialPayload = {
                id: myPeerId,
                stats: getMyStats()
            };
            mp.updateSelfInfo(username, currentAvatarId, JSON.stringify(socialPayload)); // Broadcast Social Data
            mp.connect();
        } else {
            mp.disconnect();
        }
    }, [showSocial, username, currentAvatarId, myPeerId, highScores]); // Added highScores to update stats in real-time

    // Update unread count (Messages + Requests)
    useEffect(() => {
        let count = 0;
        // Fix: Explicitly cast Object.values result to handle potential type inference issues
        (Object.values(messages) as PrivateMessage[][]).forEach(msgs => {
            msgs.forEach(m => {
                if (!m.read && m.senderId !== myPeerId) count++;
            });
        });
        count += requests.length;
        setUnreadCount(count);
    }, [messages, myPeerId, requests]);

    // Handle Incoming Connections & Data
    const handleConnection = useCallback((conn: DataConnection) => {
        conn.on('open', () => {
            connectionsRef.current[conn.peer] = conn;
        });

        conn.on('data', (data: any) => {
            if (data.type === 'HELLO_FRIEND' || data.type === 'WELCOME_FRIEND') {
                setFriends(prev => {
                    // Update friend info including stats
                    return prev.map(f => f.id === conn.peer ? { 
                        ...f, 
                        name: data.name, 
                        avatarId: data.avatarId, 
                        status: 'online' as const, 
                        lastSeen: Date.now(),
                        stats: data.stats
                    } : f);
                });
                // Persist minimal info, not online status
                const currentFriends = JSON.parse(localStorage.getItem('neon_friends') || '[]');
                const updatedStorage = currentFriends.map((f: Friend) => f.id === conn.peer ? { ...f, name: data.name, avatarId: data.avatarId, stats: data.stats } : f);
                localStorage.setItem('neon_friends', JSON.stringify(updatedStorage));
            }
            else if (data.type === 'FRIEND_REQUEST') {
                // Check if already friends
                setFriends(prev => {
                    if (prev.find(f => f.id === data.senderId)) return prev;
                    
                    // Check if request already exists
                    setRequests(currReq => {
                        if (currReq.find(r => r.id === data.senderId)) return currReq;
                        return [...currReq, { id: data.senderId, name: data.name, avatarId: data.avatarId, timestamp: Date.now(), stats: data.stats }];
                    });
                    return prev;
                });
            }
            else if (data.type === 'FRIEND_ACCEPT') {
                // They accepted my request! Add them.
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
                // Remove from requests if it was there (edge case)
                setRequests(prev => prev.filter(r => r.id !== data.senderId));
            }
            else if (data.type === 'DM') {
                const msg: PrivateMessage = {
                    id: Date.now().toString() + Math.random(),
                    senderId: conn.peer,
                    text: data.text,
                    timestamp: Date.now(),
                    read: false
                };
                
                setMessages(prev => {
                    const chat = prev[conn.peer] || [];
                    const updated = { ...prev, [conn.peer]: [...chat, msg] };
                    localStorage.setItem('neon_dms', JSON.stringify(updated));
                    return updated;
                });
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
            setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' } : f));
        });

        conn.on('error', () => {
            delete connectionsRef.current[conn.peer];
             setFriends(prev => prev.map(f => f.id === conn.peer ? { ...f, status: 'offline' } : f));
        });

    }, [username, currentAvatarId]);

    // Check status of friends when opening social hub
    useEffect(() => {
        if (showSocial && peerRef.current) {
            (friends as Friend[]).forEach(f => {
                const conn = peerRef.current!.connect(f.id);
                handleConnection(conn);
                conn.on('open', () => {
                    // Send my stats on hello
                    conn.send({ type: 'HELLO_FRIEND', name: username, avatarId: currentAvatarId, stats: getMyStats() });
                });
            });
        }
    }, [showSocial, friends.length, handleConnection, username, currentAvatarId]);

    // Scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, showSocial]);


    const addFriendByCode = () => {
        if (!friendInput.trim() || friendInput === myPeerId) return;
        if (friends.find(f => f.id === friendInput)) {
            alert('Déjà dans votre liste d\'amis !');
            return;
        }
        sendFriendRequest(friendInput);
        setFriendInput('');
        alert('Demande envoyée !');
    };

    const sendFriendRequest = (targetId: string) => {
        if (targetId === myPeerId) return;
        if (peerRef.current) {
            const conn = peerRef.current.connect(targetId);
            conn.on('open', () => {
                conn.send({ 
                    type: 'FRIEND_REQUEST', 
                    senderId: myPeerId, 
                    name: username, 
                    avatarId: currentAvatarId,
                    stats: getMyStats()
                });
                // Note: Feedback provided by UI calling this function if successful init
            });
            conn.on('error', (err) => {
                alert("Impossible de joindre le joueur (Hors ligne ou ID invalide)");
            });
        }
    };

    const acceptRequest = (req: FriendRequest) => {
        // 1. Add to friends
        const newFriend: Friend = {
            id: req.id,
            name: req.name,
            avatarId: req.avatarId,
            status: 'online',
            lastSeen: Date.now(),
            stats: req.stats
        };
        
        setFriends(prev => {
            const updated = [...prev, newFriend];
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });

        // 2. Remove request
        setRequests(prev => prev.filter(r => r.id !== req.id));

        // 3. Notify sender
        if (peerRef.current) {
            const conn = peerRef.current.connect(req.id);
            conn.on('open', () => {
                conn.send({ 
                    type: 'FRIEND_ACCEPT', 
                    senderId: myPeerId, 
                    name: username, 
                    avatarId: currentAvatarId,
                    stats: getMyStats()
                });
                handleConnection(conn); // Establish persistent connection for DM
            });
        }
    };

    const rejectRequest = (id: string) => {
        setRequests(prev => prev.filter(r => r.id !== id));
    };

    const removeFriend = (id: string) => {
        setFriends(prev => {
            const updated = prev.filter(f => f.id !== id);
            localStorage.setItem('neon_friends', JSON.stringify(updated));
            return updated;
        });
        if (activeChatId === id) setActiveChatId(null);
        if (selectedPlayer?.id === id) setSelectedPlayer(null);
    };

    const sendPrivateMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !activeChatId) return;

        const msg: PrivateMessage = {
            id: Date.now().toString(),
            senderId: myPeerId,
            text: chatInput.trim(),
            timestamp: Date.now(),
            read: true
        };

        setMessages(prev => {
            const chat = prev[activeChatId] || [];
            const updated = { ...prev, [activeChatId]: [...chat, msg] };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });

        // Send over network
        const conn = connectionsRef.current[activeChatId];
        if (conn && conn.open) {
            conn.send({ type: 'DM', text: chatInput.trim() });
        } else if (peerRef.current) {
            // Try reconnecting just in case
            const newConn = peerRef.current.connect(activeChatId);
            handleConnection(newConn);
            newConn.on('open', () => {
                 newConn.send({ type: 'DM', text: chatInput.trim() });
            });
        }

        setChatInput('');
    };

    const openChat = (friendId: string) => {
        setActiveChatId(friendId);
        setSocialTab('CHAT');
        setSelectedPlayer(null); // Close profile if open
        // Mark as read
        setMessages(prev => {
            const chat = prev[friendId];
            if (!chat) return prev;
            const updatedChat = chat.map(m => ({ ...m, read: true }));
            const updated = { ...prev, [friendId]: updatedChat };
            localStorage.setItem('neon_dms', JSON.stringify(updated));
            return updated;
        });
    };

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: any) => {
            setInstallPrompt(null);
        });
    };

    const handleReload = () => {
        window.location.reload();
    };

    const handleNameSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (tempName.trim()) {
            updateUsername(tempName.trim());
        } else {
            setTempName(username); // Revert if empty
        }
        setIsEditingName(false);
    };
    
    // Récupération des badges possédés
    const ownedBadges = catalog.filter(b => inventory.includes(b.id));

    // Current Avatar
    const currentAvatar = avatarsCatalog.find(a => a.id === currentAvatarId) || avatarsCatalog[0];
    const AvatarIcon = currentAvatar.icon;

    // Calcul des stats pour affichage
    const rushLevelsCompleted = Object.keys(highScores.rush || {}).length;
    const sudokuEasyBest = highScores.sudoku?.easy;
    const sudokuMediumBest = highScores.sudoku?.medium;
    const sudokuHardBest = highScores.sudoku?.hard;
    const breakerHighScore = highScores.breaker || 0;
    const pacmanHighScore = highScores.pacman || 0;
    const memoryBestMoves = highScores.memory || 0;

    // Get Community (Strangers from Lobby)
    // We filter out existing friends
    const communityPlayers = mp.players.filter(p => {
        if (p.extraInfo) {
            try {
                const data = JSON.parse(p.extraInfo);
                if (friends.find(f => f.id === data.id)) return false; // Already friend
            } catch (e) {
                // Ignore parsing error, keep player if IDs don't match
            }
        }
        // Pas de filtre sur 'soi-même' pour apparaître dans la liste si désiré
        return true;
    });

    const parseExtraInfo = (player: any): { id: string, stats?: PlayerStats } | null => {
        if (!player.extraInfo) return null;
        try {
            return JSON.parse(player.extraInfo);
        } catch (e) {
            return null;
        }
    };

    const renderPlayerProfile = () => {
        if (!selectedPlayer) return null;
        const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0];
        const AvIcon = avatar.icon;
        const isFriend = friends.some(f => f.id === selectedPlayer.id);
        // On considère que c'est "Moi" si l'ID correspond à mon PeerID social
        const isMe = selectedPlayer.id === myPeerId;
        const stats = selectedPlayer.stats;

        return (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative">
                    {/* Header bg */}
                    <div className={`h-24 bg-gradient-to-br ${avatar.bgGradient} relative`}>
                        <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Avatar Bubble */}
                    <div className="flex justify-center -mt-12 mb-3">
                        <div className={`w-24 h-24 rounded-2xl bg-gray-900 p-1`}>
                            <div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-2 border-white/20 shadow-lg`}>
                                <AvIcon size={48} className={avatar.color} />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 text-center">
                        <h2 className="text-2xl font-black text-white italic mb-1">{selectedPlayer.name}</h2>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} />
                            <span className="text-xs text-gray-400 font-bold tracking-widest">{selectedPlayer.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-center mb-6">
                            {isMe ? (
                                <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">
                                    C'est votre profil
                                </div>
                            ) : !isFriend ? (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        sendFriendRequest(selectedPlayer.id); 
                                        setSelectedPlayer(null); 
                                        alert("Demande d'ami envoyée !");
                                    }}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg"
                                >
                                    <UserPlus size={16} /> AJOUTER
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => openChat(selectedPlayer.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-sm transition-colors"
                                    >
                                        <MessageSquare size={16} /> MESSAGE
                                    </button>
                                    <button 
                                        onClick={() => { removeFriend(selectedPlayer.id); setSelectedPlayer(null); }}
                                        className="p-2 border border-red-500/50 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"
                                        title="Retirer des amis"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                <Activity size={12} /> STATISTIQUES
                            </h3>
                            {stats ? (
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-neon-blue font-bold">TETRIS</span>
                                        <span className="font-mono text-white">{stats.tetris?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-neon-pink font-bold">BREAKER</span>
                                        <span className="font-mono text-white">{stats.breaker?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-yellow-400 font-bold">PACMAN</span>
                                        <span className="font-mono text-white">{stats.pacman?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-purple-400 font-bold">RUSH</span>
                                        <span className="font-mono text-white">{stats.rush} NIV.</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-cyan-400 font-bold">SUDOKU</span>
                                        <span className="font-mono text-white">{stats.sudoku} VICT.</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-xs text-green-400 font-bold">MEMORY</span>
                                        <span className="font-mono text-white">{stats.memory > 0 ? stats.memory : '-'} COUPS</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs italic py-4">Aucune donnée disponible</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto">
            {/* Note: bg-transparent here allows the fixed app-background div to show through */}

            {/* Dynamic Ambient Light Reflection on Wall (Interactive Only) */}
            <div 
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-10 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`}
                style={{
                    background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none',
                    opacity: activeGlow ? 0.6 : 0
                }}
            />

            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                {/* Coin Display */}
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                </div>

                <div className="flex gap-3">
                     {/* SOCIAL BUTTON */}
                    <button 
                        onClick={() => setShowSocial(true)}
                        className="p-2 bg-gray-900/80 rounded-full text-blue-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform relative group"
                        title="Amis & Social"
                    >
                        <Users size={20} />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-bounce">
                                {unreadCount}
                            </div>
                        )}
                    </button>

                    {/* Install Button (Visible only if prompt captured) */}
                    {installPrompt && (
                        <button 
                            onClick={handleInstallClick} 
                            className="p-2 bg-neon-pink/20 rounded-full text-neon-pink hover:bg-neon-pink hover:text-white border border-neon-pink/50 backdrop-blur-sm active:scale-95 transition-all animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.4)]"
                            title="Installer l'application"
                        >
                            <Download size={20} />
                        </button>
                    )}

                    {/* Reload Button */}
                    <button 
                        onClick={handleReload} 
                        className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                        title="Actualiser l'application"
                    >
                        <RefreshCw size={20} />
                    </button>

                    {/* Mute Button */}
                    <button 
                        onClick={audio.toggleMute} 
                        className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        {audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* --- PLAYER PROFILE MODAL --- */}
            {renderPlayerProfile()}

            {/* --- SOCIAL OVERLAY --- */}
            {showSocial && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
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
                            <button onClick={() => setSocialTab('FRIENDS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'FRIENDS' ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
                                AMIS ({friends.length})
                            </button>
                            <button onClick={() => setSocialTab('COMMUNITY')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'COMMUNITY' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
                                COMMUNAUTÉ
                            </button>
                            <button onClick={() => setSocialTab('REQUESTS')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'REQUESTS' ? 'bg-pink-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
                                DEMANDES {requests.length > 0 && `(${requests.length})`}
                            </button>
                             {activeChatId && (
                                <button onClick={() => setSocialTab('CHAT')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${socialTab === 'CHAT' ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
                                    TCHAT
                                </button>
                             )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                            
                            {/* TAB: COMMUNITY (Nearby Players) */}
                            {socialTab === 'COMMUNITY' && (
                                <div className="space-y-4">
                                    <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg text-center mb-4">
                                        <p className="text-purple-300 text-xs font-bold">JOUEURS CONNECTÉS SUR LE SITE</p>
                                    </div>
                                    
                                    {communityPlayers.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                            <Globe size={48} className="mb-4 opacity-50" />
                                            <p className="text-sm">Personne d'autre n'est connecté...</p>
                                            <p className="text-xs mt-2">Invitez vos amis avec votre code !</p>
                                        </div>
                                    ) : (
                                        communityPlayers.map(player => {
                                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            
                                            const extra = parseExtraInfo(player);
                                            const socialId = extra?.id;
                                            const targetId = socialId || player.id; 
                                            const stats = extra?.stats;
                                            const isMe = targetId === myPeerId;

                                            // Construct Friend Object for Profile View
                                            const tempFriend: Friend = {
                                                id: targetId,
                                                name: player.name,
                                                avatarId: player.avatarId,
                                                status: 'online',
                                                lastSeen: Date.now(),
                                                stats: stats
                                            };

                                            return (
                                                <div 
                                                    key={player.id} 
                                                    onClick={() => setSelectedPlayer(tempFriend)}
                                                    className={`flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group ${isMe ? 'border-purple-500/50 bg-purple-900/20' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border border-white/10`}>
                                                            <AvIcon size={18} className={avatar.color} />
                                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors flex items-center gap-2">
                                                                {player.name}
                                                                {isMe && <span className="text-[9px] bg-purple-600 px-1.5 rounded text-white">(Moi)</span>}
                                                            </h4>
                                                            <p className="text-[10px] text-gray-500 font-mono">CLIQUEZ POUR VOIR PROFIL</p>
                                                        </div>
                                                    </div>
                                                    {!isMe && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                sendFriendRequest(targetId);
                                                                alert(`Demande envoyée à ${player.name}`);
                                                            }}
                                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg"
                                                            title="Ajouter en ami"
                                                        >
                                                            <UserPlus size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    
                                    <div className="pt-4 border-t border-white/10 mt-4">
                                        <button onClick={() => setSocialTab('ADD')} className="w-full py-3 text-xs text-gray-400 hover:text-white border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                                            Ajouter par Code Ami manuel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: REQUESTS */}
                            {socialTab === 'REQUESTS' && (
                                <div className="space-y-2">
                                    {requests.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                            <Bell size={48} className="mb-4 opacity-50" />
                                            <p>Aucune demande en attente.</p>
                                        </div>
                                    ) : (
                                        requests.map(req => {
                                            const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                            const AvIcon = avatar.icon;
                                            return (
                                                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-pink-500/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}>
                                                            <AvIcon size={18} className={avatar.color} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{req.name}</h4>
                                                            <p className="text-[10px] text-pink-400 font-mono">VEUT ÊTRE TON AMI</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => rejectRequest(req.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"><XCircle size={20} /></button>
                                                        <button onClick={() => acceptRequest(req)} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-full transition-colors shadow-lg"><CheckCircle size={20} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* TAB: ADD FRIEND (Manual) */}
                            {socialTab === 'ADD' && (
                                <div className="flex flex-col gap-6">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 text-center">
                                        <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Mon Code Ami</p>
                                        <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-blue-500/30">
                                            <code className="flex-1 font-mono text-blue-300 text-lg font-bold tracking-wider">{myPeerId}</code>
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(myPeerId)}
                                                className="p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors"
                                                title="Copier"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2">Partage ce code pour qu'on t'ajoute !</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ajouter un ami</p>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={friendInput}
                                                onChange={(e) => setFriendInput(e.target.value)}
                                                placeholder="Coller le code ami ici..."
                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors font-mono"
                                            />
                                            <button 
                                                onClick={addFriendByCode}
                                                className="px-4 bg-green-600 rounded-lg hover:bg-green-500 transition-colors text-white font-bold"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: FRIENDS LIST */}
                            {socialTab === 'FRIENDS' && (
                                <div className="space-y-2">
                                    {friends.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                            <Ghost size={48} className="mb-4 opacity-50" />
                                            <p>Aucun ami pour le moment.</p>
                                            <button onClick={() => setSocialTab('COMMUNITY')} className="mt-4 text-blue-400 underline text-sm">Voir la communauté</button>
                                        </div>
                                    ) : (
                                        friends.map(friend => {
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
                                                            <p className="text-[10px] text-gray-500 font-mono">
                                                                {friend.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {unread > 0 && (
                                                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                                                                {unread}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openChat(friend.id); }}
                                                            className="p-2 hover:bg-white/10 rounded-full text-gray-500 group-hover:text-white transition-colors"
                                                        >
                                                            <MessageSquare size={18} />
                                                        </button>
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
                                        {(messages[activeChatId] || []).length === 0 && (
                                            <p className="text-center text-gray-600 text-xs py-4">Début de la conversation</p>
                                        )}
                                        {(messages[activeChatId] || []).map(msg => (
                                            <div key={msg.id} className={`flex ${msg.senderId === myPeerId ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === myPeerId ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendPrivateMessage} className="flex gap-2 pt-2 border-t border-white/10">
                                        <input 
                                            type="text" 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Message..."
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors text-sm"
                                        />
                                        <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-500">
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-10 mt-12">
                 
                 <ArcadeLogo />

                 {/* CARTE DE PROFIL DU JOUEUR */}
                 <div 
                    {...bindGlow('rgba(200, 230, 255, 0.8)')}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-4 backdrop-blur-md relative overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:ring-1 hover:ring-white/30"
                 >
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                     
                     <div className="flex items-center w-full gap-4 z-10">
                        {/* Avatar */}
                        <div 
                            onClick={() => onSelectGame('shop')}
                            className={`relative w-20 h-20 rounded-xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 shadow-lg cursor-pointer hover:scale-105 transition-transform border border-white/10`}
                        >
                            <div className="w-full h-full bg-black/40 rounded-[10px] flex items-center justify-center backdrop-blur-sm">
                                <AvatarIcon size={40} className={currentAvatar.color} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[10px] text-white px-2 py-0.5 rounded-full border border-white/20">
                                EDIT
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 flex flex-col justify-center">
                            {/* Username Editing */}
                            <div className="flex items-center gap-2 mb-1">
                                {isEditingName ? (
                                    <form onSubmit={handleNameSubmit} className="flex items-center gap-2 w-full">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={() => handleNameSubmit()}
                                            maxLength={12}
                                            className="bg-black/50 border border-neon-blue rounded px-2 py-1 text-white font-bold text-lg w-full outline-none focus:ring-2 ring-neon-blue/50"
                                        />
                                        <button type="submit" className="text-green-400"><Check size={20} /></button>
                                    </form>
                                ) : (
                                    <button 
                                        onClick={() => { setTempName(username); setIsEditingName(true); }}
                                        className="flex items-center gap-2 group/edit"
                                    >
                                        <h2 className="text-2xl font-black text-white italic tracking-wide truncate max-w-[180px]">{username}</h2>
                                        <Edit2 size={14} className="text-gray-500 group-hover/edit:text-white transition-colors" />
                                    </button>
                                )}
                            </div>

                            <span className={`text-xs font-bold tracking-widest uppercase ${playerRank.color}`}>
                                {playerRank.title}
                            </span>
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="w-full h-px bg-white/10" />

                     {/* Mini Galerie des badges */}
                     {ownedBadges.length > 0 ? (
                         <div className="flex gap-3 overflow-x-auto w-full justify-start py-2 no-scrollbar z-10 mask-linear">
                             {ownedBadges.slice().reverse().map(badge => {
                                 const Icon = badge.icon;
                                 return (
                                     <div key={badge.id} className="relative shrink-0 animate-in fade-in zoom-in duration-300">
                                         <div className="w-10 h-10 bg-black/60 rounded-lg border border-white/10 flex items-center justify-center shadow-lg" title={badge.name}>
                                             <Icon size={20} className={badge.color} />
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     ) : (
                         <div className="text-xs text-gray-600 italic py-2 w-full text-center">Joue pour gagner des badges !</div>
                     )}
                 </div>

                 {/* High Scores Panel */}
                 <div 
                    {...bindGlow('rgba(250, 204, 21, 0.8)')}
                    className="w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30"
                 >
                    <button 
                        onClick={() => setShowScores(s => !s)}
                        className="w-full p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-yellow-400" />
                            <h3 className="text-lg font-bold text-white italic">MEILLEURS SCORES</h3>
                        </div>
                        <ChevronDown size={20} className={`transition-transform ${showScores ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showScores && (
                        <div className="px-4 pb-4 border-t border-white/10 animate-in fade-in duration-300">
                            <div className="py-2">
                                <h4 className="font-bold text-neon-blue">TETRIS NÉON</h4>
                                <p className="text-2xl font-mono">{highScores.tetris?.toLocaleString() || 0}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-neon-pink">NEON BREAKER</h4>
                                <p className="text-2xl font-mono">{breakerHighScore.toLocaleString() || 0}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-yellow-400">NEON PAC</h4>
                                <p className="text-2xl font-mono">{pacmanHighScore.toLocaleString() || 0}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-purple-400">NEON MEMORY</h4>
                                <p className="text-2xl font-mono">{memoryBestMoves > 0 ? memoryBestMoves + ' coups' : '-'}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-purple-400">NEON RUSH</h4>
                                {rushLevelsCompleted > 0 ? (
                                    <p className="text-sm text-gray-300">{rushLevelsCompleted} niveaux terminés</p>
                                ) : (
                                    <p className="text-sm text-gray-500">Aucun record</p>
                                )}
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-cyan-400">NEON SUDOKU</h4>
                                {sudokuEasyBest !== undefined || sudokuMediumBest !== undefined || sudokuHardBest !== undefined ? (
                                    <div className="flex justify-around text-center text-xs mt-1">
                                        <div>
                                            <p className="text-green-400">FACILE</p>
                                            <p className="font-mono text-lg">{sudokuEasyBest ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-yellow-400">MOYEN</p>
                                            <p className="font-mono text-lg">{sudokuMediumBest ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-red-500">DIFFICILE</p>
                                            <p className="font-mono text-lg">{sudokuHardBest ?? '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Aucun record</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                 {/* Shop Button */}
                 <button
                    onClick={() => onSelectGame('shop')}
                    {...bindGlow('rgba(234, 179, 8, 0.9)')}
                    className="w-full bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] 
                    hover:border-yellow-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:ring-2 hover:ring-yellow-500 hover:bg-yellow-600/20
                    backdrop-blur-md shadow-lg"
                 >
                     <div className="flex items-center gap-4">
                         <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400 group-hover:text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                             <ShoppingBag size={24} />
                         </div>
                         <div className="text-left">
                             <h3 className="text-xl font-black text-yellow-100 italic">BOUTIQUE</h3>
                             <p className="text-xs text-yellow-400/70 font-mono">BADGES & AVATARS</p>
                         </div>
                     </div>
                     <div className="px-4 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-full group-hover:scale-105 transition-transform shadow-[0_0_15px_#facc15]">
                         OUVRIR
                     </div>
                 </button>

                 <div className="w-full grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                     {/* Tetris Button */}
                     <button
                        onClick={() => onSelectGame('tetris')}
                        {...bindGlow('rgba(0, 243, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-blue/30 rounded-xl overflow-hidden transition-all duration-200 
                        hover:border-neon-blue hover:shadow-[0_0_50px_rgba(0,243,255,0.7)] hover:ring-2 hover:ring-neon-blue
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(0,243,255,1)] active:ring-neon-blue
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-colors shadow-lg group-hover:shadow-[0_0_15px_#00f3ff]">
                                    <Grid3X3 size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-blue transition-colors italic drop-shadow-md">TETRIS NÉON</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all group-hover:shadow-[0_0_15px_#00f3ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Breaker Button */}
                     <button 
                        onClick={() => onSelectGame('breaker')}
                        {...bindGlow('rgba(255, 0, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-pink/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-neon-pink hover:shadow-[0_0_50px_rgba(255,0,255,0.7)] hover:ring-2 hover:ring-neon-pink
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(255,0,255,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#ff00ff]">
                                    <Layers size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic drop-shadow-md">NEON BREAKER</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#ff00ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Neon Rush Button */}
                     <button 
                        onClick={() => onSelectGame('rush')}
                        {...bindGlow('rgba(168, 85, 247, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-purple-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-purple-500 hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:ring-2 hover:ring-purple-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(168,85,247,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#a855f7]">
                                    <Car size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-purple-400 transition-colors italic drop-shadow-md">NEON RUSH</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Niveau</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#a855f7]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Memory (UNLOCKED) */}
                     <button 
                        onClick={() => onSelectGame('memory')}
                        {...bindGlow('rgba(168, 85, 247, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-purple-400/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-purple-400 hover:shadow-[0_0_50px_rgba(192,132,252,0.7)] hover:ring-2 hover:ring-purple-400
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(192,132,252,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-purple-400 group-hover:bg-purple-400 group-hover:text-black transition-colors shadow-lg group-hover:shadow-[0_0_15px_currentColor]">
                                    <Sparkles size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-purple-300 transition-colors italic drop-shadow-md">NEON MEMORY</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                        <GameBadge type="ONLINE" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-400 group-hover:text-black transition-all group-hover:shadow-[0_0_15px_currentColor]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Connect 4 Button */}
                     <button 
                        onClick={() => onSelectGame('connect4')}
                        {...bindGlow('rgba(255, 0, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-pink/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-neon-pink hover:shadow-[0_0_50px_rgba(255,0,255,0.7)] hover:ring-2 hover:ring-neon-pink
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(255,0,255,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#ff00ff]">
                                    <CircleDot size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic drop-shadow-md">NEON CONNECT</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                        <GameBadge type="VS" />
                                        <GameBadge type="ONLINE" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 30 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#ff00ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Sudoku Button */}
                     <button 
                        onClick={() => onSelectGame('sudoku')}
                        {...bindGlow('rgba(6, 182, 212, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-cyan-500 hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] hover:ring-2 hover:ring-cyan-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(6,182,212,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#06b6d4]">
                                    <Brain size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-cyan-400 transition-colors italic drop-shadow-md">NEON SUDOKU</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#06b6d4]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Pac-Man (UNLOCKED) */}
                     <button 
                        onClick={() => onSelectGame('pacman')}
                        {...bindGlow('rgba(234, 179, 8, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-yellow-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-yellow-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.7)] hover:ring-2 hover:ring-yellow-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(234,179,8,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors shadow-lg group-hover:shadow-[0_0_15px_#facc15]">
                                    <Ghost size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-yellow-400 transition-colors italic drop-shadow-md">NEON PAC</h3>
                                    <div className="flex gap-1 mt-1 mb-0.5">
                                        <GameBadge type="SOLO" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:shadow-[0_0_15px_#facc15]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Air Hockey (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <Wind size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">AIR HOCKEY</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>

                     {/* Battleship (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <Ship size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">BATAILLE NAVALE</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>
                     
                     {/* Mastermind (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <BrainCircuit size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">MASTERMIND</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>

                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">
                    v1.8.9 • SOCIAL UPDATE
                 </div>
             </div>
        </div>
    );
}
