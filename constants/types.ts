
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
    pattern?: 'solid' | 'stripes' | 'dots' | 'checker' | 'rainbow' | 'grid' | 'pulse' | 'metallic' | 'flag';
    flagColors?: string[];
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    description: string;
}

export interface SlitherAccessory {
    id: string;
    name: string;
    price: number;
    icon: any;
    type: string;
    color: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    description: string;
}

export interface TankAccessory {
    id: string;
    name: string;
    price: number;
    type: 'flag' | 'antenna' | 'exhaust';
    colors: string[];
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    description: string;
    layout?: 'vertical' | 'horizontal' | 'japan' | 'usa' | 'brazil' | 'pirate';
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
    shadow?: string;
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

export interface TankSkin {
    id: string;
    name: string;
    price: number;
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    isAnimated?: boolean;
    description: string;
}

export interface FriendRequest {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    timestamp: number;
}

export interface Friend {
    id: string;
    name: string;
    avatarId: string;
    frameId?: string;
    status: 'online' | 'offline';
    lastSeen: number;
    gameActivity?: string; 
    lastMessage?: string;
    lastMessageTime?: number;
    stats?: any;
    inventory?: string[];
}