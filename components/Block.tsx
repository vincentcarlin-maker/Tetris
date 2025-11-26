
import React, { useEffect, useState, useRef } from 'react';
import { TetrominoKey } from '../types';
import type { Cell } from '../types';

interface BlockProps {
  type: TetrominoKey | string | number;
  status?: Cell[1];
}

// Palette néon vibrante et solide
const getBlockStyle = (type: TetrominoKey | string | number) => {
  switch (type) {
    case 'I': return 'bg-cyan-500 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]';
    case 'J': return 'bg-blue-600 border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]';
    case 'L': return 'bg-orange-500 border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    case 'O': return 'bg-yellow-400 border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
    case 'S': return 'bg-green-500 border-green-300 shadow-[0_0_10px_rgba(34,197,94,0.8)]';
    case 'T': return 'bg-purple-600 border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.8)]';
    case 'Z': return 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.8)]';
    default: return 'bg-transparent border-transparent';
  }
};

// Style spécifique pour le fantôme (Ghost) : Transparent mais coloré
const getGhostStyle = (type: TetrominoKey | string | number) => {
  switch (type) {
    case 'I': return 'border-cyan-400/60 bg-cyan-400/10 shadow-[inset_0_0_8px_rgba(6,182,212,0.2)]';
    case 'J': return 'border-blue-500/60 bg-blue-500/10 shadow-[inset_0_0_8px_rgba(37,99,235,0.2)]';
    case 'L': return 'border-orange-500/60 bg-orange-500/10 shadow-[inset_0_0_8px_rgba(249,115,22,0.2)]';
    case 'O': return 'border-yellow-400/60 bg-yellow-400/10 shadow-[inset_0_0_8px_rgba(250,204,21,0.2)]';
    case 'S': return 'border-green-500/60 bg-green-500/10 shadow-[inset_0_0_8px_rgba(34,197,94,0.2)]';
    case 'T': return 'border-purple-500/60 bg-purple-500/10 shadow-[inset_0_0_8px_rgba(147,51,234,0.2)]';
    case 'Z': return 'border-red-500/60 bg-red-500/10 shadow-[inset_0_0_8px_rgba(220,38,38,0.2)]';
    default: return 'border-white/30 bg-white/5';
  }
};

const BlockComponent: React.FC<BlockProps> = ({ type, status }) => {
  const isGhost = status === 'ghost';
  const isClearing = status === 'clearing';
  
  // State to trigger the one-shot pop animation
  const [playPop, setPlayPop] = useState(false);
  
  // Track previous props to detect specific state transitions
  const prev = useRef({ type, status });

  useEffect(() => {
    const p = prev.current;
    
    // Trigger pop ONLY if:
    // 1. The block is now 'merged' (locked)
    // 2. It wasn't empty (type !== 0)
    // 3. The type hasn't changed (prevents popping when blocks fall into this cell)
    // 4. The previous status was 'clear' (active piece) or 'ghost' (hard drop landing)
    const isJustPlaced = 
        status === 'merged' && 
        type !== 0 && 
        type === p.type && 
        (p.status === 'clear' || p.status === 'ghost');

    if (isJustPlaced) {
        setPlayPop(true);
        const timer = setTimeout(() => setPlayPop(false), 300); // Duration matches CSS
        return () => clearTimeout(timer);
    }
    
    prev.current = { type, status };
  }, [type, status]);

  // Ensure we handle both string '0' and number 0 as empty
  if (type === '0' || type === 0) {
    return <div className="w-full h-full" />;
  }

  if (isGhost) {
    const ghostColors = getGhostStyle(type);
    return (
      <div className={`w-full h-full border-2 border-dashed rounded-[2px] animate-ghost-pulse ${ghostColors}`}></div>
    );
  }

  const colorClasses = getBlockStyle(type);

  // Determine which animation to play
  const animationClass = isClearing 
    ? 'animate-flash z-20' 
    : (playPop ? 'animate-pop' : '');

  return (
    <div className={`w-full h-full relative rounded-[2px] border ${colorClasses} ${animationClass} transition-colors duration-100`}>
        {/* Reflet simple pour effet vitré */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
    </div>
  );
};

export const Block = React.memo(BlockComponent);
