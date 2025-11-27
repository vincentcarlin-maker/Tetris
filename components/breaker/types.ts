
export interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  color: string;
  points: number;
  isIndestructible?: boolean;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

export type GameState = 'start' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'waitingToServe';