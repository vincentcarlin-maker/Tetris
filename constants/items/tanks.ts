
import { TankSkin } from '../types';

export const TANKS_CATALOG: TankSkin[] = [
    { id: 'tk_classic', name: 'Char Classique', price: 0, primaryColor: '#00d9ff', secondaryColor: '#0055ff', glowColor: '#00d9ff', description: 'Le blindage standard de la grille.' },
    { id: 'tk_crimson', name: 'Vanguard Rouge', price: 500, primaryColor: '#ff2d55', secondaryColor: '#990022', glowColor: '#ff2d55', description: 'Une peinture de guerre intimidante.' },
    { id: 'tk_emerald', name: 'Sentinelle Vert', price: 500, primaryColor: '#00ff9d', secondaryColor: '#006644', glowColor: '#00ff9d', description: 'Pour se fondre dans le Cyber-Forest.' },
    { id: 'tk_electric', name: 'Volt Chaser', price: 1500, primaryColor: '#ffff00', secondaryColor: '#ff9d00', glowColor: '#ffff00', description: 'Chargé à haute tension.', isAnimated: true },
    { id: 'tk_stealth', name: 'Shadow Ghost', price: 2000, primaryColor: '#444444', secondaryColor: '#000000', glowColor: '#ffffff', description: 'Presque invisible dans les ombres.' },
    { id: 'tk_cyber', name: 'Synthwave', price: 3000, primaryColor: '#ff00ff', secondaryColor: '#9d00ff', glowColor: '#ff00ff', description: 'Le style 80s ultime.' },
    { id: 'tk_gold', name: 'Royal Armor', price: 10000, primaryColor: '#ffe600', secondaryColor: '#ff9d00', glowColor: '#ffe600', description: 'L\'armure des champions de l\'arène.', isAnimated: true },
    { id: 'tk_plasma', name: 'Noyau Plasma', price: 7500, primaryColor: '#00f3ff', secondaryColor: '#ff00ff', glowColor: '#00f3ff', description: 'Réacteur énergétique instable.', isAnimated: true },
    { id: 'tk_void', name: 'Néant Obscur', price: 15000, primaryColor: '#1e1b4b', secondaryColor: '#000000', glowColor: '#9d00ff', description: 'Venu des confins du vide.', isAnimated: true }
];
