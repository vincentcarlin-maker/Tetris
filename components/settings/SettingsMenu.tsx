
import React from 'react';
import { useSettings } from './hooks/useSettings';
import { SettingsHeader } from './components/SettingsHeader';
import { UserProfileCard } from './components/UserProfileCard';
import { LanguageSelector } from './components/LanguageSelector';
import { StyleSettings } from './components/StyleSettings';
import { AudioSettings } from './components/AudioSettings';
import { AccountSettings } from './components/AccountSettings';
import { LegalAndSupport } from './components/LegalAndSupport';
import { DangerZone } from './components/DangerZone';
import { PasswordModal } from './components/PasswordModal';
import { LegalModal } from './components/LegalModal';

interface SettingsMenuProps {
    onBack: () => void;
    onLogout: () => void;
    onOpenDashboard: () => void;
    onOpenContact: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack, onLogout, onOpenDashboard, onOpenContact }) => {
    const { 
        showPasswordModal, setShowPasswordModal, 
        legalTab, setLegalTab,
        passwordState, emailState,
        handleSavePassword, handleSaveEmail, handleDeleteAccount, handleHardReset
    } = useSettings();

    return (
        <div className="flex flex-col h-full w-full bg-black/20 font-sans text-white p-4 overflow-y-auto custom-scrollbar">
            {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} passwordState={passwordState} onSave={handleSavePassword} />}
            {legalTab && <LegalModal legalTab={legalTab} onClose={() => setLegalTab(null)} onSetLegalTab={setLegalTab} />}

            <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pb-24" style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}>
                <SettingsHeader onBack={onBack} />
                <UserProfileCard />
                <LanguageSelector />
                <StyleSettings />
                <AudioSettings />
                <AccountSettings 
                    onLogout={onLogout}
                    onOpenDashboard={onOpenDashboard}
                    onShowPasswordModal={() => setShowPasswordModal(true)}
                    emailState={emailState}
                    onSaveEmail={handleSaveEmail}
                />
                <LegalAndSupport onOpenContact={onOpenContact} onSetLegalTab={setLegalTab} />
                <DangerZone onHardReset={handleHardReset} onDeleteAccount={handleDeleteAccount} />
            </div>
        </div>
    );
};
