
import React, { useState, useMemo } from 'react';
import { 
    Search, ChevronRight, Coins, Clock, Shield, Ban, UserCircle, X, 
    Check, Loader2, Trash2, Plus, Minus, Star, Award, ShieldAlert, 
    LayoutGrid, Settings, History, Save, Zap
} from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { OnlineUser } from '../../hooks/useSupabase';
import { BADGES_CATALOG, TITLES_CATALOG, FRAMES_CATALOG } from '../../constants/catalog';

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

    const filteredUsers = useMemo(() => {
        return profiles.filter(p => {
            const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            const isOnline = onlineUsers.some(u => u.name === p.username && u.status === 'online');
            if (userFilter === 'ONLINE') return isOnline;
            if (userFilter === 'BANNED') return p.data?.banned;
            if (userFilter === 'STAFF') return p.data?.role === 'ADMIN' || p.data?.role === 'MOD';
            return true;
        });
    }, [profiles, searchTerm, userFilter, onlineUsers]);

    const handleGlobalUpdate = async (username: string, updates: Record<string, any>, logMsg?: string, logAmount?: number) => {
        // Mise à jour locale
        const updated = profiles.map(p => {
            if (p.username === username) {
                return { ...p, data: { ...p.data, ...updates } };
            }
            return p;
        });
        setProfiles(updated);
        
        if (selectedUser && selectedUser.username === username) {
            setSelectedUser({ ...selectedUser, data: { ...selectedUser.data, ...updates } });
        }
        
        // Log transaction si montant impliqué
        if (logAmount !== undefined) {
            await DB.logTransaction(username, 'ADMIN_ADJUST', logAmount, logMsg || 'Modification par administrateur');
        }
        
        // Sauvegarde cloud
        if (isSupabaseConfigured) {
            await DB.updateUserData(username, updates);
        }
        
        mp.sendAdminBroadcast(`Mise à jour système effectuée pour ${username}`, "info");
    };

    return (
        <div className="animate-in fade-in h-full flex flex-col gap-4">
            {/* Header / Recherche */}
            <div className="flex flex-col md:flex-row gap-4 bg-gray-900/50 p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par pseudo ou ID..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner" 
                    />
                </div>
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 shrink-0">
                    {(['ALL', 'ONLINE', 'BANNED', 'STAFF'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setUserFilter(f)} 
                            className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${userFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {f === 'ALL' ? 'TOUS' : f === 'ONLINE' ? 'EN LIGNE' : f === 'BANNED' ? 'BANNIS' : 'STAFF'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table des Joueurs */}
            <div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xl backdrop-blur-sm">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-800/80 text-gray-500 font-black uppercase text-[10px] sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-4 border-b border-white/5">Identité du Joueur</th>
                                <th className="p-4 border-b border-white/5 text-center">Rôle</th>
                                <th className="p-4 border-b border-white/5 text-center">Statut</th>
                                <th className="p-4 border-b border-white/5 text-center">Fortune</th>
                                <th className="p-4 border-b border-white/5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-600 italic">Aucun profil ne correspond aux critères.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(p => {
                                    const isOnline = onlineUsers.some(u => u.name === p.username && u.status === 'online');
                                    return (
                                        <tr key={p.username} className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setSelectedUser(p)}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-xs font-black text-blue-400">
                                                        {p.username.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white text-base group-hover:text-blue-400 transition-colors uppercase italic">{p.username}</span>
                                                        <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1"><Clock size={10}/> {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Inconnu'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                                                    p.data?.role === 'ADMIN' ? 'bg-red-950/40 text-red-400 border-red-500/30' : 
                                                    p.data?.role === 'MOD' ? 'bg-blue-950/40 text-blue-400 border-blue-500/30' :
                                                    'bg-gray-800 text-gray-500 border-white/5'
                                                }`}>
                                                    {p.data?.role || 'MEMBRE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center">
                                                    {p.data?.banned ? (
                                                        <span className="px-2 py-1 rounded bg-red-600 text-white text-[9px] font-black shadow-[0_0_10px_rgba(220,38,38,0.4)]">BANNI</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                                                            <span className={`text-[9px] font-bold ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>{isOnline ? 'LIVE' : 'OFF'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-yellow-400">
                                                    <Coins size={14}/>
                                                    <span>{(p.data?.coins || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-2 bg-gray-800 rounded-lg text-gray-400 group-hover:text-white transition-all"><ChevronRight size={18}/></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedUser && (
                <UserConsoleModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                    onUpdate={handleGlobalUpdate}
                />
            )}
        </div>
    );
};

const UserConsoleModal = ({ user, onClose, onUpdate }: any) => {
    const [activeTab, setActiveTab] = useState<'ECONOMY' | 'INVENTORY' | 'PRIVILEGES' | 'DANGER'>('ECONOMY');
    const [coinInput, setCoinInput] = useState<string>('0');

    const handleQuickCoins = (amount: number) => {
        const current = user.data?.coins || 0;
        const newVal = Math.max(0, current + amount);
        const effectiveDelta = newVal - current;
        onUpdate(user.username, { coins: newVal }, `Ajustement admin : ${effectiveDelta > 0 ? '+' : ''}${effectiveDelta}`, effectiveDelta);
    };

    const handleSetExactCoins = () => {
        let val = parseInt(coinInput);
        if (isNaN(val)) return;
        val = Math.max(0, val); // Protection anti-négatif
        const current = user.data?.coins || 0;
        const delta = val - current;
        onUpdate(user.username, { coins: val }, `Définition solde par admin : ${val}`, delta);
    };

    const toggleBadge = (badgeId: string) => {
        const currentInv = user.data?.inventory || [];
        let nextInv;
        if (currentInv.includes(badgeId)) {
            nextInv = currentInv.filter((id: string) => id !== badgeId);
            onUpdate(user.username, { inventory: nextInv }, `Retrait item par admin : ${badgeId}`);
        } else {
            nextInv = [...currentInv, badgeId];
            onUpdate(user.username, { inventory: nextInv }, `Attribution item par admin : ${badgeId}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-[#0c0c14] w-full max-w-2xl h-[80vh] rounded-[40px] border border-white/20 shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-56 bg-gray-900 border-r border-white/10 flex flex-col">
                    <div className="p-6 border-b border-white/5 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white mb-3 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            {user.username.substring(0,2).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-black text-white uppercase italic truncate w-full">{user.username}</h2>
                        <span className={`text-[9px] font-black tracking-widest mt-1 px-2 py-0.5 rounded ${user.data?.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                            {user.data?.role || 'MEMBRE'}
                        </span>
                    </div>
                    
                    <div className="flex-1 p-2 space-y-1">
                        {[
                            { id: 'ECONOMY', label: 'Économie', icon: Coins, color: 'text-yellow-400' },
                            { id: 'INVENTORY', label: 'Inventaire', icon: LayoutGrid, color: 'text-cyan-400' },
                            { id: 'PRIVILEGES', label: 'Privilèges', icon: Shield, color: 'text-blue-400' },
                            { id: 'DANGER', label: 'Discipline', icon: Ban, color: 'text-red-500' },
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                <t.icon size={16} className={t.color} /> {t.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={onClose} className="m-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-bold text-xs transition-all border border-white/5">
                        FERMER LA CONSOLE
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-black/40">
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        
                        {activeTab === 'ECONOMY' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Terminal Économique</h3>
                                        <p className="text-sm text-gray-500">Gérez le solde de pièces néon du joueur.</p>
                                    </div>
                                    <div className="bg-yellow-950/20 border border-yellow-500/30 px-6 py-3 rounded-2xl flex flex-col items-end">
                                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Solde Actuel</span>
                                        <span className="text-3xl font-mono font-black text-yellow-400">{(user.data?.coins || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14}/> Ajustement Rapide
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[100, 1000, 10000, -100, -1000, -10000].map(amt => (
                                            <button 
                                                key={amt} 
                                                onClick={() => handleQuickCoins(amt)}
                                                className={`py-3 rounded-xl font-mono font-black border transition-all active:scale-95 ${amt > 0 ? 'bg-green-600/10 text-green-400 border-green-500/20 hover:bg-green-600 hover:text-white' : 'bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600 hover:text-white'}`}
                                            >
                                                {amt > 0 ? '+' : ''}{amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valeur Absolue</h4>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            value={coinInput} 
                                            onChange={e => setCoinInput(e.target.value)}
                                            className="flex-1 bg-gray-900 border border-white/10 rounded-2xl p-4 text-white font-mono font-bold text-xl outline-none focus:border-yellow-500 transition-all"
                                            placeholder="Nouveau solde..."
                                            min="0"
                                        />
                                        <button 
                                            onClick={handleSetExactCoins}
                                            className="px-8 bg-yellow-500 text-black font-black italic rounded-2xl hover:bg-white active:scale-95 transition-all shadow-lg"
                                        >
                                            ÉTABLIR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'INVENTORY' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Gestionnaire d'Inventaire</h3>
                                    <p className="text-sm text-gray-500">Attribuez ou retirez des badges au joueur.</p>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {BADGES_CATALOG.map(badge => {
                                        const isOwned = user.data?.inventory?.includes(badge.id);
                                        const BIcon = badge.icon;
                                        return (
                                            <button 
                                                key={badge.id}
                                                onClick={() => toggleBadge(badge.id)}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${isOwned ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-gray-900/40 border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                            >
                                                <BIcon size={24} className={isOwned ? badge.color : 'text-gray-600'} />
                                                <span className="text-[10px] font-black uppercase text-center truncate w-full">{badge.name}</span>
                                                <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${isOwned ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                                    {isOwned ? 'ACQUIS' : 'LOCKED'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'PRIVILEGES' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Autorisations & Rôles</h3>
                                    <p className="text-sm text-gray-500">Droit d'accès et titres spéciaux.</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Rôle Système</h4>
                                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
                                        {['USER', 'MOD', 'ADMIN'].map(role => (
                                            <button 
                                                key={role}
                                                onClick={() => onUpdate(user.username, { role })}
                                                className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                                    (user.data?.role || 'USER') === role 
                                                    ? 'bg-blue-600 text-white shadow-lg' 
                                                    : 'text-gray-500 hover:text-white'
                                                }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Titre Forcé</h4>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {TITLES_CATALOG.map(title => (
                                            <button 
                                                key={title.id}
                                                onClick={() => onUpdate(user.username, { titleId: title.id })}
                                                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter text-left flex items-center justify-between transition-all ${
                                                    user.data?.titleId === title.id 
                                                    ? 'bg-purple-900/30 border-purple-500 text-white' 
                                                    : 'bg-gray-900 border-white/5 text-gray-500'
                                                }`}
                                            >
                                                <span className={title.color}>{title.name}</span>
                                                {user.data?.titleId === title.id && <Check size={12}/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'DANGER' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-[32px] flex items-start gap-4">
                                    <ShieldAlert size={40} className="text-red-500 shrink-0" />
                                    <div>
                                        <h3 className="text-xl font-black text-red-500 italic uppercase">Actions Disciplinaires</h3>
                                        <p className="text-sm text-red-200/60">Utilisez ces outils avec discernement. Ces actions impactent l'expérience du joueur de manière définitive.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between p-6 bg-gray-900 border border-white/10 rounded-3xl">
                                            <div>
                                                <h4 className="font-black text-white uppercase italic">Bannissement Temporaire</h4>
                                                <p className="text-xs text-gray-500">Empêche la connexion et l'accès au social.</p>
                                            </div>
                                            <button 
                                                onClick={() => onUpdate(user.username, { banned: !user.data?.banned })}
                                                className={`px-6 py-3 rounded-xl font-black text-xs transition-all active:scale-95 ${
                                                    user.data?.banned 
                                                    ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                                                    : 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                                }`}
                                            >
                                                {user.data?.banned ? 'DÉBANNIR' : 'BANNIR'}
                                            </button>
                                        </div>

                                        <button className="w-full py-4 bg-gray-900 border border-red-500/20 text-red-500 rounded-3xl font-black text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all">
                                            SUPPRIMER TOUTES LES DONNÉES CLOUD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
