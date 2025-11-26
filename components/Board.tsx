import React from 'react';
import { Block } from './Block';
import { Board as BoardType } from '../types';

interface BoardProps {
  board: BoardType;
}

export const Board: React.FC<BoardProps> = ({ board }) => {
  return (
    <div className="relative group w-full h-full">
        {/* Neon Glow Container */}
        <div className="absolute -inset-1 bg-gradient-to-b from-neon-blue to-neon-purple opacity-20 blur-xl rounded-lg transition duration-1000"></div>
        
        {/* Main Board */}
        <div className="relative w-full h-full bg-black/80 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl shadow-2xl">
            
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                     backgroundSize: '10% 5%' 
                 }}>
            </div>

            {/* Explicit Grid Template Rows ensures rows don't collapse */}
            <div 
                className="grid grid-cols-10 gap-0 w-full h-full"
                style={{ gridTemplateRows: 'repeat(20, minmax(0, 1fr))' }}
            >
            {board.map((row, y) =>
                row.map((cell, x) => (
                <div key={`${y}-${x}`} className="w-full h-full">
                    <Block type={cell[0]} status={cell[1]} />
                </div>
                ))
            )}
            </div>
        </div>
    </div>
  );
};