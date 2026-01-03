
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

    useEffect(() => {
        setIsLoaded(false);
        setImageError(false);
    }, [imageSrc]);

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
            className="w-full h-full relative cursor-none bg-black overflow-hidden flex items-center justify-center"
        >
            {/* FOND IMMERSIF */}
            {isLoaded && !imageError && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={imageSrc} 
                        alt="Blurred background" 
                        className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>
            )}

            {!isLoaded && !imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-yellow-500/50 z-10 bg-black">
                    <Loader2 size={64} className="animate-spin" />
                    <span className="text-xs font-black tracking-widest uppercase italic">Initialisation du secteur de recherche...</span>
                </div>
            )}

            {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black z-20">
                    <ImageOff size={48} className="text-red-500 mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-white italic uppercase mb-2">Signal Interrompu</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mb-6">
                        L'image du niveau est introuvable.
                    </p>
                </div>
            )}

            {/* IMAGE DE JEU PRINCIPALE */}
            <img 
                src={imageSrc} 
                alt="Arcade Scene" 
                onLoad={() => { setIsLoaded(true); setImageError(false); }}
                onError={handleImageError}
                className={`relative z-10 max-w-full max-h-full object-contain select-none pointer-events-none transition-all duration-1000 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />

            {isLoaded && !imageError && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* Crosshair Overlay (Desktop) */}
                    <div 
                        className="absolute pointer-events-none transition-transform duration-75 ease-out hidden md:block"
                        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative">
                            <Crosshair size={60} className="text-yellow-400 opacity-90 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                            <div className="absolute inset-0 bg-yellow-400/10 blur-xl rounded-full"></div>
                        </div>
                    </div>

                    {/* Target Found Markers - Vraiment petits et précis */}
                    {objects.filter(obj => obj.found).map((obj) => (
                        <div 
                            key={obj.id}
                            className="absolute flex items-center justify-center animate-pop-fast pointer-events-none"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                                width: '28px',
                                height: '28px',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Anneau extérieur cible */}
                            <div className="absolute inset-0 border-[1.5px] border-green-400 rounded-full shadow-[0_0_10px_#4ade80] opacity-80"></div>
                            
                            {/* Point central (Bullseye) */}
                            <div className="relative z-10 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
                            
                            {/* Lignes de visée optionnelles pour le look cible */}
                            <div className="absolute h-[1px] w-full bg-green-400/30"></div>
                            <div className="absolute w-[1px] h-full bg-green-400/30"></div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes pop-fast {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    80% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
