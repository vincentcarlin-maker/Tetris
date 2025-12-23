import React, { useMemo } from 'react';
import { Palette } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';

const ACCENT_COLORS = [
    { name: 'Standard', hex: 'default' }, { name: 'Bleu', hex: '#00f3ff' }, { name: 'Rose', hex: '#ff00ff' }, 
    { name: 'Violet', hex: '#9d00ff' }, { name: 'Jaune', hex: '#ffe600' }, { name: 'Vert', hex: '#00ff9d' },
];

export const StyleSettings: React.FC = () => {
    const { currency } = useGlobal();
    const { t, accentColor, updateAccentColor } = currency;
    
    const selectedColorName = useMemo(() => {
        return ACCENT_COLORS.find(c => c.hex === accentColor)?.name || 'Thématique';
    }, [accentColor]);

    return (
        <SettingsSection icon={Palette} title={t.style} iconColor="text-neon-pink">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Accentuation</span>
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{selectedColorName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                        {ACCENT_COLORS.map(c => (
                            <button 
                                key={c.hex} 
                                onClick={() => updateAccentColor(c.hex)}
                                title={c.name}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                style={{ 
                                    background: c.hex === 'default' 
                                        ? 'conic-gradient(from 0deg, #00f3ff, #ff00ff, #9d00ff, #00f3ff)' 
                                        : c.hex, 
                                    boxShadow: accentColor === c.hex && c.hex !== 'default' ? `0 0 10px ${c.hex}` : 'none' 
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
};