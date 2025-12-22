
import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Info, ArrowRight } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const InstallGuide: React.FC = () => {
    const { isIOS, isAndroid, isStandalone, canInstall, triggerInstall } = usePWA();
    const [isVisible, setIsVisible] = useState(true);

    // On ne montre rien si déjà installé ou si l'utilisateur a fermé la bannière
    if (isStandalone || !isVisible) return null;
    
    // Si on est sur PC et que Chrome ne propose pas d'install, on ne montre pas forcément le guide mobile
    if (!isIOS && !isAndroid && !canInstall) return null;

    return (
        <div className="w-full max-w-md mx-auto mb-6 animate-in slide-in-from-top-4 fade-in duration-700">
            <div className="bg-gray-900/60 backdrop-blur-xl border-2 border-neon-blue/30 rounded-3xl p-5 relative overflow-hidden shadow-[0_0_30px_rgba(0,243,255,0.15)] group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                
                <button 
                    onClick={() => setIsVisible(false)} 
                    className="absolute top-3 right-3 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-20"
                >
                    <X size={14} />
                </button>

                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-neon-blue/20 rounded-2xl text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                        <Smartphone size={24} />
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-white italic tracking-widest uppercase mb-1">Passer en mode App</h4>
                        <p className="text-[11px] text-gray-400 font-medium leading-tight mb-4">
                            {isIOS 
                                ? "Jouez en plein écran et profitez de l'expérience arcade complète sur votre iPhone." 
                                : "Installez Neon Arcade sur votre écran d'accueil pour un accès instantané."}
                        </p>

                        {isIOS ? (
                            <div className="space-y-2 bg-black/40 rounded-2xl p-3 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-lg text-white">
                                        <Share size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300">1. Appuyez sur <span className="text-white italic">Partager</span> en bas du navigateur</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-lg text-white">
                                        <PlusSquare size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300">2. Sélectionnez <span className="text-white italic">Sur l'écran d'accueil</span></span>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={triggerInstall}
                                className="w-full py-3 bg-neon-blue text-black font-black text-xs tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-95 animate-pulse-fast"
                            >
                                <Download size={16} /> TÉLÉCHARGER L'APP
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
