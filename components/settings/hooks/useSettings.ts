// Fix: Import React to use the 'React' namespace for types like React.FormEvent.
import React, { useState, useRef } from 'react';
import { useGlobal } from '../../../context/GlobalContext';
import { DB, isSupabaseConfigured } from '../../../lib/supabaseClient';
import { requireSupabase } from '../../../lib/auth';
import { LegalTab } from '../types';

export const useSettings = () => {
    const { currency, audio, handleLogout } = useGlobal();
    
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState(currency.email);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const handleSavePassword = async () => {
        if (newPassword.length < 12) { setMsg({ text: 'Utilisez au moins 12 caractères.', type: 'error' }); return; }
        if (newPassword !== confirmPassword) { setMsg({ text: 'Les mots de passe ne correspondent pas.', type: 'error' }); return; }
        try {
            const client = requireSupabase();
            const { data: { user }, error: userError } = await client.auth.getUser();
            if (userError || !user?.email) throw new Error('Session expirée.');
            const { error: signInError } = await client.auth.signInWithPassword({ email: user.email, password: oldPassword });
            if (signInError) throw new Error("L'ancien mot de passe est incorrect.");
            const { error } = await client.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            setMsg({ text: 'Mot de passe modifié !', type: 'success' });
        } catch (error) { setMsg({ text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.', type: 'error' }); }
    };

    const handleSaveEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tempEmail.trim();
        if (trimmed && !trimmed.includes('@')) {
            alert("Veuillez entrer une adresse e-mail valide.");
            return;
        }
        try {
            const { error } = await requireSupabase().auth.updateUser({ email: trimmed });
            if (error) throw error;
            setIsEditingEmail(false);
            alert('Vérifiez vos e-mails pour confirmer la modification.');
        } catch (error) { alert(error instanceof Error ? error.message : 'Modification impossible.'); }
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.prompt('Pour supprimer votre compte et ses données, tapez votre pseudo :');
        if (confirmation !== currency.username) return;
        try {
            await DB.deleteUser(currency.username);
            // Do not synchronize here: the account has just been removed.
            await requireSupabase().auth.signOut({ scope: 'local' });
            localStorage.removeItem('neon-username');
            window.location.reload();
        } catch (error) { alert(error instanceof Error ? error.message : 'Suppression impossible.'); }
    };

    const handleHardReset = () => {
        if (window.confirm("Ceci va effacer vos préférences locales (audio, thème, vibration). Vos données de jeu sont en sécurité sur le cloud. Continuer ?")) {
            localStorage.removeItem('neon-accent-color');
            localStorage.removeItem('neon-reduced-motion');
            localStorage.removeItem('neon-vibration');
            localStorage.removeItem('neon_privacy');
            localStorage.removeItem('neon-language');
            window.location.reload();
        }
    };
    
    return {
        showPasswordModal, setShowPasswordModal,
        legalTab, setLegalTab,
        passwordState: { oldPassword, setOldPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, msg, setMsg },
        emailState: { isEditingEmail, setIsEditingEmail, tempEmail, setTempEmail, emailInputRef },
        handleSavePassword, handleSaveEmail, handleDeleteAccount, handleHardReset,
    };
};