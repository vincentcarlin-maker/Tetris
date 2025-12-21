
import React, { useState, useRef, useEffect } from 'react';
import { Tube, PourData } from '../types';
import { isValidMove } from '../logic';
import { WaterSortTube } from './WaterSortTube';
import { useGameAudio } from '../../../hooks/useGameAudio';

interface WaterSortBoardProps {
    tubes: Tube[];
    onMove: (src: number, dst: number) => void;
    isAnimating: boolean;
    setAnimating: (val: boolean) => void;
    showTutorial: boolean;
}

export const WaterSortBoard: React.FC<WaterSortBoardProps> = ({ 
    tubes, onMove, isAnimating, setAnimating, showTutorial 
}) => {
    const [selectedTube, setSelectedTube] = useState<number | null>(null);
    const [pourData, setPourData] = useState<PourData | null>(null);
    
    const tubeRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const { playPaddleHit, playMove, playLand } = useGameAudio();

    // Reset selection if tubes change externally (e.g. undo/reset)
    useEffect(() => { setSelectedTube(null); }, [tubes]);

    const handleTubeClick = (index: number) => {
        if (isAnimating || showTutorial) return;

        if (selectedTube === null) {
            // Select source
            if (tubes[index].length > 0) {
                setSelectedTube(index);
                playPaddleHit();
            }
        } else {
            if (selectedTube === index) {
                setSelectedTube(null); // Deselect
            } else {
                attemptPour(selectedTube, index);
            }
        }
    };

    const attemptPour = (srcIdx: number, dstIdx: number) => {
        const srcTube = tubes[srcIdx];
        const dstTube = tubes[dstIdx];

        if (isValidMove(srcTube, dstTube)) {
            const colorToMove = srcTube[srcTube.length - 1];
            
            // Animation Calculation
            const srcEl = tubeRefs.current[srcIdx];
            const dstEl = tubeRefs.current[dstIdx];
            const containerEl = containerRef.current;

            if (srcEl && dstEl && containerEl) {
                const cRect = containerEl.getBoundingClientRect();
                const sRect = srcEl.getBoundingClientRect();
                const dRect = dstEl.getBoundingClientRect();
                
                setAnimating(true);
                setSelectedTube(null);

                // Center coordinates relative to container
                const srcCenterX = sRect.left - cRect.left + sRect.width / 2;
                const srcCenterY = sRect.top - cRect.top + sRect.height / 2;
                
                const dstCenterX = dRect.left - cRect.left + dRect.width / 2;
                const dstTopY = dRect.top - cRect.top;

                const isRight = dstCenterX > srcCenterX;
                const rotationAngle = isRight ? 50 : -50;
                
                // Calculate rotation pivot offset (approximate spout position)
                const rad = (Math.abs(rotationAngle) * Math.PI) / 180;
                const w = sRect.width;
                const h = sRect.height;
                const insetX = 12; 
                const insetY = 20; 
                
                const ox = isRight ? (w/2 - insetX) : (-w/2 + insetX);
                const oy = -h/2 + insetY;
                
                const angleRad = isRight ? rad : -rad;
                const rx = ox * Math.cos(angleRad) - oy * Math.sin(angleRad);
                const ry = ox * Math.sin(angleRad) + oy * Math.cos(angleRad);

                const desiredSpoutX = dstCenterX; 
                const desiredSpoutY = dstTopY - 20; 

                const targetCenterX = desiredSpoutX - rx;
                const targetCenterY = desiredSpoutY - ry;

                const deltaX = targetCenterX - srcCenterX;
                const deltaY = targetCenterY - srcCenterY;

                setPourData({ 
                    src: srcIdx, 
                    dst: dstIdx, 
                    color: colorToMove, 
                    streamStart: { x: desiredSpoutX, y: desiredSpoutY },
                    streamEnd: { x: dstCenterX, y: dstTopY + 30 },
                    isPouring: false,
                    tiltDirection: isRight ? 'right' : 'left',
                    transformStyle: {
                        transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotationAngle}deg)`,
                        zIndex: 100,
                        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                    }
                });

                // Animation Sequence
                setTimeout(() => {
                    setPourData(prev => prev ? { ...prev, isPouring: true } : null);
                    playMove(); 

                    setTimeout(() => {
                        // Execute Logic Move
                        onMove(srcIdx, dstIdx);
                        setPourData(prev => prev ? { ...prev, isPouring: false } : null);

                        setTimeout(() => {
                            setPourData(null); 
                            setTimeout(() => {
                                setAnimating(false);
                                playLand();
                            }, 400); // Wait for tube to return
                        }, 100); 
                    }, 300); // Pour duration
                }, 500); // Move to position duration
            }
        } else {
            playPaddleHit(); // Invalid
            setSelectedTube(null);
        }
    };

    return (
        <div ref={containerRef} className="flex-1 w-full max-w-lg flex items-center justify-center relative z-10 min-h-0 overflow-visible">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full px-2 pt-8 sm:pt-12">
                {tubes.map((tube, i) => {
                    const isSelected = selectedTube === i;
                    const isPourSource = pourData?.src === i;
                    
                    // Override render of the source tube during animation
                    let style = {};
                    if (isPourSource && pourData) {
                        style = pourData.transformStyle;
                    }

                    return (
                        <WaterSortTube
                            key={i}
                            ref={el => { tubeRefs.current[i] = el; }}
                            tube={tube}
                            index={i}
                            isSelected={isSelected}
                            isPourSource={isPourSource}
                            style={style}
                            onClick={() => handleTubeClick(i)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
