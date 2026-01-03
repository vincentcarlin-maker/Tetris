
import React from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Search } from 'lucide-react';
import { useNeonSeekLogic } from './hooks/useNeonSeekLogic';
import { SearchGrid } from './components/SearchGrid';
import { SeekHUD } from './components/SeekHUD';
import { TutorialOverlay } from '../Tutorials';
import { useGlobal } from '../../context/GlobalContext';

interface NeonSeekProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: string, value: number) => void;
}

export const NeonSeekContainer: React.FC<NeonSeekProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { state, timeLeft, earnedCoins, checkClick, resetGame } = useNeonSeekLogic(audio, addCoins, onReportProgress);
    const [showTutorial, setShowTutorial] = React.useState(false);
    const { neonSeekConfig } = useGlobal();

    if (!neonSeekConfig?.currentImage) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black/20 p-4 text-center animate-in fade-in">
                <div className="bg-gray-900/80 p-8 rounded-3xl border border-yellow-500/20 max-w-sm">
                    <Search size={48} className="text-yellow-500/50 mb-4 mx-auto" />
                    <h2 className="text-xl font-black text-white italic uppercase">Niveau non configuré</h2>
                    <p className="text-gray-400 text-sm mt-2 mb-6">L'administrateur doit générer et sauvegarder une image pour ce jeu via le tableau de bord.</p>
                    <button onClick={onBack} className="mt-4 px-8 py-3 bg-gray-800 text-white font-bold rounded-xl border border-white/10 hover:bg-gray-700 transition-colors">
                        Retour au menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 p-4 font-sans text-white relative touch-none select-none overflow-y-auto">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/20 blur-[150px] rounded-full pointer-events-none -z-10" />
            
            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between mb-6 shrink-0 z-20">
                <button onClick={onBack} className="p-2.5 bg-gray-800 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><Home size={20} /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] uppercase tracking-tighter">NEON SEEK</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTutorial(true)} className="p-2.5 bg-gray-800 rounded-xl text-yellow-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><HelpCircle size={20} /></button>
                    <button onClick={resetGame} className="p-2.5 bg-gray-800 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* HUD Area */}
            <SeekHUD objects={state.objects} timeLeft={timeLeft} score={state.foundCount} />

            {/* Game Grid */}
            <div className="mt-6 w-full flex justify-center z-10">
                <SearchGrid 
                    objects={state.objects} 
                    onGridClick={checkClick} 
                    imageSrc={neonSeekConfig.currentImage}
                />
            </div>

            {/* Game Over Overlay */}
            {state.status === 'gameOver' && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
                    {state.foundCount === state.objects.length ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase">Extraction Réussie</h2>
                            <p className="text-green-400 font-bold mb-8 tracking-widest">TOUS LES FRAGMENTS RÉCUPÉRÉS</p>
                        </>
                    ) : (
                        <>
                            <Search size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red] animate-pulse" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase">Échec du Scan</h2>
                            <p className="text-red-400 font-bold mb-8 tracking-widest">DONNÉES PERDUES DANS LA GRILLE</p>
                        </>
                    )}

                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border-2 border-yellow-500 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-black text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 w-full max-w-[280px]">
                        <button onClick={resetGame} className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-yellow-400 transition-all shadow-xl flex items-center justify-center gap-2 uppercase italic">
                            <RefreshCw size={20} /> Recommencer
                        </button>
                        <button onClick={onBack} className="w-full py-4 bg-gray-800 border border-white/10 text-white font-black tracking-widest rounded-2xl active:scale-95 transition-all uppercase italic">
                            Retour Arcade
                        </button>
                    </div>
                </div>
            )}

            {showTutorial && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in" onClick={() => setShowTutorial(false)}>
                    <div className="max-w-xs text-center">
                        <Search size={48} className="text-yellow-400 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white italic mb-6 uppercase">Comment Chercher ?</h2>
                        <ul className="space-y-4 text-left">
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">1</span>
                                <p>Identifiez les objets de la liste dans le décor arcade.</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">2</span>
                                <p>Touchez l'écran sur l'objet pour le valider.</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">3</span>
                                <p>Finissez avant la fin du chrono pour le bonus de pièces !</p>
                            </li>
                        </ul>
                        <button className="mt-8 w-full py-3 bg-yellow-500 text-black font-black rounded-xl uppercase tracking-widest">J'AI COMPRIS</button>
                    </div>
                </div>
            )}
        </div>
    );
};
