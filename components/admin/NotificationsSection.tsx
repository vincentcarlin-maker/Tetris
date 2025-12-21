import React, { useState, useEffect } from 'react';
import { Megaphone, LifeBuoy, Phone, Mail, Send, Radio, AlertTriangle, RefreshCw, X, Loader2 } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const NotificationsSection: React.FC<{ mp: any }> = ({ mp }) => {
    const [tab, setTab] = useState<'INAPP' | 'SUPPORT'>('INAPP');
    const [msg, setMsg] = useState('');
    const [supportMsgs, setSupportMsgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tab === 'SUPPORT') loadSupport();
    }, [tab]);

    const loadSupport = async () => {
        if (!isSupabaseConfigured) return;
        setLoading(true);
        const msgs = await DB.getSupportMessages();
        setSupportMsgs(msgs);
        setLoading(false);
    };

    const handleBroadcast = (type: 'info' | 'warning') => {
        if (!msg.trim()) return;
        mp.sendAdminBroadcast(msg, type);
        setMsg('');
        alert("Broadcast envoyé !");
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-2 border-b border-white/10 pb-4">
                <button onClick={() => setTab('INAPP')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${tab === 'INAPP' ? 'bg-blue-600' : 'bg-gray-800'}`}><Megaphone size={14}/> BROADCAST</button>
                <button onClick={() => setTab('SUPPORT')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${tab === 'SUPPORT' ? 'bg-cyan-600' : 'bg-gray-800'}`}><LifeBuoy size={14}/> SUPPORT</button>
            </div>

            {tab === 'INAPP' && (
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10 max-w-xl">
                    <h3 className="font-bold text-white mb-4">MESSAGE GLOBAL EN DIRECT</h3>
                    <textarea value={msg} onChange={e => setMsg(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 mb-4 outline-none focus:border-blue-500" placeholder="Entrez votre message ici..."/>
                    <div className="flex gap-2">
                        <button onClick={() => handleBroadcast('info')} className="flex-1 py-3 bg-blue-600 rounded-lg font-bold">INFO</button>
                        <button onClick={() => handleBroadcast('warning')} className="flex-1 py-3 bg-red-600 rounded-lg font-bold">ALERTE</button>
                    </div>
                </div>
            )}

            {tab === 'SUPPORT' && (
                <div className="space-y-3 max-w-2xl">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold">DERNIERS TICKETS</h3>
                        <button onClick={loadSupport} className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
                    </div>
                    {supportMsgs.map(m => (
                        <div key={m.id} className="bg-gray-800 p-4 rounded-xl border border-white/10">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-2"><span>De: {m.sender_id}</span><span>{new Date(m.created_at).toLocaleString()}</span></div>
                            <p className="text-sm">{m.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};