import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cloudAccounts } from '../lib/cloudAccounts';
import { readLocalProfile } from '../lib/localProfile';
export const CloudLogin: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [mode,setMode] = useState<'LOGIN'|'REGISTER'|'RECOVER'>('LOGIN');
    const [email,setEmail]=useState(''), [username,setUsername]=useState(''), [password,setPassword]=useState(''),[code,setCode]=useState('');
    const [recovery,setRecovery]=useState(cloudAccounts.pendingRecovery());
    const [isRecovered,setIsRecovered]=useState(false);
    const [accepted,setAccepted]=useState(false),[importLocal,setImportLocal]=useState(true);
    const [busy,setBusy]=useState(false),[error,setError]=useState('');
    const submit=async(e:React.FormEvent)=>{
        e.preventDefault();setBusy(true);setError('');
        try {
            if(mode==='LOGIN') { await cloudAccounts.login(email.trim(),password);onClose(); }
            else if(mode==='REGISTER') {
                if(!accepted) throw new Error('Acceptez les conditions pour continuer.');
                setRecovery(await cloudAccounts.register(email.trim(),username.trim(),password,importLocal?readLocalProfile():{}));
            } else { setRecovery(await cloudAccounts.recover(email.trim(),password,code));setIsRecovered(true); }
            setPassword('');
        } catch(cause){setError(cause instanceof Error?cause.message:'Connexion impossible.');}
        finally {setBusy(false);}
    };
    const switchMode=(next:typeof mode)=>{setMode(next);setError('');setPassword('');};
    const input='w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white mt-1';
    return <div className="fixed inset-0 z-[400] flex items-start justify-center bg-black/95 p-5 overflow-y-auto">
        <section role="dialog" aria-modal="true" aria-label="Compte Neon Arcade" className="relative my-auto w-full max-w-sm p-6 bg-gray-900 rounded-2xl text-white">
            {!recovery && <button aria-label="Fermer" onClick={onClose} className="absolute right-3 top-3"><X/></button>}
            <h2 className="text-xl font-black text-neon-blue mb-5">{recovery?'Conserve ce code de secours':mode==='LOGIN'?'Connexion':mode==='REGISTER'?'Créer un compte':'Récupérer mon compte'}</h2>
            {recovery ? <div className="space-y-4">
                <p className="text-sm text-gray-300">Ce code remplace ton mot de passe si tu l’oublies. Conserve-le dans un endroit sûr. Aucun e-mail de récupération ne sera envoyé.</p>
                <textarea aria-label="Code de secours" readOnly value={recovery} className={input+' font-mono select-text'} style={{userSelect:'text',WebkitUserSelect:'text'}}/>
                <button onClick={()=>navigator.clipboard?.writeText(recovery).catch(()=>{})} className="underline">Copier le code</button>
                <button className="block w-full bg-blue-600 rounded-lg p-3 font-bold" onClick={()=>{if(isRecovered){setRecovery('');setIsRecovered(false);switchMode('LOGIN');}else{cloudAccounts.finishRegistration();onClose();}}}>J’ai conservé le code</button>
            </div>:<form onSubmit={submit} className="space-y-4">
                <label className="block">Adresse e-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={input}/></label>
                {mode==='REGISTER'&&<label className="block">Pseudo<input required minLength={3} maxLength={24} autoComplete="nickname" value={username} onChange={e=>setUsername(e.target.value)} className={input}/></label>}
                {mode==='RECOVER'&&<label className="block">Code de secours<input required value={code} onChange={e=>setCode(e.target.value)} className={input} autoComplete="off"/></label>}
                <label className="block">{mode==='RECOVER'?'Nouveau mot de passe':'Mot de passe'}<input type="password" required minLength={mode==='LOGIN'?1:12} maxLength={256} autoComplete={mode==='LOGIN'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className={input}/></label>
                {mode==='REGISTER'&&<>
                    <label className="block text-sm"><input type="checkbox" checked={importLocal} onChange={e=>setImportLocal(e.target.checked)}/> Importer ma progression locale dans ce nouveau compte</label>
                    <label className="block text-sm"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> J’accepte les <a href="legal.html" target="_blank" rel="noreferrer" className="underline">conditions et la confidentialité</a></label>
                </>}
                {error&&<p role="alert" className="text-red-400 text-sm">{error}</p>}
                <button disabled={busy} className="w-full p-3 bg-blue-600 rounded-lg font-bold disabled:opacity-50">{busy?'En cours…':'Valider'}</button>
                <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                    {mode!=='LOGIN'&&<button type="button" onClick={()=>switchMode('LOGIN')}>Connexion</button>}
                    {mode!=='REGISTER'&&<button type="button" onClick={()=>switchMode('REGISTER')}>Créer un compte</button>}
                    {mode==='LOGIN'&&<button type="button" onClick={()=>switchMode('RECOVER')}>Mot de passe oublié</button>}
                </div>
                <p className="text-xs text-gray-400">Le mode invité reste accessible sans compte.</p>
            </form>}
        </section>
    </div>;
};
