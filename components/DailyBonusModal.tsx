
import React from 'react';
import { Coins, Calendar, Check, Star } from 'lucide-react';

interface DailyBonusModalProps {
    streak: number;
    reward: number;
    onClaim: () => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ streak, reward, onClaim }) => {
    return (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col relative">
                
                {/* Confetti Effect (Simple CSS dots) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute top-10 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                </div>

                <div className="bg-gradient-to-b from-yellow-900/50 to-transparent p-6 text-center border-b border-yellow-500/20">
                    <h2 className="text-3xl font-black italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] mb-2">BONUS DU JOUR !</h2>
                    <p className="text-yellow-100 font-bold tracking-widest text-sm">REVIENS CHAQUE JOUR POUR GAGNER PLUS</p>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                    
                    {/* Streak Days Row */}
                    <div className="flex justify-between w-full gap-2 overflow-x-auto no-scrollbar py-2">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const day = i + 1;
                            const isPast = day < streak;
                            const isToday = day === streak;
                            
                            return (
                                <div key={day} className={`flex flex-col items-center justify-center min-w-[40px] h-16 rounded-lg border relative ${
                                    isToday ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_#facc15] scale-110 z-10' :
                                    isPast ? 'bg-green-900/50 border-green-500/50 text-green-400' :
                                    'bg-gray-800 border-white/10 text-gray-500'
                                }`}>
                                    <span className="text-[10px] font-bold mb-1">J{day}</span>
                                    {isPast ? <Check size={16} /> : <Coins size={16} />}
                                    {day === 7 && !isPast && !isToday && <Star size={10} className="absolute top-1 right-1 text-yellow-200" />}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col items-center animate-bounce">
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm">
                            +{reward}
                        </div>
                        <div className="text-yellow-500 font-bold tracking-[0.3em] text-sm mt-[-5px]">PIÈCES</div>
                    </div>

                    <button 
                        onClick={onClaim}
                        className="w-full py-4 bg-yellow-500 text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:bg-white hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Coins size={24} fill="black" /> RÉCUPÉRER
                    </button>
                </div>
            </div>
        </div>
    );
};
