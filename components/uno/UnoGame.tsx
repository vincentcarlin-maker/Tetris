
import React, { useRef, useEffect } from 'react';
import { Home, RefreshCw, Trophy, Coins, ArrowLeft, HelpCircle, Loader2, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, Play } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { UnoMenu } from './views/UnoMenu';
import { GameOver } from './views/GameOver';
import { ColorSelector } from './views/ColorSelector';
import { UnoBoard } from './UnoBoard';
import { useUnoLogic } from './hooks/useUnoLogic';
import { Play as PlayIcon } from 'lucide-react'; 

interface UnoGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

export const UnoGame: React.FC<UnoGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { avatarsCatalog, username } = useCurrency();
    const discardPileRef = useRef<HTMLDivElement>(null);
    const cpuHandRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [chatInput, setChatInput] = React.useState('');

    const logic = useUnoLogic({
        audio,
        addCoins,
        mp,
        onReportProgress,
        discardPileRef,
        cpuHandRef
    });

    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;
        const handleTouchMove = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.custom-scrollbar') || target === container) return;
            e.preventDefault();
        };
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => container.removeEventListener('touchmove', handleTouchMove);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logic.chatHistory]);

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        logic.sendChat(chatInput);
        setChatInput('');
    };

    const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
    };

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-yellow-300 tracking-wider drop-shadow-md">LOBBY UNO</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <PlayIcon size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 ? (
                        hostingPlayers.map(player => {
                            const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                            const AvatarIcon = avatar.icon;
                            return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center`}><AvatarIcon size={24} className={avatar.color}/></div>
                                        <span className="font-bold">{player.name}</span>
                                    </div>
                                    <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                                </div>
                            );
                        })
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie... Créez la vôtre !</p>}
                </div>
             </div>
         );
    };

    const handleLocalBack = () => {
        if (logic.phase === 'GAME') {
            logic.backToMenu();
        } else if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
            logic.backToMenu();
        } else {
            onBack();
        }
    };

    // --- MAIN RENDER ---
    if (logic.phase === 'MENU') {
        return <UnoMenu onInitGame={logic.initGame} onBack={onBack} />;
    }

    if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300 pr-2 pb-1">NEON UNO</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans touch-none select-none">
            {/* TUTORIAL OVERLAY */}
            {logic.showTutorial && <TutorialOverlay gameId="uno" onClose={() => logic.setShowTutorial(false)} />}

            {logic.activeReaction && (() => {
                const reaction = REACTIONS.find(r => r.id === logic.activeReaction?.id);
                if (!reaction) return null;
                const positionClass = logic.activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
                return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
            })()}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] pr-2 pb-1">NEON UNO</h1>
                    <span className="text-[10px] text-gray-400 font-bold tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/10 animate-pulse">{logic.message}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => logic.setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => logic.startNewGame(logic.gameMode)} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {logic.gameMode === 'ONLINE' && logic.onlineStep === 'connecting' && (
                 <div className="flex-1 flex flex-col items-center justify-center z-20"><Loader2 size={48} className="text-yellow-400 animate-spin mb-4" /><p className="text-yellow-300 font-bold">CONNEXION...</p></div>
            )}

            {logic.gameMode === 'ONLINE' && mp.isHost && logic.onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-green-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* Game Board Component */}
            <UnoBoard
                discardPileRef={discardPileRef}
                cpuHandRef={cpuHandRef}
                playerHand={logic.playerHand}
                cpuHand={logic.cpuHand}
                discardPile={logic.discardPile}
                activeColor={logic.activeColor}
                turn={logic.turn}
                playDirection={logic.playDirection}
                hasDrawnThisTurn={logic.hasDrawnThisTurn}
                isAnimating={logic.isAnimating}
                flyingCard={logic.flyingCard}
                gameMode={logic.gameMode}
                unoShout={logic.unoShout}
                checkCompatibility={logic.checkCompatibility}
                onDrawPileClick={logic.onDrawPileClick}
                onPlayerCardClick={logic.onPlayerCardClick}
                showContestButton={logic.showContestButton}
                playerCalledUno={logic.playerCalledUno}
                onUnoClick={logic.onUnoClick}
                onContestClick={logic.onContestClick}
            />

            {/* ONLINE CHAT */}
            {logic.gameMode === 'ONLINE' && !logic.winner && mp.gameOpponent && (
                <div className="w-full max-w-lg z-30 px-2 pb-4 absolute bottom-0">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            const Icon = reaction.icon;
                            return <button key={reaction.id} onClick={() => logic.sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                    <div ref={chatEndRef} />
                </div>
            )}

            {logic.gameState === 'color_select' && <ColorSelector onColorSelect={logic.handleColorSelect} />}

            {(logic.gameState === 'gameover' || logic.opponentLeft) && (
                <GameOver
                    winner={logic.winner}
                    score={logic.score}
                    earnedCoins={logic.earnedCoins}
                    gameMode={logic.gameMode}
                    onRematch={logic.gameMode === 'ONLINE' ? () => mp.requestRematch() : () => logic.startNewGame(logic.gameMode)}
                    onBackToMenu={logic.backToMenu}
                    opponentLeft={logic.opponentLeft}
                />
            )}
        </div>
    );
};
