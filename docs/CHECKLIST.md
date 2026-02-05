# ✅ Checklist — Neon Oasis

**רשימת בדיקות לפני Deploy ו-Production**

---

## 🚀 Pre-Deployment Checklist

### Backend (API)
- [ ] כל ה-migrations רצו בהצלחה
- [ ] Environment variables מוגדרים נכון (`.env`)
- [ ] Rate limiting מופעל על כל endpoints
- [ ] Input validation (Zod schemas) על כל endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Redis מוגדר (אם נדרש)
- [ ] Health check endpoint עובד (`/api/health`)
- [ ] WebSocket connections יציבות
- [ ] Error handling מלא (לא חושף מידע רגיש)

### Frontend (Web)
- [ ] Build עובר בהצלחה (`pnpm run build`)
- [ ] Type checking עובר (`pnpm run typecheck`)
- [ ] Linting עובר (`pnpm run lint`)
- [ ] כל ה-routes עובדים
- [ ] Offline mode עובד (graceful degradation)
- [ ] RTL support עובד (עברית/ערבית)
- [ ] PWA manifest תקין
- [ ] Performance (Lighthouse > 90)
- [ ] כל ה-translations קיימים (4 שפות)

### Security
- [ ] AI Guardian (age verification) עובד
- [ ] Geo-fencing מופעל (אם נדרש)
- [ ] AML monitoring פעיל
- [ ] Two-Factor Auth עובד
- [ ] Rate limiting מופעל
- [ ] HTTPS מופעל (production)
- [ ] CORS מוגדר נכון

### Testing
- [ ] E2E tests עוברים
- [ ] Unit tests עוברים
- [ ] Load testing בוצע
- [ ] Manual testing בוצע (כל ה-flows)

---

## 📱 App Store Submission Checklist

### Apple App Store
- [ ] App Store Connect account מוכן
- [ ] App icons (כל הגדלים)
- [ ] Screenshots (כל הגדלים)
- [ ] Privacy Policy מעודכן
- [ ] Terms of Service מעודכן
- [ ] Age rating נכון (17+)
- [ ] In-App Purchase מוגדר
- [ ] TestFlight build נשלח

### Google Play Store
- [ ] Google Play Console account מוכן
- [ ] App icons (כל הגדלים)
- [ ] Screenshots (כל הגדלים)
- [ ] Privacy Policy מעודכן
- [ ] Terms of Service מעודכן
- [ ] Content rating נכון
- [ ] In-App Purchase מוגדר
- [ ] Internal testing build נשלח

---

## 🛡️ Admin Checklist

### User Management
- [ ] Admin dashboard עובד
- [ ] User blocking/unblocking עובד
- [ ] User stats נכונים
- [ ] Transaction audit trail מלא

### Monitoring
- [ ] Error logging מוגדר
- [ ] Performance monitoring מוגדר
- [ ] Analytics מוגדר
- [ ] Alerts מוגדרים (errors, downtime)

---

## 🎯 Launch Day Checklist

- [ ] כל ה-servers up ו-running
- [ ] Database backups מוגדרים
- [ ] CDN מוגדר (אם נדרש)
- [ ] Monitoring tools פעילים
- [ ] Support channels מוכנים
- [ ] Marketing materials מוכנים
- [ ] Social media posts מוכנים

---

**גרסה:** 2.0 | **תאריך:** פברואר 2026
