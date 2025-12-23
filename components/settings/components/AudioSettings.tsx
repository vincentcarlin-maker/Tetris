import React from 'react';
import { Activity, Volume2, VolumeX, Mic, MicOff, Sliders } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';

export const AudioSettings: React.FC = () => {
    const { audio, currency } = useGlobal();
    const { t } = currency;

    return (
        <SettingsSection icon={Activity} title={t.performance} iconColor="text-neon-yellow">
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${currency.reducedMotion ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/50 text-gray-400'}`}><Sliders size={20}/></div>
                        <div><p className="font-bold text-sm">{t.motion_reduced}</p><p className="text-[10px] text-gray-500">Moins d'effets visuels lourds</p></div>
                    </div>
                    <button onClick={currency.toggleReducedMotion} className={`w-12 h-6 rounded-full relative transition-colors ${currency.reducedMotion ? 'bg-orange-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.reducedMotion ? 'left-7' : 'left-1'}`}></div></button>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${!audio.isMuted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{!audio.isMuted ? <Volume2 size={20}/> : <VolumeX size={20}/>}</div>
                        <div><p className="font-bold text-sm">{t.sound_fx}</p><p className="text-[10px] text-gray-500">Sons d'interface et jeux</p></div>
                    </div>
                    <button onClick={audio.toggleMute} className={`w-12 h-6 rounded-full relative transition-colors ${!audio.isMuted ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${!audio.isMuted ? 'left-7' : 'left-1'}`}></div></button>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${currency.voiceChatEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{currency.voiceChatEnabled ? <Mic size={20}/> : <MicOff size={20}/>}</div>
                        <div><p className="font-bold text-sm">{t.voice_chat}</p><p className="text-[10px] text-gray-500">{t.voice_chat_desc}</p></div>
                    </div>
                    <button onClick={currency.toggleVoiceChat} className={`w-12 h-6 rounded-full relative transition-colors ${currency.voiceChatEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currency.voiceChatEnabled ? 'left-7' : 'left-1'}`}></div></button>
                </div>
            </div>
        </SettingsSection>
    );
};