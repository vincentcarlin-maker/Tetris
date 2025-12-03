
import React from 'react';
import { useCurrency, AVATARS_CATALOG, ACCESSORIES_CATALOG, EquippedAccessories } from '../hooks/useCurrency';

interface AvatarDisplayProps {
    avatarId: string;
    accessories?: EquippedAccessories;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showBackground?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
    avatarId, 
    accessories, 
    size = 'md',
    showBackground = true
}) => {
    const avatar = AVATARS_CATALOG.find(a => a.id === avatarId) || AVATARS_CATALOG[0];
    const BaseIcon = avatar.icon;

    // Resolve Accessories
    const headItem = accessories?.head ? ACCESSORIES_CATALOG.find(a => a.id === accessories.head) : null;
    const eyesItem = accessories?.eyes ? ACCESSORIES_CATALOG.find(a => a.id === accessories.eyes) : null;
    const effectItem = accessories?.effect ? ACCESSORIES_CATALOG.find(a => a.id === accessories.effect) : null;

    // Size classes
    const sizeClasses = {
        sm: 'w-10 h-10 rounded-lg',
        md: 'w-16 h-16 rounded-xl',
        lg: 'w-20 h-20 rounded-2xl',
        xl: 'w-32 h-32 rounded-3xl'
    };
    
    const iconSizes = {
        sm: 18,
        md: 32,
        lg: 40,
        xl: 64
    };

    const containerSize = sizeClasses[size];
    const iconSize = iconSizes[size];

    return (
        <div className={`relative ${containerSize} flex items-center justify-center overflow-hidden shrink-0 ${showBackground ? `bg-gradient-to-br ${avatar.bgGradient} p-0.5 shadow-lg` : ''}`}>
            
            {/* BACKGROUND CONTAINER */}
            <div className={`relative w-full h-full ${showBackground ? 'bg-black/40 backdrop-blur-sm' : ''} flex items-center justify-center overflow-hidden rounded-[inherit]`}>
                
                {/* 1. EFFECT LAYER (Background) */}
                {effectItem && (
                    <div className="absolute inset-0 animate-pulse opacity-60">
                        {/* We render the effect icon large and blurred in background */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 blur-sm ${effectItem.color}`}>
                            <effectItem.icon size={iconSize} />
                        </div>
                    </div>
                )}

                {/* 2. BASE AVATAR */}
                <div className="relative z-10">
                    <BaseIcon size={iconSize} className={avatar.color} />
                </div>

                {/* 3. EYES LAYER */}
                {eyesItem && (
                    <div className={`absolute z-20 top-[35%] left-1/2 -translate-x-1/2 ${eyesItem.color} drop-shadow-md`}>
                        <eyesItem.icon size={iconSize * 0.6} strokeWidth={2.5} />
                    </div>
                )}

                {/* 4. HEAD LAYER */}
                {headItem && (
                    <div className={`absolute z-30 -top-[15%] left-1/2 -translate-x-1/2 ${headItem.color} drop-shadow-lg`}>
                        <headItem.icon size={iconSize * 0.7} strokeWidth={2.5} />
                    </div>
                )}
                
                {/* 5. EFFECT LAYER (Foreground Particles) */}
                {effectItem && effectItem.id === 'acc_sparkles' && (
                    <div className="absolute inset-0 z-40 pointer-events-none">
                        <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-ping"></div>
                        <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-ping delay-300"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
