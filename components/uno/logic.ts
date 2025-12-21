import { Card, Color, Value } from './types';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const SPECIAL_VALUES: Value[] = ['skip', 'reverse', 'draw2'];

/**
 * Crée et mélange un paquet de cartes Uno standard.
 */
export const generateDeck = (): Card[] => {
    let deck: Card[] = [];
    let idCounter = 0;

    const addCard = (color: Color, value: Value, score: number) => {
        deck.push({ id: `card_${idCounter++}_${Math.random().toString(36).substr(2, 5)}`, color, value, score });
    };

    COLORS.forEach(color => {
        addCard(color, '0', 0); // 1 zero
        for (let i = 1; i <= 9; i++) {
            addCard(color, i.toString() as Value, i);
            addCard(color, i.toString() as Value, i);
        }
        SPECIAL_VALUES.forEach(val => {
            addCard(color, val, 20);
            addCard(color, val, 20);
        });
    });

    // Wilds
    for (let i = 0; i < 4; i++) {
        addCard('black', 'wild', 50);
        addCard('black', 'wild4', 50);
    }

    return deck.sort(() => Math.random() - 0.5);
};


/**
 * Vérifie si une carte peut être jouée sur la carte actuelle de la défausse.
 */
export const isCardPlayable = (card: Card, topCard: Card, activeColor: Color): boolean => {
    if (!topCard) return false;
    return card.color === activeColor || card.value === topCard.value || card.color === 'black';
};


/**
 * Détermine le meilleur coup pour l'IA en fonction de sa main et de l'état du jeu.
 * @returns Le coup à jouer (carte et son index) ou null si aucune carte n'est jouable.
 */
export const getCpuMove = (cpuHand: Card[], topCard: Card, activeColor: Color): { card: Card, index: number } | null => {
    const validMoves = cpuHand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => isCardPlayable(card, topCard, activeColor));

    if (validMoves.length === 0) {
        return null;
    }

    // Stratégie simple de l'IA :
    // 1. Jouer une carte spéciale (+2, skip, reverse) en priorité pour gêner.
    // 2. Jouer un Joker en dernier recours.
    // 3. Sinon, jouer une carte numérique.
    validMoves.sort((a, b) => {
        const aIsSpecial = ['draw2', 'skip', 'reverse'].includes(a.card.value);
        const bIsSpecial = ['draw2', 'skip', 'reverse'].includes(b.card.value);
        const aIsWild = a.card.color === 'black';
        const bIsWild = b.card.color === 'black';

        if (aIsSpecial && !bIsSpecial) return -1;
        if (!aIsSpecial && bIsSpecial) return 1;
        if (aIsWild && !bIsWild) return 1;
        if (!aIsWild && bIsWild) return -1;
        
        return 0;
    });

    return validMoves[0];
};
