
import { useState, useCallback, useEffect } from 'react';

export interface HighScores {
  tetris: number;
  breaker: number;
  pacman: number;
  snake: number;
  invaders: number;
  runner: number; 
  stack: number;
  arenaclash: number; 
  lumen: number; 
  slither: number;
  sudoku: { [difficulty: string]: number }; 
  memory: number; 
  mastermind?: number; 
  uno?: number; 
  game2048?: number; 
  watersort?: number; 
  skyjo?: number;
  rush?: number;
}

const initialHighScores: HighScores = {
  tetris: 0,
  breaker: 0,
  pacman: 0,
  snake: 0,
  invaders: 0,
  runner: 0,
  stack: 0,
  arenaclash: 0,
  lumen: 0,
  slither: 0,
  sudoku: {},
  memory: 0,
  mastermind: 0,
  uno: 0,
  game2048: 0,
  watersort: 1,
  skyjo: 0,
  rush: 1
};

const HIGHSCORES_KEY = 'neon-highscores';

export const useHighScores = () => {
  const [highScores, setHighScores] = useState<HighScores>(initialHighScores);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIGHSCORES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.sudoku) parsed.sudoku = {};
        if (!parsed.slither) parsed.slither = 0;
        setHighScores(parsed);
      } else {
        const newScores = { ...initialHighScores };
        setHighScores(newScores);
        localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(newScores));
      }
    } catch (e) {
      console.error("Failed to parse high scores from localStorage", e);
    }
  }, []);

  const updateHighScore = useCallback((game: keyof HighScores, value: number, subkey?: string | number) => {
    setHighScores(prev => {
      const newScores = JSON.parse(JSON.stringify(prev)); 
      let shouldUpdate = false;
      if (['tetris', 'breaker', 'pacman', 'snake', 'invaders', 'game2048', 'watersort', 'runner', 'stack', 'arenaclash', 'lumen', 'rush', 'slither'].includes(game)) {
         const current = prev[game] || 0;
         if (value > (current as number)) {
             // @ts-ignore
             newScores[game] = value;
             shouldUpdate = true;
         }
      } 
      else if (game === 'uno') {
          newScores.uno = (prev.uno || 0) + value;
          shouldUpdate = true;
      }
      else if (game === 'sudoku' && subkey !== undefined) {
        const key = String(subkey).toLowerCase();
        const current = prev.sudoku?.[key] || 0;
        if (current === 0 || value < current) {
           if (!newScores.sudoku) newScores.sudoku = {};
           newScores.sudoku[key] = value;
           shouldUpdate = true;
        }
      } else if (game === 'memory' || game === 'mastermind' || game === 'skyjo') {
        const current = prev[game] || 0;
        if ((current as number) === 0 || value < (current as number)) {
            // @ts-ignore
            newScores[game] = value;
            shouldUpdate = true;
        }
      }
      if (shouldUpdate) {
        localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(newScores));
        return newScores;
      }
      return prev;
    });
  }, []);

  const importScores = useCallback((cloudScores: HighScores) => {
      if (!cloudScores) return;
      setHighScores(prev => {
          const merged = JSON.parse(JSON.stringify(prev));
          let changed = false;
          const keys = Object.keys(initialHighScores) as Array<keyof HighScores>;
          keys.forEach(key => {
              const localVal = prev[key];
              const cloudVal = cloudScores[key];
              if (key === 'sudoku') {
                  const cloudSudoku = cloudScores.sudoku || {};
                  if (!merged.sudoku) merged.sudoku = {};
                  Object.keys(cloudSudoku).forEach(diff => {
                      const l = merged.sudoku[diff] || 0;
                      const c = cloudSudoku[diff];
                      if (l === 0 || (c !== 0 && c < l)) { merged.sudoku[diff] = c; changed = true; }
                  });
              } else if (['memory', 'mastermind', 'skyjo'].includes(key)) {
                  if (((localVal as number) === 0 && (cloudVal as number) !== 0) || ((cloudVal as number) !== 0 && (cloudVal as number) < (localVal as number))) {
                      // @ts-ignore
                      merged[key] = cloudVal; changed = true;
                  }
              } else {
                  if ((cloudVal as number) > ((localVal as number) || 0)) {
                      // @ts-ignore
                      merged[key] = cloudVal; changed = true;
                  }
              }
          });
          if (changed) {
              localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(merged));
              return merged;
          }
          return prev;
      });
  }, []);
  return { highScores, updateHighScore, importScores };
};
