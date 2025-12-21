
import React from 'react';
import { Home, Play } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';

interface Connect4LobbyProps {
    mp: any;
    onBack: () => void;
}

export const Connect4Lobby: React.FC<Connect4LobbyProps> = ({ mp, onBack }) => {
    const { avatarsCatalog } = useCurrency();
    const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
    const otherPlayers = mp.players.filter((p: any) => p.status !== 'hosting' && p.id !== mp.peerId);

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 pr-2 pb-1">PUISSANCE 4</h1>
                <div className="w-10"></div>
            </div>
            
            <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-pink-300 tracking-wider drop-shadow-md">LOBBY PUISSANCE 4</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 && (
                        <>
                            <p className="text-xs text-yellow-400 font-bold tracking-widest my-2">PARTIES DISPONIBLES</p>
                            {hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                const AvatarIcon = avatar.icon;
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                            <span className="font-bold">{player.name}</span>
                                        </div>
                                        <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                    </div>
                                );
                            })}
                        </>
                    )}
                    {hostingPlayers.length === 0 && <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie disponible...<br/>Créez la vôtre !</p>}
                    {otherPlayers.length > 0 && (
                        <>
                             <p className="text-xs text-gray-500 font-bold tracking-widest my-2 pt-2 border-t border-white/10">AUTRES JOUEURS</p>
                             {otherPlayers.map((player: any) => {
                                 const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                 const AvatarIcon = avatar.icon;
                                 return (
                                     <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/30 rounded-lg border border-white/5 opacity-70">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                             <span className="font-bold text-gray-400">{player.name}</span>
                                         </div>
                                         <span className="text-xs font-bold text-gray-500">{player.status === 'in_game' ? "EN JEU" : "INACTIF"}</span>
                                     </div>
                                 );
                             })}
                        </>
                    )}
                </div>
             </div>
        </div>
    );
};
