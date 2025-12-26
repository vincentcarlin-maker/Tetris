
import { useState, useCallback, useEffect, useRef } from 'react';
import { HIDDEN_OBJECTS, MAX_TIME } from '../constants';
import { HiddenObject, GameState } from '../types';

export const useNeonSeekLogic = (audio: any, addCoins: (a: number) => void, onReportProgress?: any) => {
    const [state, setState] = useState<GameState>({
        status: 'playing',
        objects: HIDDEN_OBJECTS.map(obj => ({ ...obj })),
        startTime: Date.now(),
        foundCount: 0
    });
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [earnedCoins, setEarnedCoins] = useState(0);

    const timerRef = useRef<any>(null);

    const checkClick = useCallback((clickX: number, clickY: number) => {
        if (state.status !== 'playing') return;

        let foundIdx = -1;
        const newObjects = state.objects.map((obj, idx) => {
            if (obj.found) return obj;
            
            const dx = Math.abs(clickX - obj.x);
            const dy = Math.abs(clickY - obj.y);
            
            if (dx <= obj.radius && dy <= obj.radius) {
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
                status: newCount === HIDDEN_OBJECTS.length ? 'gameOver' : 'playing'
            }));

            if (newCount === HIDDEN_OBJECTS.length) {
                const bonus = Math.floor(timeLeft * 2) + 50;
                addCoins(bonus);
                setEarnedCoins(bonus);
                if (onReportProgress) onReportProgress('win', 1);
            }
        } else {
            audio.playWallHit(); // Son d'erreur
        }
    }, [state, timeLeft, audio, addCoins, onReportProgress]);

    const resetGame = useCallback(() => {
        setState({
            status: 'playing',
            objects: HIDDEN_OBJECTS.map(obj => ({ ...obj })),
            startTime: Date.now(),
            foundCount: 0
        });
        setTimeLeft(MAX_TIME);
        setEarnedCoins(0);
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

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
