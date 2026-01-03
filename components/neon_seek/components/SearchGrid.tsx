
import React, { useRef, useState, useEffect } from 'react';
import { HiddenObject } from '../types';
import { Crosshair, ImageOff, Loader2 } from 'lucide-react';

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
        // Reset state si la source change
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
            className="relative w-full aspect-square max-w-[800px] border-4 border-yellow-500/30 rounded-3xl overflow-hidden cursor-none shadow-[0_0_50px_rgba(250,204,21,0.15)] group bg-gray-900"
        >
            {!isLoaded && !imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-yellow-500/50">
                    <Loader2 size={48} className="animate-spin" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Initialisation de la scène...</span>
                </div>
            )}

            {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/80 backdrop-blur-md z-20">
                    <ImageOff size={48} className="text-red-500 mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-white italic uppercase mb-2">Erreur de chargement</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mb-6">
                        L'image du niveau est corrompue ou introuvable. L'administrateur doit en générer une nouvelle.
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
                    <div 
                        className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out hidden md:block"
                        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative">
                            <Crosshair size={40} className="text-yellow-400 opacity-80" />
                            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                        </div>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-400 shadow-[0_0_15px_#facc15] opacity-40 animate-[scan_3s_linear_infinite] pointer-events-none"></div>

                    {objects.filter(obj => obj.found).map(obj => (
                        <div 
                            key={obj.id}
                            className="absolute border-2 border-green-500 rounded-lg animate-pop shadow-[0_0_15px_#22c55e] z-10"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                                width: `${obj.radius * 2}%`,
                                height: `${obj.radius * 2}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="absolute -top-5 left-0 bg-green-500 text-black text-[7px] font-black px-1 py-0.5 rounded tracking-tighter whitespace-nowrap uppercase">
                                Match Found
                            </div>
                        </div>
                    ))}
                </>
            )}

            <style>{`
                @keyframes scan {
                    0% { top: -5%; opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { top: 105%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};
