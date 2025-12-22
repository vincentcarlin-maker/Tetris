
import React, { useState } from 'react';
import { Search, ChevronRight, Coins, Clock, Shield, Ban, MicOff, UserCircle, X, Check, Loader2, Trash2, Plus, Minus } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { OnlineUser } from '../../hooks/useSupabase';

interface UsersSectionProps {
    profiles: any[];
    setProfiles: React.Dispatch<React.SetStateAction<any[]>>;
    onlineUsers: OnlineUser[];
    mp: any;
}

export const UsersSection: React.FC<UsersSectionProps> = ({ profiles, setProfiles, onlineUsers, mp }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState<'ALL' | 'ONLINE' | 'BANNED' | 'STAFF'>('ALL');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const filteredUsers = profiles.filter(p => {
        const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        const isOnline = onlineUsers.some(u => u.name === p.username && u.status === 'online');
        if (userFilter === 'ONLINE') return isOnline;
        if (userFilter === 'BANNED') return p.data?.banned;
        if (userFilter === 'STAFF') return p.data?.role === 'ADMIN' || p.data?.role === 'MOD';
        return true;
    });

    const handleGlobalUpdate = (username: string, prop: string, val: any, actionType?: string, actionValue?: number) => {
        const updated = profiles.map(p => p.username === username ? { ...p, data: { ...p.data, [prop]: val } } : p);
        setProfiles(updated);
        
        if (selectedUser && selectedUser.username === username) {
            setSelectedUser({ ...selectedUser, data: { ...selectedUser.data, [prop]: val } });
        }
        
        if (isSupabaseConfigured) DB.updateUserData(username, { [prop]: val });
        
        // Broadcast notification to the specific user if online
        mp.sendAdminBroadcast(
            actionType === 'ADD_COINS' ? `Félicitations ! Vous avez reçu ${actionValue} pièces.` : "Compte mis à jour par l'administrateur", 
            "user_update", 
            { 
                targetUser: username,
                action: actionType,
                amount: actionValue
            }
        );
    };

    return (
        <div className="animate-in fade-in h-full flex flex-col">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" placeholder="Rechercher un joueur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-white/10">
                    {['ALL', 'ONLINE', 'BANNED', 'STAFF'].map(f => (
                        <button key={f} onClick={() => setUserFilter(f as any)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${userFilter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>{f}</button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Utilisateur</th>
                                <th className="p-4 text-center">Rôle</th>
                                <th className="p-4 text-center">Statut</th>
                                <th className="p-4 text-center">Solde</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(p => {
                                const isOnline = onlineUsers.some(u => u.name === p.username && u.status === 'online');
                                return (
                                    <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(p)}>
                                        <td className="p-4 font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs">{p.username.substring(0,2).toUpperCase()}</div>
                                            <div>{p.username}<div className="text-[10px] text-gray-500 font-normal">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '--'}</div></div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${p.data?.role === 'ADMIN' ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-gray-800 text-gray-400 border-white/10'}`}>{p.data?.role || 'USER'}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{p.data?.banned ? 'BANNI' : isOnline ? 'EN LIGNE' : 'OFFLINE'}</span>
                                        </td>
                                        <td className="p-4 text-center font-mono text-yellow-400">{p.data?.coins || 0}</td>
                                        <td className="p-4 text-right"><ChevronRight size={16} className="text-gray-500 inline"/></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <UserDetailModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                    onUpdate={(prop: string, val: any, actionType?: string, actionVal?: number) => handleGlobalUpdate(selectedUser.username, prop, val, actionType, actionVal)}
                />
            )}
        </div>
    );
};

const UserDetailModal = ({ user, onClose, onUpdate }: any) => {
    const [coinDelta, setCoinDelta] = useState(100);

    const handleCoinAdjustment = (amount: number) => {
        const currentCoins = user.data?.coins || 0;
        const newTotal = Math.max(0, currentCoins + amount);
        // We use ADD_COINS action type so the client-side hook can process relative addition
        onUpdate('coins', newTotal, amount > 0 ? 'ADD_COINS' : undefined, amount);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10 bg-gray-800/50 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white">{user.username.substring(0,2).toUpperCase()}</div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{user.username}</h2>
                            <span className="text-xs text-gray-500 font-mono">ID: {user.username}</span>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">SOLDE ACTUEL</p>
                            <div className="flex items-center gap-2">
                                <Coins size={18} className="text-yellow-400" />
                                <span className="text-2xl font-black text-yellow-400">{user.data?.coins || 0}</span>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border border-white/10">
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">DERN. CONNEXION</p>
                            <span className="text-lg font-bold text-white">{user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '--'}</span>
                        </div>
                    </div>

                    {/* Economy Tool */}
                    <div className="bg-gray-800/50 p-4 rounded-2xl border border-yellow-500/20">
                        <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Coins size={14}/> AJUSTEMENT DU SOLDE
                        </h3>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={coinDelta} 
                                onChange={e => setCoinDelta(parseInt(e.target.value) || 0)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono font-bold outline-none focus:border-yellow-500"
                                placeholder="Montant..."
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleCoinAdjustment(coinDelta)}
                                    className="w-12 h-12 bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                    title="Ajouter des pièces"
                                >
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                                <button 
                                    onClick={() => handleCoinAdjustment(-coinDelta)}
                                    className="w-12 h-12 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                    title="Retirer des pièces"
                                >
                                    <Minus size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                        <button onClick={() => onUpdate('banned', !user.data?.banned)} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${user.data?.banned ? 'bg-green-600' : 'bg-red-600'}`}>
                            {user.data?.banned ? <><Check/> DÉBANNIR</> : <><Ban/> BANNIR L'UTILISATEUR</>}
                        </button>
                        <button className="w-full py-3 bg-gray-800 text-gray-300 rounded-xl font-bold border border-white/5 hover:bg-red-900/20 hover:text-red-400 transition-colors">
                            <Trash2 size={18} className="inline mr-2"/> SUPPRIMER DÉFINITIVEMENT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
