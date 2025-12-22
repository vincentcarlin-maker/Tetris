
import React from 'react';
import { Mic, MicOff, Volume2, AlertCircle, WifiOff, Settings } from 'lucide-react';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { useCurrency } from '../../hooks/useCurrency';

interface VoiceChatHUDProps {
    myId: string | null;
    opponentId: string | null;
    gameActive: boolean;
}

export const VoiceChatHUD: React.FC<VoiceChatHUDProps> = ({ myId, opponentId, gameActive }) => {
    const { voiceChatEnabled } = useCurrency();
    const { isMuted, toggleMute, isConnected, error } = useVoiceChat(myId, opponentId, gameActive, voiceChatEnabled);

    if (!gameActive || !opponentId) return null;

    // Si le chat vocal est désactivé globalement, on n'affiche rien ou une petite option
    if (!voiceChatEnabled) return null;

    return (
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto ring-1 ring-white/5">
            {error === 'permission-denied' ? (
                <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase animate-pulse px-2">
                    <AlertCircle size={14} /> Micro bloqué
                </div>
            ) : !isConnected ? (
                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase px-2">
                    <WifiOff size={14} className="animate-pulse" /> Connexion...
                </div>
            ) : (
                <>
                    <button 
                        onClick={toggleMute}
                        className={`p-2 rounded-xl transition-all active:scale-90 ${
                            isMuted 
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                            : 'bg-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        }`}
                        title={isMuted ? "Activer le micro" : "Couper le micro"}
                    >
                        {isMuted ? <MicOff size={18} /> : <Mic size={18} className="animate-pulse" />}
                    </button>
                    
                    <div className="flex flex-col border-l border-white/10 pl-3 pr-1">
                        <div className="flex items-center gap-1.5">
                            <Volume2 size={12} className={isMuted ? 'text-gray-600' : 'text-neon-blue'} />
                            <span className="text-[9px] font-black text-white/70 tracking-widest uppercase">
                                En Ligne
                            </span>
                        </div>
                        
                        {!isMuted && (
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div 
                                        key={i} 
                                        className="w-1 h-2 bg-neon-blue rounded-full animate-bounce" 
                                        style={{ 
                                            animationDelay: `${i * 0.1}s`, 
                                            animationDuration: '0.5s',
                                            opacity: 0.4 + (i * 0.15)
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
