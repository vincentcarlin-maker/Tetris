
import { useState, useCallback, useEffect, useRef } from 'react';
import { HIDDEN_OBJECTS, MAX_TIME } from '../constants';
import { HiddenObject, GameState } from '../types';

export const useNeonSeekLogic = (audio: any, addCoins: (a: number) => void, onReportProgress?: any, customObjects?: HiddenObject[]) => {
    
    // Utiliser les objets personnalisés s'ils existent, sinon les défauts
    const initialObjects = (customObjects && customObjects.length > 0) 
        ? customObjects.map(obj => ({ ...obj, found: false })) 
        : HIDDEN_OBJECTS.map(obj => ({ ...obj, found: false }));

    const [state, setState] = useState<GameState>({
        status: 'playing',
        objects: initialObjects,
        startTime: Date.now(),
        foundCount: 0
    });
    
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const timerRef = useRef<any>(null);

    // Mettre à jour l'état si les objets personnalisés changent (nouvelle génération admin)
    useEffect(() => {
        if (customObjects && customObjects.length > 0) {
            setState(prev => ({
                ...prev,
                objects: customObjects.map(obj => ({ ...obj, found: false })),
                foundCount: 0,
                status: 'playing'
            }));
            setTimeLeft(MAX_TIME);
        }
    }, [customObjects]);

    const checkClick = useCallback((clickX: number, clickY: number) => {
        if (state.status !== 'playing') return;

        let foundIdx = -1;
        const newObjects = state.objects.map((obj, idx) => {
            if (obj.found) return obj;
            
            // Calcul de distance simple (pourcentage)
            const dx = Math.abs(clickX - obj.x);
            const dy = Math.abs(clickY - obj.y);
            
            // Utiliser le radius défini par l'IA ou le défaut
            const hitRadius = obj.radius || 7; 
            
            if (dx <= hitRadius && dy <= hitRadius) {
                foundIdx = idx;
                return { ...obj, found: true };
            }
            return obj;
        });

        if (foundIdx !== -1) {
            audio.playVictory();
            const newCount = state.foundCount + 1;
            setState(prev => ({ 
                ...prev, 
                objects: newObjects, 
                foundCount: newCount,
                status: newCount === state.objects.length ? 'gameOver' : 'playing'
            }));

            if (newCount === state.objects.length) {
                const bonus = Math.floor(timeLeft * 2) + 50;
                addCoins(bonus);
                setEarnedCoins(bonus);
                if (onReportProgress) onReportProgress('win', 1);
            }
        } else {
            audio.playWallHit(); // Son d'erreur
        }
    }, [state.objects, state.status, state.foundCount, timeLeft, audio, addCoins, onReportProgress]);

    const resetGame = useCallback(() => {
        // Recharger les objets initiaux (soit custom soit default)
        const objsToUse = (customObjects && customObjects.length > 0) ? customObjects : HIDDEN_OBJECTS;
        
        setState({
            status: 'playing',
            objects: objsToUse.map(obj => ({ ...obj, found: false })),
            startTime: Date.now(),
            foundCount: 0
        });
        setTimeLeft(MAX_TIME);
        setEarnedCoins(0);
        if (onReportProgress) onReportProgress('play', 1);
    }, [customObjects, onReportProgress]);

    useEffect(() => {
        if (state.status === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setState(s => ({ ...s, status: 'gameOver' }));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [state.status, timeLeft]);

    return { state, timeLeft, earnedCoins, checkClick, resetGame };
};
