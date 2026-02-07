# 🎰 The Neon Oasis

**A high-end, 80's Vegas-themed social gaming platform featuring 3D Skill Games, AI-driven verification, and a TikTok-style social feed.**

---

## 📚 Documentation

**→ See [INDEX.md](./INDEX.md) for complete documentation navigation**

### Quick Links
| Document | Purpose | Time |
|----------|---------|------|
| **[QUICK_START.md](./QUICK_START.md)** ⚡ | Get running in 5 minutes | 5 min |
| **[PRD.md](./PRD.md)** 🎰 | Complete product requirements | 20 min |
| **[VISUAL_ROADMAP.md](./VISUAL_ROADMAP.md)** 🗺️ | Visual timeline & phases | 10 min |
| **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)** 🚀 | Step-by-step tasks | 30 min |
| **[GAP_ANALYSIS.md](./GAP_ANALYSIS.md)** 📊 | Current vs. target state | 15 min |
| **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** 👨‍💻 | Full developer onboarding | 30 min |
| **[docs/AI_GUARDIAN_GUIDE.md](./docs/AI_GUARDIAN_GUIDE.md)** 🛡️ | AI implementation guide | 20 min |

---

## 🚀 Quick Start

### הפעלה ממקום אחד (Install + Build + Run)

```bash
# הכל בפקודה אחת — התקנה, בנייה, והרצת API + Web
pnpm run start
# או
pnpm run run
```

**או** דרך קבצי ההרצה:
- **Windows (CMD):** לחיצה כפולה על `run-dev.cmd`
- **Windows (PowerShell):** `.\run-dev.ps1`

### הרצה ידנית

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env   # Windows: copy .env.example .env

# 3. Build (shared → api → web)
pnpm run build

# 4. Start development servers (both API + Web)
pnpm run dev

# OR start individually:
pnpm run dev:web    # Frontend → http://localhost:5273
pnpm run dev:api    # Backend → http://localhost:4000
```

### העלאה ל-GitHub

לאחר שינויים, להעלות ל-[GitHub (relaya17/neonOasis)](https://github.com/relaya17/neonOasis):

```bash
# הרץ מתוך תיקיית הפרויקט:
.\push-to-github.ps1    # PowerShell
# או
push-to-github.cmd     # CMD
```

או ידנית:
```bash
git add .
git commit -m "feat: your message"
git remote add origin https://github.com/relaya17/neonOasis.git   # רק בפעם הראשונה
git push -u origin main
```

---

## 📊 Project Overview

**Current Status:** 65% Complete (MVP Foundation)  
**Estimated Time to Launch:** 2-3 weeks (with critical features)  
**Estimated Time to Full Vision:** 8-10 weeks

### What's Built ✅
- React 18 + Vite + TypeScript frontend
- 3D Backgammon with physics (Cannon.js) + **Pot/Entry fee/Rake** (Skill-Based)
- **Snooker** — ניאון, מקלות פרימיום, גיר/בירה, קופה ומשחק עם דמי כניסה
- **Poker** (Texas) + **Pot, משחק עם קופה**, BANK
- Real-time multiplayer (Socket.io)
- TikTok-style feed (VegasFeed)
- **Live Sidebar** גנרי — מונה צופים, זרם מתנות, כפתורי מתנות (סנוקר/ששבש/פוקר)
- Virtual wallet & store; **Prize Balance** (לפדיון) + **Cash Out** (פאנל פדיון)
- Admin dashboard
- Legal pages (Terms, Privacy, Responsible Gaming)
- PWA support (Capacitor)
- RTL support (Hebrew/Arabic)
- **Responsive** — AppBar, Sidebar (מוסתר במובייל), פרופיל ולובי

### What's Missing 🔨
- **AI Guardian** (age verification) — 🔴 Critical
- **Geo-fencing** (Israeli IP detection) — 🔴 Critical
- **Certified RNG** (provably fair dice) — 🟡 High
- **VIP Store** (3D skins & badges) — 🟡 Medium
- **Tournament system** — 🟡 Medium
- **Daily rewards** (Spin the Wheel) — 🟢 Low
- **Cash Out API** (בקשת פדיון + אישור אדמין) — 🟡 Medium

See **[GAP_ANALYSIS.md](./GAP_ANALYSIS.md)** for detailed breakdown.

---

אפיון טכני — Real-Time Sync, AI Guardian, React 18, Node.js, MUI + Framer Motion. **Skill-Based Gaming**: Pot, דמי כניסה, Rake, Prize Balance, Cash Out — ראה `docs/SKILL_BASED_GAMING_SPEC.md`.

## מבנה הפרויקט (Project Structure)

```
non/
├── apps/
│   ├── web/                    # Frontend — React 18 + Vite + TS
│   │   ├── src/
│   │   │   ├── app/             # Theme, App shell, global styles
│   │   │   ├── features/        # Feature-based
│   │   │   │   ├── admin/       # AdminDashboard — Overview, User Mgmt, Game Control, AI Logs
│   │   │   │   ├── auth/        # AuthGuard, age verification entry
│   │   │   │   ├── backgammon/  # Board3D, Dice (Cannon.js), logic engine
│   │   │   │   ├── feed/        # VegasFeed — The Strip Feed (snap scroll, 3D per slide)
│   │   │   │   ├── game/        # GameBoard, store, predictive UI
│   │   │   │   ├── lobby/       # Matchmaking, LobbyView
│   │   │   │   ├── store/       # StoreView, useWalletStore — חנות מטבעות + balance
│   │   │   │   └── sync/        # Socket.io, SyncProvider, useSyncSocket
│   │   │   └── shared/          # Components, hooks, React Three Fiber
│   │   └── index.html
│   │
│   └── api/                     # Backend — Node.js + TypeScript + Socket.io
│       └── src/
│           ├── app.ts           # Express, CORS, health, /api/users/:id/balance, /api/games/win
│           ├── index.ts         # HTTP server + Socket.io
│           ├── core/            # socket.ts — init Socket.io
│           ├── db/              # pool, schema.sql (users, transactions, items_inventory, admin_revenues)
│           ├── modules/        # room, ai
│           └── services/       # gameService (processGameWin, placeBet — טרנזקציות אטומיות)
│
├── packages/
│   └── shared/                  # Types & contracts — client ↔ server
│       └── src/
│           ├── game.ts         # GameKind, GameState, Backgammon/Snooker/Cards
│           ├── sync.ts         # SyncAction, StateSnapshot, ActionConfirmation
│           ├── user.ts         # UserProfile, MatchmakingPreferences, SafetyFlags
│           ├── wallet.ts       # Transaction, ItemInInventory, UserWallet
│           └── socket-events.ts # SOCKET_EVENTS
│
├── package.json                # Workspaces: apps/web, apps/api, packages/shared
├── tsconfig.base.json
└── .env.example
```

## טכנולוגיות (MVP)

| רכיב | טכנולוגיה |
|------|-----------|
| Core | React 18 + Vite + TS |
| Styling | MUI + Framer Motion (ניאון וגאס) |
| 3D | React Three Fiber + Suspense |
| State | Zustand |
| Server | Node.js + Socket.io |
| Sync | Snapshot מהשרת (Source of Truth) + Predictive UI |
| AI | TensorFlow.js / Python — placeholder ב-`apps/api/src/modules/ai` |

## הרצה

1. **התקנת תלויות**
   ```bash
   pnpm install
   ```

2. **הרצת shared (בנייה)**
   ```bash
   pnpm run build -C packages/shared
   ```

3. **הרצת API**
   ```bash
   pnpm run dev:api
   ```
   שרת על `http://localhost:4000`.

