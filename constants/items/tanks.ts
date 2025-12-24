
import { TankSkin, TankAccessory } from '../types';

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

export const TANK_ACCESSORIES_CATALOG: TankAccessory[] = [
    { id: 'ta_none', name: 'Aucun', price: 0, type: 'flag', colors: [], rarity: 'COMMON', description: 'Pas de fioritures.' },
    { id: 'ta_flag_fr', name: 'Drapeau France', price: 400, type: 'flag', colors: ['#0055A4', '#FFFFFF', '#EF4135'], layout: 'vertical', rarity: 'RARE', description: 'Fierté tricolore.' },
    { id: 'ta_flag_it', name: 'Drapeau Italie', price: 400, type: 'flag', colors: ['#009246', '#FFFFFF', '#CE2B37'], layout: 'vertical', rarity: 'RARE', description: 'Forza sur le champ de bataille.' },
    { id: 'ta_flag_de', name: 'Drapeau Allemagne', price: 400, type: 'flag', colors: ['#000000', '#DD0000', '#FFCE00'], layout: 'horizontal', rarity: 'RARE', description: 'La rigueur du combat.' },
    { id: 'ta_flag_es', name: 'Drapeau Espagne', price: 400, type: 'flag', colors: ['#AA151B', '#F1BF00', '#AA151B'], layout: 'horizontal', rarity: 'RARE', description: 'La passion du néon.' },
    { id: 'ta_flag_us', name: 'Drapeau USA', price: 400, type: 'flag', colors: ['#3C3B6E', '#FFFFFF', '#B22234'], layout: 'usa', rarity: 'RARE', description: 'Stars and Stripes.' },
    { id: 'ta_flag_jp', name: 'Drapeau Japon', price: 400, type: 'flag', colors: ['#FFFFFF', '#BC002D'], layout: 'japan', rarity: 'RARE', description: 'Le soleil levant.' },
    { id: 'ta_flag_br', name: 'Drapeau Brésil', price: 400, type: 'flag', colors: ['#009739', '#FEDD00', '#012169'], layout: 'brazil', rarity: 'RARE', description: 'Le rythme de l\'arène.' },
    { id: 'ta_flag_pirate', name: 'Jolly Roger', price: 1200, type: 'flag', colors: ['#000000', '#FFFFFF'], layout: 'pirate', rarity: 'EPIC', description: 'Pas de quartier !' },
    { id: 'ta_flag_neon', name: 'Bannière Néon', price: 2500, type: 'flag', colors: ['#00f3ff', '#ff00ff', '#9d00ff'], layout: 'vertical', rarity: 'LEGENDARY', description: 'L\'emblème ultime de l\'Arcade.' },
];
