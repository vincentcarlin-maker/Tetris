
import React from 'react';
import { Home, RefreshCw, Palette, HelpCircle, Zap, Coins, Magnet, Shield, FastForward, Check, Lock, Target, AlertTriangle } from 'lucide-react';
import { SKINS, BIOMES } from '../constants';
import { PowerUpType, Mission, EventType, Biome } from '../types';

interface RunnerUIProps {
    distance: number;
    earnedCoins: number;
    currentBiome: Biome;
    activeEvent: { type: EventType, label: string } | null;
    notification: string | null;
    currentMission: Mission | null;
    missionProgress: number;
    activePowerUps: { [key in PowerUpType]?: number };
    gameOver: boolean;
    isPlaying: boolean;
    showSkinShop: boolean;
    showTutorial: boolean;
    localBalance: number;
    currentSkinId: string;
    ownedSkins: string[];
    
    // Actions
    onBack: () => void;
    onReset: () => void;
    onToggleTutorial: () => void;
    onToggleSkinShop: () => void;
    onBuySkin: (skin: typeof SKINS[0]) => void;
    onEquipSkin: (id: string) => void;
}

export const RunnerUI: React.FC<RunnerUIProps> = ({
    distance, earnedCoins, currentBiome, activeEvent, notification, currentMission, missionProgress,
    activePowerUps, gameOver, isPlaying, showSkinShop, showTutorial, localBalance, currentSkinId, ownedSkins,
    onBack, onReset, onToggleTutorial, onToggleSkinShop, onBuySkin, onEquipSkin
}) => {
    
    const BiomeIcon = () => {
        // Simple icon mapping or just return null if icons are handled elsewhere/generic
        return <div className="w-3 h-3 rounded-full" style={{backgroundColor: currentBiome.color}}></div>;
    };

    return (
        <>
            {/* Mission HUD */}
            {currentMission && !gameOver && !showTutorial && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs flex flex-col items-center animate-in slide-in-from-top-4 duration-500 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 mb-1 shadow-lg">
                        <Target size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-white tracking-widest">{currentMission.description}</span>
                    </div>
                    <div className="w-40 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${missionProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in fade-in duration-300">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <span className="text-xl font-black italic text-white tracking-widest whitespace-nowrap">{notification}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-lg flex items-center justify-between z-10 mb-4 shrink-0 pointer-events-none">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 pointer-events-auto active:scale-95 transition-transform"><Home size={20} /></button>
                <div className="flex flex-col items-center"><h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)] pr-2 pb-1">NEON RUN</h1></div>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); onToggleTutorial(); }} className="p-2 bg-gray-800 rounded-lg text-cyan-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><HelpCircle size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleSkinShop(); }} className="p-2 bg-gray-800 rounded-lg text-yellow-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><Palette size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><RefreshCw size={20} /></button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="w-full max-w-lg flex justify-between items-center px-4 mb-2 z-10 pointer-events-none">
                <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-bold tracking-widest">DISTANCE</span><span className="text-2xl font-mono font-bold text-white">{Math.floor(distance)} m</span></div>
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><BiomeIcon/> {currentBiome.name}</div>
                    {activeEvent && <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/50 animate-pulse"><AlertTriangle size={10} className="text-red-400"/><span className="text-[9px] text-red-100 font-bold">{activeEvent.label}</span></div>}
                </div>
                <div className="flex flex-col items-end"><div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30"><Coins className="text-yellow-400" size={16} /><span className="text-yellow-100 font-bold font-mono">{earnedCoins}</span></div></div>
            </div>

            {/* Active PowerUps */}
            <div className="w-full max-w-lg flex gap-2 justify-center mb-2 z-10 h-8 pointer-events-none">
                {activePowerUps.magnet && <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded border border-blue-500 text-blue-400 text-xs font-bold animate-pulse"><Magnet size={14} /> MAGNET</div>}
                {activePowerUps.shield && <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded border border-green-500 text-green-400 text-xs font-bold animate-pulse"><Shield size={14} /> BOUCLIER</div>}
                {activePowerUps.boost && <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded border border-orange-500 text-orange-400 text-xs font-bold animate-pulse"><FastForward size={14} /> BOOST</div>}
            </div>

            {/* Start Prompt Overlay */}
            {!isPlaying && !gameOver && !showSkinShop && !showTutorial && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
                    <Zap size={48} className="text-orange-400 animate-pulse mb-2"/><p className="text-orange-400 font-bold tracking-widest animate-pulse">APPUYEZ POUR SAUTER</p>
                </div>
            )}

            {/* Skin Shop Modal */}
            {showSkinShop && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border-2 border-yellow-500/50 shadow-2xl p-6 relative flex flex-col" onClick={e => e.stopPropagation()}>
                        <button onClick={onToggleSkinShop} className="absolute top-4 right-4 text-gray-400 hover:text-white"><RefreshCw className="rotate-45" size={24} /></button>
                        <h2 className="text-2xl font-black text-white italic mb-1 flex items-center gap-2"><Palette className="text-yellow-400"/> SKINS</h2>
                        <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm mb-6 bg-black/40 w-fit px-3 py-1 rounded-full border border-yellow-500/20"><Coins size={14} /> Solde: {localBalance}</div>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                            {SKINS.map(skin => {
                                const isOwned = ownedSkins.includes(skin.id);
                                const isEquipped = currentSkinId === skin.id;
                                const canAfford = localBalance >= skin.cost;
                                return (
                                    <div key={skin.id} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${isEquipped ? 'border-green-500 bg-green-900/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/10 bg-gray-800/50'}`}>
                                        <div className="w-12 h-12 rounded-lg shadow-lg mb-1" style={{ backgroundColor: skin.color, boxShadow: `0 0 15px ${skin.color}` }}></div>
                                        <div className="text-center w-full"><p className="font-bold text-xs text-white truncate">{skin.name}</p>{!isOwned && <p className="text-[10px] text-yellow-400 font-mono flex items-center justify-center gap-1"><Coins size={10}/> {skin.cost}</p>}</div>
                                        {isOwned ? (
                                            <button onClick={() => onEquipSkin(skin.id)} disabled={isEquipped} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${isEquipped ? 'bg-green-600 text-white cursor-default' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>{isEquipped ? <><Check size={12}/> ÉQUIPÉ</> : 'CHOISIR'}</button>
                                        ) : (
                                            <button onClick={() => onBuySkin(skin)} disabled={!canAfford} className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${canAfford ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>{canAfford ? 'ACHETER' : <><Lock size={10}/> BLOQUÉ</>}</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={onToggleSkinShop} className="mt-6 w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700">RETOUR AU JEU</button>
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {gameOver && !showTutorial && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md z-50 animate-in zoom-in fade-in p-6 pointer-events-auto">
                    <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-orange-600 mb-6 italic drop-shadow-[0_0_25px_rgba(239,68,68,0.6)] pr-4">CRASH !</h2>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-white/10 mb-6 w-full max-w-[200px] text-center backdrop-blur-sm"><p className="text-gray-400 text-xs font-bold tracking-widest mb-1">DISTANCE FINALE</p><p className="text-4xl font-mono text-white drop-shadow-md">{Math.floor(distance)} m</p></div>
                    {earnedCoins > 0 && <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse"><Coins className="text-yellow-400" size={20} /><span className="text-yellow-100 font-bold">+{earnedCoins} PIÈCES</span></div>}
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="px-8 py-3 bg-orange-500 text-black font-black tracking-widest text-lg rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2 pointer-events-auto"><RefreshCw size={20} /> REJOUER</button>
                </div>
            )}
        </>
    );
};
