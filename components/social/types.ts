
export interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
}

export interface Friend {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    gameActivity?: string; 
    lastMessage?: string;
    lastMessageTime?: number;
    stats?: any;
    inventory?: string[];
}

export interface PrivateMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    read: boolean;
    pending?: boolean;
}

export interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

export const GAME_NAMES: Record<string, string> = {
    'slither': 'Neon Slither', 'tetris': 'Tetris', 'connect4': 'Connect 4', 'sudoku': 'Sudoku', 'breaker': 'Breaker',
    'pacman': 'Pacman', 'memory': 'Memory', 'battleship': 'Bataille', 'snake': 'Snake',
    'invaders': 'Invaders', 'airhockey': 'Air Hockey', 'mastermind': 'Mastermind',
    'uno': 'Uno', 'watersort': 'Neon Mix', 'checkers': 'Dames', 'runner': 'Neon Run',
    'stack': 'Stack', 'arenaclash': 'Arena Clash', 'skyjo': 'Skyjo', 'lumen': 'Lumen', 'shop': 'Boutique', 'menu': 'Menu'
};

export const SUPPORT_ID = 'SYSTEM_SUPPORT';
