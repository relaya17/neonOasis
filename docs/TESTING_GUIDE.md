# 🧪 Testing Guide — Neon Oasis

## מטרה
לוודא שכל התכונות עובדות כצפוי לפני פרסום לייצור.

---

## 1. Unit Tests (עתידי)
כרגע אין unit tests. כדי להוסיף:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```
ואז:
- בדיקות ל־services (walletService, eloService, etc.)
- בדיקות ל־hooks (useApiStatus, useWebGLContextLoss, etc.)
- בדיקות לקומפוננטות UI (ProfileView, StoreView, etc.)

---

## 2. Manual E2E Testing (ידני)

### 🔹 Pre-requisites
1. **DB מוכן**: הרץ מיגרציות:
   ```bash
   pnpm run db:run-sql
   ```
2. **שרתים רצים**:
   ```bash
   pnpm run dev
   ```
   - Web: http://localhost:5273
   - API: http://localhost:4000

### 🔹 Flow 1: רישום וכניסה
1. פתח http://localhost:5273
2. אמור לראות Splash Screen (כוכבים + "NEON OASIS") ← אחרי ~1.5 שניות, מסך תנאים.
3. לחץ "אני מאשר/ת" ← מסך אימות גיל (AI Guardian).
4. לחץ "אני מעל גיל 18 — כניסה" ← מסך התחברות.
5. **אפשרות א**: הזן שם משתמש כלשהו → "Login" ← אמור להיכנס לאפליקציה.
6. **אפשרות ב**: לחץ "Continue as guest" ← נכנס כאורח.
7. ✅ אתה ב־Feed (מסך הראשי).

### 🔹 Flow 2: ניווט בין מסכים
1. מהFeed, לחץ על הטאבים התחתונים:
   - **Home** (Feed) ← חדרים עם Canvas 3D
   - **Store** ← חבילות רכישה
   - **Leaderboard** ← טבלת מובילים
   - **Profile** ← פרופיל + ארנק + גרף
2. ✅ כל מסך נטען, אין שגיאות ב־Console.

### 🔹 Flow 3: Offline Mode
1. עצור את שרת ה־API (Ctrl+C במסוף שרץ `pnpm run dev`).
2. רענן את הדף ← אמור להיכנס כאורח, ומעל Layout תראה באנר "ה־API לא זמין כרגע".
3. ב־Store: כפתורי רכישה מושבתים + הודעה "רכישות מושבתות במצב Offline".
4. ב־Profile: הודעה "ה־API לא זמין כרגע — נתוני פרופיל מוצגים במצב Offline".
5. ✅ אין ספאם של WebSocket errors ב־Console.

### 🔹 Flow 4: רכישות (IAP)
1. ודא שה־API רץ.
2. עבור ל־**Store**.
3. לחץ על כפתור רכישה (למשל "₪4.99").
4. אמור לראות spinner ← אחרי רגע, הודעה "נוספו X מטבעות!".
5. ✅ היתרה מתעדכנת באמת (כולל בפרופיל).

### 🔹 Flow 5: Backgammon 3D
1. מה־Feed, לחץ על "JOIN" או על לוגו הקוביות.
2. אמור לעבור ל־`/backgammon` ← לוח 3D עם כוכבים וקוביות.
3. לחץ "Roll" ← הקוביות מתגלגלות, נחיתה עם רטט (אם מכשיר mobile).
4. ✅ אין "WebGL Context Lost" (אלא אם יש עומס).

### 🔹 Flow 6: Lobby & Matchmaking
1. עבור ל־`/lobby` (או הוסף ניווט ידני).
2. לחץ "חפש משחק" ← ספינר, אחרי 5 שניות מעבר אוטומטי ל־`/backgammon`.
3. ✅ זרימה חלקה.

### 🔹 Flow 7: Admin (אם `is_admin = true`)
1. הגדר משתמש ב־DB עם `is_admin = true`.
2. עבור ל־`/admin` ← אמור לראות דשבורד עם סטטיסטיקות.
3. ✅ מקבל גישה רק אם admin.

---

## 3. Automated E2E (עתידי)
כדי להוסיף Playwright או Cypress:
```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```
ואז:
- טסטים ל־login flow
- טסטים ל־navigation
- טסטים ל־purchases
- טסטים ל־offline mode

---

## 4. Load Testing (עתידי)
כדי לבדוק עומסים:
- **Artillery** או **k6** לבדיקת Socket.io + API.
- בדיקה: 100+ משתמשים בו־זמנית ב־backgammon.

---

## 5. Checklist מהיר לפני Deploy

- [ ] `pnpm run build` עובד ללא שגיאות.
- [ ] `pnpm run typecheck` עובר ללא שגיאות.
- [ ] כל המיגרציות (001–007) רצו בהצלחה על production DB.
- [ ] `.env` מוגדר עם `DATABASE_URL`, `RNG_SECRET`, `REDIS_URL` (אם יש).
- [ ] ה־API עובד על production port (למשל 4000).
- [ ] CORS מוגדר נכון ל־production origin.
- [ ] Socket.io עובד דרך WebSocket (לא polling).
- [ ] IAP מחובר לשרתי Apple/Google (במקום stub).
- [ ] AI Guardian מוחלף בסריקת פנים אמיתית (או מושבת ב־dev).
- [ ] כל המסכים נטענים במהירות < 2 שניות.

---

## 🎯 Summary

- **Manual testing** עובד כרגע ומספיק ל־MVP.
- **Automated tests** יתווספו בעתיד לכיסוי regression.
- **Load testing** יתווסף כשיהיו משתמשים אמיתיים.

בהצלחה! 🚀
