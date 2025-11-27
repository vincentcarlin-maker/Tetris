
import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, Car, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Layers, Edit2, Check } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
}

// Composant pour le logo stylisé
const ArcadeLogo = () => {
    // Le "A" est remplacé par un joystick d'arcade
    const JoystickA = () => (
        <div className="relative w-[4.5rem] h-[5rem] flex items-center justify-center -mb-2">
            {/* Base du joystick (forme du A) */}
            <div 
                className="w-full h-full bg-gradient-to-t from-neon-blue/50 to-white"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 15% 100%, 50% 25%, 85% 100%, 100% 100%)' }}
            />
            {/* Bâton */}
            <div className="absolute top-[35%] w-1.5 h-1/2 bg-gray-300 rounded-t-full" />
            {/* Boule */}
            <div className="absolute top-[20%] w-6 h-6 rounded-full bg-neon-pink border-2 border-white shadow-[0_0_10px_#ff00ff]" />
        </div>
    );

    return (
        <div className="text-center space-y-0 animate-in fade-in slide-in-from-top-8 duration-700 flex flex-col items-center mb-6">
            {/* NEON: Très lisible, style "Tube Néon Blanc" */}
            <div 
                className="text-8xl font-black italic tracking-widest text-white drop-shadow-[0_0_10px_#00f3ff] relative z-10"
                style={{ textShadow: '0 0 20px rgba(0, 243, 255, 0.8), 0 0 40px rgba(0, 243, 255, 0.4)' }}
            >
                NEON
            </div>
            
            {/* ARCADE: Style Glitch dynamique */}
            <div className="flex items-end justify-center -mt-6 animate-glitch-main opacity-90">
                <JoystickA />
                <span className="glitch text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-purple drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]" data-text="RCADE">RCADE</span>
            </div>
        </div>
    );
};


