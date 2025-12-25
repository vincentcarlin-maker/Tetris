
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, Lock, Loader2, Play, MessageSquare, Send, Smile, Home, Wifi, Search } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';
import { TutorialOverlay } from '../Tutorials';
import { useMastermindLogic } from './hooks/useMastermindLogic';
import { MastermindMenu } from './views/MastermindMenu';
import { MastermindBoard } from './views/MastermindBoard';
import { MastermindControls } from './views/MastermindControls';
import { MastermindCreation } from './views/MastermindCreation';
import { MastermindGameOver } from './views/MastermindGameOver';
import { REACTIONS } from './constants';
import { Smile as SmileIcon } from 'lucide-react';

interface MastermindGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    mp: ReturnType<typeof useMultiplayer>;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const MastermindGame: React.FC<MastermindGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const [showTutorial, setShowTutorial] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = React.useRef<HTMLDivElement>(null);
    const { avatarsCatalog } = useCurrency();

    const logic = useMastermindLogic(audio, addCoins, mp, onReportProgress);

    useEffect(() => {
        const hasSeen = localStorage.getItem('neon_mastermind_tutorial_seen');
        if (!hasSeen) {
            setShowTutorial(true);
            localStorage.setItem('neon_mastermind_tutorial_seen', 'true');
        }
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

    const handleLocalBack = () => {
        if (logic.gameMode === 'ONLINE') {
            if (logic.onlineStep !== 'game') mp.disconnect();
            else mp.leaveGame();
        }
        
        if (logic.phase !== 'MENU') {
            logic.setPhase('MENU');
        } else {
            onBack();
        }
    };

    const renderLobby = () => {
         const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
         
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Wifi size={16} className="text-indigo-400"/> HÉBERGER UNE PARTIE</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/40 active:scale-95">
                        <Play size={20} fill="currentColor"/> CRÉER UN SALON
                     </button>
                </div>

                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cerveaux en attente</span>
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/30">{hostingPlayers.length} ONLINE</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">En attente...</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-indigo-400 hover:text-white transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center">SCAN DES FRÉQUENCES...<br/>AUCUNE PARTIE DÉTECTÉE</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

    if (logic.phase === 'MENU') {
        return <MastermindMenu onStart={logic.startGame} onBack={onBack} />;
    }

    if (logic.phase === 'LOBBY' || (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game')) {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 pr-2 pb-1">NEON MIND</h1>
                    <div className="w-10"></div>
                </div>
                {logic.onlineStep === 'connecting' ? (
                     <div className="flex-1 flex flex-col items-center justify-center z-20"><Loader2 size={48} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-300 font-bold">CONNEXION...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans p-4 touch-none select-none">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="mastermind" onClose={() => setShowTutorial(false)} />}

            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] pr-2 pb-1">NEON MIND</h1>
                    {logic.gameMode === 'ONLINE' && (
                        <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${logic.isCodemaker ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400'}`}>
                            {logic.isCodemaker ? 'CRÉATEUR' : 'DÉCODEUR'}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={() => { if(logic.gameMode === 'ONLINE') mp.requestRematch(); else logic.startGame('SOLO'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {logic.gameMode === 'ONLINE' && mp.isHost && logic.onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {logic.phase === 'CREATION' && (
                <MastermindCreation 
                    buffer={logic.makerBuffer}
                    onColorSelect={logic.handleMakerColorSelect}
                    onDelete={logic.handleMakerDelete}
                    onSubmit={logic.handleMakerSubmit}
                />
            )}

            {logic.phase === 'WAITING' && (
                <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center z-20 text-center p-6">
                    <Lock size={64} className="text-purple-500 mb-6 animate-bounce drop-shadow-[0_0_15px_#a855f7]" />
                    <h2 className="text-xl font-bold text-white mb-2">CODE VERROUILLÉ</h2>
                    <div className="flex items-center gap-2 text-purple-300 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm font-bold tracking-widest">L'HÔTE PRÉPARE LE CODE...</span>
                    </div>
                </div>
            )}

            {(logic.phase === 'PLAYING' || logic.phase === 'GAMEOVER') && (
                <>
                    <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10">
                        <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">ESSAIS</span><span className="text-xl font-mono font-bold text-white">{logic.activeRow + 1}/10</span></div>
                        <div className="flex flex-col items-end"><span className="text-[10px] text-gray-500 font-bold tracking-widest">RECORD</span><span className="text-xl font-mono font-bold text-yellow-400">{logic.bestScore > 0 ? `${logic.bestScore} cps` : '-'}</span></div>
                    </div>

                    <MastermindBoard 
                        guesses={logic.guesses}
                        feedback={logic.feedback}
                        activeRow={logic.activeRow}
                        currentGuess={logic.currentGuess}
                        isCodemaker={logic.isCodemaker}
                        secretCode={logic.secretCode}
                    />

                    {!logic.isCodemaker && logic.phase === 'PLAYING' && (
                        <MastermindControls 
                            onColorClick={logic.handleColorClick}
                            onDelete={logic.handleDelete}
                            onSubmit={logic.handleSubmitGuess}
                            currentGuessLength={logic.currentGuess.length}
                            enabled={true}
                        />
                    )}

                    {logic.phase === 'GAMEOVER' && (
                        <MastermindGameOver 
                            winner={logic.resultMessage?.includes('VICTOIRE') || logic.resultMessage?.includes('SECRET') || false}
                            isCodemaker={logic.isCodemaker}
                            message={logic.resultMessage}
                            earnedCoins={logic.earnedCoins}
                            secretCode={logic.secretCode}
                            onRestart={() => { if(logic.gameMode==='ONLINE') mp.requestRematch(); else logic.startGame('SOLO'); }}
                            onQuit={() => { if(logic.gameMode==='ONLINE') { mp.leaveGame(); logic.setOnlineStep('lobby'); } else logic.setPhase('MENU'); }}
                            showCode={!logic.isCodemaker}
                        />
                    )}
                </>
            )}

            {logic.gameMode === 'ONLINE' && mp.gameOpponent && (
                <div className="w-full max-w-lg z-30 px-2 pb-4 mt-2">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            return <button key={reaction.id} onClick={() => logic.sendReaction(reaction.id)} className={`p-1.5 rounded-lg shrink-0 ${reaction.bg} ${reaction.border} border active:scale-95 transition-transform`}><SmileIcon size={16} className={reaction.color} /></button>;
                        })}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-3"><MessageSquare size={14} className="text-gray-500 mr-2" /><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="bg-transparent border-none outline-none text-white text-xs w-full h-8" /></div>
                        <button type="submit" disabled={!chatInput.trim()} className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50"><Send size={14} /></button>
                    </form>
                    
                    {logic.activeReaction && (() => {
                        const reaction = REACTIONS.find(r => r.id === logic.activeReaction?.id);
                        if (!reaction) return null;
                        const positionClass = logic.activeReaction.isMe ? 'bottom-24 right-4' : 'top-20 left-4';
                        const anim = reaction.anim || 'animate-bounce';
                        return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}><SmileIcon size={48} className={reaction.color}/></div></div>;
                    })()}
                </div>
            )}
        </div>
    );
};
