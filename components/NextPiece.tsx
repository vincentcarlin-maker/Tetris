
import React from 'react';
import { Block } from './Block.tsx';
import { TetrominoShape, TetrominoKey } from '../types.ts';

interface NextPieceProps {
  tetromino: { shape: TetrominoShape };
}

export const NextPiece: React.FC<NextPieceProps> = ({ tetromino }) => {
  const grid = Array.from({ length: 4 }, () => Array(4).fill('0'));

  tetromino.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        grid[y][x] = value;
      }
    });
  });

  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-px w-24 h-24 mx-auto bg-gray-900 rounded">
      {grid.map((row, y) =>
        row.map((cell, x) => <Block key={`${y}-${x}`} type={cell as TetrominoKey} />)
      )}
    </div>
  );
};