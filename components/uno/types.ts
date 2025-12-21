export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
    id: string;
    color: Color;
    value: Value;
    score: number;
}

export interface FlyingCardData {
    card: Card;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    rotation: number;
}

export interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

export type Turn = 'PLAYER' | 'CPU'; // CPU = Opponent in Online
export type GameState = 'playing' | 'gameover' | 'color_select';
export type GamePhase = 'MENU' | 'GAME';
