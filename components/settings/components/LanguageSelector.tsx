import React from 'react';
import { Languages } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';

export const LanguageSelector: React.FC = () => {
    const { currency: { t, language, setLanguage } } = useGlobal();

    return (
        <SettingsSection icon={Languages} title={t.language} iconColor="text-neon-green">
            <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
                <button 
                    onClick={() => setLanguage('fr')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'fr' ? 'bg-neon-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    FRANÇAIS
                </button>
                <button 
                    onClick={() => setLanguage('en')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-neon-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    ENGLISH
                </button>
            </div>
        </SettingsSection>
    );
};