
import React from 'react';

interface GameInfoProps {
  text: string;
  value: number;
}

export const GameInfo: React.FC<GameInfoProps> = ({ text, value }) => (
  <div className="text-center md:text-left">
    <span className="text-gray-400 text-sm">{text}</span>
    <p className="text-2xl font-bold text-cyan-400">{value}</p>
  </div>
);
