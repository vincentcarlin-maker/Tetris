
import React from 'react';
import { X, Check, Lock, Palette, ShoppingBag } from 'lucide-react';

interface QuickLockerProps {
    title: string;
    items: any[];
    ownedIds: string[];
    currentId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    onGoToShop?: () => void;
    renderPreview: (item: any) => React.ReactNode;
}

export const QuickLocker: React.FC<QuickLockerProps> = ({ 
    title, items, ownedIds, currentId, onSelect, onClose, onGoToShop, renderPreview 
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-900 w-full max-w-md rounded-[32px] border-2 border-white/10 shadow-2xl overflow-hidden flex flex-col relative max-h-[85vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                    <h3 className="text-xl font-black text-white italic flex items-center gap-2 uppercase tracking-tight">
                        <Palette className="text-neon-accent" /> {title}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        {items.map(item => {
                            const isOwned = ownedIds.includes(item.id);
                            const isSelected = currentId === item.id;
                            
                            return (
                                <button 
                                    key={item.id}
                                    onClick={() => isOwned && onSelect(item.id)}
                                    disabled={!isOwned}
                                    className={`
                                        relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                                        ${isSelected ? 'border-neon-accent bg-neon-accent/10 shadow-[0_0_15px_rgba(var(--neon-accent-rgb),0.3)]' : 
                                          isOwned ? 'border-white/10 bg-gray-800 hover:border-white/30' : 'border-dashed border-white/5 bg-black/20 opacity-50 grayscale'}
                                    `}
                                >
                                    <div className="h-16 flex items-center justify-center">
                                        {renderPreview(item)}
                                    </div>
                                    <div className="text-center w-full">
                                        <p className="text-[10px] font-black text-white truncate uppercase tracking-widest">{item.name}</p>
                                        {!isOwned && <p className="text-[8px] text-gray-500 font-bold mt-1">NON POSSÉDÉ</p>}
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-neon-accent rounded-full flex items-center justify-center text-black">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                    )}
                                    {!isOwned && <Lock size={14} className="absolute top-2 right-2 text-gray-700" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <div className="p-4 border-t border-white/10 bg-gray-800/30 flex flex-col gap-3">
                    {onGoToShop && (
                        <button 
                            onClick={onGoToShop}
                            className="w-full py-3 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 font-black tracking-widest rounded-2xl hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2 uppercase text-xs shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                        >
                            <ShoppingBag size={16}/> Plus de choix en boutique
                        </button>
                    )}
                    <button onClick={onClose} className="w-full py-4 bg-white text-black font-black tracking-widest rounded-2xl hover:bg-neon-accent transition-all shadow-lg uppercase text-sm">
                        Terminer
                    </button>
                </div>
            </div>
        </div>
    );
};
