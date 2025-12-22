
import { useState, useEffect } from 'react';

export interface PWAState {
    isIOS: boolean;
    isAndroid: boolean;
    isStandalone: boolean;
    canInstall: boolean;
    installPrompt: any;
}

export const usePWA = () => {
    const [state, setState] = useState<PWAState>({
        isIOS: false,
        isAndroid: false,
        isStandalone: false,
        canInstall: false,
        installPrompt: null,
    });

    useEffect(() => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        const isAndroid = /Android/.test(ua);
        
        // Vérifie si l'application est déjà lancée en mode "app" (standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;

        setState(prev => ({ ...prev, isIOS, isAndroid, isStandalone }));

        const handler = (e: any) => {
            // Empêche Chrome d'afficher son propre prompt
            e.preventDefault();
            setState(prev => ({ ...prev, canInstall: true, installPrompt: e }));
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const triggerInstall = async () => {
        if (state.installPrompt) {
            state.installPrompt.prompt();
            const { outcome } = await state.installPrompt.userChoice;
            if (outcome === 'accepted') {
                setState(prev => ({ ...prev, canInstall: false, installPrompt: null }));
            }
        }
    };

    return { ...state, triggerInstall };
};
