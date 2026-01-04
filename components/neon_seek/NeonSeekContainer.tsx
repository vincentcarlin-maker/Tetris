
import React, { useState, useEffect } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, Search, Sparkles, Timer, Check, ArrowLeft } from 'lucide-react';
import { useNeonSeekLogic } from './hooks/useNeonSeekLogic';
import { SearchGrid } from './components/SearchGrid';
import { NeonSeekMenu } from './views/NeonSeekMenu';
import { PREDEFINED_LEVELS } from './constants';
import { SeekLevel } from './types';
import { useGlobal } from '../../context/GlobalContext';

interface NeonSeekProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: string, value: number) => void;
}

export const NeonSeekContainer: React.FC<NeonSeekProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const { neonSeekConfig } = useGlobal();
    const [inMenu, setInMenu] = useState(true);
    const [currentLevelData, setCurrentLevelData] = useState<SeekLevel | null>(null);
    
    // Fusionner les niveaux prédéfinis avec les slots 1-20 de l'admin
    const allLevels = React.useMemo(() => {
        const levels: SeekLevel[] = [...PREDEFINED_LEVELS];
        
        if (neonSeekConfig?.customLevels) {
            // On extrait les clés (1, 2, 3...), on les trie numériquement, 
            // et on ajoute les niveaux correspondants
            const slotKeys = Object.keys(neonSeekConfig.customLevels)
                .map(Number)
                .sort((a, b) => a - b);
            
            slotKeys.forEach(slot => {
                const level = neonSeekConfig.customLevels![slot];
                if (level && level.image) {
                    levels.push(level);
                }
            });
        }
        return levels;
    }, [neonSeekConfig]);

    const { state, timeLeft, earnedCoins, lastFoundName, checkClick, resetGame } = useNeonSeekLogic(
        audio, 
        addCoins, 
        onReportProgress, 
        currentLevelData?.objects
    );

    const handleSelectLevel = (level: SeekLevel) => {
        setCurrentLevelData(level);
        setInMenu(false);
        audio.resumeAudio();
        audio.playVictory();
    };

    if (inMenu) {
        return <NeonSeekMenu levels={allLevels} onSelectLevel={handleSelectLevel} onBack={onBack} />;
    }

    if (!currentLevelData) return null;

    return (
        <div className="fixed inset-0 z-[100] w-full h-[100dvh] bg-black font-sans text-white overflow-hidden select-none touch-none flex flex-col items-center justify-center p-4 gap-4">
            
            {/* FOND IMMERSIF (Flou dynamique) */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={currentLevelData.image} 
                    className="w-full h-full object-cover blur-3xl opacity-30 scale-125" 
                    alt="Background blur"
                />
                <div className="absolute inset-0 bg-black/60"></div>
            </div>

            {/* ZONE DE JEU 9:16 CENTRÉE */}
            <div className="relative z-10 w-full max-w-md aspect-[9/16] shrink-1 bg-black shadow-2xl rounded-2xl border border-white/10 overflow-hidden">
                <SearchGrid 
                    objects={state.objects} 
                    onGridClick={checkClick} 
                    imageSrc={currentLevelData.image}
                />
                
                {/* BARRE SUPÉRIEURE (OVERLAY) */}
                <div 
                    className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-30 pointer-events-none"
                    style={{ 
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
                    }}
                >
                    <div className="flex gap-2 pointer-events-auto">
                        <button onClick={() => setInMenu(true)} className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-gray-300 border border-white/10 active:scale-95 transition-all shadow-xl">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    
                    <div className="flex flex-col items-center pointer-events-none text-center px-4 overflow-hidden">
                        <h1 className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] uppercase tracking-tighter truncate w-full">
                            {currentLevelData.title}
                        </h1>
                        <span className="text-[7px] font-black text-yellow-500/80 tracking-[0.2em] uppercase">{currentLevelData.difficulty}</span>
                    </div>

                    <div className="flex gap-2 pointer-events-auto">
                        <button onClick={resetGame} className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-gray-300 border border-white/10 active:scale-95 shadow-xl">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* FEEDBACK DE DÉCOUVERTE */}
                {lastFoundName && (
                    <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none select-none overflow-hidden">
                        <div className="bg-black/40 backdrop-blur-sm w-full py-12 flex flex-col items-center animate-in zoom-in fade-in slide-in-from-bottom-8 duration-300 border-y border-yellow-500/30">
                            <div className="flex items-center gap-4 mb-2">
                                <Sparkles className="text-yellow-400 animate-pulse" size={24} />
                                <span className="text-yellow-500 font-black tracking-[0.5em] text-xs uppercase">Fragment Localisé</span>
                                <Sparkles className="text-yellow-400 animate-pulse" size={24} />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] uppercase tracking-tighter text-center px-6">
                                {lastFoundName}
                            </h2>
                        </div>
                    </div>
                )}
            </div>

            {/* BARRE INFÉRIEURE (SÉPARÉE SOUS L'IMAGE) */}
            <div className="w-full max-w-md z-30 flex items-center p-3 bg-gray-900/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0">
                <div className="flex flex-col items-center justify-center border-r border-white/10 pr-4 mr-4 shrink-0">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Scanner</span>
                    <div className={`flex items-center gap-1.5 text-xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                        {timeLeft}s
                    </div>
                </div>

                <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {state.objects.map(obj => (
                        <div 
                            key={obj.id} 
                            className={`min-w-[100px] px-3 py-2 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${
                                obj.found 
                                ? 'bg-green-500/10 border-green-500/40 opacity-50 grayscale' 
                                : 'bg-black/40 border-white/10 shadow-lg'
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${obj.found ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse shadow-[0_0_8px_#facc15]'}`}></div>
                            <span className={`text-[9px] font-black uppercase tracking-tight truncate ${obj.found ? 'text-green-400 line-through' : 'text-white'}`}>
                                {obj.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ÉCRAN DE FIN */}
            {state.status === 'gameOver' && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 h-full w-full">
                    {state.foundCount === state.objects.length ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_25px_gold] animate-bounce" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase tracking-tighter">Secteur Purifié</h2>
                            <p className="text-green-400 font-bold mb-8 tracking-widest uppercase">Intégrité des données : 100%</p>
                        </>
                    ) : (
                        <>
                            <Search size={80} className="text-red-500 mb-6 drop-shadow-[0_0_25px_red] animate-pulse" />
                            <h2 className="text-5xl font-black italic text-white mb-2 uppercase tracking-tighter">Échec du Scan</h2>
                            <p className="text-red-400 font-bold mb-8 tracking-widest uppercase">Signal perdu dans la grille</p>
                        </>
                    )}

                    {earnedCoins > 0 && (
                        <div className="mb-8 flex items-center gap-3 bg-yellow-500/20 px-6 py-3 rounded-full border-2 border-yellow-500 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <Coins className="text-yellow-400" size={24} />
                            <span className="text-yellow-100 font-bold text-xl">+{earnedCoins} PIÈCES</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full max-w-[280px]">
                        <button onClick={resetGame} className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-yellow-400 transition-all shadow-xl flex items-center justify-center gap-2 uppercase italic active:scale-95">
                            <RefreshCw size={20} /> Recommencer
                        </button>
                        <button onClick={() => setInMenu(true)} className="w-full py-4 bg-gray-800 border border-white/10 text-white font-black tracking-widest rounded-2xl active:scale-95 transition-all uppercase italic">
                            Retour à la Carte
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
