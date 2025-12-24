
import React from 'react';
import { Crown } from 'lucide-react';
import { BoardState, Position, Move, PlayerColor } from '../types';

interface CheckersBoardProps {
    board: BoardState;
    selectedPos: Position | null;
    availableMoves: Move[];
    turn: PlayerColor;
    gameMode: string;
    amIP1: boolean;
    mandatoryJumpPositions: Set<string>;
    onCellClick: (r: number, c: number) => void;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({
    board, selectedPos, availableMoves, turn, gameMode, amIP1, mandatoryJumpPositions, onCellClick
}) => {
    const isFlipped = gameMode === 'ONLINE' && !amIP1;

    return (
        <div className="relative w-full max-w-md aspect-square bg-gray-900 border-[6px] border-gray-700 rounded-lg shadow-2xl">
            <div className={`grid grid-cols-10 grid-rows-10 w-full h-full ${isFlipped ? 'rotate-180' : ''}`}>
                {board.map((row, r) => (
                    row.map((piece, c) => {
                        const isPlayableSquare = (r + c) % 2 === 1;
                        const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                        const isTarget = availableMoves.some(m => m.to.r === r && m.to.c === c);
                        const isMandatory = mandatoryJumpPositions.has(`${r},${c}`) && (gameMode !== 'SOLO' || turn === 'white');

                        let bgClass = isPlayableSquare ? 'bg-black/40 shadow-inner' : 'bg-white/10';
                        if (isTarget) bgClass = 'bg-green-500/20 shadow-[inset_0_0_15px_#22c55e]';

                        return (
                            <div 
                                key={`${r}-${c}`}
                                onClick={() => onCellClick(r, c)}
                                className={`relative flex items-center justify-center ${bgClass} ${isTarget ? 'cursor-pointer' : ''}`}
                            >
                                {isTarget && <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                {piece && (
                                    <div className={`
                                        relative w-[80%] aspect-square rounded-full flex items-center justify-center
                                        transition-all duration-300
                                        ${piece.player === 'white' ? 'text-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'text-pink-500 shadow-[0_0_10px_#ec4899]'}
                                        ${isSelected ? 'scale-110 brightness-150 z-10' : ''}
                                        ${isMandatory ? 'ring-4 ring-yellow-400 shadow-[0_0_15px_#facc15] animate-pulse z-10' : ''}
                                        ${isFlipped ? 'rotate-180' : ''}
                                    `}>
                                        <div className={`absolute inset-0 rounded-full opacity-20 ${piece.player === 'white' ? 'bg-cyan-400' : 'bg-pink-500'}`}></div>
                                        <div className={`absolute inset-0 rounded-full border-2 sm:border-4 ${piece.player === 'white' ? 'border-cyan-400' : 'border-pink-500'}`}></div>
                                        <div className={`absolute inset-[25%] rounded-full border opacity-50 ${piece.player === 'white' ? 'border-cyan-400' : 'border-pink-500'}`}></div>
                                        {piece.isKing && <Crown size={16} strokeWidth={2.5} className="relative z-10 drop-shadow-[0_0_5px_currentColor] animate-pulse" />}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};
