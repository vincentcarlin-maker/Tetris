import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useTetrisLogic } from '../components/tetris/hooks/useTetrisLogic';

vi.mock('../hooks/useGameLoop', () => ({ useGameLoop: () => {} }));
vi.mock('../hooks/useHighScores', () => ({ useHighScores: () => ({ highScores: {}, updateHighScore: () => {} }) }));
const audio = Object.fromEntries(['playMove', 'playRotate', 'playLand', 'playClear', 'playBlockDestroy', 'playGameOver'].map(name => [name, vi.fn()]));
let renderer: ReactTestRenderer;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { if (renderer) act(() => renderer.unmount()); vi.useRealTimers(); });
it('settles after starting and moving a piece instead of continuously rendering the ghost', () => {
    let game: ReturnType<typeof useTetrisLogic>;
    let renders = 0;
    const addCoins = vi.fn();
    const Harness = () => {
        if (++renders > 40) throw new Error('Render loop detected');
        game = useTetrisLogic(audio as any, addCoins);
        return null;
    };
    act(() => { renderer = create(<Harness />); });
    act(() => { game.startGame(); });
    expect(game.inMenu).toBe(false);
    expect(game.ghostPlayer).not.toBeNull();
    const before = renders;
    act(() => { game.movePlayer(1); });
    expect(renders - before).toBeLessThan(10);
    expect(game.ghostPlayer.pos.x).toBe(game.player.pos.x);
    expect(game.board).toHaveLength(20);
});
