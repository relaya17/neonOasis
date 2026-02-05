# Production Spec — סגירת Gaps מול השוק העולמי

מסמך טכני לביצוע ברמת Production: Latency, Security, Onboarding, Provably Fair, App Store.

---

## 0. ה"סטארט-אפ פקטור" (Disruption Layer)

### 1️⃣ Social Betting Layer (הימור חברתי)
- **רעיון**: משתמשים יכולים "לגבות" שחקן בזמן משחק ולהרוויח יחד איתו.
- **ליבה טכנית**:
  - מודל P2P: `backing_bets` עם `supporter_id`, `player_id`, `stake`, `odds`, `status`.
  - חלוקת רווחים: אחוז קבוע לשחקן (e.g. 10–20%) + remainder לתומכים לפי stake.
  - UI: כפתור "Back Player" בפיד/צפייה, אימות שקיפות (history + payouts).

### 2️⃣ AI Personal Dealer (דילר אישי מבוסס AI)
- **רעיון**: הדילר לומד סגנון משחק, מדבר בזמן אמת ומחזיר תובנות.
- **ליבה טכנית**:
  - פרופיל שחקן (playstyle vectors) נבנה מאירועים (`move`, `risk`, `timing`).
  - תגובות בזמן אמת: תבניות NLP + טריגרים ("ראיתי ששיחקת כך אתמול").
  - Voice/UX: אינטגרציה עם שכבת הסאונד (Voice-Over מותאם).

### 3️⃣ Interoperability (נכסים חוצי משחקים)
- **רעיון**: פריטים/מטבעות משותפים בין כל המשחקים.
- **ליבה טכנית**:
  - קטלוג פריטים אחיד (`items`, `inventory`) עם `game_scope`.
  - Cross-game cosmetics: `item_id` = "neon_crown" פעיל בכל משחק.
  - Economy אחידה: אותו `currency_balance` לכל המשחקים.

---

## 0.1 TODOs טכניים (MVP → Production)

### Sprint A — Social Betting (MVP)
1. **DB**: טבלת `backing_bets` + אינדקסים + סטטוסים (pending/won/lost/settled).
2. **API**: `POST /api/bets/back` (stake), `POST /api/bets/settle` (payout), `GET /api/bets/history`.
3. **Rules**: אחוז קבוע לשחקן (10–20%) + חלוקה לתומכים לפי stake.
4. **Feed UI**: כפתור "Back Player" במצב צפייה + מודאל אישור.
5. **Audit**: Log payouts ל־`wallet_transactions`.

### Sprint B — AI Personal Dealer (MVP)
1. **Events**: ללכוד `move`, `timing`, `risk` ל־`player_events`.
2. **Profile**: לחשב playstyle vectors (aggressive/defensive/tempo).
3. **Prompts**: תבניות תגובה עם טריגרים ("אתמול בטורניר…").
4. **Voice**: hook לשכבת הסאונד (voice lines + ducking).
5. **Safety**: תקרה לתדירות הודעות (anti-spam).

### Sprint C — Interoperability (MVP)
1. **DB**: `items`, `inventory`, `item_effects`, `game_scope`.
2. **API**: `GET /api/items`, `POST /api/inventory/equip`.
3. **UI**: תצוגת פריטים משותפת בפרופיל.
4. **Sync**: טעינת פריטים ברמת `GameRoom` עם fallback.

---

## 0.2 Sprint Checklist — Latency / Security / Onboarding

### Latency (Zero Lag)
- Client prediction + rollback animation (בדיקות E2E).
- Snapshot interpolation: 60FPS, 100ms blending.
- WebSocket latency יעד < 50ms (region + Redis).

### Security (Vault Model)
- Rate limiting על endpoints ציבוריים.
- Validation schema לכל body/query.
- Separation מוכנה ל־WALLET_SERVICE_URL.

### Onboarding (2 Click)
- Social auth (Google/Apple) + silent wallet.
- Progressive profiling (AI Guardian רק לפני כסף אמיתי).
- 2-step deposit flow + haptic/voice confirmation.

---

## 1. טיפול ב-Latency (מהירות אפס)

### דרישות
- **Client-Side Prediction & Interpolation**: הממשק מחזה תנועת קובייה/כלי ומציג מיידית; השרת מאמת ברקע.
- **State Synchronization**: Snapshot Interpolation — השרת שולח רק "נקודות ציון"; הלקוח משלים אנימציה חלקה ב-60FPS.
- **Tech Stack**: Node.js + Socket.io על **Redis Adapter** ל-Scale.

### יישום
| רכיב | סטטוס |
|------|--------|
| `usePredictiveMove` | קיים — שליחת action עם actionId, pending עד confirm |
| `useSnapshotInterpolation` | קיים — אינטרפולציה בין current ל-snapshot על פני 100ms ב-requestAnimationFrame |
| Socket.io Redis Adapter | קיים — כאשר `REDIS_URL` מוגדר, מתחבר ל-Redis Adapter (pub/sub בין instances) |
| `StateSnapshot` / `ActionConfirmation` | טיפוסים ב-`@neon-oasis/shared` — שרת שולח ROOM_CONFIRM עם snapshot |

### שאלת בקרה
> "האם השתמשת ב-Redis כדי לנהל את ה-Queue של הארנקים?"  
> **תשובה**: Redis משמש כ-Adapter ל-Socket.io (broadcast בין instances). Queue של ארנקים מנוהלת ב-PostgreSQL עם טרנזקציות ו-Idempotency Keys.

