import React from 'react';
import { Coins, Banknote, User, TrendingUp, Trophy } from 'lucide-react';

export const EconomySection: React.FC<{ profiles: any[], setProfiles: any, mp: any }> = ({ profiles }) => {
    const totalCoins = profiles.reduce((acc, p) => acc + (p.data?.coins || 0), 0);
    const topRich = [...profiles].sort((a, b) => (b.data?.coins || 0) - (a.data?.coins || 0)).slice(0, 10);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">MASSE MONÉTAIRE</p>
                    <div className="flex items-center gap-2"><Coins className="text-yellow-400"/><span className="text-3xl font-black">{totalCoins.toLocaleString()}</span></div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">MOYENNE / JOUEUR</p>
                    <div className="flex items-center gap-2"><User className="text-green-400"/><span className="text-3xl font-black">{profiles.length ? Math.round(totalCoins / profiles.length).toLocaleString() : 0}</span></div>
                </div>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 bg-gray-800 font-bold flex items-center gap-2"><Trophy size={18} className="text-yellow-400"/> TOP 10 FORTUNES</div>
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-white/5">
                        {topRich.map((p, i) => (
                            <tr key={p.username} className="hover:bg-white/5">
                                <td className="p-4 font-mono text-gray-500">#{i+1}</td>
                                <td className="p-4 font-bold">{p.username}</td>
                                <td className="p-4 text-right font-bold text-yellow-400">{p.data?.coins?.toLocaleString()} <Coins size={14} className="inline"/></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};