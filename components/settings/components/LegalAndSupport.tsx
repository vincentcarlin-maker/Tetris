import React from 'react';
import { HelpCircle, Gavel, Mail, FileText } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';
import { LegalTab } from '../types';

interface LegalAndSupportProps {
    onOpenContact: () => void;
    onSetLegalTab: (tab: LegalTab) => void;
}

export const LegalAndSupport: React.FC<LegalAndSupportProps> = ({ onOpenContact, onSetLegalTab }) => {
    const { currency: { t } } = useGlobal();

    return (
        <>
            <SettingsSection icon={HelpCircle} title={t.support} iconColor="text-neon-blue">
                <button onClick={onOpenContact} className="w-full py-3 bg-neon-blue/10 border border-neon-blue/30 hover:bg-neon-blue/20 text-neon-blue rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                    <Mail size={18} /> {t.contact.toUpperCase()}
                </button>
            </SettingsSection>
            <SettingsSection icon={Gavel} title={t.legal} iconColor="text-white">
                <div className="flex flex-col gap-3">
                    <button onClick={() => onSetLegalTab('CGU')} className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all">
                        <FileText size={16} className="text-neon-blue" /> CONSULTER LES CGU / RGPD
                    </button>
                </div>
            </SettingsSection>
        </>
    );
};