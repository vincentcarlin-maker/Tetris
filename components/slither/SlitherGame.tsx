import React, { useRef, useEffect } from 'react';
import { useSlitherLogic } from './hooks/useSlitherLogic';
import { SlitherRenderer } from './components/SlitherRenderer';
import { SlitherUI } from './components/SlitherUI';
import { OnlineUser } from '../../hooks/useSupabase';

interface SlitherGameProps {
    onBack: () => void;
    audio: any;
    addCoins: (amount: number) => void;
    mp: any;
    onReportProgress?: (metric: 'score' | 'win' | 'action' | 'play', value: number) => void;
    onlineUsers: OnlineUser[];
}

export const SlitherGame: React.FC<SlitherGameProps> = ({ onBack, audio, addCoins, mp, onReportProgress, onlineUsers }) => {
    const { 
        gameState, setGameState, gameMode, score, rank, leaderboard, earnedCoins, isBoosting, setIsBoosting, isBoostingRef,
        playerWormRef, othersRef, foodRef, particlesRef, cameraRef, shakeRef,
        joystickActiveRef, joystickVectorRef,
        startGame, updatePhysics
    } = useSlitherLogic(audio, addCoins, mp, onReportProgress);

    // Keyboard listeners
    useEffect(() => {
        const kd = (e: KeyboardEvent) => { if (e.code === 'Space') { isBoostingRef.current = true; setIsBoosting(true); } };
        const ku = (e: KeyboardEvent) => { if (e.code === 'Space') { isBoostingRef.current = false; setIsBoosting(false); } };
        window.addEventListener('keydown', kd); 
        window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, [setIsBoosting, isBoostingRef]);

    // Input handlers
    const handleInputStart = (x: number, y: number) => {
        if (gameState !== 'PLAYING') return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        joystickActiveRef.current = true;
        
        // Calculate vector from center of screen (PC mouse style or Touch relative to center)
        const centerX = width / 2;
        const centerY = height / 2;
        
        joystickVectorRef.current = { x: x - centerX, y: y - centerY };
    };

    const handleInputMove = (x: number, y: number) => {
        if (!joystickActiveRef.current) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        joystickVectorRef.current = { x: x - centerX, y: y - centerY };
    };

    const handleInputEnd = () => {
        // For Slither style, we usually keep moving towards mouse even if not clicking
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#020205] relative overflow-hidden font-sans select-none touch-none">
            <SlitherRenderer 
                playerWormRef={playerWormRef}
                othersRef={othersRef}
                foodRef={foodRef}
                particlesRef={particlesRef}
                cameraRef={cameraRef}
                shakeRef={shakeRef}
                gameState={gameState}
                onUpdate={updatePhysics}
                onInputStart={handleInputStart}
                onInputMove={handleInputMove}
                onInputEnd={handleInputEnd}
            />

            <SlitherUI 
                gameState={gameState}
                gameMode={gameMode}
                score={score}
                rank={rank}
                earnedCoins={earnedCoins}
                leaderboard={leaderboard}
                onlineUsers={onlineUsers}
                isBoosting={isBoosting}
                onStartSolo={() => startGame('SOLO')}
                onSetMode={(mode) => { 
                    if (mode === 'ONLINE') {
                        setGameState('SERVER_SELECT');
                    } else {
                        startGame('SOLO');
                    }
                }}
                onJoinServer={(id) => startGame('ONLINE', id)}
                onBackToMenu={() => setGameState('MENU')}
                onBoostStart={() => { isBoostingRef.current = true; setIsBoosting(true); }}
                onBoostEnd={() => { isBoostingRef.current = false; setIsBoosting(false); }}
                onQuit={() => { 
                    if (gameMode === 'ONLINE') mp.leaveGame();
                    onBack();
                }}
            />
        </div>
    );
};