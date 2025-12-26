
import { HiddenObject } from './types';

/**
 * CONFIGURATION DE L'IMAGE
 * Assurez-vous que le fichier 'arcade_scene.png' est à la racine du projet
 * (au même niveau que index.html et package.json).
 */
export const SCENE_IMAGE = "arcade_scene.png"; 

export const HIDDEN_OBJECTS: HiddenObject[] = [
    { 
        id: 'neon_x', 
        name: 'Poster Néon "X"', 
        x: 21.2, 
        y: 20.5, 
        radius: 6, 
        found: false 
    },
    { 
        id: 'vr_headset', 
        name: 'Casque VR Cyber', 
        x: 27.2, 
        y: 86.8, 
        radius: 6, 
        found: false 
    },
    { 
        id: 'yellow_r', 
        name: 'Lettre "R" Jaune', 
        x: 53.2, 
        y: 89.2, 
        radius: 5, 
        found: false 
    },
    { 
        id: 'cyan_r', 
        name: 'Lettre "R" Cyan', 
        x: 69.8, 
        y: 86.2, 
        radius: 5, 
        found: false 
    },
    { 
        id: 'arcade_joystick', 
        name: 'Joystick Rouge', 
        x: 46.4, 
        y: 52.2, 
        radius: 4, 
        found: false 
    },
];

export const MAX_TIME = 60;
