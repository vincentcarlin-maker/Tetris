
import { useState, useCallback, useEffect } from 'react';

export interface HighScores {
  tetris: number;
  breaker: number;
  pacman: number;
  snake: number;
  invaders: number;
  runner: number; // Added runner
  sudoku: { [difficulty: string]: number }; // difficulty: minMistakes
  memory: number; // minMoves (Lower is better)
  mastermind?: number; // minAttempts (Lower is better)
  uno?: number; // Total Score (Accumulated)
  game2048?: number; // Highest Score
  watersort?: number; // Max Level Reached
}

const initialHighScores: HighScores = {
  tetris: 0,
  breaker: 0,
  pacman: 0,
  snake: 0,
  invaders: 0,
  runner: 0,
  sudoku: {},
  memory: 0,
  mastermind: 0,
  uno: 0,
  game2048: 0,
  watersort: 1
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
        if (!parsed.memory) parsed.memory = 0;
        if (!parsed.mastermind) parsed.mastermind = 0;
        if (!parsed.uno) parsed.uno = 0;
        if (!parsed.game2048) parsed.game2048 = 0;
        if (!parsed.watersort) parsed.watersort = 1;
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

      if (game === 'tetris' || game === 'breaker' || game === 'pacman' || game === 'snake' || game === 'invaders' || game === 'game2048' || game === 'watersort' || game === 'runner') {
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
      } else if (game === 'uno') {
          // Accumulate Score
          newScores.uno = (prev.uno || 0) + value;
          shouldUpdate = true;
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
