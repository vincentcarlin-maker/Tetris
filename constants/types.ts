
import { LucideIcon } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  price: number;
  icon: any;
  description: string;
  color: string;
}

export interface Avatar {
    id: string;
    name: string;
    price: number;
    icon: any;
    color: string;
    bgGradient: string;
}

export interface Frame {
    id: string;
    name: string;
    price: number;
    cssClass: string;
    description: string;
}

export interface SlitherSkin {
    id: string;
    name: string;
    price: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    pattern?: 'solid' | 'stripes' | 'dots' | 'checker' | 'rainbow' | 'grid' | 'pulse' | 'metallic';
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    description: string;
}

export interface SlitherAccessory {
    id: string;
    name: string;
    price: number;
    type: 'CROWN' | 'HAT' | 'GLASSES' | 'NINJA' | 'VIKING' | 'HALO' | 'HORNS' | 'CAT_EARS' | 'MOUSTACHE' | 'MONOCLE' | 'EYEPATCH' | 'BERET' | 'CAP' | 'FEZ' | 'SOMBRERO' | 'TIARA' | 'WITCH' | 'COWBOY' | 'MASK' | 'FLOWER' | 'STAR' | 'ROBOT' | 'DEVIL' | 'ANGEL' | 'HERO';
    color: string;
    description: string;
}

export interface Wallpaper {
    id: string;
    name: string;
    price: number;
    cssValue: string;
    description: string;
    bgSize?: string;
}

export interface Title {
    id: string;
    name: string;
    price: number;
    color: string;
    description: string;
}

export interface Mallet {
    id: string;
    name: string;
    price: number;
    colors: string[];
    type: 'basic' | 'gradient' | 'ring' | 'flower' | 'target' | 'complex';
    description: string;
}
