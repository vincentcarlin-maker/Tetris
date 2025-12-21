
import React from 'react';
import { Layers, ArrowRight, ArrowLeft, Megaphone, AlertTriangle } from 'lucide-react';
import { Card as CardType, Color, Turn, FlyingCardData } from './types';
import { Card } from './common/Card';

interface UnoBoardProps {
    // Refs for animation calculations
    discardPileRef: React.RefObject<HTMLDivElement>;
    cpuHandRef: React.RefObject<HTMLDivElement>;
    
    // Game State
    playerHand: CardType[];
    cpuHand: CardType[];
    discardPile: CardType[];
    activeColor: Color;
    turn: Turn;
    playDirection: 1 | -1;
    hasDrawnThisTurn: boolean;
    isAnimating: boolean;
    flyingCard: FlyingCardData | null;
    gameMode: 'SOLO' | 'ONLINE';
    unoShout: Turn | null;
    
    // Interaction
    checkCompatibility: (card: CardType) => boolean;
    onDrawPileClick: (e: React.MouseEvent) => void;
    onDiscardPileClick?: () => void; // Optional if needed for future features
    onPlayerCardClick: (e: React.MouseEvent, card: CardType, index: number) => void;
    
    // Uno Mechanics
    showContestButton: boolean;
    playerCalledUno: boolean;
    onUnoClick: () => void;
    onContestClick: () => void;
}

