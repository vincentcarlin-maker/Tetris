
import React from 'react';
import { Home, Play, Search, Wifi } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';

interface Connect4LobbyProps {
    mp: any;
    onBack: () => void;
}

export const Connect4Lobby: React.FC<Connect4LobbyProps> = ({ mp, onBack }) => {
    const { avatarsCatalog } = useCurrency();
    const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {/* Header */}
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-8 shrink-0">
                <button onClick={onBack} className="p-3 bg-gray-900/80 rounded-xl text-gray-400 hover:text-white border border-white/10 transition-transform active:scale-95"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">PUISSANCE 4</h1>
                    <span className="text-[10px] font-bold text-pink-400/80 tracking-[0.3em] uppercase">Salon Multijoueur</span>
                </div>
                <div className="w-12"></div>
            </div>
            
            <div className="w-full max-w-md flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Create Section */}
                 <div className="bg-gradient-to-b from-gray-900 to-black border border-pink-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(236,72,153,0.15)] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-pink-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-pink-500/40 active:scale-95 group-hover:ring-2 ring-pink-500/20">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salons disponibles</span>
                        <span className="text-xs font-mono text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                const AvatarIcon = avatar.icon;
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all group animate-in slide-in-from-right-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                <AvatarIcon size={24} className={avatar.color}/>
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-pink-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                        </div>
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-pink-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE PARTIE DÉTECTÉE</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};
