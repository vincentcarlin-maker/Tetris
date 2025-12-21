
import { useEffect, useRef } from 'react';
import { Color, Value, Turn, Card as CardType } from '../types';

interface UseUnoNetworkProps {
    mp: any;
    state: any; // Return type of useUnoState
    callbacks: {
        onMoveAnim: (card: CardType, index: number, actor: Turn, isRemote: boolean) => void;
        onDrawAnim: (target: Turn, amount: number) => void;
        onGameOver: (winner: Turn) => void;
        onRestart: () => void;
        playAudio: (type: 'VICTORY' | 'GAMEOVER' | 'HIT' | 'MOVE') => void;
    };
    gameMode: 'SOLO' | 'ONLINE';
    setActiveReaction: (r: any) => void;
}

export const useUnoNetwork = ({ mp, state, callbacks, gameMode, setActiveReaction }: UseUnoNetworkProps) => {
    const handleDataRef = useRef<(data: any) => void>(null);

    // Mettre à jour la ref pour toujours avoir accès au state le plus récent dans le callback
    useEffect(() => {
        handleDataRef.current = (data: any) => {
            if (data.type === 'UNO_INIT') {
                state.setPlayerHand(data.hand);
                const dummies = Array.from({ length: data.oppHandCount }).map((_, i) => ({ id: `opp_init_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 }));
                state.setCpuHand(dummies);
                state.setDiscardPile([data.topCard]);
                state.setActiveColor(data.topCard.color === 'black' ? 'red' : data.topCard.color);
                state.setTurn(data.startTurn === mp.peerId ? 'PLAYER' : 'CPU');
                state.setDeck(Array(20).fill(null) as any); // Fake deck for visual
                state.setGameState('playing');
                state.setMessage("La partie commence !");
                state.setIsWaitingForHost(false);
                state.setPlayDirection(1);
            }
            if (data.type === 'UNO_PLAY') {
                const card = data.card;
                // Trigger animation via callback which handles logic
                callbacks.onMoveAnim(card, 0, 'CPU', true);
                if (data.nextColor) state.setActiveColor(data.nextColor);
            }
            if (data.type === 'UNO_DRAW_REQ') {
                if (mp.isHost) callbacks.onDrawAnim('CPU', data.amount || 1);
            }
            if (data.type === 'UNO_DRAW_NOTIFY') {
                const count = data.count;
                const dummies = Array.from({ length: count }).map((_, i) => ({ 
                    id: `opp_draw_${Date.now()}_${i}`, color: 'black' as Color, value: '0' as Value, score: 0 
                }));
                state.setCpuHand((prev: any) => [...prev, ...dummies]);
                state.setMessage("L'adversaire pioche...");
                state.setOpponentCalledUno(false);
            }
            if (data.type === 'UNO_DRAW_RESP') {
                const newCards = data.cards;
                state.setPlayerHand((prev: any) => [...prev, ...newCards]);
                state.setHasDrawnThisTurn(true);
                // Check compatibility logic should ideally be here or passed
                const last = newCards[newCards.length-1];
                // Simple check for message update
                state.setMessage("Carte piochée !");
            }
            if (data.type === 'UNO_PASS') {
                state.setTurn('PLAYER');
                state.setMessage("À toi de jouer !");
            }
            if (data.type === 'UNO_SHOUT') {
                state.setUnoShout('CPU');
                state.setOpponentCalledUno(true);
                callbacks.playAudio('HIT');
                setTimeout(() => state.setUnoShout(null), 1500);
            }
            if (data.type === 'UNO_GAME_OVER') {
                if (state.gameState === 'gameover') return;
                callbacks.onGameOver(data.winner === mp.peerId ? 'PLAYER' : 'CPU');
            }
            if (data.type === 'CHAT') {
                state.setChatHistory((prev: any) => [...prev, { id: Date.now(), text: data.text, senderName: data.senderName || 'Opposant', isMe: false, timestamp: Date.now() }]);
            }
            if (data.type === 'REACTION') { 
                setActiveReaction({ id: data.id, isMe: false }); 
                setTimeout(() => setActiveReaction(null), 3000); 
            }
            if (data.type === 'LEAVE_GAME') { 
                state.setOpponentLeft(true); 
                callbacks.onGameOver('PLAYER'); 
            }
            if (data.type === 'REMATCH_START') {
                callbacks.onRestart();
            }
        };
    });

    useEffect(() => {
        const unsubscribe = mp.subscribe((data: any) => {
            if (handleDataRef.current) handleDataRef.current(data);
        });
        return () => unsubscribe();
    }, [mp.subscribe]);

    const sendAction = (type: string, payload: any = {}) => {
        if (gameMode === 'ONLINE') {
            mp.sendData({ type, ...payload });
        }
    };

    return { sendAction };
};
