// Fix: Import React to use the 'React' namespace for types like React.FormEvent.
import React, { useState, useRef } from 'react';
import { useGlobal } from '../../../context/GlobalContext';
import { DB, isSupabaseConfigured } from '../../../lib/supabaseClient';
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
        const currentStored = localStorage.getItem('neon_current_password');
        if (oldPassword !== currentStored) { setMsg({ text: "L'ancien mot de passe est incorrect.", type: 'error' }); return; }
        if (newPassword.length < 4) { setMsg({ text: "Le nouveau mot de passe est trop court.", type: 'error' }); return; }
        if (newPassword !== confirmPassword) { setMsg({ text: "Les mots de passe ne correspondent pas.", type: 'error' }); return; }

        try {
            localStorage.setItem('neon_current_password', newPassword);
            if (isSupabaseConfigured) await DB.updateUserData(currency.username, { password: newPassword });
            setMsg({ text: "Mot de passe modifié !", type: 'success' });
            setTimeout(() => { setShowPasswordModal(false); setMsg(null); }, 1500);
        } catch (e) { setMsg({ text: "Erreur lors de la sauvegarde.", type: 'error' }); }
    };

    const handleSaveEmail = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tempEmail.trim();
        if (trimmed && !trimmed.includes('@')) {
            alert("Veuillez entrer une adresse e-mail valide.");
            return;
        }
        currency.updateEmail(trimmed);
        if (isSupabaseConfigured) await DB.updateUserData(currency.username, { email: trimmed });
        setIsEditingEmail(false);
        audio.playVictory();
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.prompt("⚠️ ACTION IRRÉVERSIBLE ⚠️\nPour supprimer votre compte et TOUTES vos données (scores, achats, pièces), tapez votre pseudo ci-dessous :");
        if (confirmation === currency.username) {
            if (isSupabaseConfigured) await DB.deleteUser(currency.username);
            alert("Compte supprimé. Au revoir !");
            handleLogout();
        } else if (confirmation !== null) {
            alert("Pseudo incorrect. Annulation.");
        }
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