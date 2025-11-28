
import { CarData, Orientation } from './types';

interface Move {
  carId: number;
  steps: number; // positive = right/down, negative = left/up
}

interface State {
  cars: CarData[];
  moves: Move[];
}

const GRID_SIZE = 6;

// Convertit l'état du plateau en chaîne unique pour éviter les boucles infinies
const serializeState = (cars: CarData[]): string => {
  // On trie par ID pour garantir l'ordre, puis on crée une string "id:x,y|id:x,y..."
  return cars
    .map(c => `${c.id}:${c.x},${c.y}`)
    .join('|');
};

const isSolved = (cars: CarData[]): boolean => {
  const target = cars.find(c => c.isTarget);
  if (!target) return false;
  // Si la voiture cible touche le bord droit (index 5 + longueur 2 = 7, ou index 4 + 2 = 6)
  return target.x === GRID_SIZE - target.length;
};

// Vérifie si un mouvement est valide (pas de collision, pas hors limite)
const isValidMove = (cars: CarData[], carIndex: number, newX: number, newY: number): boolean => {
  const car = cars[carIndex];
  
  // 1. Limites de la grille
  if (newX < 0 || newY < 0) return false;
  if (car.orientation === 'h') {
    if (newX + car.length > GRID_SIZE) return false;
  } else {
    if (newY + car.length > GRID_SIZE) return false;
  }

  // 2. Collisions avec les autres voitures
  // On génère une "map" occupée par les autres voitures
  // Note: Pour la performance, on pourrait optimiser, mais pour 15 voitures ça passe.
  for (let i = 0; i < cars.length; i++) {
    if (i === carIndex) continue; // Ne pas vérifier collision avec soi-même (ancienne pos)
    const other = cars[i];
    
    // Test d'intersection simple AABB
    const c1Left = newX;
    const c1Right = car.orientation === 'h' ? newX + car.length : newX + 1;
    const c1Top = newY;
    const c1Bottom = car.orientation === 'v' ? newY + car.length : newY + 1;

    const c2Left = other.x;
    const c2Right = other.orientation === 'h' ? other.x + other.length : other.x + 1;
    const c2Top = other.y;
    const c2Bottom = other.orientation === 'v' ? other.y + other.length : other.y + 1;

    if (c1Left < c2Right && c1Right > c2Left && c1Top < c2Bottom && c1Bottom > c2Top) {
      return false;
    }
  }

  return true;
};

// Fonction principale du Solver
export const solveLevel = (initialCars: CarData[]): Move[] | null => {
  // File d'attente pour le BFS
  const queue: State[] = [{ cars: initialCars, moves: [] }];
  // Set pour mémoriser les états déjà visités
  const visited = new Set<string>();
  visited.add(serializeState(initialCars));

  let iterations = 0;
  const MAX_ITERATIONS = 50000; // Sécurité pour éviter le crash du navigateur

  while (queue.length > 0) {
    iterations++;
    if (iterations > MAX_ITERATIONS) return null; // Trop complexe ou impossible

    const current = queue.shift()!;
    
    // Victoire ?
    if (isSolved(current.cars)) {
      return current.moves;
    }

    // Générer les mouvements possibles pour chaque voiture
    for (let i = 0; i < current.cars.length; i++) {
      const car = current.cars[i];
      
      // Essayer de bouger dans les deux directions (-1 et +1)
      const directions = [-1, 1];

      for (const dir of directions) {
        let newX = car.x;
        let newY = car.y;

        if (car.orientation === 'h') newX += dir;
        else newY += dir;

        if (isValidMove(current.cars, i, newX, newY)) {
          // Créer le nouvel état
          const newCars = [...current.cars];
          newCars[i] = { ...car, x: newX, y: newY };
          
          const stateKey = serializeState(newCars);
          if (!visited.has(stateKey)) {
            visited.add(stateKey);
            
            // Ajouter à la queue
            // Optimisation : On fusionne les mouvements consécutifs de la même voiture
            const newMoves = [...current.moves];
            const lastMove = newMoves.length > 0 ? newMoves[newMoves.length - 1] : null;

            if (lastMove && lastMove.carId === car.id && Math.sign(lastMove.steps) === Math.sign(dir)) {
                // Si c'est la même voiture dans la même direction, on incrémente juste les steps
                // Note: Pour l'animation "étape par étape" fluide, il vaut mieux garder des steps de 1
                // Mais pour le solver, on stocke des steps unitaires.
                 newMoves.push({ carId: car.id, steps: dir });
            } else {
                 newMoves.push({ carId: car.id, steps: dir });
            }

            queue.push({
              cars: newCars,
              moves: newMoves
            });
          }
        }
      }
    }
  }

  return null; // Pas de solution trouvée
};