4. **הרצת Web**
   ```bash
   pnpm run dev:web
   ```
   אפליקציה על `http://localhost:5273`.

5. **העתקת משתני סביבה**
   ```bash
   cp .env.example .env
   ```
   לעדכן `DATABASE_URL`, `REDIS_URL` וכו' לפי הצורך.

## סנכרון (Real-Time Sync)

- **Source of Truth**: השרת שולח `room:state` עם Snapshot מלא אחרי כל מהלך.
- **Latency Compensation**: הקליינט משתמש ב-`usePredictiveMove` — מציג מהלך מיד, שולח ל-server, ומתקן לפי `room:confirm`.
- אירועי Socket מוגדרים ב-`packages/shared/src/socket-events.ts`.

## מסד נתונים (PostgreSQL)

- **users**: id, username, avatar_id, is_verified, **balance** (משחק), **prize_balance** (לפדיון), level.
- **transactions**: כל שינוי נרשם כאן; type: purchase, win, bet, fee, gift_sent, gift_received, **withdrawal**; **status**: PENDING | COMPLETED | FAILED (לבקשות פדיון).
- **items_inventory**: owner_id, item_type, **item_id**, rarity, is_for_sale, price, **metadata** (Json).
- **admin_revenues**: עמלות הבית (משחקים, Rake).

הרצת סכמה: `psql $DATABASE_URL -f apps/api/src/db/schema.sql`  
מיגרציות: `004` (oasis_balance), `013` (prize_balance, transaction status, item_id, metadata) — ראה `apps/api/src/db/migrations/`.

## ארנק ומשחק (gameService)

- `processGameWin(winnerId, loserId, potAmount, sourceGameId)` — טרנזקציה אטומית: עדכון balance, INSERT ל-transactions, INSERT ל-admin_revenues (עמלת 15%). COMMIT רק אם הכל הצליח; אחרת ROLLBACK.
- `placeBet(userId, amount, gameId)` — הורדת balance ורישום bet ב-transactions.
- API: `GET /api/users/:userId/balance`, `POST /api/games/win`.

