
import { Frame } from '../types';

export const FRAMES_CATALOG: Frame[] = [
    { id: 'fr_none', name: 'Aucun', price: 0, cssClass: 'border-white/10', description: 'Simple et efficace.' },
    { id: 'fr_neon_blue', name: 'Néon Bleu', price: 500, cssClass: 'border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse', description: 'Une lueur froide.' },
    { id: 'fr_neon_pink', name: 'Néon Rose', price: 500, cssClass: 'border-pink-500 shadow-[0_0_10px_#ec4899] animate-pulse', description: 'Flashy et stylé.' },
    { id: 'fr_toxic', name: 'Toxique', price: 1500, cssClass: 'border-lime-500 shadow-[0_0_15px_#84cc16] bg-[radial-gradient(circle,transparent_40%,rgba(132,204,22,0.3)_100%)]', description: 'Attention, corrosif.' },
    { id: 'fr_glitch', name: 'Code Corrompu', price: 3000, cssClass: 'border-white animate-glitch-main shadow-[2px_0_0_#ff00ff,-2px_0_0_#00ffff]', description: 'Un bug dans la matrice.' },
    { id: 'fr_vortex', name: 'Vortex Noir', price: 5000, cssClass: 'border-purple-600 shadow-[0_0_20px_#9333ea,inset_0_0_10px_#9333ea] animate-spin-slow', description: 'Aspiration vers le sommet.' },
    { id: 'fr_rainbow', name: 'Chroma Flux', price: 7500, cssClass: 'border-white shadow-[0_0_15px_white] bg-[linear-gradient(45deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] bg-[size:400%_400%] animate-[gradient_3s_ease_infinite]', description: 'Toutes les couleurs du succès.' },
    { id: 'fr_gold', name: 'Or Pur', price: 10000, cssClass: 'border-yellow-400 shadow-[0_0_15px_#facc15] bg-gradient-to-br from-yellow-300/20 to-yellow-600/20 ring-2 ring-yellow-400/50', description: 'Le luxe absolu.' },
];
