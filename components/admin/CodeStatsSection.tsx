
import React, { useState, useEffect, useMemo } from 'react';
import { FileCode, Folder, AlertTriangle, CheckCircle, Search, Terminal, Activity, FileText } from 'lucide-react';

interface FileStat {
    path: string;
    lines: number;
    type: 'TSX' | 'TS' | 'JSON' | 'CSS' | 'HTML';
    size: string;
    lastMod: string;
}

// Simulation des données du projet actuel
const PROJECT_FILES: FileStat[] = [
    { path: 'App.tsx', lines: 320, type: 'TSX', size: '12kb', lastMod: 'Just now' },
    { path: 'index.tsx', lines: 15, type: 'TSX', size: '0.5kb', lastMod: '2d ago' },
    { path: 'types.ts', lines: 45, type: 'TS', size: '1.2kb', lastMod: '5d ago' },
    { path: 'gameHelpers.ts', lines: 80, type: 'TS', size: '2.5kb', lastMod: '5d ago' },
    { path: 'hooks/usePlayer.ts', lines: 90, type: 'TS', size: '3kb', lastMod: '4d ago' },
    { path: 'hooks/useBoard.ts', lines: 110, type: 'TS', size: '3.5kb', lastMod: '4d ago' },
    { path: 'hooks/useGameAudio.ts', lines: 250, type: 'TS', size: '8kb', lastMod: '1d ago' },
    { path: 'hooks/useCurrency.ts', lines: 180, type: 'TS', size: '6kb', lastMod: 'Just now' },
    { path: 'hooks/useMultiplayer.ts', lines: 350, type: 'TS', size: '11kb', lastMod: 'Just now' },
    { path: 'hooks/useSupabase.ts', lines: 120, type: 'TS', size: '4kb', lastMod: '1d ago' },
    { path: 'hooks/useHighScores.ts', lines: 60, type: 'TS', size: '2kb', lastMod: '3d ago' },
    { path: 'hooks/useDailySystem.ts', lines: 150, type: 'TS', size: '5kb', lastMod: '2d ago' },
    { path: 'components/MainMenu.tsx', lines: 180, type: 'TSX', size: '6.5kb', lastMod: 'Just now' },
    { path: 'components/Board.tsx', lines: 40, type: 'TSX', size: '1.5kb', lastMod: '5d ago' },
    { path: 'components/Block.tsx', lines: 85, type: 'TSX', size: '3kb', lastMod: '5d ago' },
    { path: 'components/TetrisGame.tsx', lines: 380, type: 'TSX', size: '14kb', lastMod: '2d ago' },
    { path: 'components/SocialOverlay.tsx', lines: 420, type: 'TSX', size: '15kb', lastMod: '1d ago' },
    { path: 'components/Shop.tsx', lines: 250, type: 'TSX', size: '9kb', lastMod: '2d ago' },
    { path: 'components/SettingsMenu.tsx', lines: 200, type: 'TSX', size: '7kb', lastMod: '3d ago' },
    { path: 'components/AdminDashboard.tsx', lines: 150, type: 'TSX', size: '5kb', lastMod: 'Just now' },
    { path: 'components/ContactOverlay.tsx', lines: 120, type: 'TSX', size: '4kb', lastMod: '4d ago' },
    { path: 'components/LoginScreen.tsx', lines: 190, type: 'TSX', size: '7kb', lastMod: '4d ago' },
    { path: 'components/Tutorials.tsx', lines: 140, type: 'TSX', size: '5kb', lastMod: '2d ago' },
    { path: 'components/snake/SnakeGame.tsx', lines: 350, type: 'TSX', size: '12kb', lastMod: '3d ago' },
    { path: 'components/pacman/PacmanGame.tsx', lines: 410, type: 'TSX', size: '14.5kb', lastMod: '3d ago' },
    { path: 'components/pacman/hooks/usePacmanEngine.ts', lines: 450, type: 'TS', size: '16kb', lastMod: '3d ago' },
    { path: 'components/breaker/BreakerGame.tsx', lines: 150, type: 'TSX', size: '5kb', lastMod: '4d ago' },
    { path: 'components/breaker/hooks/useBreakerLogic.ts', lines: 280, type: 'TS', size: '10kb', lastMod: '4d ago' },
    { path: 'components/invaders/InvadersGame.tsx', lines: 390, type: 'TSX', size: '13kb', lastMod: '5d ago' },
    { path: 'components/connect4/Connect4Game.tsx', lines: 100, type: 'TSX', size: '3.5kb', lastMod: '4d ago' },
    { path: 'components/connect4/hooks/useConnect4Logic.ts', lines: 220, type: 'TS', size: '8kb', lastMod: '4d ago' },
    { path: 'components/sudoku/SudokuGame.tsx', lines: 250, type: 'TSX', size: '9kb', lastMod: '6d ago' },
    { path: 'components/airhockey/AirHockeyGame.tsx', lines: 150, type: 'TSX', size: '5.5kb', lastMod: '2d ago' },
    { path: 'components/airhockey/hooks/useAirHockeyLogic.ts', lines: 280, type: 'TS', size: '10kb', lastMod: '2d ago' },
    { path: 'components/mastermind/MastermindGame.tsx', lines: 180, type: 'TSX', size: '6.5kb', lastMod: '3d ago' },
    { path: 'components/uno/UnoGame.tsx', lines: 160, type: 'TSX', size: '6kb', lastMod: '2d ago' },
    { path: 'components/uno/hooks/useUnoLogic.ts', lines: 420, type: 'TS', size: '15kb', lastMod: '2d ago' },
    { path: 'components/skyjo/SkyjoGame.tsx', lines: 140, type: 'TSX', size: '5kb', lastMod: '1d ago' },
    { path: 'components/skyjo/hooks/useSkyjoLogic.ts', lines: 350, type: 'TS', size: '12kb', lastMod: '1d ago' },
    { path: 'components/arenaclash/ArenaClashGame.tsx', lines: 120, type: 'TSX', size: '4kb', lastMod: '1d ago' },
    { path: 'components/arenaclash/hooks/useArenaLogic.ts', lines: 480, type: 'TS', size: '17kb', lastMod: '1d ago' },
    { path: 'components/runner/RunnerGame.tsx', lines: 130, type: 'TSX', size: '4.5kb', lastMod: '1d ago' },
    { path: 'components/runner/hooks/useRunnerLogic.ts', lines: 380, type: 'TS', size: '13kb', lastMod: '1d ago' },
    { path: 'components/stack/StackGame.tsx', lines: 320, type: 'TSX', size: '11kb', lastMod: '1d ago' },
    { path: 'components/lumen/LumenOrderGame.tsx', lines: 280, type: 'TSX', size: '10kb', lastMod: '2d ago' },
    { path: 'components/slither/SlitherGame.tsx', lines: 100, type: 'TSX', size: '3.5kb', lastMod: '1d ago' },
    { path: 'components/slither/hooks/useSlitherLogic.ts', lines: 350, type: 'TS', size: '12kb', lastMod: '1d ago' },
    { path: 'constants/catalog.ts', lines: 50, type: 'TS', size: '2kb', lastMod: '2d ago' },
    { path: 'constants/gamesConfig.ts', lines: 120, type: 'TS', size: '5kb', lastMod: 'Just now' },
    { path: 'lib/supabaseClient.ts', lines: 180, type: 'TS', size: '6kb', lastMod: '5d ago' },
];

