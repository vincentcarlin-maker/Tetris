import React from 'react';
import { X, Key, Check } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';

interface PasswordModalProps {
    onClose: () => void;
    passwordState: any;
    onSave: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, passwordState, onSave }) => {
    const { t } = useGlobal().currency;
    const { oldPassword, setOldPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, msg } = passwordState;

    return (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in">
            <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                <h3 className="text-xl font-black text-white italic mb-6 flex items-center gap-2"><Key className="text-neon-pink" size={24}/> {t.edit_password.toUpperCase()}</h3>
                <div className="space-y-4">
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Ancien mot de passe" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-pink outline-none" />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmer" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-neon-blue outline-none" />
                </div>
                {msg && <div className={`mt-4 p-3 rounded-lg text-xs font-bold text-center ${msg.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{msg.text}</div>}
                <button onClick={onSave} className="w-full mt-6 py-3 bg-neon-blue text-black font-black tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)]"><Check size={18} strokeWidth={3}/> VALIDER</button>
            </div>
        </div>
    );
};