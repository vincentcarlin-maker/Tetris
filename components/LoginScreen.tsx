import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { requireSupabase } from '../lib/auth';

type Mode = 'LOGIN' | 'REGISTER' | 'FORGOT' | 'NEW_PASS';
interface LoginScreenProps { onCancel?: () => void; recoveryMode?: boolean; }

export const LoginScreen: React.FC<LoginScreenProps> = ({ onCancel, recoveryMode = false }) => {
    const [mode, setMode] = useState<Mode>(recoveryMode ? 'NEW_PASS' : 'LOGIN');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    useEffect(() => { if (recoveryMode) setMode('NEW_PASS'); }, [recoveryMode]);

    const changeMode = (next: Mode) => { setMode(next); setError(''); setMessage(''); setPassword(''); setConfirmPassword(''); };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true); setError(''); setMessage('');
        try {
            const client = requireSupabase();
            const address = email.trim();
            const redirectTo = new URL('./', window.location.href).href;
            if (mode === 'FORGOT') {
                const { error } = await client.auth.resetPasswordForEmail(address, { redirectTo });
                if (error) throw error;
                setMessage("Si un compte correspond à cette adresse, un lien de récupération a été envoyé.");
            } else if (mode === 'NEW_PASS') {
                if (password.length < 12) throw new Error('Utilisez au moins 12 caractères.');
                if (password !== confirmPassword) throw new Error('Les mots de passe ne correspondent pas.');
                const { error } = await client.auth.updateUser({ password });
                if (error) throw error;
                await client.auth.signOut();
                changeMode('LOGIN');
                setMessage('Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.');
            } else if (mode === 'REGISTER') {
                if (!accepted) throw new Error('Vous devez accepter les CGU et la politique de confidentialité.');
                if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(username.trim())) throw new Error('Pseudo : 3 à 24 lettres, chiffres, tirets ou traits de soulignement.');
                if (username.trim().toUpperCase() === 'SYSTEM_CONFIG') throw new Error('Ce pseudo est réservé.');
                if (password.length < 12) throw new Error('Utilisez au moins 12 caractères.');
                const { data, error } = await client.auth.signUp({ email: address, password, options: { data: { username: username.trim() }, emailRedirectTo: redirectTo } });
                if (error) throw error;
                setPassword('');
                if (!data.session) setMessage('Vérifiez votre adresse e-mail pour activer le compte, puis connectez-vous.');
            } else {
                const { error } = await client.auth.signInWithPassword({ email: address, password });
                if (error) throw error;
                setPassword('');
            }
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'La demande a échoué.'); }
        finally { setBusy(false); }
    };
    const fieldClass = 'w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white';
    const title = { LOGIN: 'CONNEXION', REGISTER: 'CRÉER UN COMPTE', FORGOT: 'RÉCUPÉRATION', NEW_PASS: 'NOUVEAU MOT DE PASSE' }[mode];
    return <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 overflow-y-auto">
        <section className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 text-white" aria-label={title}>
            {onCancel && mode !== 'NEW_PASS' && <button onClick={onCancel} aria-label="Fermer" className="absolute top-3 right-3"><X /></button>}
            <h1 className="text-3xl font-black text-neon-blue mb-2">Neon Arcade</h1>
            <h2 className="font-bold mb-6">{title}</h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
                {mode !== 'NEW_PASS' && <label>Adresse e-mail<input className={fieldClass} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
                {mode === 'REGISTER' && <label>Pseudo<input className={fieldClass} required minLength={3} maxLength={24} autoComplete="nickname" value={username} onChange={e => setUsername(e.target.value)} /></label>}
                {mode !== 'FORGOT' && <label>Mot de passe<input className={fieldClass} type="password" required minLength={mode === 'LOGIN' ? 1 : 12} autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>}
                {mode === 'NEW_PASS' && <label>Confirmer<input className={fieldClass} type="password" required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>}
                {mode === 'REGISTER' && <label className="text-xs"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required /> J’accepte les <a href="legal.html#cgu" target="_blank" rel="noreferrer" className="underline">CGU</a> et la <a href="legal.html#privacy" target="_blank" rel="noreferrer" className="underline">politique de confidentialité</a>.</label>}
                {error && <p role="alert" className="text-red-400">{error}</p>}
                {message && <p role="status" className="text-green-400">{message}</p>}
                <button disabled={busy} className="bg-blue-600 rounded-xl p-3 font-bold disabled:opacity-50">{busy ? 'EN COURS…' : mode === 'FORGOT' ? 'ENVOYER LE LIEN' : 'VALIDER'}</button>
            </form>
            {mode !== 'NEW_PASS' && <nav className="flex flex-wrap gap-4 mt-5 text-sm">
                {mode !== 'LOGIN' && <button onClick={() => changeMode('LOGIN')}>Connexion</button>}
                {mode !== 'REGISTER' && <button onClick={() => changeMode('REGISTER')}>Inscription</button>}
                {mode === 'LOGIN' && <button onClick={() => changeMode('FORGOT')}>Mot de passe oublié ?</button>}
            </nav>}
        </section>
    </div>;
};
