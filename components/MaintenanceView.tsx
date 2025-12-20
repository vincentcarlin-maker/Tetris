
import React from 'react';
import { Construction, AlertTriangle, ArrowLeft, ShieldAlert, ZapOff } from 'lucide-react';

interface MaintenanceViewProps {
    onBack: () => void;
    gameName: string;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onBack, gameName }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#020202] p-6 text-center animate-in fade-in duration-500 relative overflow-hidden">
            {/* Effet de fond néon rouge diffus */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Grille de fond style cyber */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="z-10 max-w-md w-full">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="bg-gray-900 p-6 rounded-3xl border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] relative">
                        <ZapOff size={64} className="text-red-500 animate-bounce" />
                    </div>
                </div>

                <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] uppercase">
                    Terminal Verrouillé
                </h1>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 backdrop-blur-md">
                    <p className="text-red-400 font-bold text-sm tracking-widest uppercase mb-1">Maintenance en cours</p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                        L'accès au module <span className="text-white font-black italic">{gameName}</span> a été temporairement suspendu par l'administration système pour optimisation.
                    </p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={onBack}
                        className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                        <ArrowLeft size={20} strokeWidth={3} /> RETOUR AU HUB
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-[10px] font-mono tracking-widest uppercase">
                        <ShieldAlert size={12} /> Status: Restricted Access
                    </div>
                </div>
            </div>
        </div>
    );
};
