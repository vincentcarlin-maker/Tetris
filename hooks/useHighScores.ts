
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
        // Ensure defaults structure exists if loading old data
        if (!parsed.sudoku) parsed.sudoku = {};
        if (!parsed.breaker) parsed.breaker = 0;
        if (!parsed.pacman) parsed.pacman = 0;
        if (!parsed.snake) parsed.snake = 0;
        if (!parsed.invaders) parsed.invaders = 0;
        if (!parsed.runner) parsed.runner = 0;
        if (!parsed.stack) parsed.stack = 0;
        if (!parsed.arenaclash) parsed.arenaclash = 0;
        if (!parsed.lumen) parsed.lumen = 0;
        if (!parsed.memory) parsed.memory = 0;
        if (!parsed.mastermind) parsed.mastermind = 0;
        if (!parsed.uno) parsed.uno = 0;
        if (!parsed.game2048) parsed.game2048 = 0;
        if (!parsed.watersort) parsed.watersort = 1;
        if (!parsed.skyjo) parsed.skyjo = 0;
        if (!parsed.rush) parsed.rush = 1;
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
      const newScores = JSON.parse(JSON.stringify(prev)); // Deep copy
      let shouldUpdate = false;

      // Logic for Higher is Better
      if (['tetris', 'breaker', 'pacman', 'snake', 'invaders', 'game2048', 'watersort', 'runner', 'stack', 'arenaclash', 'lumen', 'rush'].includes(game)) {
         // @ts-ignore
         const current = prev[game] || 0;
         if (value > current) {
             // @ts-ignore
             newScores[game] = value;
             shouldUpdate = true;
         }
      } 
      // Logic for Uno (Accumulative)
      else if (game === 'uno') {
          newScores.uno = (prev.uno || 0) + value;
          shouldUpdate = true;
      }
      // Logic for Lower is Better (Time/Moves/Mistakes)
      else if (game === 'sudoku' && subkey !== undefined) {
        const key = String(subkey).toLowerCase();
        const current = prev.sudoku?.[key] || 0;
        // For Sudoku mistakes/difficulty, we assume we track best performance (lowest mistakes or completion)
        // If current is 0 (unset), allow update. Else if lower, update.
        if (current === 0 || value < current) {
           if (!newScores.sudoku) newScores.sudoku = {};
           newScores.sudoku[key] = value;
           shouldUpdate = true;
        }
      } else if (game === 'memory' || game === 'mastermind' || game === 'skyjo') {
        // @ts-ignore
        const current = prev[game] || 0;
        // 0 implies no score yet
        if (current === 0 || value < current) {
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

  // Sync from Cloud - SMART MERGE
  const importScores = useCallback((cloudScores: HighScores) => {
      if (!cloudScores) return;

      setHighScores(prev => {
          const merged = JSON.parse(JSON.stringify(prev));
          let changed = false;

          const keys = Object.keys(initialHighScores) as Array<keyof HighScores>;
          
          keys.forEach(key => {
              // @ts-ignore
              const localVal = prev[key];
              // @ts-ignore
              const cloudVal = cloudScores[key];

              if (key === 'sudoku') {
                  const cloudSudoku = cloudScores.sudoku || {};
                  if (!merged.sudoku) merged.sudoku = {};
                  
                  Object.keys(cloudSudoku).forEach(diff => {
                      const l = merged.sudoku[diff] || 0;
                      const c = cloudSudoku[diff];
                      // Lower is better, 0 is unset
                      if (l === 0 || (c !== 0 && c < l)) {
                          merged.sudoku[diff] = c;
                          changed = true;
                      }
                  });
              } 
              // Lower is better games
              else if (['memory', 'mastermind', 'skyjo'].includes(key)) {
                  // 0 is unset
                  if ((localVal === 0 && cloudVal !== 0) || (cloudVal !== 0 && cloudVal < localVal)) {
                      // @ts-ignore
                      merged[key] = cloudVal;
                      changed = true;
                  }
              }
              // Higher is better games (default)
              else {
                  if (cloudVal > (localVal || 0)) {
                      // @ts-ignore
                      merged[key] = cloudVal;
                      changed = true;
                  }
              }
          });

          if (changed) {
              console.log("☁️ Merged High Scores from Cloud (kept best)");
              localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(merged));
              return merged;
          }
          return prev;
      });
  }, []);

  return { highScores, updateHighScore, importScores };
};
