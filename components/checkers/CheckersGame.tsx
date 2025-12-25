
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trophy, Coins, HelpCircle, Loader2, Home, Play, Wifi, Search, X } from 'lucide-react';
import { useCheckersLogic } from './hooks/useCheckersLogic';
import { CheckersBoard } from './components/CheckersBoard';
import { CheckersMenu } from './components/CheckersMenu';
import { TutorialOverlay } from '../Tutorials';
import { getValidMoves } from './logic';
import { useCurrency } from '../../hooks/useCurrency';

interface CheckersGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    mp: any;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
    const { avatarsCatalog } = useCurrency();
    const logic = useCheckersLogic(audio, addCoins, mp, onReportProgress);
    const [phase, setPhase] = useState<'MENU' | 'DIFFICULTY' | 'GAME'>('MENU');
    const [showTutorial, setShowTutorial] = useState(false);

    const handleCellClick = (r: number, c: number) => {
        if (logic.winner || showTutorial) return;
        if (logic.gameMode === 'ONLINE' && (!mp.gameOpponent || !((mp.amIP1 && logic.turn === 'white') || (!mp.amIP1 && logic.turn === 'red')))) return;
        if (logic.gameMode === 'SOLO' && logic.turn === 'red') return;

        const piece = logic.board[r][c];
        if (piece?.player === logic.turn) {
            const moves = getValidMoves(logic.board, logic.turn, logic.mustJumpPos || undefined);
            const pieceMoves = moves.filter(m => m.from.r === r && m.from.c === c);
            if (pieceMoves.length > 0) {
                audio.playPaddleHit();
                logic.setSelectedPos({ r, c });
                logic.setAvailableMoves(pieceMoves);
            }
        } else if (!piece && logic.selectedPos) {
            const move = logic.availableMoves.find(m => m.to.r === r && m.to.c === c);
            if (move) {
                if (logic.gameMode === 'ONLINE') mp.sendData({ type: 'CHECKERS_MOVE', move });
                logic.performMove(move);
            }
        }
    };

    const mandatoryJumpPositions = useMemo(() => {
        const pos = new Set<string>();
        if (logic.winner) return pos;
        if (logic.mustJumpPos) return pos.add(`${logic.mustJumpPos.r},${logic.mustJumpPos.c}`);
        const moves = getValidMoves(logic.board, logic.turn);
        if (moves.length > 0 && moves[0].isJump) moves.forEach(m => pos.add(`${m.from.r},${m.from.c}`));
        return pos;
    }, [logic.board, logic.turn, logic.mustJumpPos, logic.winner]);

    const renderLobby = () => {
        const hostingPlayers = mp.players.filter((p: any) => p.status === 'hosting' && p.id !== mp.peerId);
        
        return (
             <div className="flex flex-col h-full animate-in fade-in w-full max-w-md gap-6 p-4">
                 <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.15)] relative overflow-hidden group shrink-0">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Wifi size={16} className="text-cyan-400"/> Liaison Tactique</h3>
                     <button onClick={mp.createRoom} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-widest rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                        <Play size={20} fill="black"/> CRÉER UN SALON
                     </button>
                </div>

                <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amiraux en attente</span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">{hostingPlayers.length} Online</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {hostingPlayers.length > 0 ? (
                            hostingPlayers.map((player: any) => {
                                const avatar = avatarsCatalog.find(a => a.id === player.avatarId) || avatarsCatalog[0];
                                return (
                                     <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group animate-in slide-in-from-right-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center relative shadow-lg`}>
                                                {React.createElement(avatar.icon, { size: 24, className: avatar.color })}
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-cyan-300 transition-colors uppercase italic">{player.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Disponible</span>
                                            </div>
                                         </div>
                                         <button onClick={() => mp.joinRoom(player.id)} className="px-5 py-2 bg-white text-black font-black text-xs rounded-lg hover:bg-cyan-400 transition-all shadow-lg active:scale-95">
                                            REJOINDRE
                                         </button>
                                     </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-gray-800 p-4 rounded-full border border-gray-700">
                                        <Search size={32} />
                                    </div>
                                </div>
                                <p className="text-xs font-bold tracking-widest text-center uppercase">Scan des fréquences...<br/>Aucun signal détecté</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
         );
    };

    const handleLocalBack = () => {
        if (logic.gameMode === 'ONLINE') {
            if (logic.onlineStep === 'game') {
                mp.leaveGame();
                logic.setOnlineStep('lobby');
            } else {
                mp.disconnect();
                logic.setGameMode('SOLO');
                setPhase('MENU');
            }
            return;
        }
        if (phase !== 'MENU') setPhase('MENU');
        else onBack();
    };

    // 1. ÉCRAN D'ATTENTE HÔTE EN LIGNE
    if (logic.gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && logic.onlineStep === 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/90 relative overflow-y-auto text-white font-sans p-4">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 uppercase tracking-widest">Dames Live</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center z-20 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <Loader2 size={80} className="text-teal-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black italic mb-2 tracking-widest uppercase">Ligne Tactique Ouverte</h2>
                    <p className="text-gray-400 font-bold animate-pulse uppercase text-sm tracking-[0.2em] mb-12">En attente d'un adversaire sur la grille...</p>
                    <button onClick={mp.cancelHosting} className="px-10 py-4 bg-gray-800 border-2 border-red-500/50 text-red-400 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-3">
                        <X size={20} /> COUPER LA LIAISON
                    </button>
                </div>
            </div>
        );
    }

    // 2. LOBBY EN LIGNE (Liste des salons)
    if (logic.gameMode === 'ONLINE' && logic.onlineStep !== 'game') {
        return (
            <div className="h-full w-full flex flex-col items-center bg-black/20 text-white p-2">
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/30 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
                <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0">
                    <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Home size={20} /></button>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 pr-2 pb-1 uppercase tracking-widest">Dames Online</h1>
                    <div className="w-10"></div>
                </div>
                {logic.onlineStep === 'connecting' ? (
                    <div className="flex-1 flex flex-col items-center justify-center"><Loader2 size={48} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-300 font-bold tracking-widest uppercase">Connexion satellite...</p></div>
                ) : renderLobby()}
            </div>
        );
    }

    // 3. MENU DE DÉPART (Solo/Online)
    if (phase !== 'GAME') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-4">
                <CheckersMenu 
                    phase={phase === 'DIFFICULTY' ? 'DIFFICULTY' : 'MENU'}
                    onSelectMode={(m) => { 
                        if (m === 'SOLO') setPhase('DIFFICULTY'); 
                        else { 
                            logic.setGameMode(m); 
                            setPhase('GAME'); 
                            if(m === 'ONLINE') {
                                logic.setOnlineStep('connecting');
                                mp.connect();
                            }
                        } 
                    }}
                    onSelectDifficulty={(d) => { logic.setDifficulty(d); logic.setGameMode('SOLO'); setPhase('GAME'); }}
                    onBack={() => setPhase('MENU')}
                    onReturnToMain={onBack}
                />
            </div>
        );
    }

    // 4. LE JEU LUI-MÊME
    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 select-none touch-none overflow-y-auto">
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={handleLocalBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95"><ArrowLeft size={20} /></button>
                <div className="flex items-center gap-4 text-xl font-black">
                    <span className="text-pink-500 drop-shadow-[0_0_5px_currentColor]">{logic.counts.red}</span>
                    <span className="text-gray-600 text-sm">VS</span>
                    <span className="text-cyan-400 drop-shadow-[0_0_5px_currentColor]">{logic.counts.white}</span>
                </div>
                <button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-cyan-400 active:scale-95"><HelpCircle size={20} /></button>
            </div>

            <CheckersBoard 
                board={logic.board} selectedPos={logic.selectedPos} availableMoves={logic.availableMoves}
                turn={logic.turn} gameMode={logic.gameMode} amIP1={mp.amIP1}
                mandatoryJumpPositions={mandatoryJumpPositions} onCellClick={handleCellClick}
            />

            {logic.gameMode === 'ONLINE' && mp.isHost && !mp.gameOpponent && (
                <div className="mt-8 flex flex-col items-center gap-2 animate-pulse text-cyan-400">
                    <Loader2 className="animate-spin" />
                    <span className="text-xs font-bold tracking-widest uppercase italic">En attente d'un amiral...</span>
                </div>
            )}

            {logic.opponentLeft && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
                    <h2 className="text-2xl font-black italic text-red-500 mb-6 uppercase tracking-widest">Adversaire Déconnecté</h2>
                    <button onClick={handleLocalBack} className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all uppercase">Retour Lobby</button>
                </div>
            )}

            {logic.winner && !logic.opponentLeft && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                    <h2 className="text-4xl font-black italic text-white mb-2 uppercase">{logic.winner === 'white' ? 'Cyan Gagne' : 'Rose Gagne'}</h2>
                    {logic.earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold text-xl">+{logic.earnedCoins}</span></div>}
                    <div className="flex gap-3">
                        <button onClick={() => logic.gameMode === 'ONLINE' ? mp.requestRematch() : logic.resetGame()} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-black tracking-widest text-sm hover:bg-cyan-500 shadow-lg active:scale-95 uppercase italic">Revanche</button>
                        <button onClick={() => setPhase('MENU')} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all uppercase">Quitter</button>
                    </div>
                </div>
            )}
            {showTutorial && <TutorialOverlay gameId="checkers" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};
