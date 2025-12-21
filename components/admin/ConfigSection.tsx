import React from 'react';
import { Settings, Volume2, ToggleRight } from 'lucide-react';

export const ConfigSection: React.FC = () => (
    <div className="max-w-xl space-y-6 animate-in fade-in">
        <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Settings size={18}/> PARAMÈTRES SYSTÈME</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3"><Volume2 className="text-gray-400"/><div className="text-sm font-bold">Audio par défaut</div></div>
                    <ToggleRight className="text-green-500" size={24}/>
                </div>
            </div>
        </div>
    </div>
);