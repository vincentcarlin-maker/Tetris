
import { LevelData, CarData } from './types';

// Palette de couleurs néon
const COLORS = [
  'from-blue-600 to-blue-400',
  'from-green-600 to-green-400',
  'from-purple-600 to-purple-400',
  'from-yellow-500 to-yellow-300',
  'from-pink-600 to-pink-400',
  'from-cyan-600 to-cyan-400',
  'from-orange-600 to-orange-400',
];

const TARGET_COLOR = 'from-red-600 to-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)]';

// Helper pour créer les voitures rapidement
// id, x, y, len, ori, isTarget
const c = (id: number, x: number, y: number, len: number, ori: 'h' | 'v', isTarget = false): CarData => ({
  id, x, y, length: len, orientation: ori, isTarget,
  color: isTarget ? TARGET_COLOR : COLORS[id % COLORS.length]
});

// Une sélection de niveaux vérifiés et de difficulté progressive
const RAW_LEVELS = [
  // --- NIVEAU 1 (Intro - Facile) ---
  [
    c(0, 1, 2, 2, 'h', true), // Target
    c(1, 0, 0, 2, 'v'), 
    c(2, 4, 0, 3, 'v'), 
    c(3, 0, 4, 2, 'v'), 
    c(4, 2, 5, 2, 'h')
  ],
  // --- NIVEAU 2 (Facile) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 3, 1, 3, 'v'),
    c(2, 0, 0, 2, 'h'),
    c(3, 0, 1, 3, 'v'),
    c(4, 2, 5, 3, 'h')
  ],
  // --- NIVEAU 3 (Facile) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 2, 0, 2, 'v'),
    c(2, 4, 1, 2, 'v'),
    c(3, 0, 3, 3, 'h'),
    c(4, 3, 3, 3, 'v'),
    c(5, 0, 5, 2, 'h')
  ],
  // --- NIVEAU 4 (Facile) ---
  [
    c(0, 0, 2, 2, 'h', true),
    c(1, 2, 0, 3, 'v'),
    c(2, 3, 1, 2, 'v'),
    c(3, 0, 4, 2, 'v'),
    c(4, 2, 3, 2, 'h'),
    c(5, 5, 0, 3, 'v')
  ],
  // --- NIVEAU 5 (Moyen - Début des blocages) ---
  [
    c(0, 3, 2, 2, 'h', true),
    c(1, 2, 0, 2, 'v'),
    c(2, 5, 1, 3, 'v'),
    c(3, 0, 3, 2, 'h'),
    c(4, 0, 4, 2, 'v'),
    c(5, 2, 5, 3, 'h'),
    c(6, 3, 0, 2, 'h')
  ],
  // --- NIVEAU 6 (Moyen) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 3, 0, 2, 'h'),
    c(4, 5, 0, 3, 'v'),
    c(5, 3, 1, 2, 'v'),
    c(6, 0, 3, 2, 'h'),
    c(7, 4, 4, 2, 'h')
  ],
  // --- NIVEAU 7 (Moyen - Simplifié) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 3, 0, 3, 'v'),
    c(4, 4, 0, 2, 'h'),
    c(5, 4, 1, 2, 'v'),
    c(6, 0, 3, 3, 'h'),
    c(7, 1, 4, 2, 'v'),
    c(8, 2, 5, 2, 'h')
    // Suppression de c9 pour faciliter le mouvement de c8
  ],
  // --- NIVEAU 8 (Moyen + - Simplifié) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 3, 0, 3, 'v'),
    c(2, 0, 1, 2, 'h'),
    c(3, 0, 2, 2, 'v'), // Bloque gauche
    c(4, 1, 4, 2, 'h'),
    c(5, 4, 0, 2, 'v'), // CORRECTION: y=0 (was 1) pour libérer (4,2)
    c(6, 3, 3, 2, 'h'),
    c(7, 5, 4, 2, 'v')
  ],
  // --- NIVEAU 9 (Difficile) ---
  [
    c(0, 0, 2, 2, 'h', true),
    c(1, 2, 0, 2, 'v'),
    c(2, 3, 0, 2, 'h'),
    c(3, 5, 0, 3, 'v'),
    c(4, 2, 2, 2, 'v'),
    c(5, 3, 3, 2, 'h'),
    c(6, 2, 4, 2, 'h'),
    c(7, 0, 5, 3, 'h'),
    c(8, 4, 4, 2, 'v')
  ],
  // --- NIVEAU 10 (Difficile - Certifié Soluble) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 2, 0, 2, 'v'),
    c(2, 3, 0, 2, 'h'),
    c(3, 5, 0, 3, 'v'),
    c(4, 3, 1, 2, 'v'),
    c(5, 0, 3, 3, 'h'),
    c(6, 4, 3, 2, 'v'),
    c(7, 0, 4, 2, 'v'),
    c(8, 1, 5, 2, 'h'),
    c(9, 3, 5, 2, 'h')
  ],
  // --- NIVEAU 11 (Expert - Certifié Soluble) ---
  [
    c(0, 2, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 3, 0, 2, 'v'),
    c(4, 4, 0, 2, 'h'),
    c(5, 5, 1, 3, 'v'),
    c(6, 1, 1, 2, 'v'),
    c(7, 2, 3, 2, 'h'),
    c(8, 2, 4, 2, 'v'),
    c(9, 0, 3, 2, 'h'),
    c(10, 0, 5, 2, 'h'),
    c(11, 3, 5, 3, 'h')
  ],
  // --- NIVEAU 12 (Expert - Corrigé) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 0, 0, 2, 'h'),
    c(2, 2, 0, 2, 'h'),
    c(3, 4, 0, 3, 'v'),
    c(4, 0, 1, 2, 'v'),
    c(5, 3, 1, 2, 'v'),
    c(6, 5, 1, 2, 'v'),
    c(7, 0, 3, 2, 'h'),
    c(8, 2, 3, 2, 'h'), // CORRECTION: Longueur 2 (was 3) pour éviter deadlock
    c(9, 0, 4, 2, 'v'),
    c(10, 1, 5, 2, 'h'),
    c(11, 4, 4, 2, 'h')
  ],
  // --- NIVEAU 13 (Grand Maître - Corrigé) ---
  [
    c(0, 2, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'h'),
    c(2, 3, 0, 2, 'h'),
    c(3, 5, 0, 2, 'v'),
    c(4, 1, 1, 2, 'v'),
    c(5, 4, 2, 2, 'v'),
    c(6, 0, 1, 3, 'v'),
    c(7, 1, 3, 2, 'h'),
    c(8, 0, 4, 2, 'h'),
    c(9, 2, 4, 2, 'v'),
    c(10, 3, 5, 3, 'h')
  ],
  // --- NIVEAU 14 (Grand Maître 2 - Corrigé) ---
  [
    c(0, 0, 2, 2, 'h', true),
    c(1, 0, 0, 2, 'v'),
    c(2, 1, 0, 2, 'v'), // CORRECTION: Orientation 'h' -> 'v' pour débloquer la colonne 2
    c(3, 3, 0, 3, 'v'),
    c(4, 4, 0, 2, 'h'),
    c(5, 5, 1, 2, 'v'),
    c(6, 0, 3, 2, 'h'), // CORRECTION: Longueur 3 -> 2 pour éviter collision avec C8
    c(7, 2, 1, 2, 'v'),
    c(8, 2, 3, 2, 'v'),
    c(9, 3, 4, 2, 'h'),
    c(10, 5, 4, 2, 'v'),
    c(11, 0, 5, 2, 'h')
  ],
  // --- NIVEAU 15 (Légende - Corrigé) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 0, 0, 2, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 3, 0, 2, 'h'),
    c(4, 5, 0, 3, 'v'),
    c(5, 3, 1, 2, 'v'),
    c(6, 4, 1, 2, 'v'),
    c(7, 0, 3, 2, 'v'),
    c(8, 1, 4, 2, 'v'),
    c(9, 2, 4, 2, 'h'),
    c(10, 2, 5, 2, 'h'),
    c(11, 4, 4, 2, 'h') // CORRECTION: v -> h pour résoudre le blocage de la colonne 4
  ],
  // --- NIVEAU 16 (Légende 2) ---
  [
    c(0, 2, 2, 2, 'h', true), // Target mid
    c(1, 2, 0, 2, 'v'),
    c(2, 3, 0, 2, 'h'),
    c(3, 5, 0, 3, 'v'),
    c(4, 0, 1, 2, 'h'),
    c(5, 0, 3, 2, 'v'),
    c(6, 1, 3, 2, 'h'),
    c(7, 3, 3, 2, 'v'),
    c(8, 2, 5, 2, 'h'),
    c(9, 4, 4, 2, 'h'),
    c(10, 4, 1, 2, 'v')
  ],
  // --- NIVEAU 17 (CORRIGÉ - Expert) ---
  [
    c(0, 0, 2, 2, 'h', true),
    c(1, 2, 0, 3, 'v'),
    c(2, 3, 0, 3, 'v'),
    c(3, 0, 0, 2, 'h'),
    c(4, 4, 0, 2, 'h'),
    c(5, 0, 3, 2, 'v'),
    c(6, 1, 4, 2, 'h'),
    c(7, 2, 3, 2, 'h'),
    c(8, 4, 2, 2, 'v'),
    c(9, 5, 1, 3, 'v'),
    c(10, 4, 5, 2, 'h')
  ],
  // --- NIVEAU 18 (CORRIGÉ - Expert+) ---
  [
    c(0, 2, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 4, 0, 2, 'v'),
    c(4, 1, 1, 2, 'v'),
    c(5, 2, 1, 2, 'h'),
    c(6, 0, 3, 2, 'h'),
    c(7, 2, 3, 2, 'v'),
    c(8, 3, 3, 2, 'h'),
    c(9, 0, 4, 2, 'h'),
    c(10, 3, 4, 2, 'v'),
    c(11, 0, 5, 3, 'h'),
    c(12, 4, 5, 2, 'h')
  ],
  // --- NIVEAU 19 (CORRIGÉ - Grand Maître) ---
  [
    c(0, 0, 2, 2, 'h', true),
    c(1, 0, 0, 3, 'h'),
    c(2, 2, 1, 2, 'v'),
    c(3, 3, 1, 2, 'v'),
    c(4, 4, 0, 3, 'v'),
    c(5, 5, 0, 3, 'v'),
    c(6, 0, 3, 2, 'h'),
    c(7, 2, 3, 2, 'h'),
    c(8, 0, 4, 2, 'v'),
    c(9, 1, 4, 2, 'v'),
    c(10, 2, 4, 2, 'h'),
    c(11, 4, 4, 2, 'v'),
    c(12, 0, 5, 2, 'h'),
    c(13, 2, 5, 2, 'h')
  ],
  // --- NIVEAU 20 (NOUVEAU - Le Mur) ---
  [
    c(0, 1, 2, 2, 'h', true),
    c(1, 0, 0, 2, 'v'),
    c(2, 1, 0, 2, 'h'),
    c(3, 3, 0, 2, 'h'),
    c(4, 5, 0, 3, 'v'),
    c(5, 1, 1, 2, 'v'),
    c(6, 2, 1, 2, 'v'),
    c(7, 3, 1, 2, 'v'),
    c(8, 4, 2, 2, 'v'), // Le gardien
    c(9, 0, 3, 2, 'h'),
    c(10, 2, 3, 2, 'h'),
    c(11, 0, 4, 2, 'v'),
    c(12, 1, 4, 2, 'v'),
    c(13, 3, 4, 2, 'h'),
    c(14, 2, 5, 2, 'h'),
    c(15, 4, 5, 2, 'h')
  ]
];

export const TOTAL_LEVELS = RAW_LEVELS.length;

export const getLevel = (levelIndex: number): LevelData => {
  // On boucle sur les niveaux si on dépasse le nombre de niveaux définis
  const loopIndex = (levelIndex - 1) % TOTAL_LEVELS;
  const rawData = RAW_LEVELS[loopIndex];
  
  // Clonage profond pour éviter les références
  const cars = rawData.map(c => ({...c}));
  
  // Détermination de la difficulté basée sur l'index
  let difficulty = 'FACILE';
  if (loopIndex >= 4 && loopIndex < 9) {
    difficulty = 'MOYEN';
  } else if (loopIndex >= 9 && loopIndex < 14) {
    difficulty = 'DIFFICILE';
  } else if (loopIndex >= 14) {
    difficulty = 'EXPERT';
  }

  return {
    id: levelIndex,
    difficulty,
    cars
  };
};
