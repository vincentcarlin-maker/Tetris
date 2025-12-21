
import { useState } from 'react';
import { Card as CardType, Color, Turn, GameState, ChatMessage, Value, GamePhase } from '../types';

export const useUnoState = () => {
    // --- CORE GAME DATA ---
    const [deck, setDeck] = useState<CardType[]>([]);
    const [discardPile, setDiscardPile] = useState<CardType[]>([]);
    const [playerHand, setPlayerHand] = useState<CardType[]>([]);
    const [cpuHand, setCpuHand] = useState<CardType[]>([]);
    const [activeColor, setActiveColor] = useState<Color>('black');
    
    // --- GAME FLOW ---
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [turn, setTurn] = useState<Turn>('PLAYER');
    const [playDirection, setPlayDirection] = useState<1 | -1>(1);
    
    // --- SCORES & STATUS ---
    const [score, setScore] = useState(0);
    const [winner, setWinner] = useState<Turn | null>(null);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [unoShout, setUnoShout] = useState<Turn | null>(null);
    const [message, setMessage] = useState<string>('');
    
    // --- MECHANICS FLAGS ---
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
    const [playerCalledUno, setPlayerCalledUno] = useState(false);
    const [showContestButton, setShowContestButton] = useState(false);
    const [opponentCalledUno, setOpponentCalledUno] = useState(false);

    // --- ONLINE ---
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);

    const resetState = () => {
        setDeck([]);
        setDiscardPile([]);
        setPlayerHand([]);
        setCpuHand([]);
        setScore(0);
        setWinner(null);
        setEarnedCoins(0);
        setUnoShout(null);
        setMessage('');
        setHasDrawnThisTurn(false);
        setPlayerCalledUno(false);
        setShowContestButton(false);
        setOpponentCalledUno(false);
        setChatHistory([]);
        setOpponentLeft(false);
        setGameState('playing');
        setIsWaitingForHost(false);
        setPlayDirection(1);
        setTurn('PLAYER');
    };

    return {
        deck, setDeck,
        discardPile, setDiscardPile,
        playerHand, setPlayerHand,
        cpuHand, setCpuHand,
        activeColor, setActiveColor,
        phase, setPhase,
        gameState, setGameState,
        turn, setTurn,
        playDirection, setPlayDirection,
        score, setScore,
        winner, setWinner,
        earnedCoins, setEarnedCoins,
        unoShout, setUnoShout,
        message, setMessage,
        hasDrawnThisTurn, setHasDrawnThisTurn,
        playerCalledUno, setPlayerCalledUno,
        showContestButton, setShowContestButton,
        opponentCalledUno, setOpponentCalledUno,
        chatHistory, setChatHistory,
        opponentLeft, setOpponentLeft,
        isWaitingForHost, setIsWaitingForHost,
        resetState
    };
};
