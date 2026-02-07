# 📋 רשימת משימות לפיתוח — סטטוס נוכחי

עדכון אחרון: בהתאם לבדיקת הקודבס.

---

## 🛡️ שלב 1: תשתית ונתונים (Backend & DB)

| משימה | סטטוס | הערות |
|--------|--------|--------|
| **הגדרת Prisma Schema** (User, Transaction, ItemInventory, AdminRevenue) | ✅ הושלם | `apps/api/prisma/schema.prisma` — כל המודלים קיימים. גם מיגרציות SQL (כולל `prize_balance`, `transaction.status`, `gift_sent`/`gift_received`). |
| **ניהול מאזנים** — API להפרדת balance מ-prizeBalance | ✅ הושלם | `getProfile` מחזיר `balance`, `prize_balance`, `oasis_balance`. `getBalance` ל-balance בלבד. |
| **מערכת טרנזקציות** — הורדת הימור בתחילת משחק, חלוקת פרס בסוף | ✅ הושלם | `gameService`: `placeBet` (bet), `processGameWin` (win + rake), `endP2PMatch`. Socket: `PLACE_BET`, `GAME_FINISHED`. |
| **Socket.io Rooms** — שחקנים שולחים מהלכים, צופים מקבלים Real-time | ✅ הושלם | `roomHandlers`: ROOM_JOIN, ROOM_LEAVE, ROOM_ACTION, ROOM_CONFIRM. `gameHandler`: JOIN_TABLE, PLACE_BET, GAME_FINISHED. Backgammon מחובר ל-`socketService`. |

---

## 📱 שלב 2: ממשק משתמש ופיד (Frontend & Feed)

| משימה | סטטוס | הערות |
|--------|--------|--------|
| **פיתוח ה-TikTok Feed** — Scroll Snapping אנכי | ✅ הושלם | `LiveMatchFeed.tsx` + `VegasFeed.tsx`: `scrollSnapType: 'y mandatory'`, מעבר בין חדרים. |
| **מנגנון הצטרפות צופה** — כניסת חדר למסך → חיבור ל-Socket של החדר | ⬜ חסר | הפיד לא מזהה "חדר נכנס ל-viewport" ולא קורא ל-`socket.join(roomId)` / `joinTable`. רק במסך משחק (למשל Backgammon) יש JOIN_TABLE. |
| **ריבועי השחקנים** — Video/Avatar Frames + הילה לשחקן הפעיל | ✅ הושלם | `PlayerVideoFrame` ב-`LiveMatchRoom.tsx`: `isActive`, `winRate`, `streak`, Glow. |
| **Lobby View** — בחירת Stakes וחיפוש יריב (Matchmaking) | ✅ הושלם | `LobbyView.tsx`: STAKE_OPTIONS (10,50,100,500), בדיקת יתרה, חיפוש (Mock 5 שניות) וניווט למשחק. |

---

## 💰 שלב 3: כלכלה ומוניטיזציה (Gifting & Wallet)

| משימה | סטטוס | הערות |
|--------|--------|--------|
| **חנות מתנות** — פאנל מתנות בלייב + חיבור לטרנזקציות בשרת | 🟡 חלקי | **פרונט:** `LiveSidebar` + `GIFT_TYPES`, `sendGift`, `registerGiftHandler` — משחקים (סנוקר וכו') רושמים handler ומפחיתים מטבעות מקומית. **באקאנד:** אין עדיין API/אירוע Socket שמוסיף טרנזקציות `gift_sent`/`gift_received` ומעדכן `prize_balance` (70% שחקן / 30% פלטפורמה). |
| **מסך ארנק (Wallet)** — עיצוב יוקרתי + היסטוריית פעולות | ✅ הושלם | `NeonWallet.tsx`: כרטיס Prize Balance, Balance, כפתורי CASH OUT / ADD FUNDS, רשימת טרנזקציות מ-`/api/users/:id/wallet/transactions`, Trust (SSL). |
| **מערכת Cash Out** — טופס בקשת פדיון + ולידציה | ✅ הושלם | `NeonWallet` + מינימום 100 מטבעות, טקסט תקנון. על לחיצה — alert (בעתיד: שליחה ל-API פדיון). |

---

## ✨ שלב 4: ליטוש וחוויית משתמש (10/10 Polish)

| משימה | סטטוס | הערות |
|--------|--------|--------|
| **Welcome Onboarding** — מסך כניסה מונפש + הסבר מודל Skill | ✅ הושלם | `WelcomeOnboarding.tsx`: 3 עמודות, "מתחילים להרוויח", Certified Skill-Based, `OnboardingGate` ב-`App.tsx`. |
| **אפקטים ויזואליים** — Particles / אנימציות מתנות וניצחון (Framer Motion) | 🟡 חלקי | **Framer Motion:** בשימוש נרחב (Feed, Onboarding, Lobby, PlayerVideoFrame). **Particles / Lottie:** לא הוטמעו לשליחת מתנה גדולה (למשל "מקל דרקון בלהבות"). |
| **Haptic Feedback** — רטט בלחיצות (מובייל) | ✅ הושלם | `hapticClick()` ב-`useHaptic` — בשימוש ב-Onboarding, Lobby, פרופיל, Backgammon. |
| **Dark Mode Premium** — צבעי נאון יוקרתיים | ✅ הושלם | `theme.ts`: Dark, `ELECTRIC_BLUE`, `CYBER_PINK`, Orbitron/Heebo, `--neon-glow`. |

---

## 🎯 סיכום וצעדים מומלצים

| עדיפות | מה לעשות |
|--------|-----------|
| **גבוהה** | **מנגנון צופה בפיד:** כשחדר נכנס ל-viewport בפיד (`LiveMatchFeed`), לחבר את ה-Socket ל-roomId/tableId של החדר (pre-fetch או join) כדי שהמשתמש יראה עדכונים בזמן אמת. |
| **גבוהה** | **מתנות בשרת:** ליצור endpoint או אירוע Socket (למשל `SEND_GIFT`) שמעדכן balance/prize_balance ורושם טרנזקציות `gift_sent` / `gift_received` עם חלוקה 70/30. |
| **בינונית** | **אפקט מתנה:** להוסיף אנימציית Particles או Lottie כשנשלחת מתנה יקרה (למשל מקל דרקון). |
| **נמוכה** | **פדיון אמיתי:** לחבר כפתור Cash Out ל-API בקשת פדיון (ולידציה, סטטוס PENDING, אדמין). |

---

## 💡 טיפ למתכנת

> "הדגש בפרויקט הזה הוא על שיהוי (Latency) נמוך. כל פעולה של המשתמש – מהזזת כלי בששבש ועד שליחת מתנה – חייבת להשתקף אצל הצופים בתוך פחות מ-100 מילי-שנייה כדי ליצור חוויית 'לייב' אמיתית."

**רלוונטי לקוד:**  
- מהלכי ששבש: נשלחים דרך `socketService.sendMove` → `ROOM_ACTION` → `io.to(roomId).emit(ROOM_CONFIRM)` — כל המנויים בחדר מקבלים עדכון.  
- מתנות: כרגע רק מקומיות (handler במשחק); כדי שישתקפו לכל הצופים ב-&lt;100ms יש לשלוח אותן דרך Socket ולעדכן מאזנים בשרת.
