# Socket חיבור/ניתוק — תנאים ואזהרות

## שני חיבורים

1. **socketService** (`api/socketService.ts`) — משמש משחק ששבש בלבד. מתחבר ב-`BoardContainer` ב-`connect(token)`.
2. **useSyncSocket** (ב-`SyncProvider`) — סנכרון state (ROOM_STATE, ROOM_CONFIRM, BALANCE_UPDATED). מתחבר אוטומטית כשהאפליקציה נטענת ו-`apiOnline === true`.

## מתי מתנתקים

| אירוע | socketService | useSyncSocket |
|--------|----------------|----------------|
| **pagehide** (רענון/סגירת טאב) | App: `disconnect()` | useSyncSocket: `disconnectSync()` |
| **beforeunload** | App: `disconnect()` | useSyncSocket: `disconnectSync()` |
| **visibilitychange → hidden** | App: `disconnect()` | useSyncSocket: `disconnectSync()` |
| **ניווט החוצה מ-BoardContainer** | BoardContainer cleanup: `disconnect()` | — |
| **apiOnline === false** | BoardContainer cleanup | useSyncSocket: בתחילת effect מנתק אם יש socket ואז return |

## מתי מתחברים מחדש

| אירוע | socketService | useSyncSocket |
|--------|----------------|----------------|
| **visibilitychange → visible** | רק ב-BoardContainer: אם `!isConnected` מעלים `reconnectKey` → effect רץ מחדש ו-`connect()` | אם `socketRef.current === null` מעלים `reconnectKey` → effect רץ מחדש ויוצר socket חדש |
| **כניסה ל-BoardContainer** | effect רץ ו-`connect(token)` | — |

## תנאים חשובים

- **socketService.connect()**: אם כבר קיים socket לא מחובר (למשל אחרי ניתוק מהשרת), קודם `disconnect()` ואז חיבור חדש.
- **socketService.disconnect()**: אם יש `connect()` בהמתנה, דוחים את ה-Promise עם `"Socket disconnected before connect completed"` כדי ש-`.then()` לא ירוץ על socket שכבר מנותק.
- **useSyncSocket**: ב-cleanup תמיד מנתקים את ה-`socket` של הריצה הנוכחית (לא לפי ref), ו-`socketRef.current = null` רק אם ה-ref עדיין מצביע על אותו socket (כדי לא למחוק socket חדש).
- **useSyncSocket.disconnectSync()**: מנתקים רק אם `socketRef.current === socket` (אותו instance) כדי לא לנתק socket של effect אחר.

## אזהרות (console)

- `connect_error` עם ECONNREFUSED → "API server not running. Start both: npm run dev".
- BoardContainer: כישלון חיבור מדווח ב-`console.warn`; אם הסיבה היא disconnect לפני סיום (משתמש עזב) — לא מדפיסים שגיאה.
