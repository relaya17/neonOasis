# 🔍 Missing Functionality Report

**תאריך:** פברואר 2026  
**סטטוס:** לאחר תיקון שגיאות Build

---

## ✅ מה תוקן

1. ✅ **Rollup dependency** — התקנת `@rollup/rollup-win32-x64-msvc`
2. ✅ **tsup & picomatch** — עדכון dependencies
3. ✅ **TypeScript types** — תיקון `packages/shared/tsconfig.json`
4. ✅ **Prisma** — התקנת `@prisma/fetch-engine`
5. ✅ **esbuild external** — הוספת `notepack.io`, `ws` ל-external
6. ✅ **AML Service exports** — הוספת `checkAndFlagSuspiciousPair` ו-`getFlaggedSessions`
7. ✅ **DB export** — הוספת `export const db = pool`
8. ✅ **PWA plugin** — השבתה זמנית עקב בעיית workbox-build

---

## ⚠️ קבצים עם Stubs / Placeholders

### 🔴 קריטי (Critical)

#### 1. `apps/web/src/features/auth/AgeVerification.tsx`
- **בעיה:** Placeholder — כפתור "Verify 18+" לא מחובר ל-Face API
- **דרישה:** אינטגרציה עם Face API / Mediapipe
- **סטטוס:** Stub — תמיד עובר

#### 2. `apps/web/src/features/auth/QuickOnboarding.tsx`
- **בעיה:** `TODO: Real Face API integration here` — stub תמיד עובר
- **דרישה:** אינטגרציה אמיתית עם Face API
- **סטטוס:** Stub — תמיד עובר

#### 3. `apps/api/src/services/geoService.ts`
- **בעיה:** Geo-fencing stub — מחזיר country code קבוע
- **דרישה:** אינטגרציה עם MaxMind GeoIP או שירות דומה
- **סטטוס:** Stub — מחזיר US או GEO_STUB_COUNTRY

#### 4. `apps/api/src/controllers/geoController.ts`
- **בעיה:** Geo stub — לא ממשי
- **דרישה:** IP → country detection אמיתי
- **סטטוס:** Stub

---

### 🟡 High Priority

#### 5. `apps/web/src/shared/audio/soundService.ts`
- **בעיה:** Stub functions — `preloadSounds()` ו-`playSound()` לא עושים כלום
- **דרישה:** שימוש ב-`premiumSoundService` במקום
- **סטטוס:** Stub — יש `premiumSoundService.ts` מלא, צריך לעדכן exports

#### 6. `apps/api/src/controllers/iapController.ts`
- **בעיה:** Stub — לא מבצע receipt validation אמיתי
- **דרישה:** אינטגרציה עם Apple/Google IAP validation
- **סטטוס:** Stub — מקבל transactionId אבל לא מאמת

#### 7. `apps/api/src/modules/ai/index.ts`
- **בעיה:** Placeholder — AI Guardian לא מיושם
- **דרישה:** אינטגרציה עם Face API / Mediapipe
- **סטטוס:** Placeholder

---

### 🟢 Medium Priority

#### 8. `apps/web/src/features/game/ProvablyFairDialog.tsx`
- **בעיה:** Placeholder — אימות seed ידני (stub)
- **דרישה:** אימות אמיתי של Server Seed + Client Seed
- **סטטוס:** UI קיים, לוגיקה stub

#### 9. `apps/web/src/features/game/TournamentBrackets.tsx`
- **בעיה:** Stub — מציג מבנה בראקט בסיסי
- **דרישה:** אינטגרציה מלאה עם Tournament Service
- **סטטוס:** UI בסיסי, לא מחובר ל-backend

#### 10. `apps/api/src/modules/room/roomService.ts`
- **בעיה:** `TODO: validate & apply move` — לא מאמת מהלכים
- **דרישה:** ולידציה מלאה של מהלכי משחק
- **סטטוס:** מקבל מהלכים אבל לא מאמת

---

## 📋 רשימת פעולות לתיקון

### עדיפות גבוהה (לפני Production)

1. **Face API Integration**
   - קובץ: `apps/web/src/features/auth/AgeVerification.tsx`
   - קובץ: `apps/web/src/features/auth/QuickOnboarding.tsx`
   - פעולה: התקנת `face-api.js` או `@mediapipe/face_detection` + אינטגרציה

2. **Geo-fencing אמיתי**
   - קובץ: `apps/api/src/services/geoService.ts`
   - פעולה: התקנת `maxmind` או שימוש ב-GeoIP service

3. **IAP Validation**
   - קובץ: `apps/api/src/controllers/iapController.ts`
   - פעולה: אינטגרציה עם Apple/Google receipt validation APIs

4. **Sound Service Update**
   - קובץ: `apps/web/src/shared/audio/index.ts`
   - פעולה: עדכון exports להשתמש ב-`premiumSoundService` במקום `soundService`

### עדיפות בינונית

5. **Provably Fair Validation**
   - קובץ: `apps/web/src/features/game/ProvablyFairDialog.tsx`
   - פעולה: יישום לוגיקת אימות seed אמיתית

6. **Tournament Integration**
   - קובץ: `apps/web/src/features/game/TournamentBrackets.tsx`
   - פעולה: חיבור ל-Tournament Service

7. **Move Validation**
   - קובץ: `apps/api/src/modules/room/roomService.ts`
   - פעולה: יישום ולידציה מלאה של מהלכים

---

## 🎯 סיכום

**Build Status:**
- ✅ Shared package — בונה בהצלחה
- ✅ API — בונה בהצלחה
- ⚠️ Web — בונה (PWA מושבת זמנית)

**Missing Functionality:**
- 🔴 **4 קבצים קריטיים** עם stubs (Face API, Geo-fencing)
- 🟡 **3 קבצים** עם stubs חשובים (Sound, IAP, AI)
- 🟢 **3 קבצים** עם stubs בינוניים (Provably Fair, Tournament, Move validation)

**המלצה:** להתחיל עם Face API ו-Geo-fencing לפני Production.

---

**גרסה:** 1.0 | **תאריך:** פברואר 2026
