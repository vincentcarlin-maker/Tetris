
import { useState, useCallback, useEffect } from 'react';

export interface HighScores {
  tetris: number;
  breaker: number;
  pacman: number;
  snake: number;
  invaders: number;
  sudoku: { [difficulty: string]: number }; // difficulty: minMistakes
  memory: number; // minMoves (Lower is better)
  rush?: { [level: string]: number };
  mastermind?: number; // minAttempts (Lower is better)
}

const initialHighScores: HighScores = {
  tetris: 0,
  breaker: 0,
  pacman: 0,
  snake: 0,
  invaders: 0,
  sudoku: {},
  memory: 0,
  rush: {},
  mastermind: 0
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
        if (!parsed.memory) parsed.memory = 0;
        if (!parsed.rush) parsed.rush = {};
        if (!parsed.mastermind) parsed.mastermind = 0;
        setHighScores(parsed);
      } else {
        const newScores = { ...initialHighScores };
        // Migration from old system
        const oldTetrisScore = localStorage.getItem('tetris-high-score');
        if (oldTetrisScore) {
          newScores.tetris = parseInt(oldTetrisScore, 10) || 0;
        }
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

      if (game === 'tetris' || game === 'breaker' || game === 'pacman' || game === 'snake' || game === 'invaders') {
        // Higher is better
        if (value > (prev[game] as number || 0)) {
          newScores[game] = value;
          shouldUpdate = true;
        }
      } else if (game === 'sudoku' && subkey !== undefined) {
        const key = String(subkey).toLowerCase();
        // Lower is better for sudoku
        if (value < (prev.sudoku?.[key] || Infinity)) {
           if (!newScores.sudoku) newScores.sudoku = {};
           newScores.sudoku[key] = value;
           shouldUpdate = true;
        }
      } else if (game === 'memory') {
        // Lower is better for memory. 0 means unset.
        const current = prev.memory || 0;
        if (current === 0 || value < current) {
            newScores.memory = value;
            shouldUpdate = true;
        }
      } else if (game === 'mastermind') {
        // Lower is better for mastermind. 0 means unset.
        const current = prev.mastermind || 0;
        if (current === 0 || value < current) {
            newScores.mastermind = value;
            shouldUpdate = true;
        }
      } else if (game === 'rush' && subkey !== undefined) {
          // Assuming rush stores moves per level, lower is better
          const key = String(subkey);
          if (value < (prev.rush?.[key] || Infinity)) {
              if (!newScores.rush) newScores.rush = {};
              newScores.rush[key] = value;
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

  // Sync from Cloud
  const importScores = useCallback((scores: HighScores) => {
      if (scores) {
          setHighScores(scores);
          localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(scores));
      }
  }, []);

  return { highScores, updateHighScore, importScores };
};
