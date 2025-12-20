
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Ghost, ArrowRight, ArrowLeft, Star, Zap, Skull, Shield, Play, HelpCircle, MousePointer2 } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { Direction, Position, Pacman, Ghost as GhostType, Grid, TileType, GhostMode } from './types';
import { LEVELS, PACMAN_START, COLS, ROWS, GHOST_HOUSE_EXIT, GHOST_HOUSE_CENTER } from './level';
import { TutorialOverlay } from '../Tutorials';

interface PacmanGameProps {
    onBack: () => void;
    audio: ReturnType<typeof useGameAudio>;
    addCoins: (amount: number) => void;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
}

const GAME_SPEED_BASE = 0.11;
const GHOST_COLORS: Record<string, string> = { red: '#ef4444', pink: '#f472b6', cyan: '#22d3ee', orange: '#fb923c', frightened: '#93c5fd', eaten: 'rgba(255, 255, 255, 0.3)' };

export const PacmanGame: React.FC<PacmanGameProps> = ({ onBack, audio, addCoins, onReportProgress }) => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [gameStep, setGameStep] = useState<'MENU' | 'DIFFICULTY' | 'PLAYING'>('MENU'); 
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false); 
    const [levelComplete, setLevelComplete] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    const { playPacmanWaka, playPacmanEatGhost, playPacmanPower, playGameOver, playVictory, resumeAudio } = audio;
    const { highScores, updateHighScore } = useHighScores();
    const highScore = highScores.pacman || 0;

    const pacmanRef = useRef<Pacman>({ pos: { ...PACMAN_START }, dir: 'LEFT', nextDir: 'LEFT', speed: GAME_SPEED_BASE, isPowered: false });
    const ghostsRef = useRef<GhostType[]>([]);
    const gridRef = useRef<Grid>([]);
    const dotsCountRef = useRef(0);
    const isDyingRef = useRef(false);

    useEffect(() => { const hasSeen = localStorage.getItem('neon_pacman_tutorial_seen'); if (!hasSeen) { setShowTutorial(true); localStorage.setItem('neon_pacman_tutorial_seen', 'true'); } }, []);

    const startGame = (selectedDiff: 'EASY' | 'MEDIUM' | 'HARD') => {
        setDifficulty(selectedDiff); setLevel(1); setLives(3); setScore(0); setGameOver(false); setGameWon(false); setLevelComplete(false); setIsPlaying(false); setEarnedCoins(0); setGameStep('PLAYING'); isDyingRef.current = false;
        const mapData = LEVELS[0]; gridRef.current = JSON.parse(JSON.stringify(mapData));
        let dots = 0; gridRef.current.forEach(row => row.forEach(cell => { if (cell === 2 || cell === 3) dots++; })); dotsCountRef.current = dots;
        ghostsRef.current = [ { id: 0, pos: { ...GHOST_HOUSE_EXIT }, dir: 'LEFT', color: 'red', mode: 'SCATTER', startPos: { x: 9, y: 10 }, speed: GAME_SPEED_BASE * 0.45 }, { id: 1, pos: { x: 9, y: 10 }, dir: 'UP', color: 'pink', mode: 'AT_HOME', startPos: { x: 9, y: 10 }, speed: GAME_SPEED_BASE * 0.42 } ];
    };

    if (gameStep === 'MENU') {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <h1 className="text-5xl font-black text-white mb-2 italic tracking-tight drop-shadow-[0_0_15px_#facc15]">NEON EATER</h1>
                <div className="flex flex-col gap-4 w-full max-w-[260px] mt-8">
                    <button onClick={() => setGameStep('DIFFICULTY')} className="px-6 py-4 bg-gray-800 border-2 border-yellow-400 text-white font-bold rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"> <Play size={24} className="text-yellow-400"/> JOUER </button>
                </div>
                <button onClick={onBack} className="mt-12 text-gray-500 text-sm hover:text-white underline">RETOUR AU MENU</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center bg-black/20 relative overflow-hidden text-white font-sans touch-none select-none p-4">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-400/40 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-hard-light" />
            <div className="w-full max-w-lg flex items-center justify-between z-10 p-4 shrink-0">
                <button onClick={() => setGameStep('MENU')} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-black italic text-yellow-400">NEON EATER</h1>
                <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="p-2 bg-gray-800 rounded-lg text-yellow-400"><HelpCircle size={20} /></button><button onClick={() => startGame(difficulty)} className="p-2 bg-gray-800 rounded-lg text-gray-400"><RefreshCw size={20} /></button></div>
            </div>
        </div>
    );
};
