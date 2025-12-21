
import { useState, useCallback } from 'react';
import { Tube } from '../types';
import { TUBE_CAPACITY } from '../constants';
import { generateLevelTubes, isLevelSolved } from '../logic';
import { useHighScores } from '../../../hooks/useHighScores';
import { useGameAudio } from '../../../hooks/useGameAudio';

export const useWaterSortLogic = (
    addCoins: (amount: number) => void,
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void
) => {
    const { highScores, updateHighScore } = useHighScores();
    const maxUnlockedLevel = Math.max(1, highScores.watersort || 1);
    
    const [currentLevel, setCurrentLevel] = useState<number>(maxUnlockedLevel);
    const [tubes, setTubes] = useState<Tube[]>([]);
    const [history, setHistory] = useState<Tube[][]>([]);
    const [levelComplete, setLevelComplete] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [extraTubeUsed, setExtraTubeUsed] = useState(false);

    const initLevel = useCallback((lvl: number) => {
        setTubes(generateLevelTubes(lvl));
        setHistory([]);
        setLevelComplete(false);
        setEarnedCoins(0);
        setExtraTubeUsed(false);
        if (onReportProgress) onReportProgress('play', 1);
    }, [onReportProgress]);

    const executeMove = (srcIdx: number, dstIdx: number) => {
        setHistory(prev => [...prev, tubes]);
        
        const newTubes = tubes.map(t => [...t]);
        const srcTube = newTubes[srcIdx];
        const dstTube = newTubes[dstIdx];
        const colorToMove = srcTube[srcTube.length - 1];

        // Move all continuous segments of the same color
        while (
            srcTube.length > 0 && 
            srcTube[srcTube.length - 1] === colorToMove && 
            dstTube.length < TUBE_CAPACITY
        ) {
            dstTube.push(srcTube.pop()!);
        }
        
        setTubes(newTubes);

        if (isLevelSolved(newTubes)) {
            setLevelComplete(true);
            const coins = 20 + Math.floor(currentLevel / 2);
            addCoins(coins);
            setEarnedCoins(coins);
            
            if (currentLevel === maxUnlockedLevel) {
                updateHighScore('watersort', maxUnlockedLevel + 1);
            }
            if (onReportProgress) {
                onReportProgress('win', 1);
                onReportProgress('action', 1);
            }
        }
    };

    const undoMove = () => {
        if (history.length === 0 || levelComplete) return false;
        const previousState = history[history.length - 1];
        setTubes(previousState);
        setHistory(prev => prev.slice(0, -1));
        return true;
    };

    const addExtraTube = () => {
        setTubes(prev => [...prev, []]);
        setExtraTubeUsed(true);
    };

    const nextLevel = () => {
        const next = currentLevel + 1;
        setCurrentLevel(next);
        initLevel(next);
    };

    const setLevel = (lvl: number) => {
        setCurrentLevel(lvl);
        initLevel(lvl);
    };

    return {
        currentLevel,
        maxUnlockedLevel,
        tubes,
        history,
        levelComplete,
        earnedCoins,
        extraTubeUsed,
        executeMove,
        undoMove,
        addExtraTube,
        nextLevel,
        setLevel,
        restartLevel: () => initLevel(currentLevel)
    };
};
