
import React, { useState, useEffect } from 'react';
import { Megaphone, LifeBuoy, Send, RefreshCw, X, Loader2, MessageSquare } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const NotificationsSection: React.FC<{ mp: any }> = ({ mp }) => {
    const [tab, setTab] = useState<'INAPP' | 'SUPPORT'>('INAPP');
    const [msg, setMsg] = useState('');
    const [supportMsgs, setSupportMsgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Reply states
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

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

    const handleSendReply = async (originalMsg: any) => {
        if (!replyText.trim()) return;
        setSendingReply(true);
        
        // Format: [SUPPORT_REPLY] Text
        const formatted = `[SUPPORT_REPLY] ${replyText}`;
        // We send AS 'SYSTEM_SUPPORT' so it appears in the correct conversation on user side
        const res = await DB.sendMessage('SYSTEM_SUPPORT', originalMsg.sender_id, formatted);
        
        setSendingReply(false);
        if (res) {
            setReplyText('');
            setReplyingTo(null);
            // Optional: refresh list or mark as handled locally if we had such state
            alert("Réponse envoyée !");
        } else {
            alert("Erreur lors de l'envoi.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            <div className="flex gap-2 border-b border-white/10 pb-4 shrink-0">
                <button onClick={() => setTab('INAPP')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${tab === 'INAPP' ? 'bg-blue-600' : 'bg-gray-800 text-gray-400'}`}><Megaphone size={14}/> BROADCAST</button>
                <button onClick={() => setTab('SUPPORT')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${tab === 'SUPPORT' ? 'bg-cyan-600' : 'bg-gray-800 text-gray-400'}`}><LifeBuoy size={14}/> SUPPORT</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {tab === 'INAPP' && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-white/10 max-w-xl">
                        <h3 className="font-bold text-white mb-4">MESSAGE GLOBAL EN DIRECT</h3>
                        <textarea value={msg} onChange={e => setMsg(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 mb-4 outline-none focus:border-blue-500" placeholder="Entrez votre message ici..."/>
                        <div className="flex gap-2">
                            <button onClick={() => handleBroadcast('info')} className="flex-1 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors">INFO</button>
                            <button onClick={() => handleBroadcast('warning')} className="flex-1 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition-colors">ALERTE</button>
                        </div>
                    </div>
                )}

                {tab === 'SUPPORT' && (
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-900 z-10 py-2">
                            <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} className="text-cyan-400"/> TICKETS RÉCENTS</h3>
                            <button onClick={loadSupport} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
                        </div>
                        
                        {supportMsgs.length === 0 && !loading && (
                            <div className="text-center text-gray-500 py-8 italic">Aucun ticket de support.</div>
                        )}

                        {supportMsgs.map(m => {
                            const subjectMatch = m.text.match(/\[OBJ:(.*?)\]/);
                            const subject = subjectMatch ? subjectMatch[1] : null;
                            const cleanText = m.text.replace(/\[SUPPORT\]\[OBJ:.*?\]/, '').trim();

                            return (
                                <div key={m.id} className="bg-gray-800 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                                                {m.sender_id.substring(0, 1).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-sm text-white">{m.sender_id}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
                                    </div>
                                    
                                    {subject && (
                                        <div className="mb-2 text-xs text-cyan-400 font-bold bg-cyan-900/20 px-2 py-1 rounded w-fit border border-cyan-500/30">
                                            {subject}
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 mb-3 whitespace-pre-wrap">
                                        {cleanText || m.text}
                                    </p>

                                    {replyingTo === m.id ? (
                                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                            <input 
                                                autoFocus
                                                className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                                                placeholder="Votre réponse..."
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSendReply(m)}
                                            />
                                            <button 
                                                onClick={() => handleSendReply(m)} 
                                                disabled={sendingReply || !replyText.trim()}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {sendingReply ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                            </button>
                                            <button 
                                                onClick={() => { setReplyingTo(null); setReplyText(''); }} 
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg transition-colors"
                                            >
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setReplyingTo(m.id); setReplyText(''); }} 
                                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                                        >
                                            <Send size={12}/> RÉPONDRE
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
