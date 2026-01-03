export interface HiddenObject {
    id: string;
    name: string;
    x: number; // Pourcentage
    y: number; // Pourcentage
    radius: number; // Pourcentage de tolérance
    found: boolean;
}

export interface SeekLevel {
    id: string;
    title: string;
    description: string;
    difficulty: 'FACILE' | 'MOYEN' | 'EXPERT';
    image: string;
    objects: HiddenObject[];
    reward: number;
}

export interface GameState {
    status: 'playing' | 'gameOver';
    objects: HiddenObject[];
    startTime: number;
    foundCount: number;
}