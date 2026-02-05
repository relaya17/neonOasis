import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@neon-oasis/shared';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_WS_URL ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

/** כשהשרת לא רץ — ננסה מספר פעמים עם delay */
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;

export type TableUpdatePayload = Record<string, unknown>;

class SocketService {
  public socket: Socket | null = null;
  private _connectPromise: Promise<void> | null = null;

  /**
   * חיבור לשרת עם Token (אחרי אימות AI Guardian).
   * כולל ניסיונות התחברות חוזרים (retries) ועדכון state.
   */
  connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token, userId: token },
        transports: ['websocket', 'polling'],
        reconnection: RECONNECT_ATTEMPTS > 0,
        reconnectionAttempts: RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY_MS,
        reconnectionDelayMax: 5000,
        timeout: 8000,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Vegas Server 🎰');
        this._connectPromise = null;
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        const msg = err?.message ?? '';
        if (msg.includes('refused') || msg.includes('ECONNREFUSED')) {
          console.warn('Neon Oasis: API server not running. Start both: npm run dev');
        } else {
          console.warn('Socket connect_error:', msg);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      this.socket.io.on('reconnect_attempt', (attempt) => {
        console.log(`Reconnect attempt ${attempt}/${RECONNECT_ATTEMPTS}`);
      });

      this.socket.io.on('reconnect_failed', () => {
        this._connectPromise = null;
        reject(new Error('Reconnection failed'));
      });
    });

    return this._connectPromise;
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
    this.socket?.disconnect();
    this.socket = null;
    this._connectPromise = null;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
