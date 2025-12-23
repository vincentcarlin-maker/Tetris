import React from 'react';
import { Lock, Key, Mail, Check, X, Shield } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';
import { SettingsSection } from './SettingsSection';

interface AccountSettingsProps {
    onLogout: () => void;
    onOpenDashboard: () => void;
    onShowPasswordModal: () => void;
    emailState: { isEditingEmail: boolean, setIsEditingEmail: (v: boolean) => void, tempEmail: string, setTempEmail: (v: string) => void, emailInputRef: React.RefObject<HTMLInputElement> };
    onSaveEmail: (e?: React.FormEvent) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ 
    onLogout, onOpenDashboard, onShowPasswordModal, emailState, onSaveEmail 
}) => {
    const { currency } = useGlobal();
    const { t, username, isSuperUser, adminModeActive, toggleAdminMode } = currency;

    return (
        <SettingsSection icon={Lock} title={t.account} iconColor="text-white">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Utilisateur</p>
                        <p className="text-lg font-black text-white">{username}</p>
                    </div>
                    <button onClick={onLogout} className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold transition-all">DECO</button>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 p-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Mail size={10}/> Adresse E-mail</span>
                        {!emailState.isEditingEmail && (
                            <button onClick={() => { emailState.setIsEditingEmail(true); emailState.setTempEmail(currency.email); }} className="text-neon-blue text-[10px] font-bold uppercase hover:underline">
                                {currency.email ? 'Modifier' : 'Ajouter'}
                            </button>
                        )}
                    </div>
                    {emailState.isEditingEmail ? (
                        <form onSubmit={onSaveEmail} className="flex gap-2 mt-2">
                            <input 
                                ref={emailState.emailInputRef}
                                type="email" 
                                value={emailState.tempEmail} 
                                onChange={e => emailState.setTempEmail(e.target.value)} 
                                placeholder="votre@email.com"
                                className="flex-1 bg-gray-800 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-blue"
                                autoFocus
                            />
                            <button type="submit" className="p-1 text-green-400 hover:bg-green-400/20 rounded transition-colors"><Check size={18}/></button>
                            <button type="button" onClick={() => emailState.setIsEditingEmail(false)} className="p-1 text-red-400 hover:bg-red-400/20 rounded transition-colors"><X size={18}/></button>
                        </form>
                    ) : (
                        <p className={`text-sm font-bold ${currency.email ? 'text-white' : 'text-gray-600 italic'}`}>
                            {currency.email || 'Aucune adresse associée'}
                        </p>
                    )}
                </div>

                <button onClick={onShowPasswordModal} className="w-full py-3 bg-gray-800 border border-white/10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-gray-300 active:scale-95 transition-all"><Key size={16}/> {t.edit_password.toUpperCase()}</button>
                
                {isSuperUser && (
                    <div className="mt-2 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-red-400">GOD MODE (ADMIN)</span>
                            <button onClick={toggleAdminMode} className={`w-12 h-6 rounded-full relative transition-colors ${adminModeActive ? 'bg-red-500' : 'bg-gray-600'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${adminModeActive ? 'left-7' : 'left-1'}`}></div></button>
                        </div>
                        <button onClick={onOpenDashboard} className="w-full py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg font-bold text-xs">OUVRIR DASHBOARD</button>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
};