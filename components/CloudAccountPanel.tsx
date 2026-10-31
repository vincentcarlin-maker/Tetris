import React, { useEffect, useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { cloudAccounts } from '../lib/cloudAccounts';
export const CloudAccountPanel: React.FC<{ expanded?: boolean }> = ({ expanded = false }) => {
    const { isAuthenticated, currency, setShowLoginModal, handleLogout, syncDataWithCloud, cloudSyncStatus, cloudSyncMessage } = useGlobal();
    const [password,setPassword]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('');
    const [code,setCode]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
    useEffect(()=>{setCode('');setPassword('');setNext('');setConfirm('');setMessage('');},[isAuthenticated,currency.username]);
    const run=async(action:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await action();}catch(error){setMessage(error instanceof Error?error.message:'La demande a échoué.');}finally{setBusy(false);setPassword('');}};
    const statuses:Record<string,string>={local:'Sauvegarde sur cet appareil',loading:'Chargement de votre sauvegarde…',saving:'Sauvegarde en cours…',saved:'Sauvegarde en ligne à jour',error:'Sauvegarde en attente',conflict:'Conflit entre appareils'};
    return <section className="w-full rounded-xl bg-gray-900/80 border border-neon-blue/30 p-4 space-y-3 text-white">
        <h2 className="font-bold">{isAuthenticated?`Compte : ${currency.username}`:'Retrouver ma progression sur mes appareils'}</h2>
        <p role="status" className="text-sm text-gray-300">{statuses[cloudSyncStatus] || statuses.local}</p>
        {cloudSyncMessage&&<p role="alert" className="text-sm text-yellow-300">{cloudSyncMessage}</p>}
        {!isAuthenticated?<>
            <button className="bg-blue-600 px-4 py-2 rounded-lg font-bold" onClick={()=>setShowLoginModal(true)}>Se connecter / créer un compte</button>
            <p className="text-xs text-gray-400">Vous pouvez aussi continuer à jouer sans compte.</p>
        </>:<>
            <div className="flex flex-wrap gap-3 text-sm">
                <button disabled={busy} className="underline" onClick={()=>void run(syncDataWithCloud)}>Sauvegarder maintenant</button>
                <button disabled={busy} className="underline" onClick={()=>{if(window.confirm('Charger la sauvegarde en ligne ? Les changements locaux non sauvegardés seront remplacés.'))void run(()=>cloudAccounts.reload());}}>Recharger la sauvegarde</button>
                <button disabled={busy} className="underline" onClick={()=>void run(async()=>{await handleLogout();})}>Déconnexion</button>
            </div>
            <p className="text-xs text-gray-400">Votre connexion est conservée dans cet onglet pendant 7 jours au maximum.</p>
            {expanded&&<div className="pt-3 border-t border-white/10 space-y-3">
                <label className="block text-sm">Mot de passe actuel<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block w-full bg-black/40 rounded-lg p-3 mt-1"/></label>
                <button disabled={busy||!password} className="underline text-sm disabled:opacity-50" onClick={()=>void run(async()=>{setCode(await cloudAccounts.rotateRecovery(password));})}>Générer un nouveau code de secours</button>
                {code&&<div className="space-y-2"><p className="text-sm text-yellow-200">L’ancien code ne fonctionne plus. Conservez celui-ci.</p><textarea aria-label="Nouveau code de secours" readOnly value={code} className="w-full p-3 rounded-lg bg-black/40 font-mono" style={{userSelect:'text',WebkitUserSelect:'text'}}/><button className="underline" onClick={()=>navigator.clipboard?.writeText(code).catch(()=>{})}>Copier</button></div>}
                <label className="block text-sm">Nouveau mot de passe<input type="password" minLength={12} autoComplete="new-password" value={next} onChange={e=>setNext(e.target.value)} className="block w-full bg-black/40 rounded-lg p-3 mt-1"/></label>
                <label className="block text-sm">Confirmer<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="block w-full bg-black/40 rounded-lg p-3 mt-1"/></label>
                <button disabled={busy||!password||next.length<12||next!==confirm} className="underline text-sm disabled:opacity-50" onClick={()=>void run(async()=>{await syncDataWithCloud();await cloudAccounts.changePassword(password,next);setNext('');setConfirm('');setMessage('Mot de passe changé. Reconnectez-vous.');})}>Changer le mot de passe</button>
                <button disabled={busy||!password} className="block text-red-400 underline text-sm disabled:opacity-50" onClick={()=>{if(window.confirm('Supprimer définitivement ce compte et sa sauvegarde en ligne ?'))void run(()=>cloudAccounts.deleteAccount(password));}}>Supprimer mon compte</button>
            </div>}
        </>}
        {message&&<p role="alert" className="text-sm text-yellow-300">{message}</p>}
    </section>;
};
