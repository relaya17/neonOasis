import { useEffect, useRef, useCallback } from 'react';
import { type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@neon-oasis/shared';
import { useGameStore } from '../game/store';
import { useWalletStore } from '../store/store';
import { useSessionStore } from '../auth/authStore';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { consumeActionTimestamp, consumeActionPayload } from '../../shared/hooks/usePredictiveMove';
import { socketService, isBypassApi } from '../../api/socketService';

/**
 * useSyncSocket — attaches game-state listeners to the shared socketService singleton.
 * Does NOT create its own connection; relies on socketService.connect() being called
 * (e.g. from BoardContainer or LobbyView) before this hook is active.
 *
 * When the API is online and a user is logged in, this hook will auto-connect via
 * socketService.connect(userId).
 */
export function useSyncSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setState = useGameStore((s) => s.setState);
  const sessionUserId = useSessionStore((s) => s.userId);
  const apiOnline = useApiStatusStore((s) => s.online);

  const attachListeners = useCallback(
    (socket: Socket) => {
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

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });
    },
    [setState],
  );

  useEffect(() => {
    const shouldConnect = apiOnline === true && !isBypassApi() && !!sessionUserId;
    if (!shouldConnect) {
      // Detach sync listeners but don't destroy the shared socket
      if (socketRef.current) {
        socketRef.current.off(SOCKET_EVENTS.ROOM_STATE);
        socketRef.current.off(SOCKET_EVENTS.ROOM_CONFIRM);
        socketRef.current.off(SOCKET_EVENTS.BALANCE_UPDATED);
        socketRef.current = null;
      }
      return;
    }

    // Connect via the shared singleton (no-op if already connected with same token)
    socketService.connect(sessionUserId).catch(() => {
      // Connection failed — gracefully handled in socketService
    });

    const socket = socketService.getSocket();
    if (!socket) return;

    socketRef.current = socket;
    attachListeners(socket);

    return () => {
      // Clean up only the sync-specific listeners; leave socket alive for other consumers
      socket.off(SOCKET_EVENTS.ROOM_STATE);
      socket.off(SOCKET_EVENTS.ROOM_CONFIRM);
      socket.off(SOCKET_EVENTS.BALANCE_UPDATED);
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [apiOnline, sessionUserId, attachListeners]);

  return socketRef;
}
