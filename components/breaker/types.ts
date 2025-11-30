
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
  hasLasers?: boolean;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  status: 'normal' | 'fast' | 'slow';
}

export interface Laser {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
    active: boolean;
}

export type PowerUpType = 'PADDLE_GROW' | 'PADDLE_SHRINK' | 'MULTI_BALL' | 'BALL_FAST' | 'BALL_SLOW' | 'EXTRA_LIFE' | 'LASER_PADDLE';

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  dy: number;
}


export type GameState = 'start' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'waitingToServe';
