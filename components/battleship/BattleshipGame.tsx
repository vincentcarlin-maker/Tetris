
import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, Trophy, Target, ShieldAlert, Coins, HelpCircle, ArrowLeft, Loader2, Cpu, Globe, MessageSquare, Send, Hand, Smile, Frown, ThumbsUp, Heart, Play, Wifi, Search, Ship, ArrowRight } from 'lucide-react';
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
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();
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
         const hostingPlayers = mp.players.filter(p => p.status === 'hosting' && p.id !== mp.peerId);
         
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 {/* Create Section */}
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-blue-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/40 active:scale-95">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                {/* List Section */}
                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flottes en attente</span>
                        <span className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-blue-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-blue-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE FLOTTE DÉTECTÉE</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

  // --- VIEWS ---

  if (logic.phase === 'MENU') {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-[#020205] overflow-y-auto overflow-x-hidden touch-auto">
            <div className="fixed inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#050510] to-black pointer-events-none"></div>
            <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center min-h-full justify-start md:justify-center pt-20 pb-12 md:py-0">
                <div className="mb-6 md:mb-12 w-full text-center animate-in slide-in-from-top-10 duration-700 flex-shrink-0 px-4">
                    <div className="flex items-center justify-center gap-6 mb-4">
                        <Ship size={56} className="text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] animate-pulse hidden md:block" />
                        <h1 className="text-5xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-300 drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] tracking-tighter w-full">
                            NEON<br className="md:hidden"/> BATAILLE
                        </h1>
                        <Ship size={56} className="text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] animate-pulse hidden md:block" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-sm md:max-w-3xl flex-shrink-0">
                    <button onClick={() => { logic.setGameMode('SOLO'); logic.setPhase('SETUP'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(34,211,238,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]"><Cpu size={32} className="text-cyan-400" /></div>
                            <h2 className="text-3xl md:text-4xl font-black text-white italic mb-2 group-hover:text-cyan-300 transition-colors">SOLO</h2>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Affrontez l'IA dans une bataille navale stratégique.</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">COMMENCER <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                    </button>

                    <button onClick={() => { logic.setGameMode('ONLINE'); logic.setPhase('SETUP'); }} className="group relative h-52 md:h-80 rounded-[32px] border border-white/10 bg-gray-900/40 backdrop-blur-md overflow-hidden transition-all hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] text-left p-6 md:p-8 flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Globe size={32} className="text-blue-400" /></div>
                            <div className="flex items-center gap-3 mb-2"><h2 className="text-3xl md:text-4xl font-black text-white italic group-hover:text-blue-300 transition-colors">EN LIGNE</h2><span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/50 text-green-400 text-[10px] font-black animate-pulse">LIVE</span></div>
                            <p className="text-gray-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">Défiez un autre amiral en temps réel.</p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-blue-400 font-bold text-xs md:text-sm tracking-widest group-hover:text-white transition-colors mt-4">REJOINDRE LE LOBBY <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></div>
                    </button>
                </div>

                <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 flex-shrink-0 pb-safe">
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 py-2 px-4 hover:bg-white/5 rounded-lg"><Home size={14} /> RETOUR AU MENU PRINCIPAL</button>
                </div>
            </div>
        </div>
      );
  }

  if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
      return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-2">
             <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
             <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 pr-2 pb-1">BATAILLE</h1>
                <div className="w-10"></div>
            </div>
            {logic.onlineStep === 'connecting' ? (
                <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-blue-400 animate-spin mb-4" /><p className="text-blue-300 font-bold">CONNEXION...</p></div>
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
                <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 pr-2">NEON FLEET</h1>
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
