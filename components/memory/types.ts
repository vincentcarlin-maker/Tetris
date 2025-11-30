
import { LucideIcon } from 'lucide-react';

export interface MemoryCard {
    id: number;
    iconId: string; // To match pairs
    isFlipped: boolean;
    isMatched: boolean;
}

export interface MemoryGameState {
    cards: MemoryCard[];
    flippedIndices: number[];
    moves: number; // Solo: Total moves, Online: Not strictly used for score but stats
    scores: { p1: number, p2: number }; // For online
    currentPlayer: 1 | 2; // For online
    isGameOver: boolean;
}
