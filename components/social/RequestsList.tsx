
import React from 'react';
import { Inbox, CheckCircle, XCircle } from 'lucide-react';
import { FriendRequest } from './types';
import { Avatar } from '../../hooks/useCurrency';

interface RequestsListProps {
    requests: FriendRequest[];
    avatarsCatalog: Avatar[];
    onAccept: (req: FriendRequest) => void;
    onDecline: (id: string) => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({ requests, avatarsCatalog, onAccept, onDecline }) => {
    return (
        <div className="p-4 space-y-3 animate-in fade-in">
            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <Inbox size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-bold">Aucune demande en attente</p>
                </div>
            ) : (
                requests.map(req => {
                    const avatar = avatarsCatalog.find(a => a.id === req.avatarId) || avatarsCatalog[0];
                    return (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl border border-white/5 shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center border border-white/10`}><avatar.icon size={20} className={avatar.color}/></div>
                                <span className="font-bold text-white text-sm">{req.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onAccept(req)} className="p-2 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-500 transition-colors"><CheckCircle size={20}/></button>
                                <button onClick={() => onDecline(req.id)} className="p-2 bg-red-600/20 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors"><XCircle size={20}/></button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
