/** Real-time sync — actions & server snapshots */

export interface SyncAction {
  roomId: string;
  userId: string;
  payload: unknown;
  clientTimestamp: number;
}

/** Full state snapshot from server — prevents desync */
export interface StateSnapshot {
  roomId: string;
  state: unknown;
  version: number;
  serverTimestamp: number;
}

/** Latency compensation: client prediction, then server confirmation */
export interface ActionConfirmation {
  actionId: string;
  accepted: boolean;
  snapshot?: StateSnapshot;
  serverTimestamp: number;
}
