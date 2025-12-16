
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
  lumen: number; // Added Lumen Order
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

      if (game === 'tetris' || game === 'breaker' || game === 'pacman' || game === 'snake' || game === 'invaders' || game === 'game2048' || game === 'watersort' || game === 'runner' || game === 'stack' || game === 'arenaclash' || game === 'lumen' || game === 'rush') {
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
      } else if (game === 'skyjo') {
          // Lower is better. 0 is valid score? No, usually positive.
          // Skyjo logic: Try to get lowest score. 
          // Let's assume we store the "Best Low Score".
          // If current is 0 (unplayed), update.
          // Careful: Skyjo scores can be negative. 
          // For simplicity in this arcade version, we track WINS or lowest positive score?
          // Let's track lowest score achieved.
          // Initialize with a high number if 0
          const current = prev.skyjo === 0 && value !== 0 ? 999 : prev.skyjo;
          if (value < (current || 999)) {
              newScores.skyjo = value;
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
