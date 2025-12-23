import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    icon: LucideIcon;
    color: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon: Icon, color }) => (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-2">
        <div className={`p-2 rounded-lg bg-gray-900 border border-white/10 ${color}`}>
            <Icon size={18} />
        </div>
        <h3 className="font-black italic text-lg uppercase tracking-widest text-white">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
    </div>
);