---

## 2. אבטחה (Security — Vault Model)

### דרישות
- **Decoupling**: הפרדה בין שרת משחק לשרת ארנקים (Cold/Hot).
- **Hot Wallet API**: מנהל רק טרנזקציות פעילות של המשחק הנוכחי (Escrow → Settlement).
- **Vault (Cold)**: שירות נפרד עם הצפנה (AES-256) ליתרות — לא נגיש מ-Frontend.
- **Idempotency Keys**: כל העברת כספים (P2P) עם מפתח ייחודי — שליחה כפולה לא מורידה כסף פעמיים.

### יישום
| רכיב | סטטוס |
|------|--------|
| Idempotency | טבלה `idempotency_keys`; P2P start/end מקבלים `idempotencyKey` — תשובה נשמרת ומוחזרת ב-retry |
| Race condition | `settleP2P`: `SELECT ... FOR UPDATE` על `escrow_holds` — רק settlement אחד מנצח |
| Cold/Hot split | מתועד: ארכיטקטורה נוכחית = Hot (Escrow + DB). Vault = שירות נפרד עתידי (WALLET_SERVICE_URL). |

### שאלת בקרה
> "איך המערכת מטפלת ב-Race Condition כששני אנשים מנצחים בשבריר שנייה?"  
> **תשובה**: Locking ב-DB — ב-`settleP2P` אנחנו נועלים את שורות ה-escrow עם `SELECT ... FOR UPDATE`. רק transaction אחד מקבל 2 שורות; השני מקבל 0 ומקבל "Escrow not found or already settled".

---

## 3. חווית כניסה (Onboarding — 2 Click)

### דרישות
- **Social Auth + Silent Wallet**: Web3Auth/Privy — כניסה עם Google/Apple ויצירת ארנק מאחורי הקלעים.
- **Progressive Profiling**: לא לבקש פרטים. AI Guardian (גיל 18+) רק כשמשתמש מנסה להמר על כסף אמיתי.

### יישום
| רכיב | סטטוס |
|------|--------|
| Social Auth | כרגע לא Web3Auth/Privy — יש auth בסיסי; ניתן לחבר OAuth + יצירת user + balance ב-DB כ"ארנק". |
| AI Guardian | `GuardianGate` / Age verification — מופעל לפני "Play for Coins" (לא בכניסה לאתר) — מתועד ב-PRD. |

---

## 4. Provably Fair

### דרישות
- **CSPRNG**: מחולל אקראי קריפטוגרפי.
- **Verification**: לפני משחק — שרת שולח "Hashed Seed" (commitment). אחרי משחק — גילוי מפתח; הלקוח מאמת.

### יישום
| רכיב | סטטוס |
|------|--------|
| `generateProvablyFairRoll` | HMAC-SHA256 עם RNG_SECRET; dice מ-hash (CSPRNG via crypto.randomBytes). |
| **Commit** | `POST /api/games/rng/commit` — body: `{ gameId, clientSeed? }` — מחזיר `{ commitment, nonce }`. Seed נשמר ב-`rng_commits`. |
| **Reveal** | `GET /api/games/rng/reveal?gameId=...` — מחזיר `{ seed, nonce, hash, dice, timestamp }`. הלקוח מאמת: `hash(seed) === commitment` ו-dice תואמים. |

---

## 5. App Store Compliance

### דרישות
- **IAP Bridge**: משתמש קונה "Credits" ב-Apple IAP; המערכת ממירה ל-Oasis/Credits בארנק הפנימי.
- **Geo-Fencing**: אם המשתמש במדינה אסורה — "Play for Coins" הופך ל-"Play for Fun".

### יישום
| רכיב | סטטוס |
|------|--------|
| IAP | `POST /api/iap/apple` — body: `userId`, `transactionId`, `productId`, `credits?`. Idempotent לפי transactionId; credיט balance. Production: לחבר אימות receipt עם Apple. |
| Geo | `GET /api/geo` — מחזיר `country`, `skillOnly`, `playForCoinsAllowed`. Frontend: אם `playForCoinsAllowed === false` — להציג "Play for Fun" בלבד. `GEO_RESTRICTED_COUNTRIES` (env) = רשימת קודים מופרדים בפסיקים. |

---

## 6. 3D ו-Background

### שאלת בקרה
> "האם ה-3D רץ ב-Canvas נפרד כדי לא להכביד על ה-UI?"  
> **תשובה**: כן — React Three Fiber משתמש ב-`<Canvas>` (WebGL) בתוך DOM נפרד; ניתן להריץ גם ב-OffscreenCanvas/Worker אם נדרש (מתועד כ-best practice).

---

## 7. משתני סביבה (Production)

| משתנה | שימוש |
|--------|--------|
| `REDIS_URL` | Socket.io Redis Adapter — Scale בין instances |
| `RNG_SECRET` | Provably Fair HMAC — להחליף ב-Production |
| `GEO_STUB_COUNTRY` | Stub: מדינה קבועה (למשל IL) |
| `GEO_RESTRICTED_COUNTRIES` | רשימת מדינות שבהן "Play for Coins" אסור (למשל XX,YY) |

---

## 8. מיגרציות להרצה

```bash
# Idempotency + RNG commit/reveal
psql $DATABASE_URL -f apps/api/src/db/migrations/006_idempotency_escrow_lock.sql
psql $DATABASE_URL -f apps/api/src/db/migrations/007_rng_commit_reveal.sql
```
