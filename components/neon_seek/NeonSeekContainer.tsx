
import React from 'react';
import { Home, RefreshCw, Trophy, Coins, Play, HelpCircle, Search, Sparkles, Timer, Check } from 'lucide-react';
import { useNeonSeekLogic } from './hooks/useNeonSeekLogic';
import { SearchGrid } from './components/SearchGrid';
import { TutorialOverlay } from '../Tutorials';
import { useGlobal } from '../../context/GlobalContext';

interface NeonSeekProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: string, value: number) => void;
}

export const NeonSeekContainer: React.FC<NeonSeekProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { neonSeekConfig } = useGlobal();
    const [showTutorial, setShowTutorial] = React.useState(false);
    
    const { state, timeLeft, earnedCoins, lastFoundName, checkClick, resetGame } = useNeonSeekLogic(
        audio, 
        addCoins, 
        onReportProgress, 
        neonSeekConfig?.objects
    );

    if (!neonSeekConfig?.currentImage) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black/20 p-4 text-center animate-in fade-in">
                <div className="bg-gray-900/80 p-8 rounded-3xl border border-yellow-500/20 max-w-sm">
                    <Search size={48} className="text-yellow-500/50 mb-4 mx-auto" />
                    <h2 className="text-xl font-black text-white italic uppercase">Niveau non configuré</h2>
                    <p className="text-gray-400 text-sm mt-2 mb-6">L'administrateur doit générer une image pour ce jeu.</p>
                    <button onClick={onBack} className="mt-4 px-8 py-3 bg-gray-800 text-white font-bold rounded-xl border border-white/10 hover:bg-gray-700 transition-colors">
                        Retour au menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full flex flex-col bg-black font-sans text-white relative overflow-hidden select-none touch-none">
            
            {/* 1. L'IMAGE DE JEU (Plein écran réel) */}
            <div className="flex-1 w-full relative z-0">
                <SearchGrid 
                    objects={state.objects} 
                    onGridClick={checkClick} 
                    imageSrc={neonSeekConfig.currentImage}
                />
            </div>

            {/* 2. HEADER FLOTTANT (Haut) avec protection Safe Area */}
            <div 
                className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-20 pointer-events-none"
                style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
            >
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-gray-300 border border-white/10 active:scale-95 transition-all shadow-xl">
                        <Home size={22} />
                    </button>
                </div>
                
                <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] uppercase tracking-tighter pointer-events-none">
                    NEON SEEK
                </h1>

                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={() => setShowTutorial(true)} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-yellow-400 border border-white/10 active:scale-95 shadow-xl">
                        <HelpCircle size={22} />
                    </button>
                    <button onClick={resetGame} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-gray-300 border border-white/10 active:scale-95 shadow-xl">
                        <RefreshCw size={22} />
                    </button>
                </div>
            </div>

            {/* 3. BANDEAU DES OBJETS (Bas) avec protection Safe Area */}
            <div 
                className="w-full bg-black/80 backdrop-blur-xl border-t border-white/10 z-20 flex items-center px-4 md:px-8 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
                style={{ 
                    height: 'calc(7rem + env(safe-area-inset-bottom))',
                    paddingBottom: 'env(safe-area-inset-bottom)'
                }}
            >
                {/* Chrono */}
                <div className="flex flex-col items-center justify-center border-r border-white/10 pr-6 mr-6 shrink-0">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Temps</span>
                    <div className={`flex items-center gap-2 text-2xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                        <Timer size={20} />
                        {timeLeft}s
                    </div>
                </div>

                {/* Liste des objets à trouver */}
                <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar py-2">
                    {state.objects.map(obj => (
                        <div 
                            key={obj.id} 
                            className={`min-w-[120px] md:min-w-[160px] px-4 py-3 rounded-2xl border transition-all flex items-center gap-3 shrink-0 ${
                                obj.found 
                                ? 'bg-green-500/10 border-green-500/40 opacity-40 grayscale' 
                                : 'bg-gray-800/40 border-white/10 shadow-lg'
                            }`}
                        >
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${obj.found ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse shadow-[0_0_8px_#facc15]'}`}></div>
                            <span className={`text-[11px] font-black uppercase tracking-tight truncate ${obj.found ? 'text-green-400 line-through' : 'text-white'}`}>
                                {obj.name}
                            </span>
                            {obj.found && <Check size={14} className="text-green-500 ml-auto" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* BIG FEEDBACK TEXT OVERLAY */}
            {lastFoundName && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <div className="bg-black/20 backdrop-blur-[2px] w-full py-12 flex flex-col items-center animate-in zoom-in fade-in slide-in-from-bottom-8 duration-300">
                        <div className="flex items-center gap-4 mb-2">
                            <Sparkles className="text-yellow-400 animate-pulse" size={32} />
                            <span className="text-yellow-500 font-black tracking-[0.5em] text-sm uppercase">Fragment Identifié</span>
                            <Sparkles className="text-yellow-400 animate-pulse" size={32} />
                        </div>
                        <h2 className="text-6xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] uppercase tracking-tighter text-center px-6">
                            {lastFoundName}
                        </h2>
                        <div className="mt-4 w-40 h-1.5 bg-yellow-500 shadow-[0_0_20px_#facc15] animate-scale-x"></div>
                    </div>
                </div>
            )}

            {/* Game Over Overlay */}
            {state.status === 'gameOver' && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
                    {state.foundCount === state.objects.length ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase tracking-tighter">Scan Réussi</h2>
                            <p className="text-green-400 font-bold mb-8 tracking-widest">TOUS LES FRAGMENTS RÉCUPÉRÉS</p>
                        </>
                    ) : (
                        <>
                            <Search size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red] animate-pulse" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase tracking-tighter">Échec du Scan</h2>
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
                        <h2 className="text-2xl font-black text-white italic mb-6 uppercase">Comment Jouer ?</h2>
                        <ul className="space-y-4 text-left">
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">1</span>
                                <p>Trouvez les objets listés dans le bandeau du bas.</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">2</span>
                                <p>Touchez l'objet directement sur l'image.</p>
                            </li>
                            <li className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-black shrink-0">3</span>
                                <p>Videz la liste avant la fin du chrono !</p>
                            </li>
                        </ul>
                        <button className="mt-8 w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase tracking-widest shadow-lg">LANCER LE SCAN</button>
                    </div>
                </div>
            )}
        </div>
    );
};
