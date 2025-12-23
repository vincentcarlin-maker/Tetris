import React from 'react';
import { X, ShieldCheck, Gavel } from 'lucide-react';
import { LegalTab } from '../types';

interface LegalModalProps {
    legalTab: LegalTab;
    onClose: () => void;
    onSetLegalTab: (tab: LegalTab) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ legalTab, onClose, onSetLegalTab }) => {
    return (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-gray-900 w-full max-w-xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-col bg-gray-800/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2 italic"><ShieldCheck className="text-neon-blue" /> CENTRE LÉGAL</h3>
                        <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20}/></button>
                    </div>
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl">
                        <button onClick={() => onSetLegalTab('CGU')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'CGU' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}>CGU</button>
                        <button onClick={() => onSetLegalTab('PRIVACY')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'PRIVACY' ? 'bg-neon-pink text-black' : 'text-gray-400 hover:text-white'}`}>RGPD</button>
                        <button onClick={() => onSetLegalTab('MENTIONS')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${legalTab === 'MENTIONS' ? 'bg-neon-yellow text-black' : 'text-gray-400 hover:text-white'}`}>MENTIONS</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-300 leading-relaxed custom-scrollbar">
                    {legalTab === 'CGU' ? (
                        <div className="animate-in slide-in-from-left-4">
                            <h4 className="text-neon-blue font-black uppercase tracking-widest mb-4">Conditions Générales d'Utilisation</h4>
                            <section className="mb-4"><p className="font-bold text-white mb-1">1. Objet</p><p>Neon Arcade fournit des jeux rétro et des fonctionnalités sociales. L'utilisation implique l'acceptation pleine et entière de ces termes.</p></section>
                            <section className="mb-4"><p className="font-bold text-white mb-1">2. Monnaie Virtuelle</p><p>Les "Pièces Néon" sont une monnaie purement fictive. Elles ne peuvent en aucun cas être converties en argent réel. Tout abus ou tentative de triche pourra entraîner une remise à zéro du compte.</p></section>
                            <section className="mb-4"><p className="font-bold text-white mb-1">3. Code de conduite</p><p>Le respect est primordial. Tout comportement harcelant, insultant ou inapproprié dans le chat social pourra entraîner un bannissement définitif de votre compte par les administrateurs.</p></section>
                        </div>
                    ) : legalTab === 'PRIVACY' ? (
                        <div className="animate-in slide-in-from-right-4">
                            <h4 className="text-neon-pink font-black uppercase tracking-widest mb-4">Politique de Confidentialité (RGPD)</h4>
                            <section className="mb-4"><p className="font-bold text-white mb-1">Données collectées :</p><ul className="list-disc pl-5 space-y-1"><li>Pseudo (public) : Pour le classement et le social.</li><li>Email (privé) : Pour la récupération de mot de passe (si fourni).</li><li>Stats de jeu : Scores et inventaire.</li></ul></section>
                            <section className="mb-4"><p className="font-bold text-white mb-1">Vos Droits :</p><p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données via les réglages de l'application.</p></section>
                            <section><p className="font-bold text-white mb-1">Conservation :</p><p>Vos données sont conservées tant que votre compte est actif. Un compte inactif pendant 24 mois pourra être supprimé.</p></section>
                        </div>
                    ) : (
                         <div className="animate-in fade-in">
                            <h4 className="text-neon-yellow font-black uppercase tracking-widest mb-4">Mentions Légales</h4>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                                <p><span className="text-gray-500 uppercase text-[10px] block">Éditeur</span> Neon Arcade Project</p>
                                <p><span className="text-gray-500 uppercase text-[10px] block">Hébergement</span> Supabase Inc. (USA) / Google Cloud</p>
                                <p><span className="text-gray-500 uppercase text-[10px] block">Contact</span> support@neon-arcade.io</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-white/10 bg-gray-800/30">
                    <button onClick={onClose} className="w-full py-3 bg-white text-black font-black tracking-widest rounded-xl hover:bg-neon-blue transition-colors shadow-lg">FERMER</button>
                </div>
            </div>
        </div>
    );
};