
import React from 'react';
import { Layers, AlertTriangle, MessageSquare, Send, Frown, Hand, Smile, Heart, ThumbsUp } from 'lucide-react';
import { SkyjoCard } from '../SkyjoCard';
import { SkyjoCard as SkyjoCardType, Turn, SubTurnState, GamePhase } from '../types';
import { calculateScore } from '../logic';
import { REACTIONS } from '../constants';
import { Smile as SmileIcon } from 'lucide-react'; // Example mapping

interface SkyjoBoardProps {
    cpuGrid: SkyjoCardType[];
    playerGrid: SkyjoCardType[];
    deck: SkyjoCardType[];
    discardPile: SkyjoCardType[];
    turn: Turn;
    phase: GamePhase;
    subTurnState: SubTurnState;
    currentDrawnCard: SkyjoCardType | null;
    doubledScore: Turn | null;
    gameMode: 'SOLO' | 'ONLINE';
    mp: any;
    onDeckClick: () => void;
    onDiscardClick: () => void;
    onGridCardClick: (index: number) => void;
    onSetupReveal: (index: number) => void;
    sendChat: (text: string) => void;
    sendReaction: (id: string) => void;
    chatHistory: any[];
}

export const SkyjoBoard: React.FC<SkyjoBoardProps> = (props) => {
    const { cpuGrid, playerGrid, discardPile, turn, phase, subTurnState, currentDrawnCard, doubledScore, gameMode, mp, onDeckClick, onDiscardClick, onGridCardClick, onSetupReveal, sendChat, sendReaction, chatHistory } = props;
    const [chatInput, setChatInput] = React.useState('');
    const chatEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    return (
        <div className="flex-1 w-full max-w-md flex flex-col gap-2 relative z-10 min-h-0 pb-2 justify-center">
            
            {/* OPPONENT GRID */}
            <div className="w-full bg-gray-900/50 rounded-xl p-1 border border-white/5 relative">
                <div className="flex justify-between px-2 mb-1">
                    <span className="text-xs font-bold text-gray-500">ADVERSAIRE</span>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-500">SCORE: {calculateScore(cpuGrid)}</span>
                        {doubledScore === 'CPU' && <span className="text-[8px] font-black text-red-500 animate-pulse flex items-center gap-1"><AlertTriangle size={8}/> SCORE DOUBLÉ</span>}
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    {cpuGrid.map((card, i) => (
                        <div key={card.id || i} className="flex justify-center">
                            <SkyjoCard card={card} />
                        </div>
                    ))}
                </div>
            </div>

            {/* DECKS AREA */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 h-20 sm:h-32 relative shrink-0">
                <div onClick={onDeckClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard && (phase === 'PLAYING' || phase === 'LAST_TURN') ? 'hover:scale-105' : 'opacity-50'}`}>
                    <div className="w-10 h-14 sm:w-20 sm:h-28 bg-gray-800 rounded-md sm:rounded-lg border sm:border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                        <Layers className="text-purple-400" />
                    </div>
                    <span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">PIOCHE</span>
                </div>

                <div onClick={onDiscardClick} className={`relative cursor-pointer transition-transform ${turn === 'PLAYER' && !currentDrawnCard && (phase === 'PLAYING' || phase === 'LAST_TURN') ? 'hover:scale-105' : ''}`}>
                    {discardPile.length > 0 ? (
                        <SkyjoCard card={discardPile[discardPile.length-1]} />
                    ) : (
                        <div className="w-10 h-14 sm:w-20 sm:h-28 bg-black/50 rounded-md sm:rounded-lg border sm:border-2 border-white/10 border-dashed flex items-center justify-center"></div>
                    )}
                    <span className="absolute -bottom-5 w-full text-center text-[10px] font-bold text-gray-400">DÉFAUSSE</span>
                </div>

                {currentDrawnCard && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 animate-in zoom-in duration-200">
                        <SkyjoCard card={currentDrawnCard} style={{ boxShadow: '0 0 30px rgba(255,255,255,0.5)' }} highlight />
                        <span className="text-[10px] font-bold bg-black/80 px-2 py-1 rounded text-white border border-white/20 shadow-lg">CARTE EN MAIN</span>
                    </div>
                )}
            </div>

            {/* PLAYER GRID */}
            <div className={`w-full bg-gray-900/80 rounded-xl p-1 border-2 ${turn === 'PLAYER' ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10'} transition-all relative`}>
                <div className="flex justify-between px-2 mb-1">
                    <span className="text-xs font-bold text-cyan-400">VOUS</span>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-white">SCORE: {calculateScore(playerGrid)}</span>
                        {doubledScore === 'PLAYER' && <span className="text-[9px] font-black text-red-500 animate-pulse flex items-center gap-1"><AlertTriangle size={10}/> SCORE DOUBLÉ</span>}
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                    {playerGrid.map((card, i) => (
                        <div key={card.id || i} className="flex justify-center">
                            <SkyjoCard 
                                card={card} 
                                onClick={() => {
                                    if (phase === 'SETUP') onSetupReveal(i);
                                    else onGridCardClick(i);
                                }}
                                interactive={
                                    turn === 'PLAYER' && (
                                        phase === 'SETUP' || 
                                        ((phase === 'PLAYING' || phase === 'LAST_TURN') && subTurnState !== 'IDLE')
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>

            {gameMode === 'ONLINE' && mp.gameOpponent && (
                <div className="w-full z-20 px-2 mt-2">
                     <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            // Map string icon names to Lucide components if needed, simplified here
                            return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><SmileIcon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if(chatInput.trim()) { sendChat(chatInput); setChatInput(''); } }} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                </div>
            )}
        </div>
    );
};
