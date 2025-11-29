
import React, { useEffect, useState, useRef } from 'react';
import { Play, Grid3X3, Car, CircleDot, Volume2, VolumeX, Brain, RefreshCw, ShoppingBag, Coins, Trophy, ChevronDown, Layers, Edit2, Check, Ghost, Lock, Sparkles, Ship, BrainCircuit, Download } from 'lucide-react';
import { useGameAudio } from '../hooks/useGameAudio';
import { useCurrency } from '../hooks/useCurrency';
import { useHighScores } from '../hooks/useHighScores';

interface MainMenuProps {
    onSelectGame: (game: string) => void;
    audio: ReturnType<typeof useGameAudio>;
    currency: ReturnType<typeof useCurrency>;
}

// Composant pour le logo stylisé avec manette arcade
const ArcadeLogo = () => {
    return (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-top-8 duration-700 mb-4 relative">
            
            {/* LUMIÈRE PERMANENTE DU LOGO SUR LE MUR DE BRIQUES */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-b from-neon-pink/40 to-neon-blue/40 blur-[60px] rounded-full pointer-events-none -z-10 mix-blend-hard-light opacity-80" />

            {/* 1. THE ARCADE CONTROLLER GRAPHIC */}
            <div className="relative mb-[-25px] z-10 hover:scale-105 transition-transform duration-300 group">
                {/* Panel Body - Removed overflow-hidden to let the joystick ball stick out */}
                <div className="w-48 h-16 bg-gray-900 rounded-2xl border-2 border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15),inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-6 relative">
                    {/* Gloss Effect - Added rounded-2xl to match parent */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                    
                    {/* Joystick (Left) */}
                    <div className="relative flex items-center justify-center w-12 h-12 group-hover:-rotate-12 transition-transform duration-300">
                         {/* Stick Shaft base */}
                         <div className="absolute bottom-1/2 w-3 h-8 bg-gray-600 rounded-full origin-bottom transform -rotate-12 border border-black"></div>
                         {/* Stick Ball */}
                         <div className="absolute bottom-[40%] w-10 h-10 bg-gradient-to-br from-neon-pink via-purple-600 to-purple-900 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] border border-white/20 transform -translate-x-1 -translate-y-2 z-10">
                            <div className="absolute top-2 left-2 w-3 h-2 bg-white/40 rounded-full rotate-45 blur-[1px]"></div>
                         </div>
                         {/* Base socket */}
                         <div className="w-10 h-10 bg-black/50 rounded-full border border-gray-700 shadow-inner"></div>
                    </div>

                    {/* Buttons (Right) */}
                    <div className="grid grid-cols-2 gap-2 transform rotate-6">
                         <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] border border-white/30 animate-pulse"></div>
                         <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] border border-white/30"></div>
                         <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] border border-white/30"></div>
                    </div>
                </div>
            </div>

            {/* 2. THE TEXT LOGO (UPDATED SCRIPT STYLE) */}
            <div className="flex flex-col items-center relative z-20 mt-2">
                 <div 
                    className="font-script text-7xl text-white transform -rotate-6 z-10"
                    style={{ 
                        textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff'
                    }}
                >
                    Neon
                </div>
                <div 
                    className="font-script text-6xl text-neon-pink transform -rotate-3 -mt-4 ml-8"
                    style={{ 
                        textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff'
                    }}
                >
                    Arcade
                </div>
            </div>

        </div>
    );
};


