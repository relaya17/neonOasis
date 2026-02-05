import { useCallback } from 'react';
import { useGameStore } from '@/features/game/store';
import { useSyncSocket } from '@/features/sync/useSyncSocket';
import { SOCKET_EVENTS } from '@neon-oasis/shared';

/** Latency compensation: apply move locally, send to server, soft-fix on confirm */
const actionTimestamps = new Map<string, number>();
const actionPayloads = new Map<string, unknown>();

export function recordActionTimestamp(actionId: string, timestamp: number) {
  actionTimestamps.set(actionId, timestamp);
}

export function consumeActionTimestamp(actionId: string): number | null {
  const ts = actionTimestamps.get(actionId);
  if (ts != null) actionTimestamps.delete(actionId);
  return ts ?? null;
}

export function recordActionPayload(actionId: string, payload: unknown) {
  actionPayloads.set(actionId, payload);
}

export function consumeActionPayload(actionId: string): unknown {
  const payload = actionPayloads.get(actionId);
  if (payload !== undefined) actionPayloads.delete(actionId);
  return payload;
}

export function usePredictiveMove() {
  const socket = useSyncSocket();
  const { roomId, setState, setPendingAction } = useGameStore();

  const sendAction = useCallback(
    (payload: unknown) => {
      const s = socket.current;
      if (!s || !roomId) return;
      const actionId = crypto.randomUUID();
      setPendingAction(actionId);
      recordActionTimestamp(actionId, Date.now());
      recordActionPayload(actionId, payload);
      s.emit(SOCKET_EVENTS.ROOM_ACTION, {
        roomId,
        payload,
        clientTimestamp: Date.now(),
        actionId,
      });
    },
    [roomId, setPendingAction, socket]
  );

  return { sendAction };
}
