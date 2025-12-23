import React from 'react';
import { ArrowLeft, Coins } from 'lucide-react';

interface ShopHeaderProps {
    onBack: () => void;
    coins: number;
    activeGroupLabel: string;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ onBack, coins, activeGroupLabel }) => {
    return (
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 z-20 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2.5 bg-gray-800/80 rounded-xl text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)] leading-none">
                        BOUTIQUE
                    </h1>
                    <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] mt-1 uppercase">
                        {activeGroupLabel}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-md">
                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-[0_0_10px_#eab308]">
                    <Coins size={12} className="text-black" fill="black" />
                </div>
                <span className="font-mono font-black text-yellow-100 text-lg">
                    {coins.toLocaleString()}
                </span>
            </div>
        </div>
    );
};
