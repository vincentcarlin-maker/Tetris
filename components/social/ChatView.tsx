
import React from 'react';
import { ArrowLeft, MoreVertical, Clock, Smile, Send, Phone } from 'lucide-react';
import { Friend, PrivateMessage, GAME_NAMES, SUPPORT_ID } from './types';
import { Avatar, Frame } from '../../hooks/useCurrency';
import { VoiceChatHUD } from '../multiplayer/VoiceChatHUD';

interface ChatViewProps {
    activeFriend: Friend;
    messages: PrivateMessage[];
    currentUsername: string;
    avatarsCatalog: Avatar[];
    framesCatalog: Frame[];
    onBack: () => void;
    onOpenProfile: (friend: Friend) => void;
    onSendMessage: (text: string) => void;
    isLoadingHistory: boolean;
    mp: any;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
    activeFriend, messages, currentUsername, avatarsCatalog, framesCatalog, 
    onBack, onOpenProfile, onSendMessage, isLoadingHistory, mp
}) => {
    const [chatInput, setChatInput] = React.useState('');
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    
    const getFrameClass = (fid?: string) => framesCatalog.find(f => f.id === fid)?.cssClass || 'border-white/10';

    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        onSendMessage(chatInput);
        setChatInput('');
    };

    const isRealUser = activeFriend.id !== SUPPORT_ID && !activeFriend.id.startsWith('bot_');

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 bg-gray-900/40 relative">
            {/* --- HEADER --- */}
            <div className="px-4 py-3 bg-gray-900/90 border-b border-white/10 flex items-center gap-3 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><ArrowLeft size={20}/></button>
                
                <div 
                    onClick={() => onOpenProfile(activeFriend)}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${(avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).bgGradient} flex items-center justify-center border cursor-pointer hover:scale-105 transition-transform ${getFrameClass(activeFriend.frameId)}`}
                >
                    {React.createElement((avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).icon, { size: 20, className: (avatarsCatalog.find(a => a.id === activeFriend.avatarId) || avatarsCatalog[0]).color })}
                </div>
                
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-white truncate block">{activeFriend.name}</span>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${activeFriend.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-500'}`}></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                            {activeFriend.status === 'online' ? (activeFriend.gameActivity && activeFriend.gameActivity !== 'menu' ? `Joue à ${GAME_NAMES[activeFriend.gameActivity] || activeFriend.gameActivity}` : 'En ligne') : 'Hors-ligne'}
                        </span>
                    </div>
                </div>

                {/* VOICE CHAT INTEGRATION */}
                {isRealUser && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <VoiceChatHUD 
                            myId={mp.peerId} 
                            opponentId={activeFriend.id} 
                            gameActive={true} 
                        />
                    </div>
                )}

                <button onClick={() => onOpenProfile(activeFriend)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><MoreVertical size={20}/></button>
            </div>

            {/* --- MESSAGES --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoadingHistory && <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                
                {messages?.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUsername ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] flex flex-col ${msg.senderId === currentUsername ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg relative border ${msg.senderId === currentUsername ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-white/20 rounded-br-none' : 'bg-gray-800 text-gray-100 border-white/5 rounded-bl-none'}`}>
                                {msg.text.replace(/\[SUPPORT_REPLY\]/, '')}
                                <div className="flex items-center gap-1 mt-1 opacity-50 justify-end">
                                    <span className="text-[8px] font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {msg.senderId === currentUsername && msg.pending && <Clock size={8} className="animate-pulse" />}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* --- INPUT --- */}
            <div className="p-4 bg-gray-900/90 border-t border-white/10 backdrop-blur-md sticky bottom-0 z-20">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-800/80 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center focus-within:border-cyan-500/50 transition-all shadow-inner">
                        <input 
                            type="text" 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            placeholder="Ton message néon..." 
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500" 
                        />
                        <button type="button" className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"><Smile size={20}/></button>
                    </div>
                    <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50">
                        <Send size={18} fill="currentColor"/>
                    </button>
                </form>
            </div>
        </div>
    );
};
