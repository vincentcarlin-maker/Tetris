import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ context: {} as any }));
vi.mock('../context/GlobalContext', () => ({ useGlobal: () => state.context }));
vi.mock('../components/MainMenu', () => ({ MainMenu: ({ onSelectGame }: any) => <button onClick={() => onSelectGame('tetris')}>Jouer</button> }));
vi.mock('../components/tetris/TetrisGame', () => ({ TetrisGame: ({ onBack, addCoins }: any) => <div><button onClick={onBack}>Retour</button><button onClick={() => addCoins(10)}>Terminer</button></div> }));
import { GameRouter } from '../components/GameRouter';
beforeEach(() => {
    state.context = {
        currentView: 'menu', isAuthenticated: false, guestPlayedGames: ['tetris'],
        setCurrentView: vi.fn(view => { state.context.currentView = view; }),
        setShowLoginModal: vi.fn(), setGlobalAlert: vi.fn(), registerGuestPlay: vi.fn(),
        currency: { addCoins: vi.fn(), isSuperUser: false }, audio: { playCoin: vi.fn() },
        daily: { reportQuestProgress: vi.fn() }, mp: {}, highScores: { highScores: {} },
        supabase: { globalLeaderboard: [], onlineUsers: [] }, disabledGames: [],
        featureFlags: { economy_system: true, social_module: false }, recordTransaction: vi.fn(),
    };
});
it('allows repeated guest games even when the old trial was already used', () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<GameRouter />); });
    for (let attempt = 0; attempt < 2; attempt++) {
        act(() => { renderer.root.findByType('button').props.onClick(); });
        expect(state.context.currentView).toBe('tetris');
        act(() => { renderer.update(<GameRouter />); });
        act(() => { renderer.root.findAllByType('button')[0].props.onClick(); });
        act(() => { renderer.update(<GameRouter />); });
    }
    expect(state.context.setShowLoginModal).not.toHaveBeenCalled();
    expect(state.context.registerGuestPlay).not.toHaveBeenCalled();
    act(() => renderer.unmount());
});
it('awards guest coins locally without recording a cloud transaction', () => {
    state.context.currentView = 'tetris';
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<GameRouter />); });
    act(() => { renderer.root.findAllByType('button')[1].props.onClick(); });
    expect(state.context.currency.addCoins).toHaveBeenCalledWith(10);
    expect(state.context.recordTransaction).not.toHaveBeenCalled();
    act(() => renderer.unmount());
});
