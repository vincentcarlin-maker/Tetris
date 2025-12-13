
export type CardValue = number; // -2 to 12

export interface SkyjoCard {
    id: string;
    value: CardValue;
    isRevealed: boolean;
    isCleared: boolean; // If column is cleared, card is removed/invisible but slot remains
}

export type PlayerGrid = SkyjoCard[]; // 12 cards

export type GamePhase = 'MENU' | 'SETUP' | 'PLAYING' | 'LAST_TURN' | 'ENDED';
export type Turn = 'PLAYER' | 'CPU';
export type SubTurnState = 'IDLE' | 'HOLDING_DECK' | 'MUST_REVEAL';

export interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}
