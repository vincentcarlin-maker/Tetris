
import { 
    Glasses, Crown, Ghost, Zap, Flame, Rocket, 
    Skull, Shield, Cpu, Target, Star, Music, 
    Wind, Moon, Sun, CircleDashed, Wand2, Swords,
    Eye, Headphones, Terminal
} from 'lucide-react';
import { SlitherSkin, SlitherAccessory } from '../types';

export const SLITHER_SKINS_CATALOG: SlitherSkin[] = [
    { id: 'ss_cyan', name: 'Cyan Néon', price: 0, primaryColor: '#00f3ff', secondaryColor: '#0088ff', glowColor: '#00f3ff', pattern: 'solid', rarity: 'COMMON', description: 'Le look original.' },
    { id: 'ss_pink', name: 'Rose Flash', price: 200, primaryColor: '#ff00ff', secondaryColor: '#cc00cc', glowColor: '#ff00ff', pattern: 'solid', rarity: 'COMMON', description: 'Vibrant et assumé.' },
    { id: 'ss_lime', name: 'Lime Toxique', price: 200, primaryColor: '#ccff00', secondaryColor: '#88aa00', glowColor: '#ccff00', pattern: 'solid', rarity: 'COMMON', description: 'Attention, corrosif !' },
    { id: 'ss_purple', name: 'Violet Royal', price: 200, primaryColor: '#9d00ff', secondaryColor: '#6600cc', glowColor: '#9d00ff', pattern: 'solid', rarity: 'COMMON', description: 'Mystique.' },
    
    // --- COLLECTION WORLD TOUR ---
    { id: 'ss_flag_fr', name: 'France', price: 500, primaryColor: '#0055A4', secondaryColor: '#FFFFFF', glowColor: '#FFFFFF', pattern: 'flag', flagColors: ['#0055A4', '#FFFFFF', '#EF4135'], rarity: 'RARE', description: 'Bleu, Blanc, Rouge. Allez les Bleus !' },
    { id: 'ss_flag_it', name: 'Italie', price: 500, primaryColor: '#009246', secondaryColor: '#FFFFFF', glowColor: '#FFFFFF', pattern: 'flag', flagColors: ['#009246', '#FFFFFF', '#CE2B37'], rarity: 'RARE', description: 'Forza Italia sur la grille.' },
    { id: 'ss_flag_de', name: 'Allemagne', price: 500, primaryColor: '#000000', secondaryColor: '#DD0000', glowColor: '#FFCE00', pattern: 'flag', flagColors: ['#000000', '#DD0000', '#FFCE00'], rarity: 'RARE', description: 'Efficacité et précision germanique.' },
    { id: 'ss_flag_br', name: 'Brésil', price: 500, primaryColor: '#009739', secondaryColor: '#FEDD00', glowColor: '#012169', pattern: 'flag', flagColors: ['#009739', '#FEDD00', '#012169'], rarity: 'RARE', description: 'Le rythme de la samba dans chaque mouvement.' },
    { id: 'ss_flag_us', name: 'USA', price: 500, primaryColor: '#B22234', secondaryColor: '#FFFFFF', glowColor: '#3C3B6E', pattern: 'flag', flagColors: ['#3C3B6E', '#FFFFFF', '#B22234'], rarity: 'RARE', description: 'The Stars and Stripes.' },
    { id: 'ss_flag_jp', name: 'Japon', price: 500, primaryColor: '#FFFFFF', secondaryColor: '#BC002D', glowColor: '#BC002D', pattern: 'flag', flagColors: ['#FFFFFF', '#FFFFFF', '#BC002D', '#FFFFFF', '#FFFFFF'], rarity: 'RARE', description: 'L\'élégance du soleil levant.' },
    { id: 'ss_flag_es', name: 'Espagne', price: 500, primaryColor: '#AA151B', secondaryColor: '#F1BF00', glowColor: '#AA151B', pattern: 'flag', flagColors: ['#AA151B', '#F1BF00', '#AA151B'], rarity: 'RARE', description: 'La passion du néon ibérique.' },
    { id: 'ss_flag_be', name: 'Belgique', price: 500, primaryColor: '#000000', secondaryColor: '#FFD935', glowColor: '#FFD935', pattern: 'flag', flagColors: ['#000000', '#FFD935', '#EF3340'], rarity: 'RARE', description: 'L\'union fait la force sur le serveur.' },

    { id: 'ss_steel', name: 'Acier Poli', price: 750, primaryColor: '#94a3b8', secondaryColor: '#475569', glowColor: '#ffffff', pattern: 'metallic', rarity: 'RARE', description: 'Reflets industriels.' },
    { id: 'ss_gold', name: 'Or Pur', price: 1500, primaryColor: '#fbbf24', secondaryColor: '#b45309', glowColor: '#fbbf24', pattern: 'metallic', rarity: 'RARE', description: 'La marque du luxe.' },
    { id: 'ss_zebra', name: 'Zèbre Néon', price: 1000, primaryColor: '#ffffff', secondaryColor: '#000000', glowColor: '#ffffff', pattern: 'stripes', rarity: 'RARE', description: 'Rayures élégantes.' },
    { id: 'ss_galaxy', name: 'Galaxie Profonde', price: 3500, primaryColor: '#312e81', secondaryColor: '#1e1b4b', glowColor: '#a855f7', pattern: 'pulse', rarity: 'EPIC', description: 'Poussière d\'étoiles.' },
    { id: 'ss_matrix_core', name: 'Code Source', price: 17000, primaryColor: '#00ff00', secondaryColor: '#000000', glowColor: '#00ff00', pattern: 'grid', rarity: 'LEGENDARY', description: 'Vous voyez les lignes.' },
];

