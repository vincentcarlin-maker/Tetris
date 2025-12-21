
import { Tube } from './types';
import { TUBE_CAPACITY } from './constants';

/**
 * Vérifie si le niveau est terminé (tous les tubes sont soit vides, soit pleins d'une seule couleur)
 */
export const isLevelSolved = (tubes: Tube[]): boolean => {
    return tubes.every(tube => {
        if (tube.length === 0) return true;
        if (tube.length !== TUBE_CAPACITY) return false;
        const color = tube[0];
        return tube.every(c => c === color);
    });
};

/**
 * Vérifie si un mouvement est valide
 */
export const isValidMove = (srcTube: Tube, dstTube: Tube): boolean => {
    if (srcTube.length === 0) return false; // Source vide
    if (dstTube.length >= TUBE_CAPACITY) return false; // Destination pleine
    
    const colorToMove = srcTube[srcTube.length - 1];
    
    // On peut verser si le tube de destination est vide ou si la couleur correspond
    return dstTube.length === 0 || dstTube[dstTube.length - 1] === colorToMove;
};

/**
 * Génère les tubes pour un niveau donné
 */
export const generateLevelTubes = (lvl: number): Tube[] => {
    // Difficulty scaling
    let colorCount = Math.min(3 + Math.floor((lvl - 1) / 2), 12); 
    let emptyTubes = 2;

    // 1. Create a pool of all liquid segments needed
    let segments: number[] = [];
    for (let c = 1; c <= colorCount; c++) {
        for (let i = 0; i < TUBE_CAPACITY; i++) {
            segments.push(c);
        }
    }

    // 2. Fisher-Yates Shuffle
    for (let i = segments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [segments[i], segments[j]] = [segments[j], segments[i]];
    }

    // 3. Fill the tubes
    const newTubes: Tube[] = [];
    let segmentIdx = 0;
    
    for (let i = 0; i < colorCount; i++) {
        const tube: number[] = [];
        for (let j = 0; j < TUBE_CAPACITY; j++) {
            if (segmentIdx < segments.length) {
                tube.push(segments[segmentIdx++]);
            }
        }
        newTubes.push(tube);
    }
    
    for (let i = 0; i < emptyTubes; i++) {
        newTubes.push([]);
    }

    return newTubes;
};
