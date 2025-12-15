
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
            { description: "Jouer 2 parties de Tetris", gameId: 'tetris', metric: 'play', target: 2, reward: 50 },
            { description: "Manger 10 pommes (Snake)", gameId: 'snake', metric: 'action', target: 10, reward: 50 },
            { description: "Gagner 100 pièces", gameId: 'any', metric: 'coins', target: 100, reward: 50 },
            { description: "Casser 20 briques (Breaker)", gameId: 'breaker', metric: 'score', target: 200, reward: 50 }, // Score roughly maps to bricks
            { description: "Faire 3 paires (Memory)", gameId: 'memory', metric: 'action', target: 3, reward: 50 },
            { description: "Survivre 30 sec (Pacman)", gameId: 'pacman', metric: 'action', target: 30, reward: 50 },
            { description: "Jouer une partie de Dames", gameId: 'checkers', metric: 'play', target: 1, reward: 50 },
            { description: "Faire 5 sauts (Runner)", gameId: 'runner', metric: 'action', target: 5, reward: 50 },
        ]
    },
    {
        difficulty: 'MEDIUM',
        templates: [
            { description: "Score 5000 points (Tetris)", gameId: 'tetris', metric: 'score', target: 5000, reward: 100 },
            { description: "Atteindre niveau 3 (Breaker)", gameId: 'breaker', metric: 'action', target: 3, reward: 100 },
            { description: "Gagner à Uno", gameId: 'uno', metric: 'win', target: 1, reward: 100 },
            { description: "Couler 3 navires (Bataille)", gameId: 'battleship', metric: 'action', target: 3, reward: 100 },
            { description: "Gagner 300 pièces", gameId: 'any', metric: 'coins', target: 300, reward: 100 },
            { description: "Gagner aux Dames", gameId: 'checkers', metric: 'win', target: 1, reward: 100 },
            { description: "Finir un niveau Neon Mix", gameId: 'watersort', metric: 'win', target: 1, reward: 100 },
            { description: "Empiler 15 blocs (Stack)", gameId: 'stack', metric: 'score', target: 15, reward: 100 },
            { description: "Survivre 2 minutes (Arena)", gameId: 'arenaclash', metric: 'play', target: 1, reward: 100 },
        ]
    },
    {
        difficulty: 'HARD',
        templates: [
            { description: "Score 15000 points (Tetris)", gameId: 'tetris', metric: 'score', target: 15000, reward: 250 },
            { description: "Manger un fantôme (Pacman)", gameId: 'pacman', metric: 'score', target: 200, reward: 250 },
            { description: "Gagner 3 parties en ligne", gameId: 'any', metric: 'win', target: 3, reward: 300 },
            { description: "Finir Sudoku (Moyen)", gameId: 'sudoku', metric: 'win', target: 1, reward: 250 },
            { description: "Score 1000 points (Snake)", gameId: 'snake', metric: 'score', target: 1000, reward: 250 },
            { description: "Finir 3 niveaux Neon Mix", gameId: 'watersort', metric: 'win', target: 3, reward: 250 },
            { description: "Gagner à Skyjo (Solo)", gameId: 'skyjo', metric: 'win', target: 1, reward: 250 },
            { description: "Atteindre 500m (Runner)", gameId: 'runner', metric: 'score', target: 500, reward: 250 },
        ]
    }
];

export const useDailySystem = (addCoins: (amount: number) => void) => {
    const [streak, setStreak] = useState(0);
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [todaysReward, setTodaysReward] = useState(0);
    const [quests, setQuests] = useState<DailyQuest[]>([]);
    const [allCompletedBonusClaimed, setAllCompletedBonusClaimed] = useState(false);

    // Helper to get today's date string YYYY-MM-DD in LOCAL TIME
    // Using simple Date methods avoids UTC/Local timezone conflicts causing infinite bonus loops
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const today = getTodayString();
        const storedLastLogin = localStorage.getItem('neon_last_login');
        const storedRewardDate = localStorage.getItem('neon_reward_date'); // NEW LOCK KEY
        const storedStreak = parseInt(localStorage.getItem('neon_streak') || '0', 10);
        const storedQuests = localStorage.getItem('neon_daily_quests');
        const storedDate = localStorage.getItem('neon_quests_date');
        const storedBonus = localStorage.getItem('neon_bonus_claimed');

        // --- LOGIN BONUS LOGIC ---
        // Only trigger if we haven't given a reward for this specific date yet
        if (storedRewardDate !== today) {
            let newStreak = 1;
            
            if (storedLastLogin) {
                // Parse dates manually to avoid timezone issues
                const lastDate = new Date(storedLastLogin);
                const currDate = new Date(today);
                
                // Calculate difference in days (ignoring hours/minutes)
                const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    // Consecutive day
                    newStreak = storedStreak + 1;
                    // Reset to Day 1 after Day 7 (Cycle)
                    if (newStreak > 7) {
                        newStreak = 1;
                    }
                } else if (diffDays === 0) {
                    // Same day (should be caught by storedRewardDate, but safe fallback)
                    newStreak = storedStreak; 
                }
                // Else (diffDays > 1) -> Streak reset to 1 (default)
            }
            
            setStreak(newStreak);
            const baseReward = 50;
            const bonus = newStreak * 20;
            setTodaysReward(baseReward + bonus);
            
            // Only show modal if it's truly a new reward event (diffDays != 0 or just reset)
            if (storedLastLogin !== today) {
                setShowDailyModal(true);
            }
            
            // LOCK IT IMMEDIATELY
            localStorage.setItem('neon_reward_date', today);
            localStorage.setItem('neon_last_login', today);
            localStorage.setItem('neon_streak', newStreak.toString());
        } else {
            // Already claimed/generated for today, just restore state
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
        checkGameQuest, 
        checkCoinQuest, 
        reportQuestProgress, 
        claimQuestReward,
        claimAllBonus,
        allCompletedBonusClaimed
    };
};
