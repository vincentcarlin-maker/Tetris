import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';

interface SettingsHeaderProps {
    onBack: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onBack }) => {
    const { currency: { t } } = useGlobal();
    return (
        <div className="flex items-center justify-between mb-2">
            <div className="w-10">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-lg"><ArrowLeft size={20} /></button>
            </div>
            <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)] uppercase px-4 py-1 text-center">
                {t.settings}
            </h1>
            <div className="w-10"></div>
        </div>
    );
};