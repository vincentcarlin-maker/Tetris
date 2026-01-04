
import React, { useRef, useState, useEffect } from 'react';
import { HiddenObject } from '../types';
import { Crosshair, ImageOff, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface SearchGridProps {
    objects: HiddenObject[];
    onGridClick: (x: number, y: number) => void;
    imageSrc: string;
}

export const SearchGrid: React.FC<SearchGridProps> = ({ objects, onGridClick, imageSrc }) => {
    // Refs & State pour la manipulation de la vue
    const containerRef = useRef<HTMLDivElement>(null); 
    const contentRef = useRef<HTMLDivElement>(null);   
    
    const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs pour la logique de drag vs click
    const dragStartRef = useRef({ x: 0, y: 0 });
    const viewStartRef = useRef({ x: 0, y: 0 });
    const isClickRef = useRef(true);

    // Refs pour le Pinch-to-Zoom (Mobile)
    const lastPinchDistRef = useRef<number | null>(null);
    const lastPinchCenterRef = useRef<{x: number, y: number} | null>(null);

    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(false);
        setImageError(false);
        resetView(); 
    }, [imageSrc]);

    const resetView = () => setView({ scale: 1, x: 0, y: 0 });

    /**
     * Gère le zoom en gardant un point spécifique fixe (focalPoint)
     * Si focalPoint est null, on zoom vers le centre du conteneur.
     */
    const handleZoom = (delta: number, focalPoint?: { x: number, y: number }) => {
        if (!containerRef.current) return;

        setView(prev => {
            const newScale = Math.max(1, Math.min(6, prev.scale + delta)); // Max zoom augmenté à 6x
            
            // Si on revient à 1, on reset tout pour centrer proprement
            if (newScale === 1) return { scale: 1, x: 0, y: 0 };

            // Calcul du point focal (soit la souris/doigts, soit le centre de l'écran)
            const rect = containerRef.current!.getBoundingClientRect();
            const center = focalPoint 
                ? { x: focalPoint.x - rect.left, y: focalPoint.y - rect.top }
                : { x: rect.width / 2, y: rect.height / 2 };

            // Mathématique de stabilisation : 
            // On calcule la position du point focal DANS l'image avant le zoom
            // Et on ajuste x/y pour que ce point reste au même endroit après le zoom
            // Formule : NewPos = Center - ((Center - OldPos) / OldScale) * NewScale
            const newX = center.x - ((center.x - prev.x) / prev.scale) * newScale;
            const newY = center.y - ((center.y - prev.y) / prev.scale) * newScale;

            return { scale: newScale, x: newX, y: newY };
        });
    };

    // --- SOURIS & TOUCH SINGLE (Drag & Click) ---

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!contentRef.current) return;
        if (!e.isPrimary) return; 

        (e.target as Element).setPointerCapture(e.pointerId);
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        viewStartRef.current = { x: view.x, y: view.y };
        isClickRef.current = true;
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // Mise à jour de la position du curseur visuel (crosshair)
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePos({ x, y });
        }

        if (!isDragging || !e.isPrimary) return;

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isClickRef.current = false;
        }

        if (view.scale > 1) {
            setView(prev => ({
                ...prev,
                x: viewStartRef.current.x + dx,
                y: viewStartRef.current.y + dy
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!e.isPrimary) return;
        
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);

        if (isClickRef.current && isLoaded && contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
                onGridClick(x, y);
            }
        }
    };

    // --- MOBILE PINCH ZOOM ---

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            lastPinchDistRef.current = dist;
            lastPinchCenterRef.current = { x: centerX, y: centerY };
            isClickRef.current = false;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
            e.preventDefault(); 

            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const delta = dist - lastPinchDistRef.current;
            const zoomFactor = delta * 0.01; // Facteur un peu plus rapide
            
            // On zoom vers le centre du pincement
            handleZoom(zoomFactor, { x: centerX, y: centerY });
            
            lastPinchDistRef.current = dist;
            lastPinchCenterRef.current = { x: centerX, y: centerY };
        }
    };

    const handleTouchEnd = () => {
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
    };

    const handleImageError = () => {
        setImageError(true);
        setIsLoaded(false);
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative bg-black overflow-hidden flex items-center justify-center touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Contrôles de Zoom (Overlay UI) */}
            {isLoaded && (
                <div className="absolute top-16 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); handleZoom(0.5); }} 
                        className="p-2 bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 active:bg-blue-600 transition-colors shadow-lg"
                    >
                        <ZoomIn size={20}/>
                    </button>
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); handleZoom(-0.5); }} 
                        className="p-2 bg-black/60 backdrop-blur-md text-white rounded-full border border-white/20 active:bg-blue-600 transition-colors shadow-lg"
                    >
                        <ZoomOut size={20}/>
                    </button>
                    {view.scale > 1 && (
                        <button 
                            onPointerDown={(e) => { e.stopPropagation(); resetView(); }} 
                            className="p-2 bg-black/60 backdrop-blur-md text-yellow-400 rounded-full border border-white/20 active:bg-yellow-600 active:text-black transition-colors shadow-lg"
                        >
                            <Maximize size={20}/>
                        </button>
                    )}
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
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                        L'image du niveau est introuvable.
                    </p>
                </div>
            )}

            {/* Conteneur Transformable */}
            {/* NOTE: Suppression de `transition-transform` pour une fluidité 60fps en temps réel */}
            <div
                ref={contentRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`relative w-full h-full will-change-transform origin-top-left ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
                }}
            >
                <img 
                    src={imageSrc} 
                    alt="Arcade Scene" 
                    onLoad={() => { setIsLoaded(true); setImageError(false); }}
                    onError={handleImageError}
                    className={`w-full h-full object-contain pointer-events-none select-none transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transformOrigin: 'center' }} // L'image elle-même reste centrée dans le div conteneur
                />

                {isLoaded && !imageError && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {/* Crosshair Overlay (Desktop Only - suit la souris relative à l'image zoomée) */}
                        <div 
                            className="absolute pointer-events-none transition-transform duration-75 ease-out hidden md:block"
                            style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="relative">
                                <Crosshair size={60 / view.scale} className="text-yellow-400 opacity-90 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                            </div>
                        </div>

                        {/* Target Found Markers */}
                        {objects.filter(obj => obj.found).map((obj) => (
                            <div 
                                key={obj.id}
                                className="absolute flex items-center justify-center animate-pop-fast pointer-events-none"
                                style={{
                                    left: `${obj.x}%`,
                                    top: `${obj.y}%`,
                                    width: `${(obj.radius || 7) * 2.2}%`,
                                    height: `${(obj.radius || 7) * 2.2 * (9/16)}%`, 
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className="absolute inset-0 border-[2px] border-green-400 rounded-full shadow-[0_0_15px_#4ade80] opacity-80 bg-green-500/10" style={{ borderWidth: `${2/view.scale}px` }}></div>
                                <div className="relative z-10 bg-white rounded-full shadow-[0_0_8px_white]" style={{ width: `${6/view.scale}px`, height: `${6/view.scale}px` }}></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
