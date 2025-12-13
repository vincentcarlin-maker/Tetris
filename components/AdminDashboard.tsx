
import React, { useState, useEffect } from 'react';
import { Home, Users, BarChart2, Calendar, Coins, Search, ArrowUp, Activity, Database, LayoutGrid, Trophy, X, Shield, Clock, Gamepad2, ChevronRight, Trash2, Ban, AlertTriangle, Check, Radio, Plus, Zap, Eye } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';
import { AVATARS_CATALOG, FRAMES_CATALOG } from '../hooks/useCurrency';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { OnlineUser } from '../hooks/useSupabase';

interface AdminDashboardProps {
    onBack: () => void;
    mp: ReturnType<typeof useMultiplayer>;
    onlineUsers: OnlineUser[];
}

const GAME_COLORS: Record<string, string> = {
    'tetris': 'text-cyan-400 border-cyan-500/50 bg-cyan-900/20',
    'breaker': 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-900/20',
    'pacman': 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20',
    'snake': 'text-green-400 border-green-500/50 bg-green-900/20',
    'invaders': 'text-red-400 border-red-500/50 bg-red-900/20',
    'menu': 'text-gray-400 border-gray-600/50 bg-gray-900/40',
    'shop': 'text-orange-400 border-orange-500/50 bg-orange-900/20'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, mp, onlineUsers }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'LIVE' | 'BROADCAST'>('OVERVIEW');
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    
    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType, setBroadcastType] = useState<'info' | 'warning'>('info');
    
    // Coin Gift State
    const [giftAmount, setGiftAmount] = useState(500);

    // Action Confirmation State
    const [confirmAction, setConfirmAction] = useState<{ type: 'DELETE' | 'BAN' | 'UNBAN', username: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'USERS' || activeTab === 'OVERVIEW') {
            loadData();
        }
    }, [activeTab]);

    const loadData = async () => {
        if (!isSupabaseConfigured) return;
        setLoading(true);
        const data = await DB.getFullAdminExport();
        setProfiles(data);
        setLoading(false);
    };

    // --- AGGREGATION LOGIC ---
    const totalUsers = profiles.length;
    const totalCoins = profiles.reduce((acc, p) => p.username === 'Vincent' ? acc : acc + (p.data?.coins || 0), 0);

    // Filter Users
    const filteredUsers = profiles.filter(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- ACTIONS ---
    const handleAction = async () => {
        if (!confirmAction) return;
        const { type, username } = confirmAction;

        if (type === 'DELETE') {
            await DB.deleteUser(username);
            setProfiles(prev => prev.filter(p => p.username !== username));
            if (selectedUser?.username === username) setSelectedUser(null);
        } else if (type === 'BAN' || type === 'UNBAN') {
            const isBanned = type === 'BAN';
            await DB.updateUserData(username, { banned: isBanned });
            setProfiles(prev => prev.map(p => p.username === username ? { ...p, data: { ...p.data, banned: isBanned } } : p));
            if (selectedUser?.username === username) setSelectedUser(prev => ({ ...prev, data: { ...prev.data, banned: isBanned } }));
        }
        setConfirmAction(null);
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        mp.sendAdminBroadcast(broadcastMsg, broadcastType);
        alert('Message envoyé à tous les joueurs connectés !');
        setBroadcastMsg('');
    };

    const handleGiftCoins = async () => {
        if (!selectedUser) return;
        const newAmount = (selectedUser.data.coins || 0) + giftAmount;
        await DB.updateUserData(selectedUser.username, { coins: newAmount });
        
        // Update Local State
        setProfiles(prev => prev.map(p => p.username === selectedUser.username ? { ...p, data: { ...p.data, coins: newAmount } } : p));
        setSelectedUser(prev => ({ ...prev, data: { ...prev.data, coins: newAmount } }));
        alert(`${giftAmount} pièces envoyées à ${selectedUser.username} !`);
    };

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className={`bg-gray-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-lg relative overflow-hidden group hover:border-${color}-500/50 transition-all`}>
            <div className={`p-3 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">{title}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
            </div>
        </div>
    );

    const renderUserDetails = () => {
        if (!selectedUser) return null;
        
        const avatar = AVATARS_CATALOG.find(a => a.id === selectedUser.data?.avatarId) || AVATARS_CATALOG[0];
        const AvatarIcon = avatar.icon;
        const isBanned = selectedUser.data?.banned === true;

        return (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200" onClick={() => setSelectedUser(null)}>
                <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 flex justify-between items-center relative">
                        <div className="flex gap-4 items-center">
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}>
                                <AvatarIcon size={32} className={avatar.color} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white italic">{selectedUser.username}</h2>
                                <p className="text-xs text-gray-400 font-mono">{selectedUser.username}</p>
                                {isBanned && <span className="text-xs font-bold text-red-500 bg-red-900/20 px-2 py-0.5 rounded mt-1 inline-block">BANNI</span>}
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400 hover:text-white"/></button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {/* COIN GIFTING */}
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2"><Coins size={16}/> GESTION ÉCONOMIE</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono font-bold text-white">{selectedUser.data?.coins || 0}</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">Solde Actuel</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <input type="number" value={giftAmount} onChange={e => setGiftAmount(Number(e.target.value))} className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white w-24 text-sm font-bold" />
                                <button onClick={handleGiftCoins} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"><Plus size={14}/> AJOUTER PIÈCES</button>
                            </div>
                        </div>

                        {/* DANGER ZONE */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2"><AlertTriangle size={16}/> ACTIONS CRITIQUES</h3>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setConfirmAction({ type: isBanned ? 'UNBAN' : 'BAN', username: selectedUser.username })}
                                    className={`flex-1 py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${isBanned ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-500 border border-orange-600/50'}`}
                                >
                                    {isBanned ? <><Check size={14}/> DÉBANNIR</> : <><Ban size={14}/> BANNIR</>}
                                </button>
                                <button 
                                    onClick={() => setConfirmAction({ type: 'DELETE', username: selectedUser.username })}
                                    className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                    <Trash2 size={14}/> SUPPRIMER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-black/90 text-white font-sans overflow-hidden flex flex-col">
            {renderUserDetails()}

            {/* CONFIRMATION MODAL */}
            {confirmAction && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200" onClick={() => setConfirmAction(null)}>
                    <div className="bg-gray-900 w-full max-w-sm rounded-xl border border-white/20 p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className={`mx-auto mb-4 ${confirmAction.type === 'DELETE' ? 'text-red-500' : 'text-orange-500'}`} />
                        <h3 className="text-xl font-black text-center text-white mb-2">CONFIRMATION</h3>
                        <p className="text-gray-400 text-sm text-center mb-6">Action: {confirmAction.type} sur {confirmAction.username}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-gray-800 rounded-lg text-white font-bold text-sm">ANNULER</button>
                            <button onClick={handleAction} className="flex-1 py-3 bg-red-600 rounded-lg text-white font-bold text-sm">CONFIRMER</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gray-900/80 border-b border-white/10 p-4 flex flex-col sm:flex-row justify-between items-center backdrop-blur-md z-10 shrink-0 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-white/10"><Home size={18} /></button>
                    <h1 className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Shield className="text-blue-400"/> DASHBOARD
                    </h1>
                </div>
                
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 min-w-max gap-1">
                        <button onClick={() => setActiveTab('OVERVIEW')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>VUE D'ENSEMBLE</button>
                        <button onClick={() => setActiveTab('LIVE')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${activeTab === 'LIVE' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>LIVE ({onlineUsers.filter(u => u.status === 'online').length})</button>
                        <button onClick={() => setActiveTab('USERS')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${activeTab === 'USERS' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>UTILISATEURS</button>
                        <button onClick={() => setActiveTab('BROADCAST')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${activeTab === 'BROADCAST' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>DIFFUSION</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Total Inscrits" value={totalUsers} icon={Users} color="blue" />
                            <StatCard title="En Ligne" value={onlineUsers.filter(u => u.status === 'online').length} icon={Activity} color="green" />
                            <StatCard title="Masse Monétaire" value={totalCoins.toLocaleString()} icon={Coins} color="yellow" />
                            <StatCard title="Jeux Actifs" value={new Set(onlineUsers.filter(u => u.status === 'online' && u.gameActivity).map(u => u.gameActivity)).size} icon={Gamepad2} color="purple" />
                        </div>
                    </div>
                )}

                {activeTab === 'LIVE' && (
                    <div className="animate-in fade-in">
                        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"><Activity size={20}/> JOUEURS EN LIGNE</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {onlineUsers.filter(u => u.status === 'online').map(user => {
                                const avatar = AVATARS_CATALOG.find(a => a.id === user.avatarId) || AVATARS_CATALOG[0];
                                const AvIcon = avatar.icon;
                                const gameColor = user.gameActivity ? (GAME_COLORS[user.gameActivity] || 'text-gray-400 border-gray-600 bg-gray-900') : 'text-gray-500';
                                
                                return (
                                    <div key={user.id} className="bg-gray-900 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvIcon size={20} className={avatar.color}/></div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{user.name}</div>
                                                <div className="text-[10px] text-gray-500">ID: {user.id.substring(0,8)}...</div>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${gameColor}`}>
                                            {user.gameActivity || 'INACTIF'}
                                        </div>
                                    </div>
                                );
                            })}
                            {onlineUsers.filter(u => u.status === 'online').length === 0 && <p className="text-gray-500 text-sm italic">Aucun joueur en ligne.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'BROADCAST' && (
                    <div className="animate-in fade-in max-w-xl mx-auto">
                        <div className="bg-gray-900 border border-white/10 rounded-xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2"><Radio size={20}/> DIFFUSION GLOBALE</h3>
                            <p className="text-gray-400 text-xs mb-6">Envoyez un message à tous les joueurs connectés en temps réel.</p>
                            
                            <form onSubmit={handleBroadcast} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Type de message</label>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setBroadcastType('info')} className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${broadcastType === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-white/10 text-gray-500'}`}><Shield size={14}/> INFO</button>
                                        <button type="button" onClick={() => setBroadcastType('warning')} className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${broadcastType === 'warning' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-800 border-white/10 text-gray-500'}`}><AlertTriangle size={14}/> ALERTE</button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
                                    <textarea 
                                        value={broadcastMsg}
                                        onChange={e => setBroadcastMsg(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none h-32 resize-none"
                                        placeholder="Votre annonce ici..."
                                    />
                                </div>

                                <button type="submit" disabled={!broadcastMsg.trim()} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    <Radio size={18}/> ENVOYER
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'USERS' && (
                    <div className="animate-in fade-in">
                        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4 sm:gap-0">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un pseudo..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="text-xs text-gray-500 self-center whitespace-nowrap">{filteredUsers.length} joueurs trouvés</div>
                        </div>

                        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden hidden md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4">Joueur</th>
                                        <th className="p-4 text-center">Pièces</th>
                                        <th className="p-4 text-center">Dernière Connexion</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chargement...</td></tr> : 
                                    filteredUsers.map(p => (
                                        <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(p)}>
                                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 text-xs">{p.username.substring(0,2).toUpperCase()}</div>
                                                <div className="flex flex-col">{p.username}{p.data?.banned && <span className="text-[9px] text-red-500 bg-red-900/20 px-1 rounded w-fit">BANNI</span>}</div>
                                            </td>
                                            <td className="p-4 text-center text-yellow-400 font-mono">{p.data?.coins || 0}</td>
                                            <td className="p-4 text-center text-gray-400 text-xs">{new Date(p.updated_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-right"><button className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors">GÉRER</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