export const SLITHER_ACCESSORIES_CATALOG: SlitherAccessory[] = [
    { id: 'sa_none', name: 'Aucun', price: 0, icon: CircleDashed, type: 'NONE', color: 'transparent', rarity: 'COMMON', description: 'Garder la tête libre.' },
    { id: 'sa_cyber_visor', name: 'Visière Alpha', price: 800, icon: Glasses, type: 'EYES', color: '#00f3ff', rarity: 'COMMON', description: 'HUD tactique intégré pour une vision claire de la grille.' },
    { id: 'sa_oni_mask', name: 'Masque Oni-Data', price: 2500, icon: Skull, type: 'FACE', color: '#ff4d4d', rarity: 'RARE', description: 'Un masque traditionnel infusé de micro-pixels démoniaques.' },
    { id: 'sa_dj_phones', name: 'Casque Pulse', price: 1500, icon: Headphones, type: 'HEAD', color: '#ff00ff', rarity: 'RARE', description: 'Écoutez le rythme binaire du serveur en haute fidélité.' },
    { id: 'sa_energy_halo', name: 'Auréole Stable', price: 5000, icon: CircleDashed, type: 'TOP', color: '#ffe600', rarity: 'EPIC', description: 'Un anneau d\'énergie pure flottant au-dessus de votre ver.' },
    { id: 'sa_samurai_blades', name: 'Lames Cyber', price: 3500, icon: Swords, type: 'BACK', color: '#ffffff', rarity: 'EPIC', description: 'Démontrez votre maîtrise du code avec ces katanas de verre.' },
    { id: 'sa_royal_crown', name: 'Couronne Néon', price: 10000, icon: Crown, type: 'TOP', color: '#fbbf24', rarity: 'LEGENDARY', description: 'Portez l\'emblème sacré du premier au classement mondial.' },
    { id: 'sa_void_eye', name: 'Œil du Néant', price: 15000, icon: Eye, type: 'EYES', color: '#9d00ff', rarity: 'LEGENDARY', description: 'Un implant oculaire capable de voir à travers les bugs.' },
    { id: 'sa_hacker_tag', name: 'Badge Root', price: 4000, icon: Terminal, type: 'SIDE', color: '#00ff9d', rarity: 'RARE', description: 'Le signe que vous avez hacké votre place au sommet.' },
];
