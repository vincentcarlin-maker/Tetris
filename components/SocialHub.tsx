
import React, { useState, useEffect, useRef } from 'react';
import { Users, X, Globe, Bell, Ghost, Copy, Plus, MessageSquare, Send, XCircle, CheckCircle, UserPlus, Trash2, Activity } from 'lucide-react';
import { useSocialSystem, Friend, FriendRequest } from '../hooks/useSocialSystem';
import { useCurrency } from '../hooks/useCurrency';

interface SocialHubProps {
    social: ReturnType<typeof useSocialSystem>;
    currency: ReturnType<typeof useCurrency>;
}

// Helper pour formater la date
const formatLastSeen = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return 'Jamais';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} j`;
    return new Date(timestamp).toLocaleDateString();
};

export const SocialHub: React.FC<SocialHubProps> = ({ social, currency }) => {
    const { 
        showSocial, setShowSocial, socialTab, setSocialTab, myPeerId, friends, requests, messages, activeChatId, 
        selectedPlayer, setSelectedPlayer, openChat, sendFriendRequest, acceptRequest, rejectRequest, 
        removeFriend, sendPrivateMessage, mp 
    } = social;
    const { avatarsCatalog } = currency;

    const [friendInput, setFriendInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, showSocial]);

    if (!showSocial) return null;

    // Filter community players
    const communityPlayers = mp.players.filter(p => {
        if (p.id === myPeerId) return false;
        // Check if friend by manually parsing if stored in string format
        const isFriend = friends.some(f => f.id === p.id);
        if (isFriend) return false; 
        
        // Also check detailed extraInfo if IDs differ
        if (p.extraInfo) {
            try {
                const data = JSON.parse(p.extraInfo);
                if (friends.find(f => f.id === data.id)) return false; 
            } catch (e) {}
        }
        return true;
    });

    const renderPlayerProfile = () => {
        if (!selectedPlayer) return null;
        const avatar = avatarsCatalog.find(a => a.id === selectedPlayer.avatarId) || avatarsCatalog[0];
        const AvIcon = avatar.icon;
        const isFriend = friends.some(f => f.id === selectedPlayer.id);
        const isMe = selectedPlayer.id === myPeerId;
        const stats = selectedPlayer.stats;

        return (
            <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative">
                    <button onClick={() => setSelectedPlayer(null)} className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-400 hover:text-white transition-colors z-10">
                        <X size={20} />
                    </button>
                    <div className="flex justify-center mt-8 mb-3">
                        <div className={`w-24 h-24 rounded-2xl bg-gray-900 p-1`}>
                            <div className={`w-full h-full rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border-2 border-white/20 shadow-lg`}>
                                <AvIcon size={48} className={avatar.color} />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pb-6 text-center">
                        <h2 className="text-2xl font-black text-white italic mb-1">{selectedPlayer.name}</h2>
                        <div className="flex flex-col items-center mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${selectedPlayer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} />
                                <span className="text-xs text-gray-400 font-bold tracking-widest">{selectedPlayer.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</span>
                            </div>
                            {selectedPlayer.status === 'offline' && selectedPlayer.lastSeen > 0 && (
                                <span className="text-[10px] text-gray-600 font-mono">VU : {formatLastSeen(selectedPlayer.lastSeen)}</span>
                            )}
                        </div>
                        <div className="flex gap-2 justify-center mb-6">
                            {isMe ? (
                                <div className="px-4 py-2 bg-gray-800 rounded-full font-bold text-sm text-gray-400 border border-white/10">C'est votre profil</div>
                            ) : !isFriend ? (
                                <button onClick={(e) => { e.stopPropagation(); sendFriendRequest(selectedPlayer.id); setSelectedPlayer(null); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shadow-lg">
                                    <UserPlus size={16} /> AJOUTER
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => openChat(selectedPlayer.id)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-sm transition-colors"><MessageSquare size={16} /> MESSAGE</button>
                                    <button onClick={() => { removeFriend(selectedPlayer.id); setSelectedPlayer(null); }} className="p-2 border border-red-500/50 text-red-500 hover:bg-red-500/20 rounded-full transition-colors"><Trash2 size={16} /></button>
                                </>
                            )}
                        </div>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><Activity size={12} /> STATISTIQUES</h3>
                            {stats ? (
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-neon-blue font-bold">TETRIS</span><span className="font-mono text-white">{stats.tetris?.toLocaleString()}</span></div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-neon-pink font-bold">BREAKER</span><span className="font-mono text-white">{stats.breaker?.toLocaleString()}</span></div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-yellow-400 font-bold">PACMAN</span><span className="font-mono text-white">{stats.pacman?.toLocaleString()}</span></div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-purple-400 font-bold">RUSH</span><span className="font-mono text-white">{stats.rush} NIV.</span></div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-cyan-400 font-bold">SUDOKU</span><span className="font-mono text-white">{stats.sudoku} VICT.</span></div>
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg"><span className="text-xs text-green-400 font-bold">MEMORY</span><span className="font-mono text-white">{stats.memory > 0 ? stats.memory : '-'} COUPS</span></div>
                                </div>
                            ) : <div className="text-gray-500 text-xs italic py-4">Aucune donnée disponible</div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-900 w-full max-w-md h-[650px] max-h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
                {renderPlayerProfile()}
                
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Users className="text-blue-400" /> HUB SOCIAL
                    </h2>
                    <button onClick={() => setShowSocial(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-gray-400 hover:text-white" />
                    </button>
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
                            <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg text-center mb-4"><p className="text-purple-300 text-xs font-bold">JOUEURS CONNECTÉS SUR LE SITE</p></div>
                            {communityPlayers.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Globe size={48} className="mb-4 opacity-50" /><p className="text-sm">Personne d'autre n'est connecté...</p><p className="text-xs mt-2">Invitez vos amis avec votre code !</p></div>
                            ) : (
                                communityPlayers.map(player => {
                                    const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    let stats;
                                    try { stats = JSON.parse(player.extraInfo || '{}').stats; } catch(e){}
                                    const tempFriend: Friend = { id: player.id, name: player.name, avatarId: player.avatarId, status: 'online', lastSeen: Date.now(), stats: stats };
                                    return (
                                        <div key={player.id} onClick={() => setSelectedPlayer(tempFriend)} className={`flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border border-white/10`}><AvIcon size={18} className={avatar.color} /><div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 bg-green-500 shadow-[0_0_8px_#22c55e]" /></div>
                                                <div><h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors flex items-center gap-2">{player.name}</h4><p className="text-[10px] text-gray-500 font-mono">CLIQUEZ POUR VOIR PROFIL</p></div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); sendFriendRequest(player.id); }} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg" title="Ajouter en ami"><UserPlus size={16} /></button>
                                        </div>
                                    );
                                })
                            )}
                            <div className="pt-4 border-t border-white/10 mt-4"><button onClick={() => setSocialTab('ADD')} className="w-full py-3 text-xs text-gray-400 hover:text-white border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors">Ajouter par Code Ami manuel</button></div>
                        </div>
                    )}

                    {socialTab === 'REQUESTS' && (
                        <div className="space-y-2">
                            {requests.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Bell size={48} className="mb-4 opacity-50" /><p>Aucune demande en attente.</p></div>
                            ) : (
                                requests.map(req => {
                                    const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    return (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-xl border border-pink-500/30">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><AvIcon size={18} className={avatar.color} /></div>
                                                <div><h4 className="font-bold text-white text-sm">{req.name}</h4><p className="text-[10px] text-pink-400 font-mono">VEUT ÊTRE TON AMI</p></div>
                                            </div>
                                            <div className="flex gap-2"><button onClick={() => rejectRequest(req.id)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"><XCircle size={20} /></button><button onClick={() => acceptRequest(req)} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-full transition-colors shadow-lg"><CheckCircle size={20} /></button></div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {socialTab === 'ADD' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/10 text-center">
                                <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Mon Code Ami</p>
                                <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg border border-blue-500/30">
                                    <code className="flex-1 font-mono text-blue-300 text-lg font-bold tracking-wider">{myPeerId}</code>
                                    <button onClick={() => navigator.clipboard.writeText(myPeerId)} className="p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors" title="Copier"><Copy size={16} /></button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Partage ce code pour qu'on t'ajoute !</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ajouter un ami</p>
                                <div className="flex gap-2">
                                    <input type="text" value={friendInput} onChange={(e) => setFriendInput(e.target.value)} placeholder="Coller le code ami ici..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-green-500 transition-colors font-mono" />
                                    <button onClick={() => { if(friendInput.trim() && friendInput !== myPeerId) { sendFriendRequest(friendInput); setFriendInput(''); } }} className="px-4 bg-green-600 rounded-lg hover:bg-green-500 transition-colors text-white font-bold"><Plus size={20} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {socialTab === 'FRIENDS' && (
                        <div className="space-y-2">
                            {friends.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center"><Ghost size={48} className="mb-4 opacity-50" /><p>Aucun ami pour le moment.</p><button onClick={() => setSocialTab('COMMUNITY')} className="mt-4 text-blue-400 underline text-sm">Voir la communauté</button></div>
                            ) : (
                                friends.map(friend => {
                                    const avatar = avatarsCatalog.find(a => a.id === friend.avatarId) || avatarsCatalog[0];
                                    const AvIcon = avatar.icon;
                                    const unread = (messages[friend.id] || []).filter(m => !m.read && m.senderId !== myPeerId).length;
                                    return (
                                        <div key={friend.id} onClick={() => setSelectedPlayer(friend)} className="group flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border border-white/10`}><AvIcon size={20} className={avatar.color} /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${friend.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-500'}`} /></div>
                                                <div><h4 className="font-bold text-white group-hover:text-blue-300 transition-colors">{friend.name}</h4><p className="text-[10px] text-gray-500 font-mono">{friend.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}</p></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {unread > 0 && <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">{unread}</div>}
                                                <button onClick={(e) => { e.stopPropagation(); openChat(friend.id); }} className="p-2 hover:bg-white/10 rounded-full text-gray-500 group-hover:text-white transition-colors"><MessageSquare size={18} /></button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

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
                            <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()){ sendPrivateMessage(chatInput); setChatInput(''); } }} className="flex gap-2 pt-2 border-t border-white/10">
                                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors text-sm" />
                                <button type="submit" disabled={!chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-500"><Send size={20} /></button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
