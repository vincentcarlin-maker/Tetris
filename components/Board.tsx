
import React from 'react';
import { Block } from './Block';
import { Board as BoardType } from '../types';

interface BoardProps {
  board: BoardType;
}

export const Board: React.FC<BoardProps> = ({ board }) => {
  return (
    <div className="grid grid-cols-10 grid-rows-20 gap-px bg-gray-800 border-4 border-gray-700 rounded-lg shadow-lg">
      {board.map((row, y) =>
        row.map((cell, x) => <Block key={`${y}-${x}`} type={cell[0]} />)
      )}
    </div>
  );
};
