
export type GameMode = 'SOLO' | 'ONLINE';
export type GamePhase = 'MENU' | 'LOBBY' | 'CREATION' | 'PLAYING' | 'WAITING' | 'GAMEOVER';

export interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

export interface Feedback {
    exact: number;
    partial: number;
}
