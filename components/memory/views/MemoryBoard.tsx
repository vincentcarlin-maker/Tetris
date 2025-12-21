
import React, { useRef, useEffect } from 'react';
import { RefreshCw, MessageSquare, Send, Smile } from 'lucide-react';
import { MemoryCard, GameMode, ChatMessage } from '../types';
import { ICONS, REACTIONS, DIFFICULTY_CONFIG } from '../constants';
import { Smile as SmileIcon } from 'lucide-react';

interface MemoryBoardProps {
    cards: MemoryCard[];
    flippedIndices: number[];
    handleCardClick: (index: number) => void;
    
    // Stats
    gameMode: GameMode;
    difficulty: any;
    moves: number;
    scores: { p1: number, p2: number };
    currentPlayer: 1 | 2;
    highScore: number;
    mp: any;

    // Online UI
    isWaitingForDeck: boolean;
    isProcessing: boolean;
    opponentLeft: boolean;
    chatHistory: ChatMessage[];
    activeReaction: {id: string, isMe: boolean} | null;
    sendChat: (t: string) => void;
    sendReaction: (id: string) => void;
}

export const MemoryBoard: React.FC<MemoryBoardProps> = ({
    cards, flippedIndices, handleCardClick,
    gameMode, difficulty, moves, scores, currentPlayer, highScore, mp,
    isWaitingForDeck, isProcessing, opponentLeft, chatHistory, activeReaction, sendChat, sendReaction
}) => {
    const [chatInput, setChatInput] = React.useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    const renderCard = (card: MemoryCard) => {
        const iconData = ICONS.find(i => i.id === card.iconId);
        const Icon = iconData ? iconData.icon : RefreshCw;
        const color = iconData ? iconData.color : 'text-white';
        const flipClass = card.isFlipped || card.isMatched ? 'rotate-y-180' : '';
        const matchClass = card.isMatched ? 'opacity-50 shadow-[0_0_15px_#22c55e] border-green-500' : 'border-white/20';
        
        return (
            <div key={card.id} className="relative w-full aspect-[3/4] perspective-1000 cursor-pointer" onClick={() => handleCardClick(card.id)}>
                <style>{`.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
                <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${flipClass}`}>
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 border-2 rounded-md flex items-center justify-center ${matchClass} shadow-lg`}>
                        <Icon size={32} className={`${color} drop-shadow-[0_0_10px_currentColor]`} />
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-gray-800 border border-white/10 rounded-md flex flex-col items-center justify-center group hover:border-white/40 transition-colors shadow-inner">
                         <div className="flex flex-col items-center gap-1">
                             <span className="font-script text-cyan-400 text-[14px] leading-none drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">Neon</span>
                             <span className="font-script text-neon-pink text-[14px] leading-none drop-shadow-[0_0_3px_rgba(255,0,255,0.8)]">Arcade</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col items-center w-full max-w-lg relative z-10 min-h-0">
             
             {/* REACTIONS */}
             {activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === activeReaction.id);
                if (!reaction) return null;
                const positionClass = activeReaction.isMe ? 'bottom-20 right-4' : 'top-20 left-4';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}><SmileIcon size={48} className={reaction.color}/></div></div>;
            })()}

            {/* STATS */}
            <div className="w-full flex justify-between items-center mb-2 px-4 shrink-0">
                {gameMode === 'SOLO' ? (
                    <>
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">COUPS</span><span className="text-2xl font-mono font-bold text-white">{moves}</span></div>
                        <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-2xl font-mono font-bold text-yellow-400">{highScore > 0 ? highScore : '-'}</span></div>
                    </>
                ) : (
                    <>
                        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 1 ? 'bg-neon-pink/20 border-neon-pink' : 'bg-gray-800/50 border-transparent'}`}><span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{mp.amIP1 ? 'TOI (P1)' : 'ADV (P1)'}</span><span className="text-2xl font-mono font-bold text-neon-pink">{scores.p1}</span></div>
                        <div className="text-gray-500 font-black text-xl">VS</div>
                        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${currentPlayer === 2 ? 'bg-neon-blue/20 border-neon-blue' : 'bg-gray-800/50 border-transparent'}`}><span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{!mp.amIP1 ? 'TOI (P2)' : 'ADV (P2)'}</span><span className="text-2xl font-mono font-bold text-neon-blue">{scores.p2}</span></div>
                    </>
                )}
            </div>

            {/* STATUS MSG */}
            {gameMode === 'ONLINE' && (
                <div className="mb-2 z-10 text-sm font-bold animate-pulse text-center h-6 shrink-0">
                    {isWaitingForDeck ? `Partie en ${DIFFICULTY_CONFIG[difficulty].name} rejointe...` : isProcessing ? "..." : ((mp.amIP1 && currentPlayer === 1) || (!mp.amIP1 && currentPlayer === 2)) ? <span className="text-green-400">C'EST TON TOUR !</span> : <span className="text-gray-500">L'ADVERSAIRE JOUE...</span>}
                </div>
            )}

            {/* GRID */}
            <div className="w-full grid gap-1 z-10 p-1 mb-2" style={{ gridTemplateColumns: `repeat(${DIFFICULTY_CONFIG[difficulty].cols}, minmax(0, 1fr))` }}>
                {cards.map(card => renderCard(card))}
            </div>

            {/* ONLINE CONTROLS */}
            {gameMode === 'ONLINE' && !isWaitingForDeck && !opponentLeft && (
                <div className="w-full z-20 px-2 mt-auto pb-4">
                     <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <div className="flex flex-col gap-1 max-h-20 overflow-y-auto px-2 py-1 bg-black/40 rounded-xl border border-white/5 custom-scrollbar mb-2">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${msg.isMe ? 'bg-purple-500/20 text-purple-100' : 'bg-gray-700/50 text-gray-300'}`}>{!msg.isMe && <span className="mr-1 opacity-50">{msg.senderName}:</span>}{msg.text}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()) { sendChat(chatInput); setChatInput(''); } }} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-xl disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            )}
        </div>
    );
};
