# העלאת הפרויקט (Deploy) — Neon Oasis

הוראות להעלאת הפרויקט לסביבת production.

---

## 1. מה צריך להעלות

| רכיב | תיאור | איפה להעלות |
|------|--------|-------------|
| **Web** (Frontend) | Vite + React | Vercel / Netlify / Cloudflare Pages |
| **API** (Backend) | Node.js + Fastify + Socket.io | Render / Railway / Fly.io |
| **DB** | PostgreSQL | Neon / Supabase / Railway |
| **Redis** (אופציונלי) | לסנכרון/דירוג | Upstash / Railway |

---

## 2. מסד נתונים (PostgreSQL)

1. צור DB ב־[Neon](https://neon.tech) או [Supabase](https://supabase.com).
2. העתק את ה־connection string (למשל `postgresql://user:pass@host/db?sslmode=require`).
3. הרץ סכמה ומיגרציות:
   ```bash
   psql "YOUR_DATABASE_URL" -f apps/api/src/db/schema.sql
   psql "YOUR_DATABASE_URL" -f apps/api/src/db/migrations/001_coupons_referrals.sql
   psql "YOUR_DATABASE_URL" -f apps/api/src/db/migrations/002_affiliate_commission_ai_alerts.sql
   psql "YOUR_DATABASE_URL" -f apps/api/src/db/migrations/003_admin_blocks_audit.sql
   ```
4. להפוך משתמש למנהל: `UPDATE users SET is_admin = true WHERE username = 'your_username';`

---

## 3. API (Backend)

**דוגמה: Render.com**

1. צור **Web Service** חדש, חבר ל־repo של הפרויקט.
2. **Root Directory:** `apps/api`
3. **Build Command:** `pnpm install && pnpm run build` (או מהשורש: `cd ../.. && pnpm install && pnpm run build -C apps/api`)
4. **Start Command:** `pnpm start` (מריץ `node dist/index.js`)
5. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=4000` (או מה ש־Render נותן)
   - `DATABASE_URL=` (מהשלב 2)
   - `CORS_ORIGIN=` כתובת ה־Web אחרי העלאה (למשל `https://your-app.vercel.app`)
   - `ADMIN_SECRET=` (אופציונלי — סוד לאבטחת Admin API)
6. אחרי ה־deploy העתק את כתובת ה־API (למשל `https://your-api.onrender.com`).

**הערה:** ב־monorepo ייתכן שצריך Build מהשורש ו־Start מתוך `apps/api`. ב־Render אפשר להגדיר:
- Build: `pnpm install && pnpm run build -C apps/api`
- Start: `node apps/api/dist/index.js` (אם ה-build רץ מהשורש).

---

## 4. Web (Frontend)

**דוגמה: Vercel**

1. חבר את ה־repo ל־Vercel.
2. **Root Directory:** ריק (שורש הפרויקט) — כדי ש־pnpm install יראה את ה־workspaces.
3. **Build Command:** `pnpm run build:web`
4. **Output Directory:** `apps/web/dist`
5. **Framework Preset:** Vite (או Other)
6. **Environment Variables:**
   - `VITE_API_URL=` כתובת ה־API (למשל `https://your-api.onrender.com`)
   - `VITE_WS_URL=` אותה כתובת (למשל `https://your-api.onrender.com` — Socket.io על אותו host)
7. Deploy. Vercel יתן לך כתובת כמו `https://your-app.vercel.app`.

**חשוב:** עדכן ב־API את `CORS_ORIGIN` לכתובת ה־Web הסופית.

---

## 5. סיכום צעדים

1. **DB** — צור PostgreSQL, הרץ schema + migrations, הגדר מנהל.
2. **API** — העלה ל־Render/Railway/Fly.io עם `DATABASE_URL` ו־`CORS_ORIGIN` (כתובת ה־Web).
3. **Web** — העלה ל־Vercel/Netlify עם `VITE_API_URL` ו־`VITE_WS_URL` (כתובת ה־API).
4. בדפדפן: גלוש לכתובת ה־Web, אשר תקנון, היכנס, ובדוק פיד/חנות/שש-בש/Admin.

---

## 6. הרצה מקומית לפני העלאה

```bash
pnpm install
cp .env.example .env
# ערוך .env עם DATABASE_URL וכו'
pnpm run build
pnpm run dev:api   # טרמינל 1
pnpm run dev:web  # טרמינל 2
```

אפליקציה: `http://localhost:5273`, API: `http://localhost:4000`.
