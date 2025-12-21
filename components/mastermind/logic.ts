
import { CODE_LENGTH, COLORS } from './constants';
import { Feedback } from './types';

export const calculateFeedback = (guess: number[], secret: number[]): Feedback => {
    let exact = 0;
    let partial = 0;
    const secretCopy = [...secret];
    const guessCopy = [...guess];

    // 1. Calculate Exact Matches (Black Pegs)
    for (let i = 0; i < CODE_LENGTH; i++) {
        if (guess[i] === secret[i]) {
            exact++;
            secretCopy[i] = -1; // Mark as used
            guessCopy[i] = -2;  // Mark as processed
        }
    }

    // 2. Calculate Partial Matches (White Pegs)
    for (let i = 0; i < CODE_LENGTH; i++) {
        if (guessCopy[i] !== -2) {
            const foundIndex = secretCopy.indexOf(guessCopy[i]);
            if (foundIndex !== -1) {
                partial++;
                secretCopy[foundIndex] = -1; // Mark as used
            }
        }
    }
    return { exact, partial };
};

export const generateSecretCode = (): number[] => {
    return Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
};
