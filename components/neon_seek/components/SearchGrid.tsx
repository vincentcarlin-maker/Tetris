
import React, { useRef, useState } from 'react';
import { SCENE_IMAGE } from '../constants';
import { HiddenObject } from '../types';
import { Crosshair, ImageOff, Loader2, Upload } from 'lucide-react';

interface SearchGridProps {
    objects: HiddenObject[];
    onGridClick: (x: number, y: number) => void;
}

export const SearchGrid: React.FC<SearchGridProps> = ({ objects, onGridClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

    const activeSrc = customImageSrc || SCENE_IMAGE;

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
        // Si on a déjà essayé une image custom et qu'elle plante aussi, on reste en erreur
        // Sinon, on affiche l'interface d'erreur qui propose l'upload
        setImageError(true);
        setIsLoaded(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setCustomImageSrc(event.target.result as string);
                    setImageError(false);
                    // Le onLoad de l'image mettra isLoaded à true
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div 
            ref={containerRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            className="relative w-full aspect-square max-w-[800px] border-4 border-yellow-500/30 rounded-3xl overflow-hidden cursor-none shadow-[0_0_50px_rgba(250,204,21,0.15)] group bg-gray-900"
        >
            {/* Input caché pour l'upload */}
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
            />

            {/* Spinner de chargement */}
            {!isLoaded && !imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-yellow-500/50">
                    <Loader2 size={48} className="animate-spin" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Initialisation de la scène...</span>
                </div>
            )}

            {/* Message si l'image est manquante avec bouton d'upload */}
            {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/80 backdrop-blur-md z-20">
                    <ImageOff size={48} className="text-red-500 mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-white italic uppercase mb-2">Image non trouvée</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mb-6">
                        Le fichier source n'est pas détecté. Chargez l'image manuellement depuis votre appareil.
                    </p>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <Upload size={16} /> Charger l'image
                    </button>
                </div>
            )}

            {/* L'Image (Source locale ou custom) */}
            <img 
                src={activeSrc} 
                alt="Arcade Scene" 
                onLoad={() => { setIsLoaded(true); setImageError(false); }}
                onError={handleImageError}
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
            />

            {isLoaded && !imageError && (
                <>
                    {/* Viseur Tactique */}
                    <div 
                        className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out hidden md:block"
                        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative">
                            <Crosshair size={40} className="text-yellow-400 opacity-80" />
                            <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                        </div>
                    </div>

                    {/* Scanline Laser */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-400 shadow-[0_0_15px_#facc15] opacity-40 animate-[scan_3s_linear_infinite] pointer-events-none"></div>

                    {/* Cercles de validation */}
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
