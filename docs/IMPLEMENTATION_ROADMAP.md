# 🗺️ Implementation Roadmap — Neon Oasis

**תוכנית יישום מפורטת לפרויקט**

---

## 📊 סטטוס נוכחי

| קטגוריה | השלמה |
|---------|--------|
| **Overall** | 85% |
| Frontend Core | 90% |
| Backend Core | 85% |
| 3D Games | 70% |
| AI Guardian | 60% |
| Design System | 80% |
| Monetization | 75% |
| Compliance | 70% |

**זמן ל-App Store:** 4-8 שבועות

---

## 🎯 מה צריך ליישום

### 1. Audio Enhancements (עדיפות גבוהה)

#### 3D Spatial Audio
- **יישום:** Web Audio API PannerNode
- **מיקום:** `apps/web/src/shared/audio/premiumSoundService.ts`
- **זמן:** 1-2 ימים

#### Audio Ducking
- **יישום:** הפחתת volume של BGM בעת השמעת win sounds
- **מיקום:** `apps/web/src/shared/audio/premiumSoundService.ts`
- **זמן:** 1 יום

#### Adaptive Music (Vaporwave Radio)
- **יישום:** ערוצים/שכבות (לופ רקע + שכבת מתח)
- **מיקום:** `apps/web/src/shared/audio/premiumSoundService.ts`
- **זמן:** 2-3 ימים

#### קבצי אודיו מקצועיים
- **דרישה:** 28 קבצי MP3 (10 effects + 16 voice narration)
- **מיקום:** `apps/web/public/sounds/`
- **זמן:** 1-3 ימים (תלוי באיכות)

---

### 2. AI Guardian (עדיפות קריטית)

#### Face API Integration
- **יישום:** Mediapipe / AWS Rekognition
- **מיקום:** `apps/api/src/services/amlService.ts`
- **זמן:** 2-3 ימים

#### Geo-fencing
- **יישום:** IP detection + country blocking
- **מיקום:** `apps/api/src/middleware/geoMiddleware.ts`
- **זמן:** 1 יום

---

### 3. Performance & Scaling

#### Redis Setup
- **יישום:** Socket.io scaling עם Redis adapter
- **מיקום:** `apps/api/src/index.ts`
- **זמן:** 2-3 שעות

#### Load Testing
- **יישום:** Artillery או k6
- **מיקום:** `load-test.yml`, `load-test-websocket.yml`
- **זמן:** 1 יום

#### Rate Limiting
- **יישום:** Express-rate-limit על כל endpoints
- **מיקום:** `apps/api/src/middleware/rateLimit.ts`
- **זמן:** 1 יום

---

### 4. Security Hardening

#### Input Validation
- **יישום:** Zod schemas לכל endpoints
- **מיקום:** `apps/api/src/controllers/`
- **זמן:** 1-2 ימים

#### SQL Injection Prevention
- **יישום:** Parameterized queries בלבד
- **מיקום:** כל ה-SQL queries
- **זמן:** 1 יום

---

### 5. Testing & QA

#### E2E Tests
- **יישום:** Playwright
- **מיקום:** `tests/e2e/`
- **זמן:** 2-3 ימים

#### Unit Tests
- **יישום:** Vitest
- **מיקום:** `tests/unit/`
- **זמן:** 2-3 ימים

---

## 📅 Timeline

### שבוע 1-2: Audio & Performance
- [ ] 3D Spatial Audio
- [ ] Audio Ducking
- [ ] Adaptive Music
- [ ] Redis Setup
- [ ] Load Testing

### שבוע 3-4: Security & AI
- [ ] AI Guardian (Face API)
- [ ] Geo-fencing
- [ ] Rate Limiting
- [ ] Input Validation

### שבוע 5-6: Testing & Polish
- [ ] E2E Tests
- [ ] Unit Tests
- [ ] Performance Optimization
- [ ] Design Polish

### שבוע 7-8: App Store Prep
- [ ] App Store Submission
- [ ] Marketing Materials
- [ ] Launch Checklist

---

## 🔗 קישורים רלוונטיים

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — סטטוס מפורט של מה שנבנה
- **[docs/AUDIO_SPEC.md](./docs/AUDIO_SPEC.md)** — מפרט טכני לאודיו
- **[docs/PRD_MASTER_2026.md](./docs/PRD_MASTER_2026.md)** — תנ"ך הפרויקט

---

**גרסה:** 2.0 | **תאריך:** פברואר 2026
