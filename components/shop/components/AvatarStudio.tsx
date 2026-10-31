import React from 'react';
import { Check, RotateCcw, User } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { AvatarPortrait } from '../../AvatarPortrait';
import { AVATAR_ACCESSORIES, AVATAR_SLOT_LABELS, CHARACTER_SPRITES, EMPTY_AVATAR_EQUIPMENT, type AvatarSlot } from '../../../lib/avatarCustomization';
export const AvatarStudio: React.FC = () => {
    const {currency,isAuthenticated,cloudSyncStatus}=useGlobal();
    const equipment=currency.avatarEquipment;
    const current=currency.avatarsCatalog.find(item=>item.id===currency.currentAvatarId);
    const isCharacter=!!CHARACTER_SPRITES[currency.currentAvatarId];
    return <section className="py-4 space-y-5" aria-label="Personnaliser mon avatar">
        <div><h2 className="text-2xl font-black text-cyan-300">Mon avatar</h2><p className="text-sm text-gray-400 mt-1">Choisis ton personnage, puis compose son style. Ce premier pack est gratuit.</p></div>
        <div className="sticky top-0 z-20 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-indigo-950 via-gray-900 to-purple-950 p-4 flex flex-col items-center gap-3">
            <AvatarPortrait avatarId={currency.currentAvatarId} equipment={equipment} fallback={current?.icon} size={192}/>
            <p className="font-black text-lg">{current?.name || 'Mon personnage'}</p>
            <p className="text-xs text-gray-400" role="status">{isAuthenticated ? cloudSyncStatus==='saving'?'Sauvegarde en cours…':cloudSyncStatus==='saved'?'Style sauvegardé en ligne':'Le compte sauvegarde aussi ce style.' : 'Style enregistré sur cet appareil'}</p>
        </div>
        <fieldset><legend className="font-bold mb-3">1. Personnage</legend><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(CHARACTER_SPRITES).map(([id,item])=><button key={id} aria-label={`Choisir ${item.name}`} aria-pressed={currency.currentAvatarId===id} onClick={()=>currency.selectAvatar(id)} className={`rounded-2xl p-2 border-2 bg-gray-900/70 transition-colors ${currency.currentAvatarId===id?'border-cyan-300':'border-white/10 hover:border-white/30'}`}>
                <AvatarPortrait avatarId={id} size="100%" className="aspect-square"/>
                <span className="flex justify-center items-center gap-1 mt-1 text-sm font-bold">{item.name}{currency.currentAvatarId===id&&<Check size={14}/>}</span>
            </button>)}
        </div></fieldset>
        {!isCharacter&&<p className="text-sm text-yellow-300">Choisis un des quatre personnages pour porter des accessoires.</p>}
        {(['head','eyes','neck'] as AvatarSlot[]).map(slot=><fieldset key={slot} disabled={!isCharacter}><legend className="font-bold mb-3">{AVATAR_SLOT_LABELS[slot]}</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button aria-pressed={!equipment[slot]} onClick={()=>currency.equipAvatarAccessory(slot,null)} className={`min-h-24 rounded-xl p-3 border flex flex-col items-center justify-center gap-2 disabled:opacity-40 ${!equipment[slot]?'border-cyan-300 bg-cyan-950/30':'border-white/10 bg-gray-900/70'}`}><User size={28}/><span className="text-sm">Sans accessoire</span></button>
                {AVATAR_ACCESSORIES.filter(item=>item.slot===slot).map(item=><button key={item.id} aria-label={item.name} aria-pressed={equipment[slot]===item.id} onClick={()=>currency.equipAvatarAccessory(slot,item.id)} className={`rounded-xl p-2 border transition-colors ${equipment[slot]===item.id?'border-cyan-300 bg-cyan-950/30':'border-white/10 bg-gray-900/70'}`}>
                    <AvatarPortrait avatarId={currency.currentAvatarId} equipment={{...equipment,[slot]:item.id}} size="100%" className="aspect-square"/>
                    <span className="text-xs font-bold">{item.name}</span>
                </button>)}
            </div>
        </fieldset>)}
        <button onClick={()=>currency.setAvatarEquipment(EMPTY_AVATAR_EQUIPMENT)} className="flex items-center gap-2 text-sm text-gray-300 underline"><RotateCcw size={15}/>Retirer tous les accessoires</button>
    </section>;
};
