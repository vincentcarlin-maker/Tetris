
export type Orientation = 'h' | 'v';

export interface CarData {
  id: number;
  x: number;
  y: number;
  length: number; // 2 ou 3
  orientation: Orientation;
  isTarget: boolean; // La voiture rouge
  color: string;
}

export interface LevelData {
  id: number;
  difficulty: string;
  cars: CarData[];
}
