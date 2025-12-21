import React from 'react';
import { Database, Download, RefreshCcw } from 'lucide-react';

export const DataSection: React.FC<{ profiles: any[] }> = ({ profiles }) => {
    const exportData = () => {
        const dataStr = JSON.stringify(profiles, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'neon_arcade_backup.json');
        linkElement.click();
    };

    return (
        <div className="max-w-md space-y-4 animate-in fade-in">
            <div className="bg-gray-800 p-6 rounded-xl border border-white/10 flex items-center justify-between">
                <div><h4 className="font-bold">Export Global (JSON)</h4><p className="text-xs text-gray-400">Télécharger la base de données.</p></div>
                <button onClick={exportData} className="px-4 py-2 bg-blue-600 rounded-lg font-bold text-xs flex items-center gap-2"><Download size={14}/> EXPORTER</button>
            </div>
        </div>
    );
};