# 🎰 NEON OASIS — תנ"ך הפרויקט (PRD Master 2026)

**מסמך מרכז אחד לצוות פיתוח ומעצבים.**  
מאחד חזון, אפיון, ליבת P2P/Game-Fi, והתאמה למה שבנוי בקוד.

---

## 💎 הקונספט במשפט אחד

**"אני בונה פלטפורמת Fin-Tech לגיימינג. זירה שבה שחקנים מתחרים זה בזה במשחקי יכולת (P2P), כשהמערכת מנהלת ארנקים, נאמנות ועמלות, במטבע פנימי בעל ערך (Oasis Token), עטוף באסתטיקת וגאס 80' ב-3D."**

---

# חלק א׳ — החזון והמעטפת (מה נשאר כמו שתכננו)

## 1. Tech Stack (התשתית הטכנולוגית)

| רכיב | ספק |
|------|-----|
| **Frontend** | React 18, Vite, TypeScript |
| **3D Engine** | React Three Fiber (Three.js) + Cannon.js — קוביות ולוחות פיזיקה |
| **State** | Zustand (ארנק גלובלי ומשתמש) |
| **Backend** | Node.js + Socket.io למולטיפלייר בזמן אמת *(בקוד: Fastify)* |
| **Database** | PostgreSQL (Prisma / raw SQL) לעסקאות מאובטחות |
| **AI** | AI Guardian (Face API / Mediapipe) — אימות גיל וזהות |
| **Mobile** | PWA + Capacitor |

## 2. Design System (Cyber-Vegas)

- **צבעים:** Deep Space Black `#0a0a0b`, Cyber Pink `#ff00ff`, Electric Blue `#00ffff`
- **סגנון:** Glassmorphism, גבולות ניאון זוהרים
- **טיפוגרפיה:** Orbitron (כותרות), Heebo (UI / עברית)
- **Splash:** לוגו ניאון מהבהב + "Loading Vegas..." + progress bar

## 3. Core Features — חלון הראווה (ללא שינוי)

- **AI Guardian:** סריקת פנים 18+, עיבוד מקומי, Geo-Fencing (ישראל = משחקי יכולת בלבד)
- **Neon Feed:** גלילה אנכית (טיקטוק), 3D replays, תגובות אמוג'י (סיגר, שמפניה, משקפי שמש)
- **Skill Arena:** שש-בש 3D, סנכרון WebSocket, RNG מאומן (Provably Fair)
- **משחקים עתידיים:** פוקר (טורנירים), שחמט בליץ, רמי, Dilemma — כולם על **אותה תשתית ארנקים**

---

# חלק ב׳ — השינוי בליבה (מ-Social Casino ל-P2P Skill-Economy)

## טבלת ההשוואה (להצגה למתכנת)

| מאפיין | אפיון קודם (Social Game) | אפיון סטארט-אפ (Skill-Economy) |
|--------|---------------------------|----------------------------------|
| **ישות הכסף** | צ'יפים וירטואליים למשחק בלבד | Oasis Token — נכס דיגיטלי נצבר |
| **זרימת כסף** | משתמש ← קונה מהחנות ← משחק | משתמש ← משלם למשתמש אחר (P2P) |
| **תפקיד השרת** | מנהל לוגיקה של משחק | נאמן (Escrow) + מנהל ארנקים |
| **מודל רווח** | מכירת חבילות מטבעות | גביית עמלה (Fee) על כל עסקה/טורניר |
| **אבטחה** | חסימת בוטים בסיסית | Anti-Fraud AI + אימות ביומטרי + Provably Fair |

**המסר:** "הקודם היה ה'מה' (שש-בש בוגאס). השינוי הוא ה'איך' (כלכלה בין שחקנים). ה-UI נשאר — הכפתורים מפעילים מערכת סליקה חכמה."

---

# חלק ג׳ — ארבעת עמודי התווך (Game-Fi Infrastructure)

## הסיכום הטכני (Copy-Paste למתכנת)

> **שכבה 1:** ארנק P2P עם יומן פעולות חסין לזיופים (Double-Entry Bookkeeping).  
> **שכבה 2:** שרת נאמנות (Escrow) שנועל כספים בזמן משחק — השרת הוא ה-Oracle (השופט).  
> **שכבה 3:** מנוע הנפקת מטבעות (Oasis Token) על בסיס ביצועים (Proof of Skill) + לוח בקרה מוניטרי.  
> **שכבה 4:** מעטפת וגאס 80' ב-3D — ה-UI שמביא את המשתמשים.

## 1. Settlement Layer (Double-Entry + Micro-Ledger)

- **Double-Entry:** כל תנועה מתועדת — מאיזה ארנק יצא, לאיזה נכנס, כמה עמלה לבית.
- **Event Sourcing (יעד):** ארכיטקטורה שבה כל פעולה נרשמת כאירוע; אפשר Replay לשחזור יתרה ולמניעת מניפולציות DB.
- **בקוד היום:** טבלת `ledger_entries` (from_user_id, to_user_id, amount, fee_to_house, asset_type); כל settle ו-mint כותבים שם.

