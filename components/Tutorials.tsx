
import React from 'react';
import { 
    HelpCircle, ArrowLeft, ArrowRight, RotateCw, ChevronDown, Keyboard, 
    MousePointer2, Target, Shield, Hash, Brain, Palette, Search, BrainCircuit,
    LayoutGrid, Zap, CheckCircle, Crosshair, Anchor, Ghost, Skull, MoveHorizontal,
    MousePointerClick, Layers, Megaphone, ArrowDown, Check, ArrowUp, Crown,
    Coins, Magnet, FastForward, Scissors, Trophy, Car, LockOpen, Cross, Grid3X3, AlertTriangle
} from 'lucide-react';

interface Step {
    icon: React.ElementType;
    color: string;
    title: string;
    desc: string;
}

const DATA: Record<string, { titleColor: string, steps: Step[] }> = {
    tetris: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: ArrowLeft, color: "text-cyan-400", title: "DÉPLACER", desc: "Gauche/Droite pour bouger." },
            { icon: RotateCw, color: "text-purple-400", title: "PIVOTER", desc: "Haut pour tourner." },
            { icon: ChevronDown, color: "text-yellow-400", title: "ACCÉLÉRER", desc: "Bas pour descendre vite." },
            { icon: Keyboard, color: "text-gray-400", title: "CONTRÔLES", desc: "Compatible tactile et clavier." }
        ]
    },
    arenaclash: {
        titleColor: "text-red-500",
        steps: [
            { icon: MoveHorizontal, color: "text-cyan-400", title: "BOUGER", desc: "WASD, Flèches ou Joystick gauche." },
            { icon: Crosshair, color: "text-red-500", title: "VISER & TIRER", desc: "Souris ou Tap droite." },
            { icon: Skull, color: "text-purple-400", title: "SURVIVRE", desc: "Détruisez les vagues d'ennemis." }
        ]
    },
    airhockey: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "GLISSER", desc: "Bougez le doigt pour contrôler le maillet." },
            { icon: Target, color: "text-pink-400", title: "FRAPPER", desc: "Tirez dans le but adverse." },
            { icon: Shield, color: "text-yellow-400", title: "DÉFENDRE", desc: "Protégez votre camp !" }
        ]
    },
    sudoku: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "SÉLECTIONNER", desc: "Touchez une case vide." },
            { icon: Hash, color: "text-yellow-400", title: "REMPLIR", desc: "Utilisez le pavé numérique." },
            { icon: Brain, color: "text-purple-400", title: "LOGIQUE", desc: "1-9 unique par ligne/col/bloc." }
        ]
    },
    mastermind: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: Palette, color: "text-cyan-400", title: "DEVINER", desc: "Choisissez 4 couleurs." },
            { icon: Search, color: "text-yellow-400", title: "INDICES", desc: "Rouge = Bien placé. Blanc = Mal placé." },
            { icon: BrainCircuit, color: "text-purple-400", title: "LOGIQUE", desc: "Déduisez le code secret." }
        ]
    },
    connect4: {
        titleColor: "text-pink-500",
        steps: [
            { icon: LayoutGrid, color: "text-pink-500", title: "ALIGNER", desc: "Alignez 4 jetons." },
            { icon: Shield, color: "text-cyan-400", title: "BLOQUER", desc: "Empêchez l'adversaire de gagner." },
            { icon: Zap, color: "text-yellow-400", title: "STRATÉGIE", desc: "Créez des pièges." }
        ]
    },
    memory: {
        titleColor: "text-purple-400",
        steps: [
            { icon: MousePointer2, color: "text-purple-400", title: "RETOURNER", desc: "Cliquez pour voir l'image." },
            { icon: Brain, color: "text-pink-400", title: "MÉMORISER", desc: "Retenez les emplacements." },
            { icon: CheckCircle, color: "text-green-400", title: "PAIRES", desc: "Trouvez les cartes identiques." }
        ]
    },
    battleship: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "PLACER", desc: "Positionnez votre flotte." },
            { icon: Crosshair, color: "text-red-400", title: "TIRER", desc: "Touchez la grille ennemie." },
            { icon: Anchor, color: "text-green-400", title: "COULER", desc: "Détruisez tous les navires." }
        ]
    },
    pacman: {
        titleColor: "text-yellow-400",
        steps: [
            { icon: MousePointer2, color: "text-yellow-400", title: "GLISSER", desc: "Dirigez Pacman." },
            { icon: Zap, color: "text-cyan-400", title: "SUPER PAC", desc: "Mangez les gros points." },
            { icon: Ghost, color: "text-pink-400", title: "FANTÔMES", desc: "Évitez-les ou mangez-les (bleus)." }
        ]
    },
    snake: {
        titleColor: "text-green-400",
        steps: [
            { icon: MousePointer2, color: "text-green-400", title: "DIRIGER", desc: "Changez de direction." },
            { icon: Zap, color: "text-yellow-400", title: "MANGER", desc: "Grandissez avec les pommes." },
            { icon: Skull, color: "text-red-400", title: "SURVIVRE", desc: "Évitez les murs et la queue." }
        ]
    },
    invaders: {
        titleColor: "text-rose-400",
        steps: [
            { icon: MousePointer2, color: "text-rose-400", title: "GLISSER", desc: "Déplacez le vaisseau." },
            { icon: Zap, color: "text-cyan-400", title: "TIRER", desc: "Le tir est automatique." },
            { icon: Skull, color: "text-red-500", title: "SURVIVRE", desc: "Esquivez les tirs ennemis." }
        ]
    },
    breaker: {
        titleColor: "text-fuchsia-500",
        steps: [
            { icon: MoveHorizontal, color: "text-fuchsia-500", title: "DÉPLACER", desc: "Bougez la raquette." },
            { icon: MousePointerClick, color: "text-cyan-400", title: "LANCER", desc: "Touchez pour lancer." },
            { icon: Zap, color: "text-yellow-400", title: "BONUS", desc: "Attrapez les pouvoirs." }
        ]
    },
    uno: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: Layers, color: "text-cyan-400", title: "ASSOCIER", desc: "Même couleur ou valeur." },
            { icon: Zap, color: "text-yellow-400", title: "ACTION", desc: "+2, Inverse, Joker..." },
            { icon: Megaphone, color: "text-red-400", title: "UNO", desc: "Criez UNO à 2 cartes !" }
        ]
    },
    watersort: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "SÉLECTIONNER", desc: "Touchez un tube." },
            { icon: ArrowDown, color: "text-yellow-400", title: "VERSER", desc: "Dans un tube valide." },
            { icon: Check, color: "text-green-400", title: "TRIER", desc: "Regroupez les couleurs." }
        ]
    },
    checkers: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "DÉPLACER", desc: "Touchez un pion pour le sélectionner, puis une case vide en diagonale." },
            { icon: ArrowUp, color: "text-yellow-400", title: "CAPTURER", desc: "Sautez par-dessus les pions adverses pour les capturer (obligatoire !)." },
            { icon: Crown, color: "text-green-400", title: "DAME", desc: "Atteignez le bord opposé pour transformer votre pion en Dame (recule et avance)." }
        ]
    },
    runner: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "SAUTER", desc: "Cliquez ou appuyez pour sauter par-dessus les obstacles." },
            { icon: Coins, color: "text-yellow-400", title: "COLLECTER", desc: "Ramassez les pièces et les coffres pour augmenter votre score." },
            { icon: FastForward, color: "text-orange-400", title: "BONUS", desc: "Aimant (pièces), Bouclier (vie), Boost (vitesse + invulnérable)." }
        ]
    },
    stack: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "POSER", desc: "Le bloc se déplace. Appuyez au bon moment pour le poser sur la tour." },
            { icon: Scissors, color: "text-red-400", title: "PRÉCISION", desc: "Tout ce qui dépasse du bord est coupé ! La tour devient plus fine." },
            { icon: Zap, color: "text-yellow-400", title: "COMBO", desc: "Alignez parfaitement pour agrandir la base et gagner des points bonus." }
        ]
    },
    game2048: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "GLISSER", desc: "Haut, Bas, Gauche, Droite." },
            { icon: Layers, color: "text-yellow-400", title: "FUSIONNER", desc: "2+2=4, 4+4=8..." },
            { icon: Trophy, color: "text-purple-400", title: "OBJECTIF", desc: "Atteindre 2048 !" }
        ]
    },
    rush: {
        titleColor: "text-red-500",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "DÉPLACER", desc: "Glissez les véhicules pour libérer le passage." },
            { icon: Car, color: "text-red-500", title: "OBJECTIF", desc: "La voiture ROUGE doit sortir à droite." },
            { icon: LockOpen, color: "text-yellow-400", title: "CONTRAINTE", desc: "Les véhicules ne bougent que dans leur axe (Horizontal ou Vertical)." }
        ]
    },
    skyjo: {
        titleColor: "text-purple-400",
        steps: [
            { icon: Trophy, color: "text-purple-400", title: "OBJECTIF", desc: "Avoir le moins de points possible." },
            { icon: MousePointer2, color: "text-cyan-400", title: "JOUER", desc: "Piochez ou prenez la défausse pour échanger avec une carte de votre grille." },
            { icon: Layers, color: "text-green-400", title: "COMBO", desc: "3 cartes identiques en colonne s'annulent (0 pts)." },
            { icon: AlertTriangle, color: "text-red-500", title: "DANGER", desc: "Si vous finissez 1er sans le score le plus bas, vos points doublent !" }
        ]
    }
};

export const TutorialOverlay: React.FC<{ gameId: string, onClose: () => void }> = ({ gameId, onClose }) => {
    const data = DATA[gameId];
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-xs text-center">
                <h2 className={`text-2xl font-black text-white italic mb-6 flex items-center justify-center gap-2`}><HelpCircle className={data.titleColor}/> COMMENT JOUER ?</h2>
                
                <div className="space-y-3 text-left">
                    {data.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start bg-gray-900/50 p-2 rounded-lg border border-white/10">
                            <step.icon className={`${step.color} shrink-0 mt-1`} size={20} />
                            <div>
                                <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                                <p className="text-xs text-gray-400">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onClose}
                    className={`mt-6 w-full py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95`}
                >
                    J'AI COMPRIS !
                </button>
            </div>
        </div>
    );
};
