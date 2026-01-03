import { HiddenObject, SeekLevel } from './types';

export const HIDDEN_OBJECTS: HiddenObject[] = [
    { id: 'neon_x', name: 'Poster Néon "X"', x: 21.2, y: 20.5, radius: 6, found: false },
    { id: 'vr_headset', name: 'Casque VR Cyber', x: 27.2, y: 86.8, radius: 6, found: false },
    { id: 'yellow_r', name: 'Lettre "R" Jaune', x: 53.2, y: 89.2, radius: 5, found: false },
    { id: 'cyan_r', name: 'Lettre "R" Cyan', x: 69.8, y: 86.2, radius: 5, found: false },
    { id: 'arcade_joystick', name: 'Joystick Rouge', x: 46.4, y: 52.2, radius: 4, found: false },
];

export const PREDEFINED_LEVELS: SeekLevel[] = [
    {
        id: 'training_1',
        title: 'RECO : ALPHA',
        description: 'Zone d\'entraînement de base pour calibrer vos capteurs.',
        difficulty: 'FACILE',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
        reward: 50,
        objects: [
            { id: 'controller', name: 'Manette Grise', x: 48, y: 58, radius: 8, found: false },
            { id: 'diskette', name: 'Disquette Noire', x: 30, y: 75, radius: 7, found: false },
            { id: 'laptop', name: 'Écran CRT', x: 72, y: 40, radius: 10, found: false }
        ]
    },
    {
        id: 'training_2',
        title: 'POSTE AVANCÉ',
        description: 'La grille est plus dense ici. Restez concentré.',
        difficulty: 'MOYEN',
        image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=2070&auto=format&fit=crop',
        reward: 100,
        objects: [
            { id: 'pink_lamp', name: 'Tube Rose', x: 15, y: 30, radius: 6, found: false },
            { id: 'keyboard', name: 'Clavier Lumineux', x: 50, y: 80, radius: 8, found: false },
            { id: 'cpu', name: 'Processeur Néon', x: 82, y: 55, radius: 6, found: false },
            { id: 'glitch_box', name: 'Boîtier Glitch', x: 25, y: 70, radius: 7, found: false }
        ]
    }
];

export const MAX_TIME = 60;