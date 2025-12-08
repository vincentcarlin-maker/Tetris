
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Cpu, User, CircleDot, Coins, Home, Play, Users, MessageSquare, Send, Smile, Frown, ThumbsUp, Heart, Hand, LogOut, Loader2, Globe } from 'lucide-react';
import { BoardState, Player, WinState, GameMode, Difficulty } from './types';
import { getBestMove } from './ai';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useCurrency } from '../../hooks/useCurrency';

interface Connect4GameProps {
  onBack: () => void;
  audio: ReturnType<typeof useGameAudio>;
  addCoins: (amount: number) => void;
  mp: ReturnType<typeof useMultiplayer>;
}

interface ChatMessage {
    id: number;
    text: string;
    senderName: string;
    isMe: boolean;
    timestamp: number;
}

const ROWS = 6;
const COLS = 7;

// Réactions Néon Animées
const REACTIONS = [
    { id: 'angry', icon: Frown, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', anim: 'animate-pulse' },
    { id: 'wave', icon: Hand, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', anim: 'animate-bounce' },
    { id: 'happy', icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500', anim: 'animate-pulse' },
    { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/20', border: 'border-pink-500', anim: 'animate-ping' },
    { id: 'good', icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', anim: 'animate-bounce' },
    { id: 'sad', icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500', anim: 'animate-pulse' },
];

// Helpers
const createBoard = (): BoardState => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const checkWinFull = (board: BoardState): WinState => {
    const directions = [
        { r: 0, c: 1 },  // Horizontal
        { r: 1, c: 0 },  // Vertical
        { r: 1, c: 1 },  // Diagonal \ (Down-Right)
        { r: 1, c: -1 }  // Diagonal / (Down-Left)
    ];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const player = board[r][c];
            if (player === 0) continue;

            for (const { r: dr, c: dc } of directions) {
                if (
                    r + 3 * dr < ROWS && r + 3 * dr >= 0 &&
                    c + 3 * dc < COLS && c + 3 * dc >= 0
                ) {
                    if (
                        board[r + dr][c + dc] === player &&
                        board[r + 2 * dr][c + 2 * dc] === player &&
                        board[r + 3 * dr][c + 3 * dc] === player
                    ) {
                        return {
                            winner: player,
                            line: [
                                [r, c],
                                [r + dr, c + dc],
                                [r + 2 * dr, c + 2 * dc],
                                [r + 3 * dr, c + 3 * dc]
                            ]
                        };
                    }
                }
            }
        }
    }
    
    if (board.every(row => row.every(cell => cell !== 0))) {
        return { winner: 'DRAW', line: [] };
    }

    return { winner: null, line: [] };
};

type GameStage = 'MENU' | 'DIFFICULTY' | 'GAME';

export const Connect4Game: React.FC<Connect4GameProps> = ({ onBack, audio, addCoins, mp }) => {
  const [board, setBoard] = useState<BoardState>(createBoard());
  const boardRef = useRef<BoardState>(createBoard());
  
  const [gameStage, setGameStage] = useState<GameStage>('MENU');
  
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winState, setWinState] = useState<WinState>({ winner: null, line: [] });
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Online State
  const [onlineStep, setOnlineStep] = useState<'connecting' | 'lobby' | 'game'>('connecting');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeReaction, setActiveReaction] = useState<{id: string, isMe: boolean} | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  // Identity
  const { username, currentAvatarId, avatarsCatalog } = useCurrency();

  // Animation State
  const [animatingCell, setAnimatingCell] = useState<{r: number, c: number} | null>(null);
  const isAnimatingRef = useRef(false);
  const animationTimerRef = useRef<any>(null);

  // Audio
  const { playMove, playLand, playGameOver, playVictory, resumeAudio } = audio;
  
  useEffect(() => {
      return () => {
          if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
          isAnimatingRef.current = false;
      };
  }, []);

  useEffect(() => {
      boardRef.current = board;
  }, [board]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Sync Self Info for Online
  useEffect(() => {
      mp.updateSelfInfo(username, currentAvatarId);
  }, [username, currentAvatarId, mp]);

  // Handle Online Connection
  useEffect