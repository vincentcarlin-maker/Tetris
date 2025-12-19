
import React, { useState } from 'react';
import { ArrowLeft, Send, Mail, MessageSquare, CheckCircle, AlertCircle, Info, Loader2, Sparkles } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { DB, isSupabaseConfigured } from '../lib/supabaseClient';

interface ContactOverlayProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
}

export const ContactOverlay: React.FC<ContactOverlayProps> = ({ onBack, audio, currency }) => {
    const { username, t } = currency;
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSubject = subject.trim();
        const trimmedMsg = message.trim();
        if (!trimmedSubject || !trimmedMsg) return;

        setIsSending(true);
        audio.resumeAudio();

        if (isSupabaseConfigured) {
            try {
                // On formate le message pour inclure l'objet du support
                const formattedText = `[SUPPORT][OBJ:${trimmedSubject}] ${trimmedMsg}`;
                await DB.sendMessage(username, 'SYSTEM_SUPPORT', formattedText);
                
                setIsSending(false);
                setStatus('success');
                audio.playVictory();
                
                setTimeout(() => {
                    onBack();
                }, 2500);
            } catch (err) {
                console.error("Failed to send support message:", err);
                setIsSending(false);
                setStatus('error');
            }
        } else {
            // Fallback si pas de Supabase (simulation pour éviter de bloquer l'UI)
            setTimeout(() => {
                setIsSending(false);
                setStatus('success');
                audio.playVictory();
                setTimeout(() => onBack(), 2500);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-black/20 font-sans text-white p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-24">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-blue-600 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] uppercase">
                        {t.contact}
                    </h1>
                    <div className="w-10"></div>
                </div>

                <div className="bg-gray-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                    
                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 italic">MESSAGE ENVOYÉ !</h2>
                            <p className="text-gray-400 text-sm">Merci {username}, notre équipe de robots néon vous répondra dès que possible.</p>
                            <div className="mt-8 flex gap-1 justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    ) : status === 'error' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                <AlertCircle size={40} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 italic">ERREUR D'ENVOI</h2>
                            <p className="text-gray-400 text-sm">Le signal n'a pas pu traverser la grille. Réessayez plus tard.</p>
                            <button onClick={() => setStatus('idle')} className="mt-8 px-6 py-2 bg-gray-800 rounded-full text-sm font-bold border border-white/10">RETOURNER AU FORMULAIRE</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl flex items-center gap-4">
                                <Info size={24} className="text-neon-blue shrink-0" />
                                <p className="text-[11px] text-blue-100/80 leading-tight">
                                    Une question ? Un bug ? Une suggestion de jeu ? Envoyez-nous un signal dans le cyber-espace.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Expéditeur</label>
                                <div className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-gray-400 font-bold text-sm italic">
                                    {username}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neon-blue uppercase tracking-widest ml-2">Sujet du signal</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        required
                                        placeholder="Ex: Idée de nouveau jeu"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 pl-11 text-white text-sm focus:border-neon-blue outline-none transition-all"
                                    />
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neon-blue uppercase tracking-widest ml-2">Votre Message</label>
                                <div className="relative">
                                    <textarea 
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                        rows={6}
                                        placeholder="Écrivez ici..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-11 text-white text-sm focus:border-neon-blue outline-none transition-all resize-none"
                                    />
                                    <MessageSquare className="absolute left-3.5 top-4 text-gray-500" size={18} />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSending || !subject.trim() || !message.trim()}
                                className={`
                                    w-full py-4 rounded-2xl font-black text-lg italic tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95
                                    ${isSending 
                                        ? 'bg-gray-800 text-gray-500 border border-white/10' 
                                        : 'bg-neon-blue text-black border-2 border-white/20 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:bg-white hover:border-neon-blue'}
                                `}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" /> ENVOI...
                                    </>
                                ) : (
                                    <>
                                        TRANSMETTRE <Send size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-gray-900/50 border border-white/5 rounded-3xl p-6 flex items-center gap-4 text-gray-400">
                    <Sparkles className="text-neon-pink" size={24} />
                    <div>
                        <h4 className="text-xs font-bold text-white mb-0.5">Assistance technique</h4>
                        <p className="text-[10px] leading-tight">Nos ingénieurs travaillent 24/7 sur la grille pour vous offrir la meilleure expérience arcade.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