export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    
    // Username editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(username);
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        audio.resumeAudio(); // Déverrouille le contexte audio, crucial pour iOS
    }, [audio]);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    const handleReload = () => {
        window.location.reload();
    };

    const handleNameSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (tempName.trim()) {
            updateUsername(tempName.trim());
        } else {
            setTempName(username); // Revert if empty
        }
        setIsEditingName(false);
    };
    
    // Récupération des badges possédés
    const ownedBadges = catalog.filter(b => inventory.includes(b.id));

    // Current Avatar
    const currentAvatar = avatarsCatalog.find(a => a.id === currentAvatarId) || avatarsCatalog[0];
    const AvatarIcon = currentAvatar.icon;

    // Calcul des stats pour affichage
    const rushLevelsCompleted = Object.keys(highScores.rush || {}).length;
    const sudokuEasyBest = highScores.sudoku?.easy;
    const sudokuMediumBest = highScores.sudoku?.medium;
    const sudokuHardBest = highScores.sudoku?.hard;
    const breakerHighScore = highScores.breaker || 0;

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-[#0a0a12] overflow-y-auto">
             {/* Background effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black z-0 pointer-events-none"></div>
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>
            
            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                {/* Coin Display */}
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                </div>

                <div className="flex gap-3">
                    {/* Reload Button */}
                    <button 
                        onClick={handleReload} 
                        className="p-2 bg-gray-800/50 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                        title="Actualiser l'application"
                    >
                        <RefreshCw size={20} />
                    </button>

                    {/* Mute Button */}
                    <button 
                        onClick={audio.toggleMute} 
                        className="p-2 bg-gray-800/50 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        {audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-10 mt-12">
                 
                 <ArcadeLogo />

                 {/* CARTE DE PROFIL DU JOUEUR */}
                 <div className="w-full bg-gray-900/40 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-4 backdrop-blur-md relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
                     
                     <div className="flex items-center w-full gap-4 z-10">
                        {/* Avatar */}
                        <div 
                            onClick={() => onSelectGame('shop')}
                            className={`relative w-20 h-20 rounded-xl bg-gradient-to-br ${currentAvatar.bgGradient} p-0.5 shadow-lg cursor-pointer hover:scale-105 transition-transform border border-white/10`}
                        >
                            <div className="w-full h-full bg-black/40 rounded-[10px] flex items-center justify-center backdrop-blur-sm">
                                <AvatarIcon size={40} className={currentAvatar.color} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[10px] text-white px-2 py-0.5 rounded-full border border-white/20">
                                EDIT
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 flex flex-col justify-center">
                            {/* Username Editing */}
                            <div className="flex items-center gap-2 mb-1">
                                {isEditingName ? (
                                    <form onSubmit={handleNameSubmit} className="flex items-center gap-2 w-full">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={() => handleNameSubmit()}
                                            maxLength={12}
                                            className="bg-black/50 border border-neon-blue rounded px-2 py-1 text-white font-bold text-lg w-full outline-none focus:ring-2 ring-neon-blue/50"
                                        />
                                        <button type="submit" className="text-green-400"><Check size={20} /></button>
                                    </form>
                                ) : (
                                    <button 
                                        onClick={() => { setTempName(username); setIsEditingName(true); }}
                                        className="flex items-center gap-2 group/edit"
                                    >
                                        <h2 className="text-2xl font-black text-white italic tracking-wide truncate max-w-[180px]">{username}</h2>
                                        <Edit2 size={14} className="text-gray-500 group-hover/edit:text-white transition-colors" />
                                    </button>
                                )}
                            </div>

                            <span className={`text-xs font-bold tracking-widest uppercase ${playerRank.color}`}>
                                {playerRank.title}
                            </span>
                        </div>
                     </div>

                     {/* Divider */}
                     <div className="w-full h-px bg-white/10" />

                     {/* Mini Galerie des badges */}
                     {ownedBadges.length > 0 ? (
                         <div className="flex gap-3 overflow-x-auto w-full justify-start py-2 no-scrollbar z-10 mask-linear">
                             {ownedBadges.slice().reverse().map(badge => {
                                 const Icon = badge.icon;
                                 return (
                                     <div key={badge.id} className="relative shrink-0 animate-in fade-in zoom-in duration-300">
                                         <div className="w-10 h-10 bg-black/60 rounded-lg border border-white/10 flex items-center justify-center shadow-lg" title={badge.name}>
                                             <Icon size={20} className={badge.color} />
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     ) : (
                         <div className="text-xs text-gray-600 italic py-2 w-full text-center">Joue pour gagner des badges !</div>
                     )}
                 </div>

                 {/* High Scores Panel */}
                 <div className="w-full bg-gray-900/40 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300">
                    <button 
                        onClick={() => setShowScores(s => !s)}
                        className="w-full p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-yellow-400" />
                            <h3 className="text-lg font-bold text-white italic">MEILLEURS SCORES</h3>
                        </div>
                        <ChevronDown size={20} className={`transition-transform ${showScores ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showScores && (
                        <div className="px-4 pb-4 border-t border-white/10 animate-in fade-in duration-300">
                            <div className="py-2">
                                <h4 className="font-bold text-neon-blue">TETRIS NÉON</h4>
                                <p className="text-2xl font-mono">{highScores.tetris?.toLocaleString() || 0}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-neon-pink">NEON BREAKER</h4>
                                <p className="text-2xl font-mono">{breakerHighScore.toLocaleString() || 0}</p>
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-purple-400">NEON RUSH</h4>
                                {rushLevelsCompleted > 0 ? (
                                    <p className="text-sm text-gray-300">{rushLevelsCompleted} niveaux terminés</p>
                                ) : (
                                    <p className="text-sm text-gray-500">Aucun record</p>
                                )}
                            </div>
                            <div className="py-2 border-t border-white/5">
                                <h4 className="font-bold text-cyan-400">NEON SUDOKU</h4>
                                {sudokuEasyBest !== undefined || sudokuMediumBest !== undefined || sudokuHardBest !== undefined ? (
                                    <div className="flex justify-around text-center text-xs mt-1">
                                        <div>
                                            <p className="text-green-400">FACILE</p>
                                            <p className="font-mono text-lg">{sudokuEasyBest ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-yellow-400">MOYEN</p>
                                            <p className="font-mono text-lg">{sudokuMediumBest ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-red-500">DIFFICILE</p>
                                            <p className="font-mono text-lg">{sudokuHardBest ?? '-'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Aucun record</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                 {/* Shop Button */}
                 <button
                    onClick={() => onSelectGame('shop')}
                    className="w-full bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/40 rounded-xl p-4 flex items-center justify-between hover:bg-yellow-600/20 transition-all group active:scale-95 hover:border-yellow-500/80"
                 >
                     <div className="flex items-center gap-4">
                         <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400 group-hover:text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                             <ShoppingBag size={24} />
                         </div>
                         <div className="text-left">
                             <h3 className="text-xl font-black text-yellow-100 italic">BOUTIQUE</h3>
                             <p className="text-xs text-yellow-400/70 font-mono">BADGES & AVATARS</p>
                         </div>
                     </div>
                     <div className="px-4 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-full group-hover:scale-105 transition-transform">
                         OUVRIR
                     </div>
                 </button>

                 <div className="w-full grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                     {/* Tetris Button */}
                     <button
                        onClick={() => onSelectGame('tetris')}
                        className="group relative w-full h-24 bg-gray-900/60 border border-neon-blue/30 hover:border-neon-blue rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-colors shadow-lg">
                                    <Grid3X3 size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-blue transition-colors italic">TETRIS NÉON</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Breaker Button */}
                     <button 
                        onClick={() => onSelectGame('breaker')}
                        className="group relative w-full h-24 bg-gray-900/60 border border-neon-pink/30 hover:border-neon-pink rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg">
                                    <Layers size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic">NEON BREAKER</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Neon Rush Button */}
                     <button 
                        onClick={() => onSelectGame('rush')}
                        className="group relative w-full h-24 bg-gray-900/60 border border-purple-500/30 hover:border-purple-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-lg">
                                    <Car size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-purple-400 transition-colors italic">NEON RUSH</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Niveau</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Connect 4 Button */}
                     <button 
                        onClick={() => onSelectGame('connect4')}
                        className="group relative w-full h-24 bg-gray-900/60 border border-neon-pink/30 hover:border-neon-pink rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg">
                                    <CircleDot size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic">NEON CONNECT</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 30 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Sudoku Button */}
                     <button 
                        onClick={() => onSelectGame('sudoku')}
                        className="group relative w-full h-24 bg-gray-900/60 border border-cyan-500/30 hover:border-cyan-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-[0.98]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors shadow-lg">
                                    <Brain size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-cyan-400 transition-colors italic">NEON SUDOKU</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">
                    v1.7.0 • AVATAR UPDATE
                 </div>
             </div>
        </div>
    );
}
