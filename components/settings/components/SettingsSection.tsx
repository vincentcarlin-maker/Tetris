import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
    icon: LucideIcon;
    title: string;
    iconColor: string;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ icon: Icon, title, iconColor, children }) => {
    return (
        <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2`}><Icon size={16} className={iconColor} /> {title}</h3>
            {children}
        </div>
    );
};