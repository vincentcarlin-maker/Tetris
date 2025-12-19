
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, RefreshCw, Trophy, Coins, HelpCircle, LayoutGrid, Zap, Skull } from 'lucide-react';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useHighScores } from '../../hooks/useHighScores';
import { TutorialOverlay } from '../Tutorials';

// --- TYPES ---
type Shape = number[][];
interface Piece {
    id: string;
    shape: Shape;
    color: string;
}

const COLORS = [
    '#00f3ff', // Cyan
    '#ff00ff', // Pink
    '#9d00ff', // Purple
    '#ffe600', // Yellow
    '#00ff9d', // Green
    '#ff4d4d', // Red
    '#ff9f43'  // Orange
];

const SHAPES: