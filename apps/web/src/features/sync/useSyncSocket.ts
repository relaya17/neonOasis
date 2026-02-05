import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { useGameStore } from '../game/store';
import { useWalletStore } from '../store/store';
import { useSessionStore } from '../auth/authStore';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { consumeActionTimestamp, consumeActionPayload } from '../../shared/hooks/usePredictiveMove';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:4000';

/** When API is down, avoid reconnect spam */
const RECONNECT_ATTEMPTS = 0;
const RECONNECT_DELAY_MS = 4000;
const RECONNECT_DELAY_MAX_MS = 10000;

export function useSyncSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setState = useGameStore((s) => s.setState);
  const sessionUserId = useSessionStore((s) => s.userId);
  const apiOnline = useApiStatusStore((s) => s.online);

  useEffect(() => {
    if (apiOnline === false) {
      return;
    }
    const userId = sessionUserId ?? undefined;
    const socket = io(WS_URL, {
      transports: ['websocket'],
      auth: userId ? { userId, token: userId } : {},
      reconnection: RECONNECT_ATTEMPTS > 0,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY_MS,
      reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on(SOCKET_EVENTS.ROOM_STATE, (payload: { state: unknown }) => {
      setState(payload.state as Parameters<typeof setState>[0]);
    });

    socket.on(SOCKET_EVENTS.ROOM_CONFIRM, (payload: { snapshot?: { state: unknown }; actionId?: string }) => {
      const nextState = payload.snapshot?.state as Parameters<typeof setState>[0] | undefined;
      if (nextState) setState(nextState);
      if (payload.actionId) {
        const ts = consumeActionTimestamp(payload.actionId);
        const actionPayload = consumeActionPayload(payload.actionId);
        if (ts != null) {
          const moveMs = Math.max(0, Date.now() - ts);
          let enrichedPayload = actionPayload;
          if (
            actionPayload &&
            typeof actionPayload === 'object' &&
            nextState &&
            typeof nextState === 'object' &&
            'kind' in nextState &&
            (nextState as { kind?: string }).kind === 'backgammon'
          ) {
            const action = actionPayload as { from?: number | 'bar'; to?: number | 'off' };
            const state = nextState as {
              board?: number[];
              turn?: 0 | 1;
            };
            if (
              action &&
              typeof action === 'object' &&
              Array.isArray(state.board) &&
              typeof state.turn === 'number'
            ) {
              const to = action.to;
              if (typeof to === 'number' && to >= 0 && to < state.board.length) {
                const v = state.board[to];
                let createdBlot = false;
                let createdBlock = false;
                if (state.turn === 0) {
                  if (v === 1) createdBlot = true;
                  if (v >= 2) createdBlock = true;
                } else {
                  if (v === -1) createdBlot = true;
                  if (v <= -2) createdBlock = true;
                }
                if (createdBlot || createdBlock) {
                  enrichedPayload = { ...actionPayload, createdBlot, createdBlock };
                }
              }
            }
          }
          window.dispatchEvent(new CustomEvent('ai-dealer:move', { detail: { moveMs, actionPayload: enrichedPayload } }));
        }
      }
    });

    socket.on(SOCKET_EVENTS.BALANCE_UPDATED, (payload: { balance: string }) => {
      useWalletStore.getState().setBalance(payload.balance ?? '0');
    });

    socket.on('connect_error', () => {
      // Reconnection handled by socket.io; optional: show "Reconnecting..." in UI
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiOnline, setState, sessionUserId]);

  return socketRef;
}
