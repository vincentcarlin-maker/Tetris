
import React, { useRef, useEffect } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, Loader2, CircleDot, MessageSquare, Send } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, ChatMessage } from '../types';
import { ROWS, COLS, REACTIONS } from '../constants';

interface Connect4BoardProps {
    board: BoardState;
    currentPlayer: Player;
    winState: WinState;
    isAiThinking: boolean;
    gameMode: GameMode;
    mp: any;
    opponentLeft: boolean;
    onColumnClick: (col: number) => void;
    onBack: () => void;
    onRestart: () => void;
    onShowTutorial: () => void;
    handleOpponentLeftAction: (action: 'lobby' | 'wait') => void;
    chatHistory: ChatMessage[];
    activeReaction: { id: string, isMe: boolean } | null;
    sendChat: (t: string) => void;
    sendReaction: (id: string) => void;
}

export const Connect4Board: React.FC<Connect4BoardProps> = (props) => {
    const { 
        board, currentPlayer, winState, isAiThinking, gameMode, mp, opponentLeft, 
        onColumnClick, onBack, onRestart, onShowTutorial, handleOpponentLeftAction,
        chatHistory, activeReaction, sendChat, sendReaction
    } = props;

    const [chatInput, setChatInput] = React.useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    // --- RENDER HELPERS ---
    const renderReactionVisual = (reactionId: string, color: string) => {
        const reaction = REACTIONS.find(r => r.id === reactionId);
        if (!reaction) return null;
        const Icon = reaction.icon;
        const anim = reaction.anim || 'animate-bounce';
        return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-4">
           <style>{`@keyframes dropIn { 0% { transform: translateY(var(--drop-start)); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }`}</style>
           
           <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
           
           {/* REACTION DISPLAY */}
           {activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                if (!reaction) return null;
                const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
                const anim = reaction.anim || 'animate-bounce';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
           })()}

           {/* HEADER */}
           <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0 relative min-h-[48px]">
             <div className="z-20 relative">
                 <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                    <ArrowLeft size={20} />
                 </button>
             </div>
             <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full">
                <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-blue drop-shadow-[0_0_10px_rgba(255,0,255,0.4)] pr-2 pb-1">NEON CONNECT</h1>
             </div>
             <div className="z-20 relative min-w-[40px] flex justify-end gap-2">
                <button onClick={onShowTutorial} className="p-2 bg-gray-800 rounded-lg text-neon-pink hover:text-white border border-white/10"><HelpCircle size={20} /></button>
                <button onClick={onRestart} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10">
                    <RefreshCw size={20} />
                </button>
             </div>
           </div>

           {/* ONLINE STATUS INDICATOR */}
           {gameMode === 'ONLINE' && !winState.winner && (
                <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors bg-gray-900 border-white/20`}>
                    {!mp.gameOpponent ? (
                        <span className="flex items-center gap-2 text-gray-400"><Loader2 size={12} className="animate-spin"/> EN ATTENTE...</span>
                    ) : (
                        <>
                            <div className={`w-2 h-2 rounded-full ${currentPlayer === 1 ? 'bg-neon-pink shadow-[0_0_5px_#ff00ff]' : 'bg-neon-blue shadow-[0_0_5px_#00f3ff]'}`}></div>
                            <span className={currentPlayer === 1 ? 'text-neon-pink' : 'text-neon-blue'}>
                                {((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2)) ? "C'EST TON TOUR" : "L'ADVERSAIRE JOUE..."}
                            </span>
                        </>
                    )}
                </div>
           )}

           {/* PVE STATUS */}
           {gameMode !== 'ONLINE' && !winState.winner && (
                <div className={`mb-2 px-6 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-colors ${
                    currentPlayer === 1 
                        ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' 
                        : 'bg-neon-blue/10 border-neon-blue text-neon-blue'
                }`}>
                    <CircleDot size={12} className={isAiThinking ? 'animate-spin' : ''} /> 
                    {isAiThinking ? 'IA RÉFLÉCHIT...' : `TOUR JOUEUR ${currentPlayer}`}
                </div>
           )}

           <div className={`relative z-10 p-2 sm:p-4 bg-black/60 rounded-2xl border-4 border-gray-700/80 shadow-2xl backdrop-blur-md w-full max-w-lg aspect-[7/6]`}>
                
                {/* WAITING OVERLAY */}
                {gameMode === 'ONLINE' && !mp.gameOpponent && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
                        <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                        <p className="font-bold text-lg animate-pulse mb-4">EN ATTENTE D'UN JOUEUR...</p>
                        <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-colors">ANNULER</button>
                    </div>
                )}
                
                {/* OPPONENT LEFT OVERLAY */}
                {opponentLeft && (
                     <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 rounded-xl">
                        <h2 className="text-xl font-black italic text-white mb-2 text-center">ADVERSAIRE PARTI</h2>
                        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
                            <button onClick={() => handleOpponentLeftAction('wait')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors">ATTENDRE UN JOUEUR</button>
                            <button onClick={() => handleOpponentLeftAction('lobby')} className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">RETOUR AU LOBBY</button>
                        </div>
                     </div>
                )}

                {/* THE GRID */}
                <div className="grid grid-cols-7 gap-1 sm:gap-3 relative">
                    <div className="absolute inset-0 grid grid-cols-7 w-full h-full z-20">
                            {Array.from({ length: COLS }).map((_, c) => <div key={`col-${c}`} onClick={() => onColumnClick(c)} className={`h-full transition-colors rounded-full ${winState.winner || (gameMode === 'ONLINE' && !mp.gameOpponent) ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}/>)}
                    </div>
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div key={c} className="flex flex-col gap-1 sm:gap-3">
                            {Array.from({ length: ROWS }).map((_, r) => {
                                const val = board[r][c];
                                const isWinningPiece = winState.line.some(([wr, wc]) => wr === r && wc === c);
                                return (
                                    <div key={`${r}-${c}`} className="relative w-full aspect-square rounded-full bg-gray-800/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border-2 border-white/20 group-hover:border-white/30 transition-colors overflow-visible">
                                        {val !== 0 && <div className={`absolute inset-0 m-auto w-full h-full rounded-full transition-all duration-500 shadow-lg ${val === 1 ? 'bg-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.6)]' : 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.6)]'} ${isWinningPiece ? 'animate-pulse ring-4 ring-white z-10 brightness-125' : ''}`}><div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent"></div></div>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
           </div>

           {/* CHAT & REACTIONS (ONLINE ONLY) */}
           {gameMode === 'ONLINE' && !winState.winner && !opponentLeft && mp.gameOpponent && (
                <div className="w-full max-w-lg mt-2 flex flex-col gap-2 z-20 px-2 shrink-0">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <div className="flex flex-col gap-1 max-h-16 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${msg.isMe ? 'bg-purple-500/20 text-purple-100' : 'bg-gray-700/50 text-gray-300'}`}>{!msg.isMe && <span className="mr-1 opacity-50">{msg.senderName}:</span>}{msg.text}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()){ sendChat(chatInput); setChatInput(''); } }} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-neon-blue text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
           )}
        </div>
    );
};