export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame, audio, currency }) => {
    const { coins, inventory, catalog, playerRank, username, updateUsername, currentAvatarId, avatarsCatalog } = currency;
    const { highScores } = useHighScores();
    const [showScores, setShowScores] = useState(false);
    
    // State pour la lumière dynamique (Interaction)
    const [activeGlow, setActiveGlow] = useState<string | null>(null);

    // PWA Install Prompt State
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // Helpers pour gérer l'interaction tactile et souris
    const bindGlow = (color: string) => ({
        onMouseEnter: () => setActiveGlow(color),
        onMouseLeave: () => setActiveGlow(null),
        onTouchStart: () => setActiveGlow(color),
        onTouchEnd: () => setActiveGlow(null)
    });
    
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

    // Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        // Show the install prompt
        installPrompt.prompt();
        // Wait for the user to respond to the prompt
        installPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setInstallPrompt(null);
        });
    };

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
    const pacmanHighScore = highScores.pacman || 0;

    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full p-6 relative overflow-hidden bg-transparent overflow-y-auto">
            {/* Note: bg-transparent here allows the fixed app-background div to show through */}

            {/* Dynamic Ambient Light Reflection on Wall (Interactive Only) */}
            {/* 150vmax ensures it covers the screen even on very long mobile screens, removing the "cut off" look */}
            <div 
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] rounded-full pointer-events-none -z-10 mix-blend-hard-light blur-[80px] transition-all duration-200 ease-out`}
                style={{
                    background: activeGlow ? `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)` : 'none',
                    opacity: activeGlow ? 0.6 : 0
                }}
            />

            {/* Top Bar */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                {/* Coin Display */}
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-100 font-mono font-bold text-lg">{coins.toLocaleString()}</span>
                </div>

                <div className="flex gap-3">
                    {/* Install Button (Visible only if prompt captured) */}
                    {installPrompt && (
                        <button 
                            onClick={handleInstallClick} 
                            className="p-2 bg-neon-pink/20 rounded-full text-neon-pink hover:bg-neon-pink hover:text-white border border-neon-pink/50 backdrop-blur-sm active:scale-95 transition-all animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.4)]"
                            title="Installer l'application"
                        >
                            <Download size={20} />
                        </button>
                    )}

                    {/* Reload Button */}
                    <button 
                        onClick={handleReload} 
                        className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                        title="Actualiser l'application"
                    >
                        <RefreshCw size={20} />
                    </button>

                    {/* Mute Button */}
                    <button 
                        onClick={audio.toggleMute} 
                        className="p-2 bg-gray-900/80 rounded-full text-gray-400 hover:text-white border border-white/10 backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        {audio.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

             <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 py-10 mt-12">
                 
                 <ArcadeLogo />

                 {/* CARTE DE PROFIL DU JOUEUR */}
                 <div 
                    {...bindGlow('rgba(200, 230, 255, 0.8)')}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-4 backdrop-blur-md relative overflow-hidden group shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:ring-1 hover:ring-white/30"
                 >
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
                 <div 
                    {...bindGlow('rgba(250, 204, 21, 0.8)')}
                    className="w-full bg-black/60 border border-white/10 rounded-xl backdrop-blur-md transition-all duration-300 shadow-xl hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] hover:border-yellow-400/50 hover:ring-1 hover:ring-yellow-400/30"
                 >
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
                                <h4 className="font-bold text-yellow-400">NEON PAC</h4>
                                <p className="text-2xl font-mono">{pacmanHighScore.toLocaleString() || 0}</p>
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
                    {...bindGlow('rgba(234, 179, 8, 0.9)')}
                    className="w-full bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/40 rounded-xl p-4 flex items-center justify-between transition-all group active:scale-[0.98] 
                    hover:border-yellow-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:ring-2 hover:ring-yellow-500 hover:bg-yellow-600/20
                    backdrop-blur-md shadow-lg"
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
                     <div className="px-4 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-full group-hover:scale-105 transition-transform shadow-[0_0_15px_#facc15]">
                         OUVRIR
                     </div>
                 </button>

                 <div className="w-full grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                     {/* Tetris Button */}
                     <button
                        onClick={() => onSelectGame('tetris')}
                        {...bindGlow('rgba(0, 243, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-blue/30 rounded-xl overflow-hidden transition-all duration-200 
                        hover:border-neon-blue hover:shadow-[0_0_50px_rgba(0,243,255,0.7)] hover:ring-2 hover:ring-neon-blue
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(0,243,255,1)] active:ring-neon-blue
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-colors shadow-lg group-hover:shadow-[0_0_15px_#00f3ff]">
                                    <Grid3X3 size={28} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-blue transition-colors italic drop-shadow-md">TETRIS NÉON</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-black transition-all group-hover:shadow-[0_0_15px_#00f3ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Breaker Button */}
                     <button 
                        onClick={() => onSelectGame('breaker')}
                        {...bindGlow('rgba(255, 0, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-pink/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-neon-pink hover:shadow-[0_0_50px_rgba(255,0,255,0.7)] hover:ring-2 hover:ring-neon-pink
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(255,0,255,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#ff00ff]">
                                    <Layers size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic drop-shadow-md">NEON BREAKER</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#ff00ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Neon Rush Button */}
                     <button 
                        onClick={() => onSelectGame('rush')}
                        {...bindGlow('rgba(168, 85, 247, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-purple-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-purple-500 hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] hover:ring-2 hover:ring-purple-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(168,85,247,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#a855f7]">
                                    <Car size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-purple-400 transition-colors italic drop-shadow-md">NEON RUSH</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Niveau</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#a855f7]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Connect 4 Button */}
                     <button 
                        onClick={() => onSelectGame('connect4')}
                        {...bindGlow('rgba(255, 0, 255, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-neon-pink/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-neon-pink hover:shadow-[0_0_50px_rgba(255,0,255,0.7)] hover:ring-2 hover:ring-neon-pink
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(255,0,255,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-neon-pink group-hover:bg-neon-pink group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#ff00ff]">
                                    <CircleDot size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-neon-pink transition-colors italic drop-shadow-md">NEON CONNECT</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 30 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#ff00ff]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Sudoku Button */}
                     <button 
                        onClick={() => onSelectGame('sudoku')}
                        {...bindGlow('rgba(6, 182, 212, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-cyan-500 hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] hover:ring-2 hover:ring-cyan-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(6,182,212,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-3 bg-gray-800 rounded-lg text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors shadow-lg group-hover:shadow-[0_0_15px_#06b6d4]">
                                    <Brain size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-cyan-400 transition-colors italic drop-shadow-md">NEON SUDOKU</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> 50 Pièces / Victoire</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all group-hover:shadow-[0_0_15px_#06b6d4]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>
                     
                     {/* Pac-Man (UNLOCKED) */}
                     <button 
                        onClick={() => onSelectGame('pacman')}
                        {...bindGlow('rgba(234, 179, 8, 0.9)')}
                        className="group relative w-full h-24 bg-black/60 border border-yellow-500/30 rounded-xl overflow-hidden transition-all duration-200
                        hover:border-yellow-500 hover:shadow-[0_0_50px_rgba(234,179,8,0.7)] hover:ring-2 hover:ring-yellow-500
                        active:scale-[0.98] active:shadow-[0_0_70px_rgba(234,179,8,1)]
                        backdrop-blur-md"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors shadow-lg group-hover:shadow-[0_0_15px_#facc15]">
                                    <Ghost size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-white tracking-wide group-hover:text-yellow-400 transition-colors italic drop-shadow-md">NEON PAC</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Coins size={10} className="text-yellow-500"/> Gains possibles</span>
                                 </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-all group-hover:shadow-[0_0_15px_#facc15]">
                                <Play size={16} className="ml-1" />
                            </div>
                        </div>
                     </button>

                     {/* Memory (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <Sparkles size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">NEON MEMORY</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>

                     {/* Battleship (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <Ship size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">BATAILLE NAVALE</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>
                     
                     {/* Mastermind (Coming Soon) */}
                     <button 
                        disabled
                        className="group relative w-full h-24 bg-black/30 border border-white/5 rounded-xl overflow-hidden cursor-not-allowed opacity-70 grayscale"
                     >
                        <div className="flex items-center justify-between px-6 h-full relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 shadow-lg">
                                    <BrainCircuit size={28} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-2xl font-black text-gray-400 tracking-wide italic">MASTERMIND</h3>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Lock size={10} /> BIENTÔT DISPONIBLE
                                    </span>
                                </div>
                            </div>
                        </div>
                     </button>

                 </div>
                 
                 <div className="mt-8 text-white font-black text-sm tracking-[0.2em] pb-8 opacity-90 uppercase border-b-2 border-white/20 px-6 drop-shadow-md">
                    v1.8.6 • SUPER BRIGHT EDITION
                 </div>
             </div>
        </div>
    );
}
