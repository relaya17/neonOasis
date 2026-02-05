# ליבת הפרויקט: ארבעת עמודי התווך (Game-Fi Infrastructure)

**הגדרה:** "הליבה של הפרויקט היא Game-Fi Infrastructure."

---

## 📋 הסיכום הטכני (Copy-Paste למתכנת)

> **שכבה 1:** ארנק P2P עם יומן פעולות חסין לזיופים (Double-Entry Bookkeeping).  
> **שכבה 2:** שרת נאמנות (Escrow) שנועל כספים בזמן משחק — השרת הוא ה-Oracle (השופט).  
> **שכבה 3:** מנוע הנפקת מטבעות (Oasis Token) על בסיס ביצועים (Proof of Skill).  
> **שכבה 4:** מעטפת וגאס 80' ב-3D — ה-UI שמביא את המשתמשים.

**"אנחנו בונים Decentralized-style Backend"** — למרות שהשרת מרכזי, הלוגיקה היא של ארנקים מבוזרים.  
**"המשחקים הם רק ה-Proof of Concept"** — שש-בש ופוקר הם הדרך לסחור ביכולת; מחר שחמט/רמי על אותה תשתית.

---

## 1. ליבת ה-Settlement Layer (שכבת סליקה פנימית)

**השינוי:** במודל הקודם צ'יפים "נשארו" אצלו. עכשיו המערכת מנהלת **בורסה של יכולת**.

**דרישה:** **Double-Entry Bookkeeping.** כל תנועה של מטבע Oasis חייבת להיות מתועדת:
- **מאיזה ארנק יצא** (from_user_id)
- **לאיזה ארנק נכנס** (to_user_id)
- **כמה עמלה (Fee)** נגזרה בדרך ל**ארנק הבית**

**ערך סטארט-אפי:** הרישום ב-DB בנוי כמו בלוקצ'יין — מאפשר מעבר עתידי למטבע קריפטוגרפי אמיתי.

**יישום טכני:** טבלת `ledger_entries` (או הרחבת `transactions`) עם from/to/fee; כל settle ו-mint כותבים שם.

---

## 2. מנוע ה-Escrow & Oracle (השופט והנאמן)

במשחק P2P המערכת חייבת להיות **"השופט" שלא ניתן לשחד**.

**דרישה:**
- **המשחק לא מנוהל בטלפון** — ה-Client הוא רק "שלט רחוק". השרת (ה-**Oracle**) מחשב מי ניצח (שש-בש/פוקר) ונותן פקודה לארנק להעביר כסף.
- **מניעת רמאויות:** אם שחקן **מתנתק באמצע משחק** כשיש כסף ב-Escrow — השרת מחליט: הכסף חוזר לשניהם (refund) או **המתנתק הפסיד טכנית** (forfeit).

**יישום טכני:** לוגיקת משחק רק בשרת; Timer על ניתוק — אחרי X דקות ללא תגובה: המתנתק מפסיד, הזוכה מקבל את הקופה (פחות עמלה).

---

## 3. Liquidity Pool & Minting (Proof of Skill)

**דרישה:**
- **Proof of Skill:** כשהשרת מזהה רצף ניצחונות או מהלך חכם (למשל **סגירת לוח בשש-בש**), הוא מבצע **Mint** — מייצר מטבעות חדשים לארנק המשתמש.
- **כלכלת המטבע (Tokenomics):** **"לוח בקרה מוניטרי"** — שליטה בכמה מטבעות נוצרים בכל יום, כדי למנוע אינפלציה ולהשאיר את המטבע יוקרתי.

**יישום טכני:** `mintOasis` עם בדיקת **daily cap** (טבלה/config); בונוס mint על "מהלכים חכמים" (למשל backgammon mars); אדמין יכול להגדיר מכסה יומית.

---

## 4. Skill Matching Algorithm (ELO/MMR)

