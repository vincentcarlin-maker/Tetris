
import React from 'react';

// 0: Empty, 1-12: Colors
export type LiquidColor = number;
export type Tube = LiquidColor[];

export interface PourData {
    src: number;
    dst: number;
    color: number;
    streamStart: { x: number; y: number };
    streamEnd: { x: number; y: number };
    isPouring: boolean;
    tiltDirection: 'left' | 'right';
    transformStyle: React.CSSProperties;
}

export type GamePhase = 'LEVEL_SELECT' | 'GAME';
