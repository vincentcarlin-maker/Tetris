
import { Frame } from '../types';

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
    { id: 'fr_neon_blue', name: 'Néon Bleu', price: 500, cssClass: 'border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse', description: 'Une lueur froide.' },
    { id: 'fr_neon_pink', name: 'Néon Rose', price: 500, cssClass: 'border-pink-500 shadow-[0_0_10px_#ec4899] animate-pulse', description: 'Flashy et stylé.' },
    { id: 'fr_toxic', name: 'Toxique', price: 1500, cssClass: 'border-lime-500 shadow-[0_0_15px_#84cc16] bg-[radial-gradient(circle,transparent_40%,rgba(132,204,22,0.3)_100%)]', description: 'Attention, corrosif.' },
    { id: 'fr_gold', name: 'Or Pur', price: 2500, cssClass: 'border-yellow-400 shadow-[0_0_15px_#facc15] bg-gradient-to-br from-yellow-300/20 to-yellow-600/20', description: 'Le luxe absolu.' },
];
