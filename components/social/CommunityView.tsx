
import React from 'react';
import { Search, RefreshCw, X, UserPlus, UserCheck, Globe, Clock, Send } from 'lucide-react';
import { Friend, GAME_NAMES, FriendRequest } from './types';
import { Avatar, Frame } from '../../hooks/useCurrency';
import { OnlineUser } from '../../hooks/useSupabase';

interface CommunityViewProps {
    myPeerId: string | null;
    currentUsername: string;
    friends: Friend[];
    onlineUsers: OnlineUser[];
    sentRequests: FriendRequest[]; // Nouveau
    avatarsCatalog: Avatar[];
    framesCatalog: Frame[];
    onPlayerClick: (player: any) => void;
    onSearch: (query: string) => Promise<any[]>;
    isSearching: boolean;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ 
    currentUsername, friends, onlineUsers, sentRequests,
    avatarsCatalog, framesCatalog, onPlayerClick, onSearch, isSearching 
}) => {
    const [communitySearch, setCommunitySearch] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);

    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = communitySearch.trim();
        if (!query || query.length < 2) return;
        
        const results = await onSearch(query);
        
        // On fusionne les résultats de la DB avec les données de présence LIVE et les requêtes en cours
        const mapped = results.filter((u: any) => u.name !== currentUsername)
            .map((u: any) => {
                const onlineMatch = onlineUsers.find(o => o.name === u.name);
                const isFriend = friends.some(f => f.name === u.name);
                const isPending = sentRequests.some(r => r.name === u.name);
                return {
                    ...u,
                    id: onlineMatch ? onlineMatch.id : u.id,
                    status: onlineMatch ? 'online' : 'offline',
                    gameActivity: onlineMatch?.gameActivity,
                    isFriend,
                    isPending
                };
            });
        setSearchResults(mapped);
    };

    const clearSearch = () => {
        setCommunitySearch('');
        setSearchResults([]);
    };

    // Liste des joueurs actuellement en ligne (hors moi)
    const activeOnlineUsers = React.useMemo(() => {
        return onlineUsers.filter(p => p.name !== currentUsername && p.status === 'online');
    }, [onlineUsers, currentUsername]);

    return (
        <div className="p-4 space-y-4 animate-in fade-in">
            {/* Barre de recherche globale */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={communitySearch} 
                        onChange={e => setCommunitySearch(e.target.value)} 
                        placeholder="Chercher un joueur..." 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none pr-10 shadow-inner" 
                    />
                    {communitySearch && (
                        <button onClick={clearSearch} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X size={14}/>
                        </button>
                    )}
                </div>
                <button 
                    type="submit" 
                    disabled={isSearching || communitySearch.length < 2} 
                    className="bg-purple-600 text-white px-5 rounded-xl font-bold active:scale-95 transition-all shadow-lg hover:bg-purple-500 disabled:opacity-50"
                >
                    {isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Search size={20}/>}
                </button>
            </form>
            
            {searchResults.length > 0 ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">Résultats de la recherche</h4>
                        <span className="text-[9px] text-gray-500 italic">{searchResults.length} trouvé(s)</span>
                    </div>
                    {searchResults.map(player => {
                        const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                        const isOnline = player.status === 'online';
                        
                        return (
                            <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-2xl border border-purple-500/20 group cursor-pointer transition-all hover:bg-gray-700 shadow-lg" onClick={() => onPlayerClick(player)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}>
                                        <avatar.icon size={22} className={avatar.color} />
                                        {isOnline && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse shadow-[0_0_5px_lime]"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">{player.name}</span>
                                            {player.isFriend && <div className="px-1.5 py-0.5 rounded-full bg-cyan-900/40 border border-cyan-500/30 text-[8px] font-black text-cyan-400 tracking-tighter uppercase">Ami</div>}
                                            {player.isPending && <div className="px-1.5 py-0.5 rounded-full bg-cyan-900/20 border border-cyan-500/20 text-[8px] font-black text-cyan-300 tracking-tighter uppercase">Envoyé</div>}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                                                {isOnline ? (player.gameActivity && player.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[player.gameActivity] || player.gameActivity}` : 'En ligne') : 'Hors-ligne'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-2 rounded-xl transition-all ${player.isFriend ? 'bg-cyan-500/10 text-cyan-400' : player.isPending ? 'bg-cyan-500/5 text-cyan-500/50' : 'bg-gray-700/50 text-gray-300 hover:bg-white hover:text-black'}`}>
                                    {player.isFriend ? <UserCheck size={18}/> : player.isPending ? <Clock size={18} className="animate-pulse"/> : <UserPlus size={18}/>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : communitySearch && !isSearching && communitySearch.length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600 opacity-50">
                    <div className="relative mb-4">
                        <Search size={48} className="text-gray-800" />
                        <X size={20} className="absolute -top-1 -right-1 text-red-500" />
                    </div>
                    <p className="text-xs font-black tracking-widest text-center uppercase leading-relaxed">
                        Aucun signal détecté pour<br/>
                        <span className="text-white italic">"{communitySearch}"</span>
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mt-2">Joueurs Actifs ({activeOnlineUsers.length})</h3>
                    <div className="space-y-2">
                        {activeOnlineUsers.length === 0 ? (
                            <div className="bg-black/20 border border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-600">
                                <Globe size={32} className="mb-2 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-center">Personne en ligne...<br/>Lancez une recherche !</p>
                            </div>
                        ) : (
                            activeOnlineUsers.map(player => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                const isFriend = friends.some(f => f.name === player.name);
                                const isPending = sentRequests.some(r => r.name === player.name);
                                return (
                                    <div key={player.id} onClick={() => onPlayerClick(player)} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-2xl border border-white/5 hover:bg-gray-800 transition-all group cursor-pointer shadow-md">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}>
                                                <avatar.icon size={22} className={avatar.color} />
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse shadow-[0_0_5px_lime]"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-white">{player.name}</span>
                                                    {isFriend && <div className="px-1 py-0.5 rounded-full bg-cyan-900/30 border border-cyan-500/20 text-[7px] font-black text-cyan-400 uppercase">Ami</div>}
                                                    {isPending && <div className="px-1 py-0.5 rounded-full bg-cyan-900/10 border border-cyan-500/10 text-[7px] font-black text-cyan-300/70 uppercase">Envoyé</div>}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {player.gameActivity && player.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[player.gameActivity] || player.gameActivity}` : 'Actif'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl transition-all ${isFriend ? 'bg-cyan-500/10 text-cyan-400' : isPending ? 'bg-cyan-500/5 text-cyan-500/50' : 'bg-gray-700/50 text-gray-300 hover:bg-white hover:text-black'}`}>
                                            {isFriend ? <UserCheck size={18}/> : isPending ? <Clock size={18} className="animate-pulse"/> : <UserPlus size={18}/>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
