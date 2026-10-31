import React from 'react';
import { CloudAccountPanel } from './CloudAccountPanel';
import { SettingsHeader } from './settings/components/SettingsHeader';
import { UserProfileCard } from './settings/components/UserProfileCard';
import { LanguageSelector } from './settings/components/LanguageSelector';
import { StyleSettings } from './settings/components/StyleSettings';
import { AudioSettings } from './settings/components/AudioSettings';
export const GuestSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="h-full overflow-y-auto p-4 text-white">
        <div className="max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-28">
            <SettingsHeader onBack={onBack} />
            <p className="rounded-xl border border-neon-blue/30 p-4 text-sm text-gray-300">Sans compte, votre progression est conservée dans ce navigateur. Connectez-vous pour retrouver votre sauvegarde sur vos appareils. Effacer les données du navigateur supprime la progression invitée.</p>
            <CloudAccountPanel expanded />
            <UserProfileCard />
            <LanguageSelector />
            <StyleSettings />
            <AudioSettings />
            <a href="legal.html" target="_blank" rel="noreferrer" className="underline text-gray-400">Conditions et confidentialité</a>
        </div>
    </div>
);