## 2. Escrow & Oracle (השופט והנאמן)

- **המשחק בשרת:** ה-Client הוא "שלט רחוק"; השרת מחשב מי ניצח ונותן פקודה לארנק.
- **ניתוק באמצע משחק:** השרת מחליט — refund לשניהם או **המתנתק מפסיד טכנית** (forfeit).
- **בקוד היום:** `holdEscrow` → `settleP2P` / `refundEscrow`; `resolveEscrowOnDisconnect(gameId, disconnectedUserId)`.

## 3. Liquidity Pool & Minting (Proof of Skill + Tokenomics)

- **Mint:** ניצחון / מהלך חכם (למשל Mars בשש-בש) → הנפקת Oasis למשתמש.
- **לוח בקרה מוניטרי:** מכסה יומית להנפקה (מניעת אינפלציה).
- **Burn (יעד):** שימוש במטבע לקניית פריטים/עמלות — "שריפה" מהמחזור.
- **בקוד היום:** `mintOasis` עם daily cap (`mint_daily_budget`); `getMintDailyBudget` / `setMintDailyCap` לאדמין.

## 4. Skill Matching (ELO/MMR)

- **התערבויות כספיות רק בין שחקנים ברמה דומה** — Fair Play.
- **בקוד היום:** `users.elo_rating`, `updateEloAfterGame(winnerId, loserId)`, `getUsersInEloRange(centerElo, ±200)` לשידוך.

## 5. AML (Anti-Money Laundering) בסיסי

- זיהוי דפוסים חשודים: אותו מנצח מול אותו מפסיד שוב ושוב (Chip Dumping).
- **בקוד היום:** `game_sessions.aml_flagged`, `checkAndFlagSuspiciousPair`, `getFlaggedSessions()` לאדמין.

---

# חלק ד׳ — דרישות טכניות מעודכנות

## 4 הנקודות כ"תיקון לאפיון הקודם"

1. **State Sync:** השרת הוא Source of Truth לכל מהלך — מונע זיופי מטבעות.
2. **Transactions:** כל משחק = טרנזקציית DB אטומית: נעילת כספים → משחק → חלוקת זכייה + גביית עמלה.
3. **Modular Games:** ארנק P2P הוא שירות נפרד; שש-בש, פוקר, שחמט, רמי — רק "מתחברים" אליו.
4. **Anti-Fraud:** Log של IP וזמני משחק; דגל על זוגות חשודים (AML).

## Provably Fair (RNG מאומן)

- **דרישה:** כל הגרלת קוביות/קלפים מבוססת על Server Seed + Client Seed; המשתמש יכול לוודא בסוף שהתוצאה לא שונתה.
- **בקוד היום:** `GET/POST /api/games/rng/roll` מחזירים `seed`, `nonce`, `hash`, `dice`; `rngService.generateProvablyFairRoll`.

## Real-time (יעד: Redis Pub/Sub)

- **דרישה:** Socket.io על Redis לסנכרון אלפי משחקים במקביל עם Latency &lt; 50ms.
- **בקוד היום:** Socket.io ישיר; Redis מוזכר ב-.env — אינטגרציה מלאה כיעד.

## הצ'ק-ליסט המשפטי (P2P & Skill Games)

| חסימה | תיאור |
|--------|--------|
| **Skill-Checking** | המערכת מוודאת שהמשחק מבוסס יכולת (טורניר שש-בש/פוקר). |
| **Age Verification** | חסימה למי שלא עבר AI Guardian (18+). |
| **Geo-Fencing** | הצגת משחקים מורשים לפי IP (ישראל = משחקי יכולת בלבד). |

---

# חלק ה׳ — משחקים עתידיים (על אותה תשתית)

| חדר | משחק | הערות |
|-----|------|--------|
| **Backgammon Room** | שש-בש | קיים — P2P + Escrow + ELO |
| **Poker Lounge** | פוקר טורנירים | Buy-in קבוע, פרס מראש; Social Poker (Play Money) |
| **Mind Games** | שחמט בליץ, רמי, Dilemma | Multi-User Sync (עד 9 בפוקר); Hand Evaluator בשרת; Anti-Cheat (שחמט vs Stockfish) |

**מסר למתכנת:** "המשחקים הם רק ה-Proof of Concept. השש-בש והפוקר הם הדרך לסחור ביכולת; מחר שחמט או רמי על אותה תשתית ארנקים."

---

# חלק ו׳ — איך להציג במפגש (Closing Pitch)