## חנות (Store) והפיד (VegasFeed)

- **StoreView**: חנות מטבעות בעיצוב ניאון ווגאס (MUI + Framer Motion), חיבור ל-`useWalletStore().balance` ו-`fetchBalance(userId)`.
- **VegasFeed**: "The Strip Feed" — גלילה אנכית עם snap (TikTok-style), Canvas (React Three Fiber) לכל מסך, אוברליי עם @host, PLAY, צופים. GameScene — placeholder תלת-ממדי (להחלפה במודלים GLB).

## AI Guardian

- מודול התחלתי: `apps/api/src/modules/ai/index.ts`.
- מתוכנן: אימות גיל (Onfido / TensorFlow.js), סינון צ'אט, ניתוח דפוסים (anti-cheat), matchmaking.

## ממשק ניהול (Admin Dashboard)

- **Overview**: כרטיסי סטטיסטיקה (Revenue, DAU, AI Alerts), גרף Revenue Stream (Recharts), Heatmap שעות קניית מטבעות.
- **User Management**: חיפוש משתמשים, חסימת רמאים, צפייה בהיסטוריית טרנזקציות (מבנה מוכן).
- **Game Control**: טורנירים, אחוז Rake בזמן אמת, צפייה לייב בחדרים (מבנה מוכן).
- **AI Guardian Logs**: טבלת התראות (בוטים / קטינים), Audit Trail.
- **Emergency Shutdown**: כפתור לסגירת חדר במקרה חירום.
- גישה: טאב "ניהול" באפליקציה.

## Lighthouse (90+ Performance & Accessibility)

- הרצה: `cd apps/web && pnpm run build && pnpm run preview` ואז בטרמינל אחר: `pnpm run lighthouse` (מריץ Lighthouse על `http://localhost:5273`).
- הדו"ח נשמר ב־`apps/web/dist/lighthouse-report.html`.
- טיפים ל־90+: lazy load תמונות, `font-display: swap`, aria-labels על כפתורים/ניווט, צמצום JavaScript ב־first load (code splitting כבר ב־Vite).

## כניסה (Auth)

- **אורח**: `POST /api/auth/guest` — יוצר משתמש עם `username: guest_<random>`, מחזיר `{ userId, username }`.
- **התחברות**: `POST /api/auth/login` עם `{ username }` — מחפש משתמש או יוצר חדש, מחזיר `{ userId, username }`.
- **Frontend**: אחרי אישור תקנון מוצג מסך כניסה (LoginView). "המשך כאורח" או הזנת שם + "התחבר". ה־userId נשמר ב־session (persist) ומסונכרן ל־wallet — קופון, referral ו־balance עובדים עם המשתמש הנוכחי. בדף "אני" — כפתור "התנתק".

## קופונים והזמנות (Coupons & Referrals)

- **מימוש קוד**: `POST /api/redeem` עם `{ code, userId }`. טבלאות: `coupons`, `coupon_redemptions`. הרצת מיגרציה: `psql $DATABASE_URL -f apps/api/src/db/migrations/001_coupons_referrals.sql`.
- **יצירת קופון לבדיקה**: `INSERT INTO coupons (code, coins, max_uses) VALUES ('WELCOME5000', 5000, 100);`
- **Referral**: `GET /api/referral/link?userId=X` מחזיר קישור הזמנה. `POST /api/referral/claim` עם `{ inviterId, referredId }` מזכה את המזמין ב־1,000 מטבעות (פעם אחת).
- **Leaderboard**: `GET /api/leaderboard?limit=20` מחזיר טבלת מובילים לפי balance.

## PWA (Progressive Web App)

- **Manifest**: `apps/web/public/manifest.json` — VegasNeon, standalone, theme #ff00ff.
- **Service Worker**: `vite-plugin-pwa` — cache אוטומטי ועדכון אוטומטי (`registerType: 'autoUpdate'`).
- **RTL**: MUI עם `stylis-plugin-rtl` ו־`CacheProvider` — עברית/ערבית עם הפיכת margins ו־padding.
- **אייקונים**: יש `favicon.svg` ב־`public/`. להשלמת "הוסף למסך הבית" מומלץ להוסיף ל־`apps/web/public/` גם:
  - `logo192.png` (192×192)
  - `logo512.png` (512×512)  
  (אפשר ליצור מ־`favicon.svg` בכלי המרה או עורך גרפי.)

## צעדים אופרטיביים (לפי האפיון)

| Phase | תוכן |
|-------|------|
| 1 | תשתית (Vite+TS+MUI) + Theme וגאס ניאון ✓ |
| 2 | אב-טיפוס שש-בש 3D + Socket.io ✓ |
| 3 | AI Guardian + אימות משתמשים (מבנה מוכן) |
| 4 | פיד TikTok-style + מערכת תשלומים (חנות + balance) ✓ |

## רישיון

Private — The Neon Oasis MVP.
