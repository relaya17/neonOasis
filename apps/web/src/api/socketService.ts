import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@neon-oasis/shared';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_WS_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

/** כשעוקפים API (dev) — לא מתחברים; BoardContainer בודק לפני connect */
export const isBypassApi = () =>
  (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';

/** Retry up to 3 times with exponential backoff */
const RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;
const RECONNECT_DELAY_MAX_MS = 10000;

export type TableUpdatePayload = Record<string, unknown>;

const DISCONNECT_BEFORE_CONNECT = new Error('Socket disconnected before connect completed');

class SocketService {
  public socket: Socket | null = null;
  private _connectPromise: Promise<void> | null = null;
  private _connectReject: ((err: Error) => void) | null = null;

  /**
   * חיבור לשרת עם Token (אחרי אימות AI Guardian).
   * כולל ניסיונות התחברות חוזרים (retries) ועדכון state.
   */
  connect(token: string): Promise<void> {
    if (isBypassApi()) {
      return Promise.reject(new Error('BYPASS_API'));
    }
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    if (this.socket && !this.socket.connected) {
      this.disconnect();
    }
    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = new Promise((resolve, reject) => {
      this._connectReject = (err: Error) => {
        this._connectReject = null;
        this._connectPromise = null;
        reject(err);
      };
      this.socket = io(SOCKET_URL, {
        auth: { token, userId: token },
        transports: ['websocket', 'polling'],
        reconnection: RECONNECT_ATTEMPTS > 0,
        reconnectionAttempts: RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY_MS,
        reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
        timeout: 8000,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.socket.on('connect', () => {
        if (this._connectPromise) {
          console.log('Connected to Vegas Server');
          this._connectReject = null;
          this._connectPromise = null;
          resolve();
        }
      });

      this.socket.on('connect_error', () => {
        // quiet — avoid console flood (ERR_CONNECTION_REFUSED / websocket error)
      });

      this.socket.on('disconnect', () => {});

      this.socket.io.on('reconnect_attempt', () => {});

      this.socket.io.on('reconnect_failed', () => {
        if (this._connectReject) {
          this._connectReject(new Error('Reconnection failed'));
        }
      });
    });

    return this._connectPromise;
  }

  /** Return the underlying socket (used by useSyncSocket to attach game-state listeners) */
  getSocket(): Socket | null {
    return this.socket;
  }

  /** הצטרפות לשולחן שש-בש */
  joinTable(tableId: string) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_TABLE, { tableId });
  }

  /** שליחת מהלך ב-Live */
  sendMove(tableId: string, moveData: Record<string, unknown>) {
    this.socket?.emit(SOCKET_EVENTS.PLAYER_MOVE, { tableId, ...moveData });
  }

  /** האזנה לעדכונים מהיריב / מהשרת */
  onTableUpdate(callback: (data: TableUpdatePayload) => void) {
    this.socket?.on(SOCKET_EVENTS.TABLE_UPDATE, callback);
  }

  /** הסרת מאזין לעדכוני שולחן */
  offTableUpdate() {
    this.socket?.off(SOCKET_EVENTS.TABLE_UPDATE);
  }

  /** האזנה לסיום משחק (ניצחון, פרס) */
  onGameOver(callback: (data: { winnerId: string; prize: number; animation?: string }) => void) {
    this.socket?.on(SOCKET_EVENTS.GAME_OVER, callback);
  }

  offGameOver() {
    this.socket?.off(SOCKET_EVENTS.GAME_OVER);
  }

  /** האזנה להימור שהוצב */
  onBetPlaced(callback: (data: { userId: string; amount: number }) => void) {
    this.socket?.on(SOCKET_EVENTS.BET_PLACED, callback);
  }

  offBetPlaced() {
    this.socket?.off(SOCKET_EVENTS.BET_PLACED);
  }

  disconnect() {
    if (this._connectReject) {
      this._connectReject(DISCONNECT_BEFORE_CONNECT);
    }
    this._connectReject = null;
    this._connectPromise = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      if (this.socket.connected) this.socket.disconnect();
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
