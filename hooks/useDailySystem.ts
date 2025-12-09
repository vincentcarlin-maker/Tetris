
import { useState, useEffect, useCallback } from 'react';

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestMetric = 'play' | 'score' | 'win' | 'action' | 'coins';

export interface DailyQuest {
    id: string;
    description: string;
    reward: number;
    gameId: string; // 'tetris', 'snake', 'any', etc.
    metric: QuestMetric;
    target: number;
    progress: number;
    isCompleted: boolean;
    isClaimed: boolean;
    difficulty: QuestDifficulty;
}

const QUEST_TEMPLATES: { difficulty: QuestDifficulty, templates: Omit<DailyQuest, 'id' | 'progress' | 'isCompleted' | 'isClaimed' | 'difficulty'>[] }[] = [
    {
        difficulty: 'EASY',
        templates: [
            { description: "Jouer une partie de Tetris", gameId: 'tetris', metric: 'play', target: 1, reward: 50 },
            { description: "Manger 5 pommes au Snake", gameId: 'snake', metric: 'action', target: 5, reward: 50 },
            { description: "Gagner 50 pièces", gameId: 'any', metric: 'coins', target: 50, reward: 50 },
            { description: "Jouer au Casse-Briques", gameId: 'breaker', metric: 'play', target: 1, reward: 50 },
            { description: "Faire 5 paires au Memory", gameId: 'memory', metric: 'action', target: 5, reward: 50 },
        ]
    },
    {
        difficulty: 'MEDIUM',
        templates: [
            { description: "Score 2000 points à Tetris", gameId: 'tetris', metric: 'score', target: 2000, reward: 100 },
            { description: "Atteindre le niveau 3 à Breaker", gameId: 'breaker', metric: 'action', target: 3, reward: 100 },
            { description: "Gagner une partie de Uno", gameId: 'uno', metric: 'win', target: 1, reward: 100 },
            { description: "Couler 2 navires (Bataille)", gameId: 'battleship', metric: 'action', target: 2, reward: 100 },
            { description: "Gagner 150 pièces", gameId: 'any', metric: 'coins', target: 150, reward: 100 },
        ]
    },
    {
        difficulty: 'HARD',
        templates: [
            { description: "Score 10000 points à Tetris", gameId: 'tetris', metric: 'score', target: 10000, reward: 250 },
            { description: "Survivre 2 min à Pacman", gameId: 'pacman', metric: 'action', target: 120, reward: 250 }, // 120 sec
            { description: "Gagner 3 parties en ligne", gameId: 'any', metric: 'win', target: 3, reward: 300 },
            { description: "Finir un Sudoku (Moyen)", gameId: 'sudoku', metric: 'win', target: 1, reward: 250 },
            { description: "Score 500 points au Snake", gameId: 'snake', metric: 'score', target: 500, reward: 250 },
        ]
    }
];

