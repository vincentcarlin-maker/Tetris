
import { Difficulty, MemoryCard } from './types';
import { ICONS, DIFFICULTY_CONFIG } from './constants';

export const generateDeck = (diff: Difficulty): MemoryCard[] => {
    const config = DIFFICULTY_CONFIG[diff];
    const selectedIcons = ICONS.slice(0, config.pairs);
    
    let deck: MemoryCard[] = [];
    selectedIcons.forEach((item, index) => {
        deck.push({ id: index * 2, iconId: item.id, isFlipped: false, isMatched: false });
        deck.push({ id: index * 2 + 1, iconId: item.id, isFlipped: false, isMatched: false });
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Re-assign IDs based on position for simpler rendering keys
    return deck.map((c, i) => ({ ...c, id: i }));
};
