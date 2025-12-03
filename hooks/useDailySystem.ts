
import { useState, useEffect, useCallback } from 'react';

export interface DailyQuest {
    id: string;
    description: string;
    reward: number;
    targetGame?: string; // 'tetris', 'breaker', etc. or 'any' for coins
    isCompleted: boolean;
    isClaimed: boolean;
    progress: number;
    target: number;
}

const QUEST_TEMPLATES = [
    { desc: "Jouer une partie de Tetris", game: 'tetris', reward: 50, target: 1 },
    { desc: "Jouer au Casse-Briques", game: 'breaker', reward: 50, target: 1 },
    { desc: "Faire une partie de Rush", game: 'rush', reward: 50, target: 1 },
    { desc: "Jouer à la Bataille Navale", game: 'battleship', reward: 50, target: 1 },
    { desc: "Jouer au Memory", game: 'memory', reward: 50, target: 1 },
    { desc: "Jouer à Pacman", game: 'pacman', reward: 50, target: 1 },
    { desc: "Gagner 200 pièces au total", game: 'any', reward: 150, target: 200 },
];

export const useDailySystem = (addCoins: (amount: number) => void) => {
    const [streak, setStreak] = useState(0);
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [todaysReward, setTodaysReward] = useState(0);
    const [quests, setQuests] = useState<DailyQuest[]>([]);

    // Helper to get today's date string YYYY-MM-DD
    const getTodayString = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        const storedLastLogin = localStorage.getItem('neon_last_login');
        const storedStreak = parseInt(localStorage.getItem('neon_streak') || '0', 10);
        const storedQuests = localStorage.getItem('neon_daily_quests');
        const storedDate = localStorage.getItem('neon_quests_date');

        const today = getTodayString();

        // --- LOGIN BONUS LOGIC ---
        if (storedLastLogin !== today) {
            // New Day Login
            let newStreak = 1;
            
            if (storedLastLogin) {
                const lastDate = new Date(storedLastLogin);
                const currDate = new Date(today);
                const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    newStreak = Math.min(storedStreak + 1, 7); // Cap at 7 days
                } else {
                    newStreak = 1; // Reset streak if missed a day
                }
            }

            setStreak(newStreak);
            
            // Calculate Reward
            const baseReward = 50;
            const bonus = newStreak * 20; // 70, 90, 110...
            const totalReward = baseReward + bonus;
            
            setTodaysReward(totalReward);
            setShowDailyModal(true);

            localStorage.setItem('neon_last_login', today);
            localStorage.setItem('neon_streak', newStreak.toString());
        } else {
            setStreak(storedStreak);
        }

        // --- DAILY QUESTS LOGIC ---
        if (storedDate !== today || !storedQuests) {
            // Generate new quests
            const newQuests: DailyQuest[] = [];
            // Shuffle templates
            const shuffledTemplates = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
            
            // Pick 3 unique quests
            for(let i=0; i<3; i++) {
                const tmpl = shuffledTemplates[i];
                newQuests.push({
                    id: `q_${Date.now()}_${i}`,
                    description: tmpl.desc,
                    reward: tmpl.reward,
                    targetGame: tmpl.game,
                    isCompleted: false,
                    isClaimed: false,
                    progress: 0,
                    target: tmpl.target
                });
            }
            setQuests(newQuests);
            localStorage.setItem('neon_daily_quests', JSON.stringify(newQuests));
            localStorage.setItem('neon_quests_date', today);
        } else {
            setQuests(JSON.parse(storedQuests));
        }

    }, []);

    const claimDailyBonus = () => {
        addCoins(todaysReward);
        setShowDailyModal(false);
    };

    // Called when a game starts
    const checkGameQuest = useCallback((gameId: string) => {
        setQuests(prev => {
            let changed = false;
            const updated = prev.map(q => {
                // If it's a "Play X" quest and matches the game ID
                if (!q.isCompleted && q.targetGame === gameId) {
                    changed = true;
                    return { ...q, isCompleted: true, progress: q.target };
                }
                return q;
            });
            if (changed) {
                localStorage.setItem('neon_daily_quests', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    // Called when coins are earned
    const checkCoinQuest = useCallback((amount: number) => {
        if (amount <= 0) return;
        setQuests(prev => {
            let changed = false;
            const updated = prev.map(q => {
                // If it's the "Earn Coins" quest (targetGame === 'any')
                if (!q.isCompleted && q.targetGame === 'any') {
                    const newProgress = Math.min(q.progress + amount, q.target);
                    if (newProgress !== q.progress) {
                        changed = true;
                        return { 
                            ...q, 
                            progress: newProgress,
                            isCompleted: newProgress >= q.target 
                        };
                    }
                }
                return q;
            });
            if (changed) {
                localStorage.setItem('neon_daily_quests', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    const claimQuestReward = (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest && quest.isCompleted && !quest.isClaimed) {
            addCoins(quest.reward);
            const updated = quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q);
            setQuests(updated);
            localStorage.setItem('neon_daily_quests', JSON.stringify(updated));
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
        claimQuestReward
    };
};
