import React, { useState } from 'react';
import { Calendar, Plus, Zap, Trophy, Star, Users, Trash2 } from 'lucide-react';
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const EventsSection: React.FC<{ mp: any }> = ({ mp }) => {
    const [events, setEvents] = useState<any[]>(() => JSON.parse(localStorage.getItem('neon_admin_events') || '[]'));

    const toggleEvent = (id: string) => {
        const updated = events.map(e => e.id === id ? { ...e, active: !e.active } : e);
        setEvents(updated);
        localStorage.setItem('neon_admin_events', JSON.stringify(updated));
        mp.sendAdminBroadcast("Sync Events", "sync_events", updated);
        if (isSupabaseConfigured) DB.saveSystemConfig({ events: updated });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">ÉVÉNEMENTS PLANIFIÉS</h3>
                <button className="px-4 py-2 bg-green-600 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14}/> CRÉER</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(evt => (
                    <div key={evt.id} className="bg-gray-800 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white">{evt.title}</h4>
                            <button onClick={() => toggleEvent(evt.id)} className={`px-2 py-1 rounded text-[10px] font-bold ${evt.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{evt.active ? 'ACTIF' : 'INACTIF'}</button>
                        </div>
                        <p className="text-xs text-gray-400">{evt.description}</p>
                        <div className="mt-4 flex gap-2"><button className="flex-1 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs font-bold">ÉDITER</button><button className="p-1.5 bg-red-600/20 text-red-400 rounded"><Trash2 size={14}/></button></div>
                    </div>
                ))}
            </div>
        </div>
    );
};