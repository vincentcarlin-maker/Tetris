import { LucideIcon } from 'lucide-react';

export type ShopCategory = 'PLAYER' | 'SLITHER' | 'ARENA' | 'AMBIANCE' | 'GEAR';
export type ShopGroup = ShopCategory | null;

export interface CategoryConfig {
    id: ShopCategory;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

export interface ShopItem {
    id: string;
    name: string;
    price: number;
    [key: string]: any;
}