export const useDailySystem = (addCoins: (amount: number) => void) => {
    const [streak, setStreak] = useState(0);
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [todaysReward, setTodaysReward] = useState(0);
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [allCompletedBonusClaimed, setAllCompletedBonusClaimed] = useState(false);

    // Helper to get today's date string YYYY-MM-DD
    const getTodayString = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        const storedLastLogin = localStorage.getItem('neon_last_login');
        const storedStreak = parseInt(localStorage.getItem('neon_streak') || '0', 10);
        const storedQuests = localStorage.getItem('neon_daily_quests');
        const storedDate = localStorage.getItem('neon_quests_date');
        const storedBonus = localStorage.getItem('neon_bonus_claimed');

        const today = getTodayString();

        // --- LOGIN BONUS LOGIC ---
        if (storedLastLogin !== today) {
            let newStreak = 1;
            if (storedLastLogin) {
                const lastDate = new Date(storedLastLogin);
                const currDate = new Date(today);
                const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    newStreak = Math.min(storedStreak + 1, 7);
                }
            }
            setStreak(newStreak);
            const baseReward = 50;
            const bonus = newStreak * 20;
            setTodaysReward(baseReward + bonus);
            setShowDailyModal(true);
            localStorage.setItem('neon_last_login', today);
            localStorage.setItem('neon_streak', newStreak.toString());
        } else {
            setStreak(storedStreak);
        }

        // --- DAILY QUESTS GENERATION ---
        if (storedDate !== today || !storedQuests) {
            const newQuests: DailyQuest[] = [];
            
            // 1 Easy
            const easyPool = QUEST_TEMPLATES.find(g => g.difficulty === 'EASY')!.templates;
            const easy = easyPool[Math.floor(Math.random() * easyPool.length)];
            newQuests.push({ ...easy, id: `q_${Date.now()}_e`, progress: 0, isCompleted: false, isClaimed: false, difficulty: 'EASY' });

            // 1 Medium
            const medPool = QUEST_TEMPLATES.find(g => g.difficulty === 'MEDIUM')!.templates;
            const med = medPool[Math.floor(Math.random() * medPool.length)];
            newQuests.push({ ...med, id: `q_${Date.now()}_m`, progress: 0, isCompleted: false, isClaimed: false, difficulty: 'MEDIUM' });

            // 1 Hard
            const hardPool = QUEST_TEMPLATES.find(g => g.difficulty === 'HARD')!.templates;
            const hard = hardPool[Math.floor(Math.random() * hardPool.length)];
            newQuests.push({ ...hard, id: `q_${Date.now()}_h`, progress: 0, isCompleted: false, isClaimed: false, difficulty: 'HARD' });

            setQuests(newQuests);
            setAllCompletedBonusClaimed(false);
            localStorage.setItem('neon_daily_quests', JSON.stringify(newQuests));
            localStorage.setItem('neon_quests_date', today);
            localStorage.setItem('neon_bonus_claimed', 'false');
        } else {
            setQuests(JSON.parse(storedQuests));
            setAllCompletedBonusClaimed(storedBonus === 'true');
        }
    }, []);

    const claimDailyBonus = () => {
        addCoins(todaysReward);
        setShowDailyModal(false);
    };

    // --- UNIVERSAL PROGRESS REPORTER ---
    // gameId: 'tetris', 'snake', etc.
    // metric: 'score', 'play', 'win', 'action' (generic for specific game events like lines cleared)
    // value: amount to add (usually) or set
    const reportQuestProgress = useCallback((gameId: string, metric: QuestMetric, value: number = 1) => {
        setQuests(prev => {
            let changed = false;
            const updated = prev.map(q => {
                if (q.isCompleted) return q;

                let shouldUpdate = false;
                let newProgress = q.progress;

                // Coin Quests (Global)
                if (q.metric === 'coins' && metric === 'coins') {
                    shouldUpdate = true;
                    newProgress += value;
                }
                // Specific Game Quests
                else if (q.gameId === gameId || q.gameId === 'any') {
                    if (q.metric === metric) {
                        shouldUpdate = true;
                        // Score is usually "Reach X", so we verify if value > target, or accumulate if it's actions
                        if (metric === 'score') {
                            // For score, we usually check if the *current game score* beats the target
                            // BUT simpler logic: if 'value' passed is the final score, we check against target.
                            // If we want cumulative score, we add. Let's assume 'score' is "Achieve X in one game" usually.
                            // However, to keep it simple and flexible:
                            // If target is high (cumulative), we add. If target is high but metric is 'high_score', we replace.
                            // Let's implement MAX logic for 'score' type quests to represent "Best Score Today"
                            // OR Cumulative if explicitly designed.
                            // For this implementation: Score quests are "Reach X in one game".
                            if (value >= q.target) newProgress = q.target;
                            else newProgress = Math.max(q.progress, value); 
                        } else {
                            // Actions, Plays, Wins, Coins are cumulative
                            newProgress += value;
                        }
                    }
                }

                if (shouldUpdate && newProgress !== q.progress) {
                    changed = true;
                    return {
                        ...q,
                        progress: Math.min(newProgress, q.target),
                        isCompleted: newProgress >= q.target
                    };
                }
                return q;
            });

            if (changed) {
                localStorage.setItem('neon_daily_quests', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    // Backward compatibility wrappers
    const checkGameQuest = useCallback((gameId: string) => reportQuestProgress(gameId, 'play', 1), [reportQuestProgress]);
    const checkCoinQuest = useCallback((amount: number) => reportQuestProgress('any', 'coins', amount), [reportQuestProgress]);

    const claimQuestReward = (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest && quest.isCompleted && !quest.isClaimed) {
            addCoins(quest.reward);
            const updated = quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q);
            setQuests(updated);
            localStorage.setItem('neon_daily_quests', JSON.stringify(updated));
        }
    };

    const claimAllBonus = () => {
        if (!allCompletedBonusClaimed && quests.every(q => q.isCompleted)) {
            addCoins(200); // Grand Slam Bonus
            setAllCompletedBonusClaimed(true);
            localStorage.setItem('neon_bonus_claimed', 'true');
        }
    };

    return {
        streak,
        showDailyModal,
        todaysReward,
        claimDailyBonus,
        quests,
        checkGameQuest, // Deprecated but kept for old calls
        checkCoinQuest, // Deprecated but kept for old calls
        reportQuestProgress, // NEW MAIN FUNCTION
        claimQuestReward,
        claimAllBonus,
        allCompletedBonusClaimed
    };
};
