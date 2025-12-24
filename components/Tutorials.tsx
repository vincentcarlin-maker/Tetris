import React from 'react';
import { 
    HelpCircle, ArrowLeft, ArrowRight, RotateCw, ChevronDown, Keyboard, 
    MousePointer2, Target, Shield, Hash, Brain, Palette, Search, BrainCircuit,
    LayoutGrid, Zap, CheckCircle, Crosshair, Anchor, Ghost, Skull, MoveHorizontal,
    MousePointerClick, Layers, Megaphone, ArrowDown, Check, ArrowUp, Crown,
    Coins, Magnet, FastForward, Scissors, Trophy, Car, LockOpen, Cross, Grid3X3, AlertTriangle, Eye, MousePointer,
    Heart, Sparkles, ZapOff, Bomb, Apple, Pizza, Timer
} from 'lucide-react';

interface Step {
    icon: React.ElementType;
    color: string;
    title: string;
    desc: string;
}

// FIX: Moved TeleporterIcon declaration before it's used in the DATA constant to resolve 'used before declaration' error
const TeleporterIcon = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="m12 8-4 4 4 4" />
        <path d="m16 12-4-4" />
        <path d="m16 12-4 4" />
    </svg>
);

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
    slither: {
        titleColor: "text-indigo-400",
        steps: [
            { icon: MousePointer, color: "text-indigo-400", title: "DIRIGER", desc: "Le ver suit votre souris ou votre doigt." },
            { icon: Zap, color: "text-yellow-400", title: "BOOST", desc: "Maintenez le clic pour accélérer (consomme de la taille)." },
            { icon: Skull, color: "text-red-500", title: "MORTEL", desc: "Ne touchez pas le corps des autres vers !" }
        ]
    },
    arenaclash: {
        titleColor: "text-red-500",
        steps: [
            { icon: MoveHorizontal, color: "text-cyan-400", title: "PILOTAGE", desc: "Joystick gauche pour bouger le châssis." },
            { icon: Crosshair, color: "text-red-500", title: "VISÉE & TIR", desc: "Joystick droit pour viser et tirer automatiquement." },
            { icon: Sparkles, color: "text-yellow-400", title: "POWER-UPS", desc: "H: Soin, S: Bouclier, R: Tir Rapide, V: Vitesse, 3: Triple Tir, E: IEM, B: Bombe, $: Pièces." },
            { icon: Skull, color: "text-purple-400", title: "SURVIE", desc: "Éliminez les bots pour monter au classement." }
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
            { icon: MousePointer2, color: "text-yellow-400", title: "GLISSER", desc: "Dirigez Pacman dans le labyrinthe." },
            { icon: Pizza, color: "text-yellow-400", title: "POINTS", desc: "Mangez tous les points pour gagner le niveau." },
            { icon: Sparkles, color: "text-cyan-400", title: "SUPER PAC", desc: "Les gros points vous rendent invincible et font fuir les fantômes." },
            { icon: Ghost, color: "text-pink-400", title: "FANTÔMES", desc: "Évitez-les ! S'ils sont bleus, vous pouvez les manger." }
        ]
    },
    snake: {
        titleColor: "text-green-400",
        steps: [
            { icon: MousePointer2, color: "text-green-400", title: "DIRIGER", desc: "Utilisez le D-Pad pour changer de direction." },
            { icon: Apple, color: "text-red-500", title: "FRUITS", desc: "Pomme: Classique. Fraise: Turbo. Banane: Ralentit. Cerise: Score ++." },
            { icon: TeleporterIcon, color: "text-cyan-400", title: "TÉLÉPORTEURS", desc: "Entrez dans un portail néon pour ressortir par l'autre." },
            { icon: Skull, color: "text-red-400", title: "SURVIVRE", desc: "Évitez les murs, les bombes et votre propre queue." }
        ]
    },
    invaders: {
        titleColor: "text-rose-400",
        steps: [
            { icon: MoveHorizontal, color: "text-rose-400", title: "DÉPLACER", desc: "Glissez pour déplacer votre vaisseau." },
            { icon: Zap, color: "text-cyan-400", title: "TIRER", desc: "Le tir est automatique et constant." },
            { icon: Skull, color: "text-red-500", title: "SURVIVRE", desc: "Esquivez les tirs ennemis et ne les laissez pas descendre !" }
        ]
    },
    breaker: {
        titleColor: "text-fuchsia-500",
        steps: [
            { icon: MoveHorizontal, color: "text-fuchsia-500", title: "RAQUETTE", desc: "Bougez la barre pour renvoyer la balle." },
            { icon: Sparkles, color: "text-yellow-400", title: "BONUS", desc: "+: Agrandir, -: Rétrécir, MB: Multi-balles, F/S: Vitesse, ♥: Vie, L: Lasers." },
            { icon: MousePointerClick, color: "text-cyan-400", title: "LANCER", desc: "Touchez pour lancer la balle au début." }
        ]
    },
    uno: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: Layers, color: "text-cyan-400", title: "ASSOCIER", desc: "Même couleur ou même valeur." },
            { icon: Zap, color: "text-yellow-400", title: "CARTES ACTION", desc: "+2, Inverse, Passe-tour, Joker et +4." },
            { icon: Megaphone, color: "text-red-400", title: "UNO", desc: "Criez UNO dès qu'il vous reste 2 cartes !" }
        ]
    },
    watersort: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "SÉLECTIONNER", desc: "Touchez un tube pour prendre la couleur du haut." },
            { icon: ArrowDown, color: "text-yellow-400", title: "VERSER", desc: "Touchez un autre tube pour verser (si couleur identique)." },
            { icon: Check, color: "text-green-400", title: "OBJECTIF", desc: "Regroupez chaque couleur dans son propre tube." }
        ]
    },
    checkers: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "DÉPLACER", desc: "Touchez un pion puis une case vide en diagonale." },
            { icon: ArrowUp, color: "text-yellow-400", title: "CAPTURER", desc: "Sautez par-dessus l'adversaire. La capture est obligatoire !" },
            { icon: Crown, color: "text-green-400", title: "DAME", desc: "Atteignez le bord opposé pour bouger librement en diagonale." }
        ]
    },
    runner: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "SAUTER", desc: "Appuyez pour sauter au-dessus des obstacles." },
            { icon: Sparkles, color: "text-yellow-400", title: "POWER-UPS", desc: "M: Aimant, S: Bouclier (une erreur permise), B: Boost (vitesse + invincible)." },
            { icon: Coins, color: "text-yellow-400", title: "COLLECTER", desc: "Ramassez les pièces et les coffres pour le score." }
        ]
    },
    stack: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "POSER", desc: "Appuyez pour poser le bloc sur la pile." },
            { icon: Scissors, color: "text-red-400", title: "PRÉCISION", desc: "Tout ce qui dépasse du bord est coupé ! Soyez précis." },
            { icon: Zap, color: "text-yellow-400", title: "COMBO", desc: "Alignez parfaitement pour agrandir la base." }
        ]
    },
    game2048: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "GLISSER", desc: "Haut, Bas, Gauche, Droite pour déplacer les tuiles." },
            { icon: Layers, color: "text-yellow-400", title: "FUSIONNER", desc: "Les chiffres identiques fusionnent (2+2=4, 4+4=8)." },
            { icon: Trophy, color: "text-purple-400", title: "OBJECTIF", desc: "Atteindre la tuile 2048 !" }
        ]
    },
    rush: {
        titleColor: "text-red-500",
        steps: [
            { icon: MousePointer2, color: "text-cyan-400", title: "DÉPLACER", desc: "Faites glisser les voitures pour libérer la voie." },
            { icon: Car, color: "text-red-500", title: "OBJECTIF", desc: "La voiture ROUGE doit sortir par la droite." },
            { icon: LockOpen, color: "text-yellow-400", title: "CONTRÔLE", desc: "Elles ne bougent que dans leur axe respectif." }
        ]
    },
    skyjo: {
        titleColor: "text-purple-400",
        steps: [
            { icon: Trophy, color: "text-purple-400", title: "OBJECTIF", desc: "Avoir le moins de points possible à la fin." },
            { icon: MousePointer2, color: "text-cyan-400", title: "JOUER", desc: "Échangez une carte du deck ou de la défausse avec votre grille." },
            { icon: Layers, color: "text-green-400", title: "COMBO", desc: "Trois cartes identiques en colonne s'annulent (0 pts)." }
        ]
    },
    lumen: {
        titleColor: "text-cyan-400",
        steps: [
            { icon: Eye, color: "text-cyan-400", title: "OBSERVER", desc: "Regardez la séquence de formes lumineuses." },
            { icon: Brain, color: "text-purple-400", title: "MÉMORISER", desc: "Retenez l'ordre exact d'apparition." },
            { icon: MousePointerClick, color: "text-yellow-400", title: "RÉPÉTER", desc: "Reproduisez la séquence sans erreur." }
        ]
    }
};

export const TutorialOverlay: React.FC<{ gameId: string, onClose: () => void }> = ({ gameId, onClose }) => {
    const data = DATA[gameId];
    if (!data) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in" 
            onPointerDown={(e) => e.stopPropagation()}
        >
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
                    onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
                    className={`mt-6 w-full py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-lg active:scale-95`}
                >
                    J'AI COMPRIS !
                </button>
            </div>
        </div>
    );
};