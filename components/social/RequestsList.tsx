
import React, { useState } from 'react';
import { Inbox, CheckCircle, XCircle, Send, Trash2, Clock } from 'lucide-react';
import { FriendRequest } from './types';
import { Avatar } from '../../hooks/useCurrency';

interface RequestsListProps {
    requests: FriendRequest[];
    sentRequests: FriendRequest[];
    avatarsCatalog: Avatar[];
    onAccept: (req: FriendRequest) => void;
    onDecline: (id: string) => void;
    onCancel: (id: string) => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({ 
    requests, sentRequests, avatarsCatalog, onAccept, onDecline, onCancel 
}) => {
    const [subTab, setSubTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');

    return (
        <div className="flex flex-col h-full animate-in fade-in">
            {/* Sous-navigation */}
            <div className="flex gap-2 p-4 pt-2 border-b border-white/5 bg-gray-900/40 shrink-0">
                <button 
                    onClick={() => setSubTab('RECEIVED')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${subTab === 'RECEIVED' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'text-gray-500 hover:text-white'}`}
                >
                    REÇUES ({requests.length})
                </button>
                <button 
                    onClick={() => setSubTab('SENT')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${subTab === 'SENT' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white'}`}
                >
                    ENVOYÉES ({sentRequests.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {subTab === 'RECEIVED' ? (
                    requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-40">
                            <Inbox size={48} className="mb-4" />
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase">Aucun signal entrant</p>
                        </div>
                    ) : (
                        requests.map(req => {
                            const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                            return (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl border border-pink-500/10 shadow-lg group hover:border-pink-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10 shadow-inner`}><avatar.icon size={22} className={avatar.color}/></div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white text-sm uppercase italic">{req.name}</span>
                                            <span className="text-[9px] text-gray-500 flex items-center gap-1"><Clock size={8}/> {new Date(req.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onAccept(req)} className="p-2.5 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-500 active:scale-90 transition-all" title="Accepter"><CheckCircle size={20}/></button>
                                        <button onClick={() => onDecline(req.id)} className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white active:scale-90 transition-all" title="Refuser"><XCircle size={20}/></button>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    sentRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-40">
                            <Send size={48} className="mb-4" />
                            <p className="text-[10px] font-black tracking-[0.2em] uppercase">Aucune demande envoyée</p>
                        </div>
                    ) : (
                        sentRequests.map(req => {
                            const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                            return (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-2xl border border-cyan-500/10 shadow-lg group hover:border-cyan-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><avatar.icon size={22} className={avatar.color}/></div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white/70 text-sm uppercase italic">{req.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">En attente</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => onCancel(req.id)} className="p-2.5 bg-gray-700/50 text-gray-400 rounded-xl border border-white/5 hover:bg-red-900/30 hover:text-red-400 active:scale-90 transition-all flex items-center gap-2 text-[10px] font-bold" title="Annuler">
                                        <Trash2 size={16}/> <span className="hidden sm:inline">ANNULER</span>
                                    </button>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
};
