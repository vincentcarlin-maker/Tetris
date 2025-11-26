import React from 'react';
import { Block } from './Block';
import { TetrominoShape, TetrominoKey } from '../types';

interface HoldPieceProps {
  tetromino: { shape: TetrominoShape | null };
}

export const HoldPiece: React.FC<HoldPieceProps> = ({ tetromino }) => {
  const grid = Array.from({ length: 4 }, () => Array(4).fill('0'));

  if (tetromino.shape) {
    tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          grid[y][x] = value;
        }
      });
    });
  }

  return (
    <div className="w-full aspect-square flex items-center justify-center">
        <div className="grid grid-cols-4 grid-rows-4 gap-0 w-12 h-12">
        {grid.map((row, y) =>
            row.map((cell, x) => <Block key={`${y}-${x}`} type={cell as TetrominoKey} />)
        )}
        </div>
    </div>
  );
};