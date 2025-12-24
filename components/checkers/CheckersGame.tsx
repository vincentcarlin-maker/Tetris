
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trophy, Coins, HelpCircle, Loader2 } from 'lucide-react';
import { useCheckersLogic } from './hooks/useCheckersLogic';
import { CheckersBoard } from './components/CheckersBoard';
import { CheckersMenu } from './components/CheckersMenu';
import { TutorialOverlay } from '../Tutorials';
import { getValidMoves } from './logic';

interface CheckersGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    mp: any;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress }) => {
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

    if (phase !== 'GAME') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-4">
                <CheckersMenu 
                    phase={phase === 'DIFFICULTY' ? 'DIFFICULTY' : 'MENU'}
                    onSelectMode={(m) => { if (m === 'SOLO') setPhase('DIFFICULTY'); else { logic.setGameMode(m); setPhase('GAME'); if(m === 'ONLINE') mp.connect(); } }}
                    onSelectDifficulty={(d) => { logic.setDifficulty(d); logic.setGameMode('SOLO'); setPhase('GAME'); }}
                    onBack={() => setPhase('MENU')}
                    onReturnToMain={onBack}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 select-none touch-none overflow-y-auto">
            <div className="w-full max-w-md flex items-center justify-between z-10 mb-4 shrink-0">
                <button onClick={() => setPhase('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95"><ArrowLeft size={20} /></button>
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
                    <span className="text-xs font-bold tracking-widest">SCAN DES SIGNAUX...</span>
                </div>
            )}

            {logic.winner && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold]" />
                    <h2 className="text-4xl font-black italic text-white mb-2 uppercase">{logic.winner === 'white' ? 'P1 GAGNE' : 'P2 GAGNE'}</h2>
                    {logic.earnedCoins > 0 && <div className="mb-8 flex items-center gap-2 bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold text-xl">+{logic.earnedCoins}</span></div>}
                    <button onClick={() => setPhase('MENU')} className="px-8 py-3 bg-gray-800 text-white rounded-xl font-bold border border-white/10 hover:bg-white hover:text-black transition-all">RETOUR MENU</button>
                </div>
            )}
            {showTutorial && <TutorialOverlay gameId="checkers" onClose={() => setShowTutorial(false)} />}
        </div>
    );
};
