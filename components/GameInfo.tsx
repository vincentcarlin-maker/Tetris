import React from 'react';

interface GameInfoProps {
  text: string;
  value: number;
}

export const GameInfo: React.FC<GameInfoProps> = ({ text, value }) => (
  <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 px-2 py-1 rounded backdrop-blur-md min-w-[60px] h-14">
    <span className="text-[9px] text-neon-blue font-bold tracking-widest uppercase mb-0.5">{text}</span>
    <p className="text-lg font-mono text-white font-bold leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
      {value}
    </p>
  </div>
);