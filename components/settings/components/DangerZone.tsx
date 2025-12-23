import React from 'react';
import { Trash2, RefreshCw, UserX } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';

interface DangerZoneProps {
    onHardReset: () => void;
    onDeleteAccount: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ onHardReset, onDeleteAccount }) => {
    const { currency: { t } } = useGlobal();

    return (
        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Trash2 size={16} /> {t.danger_zone}</h3>
            <div className="space-y-3">
                <button onClick={onHardReset} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/40 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={14}/> RÉINITIALISER LES PRÉFÉRENCES LOCALES
                </button>
                <button onClick={onDeleteAccount} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg">
                    <UserX size={16}/> {t.delete_account.toUpperCase()}
                </button>
            </div>
        </div>
    );
};