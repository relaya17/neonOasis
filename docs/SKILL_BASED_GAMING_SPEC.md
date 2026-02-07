# Skill-Based Gaming Competition — אפיון משפטי ומוצר (5 דפים)

## דף 1: הקונספט העסקי והחוקי (The "Skill-Live" Model)

- **הגדרה:** פלטפורמת טורנירי מיומנות מבוססת לייב. שחקנים קונים מטבעות (Coins) כדי לשחק או לשלוח מתנות.
- **חוקיות:** Skill-Based Gaming — הפרס ניתן על **מיומנות** (לא מזל), ומאפשר Cash-out חוקי.
- **מקורות הכנסה:**
  - מכירת חבילות מטבעות בחנות
  - עמלת שולחן (Rake) 10–15% מכל התמודדות
  - עמלה ממתנות בלייב: **70% לשחקן** (לפדיון), **30% לפלטפורמה** (כמו TikTok)

**בקוד:** `docs/SKILL_BASED_GAMING_SPEC.md`, חנות מקלות/גיר, Admin rake (Dashboard), פרופיל Cash Out.

---

## דף 2: מאגר הציוד והפרימיום (Assets Store)

- **שפה עיצובית:** נאון, דרקונים, ציפור חול — כל המשחקים חולקים אותה.
- **סנוקר:** מקל בייסיק חינם; מקלות פרימיום (דרקון, נחש, ציפור חול) בתשלום + בונוס מיומנות.
- **משחקים אחרים:** לוחות ששבש, חפיסות קלפים, כלי שחמט.
- **Consumables:** גיר (סנוקר), בירה (מתנה חברתית) — חד-פעמיים, יוצרים צריכת מטבעות.

**בקוד:** `snookerCues.ts`, חנות מקלות ב-SnookerGame, GIFT_PRICES, כפתור גיר + מתנות ב-SnookerLiveUI.

---

## דף 3: ארכיטקטורת המערכת (Technical Stack)

- **Frontend:** React + Framer Motion (אפקטי ניצחון).
- **Real-time:** WebSockets (Socket.io) — צופים ושחקנים רואים מהלכים באותו רגע (להטמעה).
- **Wallet:** **Balance** = מטבעות למשחק; **Redeemable** = נצבר מניצחונות ומתנות, ניתן למשיכה (Withdraw).
- **UI/UX:** לובי למעבר בין משחקים, **Live Sidebar גנרי** לצ'אט ומתנות (סנוקר, ששבש, פוקר).

**בקוד:** useWalletStore (balance, oasisBalance), ProfileView (Balance + Prize + CashOutPanel), useLiveStore + LiveSidebar (מתנות, מונה צופים), Layout מציג Sidebar בדפי משחק.

---

## דף 4: רכיבי קוד מרכזיים

| רכיב | תיאור | מיקום |
|------|--------|--------|
| **Pot** | קופה, דמי כניסה (ENTRY_FEE), עמלת שולחן (TABLE_RAKE), פרס למנצח | SnookerGame, BoardContainer (ששבש), PokerTable — כולם: BANK, קופה, "משחק עם קופה" |
| **Win effect** | אנימציית נאון + "גשם מטבעות" ברגע הניצחון | GoldRainEffect, impactVisible, boomMessage |
| **Chalk** | Consumable שמשפר דיוק, עולה מטבעות | NeonChalkButton, chalkActiveUntil, CHALK_COST |

---

## דף 5: Roadmap — חיבורים קיימים והבא

1. **חיבור Wallet** — משתמש רואה יתרת מטבעות וכפתור Cash Out. ✅ ProfileView: Balance, Prize, Cash Out.
2. **Sidebar מתנות גנרי** — רכיב אחד לסנוקר, ששבש, פוקר (גיר, בירה, יהלום). ✅ LiveSidebar (shared), מונה צופים + Gift Feed + כפתורי מתנות; כל משחק רושם handler (סנוקר: גיר/בירה/יהלום, ששבש: אנימציה, פוקר: toast).
3. **אינטגרציית לייב** — מונה צופים לכל שולחן. ✅ LiveSidebar: viewersCount (דמו).
4. **חיבור חנות ↔ Pot ↔ Withdraw** — Balance למשחק; דמי כניסה → Pot; מנצח מקבל פרס (לאחר Rake); Cash Out (CashOutPanel) מ-Redeemable. ✅ Pot בסנוקר, ששבש, פוקר; CashOutPanel בפרופיל (פדיון מינימלי 100).

---

## שני סוגי מאזנים (Database / Product)

| מאזן | שימוש | מקור | ניתן לפדיון? |
|------|--------|------|-------------|
| **Play Money (Balance)** | משחק, כניסה לטורנירים, מקלות, גיר | רכישה בחנות / קודי פדיון | לא |
| **Prize Balance (Redeemable)** | נצבר מניצחונות + מתנות צופים | Entry Fee → Pot, Gifts | כן — Cash Out |

## פדיון (Withdrawal) — לוגיקה עתידית

```ts
// requestCashOut(userId, amount)
// 1. בדיקה: user.prizeBalance >= amount && amount >= MIN_WITHDRAWAL
// 2. יצירת transaction: status: 'PENDING_REVIEW', type: 'CASH_OUT'
// 3. הפחתה מ-prizeBalance
// 4. החזרה: "הבקשה בטיפול, כסף יישלח תוך 48 שעות"
```
