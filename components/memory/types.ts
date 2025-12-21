
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'SOLO' | 'ONLINE';
export type GamePhase = 'MENU' | 'DIFFICULTY' | 'GAME';

export interface MemoryCard {
    id: number;
    iconId: string; // Identifier for ICONS array
    isFlipped: boolean;
    isMatched: boolean;
}

export interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}