| השכבה | מה זה אומר בפועל |
|--------|-------------------|
| **הלב (Backend)** | ארנק P2P עם Escrow וסליקת עמלות. |
| **הגוף (Logic)** | מנועי משחקי חשיבה (שש-בש, פוקר, שחמט) מאומתים בשרת. |
| **הנשמה (UI/UX)** | עולם הניאון של וגאס 80' ב-3D ופיד חברתי. |
| **המוח (AI)** | הגנה ביומטרית (AI Guardian) ומניעת רמאויות (AML, Anti-Cheat). |

## שאלות המבחן למתכנת (לפני סגירת חוזה)

1. "איך תבטיח שהארנק מאובטח ברמת השרת ולא ניתן לשינוי מהדפדפן?"
2. "איך תנהל Concurrency (מאות העברות כספים בו-זמנית)?"
3. "האם תטמיע Provably Fair ל-RNG (קוביות/קלפים)?"
4. "האם הארכיטקטורה תומכת בהוספת משחקים חדשים (Microservices) לאותו ארנק?"

## פרופיל המועמד האידיאלי

- **Full-Stack Engineer** עם רקע ב-Fintech או Gaming.
- **טכנולוגיות:** Node.js, React, Socket.io, PostgreSQL, Redis.
- **ניסיון:** מערכות ארנקים, Real-time data, Web Security.

---

# חלק ז׳ — מה בנוי היום בקוד (התאמה למסמך)

| רכיב | סטטוס | מיקום בקוד |
|------|--------|------------|
| **Double-Entry Ledger** | ✅ | `ledger_entries`, `walletService.settleP2P` / `mintOasis` |
| **Escrow (Hold/Release/Refund)** | ✅ | `walletService`: `holdEscrow`, `settleP2P`, `refundEscrow` |
| **Escrow Oracle (ניתוק)** | ✅ | `resolveEscrowOnDisconnect`; `roomMeta` טיימר ניתוק |
| **Oasis Mint + Daily Cap** | ✅ | `mintOasis`, `mint_daily_budget`; `getMintDailyBudget` / `setMintDailyCap` |
| **ELO/MMR** | ✅ | `users.elo_rating`, `eloService.updateEloAfterGame`, `getUsersInEloRange` |
| **AML** | ✅ | `game_sessions.aml_flagged`, `amlService.checkAndFlagSuspiciousPair`, `getFlaggedSessions` |
| **Provably Fair RNG** | ✅ | `GET/POST /api/games/rng/roll`, `rngService`, `packages/shared/src/rng.ts` |
| **P2P API + Socket** | ✅ | `POST /api/games/p2p/start`, `p2p/end`; אירועים `p2p:match_start`, `p2p:match_end` |
| **Admin: Mint + AML** | ✅ | `GET/PUT /api/admin/mint-budget`, `GET /api/admin/aml-flagged` |
| **Profile (balance, oasis, elo)** | ✅ | `GET /api/users/:userId/profile` |
| **AI Guardian (שער גיל)** | 🟡 | Placeholder — `GuardianGate` (כפתור "אני מעל 18"); אינטגרציית Face API חסרה |
| **Redis Pub/Sub** | 🔲 | מוזכר ב-.env; לא משולב ב-Socket |
| **Burn (Oasis)** | 🔲 | לא מיושם — שימוש ב-Oasis בחנות/עמלות כיעד |
| **פוקר / שחמט / רמי** | 🔲 | לא מיושמים — תשתית ארנקים מוכנה לחיבור |

---

# מסמכים נלווים בפרויקט

| מסמך | תוכן |
|------|------|
| **[PRD.md](../PRD.md)** | אפיון מוצר מפורט (תכונות, עיצוב, מוניטיזציה, roadmap) |
| **[docs/P2P_SPEC.md](./P2P_SPEC.md)** | תיקון האפיון: מעבר ל-P2P Skill-Economy |
| **[docs/CORE_4_PILLARS.md](./CORE_4_PILLARS.md)** | ארבעת עמודי התווך + הוראות מיגרציה והמשך |
| **[docs/UI_UX_SPEC.md](./UI_UX_SPEC.md)** | Cyber-Vegas 2.0 — מפרט עיצובי וטכני (Glow, Feed, Wallet, Haptic, RTL, Soundtrack) |
| **[docs/GAME_MECHANICS_SPEC.md](./GAME_MECHANICS_SPEC.md)** | מכניקות "בתוך השולחן" — שש-בש 3D, פוקר Tell, שחמט הולוגרפי, Shockwave, Spectator Cloud |
| **[docs/AUDIO_SPEC.md](./AUDIO_SPEC.md)** | Sound Architecture — Tactile, UI, Vaporwave, Jackpot; 3D Spatial, Ducking, No Lag |
| **[INDEX.md](../INDEX.md)** | אינדקס כל המסמכים — ניווט לפי תפקיד |

---

**גרסה:** 1.0 | **תאריך:** פברואר 2026  
**סטטוס:** תנ"ך הפרויקט — עדכון בהתאם לשיחות אפיון וליבה קיימת בקוד.