const COLOR_CONFIG: Record<Color, { text: string, bg: string }> = {
    red: { text: 'text-red-500', bg: 'bg-red-950' },
    blue: { text: 'text-cyan-500', bg: 'bg-cyan-950' },
    green: { text: 'text-green-500', bg: 'bg-green-950' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-950' },
    black: { text: 'text-white', bg: 'bg-gray-900' },
};

export const UnoBoard: React.FC<UnoBoardProps> = ({
    discardPileRef, cpuHandRef,
    playerHand, cpuHand, discardPile, activeColor, turn, playDirection,
    hasDrawnThisTurn, isAnimating, flyingCard, gameMode, unoShout,
    checkCompatibility, onDrawPileClick, onPlayerCardClick,
    showContestButton, playerCalledUno, onUnoClick, onContestClick
}) => {

    const FlyingCardOverlay = () => {
        if (!flyingCard) return null;
        return (
            <div className="fixed z-[100] pointer-events-none" style={{left: 0, top: 0, animation: 'flyCard 0.5s ease-in-out forwards'}}>
                <style>{`@keyframes flyCard { 0% { transform: translate(${flyingCard.startX}px, ${flyingCard.startY}px) scale(1); } 100% { transform: translate(${flyingCard.targetX}px, ${flyingCard.targetY}px) rotate(${flyingCard.rotation}deg) scale(0.8); } }`}</style>
                <Card card={flyingCard.card} style={{ width: '80px', height: '112px' }} />
            </div>
        );
    };

    let spacingClass = '-space-x-12 sm:-space-x-16';
    let rotationFactor = 3; 
    if (playerHand.length <= 5) { spacingClass = '-space-x-6 sm:-space-x-8'; rotationFactor = 5; } 
    else if (playerHand.length <= 10) { spacingClass = '-space-x-12 sm:-space-x-16'; rotationFactor = 3; } 
    else { spacingClass = '-space-x-16 sm:-space-x-24'; rotationFactor = 1.5; }

    return (
        <div className="flex-1 w-full max-w-lg flex flex-col justify-between py-4 relative z-10 min-h-0">
            {/* Ambient Background based on Active Color */}
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-30 pointer-events-none ${COLOR_CONFIG[activeColor].bg}`}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black pointer-events-none"></div>

            <FlyingCardOverlay />

            {/* CPU Hand */}
            <div ref={cpuHandRef} className="flex justify-center -space-x-6 sm:-space-x-8 px-4 overflow-hidden h-32 sm:h-48 items-start pt-4 shrink-0 relative z-10">
                {cpuHand.map((card, i) => (
                    <div key={card.id || i} style={{ transform: `rotate(${(i - cpuHand.length/2) * 5}deg) translateY(${Math.abs(i - cpuHand.length/2) * 2}px)` }}>
                        <Card card={card} faceUp={false} />
                    </div>
                ))}
            </div>

            {/* Center Table */}
            <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 relative min-h-[150px] shrink z-10">
                {/* Direction Indicator */}
                <div className={`absolute pointer-events-none transition-colors duration-500 ${COLOR_CONFIG[activeColor].text} opacity-30 z-0`}>
                    <div className="w-[320px] h-[180px] border-4 border-dashed border-current rounded-[50px] relative flex items-center justify-center">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowRight size={32} /> : <ArrowLeft size={32} />}</div>
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-black px-3">{playDirection === 1 ? <ArrowLeft size={32} /> : <ArrowRight size={32} />}</div>
                    </div>
                </div>

                {/* Draw Pile */}
                <div onClick={onDrawPileClick} className={`relative group z-10 transition-transform ${turn === 'PLAYER' ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 cursor-not-allowed'}`}>
                    <div className="w-20 h-28 sm:w-28 sm:h-40 bg-gray-900 border-2 border-gray-600 rounded-xl flex items-center justify-center shadow-2xl relative">
                        {turn === 'PLAYER' && !hasDrawnThisTurn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>}
                        <Layers size={32} className="text-gray-600" />
                        {turn === 'PLAYER' && <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white ${hasDrawnThisTurn ? 'bg-red-600' : 'bg-black/50'} px-2 py-1 rounded transition-colors`}>{hasDrawnThisTurn ? 'PASSER' : 'PIOCHER'}</div>}
                    </div>
                </div>

                {/* Discard Pile */}
                <div className="relative flex items-center justify-center z-10" ref={discardPileRef}>
                    <div className={`absolute -inset-6 rounded-full blur-2xl opacity-40 transition-colors duration-500 ${COLOR_CONFIG[activeColor].text.replace('text', 'bg')}`}></div>
                    <div className="transform rotate-6 transition-transform duration-300 hover:scale-105 hover:rotate-0 z-10">{discardPile.length > 0 && <Card card={discardPile[discardPile.length-1]} />}</div>
                </div>
            </div>

            {/* Player Hand */}
            <div className={`w-full relative px-4 z-20 ${gameMode === 'ONLINE' ? 'pb-24' : 'pb-4'} min-h-[180px] flex flex-col justify-end shrink-0`}>
                {/* Uno Buttons */}
                <div className="absolute -top-20 left-0 right-0 flex justify-center pointer-events-none z-50 h-20 items-end gap-4">
                    {playerHand.length === 2 && turn === 'PLAYER' && !playerCalledUno && (
                        <button onClick={onUnoClick} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white font-black text-xl px-8 py-3 rounded-full shadow-[0_0_20px_red] animate-bounce transition-all active:scale-95 flex items-center gap-2 border-4 border-yellow-400"><Megaphone size={24} fill="white" /> CRIER UNO !</button>
                    )}
                    {showContestButton && <button onClick={onContestClick} className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-6 py-3 rounded-full shadow-[0_0_20px_yellow] animate-pulse transition-all active:scale-95 flex items-center gap-2 border-4 border-red-600"><AlertTriangle size={24} fill="black" /> CONTRE-UNO !</button>}
                </div>

                {/* Cards */}
                <div className="w-full overflow-x-auto overflow-y-visible no-scrollbar pt-10 pb-4">
                    <div className={`flex w-fit mx-auto px-8 ${spacingClass} items-end min-h-[160px] transition-all duration-500`}>
                        {playerHand.map((card, i) => {
                            if (flyingCard && flyingCard.card.id === card.id) return <div key={card.id} style={{ width: '0px', transition: 'width 0.5s' }}></div>;
                            return (
                                <div key={card.id} style={{ transform: `rotate(${(i - playerHand.length/2) * rotationFactor}deg) translateY(${Math.abs(i - playerHand.length/2) * (rotationFactor * 1.5)}px)`, zIndex: i }} className={`transition-transform duration-300 origin-bottom`}>
                                    <Card 
                                        card={card} 
                                        onClick={(e) => !isAnimating && turn === 'PLAYER' && onPlayerCardClick(e, card, i)} 
                                        isPlayable={turn === 'PLAYER' && !isAnimating && checkCompatibility(card)} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Uno Shout Overlay */}
            {unoShout && <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"><div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 animate-bounce drop-shadow-[0_0_25px_rgba(255,0,0,0.8)] transform -rotate-12">UNO !</div></div>}
        </div>
    );
};
