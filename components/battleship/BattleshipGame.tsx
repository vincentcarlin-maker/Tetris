
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, ShieldAlert, Coins, HelpCircle, ArrowLeft, Loader2, Cpu, Globe, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useCurrency } from '../../hooks/useCurrency';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { TutorialOverlay } from '../Tutorials';
import { useBattleshipLogic } from './hooks/useBattleshipLogic';
import { BattleshipSetup } from './BattleshipSetup';
import { BattleshipPlay } from './BattleshipPlay';

interface BattleshipGameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>; 
  onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
  const { username, currentAvatarId } = useCurrency();
  const [showTutorial, setShowTutorial] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const logic = useBattleshipLogic(audio, addCoins, mp, onReportProgress);

  // --- SETUP ---
  useEffect(() => {
      mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

  useEffect(() => {
      const hasSeen = localStorage.getItem('neon_battleship_tutorial_seen');
      if (!hasSeen) {
          setShowTutorial(true);
          localStorage.setItem('neon_battleship_tutorial_seen', 'true');
      }
  }, []);

  // --- CHAT & NETWORK SYNC ---
  // Note: Most network logic is in the hook, but Chat is UI specific here for cleaner hook
  useEffect(() => {
    const unsubscribe = mp.subscribe((data: any) => {
        if (data.type === 'CHAT') setChatHistory(prev => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
        if (data.type === 'REACTION') { setActiveReaction({ id: data.id, isMe: false }); setTimeout(() => setActiveReaction(null), 3000); }
    });
    return () => unsubscribe();
  }, [mp.subscribe]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const sendChat = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim() || mp.mode !== 'in_game') return;
      const msg: ChatMessage = { id: Date.now(), text: chatInput.trim(), senderName: username, isMe: true, timestamp: Date.now() };
      setChatHistory(prev => [...prev, msg]);
      mp.sendData({ type: 'CHAT', text: msg.text, senderName: username });
      setChatInput('');
  };

  const sendReaction = (reactionId: string) => {
      if (logic.gameMode === 'ONLINE' && mp.mode === 'in_game') {
          setActiveReaction({ id: reactionId, isMe: true });
          mp.sendData({ type: 'REACTION', id: reactionId });
          setTimeout(() => setActiveReaction(null), 3000);
      }
  };
  
  const renderReactionVisual = (reactionId: string, color: string) => {
      const reaction = REACTIONS.find(r => r.id === reactionId);
      if (!reaction) return null;
      const Icon = reaction.icon;
      const anim = reaction.anim || 'animate-bounce';
      return <div className={anim}><Icon size={48} className={`${color} drop-shadow-[0_0_20px_currentColor]`} /></div>;
  };

  const handleLocalBack = () => {
      if (logic.phase === 'SETUP' || logic.phase === 'PLAYING' || logic.phase === 'GAMEOVER') {
          if (logic.gameMode === 'ONLINE') {
              mp.leaveGame();
              logic.setOnlineStep('lobby');
          }
          logic.setPhase('MENU');
      } else if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
          mp.disconnect();
          logic.setPhase('MENU');
      } else {
          onBack();
      }
  };

  const renderLobby = () => {
         // Simplified Lobby Render (Same as before)
         // ... (Omitted for brevity, assuming standard lobby code pattern)
         const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-teal-300 tracking-wider drop-shadow-md">LOBBY BATAILLE</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2">
                        <Loader2 size={18} className={mp.isLoading ? 'animate-spin' : 'hidden'}/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 ? (
                        hostingPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                <span className="font-bold">{player.name}</span>
                                <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                            </div>
                        ))
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie disponible...</p>}
                </div>
             </div>
         );
    };

  // --- VIEWS ---

  if (logic.phase === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#22c55e]">NEON FLEET</h1>
            <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                <button onClick={() => { logic.setGameMode('SOLO'); logic.setPhase('SETUP'); }} className="px-6 py-4 bg-gray-800 border-2 border-neon-blue text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                    <Cpu size={24} className="text-neon-blue"/> 1 JOUEUR
                </button>
                <button onClick={() => { logic.setGameMode('ONLINE'); logic.setPhase('SETUP'); }} className="px-6 py-4 bg-gray-800 border-2 border-green-500 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                    <Globe size={24} className="text-green-500"/> EN LIGNE
                </button>
            </div>
            <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
        </div>
      );
  }

  if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-2">
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
             <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-300 pr-2 pb-1">BATAILLE</h1>
                <div className="w-10"></div>
            </div>
            {logic.onlineStep === 'connecting' ? (
                <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-teal-400 animate-spin mb-4" /><p className="text-teal-300 font-bold">CONNEXION...</p></div>
            ) : renderLobby()}
        </div>
      );
  }

  return (
    <div className={`h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans p-2 select-none touch-none ${logic.shakeBoard ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <style>{`@keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-5px, 5px); } 75% { transform: translate(5px, -5px); } }`}</style>
        
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
        
        {showTutorial && <TutorialOverlay gameId="battleship" onClose={() => setShowTutorial(false)} />}

        {logic.notification && (
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xs p-4 rounded-xl border-2 flex flex-col items-center text-center animate-in zoom-in duration-200 ${logic.notification.type === 'HIT' ? 'bg-red-900/90 border-red-500 shadow-[0_0_30px_red]' : 'bg-green-900/90 border-green-500 shadow-[0_0_30px_lime]'}`}>
                <span className="text-xl font-black italic tracking-widest text-white drop-shadow-md leading-tight break-words">{logic.notification.text}</span>
            </div>
        )}

        {activeReaction && (() => {
            const reaction = REACTIONS.find(r => r.id === activeReaction.id);
            if (!reaction) return null;
            const positionClass = activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
            return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${reaction.anim || 'animate-bounce'}`}>{renderReactionVisual(reaction.id, reaction.color)}</div></div>;
        })()}

        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10 mb-2 shrink-0">
            <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 pr-2">NEON FLEET</h1>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                <button onClick={logic.resetGame} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
            </div>
        </div>

        {logic.phase === 'SETUP' && (
            <BattleshipSetup
                grid={logic.setupGrid}
                ships={logic.setupShips}
                selectedShipType={logic.selectedShipType}
                orientation={logic.orientation}
                isReady={logic.isReady}
                gameMode={logic.gameMode}
                onCellClick={logic.handleSetupCellClick}
                onSelectShip={logic.setSelectedShipType}
                onToggleOrientation={logic.onToggleOrientation}
                onRandomize={logic.randomizeSetup}
                onStartBattle={logic.startBattle}
            />
        )}

        {logic.phase === 'PLAYING' && (
            <BattleshipPlay
                playerGrid={logic.playerGrid}
                cpuGrid={logic.cpuGrid}
                playerShips={logic.playerShips}
                cpuShips={logic.cpuShips}
                turn={logic.turn}
                onAttack={logic.handleAttack}
            />
        )}

        {logic.gameMode === 'ONLINE' && !logic.winner && !logic.opponentLeft && mp.gameOpponent && (
            <div className="w-full max-w-lg z-30 px-2 pb-4 absolute bottom-0">
                <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                    {REACTIONS.map(reaction => {
                        const Icon = reaction.icon;
                        return <button key={reaction.id} onClick={() => sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><Icon size={16} className={reaction.color} /></button>;
                    })}
                </div>
                <form onSubmit={sendChat} className="flex gap-2">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                    <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                </form>
            </div>
        )}

        {logic.phase === 'GAMEOVER' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in p-6 text-center">
                {logic.winner === 'PLAYER' ? (
                    <>
                        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">VICTOIRE !</h2>
                        <p className="text-green-400 font-bold mb-6">FLOTTE ENNEMIE DÉTRUITE</p>
                        {logic.earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={24} /><span className="text-yellow-100 font-bold text-xl">+{logic.earnedCoins} PIÈCES</span></div>}
                    </>
                ) : (
                    <>
                        <ShieldAlert size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red]" />
                        <h2 className="text-5xl font-black italic text-white mb-2">DÉFAITE...</h2>
                        <p className="text-red-400 font-bold mb-6">VOTRE FLOTTE A COULÉ</p>
                    </>
                )}
                <div className="flex flex-col gap-4 w-full max-w-[280px]">
                    <div className="flex gap-2 w-full">
                        <button onClick={logic.resetGame} className="flex-1 px-4 py-3 bg-white text-black font-black tracking-widest text-sm rounded-xl hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"><RefreshCw size={18} /> REJOUER</button>
                        {logic.gameMode === 'ONLINE' && <button onClick={() => { mp.leaveGame(); logic.setOnlineStep('lobby'); }} className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 text-sm">QUITTER</button>}
                    </div>
                    <button onClick={handleLocalBack} className="w-full py-3 bg-gray-800 border border-white/10 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"><Home size={18}/> RETOUR AU MENU</button>
                </div>
            </div>
        )}
    </div>
  );
};
