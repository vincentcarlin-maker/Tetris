import React from 'react';
import { SettingsHeader } from './settings/components/SettingsHeader';
import { UserProfileCard } from './settings/components/UserProfileCard';
import { LanguageSelector } from './settings/components/LanguageSelector';
import { StyleSettings } from './settings/components/StyleSettings';
import { AudioSettings } from './settings/components/AudioSettings';
export const GuestSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="h-full overflow-y-auto p-4 text-white">
        <div className="max-w-lg mx-auto flex flex-col gap-6 pt-6 pb-28">
            <SettingsHeader onBack={onBack} />
            <p className="rounded-xl border border-neon-blue/30 p-4 text-sm text-gray-300">Mode invité : vos scores, pièces et préférences sont enregistrés dans ce navigateur. Effacer les données du navigateur les supprime. Ils ne sont pas synchronisés entre appareils.</p>
            <UserProfileCard />
            <LanguageSelector />
            <StyleSettings />
            <AudioSettings />
            <a href="legal.html" target="_blank" rel="noreferrer" className="underline text-gray-400">Conditions et confidentialité</a>
        </div>
    </div>
);
