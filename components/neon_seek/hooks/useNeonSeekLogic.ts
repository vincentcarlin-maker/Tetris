
import { useState, useCallback, useEffect, useRef } from 'react';
import { HIDDEN_OBJECTS, MAX_TIME } from '../constants';
import { HiddenObject, GameState } from '../types';

export const useNeonSeekLogic = (audio: any, addCoins: (a: number) => void, onReportProgress?: any, customObjects?: HiddenObject[]) => {
    
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
    const [lastFoundName, setLastFoundName] = useState<string | null>(null);
    const timerRef = useRef<any>(null);
    const feedbackTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (customObjects && customObjects.length > 0) {
            setState(prev => ({
                ...prev,
                objects: customObjects.map(obj => ({ ...obj, found: false })),
                foundCount: 0,
                status: 'playing'
            }));
            setTimeLeft(MAX_TIME);
            setLastFoundName(null);
        }
    }, [customObjects]);

    const checkClick = useCallback((clickX: number, clickY: number) => {
        if (state.status !== 'playing') return;

        let foundObjName: string | null = null;
        let foundIdx = -1;
        
        const newObjects = state.objects.map((obj, idx) => {
            if (obj.found) return obj;
            
            // CALCUL DE PRÉCISION CIRCULAIRE (Distance Euclidienne)
            const dx = clickX - obj.x;
            const dy = clickY - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // On utilise le rayon exact défini par l'IA
            const hitRadius = obj.radius || 7; 
            
            if (distance <= hitRadius) {
                foundIdx = idx;
                foundObjName = obj.name;
                return { ...obj, found: true };
            }
            return obj;
        });

        if (foundIdx !== -1 && foundObjName) {
            audio.playVictory();
            
            // Déclencher le feedback textuel géant
            setLastFoundName(foundObjName);
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = setTimeout(() => setLastFoundName(null), 1500);

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
            audio.playWallHit();
        }
    }, [state.objects, state.status, state.foundCount, timeLeft, audio, addCoins, onReportProgress]);

    const resetGame = useCallback(() => {
        const objsToUse = (customObjects && customObjects.length > 0) ? customObjects : HIDDEN_OBJECTS;
        
        setState({
            status: 'playing',
            objects: objsToUse.map(obj => ({ ...obj, found: false })),
            startTime: Date.now(),
            foundCount: 0
        });
        setTimeLeft(MAX_TIME);
        setEarnedCoins(0);
        setLastFoundName(null);
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

    return { state, timeLeft, earnedCoins, lastFoundName, checkClick, resetGame };
};
