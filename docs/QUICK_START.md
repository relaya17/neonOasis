# ⚡ Quick Start Guide — Neon Oasis

**הפעלת הפרויקט תוך 5 דקות**

---

## 🚀 התקנה והפעלה

### אופציה 1: PowerShell רגיל (מומלץ)

```powershell
# 1. נווט לפרויקט
cd "C:\Users\arlet\git\neonOasis"

# 2. התקן dependencies
pnpm install

# 3. הגדר סביבה
cp .env.example .env
# ערוך .env: DATABASE_URL, RNG_SECRET, REDIS_URL (אופציונלי)

# 4. הפעל את השרתים
pnpm run dev
```

**פתח:** http://localhost:5273 🎰

---

### אופציה 2: סקריפט אוטומטי

```powershell
# הרץ את סקריפט ההתקנה המלאה
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-production.ps1

# או הפעלה מהירה (install + build + dev)
.\run-dev.ps1
```

---

## 📋 דרישות

- **Node.js** 20+
- **PostgreSQL** (עם `DATABASE_URL` ב-`.env`)
- **אופציונלי:** Redis (ל-Socket.io scale עם `REDIS_URL`)

---

## 🗄️ הגדרת בסיס נתונים

```bash
# הפעל migrations
pnpm run db:run-sql

# או ידנית:
cd apps/api
pnpm run db:run-sql
```

---

## 🏗️ Build

```bash
# Build הכל
pnpm run build

# Build רק Web
cd apps/web
pnpm run build

# Build רק API
cd apps/api
pnpm run build
```

---

## 🧪 בדיקות

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Tests (אם יש)
pnpm test
```

---

## 📚 מסמכים נוספים

- **[README.md](./README.md)** — סקירה כללית של הפרויקט
- **[docs/PRD_MASTER_2026.md](./docs/PRD_MASTER_2026.md)** — תנ"ך הפרויקט המלא
- **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** — מדריך מפורט למפתחים

---

**גרסה:** 2.0 | **תאריך:** פברואר 2026
