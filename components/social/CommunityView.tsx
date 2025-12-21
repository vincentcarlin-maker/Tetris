
import React from 'react';
import { Copy, Search, RefreshCw, X, UserPlus } from 'lucide-react';
import { Friend, GAME_NAMES } from './types';
import { Avatar, Frame } from '../../hooks/useCurrency';
import { OnlineUser } from '../../hooks/useSupabase';

interface CommunityViewProps {
    myPeerId: string | null;
    currentUsername: string;
    friends: Friend[];
    onlineUsers: OnlineUser[];
    avatarsCatalog: Avatar[];
    framesCatalog: Frame[];
    onPlayerClick: (player: any) => void;
    onSearch: (query: string) => Promise<any[]>;
    isSearching: boolean;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ 
    myPeerId, currentUsername, friends, onlineUsers, 
    avatarsCatalog, framesCatalog, onPlayerClick, onSearch, isSearching 
}) => {
    const [communitySearch, setCommunitySearch] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);

    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!communitySearch.trim()) return;
        
        const results = await onSearch(communitySearch);
        
        const filtered = results.filter((u: any) => 
            u.name !== currentUsername && !friends.some(f => f.name === u.name)
        ).map((u: any) => {
            const onlineMatch = onlineUsers.find(o => o.name === u.name);
            return {
                ...u,
                id: onlineMatch ? onlineMatch.id : u.id,
                status: onlineMatch ? 'online' : 'offline'
            };
        });
        setSearchResults(filtered);
    };

    const clearSearch = () => {
        setCommunitySearch('');
        setSearchResults([]);
    };

    const onlineOnlyCommunity = React.useMemo(() => {
        return onlineUsers.filter(p => {
            if (p.id === myPeerId || p.name === currentUsername) return false;
            return p.status === 'online';
        }).reduce((acc: OnlineUser[], current) => {
            if (!acc.find(item => item.name === current.name)) acc.push(current);
            return acc;
        }, []);
    }, [onlineUsers, myPeerId, currentUsername]);

    return (
        <div className="p-4 space-y-4 animate-in fade-in">
            <div className="bg-gray-800/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ton Code Ami</span>
                    <span className="text-sm font-mono font-black text-purple-400 mt-1">{myPeerId || '...'}</span>
                </div>
                <button onClick={() => { if(myPeerId) { navigator.clipboard.writeText(myPeerId); alert('Code copié !'); } }} className="p-2 bg-purple-900/30 text-purple-400 rounded-xl border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all"><Copy size={18}/></button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={communitySearch} 
                        onChange={e => setCommunitySearch(e.target.value)} 
                        placeholder="Rechercher par pseudo..." 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none pr-10" 
                    />
                    {communitySearch && <button onClick={clearSearch} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14}/></button>}
                </div>
                <button type="submit" disabled={isSearching} className="bg-purple-600 text-white px-4 rounded-xl font-bold active:scale-95 transition-all">
                    {isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>}
                </button>
            </form>
            
            {searchResults.length > 0 ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-[10px] text-purple-400 font-bold uppercase tracking-widest px-2">Résultats de recherche</h4>
                        {searchResults.map(player => {
                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                            return (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/80 rounded-2xl border border-purple-500/30 group cursor-pointer transition-all hover:bg-gray-700" onClick={() => onPlayerClick(player)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}><avatar.icon size={22} className={avatar.color} /></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-white">{player.name}</span>
                                        <div className="flex items-center gap-1">
                                            {player.status === 'online' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>}
                                            <span className="text-[10px] text-gray-500">{player.status === 'online' ? 'En ligne' : 'Hors ligne'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-700/50 rounded-xl hover:bg-white hover:text-black transition-all"><UserPlus size={18}/></div>
                                </div>
                            );
                        })}
                    </div>
            ) : communitySearch && !isSearching && (
                <p className="text-center text-gray-600 text-xs italic py-4">Aucun utilisateur trouvé pour "{communitySearch}"</p>
            )}

            {!communitySearch && (
                <>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2 mt-2">Joueurs Connectés ({onlineOnlyCommunity.length})</h3>
                    <div className="space-y-2">
                        {onlineOnlyCommunity.length === 0 && <p className="text-center text-gray-500 text-xs italic py-4">Aucun joueur en ligne en dehors de tes amis.</p>}
                        {onlineOnlyCommunity.map(player => {
                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                            return (
                                <div key={player.id} onClick={() => onPlayerClick(player)} className="flex items-center justify-between p-3 bg-gray-800/60 rounded-2xl border border-white/5 hover:bg-gray-800 transition-all group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative border ${getFrameClass(player.frameId)}`}><avatar.icon size={22} className={avatar.color} /></div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-white">{player.name}</span>
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> 
                                                {player.gameActivity && player.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[player.gameActivity] || player.gameActivity}` : 'En ligne'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-white hover:text-black transition-all"><UserPlus size={18}/></div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};