export const CodeStatsSection: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const [scanProgress, setScanProgress] = useState(0);

    // Simulate Scanning Effect
    useEffect(() => {
        let interval: any;
        if (isScanning) {
            interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        setIsScanning(false);
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 5; // Fast scan
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    const filteredFiles = useMemo(() => {
        return PROJECT_FILES.filter(f => f.path.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const totalLines = useMemo(() => PROJECT_FILES.reduce((acc, f) => acc + f.lines, 0), []);
    const heavyFiles = useMemo(() => PROJECT_FILES.filter(f => f.lines > 400).length, []);
    const avgLines = Math.round(totalLines / PROJECT_FILES.length);

    return (
        <div className="flex flex-col h-full animate-in fade-in space-y-4">
            
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Total Lignes</p>
                        <h3 className="text-2xl font-black text-white font-mono">{isScanning ? '...' : totalLines.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Activity size={20}/></div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Fichiers</p>
                        <h3 className="text-2xl font-black text-white font-mono">{isScanning ? '...' : PROJECT_FILES.length}</h3>
                    </div>
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><FileText size={20}/></div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Moyenne / Fichier</p>
                        <h3 className="text-2xl font-black text-white font-mono">{isScanning ? '...' : avgLines}</h3>
                    </div>
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Terminal size={20}/></div>
                </div>
                <div className={`bg-gray-800 p-4 rounded-xl border ${heavyFiles > 0 ? 'border-red-500/30' : 'border-white/10'} flex items-center justify-between`}>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">Fichiers Lourds (>400)</p>
                        <h3 className={`text-2xl font-black font-mono ${heavyFiles > 0 ? 'text-red-400' : 'text-green-400'}`}>{isScanning ? '...' : heavyFiles}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${heavyFiles > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}><AlertTriangle size={20}/></div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un fichier..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-gray-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" 
                    />
                </div>
                <button onClick={() => { setScanProgress(0); setIsScanning(true); }} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold text-xs rounded-lg hover:bg-gray-700 transition-colors border border-white/10">
                    RESCAN
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden flex flex-col relative">
                
                {/* Scan Overlay */}
                {isScanning && (
                    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${scanProgress}%` }}></div>
                        </div>
                        <p className="text-xs font-mono text-blue-400 animate-pulse">ANALYSE DU CODE SOURCE... {scanProgress}%</p>
                    </div>
                )}

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-800 text-gray-400 font-bold uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Nom du Fichier</th>
                                <th className="p-4 text-center">Type</th>
                                <th className="p-4 text-center">Lignes</th>
                                <th className="p-4 text-center">Taille</th>
                                <th className="p-4 text-right">Modifié</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                            {filteredFiles.map((file, i) => {
                                const isHeavy = file.lines > 400;
                                const isModerate = file.lines > 250;
                                
                                return (
                                    <tr key={file.path} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 pl-4 flex items-center gap-3">
                                            {file.type === 'TSX' ? <FileCode size={16} className="text-cyan-400"/> : <FileText size={16} className="text-blue-400"/>}
                                            <span className="text-gray-300 group-hover:text-white">{file.path}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 rounded bg-gray-800 border border-white/10 text-[9px] font-bold text-gray-400">{file.type}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`${isHeavy ? 'text-red-400 font-black' : isModerate ? 'text-yellow-400 font-bold' : 'text-green-400'}`}>
                                                {file.lines}
                                            </span>
                                            {isHeavy && <AlertTriangle size={12} className="inline ml-1 text-red-500"/>}
                                        </td>
                                        <td className="p-3 text-center text-gray-500">{file.size}</td>
                                        <td className="p-3 pr-4 text-right text-gray-600">{file.lastMod}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="text-[10px] text-gray-600 text-center font-mono">
                Codebase Analytics Module v1.0 • Neon Arcade Core
            </div>
        </div>
    );
};
