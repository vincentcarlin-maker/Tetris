
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, RefreshCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Lock, Unlock, Coins, Lightbulb, PlayCircle, Loader2 } from 'lucide-react';
import { CarData, LevelData } from './types';
import { getLevel, TOTAL_LEVELS } from './levels';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { useCurrency } from '../../hooks/useCurrency';
import { solveLevel } from './solver';

interface RushGameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  currency: ReturnType<typeof useCurrency>;
}

const GRID_SIZE = 6;
const CELL_SIZE = 100 / GRID_SIZE; // En pourcentage

// --- Effet Confettis ---
const Confetti = () => {
    const particles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-cyan-500'][Math.floor(Math.random() * 6)]
    }));

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
             {particles.map(p => (
                 <div 
                    key={p.id}
                    className={`absolute w-2 h-4 ${p.color} opacity-80 rounded-sm`}
                    style={{
                        left: p.left,
                        top: '-20px',
                        animation: `confetti-fall ${p.duration}s linear forwards ${p.delay}s`
                    }}
                 />
             ))}
             <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(-10%) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
             `}</style>
        </div>
    );
};

// --- Composant Visuel Voiture ---
const CarVisual: React.FC<{ car: CarData, isSelected: boolean }> = ({ car, isSelected }) => {
    const isVertical = car.orientation === 'v';
    const isTruck = car.length === 3;
    
    // Classes communes
    const shadowClass = isSelected ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'drop-shadow-lg';
    const zIndex = isSelected ? 'z-20' : 'z-10';

    // ROUES (Wheels)
    const Wheel = ({ className }: { className: string }) => (
        <div className={`absolute bg-gray-900 border border-gray-700 rounded-sm ${className}`} />
    );

    const renderWheels = () => {
        if (isVertical) {
            return (
                <>
                    {/* Roues Gauches */}
                    <Wheel className="left-[5%] top-[10%] w-[15%] h-[15%]" />
                    <Wheel className="left-[5%] bottom-[10%] w-[15%] h-[15%]" />
                    {isTruck && <Wheel className="left-[5%] bottom-[40%] w-[15%] h-[15%]" />}
                    
                    {/* Roues Droites */}
                    <Wheel className="right-[5%] top-[10%] w-[15%] h-[15%]" />
                    <Wheel className="right-[5%] bottom-[10%] w-[15%] h-[15%]" />
                    {isTruck && <Wheel className="right-[5%] bottom-[40%] w-[15%] h-[15%]" />}
                </>
            );
        } else {
            return (
                <>
                    {/* Roues Haut */}
                    <Wheel className="top-[5%] left-[10%] h-[15%] w-[15%]" />
                    <Wheel className="top-[5%] right-[10%] h-[15%] w-[15%]" />
                    {isTruck && <Wheel className="top-[5%] right-[40%] h-[15%] w-[15%]" />}
                    
                    {/* Roues Bas */}
                    <Wheel className="bottom-[5%] left-[10%] h-[15%] w-[15%]" />
                    <Wheel className="bottom-[5%] right-[10%] h-[15%] w-[15%]" />
                    {isTruck && <Wheel className="bottom-[5%] right-[40%] h-[15%] w-[15%]" />}
                </>
            );
        }
    };

    return (
        <div className={`w-full h-full relative transition-all duration-200 ${shadowClass} ${zIndex} p-[2%]`}>
            {/* 1. Les Roues (couche inférieure) */}
            {renderWheels()}

            {/* 2. Le Châssis (Corps principal) */}
            <div className={`absolute transition-all duration-200 
                ${isVertical ? 'left-[15%] right-[15%] top-[2%] bottom-[2%]' : 'top-[15%] bottom-[15%] left-[2%] right-[2%]'}
                ${isTruck ? 'rounded-md' : car.isTarget ? 'rounded-xl' : 'rounded-lg'}
                ${car.isTarget 
                    ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-800 border-red-400 ring-1 ring-red-500' 
                    : `bg-gradient-to-br ${car.color} border-white/10 ring-1 ring-white/20`
                }
                border shadow-inner
            `}>
                {/* Reflet métallique global */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50 rounded-[inherit]"></div>

                {/* --- DÉTAILS CAMION --- */}
                {isTruck && (
                    <>
                        {/* Séparation Cabine / Remorque */}
                        <div className={`absolute bg-black/30 border-white/10 
                            ${isVertical 
                                ? 'top-[25%] left-0 right-0 h-[2px] border-b' 
                                : 'left-[25%] top-0 bottom-0 w-[2px] border-r'
                            }`} 
                        />
                        {/* Détails sur la remorque (stries) */}
                        <div className={`absolute border-dashed border-black/20 
                            ${isVertical 
                                ? 'top-[35%] bottom-[10%] left-1/2 -translate-x-1/2 w-0 border-l-2' 
                                : 'left-[35%] right-[10%] top-1/2 -translate-y-1/2 h-0 border-t-2'
                            }`} 
                        />
                        <div className={`absolute border-dashed border-black/20 
                            ${isVertical 
                                ? 'top-[35%] bottom-[10%] left-[30%] w-0 border-l' 
                                : 'left-[35%] right-[10%] top-[30%] h-0 border-t'
                            }`} 
                        />
                         <div className={`absolute border-dashed border-black/20 
                            ${isVertical 
                                ? 'top-[35%] bottom-[10%] right-[30%] w-0 border-l' 
                                : 'left-[35%] right-[10%] bottom-[30%] h-0 border-t'
                            }`} 
                        />
                    </>
                )}

                {/* --- DÉTAILS VOITURE ROUGE (TARGET) --- */}
                {car.isTarget && (
                    <>
                        {/* Bandes Racing */}
                        <div className={`absolute bg-white/90 shadow-[0_0_5px_white] z-10
                            ${isVertical 
                                ? 'top-0 bottom-0 left-1/2 -translate-x-1/2 w-[15%]' 
                                : 'left-0 right-0 top-1/2 -translate-y-1/2 h-[15%]'
                            }`} 
                        />
                        {/* Aileron arrière (Spoiler) */}
                        <div className={`absolute bg-red-900 border border-red-500 rounded-sm z-20 shadow-lg
                             ${isVertical
                                ? 'bottom-[2%] left-[5%] right-[5%] h-[8%]'
                                : 'right-[2%] top-[5%] bottom-[5%] w-[8%]'
                             }
                        `}></div>
                    </>
                )}

                {/* 3. L'Habitacle (Toit/Vitres) */}
                <div className={`absolute bg-gray-900/80 border border-gray-700 backdrop-blur-sm shadow-lg z-10
                    ${isVertical 
                        ? (isTruck ? 'top-[5%] h-[18%] left-[10%] right-[10%] rounded-sm' : 'top-[25%] bottom-[20%] left-[10%] right-[10%] rounded-lg')
                        : (isTruck ? 'left-[5%] w-[18%] top-[10%] bottom-[10%] rounded-sm' : 'left-[25%] right-[20%] top-[10%] bottom-[10%] rounded-lg')
                    }
                `}>
                     {/* Reflet vitre */}
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[inherit]"></div>
                     
                     {/* Pare-brise Avant (Cyan léger) */}
                     <div className={`absolute bg-cyan-400/20 
                        ${isVertical
                            ? 'top-0 h-[25%] left-0 right-0 border-b border-white/10'
                            : 'left-0 w-[25%] top-0 bottom-0 border-r border-white/10'
                        }
                     `}></div>

                     {/* Lunette Arrière (si pas camion) */}
                     {!isTruck && (
                         <div className={`absolute bg-black/40 
                            ${isVertical
                                ? 'bottom-0 h-[15%] left-0 right-0 border-t border-white/10'
                                : 'right-0 w-[15%] top-0 bottom-0 border-l border-white/10'
                            }
                         `}></div>
                     )}
                </div>

                {/* 4. Les Phares */}
                {/* Avant (Jaune/Blanc) */}
                <div className={`absolute bg-yellow-100 shadow-[0_0_8px_rgba(253,224,71,0.8)] rounded-full z-20
                     ${isVertical 
                        ? 'top-[2%] left-[10%] w-[15%] h-[3px]' 
                        : 'left-[2%] top-[10%] h-[15%] w-[3px]'
                     }
                `}></div>
                <div className={`absolute bg-yellow-100 shadow-[0_0_8px_rgba(253,224,71,0.8)] rounded-full z-20
                     ${isVertical 
                        ? 'top-[2%] right-[10%] w-[15%] h-[3px]' 
                        : 'left-[2%] bottom-[10%] h-[15%] w-[3px]'
                     }
                `}></div>

                {/* Arrière (Rouge) */}
                <div className={`absolute bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)] rounded-sm z-20
                     ${isVertical 
                        ? 'bottom-0 left-[10%] w-[18%] h-[2px]' 
                        : 'right-0 top-[10%] h-[18%] w-[2px]'
                     }
                `}></div>
                <div className={`absolute bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)] rounded-sm z-20
                     ${isVertical 
                        ? 'bottom-0 right-[10%] w-[18%] h-[2px]' 
                        : 'right-0 bottom-[10%] h-[18%] w-[2px]'
                     }
                `}></div>

            </div>
        </div>
    );
};


export const RushGame: React.FC<RushGameProps> = ({ onBack, audio, currency }) => {
  const { addCoins, unlockedSolutions } = currency;
  
  // Helper pour initialiser l'état avec la valeur sauvegardée
  const getSavedLevel = () => {
    const saved = localStorage.getItem('rush-unlocked-level');
    return saved ? parseInt(saved, 10) : 1;
  };

  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(getSavedLevel);
  const [currentLevelId, setCurrentLevelId] = useState(getSavedLevel);
  
  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [difficulty, setDifficulty] = useState('FACILE');
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  
  // Solver State
  const [isSolving, setIsSolving] = useState(false);
  const [solverStatus, setSolverStatus] = useState<'idle' | 'calculating' | 'playing'>('idle');
  
  const { playCarExit, playCarMove, resumeAudio } = audio;
  const { highScores, updateHighScore } = useHighScores();

  // Pour empêcher le spam (Throttling)
  const lastMoveTime = useRef<number>(0);

  // Initialisation du niveau
  useEffect(() => {
    loadLevel(currentLevelId);
  }, [currentLevelId]);

  const saveProgress = (levelId: number) => {
      const nextLevel = levelId + 1;
      if (nextLevel > maxUnlockedLevel && nextLevel <= TOTAL_LEVELS) {
          setMaxUnlockedLevel(nextLevel);
          localStorage.setItem('rush-unlocked-level', nextLevel.toString());
      }
  };

  const loadLevel = (id: number) => {
    const level = getLevel(id);
    setCars(level.cars);
    setDifficulty(level.difficulty);
    setSelectedCarId(null);
    setMoveCount(0);
    setIsWon(false);
    setIsExiting(false);
    setRewardClaimed(false);
    setIsSolving(false);
    setSolverStatus('idle');
  };

  const handleLevelChange = (direction: -1 | 1) => {
    if (isSolving) return; // Block level change during solution
    const newId = currentLevelId + direction;
    // Vérifie les limites ET si le niveau est débloqué
    if (newId > 0 && newId <= TOTAL_LEVELS && newId <= maxUnlockedLevel) {
      setCurrentLevelId(newId);
    }
  };

  // --- AUTOMATIC SOLVER ---
  const useSolution = async () => {
    if (isWon || isExiting || isSolving) return;
    
    setIsSolving(true);
    setSolverStatus('calculating');
    setSelectedCarId(null); // Deselect user car

    // Give UI a moment to render "Calculating"
    setTimeout(() => {
        const moves = solveLevel(cars);
        
        if (moves) {
            setSolverStatus('playing');
            let moveIndex = 0;
            
            const interval = setInterval(() => {
                if (moveIndex >= moves.length) {
                    clearInterval(interval);
                    // Trigger win sequence
                    setIsExiting(true);
                    playCarExit();
                    setTimeout(() => {
                        setIsWon(true);
                        saveProgress(currentLevelId);
                        setIsSolving(false);
                        setSolverStatus('idle');
                    }, 800);
                    return;
                }

                const move = moves[moveIndex];
                
                // Update specific car
                setCars(prevCars => prevCars.map(c => {
                    if (c.id === move.carId) {
                        if (c.orientation === 'h') return { ...c, x: c.x + move.steps };
                        return { ...c, y: c.y + move.steps };
                    }
                    return c;
                }));
                
                playCarMove();
                moveIndex++;
            }, 300); // 300ms per move for nice visibility
        } else {
            setSolverStatus('idle');
            setIsSolving(false);
            alert("Erreur: Impossible de trouver une solution pour cette configuration.");
        }
    }, 100);
  };

  // Vérifie si une position est libre sur la grille
  const isCellFree = (x: number, y: number, excludeCarId: number, currentCars: CarData[]): boolean => {
    // Hors grille
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;

    // Collision avec d'autres voitures
    for (const car of currentCars) {
      if (car.id === excludeCarId) continue;
      
      if (car.orientation === 'h') {
        if (y === car.y && x >= car.x && x < car.x + car.length) return false;
      } else {
        if (x === car.x && y >= car.y && y < car.y + car.length) return false;
      }
    }
    return true;
  };

  const moveCar = useCallback((dir: -1 | 1) => {
    if (isSolving) return; // Block manual moves during solution

    // 1. Force Audio Unlock agressif à chaque interaction
    resumeAudio();

    // 2. Throttling : Limite à 1 mouvement tous les 100ms pour éviter les chevauchements
    const now = Date.now();
    if (now - lastMoveTime.current < 100) return;
    lastMoveTime.current = now;

    if (selectedCarId === null || isWon || isExiting) return;

    setCars(prevCars => {
      const newCars = prevCars.map(car => {
        if (car.id !== selectedCarId) return car;

        let canMove = true;
        
        if (car.orientation === 'h') {
          // Déplacement Horizontal
          const checkX = dir === 1 ? car.x + car.length : car.x - 1;
          if (!isCellFree(checkX, car.y, car.id, prevCars)) canMove = false;
          
          if (canMove) {
            setMoveCount(c => c + 1);
            const newX = car.x + dir;
            // Vérification de victoire (Voiture rouge touche le bord droit)
            if (car.isTarget && newX + car.length === GRID_SIZE) {
                setIsExiting(true);
                playCarExit();
                setTimeout(() => {
                    setIsWon(true);
                    saveProgress(currentLevelId);
                }, 800); // Temps pour l'animation de sortie
            } else {
                playCarMove();
            }
            return { ...car, x: newX };
          }
        } else {
          // Déplacement Vertical
          const checkY = dir === 1 ? car.y + car.length : car.y - 1;
          if (!isCellFree(car.x, checkY, car.id, prevCars)) canMove = false;

          if (canMove) {
            setMoveCount(c => c + 1);
            playCarMove();
            return { ...car, y: car.y + dir };
          }
        }
        return car;
      });
      return newCars;
    });
  }, [selectedCarId, isWon, isExiting, currentLevelId, maxUnlockedLevel, playCarExit, playCarMove, resumeAudio, isSolving]);

  // Give reward and update high score on win
  useEffect(() => {
      if (isWon && !rewardClaimed) {
          // Don't give full reward if solved by AI (maybe reduced or none? kept full for now as purchased)
          if (!isSolving) {
            addCoins(50);
            setEarnedCoins(50);
            updateHighScore('rush', moveCount, currentLevelId);
          }
          setRewardClaimed(true);
      }
  }, [isWon, rewardClaimed, addCoins, updateHighScore, moveCount, currentLevelId, isSolving]);


  // Gestion clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCarId || isSolving) return;
      resumeAudio(); // Ensure audio is unlocked on keypress too
      const car = cars.find(c => c.id === selectedCarId);
      if (!car) return;

      if (car.orientation === 'h') {
        if (e.key === 'ArrowLeft') moveCar(-1);
        if (e.key === 'ArrowRight') moveCar(1);
      } else {
        if (e.key === 'ArrowUp') moveCar(-1);
        if (e.key === 'ArrowDown') moveCar(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCarId, cars, moveCar, resumeAudio, isSolving]);

  const selectedCar = cars.find(c => c.id === selectedCarId);
  const bestScore = highScores.rush?.[currentLevelId];
  const hasBoughtSolution = unlockedSolutions.includes(currentLevelId);

  return (
    <div 
        className="min-h-full w-full flex flex-col items-center justify-start bg-[#0a0a12] relative overflow-y-auto p-4 gap-4"
        onTouchStart={resumeAudio} // FORCE iOS AUDIO UNLOCK
        onMouseDown={resumeAudio}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none"></div>

      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between z-10 shrink-0">
        <button onClick={onBack} disabled={isSolving} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform disabled:opacity-50">
          <Home size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            NEON RUSH
          </h2>
          <div className="flex gap-4 text-xs font-mono text-cyan-500 items-center">
            <span className="flex items-center gap-1">
                {currentLevelId === maxUnlockedLevel ? <Unlock size={10} /> : <Lock size={10} />}
                NIVEAU {currentLevelId}
            </span>
            <span>COUPS: {moveCount}</span>
            {bestScore !== undefined && <span className="text-yellow-400">MEILLEUR: {bestScore}</span>}
            {earnedCoins > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                    <Coins size={12} /> +{earnedCoins}
                </span>
            )}
          </div>
        </div>
        <button onClick={() => loadLevel(currentLevelId)} disabled={isSolving} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-white/10 active:scale-95 transition-transform disabled:opacity-50">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-md aspect-square bg-gray-950 border-4 border-gray-800 rounded-xl shadow-2xl overflow-hidden z-10 ring-1 ring-white/10 shrink-0">
        {/* Grille de fond */}
        <div className="absolute inset-0 opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', 
                backgroundSize: `${100/6}% ${100/6}%` 
            }}>
        </div>
        
        {/* Sortie Marker */}
        <div className="absolute right-0 top-[33.33%] w-1.5 h-[16.66%] bg-green-500 shadow-[0_0_15px_#22c55e] z-0 animate-pulse rounded-l"></div>
        <div className="absolute right-0 top-[33.33%] translate-x-full w-4 h-[16.66%] bg-green-500/20 blur-xl z-0"></div>

        {/* Cars */}
        {cars.map((car) => {
            const isTargetExiting = isExiting && car.isTarget;
            return (
              <div
                key={car.id}
                onClick={() => !isSolving && setSelectedCarId(car.id)}
                className={`absolute ${isSolving ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  left: `${car.x * CELL_SIZE}%`,
                  top: `${car.y * CELL_SIZE}%`,
                  width: `${car.orientation === 'h' ? car.length * CELL_SIZE : CELL_SIZE}%`,
                  height: `${car.orientation === 'v' ? car.length * CELL_SIZE : CELL_SIZE}%`,
                  transition: isTargetExiting ? 'transform 0.8s cubic-bezier(0.5, 0, 0.2, 1)' : 'left 0.2s, top 0.2s',
                  transform: isTargetExiting ? 'translateX(150%)' : 'none',
                  zIndex: isTargetExiting ? 50 : (selectedCarId === car.id ? 40 : 10)
                }}
              >
                  <CarVisual car={car} isSelected={selectedCarId === car.id} />
              </div>
            );
        })}

        {/* Solving Overlay */}
        {isSolving && (
             <div className="absolute inset-x-0 top-4 z-40 flex justify-center pointer-events-none">
                 <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-purple-500/50 flex items-center gap-3 text-purple-300 shadow-lg">
                    {solverStatus === 'calculating' ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs font-bold tracking-widest">CALCUL...</span>
                        </>
                    ) : (
                        <>
                            <PlayCircle size={16} className="animate-pulse" />
                            <span className="text-xs font-bold tracking-widest">DÉMONSTRATION...</span>
                        </>
                    )}
                 </div>
             </div>
        )}

        {/* Victory Overlay */}
        {isWon && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <Confetti />
            <h3 className="text-4xl font-black text-green-400 italic mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] text-center relative z-10">
                VOIE<br/>LIBRE !
            </h3>
            
            {/* Show coin reward only if played manually */}
            {!isSolving && (
                <div className="mb-6 flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500 animate-pulse relative z-10">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-yellow-100 font-bold">+50 PIÈCES</span>
                </div>
            )}

            <div className="flex gap-4 relative z-10">
              <button 
                onClick={() => loadLevel(currentLevelId)} 
                className="px-6 py-3 bg-gray-800 text-white rounded font-bold border border-white/10 hover:bg-gray-700 transition-colors"
              >
                REJOUER
              </button>
              <button 
                onClick={() => handleLevelChange(1)} 
                className="px-6 py-3 bg-green-500 text-black rounded font-bold hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-colors flex items-center gap-2"
              >
                NIVEAU {currentLevelId + 1} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Area */}
      <div className="w-full max-w-lg z-10 flex flex-col gap-4 shrink-0 pb-6">

        {/* --- MOVEMENT CONTROLS (Only visible if car selected) --- */}
        {selectedCar && !isWon && !isSolving && (
            <div className="flex items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {selectedCar.orientation === 'h' ? (
                    <>
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); moveCar(-1); }}
                            onTouchStart={(e) => { e.preventDefault(); moveCar(-1); }}
                            className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/20 flex items-center justify-center active:bg-neon-blue active:border-white active:scale-95 transition-all shadow-lg"
                        >
                            <ArrowLeft size={32} className="text-white" />
                        </button>
                        
                        {/* Car Indicator */}
                        <div className={`w-12 h-8 rounded-md border border-white/30 shadow-inner bg-gradient-to-br ${selectedCar.color}`}></div>

                        <button 
                             onMouseDown={(e) => { e.preventDefault(); moveCar(1); }}
                             onTouchStart={(e) => { e.preventDefault(); moveCar(1); }}
                            className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/20 flex items-center justify-center active:bg-neon-blue active:border-white active:scale-95 transition-all shadow-lg"
                        >
                            <ArrowRight size={32} className="text-white" />
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                             onMouseDown={(e) => { e.preventDefault(); moveCar(-1); }}
                             onTouchStart={(e) => { e.preventDefault(); moveCar(-1); }}
                            className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/20 flex items-center justify-center active:bg-neon-blue active:border-white active:scale-95 transition-all shadow-lg"
                        >
                            <ArrowUp size={32} className="text-white" />
                        </button>

                        {/* Car Indicator */}
                         <div className={`h-12 w-8 rounded-md border border-white/30 shadow-inner bg-gradient-to-br ${selectedCar.color}`}></div>

                        <button 
                             onMouseDown={(e) => { e.preventDefault(); moveCar(1); }}
                             onTouchStart={(e) => { e.preventDefault(); moveCar(1); }}
                            className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/20 flex items-center justify-center active:bg-neon-blue active:border-white active:scale-95 transition-all shadow-lg"
                        >
                            <ArrowDown size={32} className="text-white" />
                        </button>
                    </>
                )}
            </div>
        )}

        {/* Navigation Niveaux */}
        <div className="flex items-center justify-center gap-6 bg-gray-900/50 p-2 rounded-xl border border-white/5">
            <button 
                disabled={currentLevelId === 1 || isSolving}
                onClick={() => handleLevelChange(-1)} 
                className="p-3 bg-gray-800/80 border border-white/10 rounded-lg disabled:opacity-30 transition-opacity"
            >
                <ChevronLeft size={24} />
            </button>
            <div className="text-center w-24">
                <span className={`text-xs font-bold ${difficulty === 'FACILE' ? 'text-green-400' : difficulty === 'MOYEN' ? 'text-yellow-400' : 'text-red-500'}`}>{difficulty}</span>
                <p className="text-lg font-black text-white leading-tight">NIVEAU {currentLevelId}</p>
            </div>
            <button 
                disabled={currentLevelId >= maxUnlockedLevel || isSolving}
                onClick={() => handleLevelChange(1)} 
                className="p-3 bg-gray-800/80 border border-white/10 rounded-lg disabled:opacity-30 transition-opacity flex items-center gap-2"
            >
                {currentLevelId >= maxUnlockedLevel && currentLevelId < TOTAL_LEVELS && <Lock size={18}/>}
                <ChevronRight size={24} />
            </button>
        </div>
        
        {/* Solution Button */}
        {hasBoughtSolution && !isWon && !isSolving && (
            <button 
                onClick={useSolution}
                className="mx-auto flex items-center gap-2 px-6 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded-full font-bold text-sm hover:bg-purple-600/40 transition-colors animate-pulse"
            >
                <Lightbulb size={16} /> VOIR LA SOLUTION
            </button>
        )}

      </div>
    </div>
  );
};