כדי ששחקן לא "יעקוץ" שחקן חלש (יבריח משתמשים) — **בינה בשידוך**.

**דרישה:** מדד **ELO/MMR** (כמו במשחקי מחשב מקצועיים). התערבויות כספיות **רק בין שחקנים ברמה דומה** — Fair Play.

**יישום טכני:** שדה `elo_rating` / `mmr` ב-users; עדכון אחרי כל משחק; Matchmaking מסנן לפי טווח דירוג (למשל ±200 ELO).

---

## 5. AML (Anti-Money Laundering) בסיסי

מכיוון ששחקנים מעבירים כסף — השרת חייב לזהות **דפוסים חשודים**:
- שחקן שמפסיד **בכוונה** סכומים גדולים **לאותו משתמש** (Chip Dumping / מכירת משחקים).

**יישום טכני:** לוג/דגל על זוגות (player A, player B) עם הרבה משחקים שבהם תמיד אותו מנצח; דשבורד אדמין להתראות.

---

## 6. ארבע השכבות — סיכום

| שכבה | תיאור |
|------|--------|
| **1. Settlement** | ארנק P2P + Double-Entry Ledger (from/to/fee). |
| **2. Escrow & Oracle** | נעילת כספים + השרת כשופט + מדיניות ניתוק (refund/forfeit). |
| **3. Minting** | Oasis Token על Proof of Skill + daily cap (לוח בקרה מוניטרי). |
| **4. UI** | מעטפת וגאס 80' ב-3D (React, ניאון, פיד). |

---

---

## 7. התקנה (למתכנת)

1. **מיגרציה 004:** Escrow, Oasis balance, game_sessions.
   ```bash
   psql $DATABASE_URL -f apps/api/src/db/migrations/004_p2p_escrow_oasis_ledger.sql
   ```
2. **מיגרציה 005:** Double-Entry Ledger, ELO, מכסת הנפקה יומית, AML flag.
   ```bash
   psql $DATABASE_URL -f apps/api/src/db/migrations/005_double_entry_elo_mint_cap.sql
   ```
3. **API:** `POST /api/games/p2p/start`, `POST /api/games/p2p/end` — P2P Escrow + Settlement + ELO + AML.
4. **Escrow Oracle:** ניתוק באמצע משחק → `resolveEscrowOnDisconnect(roomId, disconnectedUserId)` — המתנתק מפסיד.
5. **לוח בקרה מוניטרי:** `getMintDailyBudget()` / `setMintDailyCap(cap)` — אדמין יכול להגביל הנפקה יומית.
6. **AML:** `checkAndFlagSuspiciousPair(winnerId, loserId, sessionId)` — דגל על זוגות חשודים; `getFlaggedSessions()` לדשבורד.
7. **Admin API:** `GET /api/admin/mint-budget`, `PUT /api/admin/mint-budget` (body: `{ dailyCap }`), `GET /api/admin/aml-flagged` — לוח בקרה מוניטרי ו-AML.
8. **Profile API:** `GET /api/users/:userId/profile` — מחזיר `balance`, `oasis_balance`, `elo_rating` (לפרונט).

---

## 8. ההמשך (מה הלאה)

| שלב | תיאור |
|-----|--------|
| **פרונט** | להציג ב-Profile/Header: ELO, Oasis balance; לקרוא `GET /api/users/:userId/profile`. |
| **Matchmaking** | להשתמש ב-`getUsersInEloRange(centerElo, ±200)` כשמשדכים שחקנים — התערבויות רק בין רמות דומות. |
| **דשבורד אדמין** | כרטיס "מכסת הנפקה יומית" (mint-budget) וכרטיס "משחקים מסומנים AML" (aml-flagged). |
| **אופציונלי** | בונוס Mint על "מהלכים חכמים" (למשל Mars בשש-בש); הרחבת AML (התראות אוטומטיות). |

---

**גרסה:** 1.0 | **תאריך:** פברואר 2026
