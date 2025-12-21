
import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, Lock, Loader2, Play, MessageSquare, Send, Smile, Home } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
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

    const renderLobby = () => {
         const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
         return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md bg-black/60 rounded-xl border border-white/10 backdrop-blur-md p-4">
                 <div className="flex flex-col gap-3 mb-4">
                     <h3 className="text-xl font-black text-center text-cyan-300 tracking-wider drop-shadow-md">LOBBY MASTERMIND</h3>
                     <button onClick={mp.createRoom} className="w-full py-3 bg-green-500 text-black font-black tracking-widest rounded-xl text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95">
                        <Play size={18} fill="black"/> CRÉER UNE PARTIE
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {hostingPlayers.length > 0 ? (
                        hostingPlayers.map((player: any) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-white/10">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-white">{player.name}</span>
                                </div>
                                <button onClick={() => mp.joinRoom(player.id)} className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white transition-colors">REJOINDRE</button>
                            </div>
                        ))
                    ) : <p className="text-center text-gray-500 italic text-sm py-8">Aucune partie... Créez la vôtre !</p>}
                </div>
             </div>
         );
    };

    // --- RENDER ---
    
    if (logic.phase === 'MENU') {
        return <MastermindMenu onStart={logic.startGame} onBack={onBack} />;
    }

    if (logic.gameMode === 'ONLINE' && logic.onlineStep === 'lobby') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-y-auto text-white font-sans p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={() => logic.setPhase('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 pr-2 pb-1">NEON MIND</h1>
                    <div className="w-10"></div>
                </div>
                {renderLobby()}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-hidden text-white font-sans p-4 touch-none select-none">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            
            {showTutorial && <TutorialOverlay gameId="mastermind" onClose={() => setShowTutorial(false)} />}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-2 shrink-0">
                <button onClick={() => { if(logic.gameMode === 'ONLINE') mp.leaveGame(); else logic.setPhase('MENU'); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
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

            {/* WAITING FOR OPPONENT */}
            {logic.gameMode === 'ONLINE' && mp.isHost && logic.onlineStep === 'game' && !mp.gameOpponent && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                    <Loader2 size={48} className="text-cyan-400 animate-spin mb-4" />
                    <p className="font-bold text-lg animate-pulse mb-2">EN ATTENTE D'UN JOUEUR...</p>
                    <button onClick={mp.cancelHosting} className="px-6 py-2 bg-red-600/80 text-white rounded-full text-sm font-bold mt-4">ANNULER</button>
                </div>
            )}

            {/* CREATION PHASE */}
            {logic.phase === 'CREATION' && (
                <MastermindCreation 
                    buffer={logic.makerBuffer}
                    onColorSelect={logic.handleMakerColorSelect}
                    onDelete={logic.handleMakerDelete}
                    onSubmit={logic.handleMakerSubmit}
                />
            )}

            {/* WAITING PHASE (GUEST) */}
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

            {/* PLAYING PHASE */}
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

            {/* ONLINE CHAT */}
            {logic.gameMode === 'ONLINE' && mp.gameOpponent && (
                 <div className="w-full max-w-lg z-30 px-2 pb-4 mt-2">
                    <div className="flex justify-between items-center gap-1 p-1 bg-gray-900/80 rounded-xl border border-white/10 overflow-x-auto no-scrollbar mb-2">
                        {REACTIONS.map(reaction => {
                            // Map string icon names
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
                        // Icon mapping needed here if extracted from constants as strings
                        return <div className={`absolute z-50 pointer-events-none ${positionClass}`}><div className={`p-3 drop-shadow-2xl ${anim}`}><SmileIcon size={48} className={reaction.color}/></div></div>;
                    })()}
                </div>
            )}
        </div>
    );
};
