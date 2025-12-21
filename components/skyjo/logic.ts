
import { SkyjoCard } from './types';
import { CARD_DISTRIBUTION, GRID_COLS } from './constants';

export const generateDeck = (): SkyjoCard[] => {
    let deck: SkyjoCard[] = [];
    let idCounter = 0;
    CARD_DISTRIBUTION.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            deck.push({
                id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`,
                value: item.val,
                isRevealed: false,
                isCleared: false
            });
        }
    });
    return deck.sort(() => Math.random() - 0.5);
};

export const calculateScore = (grid: SkyjoCard[]) => {
    return grid.reduce((acc, card) => card.isCleared ? acc : acc + (card.isRevealed ? card.value : 0), 0);
};

export const checkColumns = (grid: SkyjoCard[]): SkyjoCard[] => {
    const newGrid = [...grid];
    let changed = false;

    for (let col = 0; col < GRID_COLS; col++) {
        const idx1 = col;
        const idx2 = col + GRID_COLS;
        const idx3 = col + 2 * GRID_COLS;

        const c1 = newGrid[idx1];
        const c2 = newGrid[idx2];
        const c3 = newGrid[idx3];

        // Ensure all are revealed, not already cleared, and values match
        if (c1 && c2 && c3 && c1.isRevealed && c2.isRevealed && c3.isRevealed && 
            !c1.isCleared && !c2.isCleared && !c3.isCleared) {
            
            if (c1.value === c2.value && c2.value === c3.value) {
                // Column Match! Mark as cleared.
                newGrid[idx1] = { ...c1, isCleared: true };
                newGrid[idx2] = { ...c2, isCleared: true };
                newGrid[idx3] = { ...c3, isCleared: true };
                changed = true;
            }
        }
    }
    return changed ? newGrid : grid;
};
