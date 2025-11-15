
import React from 'react';
import { TETROMINOS } from '../gameHelpers';
import { TetrominoKey } from '../types';
import type { Cell } from '../types';


interface BlockProps {
  type: TetrominoKey;
  status?: Cell[1];
}

const BlockComponent: React.FC<BlockProps> = ({ type, status }) => {
  const color = TETROMINOS[type].color;
  const isTransparent = color === 'transparent';

  if (status === 'ghost') {
    return (
      <div 
        className="aspect-square"
        style={{
          border: `2px solid rgba(${color}, 0.4)`
        }}
      ></div>
    );
  }

  const style: React.CSSProperties = isTransparent ? {} : {
    backgroundColor: `rgba(${color}, 0.8)`,
    boxShadow: `inset 2px 2px 5px rgba(${color}, 1), inset -2px -2px 5px rgba(${color}, 0.6)`
  };

  return (
    <div className="aspect-square" style={style}></div>
  );
};

export const Block = React.memo(BlockComponent);
