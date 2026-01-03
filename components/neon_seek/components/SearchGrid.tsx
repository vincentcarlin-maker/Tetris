
import React, { useRef, useState, useEffect } from 'react';
import { HiddenObject } from '../types';
import { Crosshair, ImageOff, Loader2, Target } from 'lucide-react';

interface SearchGridProps {
    objects: HiddenObject[];
    onGridClick: (x: number, y: number) => void;
    imageSrc: string;
}

export const SearchGrid: React.FC<SearchGridProps> = ({ objects, onGridClick, imageSrc }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const activeSrc = imageSrc;

    useEffect(() => {
        setIsLoaded(false);
        setImageError(false);
    }, [activeSrc]);

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current || !isLoaded) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        
        onGridClick(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        });
    };

    const handleImageError = () => {
        setImageError(true);
        setIsLoaded(false);
    };

    return (
        <div 
            ref={containerRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            className="relative w-full max-w-[1200px] aspect-square border-4 border-yellow-500/30 rounded-3xl overflow-hidden cursor-none shadow-[0_0_60px_rgba(250,204,21,0.2)] group bg-gray-900 mx-auto"
        >
            {!isLoaded && !imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-yellow-500/50">
                    <Loader2 size={64} className="animate-spin" />
                    <span className="text-xs font-black tracking-widest uppercase">Initialisation de la scène haute définition...</span>
                </div>
            )}

            {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/80 backdrop-blur-md z-20">
                    <ImageOff size={48} className="text-red-500 mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-white italic uppercase mb-2">Erreur de chargement</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mb-6">
                        L'image du niveau est corrompue ou introuvable.
                    </p>
                </div>
            )}

            <img 
                src={activeSrc} 
                alt="Arcade Scene" 
                onLoad={() => { setIsLoaded(true); setImageError(false); }}
                onError={handleImageError}
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
            />

            {isLoaded && !imageError && (
                <>
                    {/* Crosshair (Desktop Only) */}
                    <div 
                        className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out hidden md:block"
                        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative">
                            <Crosshair size={50} className="text-yellow-400 opacity-80" />
                            <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full"></div>
                        </div>
                    </div>

                    {/* Scanline Effect */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_15px_#facc15] opacity-40 animate-[scan_4s_linear_infinite] pointer-events-none"></div>

                    {/* Found Items Overlays - Version Précision */}
                    {objects.filter(obj => obj.found).map(obj => (
                        <div 
                            key={obj.id}
                            className="absolute flex items-center justify-center animate-pop z-10 pointer-events-none"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                                width: `${obj.radius * 2.2}%`,
                                height: `${obj.radius * 2.2}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Cercle extérieur pulsant */}
                            <div className="absolute inset-0 border-2 border-green-500 rounded-full opacity-40 animate-pulse"></div>
                            
                            {/* Cercle de précision principal */}
                            <div className="absolute inset-[10%] border-2 border-green-400 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                                {/* Mire interne */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400"></div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400"></div>
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400"></div>
                            </div>

                            {/* Label miniature */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter whitespace-nowrap uppercase shadow-lg">
                                Identifié
                            </div>
                        </div>
                    ))}
                </>
            )}

            <style>{`
                @keyframes scan {
                    0% { top: -5%; opacity: 0; }
                    50% { opacity: 0.6; }
                    100% { top: 105%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};
